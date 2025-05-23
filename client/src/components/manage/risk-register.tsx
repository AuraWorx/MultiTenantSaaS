import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  MoreHorizontal,
  PenLine,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RiskItem, RiskMitigation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { NewRiskForm } from "./new-risk-form";
import { EditRiskForm } from "./edit-risk-form";

// Type definition for the enriched risk item
interface EnrichedRiskItem extends RiskItem {
  latestMitigation: RiskMitigation | null;
}

// Type definition for the risk details response
interface RiskDetailsResponse {
  riskItem: RiskItem;
  mitigations: RiskMitigation[];
}

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
                        <FormControl>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={field.value}
                            onChange={field.onChange}
                          >
                            <option value="planned">Planned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </FormControl>
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

// Main Risk Register component that can be used in both the standalone page and in the Manage page
export function RiskRegister() {
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
  const [isNewRiskDialogOpen, setIsNewRiskDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query risk items with their latest mitigations
  const { data: riskItems, isLoading } = useQuery<EnrichedRiskItem[]>({
    queryKey: ["/api/risk-items"],
  });
  
  // Mutation for deleting risk items
  const deleteRiskMutation = useMutation({
    mutationFn: async (riskId: number) => {
      const res = await apiRequest("DELETE", `/api/risk-items/${riskId}`, {});
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items"] });
      toast({
        title: "Risk deleted",
        description: "The risk item and its mitigations have been deleted successfully.",
      });
      setIsDeleteConfirmOpen(false);
      setSelectedRiskId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete risk: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filter the data based on selected filters
  const filteredItems = riskItems
    ? riskItems.filter((item) => {
        if (selectedSeverity && item.severity !== selectedSeverity) return false;
        if (selectedStatus && item.status !== selectedStatus) return false;
        return true;
      })
    : [];

  return (
    <div className="space-y-4">
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
            <CardTitle className="text-sm font-medium">Mitigated Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "Loading..."
                : riskItems?.filter((r) => r.status === "mitigated").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {/* Severity Filter */}
          <div className="w-[150px]">
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={(e) => setSelectedSeverity(e.target.value === "all" ? null : e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-[150px]">
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={(e) => setSelectedStatus(e.target.value === "all" ? null : e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="mitigated">Mitigated</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
        </div>

        {/* Add New Risk Button */}
        <Button onClick={() => setIsNewRiskDialogOpen(true)} className="ml-auto">
          <Plus className="mr-2 w-4 h-4" /> Add Risk
        </Button>
      </div>

      {/* Risk Items Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Latest Mitigation</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <div className="text-gray-500">No risk items found</div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <button 
                        onClick={() => {
                          setSelectedRiskId(item.id);
                          setIsDetailsDialogOpen(true);
                        }}
                        className="text-left font-medium text-primary hover:underline"
                      >
                        {item.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        item.severity === 'critical' ? 'text-red-600 bg-red-100 border-red-200' : 
                        item.severity === 'high' ? 'text-orange-600 bg-orange-100 border-orange-200' : 
                        item.severity === 'medium' ? 'text-yellow-600 bg-yellow-100 border-yellow-200' : 
                        item.severity === 'low' ? 'text-green-600 bg-green-100 border-green-200' : 
                        'text-gray-600 bg-gray-100 border-gray-200'
                      }>
                        {item.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {item.status === 'open' ? <AlertCircle className="h-4 w-4 text-red-500 mr-1" /> :
                        item.status === 'mitigated' ? <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" /> :
                        item.status === 'in-progress' ? <Clock className="h-4 w-4 text-yellow-500 mr-1" /> :
                        <AlertCircle className="h-4 w-4 text-gray-500 mr-1" />}
                        {item.status.replace('-', ' ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category ? (
                        <div className="flex items-center">
                          {item.category.toLowerCase() === 'security' ? <Shield className="h-4 w-4 mr-1 text-blue-500" /> :
                          item.category.toLowerCase() === 'privacy' ? <Lock className="h-4 w-4 mr-1 text-purple-500" /> :
                          item.category.toLowerCase() === 'bias' ? <BarChart2 className="h-4 w-4 mr-1 text-orange-500" /> :
                          <AlertTriangle className="h-4 w-4 mr-1 text-gray-500" />}
                          {item.category}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
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
                          {item.latestMitigation.status.replace('-', ' ')}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setSelectedRiskId(item.id);
                            setIsDetailsDialogOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedRiskId(item.id);
                            setIsEditDialogOpen(true);
                          }}>
                            <PenLine className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedRiskId(item.id);
                            setIsDeleteConfirmOpen(true);
                          }} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Risk Details</DialogTitle>
          </DialogHeader>
          {selectedRiskId && <RiskDetails riskId={selectedRiskId} onClose={() => setIsDetailsDialogOpen(false)} />}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Risk</DialogTitle>
          </DialogHeader>
          {selectedRiskId && (
            <EditRiskForm riskId={selectedRiskId} onCancel={() => setIsEditDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this risk? This action cannot be undone and will also delete all associated mitigations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedRiskId && deleteRiskMutation.mutate(selectedRiskId)}
              disabled={deleteRiskMutation.isPending}
            >
              {deleteRiskMutation.isPending ? "Deleting..." : "Delete Risk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Risk Dialog */}
      <Dialog open={isNewRiskDialogOpen} onOpenChange={setIsNewRiskDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Risk</DialogTitle>
          </DialogHeader>
          <NewRiskForm onCancel={() => setIsNewRiskDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}