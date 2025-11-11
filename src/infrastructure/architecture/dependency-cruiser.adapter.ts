import { readFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

import {
  cruise,
  type IConfiguration,
  type ICruiseOptions,
  type ICruiseResult,
  type IViolation,
} from 'dependency-cruiser';

import type {
  ArchitectureLayerName,
  ArchitectureMap,
  ArchitectureValidationRequest,
  ArchitectureValidationResult,
  ArchitectureViolation,
} from '@/application/contracts';
import type { ArchitectureAnalysisPort } from '@/application/ports';

const PROJECT_ROOT = process.cwd();
const ARCHITECTURE_RULES_PATH = resolve(
  PROJECT_ROOT,
  'config',
  'architecture-rules.json'
);

interface CruiseSummary {
  exitCode: number;
  result: ICruiseResult;
  violations: IViolation[];
}

export class DependencyCruiserArchitectureAdapter
  implements ArchitectureAnalysisPort
{
  async generateMap(): Promise<ArchitectureMap> {
    const summary = await this.runCruise();
    return buildArchitectureMap(summary);
  }

  async validate(
    request: ArchitectureValidationRequest
  ): Promise<ArchitectureValidationResult> {
    const summary = await this.runCruise();
    const violations = summary.violations.map(mapViolation);

    const passed = summary.exitCode === 0 && summary.result.summary.error === 0;
    const violationCount = violations.length;

    const summaryMessage = passed
      ? `Guardrails passed for ${request.targetRef}`
      : `Guardrails failed for ${request.targetRef}: ${violationCount} violation(s) detected`;

    return {
      passed,
      violations,
      summary: summaryMessage,
      reportUrl: request.includeReports === false ? null : undefined,
    };
  }

  private async runCruise(): Promise<CruiseSummary> {
    const config = await this.loadConfiguration();
    const { options: configOptions = {}, ...ruleSet } = config;

    const cruiseOptions: ICruiseOptions = {
      ...configOptions,
      ruleSet,
    };

    const { output, exitCode } = await cruise(['src'], cruiseOptions);
    const result = output as ICruiseResult;

    return {
      exitCode,
      result,
      violations: result.summary.violations ?? [],
    };
  }

  private async loadConfiguration(): Promise<IConfiguration> {
    const raw = await readFile(ARCHITECTURE_RULES_PATH, 'utf-8');
    return JSON.parse(raw) as IConfiguration;
  }
}

export function buildArchitectureMap(summary: CruiseSummary): ArchitectureMap {
  const grouped: Record<ArchitectureLayerName, Set<string>> = {
    domain: new Set<string>(),
    application: new Set<string>(),
    adapters: new Set<string>(),
    infrastructure: new Set<string>(),
  };

  const moduleMap = new Map<string, ArchitectureViolationModule>();

  for (const entry of summary.result.modules ?? []) {
    const normalizedSource = normalizePath(entry.source);
    const layer = resolveLayer(normalizedSource);

    if (!layer) {
      continue;
    }

    grouped[layer].add(normalizedSource);

    const dependsOn = (entry.dependencies ?? [])
      .map((dependency) => dependency.resolved ?? dependency.module)
      .filter(isInternalModule)
      .map((dependencyPath) =>
        normalizePath(
          relative(PROJECT_ROOT, resolve(PROJECT_ROOT, dependencyPath))
        )
      );

    moduleMap.set(normalizedSource, {
      name: normalizedSource.split(sep).pop() ?? normalizedSource,
      path: normalizedSource,
      responsibilities: inferResponsibilities(layer),
      dependsOn: Array.from(new Set(dependsOn)).sort(),
    });
  }

  const layers = (
    Object.entries(grouped) as [ArchitectureLayerName, Set<string>][]
  )
    .filter(([, modules]) => modules.size > 0)
    .map(([name, modules]) => ({
      name,
      modules: Array.from(modules)
        .map((modulePath) => moduleMap.get(modulePath)!)
        .sort((a, b) => a.path.localeCompare(b.path)),
    }));

  return {
    generatedAt: new Date().toISOString(),
    layers,
    violations: (summary.violations ?? [])
      .map(mapViolation)
      .sort((a, b) => a.ruleId.localeCompare(b.ruleId)),
  };
}

interface ArchitectureViolationModule {
  name: string;
  path: string;
  responsibilities: string[];
  dependsOn: string[];
}

function resolveLayer(source: string): ArchitectureLayerName | undefined {
  if (source.startsWith('src/domain')) {
    return 'domain';
  }
  if (source.startsWith('src/application')) {
    return 'application';
  }
  if (source.startsWith('src/adapters')) {
    return 'adapters';
  }
  if (source.startsWith('src/infrastructure')) {
    return 'infrastructure';
  }
  return undefined;
}

function normalizePath(path: string): string {
  return path.split('\\').join('/');
}

function isInternalModule(path: string | undefined): path is string {
  return Boolean(path && normalizePath(path).startsWith('src/'));
}

function inferResponsibilities(layer: ArchitectureLayerName): string[] {
  switch (layer) {
    case 'domain':
      return ['business rules', 'value objects', 'pure services'];
    case 'application':
      return ['use-case orchestration', 'ports', 'DTO transformations'];
    case 'adapters':
      return ['request translation', 'presenters', 'transport integration'];
    case 'infrastructure':
      return ['port implementations', 'side effects', 'external integrations'];
    default:
      return ['undocumented'];
  }
}

function mapViolation(violation: IViolation): ArchitectureViolation {
  const message =
    violation.comment ??
    violation.rule?.comment ??
    `${violation.from} depends on ${violation.to}`;

  return {
    ruleId: violation.rule?.name ?? 'unknown-rule',
    severity: (violation.rule?.severity ?? 'error') as 'error' | 'warning',
    message,
    offender: `${violation.from} -> ${violation.to}`,
  };
}
