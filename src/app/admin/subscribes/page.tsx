"use client"

import React, { useState, useEffect } from 'react'
import { useAdminAPI } from '../hooks/useAdminAPI'
import { Search, Edit, Trash2, Plus, CreditCard, ArrowUpDown, CheckCircle, XCircle, DollarSign, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Subscription {
  id: number
  name: string
  description: string
  price: number
  duration_months: number
  active: boolean
  created_at: string
  updated_at: string
  course_id?: number
}

interface Course {
  id: number
  name: string
  description: string
}

export default function SubscribesPage() {
  const { createSubscription, updateSubscription, deleteSubscription, getCourses } = useAdminAPI()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof Subscription>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_months: '',
    active: true,
    course_id: ''
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Buscar assinaturas e cursos apenas uma vez
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError('')
      
      try {
        // Fetch subscriptions
        const subscriptionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/ademin/subscribes`, {
          credentials: 'include'
        })
        
        if (!subscriptionResponse.ok) {
          throw new Error('Falha ao buscar assinaturas')
        }
        
        const subscriptionData = await subscriptionResponse.json()
        console.log('Subscriptions API response:', subscriptionData) 
        
        // Extrair corretamente o array de assinaturas da resposta
        const subscriptionsArray = subscriptionData?.subscribes || []
        
        console.log('Using subscription data:', subscriptionsArray)
        
        // Adiciona a propriedade description e active se não existirem
        const processedSubscriptions = subscriptionsArray.map((sub: any) => ({
          ...sub,
          description: sub.description || `Assinatura de ${sub.duration_months || 'tempo indefinido'}`,
          active: sub.active !== undefined ? sub.active : true,
          created_at: sub.created_at || new Date().toISOString(),
          updated_at: sub.updated_at || new Date().toISOString(),
          image_url: sub.image_url || ''
        }))
        
        setSubscriptions(processedSubscriptions)
        setFilteredSubscriptions(processedSubscriptions)

        // Fetch courses
        const courseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/ademin/courses`, {
          credentials: 'include'
        })
        
        if (!courseResponse.ok) {
          throw new Error('Falha ao buscar cursos')
        }
        
        const courseData = await courseResponse.json()
        console.log('Courses API response:', courseData)
        
        // Extrair array de cursos
        const coursesArray = courseData?.courses || []
        setCourses(coursesArray)
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
        setError('Falha ao carregar dados. Por favor, tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Filtrar assinaturas baseado na pesquisa
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubscriptions(subscriptions)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = subscriptions.filter(subscription => 
      subscription.name.toLowerCase().includes(query) || 
      subscription.description.toLowerCase().includes(query)
    )
    
    setFilteredSubscriptions(filtered)
  }, [searchQuery, subscriptions])

  // Ordenar assinaturas
  useEffect(() => {
    const sorted = [...filteredSubscriptions].sort((a, b) => {
      const fieldA = a[sortField]
      const fieldB = b[sortField]
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA)
      }
      
      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc'
          ? fieldA - fieldB
          : fieldB - fieldA
      }
      
      if (typeof fieldA === 'boolean' && typeof fieldB === 'boolean') {
        return sortDirection === 'asc'
          ? Number(fieldA) - Number(fieldB)
          : Number(fieldB) - Number(fieldA)
      }
      
      return 0
    })
    
    setFilteredSubscriptions(sorted)
  }, [sortField, sortDirection])

  // Gerenciar ordenação
  const handleSort = (field: keyof Subscription) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Abrir modal de edição
  const handleEditClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setFormData({
      name: subscription.name,
      description: subscription.description,
      price: String(subscription.price),
      duration_months: String(subscription.duration_months),
      active: subscription.active,
      course_id: String(subscription.course_id || '')
    })
    setIsEditModalOpen(true)
  }

  // Abrir modal de exclusão
  const handleDeleteClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setIsDeleteModalOpen(true)
  }

  // Abrir modal de criação
  const handleCreateClick = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_months: '',
      active: true,
      course_id: courses.length > 0 ? String(courses[0].id) : ''
    })
    setIsCreateModalOpen(true)
  }

  // Atualizar dados do formulário
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseFloat(value) 
          : value
    }))
  }

  // Enviar formulário de criação
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.course_id) {
      setError('Por favor, selecione um curso para a assinatura.')
      return
    }
    
    try {
      // Prepare data exactly as the backend expects it
      const subscriptionData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        course_id: parseInt(formData.course_id)
      }
      
      console.log('Enviando dados para a API:', subscriptionData)
      
      const result = await createSubscription(subscriptionData)
      console.log('Resposta da API após criar assinatura:', result)
      
      // Encontrar o curso selecionado para obter o nome
      const course = courses.find(c => c.id === parseInt(formData.course_id))
      
      // Construir um objeto de assinatura completo com todos os campos necessários
      const newSubscription: Subscription = {
        id: result.id || result.subscription?.id || Date.now(), // Usar ID retornado ou criar temporário
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        active: true,
        course_id: parseInt(formData.course_id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Adicionar nova assinatura à lista e atualizar a lista filtrada também
      setSubscriptions(prev => {
        const updated = [...prev, newSubscription]
        setFilteredSubscriptions(updated) // Atualizar a lista filtrada também
        return updated
      })
      
      setSuccessMessage('Assinatura criada com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setIsCreateModalOpen(false)
    } catch (err) {
      console.error('Erro ao criar assinatura:', err)
      setError('Falha ao criar assinatura. Por favor, tente novamente.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Enviar formulário de edição
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSubscription) return

    if (!formData.course_id) {
      setError('Por favor, selecione um curso para a assinatura.')
      return
    }
    
    try {
      // Prepare data exactly as the backend expects it
      const subscriptionData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        active: formData.active,
        course_id: parseInt(formData.course_id)
      }
      
      console.log('Enviando dados para atualização:', subscriptionData)
      
      await updateSubscription(selectedSubscription.id, subscriptionData)
      
      // Construir objeto atualizado para a interface
      const updatedSubscription: Subscription = {
        ...selectedSubscription,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        active: formData.active,
        course_id: parseInt(formData.course_id),
        updated_at: new Date().toISOString()
      }
      
      // Atualizar tanto a lista principal quanto a filtrada
      const updateLists = (list: Subscription[]) => 
        list.map(subscription => subscription.id === selectedSubscription.id ? updatedSubscription : subscription)
      
      setSubscriptions(updateLists)
      setFilteredSubscriptions(updateLists)
      
      setSuccessMessage('Assinatura atualizada com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setIsEditModalOpen(false)
    } catch (err) {
      console.error('Erro ao atualizar assinatura:', err)
      setError('Falha ao atualizar assinatura. Por favor, tente novamente.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!selectedSubscription) return
    
    try {
      await deleteSubscription(selectedSubscription.id)
      
      // Remover assinatura da lista
      setSubscriptions(prev => 
        prev.filter(subscription => subscription.id !== selectedSubscription.id)
      )
      
      setSuccessMessage('Assinatura excluída com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setIsDeleteModalOpen(false)
    } catch (err) {
      console.error('Erro ao excluir assinatura:', err)
      setError('Falha ao excluir assinatura. Por favor, tente novamente.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Formatação de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Formatação de preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  // Formatar duração
  const formatDuration = (months: number) => {
    if (months === 1) return '1 mês'
    if (months === 12) return '1 ano'
    if (months % 12 === 0) return `${months / 12} anos`
    return `${months} meses`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Assinaturas</h2>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Assinatura
        </button>
      </div>
      
      {/* Barra de pesquisa */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
          placeholder="Buscar por nome ou descrição..."
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
      
      {/* Tabela de assinaturas */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm text-left text-gray-500 bg-white">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('id')}
                >
                  ID
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('name')}
                >
                  Plano
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('price')}
                >
                  Preço
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('duration_months')}
                >
                  Duração
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('active')}
                >
                  Status
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                </td>
              </tr>
            ) : filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Nenhuma assinatura encontrada
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map(subscription => (
                <tr key={subscription.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {subscription.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 mr-3 rounded flex items-center justify-center overflow-hidden bg-gray-200">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p>{subscription.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{subscription.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                      {formatPrice(subscription.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-indigo-600" />
                      {formatDuration(subscription.duration_months)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold flex items-center w-fit",
                        subscription.active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {subscription.active ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(subscription)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(subscription)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal de Criação */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold">Criar Nova Assinatura</h3>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-5">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Nome do Plano</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Descrição</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Preço (R$)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    placeholder="Informe o preço"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Duração (meses)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    type="number"
                    name="duration_months"
                    value={formData.duration_months}
                    onChange={handleFormChange}
                    min="1"
                    placeholder="Informe a duração em meses"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Curso</label>
                <select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                >
                  <option value="">Selecione um curso</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleFormChange as any}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-900">
                  Assinatura ativa
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Criar Assinatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de Edição */}
      {isEditModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold">Editar Assinatura</h3>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Nome do Plano</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Descrição</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Preço (R$)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    placeholder="Informe o preço"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Duração (meses)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    type="number"
                    name="duration_months"
                    value={formData.duration_months}
                    onChange={handleFormChange}
                    min="1"
                    placeholder="Informe a duração em meses"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Curso</label>
                <select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                >
                  <option value="">Selecione um curso</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleFormChange as any}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-900">
                  Assinatura ativa
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
      
      {/* Modal de Exclusão */}
      {isDeleteModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
            </div>
            
            <div className="p-5">
              <p className="text-gray-700 mb-4">
                Tem certeza que deseja excluir a assinatura <strong>{selectedSubscription.name}</strong>? 
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 