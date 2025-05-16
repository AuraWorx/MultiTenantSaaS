import { useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

export function DashboardCharts() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Chart dimensions
        const width = chartRef.current.width;
        const height = chartRef.current.height;
        const barWidth = 50;
        const spacing = 30;
        const maxBarHeight = height - 60;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // AI Types and their values
        const aiTypes = [
          { name: 'OpenAI', value: 45, color: '#6366F1' },
          { name: 'Anthropic', value: 30, color: '#8B5CF6' },
          { name: 'Langchain', value: 25, color: '#EC4899' },
          { name: 'Hugging Face', value: 35, color: '#10B981' },
          { name: 'Internal ML', value: 15, color: '#F59E0B' }
        ];
        
        // Calculate starting x position to center the chart
        const totalWidth = aiTypes.length * barWidth + (aiTypes.length - 1) * spacing;
        const startX = (width - totalWidth) / 2;
        
        // Draw bars
        aiTypes.forEach((item, index) => {
          const x = startX + index * (barWidth + spacing);
          const barHeight = (item.value / 60) * maxBarHeight; // Scale value to max height
          const y = height - barHeight - 30;
          
          // Draw bar
          ctx.fillStyle = item.color;
          ctx.fillRect(x, y, barWidth, barHeight);
          
          // Draw value on top of bar
          ctx.fillStyle = '#888';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
          
          // Draw label below bar
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim() || '#555';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(item.name, x + barWidth / 2, height - 10);
        });
      }
    }
  }, [chartRef]);

  return (
    <div className="mt-8">
      <Card className="w-full">
        <CardHeader className="border-b border-border">
          <CardTitle>AI Usage by Type</CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-80">
          <canvas 
            ref={chartRef} 
            width={500} 
            height={300}
            className="w-full h-full"
          />
        </CardContent>
      </Card>
    </div>
  );
}
