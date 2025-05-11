import { Feature } from '@/types';

interface FeatureTabsProps {
  features: Feature[];
  currentTab: string | null;
  onTabChange: (tabId: string | null) => void;
}

export function FeatureTabs({ features, currentTab, onTabChange }: FeatureTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <div className="px-6 py-2 overflow-x-auto">
        <nav className="flex space-x-4">
          {features.map((feature) => (
            <a
              key={feature.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onTabChange(feature.id);
              }}
              className={`
                px-3 py-2 text-sm font-medium rounded-md
                ${currentTab === feature.id 
                  ? 'bg-primary-100 text-primary' 
                  : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              {feature.name}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
