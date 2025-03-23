"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TestResult {
  endpoint: string
  status: "success" | "error" | "pending"
  message: string
  data?: any
  error?: any
}

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const endpoints = [
    { name: "Login", fn: () => api.auth.login("teste@exemplo.com", "senha123"), endpoint: "/login" },
    { name: "Registro", fn: () => api.auth.register("Teste", "teste@exemplo.com", "senha123"), endpoint: "/register" },
    { name: "Perfil", fn: () => api.auth.profile(), endpoint: "/profile" },
    { name: "Planos", fn: () => api.plans.getAll(), endpoint: "/plans" },
  ]

  const testEndpoint = async (name: string, fn: () => Promise<any>, endpoint: string) => {
    try {
      setResults((prev) => [
        ...prev,
        {
          endpoint: `${name} (${endpoint})`,
          status: "pending",
          message: "Testando conexão...",
        },
      ])

      const response = await fn()

      setResults((prev) =>
        prev.map((result) =>
          result.endpoint === `${name} (${endpoint})`
            ? {
                ...result,
                status: "success",
                message: "Conexão bem-sucedida!",
                data: response,
              }
            : result
        )
      )
    } catch (error: any) {
      console.error(`Erro ao testar ${name}:`, error)
      
      setResults((prev) =>
        prev.map((result) =>
          result.endpoint === `${name} (${endpoint})`
            ? {
                ...result,
                status: "error",
                message: `Erro: ${error.message || "Desconhecido"}`,
                error: error,
              }
            : result
        )
      )
    }
  }

  const runTests = async () => {
    setIsLoading(true)
    setResults([])

    // Teste de conexão básica com o backend
    try {
      setResults([
        {
          endpoint: "Teste de Conexão Básica",
          status: "pending",
          message: "Verificando se o servidor está online...",
        },
      ])

      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
        signal: controller.signal,
      }).catch((err) => {
        throw new Error(`Não foi possível conectar ao servidor: ${err.message}`)
      })

      clearTimeout(id)

      setResults([
        {
          endpoint: "Teste de Conexão Básica",
          status: "success",
          message: `Servidor respondeu com status ${response.status}`,
        },
      ])
    } catch (error: any) {
      setResults([
        {
          endpoint: "Teste de Conexão Básica",
          status: "error",
          message: `Falha na conexão: ${error.message}`,
          error,
        },
      ])
      
      setIsLoading(false)
      return // Pare os testes se não conseguir se conectar
    }

    // Testar cada endpoint da API
    for (const { name, fn, endpoint } of endpoints) {
      await testEndpoint(name, fn, endpoint)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    // Mostrar configuração da API
    console.log("API_BASE_URL:", process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Diagnóstico de Conexão com API Flask</CardTitle>
          <p className="text-gray-600">
            Endpoint base: <code>{process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}</code>
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 mb-6">
            {isLoading ? "Testando..." : "Iniciar Testes"}
          </Button>

          <div className="space-y-4">
            {results.length === 0 && !isLoading && (
              <p className="text-gray-600">Clique em "Iniciar Testes" para verificar a conexão com a API.</p>
            )}

            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  result.status === "success"
                    ? "bg-green-50 border border-green-200"
                    : result.status === "error"
                    ? "bg-red-50 border border-red-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <h3 className="font-medium mb-2">{result.endpoint}</h3>
                <p
                  className={`${
                    result.status === "success"
                      ? "text-green-700"
                      : result.status === "error"
                      ? "text-red-700"
                      : "text-yellow-700"
                  }`}
                >
                  {result.message}
                </p>

                {result.data && (
                  <div className="mt-2">
                    <details>
                      <summary className="cursor-pointer text-gray-700 text-sm">Ver dados retornados</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                {result.error && (
                  <div className="mt-2">
                    <details>
                      <summary className="cursor-pointer text-red-700 text-sm">Ver detalhes do erro</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 