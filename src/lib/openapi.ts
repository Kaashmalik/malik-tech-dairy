/**
 * OpenAPI/Swagger Documentation Generator
 * Generates API documentation for all endpoints
 */

import { z } from 'zod';

/**
 * OpenAPI specification structure
 */
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name: string;
      email: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, OperationObject>>;
  components: {
    schemas: Record<string, SchemaObject>;
    securitySchemes: Record<string, SecuritySchemeObject>;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

export interface OperationObject {
  summary: string;
  description?: string;
  tags: string[];
  security?: Array<Record<string, string[]>>;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject>;
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'path' | 'header';
  description?: string;
  required: boolean;
  schema: SchemaObject;
}

export interface RequestBodyObject {
  description: string;
  required: boolean;
  content: Record<string, MediaTypeObject>;
}

export interface MediaTypeObject {
  schema: SchemaObject;
}

export interface ResponseObject {
  description: string;
  content?: Record<string, MediaTypeObject>;
}

export interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  enum?: string[];
  description?: string;
  example?: unknown;
  $ref?: string;
  format?: string;
  default?: unknown;
  allOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface SecuritySchemeObject {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'header' | 'query';
  scheme?: string;
  bearerFormat?: string;
}

/**
 * Convert Zod schema to OpenAPI schema
 */
export function zodToOpenAPI(schema: z.ZodTypeAny): SchemaObject {
  if (schema instanceof z.ZodString) {
    return {
      type: 'string',
      description: schema.description || undefined,
    };
  }

  if (schema instanceof z.ZodNumber) {
    return {
      type: 'number',
      description: schema.description || undefined,
    };
  }

  if (schema instanceof z.ZodBoolean) {
    return {
      type: 'boolean',
      description: schema.description || undefined,
    };
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema.options,
      description: schema.description || undefined,
    };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodToOpenAPI(schema.element),
      description: schema.description || undefined,
    };
  }

  if (schema instanceof z.ZodObject) {
    const properties: Record<string, SchemaObject> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(schema.shape)) {
      const zodField = value as z.ZodTypeAny;
      properties[key] = zodToOpenAPI(zodField);

      if (!zodField.isOptional()) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      description: schema.description || undefined,
    };
  }

  if (schema instanceof z.ZodOptional) {
    return zodToOpenAPI(schema.unwrap());
  }

  if (schema instanceof z.ZodNullable) {
    return zodToOpenAPI(schema.unwrap());
  }

  if (schema instanceof z.ZodDefault) {
    return zodToOpenAPI(schema.removeDefault());
  }

  // Default fallback
  return {
    type: 'unknown',
    description: schema.description || undefined,
  };
}

/**
 * Generate OpenAPI specification
 */
