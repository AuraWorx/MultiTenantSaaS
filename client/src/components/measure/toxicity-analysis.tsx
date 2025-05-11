import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  BarChart4, 
  MessageSquare, 
  PlusCircle, 
  Settings, 
  RefreshCw,
  Download,
  Filter,
  FileText
} from 'lucide-react';

interface ToxicityScore {
  category: string;
  score: number;
  threshold: number;
  status: 'safe' | 'warning' | 'toxic';
}

interface ToxicityResult {
  id: string;
  content: string;
  summary: string;
  source: string;
  date: string;
  overallStatus: 'safe' | 'warning' | 'toxic';
  scores: ToxicityScore[];
}

const mockToxicityResults: ToxicityResult[] = [
  {
    id: 'result-001',
    content: "I completely disagree with your opinion on this matter.",
    summary: "Polite disagreement, no toxicity detected",
    source: "Customer Support Chatbot",
    date: "2025-05-01T14:30:00Z",
    overallStatus: 'safe',
    scores: [
      { category: 'Toxicity', score: 0.05, threshold: 0.5, status: 'safe' },
      { category: 'Identity Attack', score: 0.01, threshold: 0.5, status: 'safe' },
      { category: 'Insult', score: 0.03, threshold: 0.5, status: 'safe' },
      { category: 'Profanity', score: 0.02, threshold: 0.5, status: 'safe' },
      { category: 'Threat', score: 0.01, threshold: 0.5, status: 'safe' }
    ]
  },
  {
    id: 'result-002',
    content: "This product is absolutely terrible. I want my money back immediately!",
    summary: "Negative but not toxic customer feedback",
    source: "Customer Feedback Analysis",
    date: "2025-05-02T10:15:00Z",
    overallStatus: 'warning',
    scores: [
      { category: 'Toxicity', score: 0.45, threshold: 0.5, status: 'warning' },
      { category: 'Identity Attack', score: 0.02, threshold: 0.5, status: 'safe' },
      { category: 'Insult', score: 0.48, threshold: 0.5, status: 'warning' },
      { category: 'Profanity', score: 0.15, threshold: 0.5, status: 'safe' },
      { category: 'Threat', score: 0.05, threshold: 0.5, status: 'safe' }
    ]
  },
  {
    id: 'result-003',
    content: "[Content blocked for toxicity violations]",
    summary: "Hate speech and profanity detected",
    source: "Social Media Monitoring",
    date: "2025-04-28T16:45:00Z",
    overallStatus: 'toxic',
    scores: [
      { category: 'Toxicity', score: 0.92, threshold: 0.5, status: 'toxic' },
      { category: 'Identity Attack', score: 0.87, threshold: 0.5, status: 'toxic' },
      { category: 'Insult', score: 0.95, threshold: 0.5, status: 'toxic' },
      { category: 'Profanity', score: 0.76, threshold: 0.5, status: 'toxic' },
      { category: 'Threat', score: 0.43, threshold: 0.5, status: 'warning' }
    ]
  }
];

