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
  riskMitigations: {
    id: 'risk-mitigations',
    name: 'Risk Mitigations',
    path: '/manage/risk-mitigations',
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
                {currentTab === manageFeatures.riskMitigations.id && (
                  <div className="text-center py-8">
                    <h2 className="text-xl font-semibold">Risk Mitigations</h2>
                    <p className="mt-2 text-gray-600">
                      <a href="/risk-register" className="text-blue-600 hover:underline">
                        View and manage risk mitigations across all systems
                      </a>
                    </p>
                    <div className="mt-6 max-w-4xl mx-auto">
                      <h3 className="text-lg font-medium mb-4 text-left">Recent Mitigations</h3>
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          <li>
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-indigo-600 truncate">
                                  PII Data Leakage Prevention
                                </p>
                                <div className="ml-2 flex-shrink-0 flex">
                                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Completed
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-gray-500">
                                    For: Data Processing Pipeline Risk
                                  </p>
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                  <p>
                                    Implemented on May 1, 2025
                                  </p>
                                </div>
                              </div>
                            </div>
                          </li>
                          <li>
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-indigo-600 truncate">
                                  Bias Detection Framework
                                </p>
                                <div className="ml-2 flex-shrink-0 flex">
                                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    In Progress
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-gray-500">
                                    For: Recommendation Algorithm Risk
                                  </p>
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                  <p>
                                    Started on May 7, 2025
                                  </p>
                                </div>
                              </div>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
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