import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, Database, Server, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CMDBSystem {
  id: string;
  name: string;
  type: 'database' | 'application' | 'service' | 'infrastructure';
  owner: string;
  status: 'active' | 'inactive' | 'maintenance';
  aiIntegrations: number;
  lastUpdated: string;
}

interface AIIntegration {
  id: string;
  name: string;
  systemId: string;
  integrationPoint: string;
  dataFlow: 'inbound' | 'outbound' | 'bidirectional';
  dataTypes: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

const mockCMDBSystems: CMDBSystem[] = [
  {
    id: 'sys-001',
    name: 'Customer Relationship Management',
    type: 'application',
    owner: 'Sales Department',
    status: 'active',
    aiIntegrations: 3,
    lastUpdated: '2025-05-01T10:30:00Z'
  },
  {
    id: 'sys-002',
    name: 'Enterprise Resource Planning',
    type: 'application',
    owner: 'Operations',
    status: 'active',
    aiIntegrations: 5,
    lastUpdated: '2025-04-28T14:15:00Z'
  },
  {
    id: 'sys-003',
    name: 'Customer Data Warehouse',
    type: 'database',
    owner: 'IT',
    status: 'active',
    aiIntegrations: 8,
    lastUpdated: '2025-05-02T09:45:00Z'
  },
  {
    id: 'sys-004',
    name: 'Marketing Automation Platform',
    type: 'service',
    owner: 'Marketing',
    status: 'active',
    aiIntegrations: 4,
    lastUpdated: '2025-04-25T11:20:00Z'
  },
  {
    id: 'sys-005',
    name: 'Development Environment',
    type: 'infrastructure',
    owner: 'Engineering',
    status: 'maintenance',
    aiIntegrations: 2,
    lastUpdated: '2025-04-15T08:10:00Z'
  }
];

const mockAIIntegrations: AIIntegration[] = [
  {
    id: 'ai-001',
    name: 'Customer Churn Prediction',
    systemId: 'sys-001',
    integrationPoint: 'Customer Analysis Module',
    dataFlow: 'bidirectional',
    dataTypes: ['customer demographics', 'purchase history', 'support tickets'],
    riskLevel: 'medium'
  },
  {
    id: 'ai-002',
    name: 'Sales Forecasting',
    systemId: 'sys-001',
    integrationPoint: 'Opportunity Management',
    dataFlow: 'outbound',
    dataTypes: ['sales pipeline', 'historical sales data'],
    riskLevel: 'low'
  },
  {
    id: 'ai-003',
    name: 'Customer Sentiment Analysis',
    systemId: 'sys-001',
    integrationPoint: 'Support Case Management',
    dataFlow: 'inbound',
    dataTypes: ['customer interactions', 'support cases'],
    riskLevel: 'medium'
  }
];

export function CMDBIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [activeTab, setActiveTab] = useState('systems');
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedIntegrations, setSelectedIntegrations] = useState<AIIntegration[]>([]);
  
  const handleConnect = () => {
    setIsLoading(true);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsLoading(false);
      setIsConnected(true);
    }, 1500);
  };
  
  const handleSystemSelect = (systemId: string) => {
    setSelectedSystem(systemId);
    
    // Filter integrations for selected system
    const integrations = mockAIIntegrations.filter(
      integration => integration.systemId === systemId
    );
    setSelectedIntegrations(integrations);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'application':
        return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>;
      case 'service':
        return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>;
      case 'infrastructure':
        return <Server className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getDataFlowLabel = (flow: string) => {
    switch (flow) {
      case 'inbound':
        return 'Inbound';
      case 'outbound':
        return 'Outbound';
      case 'bidirectional':
        return 'Bidirectional';
      default:
        return flow;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CMDB Integration</CardTitle>
          <CardDescription>
            Connect to your Configuration Management Database to map AI systems to enterprise architecture
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="text-center mb-4">
                <Server className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Connect to your CMDB</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Link your Configuration Management Database to discover AI integrations
                </p>
              </div>
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect CMDB
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                  <span className="text-sm text-muted-foreground">Last synchronized: 10 minutes ago</span>
                </div>
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
              
              <Tabs defaultValue="systems" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="systems">Enterprise Systems</TabsTrigger>
                  <TabsTrigger value="integrations">AI Integrations</TabsTrigger>
                  <TabsTrigger value="reports">Risk Reports</TabsTrigger>
                </TabsList>
                
                <TabsContent value="systems" className="mt-0">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>System Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>AI Integrations</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockCMDBSystems.map((system) => (
                          <TableRow 
                            key={system.id} 
                            className={selectedSystem === system.id ? 'bg-muted/50' : ''}
                            onClick={() => handleSystemSelect(system.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <TableCell className="font-medium">{system.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {getTypeIcon(system.type)}
                                <span className="ml-2">{system.type.charAt(0).toUpperCase() + system.type.slice(1)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{system.owner}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(system.status)}`}>
                                {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>{system.aiIntegrations}</TableCell>
                            <TableCell>{new Date(system.lastUpdated).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="integrations" className="mt-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">AI System Integrations</h3>
                    <Select onValueChange={(value) => handleSystemSelect(value)}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Filter by enterprise system" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Systems</SelectItem>
                        {mockCMDBSystems.map((system) => (
                          <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedSystem ? (
                    selectedIntegrations.length > 0 ? (
                      <div className="space-y-4">
                        {selectedIntegrations.map((integration) => (
                          <Card key={integration.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{integration.name}</CardTitle>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(integration.riskLevel)}`}>
                                  {integration.riskLevel.charAt(0).toUpperCase() + integration.riskLevel.slice(1)} Risk
                                </span>
                              </div>
                              <CardDescription>
                                Integration Point: {integration.integrationPoint}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Data Flow</h4>
                                  <p className="text-sm">{getDataFlowLabel(integration.dataFlow)}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-1">System</h4>
                                  <p className="text-sm">
                                    {mockCMDBSystems.find(sys => sys.id === integration.systemId)?.name}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-1">Data Types</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {integration.dataTypes.map((type, index) => (
                                    <Badge key={index} variant="outline">{type}</Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                              <Button variant="outline" size="sm">View Details</Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No integrations found</AlertTitle>
                        <AlertDescription>
                          No AI integrations found for the selected system.
                        </AlertDescription>
                      </Alert>
                    )
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Select a system</AlertTitle>
                      <AlertDescription>
                        Please select an enterprise system to view its AI integrations.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
                
                <TabsContent value="reports" className="mt-0">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Integration Risk Overview</CardTitle>
                        <CardDescription>
                          Summary of AI integration risk levels across your enterprise systems
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">High Risk</span>
                              <span className="text-sm text-muted-foreground">12%</span>
                            </div>
                            <Progress value={12} className="h-2 bg-red-100" indicatorClassName="bg-red-500" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Medium Risk</span>
                              <span className="text-sm text-muted-foreground">43%</span>
                            </div>
                            <Progress value={43} className="h-2 bg-yellow-100" indicatorClassName="bg-yellow-500" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Low Risk</span>
                              <span className="text-sm text-muted-foreground">45%</span>
                            </div>
                            <Progress value={45} className="h-2 bg-green-100" indicatorClassName="bg-green-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Data Flow Analysis</CardTitle>
                        <CardDescription>
                          Analysis of data movement between AI systems and enterprise applications
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-4 border rounded-md">
                            <div className="text-3xl font-bold text-blue-600 mb-1">35%</div>
                            <div className="text-sm font-medium">Inbound</div>
                            <div className="text-xs text-muted-foreground">Data flows into AI</div>
                          </div>
                          <div className="p-4 border rounded-md">
                            <div className="text-3xl font-bold text-purple-600 mb-1">40%</div>
                            <div className="text-sm font-medium">Bidirectional</div>
                            <div className="text-xs text-muted-foreground">Two-way data flow</div>
                          </div>
                          <div className="p-4 border rounded-md">
                            <div className="text-3xl font-bold text-indigo-600 mb-1">25%</div>
                            <div className="text-sm font-medium">Outbound</div>
                            <div className="text-xs text-muted-foreground">Data flows from AI</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}