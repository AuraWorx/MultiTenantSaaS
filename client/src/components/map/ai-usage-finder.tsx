import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIUsage {
  id: number;
  name: string;
  description: string;
  department: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export function AIUsageFinder() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<AIUsage[] | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term to find AI systems",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    // Simulate an API call delay
    setTimeout(() => {
      // Mock results based on query
      const mockResults: AIUsage[] = [
        {
          id: 1,
          name: "Customer Support Chatbot",
          description: "AI-powered chatbot for customer support interactions",
          department: "Customer Support",
          riskLevel: "medium"
        },
        {
          id: 2,
          name: "Sentiment Analysis Tool",
          description: "Analyzes customer feedback for sentiment",
          department: "Marketing",
          riskLevel: "low"
        },
        {
          id: 3,
          name: "Fraud Detection System",
          description: "ML system for detecting fraudulent transactions",
          department: "Security",
          riskLevel: "high"
        }
      ].filter(result => 
        result.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setResults(mockResults);
      setIsSearching(false);
    }, 1000);
  };

  // Function to get color based on risk level
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Usage Finder</CardTitle>
          <CardDescription>
            Search across your organization to discover AI systems in use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search by name, department, or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results section */}
      {results !== null && (
        <div className="mt-6 space-y-6">
          <h3 className="text-lg font-medium">Search Results ({results.length})</h3>
          
          {results.length === 0 ? (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No results found</AlertTitle>
              <AlertDescription>
                We couldn't find any AI systems matching your search. Try different keywords or browse the systems below.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(item.riskLevel)}`}>
                        {item.riskLevel.charAt(0).toUpperCase() + item.riskLevel.slice(1)} Risk
                      </span>
                    </div>
                    <CardDescription>{item.department}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}