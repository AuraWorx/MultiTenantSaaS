import { useQuery } from '@tanstack/react-query';
import { TopNavbar } from '@/components/layout/top-navbar';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { DashboardCharts } from '@/components/dashboard/charts';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { ModelUpdatesWidget } from '@/components/dashboard/model-updates-widget';
import { RiskAssessmentChart } from '@/components/dashboard/risk-assessment-chart';
import { DashboardStats, ActivityItem } from '@/types';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useQuery<{
    stats: DashboardStats;
    activities: ActivityItem[];
  }>({
    queryKey: ['/api/dashboard'],
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopNavbar title="Dashboard" />
      
      <main className="flex-1 relative overflow-y-auto focus:outline-none">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dashboardData ? (
              <>
                <StatsCards stats={dashboardData.stats} />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="md:col-span-2">
                    <ModelUpdatesWidget />
                  </div>
                  <div className="md:col-span-1">
                    <RiskAssessmentChart />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="md:col-span-1">
                    <ActivityFeed activities={dashboardData.activities} />
                  </div>
                  <div className="md:col-span-1">
                    <DashboardCharts />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="mt-2 text-lg font-medium text-gray-900">No dashboard data available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There might be an issue fetching dashboard data. Please try again later.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
