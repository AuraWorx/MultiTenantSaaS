import { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PiiDataChartProps {
  totalCount?: number;
  piiCount?: number;
  loading?: boolean;
  error?: string | null;
  useSmallHeight?: boolean;
}

export function PiiDataChart({ 
  totalCount = 0, 
  piiCount = 0, 
  loading = false,
  error = null,
  useSmallHeight = false
}: PiiDataChartProps) {
  const chartRef = useRef<Chart | null>(null);
  
  // Use default data if none provided (for initial render)
  const nonPiiCount = totalCount > 0 ? totalCount - piiCount : 850;
  const piiCountToUse = piiCount > 0 ? piiCount : 150;
  
  // Height class based on prop
  const heightClass = useSmallHeight ? "h-60" : "h-80";
  
  // Render chart
  useEffect(() => {
    if (loading || error) return;

    const renderChart = () => {
      const canvas = document.getElementById('totalPiiDoughnutChart') as HTMLCanvasElement;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      
      // Create chart
      try {
        chartRef.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Non-PII Prompts', 'PII Prompts'],
            datasets: [{
              data: [nonPiiCount, piiCountToUse],
              backgroundColor: [
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 99, 132, 0.7)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
              }
            }
          }
        });
      } catch (error) {
        console.error('Error creating PII Chart:', error);
      }
    };

    // Render with a slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      renderChart();
    }, 50);
    
    return () => {
      clearTimeout(timer);
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [nonPiiCount, piiCountToUse, loading, error]);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Total vs PII Data</CardTitle>
        <CardDescription>
          Proportion of prompts containing PII
        </CardDescription>
      </CardHeader>
      <CardContent className={`${heightClass} relative`}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-destructive text-center px-4">
            {error}
          </div>
        ) : (
          <canvas id="totalPiiDoughnutChart" />
        )}
      </CardContent>
    </Card>
  );
}