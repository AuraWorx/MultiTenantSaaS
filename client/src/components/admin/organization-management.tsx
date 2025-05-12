import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Organization } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Building, Trash2, Edit, RefreshCw } from "lucide-react";

export function OrganizationManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [organizationName, setOrganizationName] = useState("");
  const [template, setTemplate] = useState<"blank" | "demo">("blank");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if user has admin permissions
  const isAdmin = user?.role?.permissions?.includes("admin");

  // Fetch organizations
  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: isAdmin,
  });

  // Create organization mutation
  const createOrganizationMutation = useMutation({
    mutationFn: async ({ name, template }: { name: string; template: string }) => {
      const res = await apiRequest("POST", "/api/organizations", { name, template });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Organization created",
        description: "The organization has been created successfully",
      });
      setOrganizationName("");
      setTemplate("blank");
      setIsDialogOpen(false);
      // Invalidate organization list query
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete organization mutation
  const deleteOrganizationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/organizations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Organization deleted",
        description: "The organization has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create new organization function
  const handleCreateOrganization = () => {
    if (!organizationName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter an organization name",
        variant: "destructive",
      });
      return;
    }

    createOrganizationMutation.mutate({ name: organizationName, template });
  };

  if (!isAdmin) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Organization Management</CardTitle>
          <CardDescription>
            You don't have permission to access this area.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Organization Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Add a new tenant organization to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="organization-name">Organization Name</Label>
                <Input
                  id="organization-name"
                  placeholder="Enter organization name"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={template} onValueChange={(value) => setTemplate(value as "blank" | "demo")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blank">Blank Organization</SelectItem>
                    <SelectItem value="demo">Demo Data (with sample AI systems)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {template === "demo"
                    ? "Creates an organization with demo AI systems and risk examples"
                    : "Creates an empty organization with no initial data"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateOrganization}
                disabled={createOrganizationMutation.isPending}
              >
                {createOrganizationMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Organization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations?.map((org) => (
            <Card key={org.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center">
                    <Building className="mr-2 h-5 w-5" />
                    {org.name}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="icon" className="h-7 w-7">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${org.name}?`)) {
                          deleteOrganizationMutation.mutate(org.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Created: {new Date(org.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {/* Summary content would go here */}
                <p className="text-sm text-muted-foreground">
                  Organization ID: {org.id}
                </p>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 flex justify-end">
                <Button variant="outline" size="sm" className="text-xs">
                  <RefreshCw className="mr-2 h-3 w-3" />
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {organizations?.length === 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No Organizations</CardTitle>
            <CardDescription>
              There are no organizations in the system yet. Create your first organization to get started.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}