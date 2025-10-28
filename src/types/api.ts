// OpenAPI 3.0 types
export interface OpenAPIInfo {
  title: string;
  description: string;
  version: string;
  contact?: {
    name: string;
    email: string;
  };
}

export interface OpenAPIServer {
  url: string;
  description: string;
}

export interface OpenAPIPathItem {
  [method: string]: {
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: OpenAPIParameter[];
    requestBody?: OpenAPIRequestBody;
    responses: {
      [statusCode: string]: OpenAPIResponse;
    };
  };
}

export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema: {
    type: string;
    format?: string;
  };
}

export interface OpenAPIRequestBody {
  description?: string;
  content: {
    [contentType: string]: {
      schema: {
        type: string;
        properties?: Record<string, unknown>;
      };
    };
  };
  required?: boolean;
}

export interface OpenAPIResponse {
  description: string;
  content?: {
    [contentType: string]: {
      schema: {
        type: string;
        properties?: Record<string, unknown>;
      };
    };
  };
}

export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers: OpenAPIServer[];
  paths: {
    [path: string]: OpenAPIPathItem;
  };
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  tags?: Array<{ name: string; description: string }>;
}
