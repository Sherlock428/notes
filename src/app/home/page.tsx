"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { BookOpen, Download, LogOut, FileText, Search, Lock, CheckCircle, GraduationCap, BookCopy } from "lucide-react"
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

interface APICourse {
  id: number;
  name: string;
  modules: APIModule[];
  subscribes: APISubscription[];
}

interface APISubscription {
  id: number;
  name: string;
  price: number;
}

interface UserModule {
  id: number;
  name: string;
  subject: string;
  price: number;
  purchased: boolean;
  pdf_path?: string;
}

interface UserCourse {
  id: number;
  name: string;
  description: string;
  module: UserModule[];
}

interface UserData {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  subscription?: string;
  module?: UserModule[]; // Alterado de courses para module conforme API
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [activeSubject, setActiveSubject] = useState("")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [activeTab, setActiveTab] = useState("search")
  const [userCourses, setUserCourses] = useState<UserCourse[]>([])
  const [activeCourse, setActiveCourse] = useState<UserCourse | null>(null)
  const [userSubscription, setUserSubscription] = useState<string>("none")
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    // Verificar se existe preferência salva
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarVisible')
      return saved !== null ? JSON.parse(saved) : true
    }
    return true
  })

  // Salvar preferência quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarVisible', JSON.stringify(sidebarVisible))
    }
  }, [sidebarVisible])

  // Carregar dados do usuário
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
      // Verificar se tem o token
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn("Token de acesso não encontrado, redirecionando para login");
        router.push('/');
        return;
      }
      
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
        
        // Buscar todos os cursos e módulos disponíveis
        console.log("Buscando planos e matérias disponíveis...");
        const plansData: APICourse[] = await api.plans.getAll();
        console.log("Dados de planos recebidos:", plansData);
        
        if (plansData && plansData.length > 0) {
          console.log(`Encontrados ${plansData.length} cursos`);
          
          // Preparar os dados dos cursos
          const coursesArray = plansData.map(course => {
            // Para cada módulo, verificar se o usuário já comprou
            const modulesWithPurchaseStatus = course.modules.map(module => {
              // Verificar se o módulo está comprado
              let isPurchased = false;
              
              // Verificar em todos os cursos do perfil do usuário
              if (profileData.module) {
                for (const userModule of profileData.module) {
                  if (userModule.id === module.id) {
                    isPurchased = true;
                    break;
                  }
                }
              }
              
              console.log(`Módulo ${module.name} (ID: ${module.id}) está comprado: ${isPurchased}`);
              
              return {
                id: module.id,
                name: module.name,
                subject: module.subject,
                price: module.price,
                purchased: isPurchased
              };
            });
            
            return {
              id: course.id,
              name: course.name,
              description: "Descrição do curso",
              module: modulesWithPurchaseStatus
            };
          });
          
          console.log("Cursos processados:", coursesArray);
          
          // Definir o primeiro curso como ativo se houver algum
          if (coursesArray.length > 0 && !activeCourse) {
            setActiveCourse(coursesArray[0]);
            // Definir a primeira matéria do curso como ativa
            if (coursesArray[0].module.length > 0) {
              const uniqueSubjects = Array.from(
                new Set(coursesArray[0].module.map(module => module.subject))
              );
              if (uniqueSubjects.length > 0) {
                setActiveSubject(uniqueSubjects[0]);
              }
            }
          }
          
          setUserCourses(coursesArray);
          
          // Restaurar a funcionalidade de pesquisa
          // Construir a estrutura de dados de matérias para a pesquisa
          const subjectsForSearch: Subject[] = [];
          
          for (const course of coursesArray) {
            // Agrupar por matéria
            const subjectMap = new Map<string, Module[]>();
            
            for (const module of course.module) {
              if (!subjectMap.has(module.subject)) {
                subjectMap.set(module.subject, []);
              }
              
              subjectMap.get(module.subject)?.push({
              id: module.id,
              title: module.name,
                description: "Descrição do módulo",
                purchased: module.purchased,
              pdfUrl: "#"
            });
            }
            
            // Converter para o formato esperado por subjects
            for (const [subjectName, modules] of subjectMap.entries()) {
              subjectsForSearch.push({
                id: subjectsForSearch.length + 1,
                name: subjectName,
                icon: getIconForSubject(subjectName),
                modules: modules
              });
            }
          }
          
          // Atualizar o estado subjects para a pesquisa
          setSubjects(subjectsForSearch);
      }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
      router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []); // Executar apenas uma vez na montagem do componente

  // Extrair subjects únicos do curso ativo
  useEffect(() => {
    if (activeCourse) {
      const uniqueSubjects = Array.from(
        new Set(activeCourse.module.map(module => module.subject))
      ) as string[];
      
      if (!activeSubject && uniqueSubjects.length > 0) {
        setActiveSubject(uniqueSubjects[0]);
      }
    }
  }, [activeCourse]);

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
    subscription: "none",
  }

  // Função para obter o texto do tipo de assinatura
  const getSubscriptionText = (type: string | undefined) => {
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
  const getSubscriptionDescription = (type: string | undefined) => {
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
            (module) =>
              module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              module.description.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : subjects

  // Função para pesquisar e direcionar para a matéria ou módulo
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filtrar resultados da pesquisa
  const searchResults = searchQuery ? userCourses.flatMap(course => 
    course.module.filter(module => 
      module.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(module => ({
      courseName: course.name,
      subject: module.subject,
      module: module
    }))
  ) : [];

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
  const handleDownloadPDF = (subjectName: string, moduleTitle: string, moduleId: number) => {
    // Verificar se o módulo existe
    const module = userData?.module?.find(m => m.id === moduleId);
    
    if (!module) {
      alert("Não foi possível encontrar o PDF para download.");
      return;
    }
    
    try {
      // Obter o token de autenticação
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert("Você precisa estar autenticado para baixar este arquivo.");
        router.push('/');
        return;
      }
      
      // Mostrar feedback ao usuário
      console.log(`Iniciando download do módulo: ${moduleId}`);
      
      // Configurar a URL base da API
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const downloadUrl = `${apiBaseUrl}/download/${moduleId}`;
      
      // Iniciar download via fetch
      console.log("Iniciando download via fetch...");
      fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        },
        mode: 'cors',
        credentials: 'include'
      })
      .then(async response => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        
        // Verificar se a resposta é um PDF
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
          throw new Error('Resposta não é um PDF válido');
        }
        
        return response.blob();
      })
      .then(blob => {
        // Criar URL do blob
        const url = window.URL.createObjectURL(blob);
        
        // Criar elemento de download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${moduleTitle}.pdf`;
        a.style.display = 'none';
        
        // Adicionar ao DOM e clicar
        document.body.appendChild(a);
        a.click();
        
        // Limpar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log("Download iniciado com sucesso!");
      })
      .catch(error => {
        console.error("Erro no download:", error);
        alert(error.message || "Ocorreu um erro ao tentar baixar o PDF. Tente novamente mais tarde.");
      });
      
    } catch (error) {
      console.error("Erro ao iniciar download:", error);
      alert("Ocorreu um erro ao tentar baixar o PDF. Tente novamente mais tarde.");
    }
  }

  // Função para comprar um módulo
  const handlePurchaseModule = (subjectName: string, moduleTitle: string, moduleId: number) => {
    // Redirecionar para a rota dinâmica que fará o processamento e redirecionamento
    router.push(`/checkout_user/modulo/${moduleId}`);
  }

  // Filtrar módulos por matéria
  const filteredModules = activeCourse?.module.filter(
    module => module.subject === activeSubject
  ) || [];

  // Extrair todos os módulos comprados pelo usuário para a barra lateral
  const allPurchasedModules = userCourses.flatMap(course => 
    course.module.filter(module => module.purchased)
      .map(module => ({
        ...module,
        courseName: course.name
      }))
  );

  // Agrupar módulos comprados por curso e matéria
  const purchasedModulesBySubject = allPurchasedModules.reduce((acc, module) => {
    // Criar a chave para o agrupamento (combinação de curso e matéria)
    const key = `${module.courseName}|${module.subject}`;
    
    if (!acc[key]) {
      acc[key] = {
        courseName: module.courseName,
        subject: module.subject,
        modules: []
      };
    }
    
    acc[key].modules.push(module);
    return acc;
  }, {} as Record<string, { courseName: string; subject: string; modules: typeof allPurchasedModules }>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 relative">
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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

      {/* Layout com sidebar */}
      <div className="flex h-screen relative z-10">
        {/* Overlay para mobile quando o sidebar está aberto */}
        {sidebarVisible && (
          <motion.div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarVisible(false)}
          />
        )}
        
        {/* Sidebar dos módulos comprados */}
        <motion.div 
          className={`bg-white/10 backdrop-blur-md text-white border-r border-white/10 overflow-y-auto md:block
            ${sidebarVisible ? 'fixed md:relative left-0 top-0 bottom-0 z-40 md:z-0 w-64' : 'hidden md:block md:w-0'}`}
          initial={{ width: "16rem", x: "-100%" }}
          animate={{ 
            width: sidebarVisible ? "16rem" : "0rem",
            x: sidebarVisible ? "0%" : "-100%",
            opacity: sidebarVisible ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-400" />
              Meus Módulos
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/20"
              onClick={() => setSidebarVisible(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          
          <p className="text-xs text-indigo-200 px-4 pt-1">Conteúdo já adquirido</p>

          <div className="p-3">
            {Object.values(purchasedModulesBySubject).length === 0 ? (
              <div className="text-center py-6">
                <Lock className="h-8 w-8 text-indigo-300 mx-auto mb-2" />
                <p className="text-sm">Você ainda não possui módulos</p>
                <p className="text-xs text-indigo-200 mt-1">Compre seu primeiro módulo!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.values(purchasedModulesBySubject).map((group) => (
                  <div 
                    key={`${group.courseName}-${group.subject}`} 
                    className="bg-white/5 rounded-lg p-3"
                  >
                    <div className="mb-2">
                      <div className="flex items-center text-indigo-200 text-xs mb-1">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {group.courseName}
                      </div>
                      <div className="font-medium flex items-center">
                        <span className="mr-2">{getIconForSubject(group.subject)}</span>
                        {group.subject}
                      </div>
                    </div>

                    <div className="space-y-2 mt-2">
                      {group.modules.map((module) => (
                        <div 
                          key={module.id}
                          className="text-sm bg-white/5 hover:bg-white/10 rounded p-2 cursor-pointer transition-colors"
                          onClick={() => handleDownloadPDF(group.subject, module.name, module.id)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="line-clamp-1">{module.name}</span>
                            <Download className="h-3 w-3 text-green-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Botão para mostrar/esconder sidebar (apenas desktop) */}
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 md:block hidden"
          style={{ 
            left: sidebarVisible ? "15.5rem" : "0.5rem",
            transition: "left 0.3s ease-in-out"
          }}
        >
          <motion.button
            className="bg-indigo-600 text-white p-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
            onClick={() => setSidebarVisible(!sidebarVisible)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={false}
            animate={{ backgroundColor: sidebarVisible ? "#4F46E5" : "#6366F1" }}
            transition={{ duration: 0.2 }}
          >
            {sidebarVisible ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </motion.button>
        </div>

        {/* Conteúdo principal */}
        <motion.div 
          className="flex-1 overflow-y-auto"
          animate={{
            marginLeft: sidebarVisible ? "0" : "-16rem",
            width: "100%"
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
        >
          <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
          <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon" 
                  className="md:hidden mr-2 text-white hover:bg-white/20"
                  onClick={() => setSidebarVisible(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
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
                        placeholder="Pesquisar matéria ou módulo..."
                        className="pl-10 pr-4 py-2 w-full md:w-64"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

              {/* Resultados da pesquisa */}
              {searchQuery && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none">
                    <CardHeader className="bg-indigo-600 text-white p-6">
                      <CardTitle className="flex items-center text-xl">
                        <Search className="mr-2 h-5 w-5" />
                        Resultados da pesquisa
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 md:p-6">
                      <div className="space-y-6">
                        {searchResults.map((result, index) => (
                          <motion.div
                            key={`${result.courseName}-${result.subject}-${result.module.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:border-indigo-200 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <GraduationCap className="h-5 w-5 text-indigo-600 mr-2" />
                                  <span className="text-lg font-bold text-gray-800">{result.courseName}</span>
                                </div>
                                <div className="flex items-center ml-7">
                                  <BookOpen className="h-4 w-4 text-indigo-500 mr-2" />
                                  <span className="text-base font-medium text-indigo-600">{result.subject}</span>
                                </div>
                                <div className="ml-7">
                                  <h3 className="font-semibold text-gray-700">{result.module.name}</h3>
                                  <p className="text-sm text-gray-600">R$ {result.module.price.toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {result.module.purchased ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                                    onClick={() => handleDownloadPDF(result.subject, result.module.name, result.module.id)}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    PDF
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => handlePurchaseModule(result.subject, result.module.name, result.module.id)}
                                  >
                                    Comprar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Conteúdo normal (cursos e matérias) - só mostra quando não há pesquisa */}
              {!searchQuery && (
                <>
                  {/* Course Selection */}
                  {userCourses.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="mb-8"
                    >
                      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none">
                        <CardContent className="p-5 md:p-6">
                          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <GraduationCap className="mr-2 h-5 w-5 text-indigo-600" />
                            Seus Cursos
                          </h2>

                          <div className="flex flex-wrap gap-2">
                            {userCourses.map((course) => (
                              <motion.div
                                key={course.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant={activeCourse?.id === course.id ? "default" : "outline"}
                                  onClick={() => {
                                    setActiveCourse(course);
                                    if (course.module.length > 0) {
                                      setActiveSubject(course.module[0].subject);
                                    }
                                  }}
                                  className={`transition-all ${
                                    activeCourse?.id === course.id
                                      ? "bg-indigo-600 hover:bg-indigo-700"
                                      : "hover:border-indigo-400 hover:text-indigo-600"
                                  }`}
                                >
                                  <BookCopy className="mr-2 h-4 w-4" />
                                  {course.name}
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Subject Selection */}
                  {activeCourse && (
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
                            Matérias do Curso
                          </h2>

                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(activeCourse.module.map(m => m.subject))).map((subject) => (
                              <motion.div
                                key={`subject-${subject}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant={activeSubject === subject ? "default" : "outline"}
                                  onClick={() => handleSubjectChange(subject)}
                                  className={`transition-all ${
                                    activeSubject === subject
                                      ? "bg-indigo-600 hover:bg-indigo-700"
                                      : "hover:border-indigo-400 hover:text-indigo-600"
                                  }`}
                                >
                                  <span className="mr-2">{getIconForSubject(subject)}</span>
                                  {subject}
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Módulos da matéria selecionada */}
                  {activeCourse && activeSubject && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                      key={activeSubject}
                      className="mb-8"
                    >
                      <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border-none">
                        <CardHeader className="bg-indigo-600 text-white p-6">
                          <CardTitle className="flex items-center text-xl">
                            <span className="mr-2">{getIconForSubject(activeSubject)}</span>
                            {activeSubject}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 md:p-6">
                          {activeCourse.module.filter(module => module.subject === activeSubject).length === 0 ? (
                            <div className="text-center py-8">
                              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum módulo encontrado</h3>
                              <p className="text-gray-600">Não há módulos disponíveis para esta matéria.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4">
                              {activeCourse.module
                                .filter(module => module.subject === activeSubject)
                                .map((module, index) => (
                                  <motion.div
                                    key={module.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                  >
                                    <Card className="border border-gray-200 hover:border-indigo-300 transition-colors">
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <div className="flex items-center flex-wrap">
                                              <h3 className="font-semibold text-gray-800">{module.name}</h3>
                                              {module.purchased ? (
                                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                  Disponível
                                                </span>
                                              ) : (
                                                <span className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center">
                                                  <Lock className="h-3 w-3 mr-1" />
                                                  Bloqueado
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">R$ {module.price.toFixed(2)}</p>
                                          </div>
                                          {module.purchased ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                                              onClick={() => handleDownloadPDF(activeSubject, module.name, module.id)}
                                            >
                                              <Download className="h-4 w-4 mr-1" />
                                              PDF
                                            </Button>
                                          ) : (
                                            <Button
                                              size="sm"
                                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                              onClick={() => handlePurchaseModule(activeSubject, module.name, module.id)}
                                            >
                                              Comprar
                                            </Button>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </>
              )}

              {/* No results message - only show when searching and no results */}
              {searchQuery && filteredSubjects.length === 0 && (
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
        </motion.div>
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

