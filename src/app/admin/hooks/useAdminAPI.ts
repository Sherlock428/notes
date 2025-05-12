"use client"

import { useCallback } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export function useAdminAPI() {
  
  // Dashboard statistics
  const getDashboardStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/dashboard`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao buscar estatísticas do dashboard')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error)
      throw error
    }
  }, [])

  // Module statistics for dashboard
  const getModuleStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/dashboard/stats/modules`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao buscar estatísticas de módulos')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar estatísticas de módulos:', error)
      throw error
    }
  }, [])

  // Subscription statistics for dashboard
  const getSubscriptionStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/dashboard/stats/subs`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao buscar estatísticas de assinaturas')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar estatísticas de assinaturas:', error)
      throw error
    }
  }, [])

  // Users
  const getUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/users`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao buscar usuários')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      throw error
    }
  }, [])

  const getUserShoppings = useCallback(async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/shoppings/${userId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao buscar compras do usuário')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar compras do usuário:', error)
      throw error
    }
  }, [])

  const updateUser = useCallback(async (userId: number, userData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/edit/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar usuário')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      throw error
    }
  }, [])

  // Courses
  const getCourses = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/courses`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao buscar cursos')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar cursos:', error)
      throw error
    }
  }, [])

  const createCourse = useCallback(async (courseData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/courses/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao criar curso')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao criar curso:', error)
      throw error
    }
  }, [])

  const updateCourse = useCallback(async (courseId: number, courseData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/courses/edit/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar curso')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao atualizar curso:', error)
      throw error
    }
  }, [])

  const deleteCourse = useCallback(async (courseId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/courses/${courseId}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao excluir curso')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao excluir curso:', error)
      throw error
    }
  }, [])

  // Modules
  const getModules = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/modules`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao buscar módulos')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar módulos:', error)
      throw error
    }
  }, [])

  const createModule = useCallback(async (moduleData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/modules/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao criar módulo')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao criar módulo:', error)
      throw error
    }
  }, [])

  const updateModule = useCallback(async (moduleId: number, moduleData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/modules/edit/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar módulo')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error)
      throw error
    }
  }, [])

  const deleteModule = useCallback(async (moduleId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/modules/delete/${moduleId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao excluir módulo')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao excluir módulo:', error)
      throw error
    }
  }, [])

  // Subscriptions
  const getSubscriptions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/subscribes`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao buscar assinaturas')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error)
      throw error
    }
  }, [])

  const createSubscription = useCallback(async (subscriptionData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/subscribes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao criar assinatura')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao criar assinatura:', error)
      throw error
    }
  }, [])

  const updateSubscription = useCallback(async (subscriptionId: number, subscriptionData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/subscribes/edit/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar assinatura')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error)
      throw error
    }
  }, [])

  const deleteSubscription = useCallback(async (subscriptionId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ademin/subscribes/delete/${subscriptionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao excluir assinatura')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erro ao excluir assinatura:', error)
      throw error
    }
  }, [])

  return {
    // Dashboard
    getDashboardStats,
    getModuleStats,
    getSubscriptionStats,
    
    // Users
    getUsers,
    getUserShoppings,
    updateUser,
    
    // Courses
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    
    // Modules
    getModules,
    createModule,
    updateModule,
    deleteModule,
    
    // Subscriptions
    getSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
  }
} 