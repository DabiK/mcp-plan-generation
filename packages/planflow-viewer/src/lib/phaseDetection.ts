import type { StepDTO } from '@/types';

export interface Phase {
  name: string;
  icon: string;
  stepIndexes: number[];
  description?: string;
}

// Keywords pour identifier les phases
const SETUP_KEYWORDS = [
  'setup', 'init', 'install', 'configure', 'create directory', 'create_directory',
  'scaffold', 'boilerplate', 'prepare', 'environment'
];

const TEST_KEYWORDS = [
  'test', 'spec', 'jest', 'vitest', 'cypress', 'playwright',
  'e2e', 'integration', 'unit test', 'coverage'
];

const DEPLOY_KEYWORDS = [
  'deploy', 'build', 'publish', 'release', 'docker',
  'kubernetes', 'ci/cd', 'pipeline'
];

const DOC_KEYWORDS = [
  'documentation', 'readme', 'doc', 'comment', 'jsdoc',
  'swagger', 'api doc'
];

/**
 * Détecte le type de phase d'un step basé sur son contenu
 */
function detectStepPhase(step: StepDTO): string {
  const searchText = `${step.title} ${step.description}`.toLowerCase();
  
  if (SETUP_KEYWORDS.some(kw => searchText.includes(kw))) {
    return 'setup';
  }
  
  if (TEST_KEYWORDS.some(kw => searchText.includes(kw))) {
    return 'test';
  }
  
  if (DEPLOY_KEYWORDS.some(kw => searchText.includes(kw))) {
    return 'deploy';
  }
  
  if (DOC_KEYWORDS.some(kw => searchText.includes(kw))) {
    return 'documentation';
  }
  
  // Phase par défaut basée sur le kind
  switch (step.kind) {
    case 'file_creation':
      return 'implementation';
    case 'file_modification':
      return 'implementation';
    case 'file_deletion':
      return 'cleanup';
    case 'command_execution':
      return 'execution';
    case 'code_review':
      return 'review';
    default:
      return 'other';
  }
}

/**
 * Regroupe les steps consécutifs de même phase
 */
function groupConsecutivePhases(steps: StepDTO[]): Phase[] {
  const phases: Phase[] = [];
  let currentPhase: string | null = null;
  let currentIndexes: number[] = [];
  
  steps.forEach((step, index) => {
    const phaseType = detectStepPhase(step);
    
    if (phaseType === currentPhase) {
      // Continue la phase actuelle
      currentIndexes.push(index);
    } else {
      // Termine la phase précédente si elle existe
      if (currentPhase && currentIndexes.length > 0) {
        phases.push(createPhase(currentPhase, currentIndexes));
      }
      
      // Commence une nouvelle phase
      currentPhase = phaseType;
      currentIndexes = [index];
    }
  });
  
  // Ajoute la dernière phase
  if (currentPhase && currentIndexes.length > 0) {
    phases.push(createPhase(currentPhase, currentIndexes));
  }
  
  return phases;
}

/**
 * Crée un objet Phase avec nom et icône appropriés
 */
function createPhase(type: string, stepIndexes: number[]): Phase {
  const phaseConfigs: Record<string, { name: string; icon: string; description?: string }> = {
    setup: {
      name: 'Setup',
      icon: '📦',
      description: 'Configuration initiale et préparation'
    },
    implementation: {
      name: 'Composants',
      icon: '🎨',
      description: 'Création et modification de fichiers'
    },
    test: {
      name: 'Tests',
      icon: '🧪',
      description: 'Tests et validation'
    },
    review: {
      name: 'Review',
      icon: '👁️',
      description: 'Revue de code'
    },
    documentation: {
      name: 'Documentation',
      icon: '📝',
      description: 'Documentation et commentaires'
    },
    execution: {
      name: 'Exécution',
      icon: '⚡',
      description: 'Commandes et scripts'
    },
    deploy: {
      name: 'Déploiement',
      icon: '🚀',
      description: 'Build et déploiement'
    },
    cleanup: {
      name: 'Nettoyage',
      icon: '🧹',
      description: 'Suppression et nettoyage'
    },
    other: {
      name: 'Autres',
      icon: '📋',
      description: 'Étapes diverses'
    }
  };
  
  const config = phaseConfigs[type] || phaseConfigs.other;
  
  return {
    name: config.name,
    icon: config.icon,
    stepIndexes,
    description: config.description
  };
}

/**
 * Détecte et groupe les steps en phases logiques
 */
export function detectPhases(steps: StepDTO[]): Phase[] {
  if (steps.length === 0) {
    return [];
  }
  
  // Groupe les steps consécutifs de même type
  const phases = groupConsecutivePhases(steps);
  
  // Fusionne les phases trop petites (1 step) avec la phase suivante
  const mergedPhases: Phase[] = [];
  
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    
    if (phase.stepIndexes.length === 1 && i < phases.length - 1) {
      // Fusionne avec la phase suivante
      const nextPhase = phases[i + 1];
      mergedPhases.push({
        ...nextPhase,
        stepIndexes: [...phase.stepIndexes, ...nextPhase.stepIndexes]
      });
      i++; // Skip next phase car déjà fusionnée
    } else {
      mergedPhases.push(phase);
    }
  }
  
  return mergedPhases;
}

/**
 * Trouve la phase actuelle en fonction de l'index du step
 */
export function getCurrentPhase(phases: Phase[], stepIndex: number): Phase | undefined {
  return phases.find(phase => phase.stepIndexes.includes(stepIndex));
}

/**
 * Obtient les stats d'une phase (steps complétés/total)
 */
export function getPhaseStats(phase: Phase, completedStepIndexes: Set<number>): {
  current: number;
  total: number;
} {
  const completed = phase.stepIndexes.filter(idx => completedStepIndexes.has(idx)).length;
  return {
    current: completed,
    total: phase.stepIndexes.length
  };
}
