<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/auth'
import { USERNAME_HINT } from '@foliohub/contracts'

const form = reactive({ email: '', username: '', password: '' })
const error = ref('')
const loading = ref(false)
const auth = useAuth()
const router = useRouter()

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register(form)
    await router.push('/dashboard')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Không thể tạo tài khoản'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-layout shell">
    <div class="auth-intro">
      <p class="eyebrow">
        Portfolio đầu tiên
      </p>
      <h1>Một nơi để năng lực của bạn lên tiếng.</h1>
      <p>Tạo nhiều phiên bản cho từng vị trí ứng tuyển. Chỉ xuất bản khi bạn thấy sẵn sàng.</p>
    </div>
    <form
      class="auth-card"
      @submit.prevent="submit"
    >
      <h2>Tạo tài khoản</h2>
      <label><span>Email <span
          class="required-mark"
          aria-hidden="true"
        >*</span></span><input
        v-model="form.email"
        name="email"
        type="email"
        autocomplete="email"
        spellcheck="false"
        required
      ></label>
      <div class="form-field">
        <div class="field-heading">
          <label for="register-username">Tên tài khoản <span
            class="required-mark"
            aria-hidden="true"
          >*</span></label>
          <span class="field-help">
            <button
              type="button"
              class="field-help-trigger"
              aria-label="Xem quy tắc đặt tên tài khoản"
              aria-describedby="username-hint"
            >i</button>
            <span
              id="username-hint"
              class="field-tooltip"
              role="tooltip"
            >{{ USERNAME_HINT }}</span>
          </span>
        </div>
        <input
          id="register-username"
          v-model="form.username"
          name="username"
          pattern="[a-z0-9_-]{3,30}"
          minlength="3"
          maxlength="30"
          autocomplete="username"
          spellcheck="false"
          required
        >
      </div>
      <div class="form-field">
        <div class="field-heading">
          <label for="register-password">Mật khẩu <span
            class="required-mark"
            aria-hidden="true"
          >*</span></label>
          <span class="field-help">
            <button
              type="button"
              class="field-help-trigger"
              aria-label="Xem yêu cầu mật khẩu"
              aria-describedby="password-hint"
            >i</button>
            <span
              id="password-hint"
              class="field-tooltip"
              role="tooltip"
            >Mật khẩu cần từ 8 đến 72 ký tự.</span>
          </span>
        </div>
        <input
          id="register-password"
          v-model="form.password"
          name="password"
          type="password"
          minlength="8"
          maxlength="72"
          autocomplete="new-password"
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
        {{ loading ? 'Đang tạo…' : 'Tạo tài khoản' }}
      </button>
      <p class="form-foot">
        Đã có tài khoản? <RouterLink to="/login">
          Đăng nhập
        </RouterLink>
      </p>
    </form>
  </section>
</template>
