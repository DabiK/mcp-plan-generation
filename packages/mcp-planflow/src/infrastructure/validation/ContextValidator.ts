import { injectable } from 'tsyringe';
import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import contextSchema from './schemas/context-v1.0.0.json';
import { DetailedValidationError } from '../../domain/errors/ValidationError';

export interface ContextValidationResult {
  isValid: boolean;
  errors: string[];
  detailedErrors: DetailedValidationError[];
}

@injectable()
export class ContextValidator {
  private ajv: Ajv;
  private validateFunction: ValidateFunction;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
    addFormats(this.ajv);
    
    this.validateFunction = this.ajv.compile(contextSchema);
  }

  /**
   * Valide un contexte de plan contre le JSON Schema
   */
  validate(context: unknown): ContextValidationResult {
    const errors: string[] = [];
    const detailedErrors: DetailedValidationError[] = [];

    // Validation JSON Schema
    const isValid = this.validateFunction(context);
    
    if (!isValid && this.validateFunction.errors) {
      for (const error of this.validateFunction.errors) {
        const path = error.instancePath || 'root';
        const message = error.message || 'Unknown error';
        errors.push(`${path}: ${message}`);
        
        // Convertir en DetailedValidationError
        detailedErrors.push(this.convertAjvError(error));
      }
    }

    // Validations métier supplémentaires
    if (isValid && this.isContextObject(context)) {
      // Vérifier les doublons de fichiers
      const filePaths = new Set<string>();
      for (const file of context.files) {
        if (filePaths.has(file.path)) {
          const errorMsg = `Duplicate file path: ${file.path}`;
          errors.push(errorMsg);
          detailedErrors.push({
            path: `/files/${file.path}`,
            message: errorMsg,
            errorType: 'business',
            actualValue: file.path,
          });
        }
        filePaths.add(file.path);
      }

      // Vérifier la cohérence des références de ligne
      for (let i = 0; i < context.files.length; i++) {
        const file = context.files[i];
        if (file.references) {
          for (let j = 0; j < file.references.length; j++) {
            const ref = file.references[j];
            if (ref.lineStart && ref.lineEnd && ref.lineStart > ref.lineEnd) {
              const errorMsg = `Invalid line range: lineStart (${ref.lineStart}) > lineEnd (${ref.lineEnd})`;
              errors.push(errorMsg);
              detailedErrors.push({
                path: `/files/${i}/references/${j}`,
                message: errorMsg,
                errorType: 'business',
                actualValue: { lineStart: ref.lineStart, lineEnd: ref.lineEnd },
              });
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      detailedErrors,
    };
  }

  /**
   * Type guard pour vérifier qu'un objet a la structure d'un contexte
   */
  private isContextObject(obj: unknown): obj is {
    files: Array<{
      path: string;
      purpose?: string;
      title?: string;
      summary?: string;
      lastModified?: string;
      references?: Array<{
        lineStart?: number;
        lineEnd?: number;
        symbol?: string;
      }>;
      tags?: string[];
    }>;
    metadata?: {
      version?: string;
      author?: string;
      notes?: string;
    };
  } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'files' in obj &&
      Array.isArray((obj as any).files)
    );
  }

  /**
   * Convertit une erreur Ajv en DetailedValidationError
   */
  private convertAjvError(error: ErrorObject): DetailedValidationError {
    return {
      path: error.instancePath || 'root',
      message: error.message || 'Unknown validation error',
      errorType: 'schema',
      expectedValue: error.params,
      actualValue: error.data,
      schemaKeyword: error.keyword,
    };
  }

  /**
   * Formate les erreurs pour un affichage user-friendly
   */
  formatErrors(errors: string[]): string {
    if (errors.length === 0) return 'No errors';
    
    return errors
      .map((err, index) => `${index + 1}. ${err}`)
      .join('\n');
  }
}
