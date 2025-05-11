import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  LockIcon, 
  Search, 
  PlusCircle, 
  AlertTriangle, 
  Shield, 
  FileText, 
  Upload, 
  EyeIcon,
  EyeOffIcon,
  Check,
  X,
  Clock,
  Loader2,
  Download
} from 'lucide-react';

interface PIIData {
  id: string;
  type: string;
  sample: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectCount: number;
  systems: string[];
}

interface ScanResult {
  id: string;
  aiSystem: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'scheduled' | 'failed';
  piiFound: number;
  risk: 'high' | 'medium' | 'low';
}

// Mock data for PII types detected
const mockPIIData: PIIData[] = [
  {
    id: 'pii-1',
    type: 'Email Address',
    sample: 'j*****@*********.com',
    severity: 'high',
    detectCount: 432,
    systems: ['Customer Recommendation Engine', 'User Profile Service']
  },
  {
    id: 'pii-2',
    type: 'Phone Number',
    sample: '(***) ***-**89',
    severity: 'high',
    detectCount: 218,
    systems: ['Customer Support Chatbot', 'User Profile Service']
  },
  {
    id: 'pii-3',
    type: 'IP Address',
    sample: '192.168.**.***',
    severity: 'medium',
    detectCount: 1247,
    systems: ['Fraud Detection System', 'Login Service']
  },
  {
    id: 'pii-4',
    type: 'Credit Card Number',
    sample: '**** **** **** **62',
    severity: 'critical',
    detectCount: 14,
    systems: ['Payment Processing System']
  },
  {
    id: 'pii-5',
    type: 'Social Security Number',
    sample: '***-**-**78',
    severity: 'critical',
    detectCount: 8,
    systems: ['HR Candidate Screening']
  }
];

// Mock data for scan results
const mockScanResults: ScanResult[] = [
  {
    id: 'scan-1',
    aiSystem: 'Customer Recommendation Engine',
    timestamp: '2025-05-01T14:30:00Z',
    status: 'completed',
    piiFound: 432,
    risk: 'medium'
  },
  {
    id: 'scan-2',
    aiSystem: 'HR Candidate Screening',
    timestamp: '2025-05-02T10:15:00Z',
    status: 'completed',
    piiFound: 8,
    risk: 'high'
  },
  {
    id: 'scan-3',
    aiSystem: 'Fraud Detection System',
    timestamp: '2025-05-02T16:45:00Z',
    status: 'completed',
    piiFound: 1247,
    risk: 'low'
  },
  {
    id: 'scan-4',
    aiSystem: 'Content Moderation System',
    timestamp: '2025-05-03T09:00:00Z',
    status: 'in-progress',
    piiFound: 0,
    risk: 'medium'
  },
  {
    id: 'scan-5',
    aiSystem: 'Customer Support Chatbot',
    timestamp: '2025-05-04T11:30:00Z',
    status: 'scheduled',
    piiFound: 0,
    risk: 'medium'
  }
];

