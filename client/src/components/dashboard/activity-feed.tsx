import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle 
} from '@/components/ui/card';
import { 
  CheckCircle, 
  AlertTriangle,
  PenTool
} from 'lucide-react';
import { ActivityItem } from '@/types';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
            <CheckCircle className="h-5 w-5 text-white" />
          </span>
        );
      case 'warning':
        return (
          <span className="h-8 w-8 rounded-full bg-warning-500 flex items-center justify-center ring-8 ring-white">
            <AlertTriangle className="h-5 w-5 text-white" />
          </span>
        );
      default:
        return (
          <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center ring-8 ring-white">
            <PenTool className="h-5 w-5 text-white" />
          </span>
        );
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.length > 0 ? (
                activities.map((activity, idx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {idx < activities.length - 1 && (
                        <span 
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                          aria-hidden="true" 
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>{getActivityIcon(activity.type)}</div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              {activity.message.includes(activity.entity) ? (
                                activity.message
                              ) : (
                                <>
                                  {activity.message}{' '}
                                  <span className="font-medium text-gray-900">{activity.entity}</span>
                                </>
                              )}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>{formatTimeAgo(activity.timestamp)}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-center py-6">
                  <p className="text-sm text-gray-500">No recent activity</p>
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
