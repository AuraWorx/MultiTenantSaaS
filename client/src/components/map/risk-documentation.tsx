import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  PlusCircle, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Shield, 
  ShieldAlert,
  BarChart4
} from 'lucide-react';

interface Risk {
  id: string;
  title: string;
  description: string;
  category: 'privacy' | 'security' | 'ethical' | 'operational' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted';
  aiSystem: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

const mockRisks: Risk[] = [
  {
    id: 'risk-001',
    title: 'Potential PII exposure in customer recommendations',
    description: 'The recommendation engine may inadvertently expose personally identifiable information (PII) through its output.',
    category: 'privacy',
    severity: 'high',
    status: 'mitigated',
    aiSystem: 'Product Recommendation Engine',
    owner: 'Privacy Team',
    createdAt: '2025-03-15T14:30:00Z',
    updatedAt: '2025-04-20T09:15:00Z'
  },
  {
    id: 'risk-002',
    title: 'Algorithmic bias in hiring recommendations',
    description: 'The hiring recommendation algorithm may exhibit bias against certain demographic groups.',
    category: 'ethical',
    severity: 'critical',
    status: 'assessed',
    aiSystem: 'HR Candidate Screening',
    owner: 'Ethics Committee',
    createdAt: '2025-04-02T10:45:00Z',
    updatedAt: '2025-04-25T16:20:00Z'
  },
  {
    id: 'risk-003',
    title: 'Unauthorized access to model training data',
    description: 'Sensitive data used for model training could be accessed by unauthorized personnel.',
    category: 'security',
    severity: 'high',
    status: 'identified',
    aiSystem: 'Customer Churn Prediction',
    owner: 'Security Team',
    createdAt: '2025-04-18T11:30:00Z',
    updatedAt: '2025-04-18T11:30:00Z'
  },
  {
    id: 'risk-004',
    title: 'Model performance degradation',
    description: 'The model performance may degrade over time due to data drift and lack of retraining.',
    category: 'operational',
    severity: 'medium',
    status: 'accepted',
    aiSystem: 'Fraud Detection System',
    owner: 'Data Science Team',
    createdAt: '2025-03-28T09:15:00Z',
    updatedAt: '2025-04-15T14:45:00Z'
  },
  {
    id: 'risk-005',
    title: 'Non-compliance with GDPR right to explanation',
    description: 'The system may not provide adequate explanations for its decisions as required by GDPR.',
    category: 'compliance',
    severity: 'high',
    status: 'assessed',
    aiSystem: 'Credit Scoring Model',
    owner: 'Legal Team',
    createdAt: '2025-04-10T16:20:00Z',
    updatedAt: '2025-04-28T11:10:00Z'
  }
];

export function RiskDocumentation() {
  const [activeTab, setActiveTab] = useState('registry');
  const [filter, setFilter] = useState<{
    severity: string;
    category: string;
    status: string;
  }>({
    severity: '',
    category: '',
    status: ''
  });
  
  const [isAddingRisk, setIsAddingRisk] = useState(false);
  
  const filteredRisks = mockRisks.filter(risk => {
    let matches = true;
    
    if (filter.severity && filter.severity !== 'all') {
      matches = matches && risk.severity === filter.severity;
    }
    
    if (filter.category && filter.category !== 'all') {
      matches = matches && risk.category === filter.category;
    }
    
    if (filter.status && filter.status !== 'all') {
      matches = matches && risk.status === filter.status;
    }
    
    return matches;
  });
  
  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      privacy: 'bg-blue-100 text-blue-800',
      security: 'bg-red-100 text-red-800',
      ethical: 'bg-purple-100 text-purple-800',
      operational: 'bg-yellow-100 text-yellow-800',
      compliance: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={colors[category]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };
  
  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-800',
      high: 'bg-orange-100 text-orange-800 border-orange-800',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-800',
      low: 'bg-green-100 text-green-800 border-green-800'
    };
    
