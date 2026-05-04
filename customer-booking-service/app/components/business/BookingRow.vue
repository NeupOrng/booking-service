<script setup lang="ts">
import {
    Loader2,
    Mail,
    Phone,
    Clock,
    CalendarDays,
    Copy,
    Check,
    CheckCheck,
    MessageSquare,
    User,
    Hash,
} from 'lucide-vue-next';
import type { Booking } from '~/models';

const props = defineProps<{
    booking: Booking;
    isLoading?: boolean;
    expandedCancelId: string | null;
}>();

const emit = defineEmits<{
    confirm: [id: string];
    complete: [id: string];
    cancel: [id: string, reason: string];
    toggleCancel: [id: string];
}>();

const { formatCurrency, formatBookingDate, formatBookingTime, formatRelativeTime } =
    useFormatters();

const cancelReason = ref('');
const isCancelOpen = computed(
    () => props.expandedCancelId === props.booking.id,
);

const statusConfig: Record<string, { label: string; cls: string }> = {
    pending: {
        label: 'Pending',
        cls: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    confirmed: {
        label: 'Confirmed',
        cls: 'bg-primary/10 text-primary border-primary/20',
    },
    completed: {
        label: 'Completed',
        cls: 'bg-green-100 text-green-800 border-green-200',
    },
    cancelled: {
        label: 'Cancelled',
        cls: 'bg-muted text-muted-foreground border-border',
    },
};

// ── Customer info (dummy phone — replace when backend exposes it) ────────────
const customerInitials = computed(() => {
    const name: string = props.booking.customer?.fullName ?? props.booking.userId ?? ''
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
})
const customerPhone = '+1 (555) 000-0000' // TODO: replace with real phone from booking response

// ── Relative booked-at time ───────────────────────────────────────────────────
const bookedAgo = computed(() =>
    props.booking.createdAt ? formatRelativeTime(props.booking.createdAt) : '',
)

// ── Email copy ────────────────────────────────────────────────────────────────
const copied = ref(false)
async function copyEmail() {
    await navigator.clipboard.writeText(props.booking.customer?.email ?? '')
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
}
</script>

<template>
    <div>
        <!-- Card -->
        <div
            class="bg-card border border-border rounded-2xl overflow-hidden listeo-shadow"
        >
            <!-- ── Zone 1: customer identity + status pill only ── -->
            <div
                class="px-5 pt-5 pb-4 flex items-start justify-between gap-4"
            >
                <!-- Customer info -->
                <div class="flex items-start gap-3 flex-1 min-w-0">
                    <Dialog>
                        <DialogTrigger>
                            <div
                                class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0"
                            >
                                {{ customerInitials }}
                            </div>
                        </DialogTrigger>
                        <!-- Customer profile dialog — unchanged -->
                        <DialogContent class="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Customer profile</DialogTitle>
                                <DialogDescription>Details for this booking's customer</DialogDescription>
                            </DialogHeader>

                            <!-- Avatar + name -->
                            <div class="flex items-center gap-4 py-2">
                                <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
                                    {{ customerInitials }}
                                </div>
                                <div>
                                    <p class="font-semibold text-base text-foreground">{{ booking.customer?.fullName ?? '—' }}</p>
                                    <p class="text-xs text-muted-foreground mt-0.5 font-mono">ID: {{ booking.userId?.slice(0, 12) }}…</p>
                                </div>
                            </div>

                            <Separator />

                            <!-- Contact info -->
                            <div class="space-y-3 py-1">
                                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>

                                <!-- Email row -->
                                <div class="flex items-center justify-between gap-3">
                                    <div class="flex items-center gap-2 min-w-0">
                                        <Mail class="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span class="text-sm truncate">{{ booking.customer?.email ?? '—' }}</span>
                                    </div>
                                    <button
                                        @click="copyEmail"
                                        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
                                        :title="copied ? 'Copied!' : 'Copy email'"
                                    >
                                        <Check v-if="copied" class="w-3.5 h-3.5 text-green-500" />
                                        <Copy v-else class="w-3.5 h-3.5" />
                                        <span>{{ copied ? 'Copied' : 'Copy' }}</span>
                                    </button>
                                </div>

                                <!-- Phone row -->
                                <div class="flex items-center gap-2">
                                    <Phone class="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span class="text-sm text-muted-foreground italic">{{ customerPhone }} (dummy)</span>
                                </div>

                                <!-- User ID row -->
                                <div class="flex items-center gap-2">
                                    <Hash class="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span class="text-xs font-mono text-muted-foreground">{{ booking.userId }}</span>
                                </div>
                            </div>

                            <Separator />

                            <!-- Current booking summary -->
                            <div class="space-y-3 py-1">
                                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This booking</p>

                                <div class="bg-muted/40 rounded-xl p-4 space-y-2.5 text-sm">
                                    <div class="flex justify-between items-start">
                                        <span class="text-muted-foreground text-xs">Service</span>
                                        <span class="font-medium text-right">{{ booking.service?.name ?? booking.serviceId?.slice(0, 8) }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-muted-foreground text-xs">Date</span>
                                        <span class="font-medium">{{ formatBookingDate(booking.date) }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-muted-foreground text-xs">Time</span>
                                        <span class="font-medium">{{ formatBookingTime(booking.time) }} · {{ booking.durationMinutes }} min</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-muted-foreground text-xs">Amount</span>
                                        <span class="font-semibold text-primary">{{ formatCurrency(booking.price) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-muted-foreground text-xs">Reference</span>
                                        <span class="font-mono text-xs font-semibold">{{ booking.reference }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-muted-foreground text-xs">Status</span>
                                        <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full border', statusConfig[booking.status]?.cls ?? '']">
                                            {{ statusConfig[booking.status]?.label ?? booking.status }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Customer notes -->
                                <div v-if="booking.notesFromCustomer" class="bg-muted/30 rounded-xl px-4 py-3">
                                    <p class="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <User class="w-3 h-3" /> Customer note
                                    </p>
                                    <p class="text-sm italic text-foreground/80">"{{ booking.notesFromCustomer }}"</p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div class="min-w-0">
                        <p class="font-semibold text-sm text-foreground">
                            {{ booking.customer.fullName }}
                        </p>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span class="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail class="w-3 h-3 shrink-0" />
                                {{ booking.customer.email }}
                            </span>
                            <span class="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone class="w-3 h-3 shrink-0" />
                                {{ customerPhone }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Status pill — no buttons, no spinner -->
                <div class="shrink-0 flex items-center">
                    <span
                        :class="[
                            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize',
                            statusConfig[booking.status]?.cls ?? '',
                        ]"
                    >
                        <span class="w-1.5 h-1.5 rounded-full bg-current" />
                        {{ statusConfig[booking.status]?.label ?? booking.status }}
                    </span>
                </div>
            </div>

            <!-- ── Zone 2: booking detail grid ── -->
            <div class="h-px bg-border mx-5" />

            <div class="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                    <p class="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <CalendarDays class="w-3 h-3" /> Date &amp; time
                    </p>
                    <p class="font-medium text-xs">
                        {{ formatBookingDate(booking.date) }}
                    </p>
                    <p class="text-muted-foreground text-xs">
                        {{ formatBookingTime(booking.time) }}
                    </p>
                </div>

                <div>
                    <p class="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Clock class="w-3 h-3" /> Duration
                    </p>
                    <p class="font-medium">{{ booking.durationMinutes }} min</p>
                </div>

                <div>
                    <p class="text-xs text-muted-foreground mb-1">Service</p>
                    <p class="font-medium truncate">
                        {{ booking.service?.name ?? booking.serviceId?.slice(0, 8) }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                        {{ formatCurrency(booking.price) }}
                    </p>
                </div>

                <div>
                    <p class="text-xs text-muted-foreground mb-1">Reference</p>
                    <p class="font-mono text-xs font-semibold text-foreground">
                        {{ booking.reference }}
                    </p>
                    <p class="text-xs text-muted-foreground mt-0.5">
                        ID: {{ booking.userId?.slice(0, 8) }}
                    </p>
                </div>
            </div>

            <!-- ── Zone 3: action footer ── -->
            <div
                class="bg-muted/40 border-t border-border px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
                <!-- Left: booked-at meta -->
                <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageSquare class="w-3 h-3 shrink-0" />
                    Booked {{ bookedAgo }}
                </span>

                <!-- Right: actions — loading replaces buttons, status pill stays untouched -->
                <div class="flex items-center gap-2 justify-end">
                    <template v-if="isLoading">
                        <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Loader2 class="w-3.5 h-3.5 animate-spin" />
                            Updating…
                        </span>
                    </template>

                    <template v-else-if="booking.status === 'pending'">
                        <Button
                            size="sm"
                            variant="outline"
                            class="h-8 px-3 text-xs text-destructive border-destructive"
                            @click="emit('toggleCancel', booking.id)"
                        >Decline</Button>
                        <Button
                            size="sm"
                            class="h-8 px-3 text-xs gap-1.5"
                            @click="emit('confirm', booking.id)"
                        >
                            <Check class="w-3.5 h-3.5" /> Confirm booking
                        </Button>
                    </template>

                    <template v-else-if="booking.status === 'confirmed'">
                        <Button
                            size="sm"
                            variant="outline"
                            class="h-8 px-3 text-xs text-destructive border-destructive"
                            @click="emit('toggleCancel', booking.id)"
                        >Cancel</Button>
                        <Button
                            size="sm"
                            variant="outline"
                            class="h-8 px-3 text-xs text-green-700 border-green-300 gap-1.5"
                            @click="emit('complete', booking.id)"
                        >
                            <CheckCheck class="w-3.5 h-3.5" /> Mark complete
                        </Button>
                    </template>

                    <template v-else-if="booking.status === 'completed'">
                        <span class="text-xs text-muted-foreground italic">No actions — booking complete</span>
                    </template>

                    <template v-else-if="booking.status === 'cancelled'">
                        <span class="text-xs text-muted-foreground italic">No actions — booking cancelled</span>
                    </template>
                </div>
            </div>
        </div>

        <!-- Inline cancel panel — unchanged -->
        <div
            v-if="isCancelOpen"
            class="mt-1 border border-destructive/20 bg-destructive/5 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
        >
            <div class="flex-1">
                <p class="text-sm font-medium text-destructive mb-2">
                    Cancel this booking?
                </p>
                <Input
                    v-model="cancelReason"
                    placeholder="Reason for cancellation (optional)"
                    class="text-sm h-9"
                />
            </div>
            <div class="flex gap-2 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    @click="emit('toggleCancel', '')"
                >Keep</Button>
                <Button
                    variant="destructive"
                    size="sm"
                    @click="emit('cancel', booking.id, cancelReason)"
                >
                    Confirm cancellation
                </Button>
            </div>
        </div>
    </div>
</template>
