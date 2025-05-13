import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FrontierModelUpdate } from '@/types';
import { getQueryFn } from '@/lib/queryClient';
import { ExternalLink, Shield, Zap, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ModelUpdatesWidget() {
  const [page, setPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 4;
  
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

  const paginateUpdates = (updates: FrontierModelUpdate[]) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return updates.slice(startIndex, endIndex);
  };

  const totalPages = (updates: FrontierModelUpdate[]) => {
    return Math.ceil(updates.length / ITEMS_PER_PAGE);
  };

  const handlePreviousPage = () => {
    setPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = (updates: FrontierModelUpdate[]) => {
    setPage(prev => Math.min(prev + 1, totalPages(updates)));
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
        <Tabs defaultValue="security" className="w-full" onValueChange={() => setPage(1)}>
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
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Update</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginateUpdates(filterUpdatesByType('security')).map((update) => (
                      <TableRow key={update.id}>
                        <TableCell className="font-medium">
                          <a 
                            href={update.source_url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline text-blue-600 dark:text-blue-400"
                          >
                            {update.title}
                          </a>
                        </TableCell>
                        <TableCell>
                          {update.published_date ? 
                            format(new Date(update.published_date), 'MMM d, yyyy') : 
                            update.update_date ? 
                              format(new Date(update.update_date), 'MMM d, yyyy') : 
                              'N/A'}
                        </TableCell>
                        <TableCell>
                          {update.source_url && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openSourceUrl(update.source_url)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages(filterUpdatesByType('security')) > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Page {page} of {totalPages(filterUpdatesByType('security'))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleNextPage(filterUpdatesByType('security'))}
                      disabled={page === totalPages(filterUpdatesByType('security'))}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No security updates available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="feature" className="space-y-4">
            {filterUpdatesByType('feature').length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Update</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginateUpdates(filterUpdatesByType('feature')).map((update) => (
                      <TableRow key={update.id}>
                        <TableCell className="font-medium">
                          <a 
                            href={update.source_url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline text-blue-600 dark:text-blue-400"
                          >
                            {update.title}
                          </a>
                        </TableCell>
                        <TableCell>
                          {update.published_date ? 
                            format(new Date(update.published_date), 'MMM d, yyyy') : 
                            update.update_date ? 
                              format(new Date(update.update_date), 'MMM d, yyyy') : 
                              'N/A'}
                        </TableCell>
                        <TableCell>
                          {update.source_url && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openSourceUrl(update.source_url)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages(filterUpdatesByType('feature')) > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Page {page} of {totalPages(filterUpdatesByType('feature'))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleNextPage(filterUpdatesByType('feature'))}
                      disabled={page === totalPages(filterUpdatesByType('feature'))}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
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