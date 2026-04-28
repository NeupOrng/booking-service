<script setup lang="ts">
import { Check, CheckCircle2, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { useBookingStore } from '~/stores/booking'
import type { AvailabilitySlot } from '~/types'
import { addDays, format } from 'date-fns'



const route = useRoute()
const serviceId = route.params.id as string

const { fetchService, createBooking, fetchAvailability } = useBooking()
const { isAuthenticated, login } = useAuth()
const { formatCurrency, formatBookingDate, formatBookingTime } = useFormatters()
const store = useBookingStore()

const loadingInitial = ref(true)

// Step 1: Editor State
const days = computed(() => {
  const arr = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i)
    arr.push({ date: d, isoDate: format(d, 'yyyy-MM-dd'), dayLabel: format(d, 'EEE'), dateLabel: format(d, 'd') })
  }
  return arr
})
const tempDate = ref<string>('')
const tempTime = ref<string | null>(null)
const slots = ref<AvailabilitySlot[]>([])
const loadingSlots = ref(false)

// Step 3: Login State
const loginEmail = ref('')
const loginPassword = ref('')
const showPassword = ref(false)
const loginError = ref('')
const loginLoading = ref(false)
const timeLeft = ref(300) // 5 minutes
let timer: any = null

// Step 4: Submission
const submitError = ref('')
const isSubmitting = ref(false)

onMounted(async () => {
  // Read params
  const queryDate = route.query.date as string
  const queryTime = route.query.time as string
  
  if (!queryDate || !queryTime) {
    return useRouter().push(`/services/${serviceId}`)
  }
  
  try {
    const srv = await fetchService(serviceId)
    if (!srv) throw new Error('Not found')
    store.setService(serviceId, srv)
    store.setDateTime(queryDate, queryTime)
    tempDate.value = queryDate
    tempTime.value = queryTime
  } catch (err) {
    useRouter().push(`/services`)
  } finally {
    loadingInitial.value = false
  }
})

// Handlers for Step 1
watch(tempDate, async (newVal) => {
  if (!newVal || !serviceId) return
  loadingSlots.value = true
  try {
    const res = await fetchAvailability(serviceId, newVal)
    slots.value = res.slots
    if (!res.slots.some(s => s.time === tempTime.value)) {
      tempTime.value = null
    }
  } finally {
    loadingSlots.value = false
  }
})

function confirmStep1() {
  if (tempDate.value && tempTime.value) {
    store.setDateTime(tempDate.value, tempTime.value)
    store.nextStep()
  }
}

// Handlers for Step 2
function confirmStep2() {
  if (isAuthenticated.value) {
    store.setStep(4)
    executeBooking()
  } else {
    store.setStep(3)
    startTimers()
  }
}

// Handlers for Step 3
function startTimers() {
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timer)
      useRouter().push(`/services/${serviceId}`)
    }
  }, 1000)
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const formattedTimeLeft = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

async function handleLogin() {
  loginError.value = ''
  loginLoading.value = true
  try {
    await login(loginEmail.value, loginPassword.value)
    if (timer) clearInterval(timer)
    store.setStep(4)
    executeBooking()
  } catch (err: any) {
    loginError.value = err.message || 'Login failed'
  } finally {
    loginLoading.value = false
  }
}

// Handlers for Step 4
async function executeBooking() {
  if (!store.selectedDate || !store.selectedTime) return
  isSubmitting.value = true
  submitError.value = ''
  try {
    const booking = await createBooking(serviceId, store.selectedDate, store.selectedTime)
    store.setConfirmation(booking.reference)
  } catch (err: any) {
    submitError.value = err.message || 'Failed to complete booking'
  } finally {
    isSubmitting.value = false
  }
}

