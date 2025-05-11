import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart } from 'lucide-react';

export function DashboardCharts() {
  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AI Usage by Type */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle>AI Usage by Type</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-80 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm">Chart data will appear here</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Risk Assessment Summary */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Risk Assessment Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-80 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <PieChart className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm">Chart data will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
