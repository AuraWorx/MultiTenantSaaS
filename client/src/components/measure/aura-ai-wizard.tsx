import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  Sparkles, 
  ArrowRight, 
  Clipboard, 
  ClipboardCheck, 
  Download, 
  FileText, 
  Shield, 
  Brain,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export function AuraAIWizard() {
  const [activeTab, setActiveTab] = useState('setup');
  const [systemType, setSystemType] = useState('');
  const [modelType, setModelType] = useState('');
  const [dataTypes, setDataTypes] = useState('');
  const [useCase, setUseCase] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [clipboardText, setClipboardText] = useState('Copy');
  
  const handleStartAnalysis = () => {
    if (!systemType || !modelType || !useCase) {
      return;
    }
    
    setIsAnalyzing(true);
    
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      setActiveTab('results');
    }, 3000);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPolicy);
    setClipboardText('Copied!');
    setTimeout(() => setClipboardText('Copy'), 2000);
  };
  
  const handleReset = () => {
    setSystemType('');
    setModelType('');
    setDataTypes('');
    setUseCase('');
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setActiveTab('setup');
  };
  
  // Generated policy example
  const generatedPolicy = `# AI Governance Policy for ${systemType || 'AI System'}

## System Overview
- **System Type**: ${systemType || 'Not specified'}
- **Model Type**: ${modelType || 'Not specified'}
- **Data Types**: ${dataTypes || 'Not specified'}
- **Use Case**: ${useCase || 'Not specified'}

## Risk Assessment
- **Privacy Risk**: Medium - Handle user data with care
- **Fairness Risk**: High - Monitor for demographic biases
- **Security Risk**: Low - Implement standard API security measures
- **Transparency Risk**: Medium - Implement model explainability

## Required Controls
1. Implement data minimization and retention policies
2. Conduct quarterly bias audits with diverse test data
3. Document model limitations and confidence thresholds
4. Establish human review process for edge cases
5. Maintain audit logs of system decisions

## Compliance Requirements
- GDPR Article 22 - Automated decision-making safeguards
- AI Act (EU) - Potential high-risk classification
- NIST AI Risk Management Framework
- Industry-specific regulations as applicable

## Monitoring and Reporting
- Implement weekly data drift monitoring
- Conduct quarterly bias assessments
- Annual third-party validation
- Report incidents within 72 hours

## Responsible AI Team
- Data governance lead
- AI ethics committee oversight
- Technical implementation team
- Legal and compliance review
`;

  const renderSetupTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="systemType" className="text-sm font-medium">
              AI System Type
            </label>
            <Select value={systemType} onValueChange={setSystemType}>
              <SelectTrigger id="systemType">
                <SelectValue placeholder="Select AI system type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommendation">Recommendation System</SelectItem>
                <SelectItem value="classification">Classification System</SelectItem>
                <SelectItem value="generation">Generative AI</SelectItem>
                <SelectItem value="forecasting">Forecasting/Prediction</SelectItem>
                <SelectItem value="nlp">Natural Language Processing</SelectItem>
                <SelectItem value="vision">Computer Vision</SelectItem>
                <SelectItem value="optimization">Optimization System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="modelType" className="text-sm font-medium">
              Model Type
            </label>
            <Select value={modelType} onValueChange={setModelType}>
              <SelectTrigger id="modelType">
                <SelectValue placeholder="Select model type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proprietary">Proprietary (In-house)</SelectItem>
                <SelectItem value="openSource">Open Source</SelectItem>
                <SelectItem value="thirdParty">Third-party API</SelectItem>
                <SelectItem value="llm">Large Language Model</SelectItem>
                <SelectItem value="ensemble">Ensemble Model</SelectItem>
                <SelectItem value="classicalML">Classical ML Algorithm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="dataTypes" className="text-sm font-medium">
              Data Types Used (Optional)
            </label>
            <Textarea 
              id="dataTypes"
              placeholder="E.g., customer purchase history, demographics, browsing behavior"
              value={dataTypes}
              onChange={(e) => setDataTypes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="useCase" className="text-sm font-medium">
              Primary Use Case
            </label>
            <Textarea 
              id="useCase"
              placeholder="Describe how this AI system will be used in your organization"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              rows={3}
            />
          </div>
          
          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Governance Impact Assessment</AlertTitle>
            <AlertDescription>
              Based on your inputs, AuraAI will generate governance recommendations tailored to your AI system. The more details you provide, the more specific the guidance will be.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleStartAnalysis}
              disabled={!systemType || !modelType || !useCase || isAnalyzing}
              className="space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Governance Policy</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderResultsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 mb-2">
              <Shield className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Governance Framework</CardTitle>
            <CardDescription>
              Tailored to your AI system type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Policy documentation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Risk assessment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Control measures</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Monitoring recommendations</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 mb-2">
              <Brain className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Risk Analysis</CardTitle>
            <CardDescription>
              Potential risks identified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Privacy concerns</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Fairness and bias</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Security measures</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Transparency issues</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 mb-2">
              <Lightbulb className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Compliance Guidance</CardTitle>
            <CardDescription>
              Regulatory requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100">GDPR</Badge>
                <span className="text-xs">Article 22 requirements</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100">AI Act</Badge>
                <span className="text-xs">Risk classification</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100">NIST AI RMF</Badge>
                <span className="text-xs">Framework alignment</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100">Industry</Badge>
                <span className="text-xs">Sector-specific rules</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Generated Governance Policy</CardTitle>
          <CardDescription>
            A comprehensive governance policy for your AI system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="p-4 rounded-md bg-gray-50 text-sm whitespace-pre-wrap font-mono overflow-auto max-h-96">
              {generatedPolicy}
            </pre>
            <div className="absolute top-2 right-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {clipboardText === 'Copy' ? (
                  <Clipboard className="h-4 w-4 mr-2" />
                ) : (
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                )}
                {clipboardText}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Start Over
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Save to Documentation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AuraAI Governance Wizard</h2>
          <p className="text-muted-foreground mt-1">Generate custom AI governance policies for your systems</p>
        </div>
        <Badge className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
          Powered by AI
        </Badge>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup" disabled={isAnalyzing}>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary mr-2">
                    1
                  </div>
                  Setup
                </div>
              </TabsTrigger>
              <TabsTrigger value="results" disabled={!analysisComplete || isAnalyzing}>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary mr-2">
                    2
                  </div>
                  Results
                </div>
              </TabsTrigger>
              <TabsTrigger value="implementation" disabled={!analysisComplete || isAnalyzing}>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary mr-2">
                    3
                  </div>
                  Implementation
                </div>
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="setup">
                {renderSetupTab()}
              </TabsContent>
              
              <TabsContent value="results">
                {renderResultsTab()}
              </TabsContent>
              
              <TabsContent value="implementation">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Implementation Checklist</CardTitle>
                        <CardDescription>
                          Steps to implement your governance policy
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <div className="h-5 w-5 rounded-full border border-primary mr-2 flex items-center justify-center">
                              <div className="h-3 w-3 rounded-full bg-primary"></div>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">Document your AI system</div>
                              <div className="text-sm text-muted-foreground">Create detailed documentation of system architecture</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="h-5 w-5 rounded-full border border-primary mr-2"></div>
                            <div className="flex-1">
                              <div className="font-medium">Assign governance roles</div>
                              <div className="text-sm text-muted-foreground">Define responsible parties for each governance area</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="h-5 w-5 rounded-full border border-primary mr-2"></div>
                            <div className="flex-1">
                              <div className="font-medium">Implement monitoring tools</div>
                              <div className="text-sm text-muted-foreground">Setup data drift and bias monitoring</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="h-5 w-5 rounded-full border border-primary mr-2"></div>
                            <div className="flex-1">
                              <div className="font-medium">Create response plans</div>
                              <div className="text-sm text-muted-foreground">Establish incident response protocols</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="h-5 w-5 rounded-full border border-primary mr-2"></div>
                            <div className="flex-1">
                              <div className="font-medium">Schedule review cycles</div>
                              <div className="text-sm text-muted-foreground">Establish regular governance review meetings</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Resources & Templates</CardTitle>
                        <CardDescription>
                          Helpful resources for implementation
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="rounded-lg border p-4">
                            <div className="flex items-center">
                              <FileText className="h-8 w-8 text-blue-500 mr-3" />
                              <div>
                                <div className="font-medium">Model Card Template</div>
                                <div className="text-sm text-muted-foreground">Standardized documentation format</div>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <Button variant="outline" size="sm">Download</Button>
                            </div>
                          </div>
                          
                          <div className="rounded-lg border p-4">
                            <div className="flex items-center">
                              <FileText className="h-8 w-8 text-green-500 mr-3" />
                              <div>
                                <div className="font-medium">Risk Register</div>
                                <div className="text-sm text-muted-foreground">Risk tracking spreadsheet</div>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <Button variant="outline" size="sm">Download</Button>
                            </div>
                          </div>
                          
                          <div className="rounded-lg border p-4">
                            <div className="flex items-center">
                              <FileText className="h-8 w-8 text-purple-500 mr-3" />
                              <div>
                                <div className="font-medium">Ethics Questionnaire</div>
                                <div className="text-sm text-muted-foreground">AI ethics assessment tool</div>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <Button variant="outline" size="sm">Download</Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>
                      Finalize Implementation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}