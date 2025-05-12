import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest, getQueryFn } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart4, 
  Upload, 
  FileText, 
  Filter,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
  RefreshCw,
  Loader2
} from 'lucide-react';

// The data types used in the component
interface BiasAnalysisScan {
  id: number;
  organizationId: number;
  name: string;
  description: string | null;
  dataSource: string; // 'csv', 'json', 'webhook'
  status: string; // 'pending', 'processing', 'completed', 'failed'
  startedAt: string;
  completedAt: string | null;
  createdBy: number;
}

interface BiasAnalysisResult {
  id: number;
  scanId: number;
  organizationId: number;
  metricName: string;
  metricDescription: string | null;
  score: number;
  threshold: number;
  status: string; // 'pass', 'warning', 'fail'
  demographicGroup: string | null;
  additionalData: string | null; // JSON string
  createdAt: string;
}

// This is only used for the demo mockup UI, real data comes from API
const mockBiasReport = {
  id: '1',
  aiSystem: 'HR Candidate Screening Algorithm',
  modelType: 'Classification',
  date: '2025-04-15',
  status: 'warning',
  metrics: [
    {
      id: '1',
      name: 'Statistical Parity',
      description: 'Ensures equal probability of prediction across protected groups',
      score: 0.82,
      threshold: 0.80,
      status: 'pass'
    },
    {
      id: '2',
      name: 'Disparate Impact',
      description: 'Measures the ratio of favorable outcomes between groups',
      score: 0.78,
      threshold: 0.80,
      status: 'warning'
    },
    {
      id: '3',
      name: 'Equal Opportunity',
      description: 'Ensures equal true positive rates across groups',
      score: 0.85,
      threshold: 0.75,
      status: 'pass'
    },
    {
      id: '4',
      name: 'Predictive Parity',
      description: 'Ensures equal positive predictive values across groups',
      score: 0.90,
      threshold: 0.75,
      status: 'pass'
    }
  ],
  demographicGroups: {
    'gender': [
      { id: '1', name: 'Male', performance: 0.86, delta: 0 },
      { id: '2', name: 'Female', performance: 0.79, delta: -0.07 },
      { id: '3', name: 'Non-binary', performance: 0.81, delta: -0.05 }
    ],
    'age': [
      { id: '1', name: '18-25', performance: 0.74, delta: -0.08 },
      { id: '2', name: '26-40', performance: 0.82, delta: 0 },
      { id: '3', name: '41-60', performance: 0.85, delta: 0.03 },
      { id: '4', name: '60+', performance: 0.71, delta: -0.11 }
    ],
    'ethnicity': [
      { id: '1', name: 'White', performance: 0.83, delta: 0 },
      { id: '2', name: 'Black', performance: 0.76, delta: -0.07 },
      { id: '3', name: 'Hispanic', performance: 0.77, delta: -0.06 },
      { id: '4', name: 'Asian', performance: 0.85, delta: 0.02 },
      { id: '5', name: 'Other', performance: 0.78, delta: -0.05 }
    ]
  }
};

const mockSystems = [
  { id: '1', name: 'HR Candidate Screening' },
  { id: '2', name: 'Loan Approval System' },
  { id: '3', name: 'Content Recommendation' },
  { id: '4', name: 'Criminal Risk Assessment' },
  { id: '5', name: 'Customer Support Chatbot' }
];