export function ToxicityAnalysis() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analysisInput, setAnalysisInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ToxicityResult | null>(null);
  
  const handleAnalyze = () => {
    if (!analysisInput.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
      setSelectedResult(mockToxicityResults[0]);
      setActiveTab('results');
    }, 1500);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'toxic':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusBadge = (status: string) => {
    return (
      <Badge className={getStatusColor(status)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'toxic':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-4xl font-bold text-green-600">82%</CardTitle>
            <CardDescription>Content classified as safe</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={82} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">3% increase from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-4xl font-bold text-yellow-600">13%</CardTitle>
            <CardDescription>Content with warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={13} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">1% decrease from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-4xl font-bold text-red-600">5%</CardTitle>
            <CardDescription>Toxic content blocked</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={5} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">2% decrease from last month</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Toxicity Analyses</CardTitle>
                <CardDescription>
                  Content that has been analyzed for toxicity
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Content Summary</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockToxicityResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.overallStatus)}
                          <span>{getStatusBadge(result.overallStatus)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{result.summary}</TableCell>
                      <TableCell>{result.source}</TableCell>
                      <TableCell>{new Date(result.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedResult(result);
                            setActiveTab('results');
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All Analyses</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>New Content Analysis</CardTitle>
            <CardDescription>
              Analyze text content for potential toxicity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter Content to Analyze</label>
                <Textarea 
                  placeholder="Enter text content to analyze for toxicity..."
                  value={analysisInput}
                  onChange={(e) => setAnalysisInput(e.target.value)}
                  rows={5}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Type</label>
                <Select defaultValue="userContent">
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="userContent">User-Generated Content</SelectItem>
                    <SelectItem value="aiGenerated">AI-Generated Content</SelectItem>
                    <SelectItem value="marketing">Marketing Material</SelectItem>
                    <SelectItem value="support">Support Response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Analysis Level</label>
                <Select defaultValue="standard">
                  <SelectTrigger>
                    <SelectValue placeholder="Select analysis depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (Fast)</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deep">Deep Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleAnalyze}
              disabled={!analysisInput.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart4 className="mr-2 h-4 w-4" />
                  Analyze Content
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Toxicity Triggers</CardTitle>
            <CardDescription>
              Most common causes of toxicity flags
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Hate speech</div>
                <div className="text-xs text-muted-foreground">
                  42% of toxic content
                </div>
                <Progress value={42} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">Insults and name-calling</div>
                <div className="text-xs text-muted-foreground">
                  28% of toxic content
                </div>
                <Progress value={28} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">Profanity</div>
                <div className="text-xs text-muted-foreground">
                  15% of toxic content
                </div>
                <Progress value={15} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">Threats</div>
                <div className="text-xs text-muted-foreground">
                  10% of toxic content
                </div>
                <Progress value={10} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">Other toxicity</div>
                <div className="text-xs text-muted-foreground">
                  5% of toxic content
                </div>
                <Progress value={5} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  const renderResults = () => {
    if (!selectedResult) {
      return (
        <div className="py-16 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium">No analysis selected</h3>
          <p className="text-sm text-muted-foreground mt-2">Please select an analysis to view or analyze new content</p>
          <div className="mt-6">
            <Button onClick={() => setActiveTab('dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Toxicity Analysis Results</h2>
            <p className="text-sm text-muted-foreground">
              Analysis performed on {new Date(selectedResult.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export
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
              <div className={`rounded-full w-24 h-24 flex items-center justify-center mb-4 ${getStatusColor(selectedResult.overallStatus)}`}>
                {getStatusIcon(selectedResult.overallStatus)}
              </div>
              <div className="text-center">
                <div className="text-lg font-medium capitalize">
                  {selectedResult.overallStatus}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedResult.overallStatus === 'safe' 
                    ? 'No toxicity detected' 
                    : selectedResult.overallStatus === 'warning'
                    ? 'Potential issues detected'
                    : 'Toxic content detected'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Analyzed Content</CardTitle>
              <CardDescription>
                {selectedResult.source}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-md bg-gray-50">
                <p className="whitespace-pre-wrap">{selectedResult.content}</p>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Summary</h4>
                <p className="text-sm">{selectedResult.summary}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Toxicity Categories</CardTitle>
            <CardDescription>
              Breakdown of toxicity scores by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedResult.scores.map((score, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{score.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{(score.score * 100).toFixed(0)}%</span>
                      {getStatusBadge(score.status)}
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          score.status === 'safe' 
                            ? 'bg-green-500' 
                            : score.status === 'warning' 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${score.score * 100}%` }}
                      />
                      <div 
                        className="absolute h-4 border-l border-gray-800" 
                        style={{ left: `${score.threshold * 100}%`, top: '-4px' }}
                      />
                    </div>
                    <div 
                      className="absolute text-[10px] text-gray-600"
                      style={{ left: `${score.threshold * 100}%`, transform: 'translateX(-50%)' }}
                    >
                      Threshold: {(score.threshold * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Suggested actions based on toxicity analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedResult.overallStatus === 'safe' ? (
              <div className="p-4 border rounded-md bg-green-50">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-md font-medium text-green-800">Content is safe to use</h3>
                    <p className="text-sm text-green-600 mt-1">
                      No toxic content was detected. This content meets our community guidelines and is suitable for use.
                    </p>
                  </div>
                </div>
              </div>
            ) : selectedResult.overallStatus === 'warning' ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-yellow-50">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-md font-medium text-yellow-800">Review recommended</h3>
                      <p className="text-sm text-yellow-600 mt-1">
                        Some potential issues were detected. Consider human review before publishing.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="text-md font-medium">Suggested Edits</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Consider rephrasing negative statements to be more constructive and avoid strong negative language.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-red-50">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-md font-medium text-red-800">Content blocked</h3>
                      <p className="text-sm text-red-600 mt-1">
                        This content violates community guidelines and has been flagged as toxic.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="text-md font-medium">Required Actions</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">•</span>
                      Block this content from being published
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">•</span>
                      Review user account for pattern of violations
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">•</span>
                      Document incident for compliance purposes
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <MessageSquare className="mr-2 h-4 w-4" />
              Request Human Review
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Toxicity Analysis Settings</CardTitle>
          <CardDescription>
            Configure toxicity detection thresholds and policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Category Thresholds</h3>
              <p className="text-sm text-muted-foreground">
                Customize when content should be flagged for each category
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">General Toxicity</label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Threshold:</span>
                      <Input 
                        type="number" 
                        className="w-20 h-8" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        defaultValue="0.50" 
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Detects rude, disrespectful, or unreasonable comments likely to make people leave a discussion.
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Identity Attack</label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Threshold:</span>
                      <Input 
                        type="number" 
                        className="w-20 h-8" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        defaultValue="0.50" 
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Detects negative or hateful comments targeting someone because of their identity.
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Insult</label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Threshold:</span>
                      <Input 
                        type="number" 
                        className="w-20 h-8" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        defaultValue="0.50" 
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Detects insulting, inflammatory, or negative comments towards a person or a group.
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Profanity</label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Threshold:</span>
                      <Input 
                        type="number" 
                        className="w-20 h-8" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        defaultValue="0.50" 
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Detects swear words, curse words, or other obscene or profane language.
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Threat</label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Threshold:</span>
                      <Input 
                        type="number" 
                        className="w-20 h-8" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        defaultValue="0.50" 
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Detects statements that intend to inflict harm, injury, or violence against an individual or group.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Overall Content Policy</h3>
              <p className="text-sm text-muted-foreground">
                Configure how content is handled based on toxicity scores
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <div className="font-medium">Auto-block threshold</div>
                    <div className="text-sm text-muted-foreground">When content is automatically blocked</div>
                  </div>
                  <Input 
                    type="number" 
                    className="w-20 h-8" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    defaultValue="0.80" 
                  />
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <div className="font-medium">Warning threshold</div>
                    <div className="text-sm text-muted-foreground">When content gets warning labels</div>
                  </div>
                  <Input 
                    type="number" 
                    className="w-20 h-8" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    defaultValue="0.40" 
                  />
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <div className="font-medium">Human review</div>
                    <div className="text-sm text-muted-foreground">When to trigger human review</div>
                  </div>
                  <Select defaultValue="warning">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All content</SelectItem>
                      <SelectItem value="warning">Warning content</SelectItem>
                      <SelectItem value="toxic">Toxic content only</SelectItem>
                      <SelectItem value="none">Disabled</SelectItem>
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
          <h2 className="text-2xl font-bold">Toxicity Analysis</h2>
          <p className="text-muted-foreground mt-1">Detect and manage harmful content in AI systems</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure AI Model
        </Button>
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