import { useState, useEffect } from 'react';
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Mock API endpoints - these would be replaced with real endpoints in production
const ALL_DATA_ENDPOINT = 'http://localhost:5050/api/analytics';
const PII_DATA_ENDPOINT = 'http://localhost:5050/api/analytics/pii';
const STATS_ENDPOINT = 'http://localhost:5050/api/analytics/stats';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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

  // State for loading and errors
  const [allDataLoading, setAllDataLoading] = useState(false);
  const [piiDataLoading, setPiiDataLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [allDataError, setAllDataError] = useState<string | null>(null);
  const [piiDataError, setPiiDataError] = useState<string | null>(null);
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
      const response = await fetch(`${ALL_DATA_ENDPOINT}?pageKey=${currentPageKey || ''}`);
      if (!response.ok) throw new Error('Failed to fetch all data');
      
      const data = await response.json();
      setAllData(data.items || []);
      setCurrentPageKey(data.nextPageKey || null);
      
      if (currentPage === pageKeyHistory.length) {
        setPageKeyHistory([...pageKeyHistory, data.nextPageKey]);
      }
      
    } catch (error) {
      console.error('Error fetching all data:', error);
      setAllDataError('Using demo data. In a real app, this would connect to your API.');
      setAllData(mockAllData);
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
      setPiiData(mockPiiData);
      setTotalPiiCounts(mockPiiCounts);
    } finally {
      setPiiDataLoading(false);
    }
  };

  // Fetch statistics data
  const fetchStats = async () => {
    setStatsLoading(true);
    
    try {
      const response = await fetch(STATS_ENDPOINT);
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setTotalCount(data.totalCount || 0);
      setPiiCount(data.piiCount || 0);
      setTimelineData(data.timelineData || {});
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use mock data for development
      setTotalCount(1000);
      setPiiCount(150);
      setTimelineData(mockTimelineData);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchPiiData();
    fetchStats();
  }, [currentPage, currentPageKey]);
  
  const handlePiiSort = (column: string) => {
    setPiiSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const handleAllDataSort = (column: string) => {
    setAllDataSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedPiiData = () => {
    if (!piiSort.column) return piiData;
    
    return [...piiData].sort((a, b) => {
      const aValue = piiSort.column === 'piiTypesDetected' 
        ? (a.piiTypesDetected || []).join(', ')
        : String(a[piiSort.column as keyof PiiEntry] || '');
      const bValue = piiSort.column === 'piiTypesDetected'
        ? (b.piiTypesDetected || []).join(', ')
        : String(b[piiSort.column as keyof PiiEntry] || '');
      
      if (piiSort.direction === 'asc') {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    });
  };
  
  const getSortedAllData = () => {
    if (!allDataSort.column) return allData;
    
    return [...allData].sort((a, b) => {
      const aValue = allDataSort.column === 'piiTypesDetected'
        ? (a.piiTypesDetected || []).join(', ')
        : String(a[allDataSort.column as keyof PiiEntry] || '');
      const bValue = allDataSort.column === 'piiTypesDetected'
        ? (b.piiTypesDetected || []).join(', ')
        : String(b[allDataSort.column as keyof PiiEntry] || '');
      
      if (allDataSort.direction === 'asc') {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      setCurrentPageKey(pageKeyHistory[currentPage - 2]);
    }
  };

  const handleNextPage = () => {
    if (currentPageKey) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Prepare data for charts
  const piiTypeData = Object.entries(totalPiiCounts).map(([type, count]) => ({
    name: type,
    value: count
  }));

  const timelineChartData = Object.entries(timelineData).map(([date, count]) => ({
    date,
    count
  }));

  const totalPiiData = [
    { name: 'Total Prompts', value: totalCount },
    { name: 'PII Detected', value: piiCount }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* PII Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>PII Types Distribution</CardTitle>
            <CardDescription>Distribution of detected PII types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] relative">
              {statsLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={piiTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {piiTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PII Detection Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>PII Detection Over Time</CardTitle>
            <CardDescription>Daily PII detection trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] relative">
              {statsLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    name="PII Detections"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PII Detection Rate (now Total vs. PII Prompts Doughnut) */}
        <Card>
          <CardHeader>
            <CardTitle>Total vs. PII Prompts</CardTitle>
            <CardDescription>Breakdown of prompts with and without PII</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] relative">
              {statsLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'PII Detected', value: piiCount },
                      { name: 'No PII Detected', value: Math.max(0, totalCount - piiCount) }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    label
                  >
                    <Cell fill="#FF6384" />
                    <Cell fill="#36A2EB" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Data Tables */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Data</TabsTrigger>
          <TabsTrigger value="pii">PII Detections</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Prompts</CardTitle>
              <CardDescription>Complete log of all prompts</CardDescription>
            </CardHeader>
            <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Has PII</TableHead>
                    <TableHead>PII Types</TableHead>
                    <TableHead>Prompt Length</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {getSortedAllData().map((entry) => (
                    <TableRow key={entry.log_id}>
                      <TableCell>{formatTimestamp(entry.timestamp)}</TableCell>
                      <TableCell>{entry.userId}</TableCell>
                      <TableCell>{entry.hasPII ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{entry.piiTypesDetected.join(', ') || 'None'}</TableCell>
                      <TableCell>{entry.promptLength || 'N/A'}</TableCell>
                        </TableRow>
                  ))}
                    </TableBody>
                  </Table>
            </CardContent>
          </Card>
        </TabsContent>
          
        <TabsContent value="pii" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PII Detections</CardTitle>
              <CardDescription>Log of prompts containing PII</CardDescription>
            </CardHeader>
            <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>PII Types</TableHead>
                    <TableHead>Prompt Length</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {getSortedPiiData().map((entry) => (
                    <TableRow key={entry.log_id}>
                      <TableCell>{formatTimestamp(entry.timestamp)}</TableCell>
                      <TableCell>{entry.userId}</TableCell>
                      <TableCell>{entry.piiTypesDetected.join(', ')}</TableCell>
                      <TableCell>{entry.promptLength || 'N/A'}</TableCell>
                        </TableRow>
                  ))}
                    </TableBody>
                  </Table>
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