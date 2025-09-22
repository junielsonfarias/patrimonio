// Página de dashboard
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { DashboardStats } from '@/types'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { 
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar estatísticas do dashboard</p>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total de Patrimônios',
      value: stats?.totalPatrimonios || 0,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Valor Total',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(stats?.totalValor || 0),
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Secretarias Ativas',
      value: stats?.patrimoniosPorSecretaria.length || 0,
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Transferências Pendentes',
      value: stats?.transferenciasPendentes || 0,
      icon: UserGroupIcon,
      color: 'bg-yellow-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visão geral do sistema de gestão patrimonial
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Patrimônios por categoria */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Patrimônios por Categoria
          </h3>
          {stats?.patrimoniosPorCategoria && stats.patrimoniosPorCategoria.length > 0 ? (
            <div className="space-y-3">
              {stats.patrimoniosPorCategoria.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.categoria}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {item.quantidade}
                    </span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(item.quantidade / Math.max(...stats.patrimoniosPorCategoria.map(i => i.quantidade))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
          )}
        </div>

        {/* Patrimônios por secretaria */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Patrimônios por Secretaria
          </h3>
          {stats?.patrimoniosPorSecretaria && stats.patrimoniosPorSecretaria.length > 0 ? (
            <div className="space-y-3">
              {stats.patrimoniosPorSecretaria.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.secretaria}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {item.quantidade}
                    </span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(item.quantidade / Math.max(...stats.patrimoniosPorSecretaria.map(i => i.quantidade))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
          )}
        </div>
      </div>
    </div>
  )
}