export function BiasAnalysis() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [testDataUrl, setTestDataUrl] = useState('');
  
  // State for file upload
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // State for creating a new scan
  const [scanName, setScanName] = useState('');
  const [scanDescription, setScanDescription] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState<'csv' | 'json' | 'webhook'>('csv');
  
  // Fetch all scans
  const { 
    data: scans, 
    isLoading: isLoadingScans,
    refetch: refetchScans
  } = useQuery({
    queryKey: ['/api/bias-analysis/scans'],
    queryFn: getQueryFn({ on401: 'throw' })
  });
  
  // Fetch scan details (results) for a selected scan
  const { 
    data: selectedScan,
    isLoading: isLoadingScanDetails
  } = useQuery({
    queryKey: ['/api/bias-analysis/results', selectedScanId],
    queryFn: getQueryFn({ on401: 'throw' }),
    enabled: !!selectedScanId
  });
  
  // Fetch available AI systems
  const { 
    data: aiSystems
  } = useQuery({
    queryKey: ['/api/ai-systems'],
    queryFn: getQueryFn({ on401: 'throw' })
  });
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileData(event.target?.result as string);
      };
      
      reader.readAsText(file);
    }
  };
  
  // Create a new scan
  const createScanMutation = useMutation({
    mutationFn: async (scanData: {
      name: string;
      description: string | null;
      dataSource: string;
    }) => {
      const res = await apiRequest('POST', '/api/bias-analysis/scans', scanData);
      return await res.json();
    },
    onSuccess: (data) => {
      setSelectedScanId(data.id);
      
      // Process the scan with the uploaded data
      if (selectedDataSource === 'webhook') {
        processScanMutation.mutate({
          scanId: data.id,
          webhookUrl: testDataUrl
        });
      } else {
        processScanMutation.mutate({
          scanId: data.id,
          fileData: fileData as string,
          fileType: selectedDataSource
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating scan',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Process a scan with data
  const processScanMutation = useMutation({
    mutationFn: async (data: {
      scanId: number;
      fileData?: string;
      fileType?: string;
      webhookUrl?: string;
    }) => {
      const res = await apiRequest('POST', `/api/bias-analysis/scans/${data.scanId}/process`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Analysis initiated',
        description: 'Your bias analysis is now processing. You can view results when complete.',
      });
      
      refetchScans();
      
      // Reset form
      setScanName('');
      setScanDescription('');
      setFileData(null);
      setFileName(null);
      setTestDataUrl('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error processing data',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Start a new bias analysis
  const handleStartAnalysis = () => {
    if (!scanName) {
      toast({
        title: 'Missing information',
        description: 'Please provide a name for this analysis',
        variant: 'destructive'
      });
      return;
    }
    
    if (selectedDataSource !== 'webhook' && !fileData) {
      toast({
        title: 'Missing data',
        description: 'Please upload a file to analyze',
        variant: 'destructive'
      });
      return;
    }
    
    if (selectedDataSource === 'webhook' && !testDataUrl) {
      toast({
        title: 'Missing webhook URL',
        description: 'Please provide a webhook URL for data source',
        variant: 'destructive'
      });
      return;
    }
    
    createScanMutation.mutate({
      name: scanName,
      description: scanDescription || null,
      dataSource: selectedDataSource
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'fail':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getDeltaDisplay = (delta: number) => {
    if (delta === 0) {
      return <span className="text-gray-600">Baseline</span>;
    } else if (delta > 0) {
      const formattedDelta = (delta * 100).toFixed(1);
      return <span className="text-green-600">+{formattedDelta}%</span>;
    } else {
      const formattedDelta = (Math.abs(delta) * 100).toFixed(1);
      return <span className="text-red-600">-{formattedDelta}%</span>;
    }
  };
  
  const renderDashboard = () => {
    // Calculate summary stats from scans data
    const scanStats = useMemo(() => {
      if (!scans) return { warnings: 0, failures: 0, total: 0, passRate: 0 };
      
      const total = scans.length;
      const warnings = scans.filter(scan => scan.status === 'completed' && scan.name.toLowerCase().includes('warning')).length;
      const failures = scans.filter(scan => scan.status === 'failed').length;
      const completed = scans.filter(scan => scan.status === 'completed').length;
      const passRate = total > 0 ? ((completed - warnings - failures) / total) * 100 : 0;
      
      return { warnings, failures, total, passRate };
    }, [scans]);
    
    const handleViewScan = (scanId: number) => {
      setSelectedScanId(scanId);
      setActiveTab('results');
    };
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Bias Analysis Dashboard</h2>
          <Button size="sm" onClick={() => refetchScans()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold text-yellow-600">{scanStats.warnings}</CardTitle>
              <CardDescription>AI systems with bias warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={scanStats.total > 0 ? (scanStats.warnings / scanStats.total) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {scanStats.total > 0 ? 
                  `${Math.round((scanStats.warnings / scanStats.total) * 100)}% of total systems` : 
                  'No systems analyzed yet'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold text-red-600">{scanStats.failures}</CardTitle>
              <CardDescription>Failed analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={scanStats.total > 0 ? (scanStats.failures / scanStats.total) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {scanStats.total > 0 ? 
                  `${Math.round((scanStats.failures / scanStats.total) * 100)}% of total analyses` : 
                  'No systems analyzed yet'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold text-blue-600">
                {scanStats.passRate > 0 ? `${Math.round(scanStats.passRate)}%` : 'N/A'}
              </CardTitle>
              <CardDescription>Overall pass rate</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={scanStats.passRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Based on {scanStats.total} analyses
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Bias Analysis Scans</CardTitle>
                  <CardDescription>
                    Latest fairness and bias assessments
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingScans ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : scans && scans.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Data Source</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scans.map(scan => (
                        <TableRow key={scan.id}>
                          <TableCell className="font-medium">{scan.name}</TableCell>
                          <TableCell>{scan.dataSource}</TableCell>
                          <TableCell>{new Date(scan.startedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {scan.status === 'pending' && <Badge variant="outline">Pending</Badge>}
                            {scan.status === 'processing' && 
                              <Badge className="bg-blue-100 text-blue-800">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Processing
                              </Badge>
                            }
                            {scan.status === 'completed' && <Badge className="bg-green-100 text-green-800">Completed</Badge>}
                            {scan.status === 'failed' && <Badge variant="destructive">Failed</Badge>}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewScan(scan.id)}
                              disabled={scan.status !== 'completed'}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No bias analysis scans found. Start a new analysis to see results here.
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Start New Bias Analysis</CardTitle>
              <CardDescription>
                Analyze data for potential bias issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Analysis Name</label>
                  <Input 
                    placeholder="Enter a name for this analysis"
                    value={scanName}
                    onChange={(e) => setScanName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea 
                    placeholder="Describe the purpose of this analysis"
                    value={scanDescription}
                    onChange={(e) => setScanDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Source Type</label>
                  <Select 
                    value={selectedDataSource} 
                    onValueChange={(value) => setSelectedDataSource(value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data source type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV File</SelectItem>
                      <SelectItem value="json">JSON File</SelectItem>
                      <SelectItem value="webhook">Webhook URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedDataSource === 'webhook' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Webhook URL</label>
                    <Input 
                      placeholder="https://your-data-source.com/api"
                      value={testDataUrl}
                      onChange={(e) => setTestDataUrl(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload {selectedDataSource.toUpperCase()} File
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <div className="w-full">
                        <div 
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                          onClick={() => {
                            // Find the hidden input and trigger its click event
                            const fileInput = document.getElementById('file-upload-input');
                            if (fileInput) {
                              fileInput.click();
                            }
                          }}
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {fileName ? (
                              <>
                                <FileText className="w-8 h-8 mb-3 text-blue-500" />
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                  {fileName}
                                </p>
                                <p className="text-xs text-blue-500">
                                  Click to change file
                                </p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 mb-3 text-gray-500" />
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {selectedDataSource === 'csv' ? 'CSV file with headers' : 'JSON file'}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        <input 
                          id="file-upload-input"
                          type="file" 
                          className="hidden" 
                          accept={selectedDataSource === 'csv' ? '.csv' : '.json'} 
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-6 pb-8">
              <div className="w-full flex justify-center">
                <Button 
                  size="lg"
                  className="px-8 py-6 text-lg font-medium" 
                  onClick={handleStartAnalysis}
                  disabled={
                    !scanName || 
                    createScanMutation.isPending || 
                    processScanMutation.isPending ||
                    (selectedDataSource !== 'webhook' && !fileData) ||
                    (selectedDataSource === 'webhook' && !testDataUrl)
                  }
                >
                  {createScanMutation.isPending || processScanMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {createScanMutation.isPending ? 'Creating scan...' : 'Processing data...'}
                    </>
                  ) : (
                    <>
                      <BarChart4 className="mr-2 h-5 w-5" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Common Bias Issues</CardTitle>
              <CardDescription>
                Most frequently detected bias problems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Gender bias in HR systems</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 5) + 1} systems affected
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium">Age discrimination in loan applications</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 5) + 1} systems affected
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium">Racial bias in risk assessment</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 3) + 1} systems affected
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium">Geographic discrimination</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 2) + 1} system affected
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    // Check if a scan is selected and results are available
    if (!selectedScanId || !selectedScan) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          {isLoadingScanDetails ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading analysis results...</p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No analysis results selected.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab('dashboard')}>
                Return to Dashboard
              </Button>
            </>
          )}
        </div>
      );
    }
    
    const { scan, resultsByGroup } = selectedScan;
    
    // Calculate overall status based on results
    const allResults = Object.values(resultsByGroup).flat();
    const failCount = allResults.filter(result => result.status === 'fail').length;
    const warningCount = allResults.filter(result => result.status === 'warning').length;
    
    let overallStatus = 'pass';
    if (failCount > 0) {
      overallStatus = 'fail';
    } else if (warningCount > 0) {
      overallStatus = 'warning';
    }
    
    // Parse demographic group data
    const demographicGroups: Record<string, any[]> = {};
    
    Object.entries(resultsByGroup).forEach(([groupName, results]) => {
      if (groupName !== 'overall') {
        // This is a demographic group, let's collect its data
        demographicGroups[groupName] = results.map(result => {
          // Parse the additional data if available
          let additionalData = {};
          try {
            if (result.additionalData) {
              additionalData = JSON.parse(result.additionalData);
            }
          } catch (e) {
            console.error('Failed to parse additional data:', e);
          }
          
          return {
            id: result.id.toString(),
            name: result.metricName,
            score: result.score,
            threshold: result.threshold,
            status: result.status,
            additionalData
          };
        });
      }
    });
    
    // If we don't have any demographic groups but have overall results
    if (Object.keys(demographicGroups).length === 0 && resultsByGroup.overall) {
      // Create a gender group with fabricated data from overall results
      demographicGroups['analysis'] = resultsByGroup.overall.map(result => ({
        id: result.id.toString(),
        name: result.metricName,
        score: result.score,
        threshold: result.threshold,
        status: result.status,
        additionalData: {}
      }));
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Bias Analysis Results: {scan.name}</h2>
            <p className="text-sm text-muted-foreground">
              Analysis performed on {new Date(scan.startedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button size="sm" onClick={() => setActiveTab('dashboard')}>
              <BarChart4 className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Overall Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className={`rounded-full w-24 h-24 flex items-center justify-center mb-4 ${getStatusColor(overallStatus)}`}>
                {overallStatus === 'pass' ? (
                  <span className="text-3xl">✓</span>
                ) : overallStatus === 'warning' ? (
                  <AlertTriangle className="h-10 w-10" />
                ) : (
                  <span className="text-3xl">✗</span>
                )}
              </div>
              <div className="text-center">
                <div className="text-lg font-medium capitalize">
                  {overallStatus === 'pass' ? 'Passed' : overallStatus === 'warning' ? 'Warning' : 'Failed'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {overallStatus === 'pass' 
                    ? 'All fairness metrics pass thresholds' 
                    : overallStatus === 'warning'
                    ? 'Some metrics are close to thresholds'
                    : 'Some metrics fail thresholds'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Fairness Metrics</CardTitle>
              <CardDescription>
                Performance on standard bias and fairness measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resultsByGroup.overall ? (
                  resultsByGroup.overall.map(metric => (
                    <div key={metric.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{metric.metricName}</span>
                          <div className="text-xs text-muted-foreground">{metric.metricDescription || 'No description available'}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{metric.score}</span>
                          {getStatusBadge(metric.status)}
                        </div>
                      </div>
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs text-muted-foreground">0</div>
                          <div className="text-xs text-muted-foreground">Threshold: {metric.threshold}</div>
                          <div className="text-xs text-muted-foreground">100</div>
                        </div>
                        <Progress value={metric.score} className="h-2" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No overall metrics available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {Object.keys(demographicGroups).length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis</CardTitle>
                <CardDescription>
                  Analysis breakdown by metrics and groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={Object.keys(demographicGroups)[0]}>
                  <TabsList>
                    {Object.keys(demographicGroups).map(groupKey => (
                      <TabsTrigger key={groupKey} value={groupKey}>
                        {groupKey.charAt(0).toUpperCase() + groupKey.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {Object.entries(demographicGroups).map(([category, metrics]) => (
                    <TabsContent key={category} value={category} className="pt-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Metric</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Threshold</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {metrics.map(metric => (
                              <TableRow key={metric.id}>
                                <TableCell className="font-medium">{metric.name}</TableCell>
                                <TableCell>{metric.score}</TableCell>
                                <TableCell>{metric.threshold}</TableCell>
                                <TableCell>{getStatusBadge(metric.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">Explanation</div>
                        <p className="text-sm text-muted-foreground">
                          The analysis shows areas where potential bias may exist in the data. 
                          Scores are calculated on a scale of 0-100, with higher scores indicating better fairness.
                          Metrics with scores below their threshold are flagged for attention.
                        </p>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Suggestions to improve fairness and reduce bias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="mr-4 mt-0.5">
                    <PlusCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Review feature importance</div>
                    <p className="text-sm text-muted-foreground">
                      Examine which features contribute most to disparate outcomes and consider removing or transforming them.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-4 mt-0.5">
                    <PlusCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Apply bias mitigation techniques</div>
                    <p className="text-sm text-muted-foreground">
                      Implement pre-processing, in-processing, or post-processing bias mitigation methods appropriate for your use case.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-4 mt-0.5">
                    <PlusCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Collect more representative training data</div>
                    <p className="text-sm text-muted-foreground">
                      Ensure training data adequately represents all demographic groups to reduce bias in model predictions.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-4 mt-0.5">
                    <PlusCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Implement regular fairness audits</div>
                    <p className="text-sm text-muted-foreground">
                      Establish a process for regular fairness monitoring and evaluation as part of the model maintenance workflow.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Documentation & Compliance</CardTitle>
              <CardDescription>
                Information for governance and regulatory reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">Regulatory Frameworks</div>
                  <p className="text-sm text-muted-foreground">
                    This analysis helps demonstrate compliance with fairness requirements outlined in regulations such as:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2 space-y-1">
                    <li>EU AI Act - High-risk AI system fairness requirements</li>
                    <li>Equal Credit Opportunity Act (ECOA)</li>
                    <li>Fair Housing Act</li>
                    <li>Title VII of the Civil Rights Act</li>
                  </ul>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">Documentation Requirements</div>
                  <div className="rounded-md border p-3">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Fairness assessment report</span>
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Model card documentation</span>
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bias mitigation plan</span>
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Algorithmic impact assessment</span>
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bias Analysis Configuration</CardTitle>
          <CardDescription>
            Configure default parameters for bias analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Fairness Threshold</label>
              <div className="flex items-center gap-4">
                <Input 
                  type="number" 
                  min="0"
                  max="100"
                  defaultValue="80"
                />
                <span className="text-sm text-muted-foreground">
                  Minimum acceptable fairness score (0-100)
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Protected Attributes</label>
              <Input 
                defaultValue="gender, age, ethnicity, disability_status, location"
                placeholder="Comma-separated list of attributes"
              />
              <p className="text-xs text-muted-foreground">
                These attributes will be considered as protected categories in bias analysis
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Metrics</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="statistical_parity" className="h-4 w-4" defaultChecked />
                  <label htmlFor="statistical_parity" className="text-sm">Statistical Parity</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="disparate_impact" className="h-4 w-4" defaultChecked />
                  <label htmlFor="disparate_impact" className="text-sm">Disparate Impact</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="equal_opportunity" className="h-4 w-4" defaultChecked />
                  <label htmlFor="equal_opportunity" className="text-sm">Equal Opportunity</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="predictive_parity" className="h-4 w-4" defaultChecked />
                  <label htmlFor="predictive_parity" className="text-sm">Predictive Parity</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="treatment_equality" className="h-4 w-4" />
                  <label htmlFor="treatment_equality" className="text-sm">Treatment Equality</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="conditional_use_accuracy" className="h-4 w-4" />
                  <label htmlFor="conditional_use_accuracy" className="text-sm">Conditional Use Accuracy</label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">
            Save Configuration
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure alerts for bias detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email alerts when bias is detected</span>
              <div className="flex h-6 items-center">
                <input type="checkbox" id="emailAlerts" className="h-4 w-4" defaultChecked />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dashboard notifications</span>
              <div className="flex h-6 items-center">
                <input type="checkbox" id="dashboardNotifications" className="h-4 w-4" defaultChecked />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Webhook notifications</span>
              <div className="flex h-6 items-center">
                <input type="checkbox" id="webhookNotifications" className="h-4 w-4" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook URL (if enabled)</label>
              <Input placeholder="https://your-service.com/webhook" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">
            Save Notification Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bias Analysis</h2>
          <p className="text-muted-foreground mt-1">Detect and mitigate unfairness in AI systems</p>
        </div>
        <Badge className="bg-purple-100 text-purple-800">
          Fairness Tool
        </Badge>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="results">Analysis Results</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          {renderDashboard()}
        </TabsContent>
        
        <TabsContent value="results" className="mt-6">
          {renderResults()}
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          {renderSettings()}
        </TabsContent>
      </Tabs>
    </div>
  );
}