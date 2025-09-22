// Componente para rotas protegidas
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: string[]
}

export default function ProtectedRoute({ 
  children, 
  roles 
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirecionar para login, salvando a rota atual
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar se o usuário tem as permissões necessárias
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
