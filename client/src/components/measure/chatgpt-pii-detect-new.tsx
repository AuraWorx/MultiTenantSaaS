import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Register Chart.js components
Chart.register(...registerables);

// API endpoints
const PII_DATA_ENDPOINT = 'https://8fd5ccdp3f.execute-api.us-west-2.amazonaws.com/analytics/pii';
const STATS_ENDPOINT = 'https://8fd5ccdp3f.execute-api.us-west-2.amazonaws.com/analytics/stats';

// Type definitions
interface PiiEntry {
  log_id: string;
  timestamp: string;
  userId: string;
  hasPII: boolean;
  piiTypesDetected: string[];
  promptLength?: number;
}

interface StatsData {
  totalCount: number;
  piiCount: number;
  timelineData: Record<string, number>;
}

type SortDirection = 'asc' | 'desc';

interface SortState {
  column: keyof PiiEntry | 'piiTypesDetected';
  direction: SortDirection;
}

export function ChatGptPiiDetect() {
  // State for data
  const [piiEntries, setPiiEntries] = useState<PiiEntry[]>([]);
  const [piiCounts, setPiiCounts] = useState<Record<string, number>>({});
  const [statsData, setStatsData] = useState<StatsData>({
    totalCount: 0,
    piiCount: 0,
    timelineData: {}
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Sorting
  const [sortState, setSortState] = useState<SortState>({
    column: 'timestamp',
    direction: 'desc'
  });

  // Chart references
  const piiTypeChartRef = useRef<Chart | null>(null);
  const totalPiiChartRef = useRef<Chart | null>(null);
  const timelineChartRef = useRef<Chart | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Format timestamp for display
  function formatTimestamp(isoString: string): string {
    if (!isoString) return 'N/A';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(isoString));
    } catch (e) {
      return new Date(isoString).toLocaleString(); 
    }
  }
  
  // Fetch PII data from the API
  const fetchPiiData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch PII entries
      const response = await fetch(PII_DATA_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Failed to fetch PII data: ${response.statusText}`);
      }
      
      const data = await response.json();
      const items = data.items || [];
      setPiiEntries(items);
      
      // Process PII counts for the pie chart
      const counts: Record<string, number> = {};
      items.forEach((item: PiiEntry) => {
        if (item.piiTypesDetected && Array.isArray(item.piiTypesDetected)) {
          item.piiTypesDetected.forEach(piiType => {
            counts[piiType] = (counts[piiType] || 0) + 1;
          });
        }
      });
      setPiiCounts(counts);
      
    } catch (error) {
      console.error('Error fetching PII data:', error);
      setError('Failed to load PII data. Please try again later.');
      
      // For demo and testing only, use mock data
      const mockItems = generateMockPiiData();
      setPiiEntries(mockItems);
      
      const mockCounts = {
        'EMAIL': 15,
        'PHONE_NUMBER': 12,
        'ADDRESS': 8,
        'CREDIT_CARD': 5,
        'SSN': 7,
        'PASSPORT_NUMBER': 3,
        'DRIVER_LICENSE': 4
      };
      setPiiCounts(mockCounts);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch stats data from the API
  const fetchStatsData = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(STATS_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Failed to fetch stats data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatsData({
        totalCount: data.totalCount || 0,
        piiCount: data.piiCount || 0,
        timelineData: data.timelineData || {}
      });
      
    } catch (error) {
      console.error('Error fetching stats data:', error);
      
      // For demo and testing only, use mock data
      setStatsData({
        totalCount: 1000,
        piiCount: 150,
        timelineData: {
          '2025-05-04': 5,
          '2025-05-05': 8,
          '2025-05-06': 12,
          '2025-05-07': 7,
          '2025-05-08': 15,
          '2025-05-09': 10,
          '2025-05-10': 13
        }
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Generate mock data for testing
  const generateMockPiiData = (): PiiEntry[] => {
    const mockData: PiiEntry[] = [];
    const piiTypes = ['EMAIL', 'PHONE_NUMBER', 'ADDRESS', 'CREDIT_CARD', 'SSN', 'PASSPORT_NUMBER', 'DRIVER_LICENSE'];
    
    for (let i = 1; i <= 50; i++) {
      const hasPII = Math.random() > 0.3;
      const numPiiTypes = hasPII ? Math.floor(Math.random() * 3) + 1 : 0;
      const detectedTypes: string[] = [];
      
      for (let j = 0; j < numPiiTypes; j++) {
        const randomType = piiTypes[Math.floor(Math.random() * piiTypes.length)];
        if (!detectedTypes.includes(randomType)) {
          detectedTypes.push(randomType);
        }
      }
      
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7));
      
      mockData.push({
        log_id: `log-${i}`,
        timestamp: date.toISOString(),
        userId: `user-${Math.floor(Math.random() * 10) + 1}`,
        hasPII,
        piiTypesDetected: detectedTypes,
        promptLength: Math.floor(Math.random() * 500) + 50
      });
    }
    
    return mockData;
  };
  
  // Sort data based on current sort state
  const getSortedData = () => {
    return [...piiEntries].sort((a, b) => {
      const { column, direction } = sortState;
      
      if (column === 'timestamp') {
        const aDate = new Date(a.timestamp).getTime();
        const bDate = new Date(b.timestamp).getTime();
        return direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      if (column === 'piiTypesDetected') {
        const aLength = a.piiTypesDetected?.length || 0;
        const bLength = b.piiTypesDetected?.length || 0;
        return direction === 'asc' ? aLength - bLength : bLength - aLength;
      }
      
      if (column === 'hasPII') {
        return direction === 'asc' 
          ? (a.hasPII === b.hasPII ? 0 : a.hasPII ? 1 : -1)
          : (a.hasPII === b.hasPII ? 0 : a.hasPII ? -1 : 1);
      }
      
      const aValue = a[column];
      const bValue = b[column];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Convert to numbers for comparison
      const aNum = typeof aValue === 'number' ? aValue : 0;
      const bNum = typeof bValue === 'number' ? bValue : 0;
      
      return direction === 'asc'
        ? aNum - bNum
        : bNum - aNum;
    });
  };
  
  // Change sort column
  const handleSort = (column: keyof PiiEntry | 'piiTypesDetected') => {
    setSortState(prev => ({
      column,
      direction: prev.column === column 
        ? (prev.direction === 'asc' ? 'desc' : 'asc')
        : 'desc'
    }));
  };
  
  // Render PII Types Classification Chart
  const renderPiiTypeChart = () => {
    // Clean up previous chart
    if (piiTypeChartRef.current) {
      piiTypeChartRef.current.destroy();
    }
    
    const canvas = document.getElementById('piiTypeChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const piiTypes = Object.keys(piiCounts);
    if (piiTypes.length === 0) return;
    
    const data = piiTypes.map(type => piiCounts[type]);
    
    // Generate colors
    const colors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
      'rgba(40, 159, 150, 0.7)',
    ];
    
    piiTypeChartRef.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: piiTypes,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, piiTypes.length),
          borderWidth: 1,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          }
        }
      }
    });
  };
  
  // Render Total vs PII Chart
  const renderTotalPiiChart = () => {
    // Clean up previous chart
    if (totalPiiChartRef.current) {
      totalPiiChartRef.current.destroy();
    }
    
    const canvas = document.getElementById('totalPiiChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const totalNonPii = statsData.totalCount - statsData.piiCount;
    
    totalPiiChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Non-PII Prompts', 'PII Prompts'],
        datasets: [{
          data: [totalNonPii, statsData.piiCount],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          }
        }
      }
    });
  };
  
  // Render Timeline Chart
  const renderTimelineChart = () => {
    // Clean up previous chart
    if (timelineChartRef.current) {
      timelineChartRef.current.destroy();
    }
    
    const canvas = document.getElementById('timelineChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dates = Object.keys(statsData.timelineData).sort();
    const counts = dates.map(date => statsData.timelineData[date]);
    
    if (dates.length === 0) return;
    
    // Format dates for display
    const formattedDates = dates.map(dateStr => {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    
    timelineChartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [{
          label: 'PII Detections',
          data: counts,
          fill: false,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }]
      },
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
          legend: {
            display: true
          }
        }
      }
    });
  };
  
  // Get paginated data
  const getPaginatedData = () => {
    const sortedData = getSortedData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // Change page
  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  // Render the charts when data changes
  useEffect(() => {
    if (Object.keys(piiCounts).length > 0) {
      renderPiiTypeChart();
    }
  }, [piiCounts]);
  
  useEffect(() => {
    if (statsData.totalCount > 0) {
      renderTotalPiiChart();
      renderTimelineChart();
    }
  }, [statsData]);
  
  // Initial data fetch
  useEffect(() => {
    fetchPiiData();
    fetchStatsData();
  }, []);
  
  // Calculate total pages
  const totalPages = Math.ceil(piiEntries.length / itemsPerPage);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-6 lg:space-y-0 lg:flex-row lg:space-x-6">
        {/* PII Type Classification */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>PII Type Classification</CardTitle>
            <CardDescription>
              Distribution of detected PII types
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center text-destructive">
                {error}
              </div>
            ) : (
              <canvas id="piiTypeChart" />
            )}
          </CardContent>
        </Card>
        
        {/* Total vs PII Data */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Total vs PII Data</CardTitle>
            <CardDescription>
              Proportion of prompts containing PII
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center text-destructive">
                {error}
              </div>
            ) : (
              <canvas id="totalPiiChart" />
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* PII Detected Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>PII Detected Over Time</CardTitle>
          <CardDescription>
            Number of PII detections over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center text-destructive">
              {error}
            </div>
          ) : (
            <canvas id="timelineChart" />
          )}
        </CardContent>
      </Card>
      
      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>PII Detection Entries</CardTitle>
          <CardDescription>
            Raw data entries from PII detection analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('log_id')} className="cursor-pointer">
                    ID <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('timestamp')} className="cursor-pointer">
                    Timestamp <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('userId')} className="cursor-pointer">
                    User <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('hasPII')} className="cursor-pointer">
                    Has PII <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('piiTypesDetected')} className="cursor-pointer">
                    PII Types <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('promptLength')} className="cursor-pointer">
                    Prompt Length <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : piiEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  getPaginatedData().map((entry) => (
                    <TableRow key={entry.log_id}>
                      <TableCell className="font-mono text-xs">{entry.log_id}</TableCell>
                      <TableCell>{formatTimestamp(entry.timestamp)}</TableCell>
                      <TableCell>{entry.userId}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${entry.hasPII ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                          {entry.hasPII ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {entry.piiTypesDetected && entry.piiTypesDetected.length > 0 ? (
                            entry.piiTypesDetected.map((type, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs">
                                {type}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{entry.promptLength || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, piiEntries.length)} of {piiEntries.length}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const distance = Math.abs(page - currentPage);
                      return distance < 2 || page === 1 || page === totalPages;
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => changePage(page)}
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}