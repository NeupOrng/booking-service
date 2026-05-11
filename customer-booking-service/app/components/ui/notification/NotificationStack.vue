<script setup lang="ts">
import { X, Info, BellOff, CheckCheck, TriangleAlert, Ban } from 'lucide-vue-next'
import { useNotify, type NotifyType } from '~/composables/useNotify'

const { items, dismiss, pause, resume } = useNotify()

const CONFIG: Record<NotifyType, { bg: string; iconBg: string; icon: Component }> = {
  neutral: { bg: '#9499af', iconBg: '#7b7f97', icon: Info         },
  info:    { bg: '#5b7cf6', iconBg: '#4a68d8', icon: BellOff      },
  success: { bg: '#2ec068', iconBg: '#24a056', icon: CheckCheck    },
  warning: { bg: '#f79a20', iconBg: '#d98317', icon: TriangleAlert },
  error:   { bg: '#e55c4a', iconBg: '#c44d3d', icon: Ban           },
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-[9999] w-[360px] max-w-[calc(100vw-2rem)]"
      aria-live="polite"
      aria-label="Notifications"
    >
      <TransitionGroup
        tag="div"
        class="flex flex-col gap-3"
        enter-active-class="notif-enter-active"
        leave-active-class="notif-leave-active"
        enter-from-class="notif-enter-from"
        leave-to-class="notif-leave-to"
        move-class="notif-move"
      >
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl cursor-default select-none"
          :style="{ background: CONFIG[item.type].bg }"
          @mouseenter="pause(item.id)"
          @mouseleave="resume(item.id)"
        >
          <!-- Icon tile -->
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            :style="{ background: CONFIG[item.type].iconBg }"
          >
            <component :is="CONFIG[item.type].icon" class="w-5 h-5 text-white" />
          </div>

          <!-- Text -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-white leading-snug">{{ item.title }}</p>
            <p v-if="item.description" class="text-xs text-white/80 mt-0.5 leading-snug">
              {{ item.description }}
            </p>
          </div>

          <!-- Close -->
          <button
            class="shrink-0 text-white/60 hover:text-white transition-colors ml-1"
            @click="dismiss(item.id)"
            aria-label="Dismiss"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.notif-enter-active {
  transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
.notif-leave-active {
  transition: all 0.22s ease-in;
  position: absolute;
  right: 0; left: 0;
}
.notif-enter-from {
  opacity: 0;
  transform: translateX(110%);
}
.notif-leave-to {
  opacity: 0;
  transform: translateX(110%);
}
.notif-move {
  transition: transform 0.28s ease;
}
</style>
