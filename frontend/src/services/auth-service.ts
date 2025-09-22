// Serviço de autenticação
import { api } from './api'
import { LoginRequest, LoginResponse, UsuarioResponse } from '@/types'

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials)
    return response.data
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  }

  async getMe(): Promise<UsuarioResponse> {
    const response = await api.get<UsuarioResponse>('/auth/me')
    return response.data
  }

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const response = await api.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    })
    return response.data
  }

  async changePassword(data: {
    senhaAtual: string
    novaSenha: string
  }): Promise<void> {
    await api.post('/auth/change-password', data)
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  }

  async resetPassword(data: {
    token: string
    novaSenha: string
  }): Promise<void> {
    await api.post('/auth/reset-password', data)
  }
}

export const authService = new AuthService()
