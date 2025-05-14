import React, { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Scan, Database, Server, Cloud, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Type for InfraInventory items
type InfraInventoryItem = {
  id: number;
  label: string;
  category: string;
  provider: string | null;
  count: number;
  icon: string;
  organizationId: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
};

// InfraMap component with visualization
const InfrastructureMap: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Fetch infrastructure inventory data
  const {
    data: infraItems,
    isLoading,
    error,
  } = useQuery<InfraInventoryItem[]>({
    queryKey: ["/api/infra-inventory"],
    enabled: !!user,
  });

  // Mutation to seed initial data
  const seedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/infra-inventory/seed");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Infrastructure inventory data has been created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/infra-inventory"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create infrastructure inventory data: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Function to get an icon component based on the icon string
  const getIconComponent = (icon: string) => {
    switch (icon) {
      case 'linux':
        return <Server className="h-10 w-10 text-amber-600" />;
      case 'windows':
        return <Server className="h-10 w-10 text-blue-500" />;
      case 'cloud-aws':
        return <Cloud className="h-10 w-10 text-orange-500" />;
      case 'cloud-azure':
        return <Cloud className="h-10 w-10 text-blue-700" />;
      case 'github':
        return <Github className="h-10 w-10 text-gray-800" />;
      default:
        return <Database className="h-10 w-10 text-gray-600" />;
    }
  };

  // Function to get color based on category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'onprem':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cloud':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'sourcecontrol':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Draw the infrastructure map when data is available
  useEffect(() => {
    if (!infraItems || infraItems.length === 0 || !svgRef.current) return;

    // Clear the SVG
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Set dimensions and center point
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Create center node for AuraAI Scanner
    const centerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerCircle.setAttribute("cx", centerX.toString());
    centerCircle.setAttribute("cy", centerY.toString());
    centerCircle.setAttribute("r", "30");
    centerCircle.setAttribute("fill", "#4f46e5");
    
    const centerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerText.setAttribute("x", centerX.toString());
    centerText.setAttribute("y", (centerY + 5).toString());
    centerText.setAttribute("text-anchor", "middle");
    centerText.setAttribute("fill", "white");
    centerText.setAttribute("font-size", "12px");
    centerText.textContent = "AuraAI";
    
    centerGroup.appendChild(centerCircle);
    centerGroup.appendChild(centerText);
    svg.appendChild(centerGroup);

    // Create nodes for each infrastructure item
    infraItems.forEach((item, index) => {
      const angle = (2 * Math.PI * index) / infraItems.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Create line connecting to center
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", centerX.toString());
      line.setAttribute("y1", centerY.toString());
      line.setAttribute("x2", x.toString());
      line.setAttribute("y2", y.toString());
      line.setAttribute("stroke", "#d1d5db");
      line.setAttribute("stroke-width", "2");
      svg.appendChild(line);

      // Create node group
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      
      // Node circle background
      const nodeCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      nodeCircle.setAttribute("cx", x.toString());
      nodeCircle.setAttribute("cy", y.toString());
      nodeCircle.setAttribute("r", "25");
      
      // Set color based on category
      switch (item.category) {
        case 'onprem':
          nodeCircle.setAttribute("fill", "#fef3c7");
          nodeCircle.setAttribute("stroke", "#d97706");
          break;
        case 'cloud':
          nodeCircle.setAttribute("fill", "#dbeafe");
          nodeCircle.setAttribute("stroke", "#3b82f6");
          break;
        case 'sourcecontrol':
          nodeCircle.setAttribute("fill", "#f3e8ff");
          nodeCircle.setAttribute("stroke", "#9333ea");
          break;
        default:
          nodeCircle.setAttribute("fill", "#f3f4f6");
          nodeCircle.setAttribute("stroke", "#6b7280");
      }
      
      nodeCircle.setAttribute("stroke-width", "2");
      group.appendChild(nodeCircle);

      // Count text
      const countText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      countText.setAttribute("x", x.toString());
      countText.setAttribute("y", y.toString());
      countText.setAttribute("text-anchor", "middle");
      countText.setAttribute("dominant-baseline", "middle");
      countText.setAttribute("font-weight", "bold");
      countText.setAttribute("font-size", "14px");
      countText.textContent = item.count.toString();
      group.appendChild(countText);

      // Label text
      const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      labelText.setAttribute("x", x.toString());
      labelText.setAttribute("y", (y + 45).toString());
      labelText.setAttribute("text-anchor", "middle");
      labelText.setAttribute("font-size", "12px");
      labelText.textContent = item.label;
      svg.appendChild(labelText);
      
      svg.appendChild(group);
    });
    
  }, [infraItems]);

  // If no data is available, show a button to seed initial data
  if (!isLoading && (!infraItems || infraItems.length === 0)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Infrastructure Map</CardTitle>
          <CardDescription>
            Visualize your infrastructure elements and their connections
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-center mb-4">No infrastructure inventory data found</p>
          <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
            {seedMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating sample data...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Create Sample Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Infrastructure Map</span>
          <Badge variant="outline" className="ml-2">
            {infraItems?.length || 0} Items
          </Badge>
        </CardTitle>
        <CardDescription>
          Visualize your infrastructure elements connected to AuraAI Scanner
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            Error loading infrastructure data
          </div>
        ) : (
          <div className="relative w-full" style={{ height: "500px" }}>
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox="0 0 800 500"
              preserveAspectRatio="xMidYMid meet"
              className="bg-white rounded-lg"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {infraItems?.map((item) => (
          <div 
            key={item.id} 
            className={`flex items-center p-2 rounded-md border ${getCategoryColor(item.category)}`}
          >
            <div className="mr-2">{getIconComponent(item.icon)}</div>
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-sm opacity-70">Count: {item.count}</div>
            </div>
          </div>
        ))}
      </CardFooter>
    </Card>
  );
};

export default InfrastructureMap;