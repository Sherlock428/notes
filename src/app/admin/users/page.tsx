"use client"

import React, { useState, useEffect } from 'react'
import { useAdminAPI } from '../hooks/useAdminAPI'
import { Search, UserCheck, UserX, Mail, Edit, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: number
  name: string
  email: string
  active: boolean
  created_at: string
  profile_image?: string
}

export default function UsersPage() {
  const { updateUser } = useAdminAPI()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userShoppings, setUserShoppings] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    active: true
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Buscar usuários apenas uma vez
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      setError('')
      
      try {
        // Use window.fetch diretamente em vez de getUsers para evitar múltiplas chamadas
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/ademin/users`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('Falha ao buscar usuários')
        }
        
        const data = await response.json()
        console.log('Users API response:', data) // Debug output
        
        // Check the actual structure of the returned data
        const usersArray = Array.isArray(data) ? data : 
                          data.users && Array.isArray(data.users) ? data.users : []
        
        setUsers(usersArray)
        setFilteredUsers(usersArray)
      } catch (err) {
        console.error('Erro ao buscar usuários:', err)
        setError('Falha ao carregar usuários. Por favor, tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUsers()
  }, [])

  // Filtrar usuários baseado na pesquisa
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query)
    )
    
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  // Buscar compras do usuário
  const handleViewUser = async (user: User) => {
    setSelectedUser(user)
    
    try {
      // Use fetch diretamente para evitar múltiplas chamadas
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/ademin/shoppings/${user.id}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao buscar compras do usuário')
      }
      
      const data = await response.json()
      console.log('User shopping data:', data)
      
      // Usa apenas os dados retornados da API
      const shoppings = data?.shoppings || []
      
      setUserShoppings(shoppings)
      setIsViewModalOpen(true)
    } catch (err) {
      console.error('Erro ao buscar compras do usuário:', err)
      setError('Falha ao carregar compras do usuário.')
    }
  }

  // Abrir modal de edição
  const handleEditClick = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      name: user.name,
      email: user.email,
      active: user.active
    })
    setIsModalOpen(true)
  }

  // Atualizar dados do formulário de edição
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Enviar atualização do usuário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser) return
    
    try {
      await updateUser(selectedUser.id, editFormData)
      
      // Atualizar lista de usuários
      setUsers(prev => 
        prev.map(user => 
          user.id === selectedUser.id 
            ? { ...user, ...editFormData } 
            : user
        )
      )
      
      setSuccessMessage('Usuário atualizado com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setIsModalOpen(false)
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
      setError('Falha ao atualizar usuário. Por favor, tente novamente.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Formatação de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Usuários</h2>
      
      {/* Barra de pesquisa */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Mensagens de sucesso/erro */}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {successMessage}
        </div>
      )}
      
      {/* Tabela de usuários */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm text-left text-gray-500 bg-white">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">ID</th>
              <th scope="col" className="px-6 py-3">Usuário</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 mr-3 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center">
                        {user.profile_image ? (
                          <img 
                            src={user.profile_image} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span>{user.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold flex items-center w-fit",
                        user.active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {user.active ? (
                        <>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Ver detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal de Edição */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold">Editar Usuário</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Nome</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                />
              </div>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={editFormData.active}
                  onChange={handleFormChange}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-900">
                  Usuário ativo
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de Visualização */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Detalhes do Usuário</h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-5">
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-gray-800 mb-2">{selectedUser.name}</h4>
                <p className="text-gray-600">{selectedUser.email}</p>
                <div className="mt-2">
                  <span 
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center",
                      selectedUser.active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    )}
                  >
                    {selectedUser.active ? (
                      <>
                        <UserCheck className="w-3 h-3 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <UserX className="w-3 h-3 mr-1" />
                        Inativo
                      </>
                    )}
                  </span>
                </div>
              </div>
              
              <div>
                <h5 className="font-semibold text-gray-800 mb-3">Histórico de Compras</h5>
                
                {userShoppings.length === 0 ? (
                  <p className="text-gray-500">Nenhuma compra realizada</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2">ID</th>
                          <th scope="col" className="px-4 py-2">Tipo</th>
                          <th scope="col" className="px-4 py-2">Curso</th>
                          <th scope="col" className="px-4 py-2">Item</th>
                          <th scope="col" className="px-4 py-2">Valor</th>
                          <th scope="col" className="px-4 py-2">Data</th>
                          <th scope="col" className="px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userShoppings
                          .filter(item => item.date_buy && item.status)
                          .map((item, index) => {
                            // Find the course info for this purchase
                            const courseInfo = userShoppings.find(
                              c => c.id === item.course_id && !c.date_buy
                            );
                            
                            // Determine if it's a module or subscription purchase
                            const isModule = item.module_id !== null && item.module_id !== undefined;
                            const isSubscription = item.subscribe_id !== null && item.subscribe_id !== undefined;
                            
                            // Get course name
                            let courseName = courseInfo ? courseInfo.name : 'Curso não encontrado';
                            
                            // Find the specific module or subscription
                            let itemName = 'Item não encontrado';
                            let itemPrice = 0;
                            
                            if (isModule && courseInfo && courseInfo.modules) {
                              // Find the module in the course
                              const module = courseInfo.modules.find((m: any) => m.id === item.module_id);
                              if (module) {
                                itemName = module.name;
                                itemPrice = module.price;
                              }
                            } else if (isSubscription && courseInfo && courseInfo.subscribes) {
                              // Find the subscription in the course
                              const subscription = courseInfo.subscribes.find((s: any) => s.id === item.subscribe_id);
                              if (subscription) {
                                itemName = subscription.name;
                                itemPrice = subscription.price;
                              }
                            }
                            
                            return (
                              <tr key={index} className="bg-white border-b">
                                <td className="px-4 py-2">
                                  {item.id}
                                </td>
                                <td className="px-4 py-2">
                                  {isModule ? 'Módulo' : isSubscription ? 'Assinatura' : 'N/D'}
                                </td>
                                <td className="px-4 py-2">
                                  {courseName}
                                </td>
                                <td className="px-4 py-2">
                                  {itemName}
                                </td>
                                <td className="px-4 py-2">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(itemPrice)}
                                </td>
                                <td className="px-4 py-2">
                                  {formatDate(item.date_buy)}
                                </td>
                                <td className="px-4 py-2">
                                  <span 
                                    className={cn(
                                      "px-2 py-1 rounded-full text-xs font-semibold",
                                      item.status === 'Pago' 
                                        ? "bg-green-100 text-green-800" 
                                        : "bg-yellow-100 text-yellow-800"
                                    )}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 