import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Shield,
  Eye,
  Lock,
  BarChart2,
  PanelRight,
  MoreHorizontal,
  PenLine,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RiskItem, RiskMitigation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Type definition for the enriched risk item
interface EnrichedRiskItem extends RiskItem {
  latestMitigation: RiskMitigation | null;
}

// Type definition for the risk details response
interface RiskDetailsResponse {
  riskItem: RiskItem;
  mitigations: RiskMitigation[];
}
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";

// RiskDetails component for displaying and managing a single risk's details
interface RiskDetailsProps {
  riskId: number;
  onClose: () => void;
}

function RiskDetails({ riskId, onClose }: RiskDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingMitigation, setIsAddingMitigation] = useState(false);
  
  const { data, isLoading } = useQuery<RiskDetailsResponse>({
    queryKey: ["/api/risk-items", riskId],
    enabled: !!riskId,
  });
  
  const riskItem = data?.riskItem;
  const mitigations = data?.mitigations || [];
  
  // Form for adding mitigations
  const mitigationForm = useForm({
    defaultValues: {
      description: "",
      status: "planned",
      notes: ""
    }
  });
  
  const addMitigationMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await apiRequest(
        "POST", 
        `/api/risk-items/${riskId}/mitigations`, 
        values
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items", riskId] });
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items"] });
      setIsAddingMitigation(false);
      mitigationForm.reset();
      toast({
        title: "Mitigation added",
        description: "The mitigation plan has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add mitigation: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onMitigationSubmit = (values: any) => {
    addMitigationMutation.mutate(values);
  };
  
  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'security':
        return <Shield className="h-4 w-4 mr-2" />;
      case 'privacy':
        return <Lock className="h-4 w-4 mr-2" />;
      case 'bias':
        return <BarChart2 className="h-4 w-4 mr-2" />;
      default:
        return <AlertTriangle className="h-4 w-4 mr-2" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!riskItem) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Risk item not found.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="details">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="details">Risk Details</TabsTrigger>
          <TabsTrigger value="mitigations">
            Mitigations ({mitigations.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 py-4">
            <div>
              <h3 className="text-lg font-semibold">{riskItem.title}</h3>
              <p className="text-sm text-gray-500">Created on {new Date(riskItem.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Severity</h4>
                <Badge variant="outline" className={riskItem.severity === 'critical' ? 'text-red-600 bg-red-100 border-red-200' : 
                    riskItem.severity === 'high' ? 'text-orange-600 bg-orange-100 border-orange-200' : 
                    riskItem.severity === 'medium' ? 'text-yellow-600 bg-yellow-100 border-yellow-200' : 
                    riskItem.severity === 'low' ? 'text-green-600 bg-green-100 border-green-200' : 
                    'text-gray-600 bg-gray-100 border-gray-200'}>
                  {riskItem.severity}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <div className="flex items-center">
                  {riskItem.status === 'open' ? <AlertCircle className="h-4 w-4 text-red-500" /> :
                     riskItem.status === 'mitigated' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                     riskItem.status === 'in-progress' ? <Clock className="h-4 w-4 text-yellow-500" /> :
                     <AlertCircle className="h-4 w-4 text-gray-500" />}
                  <span>{riskItem.status.replace('_', ' ')}</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Impact</h4>
                <Badge variant="outline" className={`${riskItem.impact === 'high' ? 'text-red-600 bg-red-100' : riskItem.impact === 'medium' ? 'text-yellow-600 bg-yellow-100' : 'text-green-600 bg-green-100'}`}>
                  {riskItem.impact}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Likelihood</h4>
                <Badge variant="outline" className={`${riskItem.likelihood === 'high' ? 'text-red-600 bg-red-100' : riskItem.likelihood === 'medium' ? 'text-yellow-600 bg-yellow-100' : 'text-green-600 bg-green-100'}`}>
                  {riskItem.likelihood}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Category</h4>
                <div className="flex items-center">
                  {riskItem.category ? getCategoryIcon(riskItem.category) : null}
                  <span>{riskItem.category}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="text-sm mt-1">{riskItem.description}</p>
            </div>
            
            {riskItem.systemDetails && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">System Details</h4>
                <p className="text-sm mt-1">{riskItem.systemDetails}</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="mitigations" className="space-y-4">
          {isAddingMitigation ? (
            <div className="border p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-4">Add Mitigation Plan</h3>
              <Form {...mitigationForm}>
                <form onSubmit={mitigationForm.handleSubmit(onMitigationSubmit)} className="space-y-4">
                  <FormField
                    control={mitigationForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the mitigation plan in detail"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={mitigationForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={mitigationForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes about this mitigation"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddingMitigation(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addMitigationMutation.isPending}
                    >
                      {addMitigationMutation.isPending ? "Saving..." : "Save Mitigation"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          ) : (
            <Button onClick={() => setIsAddingMitigation(true)} className="mb-4">
              <Plus className="mr-2 h-4 w-4" /> Add Mitigation Plan
            </Button>
          )}
          
          {mitigations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No mitigation plans added yet. Add a plan to address this risk.
            </div>
          ) : (
            <div className="space-y-4">
              {mitigations.map((mitigation: RiskMitigation) => (
                <Card key={mitigation.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge 
                          variant="outline" 
                          className={
                            mitigation.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            mitigation.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                            mitigation.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {mitigation.status.replace('-', ' ')}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          Added on {new Date(mitigation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="text-sm mt-1">{mitigation.description}</p>
                    </div>
                    {mitigation.notes && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                        <p className="text-sm mt-1">{mitigation.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// New risk form component
function NewRiskForm({ onCancel }: { onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      severity: "medium",
      impact: "medium",
      likelihood: "medium",
      category: "security",
      systemDetails: "",
      status: "open"
    }
  });
  
  const createRiskMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await apiRequest("POST", "/api/risk-items", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items"] });
      form.reset();
      toast({
        title: "Risk created",
        description: "The risk item has been created successfully.",
      });
      onCancel();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create risk: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: any) => {
    createRiskMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Risk title" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detailed description of the risk"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="impact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impact</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="likelihood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Likelihood</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select likelihood" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
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
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="privacy">Privacy</SelectItem>
                    <SelectItem value="bias">Bias</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="systemDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Details</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Details about the affected system (optional)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createRiskMutation.isPending}
          >
            {createRiskMutation.isPending ? "Creating..." : "Create Risk"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function RiskRegisterPage() {
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
  const [isNewRiskDialogOpen, setIsNewRiskDialogOpen] = useState(false);

  // Query risk items with their latest mitigations
  const { data: riskItems, isLoading } = useQuery<EnrichedRiskItem[]>({
    queryKey: ["/api/risk-items"],
  });

  // Filter the data based on selected filters
  const filteredItems = riskItems
    ? riskItems.filter((item) => {
        if (selectedSeverity && item.severity !== selectedSeverity) return false;
        if (selectedStatus && item.status !== selectedStatus) return false;
        return true;
      })
    : [];

  // Display handling for risk data visualization

  // Removed redundant helper functions - now using inline conditional rendering

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <TopNavbar title="Risk Register" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : riskItems?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "Loading..."
                : riskItems?.filter((r) => r.status === "open").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "Loading..."
                : riskItems?.filter((r) => r.severity === "critical").length ||
                  0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Items Table Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Risk Items</CardTitle>
            <Dialog open={isNewRiskDialogOpen} onOpenChange={setIsNewRiskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Risk
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Risk</DialogTitle>
                  <DialogDescription>
                    Create a new risk item to track and manage.
                  </DialogDescription>
                </DialogHeader>
                <NewRiskForm onCancel={() => setIsNewRiskDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-2">
            <div>
              <span className="text-sm font-medium mr-2">Severity:</span>
              {["All", "Critical", "High", "Medium", "Low"].map((sev) => (
                <Button
                  key={sev}
                  variant={
                    selectedSeverity === sev.toLowerCase() ||
                    (sev === "All" && selectedSeverity === null)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="mr-1"
                  onClick={() =>
                    setSelectedSeverity(
                      sev === "All" ? null : sev.toLowerCase()
                    )
                  }
                >
                  {sev}
                </Button>
              ))}
            </div>
            <div>
              <span className="text-sm font-medium mr-2">Status:</span>
              {["All", "Open", "Mitigated", "Closed"].map((status) => (
                <Button
                  key={status}
                  variant={
                    selectedStatus === status.toLowerCase() ||
                    (status === "All" && selectedStatus === null)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="mr-1"
                  onClick={() =>
                    setSelectedStatus(
                      status === "All" ? null : status.toLowerCase()
                    )
                  }
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No risk items found. Check filters or add risks with the "Add New Risk" button.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mitigation Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={item.severity === 'critical' ? 'text-red-600 bg-red-100 border-red-200' : 
                          item.severity === 'high' ? 'text-orange-600 bg-orange-100 border-orange-200' : 
                          item.severity === 'medium' ? 'text-yellow-600 bg-yellow-100 border-yellow-200' : 
                          item.severity === 'low' ? 'text-green-600 bg-green-100 border-green-200' : 
                          'text-gray-600 bg-gray-100 border-gray-200'}
                      >
                        {item.severity.charAt(0).toUpperCase() +
                          item.severity.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {item.category && (
                          <>
                            {item.category === 'security' && <Shield className="h-4 w-4 mr-1" />}
                            {item.category === 'privacy' && <Lock className="h-4 w-4 mr-1" />}
                            {item.category === 'bias' && <BarChart2 className="h-4 w-4 mr-1" />}
                            <span>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {item.status === 'open' ? <AlertCircle className="h-4 w-4 text-red-500" /> :
                         item.status === 'mitigated' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                         item.status === 'in-progress' ? <Clock className="h-4 w-4 text-yellow-500" /> :
                         <AlertCircle className="h-4 w-4 text-gray-500" />}
                        <span className="ml-2">
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.latestMitigation ? (
                        <Badge 
                          variant="outline" 
                          className={
                            item.latestMitigation.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            item.latestMitigation.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                            item.latestMitigation.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {item.latestMitigation.status.replace('-', ' ').charAt(0).toUpperCase() + 
                            item.latestMitigation.status.replace('-', ' ').slice(1)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                          No mitigation
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRiskId(item.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Risk Details</DialogTitle>
                            </DialogHeader>
                            {selectedRiskId && (
                              <RiskDetails 
                                riskId={selectedRiskId} 
                                onClose={() => setSelectedRiskId(null)} 
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setSelectedRiskId(item.id)}
                            >
                              <PenLine className="h-4 w-4 mr-2" />
                              Edit Risk
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRiskId(item.id);
                              }}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Add Mitigation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                // Delete functionality will be implemented later
                                toast({
                                  title: "Action not implemented",
                                  description: "Delete functionality coming soon",
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}