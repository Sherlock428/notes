import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { User, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { api } from "@/lib/api"

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: { name: string; email: string }) => void;
  userData: {
    name: string;
    email: string;
  };
  formData: {
    name: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setFormData: (data: any) => void;
  formErrors: {
    name: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
}

export function EditProfileModal({
  isOpen,
  onClose,
  onSave,
  userData,
  formData,
  setFormData,
  formErrors
}: EditProfileModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({})

  // Limpar estados quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      setApiError("")
      setErrors({})
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Limpar erros ao digitar
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof typeof errors]
        return newErrors
      })
    }
    
    // Limpar erro da API quando o usuário modifica o formulário
    if (apiError) {
      setApiError("")
    }
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}
    
    // Validações básicas
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }
    
    // Verificar se alguma senha foi fornecida
    if (formData.newPassword || formData.confirmPassword) {
      // Se quiser alterar a senha, a senha atual é obrigatória
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Senha atual é obrigatória para alterar a senha"
      }
      
      if (!formData.newPassword) {
        newErrors.newPassword = "Nova senha é obrigatória"
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirmação de senha é obrigatória"
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "As senhas não coincidem"
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setApiError("")
    
    try {
      // Preparar dados para enviar à API
      const requestData = {
        name: formData.name,
        email: formData.email,
        password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword
      }
      
      console.log("Enviando dados para API:", requestData);
      
      // Enviar para a API
      const response = await api.auth.editUser(requestData)
      
      console.log("Resposta da API:", response);
      
      // Verificar se a resposta foi bem-sucedida (API pode retornar 'success' ou 'sucess')
      if (response && (response.success === true || response.sucess === true)) {
        console.log("Atualização bem-sucedida!");
        
        // Limpar qualquer erro anterior
        setApiError("")
        setErrors({})
        
        // Atualizar os dados do usuário e chamar callback de sucesso
        const updatedUser = {
          name: formData.name,
          email: formData.email
        };
        
        // Chamar callback de sucesso com os dados atualizados
        onSave(updatedUser);
        
        // Fechar o modal imediatamente após o sucesso
        onClose();
      } else {
        // Se a API retornou sucesso=false, tratar como erro
        console.log("Erro retornado pela API:", response);
        handleApiError(response)
      }
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error)
      handleApiError(error.response?.data || { message: "Erro ao atualizar perfil. Tente novamente." })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleApiError = (errorData: any) => {
    const errorMessage = errorData.message || "Erro ao atualizar perfil. Tente novamente."
    
    // Verificar mensagens específicas para mapear para campos específicos
    if (errorMessage.includes("Senhas não coincidem")) {
      setErrors(prev => ({ ...prev, confirmPassword: "As senhas não coincidem" }))
    }
    else if (errorMessage.includes("senha incorreta")) {
      setErrors(prev => ({ ...prev, currentPassword: "Senha atual incorreta" }))
    }
    else {
      // Erro genérico
      setApiError(errorMessage)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Editar Perfil</DialogTitle>
          <DialogDescription className="pt-2">Atualize suas informações pessoais</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{apiError}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "border-red-500" : ""}
              placeholder="Seu nome"
            />
            {errors.name && (
              <p className="text-red-500 text-sm flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "border-red-500" : ""}
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Senha Atual</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={errors.currentPassword ? "border-red-500" : ""}
                placeholder="Digite sua senha atual"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nova Senha</label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={errors.newPassword ? "border-red-500" : ""}
                placeholder="Digite sua nova senha"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.newPassword}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "border-red-500" : ""}
                placeholder="Confirme sua nova senha"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 