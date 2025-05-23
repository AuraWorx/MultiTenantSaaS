import { useState } from 'react';
import { TopNavbar } from '@/components/layout/top-navbar';
import { FeatureTabs } from '@/components/layout/feature-tabs';
import { ComplianceRules } from '@/components/measure/compliance-rules';
import { AuraAIWizard } from '@/components/measure/aura-ai-wizard';
import { PIILeakDetection } from '@/components/measure/pii-leak-detection';
import { BiasAnalysis } from '@/components/measure/bias-analysis';
import { ToxicityAnalysis } from '@/components/measure/toxicity-analysis';
import { ChatGptPiiDetect } from '@/components/measure/chatgpt-pii-detect';
import { MeasureFeatures } from '@/types';

const measureFeatures: MeasureFeatures = {
  complianceRules: {
    id: 'compliance-rules',
    name: 'Compliance Rules Engine',
    path: '/measure/compliance-rules',
  },
  auraAiWizard: {
    id: 'aura-wizard',
    name: 'AuraAI Wizard',
    path: '/measure/aura-wizard',
  },
  piiLeakDetection: {
    id: 'pii-leak',
    name: 'PII Leak Detection',
    path: '/measure/pii-leak',
  },
  biasAnalysis: {
    id: 'bias-analysis',
    name: 'Bias Analysis',
    path: '/measure/bias-analysis',
  },
  toxicityAnalysis: {
    id: 'toxicity-analysis',
    name: 'Toxicity Analysis',
    path: '/measure/toxicity-analysis',
  },
  chatGptPiiDetect: {
    id: 'chatgpt-pii-detect',
    name: 'ChatGPT-PiiDetect',
    path: '/measure/chatgpt-pii-detect',
  },
};

export default function MeasurePage() {
  const [currentTab, setCurrentTab] = useState<string | null>(null);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopNavbar title="Measure" />
      
      <FeatureTabs 
        features={Object.values(measureFeatures)} 
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
                {currentTab === measureFeatures.complianceRules.id && <ComplianceRules />}
                {currentTab === measureFeatures.auraAiWizard.id && <AuraAIWizard />}
                {currentTab === measureFeatures.piiLeakDetection.id && <PIILeakDetection />}
                {currentTab === measureFeatures.biasAnalysis.id && <BiasAnalysis />}
                {currentTab === measureFeatures.toxicityAnalysis.id && <ToxicityAnalysis />}
                {currentTab === measureFeatures.chatGptPiiDetect.id && <ChatGptPiiDetect />}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}