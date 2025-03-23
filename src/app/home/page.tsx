"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { BookOpen, Download, LogOut, FileText, Search, Lock, CheckCircle } from "lucide-react"
import { api } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Definindo interfaces para os tipos de dados
interface Module {
  id: number;
  title: string;
  description: string;
  purchased: boolean;
  pdfUrl: string;
}

interface Subject {
  id: number;
  name: string;
  icon: string;
  modules: Module[];
}

interface APIModule {
  id: number;
  name: string;
  price: number;
  subject: string;
}

interface APISubscription {
  id: number;
  name: string;
  price: number;
}

interface UserModule {
  id: number;
  [key: string]: any; // Para outros campos que possam existir
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [activeSubject, setActiveSubject] = useState("Cálculo")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])

  // Verificar o tipo de assinatura no localStorage (se disponível no cliente)
  const [userSubscription, setUserSubscription] = useState<string>("none")

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      await loadUserData()
      setIsLoading(false)
    }

    loadData()
    // Remove activeSubject da lista de dependências para evitar recarregamento ao mudar de matéria
  }, [])

  // Verificar autenticação e buscar dados do usuário
  async function loadUserData() {
    try {
      setIsLoading(true);
      
      // Verificar se tem o token
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn("Token de acesso não encontrado, redirecionando para login");
        router.push('/');
        return;
      }
      
      try {
        // Buscar perfil do usuário
        console.log("Buscando perfil do usuário...");
        const profileData = await api.auth.profile();
        
        if (!profileData) {
          console.error("Perfil do usuário não encontrado");
          localStorage.removeItem('access_token');
          router.push('/');
          return;
        }
        
        console.log("Perfil recebido:", profileData);
        
        // Atualizar dados do usuário
        setUserData(profileData);
        
        // Se usuário tem tipo de assinatura, atualizar
        if (profileData.subscription_type) {
          setUserSubscription(profileData.subscription_type);
        }
        
        // Armazenar os módulos do usuário para comparação posterior
        const userModules = profileData.modules || [];
        console.log("Módulos do usuário:", userModules);
        
        // Buscar todas as matérias e módulos disponíveis
        console.log("Buscando planos e matérias disponíveis...");
        let plansData;
        
        try {
          plansData = await api.plans.getAll();
          console.log("Dados de planos recebidos:", plansData);
        } catch (plansError) {
          console.error("Erro ao buscar planos, usando dados padrão:", plansError);
          // Usar dados padrão em caso de falha na API
          plansData = getDefaultPlansData();
        }
        
        if (plansData && plansData.modules && plansData.modules.length > 0) {
          console.log(`Encontrados ${plansData.modules.length} módulos`);
          
          // Agrupar os módulos por matéria
          const subjectMap = new Map();
          
          // Primeiro, vamos agrupar os módulos por matéria
          plansData.modules.forEach((module: APIModule) => {
            const subjectName = module.subject;
            
            if (!subjectMap.has(subjectName)) {
              subjectMap.set(subjectName, {
                id: module.id, // Usamos o ID do primeiro módulo como ID da matéria
                name: subjectName,
                icon: getIconForSubject(subjectName), // Função auxiliar para obter ícone
                modules: []
              });
            }
            
            // Verificar se este módulo está na lista de módulos do usuário
            const isPurchased = userModules.some(
              (userModule: UserModule) => userModule.id === module.id
            );
            
            // Adicionar o módulo à lista de módulos desta matéria
            subjectMap.get(subjectName).modules.push({
              id: module.id,
              title: module.name,
              description: `${module.name} - R$ ${module.price.toFixed(2)}`,
              purchased: isPurchased,
              pdfUrl: "#"
            });
          });
          
          // Converter o mapa em array de matérias
          const subjectsArray = Array.from(subjectMap.values());
          console.log("Matérias agrupadas:", subjectsArray);
          
          setSubjects(subjectsArray);
          
          // Definir matéria ativa se ainda não estiver definida
          if (!activeSubject && subjectsArray.length > 0) {
            setActiveSubject(subjectsArray[0].name);
          }
        } else {
          console.warn("Nenhum módulo encontrado na API, usando dados padrão");
          // Usar subjects de fallback em vez dos dados estruturados em módulos
          const defaultData = getDefaultPlansData();
          setSubjects(defaultData.subjects);
          
          if (!activeSubject && defaultData.subjects.length > 0) {
            setActiveSubject(defaultData.subjects[0].name);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        // Usar dados padrão mesmo em caso de erro
        const defaultData = getDefaultPlansData();
        setSubjects(defaultData.subjects);
        
        if (!activeSubject && defaultData.subjects.length > 0) {
          setActiveSubject(defaultData.subjects[0].name);
        }
      }
    } catch (error) {
      console.error("Erro geral:", error);
      router.push('/');
    }
  }

  // Função para obter dados padrão quando a API falha
  function getDefaultPlansData() {
    return {
      modules: [
        {
          id: 101,
          name: "Limites e Continuidade",
          price: 29.90,
          subject: "Cálculo"
        },
        {
          id: 102,
          name: "Derivadas",
          price: 29.90,
          subject: "Cálculo"
        },
        {
          id: 103,
          name: "Integrais",
          price: 29.90,
          subject: "Cálculo"
        },
        {
          id: 104,
          name: "Cálculo Completo",
          price: 79.90,
          subject: "Cálculo"
        },
        {
          id: 201,
          name: "Mecânica Clássica",
          price: 29.90,
          subject: "Física"
        },
        {
          id: 202,
          name: "Eletromagnetismo",
          price: 29.90,
          subject: "Física"
        },
        {
          id: 203,
          name: "Física Completa",
          price: 79.90,
          subject: "Física"
        },
        {
          id: 301,
          name: "Algoritmos",
          price: 29.90,
          subject: "Programação"
        },
        {
          id: 302,
          name: "Programação Orientada a Objetos",
          price: 29.90,
          subject: "Programação"
        },
        {
          id: 303,
          name: "Programação Completa",
          price: 79.90,
          subject: "Programação"
        }
      ],
      subscriptions: [
        {
          id: 1,
          name: "Assinatura Mensal",
          price: 39.90
        },
        {
          id: 2,
          name: "Assinatura Vitalícia",
          price: 399.90
        }
      ],
      // Mantenha subjects para compatibilidade com o código existente
      subjects: [
        {
          id: 1,
          name: "Cálculo",
          icon: "📊",
          modules: [
            {
              id: 101,
              title: "Limites e Continuidade",
              description: "Conceitos fundamentais de limites e continuidade de funções",
              purchased: false,
              pdfUrl: "#"
            },
            {
              id: 102,
              title: "Derivadas",
              description: "Regras de derivação e aplicações",
              purchased: false,
              pdfUrl: "#"
            },
            {
              id: 103,
              title: "Integrais",
              description: "Técnicas de integração e aplicações",
              purchased: false,
              pdfUrl: "#"
            }
          ]
        },
        {
          id: 2,
          name: "Física",
          icon: "🔭",
          modules: [
            {
              id: 201,
              title: "Mecânica Clássica",
              description: "Leis de Newton e aplicações",
              purchased: false,
              pdfUrl: "#"
            },
            {
              id: 202,
              title: "Eletromagnetismo",
              description: "Campos elétricos e magnéticos",
              purchased: false,
              pdfUrl: "#"
            }
          ]
        },
        {
          id: 3,
          name: "Programação",
          icon: "💻",
          modules: [
            {
              id: 301,
              title: "Algoritmos",
              description: "Fundamentos de algoritmos e estruturas de dados",
              purchased: false,
              pdfUrl: "#"
            },
            {
              id: 302,
              title: "Programação Orientada a Objetos",
              description: "Conceitos de POO e padrões de projeto",
              purchased: false,
              pdfUrl: "#"
            }
          ]
        }
      ]
    };
  }

  // Função auxiliar para obter ícone para cada matéria
  function getIconForSubject(subject: string): string {
    const iconMap: Record<string, string> = {
      "Cálculo": "📊",
      "Física": "🔭",
      "Programação": "💻",
      "Química": "⚗️",
      "Biologia": "🧬",
      "História": "📜",
      "Geografia": "🌎",
      "Literatura": "📚",
      "Inglês": "🌐",
      "Estatística": "📈"
    };
    
    return iconMap[subject] || "📝"; // Ícone padrão se a matéria não estiver no mapa
  }

  // Evitar renderização se ainda estiver carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Carregando...</p>
        </div>
      </div>
    )
  }

  // Verificar se o usuário tem um plano de assinatura completo
  const hasFullSubscription = userSubscription === "monthly" || userSubscription === "lifetime"

  // Usar dados reais do usuário
  const user = userData || {
    name: "Usuário",
    email: "usuario@exemplo.com",
    avatar: "/placeholder.svg?height=40&width=40",
    subscription: userSubscription,
  }

  // Função para obter o texto do tipo de assinatura
  const getSubscriptionText = (type: string) => {
    switch (type) {
      case "monthly":
        return "Assinatura Mensal"
      case "lifetime":
        return "Assinatura Vitalícia"
      case "module":
        return "Módulos Individuais"
      default:
        return "Sem Assinatura"
    }
  }

  // Função para obter a descrição do tipo de assinatura
  const getSubscriptionDescription = (type: string) => {
    switch (type) {
      case "monthly":
        return "Você tem acesso a todos os materiais enquanto sua assinatura estiver ativa. Renovação automática mensal."
      case "lifetime":
        return "Você tem acesso vitalício a todos os materiais, incluindo atualizações futuras."
      case "module":
        return "Você tem acesso apenas aos módulos que comprou individualmente."
      default:
        return "Você ainda não possui nenhuma assinatura ou módulo. Adquira um plano para acessar os materiais."
    }
  }

  // Filtrar matérias e módulos com base na pesquisa
  const filteredSubjects = searchQuery
    ? subjects.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subject.modules.some(
            (module: Module) =>
              module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              module.description.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : subjects

  // Obter a matéria ativa ou usar a primeira disponível
  const activeSubjectData = filteredSubjects.find((subject) => subject.name === activeSubject) || 
    (filteredSubjects.length > 0 ? filteredSubjects[0] : null);

  // Função para fazer logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('subscriptionType');
    router.push('/');
  }

  // Função para alternar matéria com animação
  const handleSubjectChange = (subjectName: string) => {
    // Se já estiver selecionado, não faz nada
    if (subjectName === activeSubject) return;
    
    // Atualiza a matéria ativa
    setActiveSubject(subjectName);
  }

  // Função para download do PDF
  const handleDownloadPDF = (subjectName: string, moduleTitle: string) => {
    alert(`Iniciando download do PDF: ${moduleTitle} - ${subjectName}`);
    // Aqui você implementaria a lógica real de download
  }

  // Função para comprar um módulo
  const handlePurchaseModule = (subjectName: string, moduleTitle: string, moduleId: number) => {
    // Redirecionar para a rota dinâmica que fará o processamento e redirecionamento
    router.push(`/checkout_user/modulo/${moduleId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 relative">
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
        {/* Header */}
        <header className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-300 mr-3" />
            <h1 className="text-2xl font-bold text-white">Anotações Universitárias</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className="hidden md:flex items-center bg-white/10 rounded-full px-4 py-2 text-white cursor-pointer hover:bg-white/20 transition-colors"
              onClick={() => setIsProfileDialogOpen(true)}
            >
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-indigo-600 text-white">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{user.name}</span>
            </div>
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/30"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-3xl mx-auto">
          {/* Welcome section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none">
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Bem-vindo de volta, {user.name.split(" ")[0]}!</h2>
                    <p className="text-gray-600 mt-1">Acesse suas anotações e materiais de estudo abaixo.</p>
                    <p className="text-sm text-indigo-600 mt-2 font-medium">{getSubscriptionText(user.subscription)}</p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Pesquisar matérias ou módulos..."
                        className="pl-10 pr-4 py-2 w-full md:w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subject Selection - Mostrar apenas para usuários sem assinatura completa */}
          {!hasFullSubscription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none">
                <CardContent className="p-5 md:p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-indigo-600" />
                    Escolha a Matéria
                  </h2>

                  <div className="flex flex-wrap gap-2">
                    {filteredSubjects.map((subject) => (
                      <motion.div
                        key={subject.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={activeSubject === subject.name ? "default" : "outline"}
                          onClick={() => handleSubjectChange(subject.name)}
                          className={`transition-all ${
                            activeSubject === subject.name
                              ? "bg-indigo-600 hover:bg-indigo-700"
                              : "hover:border-indigo-400 hover:text-indigo-600"
                          }`}
                        >
                          <span className="mr-2">{subject.icon}</span>
                          {subject.name}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Conteúdo para usuários com assinatura completa - mostrar todas as matérias */}
          {hasFullSubscription && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-8"
            >
              {filteredSubjects.map((subject) => (
                <Card
                  key={subject.id}
                  className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none"
                >
                  <CardHeader className="bg-indigo-600 text-white p-5">
                    <CardTitle className="flex items-center text-xl">
                      <span className="mr-2">{subject.icon}</span>
                      {subject.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 md:p-6">
                    <div className="grid grid-cols-1 gap-4">
                      {subject.modules
                        .filter((module: Module) => !module.title.includes("Matéria Completa"))
                        .map((module: Module) => (
                          <Card
                            key={module.id}
                            className="border border-gray-200 hover:border-indigo-300 transition-colors"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center flex-wrap">
                                    <h3 className="font-semibold text-gray-800">{module.title}</h3>
                                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Incluído na assinatura
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                                  onClick={() => handleDownloadPDF(subject.name, module.title)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {/* Módulos para a matéria selecionada - apenas para usuários sem assinatura completa */}
          {!hasFullSubscription && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
              key={activeSubject}
              className="mb-8"
            >
              {activeSubjectData ? (
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none">
                  <CardHeader className="bg-indigo-600 text-white p-6">
                    <CardTitle className="flex items-center text-xl">
                      <span className="mr-2">{activeSubjectData.icon}</span>
                      {activeSubjectData.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 md:p-6">
                    <div className="grid grid-cols-1 gap-4">
                      {activeSubjectData.modules
                        .filter((module: Module) => !module.title.includes("Matéria Completa"))
                        .map((module: Module, index: number) => {
                          // Verificar se o módulo está disponível
                          const isAvailable = module.purchased;
                          console.log(`Módulo: ${module.title}, Disponível: ${isAvailable}`);

                          return (
                            <motion.div
                              key={module.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <Card
                                className={`border ${isAvailable ? "border-gray-200 hover:border-indigo-300" : "border-gray-200 bg-gray-50"} transition-colors`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center flex-wrap">
                                        <h3 className="font-semibold text-gray-800">{module.title}</h3>
                                        {!isAvailable && (
                                          <span className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center">
                                            <Lock className="h-3 w-3 mr-1" />
                                            Bloqueado
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                    </div>
                                    {isAvailable ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                                        onClick={() => handleDownloadPDF(activeSubjectData.name, module.title)}
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        PDF
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={() => handlePurchaseModule(activeSubjectData.name, module.title, module.id)}
                                      >
                                        Comprar
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Selecione uma matéria</h3>
                    <p className="text-gray-600">Escolha uma matéria acima para ver os módulos disponíveis.</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* No results message */}
          {filteredSubjects.length === 0 && (
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-gray-600">Não encontramos matérias ou módulos correspondentes à sua pesquisa.</p>
                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => setSearchQuery("")}>
                  Limpar pesquisa
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <footer className="mt-12 text-center text-indigo-200">
            <p>© {new Date().getFullYear()} Anotações Universitárias. Todos os direitos reservados.</p>
            <p className="mt-2">Contato: contato@anotacoesuniversitarias.com</p>
          </footer>
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Perfil do Usuário</DialogTitle>
            <DialogDescription className="pt-2">Informações da sua conta e assinatura</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="flex items-center">
              <Avatar className="h-16 w-16 mr-4">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-indigo-600 text-white text-xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-1">Plano atual</h4>
              <p className="text-indigo-600 font-semibold">{getSubscriptionText(user.subscription)}</p>
              <p className="text-gray-600 text-sm mt-2">{getSubscriptionDescription(user.subscription)}</p>

              {user.subscription === "monthly" && (
                <div className="mt-3 space-y-3">
                  <div className="text-sm text-gray-500 mb-2">Próxima cobrança: 15/04/2023</div>

                  {/* Opção de upgrade para usuários com plano mensal */}
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                      if (
                        confirm(
                          "Deseja fazer upgrade para o plano vitalício? Você será cobrado pela diferença de valor.",
                        )
                      ) {
                        alert("Upgrade realizado com sucesso! Agora você tem acesso vitalício a todos os materiais.")
                        localStorage.setItem("subscriptionType", "lifetime")
                        setUserSubscription("lifetime")
                        setIsProfileDialogOpen(false)
                      }
                    }}
                  >
                    Fazer upgrade para plano vitalício
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={() => {
                      if (
                        confirm(
                          "Tem certeza que deseja cancelar sua assinatura? Você perderá acesso a todos os materiais no final do período atual.",
                        )
                      ) {
                        alert(
                          "Sua assinatura foi cancelada com sucesso. Você terá acesso aos materiais até o final do período atual.",
                        )
                        localStorage.setItem("subscriptionType", "none")
                        setUserSubscription("none")
                        setIsProfileDialogOpen(false)
                      }
                    }}
                  >
                    Cancelar assinatura
                  </Button>
                </div>
              )}

              {user.subscription === "module" && (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-gray-600">Atualize seu plano para ter acesso a todos os materiais:</p>

                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                      if (confirm("Deseja assinar o plano mensal? Você terá acesso a todos os materiais.")) {
                        alert("Assinatura realizada com sucesso! Agora você tem acesso a todos os materiais.")
                        localStorage.setItem("subscriptionType", "monthly")
                        setUserSubscription("monthly")
                        setIsProfileDialogOpen(false)
                      }
                    }}
                  >
                    Assinar plano mensal (R$29,90/mês)
                  </Button>

                  <Button
                    className="w-full bg-indigo-700 hover:bg-indigo-800"
                    onClick={() => {
                      if (
                        confirm("Deseja assinar o plano vitalício? Você terá acesso permanente a todos os materiais.")
                      ) {
                        alert("Assinatura realizada com sucesso! Agora você tem acesso vitalício a todos os materiais.")
                        localStorage.setItem("subscriptionType", "lifetime")
                        setUserSubscription("lifetime")
                        setIsProfileDialogOpen(false)
                      }
                    }}
                  >
                    Assinar plano vitalício (R$299,90)
                  </Button>
                </div>
              )}

              {user.subscription === "none" && (
                <Button
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => {
                    setIsProfileDialogOpen(false)
                    router.push("/")
                  }}
                >
                  Ver planos disponíveis
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

