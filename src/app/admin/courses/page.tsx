"use client"

import React, { useState, useEffect } from 'react'
import { useAdminAPI } from '../hooks/useAdminAPI'
import { Search, Edit, Trash2, Plus, Book, ArrowUpDown, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Course {
  id: number
  name: string
  description: string
  image_url: string
  active: boolean
  created_at: string
  updated_at: string
}

export default function CoursesPage() {
  const { createCourse, updateCourse, deleteCourse } = useAdminAPI()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof Course>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    active: true
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Buscar cursos apenas uma vez
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true)
      setError('')
      
      try {
        // Use fetch diretamente para evitar múltiplas chamadas
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/ademin/courses`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('Falha ao buscar cursos')
        }
        
        const data = await response.json()
        console.log('Courses API response:', data) // Debug output
        
        // Check the actual structure of the returned data
        const coursesArray = Array.isArray(data) ? data : 
                            data.courses && Array.isArray(data.courses) ? data.courses : []
        
        setCourses(coursesArray)
        setFilteredCourses(coursesArray)
      } catch (err) {
        console.error('Erro ao buscar cursos:', err)
        setError('Falha ao carregar cursos. Por favor, tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCourses()
  }, [])

  // Filtrar cursos baseado na pesquisa
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCourses(courses)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = courses.filter(course => 
      course.name.toLowerCase().includes(query) || 
      course.description.toLowerCase().includes(query)
    )
    
    setFilteredCourses(filtered)
  }, [searchQuery, courses])

  // Ordenar cursos
  useEffect(() => {
    const sorted = [...filteredCourses].sort((a, b) => {
      const fieldA = a[sortField]
      const fieldB = b[sortField]
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA)
      }
      
      if (typeof fieldA === 'boolean' && typeof fieldB === 'boolean') {
        return sortDirection === 'asc'
          ? Number(fieldA) - Number(fieldB)
          : Number(fieldB) - Number(fieldA)
      }
      
      return 0
    })
    
    setFilteredCourses(sorted)
  }, [sortField, sortDirection])

  // Gerenciar ordenação
  const handleSort = (field: keyof Course) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Abrir modal de edição
  const handleEditClick = (course: Course) => {
    setSelectedCourse(course)
    setFormData({
      name: course.name,
      description: course.description,
      image_url: course.image_url,
      active: course.active
    })
    setIsEditModalOpen(true)
  }

  // Abrir modal de exclusão
  const handleDeleteClick = (course: Course) => {
    setSelectedCourse(course)
    setIsDeleteModalOpen(true)
  }

  // Abrir modal de criação
  const handleCreateClick = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      active: true
    })
    setIsCreateModalOpen(true)
  }

  // Atualizar dados do formulário
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }))
  }

  // Enviar formulário de criação
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const result = await createCourse(formData)
      
      // Adicionar novo curso à lista
      setCourses(prev => [...prev, result.course])
      
      setSuccessMessage('Curso criado com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setIsCreateModalOpen(false)
    } catch (err) {
      console.error('Erro ao criar curso:', err)
      setError('Falha ao criar curso. Por favor, tente novamente.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Enviar formulário de edição
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCourse) return
    
    try {
      await updateCourse(selectedCourse.id, formData)
      
      // Atualizar lista de cursos
      setCourses(prev => 
        prev.map(course => 
          course.id === selectedCourse.id 
            ? { ...course, ...formData, updated_at: new Date().toISOString() } 
            : course
        )
      )
      
      setSuccessMessage('Curso atualizado com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setIsEditModalOpen(false)
    } catch (err) {
      console.error('Erro ao atualizar curso:', err)
      setError('Falha ao atualizar curso. Por favor, tente novamente.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return
    
    try {
      await deleteCourse(selectedCourse.id)
      
      // Remover curso da lista
      setCourses(prev => 
        prev.filter(course => course.id !== selectedCourse.id)
      )
      
      setSuccessMessage('Curso excluído com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setIsDeleteModalOpen(false)
    } catch (err) {
      console.error('Erro ao excluir curso:', err)
      setError('Falha ao excluir curso. Por favor, tente novamente.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Formatação de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Cursos</h2>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Curso
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
      
      {/* Tabela de cursos */}
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
                  Curso
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3">Descrição</th>
              <th scope="col" className="px-6 py-3">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('active')}
                >
                  Status
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('created_at')}
                >
                  Data de Criação
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </button>
              </th>
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
            ) : filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  Nenhum curso encontrado
                </td>
              </tr>
            ) : (
              filteredCourses.map(course => (
                <tr key={course.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {course.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 mr-3 rounded flex items-center justify-center overflow-hidden bg-gray-200">
                        {course.image_url ? (
                          <img 
                            src={course.image_url} 
                            alt={course.name} 
                            className="w-10 h-10 object-cover"
                          />
                        ) : (
                          <Book className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <span>{course.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="truncate max-w-xs">{course.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold flex items-center w-fit",
                        course.active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {course.active ? (
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
                    {formatDate(course.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(course)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(course)}
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
              <h3 className="text-lg font-semibold">Criar Novo Curso</h3>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-5">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Nome do Curso</label>
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
                  rows={4}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">URL da Imagem</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                />
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
                  Curso ativo
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
                  Criar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de Edição */}
      {isEditModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold">Editar Curso</h3>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">Nome do Curso</label>
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
                  rows={4}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-900">URL da Imagem</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleFormChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                />
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
                  Curso ativo
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
      {isDeleteModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
            </div>
            
            <div className="p-5">
              <p className="text-gray-700 mb-4">
                Tem certeza que deseja excluir o curso <strong>{selectedCourse.name}</strong>? 
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