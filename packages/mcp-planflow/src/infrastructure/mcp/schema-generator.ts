import { getSchemaMetadata, hasSchemaMetadata, PropertyMetadata } from './decorators/schema-metadata';

/**
 * JSON Schema structure for MCP tools
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  enum?: readonly string[];
  description?: string;
  [key: string]: any;
}

/**
 * Options for schema generation
 */
export interface GenerateSchemaOptions {
  /**
   * If true, generates a flat parameter schema instead of nested object
   * Used for MCP tools that accept flat parameters
   */
  flattenParams?: boolean;
  
  /**
   * Properties to exclude from the schema
   */
  exclude?: string[];
}

/**
 * Generates a JSON Schema from a class decorated with @SchemaProperty
 * 
 * @param inputClass - The class with @SchemaProperty decorators
 * @param options - Generation options
 * @returns JSON Schema object compatible with MCP tools
 * 
 * @example
 * ```typescript
 * const schema = generateMcpSchema(CreatePlanDraftMcpInput);
 * // Returns: { type: 'object', properties: {...}, required: [...] }
 * ```
 */
export function generateMcpSchema(inputClass: any, options: GenerateSchemaOptions = {}): JSONSchema {
  if (!hasSchemaMetadata(inputClass)) {
    throw new Error(`Class ${inputClass.name} does not have @SchemaProperty decorators`);
  }

  const metadata = getSchemaMetadata(inputClass);
  const properties: Record<string, any> = {};
  const required: string[] = [];
  
  // Process each property with metadata
  for (const [propertyKey, propertyMetadata] of metadata.entries()) {
    const propName = String(propertyKey);
    
    // Skip excluded properties
    if (options.exclude?.includes(propName)) {
      continue;
    }
    
    // Build property schema
    const propertySchema = buildPropertySchema(propertyMetadata);
    properties[propName] = propertySchema;
    
    // Track required properties
    if (propertyMetadata.required) {
      required.push(propName);
    }
  }
  
  const schema: JSONSchema = {
    type: 'object',
    properties,
  };
  
  if (required.length > 0) {
    schema.required = required;
  }
  
  return schema;
}

/**
 * Builds a JSON Schema for a single property
 */
function buildPropertySchema(metadata: PropertyMetadata): any {
  const schema: any = {
    type: metadata.type,
  };
  
  // Add description
  if (metadata.description) {
    schema.description = metadata.description;
  }
  
  // Handle enums
  if (metadata.enum) {
    schema.enum = metadata.enum;
  }
  
  // Handle arrays
  if (metadata.type === 'array' && metadata.items) {
    schema.items = metadata.items;
  }
  
  // Handle nested objects with nestedClass reference
  if (metadata.type === 'object' && metadata.nestedClass) {
    // Recursively generate schema for nested class
    if (hasSchemaMetadata(metadata.nestedClass)) {
      const nestedSchema = generateMcpSchema(metadata.nestedClass);
      // Copy nested schema properties
      Object.assign(schema, nestedSchema);
    } else if (metadata.properties) {
      // Fallback to inline properties
      schema.properties = metadata.properties;
    }
  } else if (metadata.type === 'object' && metadata.properties) {
    // Handle inline object properties
    schema.properties = metadata.properties;
  }
  
  // Copy any additional schema properties (like format, pattern, etc.)
  for (const [key, value] of Object.entries(metadata)) {
    if (!['type', 'description', 'required', 'enum', 'items', 'properties', 'nestedClass'].includes(key)) {
      schema[key] = value;
    }
  }
  
  return schema;
}

/**
 * Helper to generate enum descriptions dynamically
 * Used in decorator metadata to keep descriptions in sync with enum values
 * 
 * @example
 * ```typescript
 * @SchemaProperty({
 *   type: 'string',
 *   description: enumToDescription(STEP_KIND_VALUES, 'Step kind: '),
 *   enum: STEP_KIND_VALUES
 * })
 * kind!: string;
 * ```
 */
export function enumToDescription(enumValues: readonly string[], prefix: string = ''): string {
  return `${prefix}${enumValues.join(', ')}`;
}
