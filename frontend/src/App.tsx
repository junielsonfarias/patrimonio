// Componente principal da aplicação
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect } from 'react'

// Páginas
import LoginPage from '@/pages/auth/login-page'
import DashboardPage from '@/pages/dashboard/dashboard-page'
import PatrimoniosPage from '@/pages/patrimonio/patrimonios-page'
import PatrimonioDetailPage from '@/pages/patrimonio/patrimonio-detail-page'
import PatrimonioFormPage from '@/pages/patrimonio/patrimonio-form-page'
import SecretariasPage from '@/pages/secretarias/secretarias-page'
import SecretariaFormPage from '@/pages/secretarias/secretaria-form-page'
import FuncionariosPage from '@/pages/funcionarios/funcionarios-page'
import FuncionarioFormPage from '@/pages/funcionarios/funcionario-form-page'
import RelatoriosPage from '@/pages/relatorios/relatorios-page'
import UsuariosPage from '@/pages/usuarios/usuarios-page'
import NotFoundPage from '@/pages/not-found-page'

// Componentes
import Layout from '@/components/layout/layout'
import LoadingSpinner from '@/components/ui/loading-spinner'
import ProtectedRoute from '@/components/auth/protected-route'

function App() {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />

      {/* Rotas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Patrimônios */}
        <Route path="patrimonios" element={<PatrimoniosPage />} />
        <Route path="patrimonios/novo" element={<PatrimonioFormPage />} />
        <Route path="patrimonios/:id" element={<PatrimonioDetailPage />} />
        <Route path="patrimonios/:id/editar" element={<PatrimonioFormPage />} />

        {/* Secretarias */}
        <Route path="secretarias" element={<SecretariasPage />} />
        <Route path="secretarias/nova" element={<SecretariaFormPage />} />
        <Route path="secretarias/:id/editar" element={<SecretariaFormPage />} />

        {/* Funcionários */}
        <Route path="funcionarios" element={<FuncionariosPage />} />
        <Route path="funcionarios/novo" element={<FuncionarioFormPage />} />
        <Route path="funcionarios/:id/editar" element={<FuncionarioFormPage />} />

        {/* Relatórios */}
        <Route path="relatorios" element={<RelatoriosPage />} />

        {/* Usuários */}
        <Route path="usuarios" element={<UsuariosPage />} />
      </Route>

      {/* Rota 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
