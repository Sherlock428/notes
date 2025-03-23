"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CreditCard, ArrowLeft, AlertCircle, CheckCircle, Clock, XCircle, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Tipos de status de pagamento para simulação
type PaymentStatus =
  | "approved"
  | "general_error"
  | "pending"
  | "requires_authorization"
  | "insufficient_amount"
  | "invalid_security_code"
  | "invalid_expiry_date"
  | "form_error"

interface PaymentFormData {
  cardNumber: string
  cardExpiry: string
  cardCvc: string
  nameOnCard: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const subject = searchParams.get("subject") || ""
  const module = searchParams.get("module") || ""

  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    nameOnCard: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)

  // Preço simulado
  const price = "R$19,90"

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim()
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 16) {
      setFormData((prev) => ({ ...prev, cardNumber: formatCardNumber(value) }))
    }
  }

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")

    if (value.length > 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4)
    }

    if (value.length <= 5) {
      setFormData((prev) => ({ ...prev, cardExpiry: value }))
    }
  }

  const handleCardCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 3) {
      setFormData((prev) => ({ ...prev, cardCvc: value }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.cardNumber.trim()) newErrors.cardNumber = "Número do cartão é obrigatório"
    else if (formData.cardNumber.replace(/\s/g, "").length < 16) newErrors.cardNumber = "Número do cartão inválido"

    if (!formData.cardExpiry.trim()) newErrors.cardExpiry = "Data de validade é obrigatória"
    else if (!/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) newErrors.cardExpiry = "Formato inválido (MM/AA)"

    if (!formData.cardCvc.trim()) newErrors.cardCvc = "CVC é obrigatório"
    else if (formData.cardCvc.length < 3) newErrors.cardCvc = "CVC inválido"

    if (!formData.nameOnCard.trim()) newErrors.nameOnCard = "Nome no cartão é obrigatório"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Função para simular diferentes resultados de pagamento com base no número do cartão
  const simulatePaymentResult = (cardNumber: string): PaymentStatus => {
    const lastDigits = cardNumber.replace(/\s/g, "").slice(-2)
    const lastDigit = Number.parseInt(lastDigits.charAt(1))

    switch (lastDigit) {
      case 1:
        return "approved"
      case 2:
        return "general_error"
      case 3:
        return "pending"
      case 4:
        return "requires_authorization"
      case 5:
        return "insufficient_amount"
      case 6:
        return "invalid_security_code"
      case 7:
        return "invalid_expiry_date"
      case 8:
        return "form_error"
      default:
        return "approved"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)

      // Simular processamento de pagamento
      setTimeout(() => {
        const result = simulatePaymentResult(formData.cardNumber)
        setPaymentStatus(result)
        setIsSubmitting(false)
      }, 2000)
    }
  }

  const handleBackToHome = () => {
    router.push("/home")
  }

  const handleTryAgain = () => {
    setPaymentStatus(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 relative">
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Light particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-md mx-auto">
          <Button
            variant="outline"
            className="mb-6 bg-white/10 text-white border-white/30 hover:bg-white/30"
            onClick={handleBackToHome}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none">
              <CardHeader className="bg-indigo-600 text-white p-6">
                <CardTitle className="flex items-center text-xl">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Finalizar Compra
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                {/* Resumo da compra */}
                <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-gray-800 mb-2">Resumo da compra</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-indigo-700">{module}</p>
                      <p className="text-sm text-gray-600">Módulo individual - {subject}</p>
                    </div>
                    <p className="font-bold text-indigo-700">{price}</p>
                  </div>
                </div>

                {/* Status de pagamento */}
                {paymentStatus && (
                  <div className={`mb-6 p-4 rounded-lg ${getStatusBackgroundColor(paymentStatus)}`}>
                    <div className="flex items-start">
                      {getStatusIcon(paymentStatus)}
                      <div className="ml-3">
                        <h3 className={`font-semibold ${getStatusTextColor(paymentStatus)}`}>
                          {getStatusTitle(paymentStatus)}
                        </h3>
                        <p className={`text-sm ${getStatusDescriptionColor(paymentStatus)}`}>
                          {getStatusDescription(paymentStatus)}
                        </p>

                        {paymentStatus !== "approved" && paymentStatus !== "pending" && (
                          <Button
                            className="mt-3 bg-white hover:bg-gray-100 text-gray-800"
                            size="sm"
                            onClick={handleTryAgain}
                          >
                            Tentar novamente
                          </Button>
                        )}

                        {paymentStatus === "approved" && (
                          <Button
                            className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                            onClick={handleBackToHome}
                          >
                            Acessar conteúdo
                          </Button>
                        )}

                        {paymentStatus === "pending" && (
                          <Button
                            className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                            size="sm"
                            onClick={handleBackToHome}
                          >
                            Voltar para home
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulário de pagamento */}
                {!paymentStatus && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-indigo-600 mr-2" />
                        <span className="font-medium">Cartão de crédito</span>
                      </div>
                      <div className="flex space-x-2">
                        <img src="/placeholder.svg?height=24&width=36" alt="Visa" className="h-6" />
                        <img src="/placeholder.svg?height=24&width=36" alt="Mastercard" className="h-6" />
                        <img src="/placeholder.svg?height=24&width=36" alt="Amex" className="h-6" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nameOnCard">Nome no cartão</Label>
                      <Input
                        id="nameOnCard"
                        name="nameOnCard"
                        placeholder="Nome como aparece no cartão"
                        value={formData.nameOnCard}
                        onChange={handleChange}
                      />
                      {errors.nameOnCard && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.nameOnCard}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Número do cartão</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={handleCardNumberChange}
                      />
                      {errors.cardNumber && (
                        <p className="text-red-500 text-sm flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.cardNumber}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardExpiry">Validade</Label>
                        <Input
                          id="cardExpiry"
                          name="cardExpiry"
                          placeholder="MM/AA"
                          value={formData.cardExpiry}
                          onChange={handleCardExpiryChange}
                        />
                        {errors.cardExpiry && (
                          <p className="text-red-500 text-sm flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.cardExpiry}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardCvc">CVC</Label>
                        <Input
                          id="cardCvc"
                          name="cardCvc"
                          placeholder="123"
                          value={formData.cardCvc}
                          onChange={handleCardCvcChange}
                        />
                        {errors.cardCvc && (
                          <p className="text-red-500 text-sm flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.cardCvc}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Processando..." : `Pagar ${price}`}
                      </Button>
                    </div>

                    <div className="text-center text-sm text-gray-500 mt-4">
                      <p>Para testar diferentes resultados de pagamento, use cartões que terminem com:</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div>1: Aprovado</div>
                        <div>2: Erro geral</div>
                        <div>3: Pendente</div>
                        <div>4: Requer autorização</div>
                        <div>5: Saldo insuficiente</div>
                        <div>6: CVC inválido</div>
                        <div>7: Data expirada</div>
                        <div>8: Erro no formulário</div>
                      </div>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Funções auxiliares para os diferentes status de pagamento
function getStatusBackgroundColor(status: PaymentStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-50"
    case "pending":
      return "bg-amber-50"
    default:
      return "bg-red-50"
  }
}

function getStatusTextColor(status: PaymentStatus): string {
  switch (status) {
    case "approved":
      return "text-green-800"
    case "pending":
      return "text-amber-800"
    default:
      return "text-red-800"
  }
}

function getStatusDescriptionColor(status: PaymentStatus): string {
  switch (status) {
    case "approved":
      return "text-green-700"
    case "pending":
      return "text-amber-700"
    default:
      return "text-red-700"
  }
}

function getStatusIcon(status: PaymentStatus) {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
    case "pending":
      return <Clock className="h-6 w-6 text-amber-600 flex-shrink-0" />
    case "requires_authorization":
      return <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0" />
    default:
      return <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
  }
}

function getStatusTitle(status: PaymentStatus): string {
  switch (status) {
    case "approved":
      return "Pagamento aprovado!"
    case "general_error":
      return "Erro no pagamento"
    case "pending":
      return "Pagamento pendente"
    case "requires_authorization":
      return "Autorização necessária"
    case "insufficient_amount":
      return "Saldo insuficiente"
    case "invalid_security_code":
      return "Código de segurança inválido"
    case "invalid_expiry_date":
      return "Data de validade inválida"
    case "form_error":
      return "Erro no formulário"
    default:
      return "Erro no pagamento"
  }
}

function getStatusDescription(status: PaymentStatus): string {
  switch (status) {
    case "approved":
      return "Seu pagamento foi processado com sucesso. Você já pode acessar o conteúdo adquirido."
    case "general_error":
      return "Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente."
    case "pending":
      return "Seu pagamento está sendo processado. Você receberá uma notificação quando for concluído."
    case "requires_authorization":
      return "Seu banco requer autorização adicional para esta transação. Por favor, verifique o app do seu banco."
    case "insufficient_amount":
      return "Seu cartão não possui saldo suficiente para completar esta transação."
    case "invalid_security_code":
      return "O código de segurança (CVC) informado é inválido. Verifique e tente novamente."
    case "invalid_expiry_date":
      return "A data de validade do cartão é inválida. Verifique e tente novamente."
    case "form_error":
      return "Há erros no formulário de pagamento. Por favor, verifique os dados e tente novamente."
    default:
      return "Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente."
  }
}

