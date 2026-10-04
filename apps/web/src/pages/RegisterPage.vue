<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/auth'

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
      <label>Email<input
        v-model="form.email"
        name="email"
        type="email"
        autocomplete="email"
        spellcheck="false"
        required
      ></label>
      <label>Username<input
        v-model="form.username"
        name="username"
        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
        autocomplete="username"
        spellcheck="false"
        required
      ><small>Ví dụ: an-nguyen</small></label>
      <label>Mật khẩu<input
        v-model="form.password"
        name="password"
        type="password"
        minlength="8"
        maxlength="72"
        autocomplete="new-password"
        required
      ><small>Tối thiểu 8 ký tự</small></label>
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
