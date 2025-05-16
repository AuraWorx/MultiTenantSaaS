import { Organization, Role, User } from "@shared/schema";

export interface UserWithDetails extends User {
  organization: Organization;
  role: Role;
}

export type Feature = {
  id: string;
  name: string;
  path: string;
};

export interface MapFeatures {
  aiUsageFinder: Feature;
  visualize: Feature;
  useCaseDatabase: Feature;
  cmdbIntegration: Feature;
  riskDocumentation: Feature;
}

export interface MeasureFeatures {
  complianceRules: Feature;
  auraAiWizard: Feature;
  piiLeakDetection: Feature;
  biasAnalysis: Feature;
  toxicityAnalysis: Feature;
  chatGptPiiDetect: Feature;
}

export interface ManageFeatures {
  frontierModelAlerts: Feature;
  riskRegister: Feature;
  riskMitigations: Feature;
}

export interface DashboardStats {
  aiSystemsCount: number;
  complianceIssuesCount: number;
  openRisksCount: number;
}

export interface ActivityItem {
  id: number;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  entity: string;
  timestamp: Date;
}
