import type { ArchitectureMap } from '@/application/contracts';
import type { ArchitectureAnalysisPort } from '@/application/ports';

export class GenerateArchitectureMapUseCase {
  constructor(private readonly analysisPort: ArchitectureAnalysisPort) {}

  execute(): Promise<ArchitectureMap> {
    return this.analysisPort.generateMap();
  }
}
