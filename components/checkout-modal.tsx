"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, CreditCard, Lock, AlertCircle, QrCode } from "lucide-react"
import { api, loadMercadoPagoSDK } from "../lib/api"

// API Base URL - usar o mesmo definido em lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Public Key do Mercado Pago - usar exatamente a mesma que funcionou no Flask
const MP_PUBLIC_KEY = "TEST-45341c68-f08c-480b-b607-ee6aa4b1bc8b";

// Função para criar instância do Mercado Pago de forma consistente
function createMercadoPagoInstance() {
  if (!isBrowser || !window.MercadoPago) {
    console.error("[DEBUG] MercadoPago não disponível");
    return null;
  }
  
  try {
    console.log("[DEBUG] Criando instância MP com chave:", MP_PUBLIC_KEY);
    return new window.MercadoPago(MP_PUBLIC_KEY, {
      locale: 'pt-BR'
    });
  } catch (error) {
    console.error("[DEBUG] Erro ao criar instância do MercadoPago:", error);
    return null;
  }
}

// Função para exibir erros de forma consistente
function showError(message: string, technicalDetails?: any) {
  console.error("[ERRO]", message, technicalDetails);
  
  // Mostrar mensagem para o usuário
  alert(`Erro: ${message}`);
  
  // Retornar false para indicar que houve erro
  return false;
}

// Atualizar a interface PurchaseItem para incluir a matéria
export type PurchaseItem = {
  title: string
  price: string
  type: "assinatura" | "modulo"
  popular?: boolean
  subject?: string // Adicionar o campo para a matéria
  id?: number // ID do item para referência na API
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  item: PurchaseItem | null
}

// Declarar o tipo global para o MercadoPago
declare global {
  interface Window {
    MercadoPago?: any
    tempUser?: any // Adicionar tempUser ao objeto window global
  }
}

// Flag para verificar se o código está rodando no navegador
const isBrowser = typeof window !== 'undefined';

// Componente usando a SDK oficial do Mercado Pago
const MercadoPagoForm = ({ item }: { item: PurchaseItem | null }) => {
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!item) return;
    
    // Limpar scripts existentes
    const oldScript = document.querySelector('script[src*="mercadopago"]');
    if (oldScript) {
      oldScript.remove();
    }
    
    // Passo 1: Buscar dados do plano
    console.log("Buscando dados do plano:", item);
    fetch(`${API_BASE_URL}/checkout/${item.type}/${item.id}`)
      .then(response => {
        if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
        return response.json();
      })
      .then(data => {
        console.log("Dados do plano recebidos:", data);
        
        // Verificar se o container ainda existe
        if (!formContainerRef.current) return;
        
        // Passo 2: Criar os elementos HTML
        const planForm = document.createElement('form');
        planForm.id = 'form-checkout__plan';
        planForm.dataset.planType = data.plan_type;
        planForm.dataset.planId = data.plan.id.toString();
        planForm.dataset.planPrice = data.plan.price.toString();
        
        const checkoutForm = document.createElement('form');
        checkoutForm.id = 'form-checkout';
        
        // Adicionar os elementos ao DOM
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
          { type: 'input', id: 'form-checkout__cardholderEmail', className: 'h-10 border rounded-md w-full px-3 mb-2', placeholder: 'E-mail', value: window.tempUser?.email || '' },
          { type: 'button', id: 'form-checkout__submit', className: 'w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md mb-2', textContent: 'Pagar' },
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
        
        // Passo 3: Carregar SDK do Mercado Pago
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.onload = () => {
          // Passo 4: Inicializar o Mercado Pago
          if (!window.MercadoPago) {
            console.error("MercadoPago não disponível no window");
            return;
          }
          
          try {
            // Inicializar MP com a chave pública
            const mp = new window.MercadoPago(MP_PUBLIC_KEY, {
              locale: 'pt-BR'
            });
            
            // Obter os dados do formulário do plano
            const planElement = document.getElementById('form-checkout__plan');
            if (!planElement) {
              console.error("Elemento do plano não encontrado");
              return;
            }
            
            const planType = planElement.dataset.planType || '';
            const planId = planElement.dataset.planId || '';
            const amount = planElement.dataset.planPrice || '';
            
            console.log("Inicializando cardForm com:", { planType, planId, amount });
            
            // Inicializar o cardForm
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
                  
                  const formData = cardForm.getCardFormData();
                  console.log("Dados do formulário:", formData);
                  
                  fetch(`${API_BASE_URL}/process_payment`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      planType,
                      planID: planId,
                      token: formData.token,
                      issuer_id: formData.issuerId,
                      payment_method_id: formData.paymentMethodId,
                      transaction_amount: Number(formData.amount),
                      installments: Number(formData.installments),
                      description: "Descrição do produto",
                      tempUser: window.tempUser || null,
                      payer: {
                        email: formData.cardholderEmail,
                        identification: {
                          type: formData.identificationType,
                          number: formData.identificationNumber,
                        },
                      },
                    }),
                  })
                  .then(response => response.json())
                  .then(data => {
                    console.log("Resposta do pagamento:", data);
                    
                    if (data.status === "Pago") {
                      // Salvar token e dados do usuário
                      if (data.acess_token) {
                        localStorage.setItem('access_token', data.acess_token);
                      }
                      
                      // Salvar dados do usuário
                      if (data.user) {
                        localStorage.setItem('user_data', JSON.stringify(data.user));
                      }
                      
                      // Salvar tipo de assinatura
                      if (data.subscription_type) {
                        localStorage.setItem('subscriptionType', data.subscription_type);
                      }
                      
                      // Redirecionar para a home
                      window.location.href = "/home";
                    } else {
                      alert(`Status do pagamento: ${data.status}. Verifique os detalhes.`);
                    }
                  })
                  .catch(error => {
                    console.error("Erro no pagamento:", error);
                    alert("Erro ao processar pagamento. Tente novamente.");
                  });
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
            
            console.log("CardForm inicializado com sucesso");
          } catch (error) {
            console.error("Erro ao inicializar o Mercado Pago:", error);
          }
        };
        
        script.onerror = (error) => {
          console.error("Erro ao carregar o SDK do Mercado Pago:", error);
        };
        
        document.body.appendChild(script);
      })
      .catch(error => {
        console.error("Erro ao buscar dados do plano:", error);
        if (formContainerRef.current) {
          formContainerRef.current.innerHTML = `
            <div class="bg-red-50 p-4 rounded-md text-red-600">
              <div class="font-medium">Erro ao carregar dados do pagamento</div>
              <div class="text-sm mt-1">${error.message}</div>
              <button class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm" onclick="window.location.reload()">
                Tentar novamente
              </button>
            </div>
          `;
        }
      });
    
    return () => {
      // Limpar ao desmontar
      const script = document.querySelector('script[src*="mercadopago"]');
      if (script) {
        script.remove();
      }
    };
  }, [item]);
  
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

