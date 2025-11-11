import type { ArchitectureOnboardingGuide } from '@/application/contracts';
import type { ArchitectureOnboardingPort } from '@/application/ports';

export class GetArchitectureOnboardingGuideUseCase {
  constructor(private readonly onboardingPort: ArchitectureOnboardingPort) {}

  execute(): Promise<ArchitectureOnboardingGuide> {
    return this.onboardingPort.fetchGuide();
  }
}
