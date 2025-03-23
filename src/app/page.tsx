"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Clock,
  Infinity,
  BookCopy,
  CreditCard,
  Package,
  LogIn,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import useEmblaCarousel from "embla-carousel-react"
import { CheckoutModal, type PurchaseItem } from "@/components/checkout-modal"
import { LoginModal } from "@/components/login-modal"

// Interfaces para os dados da API
interface ApiModule {
  id: number;
  name: string;
  price: number;
  subject: string; // Adicionado campo subject
}

interface ApiSubscription {
  id: number;
  name: string;
  price: number;
}

export default function Home() {
  // Estado para armazenar todos os subjects únicos extraídos dos módulos
  const [subjects, setSubjects] = useState<string[]>([])
  const [activeSubject, setActiveSubject] = useState("")
  const [activeSubscriptionIndex, setActiveSubscriptionIndex] = useState(0)
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("subscriptions")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PurchaseItem | null>(null)
  const [checkoutAfterLogin, setCheckoutAfterLogin] = useState(false)
  
  // Estados para armazenar os dados da API
  const [apiModules, setApiModules] = useState<ApiModule[]>([])
  const [apiSubscriptions, setApiSubscriptions] = useState<ApiSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const router = useRouter()

  // Carregar dados do backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true)
        const data = await api.plans.getAll()
        
        if (data.modules) {
          setApiModules(data.modules)
          
          // Extrair subjects únicos dos módulos
          const uniqueSubjects = Array.from(
            new Set(data.modules.map((module: ApiModule) => module.subject))
          ) as string[];
          
          setSubjects(uniqueSubjects);
          
          // Definir o subject ativo como o primeiro da lista se houver algum
          if (uniqueSubjects.length > 0 && !activeSubject) {
            setActiveSubject(uniqueSubjects[0]);
          }
        }
        
        if (data.subscriptions) {
          setApiSubscriptions(data.subscriptions)
        }
      } catch (error) {
        console.error("Erro ao carregar planos:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPlans()
  }, [])

  // Carrossel para planos de assinatura
  const [subscriptionRef, subscriptionApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    skipSnaps: false,
    dragFree: false,
  })

  // Carrossel para módulos individuais
  const [moduleRef, moduleApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    skipSnaps: false,
    dragFree: false,
  })

  // Partículas
  const [particles, setParticles] = useState<Array<{
    width: number;
    height: number;
    top: number;
    left: number;
    animation: string;
    opacity: number;
  }>>([]);

  // Gerar partículas apenas no cliente para evitar erro de hidratação
  useEffect(() => {
    const newParticles = Array(20).fill(0).map(() => ({
      width: Math.random() * 10 + 5,
      height: Math.random() * 10 + 5,
      top: Math.random() * 100,
      left: Math.random() * 100,
      animation: `float ${Math.random() * 10 + 10}s linear infinite`,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(newParticles);
  }, []);

  // Configurar os listeners para os carrosséis
  useEffect(() => {
    if (subscriptionApi) {
      subscriptionApi.on("select", () => {
        setActiveSubscriptionIndex(subscriptionApi.selectedScrollSnap())
      })
    }

    if (moduleApi) {
      moduleApi.on("select", () => {
        setActiveModuleIndex(moduleApi.selectedScrollSnap())
      })
    }

    return () => {
      if (subscriptionApi) subscriptionApi.off("select", () => {})
      if (moduleApi) moduleApi.off("select", () => {})
    }
  }, [subscriptionApi, moduleApi])

  // Funções para o carrossel de assinaturas
  const scrollPrevSubscription = useCallback(() => {
    if (subscriptionApi) {
      subscriptionApi.scrollPrev()
      // Atualiza o índice ativo após a navegação
      setTimeout(() => {
        setActiveSubscriptionIndex(subscriptionApi.selectedScrollSnap())
      }, 50)
    }
  }, [subscriptionApi])

  const scrollNextSubscription = useCallback(() => {
    if (subscriptionApi) {
      subscriptionApi.scrollNext()
      // Atualiza o índice ativo após a navegação
      setTimeout(() => {
        setActiveSubscriptionIndex(subscriptionApi.selectedScrollSnap())
      }, 50)
    }
  }, [subscriptionApi])

  const scrollToSubscription = useCallback(
    (index: number) => {
      if (subscriptionApi) {
        subscriptionApi.scrollTo(index)
        setActiveSubscriptionIndex(index)
      }
    },
    [subscriptionApi],
  )

  // Funções para o carrossel de módulos
  const scrollPrevModule = useCallback(() => {
    if (moduleApi) {
      moduleApi.scrollPrev()
      // Atualiza o índice ativo após a navegação
      setTimeout(() => {
        setActiveModuleIndex(moduleApi.selectedScrollSnap())
      }, 50)
    }
  }, [moduleApi])

  const scrollNextModule = useCallback(() => {
    if (moduleApi) {
      moduleApi.scrollNext()
      // Atualiza o índice ativo após a navegação
      setTimeout(() => {
        setActiveModuleIndex(moduleApi.selectedScrollSnap())
      }, 50)
    }
  }, [moduleApi])

  const scrollToModule = useCallback(
    (index: number) => {
      if (moduleApi) {
        moduleApi.scrollTo(index)
        setActiveModuleIndex(index)
      }
    },
    [moduleApi],
  )

  // Features fixas para cada tipo de plano
  const moduleFeatures = {
    default: [
      "Anotações completas da unidade",
      "Resumos dos principais tópicos",
      "Exercícios resolvidos",
      "Acesso vitalício",
    ],
    complete: [
      "Anotações de todas as unidades",
      "Resumos completos",
      "Todos os exercícios resolvidos",
      "Acesso vitalício",
      "Material de apoio adicional",
    ]
  };

  const subscriptionFeatures = {
    monthly: [
      "Acesso a todas as matérias",
      "Anotações de todas as unidades",
      "Resumos completos",
      "Exercícios resolvidos",
      "Suporte via email",
      "Cancelamento a qualquer momento",
    ],
    lifetime: [
      "Acesso vitalício a todas as matérias",
      "Anotações de todas as unidades",
      "Resumos completos",
      "Exercícios resolvidos",
      "Suporte via email prioritário",
      "Atualizações gratuitas para sempre",
      "Acesso a conteúdos exclusivos",
    ]
  };

  // Mapear os dados da API para o formato usado na interface
  const subscriptions = apiSubscriptions.map(sub => {
    const isLifetime = sub.name.toLowerCase().includes("vital");
    return {
      id: sub.id,
      title: sub.name,
      price: `R$${sub.price.toFixed(2).replace(".", ",")}`,
      icon: isLifetime ? 
        <Infinity className="h-8 w-8 text-indigo-500 mx-auto mb-2" /> : 
        <Clock className="h-8 w-8 text-indigo-500 mx-auto mb-2" />,
      features: isLifetime ? subscriptionFeatures.lifetime : subscriptionFeatures.monthly,
      popular: isLifetime // Planos vitalícios são destacados como populares
    };
  });

  // Filtrar módulos apenas para o subject ativo
  const filteredModules = apiModules.filter(mod => mod.subject === activeSubject);

  // Mapear os módulos filtrados
  const modules = filteredModules.map(mod => {
    const isComplete = mod.name.toLowerCase().includes("complet");
    return {
      id: mod.id,
      title: mod.name,
      price: `R$${mod.price.toFixed(2).replace(".", ",")}`,
      icon: isComplete ? 
        <BookOpen className="h-8 w-8 text-indigo-500 mx-auto mb-2" /> : 
        <BookCopy className="h-8 w-8 text-indigo-500 mx-auto mb-2" />,
      features: isComplete ? moduleFeatures.complete : moduleFeatures.default,
      popular: isComplete, // Módulos completos são destacados como populares
      subject: mod.subject
    };
  });

  // Função para alternar entre as abas
  const handleTabChange = (value: "subscriptions" | "modules") => {
    setActiveTab(value)
  }

  // Função para abrir o modal de checkout
  const handlePurchaseClick = (item: PurchaseItem) => {
    // Abrir diretamente o modal de checkout, que cuidará do registro se necessário
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Função para fechar o modal de checkout
  const handleCloseCheckout = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  // Função para abrir o modal de login
  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  // Função para fechar o modal de login
  const handleCloseLogin = () => {
    setIsLoginModalOpen(false)
    if (checkoutAfterLogin) {
      setSelectedItem(null);
      setCheckoutAfterLogin(false);
    }
  }
  
  // Função para lidar com o sucesso do login
  const handleLoginSuccess = () => {
    if (checkoutAfterLogin && selectedItem) {
      setCheckoutAfterLogin(false);
      setIsModalOpen(true);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 relative overflow-hidden">
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Light particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              top: `${particle.top}%`,
              left: `${particle.left}%`,
              animation: particle.animation,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>

      {/* Header com botão de login */}
      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex justify-end">
          <Button
            onClick={handleLoginClick}
            variant="outline"
            className="bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Entrar
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <GraduationCap className="h-16 w-16 text-indigo-300" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Anotações Universitárias</h1>
          <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
            Economize tempo e melhore suas notas com nossas anotações detalhadas e organizadas
          </p>
        </motion.div>

        {isLoading ? (
          // Estado de carregamento
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-800 font-medium">Carregando planos disponíveis...</p>
          </motion.div>
        ) : (
          // Conteúdo principal
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col space-y-8">
                  {/* Tabs personalizadas para Planos e Módulos */}
                  <div className="w-full">
                    {/* Cabeçalho das abas personalizado */}
                    <div className="flex w-full mb-6 bg-indigo-100 rounded-lg p-1">
                      <button
                        onClick={() => handleTabChange("subscriptions")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
                          activeTab === "subscriptions"
                            ? "bg-indigo-600 text-white font-medium"
                            : "text-indigo-700 hover:bg-indigo-50"
                        }`}
                      >
                        <CreditCard
                          className={`h-5 w-5 ${activeTab === "subscriptions" ? "text-white" : "text-indigo-500"}`}
                        />
                        <span>Planos de Assinatura</span>
                      </button>
                      <button
                        onClick={() => handleTabChange("modules")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
                          activeTab === "modules"
                            ? "bg-indigo-600 text-white font-medium"
                            : "text-indigo-700 hover:bg-indigo-50"
                        }`}
                      >
                        <Package className={`h-5 w-5 ${activeTab === "modules" ? "text-white" : "text-indigo-500"}`} />
                        <span>Módulos Individuais</span>
                      </button>
                    </div>

                    {/* Subject Selection - mostrar apenas na aba de módulos */}
                    <motion.div
                      initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                      animate={{
                        opacity: activeTab === "modules" ? 1 : 0,
                        height: activeTab === "modules" ? "auto" : 0,
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="w-full mb-6"
                    >
                      <div className="py-2">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                          <BookOpen className="mr-2 h-6 w-6 text-indigo-600" />
                          Escolha a Matéria
                        </h2>

                        <div className="flex flex-wrap gap-2">
                          {subjects.map((subject) => (
                            <Button
                              key={subject}
                              variant={activeSubject === subject ? "default" : "outline"}
                              onClick={() => setActiveSubject(subject)}
                              className={`transition-all ${
                                activeSubject === subject
                                  ? "bg-indigo-600 hover:bg-indigo-700"
                                  : "hover:border-indigo-400 hover:text-indigo-600"
                              }`}
                            >
                              {subject}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* Conteúdo da aba de Assinaturas */}
                    {activeTab === "subscriptions" && (
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                          Planos de Assinatura 
                        </h2>

                        {subscriptions.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            Nenhum plano de assinatura disponível no momento.
                          </div>
                        ) : (
                          // Carousel para Assinaturas
                          <div className="relative py-20">
                            <div className="overflow-visible" ref={subscriptionRef}>
                              <div className="flex">
                                {subscriptions.map((plan, index) => (
                                  <div
                                    key={index}
                                    className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_45%] px-4 cursor-pointer"
                                    onClick={() => scrollToSubscription(index)}
                                  >
                                    <div
                                      className={`transition-all duration-500 ${
                                        activeSubscriptionIndex === index
                                          ? "transform scale-110 z-50"
                                          : "transform scale-90 opacity-70 z-10"
                                      }`}
                                      style={{
                                        transformOrigin: "center center",
                                        position: "relative",
                                      }}
                                    >
                                      <Card
                                        className={`h-full border-2 ${
                                          plan.popular ? "border-indigo-500" : "border-gray-200"
                                        } relative ${activeSubscriptionIndex === index ? "shadow-xl" : "shadow-md"}`}
                                      >
                                        {plan.popular && (
                                          <div className="absolute -top-3 -right-3 z-20">
                                            <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                              Recomendado
                                            </span>
                                          </div>
                                        )}
                                        <CardContent className="p-6">
                                          <div className="text-center mb-4">
                                            {plan.icon}
                                            <h3 className="text-xl font-bold text-gray-800">{plan.title}</h3>
                                            <div className="mt-2 mb-4">
                                              <span className="text-3xl font-bold text-indigo-600">{plan.price}</span>
                                            </div>
                                          </div>

                                          <ul className="space-y-3">
                                            {plan.features.map((feature, i) => (
                                              <li key={i} className="flex items-start">
                                                <CheckCircle className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-600">{feature}</span>
                                              </li>
                                            ))}
                                          </ul>

                                          <Button
                                            type="button"
                                            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handlePurchaseClick({
                                                id: plan.id,
                                                title: plan.title,
                                                price: plan.price,
                                                type: "assinatura",
                                                popular: plan.popular,
                                              })
                                            }}
                                          >
                                            Assinar Agora
                                          </Button>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {subscriptions.length > 1 && (
                              <>
                                <Button
                                  onClick={scrollPrevSubscription}
                                  variant="outline"
                                  size="icon"
                                  className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white rounded-full h-10 w-10 shadow-md"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                  <span className="sr-only">Anterior</span>
                                </Button>

                                <Button
                                  onClick={scrollNextSubscription}
                                  variant="outline"
                                  size="icon"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white rounded-full h-10 w-10 shadow-md"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                  <span className="sr-only">Próximo</span>
                                </Button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Carousel Indicators */}
                        {subscriptions.length > 1 && (
                          <div className="flex justify-center mt-4">
                            <div className="flex space-x-2">
                              {subscriptions.map((_, index) => (
                                <button
                                  key={index}
                                  className={`h-2 rounded-full transition-all ${
                                    activeSubscriptionIndex === index ? "w-6 bg-indigo-600" : "w-2 bg-indigo-300"
                                  }`}
                                  onClick={() => scrollToSubscription(index)}
                                  aria-label={`Ir para slide ${index + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conteúdo da aba de Módulos */}
                    {activeTab === "modules" && (
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                          Módulos Individuais para {activeSubject}
                        </h2>

                        {modules.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            Nenhum módulo disponível para esta matéria.
                          </div>
                        ) : (
                          // Carousel para Módulos
                          <div className="relative py-20">
                            <div className="overflow-visible" ref={moduleRef}>
                              <div className="flex">
                                {modules.map((module, index) => (
                                  <div
                                    key={index}
                                    className="flex-[0_0_90%] sm:flex-[0_0_45%] md:flex-[0_0_40%] lg:flex-[0_0_30%] px-4 cursor-pointer"
                                    onClick={() => scrollToModule(index)}
                                  >
                                    <div
                                      className={`transition-all duration-500 ${
                                        activeModuleIndex === index
                                          ? "transform scale-110 z-50"
                                          : "transform scale-90 opacity-70 z-10"
                                      }`}
                                      style={{
                                        transformOrigin: "center center",
                                        position: "relative",
                                      }}
                                    >
                                      <Card
                                        className={`h-full border-2 ${
                                          module.popular ? "border-indigo-500" : "border-gray-200"
                                        } relative ${activeModuleIndex === index ? "shadow-xl" : "shadow-md"}`}
                                      >
                                        {module.popular && (
                                          <div className="absolute -top-3 -right-3 z-20">
                                            <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                              Completo
                                            </span>
                                          </div>
                                        )}
                                        <CardContent className="p-6">
                                          <div className="text-center mb-4">
                                            {module.icon}
                                            <h3 className="text-xl font-bold text-gray-800">{module.title}</h3>
                                            <div className="mt-2 mb-4">
                                              <span className="text-3xl font-bold text-indigo-600">{module.price}</span>
                                            </div>
                                          </div>

                                          <ul className="space-y-3">
                                            {module.features.map((feature, i) => (
                                              <li key={i} className="flex items-start">
                                                <CheckCircle className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-600">{feature}</span>
                                              </li>
                                            ))}
                                          </ul>

                                          <Button
                                            type="button"
                                            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handlePurchaseClick({
                                                id: module.id,
                                                title: module.title,
                                                price: module.price,
                                                type: "modulo",
                                                popular: module.popular,
                                                subject: activeSubject,
                                              })
                                            }}
                                          >
                                            Comprar Agora
                                          </Button>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <Button
                              onClick={scrollPrevModule}
                              variant="outline"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white rounded-full h-10 w-10 shadow-md"
                            >
                              <ChevronLeft className="h-5 w-5" />
                              <span className="sr-only">Anterior</span>
                            </Button>

                            <Button
                              onClick={scrollNextModule}
                              variant="outline"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white rounded-full h-10 w-10 shadow-md"
                            >
                              <ChevronRight className="h-5 w-5" />
                              <span className="sr-only">Próximo</span>
                            </Button>
                          </div>
                        )}

                        {/* Carousel Indicators */}
                        {modules.length > 1 && (
                          <div className="flex justify-center mt-4">
                            <div className="flex space-x-2">
                              {modules.map((_, index) => (
                                <button
                                  key={index}
                                  className={`h-2 rounded-full transition-all ${
                                    activeModuleIndex === index ? "w-6 bg-indigo-600" : "w-2 bg-indigo-300"
                                  }`}
                                  onClick={() => scrollToModule(index)}
                                  aria-label={`Ir para slide ${index + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Testimonials */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-indigo-50 p-6 rounded-xl"
                  >
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">O que nossos clientes dizem</h2>
                    <div className="italic text-gray-600">
                      "As anotações são extremamente detalhadas e organizadas. Consegui melhorar minhas notas
                      significativamente após usar este material. Recomendo fortemente!"
                      <div className="mt-2 font-semibold text-gray-800">— Ana Silva, Engenharia Civil</div>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-indigo-200"
        >
          <p>© {new Date().getFullYear()} Anotações Universitárias. Todos os direitos reservados.</p>
          <p className="mt-2">Contato: contato@anotacoesuniversitarias.com</p>
        </motion.footer>
      </div>

      {/* Modal de Checkout */}
      <CheckoutModal isOpen={isModalOpen} onClose={handleCloseCheckout} item={selectedItem} />

      {/* Modal de Login */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={handleCloseLogin}
        onSuccess={handleLoginSuccess}
        redirectToHome={!checkoutAfterLogin}
      />
    </main>
  )
}

