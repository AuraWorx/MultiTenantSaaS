import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FrontierModelsAlert } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Info, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export function FrontierModelsWidget() {
  const { data: alerts, isLoading, error } = useQuery<FrontierModelsAlert[]>({
    queryKey: ["/api/frontier-models/alerts"],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-4 w-4 mr-2" /> Frontier Models Alerts
          </CardTitle>
          <CardDescription>
            Latest updates from frontier AI models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <p className="text-muted-foreground">Loading alerts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-4 w-4 mr-2" /> Frontier Models Alerts
          </CardTitle>
          <CardDescription>
            Latest updates from frontier AI models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-destructive">
            <p>Error loading alerts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Sparkles className="h-4 w-4 mr-2" /> Frontier Models Alerts
        </CardTitle>
        <CardDescription>
          Latest updates from frontier AI models
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts && alerts.length > 0 ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {alerts.slice(0, 5).map((alert) => (
              <div 
                key={alert.id}
                className="p-3 border rounded-md bg-card overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">{alert.title}</h4>
                      <Badge variant={alert.category === "security" ? "destructive" : "secondary"}>
                        {alert.category === "security" ? (
                          <AlertTriangle className="mr-1 h-3 w-3" />
                        ) : (
                          <Info className="mr-1 h-3 w-3" />
                        )}
                        {alert.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {alert.model_name} ({alert.model_provider})
                    </p>
                    {alert.description && (
                      <p className="text-xs mt-1 line-clamp-2">{alert.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(alert.date_published), 'MMM d, yyyy')}
                      </span>
                      {alert.url && (
                        <a 
                          href={alert.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center"
                        >
                          Reference <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-muted-foreground/60" />
            <p className="text-muted-foreground">No recent model alerts</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" asChild className="w-full">
          <Link to="/frontier-models">View All Frontier Models</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}