</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl">
    <div v-if="loadingInitial" class="py-20 flex justify-center">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="store.service">
      
      <!-- Stepper -->
      <div class="mb-10 flex items-start">
        <template v-for="(label, idx) in ['Date & time', 'Review', 'Sign in', 'Confirmed']" :key="idx">

          <!-- Step node -->
          <div class="flex flex-col items-center gap-2 shrink-0 z-10">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 relative transition-all duration-300',
              store.step > idx + 1
                ? 'bg-primary border-primary text-white scale-100'
                : store.step === idx + 1
                  ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/30'
                  : 'bg-background border-border text-muted-foreground scale-100'
            ]">
              <!-- Pulse ring on active step -->
              <span
                v-if="store.step === idx + 1"
                class="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-40"
              />
              <Transition name="check" mode="out-in">
                <Check v-if="store.step > idx + 1" class="w-4 h-4" />
                <span v-else class="text-sm font-semibold">{{ idx + 1 }}</span>
              </Transition>
            </div>
            <span :class="[
              'text-xs font-medium transition-colors duration-300 whitespace-nowrap',
              store.step >= idx + 1 ? 'text-foreground' : 'text-muted-foreground'
            ]">{{ label }}</span>
          </div>

          <!-- Connector line (not after last step) -->
          <div v-if="idx < 3" class="flex-1 mt-5 mx-1 relative h-0.5">
            <!-- Track -->
            <div class="absolute inset-0 bg-border rounded-full" />
            <!-- Animated fill — draws left-to-right when step passes this segment -->
            <div
              class="absolute inset-0 bg-primary rounded-full origin-left transition-transform duration-500 ease-in-out"
              :style="{ transform: store.step > idx + 1 ? 'scaleX(1)' : 'scaleX(0)' }"
            />
          </div>

        </template>
      </div>

      <!-- Step 1: Date & Time -->
      <Card v-if="store.step === 1" class="p-6">
        <h2 class="text-2xl font-bold mb-6">Review & Change Date / Time</h2>
        
        <div class="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
          <button
            v-for="day in days"
            :key="day.isoDate"
            @click="tempDate = day.isoDate"
            :class="[
              'flex flex-col items-center justify-center rounded-lg min-w-[64px] py-2 transition-colors border',
              tempDate === day.isoDate ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent border-border text-foreground'
            ]"
          >
            <span class="text-xs uppercase font-medium opacity-80">{{ day.dayLabel }}</span>
            <span class="text-xl font-bold">{{ day.dateLabel }}</span>
          </button>
        </div>

        <div v-if="loadingSlots" class="grid grid-cols-3 gap-2 mb-6">
          <Skeleton v-for="i in 9" :key="i" class="h-10 w-full" />
        </div>
        <div v-else-if="slots.length === 0" class="p-6 text-center border rounded-lg bg-muted/30 mb-6">
          <p>No availability on this date.</p>
        </div>
        <div v-else class="grid grid-cols-3 gap-3 mb-6">
          <button
            v-for="slot in slots"
            :key="slot.time"
            :disabled="!slot.available"
            @click="tempTime = slot.time"
            :class="[
              'py-2 px-3 text-sm font-medium rounded-md border transition-colors',
              !slot.available ? 'opacity-40 cursor-not-allowed bg-muted border-border' :
              tempTime === slot.time ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-input hover:border-primary hover:text-primary text-foreground'
            ]"
          >
            {{ format(new Date(`2000-01-01T${slot.time}`), 'h:mm a') }}
          </button>
        </div>

        <div class="flex justify-end pt-4 border-t">
           <Button @click="confirmStep1" :disabled="!tempDate || !tempTime" class="h-12 px-8 text-md text-primary-foreground">Continue to Review →</Button>
        </div>
      </Card>


      <!-- Step 2: Review Booking -->
      <Card v-if="store.step === 2" class="p-6">
        <h2 class="text-2xl font-bold mb-6">Review your booking</h2>
        
        <div class="border rounded-xl divide-y mb-6">
           <div class="flex justify-between p-4 bg-muted/20">
              <span class="font-medium">Service</span>
              <span class="text-right">{{ store.service.name }}</span>
           </div>
           <div class="flex justify-between p-4 bg-muted/20">
              <span class="font-medium">Business</span>
              <span class="text-right">{{ store.service.business.name }}</span>
           </div>
           <div class="flex justify-between p-4">
              <span class="font-medium text-muted-foreground">Date</span>
              <span class="text-right font-medium">{{ formatBookingDate(store.selectedDate!) }}</span>
           </div>
           <div class="flex justify-between p-4">
              <span class="font-medium text-muted-foreground">Time</span>
              <span class="text-right font-medium">{{ formatBookingTime(store.selectedTime!) }}</span>
           </div>
           <div class="flex justify-between p-4">
              <span class="font-medium text-muted-foreground">Duration</span>
              <span class="text-right">{{ store.service.duration_minutes }} min</span>
           </div>
           <div class="flex justify-between p-4 text-lg font-bold bg-muted/30">
              <span>Total</span>
              <span>{{ formatCurrency(store.service.price) }}</span>
           </div>
        </div>

        <Alert class="mb-8 border-primary/40 bg-accent text-accent-foreground">
          <AlertTriangle class="w-5 h-5 text-primary" />
          <AlertTitle class="text-primary font-semibold">Cancellation Policy</AlertTitle>
          <AlertDescription class="text-foreground/80">
            {{ store.service.cancellation_policy }}
          </AlertDescription>
        </Alert>

        <div class="flex justify-between flex-row-reverse border-t pt-6 gap-4">
           <Button @click="confirmStep2" class="h-12 px-8 text-md w-full sm:w-auto text-primary-foreground">Confirm & Continue →</Button>
           <Button @click="store.prevStep()" variant="ghost" class="h-12 w-full sm:w-auto">← Back</Button>
        </div>
      </Card>

      <!-- Step 3: Sign In Gate -->
       <Card v-if="store.step === 3" class="p-6 max-w-md mx-auto">
        <h2 class="text-2xl font-bold mb-2">Sign in to complete booking</h2>
        <p class="text-sm font-medium text-destructive mb-6 flex items-center gap-2">
          Your slot is held for {{ formattedTimeLeft }}.
        </p>
        
        <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
           <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Email address</label>
              <Input type="email" v-model="loginEmail" required />
           </div>
           <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Password</label>
              <div class="relative">
                 <Input :type="showPassword ? 'text' : 'password'" v-model="loginPassword" required />
                 <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                   <Eye v-if="!showPassword" class="w-5 h-5" />
                   <EyeOff v-if="showPassword" class="w-5 h-5" />
                 </button>
              </div>
           </div>

           <Alert v-if="loginError" variant="destructive" class="py-2">
              <AlertDescription>{{ loginError }}</AlertDescription>
           </Alert>

           <Button type="submit" class="w-full h-12 mt-2" :disabled="loginLoading">
             <Loader2 v-if="loginLoading" class="w-4 h-4 mr-2 animate-spin" />
             Sign in & book
           </Button>
           
           <div class="text-center mt-4 text-sm text-muted-foreground border-t pt-4">
              No account? <NuxtLink :to="`/auth/register?redirect=/book/${serviceId}`" class="text-primary hover:underline">Create one</NuxtLink>
           </div>
        </form>
      </Card>


      <!-- Step 4: Submission & Confirmation -->
      <Card v-if="store.step === 4" class="p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        
        <template v-if="isSubmitting">
          <Loader2 class="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
          <h2 class="text-2xl font-bold mb-2">Confirming your booking...</h2>
          <p class="text-muted-foreground">Please do not refresh the page.</p>
        </template>

        <template v-else-if="submitError">
           <AlertTriangle class="w-16 h-16 text-destructive mx-auto mb-6" />
           <h2 class="text-2xl font-bold mb-2">Something went wrong</h2>
           <p class="text-muted-foreground mb-6">{{ submitError }}</p>
           <Button @click="executeBooking" class="h-12 px-8">Try again</Button>
        </template>

        <template v-else-if="store.bookingReference">
           <CheckCircle2 class="w-16 h-16 text-green-500 mx-auto mb-6" />
           <h2 class="text-2xl font-bold mb-2">Booking confirmed!</h2>
           <p class="text-muted-foreground mb-8">A confirmation has been sent to your email.</p>

           <div class="border rounded-xl divide-y mb-8 text-left max-w-md mx-auto w-full">
               <div class="flex justify-between p-4 bg-muted/20">
                  <span class="font-medium text-muted-foreground">Reference</span>
                  <span class="font-mono font-bold">{{ store.bookingReference }}</span>
               </div>
               <div class="flex justify-between p-4">
                  <span class="font-medium text-muted-foreground">Service</span>
                  <span class="text-right">{{ store.service.name }}</span>
               </div>
               <div class="flex justify-between p-4">
                  <span class="font-medium text-muted-foreground">When</span>
                  <span class="text-right font-medium">
                     {{ formatBookingDate(store.selectedDate!) }} at {{ formatBookingTime(store.selectedTime!) }}
                  </span>
               </div>
           </div>

           <div class="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
              <Button @click="useRouter().push('/account/bookings')" class="flex-1 h-12">View my bookings</Button>
              <Button @click="useRouter().push('/services')" variant="outline" class="flex-1 h-12">Book another</Button>
           </div>
        </template>
        
      </Card>
      
    </div>
  </div>
</template>
