<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/auth'
import { USERNAME_HINT } from '@foliohub/contracts'

const form = reactive({ email: '', username: '', password: '' })
const otp = ref('')
const challengeId = ref('')
const secondsRemaining = ref(0)
const error = ref('')
const loading = ref(false)
const auth = useAuth()
const router = useRouter()
let countdownId: ReturnType<typeof setInterval> | undefined

function startCountdown(seconds: number) {
  secondsRemaining.value = seconds
  clearInterval(countdownId)
  countdownId = setInterval(() => {
    secondsRemaining.value = Math.max(0, secondsRemaining.value - 1)
    if (secondsRemaining.value === 0) clearInterval(countdownId)
  }, 1_000)
}

async function requestOtp() {
  error.value = ''
  loading.value = true
  try {
    const response = await auth.register(form)
    challengeId.value = response.challengeId
    otp.value = ''
    startCountdown(response.expiresInSeconds)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Không thể gửi mã OTP'
  } finally {
    loading.value = false
  }
}

async function verifyOtp() {
  error.value = ''
  loading.value = true
  try {
    await auth.verifyRegistration({ challengeId: challengeId.value, otp: otp.value })
    await router.push('/dashboard')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Không thể xác thực OTP'
  } finally {
    loading.value = false
  }
}

onUnmounted(() => clearInterval(countdownId))
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
      @submit.prevent="challengeId ? verifyOtp() : requestOtp()"
    >
      <h2>{{ challengeId ? 'Xác thực email' : 'Tạo tài khoản' }}</h2>
      <template v-if="!challengeId">
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
      </template>
      <template v-else>
        <p class="otp-instruction">
          Nhập mã gồm 6 chữ số vừa được gửi đến <strong>{{ form.email }}</strong>.
        </p>
        <label><span>Mã OTP <span
          class="required-mark"
          aria-hidden="true"
        >*</span></span><input
          v-model="otp"
          name="otp"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]{6}"
          minlength="6"
          maxlength="6"
          required
          autofocus
        ></label>
        <p
          class="otp-expiry"
          aria-live="polite"
        >
          {{ secondsRemaining > 0 ? `Mã hết hạn sau ${secondsRemaining} giây` : 'Mã OTP đã hết hạn' }}
        </p>
      </template>
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
        {{ loading ? 'Đang xử lý…' : challengeId ? 'Xác thực và tạo tài khoản' : 'Gửi mã OTP' }}
      </button>
      <button
        v-if="challengeId"
        class="text-button"
        type="button"
        :disabled="loading || secondsRemaining > 0"
        @click="requestOtp"
      >
        {{ secondsRemaining > 0 ? `Gửi lại sau ${secondsRemaining}s` : 'Gửi lại mã OTP' }}
      </button>
      <p class="form-foot">
        Đã có tài khoản? <RouterLink to="/login">
          Đăng nhập
        </RouterLink>
      </p>
    </form>
  </section>
</template>
