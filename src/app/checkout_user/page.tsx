"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CreditCard, ArrowLeft, AlertCircle, CheckCircle, Clock, XCircle, ShieldAlert, QrCode } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, loadMercadoPagoSDK } from "@/lib/api"

// Declarar o tipo global para o MercadoPago
declare global {
  interface Window {
    MercadoPago?: any
  }
}

// Tipos de status de pagamento
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
  cpf: string
  email: string
  identificationNumber: string
}

// Componente para renderizar partículas de fundo (evitando erro de hidratação)
const BackgroundParticles = () => {
  const [particles, setParticles] = useState<Array<{
    width: string;
    height: string;
    top: string;
    left: string;
    animation: string;
    opacity: number;
  }>>([]);
  
  useEffect(() => {
    // Gerar partículas apenas no cliente para evitar erro de hidratação
    const newParticles = Array.from({ length: 20 }, () => ({
      width: `${Math.random() * 10 + 5}px`,
      height: `${Math.random() * 10 + 5}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animation: `float ${Math.random() * 10 + 10}s linear infinite`,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    
    setParticles(newParticles);
  }, []);
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: particle.width,
            height: particle.height,
            top: particle.top,
            left: particle.left,
            animation: particle.animation,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  );
};

// Componente para o formulário do Mercado Pago
const MercadoPagoForm = ({ planData, onPaymentStatusChange }: { 
  planData: any, 
  onPaymentStatusChange: (status: PaymentStatus) => void 
}) => {
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!planData) return;
    
    async function initMercadoPago() {
      try {
        // Carregar o SDK do Mercado Pago
        await loadMercadoPagoSDK();
        
        if (!window.MercadoPago) {
          console.error("MercadoPago não disponível após carregamento");
          return;
        }
        
        if (!formContainerRef.current) return;
        
        // Criar elementos do formulário
        const planForm = document.createElement('form');
        planForm.id = 'form-checkout__plan';
        planForm.dataset.planType = planData.planType || "modulo";
        planForm.dataset.planId = planData.id?.toString() || "0";
        planForm.dataset.planPrice = String(planData.price || 0);
        
        const checkoutForm = document.createElement('form');
        checkoutForm.id = 'form-checkout';
        
        // Limpar e adicionar ao container
        formContainerRef.current.innerHTML = '';
        formContainerRef.current.appendChild(planForm);
        formContainerRef.current.appendChild(checkoutForm);
        
        // Criar elementos do formulário
        const elements = [
          { type: 'div', id: 'form-checkout__cardNumber', className: 'container h-10 border rounded-md mb-2' },
          { type: 'div', id: 'form-checkout__expirationDate', className: 'container h-10 border rounded-md mb-2' },
          { type: 'div', id: 'form-checkout__securityCode', className: 'container h-10 border rounded-md mb-2' },
          { type: 'input', id: 'form-checkout__cardholderName', className: 'h-10 border rounded-md w-full px-3 mb-2', placeholder: 'Titular do cartão' },
          { type: 'select', id: 'form-checkout__issuer', className: 'h-10 border rounded-md w-full px-3 mb-2' },
          { type: 'select', id: 'form-checkout__installments', className: 'h-10 border rounded-md w-full px-3 mb-2' },
          { type: 'select', id: 'form-checkout__identificationType', className: 'h-10 border rounded-md w-full px-3 mb-2' },
          { type: 'input', id: 'form-checkout__identificationNumber', className: 'h-10 border rounded-md w-full px-3 mb-2', placeholder: 'Número do documento' },
          { type: 'input', id: 'form-checkout__cardholderEmail', className: 'h-10 border rounded-md w-full px-3 mb-2', placeholder: 'E-mail' },
          { type: 'button', id: 'form-checkout__submit', className: 'w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md mt-4', textContent: `Pagar R$${planData.price?.toFixed(2).replace(".", ",")}` },
          { type: 'progress', className: 'progress-bar w-full', value: '0', textContent: 'Carregando...' }
        ];
        
        // Adicionar elementos ao formulário
        elements.forEach(el => {
          const element = document.createElement(el.type as any);
          element.id = el.id;
          if (el.className) element.className = el.className;
          if (el.placeholder) (element as HTMLInputElement).placeholder = el.placeholder;
          if (el.value) (element as HTMLInputElement).value = el.value;
          if (el.textContent) element.textContent = el.textContent;
          if (el.type === 'button') element.setAttribute('type', 'submit');
          if (el.type === 'progress') element.setAttribute('value', el.value || '0');
          
          checkoutForm.appendChild(element);
        });
        
        // Inicializar o Mercado Pago com a chave pública
        const mp = new window.MercadoPago("TEST-45341c68-f08c-480b-b607-ee6aa4b1bc8b", {
          locale: 'pt-BR'
        });
        
        const amount = String(planData.price || 0);
        
        console.log("Inicializando cardForm com:", { 
          planType: planData.planType, 
          planId: planData.id, 
          amount 
        });
        
        // Criar o cardForm
        const cardForm = mp.cardForm({
          amount,
          iframe: true,
          form: {
            id: "form-checkout",
            cardNumber: {
              id: "form-checkout__cardNumber",
              placeholder: "Número do cartão",
            },
            expirationDate: {
              id: "form-checkout__expirationDate",
              placeholder: "MM/YY",
            },
            securityCode: {
              id: "form-checkout__securityCode",
              placeholder: "Código de segurança",
            },
            cardholderName: {
              id: "form-checkout__cardholderName",
              placeholder: "Titular do cartão",
            },
            issuer: {
              id: "form-checkout__issuer",
              placeholder: "Banco emissor",
            },
            installments: {
              id: "form-checkout__installments",
              placeholder: "Parcelas",
            },
            identificationType: {
              id: "form-checkout__identificationType",
              placeholder: "Tipo de documento",
            },
            identificationNumber: {
              id: "form-checkout__identificationNumber",
              placeholder: "Número do documento",
            },
            cardholderEmail: {
              id: "form-checkout__cardholderEmail",
              placeholder: "E-mail",
            },
          },
          callbacks: {
            onFormMounted: (error: any) => {
              if (error) {
                console.error("Erro ao montar formulário:", error);
                return;
              }
              console.log("Formulário montado com sucesso");
            },
            onSubmit: (event: Event) => {
              event.preventDefault();
              
              try {
                const formData = cardForm.getCardFormData();
                console.log("Dados do formulário:", formData);
                
                // Mostrar processando
                onPaymentStatusChange("pending");
                
                api.payments.processPayment({
                  planType: planData.planType || "modulo",
                  planID: planData.id || 0,
                  token: formData.token,
                  issuer_id: formData.issuerId,
                  payment_method_id: formData.paymentMethodId,
                  transaction_amount: Number(formData.amount),
                  installments: Number(formData.installments),
                  description: `Pagamento de ${planData.name || "Produto"}`,
                  payer: {
                    email: formData.cardholderEmail,
                    identification: {
                      type: formData.identificationType,
                      number: formData.identificationNumber,
                    },
                  },
                })
                .then(response => {
                  console.log("Resposta do processamento:", response);
                  onPaymentStatusChange("approved");
                })
                .catch(error => {
                  console.error("Erro no processamento:", error);
                  onPaymentStatusChange("general_error");
                });
              } catch (error) {
                console.error("Erro ao obter dados do formulário:", error);
                onPaymentStatusChange("form_error");
              }
            },
            onFetching: (resource: string) => {
              console.log("Buscando recurso:", resource);
              
              const progressBar = document.querySelector(".progress-bar");
              if (progressBar) {
                progressBar.removeAttribute("value");
              }
              
              return () => {
                if (progressBar) {
                  progressBar.setAttribute("value", "0");
                }
              };
            }
          },
        });
      } catch (error) {
        console.error("Erro ao inicializar Mercado Pago:", error);
      }
    }
    
    initMercadoPago();
    
    return () => {
      // Limpar ao desmontar
      const script = document.querySelector('script[src*="mercadopago"]');
      if (script) {
        script.remove();
      }
    };
  }, [planData, onPaymentStatusChange]);
  
  return (
    <div>
      <div className="mb-4 p-4 rounded-md bg-blue-50 text-blue-700">
        <p>Para testar o pagamento, você pode usar:</p>
        <ul className="list-disc pl-5 mt-2 text-sm">
          <li>Número do cartão: 5031 4332 1540 6351</li>
          <li>Data de validade: qualquer futura</li>
          <li>CVV: 123</li>
          <li>Nome: qualquer nome</li>
          <li>CPF: qualquer CPF válido (ex: 123.456.789-09)</li>
        </ul>
      </div>
      <div ref={formContainerRef} className="w-full">
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-2"></div>
          <span>Carregando processador de pagamento...</span>
        </div>
      </div>
    </div>
  );
};

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Estados para armazenar os dados do plano
  const [planData, setPlanData] = useState<{
    id: number;
    name: string;
    planType: string;
    price: number;
    timestamp: number;
  } | null>(null)
  
  // Referências para elementos do formulário de pagamento
  const formCheckoutRef = useRef<HTMLFormElement>(null)
  const cardNumberRef = useRef<HTMLDivElement>(null)
  const expirationDateRef = useRef<HTMLDivElement>(null)
  const securityCodeRef = useRef<HTMLDivElement>(null)
  const cardholderNameRef = useRef<HTMLInputElement>(null)
  const installmentsRef = useRef<HTMLSelectElement>(null)
  const identificationTypeRef = useRef<HTMLSelectElement>(null)
  const identificationNumberRef = useRef<HTMLInputElement>(null)
  const cardholderEmailRef = useRef<HTMLInputElement>(null)
  const formPlanRef = useRef<HTMLFormElement>(null)

  // Variável para armazenar a instância do cardForm
  const [cardForm, setCardForm] = useState<any>(null)
  
  // Estado para armazenar detalhes do plano
  const [planDetails, setPlanDetails] = useState<{
    id: number;
    name: string;
    description: string;
    price: number;
    formattedPrice: string;
  }>({
    id: 0,
    name: "Carregando...",
    description: "Carregando detalhes do plano...",
    price: 0,
    formattedPrice: "R$ --,--"
  })
  
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    nameOnCard: "",
    cpf: "",
    email: "",
    identificationNumber: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card")
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false)
  const [pixData, setPixData] = useState<{ qr_code_url: string; copia_cola: string } | null>(null)

  // Carregar dados do plano
  useEffect(() => {
    // Verificar se há dados no sessionStorage
    const storedPlanData = sessionStorage.getItem("checkout_plan_data")
    
    if (storedPlanData) {
      try {
        const parsedData = JSON.parse(storedPlanData)
        
        // Verificar se os dados são válidos e não estão expirados (menos de 10 minutos)
        const isValid = 
          parsedData &&
          parsedData.id && 
          parsedData.timestamp && 
          (Date.now() - parsedData.timestamp < 10 * 60 * 1000)
        
        if (isValid) {
          setPlanData(parsedData)
          setPlanDetails({
            id: parsedData.id,
            name: parsedData.name || "Plano",
            description: parsedData.planType === "modulo" ? "Módulo individual" : "Plano de assinatura",
            price: parsedData.price,
            formattedPrice: `R$${parsedData.price.toFixed(2).replace(".", ",")}`
          })
          return
        }
      } catch (error) {
        console.error("Erro ao processar dados do plano:", error)
      }
    }
    
    // Se não houver dados válidos no sessionStorage, verificar parâmetros da URL
    const planType = searchParams.get("planType") || "modulo"
    const planId = searchParams.get("planId") || "0"
    
    // Se houver parâmetros, fazer a requisição para obter os dados
    if (planId !== "0") {
      async function fetchPlanDetails() {
        try {
          console.log(`Carregando dados do plano: ${planType}/${planId}`)
          const data = await api.plans.getCheckout(planType, parseInt(planId))
          
          if (data && data.plan) {
            const planData = {
              id: data.plan.id,
              name: data.plan.name,
              planType: planType,
              price: data.plan.price,
              timestamp: Date.now()
            }
            
            setPlanData(planData)
            setPlanDetails({
              id: data.plan.id,
              name: data.plan.name || "Plano",
              description: data.plan.description || 
                (planType === "modulo" ? "Módulo individual" : "Plano de assinatura"),
              price: data.plan.price,
              formattedPrice: `R$${data.plan.price.toFixed(2).replace(".", ",")}`
            })
            
            // Salvar os dados no sessionStorage
            sessionStorage.setItem("checkout_plan_data", JSON.stringify(planData))
          } else {
            console.error("Dados do plano inválidos:", data)
            router.push('/')
          }
        } catch (error) {
          console.error("Erro ao carregar detalhes do plano:", error)
          router.push('/')
        }
      }
      
      fetchPlanDetails()
    } else {
      // Se não houver dados no sessionStorage nem parâmetros válidos na URL, redirecionar para a home
      router.push('/')
    }
  }, [searchParams, router])
  
  // Inicializar Mercado Pago
  useEffect(() => {
    async function initMercadoPago() {
      if (!planDetails.id || planDetails.price <= 0) return
      
      try {
        await loadMercadoPagoSDK()
        
        // Iniciar o cardForm do Mercado Pago se a biblioteca estiver carregada
        if (window.MercadoPago && formCheckoutRef.current && formPlanRef.current) {
          const mp = new window.MercadoPago("TEST-45341c68-f08c-480b-b607-ee6aa4b1bc8b")
          
          // Adicionar dados do plano ao formulário
          if (formPlanRef.current) {
            formPlanRef.current.dataset.planType = planData?.planType || "modulo"
            formPlanRef.current.dataset.planId = planData?.id.toString() || "0"
            formPlanRef.current.dataset.planPrice = planDetails.price.toString()
          }
          
          const amount = planDetails.price.toString()
          
          console.log("Inicializando cardForm com:", { planType: planData?.planType, planId: planData?.id, amount })
          
          const form = mp.cardForm({
            amount: amount,
            iframe: true,
            form: {
              id: "form-checkout",
              cardNumber: {
                id: "form-checkout__cardNumber",
                placeholder: "Número do cartão",
              },
              expirationDate: {
                id: "form-checkout__expirationDate",
                placeholder: "MM/YY",
              },
              securityCode: {
                id: "form-checkout__securityCode",
                placeholder: "Código de segurança",
              },
              cardholderName: {
                id: "form-checkout__cardholderName",
                placeholder: "Titular do cartão",
              },
              issuer: {
                id: "form-checkout__issuer",
                placeholder: "Banco emissor",
              },
              installments: {
                id: "form-checkout__installments",
                placeholder: "Parcelas",
              },
              identificationType: {
                id: "form-checkout__identificationType",
                placeholder: "Tipo de documento",
              },
              identificationNumber: {
                id: "form-checkout__identificationNumber",
                placeholder: "Número do documento",
              },
              cardholderEmail: {
                id: "form-checkout__cardholderEmail",
                placeholder: "E-mail",
              },
            },
            callbacks: {
              onFormMounted: (error: any) => {
                if (error) {
                  console.warn("Form Mounted handling error: ", error)
                  return
                }
                console.log("Form mounted successfully")
              },
              onSubmit: (event: Event) => {
                event.preventDefault()
                setIsSubmitting(true)
                
                try {
                  const {
                    paymentMethodId: payment_method_id,
                    issuerId: issuer_id,
                    cardholderEmail: email,
                    amount,
                    token,
                    installments,
                    identificationNumber,
                    identificationType,
                  } = form.getCardFormData()
                  
                  console.log("Enviando pagamento para processamento")
                  
                  api.payments.processPayment({
                    planType: planData?.planType || "modulo",
                    planID: planData?.id || 0,
                    token,
                    issuer_id,
                    payment_method_id,
                    transaction_amount: Number(amount),
                    installments: Number(installments),
                    description: `Pagamento de ${planDetails.name}`,
                    payer: {
                      email,
                      identification: {
                        type: identificationType,
                        number: identificationNumber,
                      },
                    },
                  })
                  .then(response => {
                    console.log("Resposta do processamento:", response)
                    setPaymentStatus("approved")
                    setTimeout(() => {
                      router.push("/home")
                    }, 2000)
                  })
                  .catch(error => {
                    console.error("Erro no processamento:", error)
                    setPaymentStatus("general_error")
                  })
                  .finally(() => {
                    setIsSubmitting(false)
                  })
                } catch (error) {
                  console.error("Erro ao obter dados do formulário:", error)
                  setPaymentStatus("form_error")
                  setIsSubmitting(false)
                }
              },
              onFetching: (resource: string) => {
                console.log("Fetching resource: ", resource)
                return () => {
                  console.log("Finished fetching resource")
                }
              }
            },
          })
          
          setCardForm(form)
        }
      } catch (error) {
        console.error("Erro ao inicializar Mercado Pago:", error)
      }
    }
    
    initMercadoPago()
    
    // Cleanup ao desmontar o componente
    return () => {
      if (cardForm) {
        console.log("Limpando formulário de cartão")
        // O Mercado Pago não fornece método para destruir o cardForm
      }
    }
  }, [planData, planDetails, router])

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 11) {
      let formattedValue = value
      if (value.length > 3) {
        formattedValue = value.slice(0, 3) + "." + value.slice(3)
      }
      if (value.length > 6) {
        formattedValue = formattedValue.slice(0, 7) + "." + value.slice(6, 9)
      }
      if (value.length > 9) {
        formattedValue = formattedValue.slice(0, 11) + "-" + value.slice(9, 11)
      }
      setFormData((prev) => ({ ...prev, cpf: formattedValue }))
    }
  }

  const validateCpf = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório"
    } else if (formData.cpf.replace(/\D/g, "").length !== 11) {
      newErrors.cpf = "CPF inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerateQrCode = async () => {
    if (validateCpf()) {
      setIsSubmitting(true);

      try {
        console.log("Processando pagamento PIX com CPF:", formData.cpf);
        const pixResponse = await api.payments.processPix(planData?.planType || "modulo", planData?.id || 0, {
          identificationType: "CPF",
          cpf: formData.cpf.replace(/\D/g, ""),
          tempUser: null,
        })

        console.log("Resposta do PIX completa:", pixResponse);
        
        if (pixResponse.success) {
          console.log("QR Code gerado com sucesso:", pixResponse.qr_code_url ? "Disponível" : "Indisponível");
          console.log("Copia e cola disponível:", pixResponse.copia_cola ? "Sim" : "Não");
          
          // Armazenar os dados do QR code
          setPixData({
            qr_code_url: pixResponse.qr_code_url,
            copia_cola: pixResponse.copia_cola,
          })
          setQrCodeGenerated(true)
          
          // Não definir o status para permitir a exibição do QR code
          // Mesmo que o status seja "Pago", não vamos definir o paymentStatus
          // para que o QR code possa ser exibido
          
          // Apenas vamos registrar no log o status
          if (pixResponse.status === "Pago") {
            console.log("Pagamento já aprovado, mas ainda exibindo QR code!");
          } else {
            console.log("Pagamento pendente, exibindo QR code");
          }
        } else {
          console.error("Falha ao gerar QR Code:", pixResponse.message);
          throw new Error(pixResponse.message || "Erro ao gerar QR Code")
        }
      } catch (error) {
        console.error("Exceção ao gerar QR Code:", error)
        setErrors({ cpf: "Erro ao gerar QR Code. Verifique o CPF informado." })
        setPaymentStatus("general_error")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handlePaymentMethodChange = (method: "card" | "pix") => {
    setQrCodeGenerated(false)
    setPixData(null)
    setPaymentMethod(method)
    setPaymentStatus(null)
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Light particles effect - implementado como componente cliente */}
      <BackgroundParticles />

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
                      <p className="font-semibold text-indigo-700">{planDetails.name}</p>
                      <p className="text-sm text-gray-600">{planDetails.description}</p>
                    </div>
                    <p className="font-bold text-indigo-700">{planDetails.formattedPrice}</p>
                  </div>
                </div>

                {/* Seleção de método de pagamento */}
                <div className="flex space-x-2 mb-6">
                  <Button
                    type="button"
                    variant={paymentMethod === "card" ? "default" : "outline"}
                    className={`flex-1 ${paymentMethod === "card" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                    onClick={() => handlePaymentMethodChange("card")}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Cartão de Crédito
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "pix" ? "default" : "outline"}
                    className={`flex-1 ${paymentMethod === "pix" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                    onClick={() => handlePaymentMethodChange("pix")}
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9.5 4v16m5-16v16M4 9.5h16M4 14.5h16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    PIX
                  </Button>
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

                {/* Formulário Mercado Pago - Cartão de Crédito */}
                {!paymentStatus && paymentMethod === "card" && (
                  <MercadoPagoForm 
                    planData={planData} 
                    onPaymentStatusChange={setPaymentStatus} 
                  />
                )}

                {/* Opção de pagamento PIX */}
                {!paymentStatus && paymentMethod === "pix" && (
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <svg
                        className="h-5 w-5 text-indigo-600 mr-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9.5 4v16m5-16v16M4 9.5h16M4 14.5h16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="font-medium">Pagamento via PIX</span>
                    </div>

                    {/* Verificar se o QR Code foi gerado */}
                    {!qrCodeGenerated ? (
                      <>
                        <div className="space-y-2 mb-4">
                          <Label htmlFor="cpf">CPF</Label>
                          <Input
                            id="cpf"
                            value={formData.cpf}
                            onChange={handleCpfChange}
                            placeholder="Digite seu CPF"
                            className="bg-white"
                          />
                          {errors.cpf && (
                            <p className="text-red-500 text-xs flex items-center mt-1">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.cpf}
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          onClick={handleGenerateQrCode}
                          disabled={isSubmitting || formData.cpf.replace(/\D/g, "").length !== 11}
                        >
                          {isSubmitting ? (
                            "Gerando QR Code..."
                          ) : (
                            "Gerar QR Code"
                          )}
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        {/* QR Code PIX */}
                        <div className="flex flex-col items-center">
                          {pixData?.qr_code_url ? (
                            <div className="w-48 h-48 mx-auto border rounded-md p-1">
                              <img 
                                src={pixData.qr_code_url} 
                                alt="QR Code PIX" 
                                className="w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center">
                              <svg
                                className="h-32 w-32 text-indigo-600"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M9.5 4v16m5-16v16M4 9.5h16M4 14.5h16"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Código PIX */}
                        <div className="w-full">
                          <Label htmlFor="pixCode" className="sr-only">
                            Código PIX
                          </Label>
                          <div className="relative">
                            <Input
                              id="pixCode"
                              value={pixData?.copia_cola || ""}
                              readOnly
                              className="pr-24 bg-gray-50 text-gray-500 text-xs"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="absolute right-1 top-1 h-8 text-xs bg-white"
                              onClick={() => {
                                navigator.clipboard.writeText(pixData?.copia_cola || "")
                                alert("Código PIX copiado!")
                              }}
                            >
                              Copiar
                            </Button>
                          </div>
                        </div>

                        <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-700 flex items-start mt-4">
                          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-indigo-600" />
                          <p>
                            Após realizar o pagamento via PIX, o acesso ao conteúdo será liberado automaticamente em até 5
                            minutos.
                          </p>
                        </div>

                        <Button
                          type="button"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
                          onClick={() => {
                            alert(`Aguardando confirmação do pagamento via PIX para: ${planDetails.name}`);
                            router.push("/home");
                          }}
                        >
                          Já realizei o pagamento
                        </Button>
                      </div>
                    )}
                  </div>
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