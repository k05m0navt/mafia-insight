// NextRequest not used in this implementation

export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  tags: string[];
  security?: APISecurity;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header';
  required: boolean;
  type: string;
  description: string;
  example?: any;
}

export interface APIRequestBody {
  type: string;
  required: boolean;
  schema: any;
  example?: any;
}

export interface APIResponse {
  status: number;
  description: string;
  schema: any;
  example?: any;
}

export interface APISecurity {
  type: string;
  scheme: string;
  bearerFormat?: string;
}

export class APIDocumentationGenerator {
  private endpoints: APIEndpoint[] = [];

  constructor() {
    this.initializeEndpoints();
  }

  private initializeEndpoints() {
    // Search endpoints
    this.endpoints.push({
      path: '/api/search/players',
      method: 'GET',
      description: 'Search for players with optional filters',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: false,
          type: 'string',
          description: 'Search query for player names',
          example: 'john',
        },
        {
          name: 'region',
          in: 'query',
          required: false,
          type: 'string',
          description: 'Filter by region code',
          example: 'US',
        },
        {
          name: 'year',
          in: 'query',
          required: false,
          type: 'number',
          description: 'Filter by year',
          example: 2024,
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          type: 'number',
          description: 'Page number for pagination',
          example: 1,
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'number',
          description: 'Number of results per page',
          example: 10,
        },
      ],
      responses: [
        {
          status: 200,
          description: 'Successful response',
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Player',
                },
              },
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              totalPages: { type: 'number' },
              hasNext: { type: 'boolean' },
              hasPrev: { type: 'boolean' },
            },
          },
          example: {
            items: [
              {
                id: 'player_1',
                name: 'John Doe',
                eloRating: 1200,
                totalGames: 50,
                wins: 30,
                losses: 20,
              },
            ],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
        {
          status: 500,
          description: 'Internal server error',
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      ],
      tags: ['Search', 'Players'],
    });

    // Navigation endpoints
    this.endpoints.push({
      path: '/api/navigation/menu',
      method: 'GET',
      description: 'Get navigation menu items based on user role',
      parameters: [
        {
          name: 'role',
          in: 'query',
          required: true,
          type: 'string',
          description: 'User role (GUEST, USER, ADMIN)',
          example: 'USER',
        },
      ],
      responses: [
        {
          status: 200,
          description: 'Successful response',
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/NavigationItem',
                },
              },
            },
          },
        },
      ],
      tags: ['Navigation'],
    });

    // Import progress endpoints
    this.endpoints.push({
      path: '/api/import/progress',
      method: 'GET',
      description: 'Get current import progress',
      responses: [
        {
          status: 200,
          description: 'Successful response',
          schema: {
            type: 'object',
            properties: {
              imports: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/ImportProgress',
                },
              },
            },
          },
        },
      ],
      tags: ['Import', 'Progress'],
    });

    this.endpoints.push({
      path: '/api/import/progress/stream',
      method: 'GET',
      description: 'Stream real-time import progress updates',
      responses: [
        {
          status: 200,
          description: 'Server-Sent Events stream',
          schema: {
            type: 'string',
            format: 'text/event-stream',
          },
        },
      ],
      tags: ['Import', 'Progress', 'Real-time'],
    });

    // Player statistics endpoints
    this.endpoints.push({
      path: '/api/players/{playerId}/statistics',
      method: 'GET',
      description: 'Get detailed player statistics',
      parameters: [
        {
          name: 'playerId',
          in: 'path',
          required: true,
          type: 'string',
          description: 'Player ID',
          example: 'player_1',
        },
        {
          name: 'year',
          in: 'query',
          required: false,
          type: 'number',
          description: 'Filter by year',
          example: 2024,
        },
      ],
      responses: [
        {
          status: 200,
          description: 'Successful response',
          schema: {
            $ref: '#/components/schemas/PlayerStatistics',
          },
        },
        {
          status: 404,
          description: 'Player not found',
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      ],
      tags: ['Players', 'Statistics'],
    });

    // Region endpoints
    this.endpoints.push({
      path: '/api/regions',
      method: 'GET',
      description: 'Get list of regions with optional filters',
      parameters: [
        {
          name: 'active',
          in: 'query',
          required: false,
          type: 'boolean',
          description: 'Filter by active status',
          example: true,
        },
        {
          name: 'country',
          in: 'query',
          required: false,
          type: 'string',
          description: 'Filter by country',
          example: 'US',
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          type: 'string',
          description: 'Search in name or country',
          example: 'california',
        },
      ],
      responses: [
        {
          status: 200,
          description: 'Successful response',
          schema: {
            type: 'object',
            properties: {
              regions: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Region',
                },
              },
              summary: {
                $ref: '#/components/schemas/RegionSummary',
              },
            },
          },
        },
      ],
      tags: ['Regions'],
    });

    // Theme endpoints
    this.endpoints.push({
      path: '/api/theme',
      method: 'GET',
      description: 'Get current theme configuration',
      responses: [
        {
          status: 200,
          description: 'Successful response',
          schema: {
            $ref: '#/components/schemas/ThemeConfiguration',
          },
        },
      ],
      tags: ['Theme'],
    });

    this.endpoints.push({
      path: '/api/theme',
      method: 'POST',
      description: 'Update theme configuration',
      requestBody: {
        type: 'application/json',
        required: true,
        schema: {
          $ref: '#/components/schemas/ThemeConfiguration',
        },
      },
      responses: [
        {
          status: 200,
          description: 'Theme updated successfully',
          schema: {
            $ref: '#/components/schemas/ThemeConfiguration',
          },
        },
      ],
      tags: ['Theme'],
    });

    // Admin endpoints
    this.endpoints.push({
      path: '/api/admin/import/start',
      method: 'POST',
      description: 'Start a new data import',
      security: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
      },
      requestBody: {
        type: 'application/json',
        required: true,
        schema: {
          type: 'object',
          properties: {
            strategy: {
              type: 'string',
              enum: [
                'players',
                'tournaments',
                'games',
                'clubs',
                'player_stats',
                'tournament_results',
              ],
            },
            data: {
              type: 'array',
              items: { type: 'object' },
            },
          },
          required: ['strategy'],
        },
      },
      responses: [
        {
          status: 200,
          description: 'Import started successfully',
          schema: {
            type: 'object',
            properties: {
              importId: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      ],
      tags: ['Admin', 'Import'],
    });

    this.endpoints.push({
      path: '/api/admin/import/stop',
      method: 'POST',
      description: 'Stop a running import',
      security: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
      },
      requestBody: {
        type: 'application/json',
        required: true,
        schema: {
          type: 'object',
          properties: {
            importId: { type: 'string' },
          },
          required: ['importId'],
        },
      },
      responses: [
        {
          status: 200,
          description: 'Import stopped successfully',
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              importId: { type: 'string' },
            },
          },
        },
      ],
      tags: ['Admin', 'Import'],
    });
  }

  public generateOpenAPISpec(): any {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Mafia Insight API',
        description:
          'API for the Mafia Insight platform - comprehensive mafia game analytics and data management',
        version: '1.0.0',
        contact: {
          name: 'Mafia Insight Team',
          email: 'support@mafiainsight.com',
        },
      },
      servers: [
        {
          url: 'https://api.mafiainsight.com',
          description: 'Production server',
        },
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      paths: this.generatePaths(),
      components: {
        schemas: this.generateSchemas(),
        securitySchemes: {
          ApiKeyAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'API Key',
          },
        },
      },
      tags: [
        { name: 'Search', description: 'Search and filtering operations' },
        { name: 'Players', description: 'Player data and statistics' },
        { name: 'Navigation', description: 'Navigation and menu management' },
        { name: 'Import', description: 'Data import operations' },
        { name: 'Progress', description: 'Progress tracking and monitoring' },
        { name: 'Regions', description: 'Region data and filtering' },
        { name: 'Theme', description: 'Theme and appearance management' },
        { name: 'Admin', description: 'Administrative operations' },
        { name: 'Real-time', description: 'Real-time updates and streaming' },
      ],
    };
  }

  private generatePaths(): any {
    const paths: any = {};

    this.endpoints.forEach((endpoint) => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      const pathItem: any = {
        [endpoint.method.toLowerCase()]: {
          summary: endpoint.description,
          description: endpoint.description,
          tags: endpoint.tags,
          parameters: endpoint.parameters?.map((param) => ({
            name: param.name,
            in: param.in,
            required: param.required,
            schema: { type: param.type },
            description: param.description,
            example: param.example,
          })),
          requestBody: endpoint.requestBody
            ? {
                required: endpoint.requestBody.required,
                content: {
                  [endpoint.requestBody.type]: {
                    schema: endpoint.requestBody.schema,
                    example: endpoint.requestBody.example,
                  },
                },
              }
            : undefined,
          responses: endpoint.responses.reduce((acc, response) => {
            acc[response.status] = {
              description: response.description,
              content: {
                'application/json': {
                  schema: response.schema,
                  example: response.example,
                },
              },
            };
            return acc;
          }, {} as any),
        },
      };

      if (endpoint.security) {
        pathItem[endpoint.method.toLowerCase()].security = [
          {
            ApiKeyAuth: [],
          },
        ];
      }

      Object.assign(paths[endpoint.path], pathItem);
    });

    return paths;
  }

  private generateSchemas(): any {
    return {
      Player: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          eloRating: { type: 'number' },
          totalGames: { type: 'number' },
          wins: { type: 'number' },
          losses: { type: 'number' },
          region: { type: 'string' },
        },
      },
      NavigationItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          href: { type: 'string' },
          icon: { type: 'string' },
          requiredRole: { type: 'string', enum: ['GUEST', 'USER', 'ADMIN'] },
          isVisible: { type: 'boolean' },
          order: { type: 'number' },
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/NavigationItem' },
          },
        },
      },
      ImportProgress: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          operation: { type: 'string' },
          progress: { type: 'number', minimum: 0, maximum: 100 },
          totalRecords: { type: 'number' },
          processedRecords: { type: 'number' },
          errors: { type: 'number' },
          startTime: { type: 'string', format: 'date-time' },
          estimatedCompletion: { type: 'string', format: 'date-time' },
          status: {
            type: 'string',
            enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
          },
        },
      },
      PlayerStatistics: {
        type: 'object',
        properties: {
          player: { $ref: '#/components/schemas/Player' },
          tournamentHistory: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tournamentId: { type: 'string' },
                tournamentName: { type: 'string' },
                placement: { type: 'number' },
                ggPoints: { type: 'number' },
                eloChange: { type: 'number' },
                prizeMoney: { type: 'number' },
                date: { type: 'string', format: 'date-time' },
              },
            },
          },
          yearStats: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                year: { type: 'number' },
                totalGames: { type: 'number' },
                donGames: { type: 'number' },
                mafiaGames: { type: 'number' },
                sheriffGames: { type: 'number' },
                civilianGames: { type: 'number' },
                eloRating: { type: 'number' },
                extraPoints: { type: 'number' },
              },
            },
          },
          gameDetails: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                gameId: { type: 'string' },
                date: { type: 'string', format: 'date-time' },
                durationMinutes: { type: 'number' },
                role: { type: 'string' },
                team: { type: 'string' },
                isWinner: { type: 'boolean' },
                performanceScore: { type: 'number' },
              },
            },
          },
        },
      },
      Region: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          country: { type: 'string' },
          isActive: { type: 'boolean' },
          playerCount: { type: 'number' },
        },
      },
      RegionSummary: {
        type: 'object',
        properties: {
          totalRegions: { type: 'number' },
          activeRegions: { type: 'number' },
          totalPlayers: { type: 'number' },
        },
      },
      ThemeConfiguration: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark', 'system'] },
          customColors: { type: 'object' },
          lastUpdated: { type: 'string', format: 'date-time' },
        },
      },
    };
  }

  public getEndpoints(): APIEndpoint[] {
    return this.endpoints;
  }

  public getEndpointByPath(
    path: string,
    method: string
  ): APIEndpoint | undefined {
    return this.endpoints.find(
      (endpoint) =>
        endpoint.path === path &&
        endpoint.method.toLowerCase() === method.toLowerCase()
    );
  }
}

// Export singleton instance
export const apiDocumentation = new APIDocumentationGenerator();
