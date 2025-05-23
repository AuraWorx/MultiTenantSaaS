import { useQuery } from '@tanstack/react-query';
import { TopNavbar } from '@/components/layout/top-navbar';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { FrontierModelsWidget } from '@/components/dashboard/frontier-models-widget';
import { PiiDataChart } from '@/components/dashboard/pii-data-chart';
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
                
                <div className="grid grid-cols-12 gap-6 mt-8">
                  {/* Frontier Models and PII Data side by side on larger screens */}
                  <div className="col-span-12 md:col-span-6">
                    <FrontierModelsWidget />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <PiiDataChart 
                      totalCount={1000} 
                      piiCount={150} 
                      useSmallHeight={true} 
                    />
                  </div>
                </div>
                
                <div className="mt-8">
                  <ActivityFeed activities={dashboardData.activities} />
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
