import { api } from "./api";

export interface PiiDetectionLog {
  id: number;
  sessionId: string;
  userId: number;
  timestamp: string;
  promptLength: number;
  hasPii: boolean;
  piiTypesDetected: string[];
  promptText: string;
  organizationId: number;
  createdAt: string;
}

export interface PiiStats {
  totalPrompts: number;
  piiPromptsCount: number;
  piiTypesDistribution: Array<{
    piiType: string;
    count: number;
  }>;
  dailyPiiCounts: Array<{
    date: string;
    count: number;
  }>;
}

export const piiDetectionService = {
  // Log PII detection results
  logDetection: async (data: {
    sessionId: string;
    promptLength: number;
    hasPii: boolean;
    piiTypesDetected: string[];
    promptText: string;
  }) => {
    const response = await api.post<PiiDetectionLog>("/api/analytics/pii", data);
    return response.data;
  },

  // Get PII detection logs
  getLogs: async (limit = 50, offset = 0) => {
    const response = await api.get<PiiDetectionLog[]>("/api/analytics/pii", {
      params: { limit, offset },
    });
    return response.data;
  },

  // Get PII detection statistics
  getStats: async () => {
    const response = await api.get<PiiStats>("/api/analytics/pii/stats");
    return response.data;
  },
}; 