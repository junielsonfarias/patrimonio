// Store de autenticação com Zustand
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState, UsuarioResponse, LoginRequest, LoginResponse } from '@/types'
import { authService } from '@/services/auth-service'
import toast from 'react-hot-toast'

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  initializeAuth: () => void
  updateUser: (user: UsuarioResponse) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true })
          
          const response = await authService.login(credentials)
          
          set({
            user: response.usuario,
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })

          toast.success('Login realizado com sucesso!')
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Erro ao fazer login')
          throw error
        }
      },

      logout: async () => {
        try {
          const { token } = get()
          
          if (token) {
            await authService.logout()
          }
        } catch (error) {
          console.error('Erro ao fazer logout:', error)
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
          
          toast.success('Logout realizado com sucesso!')
        }
      },

      refreshToken: async () => {
        try {
          const { refreshToken } = get()
          
          if (!refreshToken) {
            throw new Error('Refresh token não encontrado')
          }

          const response = await authService.refreshToken(refreshToken)
          
          set({
            token: response.token,
          })
        } catch (error) {
          console.error('Erro ao renovar token:', error)
          get().logout()
          throw error
        }
      },

      initializeAuth: () => {
        const { token, refreshToken } = get()
        
        if (token && refreshToken) {
          set({ isAuthenticated: true })
          
          // Verificar se o token está expirado
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const now = Date.now() / 1000
            
            if (payload.exp < now) {
              // Token expirado, tentar renovar
              get().refreshToken().catch(() => {
                get().logout()
              })
            }
          } catch (error) {
            console.error('Erro ao verificar token:', error)
            get().logout()
          }
        } else {
          set({ isAuthenticated: false })
        }
      },

      updateUser: (user: UsuarioResponse) => {
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
