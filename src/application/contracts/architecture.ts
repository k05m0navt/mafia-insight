export type ArchitectureLayerName =
  | 'domain'
  | 'application'
  | 'adapters'
  | 'infrastructure';

export interface ArchitectureModule {
  name: string;
  path: string;
  responsibilities: string[];
  dependsOn: string[];
}

export interface ArchitectureLayerGroup {
  name: ArchitectureLayerName;
  modules: ArchitectureModule[];
}

export interface ArchitectureViolation {
  ruleId: string;
  severity: 'error' | 'warning';
  message: string;
  offender: string;
}

export interface ArchitectureMap {
  generatedAt: string;
  layers: ArchitectureLayerGroup[];
  violations: ArchitectureViolation[];
}

export type ArchitectureValidationMode = 'full' | 'incremental';

export interface ArchitectureValidationRequest {
  targetRef: string;
  mode?: ArchitectureValidationMode;
  includeReports?: boolean;
}

export interface ArchitectureValidationResult {
  passed: boolean;
  violations: ArchitectureViolation[];
  summary: string;
  reportUrl?: string | null;
}

export interface ArchitectureOnboardingGuide {
  version: string;
  lastUpdated: string;
  overview: string;
  checklist: string[];
  references: string[];
}
