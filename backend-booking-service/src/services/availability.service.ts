import { Injectable } from '@nestjs/common';
import { SelectAvailabilityBlock, SelectAvailabilityRule } from '../database/schema';

export interface SlotResult {
  time: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

@Injectable()
export class AvailabilityService {
  /**
   * Returns raw slot grid WITHOUT Redis lock deduction.
   * ServicesService applies lock counts on top and sets `available`.
   */
  computeSlots(
    rules: SelectAvailabilityRule[],
    blocks: SelectAvailabilityBlock[],
    bookedCounts: { bookingTime: string; count: number }[],
  ): SlotResult[] {
    let slots = this.generateSlots(rules);
    slots = this.subtractBlocks(slots, blocks);
    slots = this.applyBookings(slots, bookedCounts);
    return slots;
  }

  /**
   * Builds time slots from active rules.
   * When multiple rules cover the same time, capacity = MAX across all matching rules.
   */
  private generateSlots(rules: SelectAvailabilityRule[]): SlotResult[] {
    // time → max capacity across overlapping active rules
    const capacityMap = new Map<string, number>();

    for (const rule of rules) {
      if (!rule.isActive) continue;

      const start = parseTime(rule.startTime);
      const end   = parseTime(rule.endTime);
      const step  = rule.slotDurationMinutes;
      const cap   = rule.capacity ?? 1;

      for (let t = start; t < end; t += step) {
        const time = formatTime(t);
        capacityMap.set(time, Math.max(capacityMap.get(time) ?? 0, cap));
      }
    }

    const slots: SlotResult[] = Array.from(capacityMap.entries())
      .map(([time, capacity]) => ({ time, capacity, bookedCount: 0, remainingCapacity: capacity }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return slots;
  }

  /**
   * Removes slots that fall inside a block window.
   * Whole-day block (no startTime/endTime) → clears all slots.
   */
  private subtractBlocks(slots: SlotResult[], blocks: SelectAvailabilityBlock[]): SlotResult[] {
    let result = [...slots];

    for (const block of blocks) {
      if (!block.startTime || !block.endTime) {
        result = [];
      } else {
        const blockStart = parseTime(block.startTime);
        const blockEnd   = parseTime(block.endTime);
        result = result.filter((s) => {
          const t = parseTime(s.time);
          return t < blockStart || t >= blockEnd;
        });
      }
    }

    return result;
  }

  /**
   * Applies confirmed/pending booking counts.
   * Slot stays in the list (renders greyed-out if fully booked);
   * `remainingCapacity` is reduced by the booked count.
   */
  private applyBookings(
    slots: SlotResult[],
    bookedCounts: { bookingTime: string; count: number }[],
  ): SlotResult[] {
    const countMap = new Map<string, number>();
    for (const b of bookedCounts) {
      countMap.set(b.bookingTime.substring(0, 5), b.count);
    }

    return slots.map((s) => {
      const booked = countMap.get(s.time) ?? 0;
      return {
        ...s,
        bookedCount:       booked,
        remainingCapacity: Math.max(0, s.remainingCapacity - booked),
      };
    });
  }
}
