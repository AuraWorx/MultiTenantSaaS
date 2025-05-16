import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RiskItem, RiskMitigation } from "@shared/schema";

// Type definition for the risk details response
interface RiskDetailsResponse {
  riskItem: RiskItem;
  mitigations: RiskMitigation[];
}

export function EditRiskForm({ riskId, onCancel }: { riskId: number; onCancel: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: riskData, isLoading } = useQuery<RiskDetailsResponse>({
    queryKey: ["/api/risk-items", riskId],
    enabled: !!riskId,
  });
  
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      severity: "medium",
      impact: "medium",
      likelihood: "medium",
      category: "security",
      systemDetails: "",
      status: "open",
      mitigation: "accept"
    }
  });
  
  // Set form data when risk data is loaded
  useEffect(() => {
    if (riskData?.riskItem) {
      const { riskItem } = riskData;
      form.reset({
        title: riskItem.title,
        description: riskItem.description || "",
        severity: riskItem.severity,
        impact: riskItem.impact || "medium",
        likelihood: riskItem.likelihood || "medium",
        category: riskItem.category || "security",
        systemDetails: riskItem.systemDetails || "",
        status: riskItem.status,
        mitigation: "accept" // Default mitigation strategy
      });
    }
  }, [riskData, form]);
  
  const updateRiskMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await apiRequest("PUT", `/api/risk-items/${riskId}`, values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items", riskId] });
      form.reset();
      toast({
        title: "Risk updated",
        description: "The risk item has been updated successfully.",
      });
      onCancel();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update risk: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const deleteRiskMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/risk-items/${riskId}`, {});
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items"] });
      toast({
        title: "Risk deleted",
        description: "The risk item and its mitigations have been deleted successfully.",
      });
      onCancel();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete risk: ${error.message}`,
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  });
  
  const onSubmit = (values: any) => {
    // Extract mitigation strategy and handle it separately
    const { mitigation, ...riskValues } = values;
    
    // Update the risk item
    updateRiskMutation.mutate({
      ...riskValues,
      hasMitigation: !!mitigation && mitigation !== "none"
    });
    
    // If mitigation is selected, create a mitigation record
    if (mitigation && mitigation !== "none") {
      const mitigationData = {
        description: `Applied ${mitigation} mitigation strategy`,
        status: "planned",
        notes: `Risk will be ${mitigation}ed according to organization policy.`
      };
      
      // Use API directly
      apiRequest("POST", `/api/risk-items/${riskId}/mitigations`, mitigationData)
        .then(() => {
          toast({
            title: "Mitigation added",
            description: "A new mitigation has been added to the risk."
          });
        })
        .catch(error => {
          toast({
            title: "Error",
            description: `Failed to add mitigation: ${error.message}`,
            variant: "destructive",
          });
        });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select likelihood" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="privacy">Privacy</SelectItem>
                    <SelectItem value="bias">Bias</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="mitigation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mitigation Strategy</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Action</SelectItem>
                    <SelectItem value="accept">Accept</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
                <FormDescription>
                  Apply a mitigation strategy to this risk
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the risk in detail"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="systemDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Details</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Specify which systems are affected by this risk"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="destructive"
            onClick={() => setIsDeleting(true)}
          >
            Delete Risk
          </Button>
          <div className="space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={updateRiskMutation.isPending}
            >
              {updateRiskMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this risk? This action cannot be undone 
              and will also delete all associated mitigations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleting(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteRiskMutation.mutate()}
              disabled={deleteRiskMutation.isPending}
            >
              {deleteRiskMutation.isPending ? "Deleting..." : "Delete Risk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}