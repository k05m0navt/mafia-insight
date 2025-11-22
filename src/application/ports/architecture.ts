import type {
  ArchitectureMap,
  ArchitectureOnboardingGuide,
  ArchitectureValidationRequest,
  ArchitectureValidationResult,
} from '@/application/contracts';

export interface ArchitectureAnalysisPort {
  generateMap(): Promise<ArchitectureMap>;
  validate(
    request: ArchitectureValidationRequest
  ): Promise<ArchitectureValidationResult>;
}

export interface ArchitectureOnboardingPort {
  fetchGuide(): Promise<ArchitectureOnboardingGuide>;
}
