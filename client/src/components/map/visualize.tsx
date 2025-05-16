import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InfrastructureMap from "./infrastructure-map";

// Visualize section of the Map module
const Visualize: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visualize</h2>
          <p className="text-muted-foreground">
            Visualize AI/ML components across your infrastructure
          </p>
        </div>
      </div>

      <Tabs defaultValue="infra-map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="infra-map">Infrastructure Map</TabsTrigger>
          <TabsTrigger value="data-flow" disabled>Data Flow</TabsTrigger>
          <TabsTrigger value="risk-map" disabled>Risk Heat Map</TabsTrigger>
        </TabsList>
        
        <TabsContent value="infra-map" className="space-y-4">
          <InfrastructureMap />
        </TabsContent>
        
        <TabsContent value="data-flow">
          <Card>
            <CardHeader>
              <CardTitle>Data Flow</CardTitle>
              <CardDescription>
                Visualize data flows between AI systems (Coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">This feature is coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="risk-map">
          <Card>
            <CardHeader>
              <CardTitle>Risk Heat Map</CardTitle>
              <CardDescription>
                Visualize risk concentration across your infrastructure (Coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">This feature is coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Visualize;