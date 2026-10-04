import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  RegistrationChallengeResponse,
  UserSummary,
  VerifyRegistrationInput,
} from '@foliohub/contracts'
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
    return apiRequest<RegistrationChallengeResponse>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  const verifyRegistration = async (input: VerifyRegistrationInput) => {
    const response = await apiRequest<AuthResponse>('/v1/auth/register/verify', {
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
    verifyRegistration,
    logout,
  }
}
