import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertTriangle, 
  BarChart4, 
  ChevronDown, 
  ExternalLink, 
  FileText, 
  Filter, 
  Loader2, 
  PlusCircle, 
  Upload
} from 'lucide-react';

interface BiasMetric {
  id: string;
  name: string;
  description: string;
  score: number;
  threshold: number;
  status: 'pass' | 'warning' | 'fail';
}

interface DemographicGroup {
  id: string;
  name: string;
  performance: number;
  delta: number;
}

interface BiasReport {
  id: string;
  aiSystem: string;
  modelType: string;
  date: string;
  status: 'pass' | 'warning' | 'fail';
  metrics: BiasMetric[];
  demographicGroups: Record<string, DemographicGroup[]>;
}

// Mock data for bias metrics
const mockBiasReport: BiasReport = {
  id: 'report-001',
  aiSystem: 'HR Candidate Screening',
  modelType: 'Classification',
  date: '2025-04-15T14:30:00Z',
  status: 'warning',
  metrics: [
    {
      id: 'metric-001',
      name: 'Statistical Parity',
      description: 'Measures if the model predicts positive outcomes at equal rates across protected groups',
      score: 0.82,
      threshold: 0.80,
      status: 'pass'
    },
    {
      id: 'metric-002',
      name: 'Equal Opportunity',
      description: 'Measures if the model has equal true positive rates across protected groups',
      score: 0.76,
      threshold: 0.80,
      status: 'warning'
    },
    {
      id: 'metric-003',
      name: 'Predictive Parity',
      description: 'Measures if the model has equal precision across protected groups',
      score: 0.91,
      threshold: 0.80,
      status: 'pass'
    },
    {
      id: 'metric-004',
      name: 'Disparate Impact',
      description: 'Measures the ratio of positive prediction rates between protected groups',
      score: 0.72,
      threshold: 0.80,
      status: 'fail'
    },
    {
      id: 'metric-005',
      name: 'Counterfactual Fairness',
      description: 'Measures if the model gives the same predictions for counterfactual examples',
      score: 0.88,
      threshold: 0.80,
      status: 'pass'
    }
  ],
  demographicGroups: {
    'gender': [
      {
        id: 'group-001',
        name: 'Male',
        performance: 0.84,
        delta: 0.06
      },
      {
        id: 'group-002',
        name: 'Female',
        performance: 0.78,
        delta: 0
      },
      {
        id: 'group-003',
        name: 'Non-binary',
        performance: 0.76,
        delta: -0.02
      }
    ],
    'age': [
      {
        id: 'group-004',
        name: '18-25',
        performance: 0.75,
        delta: -0.07
      },
      {
        id: 'group-005',
        name: '26-40',
        performance: 0.82,
        delta: 0
      },
      {
        id: 'group-006',
        name: '41-60',
        performance: 0.79,
        delta: -0.03
      },
      {
        id: 'group-007',
        name: '60+',
        performance: 0.71,
        delta: -0.11
      }
    ],
    'ethnicity': [
      {
        id: 'group-008',
        name: 'Asian',
        performance: 0.83,
        delta: 0.01
      },
      {
        id: 'group-009',
        name: 'Black',
        performance: 0.77,
        delta: -0.05
      },
      {
        id: 'group-010',
        name: 'Hispanic',
        performance: 0.79,
        delta: -0.03
      },
      {
        id: 'group-011',
        name: 'White',
        performance: 0.82,
        delta: 0
      },
      {
        id: 'group-012',
        name: 'Other',
        performance: 0.80,
        delta: -0.02
      }
    ]
  }
};

const mockSystems = [
  { id: 'sys-001', name: 'HR Candidate Screening' },
  { id: 'sys-002', name: 'Loan Approval System' },
  { id: 'sys-003', name: 'Content Recommendation Engine' },
  { id: 'sys-004', name: 'Criminal Risk Assessment' }
];

