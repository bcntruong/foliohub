<script setup lang="ts">
import type { PortfolioDraft } from '@foliohub/contracts'

const links = defineModel<PortfolioDraft['links']>({ required: true })

function addLink() {
  links.value.push({ label: '', url: '' })
}
</script>

<template>
  <section class="editor-section">
    <div class="editor-section-title">
      <h2>Liên kết</h2><button
        class="text-button"
        type="button"
        @click="addLink"
      >
        + Thêm link
      </button>
    </div>
    <div
      v-for="(link, index) in links"
      :key="index"
      class="inline-fields"
    >
      <input
        v-model="link.label"
        required
        aria-label="Tên liên kết"
        placeholder="LinkedIn"
      >
      <input
        v-model="link.url"
        required
        type="url"
        aria-label="Địa chỉ liên kết"
        placeholder="https://…"
      >
      <button
        class="remove-button"
        type="button"
        aria-label="Xóa liên kết"
        @click="links.splice(index, 1)"
      >
        Xóa
      </button>
    </div>
    <button
      v-if="links.length"
      class="text-button repeat-add-bottom"
      type="button"
      @click="addLink"
    >
      + Thêm link
    </button>
  </section>
</template>
