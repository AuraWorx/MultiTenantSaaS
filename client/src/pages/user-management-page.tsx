import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNavbar } from '@/components/layout/top-navbar';
import { UsersTable } from '@/components/user-management/users-table';
import { UserForm } from '@/components/user-management/user-form';
import { OrganizationForm } from '@/components/user-management/organization-form';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Organization, Role, User } from '@shared/schema';

export default function UserManagementPage() {
  const { user } = useAuth();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddOrgDialogOpen, setIsAddOrgDialogOpen] = useState(false);
  const [isEditOrgDialogOpen, setIsEditOrgDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  
  // Only administrators should access this page
  if (user?.role.name !== 'Administrator') {
    return <Redirect to="/" />;
  }
  
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
  });
  
  const { data: organizations, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
  });

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopNavbar title="User Management" />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="sm:flex sm:items-center mb-6">
                <div className="sm:flex-auto">
                  <h2 className="text-xl font-semibold text-gray-900">Users & Organizations</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    Manage users, roles, and organizations in your Aura AI Govern instance.
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                  <Button 
                    onClick={() => setIsAddUserDialogOpen(true)}
                    className="flex items-center"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add user
                  </Button>
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="mb-4">
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="roles">Roles</TabsTrigger>
                  <TabsTrigger value="organizations">Organizations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="users">
                  <UsersTable users={users || []} isLoading={usersLoading} />
                </TabsContent>
                
                <TabsContent value="roles">
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {rolesLoading ? (
                        <li className="px-4 py-4 sm:px-6 text-center">Loading roles...</li>
                      ) : roles?.length ? (
                        roles.map((role) => (
                          <li key={role.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{role.name}</p>
                              <div className="mt-1 text-sm text-gray-500">
                                {role.permissions.length} permissions
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-4 sm:px-6 text-center">No roles found</li>
                      )}
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="organizations">
                  <div className="mb-4 flex justify-end">
                    <Button 
                      onClick={() => {
                        setActiveTab('organizations');
                        setIsAddOrgDialogOpen(true);
                      }}
                      className="flex items-center"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Organization
                    </Button>
                  </div>
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {orgsLoading ? (
                        <li className="px-4 py-4 sm:px-6 text-center">Loading organizations...</li>
                      ) : organizations?.length ? (
                        organizations.map((org) => (
                          <li key={org.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{org.name}</p>
                              <div className="flex items-center space-x-2">
                                <div className="mt-1 text-sm text-gray-500 mr-2">
                                  Created: {new Date(org.createdAt).toLocaleDateString()}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setEditingOrg(org);
                                    setIsEditOrgDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-4 sm:px-6 text-center">No organizations found</li>
                      )}
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
              
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Add new user</DialogTitle>
                  </DialogHeader>
                  <UserForm 
                    roles={roles || []} 
                    organizations={organizations || []} 
                    onSuccess={() => setIsAddUserDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
