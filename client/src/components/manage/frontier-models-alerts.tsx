import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertCircle, BookOpen, PlusCircle, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { FrontierModel, FrontierModelsAlertsConfig, FrontierModelsAlert } from "@shared/schema";

type AlertsData = {
  alertConfigs: (FrontierModelsAlertsConfig & { 
    model: FrontierModel 
  })[];
  alerts: (FrontierModelsAlert & { 
    config: FrontierModelsAlertsConfig & { 
      model: FrontierModel 
    } 
  })[];
  models: FrontierModel[];
}

// Use the actual alert data provided by the user
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

export function FrontierModelsAlerts() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("alerts");

  const { 
    data, 
    isLoading,
    error 
  } = useQuery<AlertsData>({
    queryKey: ["/api/frontier-models"],
    // The getQueryFn is set up in queryClient.ts
    // For now, we'll use mock data instead
    enabled: false // Disable the actual API call for now
  });

  const deleteAlertConfigMutation = useMutation({
    mutationFn: async (configId: number) => {
      await apiRequest("DELETE", `/api/frontier-models/configs/${configId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frontier-models"] });
      toast({
        title: "Alert configuration deleted",
        description: "Your alert configuration has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting alert configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Use mock data instead of loading state
  if (false && isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-lg text-gray-600">Loading frontier models data...</p>
      </div>
    );
  }

  if (false && error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="mt-4 text-lg font-medium">Error loading data</h3>
        <p className="mt-2 text-sm text-gray-600">{(error as Error).message}</p>
      </div>
    );
  }

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
    } else {
      return <Badge variant="default">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="alerts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full max-w-md mx-auto mb-8">
          <TabsTrigger value="alerts" className="flex-1">
            <AlertCircle className="mr-2 h-4 w-4" />
            Alerts History
          </TabsTrigger>
          <TabsTrigger value="configs" className="flex-1">
            <Sparkles className="mr-2 h-4 w-4" />
            Alert Configurations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Recent Frontier Model Alerts</h3>
            <Button variant="outline" disabled>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Alert
            </Button>
          </div>

          {mockAlerts && mockAlerts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {mockAlerts.map((alert) => (
                <Card key={alert.id} className="overflow-hidden border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold">{alert.title}</CardTitle>
                        <CardDescription className="text-sm text-gray-500 mt-1">
                          {formatDate(alert.datePublished.toString())}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <span className="font-medium text-gray-700">{alert.model_name}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{alert.description}</p>
                    <div className="flex items-center mt-4 space-x-4">
                      <span className="text-sm text-gray-500">Provider: {alert.model_name.includes("GPT") ? "OpenAI" : "Anthropic"}</span>
                      {getCategoryBadge(alert.category)}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 py-3 flex justify-between">
                    <span className="text-sm text-gray-500">
                      Published: {formatDate(alert.datePublished)}
                    </span>
                    <a 
                      href={alert.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Read more
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-lg font-medium">No alerts found</h3>
              <p className="mt-2 text-sm text-gray-600">
                There are no frontier model alerts to display
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="configs" className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Alert Configurations</h3>
            <Button variant="outline" disabled>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Configuration
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{alert.model_name}</CardTitle>
                    {getCategoryBadge(alert.category)}
                  </div>
                  <CardDescription>
                    Provider: {alert.model_name.includes("GPT") ? "OpenAI" : "Anthropic"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    Monitoring {alert.category.toLowerCase()} updates for {alert.model_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Model ID: {alert.model_name.toLowerCase().replace(" ", "-")}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" disabled>Edit</Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteAlertConfigMutation.mutate(alert.id)}
                    disabled={deleteAlertConfigMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}