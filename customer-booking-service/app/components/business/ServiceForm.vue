<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';
import type { Service, ServiceCategory } from '~/types';

const props = defineProps<{
    service?: Service | null;
    loading?: boolean;
}>();
const emit = defineEmits<{
    (e: 'submit', data: any): void;
}>();

const { fetchCategories } = useBooking();

const categories = ref<ServiceCategory[]>([]);

const form = reactive({
    name: props.service?.name ?? '',
    categoryId: props.service?.category?.id ?? '',
    description: props.service?.description ?? '',
    priceDisplay: props.service ? (props.service.price / 100).toFixed(2) : '',
    durationMinutes: props.service?.duration_minutes ?? 60,
    coverImageUrl: props.service?.cover_image_url ?? '',
    cancellationPolicy: props.service?.cancellation_policy ?? '',
    isActive: props.service?.is_active ?? true,
});

const errors = reactive<Record<string, string>>({});

function validate(): boolean {
    Object.keys(errors).forEach((k) => delete errors[k]);
    if (!form.name || form.name.length < 2)
        errors.name = 'Name must be at least 2 characters';
    const price = parseFloat(form.priceDisplay);
    if (isNaN(price) || price <= 0)
        errors.priceDisplay = 'Price must be greater than 0';
    if (!form.durationMinutes || form.durationMinutes < 5)
        errors.durationMinutes = 'Duration must be at least 5 minutes';
    return Object.keys(errors).length === 0;
}

function handleSubmit() {
    if (!validate()) return;
    emit('submit', {
        name: form.name,
        categoryId: form.categoryId || undefined,
        description: form.description || undefined,
        priceCents: Math.round(parseFloat(form.priceDisplay) * 100),
        durationMinutes: Number(form.durationMinutes),
        coverImageUrl: form.coverImageUrl || undefined,
        cancellationPolicy: form.cancellationPolicy || undefined,
        isActive: form.isActive,
    });
}

onMounted(async () => {
    categories.value = await fetchCategories();
});
</script>

<template>
    <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Name -->
        <div class="space-y-1.5">
            <label class="text-sm font-medium"
                >Service Name <span class="text-destructive">*</span></label
            >
            <Input v-model="form.name" placeholder="e.g. Deep Tissue Massage" />
            <p v-if="errors.name" class="text-xs text-destructive">
                {{ errors.name }}
            </p>
        </div>

        <!-- Category -->
        <div class="space-y-1.5">
            <label class="text-sm font-medium">Category</label>
            <Select v-model="form.categoryId">
                <SelectTrigger class="text-sm bg-background rounded-xl">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent
                    class="rounded-xl bg-card border border-border shadow-lg"
                >
                    <SelectItem
                        v-for="cat in categories"
                        :key="cat.id"
                        :value="cat.id"
                        >{{ cat.name }}</SelectItem
                    >
                </SelectContent>
            </Select>
        </div>

        <!-- Description -->
        <div class="space-y-1.5 flex flex-col">
            <label class="text-sm font-medium">Description</label>
            <Textarea
                :value="form.description"
                @input="form.description = $event.target.value"
                class="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe what customers can expect..."
                rows="5"
            />
        </div>

        <!-- Price + Duration row -->
        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
                <label class="text-sm font-medium"
                    >Price (USD) <span class="text-destructive">*</span></label
                >
                <div class="relative">
                    <span
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"
                        >$</span
                    >
                    <Input
                        v-model="form.priceDisplay"
                        type="number"
                        step="0.01"
                        min="0.01"
                        class="pl-7"
                        placeholder="45.00"
                    />
                </div>
                <p v-if="errors.priceDisplay" class="text-xs text-destructive">
                    {{ errors.priceDisplay }}
                </p>
            </div>
            <div class="space-y-1.5">
                <label class="text-sm font-medium"
                    >Duration (min)
                    <span class="text-destructive">*</span></label
                >
                <Input
                    v-model="form.durationMinutes"
                    type="number"
                    min="5"
                    step="5"
                    placeholder="60"
                />
                <p
                    v-if="errors.durationMinutes"
                    class="text-xs text-destructive"
                >
                    {{ errors.durationMinutes }}
                </p>
            </div>
        </div>

        <!-- Cover image URL -->
        <div class="space-y-1.5">
            <label class="text-sm font-medium">Cover Image URL</label>
            <Input
                v-model="form.coverImageUrl"
                type="url"
                placeholder="https://..."
            />
        </div>

        <!-- Cancellation policy -->
        <div class="space-y-1.5 flex flex-col">
            <label class="text-sm font-medium">Cancellation Policy</label>
            <Textarea
                :value="form.cancellationPolicy"
                @input="form.cancellationPolicy = $event.target.value"
                class="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. Free cancellation up to 24 hours before..."
                rows="3"
            />
        </div>

        <!-- Active toggle -->
        <div
            class="flex items-center justify-between p-4 bg-muted/40 rounded-xl"
        >
            <div>
                <p class="text-sm font-medium">Active listing</p>
                <p class="text-xs text-muted-foreground">
                    Customers can find and book this service
                </p>
            </div>
            <Switch v-model:checked="form.isActive" />
        </div>

        <!-- Submit -->
        <Button type="submit" class="w-full h-11" :disabled="loading">
            <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
            {{ service ? 'Save changes' : 'Create service' }}
        </Button>
    </form>
</template>
