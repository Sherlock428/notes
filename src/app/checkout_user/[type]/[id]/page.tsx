"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface CheckoutRedirectPageProps {
  params: {
    type: string
    id: string
  }
}

export default function CheckoutRedirectPage({ params }: CheckoutRedirectPageProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const { type, id } = params
  
  useEffect(() => {
    async function fetchPlanData() {
      try {
        setLoading(true)
        
        console.log(`Buscando dados do plano: ${type}/${id}`)
        const data = await api.plans.getCheckout(type, parseInt(id))
        
        if (!data || !data.plan) {
          throw new Error("Dados do plano não encontrados")
        }
        
        // Armazenar os dados do plano no sessionStorage
        const planData = {
          id: data.plan.id,
          name: data.plan.name,
          price: data.plan.price,
          planType: type,
          timestamp: Date.now() // Adicionar timestamp para verificar validade posteriormente
        }
        
        sessionStorage.setItem("checkout_plan_data", JSON.stringify(planData))
        
        // Definir um cookie para que o middleware permita acesso à página de checkout
        document.cookie = "has_checkout_data=true; path=/; max-age=600" // 10 minutos
        
        // Redirecionar para a página de checkout sem parâmetros na URL
        router.push("/checkout_user")
      } catch (error) {
        console.error("Erro ao buscar dados do plano:", error)
        setError("Erro ao buscar dados do plano. Por favor, tente novamente.")
        
        // Redirecionar para a home após 3 segundos em caso de erro
        setTimeout(() => {
          router.push("/")
        }, 3000)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPlanData()
  }, [type, id, router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-lg shadow-xl text-white text-center max-w-md">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Preparando seu checkout...</h2>
            <p>Estamos buscando as informações do plano selecionado.</p>
          </>
        ) : error ? (
          <>
            <div className="bg-red-500/20 p-4 rounded-lg mb-4">
              <p className="text-white">{error}</p>
              <p className="text-sm mt-2">Você será redirecionado em instantes.</p>
            </div>
          </>
        ) : (
          <>
            <div className="animate-pulse">
              <svg 
                className="w-12 h-12 mx-auto mb-4 text-green-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h2 className="text-xl font-semibold mb-2">Redirecionando para o checkout...</h2>
              <p>Você será redirecionado automaticamente em instantes.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 