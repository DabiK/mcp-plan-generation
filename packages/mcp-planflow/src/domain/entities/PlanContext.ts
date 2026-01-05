export interface ContextFile {
  path: string;          // Chemin absolu (commence par /)
  title?: string;        // Titre optionnel
  summary?: string;      // Résumé optionnel
  lastModified?: string; // ISO 8601 date
}

export interface PlanContext {
  planId: string;
  files: ContextFile[];
  createdAt: Date;
  updatedAt: Date;
}