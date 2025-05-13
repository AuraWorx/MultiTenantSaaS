import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FrontierModelUpdate } from '@/types';
import { getQueryFn } from '@/lib/queryClient';
import { ExternalLink, Shield, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function ModelUpdatesWidget() {
  const { 
    data: latestUpdates, 
    isLoading, 
    error 
  } = useQuery<FrontierModelUpdate[], Error>({
    queryKey: ['/api/frontier-model-updates/latest'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  const filterUpdatesByType = (type: 'security' | 'feature') => {
    if (!latestUpdates) return [];
    return latestUpdates.filter(update => update.update_type === type);
  };

  const openSourceUrl = (url: string | null) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Model Updates</CardTitle>
          <CardDescription>Recent security and feature updates for frontier models</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Model Updates</CardTitle>
          <CardDescription>Recent security and feature updates for frontier models</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load latest model updates
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Model Updates</CardTitle>
        <CardDescription>Recent security and feature updates for frontier models</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security Updates
            </TabsTrigger>
            <TabsTrigger value="feature">
              <Zap className="h-4 w-4 mr-2" />
              Feature Updates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="security" className="space-y-4">
            {filterUpdatesByType('security').length > 0 ? (
              <div className="space-y-3">
                {filterUpdatesByType('security').map((update) => (
                  <div key={update.id} className="p-3 border rounded-md">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">{update.title}</div>
                      <Badge variant="outline">{update.model?.name || "Unknown model"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{update.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(update.update_date), 'PP')}
                      </span>
                      {update.source_url && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openSourceUrl(update.source_url)}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          View Source
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No security updates available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="feature" className="space-y-4">
            {filterUpdatesByType('feature').length > 0 ? (
              <div className="space-y-3">
                {filterUpdatesByType('feature').map((update) => (
                  <div key={update.id} className="p-3 border rounded-md">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">{update.title}</div>
                      <Badge variant="outline">{update.model?.name || "Unknown model"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{update.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(update.update_date), 'PP')}
                      </span>
                      {update.source_url && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openSourceUrl(update.source_url)}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          View Source
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No feature updates available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}