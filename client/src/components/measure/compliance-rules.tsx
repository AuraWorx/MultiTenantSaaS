import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  PlusCircle, 
  Filter, 
  FileText, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'privacy' | 'security' | 'fairness' | 'transparency' | 'accountability';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface ComplianceCheck {
  id: string;
  ruleId: string;
  aiSystemId: string;
  aiSystemName: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  details: string;
  date: string;
}

// Mock data for compliance rules
const mockRules: ComplianceRule[] = [
  {
    id: 'rule-001',
    name: 'PII Data Handling Compliance',
    description: 'Ensure all personally identifiable information is properly anonymized or encrypted',
    category: 'privacy',
    severity: 'critical',
    status: 'active',
    createdAt: '2025-03-15T14:30:00Z',
    updatedAt: '2025-04-05T09:15:00Z'
  },
  {
    id: 'rule-002',
    name: 'Model Bias Detection',
    description: 'Regularly test for and mitigate potential biases in ML models',
    category: 'fairness',
    severity: 'high',
    status: 'active',
    createdAt: '2025-02-20T11:45:00Z',
    updatedAt: '2025-04-10T16:20:00Z'
  },
  {
    id: 'rule-003',
    name: 'Model Decision Explanation',
    description: 'Ensure ability to explain key decisions made by AI systems',
    category: 'transparency',
    severity: 'medium',
    status: 'active',
    createdAt: '2025-03-25T09:30:00Z',
    updatedAt: '2025-03-25T09:30:00Z'
  },
  {
    id: 'rule-004',
    name: 'API Security Requirements',
    description: 'Enforce secure API access to AI models with proper authentication',
    category: 'security',
    severity: 'high',
    status: 'active',
    createdAt: '2025-01-15T10:20:00Z',
    updatedAt: '2025-04-02T14:45:00Z'
  },
  {
    id: 'rule-005',
    name: 'Model Accuracy Monitoring',
    description: 'Regular monitoring and reporting of model accuracy metrics',
    category: 'accountability',
    severity: 'medium',
    status: 'draft',
    createdAt: '2025-04-01T15:10:00Z',
    updatedAt: '2025-04-01T15:10:00Z'
  }
];

// Mock data for compliance checks
const mockChecks: ComplianceCheck[] = [
  {
    id: 'check-001',
    ruleId: 'rule-001',
    aiSystemId: 'sys-001',
    aiSystemName: 'Customer Recommendation Engine',
    status: 'passed',
    details: 'All PII data properly anonymized with k-anonymity',
    date: '2025-04-10T09:30:00Z'
  },
  {
    id: 'check-002',
    ruleId: 'rule-002',
    aiSystemId: 'sys-001',
    aiSystemName: 'Customer Recommendation Engine',
    status: 'warning',
    details: 'Potential minor age bias detected, needs further investigation',
    date: '2025-04-08T14:15:00Z'
  },
  {
    id: 'check-003',
    ruleId: 'rule-003',
    aiSystemId: 'sys-002',
    aiSystemName: 'HR Candidate Screening',
    status: 'failed',
    details: 'Unable to provide clear explanation for candidate rejections',
    date: '2025-04-05T11:30:00Z'
  },
  {
    id: 'check-004',
    ruleId: 'rule-004',
    aiSystemId: 'sys-002',
    aiSystemName: 'HR Candidate Screening',
    status: 'passed',
    details: 'OAuth2 authentication implemented with proper scopes',
    date: '2025-04-12T16:45:00Z'
  },
  {
    id: 'check-005',
    ruleId: 'rule-005',
    aiSystemId: 'sys-003',
    aiSystemName: 'Fraud Detection System',
    status: 'pending',
    details: 'Scheduled for next quarterly review',
    date: '2025-04-15T10:00:00Z'
  }
];