export function PIILeakDetection() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  
  const handleScanStart = () => {
    if (selectedSystems.length === 0) return;
    
    setIsScanning(true);
    
    // Simulate a scan process
    setTimeout(() => {
      setIsScanning(false);
      // Navigate to results tab after scan
      setActiveTab('results');
    }, 3000);
  };
  
  const handleSystemSelect = (system: string) => {
    setSelectedSystems(prev => 
      prev.includes(system) 
        ? prev.filter(s => s !== system) 
        : [...prev, system]
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
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'scheduled':
        return <Badge className="bg-gray-100 text-gray-800">Scheduled</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return null;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'scheduled':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'failed':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-4xl font-bold text-red-600">1,919</CardTitle>
            <CardDescription>Total PII instances detected</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={73} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">73% increase from last scan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-4xl font-bold text-orange-600">22</CardTitle>
            <CardDescription>Critical PII findings</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={12} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">12% decrease from last scan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-4xl font-bold text-blue-600">8/12</CardTitle>
            <CardDescription>Systems scanned</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={66} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">66% of systems checked</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top PII Types Detected</CardTitle>
            <CardDescription>
              Most common personal data found in AI systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Sample</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead>Systems Affected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPIIData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {showSampleData ? (
                            <span>{item.sample}</span>
                          ) : (
                            <span>••••••••••••</span>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setShowSampleData(!showSampleData)}
                            className="h-6 w-6"
                          >
                            {showSampleData ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(item.severity)}</TableCell>
                      <TableCell className="text-right">{item.detectCount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.systems.map((system, idx) => (
                            <Badge key={idx} variant="outline">{system}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Scan Activity</CardTitle>
            <CardDescription>
              Latest PII detection scans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockScanResults.slice(0, 3).map((scan) => (
                <div key={scan.id} className="flex items-start space-x-4 p-4 rounded-lg border">
                  <div className="mt-0.5">
                    {getStatusIcon(scan.status)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{scan.aiSystem}</div>
                      <div className="text-sm text-muted-foreground">{new Date(scan.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {scan.status === 'completed' ? `${scan.piiFound} PII instances found` : 'Scan in progress'}
                      </div>
                      <div>{getStatusBadge(scan.status)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => setActiveTab('results')}>
              View All Scans
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Start New Scan</CardTitle>
            <CardDescription>
              Run a PII detection scan on your AI systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select AI Systems</label>
                <div className="space-y-2">
                  {['Customer Recommendation Engine', 'HR Candidate Screening', 'Fraud Detection System', 'Content Moderation System'].map((system) => (
                    <div key={system} className="flex items-center space-x-2">
                      <Switch 
                        checked={selectedSystems.includes(system)}
                        onCheckedChange={() => handleSystemSelect(system)}
                      />
                      <label className="text-sm">{system}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Scan Depth</label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select scan depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Quick Scan</SelectItem>
                    <SelectItem value="medium">Standard Scan</SelectItem>
                    <SelectItem value="high">Deep Scan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleScanStart}
              disabled={selectedSystems.length === 0 || isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Start Scan
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
  
  const renderScanResults = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>PII Scan Results</CardTitle>
              <CardDescription>
                History of PII detection scans
              </CardDescription>
            </div>
            <Button onClick={() => setActiveTab('dashboard')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Scan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>AI System</TableHead>
                  <TableHead>Scan Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PII Found</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockScanResults.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-medium">{scan.aiSystem}</TableCell>
                    <TableCell>{new Date(scan.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(scan.status)}
                        <span>{getStatusBadge(scan.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{scan.status === 'completed' ? scan.piiFound.toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      {scan.status === 'completed' && (
                        <Badge className={
                          scan.risk === 'high' ? 'bg-red-100 text-red-800' :
                          scan.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {scan.risk.charAt(0).toUpperCase() + scan.risk.slice(1)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" disabled={scan.status !== 'completed'}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled={scan.status !== 'completed'}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PII Detection Settings</CardTitle>
          <CardDescription>
            Configure how PII is detected and reported
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium">PII Types</h3>
              <p className="text-sm text-muted-foreground">Select which types of personal data to scan for</p>
              
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Switch id="email" defaultChecked />
                  <label htmlFor="email" className="text-sm font-medium">Email Addresses</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="phone" defaultChecked />
                  <label htmlFor="phone" className="text-sm font-medium">Phone Numbers</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="ssn" defaultChecked />
                  <label htmlFor="ssn" className="text-sm font-medium">Social Security Numbers</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="credit" defaultChecked />
                  <label htmlFor="credit" className="text-sm font-medium">Credit Card Numbers</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="address" defaultChecked />
                  <label htmlFor="address" className="text-sm font-medium">Physical Addresses</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="ip" defaultChecked />
                  <label htmlFor="ip" className="text-sm font-medium">IP Addresses</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="passport" defaultChecked />
                  <label htmlFor="passport" className="text-sm font-medium">Passport Numbers</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="dob" defaultChecked />
                  <label htmlFor="dob" className="text-sm font-medium">Dates of Birth</label>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Scan Schedule</h3>
              <p className="text-sm text-muted-foreground">Configure automated scanning schedule</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Enable Scheduled Scans</label>
                    <p className="text-xs text-muted-foreground">Automatically scan systems on a schedule</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Day</label>
                    <Select defaultValue="sunday">
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sunday">Sunday</SelectItem>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Select defaultValue="1am">
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1am">1:00 AM</SelectItem>
                        <SelectItem value="2am">2:00 AM</SelectItem>
                        <SelectItem value="3am">3:00 AM</SelectItem>
                        <SelectItem value="4am">4:00 AM</SelectItem>
                        <SelectItem value="5am">5:00 AM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Notifications</h3>
              <p className="text-sm text-muted-foreground">Configure alerts for PII detection</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Email Alerts</label>
                    <p className="text-xs text-muted-foreground">Receive email notifications for critical findings</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alert Recipients</label>
                  <Textarea placeholder="Enter email addresses, separated by commas" defaultValue="security@company.com, compliance@company.com" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alert Threshold</label>
                  <Select defaultValue="critical">
                    <SelectTrigger>
                      <SelectValue placeholder="Select threshold" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical findings only</SelectItem>
                      <SelectItem value="high">High and critical findings</SelectItem>
                      <SelectItem value="all">All findings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">
            Reset to Defaults
          </Button>
          <Button>
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PII Leak Detection</h2>
          <p className="text-muted-foreground mt-1">Identify and remediate personal data leaks in AI systems</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          <LockIcon className="mr-1 h-3 w-3" />
          Privacy Tool
        </Badge>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="results">Scan Results</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          {renderDashboard()}
        </TabsContent>
        
        <TabsContent value="results" className="mt-6">
          {renderScanResults()}
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          {renderSettings()}
        </TabsContent>
      </Tabs>
    </div>
  );
}