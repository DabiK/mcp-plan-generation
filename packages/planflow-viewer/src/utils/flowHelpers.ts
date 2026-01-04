import type { PlanDTO } from '@/types';
import type { Node, Edge } from 'reactflow';

export function planToFlowGraph(plan: PlanDTO): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Calculate layout positions (simple top-to-bottom layout)
  const VERTICAL_SPACING = 150;
  const HORIZONTAL_SPACING = 300;
  
  // Group steps by dependency level
  const levels: string[][] = [];
  const visited = new Set<string>();
  
  function getLevel(stepId: string): number {
    if (visited.has(stepId)) {
      return levels.findIndex(level => level.includes(stepId));
    }
    
    const step = plan.steps.find((s: any) => s.id === stepId);
    if (!step) return 0;
    
    if (!step.dependsOn || step.dependsOn.length === 0) {
      if (!levels[0]) levels[0] = [];
      levels[0].push(stepId);
      visited.add(stepId);
      return 0;
    }
    
    const maxDependencyLevel = Math.max(...step.dependsOn.map((depId: string) => getLevel(depId)));
    const level = maxDependencyLevel + 1;
    
    if (!levels[level]) levels[level] = [];
    levels[level].push(stepId);
    visited.add(stepId);
    
    return level;
  }
  
  // Calculate levels for all steps
  plan.steps.forEach((step: any) => getLevel(step.id));
  
  // Create nodes with positions
  plan.steps.forEach((step: any) => {
    const level = levels.findIndex(l => l.includes(step.id));
    const positionInLevel = levels[level].indexOf(step.id);
    const levelWidth = levels[level].length;
    const offsetX = (positionInLevel - (levelWidth - 1) / 2) * HORIZONTAL_SPACING;
    
    const statusColor = 
      step.status === 'completed' ? '#22c55e' :
      step.status === 'in_progress' ? '#3b82f6' :
      step.status === 'failed' ? '#ef4444' :
      '#6b7280';
    
    nodes.push({
      id: step.id,
      type: 'default',
      position: { 
        x: offsetX, 
        y: level * VERTICAL_SPACING 
      },
      data: { 
        label: `${step.title}\n${step.kind}\n${step.status}`
      },
      style: {
        background: '#18181b',
        color: '#fafafa',
        border: `2px solid ${statusColor}`,
        borderRadius: '4px',
        padding: '12px',
        width: 200,
        fontSize: '12px',
        textAlign: 'center',
      },
    });
    
    // Create edges for dependencies
    if (step.dependsOn) {
      step.dependsOn.forEach((depId: string) => {
        edges.push({
          id: `${depId}-${step.id}`,
          source: depId,
          target: step.id,
          type: 'smoothstep',
          animated: step.status === 'in_progress',
          style: { 
            stroke: '#27272a',
            strokeWidth: 2,
          },
        });
      });
    }
  });

  return { nodes, edges };
}
