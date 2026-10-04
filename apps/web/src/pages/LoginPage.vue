<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/auth'

const form = reactive({ identifier: '', password: '' })
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
      <div class="form-field">
        <div class="field-heading">
          <label for="login-identifier">Email hoặc tên tài khoản <span
            class="required-mark"
            aria-hidden="true"
          >*</span></label>
          <span class="field-help">
            <button
              type="button"
              class="field-help-trigger"
              aria-label="Xem hướng dẫn tài khoản đăng nhập"
              aria-describedby="login-identifier-hint"
            >i</button>
            <span
              id="login-identifier-hint"
              class="field-tooltip"
              role="tooltip"
            >Bạn có thể dùng email hoặc tên tài khoản.</span>
          </span>
        </div>
        <input
          id="login-identifier"
          v-model="form.identifier"
          name="identifier"
          type="text"
          autocomplete="username"
          spellcheck="false"
          required
        >
      </div>
      <div class="form-field">
        <div class="field-heading">
          <label for="login-password">Mật khẩu <span
            class="required-mark"
            aria-hidden="true"
          >*</span></label>
          <span class="field-help">
            <button
              type="button"
              class="field-help-trigger"
              aria-label="Xem yêu cầu mật khẩu"
              aria-describedby="login-password-hint"
            >i</button>
            <span
              id="login-password-hint"
              class="field-tooltip"
              role="tooltip"
            >Nhập mật khẩu của tài khoản, từ 8 đến 72 ký tự.</span>
          </span>
        </div>
        <input
          id="login-password"
          v-model="form.password"
          name="password"
          type="password"
          minlength="8"
          maxlength="72"
          autocomplete="current-password"
          required
        >
      </div>
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
