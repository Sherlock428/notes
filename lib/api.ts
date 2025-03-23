// Configuração base para chamadas de API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

// Função auxiliar para fazer requisições
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  }

  // Adicionar token de autenticação se disponível
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`
  }
  
  console.log(`[API] Fazendo requisição para: ${API_BASE_URL}${endpoint}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Log de debug para a resposta
    console.log(`[API] Resposta recebida (${endpoint}): Status ${response.status}`);
    
    // Se a resposta não for bem-sucedida, lançar um erro
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || "Erro desconhecido" };
      }
      console.error(`[API] Erro na requisição ${endpoint}:`, errorData);
      throw new Error(errorData.error || errorData.message || `Erro ao comunicar com o servidor: ${response.status}`);
    }

    // Para respostas 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Tentar fazer o parse da resposta como JSON
    const data = await response.json();
    console.log(`[API] Dados recebidos (${endpoint}):`, data);
    return data;
  } catch (error) {
    console.error(`[API] Exceção ao chamar ${endpoint}:`, error);
    throw error;
  }
}

// Funções específicas para cada tipo de requisição
export const api = {
  // Autenticação
  auth: {
    login: async ({ email, password, redirectAfterLogin = false }: { 
      email: string; 
      password: string; 
      redirectAfterLogin?: boolean 
    }) => {
      try {
        console.log("Iniciando login...");
        
        const response = await fetchAPI("/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        
        console.log("Resposta do login:", response);
        
        if (response && response.access_token) {
          // Salvar o token de acesso
          localStorage.setItem('access_token', response.access_token);
          
          // Salvar dados do usuário se disponíveis
          if (response.user) {
            localStorage.setItem('user_data', JSON.stringify(response.user));
          }
          
          // Redirecionar apenas se solicitado
          if (redirectAfterLogin) {
            console.log("Login bem-sucedido, redirecionando para /home");
            window.location.href = "/home";
          } else {
            console.log("Login bem-sucedido, sem redirecionamento");
          }
        } else {
          console.error("Resposta de login sem token:", response);
          throw new Error("Token de acesso não encontrado na resposta");
        }
        
        return response;
      } catch (error) {
        console.error("Erro ao fazer login:", error);
        throw error;
      }
    },
    register: async (name: string, email: string, password: string) => {
      return fetchAPI("/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      })
    },
    profile: async () => {
      return fetchAPI("/profile")
    },
  },

  // Planos e Módulos
  plans: {
    getAll: async () => {
      return fetchAPI("/plans")
    },
    getCheckout: async (planType: string, planId: number) => {
      return fetchAPI(`/checkout/${planType}/${planId}`)
    },
  },

  // Pagamentos
  payments: {
    processPayment: async (paymentData: any) => {
      return fetchAPI("/process_payment", {
        method: "POST",
        body: JSON.stringify(paymentData),
      })
    },
    processPix: async (planType: string, planId: number, data: any) => {
      return fetchAPI(`/pix_process/${planType}/${planId}`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
  },
}

// Função para carregar o SDK do Mercado Pago
export async function loadMercadoPagoSDK() {
  if (typeof window !== "undefined" && !window.MercadoPago) {
    console.log("[DEBUG] Carregando SDK do Mercado Pago via função auxiliar")

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://sdk.mercadopago.com/js/v2"
      script.async = true

      script.onload = () => {
        console.log("[DEBUG] SDK carregado com sucesso via função auxiliar")

        // Verificar se public key está configurada corretamente
        const publicKey = "TEST-45341c68-f08c-480b-b607-ee6aa4b1bc8b" // Hardcoded key that works
        if (!publicKey) {
          console.warn("[DEBUG] Chave pública do MP não encontrada")
        } else {
          console.log("[DEBUG] Chave pública do MP encontrada:", publicKey)
        }

        resolve()
      }

      script.onerror = (error) => {
        console.error("[DEBUG] Erro ao carregar SDK do Mercado Pago:", error)
        reject(error)
      }

      document.body.appendChild(script)
    })
  }
  return Promise.resolve()
}
