import { injectable } from 'tsyringe';
import mermaid from 'mermaid';

export interface MermaidValidationResult {
  isValid: boolean;
  error?: string;
}

@injectable()
export class MermaidValidator {
  constructor() {
    // Initialize mermaid for server-side validation
    mermaid.initialize({ startOnLoad: false, suppressErrorRendering: true });
  }

  async validate(type: string, content: string): Promise<MermaidValidationResult> {
    try {
      const typeMarkers: Record<string, string[]> = {
        flowchart: ['flowchart', 'graph'],
        sequence: ['sequenceDiagram'],
        class: ['classDiagram'],
        er: ['erDiagram'],
        gantt: ['gantt'],
        state: ['stateDiagram', 'stateDiagram-v2']
      };

      const markers = typeMarkers[type];
      if (!markers) {
        return { isValid: false, error: `Unknown diagram type: ${type}` };
      }

      const hasValidMarker = markers.some(marker => 
        content.trim().startsWith(marker)
      );

      if (!hasValidMarker) {
        return { 
          isValid: false, 
          error: `Diagram content must start with one of: ${markers.join(', ')}` 
        };
      }

      // Use mermaid.parse() to validate syntax
      try {
        await mermaid.parse(content);
        return { isValid: true };
      } catch (parseError: any) {
        return { 
          isValid: false, 
          error: `Mermaid syntax error: ${parseError.message || parseError}` 
        };
      }
    } catch (error) {
      return { isValid: false, error: String(error) };
    }
  }
}
