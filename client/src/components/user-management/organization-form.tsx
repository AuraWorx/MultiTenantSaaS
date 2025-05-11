import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { InsertOrganization, Organization } from '@shared/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface OrganizationFormProps {
  editingOrg?: Organization;
  onSuccess: () => void;
}

export function OrganizationForm({ editingOrg, onSuccess }: OrganizationFormProps) {
  const { toast } = useToast();
  
  // Create a form schema
  const orgFormSchema = z.object({
    name: z.string().min(3, { message: 'Organization name must be at least 3 characters' }),
  });

  type OrgFormValues = z.infer<typeof orgFormSchema>;

  // Set up the form with default values
  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: {
      name: editingOrg?.name || '',
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (orgData: InsertOrganization) => {
      const res = await apiRequest('POST', '/api/organizations', orgData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({
        title: 'Success',
        description: 'Organization created successfully',
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create organization: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, orgData }: { id: number; orgData: Partial<InsertOrganization> }) => {
      const res = await apiRequest('PATCH', `/api/organizations/${id}`, orgData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({
        title: 'Success',
        description: 'Organization updated successfully',
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update organization: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: OrgFormValues) => {
    if (editingOrg) {
      updateOrgMutation.mutate({ 
        id: editingOrg.id, 
        orgData: values 
      });
    } else {
      createOrgMutation.mutate(values as InsertOrganization);
    }
  };

  const isPending = createOrgMutation.isPending || updateOrgMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingOrg ? 'Update' : 'Create'} Organization
          </Button>
        </div>
      </form>
    </Form>
  );
}