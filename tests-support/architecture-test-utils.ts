import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cruise } from 'dependency-cruiser';
import type {
  ICruiseOptions,
  ICruiseResult,
  IConfiguration,
  IViolation,
} from 'dependency-cruiser';

const ARCHITECTURE_CONFIG_PATH = resolve(
  process.cwd(),
  'config',
  'architecture-rules.json'
);

export interface ArchitectureCruiseSummary {
  exitCode: number;
  success: boolean;
  result: ICruiseResult;
  violations: IViolation[];
}

export interface ArchitectureCruiseOptions
  extends Pick<
    ICruiseOptions,
    | 'includeOnly'
    | 'exclude'
    | 'focus'
    | 'reaches'
    | 'highlight'
    | 'tsPreCompilationDeps'
    | 'reporterOptions'
  > {
  entryPoints?: string[];
}

export function loadArchitectureConfig(
  configPath: string = ARCHITECTURE_CONFIG_PATH
): IConfiguration {
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as IConfiguration;
}

export async function runArchitectureCruise(
  options: ArchitectureCruiseOptions = {}
): Promise<ArchitectureCruiseSummary> {
  const {
    entryPoints = ['src'],
    includeOnly,
    exclude,
    focus,
    reaches,
    highlight,
    tsPreCompilationDeps,
    reporterOptions,
  } = options;

  const config = loadArchitectureConfig();
  const { options: configOptions = {}, ...ruleSet } = config;

  const cruiseOptions: ICruiseOptions = {
    ...configOptions,
    includeOnly,
    exclude,
    focus,
    reaches,
    highlight,
    tsPreCompilationDeps,
    reporterOptions,
    ruleSet,
  };

  const { output, exitCode } = await cruise(entryPoints, cruiseOptions);
  const result = output as ICruiseResult;
  const violations = result.summary.violations;

  return {
    exitCode,
    success: exitCode === 0 && result.summary.error === 0,
    result,
    violations,
  };
}

export async function assertCleanArchitecture(
  options?: ArchitectureCruiseOptions
): Promise<void> {
  const summary = await runArchitectureCruise(options);

  if (!summary.success) {
    const details = summary.violations
      .map((violation) => {
        const severity = violation.rule.severity.toUpperCase();
        const link = `${violation.from} -> ${violation.to}`;
        const rule = `[${violation.rule.name}]`;
        const note = violation.comment ? ` ${violation.comment}` : '';
        return `${severity}: ${link} ${rule}${note}`.trim();
      })
      .join('\n');

    throw new Error(
      [
        'Architecture guardrail violations detected.',
        details,
        'Run `yarn test:arch` locally for the full report.',
      ].join('\n')
    );
  }
}
