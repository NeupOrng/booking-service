"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const common_1 = require("@nestjs/common");
function parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}
function formatTime(minutes) {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}
let AvailabilityService = class AvailabilityService {
    computeSlots(rules, blocks, bookedCounts) {
        let slots = this.generateSlots(rules);
        slots = this.subtractBlocks(slots, blocks);
        slots = this.applyBookings(slots, bookedCounts);
        return slots;
    }
    generateSlots(rules) {
        var _a, _b;
        const capacityMap = new Map();
        for (const rule of rules) {
            if (!rule.isActive)
                continue;
            const start = parseTime(rule.startTime);
            const end = parseTime(rule.endTime);
            const step = rule.slotDurationMinutes;
            const cap = (_a = rule.capacity) !== null && _a !== void 0 ? _a : 1;
            for (let t = start; t < end; t += step) {
                const time = formatTime(t);
                capacityMap.set(time, Math.max((_b = capacityMap.get(time)) !== null && _b !== void 0 ? _b : 0, cap));
            }
        }
        const slots = Array.from(capacityMap.entries())
            .map(([time, capacity]) => ({ time, capacity, bookedCount: 0, remainingCapacity: capacity }))
            .sort((a, b) => a.time.localeCompare(b.time));
        return slots;
    }
    subtractBlocks(slots, blocks) {
        let result = [...slots];
        for (const block of blocks) {
            if (!block.startTime || !block.endTime) {
                result = [];
            }
            else {
                const blockStart = parseTime(block.startTime);
                const blockEnd = parseTime(block.endTime);
                result = result.filter((s) => {
                    const t = parseTime(s.time);
                    return t < blockStart || t >= blockEnd;
                });
            }
        }
        return result;
    }
    applyBookings(slots, bookedCounts) {
        const countMap = new Map();
        for (const b of bookedCounts) {
            countMap.set(b.bookingTime.substring(0, 5), b.count);
        }
        return slots.map((s) => {
            var _a;
            const booked = (_a = countMap.get(s.time)) !== null && _a !== void 0 ? _a : 0;
            return Object.assign(Object.assign({}, s), { bookedCount: booked, remainingCapacity: Math.max(0, s.remainingCapacity - booked) });
        });
    }
};
AvailabilityService = __decorate([
    (0, common_1.Injectable)()
], AvailabilityService);
exports.AvailabilityService = AvailabilityService;
//# sourceMappingURL=availability.service.js.map