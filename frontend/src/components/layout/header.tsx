// Componente de header
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { 
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/utils/cn'

export default function Header() {
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Sistema de Gestão Patrimonial
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notificações */}
            <button
              type="button"
              className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <span className="sr-only">Ver notificações</span>
              <BellIcon className="h-6 w-6" />
            </button>

            {/* Menu do usuário */}
            <Menu as="div" className="relative">
              <div>
                <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                  <span className="sr-only">Abrir menu do usuário</span>
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                    <p className="font-medium">{user?.nome}</p>
                    <p className="text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400">{user?.role}</p>
                  </div>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={cn(
                          active ? 'bg-gray-100' : '',
                          'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        <Cog6ToothIcon className="mr-3 h-4 w-4" />
                        Configurações
                      </button>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={cn(
                          active ? 'bg-gray-100' : '',
                          'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Sair
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  )
}
