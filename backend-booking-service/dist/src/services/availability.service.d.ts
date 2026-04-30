import { SelectAvailabilityBlock, SelectAvailabilityRule } from '../database/schema';
export interface SlotResult {
    time: string;
    capacity: number;
    bookedCount: number;
    remainingCapacity: number;
}
export declare class AvailabilityService {
    computeSlots(rules: SelectAvailabilityRule[], blocks: SelectAvailabilityBlock[], bookedCounts: {
        bookingTime: string;
        count: number;
    }[]): SlotResult[];
    private generateSlots;
    private subtractBlocks;
    private applyBookings;
}
