<script setup lang="ts">
import type { PortfolioDraft } from '@foliohub/contracts'
import { computed, ref } from 'vue'

type Item = PortfolioDraft['experiences'][number]
type SectionKind = 'experience' | 'education' | 'project'

const SECTION_CONFIG = {
  experience: {
    title: 'Kinh nghiệm',
    noun: 'kinh nghiệm',
    emptyTitle: 'Kinh nghiệm mới',
    primaryLabel: 'Vị trí / Chức danh',
    primaryRequired: true,
    secondaryLabel: 'Công ty / Tổ chức',
    secondaryRequired: false,
    secondaryPlaceholder: 'Tên công ty hoặc tổ chức',
  },
  education: {
    title: 'Học vấn',
    noun: 'học vấn',
    emptyTitle: 'Học vấn mới',
    primaryLabel: 'Trường / Cơ sở đào tạo (không bắt buộc)',
    primaryRequired: false,
    secondaryLabel: 'Chuyên ngành / Bằng cấp',
    secondaryRequired: true,
    secondaryPlaceholder: 'Ví dụ: Kỹ thuật phần mềm',
  },
  project: {
    title: 'Dự án',
    noun: 'dự án',
    emptyTitle: 'Dự án mới',
    primaryLabel: 'Tên dự án',
    primaryRequired: true,
    secondaryLabel: 'Loại / Công ty',
    secondaryRequired: false,
    secondaryPlaceholder: 'Dự án cá nhân hoặc tên công ty',
  },
} as const

const items = defineModel<Item[]>({ required: true })
const props = defineProps<{ kind: SectionKind }>()
const config = computed(() => SECTION_CONFIG[props.kind])
const draggedIndex = ref<number | null>(null)
const dropTargetIndex = ref<number | null>(null)

function addItem() {
  items.value.push({ title: '', subtitle: '', description: '', startDate: '', endDate: '', url: '' })
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function moveItem(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || toIndex < 0 || toIndex >= items.value.length) return
  const [item] = items.value.splice(fromIndex, 1)
  if (item) items.value.splice(toIndex, 0, item)
}

function startDragging(index: number, event: DragEvent) {
  draggedIndex.value = index
  event.dataTransfer?.setData('text/plain', String(index))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function dropItem(targetIndex: number) {
  if (draggedIndex.value !== null) moveItem(draggedIndex.value, targetIndex)
  finishDragging()
}

function finishDragging() {
  draggedIndex.value = null
  dropTargetIndex.value = null
}

function cardTitle(item: Item) {
  return item.title.trim() || item.subtitle.trim() || config.value.emptyTitle
}
</script>

<template>
  <section class="editor-section">
    <div class="editor-section-title">
      <h2>{{ config.title }}</h2><button
        class="text-button"
        type="button"
        @click="addItem"
      >
        + Thêm {{ config.noun }}
      </button>
    </div>
    <p
      v-if="!items.length"
      class="muted"
    >
      Chưa có nội dung.
    </p>
    <p
      v-else-if="items.length > 1"
      class="reorder-hint"
    >
      Kéo tay cầm hoặc dùng nút ↑ ↓ để đổi thứ tự.
    </p>
    <fieldset
      v-for="(item, index) in items"
      :key="item.id ?? index"
      class="repeat-card"
      :class="{ 'drop-target': dropTargetIndex === index }"
      @dragenter.prevent="dropTargetIndex = index"
      @dragover.prevent
      @drop.prevent="dropItem(index)"
    >
      <legend>{{ cardTitle(item) }}</legend>
      <div class="repeat-card-actions">
        <button
          class="drag-handle"
          type="button"
          draggable="true"
          :aria-label="`Kéo để đổi vị trí ${cardTitle(item)}`"
          title="Kéo để đổi vị trí"
          @dragstart="startDragging(index, $event)"
          @dragend="finishDragging"
        >
          ⠿ Kéo
        </button>
        <button
          class="order-button"
          type="button"
          :disabled="index === 0"
          :aria-label="`Đưa ${cardTitle(item)} lên trên`"
          @click="moveItem(index, index - 1)"
        >
          ↑
        </button>
        <button
          class="order-button"
          type="button"
          :disabled="index === items.length - 1"
          :aria-label="`Đưa ${cardTitle(item)} xuống dưới`"
          @click="moveItem(index, index + 1)"
        >
          ↓
        </button>
        <button
          class="remove-button"
          type="button"
          :aria-label="`Xóa ${cardTitle(item)}`"
          @click="removeItem(index)"
        >
          Xóa
        </button>
      </div>
      <div class="form-grid">
        <label>{{ config.primaryLabel }}<input
          v-model="item.title"
          :required="config.primaryRequired"
        ></label>
        <label>{{ config.secondaryLabel }}<input
          v-model="item.subtitle"
          :required="config.secondaryRequired"
          :placeholder="config.secondaryPlaceholder"
        ></label>
        <label>Từ<input
          v-model="item.startDate"
          placeholder="01/2023"
        ></label>
        <label>Đến<input
          v-model="item.endDate"
          placeholder="Hiện tại"
        ></label>
      </div>
      <label>Mô tả
        <span class="field-hint">− Cấp 1 &nbsp;&nbsp; + Cấp 2 &nbsp;&nbsp; * Cấp 3</span>
        <textarea
          v-model="item.description"
          rows="6"
          placeholder="- Phát triển hệ thống quản lý&#10;+ Thiết kế giao diện&#10;* Tối ưu cho điện thoại&#10;+ Kết nối API"
        />
      </label>
      <label v-if="props.kind === 'project'">Link dự án<input
        v-model="item.url"
        type="url"
      ></label>
    </fieldset>
    <button
      v-if="items.length"
      class="text-button repeat-add-bottom"
      type="button"
      @click="addItem"
    >
      + Thêm {{ config.noun }}
    </button>
  </section>
</template>
