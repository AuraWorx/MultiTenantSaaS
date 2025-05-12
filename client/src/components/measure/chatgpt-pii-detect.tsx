import { useState, useEffect, useRef } from 'react';
// Add Chart.js global declaration to fix TypeScript errors
declare global {
  interface Window {
    Chart: any;
  }
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Mock API endpoints - these would be replaced with real endpoints in production
const ALL_DATA_ENDPOINT = 'https://8fd5ccdp3f.execute-api.us-west-2.amazonaws.com/analytics';
const PII_DATA_ENDPOINT = 'https://8fd5ccdp3f.execute-api.us-west-2.amazonaws.com/analytics/pii';
const STATS_ENDPOINT = 'https://8fd5ccdp3f.execute-api.us-west-2.amazonaws.com/analytics/stats';

// Type definitions for Chart.js callbacks
interface ChartContext {
  label?: string;
  parsed?: number;
  dataset: {
    data: number[];
  };
}

// Type definitions
interface PiiEntry {
  log_id: string;
  timestamp: string;
  userId: string;
  hasPII: boolean;
  piiTypesDetected: string[];
  promptLength?: number;
}

type SortDirection = 'asc' | 'desc';

interface SortState {
  column: string | null;
  direction: SortDirection;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
    hoverOffset?: number;
  }[];
}

