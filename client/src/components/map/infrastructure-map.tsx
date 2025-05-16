import React, { useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Scan, Database, Server, Cloud, Github, Move } from "lucide-react";
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

// Node position for draggable functionality
interface NodePosition {
  x: number;
  y: number;
  isDragging: boolean;
}

// InfraMap component with visualization
const InfrastructureMap: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodePositions, setNodePositions] = useState<Record<number, NodePosition>>({});
  const [centerPosition, setCenterPosition] = useState<NodePosition | null>(null);
  const [activeDragNode, setActiveDragNode] = useState<number | "center" | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  
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

  // Initialize node positions when data is loaded
  useEffect(() => {
    if (!infraItems || infraItems.length === 0 || !svgRef.current) return;

    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Set center position
    setCenterPosition({
      x: centerX,
      y: centerY,
      isDragging: false
    });

    // Set initial positions for each node in a circle
    const positions: Record<number, NodePosition> = {};
    infraItems.forEach((item, index) => {
      const angle = (2 * Math.PI * index) / infraItems.length;
      positions[item.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        isDragging: false
      };
    });
    setNodePositions(positions);
  }, [infraItems]);

  // Handle mouse down for node dragging
  const handleMouseDown = useCallback((id: number | "center", event: React.MouseEvent) => {
    event.preventDefault();
    setActiveDragNode(id);
    setIsInteracting(true);
    
    // Update the specific node's isDragging property
    if (id === "center" && centerPosition) {
      setCenterPosition({ ...centerPosition, isDragging: true });
    } else if (typeof id === "number") {
      setNodePositions(prev => ({
        ...prev,
        [id]: { ...prev[id], isDragging: true }
      }));
    }
  }, [centerPosition]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!activeDragNode || !svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Update position based on which node is being dragged
    if (activeDragNode === "center") {
      setCenterPosition(prev => prev ? { ...prev, x, y } : null);
    } else {
      setNodePositions(prev => ({
        ...prev,
        [activeDragNode]: { ...prev[activeDragNode], x, y }
      }));
    }
  }, [activeDragNode]);

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (!activeDragNode) return;
    
    // Reset the isDragging property
    if (activeDragNode === "center" && centerPosition) {
      setCenterPosition({ ...centerPosition, isDragging: false });
    } else if (typeof activeDragNode === "number") {
      setNodePositions(prev => ({
        ...prev,
        [activeDragNode]: { ...prev[activeDragNode], isDragging: false }
      }));
    }
    
    setActiveDragNode(null);
    setIsInteracting(false);
  }, [activeDragNode, centerPosition]);

  // Reset layout to the initial circle
  const resetLayout = useCallback(() => {
    if (!infraItems || infraItems.length === 0 || !svgRef.current) return;

    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Reset center position
    setCenterPosition({
      x: centerX,
      y: centerY,
      isDragging: false
    });

    // Reset positions for each node
    const positions: Record<number, NodePosition> = {};
    infraItems.forEach((item, index) => {
      const angle = (2 * Math.PI * index) / infraItems.length;
      positions[item.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        isDragging: false
      };
    });
    setNodePositions(positions);
  }, [infraItems]);

  // Draw the infrastructure map when data is available
  useEffect(() => {
    if (!infraItems || infraItems.length === 0 || !svgRef.current || !centerPosition) return;

    // Clear the SVG
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Draw background grid pattern
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    // Create dot pattern
    const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    pattern.setAttribute("id", "dotPattern");
    pattern.setAttribute("width", "20");
    pattern.setAttribute("height", "20");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", "2");
    dot.setAttribute("cy", "2");
    dot.setAttribute("r", "1");
    dot.setAttribute("fill", "#e5e7eb");
    
    pattern.appendChild(dot);
    defs.appendChild(pattern);
    svg.appendChild(defs);
    
    // Create background rect with pattern
    const backgroundRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    backgroundRect.setAttribute("width", "100%");
    backgroundRect.setAttribute("height", "100%");
    backgroundRect.setAttribute("fill", "url(#dotPattern)");
    svg.appendChild(backgroundRect);
    
    // Draw connecting lines first (so they appear behind nodes)
    infraItems.forEach((item) => {
      const nodePos = nodePositions[item.id];
      if (!nodePos) return;
      
      // Create line connecting to center
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", centerPosition.x.toString());
      line.setAttribute("y1", centerPosition.y.toString());
      line.setAttribute("x2", nodePos.x.toString());
      line.setAttribute("y2", nodePos.y.toString());
      line.setAttribute("stroke", "#d1d5db");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-dasharray", "5,5");
      svg.appendChild(line);
      
      // Create pulse animation for the line
      if (nodePos.isDragging || centerPosition.isDragging) {
        const pulseCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulseCircle.setAttribute("cx", ((centerPosition.x + nodePos.x) / 2).toString());
        pulseCircle.setAttribute("cy", ((centerPosition.y + nodePos.y) / 2).toString());
        pulseCircle.setAttribute("r", "4");
        pulseCircle.setAttribute("fill", "#4f46e5");
        
        const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animate.setAttribute("attributeName", "opacity");
        animate.setAttribute("values", "0;1;0");
        animate.setAttribute("dur", "1.5s");
        animate.setAttribute("repeatCount", "indefinite");
        
        pulseCircle.appendChild(animate);
        svg.appendChild(pulseCircle);
      }
    });

    // Create center node for AuraAI Scanner
    const centerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    centerGroup.setAttribute("cursor", "grab");
    if (centerPosition.isDragging) {
      centerGroup.setAttribute("cursor", "grabbing");
    }
    
    // Add event listeners for dragging
    centerGroup.addEventListener("mousedown", (event) => handleMouseDown("center", event as any));
    
    // Create glow effect
    const centerGlow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerGlow.setAttribute("cx", centerPosition.x.toString());
    centerGlow.setAttribute("cy", centerPosition.y.toString());
    centerGlow.setAttribute("r", "35");
    centerGlow.setAttribute("fill", "url(#centerGradient)");
    centerGlow.setAttribute("opacity", "0.3");
    
    const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerCircle.setAttribute("cx", centerPosition.x.toString());
    centerCircle.setAttribute("cy", centerPosition.y.toString());
    centerCircle.setAttribute("r", "30");
    centerCircle.setAttribute("fill", "url(#centerGradient)");
    
    // Create gradient for center node
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    gradient.setAttribute("id", "centerGradient");
    
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#6366f1");
    
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#4f46e5");
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    
    // Create pulse animation for center
    const pulseCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pulseCircle.setAttribute("cx", centerPosition.x.toString());
    pulseCircle.setAttribute("cy", centerPosition.y.toString());
    pulseCircle.setAttribute("r", "45");
    pulseCircle.setAttribute("fill", "transparent");
    pulseCircle.setAttribute("stroke", "#4f46e5");
    pulseCircle.setAttribute("stroke-width", "2");
    pulseCircle.setAttribute("opacity", "0.4");
    
    const pulseAnimate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    pulseAnimate.setAttribute("attributeName", "r");
    pulseAnimate.setAttribute("values", "30;55;30");
    pulseAnimate.setAttribute("dur", "3s");
    pulseAnimate.setAttribute("repeatCount", "indefinite");
    
    const opacityAnimate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    opacityAnimate.setAttribute("attributeName", "opacity");
    opacityAnimate.setAttribute("values", "0.4;0.1;0.4");
    opacityAnimate.setAttribute("dur", "3s");
    opacityAnimate.setAttribute("repeatCount", "indefinite");
    
    pulseCircle.appendChild(pulseAnimate);
    pulseCircle.appendChild(opacityAnimate);
    
    // Center text
    const centerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerText.setAttribute("x", centerPosition.x.toString());
    centerText.setAttribute("y", centerPosition.y.toString());
    centerText.setAttribute("text-anchor", "middle");
    centerText.setAttribute("dominant-baseline", "middle");
    centerText.setAttribute("fill", "white");
    centerText.setAttribute("font-size", "12px");
    centerText.setAttribute("font-weight", "bold");
    centerText.textContent = "AuraAI";
    
    // Add icon effect
    const scanIcon = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    scanIcon.setAttribute("cx", (centerPosition.x - 16).toString());
    scanIcon.setAttribute("cy", (centerPosition.y - 16).toString());
    scanIcon.setAttribute("r", "6");
    scanIcon.setAttribute("fill", "#ffffff");
    
    centerGroup.appendChild(pulseCircle);
    centerGroup.appendChild(centerGlow);
    centerGroup.appendChild(centerCircle);
    centerGroup.appendChild(centerText);
    centerGroup.appendChild(scanIcon);
    svg.appendChild(centerGroup);

    // Create nodes for each infrastructure item
    infraItems.forEach((item) => {
      const nodePos = nodePositions[item.id];
      if (!nodePos) return;
      
      // Create node group
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("cursor", "grab");
      if (nodePos.isDragging) {
        group.setAttribute("cursor", "grabbing");
      }
      
      // Add event listeners for dragging
      group.addEventListener("mousedown", (event) => handleMouseDown(item.id, event as any));
      
      // Node shadow
      const nodeShadow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      nodeShadow.setAttribute("cx", (nodePos.x + 2).toString());
      nodeShadow.setAttribute("cy", (nodePos.y + 2).toString());
      nodeShadow.setAttribute("r", "25");
      nodeShadow.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
      
      // Node circle background
      const nodeCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      nodeCircle.setAttribute("cx", nodePos.x.toString());
      nodeCircle.setAttribute("cy", nodePos.y.toString());
      nodeCircle.setAttribute("r", "25");
      
      // Set color based on category
      let fillColor, strokeColor;
      switch (item.category) {
        case 'onprem':
          fillColor = "#fef3c7";
          strokeColor = "#d97706";
          break;
        case 'cloud':
          fillColor = "#dbeafe";
          strokeColor = "#3b82f6";
          break;
        case 'sourcecontrol':
          fillColor = "#f3e8ff";
          strokeColor = "#9333ea";
          break;
        default:
          fillColor = "#f3f4f6";
          strokeColor = "#6b7280";
      }
      
      nodeCircle.setAttribute("fill", fillColor);
      nodeCircle.setAttribute("stroke", strokeColor);
      nodeCircle.setAttribute("stroke-width", "2");
      
      // Count text
      const countText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      countText.setAttribute("x", nodePos.x.toString());
      countText.setAttribute("y", nodePos.y.toString());
      countText.setAttribute("text-anchor", "middle");
      countText.setAttribute("dominant-baseline", "middle");
      countText.setAttribute("font-weight", "bold");
      countText.setAttribute("font-size", "14px");
      countText.textContent = item.count.toString();
      
      // Label text with background
      const labelBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      labelText.setAttribute("x", nodePos.x.toString());
      labelText.setAttribute("y", (nodePos.y + 45).toString());
      labelText.setAttribute("text-anchor", "middle");
      labelText.setAttribute("font-size", "12px");
      labelText.textContent = item.label;
      
      // Calculate background width based on text
      const textWidth = item.label.length * 7;
      labelBg.setAttribute("x", (nodePos.x - textWidth/2).toString());
      labelBg.setAttribute("y", (nodePos.y + 35).toString());
      labelBg.setAttribute("width", textWidth.toString());
      labelBg.setAttribute("height", "20");
      labelBg.setAttribute("rx", "4");
      labelBg.setAttribute("fill", "white");
      labelBg.setAttribute("opacity", "0.7");
      
      // Add grab indicator if node is being dragged
      if (nodePos.isDragging) {
        const moveIcon = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        moveIcon.setAttribute("cx", (nodePos.x + 20).toString());
        moveIcon.setAttribute("cy", (nodePos.y - 20).toString());
        moveIcon.setAttribute("r", "8");
        moveIcon.setAttribute("fill", "#ffffff");
        moveIcon.setAttribute("stroke", strokeColor);
        moveIcon.setAttribute("stroke-width", "1");
        
        group.appendChild(moveIcon);
      }
      
      group.appendChild(nodeShadow);
      group.appendChild(nodeCircle);
      group.appendChild(countText);
      svg.appendChild(labelBg);
      svg.appendChild(labelText);
      svg.appendChild(group);
    });
    
  }, [infraItems, nodePositions, centerPosition, handleMouseDown]);

  // Set up mouse event listeners for the SVG element
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    
    const handleMouseMoveEvent = (event: MouseEvent) => {
      if (isInteracting) {
        handleMouseMove(event as any);
      }
    };
    
    const handleMouseUpEvent = () => {
      if (isInteracting) {
        handleMouseUp();
      }
    };
    
    svg.addEventListener("mousemove", handleMouseMoveEvent);
    svg.addEventListener("mouseup", handleMouseUpEvent);
    svg.addEventListener("mouseleave", handleMouseUpEvent);
    
    return () => {
      svg.removeEventListener("mousemove", handleMouseMoveEvent);
      svg.removeEventListener("mouseup", handleMouseUpEvent);
      svg.removeEventListener("mouseleave", handleMouseUpEvent);
    };
  }, [isInteracting, handleMouseMove, handleMouseUp]);

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
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 gap-1" 
              onClick={resetLayout}
            >
              <Move className="h-4 w-4" />
              <span>Reset Layout</span>
            </Button>
            <Badge variant="outline">
              {infraItems?.length || 0} Items
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Visualize your infrastructure elements connected to AuraAI Scanner. Drag nodes to rearrange.
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
          <div className="relative w-full rounded-lg border bg-card shadow-sm" style={{ height: "500px" }}>
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox="0 0 800 500"
              preserveAspectRatio="xMidYMid meet"
              className="rounded-lg"
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