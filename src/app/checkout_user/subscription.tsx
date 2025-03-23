"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface SubscriptionPageProps {
  params: {
    id: string
  }
}

export default function SubscriptionPage({ params }: SubscriptionPageProps) {
  const router = useRouter()
  const { id } = params

  useEffect(() => {
    // Redirecionar para a página de checkout com os parâmetros corretos
    router.push(`/checkout_user?planType=assinatura&planId=${id}`)
  }, [id, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-lg shadow-xl text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Redirecionando...</h2>
        <p>Você será redirecionado para o checkout em instantes.</p>
      </div>
    </div>
  )
} 