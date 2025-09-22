// Serviço de API base
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import toast from 'react-hot-toast'

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Criar instância do axios
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Se o erro for 401 (não autorizado) e não for uma tentativa de renovação
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const { refreshToken } = useAuthStore.getState()
        
        if (refreshToken) {
          // Tentar renovar o token
          const { refreshToken: refreshTokenFn } = useAuthStore.getState()
          await refreshTokenFn()
          
          // Repetir a requisição original
          return api(originalRequest)
        } else {
          // Não há refresh token, fazer logout
          const { logout } = useAuthStore.getState()
          await logout()
        }
      } catch (refreshError) {
        // Erro ao renovar token, fazer logout
        const { logout } = useAuthStore.getState()
        await logout()
      }
    }

    // Tratar outros erros
    if (error.response?.status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente mais tarde.')
    } else if (error.response?.status === 404) {
      toast.error('Recurso não encontrado.')
    } else if (error.response?.status === 403) {
      toast.error('Acesso negado.')
    } else if (error.response?.status === 400) {
      const errorMessage = error.response.data?.error || 'Dados inválidos.'
      toast.error(errorMessage)
    } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      toast.error('Erro de conexão. Verifique sua internet.')
    }

    return Promise.reject(error)
  }
)

// Função para fazer upload de arquivos
export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress(progress)
      }
    },
  })

  return response.data.url
}

// Função para download de arquivos
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  const response = await api.get(url, {
    responseType: 'blob',
  })

  const blob = new Blob([response.data])
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}

export default api
