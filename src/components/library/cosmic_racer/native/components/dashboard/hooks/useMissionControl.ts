import { useMemo } from 'react';
import treeData from '../../../state/data/progression_tree.json';

export interface MissionControlState {
  octaveCurrency: Record<number, number>;
  buildings: any[];
  inventory: any;
  activeOctave: number;
  completedTasks: Record<string, boolean>;
  empireResources?: any;
  legacyOfficers?: any[];
  activeCrew?: any[];
  highCouncil?: any[];
  setHighCouncil?: (hc: any[]) => void;
}

export function useMissionControl(state: MissionControlState) {
  const { octaveCurrency, buildings, inventory, activeOctave, completedTasks, empireResources, legacyOfficers, activeCrew, highCouncil, setHighCouncil } = state;

  return useMemo(() => {
    // 1. First, we need to evaluate every single subTask across the entire tree
    // so we know exactly which Nodes are `COMPLETED`.
    
    const evaluateCondition = (cond: any, id: string): boolean => {
      if (completedTasks[id]) return true; // Manual override shortcut

      if (!cond) return false;
      if (cond.type === "RESOURCE") {
        return (octaveCurrency[cond.octave] || 0) >= cond.amount;
      }
      if (cond.type === "BUILDING") {
        return buildings.some(b => b.category === cond.category);
      }
      if (cond.type === "EQUIPMENT") {
        if (cond.key === "shieldLevel") {
          return (inventory?.shieldLevel || 0) >= cond.amount;
        }
        return !!inventory[cond.key];
      }
      if (cond.type === "TROOPS") {
        return (empireResources?.troops || 0) >= cond.amount;
      }
      if (cond.type === "SHIP_UNLOCK") {
        return (inventory?.unlockedShips || []).includes(cond.shipId);
      }
      if (cond.type === "OCTAVE") {
        return activeOctave <= cond.target;
      }
      if (cond.type === "OCTAVE_UP") {
        return activeOctave >= cond.target;
      }
      if (cond.type === "MANUAL_TASK") {
        return !!completedTasks[cond.key];
      }
      return false;
    };

    // Build a map of node completion statuses to easily resolve prerequisites.
    const nodeStatusMap: Record<string, 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED'> = {};

    // Clone tree data to inject statuses safely
    const parsedData = JSON.parse(JSON.stringify(treeData));

    // First pass: Evaluate raw completion of subtasks
    parsedData.archetypes.forEach((arc: any) => {
      arc.nodes.forEach((node: any) => {
        let tasksDone = 0;
        node.subTasks.forEach((st: any) => {
          st.done = evaluateCondition(st.condition, st.id);
          // Inject live progress for RESOURCE conditions
          if (st.condition?.type === 'RESOURCE') {
            const current = Math.min(
              octaveCurrency[st.condition.octave] || 0,
              st.condition.amount
            );
            st.progress = { current, max: st.condition.amount };
          }
          if (st.done) tasksDone++;
        });
        node.allTasksDone = (tasksDone === node.subTasks.length);
      });
    });


    // Second pass: Evaluate DAG Locks using prerequisites
    // Since it's a DAG, we can iteratively resolve until no more changes happen (or just a few times)
    let changed = true;
    while (changed) {
      changed = false;
      parsedData.archetypes.forEach((arc: any) => {
        arc.nodes.forEach((node: any) => {
          if (nodeStatusMap[node.id]) return; // Already resolved

          // Evaluate prereqs
          let prereqsMet = true;
          for (const req of node.prerequisites) {
            if (nodeStatusMap[req] !== 'COMPLETED') {
              prereqsMet = false;
              break;
            }
          }

          if (prereqsMet) {
            const newStatus = node.allTasksDone ? 'COMPLETED' : 'IN_PROGRESS';
            nodeStatusMap[node.id] = newStatus;
            node.status = newStatus;
            changed = true;
          } else {
            // Not met yet, leave undefined or force locked
            node.status = 'LOCKED';
          }
        });
      });
    }

    return parsedData;

  }, [octaveCurrency, buildings, inventory, activeOctave, completedTasks, empireResources]);
}
