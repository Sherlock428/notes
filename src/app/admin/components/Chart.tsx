"use client"

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// Simple interface for the Chart component
interface ChartProps {
  type: 'line' | 'bar'
  data: any
  options?: any
  title?: string
  className?: string
  height?: number
}

export default function Chart({
  type,
  data,
  options = {},
  title,
  className = '',
  height = 300
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)

  useEffect(() => {
    // Only run this on the client
    if (typeof window === 'undefined') return
    
    // Clear any previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
      chartInstanceRef.current = null
    }
    
    // Wait for the canvas to be available
    if (!canvasRef.current) return
    
    // Create the chart once the component mounts
    const initChart = async () => {
      try {
        // Access Chart from window (global)
        if (!window.Chart) {
          // Tente carregar Chart através do escopo global (já deve estar disponível)
          console.log("Chart library not found in window, attempting to load...")
          return
        }
        
        // Create default chart options
        const defaultOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: !!title,
              text: title || '',
            }
          },
        }
        
        // Create a new chart
        chartInstanceRef.current = new window.Chart(canvasRef.current, {
          type,
          data,
          options: { ...defaultOptions, ...options }
        })
      } catch (error) {
        console.error('Error creating chart:', error)
      }
    }
    
    initChart()
    
    // Clean up on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [data, options, title, type])

  return (
    <div className={cn("bg-white p-4 rounded-lg shadow-md", className)}>
      {title && <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>}
      <div style={{ height: `${height}px` }} className="relative">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

// Add Chart to Window object for TypeScript
declare global {
  interface Window {
    Chart: any
  }
} 