export function CheckoutModal({ isOpen, onClose, item }: CheckoutModalProps) {
  const [step, setStep] = useState<"register" | "payment">("register")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    nameOnCard: "",
    cpf: "", // Adicionar campo CPF
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false)
  const [pixData, setPixData] = useState<{ qr_code_url: string; copia_cola: string } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card")
  const [debugMode, setDebugMode] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null)

  // Gerar ID único para o formulário
  const formId = useRef(`form-checkout-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  
  // Adicionar referência para o container do formulário
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  // Adicionar ref local para o cardForm
  const cardFormRef = useRef<any>(null);

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

  const validateRegisterForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório"
    if (!formData.email.trim()) newErrors.email = "Email é obrigatório"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email inválido"
    if (!formData.password.trim()) newErrors.password = "Senha é obrigatória"
    else if (formData.password.length < 6) newErrors.password = "Senha deve ter pelo menos 6 caracteres"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateRegisterForm()) {
      try {
        setIsSubmitting(true);

        // Registrar o usuário na API
        const response = await api.auth.register(formData.name, formData.email, formData.password);
        
        // Armazenar o usuário temporário tanto no state quanto no window
        if (response && response.tempo_user) {
          setTempUser(response.tempo_user);
          // Disponibilizar globalmente para o MercadoPagoForm
          window.tempUser = response.tempo_user;
          console.log("Usuário temporário armazenado:", response.tempo_user);
        } else {
          console.error("Resposta da API não contém tempo_user:", response);
        }
        
        setIsSubmitting(false);
        setStep("payment");
      } catch (error) {
        console.error("Erro ao registrar usuário:", error);
        setIsSubmitting(false);
        setErrors({ email: "Erro ao criar conta. Este email já pode estar em uso." });
      }
    }
  };

  const handleGenerateQrCode = async () => {
    if (!item) return

    if (validateCpf()) {
      setIsSubmitting(true)

      try {
        // Usar diretamente o tipo do item sem conversão
        const planType = item.type

        // Gerar QR Code via API - adicionando tempUser aos dados enviados
        const pixResponse = await api.payments.processPix(planType, item.id || 0, {
          identificationType: "CPF",
          cpf: formData.cpf.replace(/\D/g, ""),
          tempUser: window.tempUser || tempUser || null, // Enviar tempUser para a API
        })

        if (pixResponse.success) {
          setPixData({
            qr_code_url: pixResponse.qr_code_url,
            copia_cola: pixResponse.copia_cola,
          })
          setQrCodeGenerated(true)
          
          // Verificar o status diretamente após gerar o pix
          // (normalmente PIX começa como pendente)
          if (pixResponse.status === "Pago") {
            window.location.href = "/payment/sucess";
          }
          // Para status Pendente, não redirecionamos, deixamos o usuário ver o QR code
        } else {
          throw new Error(pixResponse.message || "Erro ao gerar QR Code")
        }
      } catch (error) {
        console.error("Erro ao gerar QR Code:", error)
        setErrors({ cpf: "Erro ao gerar QR Code. Verifique o CPF informado." })
        // Removido o redirecionamento automático para failure
      } finally {
        setIsSubmitting(false)
      }
    }
  }

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

  // Função para alternar o método de pagamento
  const handlePaymentMethodChange = (method: "card" | "pix") => {
    // Resetar estados relacionados ao método anterior
    setQrCodeGenerated(false);
    setPixData(null);
    setPaymentMethod(method);
  };

  // Função para limpar o formulário
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      nameOnCard: "",
      cpf: "",
    });
    setErrors({});
    setStep("register");
    setPaymentMethod("card");
    setQrCodeGenerated(false);
    setPixData(null);
    
    // Limpar referência do formulário do cartão
    if (cardFormRef.current) {
      cardFormRef.current = null;
    }
    
    // Limpar flags de erro
    setDebugMode(false);
  };

  // Função para fechar o modal
  const handleClose = () => {
    // Limpar os valores do formulário
    resetForm();
    
    // Limpar elementos do formulário
    if (cardFormRef.current) {
      cardFormRef.current = null;
    }
    
    // Não precisamos recarregar o SDK ou buscar dados aqui, apenas fechar o modal
    
    // Fechar o modal
    onClose();
  };

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {step === "register" ? "Criar sua conta" : "Finalizar pagamento"}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {step === "register"
              ? "Preencha seus dados para continuar com a compra"
              : "Insira os dados para finalizar a compra"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Resumo da compra */}
          <div className="bg-indigo-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Resumo da compra</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-indigo-700">{item.title}</p>
                <p className="text-sm text-gray-600">
                  {item.type === "assinatura" ? "Plano de assinatura" : "Módulo individual"}
                  {item.subject && item.type === "modulo" && ` - ${item.subject}`}
                </p>
              </div>
              <p className="font-bold text-indigo-700">{item.price}</p>
            </div>
            {item.popular && (
              <div className="mt-2 flex items-center text-sm text-indigo-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>{item.type === "assinatura" ? "Recomendado" : "Completo"}</span>
              </div>
            )}
          </div>

          {/* Formulário de registro */}
          {step === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Digite seu nome completo"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Crie uma senha segura"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processando..." : "Continuar para pagamento"}
              </Button>
            </form>
          )}

          {/* Formulário de pagamento */}
          {step === "payment" && (
            <div className="space-y-4">
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

              {/* Formulário de cartão de crédito */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-indigo-600 mr-2" />
                      <span className="font-medium">Cartão de crédito</span>
                    </div>
                  </div>

                  {debugMode ? (
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                      <p className="text-green-700 text-sm mb-2">
                        Modo de diagnóstico ativado. Clique abaixo para simular um pagamento bem-sucedido.
                      </p>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                        onClick={() => {
                          alert("Pagamento simulado com sucesso!");
                          onClose();
                        }}
                      >
                        Simular pagamento
                      </Button>
                    </div>
                  ) : (
                    <MercadoPagoForm item={item} />
                  )}
                </div>
              )}

              {/* Opção de pagamento PIX */}
              {paymentMethod === "pix" && (
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

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="cpf">CPF (necessário para gerar o PIX)</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={handleCpfChange}
                    />
                    {errors.cpf && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.cpf}
                      </p>
                    )}
                  </div>

                  {!qrCodeGenerated ? (
                    <Button
                      type="button"
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      onClick={handleGenerateQrCode}
                      disabled={isSubmitting || formData.cpf.replace(/\D/g, "").length !== 11}
                    >
                      {isSubmitting ? (
                        "Gerando QR Code..."
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 mr-2" />
                          Gerar QR Code
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600 mb-2">Escaneie o QR Code abaixo ou copie o código PIX</p>
                        <p className="font-medium text-indigo-700">{item.price}</p>
                      </div>

                      {/* QR Code - usar a imagem da API se disponível */}
                      <div className="bg-white p-2 rounded-lg border border-gray-200 mb-4">
                        {pixData?.qr_code_url ? (
                          <img
                            src={`data:image/png;base64,${pixData.qr_code_url}`}
                            alt="QR Code PIX"
                            className="w-48 h-48 mx-auto"
                          />
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
                          alert(`Aguardando confirmação do pagamento via PIX para: ${item.title}`);
                          window.location.href = "/payment/pending";
                          // Não fechamos o modal, deixamos o redirecionamento acontecer
                        }}
                      >
                        Já realizei o pagamento
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de ação na parte inferior */}
              <div className="flex flex-col space-y-2 mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep("register")}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
                
                {/* Instruções de diagnóstico */}
                <div className="text-xs text-gray-500 mt-4 text-center">
                  <p>Encontrou problemas com o pagamento?</p>
                  <button 
                    className="text-indigo-600 hover:underline mt-1"
                    onClick={() => {
                      setDebugMode(!debugMode);
                      if (!debugMode) {
                        alert("Modo de diagnóstico ativado. Você poderá simular pagamentos para testes.");
                      }
                    }}
                  >
                    Alternar modo de diagnóstico
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

