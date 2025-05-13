import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileEdit,
  Ticket,
  CheckCircle,
  Flag,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RiskItem } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RiskRegisterPage() {
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>("");
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query risk items
  const { data: riskItems, isLoading } = useQuery<RiskItem[]>({
    queryKey: ["/api/risk-items"],
  });

  // Filter the data based on selected filters
  const filteredItems = riskItems
    ? riskItems.filter((item) => {
        if (selectedSeverity && item.severity !== selectedSeverity) return false;
        if (selectedStatus && item.status !== selectedStatus) return false;
        return true;
      })
    : [];
    
  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: async (payload: { id: number; note: string }) => {
      const res = await apiRequest("POST", `/api/risk-items/${payload.id}/add-note`, { note: payload.note });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items"] });
      toast({
        title: "Note Added",
        description: "Your note has been added to the risk item.",
      });
      setNoteText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add note: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create ServiceNow Ticket Mutation
  const createServiceNowTicketMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/risk-items/${id}/create-servicenow-ticket`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items"] });
      toast({
        title: "ServiceNow Ticket Created",
        description: data.message || "A ServiceNow ticket has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create ServiceNow ticket: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Accept Risk Mutation
  const acceptRiskMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/risk-items/${id}/accept`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items"] });
      toast({
        title: "Risk Accepted",
        description: "The risk has been marked as accepted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to accept risk: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Flag Risk Mutation
  const flagRiskMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/risk-items/${id}/flag`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-items"] });
      toast({
        title: "Risk Flagged",
        description: "The risk has been flagged for review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to flag risk: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle adding a note
  const handleAddNote = (id: number) => {
    setSelectedRiskId(id);
    setNoteText("");
  };
  
  // Handle note submission
  const handleNoteSubmit = () => {
    if (!selectedRiskId) return;
    if (!noteText.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a note",
        variant: "destructive"
      });
      return;
    }
    
    addNoteMutation.mutate({ id: selectedRiskId, note: noteText });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "text-red-600 bg-red-100 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-100 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-100 border-green-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <TopNavbar title="Risk Register" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : riskItems?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "Loading..."
                : riskItems?.filter((r) => r.status === "open").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "Loading..."
                : riskItems?.filter((r) => r.severity === "critical").length ||
                  0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Items</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <div>
              <span className="text-sm font-medium mr-2">Severity:</span>
              {["All", "Critical", "High", "Medium", "Low"].map((sev) => (
                <Button
                  key={sev}
                  variant={
                    selectedSeverity === sev.toLowerCase() ||
                    (sev === "All" && selectedSeverity === null)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="mr-1"
                  onClick={() =>
                    setSelectedSeverity(
                      sev === "All" ? null : sev.toLowerCase()
                    )
                  }
                >
                  {sev}
                </Button>
              ))}
            </div>
            <div>
              <span className="text-sm font-medium mr-2">Status:</span>
              {["All", "Open", "In_Progress", "Resolved"].map((status) => (
                <Button
                  key={status}
                  variant={
                    selectedStatus === status.toLowerCase() ||
                    (status === "All" && selectedStatus === null)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="mr-1"
                  onClick={() =>
                    setSelectedStatus(
                      status === "All" ? null : status.toLowerCase()
                    )
                  }
                >
                  {status.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No risk items found. Check filters or add risks from AI Usage Finder.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getSeverityColor(item.severity)}`}
                      >
                        {item.severity.charAt(0).toUpperCase() +
                          item.severity.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(item.status)}
                        <span className="ml-2">
                          {item.status.replace("_", " ").charAt(0).toUpperCase() +
                            item.status.replace("_", " ").slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="min-w-28 flex items-center justify-between">
                            Actions <MoreHorizontal className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleAddNote(item.id);
                                }}
                                className="cursor-pointer"
                              >
                                <FileEdit className="mr-2 h-4 w-4" />
                                Add a note
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Note to Risk Item</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <Label htmlFor="note">Note</Label>
                                <Textarea 
                                  id="note" 
                                  placeholder="Enter your note here..." 
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  className="min-h-[100px]"
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleNoteSubmit}
                                  disabled={addNoteMutation.isPending}
                                >
                                  {addNoteMutation.isPending ? "Saving..." : "Save Note"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <DropdownMenuItem 
                            onClick={() => createServiceNowTicketMutation.mutate(item.id)}
                            disabled={createServiceNowTicketMutation.isPending}
                            className="cursor-pointer"
                          >
                            <Ticket className="mr-2 h-4 w-4" />
                            Create ServiceNow ticket
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => acceptRiskMutation.mutate(item.id)}
                            disabled={acceptRiskMutation.isPending || item.isAccepted}
                            className={`cursor-pointer ${item.isAccepted ? 'opacity-50' : ''}`}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept risk
                            {item.isAccepted && <span className="ml-auto text-xs text-muted-foreground">(Accepted)</span>}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => flagRiskMutation.mutate(item.id)}
                            disabled={flagRiskMutation.isPending || item.isFlagged}
                            className={`cursor-pointer ${item.isFlagged ? 'opacity-50' : ''}`}
                          >
                            <Flag className="mr-2 h-4 w-4" />
                            Flag for review
                            {item.isFlagged && <span className="ml-auto text-xs text-muted-foreground">(Flagged)</span>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}