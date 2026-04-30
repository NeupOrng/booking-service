<script setup lang="ts">
import { Search, X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import type { Booking } from '~/models';
import type { Meta } from '~/types';

definePageMeta({ middleware: ['auth', 'role'], layout: 'business' });

const {
    fetchBusinessBookings,
    confirmBooking,
    completeBooking,
    cancelBusinessBooking,
} = useBusinessOwner();

const bookings = ref<Booking[]>([]);
const meta = ref<Meta>({ total: 0, page: 1, perPage: 20, lastPage: 1 });
const loading = ref(true);
const loadingRowId = ref<string | null>(null);
const expandedCancelId = ref<string | null>(null);

// ── Filters ───────────────────────────────────────────────────────────────────
const filterStatus = ref('all');
const dateFrom = ref('');
const dateTo = ref('');
const searchQuery = ref(''); // searches reference or customer email client-side
const page = ref(1);

const statusCounts = reactive({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
});
const pageNumbers = computed(() =>
    Array.from({ length: meta.value.lastPage }, (_, i) => i + 1),
);

const hasActiveFilters = computed(
    () =>
        filterStatus.value !== 'all' ||
        !!dateFrom.value ||
        !!dateTo.value ||
        !!searchQuery.value,
);

function clearFilters() {
    filterStatus.value = 'all';
    dateFrom.value = '';
    dateTo.value = '';
    searchQuery.value = '';
}

// Client-side search: filter by reference number or dummy customer email
const filteredBookings = computed(() => {
    if (!searchQuery.value.trim()) return bookings.value;
    const q = searchQuery.value.toLowerCase().trim();
    return bookings.value.filter((b: Booking) => {
        const refMatch = b.reference?.toLowerCase().includes(q);
        // TODO: replace userId-derived email with real customer.email when backend provides it
        const emailMatch = b.customer.email.includes(
            q,
        );
        return refMatch || emailMatch;
    });
});

// ── Data loading ──────────────────────────────────────────────────────────────
async function load() {
    loading.value = true;
    try {
        const res = await fetchBusinessBookings({
            status:
                filterStatus.value !== 'all' ? filterStatus.value : undefined,
            dateFrom: dateFrom.value || undefined,
            dateTo: dateTo.value || undefined,
            page: page.value,
            perPage: 20,
        });
        bookings.value = res.data;
        meta.value = res.meta;
    } catch (err: any) {
        toast.error(err?.data?.message ?? 'Failed to load bookings');
    } finally {
        loading.value = false;
    }
}

async function loadCounts() {
    try {
        const [p, c, co, ca] = await Promise.all([
            fetchBusinessBookings({ status: 'pending', perPage: 1 }),
            fetchBusinessBookings({ status: 'confirmed', perPage: 1 }),
            fetchBusinessBookings({ status: 'completed', perPage: 1 }),
            fetchBusinessBookings({ status: 'cancelled', perPage: 1 }),
        ]);
        statusCounts.pending = p.meta.total;
        statusCounts.confirmed = c.meta.total;
        statusCounts.completed = co.meta.total;
        statusCounts.cancelled = ca.meta.total;
    } catch {}
}

watch([filterStatus, dateFrom, dateTo], () => {
    page.value = 1;
    load();
});
watch(page, load);
onMounted(() => {
    load();
    loadCounts();
});

// ── Row actions ───────────────────────────────────────────────────────────────
function updateRow(updated: Booking) {
    const idx = bookings.value.findIndex((b) => b.id === updated.id);
    if (idx !== -1) bookings.value.splice(idx, 1, updated);
}

async function handleConfirm(id: string) {
    loadingRowId.value = id;
    try {
        updateRow(await confirmBooking(id));
        statusCounts.pending = Math.max(0, statusCounts.pending - 1);
        statusCounts.confirmed++;
        toast.success('Booking confirmed');
    } catch (err: any) {
        toast.error(err?.data?.message ?? 'Failed to confirm');
    } finally {
        loadingRowId.value = null;
    }
}

async function handleComplete(id: string) {
    loadingRowId.value = id;
    try {
        updateRow(await completeBooking(id));
        statusCounts.confirmed = Math.max(0, statusCounts.confirmed - 1);
        statusCounts.completed++;
        toast.success('Booking marked completed');
    } catch (err: any) {
        toast.error(err?.data?.message ?? 'Failed to update');
    } finally {
        loadingRowId.value = null;
    }
}

async function handleCancel(id: string, reason: string) {
    loadingRowId.value = id;
    try {
        updateRow(await cancelBusinessBooking(id, reason || undefined));
        statusCounts.cancelled++;
        expandedCancelId.value = null;
        toast.success('Booking cancelled');
    } catch (err: any) {
        toast.error(err?.data?.message ?? 'Failed to cancel');
    } finally {
        loadingRowId.value = null;
    }
}

const statusOptions = [
    { label: 'All statuses', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
];

const statusCardConfig = [
    { label: 'Pending', key: 'pending', textCls: 'text-amber-600' },
    { label: 'Confirmed', key: 'confirmed', textCls: 'text-primary' },
    { label: 'Completed', key: 'completed', textCls: 'text-green-600' },
    { label: 'Cancelled', key: 'cancelled', textCls: 'text-muted-foreground' },
];
</script>

<template>
    <div class="max-w-5xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold">Booking inbox</h1>
                <p class="text-sm text-muted-foreground mt-1">
                    {{ filteredBookings.length
                    }}{{ searchQuery ? ' matching' : '' }} of
                    {{ meta.total }} booking{{ meta.total !== 1 ? 's' : '' }}
                </p>
            </div>
        </div>

        <!-- Stats strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
                v-for="s in statusCardConfig"
                :key="s.key"
                @click="filterStatus = filterStatus === s.key ? 'all' : s.key"
                :class="[
                    'bg-card border rounded-2xl p-4 text-center listeo-shadow transition-colors',
                    filterStatus === s.key
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-border hover:border-primary/40',
                ]"
            >
                <p :class="['text-2xl font-bold', s.textCls]">
                    {{ statusCounts[s.key as keyof typeof statusCounts] }}
                </p>
                <p class="text-xs text-muted-foreground mt-1">{{ s.label }}</p>
            </button>
        </div>

        <!-- Filter bar -->
        <div
            class="bg-card border border-border rounded-2xl px-4 py-3 space-y-3"
        >
            <!-- Search input -->
            <div class="relative">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search by reference (#BK-...) or customer email…"
                    class="w-full h-10 pl-10 pr-9 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                />
                <button
                    v-if="searchQuery"
                    @click="searchQuery = ''"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                    <X class="w-3.5 h-3.5" />
                </button>
            </div>

            <!-- Second row: status + date range + clear -->
            <div class="flex flex-wrap items-center gap-3">
                <Select v-model="filterStatus">
                    <SelectTrigger
                        class="w-40 h-9 text-sm bg-background rounded-xl"
                    >
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent class="bg-background rounded-xl">
                        <SelectItem
                            v-for="opt in statusOptions"
                            :key="opt.value"
                            :value="opt.value"
                            >{{ opt.label }}</SelectItem
                        >
                    </SelectContent>
                </Select>

                <div class="flex items-center gap-2">
                    <DatePicker
                        v-model="dateFrom"
                        placeholder="From date"
                        :maxDate="dateTo || undefined"
                        :clearable="true"
                    />
                    <span class="text-muted-foreground text-xs">→</span>
                    <DatePicker
                        v-model="dateTo"
                        placeholder="To date"
                        :minDate="dateFrom || undefined"
                        :clearable="true"
                    />
                </div>

                <button
                    v-if="hasActiveFilters"
                    @click="clearFilters"
                    class="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 ml-auto"
                >
                    <X class="w-3 h-3" /> Clear all
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
            <Skeleton v-for="i in 4" :key="i" class="h-40 w-full rounded-2xl" />
        </div>

        <!-- Empty -->
        <div
            v-else-if="filteredBookings.length === 0"
            class="py-20 text-center"
        >
            <p class="text-muted-foreground font-medium mb-1">
                No bookings found
            </p>
            <p class="text-sm text-muted-foreground">
                {{
                    searchQuery
                        ? 'No results match your search.'
                        : 'No bookings match your filters.'
                }}
            </p>
            <button
                v-if="hasActiveFilters"
                @click="clearFilters"
                class="mt-4 text-sm text-primary hover:underline"
            >
                Clear all filters
            </button>
        </div>

        <!-- Booking cards -->
        <div v-else class="space-y-3">
            <BusinessBookingRow
                v-for="b in filteredBookings"
                :key="b.id"
                :booking="b"
                :isLoading="loadingRowId === b.id"
                :expandedCancelId="expandedCancelId"
                @confirm="handleConfirm"
                @complete="handleComplete"
                @cancel="handleCancel"
                @toggleCancel="
                    expandedCancelId =
                        $event === expandedCancelId ? null : $event
                "
            />
        </div>

        <!-- Pagination -->
        <div
            v-if="meta.lastPage > 1 && !loading && !searchQuery"
            class="flex justify-center gap-1 pt-2"
        >
            <button
                :disabled="page === 1"
                @click="page--"
                class="w-9 h-9 rounded-xl border border-border text-sm disabled:opacity-40 hover:bg-accent"
            >
                ‹
            </button>
            <button
                v-for="pg in pageNumbers"
                :key="pg"
                @click="page = pg"
                :class="[
                    'w-9 h-9 rounded-xl border text-sm transition-colors',
                    pg === page
                        ? 'bg-primary text-white border-primary'
                        : 'border-border hover:bg-accent',
                ]"
            >
                {{ pg }}
            </button>
            <button
                :disabled="page === meta.lastPage"
                @click="page++"
                class="w-9 h-9 rounded-xl border border-border text-sm disabled:opacity-40 hover:bg-accent"
            >
                ›
            </button>
        </div>
    </div>
</template>
