<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/auth'

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)
const auth = useAuth()
const route = useRoute()
const router = useRouter()

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form)
    await router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Không thể đăng nhập'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-layout shell">
    <div class="auth-intro">
      <p class="eyebrow">
        Chào mừng trở lại
      </p>
      <h1>Tiếp tục viết câu chuyện của bạn.</h1>
      <p>Mọi thay đổi vẫn ở đó, sẵn sàng để bạn hoàn thiện.</p>
    </div>
    <form
      class="auth-card"
      @submit.prevent="submit"
    >
      <h2>Đăng nhập</h2>
      <label>Email<input
        v-model="form.email"
        name="email"
        type="email"
        autocomplete="email"
        spellcheck="false"
        required
      ></label>
      <label>Mật khẩu<input
        v-model="form.password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
      ></label>
      <p
        v-if="error"
        class="form-error"
        role="alert"
      >
        {{ error }}
      </p>
      <button
        class="button"
        type="submit"
        :disabled="loading"
      >
        {{ loading ? 'Đang đăng nhập…' : 'Đăng nhập' }}
      </button>
      <p class="form-foot">
        Chưa có tài khoản? <RouterLink to="/register">
          Đăng ký miễn phí
        </RouterLink>
      </p>
    </form>
  </section>
</template>
