// Página 404
import { Link } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h2>
          <p className="text-gray-600">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <Link
          to="/dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <HomeIcon className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
