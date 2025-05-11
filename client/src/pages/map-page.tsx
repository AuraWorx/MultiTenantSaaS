import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNavbar } from '@/components/layout/top-navbar';
import { FeatureTabs } from '@/components/layout/feature-tabs';
import { AIUsageFinder } from '@/components/map/ai-usage-finder';
import { UseCaseDatabase } from '@/components/map/use-case-database';
import { CMDBIntegration } from '@/components/map/cmdb-integration';
import { RiskDocumentation } from '@/components/map/risk-documentation';
import { MapFeatures } from '@/types';

const mapFeatures: MapFeatures = {
  aiUsageFinder: {
    id: 'ai-usage-finder',
    name: 'AI Usage Finder',
    path: '/map/ai-usage-finder',
  },
  useCaseDatabase: {
    id: 'use-case-db',
    name: 'Use Case Database',
    path: '/map/use-case-db',
  },
  cmdbIntegration: {
    id: 'cmdb-integration',
    name: 'CMDB Integration',
    path: '/map/cmdb-integration',
  },
  riskDocumentation: {
    id: 'risk-documentation',
    name: 'Risk Documentation',
    path: '/map/risk-documentation',
  },
};

export default function MapPage() {
  const [currentTab, setCurrentTab] = useState<string | null>(null);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopNavbar title="Map" />
        
        <FeatureTabs 
          features={Object.values(mapFeatures)} 
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {!currentTab ? (
                <div className="py-16">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Select a feature</h3>
                    <p className="mt-1 text-sm text-gray-500">Choose a feature from the tabs above to get started</p>
                  </div>
                </div>
              ) : (
                <>
                  {currentTab === mapFeatures.aiUsageFinder.id && <AIUsageFinder />}
                  {currentTab === mapFeatures.useCaseDatabase.id && <UseCaseDatabase />}
                  {currentTab === mapFeatures.cmdbIntegration.id && <CMDBIntegration />}
                  {currentTab === mapFeatures.riskDocumentation.id && <RiskDocumentation />}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