export function BiasAnalysis() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [testDataUrl, setTestDataUrl] = useState('');
  
  const handleStartAnalysis = () => {
    if (!selectedSystem) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
      // Navigate to results tab after analysis
      setActiveTab('results');
    }, 3000);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusBadge = (status: string) => {
    return (
      <Badge className={getStatusColor(status)}>
        {status === 'pass' ? 'Pass' : status === 'warning' ? 'Warning' : 'Fail'}
      </Badge>
    );
  };
  
  const getDeltaDisplay = (delta: number) => {
    if (delta === 0) return <span className="text-gray-500">0%</span>;
    
    const formattedDelta = Math.abs(delta * 100).toFixed(1) + '%';
    
    if (delta > 0) {
      return <span className="text-green-600">+{formattedDelta}</span>;
    } else {
      return <span className="text-red-600">-{formattedDelta}</span>;
    }
  };
  
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-4xl font-bold text-yellow-600">7</CardTitle>
            <CardDescription>AI systems with bias warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={35} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">35% of total systems</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-4xl font-bold text-red-600">3</CardTitle>
            <CardDescription>AI systems with bias failures</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={15} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">15% of total systems</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-4xl font-bold text-blue-600">84%</CardTitle>
            <CardDescription>Overall fairness score</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={84} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">5% improvement since last quarter</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Bias Analysis Results</CardTitle>
                <CardDescription>
                  Latest fairness and bias assessments across AI systems
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>AI System</TableHead>
                    <TableHead>Model Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Failed Metrics</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">HR Candidate Screening</TableCell>
                    <TableCell>Classification</TableCell>
                    <TableCell>{new Date('2025-04-15').toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge('warning')}</TableCell>
                    <TableCell>Disparate Impact</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('results')}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Loan Approval System</TableCell>
                    <TableCell>Classification</TableCell>
                    <TableCell>{new Date('2025-04-10').toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge('fail')}</TableCell>
                    <TableCell>Statistical Parity, Equal Opportunity</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Content Recommendation</TableCell>
                    <TableCell>Ranking</TableCell>
                    <TableCell>{new Date('2025-04-05').toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge('pass')}</TableCell>
                    <TableCell>None</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Criminal Risk Assessment</TableCell>
                    <TableCell>Regression</TableCell>
                    <TableCell>{new Date('2025-04-01').toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge('fail')}</TableCell>
                    <TableCell>Disparate Impact, Equal Opportunity</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Start New Bias Analysis</CardTitle>
            <CardDescription>
              Analyze an AI system for potential fairness issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select AI System</label>
                <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose AI system to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSystems.map(system => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Evaluation Dataset URL (Optional)</label>
                <Input 
                  placeholder="https://your-data-source.com/dataset"
                  value={testDataUrl}
                  onChange={(e) => setTestDataUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Or Upload Test Data</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        CSV, JSON, or PARQUET
                      </p>
                    </div>
                    <input type="file" className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleStartAnalysis}
              disabled={!selectedSystem || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart4 className="mr-2 h-4 w-4" />
                  Start Analysis
                </>
              )}
            </Button>
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
                  4 systems affected
                </div>
                <Progress value={80} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">Age discrimination in loan applications</div>
                <div className="text-xs text-muted-foreground">
                  3 systems affected
                </div>
                <Progress value={60} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">Racial bias in risk assessment</div>
                <div className="text-xs text-muted-foreground">
                  2 systems affected
                </div>
                <Progress value={40} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">Geographic discrimination</div>
                <div className="text-xs text-muted-foreground">
                  1 system affected
                </div>
                <Progress value={20} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  const renderResults = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Bias Analysis Results: {mockBiasReport.aiSystem}</h2>
          <p className="text-sm text-muted-foreground">
            Analysis performed on {new Date(mockBiasReport.date).toLocaleDateString()}
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
            <div className={`rounded-full w-24 h-24 flex items-center justify-center mb-4 ${getStatusColor(mockBiasReport.status)}`}>
              {mockBiasReport.status === 'pass' ? (
                <span className="text-3xl">✓</span>
              ) : mockBiasReport.status === 'warning' ? (
                <AlertTriangle className="h-10 w-10" />
              ) : (
                <span className="text-3xl">✗</span>
              )}
            </div>
            <div className="text-center">
              <div className="text-lg font-medium capitalize">
                {mockBiasReport.status === 'pass' ? 'Passed' : mockBiasReport.status === 'warning' ? 'Warning' : 'Failed'}
              </div>
              <p className="text-sm text-muted-foreground">
                {mockBiasReport.status === 'pass' 
                  ? 'All fairness metrics pass thresholds' 
                  : mockBiasReport.status === 'warning'
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
              {mockBiasReport.metrics.map(metric => (
                <div key={metric.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{metric.name}</span>
                      <div className="text-xs text-muted-foreground">{metric.description}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{metric.score.toFixed(2)}</span>
                      {getStatusBadge(metric.status)}
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          metric.status === 'pass' 
                            ? 'bg-green-500' 
                            : metric.status === 'warning' 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${metric.score * 100}%` }}
                      />
                      <div 
                        className="absolute h-4 border-l border-gray-800" 
                        style={{ left: `${metric.threshold * 100}%`, top: '-4px' }}
                      />
                    </div>
                    <div 
                      className="absolute text-[10px] text-gray-600"
                      style={{ left: `${metric.threshold * 100}%`, transform: 'translateX(-50%)' }}
                    >
                      Threshold: {metric.threshold.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Across Demographic Groups</CardTitle>
          <CardDescription>
            Analysis of model performance disparities between protected groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gender">
            <TabsList>
              <TabsTrigger value="gender">Gender</TabsTrigger>
              <TabsTrigger value="age">Age</TabsTrigger>
              <TabsTrigger value="ethnicity">Ethnicity</TabsTrigger>
            </TabsList>
            
            {Object.entries(mockBiasReport.demographicGroups).map(([category, groups]) => (
              <TabsContent key={category} value={category} className="pt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group</TableHead>
                        <TableHead>Performance Score</TableHead>
                        <TableHead>Difference from Reference</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map(group => {
                        const status = Math.abs(group.delta) > 0.1 
                          ? 'fail' 
                          : Math.abs(group.delta) > 0.05 
                          ? 'warning' 
                          : 'pass';
                        
                        return (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell>{group.performance.toFixed(2)}</TableCell>
                            <TableCell>{getDeltaDisplay(group.delta)}</TableCell>
                            <TableCell>{getStatusBadge(status)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Performance Distribution</h4>
                  <div className="h-12 bg-gray-100 rounded-md relative">
                    {groups.map((group, index) => {
                      const leftPosition = `${group.performance * 100 - 5}%`;
                      return (
                        <div 
                          key={group.id}
                          className="absolute top-0 w-[10px] h-12 rounded-full"
                          style={{ 
                            left: leftPosition, 
                            backgroundColor: group.delta === 0 
                              ? '#6b7280' 
                              : Math.abs(group.delta) > 0.1 
                              ? '#ef4444' 
                              : Math.abs(group.delta) > 0.05 
                              ? '#f59e0b' 
                              : '#22c55e'
                          }}
                        >
                          <div className="absolute top-[-20px] left-[-8px] text-xs whitespace-nowrap">
                            {group.name}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* X-axis labels */}
                    <div className="absolute bottom-[-20px] left-0 text-xs">0.0</div>
                    <div className="absolute bottom-[-20px] left-[50%] transform translate-x-[-50%] text-xs">0.5</div>
                    <div className="absolute bottom-[-20px] right-0 text-xs">1.0</div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Mitigation Recommendations</CardTitle>
          <CardDescription>
            Suggested actions to address identified bias issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-md">
              <h3 className="text-md font-medium">Rebalance Training Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Improve representation of underrepresented groups in your training dataset to reduce performance disparities.
              </p>
              <div className="flex justify-end mt-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Learn More
                </Button>
              </div>
            </div>
            
            <div className="p-4 border rounded-md">
              <h3 className="text-md font-medium">Apply Algorithmic Fairness Techniques</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Consider implementing pre-processing, in-processing, or post-processing fairness techniques to address the Disparate Impact issue.
              </p>
              <div className="flex justify-end mt-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Learn More
                </Button>
              </div>
            </div>
            
            <div className="p-4 border rounded-md">
              <h3 className="text-md font-medium">Review Feature Selection</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Examine the importance of potentially problematic features and consider removing or modifying features that contribute to bias.
              </p>
              <div className="flex justify-end mt-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Apply Mitigations</Button>
        </CardFooter>
      </Card>
    </div>
  );
  
  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bias Analysis Settings</CardTitle>
          <CardDescription>
            Configure bias detection parameters and thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Protected Attributes</h3>
              <p className="text-sm text-muted-foreground">
                Define which demographic attributes to analyze for bias
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <div className="font-medium">Gender</div>
                    <div className="text-sm text-muted-foreground">Male, Female, Non-binary</div>
                  </div>
                  <Button variant="outline" size="sm">Edit Groups</Button>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <div className="font-medium">Age</div>
                    <div className="text-sm text-muted-foreground">18-25, 26-40, 41-60, 60+</div>
                  </div>
                  <Button variant="outline" size="sm">Edit Groups</Button>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <div className="font-medium">Race/Ethnicity</div>
                    <div className="text-sm text-muted-foreground">Asian, Black, Hispanic, White, Other</div>
                  </div>
                  <Button variant="outline" size="sm">Edit Groups</Button>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">Add New Protected Attribute</div>
                  </div>
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Fairness Metrics</h3>
              <p className="text-sm text-muted-foreground">
                Select metrics to include in analysis and set thresholds
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Statistical Parity</label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Threshold:</span>
                      <Input 
                        type="number" 
                        className="w-20 h-8" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        defaultValue="0.80" 
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Measures if the model predicts positive outcomes at equal rates across protected groups
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Equal Opportunity</label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Threshold:</span>
                      <Input 
                        type="number" 
                        className="w-20 h-8" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        defaultValue="0.80" 
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Measures if the model has equal true positive rates across protected groups
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Disparate Impact</label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Threshold:</span>
                      <Input 
                        type="number" 
                        className="w-20 h-8" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        defaultValue="0.80" 
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Measures the ratio of positive prediction rates between protected groups
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">Add Custom Metric</div>
                  </div>
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add
                  </Button>
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