import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Filter, PlusCircle, Book } from 'lucide-react';

interface UseCase {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: 'active' | 'planning' | 'completed';
  usageCounts: number;
}

const mockUseCases: UseCase[] = [
  {
    id: 1,
    title: "Customer Support Automation",
    description: "Using AI to automate responses to common customer inquiries and route complex issues to human agents.",
    category: "Customer Service",
    tags: ["chatbot", "nlp", "customer experience"],
    status: "active",
    usageCounts: 1245
  },
  {
    id: 2,
    title: "Sales Prediction Model",
    description: "ML model that predicts future sales based on historical data and external factors.",
    category: "Sales",
    tags: ["prediction", "forecasting", "revenue"],
    status: "active",
    usageCounts: 867
  },
  {
    id: 3,
    title: "Personalized Content Recommendations",
    description: "Algorithm that recommends content to users based on their browsing history and preferences.",
    category: "Marketing",
    tags: ["personalization", "engagement", "content"],
    status: "planning",
    usageCounts: 0
  },
  {
    id: 4,
    title: "Document Classification System",
    description: "Automatically categorizes and routes documents based on their content.",
    category: "Operations",
    tags: ["document processing", "classification", "workflow"],
    status: "completed",
    usageCounts: 5430
  }
];

export function UseCaseDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filteredUseCases, setFilteredUseCases] = useState<UseCase[]>(mockUseCases);
  
  const filterUseCases = (query: string, tab: string) => {
    let filtered = mockUseCases;
    
    // Apply search filter
    if (query) {
      filtered = filtered.filter(useCase => 
        useCase.title.toLowerCase().includes(query.toLowerCase()) ||
        useCase.description.toLowerCase().includes(query.toLowerCase()) ||
        useCase.category.toLowerCase().includes(query.toLowerCase()) ||
        useCase.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Apply tab filter
    if (tab !== 'all') {
      filtered = filtered.filter(useCase => useCase.status === tab);
    }
    
    setFilteredUseCases(filtered);
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterUseCases(query, activeTab);
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    filterUseCases(searchQuery, tab);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Use Case Database</h2>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Use Case
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Browse Use Cases</CardTitle>
              <CardDescription>
                Explore AI use cases across your organization
              </CardDescription>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search use cases by title, description, category, or tags"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="mb-4"
          />
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredUseCases.length > 0 ? (
                  filteredUseCases.map((useCase) => (
                    <Card key={useCase.id} className="flex flex-col h-full">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{useCase.title}</CardTitle>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(useCase.status)}`}>
                            {useCase.status.charAt(0).toUpperCase() + useCase.status.slice(1)}
                          </span>
                        </div>
                        <CardDescription>{useCase.category}</CardDescription>
                      </CardHeader>
                      <CardContent className="py-2 flex-1">
                        <p className="text-sm mb-4">{useCase.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {useCase.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4 flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          {useCase.usageCounts > 0 ? `${useCase.usageCounts} instances` : 'Not deployed'}
                        </div>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                          <Book className="h-4 w-4" />
                          Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 p-8 text-center text-muted-foreground">
                    No use cases found matching your criteria.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}