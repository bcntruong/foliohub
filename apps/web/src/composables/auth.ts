import type { AuthResponse, LoginInput, RegisterInput, UserSummary } from '@foliohub/contracts'
import { computed, reactive } from 'vue'
import { apiRequest } from './api'

const state = reactive<{ user: UserSummary | null; checked: boolean }>({
  user: null,
  checked: false,
})

export function useAuth() {
  const checkSession = async () => {
    if (state.checked) return
    try {
      const response = await apiRequest<{ user: UserSummary }>('/v1/auth/me')
      state.user = response.user
    } catch {
      state.user = null
    } finally {
      state.checked = true
    }
  }

  const login = async (input: LoginInput) => {
    const response = await apiRequest<AuthResponse>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    state.user = response.user
  }

  const register = async (input: RegisterInput) => {
    const response = await apiRequest<AuthResponse>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    state.user = response.user
  }

  const logout = async () => {
    await apiRequest('/v1/auth/logout', { method: 'POST' })
    state.user = null
  }

  return {
    user: computed(() => state.user),
    checked: computed(() => state.checked),
    checkSession,
    login,
    register,
    logout,
  }
}