    return (
      <Badge className={colors[severity]}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'identified':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'assessed':
        return <BarChart4 className="h-4 w-4 text-blue-500" />;
      case 'mitigated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'accepted':
        return <Clock className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Risk Documentation</h2>
        <Button className="flex items-center gap-2" onClick={() => setIsAddingRisk(true)}>
          <PlusCircle className="h-4 w-4" />
          Add Risk
        </Button>
      </div>
      
      <Tabs defaultValue="registry" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="registry">Risk Registry</TabsTrigger>
          <TabsTrigger value="management">Risk Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registry" className="space-y-4">
          {isAddingRisk ? (
            <Card>
              <CardHeader>
                <CardTitle>Add New Risk</CardTitle>
                <CardDescription>
                  Document a new AI risk for your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-medium">Risk Title</label>
                      <Input id="title" placeholder="Enter risk title" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="aiSystem" className="text-sm font-medium">AI System</label>
                      <Input id="aiSystem" placeholder="Enter affected AI system" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">Description</label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe the risk in detail" 
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label htmlFor="category" className="text-sm font-medium">Category</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="privacy">Privacy</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="ethical">Ethical</SelectItem>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="severity" className="text-sm font-medium">Severity</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="owner" className="text-sm font-medium">Owner</label>
                      <Input id="owner" placeholder="Who owns this risk?" />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingRisk(false)}>
                  Cancel
                </Button>
                <Button>
                  Save Risk
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Risk Registry</CardTitle>
                  <CardDescription>
                    View and manage documented AI risks across your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
                    <Select value={filter.severity} onValueChange={(value) => setFilter({...filter, severity: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filter.category} onValueChange={(value) => setFilter({...filter, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="privacy">Privacy</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="ethical">Ethical</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filter.status} onValueChange={(value) => setFilter({...filter, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="identified">Identified</SelectItem>
                        <SelectItem value="assessed">Assessed</SelectItem>
                        <SelectItem value="mitigated">Mitigated</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Risk</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>AI System</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRisks.length > 0 ? (
                          filteredRisks.map((risk) => (
                            <TableRow key={risk.id}>
                              <TableCell className="font-medium">{risk.title}</TableCell>
                              <TableCell>{getCategoryBadge(risk.category)}</TableCell>
                              <TableCell>{getSeverityBadge(risk.severity)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(risk.status)}
                                  <span className="text-sm">
                                    {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{risk.aiSystem}</TableCell>
                              <TableCell>{risk.owner}</TableCell>
                              <TableCell>{new Date(risk.updatedAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No risks found matching your filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management Framework</CardTitle>
              <CardDescription>
                Follow these steps to effectively manage AI risks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-700 mb-2">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Identify</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-4 text-sm space-y-1">
                      <li>Discover potential AI risks</li>
                      <li>Document in risk registry</li>
                      <li>Assign initial severity</li>
                      <li>Designate risk owner</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 mb-2">
                      <BarChart4 className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Assess</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-4 text-sm space-y-1">
                      <li>Analyze risk impact</li>
                      <li>Determine likelihood</li>
                      <li>Evaluate potential consequences</li>
                      <li>Update severity rating</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 mb-2">
                      <Shield className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Mitigate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-4 text-sm space-y-1">
                      <li>Develop mitigation plans</li>
                      <li>Implement controls</li>
                      <li>Test effectiveness</li>
                      <li>Document remediation</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 mb-2">
                      <Clock className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Monitor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-4 text-sm space-y-1">
                      <li>Track risk status</li>
                      <li>Reassess periodically</li>
                      <li>Review effectiveness</li>
                      <li>Update as needed</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Recent Risk Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border rounded-md">
                    <div className="flex-shrink-0">
                      <ShieldAlert className="h-8 w-8 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">New critical risk identified</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Algorithmic bias in hiring recommendations - HR Candidate Screening
                      </p>
                      <div className="text-xs text-muted-foreground">
                        April 25, 2025 • Ethics Committee
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 border rounded-md">
                    <div className="flex-shrink-0">
                      <Shield className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Risk successfully mitigated</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Potential PII exposure in customer recommendations - Product Recommendation Engine
                      </p>
                      <div className="text-xs text-muted-foreground">
                        April 20, 2025 • Privacy Team
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Risk Overview by Category</CardTitle>
                <CardDescription>
                  Distribution of risks across different categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Visualization chart goes here</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Download Report
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Risk Severity Trends</CardTitle>
                <CardDescription>
                  How risk severity levels have changed over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Visualization chart goes here</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Download Report
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Mitigation Effectiveness</CardTitle>
                <CardDescription>
                  Analysis of risk mitigation effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Visualization chart goes here</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Download Report
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Risk by AI System</CardTitle>
                <CardDescription>
                  Which AI systems have the most associated risks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Visualization chart goes here</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Download Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}