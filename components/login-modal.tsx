"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Lock, Eye, EyeOff } from "lucide-react"
import { api } from "../lib/api"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  redirectToHome?: boolean
}

export function LoginModal({ isOpen, onClose, onSuccess, redirectToHome = true }: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Limpar erro quando o usuário digita
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) newErrors.email = "Email é obrigatório"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email inválido"
    if (!formData.password.trim()) newErrors.password = "Senha é obrigatória"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      alert("Por favor, preencha todos os campos");
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Tentando login com:", formData.email);
      
      // Passar o parâmetro redirectAfterLogin baseado na prop redirectToHome
      await api.auth.login({ 
        email: formData.email, 
        password: formData.password,
        redirectAfterLogin: redirectToHome
      });
      
      // Chamar onSuccess se existir - isso permite abrir o modal de checkout após o login
      if (onSuccess) {
        onSuccess();
      }
      
      // Fechamos o modal independentemente do resultado
      onClose();
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Entrar na sua conta</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Acesse suas anotações e materiais de estudo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Button type="button" variant="link" className="p-0 h-auto text-xs text-indigo-600">
                Esqueceu a senha?
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={formData.password}
                onChange={handleChange}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-600 mt-2">
            <Lock className="h-4 w-4 text-indigo-600 mr-2" />
            <span>Seus dados estão seguros e criptografados</span>
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Button type="button" variant="link" className="p-0 h-auto text-indigo-600" onClick={onClose}>
              Cadastre-se
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