export function generateOpenAPISpec(): OpenAPISpec {
  const spec: OpenAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'MTK Dairy API',
      version: '1.0.0',
      description: 'API for MTK Dairy Farm Management SaaS Platform',
      contact: {
        name: 'MTK Dairy Support',
        email: 'support@maliktechdairy.com',
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://api.maliktechdairy.com'
            : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    paths: {},
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                hasMore: { type: 'boolean' },
              },
            },
          },
          required: ['success', 'data'],
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object' },
            requestId: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
          required: ['success', 'error', 'timestamp'],
        },
        Animal: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string' },
            tag: { type: 'string' },
            name: { type: 'string' },
            species: {
              type: 'string',
              enum: ['cattle', 'buffalo', 'goat', 'sheep', 'poultry', 'other'],
            },
            breed: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            gender: { type: 'string', enum: ['male', 'female'] },
            status: {
              type: 'string',
              enum: ['active', 'sold', 'deceased', 'quarantine'],
            },
            weight: { type: 'number' },
            color: { type: 'string' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'tenantId', 'tag', 'species', 'gender', 'status'],
        },
        MilkLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string' },
            animalId: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date' },
            session: { type: 'string', enum: ['morning', 'evening'] },
            quantity: { type: 'number' },
            quality: { type: 'string' },
            fat: { type: 'number' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'tenantId', 'animalId', 'date', 'quantity'],
        },
        HealthRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string' },
            animalId: { type: 'string', format: 'uuid' },
            recordType: { type: 'string' },
            description: { type: 'string' },
            diagnosis: { type: 'string' },
            treatment: { type: 'string' },
            medication: { type: 'string' },
            cost: { type: 'number' },
            vetName: { type: 'string' },
            nextCheckup: { type: 'string', format: 'date' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'tenantId', 'animalId', 'recordType', 'description'],
        },
        Expense: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string' },
            date: { type: 'string', format: 'date' },
            category: {
              type: 'string',
              enum: ['feed', 'medicine', 'equipment', 'labor', 'maintenance', 'transport', 'other'],
            },
            description: { type: 'string' },
            amount: { type: 'number' },
            vendorName: { type: 'string' },
            receiptUrl: { type: 'string', format: 'uri' },
            currency: { type: 'string', default: 'PKR' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'tenantId', 'date', 'category', 'description', 'amount'],
        },
        Sale: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string' },
            date: { type: 'string', format: 'date' },
            type: {
              type: 'string',
              enum: ['milk', 'animal', 'manure', 'other'],
            },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            pricePerUnit: { type: 'number' },
            total: { type: 'number' },
            buyerName: { type: 'string' },
            buyerPhone: { type: 'string' },
            notes: { type: 'string' },
            currency: { type: 'string', default: 'PKR' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'tenantId', 'date', 'type', 'quantity', 'pricePerUnit'],
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from Clerk authentication',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for programmatic access',
        },
      },
    },
    tags: [
      { name: 'Animals', description: 'Animal management operations' },
      { name: 'Milk', description: 'Milk production logging' },
      { name: 'Health', description: 'Health records management' },
      { name: 'Breeding', description: 'Breeding records management' },
      { name: 'Financial', description: 'Expenses and sales tracking' },
      { name: 'Tenants', description: 'Tenant management' },
      { name: 'Users', description: 'User management' },
      { name: 'Analytics', description: 'Analytics and reports' },
    ],
  };

  // Add paths for each resource
  spec.paths['/api/animals'] = {
    get: {
      summary: 'List all animals',
      description: 'Retrieve a paginated list of animals for the authenticated tenant',
      tags: ['Animals'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          required: false,
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          required: false,
          schema: { type: 'integer', default: 20 },
        },
        {
          name: 'species',
          in: 'query',
          description: 'Filter by species',
          required: false,
          schema: {
            type: 'string',
            enum: ['cattle', 'buffalo', 'goat', 'sheep', 'poultry', 'other'],
          },
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by status',
          required: false,
          schema: { type: 'string', enum: ['active', 'sold', 'deceased', 'quarantine'] },
        },
      ],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          animals: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Animal' },
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              limit: { type: 'integer' },
                              total: { type: 'integer' },
                              totalPages: { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create a new animal',
      description: 'Create a new animal record for the authenticated tenant',
      tags: ['Animals'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        description: 'Animal data',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                tag: { type: 'string' },
                name: { type: 'string' },
                species: {
                  type: 'string',
                  enum: ['cattle', 'buffalo', 'goat', 'sheep', 'poultry', 'other'],
                },
                breed: { type: 'string' },
                dateOfBirth: { type: 'string', format: 'date' },
                gender: { type: 'string', enum: ['male', 'female'] },
                status: {
                  type: 'string',
                  enum: ['active', 'sold', 'deceased', 'quarantine'],
                  default: 'active',
                },
                weight: { type: 'number' },
                color: { type: 'string' },
                notes: { type: 'string' },
              },
              required: ['tag', 'species', 'gender'],
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Animal created successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          animal: { $ref: '#/components/schemas/Animal' },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  };

  return spec;
}

/**
 * Export OpenAPI spec as JSON
 */
export function exportOpenAPISpec(): string {
  const spec = generateOpenAPISpec();
  return JSON.stringify(spec, null, 2);
}

/**
 * Generate OpenAPI spec for a specific endpoint
 */
export function generateEndpointSpec(
  path: string,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  operation: OperationObject
): void {
  const spec = generateOpenAPISpec();

  if (!spec.paths[path]) {
    spec.paths[path] = {};
  }

  spec.paths[path][method] = operation;
}
