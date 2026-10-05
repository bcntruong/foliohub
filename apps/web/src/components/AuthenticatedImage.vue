<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { fetchMedia } from '../composables/api'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  source: string
  alt: string
}>()
const emit = defineEmits<{
  load: [event: Event]
  error: [reason: unknown]
}>()

const objectUrl = ref('')
let controller: AbortController | null = null

function clearObjectUrl() {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
  objectUrl.value = ''
}

async function loadImage(source: string) {
  controller?.abort()
  controller = new AbortController()
  clearObjectUrl()
  try {
    const blob = await fetchMedia(source, controller.signal)
    objectUrl.value = URL.createObjectURL(blob)
  } catch (reason) {
    if (!(reason instanceof DOMException && reason.name === 'AbortError')) emit('error', reason)
  }
}

watch(() => props.source, loadImage, { immediate: true })
onUnmounted(() => {
  controller?.abort()
  clearObjectUrl()
})
</script>

<template>
  <img
    v-if="objectUrl"
    v-bind="$attrs"
    :src="objectUrl"
    :alt="alt"
    @load="emit('load', $event)"
    @error="emit('error', $event)"
  >
</template>
