export interface AnonymizationRule {
  field: string;
  type: 'hash' | 'mask' | 'replace' | 'remove' | 'encrypt';
  pattern?: string;
  replacement?: string;
  preserveLength?: boolean;
  preserveFormat?: boolean;
  customFunction?: (value: unknown) => unknown;
}

export interface AnonymizationConfig {
  rules: AnonymizationRule[];
  preserveRelationships: boolean;
  salt?: string;
  encryptionKey?: string;
}

export class DataAnonymizer {
  private config: AnonymizationConfig;
  private hashCache: Map<string, string> = new Map();

  constructor(config: AnonymizationConfig) {
    this.config = config;
  }

  anonymizeData(
    data: unknown,
    level: 'none' | 'partial' | 'full' = 'full'
  ): unknown {
    if (level === 'none') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.anonymizeData(item, level));
    }

    if (data && typeof data === 'object') {
      const anonymized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(data)) {
        const rule = this.findRule(key);

        if (rule && this.shouldAnonymize(rule, level)) {
          anonymized[key] = this.applyRule(value, rule);
        } else if (level === 'partial' && this.isSensitiveField(key)) {
          anonymized[key] = this.partialAnonymize(value);
        } else {
          anonymized[key] = this.anonymizeData(value, level);
        }
      }

      return anonymized;
    }

    return data;
  }

  private findRule(field: string): AnonymizationRule | undefined {
    return this.config.rules.find(
      (rule) => rule.field === field || field.match(new RegExp(rule.field))
    );
  }

  private shouldAnonymize(rule: AnonymizationRule, level: string): boolean {
    if (level === 'full') return true;
    if (level === 'partial') return rule.type !== 'remove';
    return false;
  }

  private isSensitiveField(field: string): boolean {
    const sensitivePatterns = [
      /email/i,
      /phone/i,
      /ssn/i,
      /credit/i,
      /card/i,
      /password/i,
      /token/i,
      /key/i,
      /secret/i,
      /address/i,
      /name/i,
      /id/i,
    ];

    return sensitivePatterns.some((pattern) => pattern.test(field));
  }

  private applyRule(value: unknown, rule: AnonymizationRule): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    switch (rule.type) {
      case 'hash':
        return this.hashValue(value, rule);
      case 'mask':
        return this.maskValue(value, rule);
      case 'replace':
        return rule.replacement || '[REDACTED]';
      case 'remove':
        return undefined;
      case 'encrypt':
        return this.encryptValue(value, rule);
      default:
        if (rule.customFunction) {
          return rule.customFunction(value);
        }
        return value;
    }
  }

  private hashValue(value: unknown, rule: AnonymizationRule): string {
    const stringValue = String(value);
    const cacheKey = `${stringValue}-${rule.field}`;

    if (this.hashCache.has(cacheKey)) {
      return this.hashCache.get(cacheKey)!;
    }

    const salt = this.config.salt || 'default-salt';
    const hash = this.simpleHash(stringValue + salt);

    if (rule.preserveLength && stringValue.length > 0) {
      const truncatedHash = hash.substring(0, stringValue.length);
      this.hashCache.set(cacheKey, truncatedHash);
      return truncatedHash;
    }

    this.hashCache.set(cacheKey, hash);
    return hash;
  }

  private maskValue(value: unknown, rule: AnonymizationRule): string {
    const stringValue = String(value);

    if (rule.pattern) {
      return stringValue.replace(
        new RegExp(rule.pattern),
        rule.replacement || '*'
      );
    }

    // Default masking: show first and last character, mask the middle
    if (stringValue.length <= 2) {
      return '*'.repeat(stringValue.length);
    }

    const firstChar = stringValue[0];
    const lastChar = stringValue[stringValue.length - 1];
    const maskedMiddle = '*'.repeat(Math.max(1, stringValue.length - 2));

    return firstChar + maskedMiddle + lastChar;
  }

  private partialAnonymize(value: unknown): unknown {
    const stringValue = String(value);

    if (stringValue.length <= 4) {
      return '*'.repeat(stringValue.length);
    }

    const firstTwo = stringValue.substring(0, 2);
    const lastTwo = stringValue.substring(stringValue.length - 2);
    const maskedMiddle = '*'.repeat(stringValue.length - 4);

    return firstTwo + maskedMiddle + lastTwo;
  }

  private encryptValue(value: unknown, _rule: AnonymizationRule): string {
    // Simple encryption for demo purposes
    // In production, use a proper encryption library
    const stringValue = String(value);
    const key = this.config.encryptionKey || 'default-key';

    let encrypted = '';
    for (let i = 0; i < stringValue.length; i++) {
      const charCode =
        stringValue.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode);
    }

    return Buffer.from(encrypted).toString('base64');
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Predefined anonymization rules for common data types
  static getDefaultRules(): AnonymizationRule[] {
    return [
      {
        field: 'email',
        type: 'mask',
        pattern: '(.+)@(.+)',
        replacement: '$1***@$2',
        preserveFormat: true,
      },
      {
        field: 'phone',
        type: 'mask',
        pattern: '(.{3})(.{3})(.{4})',
        replacement: '$1-***-$3',
        preserveFormat: true,
      },
      {
        field: 'ssn',
        type: 'mask',
        pattern: '(.{3})(.{2})(.{4})',
        replacement: '***-**-$3',
        preserveFormat: true,
      },
      {
        field: 'password',
        type: 'replace',
        replacement: '[REDACTED]',
      },
      {
        field: 'creditCard',
        type: 'mask',
        pattern: '(.{4})(.{4})(.{4})(.{4})',
        replacement: '****-****-****-$4',
        preserveFormat: true,
      },
      {
        field: 'name',
        type: 'replace',
        replacement: 'Anonymous User',
      },
      {
        field: 'address',
        type: 'replace',
        replacement: '[REDACTED ADDRESS]',
      },
      {
        field: 'id',
        type: 'hash',
        preserveLength: true,
      },
    ];
  }

  // Create anonymizer with default rules
  static createDefault(): DataAnonymizer {
    return new DataAnonymizer({
      rules: DataAnonymizer.getDefaultRules(),
      preserveRelationships: true,
      salt: 'mafia-insight-test-salt',
    });
  }

  // Create anonymizer for specific data type
  static createForDataType(
    dataType: 'users' | 'players' | 'clubs' | 'tournaments'
  ): DataAnonymizer {
    const baseRules = DataAnonymizer.getDefaultRules();
    let specificRules: AnonymizationRule[] = [];

    switch (dataType) {
      case 'users':
        specificRules = [
          ...baseRules,
          {
            field: 'role',
            type: 'replace',
            replacement: 'USER',
          },
        ];
        break;
      case 'players':
        specificRules = [
          ...baseRules,
          {
            field: 'rating',
            type: 'replace',
            replacement: 1500,
          },
        ];
        break;
      case 'clubs':
        specificRules = [
          ...baseRules,
          {
            field: 'city',
            type: 'replace',
            replacement: 'Test City',
          },
          {
            field: 'country',
            type: 'replace',
            replacement: 'Test Country',
          },
        ];
        break;
      case 'tournaments':
        specificRules = [
          ...baseRules,
          {
            field: 'location',
            type: 'replace',
            replacement: 'Test Location',
          },
        ];
        break;
    }

    return new DataAnonymizer({
      rules: specificRules,
      preserveRelationships: true,
      salt: `mafia-insight-${dataType}-salt`,
    });
  }
}