export function ChatGptPiiDetect() {
  // State for data
  const [allData, setAllData] = useState<PiiEntry[]>([]);
  const [piiData, setPiiData] = useState<PiiEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageKeyHistory, setPageKeyHistory] = useState<(string | null)[]>([null]);
  const [currentPageKey, setCurrentPageKey] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [piiCount, setPiiCount] = useState(0);
  const [totalPiiCounts, setTotalPiiCounts] = useState<Record<string, number>>({});
  const [timelineData, setTimelineData] = useState<Record<string, number>>({});

  // References for charts
  const piiClassificationChartRef = useRef<any>(null);
  const totalPiiChartRef = useRef<any>(null);
  const timelineChartRef = useRef<any>(null);

  // State for loading and errors
  const [allDataLoading, setAllDataLoading] = useState(false);
  const [piiDataLoading, setPiiDataLoading] = useState(false);
  const [piiChartLoading, setPiiChartLoading] = useState(false);
  const [totalPiiChartLoading, setTotalPiiChartLoading] = useState(false);
  const [timelineChartLoading, setTimelineChartLoading] = useState(false);
  const [allDataError, setAllDataError] = useState<string | null>(null);
  const [piiDataError, setPiiDataError] = useState<string | null>(null);
  const [piiChartError, setPiiChartError] = useState<string | null>(null);
  const [totalPiiChartError, setTotalPiiChartError] = useState<string | null>(null);
  const [timelineChartError, setTimelineChartError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Sorting state
  const [piiSort, setPiiSort] = useState<SortState>({ column: null, direction: 'desc' });
  const [allDataSort, setAllDataSort] = useState<SortState>({ column: null, direction: 'desc' });
  
  const { toast } = useToast();
  
  // Form setup for export functionality
  const form = useForm({
    defaultValues: {
      startDate: formatDateForInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
      endDate: formatDateForInput(new Date()),
      exportFormat: "csv"
    }
  });

  // Format date for input fields (YYYY-MM-DD)
  function formatDateForInput(date: Date): string {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  // Format timestamp for display
  function formatTimestamp(isoString: string): string {
    if (!isoString) return 'N/A';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(new Date(isoString));
    } catch (e) {
      try { 
        return new Date(isoString).toLocaleString(); 
      } catch (e2) { 
        return isoString; 
      }
    }
  }

  // Fetch all data (paginated)
  const fetchAllData = async () => {
    setAllDataLoading(true);
    setAllDataError(null);
    
    try {
      // In a real implementation, this would hit your API with the actual pageKey
      const response = await fetch(`${ALL_DATA_ENDPOINT}?pageKey=${currentPageKey || ''}`);
      if (!response.ok) throw new Error('Failed to fetch all data');
      
      const data = await response.json();
      
      // Mock implementation - in production, these would come from the API
      setAllData(data.items || []);
      setCurrentPageKey(data.nextPageKey || null);
      
      // Update page history for back button
      if (currentPage === pageKeyHistory.length) {
        setPageKeyHistory([...pageKeyHistory, data.nextPageKey]);
      }
      
    } catch (error) {
      console.error('Error fetching all data:', error);
      setAllDataError('Using demo data. In a real app, this would connect to your API.');
      
      // For demo purposes only, using mock data
      setAllData(mockAllData);
      
      // Set a fake next page key for pagination demo
      setCurrentPageKey('mock_next_page');
      
      if (currentPage === pageKeyHistory.length) {
        setPageKeyHistory([...pageKeyHistory, 'mock_next_page']);
      }
    } finally {
      setAllDataLoading(false);
    }
  };

  // Fetch PII specific data
  const fetchPiiData = async () => {
    setPiiDataLoading(true);
    setPiiDataError(null);
    
    try {
      const response = await fetch(PII_DATA_ENDPOINT);
      if (!response.ok) throw new Error('Failed to fetch PII data');
      
      const data = await response.json();
      setPiiData(data.items || []);
      
      // Process PII data for charts
      const piiCounts: Record<string, number> = {};
      data.items.forEach((item: PiiEntry) => {
        if (item.piiTypesDetected && Array.isArray(item.piiTypesDetected)) {
          item.piiTypesDetected.forEach(piiType => {
            piiCounts[piiType] = (piiCounts[piiType] || 0) + 1;
          });
        }
      });
      
      setTotalPiiCounts(piiCounts);
      
    } catch (error) {
      console.error('Error fetching PII data:', error);
      setPiiDataError('Using demo data. In a real app, this would connect to your API.');
      
      // For demo purposes, use mock data
      setPiiData(mockPiiData);
      
      // Always use mock PII counts to make sure chart renders
      setTotalPiiCounts(mockPiiCounts);
    } finally {
      setPiiDataLoading(false);
    }
  };

  // Fetch stats for overall charts
  const fetchStats = async () => {
    setTotalPiiChartLoading(true);
    setTimelineChartLoading(true);
    setTotalPiiChartError(null);
    setTimelineChartError(null);
    
    try {
      const response = await fetch(STATS_ENDPOINT);
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      
      // Set total counts
      setTotalCount(data.totalCount || 0);
      setPiiCount(data.piiCount || 0);
      
      // Set timeline data
      setTimelineData(data.timelineData || {});
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      setTotalPiiChartError('Using demo data. In a real app, this would connect to your API.');
      setTimelineChartError('Using demo data. In a real app, this would connect to your API.');
      
      // For demo, always use mock data
      setTotalCount(1000);
      setPiiCount(150);
      setTimelineData(mockTimelineData);
    } finally {
      setTotalPiiChartLoading(false);
      setTimelineChartLoading(false);
    }
  };

  // Initialize ChartJS objects
  useEffect(() => {
    // Import ChartJS dynamically to avoid SSR issues
    const loadChart = async () => {
      try {
        // Load Chart.js
        await import('chart.js');
        // Register all controllers, elements, scales and plugins
        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);
        
        // Now render the charts
        renderCharts();
      } catch (error) {
        console.error('Error loading Chart.js:', error);
        setPiiChartError('Failed to load chart library.');
        setTotalPiiChartError('Failed to load chart library.');
        setTimelineChartError('Failed to load chart library.');
      }
    };
    
    loadChart();
    
    // Cleanup function
    return () => {
      if (piiClassificationChartRef.current) {
        piiClassificationChartRef.current.destroy();
      }
      if (totalPiiChartRef.current) {
        totalPiiChartRef.current.destroy();
      }
      if (timelineChartRef.current) {
        timelineChartRef.current.destroy();
      }
    };
  }, [totalPiiCounts, totalCount, piiCount, timelineData]);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
    fetchPiiData();
    fetchStats();
  }, [currentPage, currentPageKey]);
  
  // Sorting functions
  const handlePiiSort = (column: string) => {
    const newDirection = 
      piiSort.column === column && piiSort.direction === 'asc' ? 'desc' : 'asc';
    setPiiSort({ column, direction: newDirection });
  };
  
  const handleAllDataSort = (column: string) => {
    const newDirection = 
      allDataSort.column === column && allDataSort.direction === 'asc' ? 'desc' : 'asc';
    setAllDataSort({ column, direction: newDirection });
  };
  
  // Sorting logic
  const getSortedPiiData = () => {
    if (!piiSort.column) return piiData;
    
    return [...piiData].sort((a, b) => {
      const aValue = (piiSort.column === 'piiTypesDetected' && Array.isArray(a[piiSort.column]))
        ? a[piiSort.column].join(', ')
        : a[piiSort.column as keyof PiiEntry];
      
      const bValue = (piiSort.column === 'piiTypesDetected' && Array.isArray(b[piiSort.column]))
        ? b[piiSort.column].join(', ')
        : b[piiSort.column as keyof PiiEntry];
      
      if (aValue < bValue) return piiSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return piiSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };
  
  const getSortedAllData = () => {
    if (!allDataSort.column) return allData;
    
    return [...allData].sort((a, b) => {
      const aValue = (allDataSort.column === 'piiTypesDetected' && Array.isArray(a[allDataSort.column]))
        ? a[allDataSort.column].join(', ')
        : a[allDataSort.column as keyof PiiEntry];
      
      const bValue = (allDataSort.column === 'piiTypesDetected' && Array.isArray(b[allDataSort.column]))
        ? b[allDataSort.column].join(', ')
        : b[allDataSort.column as keyof PiiEntry];
      
      if (aValue < bValue) return allDataSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return allDataSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle pagination
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setCurrentPageKey(pageKeyHistory[newPage - 1]);
    }
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  // Declare Chart at module level for TypeScript
  let Chart: any;
  
  // Render charts using ChartJS
  const renderCharts = () => {
    // Only proceed if Chart.js is loaded and registered
    if (typeof window === 'undefined') {
      console.error('Running in SSR context');
      return;
    }
    
    // Import Chart from the module
    import('chart.js').then(module => {
      Chart = module.Chart;
      
      // PII Classification Chart
      renderPiiClassificationChart();
      renderTotalPiiChart();
      renderTimelineChart();
    }).catch(error => {
      console.error('Error importing Chart.js:', error);
      setPiiChartError('Failed to load chart library.');
      setTotalPiiChartError('Failed to load chart library.');
      setTimelineChartError('Failed to load chart library.');
    });
  };

  // Render PII Classification Chart
  const renderPiiClassificationChart = () => {
    setPiiChartLoading(true);
    setPiiChartError(null);
    
    const piiClassificationCanvas = document.getElementById('piiClassificationChart') as HTMLCanvasElement;
    if (!piiClassificationCanvas) {
      console.error('PII Classification canvas not found');
      setPiiChartError('Chart canvas not found');
      setPiiChartLoading(false);
      return;
    }
    
    const ctx = piiClassificationCanvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      setPiiChartError('Failed to initialize chart canvas');
      setPiiChartLoading(false);
      return;
    }
    
    // Prepare chart data
    const labels = Object.keys(totalPiiCounts);
    const data = Object.values(totalPiiCounts);
    
    if (labels.length === 0) {
      setPiiChartError('No PII types were found in the detected items');
      setPiiChartLoading(false);
      return;
    }
    
    const backgroundColors = labels.map((_, i) => 
      `hsl(${i * (360 / (labels.length || 1)) + 10}, 75%, 65%)`
    );
    
    const chartData: ChartData = {
      labels: labels,
      datasets: [{
        label: 'PII Type Count',
        data: data,
        backgroundColor: backgroundColors,
        hoverOffset: 4
      }]
    };
    
    // Destroy existing chart if it exists
    if (piiClassificationChartRef.current) {
      piiClassificationChartRef.current.destroy();
    }
    
    // Create new chart
    piiClassificationChartRef.current = new Chart(ctx, {
      type: 'pie',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 15 } },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                return `${label}: ${value} (${percentage})`;
              }
            }
          }
        }
      }
    });
    
    setPiiChartLoading(false);
  };

  // Render Total vs PII Chart
  const renderTotalPiiChart = () => {
    setTotalPiiChartLoading(true);
    setTotalPiiChartError(null);
    
    const totalPiiCanvas = document.getElementById('totalPiiChart') as HTMLCanvasElement;
    if (!totalPiiCanvas) {
      console.error('Total PII canvas not found');
      setTotalPiiChartError('Chart canvas not found');
      setTotalPiiChartLoading(false);
      return;
    }
    
    const ctx = totalPiiCanvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      setTotalPiiChartError('Failed to initialize chart canvas');
      setTotalPiiChartLoading(false);
      return;
    }
    
    const nonPiiCount = Math.max(0, totalCount - piiCount);
    
    const chartData: ChartData = {
      labels: ['PII Detected', 'No PII Detected'],
      datasets: [{
        label: 'Prompt Counts',
        data: [piiCount, nonPiiCount],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)', // Red for PII
          'rgba(75, 192, 192, 0.7)'  // Green for No PII
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1,
        hoverOffset: 4
      }]
    };
    
    // Destroy existing chart if it exists
    if (totalPiiChartRef.current) {
      totalPiiChartRef.current.destroy();
    }
    
    // Create new chart
    totalPiiChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 15 } },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                return `${label}: ${value} (${percentage})`;
              }
            }
          }
        }
      }
    });
    
    setTotalPiiChartLoading(false);
  };

  // Render Timeline Chart
  const renderTimelineChart = () => {
    setTimelineChartLoading(true);
    setTimelineChartError(null);
    
    const timelineCanvas = document.getElementById('piiTimelineChart') as HTMLCanvasElement;
    if (!timelineCanvas) {
      console.error('Timeline canvas not found');
      setTimelineChartError('Chart canvas not found');
      setTimelineChartLoading(false);
      return;
    }
    
    const ctx = timelineCanvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      setTimelineChartError('Failed to initialize chart canvas');
      setTimelineChartLoading(false);
      return;
    }
    
    // Sort dates and prepare data
    const dates = Object.keys(timelineData).sort();
    const counts = dates.map(date => timelineData[date]);
    
    if (dates.length === 0) {
      setTimelineChartError('No timeline data available');
      setTimelineChartLoading(false);
      return;
    }
    
    // Format dates for display
    const formattedDates = dates.map(dateStr => {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    
    const chartData = {
      labels: formattedDates,
      datasets: [{
        label: 'PII Detections',
        data: counts,
        fill: false,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }]
    };
    
    // Destroy existing chart if it exists
    if (timelineChartRef.current) {
      timelineChartRef.current.destroy();
    }
    
    // Create new chart
    timelineChartRef.current = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
    
    setTimelineChartLoading(false);
  };

  // Handle export
  const handleExport = () => {
    const data = form.getValues();
    setExportStatus('Generating report...');
    setExportError(null);
    
    // Mock export functionality
    setTimeout(() => {
      const format = data.exportFormat;
      
      if (format === 'csv') {
        setExportStatus('Report generated! Downloading CSV file...');
        // In a real app, this would trigger a file download
        toast({
          title: "Report Generated",
          description: "Your CSV report has been downloaded.",
        });
      } else {
        setExportStatus('PDF preview generated!');
        toast({
          title: "PDF Preview",
          description: "Your PDF report preview has been generated.",
        });
      }
      
      // Reset after 3 seconds
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ChatGPT PII Detection Dashboard</CardTitle>
          <CardDescription>
            Monitor and analyze personally identifiable information (PII) detected in ChatGPT prompts
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>
        
        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* PII Classification Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PII Type Classification</CardTitle>
              </CardHeader>
              <CardContent className="h-64 relative">
                {piiChartLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {piiChartError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-destructive">{piiChartError}</p>
                  </div>
                )}
                <canvas id="piiClassificationChart"></canvas>
              </CardContent>
            </Card>
            
            {/* Total vs PII Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total vs. PII Prompts</CardTitle>
              </CardHeader>
              <CardContent className="h-64 relative">
                {totalPiiChartLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {totalPiiChartError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-destructive">{totalPiiChartError}</p>
                  </div>
                )}
                <canvas id="totalPiiChart"></canvas>
              </CardContent>
            </Card>
            
            {/* PII Timeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PII Detected Over Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent className="h-64 relative">
                {timelineChartLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {timelineChartError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-destructive">{timelineChartError}</p>
                  </div>
                )}
                <canvas id="piiTimelineChart"></canvas>
              </CardContent>
            </Card>
          </div>
          
          {/* PII Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Entries with PII Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {piiDataLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          onClick={() => handlePiiSort('timestamp')}
                          className={piiSort.column === 'timestamp' ? 'cursor-pointer underline' : 'cursor-pointer'}
                        >
                          Timestamp {piiSort.column === 'timestamp' && (piiSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          onClick={() => handlePiiSort('userId')}
                          className={piiSort.column === 'userId' ? 'cursor-pointer underline' : 'cursor-pointer'}
                        >
                          User ID {piiSort.column === 'userId' && (piiSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          onClick={() => handlePiiSort('piiTypesDetected')}
                          className={piiSort.column === 'piiTypesDetected' ? 'cursor-pointer underline' : 'cursor-pointer'}
                        >
                          PII Types Detected {piiSort.column === 'piiTypesDetected' && (piiSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          onClick={() => handlePiiSort('log_id')}
                          className={piiSort.column === 'log_id' ? 'cursor-pointer underline' : 'cursor-pointer'}
                        >
                          Log ID {piiSort.column === 'log_id' && (piiSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {piiDataError ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-destructive">
                            {piiDataError}
                          </TableCell>
                        </TableRow>
                      ) : piiData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No PII data found
                          </TableCell>
                        </TableRow>
                      ) : (
                        getSortedPiiData().map((item, index) => (
                          <TableRow key={item.log_id || index}>
                            <TableCell>{formatTimestamp(item.timestamp)}</TableCell>
                            <TableCell>{item.userId || 'N/A'}</TableCell>
                            <TableCell>
                              {(item.piiTypesDetected && item.piiTypesDetected.length > 0)
                                ? item.piiTypesDetected.join(', ')
                                : 'N/A'}
                            </TableCell>
                            <TableCell>{item.log_id || 'N/A'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* All Log Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Log Entries (Paginated)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Button 
                  onClick={handlePrevPage} 
                  disabled={currentPage <= 1 || allDataLoading}
                  variant="outline"
                >
                  Previous
                </Button>
                <span>Page {currentPage}</span>
                <Button 
                  onClick={handleNextPage} 
                  disabled={!currentPageKey || allDataLoading}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
              
              <div className="relative">
                {allDataLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          onClick={() => handleAllDataSort('log_id')}
                          className={allDataSort.column === 'log_id' ? 'cursor-pointer underline' : 'cursor-pointer'}
                        >
                          Log ID {allDataSort.column === 'log_id' && (allDataSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          onClick={() => handleAllDataSort('timestamp')}
                          className={allDataSort.column === 'timestamp' ? 'cursor-pointer underline' : 'cursor-pointer'}
                        >
                          Timestamp {allDataSort.column === 'timestamp' && (allDataSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          onClick={() => handleAllDataSort('userId')}
                          className={allDataSort.column === 'userId' ? 'cursor-pointer underline' : 'cursor-pointer'}
                        >
                          User ID {allDataSort.column === 'userId' && (allDataSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          onClick={() => handleAllDataSort('hasPII')}
                          className={allDataSort.column === 'hasPII' ? 'cursor-pointer underline' : 'cursor-pointer'}
                        >
                          Has PII {allDataSort.column === 'hasPII' && (allDataSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          onClick={() => handleAllDataSort('piiTypesDetected')}
                          className={allDataSort.column === 'piiTypesDetected' ? 'cursor-pointer underline' : 'cursor-pointer'}
                        >
                          PII Types {allDataSort.column === 'piiTypesDetected' && (allDataSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          onClick={() => handleAllDataSort('promptLength')}
                          className={allDataSort.column === 'promptLength' ? 'cursor-pointer underline' : 'cursor-pointer'}
                        >
                          Length {allDataSort.column === 'promptLength' && (allDataSort.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allDataError ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-destructive">
                            {allDataError}
                          </TableCell>
                        </TableRow>
                      ) : allData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No data found for this page
                          </TableCell>
                        </TableRow>
                      ) : (
                        getSortedAllData().map((item, index) => (
                          <TableRow key={item.log_id || index}>
                            <TableCell>{item.log_id || 'N/A'}</TableCell>
                            <TableCell>{formatTimestamp(item.timestamp)}</TableCell>
                            <TableCell>{item.userId || 'N/A'}</TableCell>
                            <TableCell>
                              {item.hasPII ? (
                                <span className="text-destructive font-medium">Yes</span>
                              ) : 'No'}
                            </TableCell>
                            <TableCell>
                              {(item.piiTypesDetected && item.piiTypesDetected.length > 0)
                                ? item.piiTypesDetected.join(', ')
                                : 'None'}
                            </TableCell>
                            <TableCell>
                              {item.promptLength !== undefined ? item.promptLength : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export PII Data Report</CardTitle>
              <CardDescription>
                Generate a report of PII data for a specific date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="exportFormat"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Format</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="pdf">PDF (Preview)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="button" 
                  onClick={handleExport}
                  className="w-full md:w-auto"
                >
                  Generate Report
                </Button>
                
                {exportStatus && (
                  <p className="mt-4 text-sm text-muted-foreground">{exportStatus}</p>
                )}
                
                {exportError && (
                  <p className="mt-4 text-sm text-destructive">{exportError}</p>
                )}
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock data for development and fallback
const mockAllData: PiiEntry[] = [
  {
    log_id: 'log_001',
    timestamp: '2025-05-10T15:30:45Z',
    userId: 'user_123',
    hasPII: true,
    piiTypesDetected: ['EMAIL', 'PHONE_NUMBER'],
    promptLength: 250
  },
  {
    log_id: 'log_002',
    timestamp: '2025-05-10T14:22:10Z',
    userId: 'user_456',
    hasPII: false,
    piiTypesDetected: [],
    promptLength: 120
  },
  {
    log_id: 'log_003',
    timestamp: '2025-05-10T12:15:33Z',
    userId: 'user_789',
    hasPII: true,
    piiTypesDetected: ['ADDRESS', 'CREDIT_CARD'],
    promptLength: 380
  },
  {
    log_id: 'log_004',
    timestamp: '2025-05-09T22:45:12Z',
    userId: 'user_123',
    hasPII: true,
    piiTypesDetected: ['SSN'],
    promptLength: 175
  },
  {
    log_id: 'log_005',
    timestamp: '2025-05-09T18:33:27Z',
    userId: 'user_456',
    hasPII: false,
    piiTypesDetected: [],
    promptLength: 210
  }
];

const mockPiiData: PiiEntry[] = mockAllData.filter(item => item.hasPII);

const mockPiiCounts: Record<string, number> = {
  'EMAIL': 15,
  'PHONE_NUMBER': 12,
  'ADDRESS': 8,
  'CREDIT_CARD': 5,
  'SSN': 7,
  'PASSPORT_NUMBER': 3,
  'DRIVER_LICENSE': 4
};

const mockTimelineData: Record<string, number> = {
  '2025-05-04': 5,
  '2025-05-05': 8,
  '2025-05-06': 12,
  '2025-05-07': 7,
  '2025-05-08': 15,
  '2025-05-09': 10,
  '2025-05-10': 13
};