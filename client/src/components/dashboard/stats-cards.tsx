import { 
  Card, 
  CardContent,
  CardFooter 
} from '@/components/ui/card';
import { 
  MonitorIcon, 
  AlertTriangleIcon, 
  PieChartIcon 
} from 'lucide-react';
import { Link } from 'wouter';
import { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'AI Systems',
      value: stats.aiSystemsCount,
      icon: <MonitorIcon className="h-6 w-6 text-primary" />,
      bgColor: 'bg-primary-100',
      linkText: 'View all systems',
      linkUrl: '/map'
    },
    {
      title: 'Compliance Issues',
      value: stats.complianceIssuesCount,
      icon: <AlertTriangleIcon className="h-6 w-6 text-warning-500" />,
      bgColor: 'bg-warning-100',
      linkText: 'View all issues',
      linkUrl: '/measure?tab=compliance-rules'
    },
    {
      title: 'Open Risks',
      value: stats.openRisksCount,
      icon: <PieChartIcon className="h-6 w-6 text-destructive" />,
      bgColor: 'bg-destructive/10',
      linkText: 'View risk register',
      linkUrl: '/manage?tab=risk-register'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${card.bgColor}`}>
                {card.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{card.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 py-3">
            <Link href={card.linkUrl} className="text-sm font-medium text-primary hover:text-primary-700">
              {card.linkText}
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
