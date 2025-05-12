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
  lifecycleManagement: Feature;
}

// Frontier Model Types
export interface FrontierModel {
  id: number;
  name: string;
  provider: string;
  description: string | null;
  release_date: string | null;
  created_at: string;
  created_by_id: number;
  organization_id: number;
  createdBy?: {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
  };
  organization?: {
    id: number;
    name: string;
  };
}

export interface FrontierModelAlert {
  id: number;
  name: string;
  frontier_model_id: number;
  organization_id: number;
  user_id: number;
  alert_type: 'security' | 'feature';
  created_at: string;
  updated_at: string;
  active: boolean;
  model?: FrontierModel;
  user?: {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface FrontierModelUpdate {
  id: number;
  frontier_model_id: number;
  title: string;
  description: string;
  update_type: 'security' | 'feature';
  source_url: string | null;
  update_date: string;
  created_at: string;
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
