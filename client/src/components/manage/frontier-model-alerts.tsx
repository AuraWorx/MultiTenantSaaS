import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FrontierModel, FrontierModelAlert, FrontierModelUpdate } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, Bell, BellRing, Plus, ExternalLink, Trash2, Calendar, Info, ShieldAlert, Zap, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, getQueryFn, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';

export function FrontierModelAlerts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role?.permissions?.includes('admin');
  
  const [selectedModel, setSelectedModel] = useState<FrontierModel | null>(null);
  const [createAlertOpen, setCreateAlertOpen] = useState<boolean>(false);
  const [newModelOpen, setNewModelOpen] = useState<boolean>(false);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  
  // Form states
  const [alertFormData, setAlertFormData] = useState({
    name: '',
    alertType: 'security',
    frontierModelId: 0,
    alertFrequency: 'daily'
  });
  
  const [modelFormData, setModelFormData] = useState({
    name: '',
    provider: '',
    description: '',
    release_date: ''
  });

  // Queries
  const { 
    data: models, 
    isLoading: isLoadingModels,
    error: modelsError
  } = useQuery<FrontierModel[], Error>({
    queryKey: ['/api/frontier-models'],
    queryFn: getQueryFn({ on401: 'throw' })
  });

  const { 
    data: alerts, 
    isLoading: isLoadingAlerts,
    error: alertsError 
  } = useQuery<FrontierModelAlert[], Error>({
    queryKey: ['/api/frontier-model-alerts'],
    queryFn: getQueryFn({ on401: 'throw' })
  });

  const { 
    data: updates, 
    isLoading: isLoadingUpdates,
    error: updatesError 
  } = useQuery<FrontierModelUpdate[], Error>({
    queryKey: ['/api/frontier-model-updates', selectedModel?.id],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!selectedModel,
  });

  // Mutations
  const createModelMutation = useMutation({
    mutationFn: async (data: typeof modelFormData) => {
      const res = await apiRequest('POST', '/api/frontier-models', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/frontier-models'] });
      setModelFormData({
        name: '',
        provider: '',
        description: '',
        release_date: ''
      });
      setNewModelOpen(false);
      toast({
        title: 'Success',
        description: 'Frontier model created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create frontier model: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data: typeof alertFormData) => {
      const res = await apiRequest('POST', '/api/frontier-model-alerts', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/frontier-model-alerts'] });
      setAlertFormData({
        name: '',
        alert_type: 'security',
        frontier_model_id: 0,
        alert_frequency: 'daily'
      });
      setCreateAlertOpen(false);
      toast({
        title: 'Success',
        description: 'Alert created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create alert: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiRequest('DELETE', `/api/frontier-model-alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/frontier-model-alerts'] });
      toast({
        title: 'Success',
        description: 'Alert deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete alert: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const scrapeUpdatesMutation = useMutation({
    mutationFn: async (modelId: number) => {
      const res = await apiRequest('POST', `/api/frontier-model-updates/scrape/${modelId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/frontier-model-updates', selectedModel?.id] });
      toast({
        title: 'Success',
        description: 'Model updates scraped successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to scrape updates: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const scrapeAllModelsMutation = useMutation({
    mutationFn: async () => {
      setIsScraping(true);
      const res = await apiRequest('POST', '/api/frontier-model-updates/scrape-all');
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate all model data to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/frontier-models'] });
      queryClient.invalidateQueries({ queryKey: ['/api/frontier-model-updates'] });
      
      toast({
        title: 'Success',
        description: `Successfully scraped ${data.count} updates for all models`,
      });
      setIsScraping(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to scrape all models: ${error.message}`,
        variant: 'destructive',
      });
      setIsScraping(false);
    }
  });

  // Handlers
  const handleCreateAlert = () => {
    if (!alertFormData.name) {
      toast({
        title: 'Error',
        description: 'Please provide a name for the alert',
        variant: 'destructive',
      });
      return;
    }

    if (!alertFormData.frontierModelId) {
      toast({
        title: 'Error',
        description: 'Please select a frontier model',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      name: alertFormData.name,
      frontierModelId: alertFormData.frontierModelId,
      alertType: alertFormData.alertType,
      alertFrequency: alertFormData.alertFrequency
    };
    
    createAlertMutation.mutate(payload);
  };

  const handleCreateModel = () => {
    if (!modelFormData.name || !modelFormData.provider) {
      toast({
        title: 'Error',
        description: 'Name and provider are required fields',
        variant: 'destructive',
      });
      return;
    }

    createModelMutation.mutate(modelFormData);
  };

  const handleDeleteAlert = (alertId: number) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      deleteAlertMutation.mutate(alertId);
    }
  };

  const handleScrapeUpdates = () => {
    if (selectedModel) {
      scrapeUpdatesMutation.mutate(selectedModel.id);
    }
  };

  const filterAlertsByModel = (modelId: number) => {
    if (!alerts) return [];
    return alerts.filter(alert => alert.frontier_model_id === modelId);
  };

  const filterUpdatesByType = (type: 'security' | 'feature') => {
    if (!updates) return [];
    return updates.filter(update => update.update_type === type);
  };

  const getSecurityUpdatesCount = (modelId: number) => {
    if (!updates || !selectedModel || selectedModel.id !== modelId) return 0;
    return updates.filter(update => update.update_type === 'security').length;
  };

  const getFeatureUpdatesCount = (modelId: number) => {
    if (!updates || !selectedModel || selectedModel.id !== modelId) return 0;
    return updates.filter(update => update.update_type === 'feature').length;
  };

  const openSourceUrl = (url: string | null) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoadingModels || isLoadingAlerts) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (modelsError || alertsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive">Failed to load data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Frontier Model Alerts</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button onClick={() => setNewModelOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Model
              </Button>
              <Button 
                onClick={() => scrapeAllModelsMutation.mutate()} 
                disabled={isScraping || scrapeAllModelsMutation.isPending}
                variant="outline"
              >
                {isScraping || scrapeAllModelsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Scrape All Models
                  </>
                )}
              </Button>
            </>
          )}
          <Button onClick={() => setCreateAlertOpen(true)}>
            <BellRing className="mr-2 h-4 w-4" />
            Create Alert
          </Button>
        </div>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="models">Available Models</TabsTrigger>
          <TabsTrigger value="alerts">My Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="models" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models && models.map(model => (
              <Card key={model.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{model.name}</CardTitle>
                  <CardDescription>
                    Provider: {model.provider}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {model.description || 'No description available.'}
                  </p>
                  <div className="flex gap-2 my-2">
                    <Badge variant="outline" className="flex gap-1 items-center">
                      <ShieldAlert className="h-3 w-3" />
                      {getSecurityUpdatesCount(model.id)} Security Updates
                    </Badge>
                    <Badge variant="outline" className="flex gap-1 items-center">
                      <Zap className="h-3 w-3" />
                      {getFeatureUpdatesCount(model.id)} Feature Updates
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="secondary">
                      {filterAlertsByModel(model.id).length} Alerts
                    </Badge>
                    {model.release_date && (
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <Calendar className="h-3 w-3" />
                        {new Date(model.release_date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedModel(model)}
                  >
                    <Info className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <Table>
            <TableCaption>Your active frontier model alerts</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Alert Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts && alerts.length > 0 ? (
                alerts.map(alert => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.name}</TableCell>
                    <TableCell>{alert.model?.name || 'Unknown Model'}</TableCell>
                    <TableCell>
                      <Badge variant={alert.alert_type === 'security' ? 'destructive' : 'secondary'}>
                        {alert.alert_type === 'security' ? 'Security' : 'Feature'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(alert.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">No alerts created yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setCreateAlertOpen(true)}
                    >
                      <BellRing className="mr-2 h-4 w-4" />
                      Create Your First Alert
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Create Alert Dialog */}
      <Dialog open={createAlertOpen} onOpenChange={setCreateAlertOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Frontier Model Alert</DialogTitle>
            <DialogDescription>
              Set up alerts to be notified about security or feature updates to frontier models
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alertName" className="text-right">
                Alert Name
              </Label>
              <Input
                id="alertName"
                placeholder="Security Alert for GPT-4o"
                className="col-span-3"
                value={alertFormData.name}
                onChange={(e) => setAlertFormData({...alertFormData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">
                Model
              </Label>
              <Select
                onValueChange={(value) => setAlertFormData({...alertFormData, frontierModelId: parseInt(value)})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Frontier Models</SelectLabel>
                    {models && models.map(model => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Alert Type</Label>
              <RadioGroup
                value={alertFormData.alertType}
                onValueChange={(value) => setAlertFormData({...alertFormData, alertType: value as 'security' | 'feature'})}
                className="col-span-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="security" id="security" />
                  <Label htmlFor="security">Security Updates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="feature" id="feature" />
                  <Label htmlFor="feature">Feature Updates</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleCreateAlert}
              disabled={createAlertMutation.isPending}
            >
              {createAlertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Model Dialog (Admin Only) */}
      <Dialog open={newModelOpen} onOpenChange={setNewModelOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Frontier Model</DialogTitle>
            <DialogDescription>
              Add a new frontier model to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modelName" className="text-right">
                Model Name
              </Label>
              <Input
                id="modelName"
                placeholder="GPT-4o"
                className="col-span-3"
                value={modelFormData.name}
                onChange={(e) => setModelFormData({...modelFormData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right">
                Provider
              </Label>
              <Input
                id="provider"
                placeholder="OpenAI"
                className="col-span-3"
                value={modelFormData.provider}
                onChange={(e) => setModelFormData({...modelFormData, provider: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                placeholder="The latest multimodal model from OpenAI"
                className="col-span-3"
                value={modelFormData.description}
                onChange={(e) => setModelFormData({...modelFormData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="releaseDate" className="text-right">
                Release Date
              </Label>
              <Input
                id="releaseDate"
                type="date"
                className="col-span-3"
                value={modelFormData.release_date}
                onChange={(e) => setModelFormData({...modelFormData, release_date: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleCreateModel}
              disabled={createModelMutation.isPending}
            >
              {createModelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Model Details Dialog */}
      <Dialog open={!!selectedModel} onOpenChange={(open) => !open && setSelectedModel(null)}>
        {selectedModel && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedModel.name}</DialogTitle>
              <DialogDescription>
                Provider: {selectedModel.provider}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Model Updates</h3>
              </div>

              <Tabs defaultValue="security" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="security">Security Updates</TabsTrigger>
                  <TabsTrigger value="feature">Feature Updates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="security" className="space-y-4 mt-4">
                  {isLoadingUpdates ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : updatesError ? (
                    <div className="text-center py-8 text-destructive">
                      Failed to load updates
                    </div>
                  ) : (
                    <>
                      {filterUpdatesByType('security').length > 0 ? (
                        <div className="space-y-3">
                          {filterUpdatesByType('security').map(update => (
                            <Card key={update.id}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">{update.title}</CardTitle>
                                <CardDescription>
                                  {format(new Date(update.update_date), 'PPP')}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm">{update.description}</p>
                              </CardContent>
                              {update.source_url && (
                                <CardFooter className="pt-0">
                                  <Button 
                                    variant="link" 
                                    className="p-0 h-auto"
                                    onClick={() => openSourceUrl(update.source_url)}
                                  >
                                    Read more <ExternalLink className="ml-1 h-3 w-3" />
                                  </Button>
                                </CardFooter>
                              )}
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No security updates available
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="feature" className="space-y-4 mt-4">
                  {isLoadingUpdates ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : updatesError ? (
                    <div className="text-center py-8 text-destructive">
                      Failed to load updates
                    </div>
                  ) : (
                    <>
                      {filterUpdatesByType('feature').length > 0 ? (
                        <div className="space-y-3">
                          {filterUpdatesByType('feature').map(update => (
                            <Card key={update.id}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">{update.title}</CardTitle>
                                <CardDescription>
                                  {format(new Date(update.update_date), 'PPP')}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm">{update.description}</p>
                              </CardContent>
                              {update.source_url && (
                                <CardFooter className="pt-0">
                                  <Button 
                                    variant="link" 
                                    className="p-0 h-auto"
                                    onClick={() => openSourceUrl(update.source_url)}
                                  >
                                    Read more <ExternalLink className="ml-1 h-3 w-3" />
                                  </Button>
                                </CardFooter>
                              )}
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No feature updates available
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Create Alert for {selectedModel.name}</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setAlertFormData({
                        name: `Security alert for ${selectedModel.name}`,
                        alertType: 'security',
                        frontierModelId: selectedModel.id,
                        alertFrequency: 'daily'
                      });
                      setSelectedModel(null);
                      setCreateAlertOpen(true);
                    }}
                    variant="outline"
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Security Alerts
                  </Button>
                  <Button 
                    onClick={() => {
                      setAlertFormData({
                        name: `Feature alert for ${selectedModel.name}`,
                        alertType: 'feature',
                        frontierModelId: selectedModel.id,
                        alertFrequency: 'daily'
                      });
                      setSelectedModel(null);
                      setCreateAlertOpen(true);
                    }}
                    variant="outline"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Feature Alerts
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}