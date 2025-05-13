import { useState } from 'react';
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
    <div className="flex flex-col flex-1 overflow-hidden">
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
              <>
                {currentTab === manageFeatures.frontierModelAlerts.id && (
                  <div className="text-center py-8">
                    <h2 className="text-xl font-semibold">Frontier Model Alerts</h2>
                    <p className="mt-2 text-gray-600">
                      Set up alerts for new frontier models and track their adoption in your organization.
                    </p>
                  </div>
                )}
                {currentTab === manageFeatures.riskRegister.id && (
                  <div className="text-center py-8">
                    <h2 className="text-xl font-semibold">Risk Register</h2>
                    <p className="mt-2 text-gray-600">
                      <a href="/risk-register" className="text-blue-600 hover:underline">
                        View full Risk Register
                      </a>
                    </p>
                  </div>
                )}
                {currentTab === manageFeatures.lifecycleManagement.id && (
                  <div className="text-center py-8">
                    <h2 className="text-xl font-semibold">Lifecycle Management</h2>
                    <p className="mt-2 text-gray-600">
                      Manage the complete lifecycle of AI systems from development to retirement.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}