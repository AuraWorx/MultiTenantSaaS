import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AlertCircle, Loader2, Flag, CheckCircle, PieChart as PieChartIcon } from 'lucide-react';
import { getQueryFn } from '@/lib/queryClient';

interface RiskSummary {
  totalRisks: number;
  flaggedRisks: number;
  acceptedRisks: number;
  openRisks: number;
}

export function RiskAssessmentChart() {
  const { data: riskSummary, isLoading, error } = useQuery<RiskSummary>({
    queryKey: ['/api/risk-items/summary'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  const [chartData, setChartData] = useState<Array<{name: string, value: number, color: string}>>([]);

  useEffect(() => {
    if (riskSummary) {
      const data = [
        {
          name: 'Flagged',
          value: riskSummary.flaggedRisks,
          color: '#ef4444' // red-500
        },
        {
          name: 'Accepted',
          value: riskSummary.acceptedRisks,
          color: '#22c55e' // green-500
        },
        {
          name: 'Open',
          value: riskSummary.openRisks - (riskSummary.flaggedRisks + riskSummary.acceptedRisks),
          color: '#f97316' // orange-500
        }
      ].filter(item => item.value > 0); // Only show segments with values
      
      setChartData(data);
    }
  }, [riskSummary]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
          <CardDescription>Summary of risks in the risk register</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
          <CardDescription>Summary of risks in the risk register</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load risk assessment data
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!riskSummary || riskSummary.totalRisks === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
          <CardDescription>Summary of risks in the risk register</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex flex-col justify-center items-center">
          <PieChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No risks in the register yet. Add risks from AI Usage Finder.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Assessment</CardTitle>
        <CardDescription>Summary of risks in the risk register</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center">
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} risks`, '']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-1">
              <Flag className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm font-medium">Flagged</span>
            </div>
            <span className="text-xl font-bold">{riskSummary.flaggedRisks}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-1">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm font-medium">Accepted</span>
            </div>
            <span className="text-xl font-bold">{riskSummary.acceptedRisks}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-1">
              <PieChartIcon className="h-4 w-4 text-primary mr-1" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <span className="text-xl font-bold">{riskSummary.totalRisks}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}