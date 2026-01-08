import 'reflect-metadata';

/**
 * Metadata stored for each property decorated with @SchemaProperty
 */
export interface PropertyMetadata {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  enum?: readonly string[];
  items?: {
    type: string;
    [key: string]: any;
  };
  properties?: Record<string, any>;
  nestedClass?: any; // Reference to another class for nested objects
  [key: string]: any; // Allow additional JSON Schema properties
}

/**
 * Metadata key for storing schema information
 */
const SCHEMA_METADATA_KEY = Symbol('schema:properties');

/**
 * Decorator to define JSON Schema metadata for a property
 * 
 * @example
 * ```typescript
 * class MyInput {
 *   @SchemaProperty({
 *     type: 'string',
 *     description: 'User name',
 *     required: true
 *   })
 *   name!: string;
 * 
 *   @SchemaProperty({
 *     type: 'array',
 *     description: 'Tags',
 *     items: { type: 'string' }
 *   })
 *   tags?: string[];
 * }
 * ```
 */
export function SchemaProperty(metadata: PropertyMetadata): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    // Get existing metadata or initialize empty map
    const existingMetadata = Reflect.getMetadata(SCHEMA_METADATA_KEY, target.constructor) || new Map<string | symbol, PropertyMetadata>();
    
    // Store metadata for this property
    existingMetadata.set(propertyKey, metadata);
    
    // Save back to class
    Reflect.defineMetadata(SCHEMA_METADATA_KEY, existingMetadata, target.constructor);
  };
}

/**
 * Retrieves schema metadata for all properties of a class
 * 
 * @param targetClass - The class to extract metadata from
 * @returns Map of property names to their schema metadata
 * 
 * @example
 * ```typescript
 * const metadata = getSchemaMetadata(MyInputClass);
 * console.log(metadata.get('name')); // { type: 'string', description: '...', required: true }
 * ```
 */
export function getSchemaMetadata(targetClass: any): Map<string | symbol, PropertyMetadata> {
  const metadata = Reflect.getMetadata(SCHEMA_METADATA_KEY, targetClass);
  
  if (!metadata) {
    return new Map();
  }
  
  return metadata;
}

/**
 * Check if a class has any schema metadata
 */
export function hasSchemaMetadata(targetClass: any): boolean {
  return Reflect.hasMetadata(SCHEMA_METADATA_KEY, targetClass);
}
