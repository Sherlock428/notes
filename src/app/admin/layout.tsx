"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  CreditCard, 
  Menu,
  X
} from 'lucide-react'

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) => {
  const pathname = usePathname()
  
  const menuItems = [
    { 
      path: "/admin/dashboard", 
      label: "Dashboard", 
      icon: <LayoutDashboard className="w-5 h-5 mr-3" /> 
    },
    { 
      path: "/admin/users", 
      label: "Usuários", 
      icon: <Users className="w-5 h-5 mr-3" /> 
    },
    { 
      path: "/admin/courses", 
      label: "Cursos", 
      icon: <BookOpen className="w-5 h-5 mr-3" /> 
    },
    { 
      path: "/admin/modules", 
      label: "Módulos", 
      icon: <FileText className="w-5 h-5 mr-3" /> 
    },
    { 
      path: "/admin/subscribes", 
      label: "Assinaturas", 
      icon: <CreditCard className="w-5 h-5 mr-3" /> 
    }
  ]

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-indigo-900 text-white w-64 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:relative lg:translate-x-0"
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Admin Panel</h1>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-indigo-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center px-4 py-3 rounded-lg transition-colors",
                pathname === item.path 
                  ? "bg-indigo-800 text-white" 
                  : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow">
          <div className="px-4 py-4 flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md lg:hidden hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Painel Administrativo</h1>
            <div></div> {/* Placeholder para manter o justify-between */}
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 