export function ComplianceRules() {
  const [activeTab, setActiveTab] = useState('rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<{
    category: string;
    severity: string;
    status: string;
  }>({
    category: '',
    severity: '',
    status: ''
  });
  
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  
  const handleRuleSelect = (ruleId: string) => {
    setSelectedRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId) 
        : [...prev, ruleId]
    );
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRules(filteredRules.map(rule => rule.id));
    } else {
      setSelectedRules([]);
    }
  };
  
  const filteredRules = mockRules.filter(rule => {
    let matches = true;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        rule.name.toLowerCase().includes(query) ||
        rule.description.toLowerCase().includes(query);
      
      if (!matchesSearch) matches = false;
    }
    
    // Apply category filter
    if (filter.category && filter.category !== 'all') {
      if (rule.category !== filter.category) matches = false;
    }
    
    // Apply severity filter
    if (filter.severity && filter.severity !== 'all') {
      if (rule.severity !== filter.severity) matches = false;
    }
    
    // Apply status filter
    if (filter.status && filter.status !== 'all') {
      if (rule.status !== filter.status) matches = false;
    }
    
    return matches;
  });
  
  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      privacy: 'bg-blue-100 text-blue-800',
      security: 'bg-red-100 text-red-800',
      fairness: 'bg-purple-100 text-purple-800',
      transparency: 'bg-yellow-100 text-yellow-800',
      accountability: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={colors[category]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };
  
  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={colors[severity]}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };
  
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  const getCheckStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Compliance Rules Engine</h2>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Rule
        </Button>
      </div>
      
      <Tabs defaultValue="rules" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Rule Library</TabsTrigger>
          <TabsTrigger value="checks">Compliance Checks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Compliance Rules</CardTitle>
                  <CardDescription>
                    Manage your organization's AI compliance requirements
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" className="flex items-center space-x-1">
                    <Filter className="h-4 w-4 mr-1" />
                    <span>Filters</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-1">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>Export</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search rules..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select 
                    value={filter.category} 
                    onValueChange={(value) => setFilter({...filter, category: value})}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="privacy">Privacy</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="fairness">Fairness</SelectItem>
                      <SelectItem value="transparency">Transparency</SelectItem>
                      <SelectItem value="accountability">Accountability</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={filter.severity} 
                    onValueChange={(value) => setFilter({...filter, severity: value})}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={filter.status} 
                    onValueChange={(value) => setFilter({...filter, status: value})}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox 
                            checked={selectedRules.length === filteredRules.length && filteredRules.length > 0} 
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRules.length > 0 ? (
                        filteredRules.map(rule => (
                          <TableRow key={rule.id} className="cursor-pointer">
                            <TableCell>
                              <Checkbox 
                                checked={selectedRules.includes(rule.id)} 
                                onCheckedChange={() => handleRuleSelect(rule.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{rule.name}</TableCell>
                            <TableCell>{getCategoryBadge(rule.category)}</TableCell>
                            <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                            <TableCell>{getStatusBadge(rule.status)}</TableCell>
                            <TableCell>{new Date(rule.updatedAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No rules found matching your filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent Compliance Checks</CardTitle>
              <CardDescription>
                View the results of compliance checks across your AI systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockChecks.map(check => {
                  const rule = mockRules.find(r => r.id === check.ruleId);
                  
                  return (
                    <div key={check.id} className="flex items-start space-x-4 p-4 rounded-lg border">
                      <div className="mt-0.5">
                        {getCheckStatusIcon(check.status)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{rule?.name}</div>
                          <div className="text-sm text-muted-foreground">{new Date(check.date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">AI System:</span> {check.aiSystemName}
                        </div>
                        <div className="text-sm">{check.details}</div>
                        <div className="flex items-center space-x-2 pt-1">
                          {rule && getCategoryBadge(rule.category)}
                          {rule && getSeverityBadge(rule.severity)}
                          <Badge className={
                            check.status === 'passed' ? 'bg-green-100 text-green-800' :
                            check.status === 'failed' ? 'bg-red-100 text-red-800' :
                            check.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Checks</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>
                  Overall compliance status across AI systems
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="text-sm font-medium text-muted-foreground">Compliant</div>
                    <div className="text-2xl font-bold text-green-600">76%</div>
                    <div className="text-xs text-muted-foreground">↑ 12% from last month</div>
                  </div>
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="text-sm font-medium text-muted-foreground">At Risk</div>
                    <div className="text-2xl font-bold text-red-600">24%</div>
                    <div className="text-xs text-muted-foreground">↓ 8% from last month</div>
                  </div>
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="text-sm font-medium text-muted-foreground">Active Rules</div>
                    <div className="text-2xl font-bold">42</div>
                    <div className="text-xs text-muted-foreground">+5 new this quarter</div>
                  </div>
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="text-sm font-medium text-muted-foreground">Total Checks</div>
                    <div className="text-2xl font-bold">187</div>
                    <div className="text-xs text-muted-foreground">Last 30 days</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Generate Detailed Report</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Compliance Issues</CardTitle>
                <CardDescription>
                  Most common compliance failures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <span className="font-bold text-red-700">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Inadequate Decision Explanation</p>
                      <p className="text-sm text-muted-foreground">14 systems affected</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <span className="font-bold text-red-700">2</span>
                    </div>
                    <div>
                      <p className="font-medium">PII Data Leakage</p>
                      <p className="text-sm text-muted-foreground">9 systems affected</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <span className="font-bold text-red-700">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Gender Bias in Results</p>
                      <p className="text-sm text-muted-foreground">7 systems affected</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <span className="font-bold text-red-700">4</span>
                    </div>
                    <div>
                      <p className="font-medium">Insufficient Data Disclosure</p>
                      <p className="text-sm text-muted-foreground">5 systems affected</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Issues</Button>
              </CardFooter>
            </Card>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Issues Require Attention</AlertTitle>
            <AlertDescription>
              There are 3 critical compliance issues that require immediate attention. Review these issues and assign remediation tasks.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}