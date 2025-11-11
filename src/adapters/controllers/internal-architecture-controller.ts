import type {
  ArchitectureAnalysisPort,
  ArchitectureOnboardingPort,
} from '@/application/ports';
import type {
  ArchitectureMap,
  ArchitectureOnboardingGuide,
  ArchitectureValidationRequest,
  ArchitectureValidationResult,
} from '@/application/contracts';
import {
  GetArchitectureOnboardingGuideUseCase,
  GenerateArchitectureMapUseCase,
  ValidateArchitectureUseCase,
} from '@/application/use-cases/internal-architecture';
import {
  DependencyCruiserArchitectureAdapter,
  OnboardingFilesystemAdapter,
} from '@/infrastructure/architecture';

export class InternalArchitectureController {
  private readonly generateMapUseCase: GenerateArchitectureMapUseCase;
  private readonly validateUseCase: ValidateArchitectureUseCase;
  private readonly onboardingGuideUseCase: GetArchitectureOnboardingGuideUseCase;

  constructor(
    analysisPort: ArchitectureAnalysisPort = new DependencyCruiserArchitectureAdapter(),
    onboardingPort: ArchitectureOnboardingPort = new OnboardingFilesystemAdapter()
  ) {
    this.generateMapUseCase = new GenerateArchitectureMapUseCase(analysisPort);
    this.validateUseCase = new ValidateArchitectureUseCase(analysisPort);
    this.onboardingGuideUseCase = new GetArchitectureOnboardingGuideUseCase(
      onboardingPort
    );
  }

  getArchitectureMap(): Promise<ArchitectureMap> {
    return this.generateMapUseCase.execute();
  }

  validateArchitecture(
    request: ArchitectureValidationRequest
  ): Promise<ArchitectureValidationResult> {
    return this.validateUseCase.execute(request);
  }

  getOnboardingGuide(): Promise<ArchitectureOnboardingGuide> {
    return this.onboardingGuideUseCase.execute();
  }
}
