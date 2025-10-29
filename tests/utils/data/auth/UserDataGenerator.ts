import { faker } from '@faker-js/faker';
import { testLogger } from '../../logging/TestLogger';

export interface UserData {
  id: string;
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role: 'admin' | 'user' | 'guest';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  emailVerified: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

export interface TestUserCredentials {
  email: string;
  password: string;
  role: 'admin' | 'user' | 'guest';
  name?: string;
}

export interface PasswordTestData {
  weak: string[];
  medium: string[];
  strong: string[];
  invalid: string[];
}

export interface EmailTestData {
  valid: string[];
  invalid: string[];
  edgeCases: string[];
}

export class UserDataGenerator {
  private static instance: UserDataGenerator;
  private fakerInstance: typeof faker;

  private constructor() {
    this.fakerInstance = faker;
    // Set seed for consistent test data
    this.fakerInstance.seed(12345);
  }

  public static getInstance(): UserDataGenerator {
    if (!UserDataGenerator.instance) {
      UserDataGenerator.instance = new UserDataGenerator();
    }
    return UserDataGenerator.instance;
  }

  /**
   * Generates a complete user data object
   */
  public generateUserData(overrides: Partial<UserData> = {}): UserData {
    const baseData: UserData = {
      id: this.fakerInstance.string.uuid(),
      name: this.fakerInstance.person.fullName(),
      email: this.fakerInstance.internet.email(),
      password: this.generateStrongPassword(),
      role: 'user',
      isActive: true,
      createdAt: this.fakerInstance.date.past(),
      updatedAt: new Date(),
      emailVerified: this.fakerInstance.datatype.boolean(),
      profile: this.generateProfile(),
      preferences: this.generatePreferences(),
      permissions: this.generatePermissions('user'),
      metadata: this.generateMetadata(),
    };

    const userData = { ...baseData, ...overrides };

    // Ensure confirmPassword matches password if not specified
    if (!userData.confirmPassword) {
      userData.confirmPassword = userData.password;
    }

    testLogger.info('Generated user data', {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    });

    return userData;
  }

  /**
   * Generates test user credentials for authentication tests
   */
  public generateTestCredentials(
    role: 'admin' | 'user' | 'guest' = 'user'
  ): TestUserCredentials {
    const credentials: TestUserCredentials = {
      email: this.fakerInstance.internet.email(),
      password: this.generateStrongPassword(),
      role,
      name: this.fakerInstance.person.fullName(),
    };

    testLogger.info('Generated test credentials', {
      email: credentials.email,
      role: credentials.role,
    });

    return credentials;
  }

  /**
   * Generates multiple test users for bulk testing
   */
  public generateTestUsers(
    count: number,
    role: 'admin' | 'user' | 'guest' = 'user'
  ): TestUserCredentials[] {
    const users: TestUserCredentials[] = [];

    for (let i = 0; i < count; i++) {
      users.push(this.generateTestCredentials(role));
    }

    testLogger.info('Generated test users', { count, role });
    return users;
  }

  /**
   * Generates password test data for validation testing
   */
  public generatePasswordTestData(): PasswordTestData {
    return {
      weak: [
        '123',
        'password',
        '12345678',
        'abcdefgh',
        'Password',
        'password123',
        'PASSWORD123',
        'pass123',
        'test',
        'qwerty',
      ],
      medium: [
        'Password1',
        'pass1234',
        'Test1234',
        'MyPass1',
        'Secure1',
        'Strong1',
        'Good123',
        'Nice123',
        'Cool123',
        'Best123',
      ],
      strong: [
        'StrongP@ss1',
        'MySecure123!',
        'ComplexP@ss1',
        'VeryStrong123!',
        'SuperSecure1!',
        'UltraStrong123!',
        'MegaSecure1!',
        'HyperStrong123!',
        'UltimateSecure1!',
        'PerfectStrong123!',
      ],
      invalid: [
        '',
        ' ',
        '\t',
        '\n',
        'a',
        'ab',
        'abc',
        'abcd',
        'abcde',
        'abcdef',
        'abcdefg',
      ],
    };
  }

