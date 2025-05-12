import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Loader2, 
  Search, 
  AlertCircle, 
  Github, 
  Play, 
  Plus, 
  BarChart3,
  GitBranch,
  FileCode,
  ShieldAlert,
  Ban
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

// Type definitions
interface GithubScanConfig {
  id: number;
  githubOrgName: string;
  createdAt: string;
  lastScanAt: string | null;
  status: string;
}

interface GithubScanResult {
  id: number;
  scan_config_id: number;
  repository_name: string;
  repository_url: string;
  has_ai_usage: boolean;
  ai_libraries: string[];
  ai_frameworks: string[];
  scan_date: string;
  added_to_risk: boolean;
  confidence_score?: number; // Confidence score for AI detection (0.0-1.0)
  detection_type?: string;   // Type of detection (e.g., "Dependency", "Model File")
}

interface GithubScanSummary {
  id: number;
  scan_config_id: number;
  total_repositories: number;
  repositories_with_ai: number;
  scan_date: string;
}

export function AIUsageFinder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for scan configuration
  const [githubOrgName, setGithubOrgName] = useState('');
  const [githubApiKey, setGithubApiKey] = useState('');
  const [scanType, setScanType] = useState('full');
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  
  // Queries for GitHub scan data
  const { 
    data: scanConfigs = [],
    isLoading: configsLoading
  } = useQuery<GithubScanConfig[]>({
    queryKey: ['/api/github-scan/configs'],
    refetchInterval: 5000 // Refresh every 5 seconds to get updated status
  });
  
  const {
    data: scanResults = [],
    isLoading: resultsLoading
  } = useQuery<GithubScanResult[]>({
    queryKey: ['/api/github-scan/results', selectedConfigId],
    queryFn: async () => {
      const url = selectedConfigId 
        ? `/api/github-scan/results?configId=${selectedConfigId}`
        : '/api/github-scan/results';
      const res = await apiRequest('GET', url);
      return await res.json();
    },
    enabled: !!user
  });
  
  const {
    data: scanSummaries = [],
    isLoading: summariesLoading
  } = useQuery<GithubScanSummary[]>({
    queryKey: ['/api/github-scan/summaries'],
    enabled: !!user
  });
  
  // Update selected config when configs are loaded
  useEffect(() => {
    if (scanConfigs.length > 0 && !selectedConfigId) {
      setSelectedConfigId(scanConfigs[0].id);
    }
  }, [scanConfigs, selectedConfigId]);
  
  // Mutations
  const createConfigMutation = useMutation({
    mutationFn: async (data: { github_org_name: string; api_key: string }) => {
      const res = await apiRequest('POST', '/api/github-scan/config', data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Configuration created",
        description: `GitHub organization ${data.github_org_name} added successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/github-scan/configs'] });
      setSelectedConfigId(data.id);
      setGithubOrgName('');
      setGithubApiKey('');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create configuration",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const startScanMutation = useMutation({
    mutationFn: async (configId: number) => {
      const res = await apiRequest('POST', '/api/github-scan/start', { configId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Scan started",
        description: "GitHub repository scan has been initiated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/github-scan/configs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start scan",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const addToRiskMutation = useMutation({
    mutationFn: async (resultId: number) => {
      const res = await apiRequest('POST', '/api/github-scan/add-to-risk', { resultId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to risk register",
        description: "Repository has been added to the risk register",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/github-scan/results'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to risk register",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handlers
  const handleCreateConfig = () => {
    if (!githubOrgName.trim()) {
      toast({
        title: "Organization name required",
        description: "Please enter a GitHub organization name",
        variant: "destructive",
      });
      return;
    }
    
    if (!githubApiKey.trim()) {
      toast({
        title: "API key required",
        description: "Please enter a GitHub API key",
        variant: "destructive",
      });
      return;
    }
    
    createConfigMutation.mutate({
      github_org_name: githubOrgName,
      api_key: githubApiKey
    });
  };
  
  const handleStartScan = (configId: number) => {
    startScanMutation.mutate(configId);
  };
  
  const handleAddToRisk = (resultId: number) => {
    addToRiskMutation.mutate(resultId);
  };
  
  // Prepare chart data
  const getChartData = () => {
    if (scanSummaries.length === 0) {
      return [
        { name: 'No Repositories', value: 1, color: '#CBD5E1' }
      ];
    }
    
    // Get the most recent summary for the selected config
    const filteredSummaries = selectedConfigId 
      ? scanSummaries.filter(s => s.scan_config_id === selectedConfigId)
      : scanSummaries;
    
    if (filteredSummaries.length === 0) {
      return [
        { name: 'No Data', value: 1, color: '#CBD5E1' }
      ];
    }
    
    const latestSummary = filteredSummaries.sort((a, b) => 
      new Date(b.scan_date).getTime() - new Date(a.scan_date).getTime()
    )[0];
    
    return [
      { name: 'AI Repositories', value: latestSummary.repositories_with_ai, color: '#F43F5E' },
      { name: 'Non-AI Repositories', value: latestSummary.total_repositories - latestSummary.repositories_with_ai, color: '#0EA5E9' }
    ];
  };
  
  const chartData = getChartData();
  
  return (
    <div className="space-y-6 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>AI Usage Finder</CardTitle>
          <CardDescription>
            Scan your GitHub organization repositories to detect AI usage
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="scan" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="scan">Configure Scan</TabsTrigger>
          <TabsTrigger value="results">Scan Results</TabsTrigger>
          <TabsTrigger value="stats">Repository Stats</TabsTrigger>
        </TabsList>
        
        {/* Section 1: Configure New Target to Scan */}
        <TabsContent value="scan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configure GitHub Organization Scan</CardTitle>
              <CardDescription>
                Add a GitHub organization to scan for AI usage in repositories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-org">GitHub Organization/User</Label>
                <Input
                  id="github-org"
                  placeholder="e.g., microsoft"
                  value={githubOrgName}
                  onChange={(e) => setGithubOrgName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="github-api-key">GitHub API Key</Label>
                <Input
                  id="github-api-key"
                  type="password"
                  placeholder="Enter your GitHub personal access token"
                  value={githubApiKey}
                  onChange={(e) => setGithubApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The API key requires 'repo' and 'read:org' permissions.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Scan Type</Label>
                <RadioGroup value={scanType} onValueChange={setScanType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full-scan" />
                    <Label htmlFor="full-scan">Full Scan (All Repositories)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button 
                onClick={handleCreateConfig} 
                disabled={createConfigMutation.isPending || !githubOrgName || !githubApiKey}
                className="w-full"
              >
                {createConfigMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Configuration
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Configurations</CardTitle>
              <CardDescription>
                Start scanning your GitHub organizations for AI usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : scanConfigs.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No configurations found</AlertTitle>
                  <AlertDescription>
                    Add a GitHub organization above to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {scanConfigs.map((config) => (
                    <div key={config.id} className="flex items-center justify-between border p-4 rounded-md">
                      <div className="flex items-center space-x-4">
                        <Github className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{config.githubOrgName}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: {config.status.charAt(0).toUpperCase() + config.status.slice(1)}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartScan(config.id)}
                        disabled={config.status === 'scanning' || startScanMutation.isPending}
                      >
                        {config.status === 'scanning' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        {config.status === 'scanning' ? 'Scanning...' : 'Start Scan'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Section 2: Past Results Display */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Repository Scan Results</CardTitle>
              <CardDescription>
                View AI usage detected in your GitHub repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : scanResults.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No scan results yet</AlertTitle>
                  <AlertDescription>
                    Run a scan to see results here.
                  </AlertDescription>
                </Alert>
              ) : (
                <div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Repository</TableHead>
                          <TableHead>AI Usage</TableHead>
                          <TableHead>Libraries Detected</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Scan Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scanResults.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{result.repository_name}</span>
                                <a 
                                  href={result.repository_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline flex items-center mt-1"
                                >
                                  <GitBranch className="h-3 w-3 mr-1" />
                                  View on GitHub
                                </a>
                              </div>
                            </TableCell>
                            <TableCell>
                              {result.has_ai_usage ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <FileCode className="h-3 w-3 mr-1" />
                                  AI Detected
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Ban className="h-3 w-3 mr-1" />
                                  No AI
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                {result.ai_libraries && result.ai_libraries.length > 0 
                                  ? (
                                    <div className="space-y-1">
                                      {result.ai_libraries.map((lib, idx) => (
                                        <span key={idx} className="inline-flex items-center mr-1 px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                          {lib}
                                        </span>
                                      ))}
                                    </div>
                                  )
                                  : 'None detected'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(result.scan_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {result.has_ai_usage && !result.added_to_risk && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddToRisk(result.id)}
                                  disabled={addToRiskMutation.isPending}
                                >
                                  <ShieldAlert className="h-4 w-4 mr-1" />
                                  Add Risk
                                </Button>
                              )}
                              {result.added_to_risk && (
                                <span className="text-xs text-muted-foreground">
                                  Added to risk register
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Section 3: Repository Visualization */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Usage Statistics</CardTitle>
              <CardDescription>
                Visualization of AI usage across repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summariesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : scanSummaries.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No statistics available</AlertTitle>
                  <AlertDescription>
                    Run a scan to see statistics here.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  <div className="w-full md:w-1/2 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => value} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="w-full md:w-1/2">
                    <div className="space-y-4">
                      {scanSummaries.slice(0, 3).map((summary) => {
                        const config = scanConfigs.find(c => c.id === summary.scan_config_id);
                        return (
                          <div key={summary.id} className="border rounded-md p-4">
                            <div className="mb-2">
                              <span className="font-medium">{config?.githubOrgName || 'Unknown Organization'}</span>
                              <span className="text-sm text-muted-foreground block">
                                Scanned on {new Date(summary.scan_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <BarChart3 className="inline-block h-4 w-4 mr-1" />
                                <span>Total Repositories: {summary.total_repositories}</span>
                              </div>
                              <div>
                                <FileCode className="inline-block h-4 w-4 mr-1" />
                                <span>With AI: {summary.repositories_with_ai}</span>
                              </div>
                              <div>
                                <span className="font-medium">
                                  {Math.round((summary.repositories_with_ai / summary.total_repositories) * 100) || 0}% AI Usage
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}