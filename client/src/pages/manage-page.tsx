import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNavbar } from '@/components/layout/top-navbar';
import { FeatureTabs } from '@/components/layout/feature-tabs';
import { ManageFeatures } from '@/types';

const manageFeatures: ManageFeatures = {
  frontierModelAlerts: {
    id: 'frontier-alerts',
    name: 'Frontier Model Alerts',
    path: '/manage/frontier-alerts',
  },
  riskRegister: {
    id: 'risk-register',
    name: 'Risk Register',
    path: '/manage/risk-register',
  },
  lifecycleManagement: {
    id: 'lifecycle',
    name: 'Lifecycle Management',
    path: '/manage/lifecycle',
  },
};

export default function ManagePage() {
  const [currentTab, setCurrentTab] = useState<string | null>(null);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopNavbar title="Manage" />
        
        <FeatureTabs 
          features={Object.values(manageFeatures)} 
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
                <div className="py-16">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      {manageFeatures[currentTab as keyof ManageFeatures]?.name || currentTab}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">This feature is coming soon</p>
                    <div className="mt-6">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        Add Content
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
