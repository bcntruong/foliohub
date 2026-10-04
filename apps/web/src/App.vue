<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from './composables/auth'

const auth = useAuth()
const router = useRouter()
const currentYear = new Date().getFullYear()

async function signOut() {
  await auth.logout()
  await router.push('/')
}
</script>

<template>
  <a
    class="skip-link"
    href="#main-content"
  >Đi đến nội dung chính</a>
  <header class="site-header">
    <RouterLink
      class="brand"
      to="/"
      aria-label="FolioHub - Trang chủ"
    >
      <span
        class="brand-logo-frame"
        aria-hidden="true"
      >
        <img
          class="brand-logo"
          src="/branding/foliohub-logo-concept.png"
          alt=""
        >
      </span>
    </RouterLink>
    <nav aria-label="Điều hướng chính">
      <template v-if="auth.user.value">
        <RouterLink to="/dashboard">
          Portfolio của tôi
        </RouterLink>
        <button
          class="link-button"
          type="button"
          @click="signOut"
        >
          Đăng xuất
        </button>
      </template>
      <template v-else>
        <RouterLink to="/login">
          Đăng nhập
        </RouterLink>
        <RouterLink
          class="button button-small"
          to="/register"
        >
          Tạo portfolio
        </RouterLink>
      </template>
    </nav>
  </header>
  <main id="main-content">
    <RouterView />
  </main>
  <footer class="site-footer">
    <div class="site-footer-content">
      <div class="site-footer-brand">
        <RouterLink
          class="footer-logo-link"
          to="/"
          aria-label="FolioHub - Trang chủ"
        >
          <span
            class="footer-logo-frame"
            aria-hidden="true"
          >
            <img
              class="footer-logo"
              src="/branding/foliohub-logo-concept.png"
              alt=""
            >
          </span>
        </RouterLink>
        <p>Nơi tạo, quản lý và chia sẻ portfolio chuyên nghiệp. Một hồ sơ rõ ràng cho mỗi cơ hội nghề nghiệp.</p>
      </div>
      <div class="site-footer-legal">
        <a href="/privacy-policy">Chính sách bảo mật</a>
        <a href="/terms-of-service">Điều khoản sử dụng</a>
      </div>
      <p class="site-footer-copyright">
        © {{ currentYear }} FolioHub. All rights reserved.
      </p>
    </div>
  </footer>
</template>
