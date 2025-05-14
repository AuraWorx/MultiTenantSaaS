import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { piiDetectionService, type PiiStats } from "../services/piiDetection";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export const PiiAnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<PiiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await piiDetectionService.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch PII analytics data");
        console.error("Error fetching PII stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  return (
    <div className="pii-analytics-dashboard">
      <h2>PII Detection Analytics</h2>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Prompts</h3>
          <p className="number">{stats.totalPrompts}</p>
        </div>
        <div className="card">
          <h3>PII Detected</h3>
          <p className="number">{stats.piiPromptsCount}</p>
          <p className="percentage">
            {((stats.piiPromptsCount / stats.totalPrompts) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* PII Types Distribution */}
      <div className="chart-container">
        <h3>PII Types Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={stats.piiTypesDistribution}
              dataKey="count"
              nameKey="piiType"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {stats.piiTypesDistribution.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Daily PII Detection Trend */}
      <div className="chart-container">
        <h3>Daily PII Detection Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.dailyPiiCounts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
            />
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
    </div>
  );
}; 