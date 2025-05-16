import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertCircle, BookOpen, PlusCircle, Trash2, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { FrontierModel, FrontierModelsAlertsConfig, FrontierModelsAlert } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

// Available frontier models in the system
const availableModels = [
  { id: 1, name: "GPT-4o", provider: "OpenAI", modelId: "gpt-4o" },
  { id: 2, name: "GPT-4 Turbo", provider: "OpenAI", modelId: "gpt-4-turbo" },
  { id: 3, name: "Claude 3 Opus", provider: "Anthropic", modelId: "claude-3-opus" },
  { id: 4, name: "Claude Sonnet 3.7", provider: "Anthropic", modelId: "claude-3.7-sonnet" },
  { id: 5, name: "Gemini 1.5 Pro", provider: "Google", modelId: "gemini-1.5-pro" },
  { id: 6, name: "Gemini 1.0 Ultra", provider: "Google", modelId: "gemini-1.0-ultra" },
];

// Available categories for alerts
const alertCategories = ["Security", "Feature", "Compliance", "Performance", "Ethics"];

export function FrontierModelsAlerts() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("alerts");
  const [addAlertOpen, setAddAlertOpen] = useState(false);
  const [addConfigOpen, setAddConfigOpen] = useState(false);
  
  // Form state for new alert
  const [newAlert, setNewAlert] = useState({
    title: "",
    model_name: "",
    category: "",
    url: "",
    description: "",
  });

  // Form state for new config
  const [newConfig, setNewConfig] = useState({
    model_id: "",
    category: "",
  });

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

  const addAlertMutation = useMutation({
    mutationFn: async (alertData: typeof newAlert) => {
      return await apiRequest("POST", "/api/frontier-models/alerts", alertData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frontier-models"] });
      setAddAlertOpen(false);
      setNewAlert({
        title: "",
        model_name: "",
        category: "",
        url: "",
        description: "",
      });
      toast({
        title: "Alert added",
        description: "Your alert has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addConfigMutation = useMutation({
    mutationFn: async (configData: typeof newConfig) => {
      return await apiRequest("POST", "/api/frontier-models/configs", configData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frontier-models"] });
      setAddConfigOpen(false);
      setNewConfig({
        model_id: "",
        category: "",
      });
      toast({
        title: "Configuration added",
        description: "Your alert configuration has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Adding a new alert (mock implementation)
  const handleAddAlert = () => {
    // Validate form
    if (!newAlert.title || !newAlert.model_name || !newAlert.category || !newAlert.url) {
      toast({
        title: "Missing fields",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    // Instead of actual API call, add to mock data
    const newMockAlert = {
      id: mockAlerts.length + 1,
      ...newAlert,
      datePublished: new Date().toISOString().split('T')[0]
    };

    // Add to mock data
    mockAlerts.push(newMockAlert);
    
    // Close dialog and reset form
    setAddAlertOpen(false);
    setNewAlert({
      title: "",
      model_name: "",
      category: "",
      url: "",
      description: "",
    });
    
    toast({
      title: "Alert added",
      description: "Your alert has been added successfully",
    });
  };

  // Adding a new config (mock implementation)
  const handleAddConfig = () => {
    if (!newConfig.model_id || !newConfig.category) {
      toast({
        title: "Missing fields",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
    const selectedModel = availableModels.find(model => model.modelId === newConfig.model_id);
    if (!selectedModel) {
      toast({
        title: "Invalid model",
        description: "Please select a valid model",
        variant: "destructive",
      });
      return;
    }

    // Mock implementation - simulate adding a new config
    const newMockAlert = {
      id: mockAlerts.length + 1,
      model_name: selectedModel.name,
      category: newConfig.category,
      url: "#",
      title: `${selectedModel.name} ${newConfig.category} Alert`,
      description: `Monitoring ${newConfig.category.toLowerCase()} updates for ${selectedModel.name}`,
      datePublished: new Date().toISOString().split('T')[0]
    };

    // Add to mock data
    mockAlerts.push(newMockAlert);
    
    // Close dialog and reset form
    setAddConfigOpen(false);
    setNewConfig({
      model_id: "",
      category: "",
    });
    
    toast({
      title: "Configuration added",
      description: "Your alert configuration has been added successfully",
    });
  };

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
            <Dialog open={addAlertOpen} onOpenChange={setAddAlertOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" />
                    Add New Frontier Model Alert
                  </DialogTitle>
                  <DialogDescription>
                    Create a new alert for a frontier model update or announcement.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={newAlert.title}
                      onChange={(e) => setNewAlert({...newAlert, title: e.target.value})}
                      placeholder="Alert title"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="model" className="text-right">
                      Model
                    </Label>
                    <Select
                      value={newAlert.model_name}
                      onValueChange={(value) => setNewAlert({...newAlert, model_name: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.name}>
                            {model.name} ({model.provider})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Select
                      value={newAlert.category}
                      onValueChange={(value) => setNewAlert({...newAlert, category: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {alertCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="url" className="text-right">
                      URL
                    </Label>
                    <Input
                      id="url"
                      value={newAlert.url}
                      onChange={(e) => setNewAlert({...newAlert, url: e.target.value})}
                      placeholder="https://example.com/announcement"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right align-top pt-2">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newAlert.description}
                      onChange={(e) => setNewAlert({...newAlert, description: e.target.value})}
                      placeholder="Brief description of the alert"
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setAddAlertOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    onClick={handleAddAlert}
                  >
                    Add Alert
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                      <span className="text-sm text-gray-500">Provider: {alert.model_name.includes("GPT") ? "OpenAI" : alert.model_name.includes("Claude") ? "Anthropic" : "Google"}</span>
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
            <Dialog open={addConfigOpen} onOpenChange={setAddConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Configuration
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" />
                    Create Alert Configuration
                  </DialogTitle>
                  <DialogDescription>
                    Set up automatic alerts for a specific frontier model.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="model-id" className="text-right">
                      Model
                    </Label>
                    <Select
                      value={newConfig.model_id}
                      onValueChange={(value) => setNewConfig({...newConfig, model_id: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.modelId}>
                            {model.name} ({model.provider})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Alert Type
                    </Label>
                    <Select
                      value={newConfig.category}
                      onValueChange={(value) => setNewConfig({...newConfig, category: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select alert type" />
                      </SelectTrigger>
                      <SelectContent>
                        {alertCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setAddConfigOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    onClick={handleAddConfig}
                  >
                    Create Configuration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                    Provider: {alert.model_name.includes("GPT") ? "OpenAI" : alert.model_name.includes("Claude") ? "Anthropic" : "Google"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    Monitoring {alert.category.toLowerCase()} updates for {alert.model_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Model ID: {alert.model_name.toLowerCase().replace(/\s+/g, "-")}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" disabled>Edit</Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      // Remove from mock data
                      const index = mockAlerts.findIndex(a => a.id === alert.id);
                      if (index !== -1) {
                        mockAlerts.splice(index, 1);
                        // Force re-render
                        setActiveTab("alerts");
                        setTimeout(() => setActiveTab("configs"), 0);
                        toast({
                          title: "Configuration deleted",
                          description: "Alert configuration has been deleted.",
                        });
                      }
                    }}
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