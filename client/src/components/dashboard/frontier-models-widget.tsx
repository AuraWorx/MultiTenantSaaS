import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'wouter';

// This component uses the same data format as the full Frontier Models Alerts component
const mockAlerts = [
  {
    id: 1,
    model_name: "GPT-4o",
    category: "Security",
    url: "https://openai.com/index/gpt-4o-system-card/",
    title: "GPT-4o System Card",
    description: "Important security information about GPT-4o model capabilities and limitations",
    datePublished: "2024-05-10"
  },
  {
    id: 2,
    model_name: "Claude Sonnet 3.7",
    category: "Feature",
    url: "https://www.anthropic.com/news/claude-3-7-sonnet",
    title: "Introducing Claude 3.7",
    description: "Anthropic introduces Claude 3.7 Sonnet with enhanced multimodal capabilities and improved reasoning",
    datePublished: "2024-05-12"
  }
];

export function FrontierModelsWidget() {
  const [, navigate] = useNavigate();

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to get badge color by category
  const getCategoryBadge = (category: string) => {
    if (category.toLowerCase() === 'security') {
      return <Badge variant="destructive">{category}</Badge>;
    } else if (category.toLowerCase() === 'compliance') {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100">{category}</Badge>;
    } else if (category.toLowerCase() === 'ethics') {
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">{category}</Badge>;
    } else if (category.toLowerCase() === 'performance') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">{category}</Badge>;
    } else {
      return <Badge variant="default">{category}</Badge>;
    }
  };

  const handleViewAllClick = () => {
    navigate('/manage');
  };

  return (
    <Card className="col-span-full md:col-span-6 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
        <div>
          <CardTitle className="text-xl font-bold flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-amber-500" />
            Frontier Models Alerts
          </CardTitle>
          <CardDescription>
            Recent updates from leading AI model providers
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="gap-1" onClick={handleViewAllClick}>
          View all
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-0 pt-4 pb-0">
        <div className="space-y-4">
          {mockAlerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className="px-6 pb-4 border-b border-gray-100 last:border-0">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                  <h4 className="font-medium text-sm">{alert.title}</h4>
                </div>
                {getCategoryBadge(alert.category)}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 line-clamp-1">{alert.model_name} • {formatDate(alert.datePublished)}</p>
                <a 
                  href={alert.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-primary hover:underline"
                >
                  Details
                </a>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-slate-800 p-4 border-t border-gray-100 dark:border-slate-700">
        <Button 
          variant="outline" 
          className="w-full text-sm" 
          onClick={handleViewAllClick}
        >
          Manage alerts and notifications
        </Button>
      </CardFooter>
    </Card>
  );
}