import type {
  ArchitectureValidationRequest,
  ArchitectureValidationResult,
} from '@/application/contracts';
import type { ArchitectureAnalysisPort } from '@/application/ports';

export class ValidateArchitectureUseCase {
  constructor(private readonly analysisPort: ArchitectureAnalysisPort) {}

  execute(
    request: ArchitectureValidationRequest
  ): Promise<ArchitectureValidationResult> {
    return this.analysisPort.validate({
      ...request,
      includeReports: request.includeReports ?? true,
    });
  }
}
