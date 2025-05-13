import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FrontierModel, FrontierModelsAlertsConfig, FrontierModelsAlert } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsItem, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, BellRing, ExternalLink, PlusCircle, Database, Trash2, Info } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

// Form schemas
const createAlertConfigSchema = z.object({
  model_id: z.number().min(1, "Please select a model"),
  category: z.enum(["security", "feature"], {
    required_error: "Please select a category",
  }),
});

const createAlertSchema = z.object({
  alert_config_id: z.number().min(1, "Please select an alert configuration"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  date_published: z.string().min(1, "Please select a date"),
});

// Component to display alert configurations
function AlertConfigList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: configs, isLoading } = useQuery<FrontierModelsAlertsConfig[]>({
    queryKey: ["/api/frontier-models/alerts-config"],
  });

  const { data: models } = useQuery<FrontierModel[]>({
    queryKey: ["/api/frontier-models"],
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (configId: number) => {
      await apiRequest("DELETE", `/api/frontier-models/alerts-config/${configId}`);
    },
    onSuccess: () => {
      toast({
        title: "Alert configuration deleted",
        description: "The alert configuration has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/frontier-models/alerts-config"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof createAlertConfigSchema>>({
    resolver: zodResolver(createAlertConfigSchema),
    defaultValues: {
      category: "security",
    },
  });

  const createConfigMutation = useMutation({
    mutationFn: async (values: z.infer<typeof createAlertConfigSchema>) => {
      const response = await apiRequest("POST", "/api/frontier-models/alerts-config", values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert configuration created",
        description: "Your alert configuration has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/frontier-models/alerts-config"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof createAlertConfigSchema>) => {
    createConfigMutation.mutate(values);
  };

  const handleDelete = (configId: number) => {
    if (confirm("Are you sure you want to delete this alert configuration? This will also delete all related alerts.")) {
      deleteConfigMutation.mutate(configId);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading configurations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Alert Configurations</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Configuration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alert Configuration</DialogTitle>
              <DialogDescription>
                Set up which frontier models you want to receive alerts for.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="model_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frontier Model</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {models?.map((model) => (
                            <SelectItem key={model.id} value={model.id.toString()}>
                              {model.name} ({model.provider})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Alert Category</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createConfigMutation.isPending}>
                    {createConfigMutation.isPending ? "Creating..." : "Create Configuration"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {configs && configs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((config) => (
            <Card key={config.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{config.modelName}</CardTitle>
                    <CardDescription>{config.modelProvider}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(config.id)}
                    title="Delete configuration"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mt-1">
                  {config.category === "security" ? (
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  ) : (
                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                  )}
                  <span className="text-sm capitalize">{config.category} Updates</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Created on {format(new Date(config.created_at), "PP")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-muted/40">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
            <Database className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-center text-muted-foreground">No alert configurations yet.</p>
            <p className="text-center text-xs text-muted-foreground">
              Create a configuration to start receiving alerts for frontier models.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Component to display alerts
function AlertList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: alerts, isLoading } = useQuery<FrontierModelsAlert[]>({
    queryKey: ["/api/frontier-models/alerts"],
  });

  const { data: configs } = useQuery<FrontierModelsAlertsConfig[]>({
    queryKey: ["/api/frontier-models/alerts-config"],
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiRequest("DELETE", `/api/frontier-models/alerts/${alertId}`);
    },
    onSuccess: () => {
      toast({
        title: "Alert deleted",
        description: "The alert has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/frontier-models/alerts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof createAlertSchema>>({
    resolver: zodResolver(createAlertSchema),
    defaultValues: {
      description: "",
      url: "",
      date_published: new Date().toISOString().split("T")[0],
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: async (values: z.infer<typeof createAlertSchema>) => {
      const response = await apiRequest("POST", "/api/frontier-models/alerts", values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert created",
        description: "Your alert has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/frontier-models/alerts"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof createAlertSchema>) => {
    createAlertMutation.mutate(values);
  };

  const handleDelete = (alertId: number) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deleteAlertMutation.mutate(alertId);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading alerts...</div>;
  }

  const noConfigsExist = !configs || configs.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Alert History</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={noConfigsExist}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
              <DialogDescription>
                Add a new alert for a frontier model. This will be visible to all users in your organization.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="alert_config_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model & Category</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a configuration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {configs?.map((config) => (
                            <SelectItem key={config.id} value={config.id.toString()}>
                              {config.modelName} - {config.category === "security" ? "Security" : "Feature"} Updates
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Alert title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Description of the alert" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/announcement" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date_published"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Published</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createAlertMutation.isPending}>
                    {createAlertMutation.isPending ? "Creating..." : "Create Alert"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {alerts && alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <BellRing className="h-4 w-4 mr-2 text-primary" />
                      {alert.title}
                    </CardTitle>
                    <CardDescription>
                      {alert.model_name} ({alert.model_provider})
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(alert.id)}
                    title="Delete alert"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mt-1">
                  {alert.category === "security" ? (
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  ) : (
                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                  )}
                  <span className="text-sm capitalize">{alert.category} Update</span>
                </div>
                {alert.description && (
                  <p className="text-sm mt-2">{alert.description}</p>
                )}
                <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                  <span>Published: {format(new Date(alert.date_published), "PP")}</span>
                  {alert.url && (
                    <a 
                      href={alert.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary flex items-center"
                    >
                      Reference <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-muted/40">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
            <Database className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-center text-muted-foreground">No alerts found</p>
            <p className="text-center text-xs text-muted-foreground">
              {noConfigsExist
                ? "Set up alert configurations first to receive alerts."
                : "Create a new alert using the button above."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function FrontierModelsPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Frontier Models</h2>
        <p className="text-muted-foreground">
          Stay informed about cutting-edge frontier AI models with alerts for security updates and new features
        </p>
      </div>
      
      <Tabs defaultValue="configurations" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="configurations">Alert Configurations</TabsTrigger>
          <TabsTrigger value="alerts">Alert History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configurations" className="space-y-4">
          <AlertConfigList />
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <AlertList />
        </TabsContent>
      </Tabs>
    </div>
  );
}