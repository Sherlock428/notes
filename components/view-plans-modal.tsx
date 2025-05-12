import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { GraduationCap, CheckCircle } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface Plan {
  id: number;
  name: string;
  price: number;
  type: "monthly" | "lifetime";
  course_name: string;
}

interface ViewPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSubscriptions: {
    id: number;
    name: string;
    course_name: string;
    date_buy: string;
    expired_date: string | null;
  }[];
  plans: Plan[];
}

export function ViewPlansModal({
  isOpen,
  onClose,
  userSubscriptions,
  plans
}: ViewPlansModalProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const router = useRouter()

  // Extrair cursos únicos dos planos
  const courses = Array.from(new Set(plans.map(plan => plan.course_name)))

  // Filtrar planos do curso selecionado
  const coursePlans = plans.filter(plan => plan.course_name === selectedCourse)

  // Verificar se o usuário já tem uma assinatura do tipo específico para o curso
  const hasSubscription = (courseName: string, type: "monthly" | "lifetime") => {
    return userSubscriptions.some(sub => {
      if (sub.course_name !== courseName) return false
      
      const name = sub.name.toLowerCase()
      if (type === "monthly") {
        return name.includes("mensal") || name.includes("monthly") || name.includes("mes")
      } else {
        return name.includes("vitalícia") || name.includes("vitalicia") || 
               name.includes("lifetime") || name.includes("vita")
      }
    })
  }

  // Filtrar planos do curso selecionado, removendo os que o usuário já possui
  const availablePlans = coursePlans.filter(plan => {
    const hasMonthly = hasSubscription(plan.course_name, "monthly")
    const hasLifetime = hasSubscription(plan.course_name, "lifetime")
    
    // Se o usuário tem vitalícia, não mostra nenhum plano do curso
    if (hasLifetime) return false
    
    // Se o usuário tem mensal, só mostra vitalícia
    if (hasMonthly) return plan.type === "lifetime"
    
    // Se não tem nenhuma assinatura, mostra todos os planos
    return true
  })

  // Verificar se o curso tem planos disponíveis
  const hasAvailablePlans = (courseName: string) => {
    // Se o usuário tem plano vitalício, não há planos disponíveis
    const hasLifetime = hasSubscription(courseName, "lifetime")
    if (hasLifetime) return false
    
    // Se o usuário tem plano mensal, sempre permite clicar para ver a opção de upgrade
    const hasMonthly = hasSubscription(courseName, "monthly")
    if (hasMonthly) return true
    
    // Se não tem nenhuma assinatura, sempre tem planos disponíveis
    return true
  }

  // Função para redirecionar para o checkout
  const handleCheckout = (planId: number, planType: "monthly" | "lifetime") => {
    onClose() // Fechar o modal
    
    // Redirecionar para a página de checkout com os parâmetros
    const planTypeParam = planType === "monthly" ? "mensal" : "vitalicia"
    router.push(`/checkout_user/assinatura/${planId}?type=${planTypeParam}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Planos Disponíveis</DialogTitle>
          <DialogDescription className="pt-2">Escolha um curso para ver os planos disponíveis</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Seleção de curso */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Selecione o curso</label>
            <div className="flex flex-wrap gap-2">
              {courses.map((course) => {
                const hasPlans = hasAvailablePlans(course)
                const hasMonthly = hasSubscription(course, "monthly")
                const hasLifetime = hasSubscription(course, "lifetime")
                
                return (
                  <Button
                    key={course}
                    variant={selectedCourse === course ? "default" : "outline"}
                    onClick={() => setSelectedCourse(course)}
                    className="flex items-center"
                    disabled={!hasPlans}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    {course}
                    {hasLifetime && (
                      <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Completo
                      </span>
                    )}
                    {hasMonthly && !hasLifetime && (
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Mensal
                      </span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Planos do curso selecionado */}
          <AnimatePresence mode="wait">
            {selectedCourse && (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                key={selectedCourse}
              >
                <h3 className="font-semibold text-lg">Planos disponíveis para {selectedCourse}</h3>
                
                {/* Se não tem planos disponíveis (tem plano vitalício) */}
                {availablePlans.length === 0 && hasSubscription(selectedCourse, "lifetime") && (
                  <motion.div 
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-800">Você já possui o melhor plano!</p>
                    <p className="text-gray-600 mt-2">Com a assinatura vitalícia, você tem acesso completo a todos os materiais.</p>
                  </motion.div>
                )}
                
                {/* Se tem plano mensal */}
                {availablePlans.length > 0 && hasSubscription(selectedCourse, "monthly") && (
                  <motion.div 
                    className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <p className="text-blue-800 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Você já possui a assinatura mensal deste curso.
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Faça upgrade para o plano vitalício e garanta acesso permanente a todos os conteúdos.
                    </p>
                  </motion.div>
                )}
                
                {/* Lista de planos disponíveis */}
                {availablePlans.length > 0 && (
                  <div className="grid gap-4">
                    {availablePlans.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        className={`border rounded-lg p-4 transition-all ${
                          plan.type === "lifetime" 
                            ? "border-purple-300 bg-purple-50 hover:border-purple-400 shadow-md hover:shadow-lg" 
                            : "border-indigo-200 hover:border-indigo-300"
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div>
                              <h4 className="font-semibold text-lg">{plan.name}</h4>
                              <p className="text-sm text-purple-600">{plan.course_name}</p>
                            </div>
                            <p className={`text-2xl font-bold ${plan.type === "lifetime" ? "text-purple-600" : "text-indigo-600"}`}>
                              R$ {plan.price.toFixed(2)}
                            </p>
                            {plan.type === "lifetime" && (
                              <span className="inline-flex items-center text-sm text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Acesso vitalício
                              </span>
                            )}
                          </div>
                          <Button
                            className={`${
                              plan.type === "lifetime" 
                                ? "bg-purple-600 hover:bg-purple-700" 
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                            onClick={() => handleCheckout(plan.id, plan.type)}
                          >
                            {hasSubscription(selectedCourse, "monthly") && plan.type === "lifetime" 
                              ? "Fazer upgrade" 
                              : "Assinar"
                            }
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          
            {!selectedCourse && (
              <motion.div 
                className="text-center py-8 text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                key="no-selection"
              >
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Selecione um curso para ver os planos disponíveis</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
} 