  /**
   * Generates email test data for validation testing
   */
  public generateEmailTestData(): EmailTestData {
    return {
      valid: [
        'test@example.com',
        'user@domain.org',
        'admin@company.co.uk',
        'test.user@example.com',
        'user+tag@example.com',
        'user123@example.com',
        'a@b.co',
        'very.long.email.address@very.long.domain.name.com',
        'user@subdomain.example.com',
        'test@example-domain.com',
      ],
      invalid: [
        '',
        ' ',
        'invalid',
        '@example.com',
        'test@',
        'test@.com',
        'test.example.com',
        '@',
        'test@.com',
        'test@example.',
        'test..user@example.com',
        'test@example..com',
        'test@example.com.',
        '.test@example.com',
        'test@example.com..',
      ],
      edgeCases: [
        'test@example.com.',
        'test@example.com..',
        'test@example.com...',
        'test@example.com....',
        'test@example.com.....',
        'test@example.com......',
        'test@example.com.......',
        'test@example.com........',
        'test@example.com.........',
        'test@example.com..........',
      ],
    };
  }

  /**
   * Generates a strong password following security requirements
   */
  public generateStrongPassword(): string {
    const length = this.fakerInstance.number.int({ min: 12, max: 20 });
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';

    // Ensure at least one character from each category
    password += this.fakerInstance.helpers.arrayElement(lowercase.split(''));
    password += this.fakerInstance.helpers.arrayElement(uppercase.split(''));
    password += this.fakerInstance.helpers.arrayElement(numbers.split(''));
    password += this.fakerInstance.helpers.arrayElement(symbols.split(''));

    // Fill the rest with random characters
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < length; i++) {
      password += this.fakerInstance.helpers.arrayElement(allChars.split(''));
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Generates a weak password for testing validation
   */
  public generateWeakPassword(): string {
    const weakPasswords = [
      '123',
      'password',
      '12345678',
      'abcdefgh',
      'Password',
      'password123',
      'PASSWORD123',
      'pass123',
      'test',
      'qwerty',
    ];

    return this.fakerInstance.helpers.arrayElement(weakPasswords);
  }

  /**
   * Generates user profile data
   */
  private generateProfile(): UserData['profile'] {
    return {
      firstName: this.fakerInstance.person.firstName(),
      lastName: this.fakerInstance.person.lastName(),
      avatar: this.fakerInstance.image.avatar(),
      bio: this.fakerInstance.person.bio(),
      location: this.fakerInstance.location.city(),
      website: this.fakerInstance.internet.url(),
    };
  }

  /**
   * Generates user preferences
   */
  private generatePreferences(): UserData['preferences'] {
    return {
      theme: this.fakerInstance.helpers.arrayElement(['light', 'dark', 'auto']),
      language: this.fakerInstance.helpers.arrayElement([
        'en',
        'es',
        'fr',
        'de',
        'it',
      ]),
      timezone: this.fakerInstance.location.timeZone(),
      notifications: {
        email: this.fakerInstance.datatype.boolean(),
        push: this.fakerInstance.datatype.boolean(),
        sms: this.fakerInstance.datatype.boolean(),
      },
    };
  }

  /**
   * Generates user permissions based on role
   */
  private generatePermissions(role: string): string[] {
    const basePermissions = ['read:profile', 'update:profile'];

    switch (role) {
      case 'admin':
        return [
          ...basePermissions,
          'read:users',
          'create:users',
          'update:users',
          'delete:users',
          'read:analytics',
          'read:reports',
          'manage:system',
          'access:admin',
        ];
      case 'user':
        return [...basePermissions, 'read:analytics', 'read:reports'];
      case 'guest':
        return ['read:public'];
      default:
        return basePermissions;
    }
  }

  /**
   * Generates user metadata
   */
  private generateMetadata(): Record<string, unknown> {
    return {
      source: 'test',
      testRun: this.fakerInstance.string.uuid(),
      environment: 'test',
      version: '1.0.0',
      tags: this.fakerInstance.helpers.arrayElements(
        ['test', 'automated', 'auth'],
        { min: 1, max: 3 }
      ),
      customFields: {
        department: this.fakerInstance.helpers.arrayElement([
          'Engineering',
          'Marketing',
          'Sales',
          'Support',
        ]),
        level: this.fakerInstance.helpers.arrayElement([
          'Junior',
          'Mid',
          'Senior',
          'Lead',
        ]),
        experience: this.fakerInstance.number.int({ min: 0, max: 20 }),
      },
    };
  }

  /**
   * Generates test data for specific test scenarios
   */
  public generateTestScenarioData(scenario: string): unknown {
    switch (scenario) {
      case 'login_success':
        return this.generateTestCredentials('user');

      case 'login_failure':
        return {
          email: this.fakerInstance.internet.email(),
          password: 'wrongpassword',
        };

      case 'signup_success': {
        const userData = this.generateUserData();
        return {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          confirmPassword: userData.password,
        };
      }

      case 'signup_failure':
        return {
          name: this.fakerInstance.person.fullName(),
          email: this.fakerInstance.internet.email(),
          password: 'weak',
          confirmPassword: 'different',
        };

      case 'admin_access':
        return this.generateTestCredentials('admin');

      case 'user_access':
        return this.generateTestCredentials('user');

      case 'guest_access':
        return this.generateTestCredentials('guest');

      case 'password_reset':
        return {
          email: this.fakerInstance.internet.email(),
          newPassword: this.generateStrongPassword(),
        };

      case 'email_verification':
        return {
          email: this.fakerInstance.internet.email(),
          token: this.fakerInstance.string.alphanumeric(32),
        };

      default:
        return this.generateUserData();
    }
  }

  /**
   * Generates bulk test data for performance testing
   */
  public generateBulkTestData(
    count: number,
    scenario: string = 'default'
  ): unknown[] {
    const data: unknown[] = [];

    for (let i = 0; i < count; i++) {
      data.push(this.generateTestScenarioData(scenario));
    }

    testLogger.info('Generated bulk test data', { count, scenario });
    return data;
  }

  /**
   * Generates test data for edge cases
   */
  public generateEdgeCaseData(): unknown {
    return {
      emptyUser: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
      maxLengthUser: {
        name: 'A'.repeat(255),
        email: 'a'.repeat(250) + '@example.com',
        password: 'A'.repeat(100),
        confirmPassword: 'A'.repeat(100),
      },
      specialCharactersUser: {
        name: 'Test User !@#$%^&*()',
        email: 'test+special@example.com',
        password: 'Test123!@#$%^&*()',
        confirmPassword: 'Test123!@#$%^&*()',
      },
      unicodeUser: {
        name: '测试用户',
        email: 'test@测试.com',
        password: 'Test123测试',
        confirmPassword: 'Test123测试',
      },
    };
  }

  /**
   * Resets the faker seed for consistent test data
   */
  public resetSeed(seed: number = 12345): void {
    this.fakerInstance.seed(seed);
    testLogger.info('Reset faker seed', { seed });
  }

  /**
   * Generates test data with specific constraints
   */
  public generateConstrainedData(constraints: {
    minPasswordLength?: number;
    maxPasswordLength?: number;
    requireSpecialChars?: boolean;
    requireNumbers?: boolean;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    emailDomain?: string;
    nameLength?: number;
  }): UserData {
    let password = '';

    if (constraints.requireUppercase) {
      password += this.fakerInstance.helpers.arrayElement(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      );
    }
    if (constraints.requireLowercase) {
      password += this.fakerInstance.helpers.arrayElement(
        'abcdefghijklmnopqrstuvwxyz'.split('')
      );
    }
    if (constraints.requireNumbers) {
      password += this.fakerInstance.helpers.arrayElement(
        '0123456789'.split('')
      );
    }
    if (constraints.requireSpecialChars) {
      password += this.fakerInstance.helpers.arrayElement(
        '!@#$%^&*()_+-=[]{}|;:,.<>?'.split('')
      );
    }

    const minLength = constraints.minPasswordLength || 8;
    const maxLength = constraints.maxPasswordLength || 20;
    const targetLength = this.fakerInstance.number.int({
      min: minLength,
      max: maxLength,
    });

    while (password.length < targetLength) {
      password += this.fakerInstance.helpers.arrayElement(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'.split(
          ''
        )
      );
    }

    const emailDomain = constraints.emailDomain || 'example.com';
    const nameLength = constraints.nameLength || 10;

    return this.generateUserData({
      password,
      email: this.fakerInstance.internet.email({ provider: emailDomain }),
      name: this.fakerInstance.person.fullName().substring(0, nameLength),
    });
  }
}
