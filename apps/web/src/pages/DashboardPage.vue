<script setup lang="ts">
import type { PortfolioSummary } from '@foliohub/contracts'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/auth'
import { emptyPortfolio, portfolioApi } from '../composables/portfolios'

const portfolios = ref<PortfolioSummary[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const showCreate = ref(false)
const form = reactive({ name: '', slug: '' })
const auth = useAuth()
const router = useRouter()

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function load() {
  try {
    portfolios.value = (await portfolioApi.list()).portfolios
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Không thể tải portfolio'
  } finally {
    loading.value = false
  }
}

async function createPortfolio() {
  error.value = ''
  saving.value = true
  try {
    const slug = form.slug || slugify(form.name)
    const response = await portfolioApi.create(emptyPortfolio(form.name, slug))
    await router.push(`/editor/${response.portfolio.id}`)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Không thể tạo portfolio'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="dashboard shell">
    <header class="page-heading">
      <div>
        <p class="eyebrow">
          Xin chào, {{ auth.user.value?.username }}
        </p><h1>Portfolio của bạn</h1>
      </div>
      <button
        class="button"
        type="button"
        @click="showCreate = !showCreate"
      >
        + Portfolio mới
      </button>
    </header>

    <form
      v-if="showCreate"
      class="create-panel"
      @submit.prevent="createPortfolio"
    >
      <div>
        <p class="eyebrow">
          Bản nháp mới
        </p><h2>Bạn muốn portfolio này nói về điều gì?</h2>
      </div>
      <label>Tên hiển thị<input
        v-model="form.name"
        required
        placeholder="Nguyễn Minh An"
        @input="form.slug = slugify(form.name)"
      ></label>
      <label>Đường dẫn<input
        v-model="form.slug"
        required
        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
      ><small>/u/{{ auth.user.value?.username }}/{{ form.slug || 'portfolio' }}</small></label>
      <button
        class="button"
        type="submit"
        :disabled="saving"
      >
        {{ saving ? 'Đang tạo…' : 'Bắt đầu chỉnh sửa' }}
      </button>
    </form>

    <p
      v-if="error"
      class="form-error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-if="loading"
      class="empty-state"
    >
      Đang tải portfolio…
    </p>
    <div
      v-else-if="portfolios.length"
      class="portfolio-list"
    >
      <RouterLink
        v-for="item in portfolios"
        :key="item.id"
        class="portfolio-card"
        :to="`/editor/${item.id}`"
      >
        <div>
          <span
            class="status"
            :class="item.visibility"
          >{{ item.visibility === 'public' ? 'Đã xuất bản' : 'Bản riêng tư' }}</span><h2>{{ item.displayName }}</h2><p>{{ item.headline || 'Chưa có headline' }}</p>
        </div>
        <span
          class="card-arrow"
          aria-hidden="true"
        >↗</span>
      </RouterLink>
    </div>
    <div
      v-else
      class="empty-state"
    >
      <p class="eyebrow">
        Trang giấy đang chờ
      </p><h2>Tạo portfolio đầu tiên của bạn.</h2><p>Bắt đầu riêng tư, thêm nội dung theo nhịp của bạn, rồi xuất bản khi sẵn sàng.</p>
    </div>
  </section>
</template>

