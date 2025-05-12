"use client"

import React, { useState, useEffect } from 'react'
import { useAdminAPI } from '../hooks/useAdminAPI'
import { Search, Edit, Trash2, Plus, FileText, ArrowUpDown, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Module {
  id: number
  name: string
  description: string
  price: number
  subject: string
  pdf_path: string
  course_id: number
  course_name?: string
  active: boolean
  created_at: string
  updated_at: string
}

export default function ModulesPage() {
  const { createModule, updateModule, deleteModule } = useAdminAPI()
  const [modules, setModules] = useState<Module[]>([])
  const [filteredModules, setFilteredModules] = useState<Module[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof Module>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    subject: '',
    pdf_path: '',
    course_id: '',
    active: true
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Buscar módulos e cursos apenas uma vez
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError('')
      
      try {
        // Use fetch diretamente para evitar múltiplas chamadas
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        
        const [modulesResponse, coursesResponse] = await Promise.all([
          fetch(`${apiUrl}/ademin/modules`, { credentials: 'include' }),
          fetch(`${apiUrl}/ademin/courses`, { credentials: 'include' })
        ])
        
        if (!modulesResponse.ok) {
          throw new Error('Falha ao buscar módulos')
        }
        
        if (!coursesResponse.ok) {
          throw new Error('Falha ao buscar cursos')
        }
        
        const modulesData = await modulesResponse.json()
        const coursesData = await coursesResponse.json()
        
        console.log('Modules API response:', modulesData)
        console.log('Courses API response:', coursesData)
        
        // Check the actual structure of the returned data
        const modulesArray = Array.isArray(modulesData) ? modulesData : 
                           modulesData.modules && Array.isArray(modulesData.modules) ? modulesData.modules : []
        
        const coursesArray = Array.isArray(coursesData) ? coursesData : 
                            coursesData.courses && Array.isArray(coursesData.courses) ? coursesData.courses : []
        
        const modulesWithCourseNames = modulesArray.map((module: any) => {
          const course = coursesArray.find((c: any) => c.id === module.course_id)
          return {
            ...module,
            course_name: course ? course.name : 'Curso não encontrado'
          }
        })
        
        setModules(modulesWithCourseNames)
        setFilteredModules(modulesWithCourseNames)
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

  // Filtrar módulos baseado na pesquisa
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModules(modules)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = modules.filter(module => 
      module.name.toLowerCase().includes(query) || 
      module.description.toLowerCase().includes(query) ||
      module.course_name?.toLowerCase().includes(query)
    )
    
    setFilteredModules(filtered)
  }, [searchQuery, modules])

  // Ordenar módulos
  useEffect(() => {
    const sorted = [...filteredModules].sort((a, b) => {
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
    
    setFilteredModules(sorted)
  }, [sortField, sortDirection])

  // Gerenciar ordenação
  const handleSort = (field: keyof Module) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Abrir modal de edição
  const handleEditClick = (module: Module) => {
    setSelectedModule(module)
    setFormData({
      name: module.name,
      description: module.description,
      price: String(module.price),
      subject: module.subject || '',
      pdf_path: module.pdf_path || '',
      course_id: String(module.course_id),
      active: module.active
    })
    setIsEditModalOpen(true)
  }

  // Abrir modal de exclusão
  const handleDeleteClick = (module: Module) => {
    setSelectedModule(module)
    setIsDeleteModalOpen(true)
  }

  // Abrir modal de criação
  const handleCreateClick = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      subject: '',
      pdf_path: '',
      course_id: courses.length > 0 ? String(courses[0].id) : '',
      active: true
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
      setError('Por favor, selecione um curso para o módulo.')
      return
    }
    
    try {
      // Prepare data exactly as the backend expects it
      const moduleData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        subject: formData.subject,
        pdf_path: formData.pdf_path,
        course_id: parseInt(formData.course_id)
      }
      
      console.log('Enviando dados para a API:', moduleData)
      
      const result = await createModule(moduleData)
      console.log('Resposta da API após criar módulo:', result)
      
      // Encontrar o curso selecionado para obter o nome
      const course = courses.find(c => c.id === parseInt(formData.course_id))
      
      // Construir um objeto de módulo completo com todos os campos necessários
      const newModule: Module = {
        id: result.id || result.module?.id || Date.now(), // Usar ID retornado ou criar temporário
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        subject: formData.subject,
        pdf_path: formData.pdf_path,
        course_id: parseInt(formData.course_id),
        course_name: course ? course.name : 'Curso não encontrado',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Adicionar novo módulo à lista e atualizar a lista filtrada também
      setModules(prev => {
        const updated = [...prev, newModule]
        setFilteredModules(updated) // Atualizar a lista filtrada também
        return updated
      })
      
      setSuccessMessage('Módulo criado com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setIsCreateModalOpen(false)
    } catch (err) {
      console.error('Erro ao criar módulo:', err)
      setError('Falha ao criar módulo. Por favor, tente novamente.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Enviar formulário de edição
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedModule) return
    
    if (!formData.course_id) {
      setError('Por favor, selecione um curso para o módulo.')
      return
    }
    
    try {
      // Ensure course_id is a number
      const moduleData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        subject: formData.subject,
        pdf_path: formData.pdf_path,
        course_id: parseInt(formData.course_id)
      }
      
      console.log('Enviando dados para atualização:', moduleData)
      
      await updateModule(selectedModule.id, moduleData)
      
      // Atualizar lista de módulos
      const course = courses.find(c => c.id === parseInt(formData.course_id))
      
      const updatedModule: Module = {
        ...selectedModule,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        subject: formData.subject,
        pdf_path: formData.pdf_path,
        course_id: parseInt(formData.course_id),
        course_name: course ? course.name : 'Curso não encontrado',
        updated_at: new Date().toISOString()
      }
      
      // Atualizar tanto a lista principal quanto a filtrada
      const updateLists = (list: Module[]) => 
        list.map(module => module.id === selectedModule.id ? updatedModule : module)
      
      setModules(updateLists)
      setFilteredModules(updateLists)
      
      setSuccessMessage('Módulo atualizado com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setIsEditModalOpen(false)
    } catch (err) {
      console.error('Erro ao atualizar módulo:', err)
      setError('Falha ao atualizar módulo. Por favor, tente novamente.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!selectedModule) return
    
    try {
      await deleteModule(selectedModule.id)
      
      // Remover módulo da lista
      setModules(prev => 
        prev.filter(module => module.id !== selectedModule.id)
      )
      
      setSuccessMessage('Módulo excluído com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setIsDeleteModalOpen(false)
    } catch (err) {
      console.error('Erro ao excluir módulo:', err)
      setError('Falha ao excluir módulo. Por favor, tente novamente.')
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Módulos</h2>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Módulo
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
          placeholder="Buscar por nome, descrição ou curso..."
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
      
      {/* Tabela de módulos */}
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
                  Módulo
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3">Curso</th>
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
            ) : filteredModules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Nenhum módulo encontrado
                </td>
              </tr>
            ) : (
              filteredModules.map(module => (
                <tr key={module.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {module.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 mr-3 rounded flex items-center justify-center overflow-hidden bg-gray-200">
                        <FileText className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p>{module.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{module.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {module.course_name || 'Curso não encontrado'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                      {formatPrice(module.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold flex items-center w-fit",
                        module.active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {module.active ? (
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
                        onClick={() => handleEditClick(module)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(module)}
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
              <h3 className="text-lg font-semibold">Criar Novo Módulo</h3>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-5">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Nome do Módulo</label>
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
                <label className="block mb-2 text-sm font-medium text-gray-900">Assunto</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Caminho do PDF</label>
                <input
                  type="text"
                  name="pdf_path"
                  value={formData.pdf_path}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                />
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
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
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
                  Módulo ativo
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
                  Criar Módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de Edição */}
      {isEditModalOpen && selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold">Editar Módulo</h3>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Nome do Módulo</label>
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
                <label className="block mb-2 text-sm font-medium text-gray-900">Assunto</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Caminho do PDF</label>
                <input
                  type="text"
                  name="pdf_path"
                  value={formData.pdf_path}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                />
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
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
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
                  Módulo ativo
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
      {isDeleteModalOpen && selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
            </div>
            
            <div className="p-5">
              <p className="text-gray-700 mb-4">
                Tem certeza que deseja excluir o módulo <strong>{selectedModule.name}</strong>? 
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