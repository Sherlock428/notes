"use client"

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react'

interface CardProps {
  title: string
  value: string | number
  icon?: ReactNode
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export default function Card({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  trendValue,
  className = ''
}: CardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-md p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        {icon && <div className="text-indigo-500">{icon}</div>}
      </div>
      
      <div className="flex flex-col">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
        
        {trend && trendValue && (
          <div className="flex items-center mt-4">
            <div 
              className={cn(
                "flex items-center text-sm font-medium",
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-gray-500'
              )}
            >
              {trend === 'up' ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : trend === 'down' ? (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              ) : (
                <MinusIcon className="h-4 w-4 mr-1" />
              )}
              {trendValue}
            </div>
            <span className="text-sm text-gray-500 ml-1">desde o último período</span>
          </div>
        )}
      </div>
    </div>
  )
} 