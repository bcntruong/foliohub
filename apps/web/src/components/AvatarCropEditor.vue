<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue'
import AuthenticatedImage from './AuthenticatedImage.vue'

type DragAxis = 'horizontal' | 'vertical' | 'none'

const props = defineProps<{
  imageUrl: string
  displayName: string
  positionX: number
  positionY: number
}>()
const emit = defineEmits<{
  'update:positionX': [value: number]
  'update:positionY': [value: number]
}>()

const axis = ref<DragAxis>('none')
const drag = reactive({ pointerId: -1, start: 0, position: 50 })
const cropStyle = computed(() => ({ objectPosition: `${props.positionX}% ${props.positionY}%` }))
const instruction = computed(() => {
  if (axis.value === 'horizontal') return 'Kéo ảnh sang trái hoặc phải'
  if (axis.value === 'vertical') return 'Kéo ảnh lên hoặc xuống'
  return 'Ảnh đã vừa với khung'
})

function clamp(value: number) {
  return Math.min(100, Math.max(0, value))
}

function detectAxis(event: Event) {
  const image = event.target as HTMLImageElement
  const ratio = image.naturalWidth / image.naturalHeight
  axis.value = ratio > 1.05 ? 'horizontal' : ratio < .95 ? 'vertical' : 'none'
}

function startDrag(event: PointerEvent) {
  if (axis.value === 'none') return
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  drag.pointerId = event.pointerId
  drag.start = axis.value === 'horizontal' ? event.clientX : event.clientY
  drag.position = axis.value === 'horizontal' ? props.positionX : props.positionY
}

function moveImage(event: PointerEvent) {
  if (event.pointerId !== drag.pointerId) return
  const frame = event.currentTarget as HTMLElement
  const pointer = axis.value === 'horizontal' ? event.clientX : event.clientY
  const size = axis.value === 'horizontal' ? frame.clientWidth : frame.clientHeight
  const position = clamp(drag.position - (pointer - drag.start) / size * 100)
  updatePosition(position)
}

function updatePosition(position: number) {
  if (axis.value === 'horizontal') emit('update:positionX', position)
  if (axis.value === 'vertical') emit('update:positionY', position)
}

function moveWithKeyboard(event: KeyboardEvent) {
  const movement = { ArrowLeft: -2, ArrowRight: 2, ArrowUp: -2, ArrowDown: 2 }[event.key]
  const isRelevant = axis.value === 'horizontal' ? event.key.includes('Left') || event.key.includes('Right') : event.key.includes('Up') || event.key.includes('Down')
  if (movement === undefined || !isRelevant) return
  event.preventDefault()
  const position = axis.value === 'horizontal' ? props.positionX : props.positionY
  updatePosition(clamp(position + movement))
}

function stopDrag() {
  drag.pointerId = -1
}

function resetCrop() {
  emit('update:positionX', 50)
  emit('update:positionY', 50)
}

onUnmounted(stopDrag)
</script>

<template>
  <div class="avatar-crop-editor">
    <div
      class="avatar-crop-frame"
      :class="`drag-${axis}`"
      tabindex="0"
      role="img"
      :aria-label="`Điều chỉnh ảnh của ${displayName}. ${instruction}.`"
      @pointerdown="startDrag"
      @pointermove="moveImage"
      @pointerup="stopDrag"
      @pointercancel="stopDrag"
      @keydown="moveWithKeyboard"
    >
      <AuthenticatedImage
        :source="imageUrl"
        :alt="`Ảnh đại diện hiện tại của ${displayName}`"
        :style="cropStyle"
        width="180"
        height="180"
        draggable="false"
        @load="detectAxis"
      />
      <span aria-hidden="true">{{ instruction }}</span>
    </div>
    <div class="avatar-crop-controls">
      <strong>Chọn vùng ảnh</strong>
      <p>{{ instruction }} để căn khuôn mặt vào giữa.</p>
      <button
        v-if="axis !== 'none'"
        class="text-button"
        type="button"
        @click="resetCrop"
      >
        Đặt lại vị trí
      </button>
    </div>
  </div>
</template>
