"use client"

import React, { useEffect, useState } from 'react'
import { Users, BookOpen, DollarSign, Calendar, TrendingUp, ShoppingCart, Package, Filter } from 'lucide-react'
import Card from '../components/Card'
import { useAdminAPI } from '../hooks/useAdminAPI'

interface DashboardStats {
  total_user: number
  total_courses: number
  modules_solds: number
  active_subs: number
  total_revenue: number
  revenue_month: Record<string, number>
  revenue_year: Record<string, number>
}

interface ModuleStats {
  modules_vendas_diarias: Array<{ dia: string, vendas: number }>
  modules_vendas_mensais: Array<{ mês: string, vendas: number }>
  modules_vendas_anuais: Array<{ ano: number, vendas: number }>
}

interface SubStats {
  subs_vendas_diarias?: Array<{ dia: string, vendas: number }>
  subs_vendas_mensais?: Array<{ mês: string, vendas: number }>
  subs_vendas_anuais?: Array<{ ano: number, vendas: number }>
  vendas_mensais?: Array<{ mês?: string, mes?: string, vendas: number }>
  [key: string]: any // Allow any additional properties
}

type TimeFilter = 'daily' | 'monthly' | 'yearly'

export default function Dashboard() {
  const { getDashboardStats, getModuleStats, getSubscriptionStats } = useAdminAPI()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [moduleStats, setModuleStats] = useState<ModuleStats | null>(null)
  const [subStats, setSubStats] = useState<SubStats | null>(null)
  const [error, setError] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly')
  
  // Filtros de data
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate())

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError('')
      
      try {
        // Use fetch diretamente para evitar múltiplas chamadas
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        
        const [dashboardResponse, moduleStatsResponse, subStatsResponse] = await Promise.all([
          fetch(`${apiUrl}/ademin/dashboard`, { credentials: 'include' }),
          fetch(`${apiUrl}/ademin/dashboard/stats/modules`, { credentials: 'include' }),
          fetch(`${apiUrl}/ademin/dashboard/stats/subs`, { credentials: 'include' })
        ])
        
        // Verificar respostas
        if (!dashboardResponse.ok) throw new Error('Falha ao buscar estatísticas do dashboard')
        if (!moduleStatsResponse.ok) throw new Error('Falha ao buscar estatísticas de módulos')
        if (!subStatsResponse.ok) throw new Error('Falha ao buscar estatísticas de assinaturas')
        
        // Converter para JSON
        const dashboardData = await dashboardResponse.json()
        const moduleData = await moduleStatsResponse.json()
        const subData = await subStatsResponse.json()
        
        console.log('Dashboard data:', dashboardData)
        console.log('Module stats:', moduleData)
        console.log('Subscription stats:', subData)
        
        setStats(dashboardData)
        setModuleStats(moduleData)
        setSubStats(subData)
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err)
        setError('Falha ao carregar dados do dashboard. Por favor, tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Formatar números para moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Calcular métricas adicionais
  const calculateMonthlyRevenue = () => {
    if (!stats || !stats.revenue_month) return 0
    
    const currentDate = new Date()
    const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    return stats.revenue_month[yearMonth] || 0
  }
  
  const calculateTotalModuleSales = () => {
    if (!moduleStats) return 0
    
    if (timeFilter === 'daily') {
      return moduleStats.modules_vendas_diarias.reduce((total, item) => total + item.vendas, 0)
    } else if (timeFilter === 'monthly') {
      return moduleStats.modules_vendas_mensais.reduce((total, item) => total + item.vendas, 0)
    } else {
      return moduleStats.modules_vendas_anuais.reduce((total, item) => total + item.vendas, 0)
    }
  }
  
  const calculateTotalSubSales = () => {
    if (!subStats) return 0
    
    if (timeFilter === 'daily') {
      return (subStats.subs_vendas_diarias || []).reduce((total, item) => total + item.vendas, 0)
    } else if (timeFilter === 'monthly') {
      if (subStats.subs_vendas_mensais) {
        return subStats.subs_vendas_mensais.reduce((total, item) => total + item.vendas, 0)
      } else if (subStats.vendas_mensais) {
        return subStats.vendas_mensais.reduce((total, item) => total + item.vendas, 0)
      }
    } else {
      return (subStats.subs_vendas_anuais || []).reduce((total, item) => total + item.vendas, 0)
    }
    
    return 0
  }

  // Filtrar dados baseado no período selecionado
  const getFilteredModuleSales = () => {
    if (!moduleStats) return []
    
    if (timeFilter === 'daily') {
      return moduleStats.modules_vendas_diarias
    } else if (timeFilter === 'monthly') {
      return moduleStats.modules_vendas_mensais
    } else {
      return moduleStats.modules_vendas_anuais
    }
  }

  const getFilteredSubSales = () => {
    if (!subStats) return []
    
    if (timeFilter === 'daily') {
      return subStats.subs_vendas_diarias || []
    } else if (timeFilter === 'monthly') {
      return subStats.subs_vendas_mensais || subStats.vendas_mensais || []
    } else {
      return subStats.subs_vendas_anuais || []
    }
  }

  const getFilteredRevenue = () => {
    if (!stats) return []
    
    if (timeFilter === 'monthly') {
      return Object.entries(stats.revenue_month || {}).map(([month, value]) => ({
        period: month,
        value
      }))
    } else if (timeFilter === 'yearly') {
      return Object.entries(stats.revenue_year || {}).map(([year, value]) => ({
        period: year,
        value
      }))
    }
    
    return []
  }

  // Gerar anos, meses e dias para seleção
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ]
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }
  
  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) }, 
    (_, i) => i + 1
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  const monthlyRevenue = calculateMonthlyRevenue()
  const totalModuleSales = calculateTotalModuleSales()
  const totalSubSales = calculateTotalSubSales()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
      
      {/* Cards informativos principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Total de Usuários" 
          value={stats?.total_user || 0} 
          icon={<Users size={24} />} 
        />
        <Card 
          title="Total de Cursos" 
          value={stats?.total_courses || 0} 
          icon={<BookOpen size={24} />} 
        />
        <Card 
          title="Módulos Vendidos" 
          value={stats?.modules_solds || 0} 
          icon={<Package size={24} />} 
        />
        <Card 
          title="Assinaturas Ativas" 
          value={stats?.active_subs || 0} 
          icon={<Calendar size={24} />} 
        />
      </div>
      
      {/* Receitas e métricas financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="h-8 w-8 text-indigo-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-800">Receita Total</h3>
          </div>
          <p className="text-3xl font-bold text-indigo-600">
            {stats ? formatCurrency(stats.total_revenue) : 'R$ 0,00'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-800">Receita do Mês</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(monthlyRevenue)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-800">Vendas Mensais</h3>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-600 mb-1">Módulos</p>
              <p className="text-xl font-bold text-blue-600">{totalModuleSales}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Assinaturas</p>
              <p className="text-xl font-bold text-blue-600">{totalSubSales}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtros de tempo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-3 md:mb-0">Filtros de Período</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <button
                onClick={() => setTimeFilter('daily')}
                className={`px-3 py-1 rounded-md ${timeFilter === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Diário
              </button>
              <button
                onClick={() => setTimeFilter('monthly')}
                className={`px-3 py-1 rounded-md mx-2 ${timeFilter === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setTimeFilter('yearly')}
                className={`px-3 py-1 rounded-md ${timeFilter === 'yearly' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Anual
              </button>
            </div>
            
            {timeFilter === 'daily' && (
              <div className="flex flex-wrap gap-2">
                <select 
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
                
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            
            {timeFilter === 'monthly' && (
              <div className="flex flex-wrap gap-2">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
                
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            
            {timeFilter === 'yearly' && (
              <div className="flex flex-wrap gap-2">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3">{timeFilter === 'daily' ? 'Dia' : timeFilter === 'monthly' ? 'Mês' : 'Ano'}</th>
                <th scope="col" className="px-4 py-3">Receita</th>
                <th scope="col" className="px-4 py-3">Módulos Vendidos</th>
                <th scope="col" className="px-4 py-3">Assinaturas Vendidas</th>
              </tr>
            </thead>
            <tbody>
              {timeFilter === 'daily' && moduleStats?.modules_vendas_diarias.map((item, index) => {
                const subItem = (subStats?.subs_vendas_diarias || []).find(s => s.dia === item.dia) || { vendas: 0 }
                
                // Verificar se o dia corresponde ao filtro selecionado
                const [itemYear, itemMonth, itemDay] = item.dia.split('-').map(Number)
                if (itemYear !== selectedYear || itemMonth !== selectedMonth) return null
                
                return (
                  <tr key={`daily-${index}`} className="bg-white border-b">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.dia}</td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3">{item.vendas}</td>
                    <td className="px-4 py-3">{subItem.vendas}</td>
                  </tr>
                )
              })}
              
              {timeFilter === 'monthly' && getFilteredRevenue().map((item, index) => {
                const [year, month] = item.period.split('-')
                const monthNum = Number(month)
                
                // Verificar se o mês corresponde ao filtro selecionado
                if (Number(year) !== selectedYear) return null
                
                const moduleItem = moduleStats?.modules_vendas_mensais.find(m => m.mês.includes(month)) || { vendas: 0 }
                
                let subItem = { vendas: 0 }
                if (subStats?.subs_vendas_mensais) {
                  subItem = subStats.subs_vendas_mensais.find(s => (s.mês || '').includes(month)) || { vendas: 0 }
                } else if (subStats?.vendas_mensais) {
                  subItem = subStats.vendas_mensais.find(s => (s.mês || s.mes || '').includes(month)) || { vendas: 0 }
                }
                
                const monthName = months.find(m => m.value === monthNum)?.label || month
                
                return (
                  <tr key={`monthly-${index}`} className="bg-white border-b">
                    <td className="px-4 py-3 font-medium text-gray-900">{`${monthName}/${year}`}</td>
                    <td className="px-4 py-3">{formatCurrency(item.value)}</td>
                    <td className="px-4 py-3">{moduleItem.vendas}</td>
                    <td className="px-4 py-3">{subItem.vendas}</td>
                  </tr>
                )
              })}
              
              {timeFilter === 'yearly' && getFilteredRevenue().map((item, index) => {
                const year = item.period
                
                // Verificar se o ano corresponde ao filtro selecionado
                if (Number(year) !== selectedYear) return null
                
                const moduleItem = moduleStats?.modules_vendas_anuais.find(m => m.ano === Number(year)) || { vendas: 0 }
                const subItem = (subStats?.subs_vendas_anuais || []).find(s => s.ano === Number(year)) || { vendas: 0 }
                
                return (
                  <tr key={`yearly-${index}`} className="bg-white border-b">
                    <td className="px-4 py-3 font-medium text-gray-900">{year}</td>
                    <td className="px-4 py-3">{formatCurrency(item.value)}</td>
                    <td className="px-4 py-3">{moduleItem.vendas}</td>
                    <td className="px-4 py-3">{subItem.vendas}</td>
                  </tr>
                )
              })}
              
              {((timeFilter === 'daily' && (!moduleStats?.modules_vendas_diarias || moduleStats.modules_vendas_diarias.length === 0)) ||
                 (timeFilter === 'monthly' && getFilteredRevenue().length === 0) ||
                 (timeFilter === 'yearly' && getFilteredRevenue().length === 0)) && (
                <tr className="bg-white border-b">
                  <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                    Nenhum dado disponível para o período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Cards de estatísticas de vendas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Estatísticas de Módulos</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-gray-700">Total de Módulos Vendidos:</span>
              <span className="font-bold text-indigo-600">{stats?.modules_solds || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-gray-700">Vendas Diárias (Média):</span>
              <span className="font-bold text-indigo-600">
                {(() => {
                  if (!moduleStats || !moduleStats.modules_vendas_diarias) return '0';
                  const vendas = moduleStats.modules_vendas_diarias;
                  const total = vendas.reduce((sum, item) => sum + item.vendas, 0);
                  const count = Math.max(1, vendas.length);
                  return (total / count).toFixed(1);
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-gray-700">Vendas Mensais (Média):</span>
              <span className="font-bold text-indigo-600">
                {(() => {
                  if (!moduleStats || !moduleStats.modules_vendas_mensais) return '0';
                  const vendas = moduleStats.modules_vendas_mensais;
                  const total = vendas.reduce((sum, item) => sum + item.vendas, 0);
                  const count = Math.max(1, vendas.length);
                  return (total / count).toFixed(1);
                })()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Estatísticas de Assinaturas</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-gray-700">Total de Assinaturas Ativas:</span>
              <span className="font-bold text-indigo-600">{stats?.active_subs || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-gray-700">Vendas Diárias (Média):</span>
              <span className="font-bold text-indigo-600">
                {(() => {
                  if (!subStats || !subStats.subs_vendas_diarias) return '0';
                  const vendas = subStats.subs_vendas_diarias;
                  const total = vendas.reduce((sum, item) => sum + item.vendas, 0);
                  const count = Math.max(1, vendas.length);
                  return (total / count).toFixed(1);
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="font-medium text-gray-700">Vendas Mensais (Média):</span>
              <span className="font-bold text-indigo-600">
                {(() => {
                  if (!subStats) return '0';
                  const vendas = subStats.subs_vendas_mensais || subStats.vendas_mensais;
                  if (!vendas) return '0';
                  const total = vendas.reduce((sum, item) => sum + item.vendas, 0);
                  const count = Math.max(1, vendas.length);
                  return (total / count).toFixed(1);
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 