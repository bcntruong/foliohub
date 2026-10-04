<script setup lang="ts">
import type { Portfolio } from '@foliohub/contracts'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PortfolioTemplate from '../components/PortfolioTemplate.vue'
import { portfolioApi } from '../composables/portfolios'

const route = useRoute()
const portfolio = ref<Portfolio | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    portfolio.value = (await portfolioApi.public(String(route.params.username), String(route.params.slug))).portfolio
    document.title = `${portfolio.value.displayName} — Portfolio`
  } catch {
    error.value = 'Portfolio này không tồn tại hoặc chưa được công khai.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="public-page">
    <p
      v-if="loading"
      class="empty-state"
    >
      Đang tải portfolio…
    </p>
    <div
      v-else-if="error"
      class="empty-state"
    >
      <p class="eyebrow">
        404
      </p><h1>Chưa thể xem trang này.</h1><p>{{ error }}</p><RouterLink
        class="button"
        to="/"
      >
        Về FolioHub
      </RouterLink>
    </div>
    <PortfolioTemplate
      v-else-if="portfolio"
      :portfolio="portfolio"
    />
  </section>
</template>
