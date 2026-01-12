
import React from 'react';
import yaml from 'js-yaml';
import { WorkflowNode, Connection, NodeType } from '../types';

interface YAMLViewProps {
  nodes: WorkflowNode[];
  connections: Connection[];
}

const YAMLView: React.FC<YAMLViewProps> = ({ nodes, connections }) => {
  const generateYaml = () => {
    const rules = nodes
      .filter(n => n.type === NodeType.TRIGGER)
      .map(trigger => {
        // Recursive search for all reachable logic blocks
        const visited = new Set<string>();
        const queue: string[] = [trigger.id];
        const allReachable: WorkflowNode[] = [];

        while(queue.length > 0) {
          const currentId = queue.shift()!;
          if (visited.has(currentId)) continue;
          visited.add(currentId);

          const node = nodes.find(n => n.id === currentId);
          if (node && node.id !== trigger.id) allReachable.push(node);

          const neighbors = connections
            .filter(c => c.sourceId === currentId)
            .map(c => c.targetId);
          queue.push(...neighbors);
        }

        const conditions = allReachable.filter(n => n.type === NodeType.CONDITION);
        const actions = allReachable.filter(n => n.type === NodeType.ACTION);

        const buildConditionTree = (condNodes: WorkflowNode[]): any => {
          if (condNodes.length === 0) return undefined;
          
          if (condNodes.length === 1) {
            const node = condNodes[0];
            if (node.data.mode === 'GROUP') {
              return {
                operator: node.data.logic || 'AND',
                conditions: node.data.conditions || []
              };
            } else {
              return {
                field: node.data.field || 'data.value',
                operator: node.data.operator || 'EQ',
                value: node.data.value || ''
              };
            }
          }

          return {
            operator: 'AND',
            conditions: condNodes.map(node => {
               if (node.data.mode === 'GROUP') {
                return {
                  operator: node.data.logic || 'AND',
                  conditions: node.data.conditions || []
                };
              } else {
                return {
                  field: node.data.field || 'data.value',
                  operator: node.data.operator || 'EQ',
                  value: node.data.value || ''
                };
              }
            })
          };
        };

        const buildActionTree = (actionNodes: WorkflowNode[]): any => {
          if (actionNodes.length === 0) return { type: 'NO_OP' };
          const first = actionNodes[0];
          return {
            mode: first.data.mode || 'SINGLE',
            actions: actionNodes.flatMap(a => a.data.actions || [])
          };
        };

        return {
          id: trigger.data.ruleId || trigger.id,
          name: trigger.data.name || 'Untitled Rule',
          description: trigger.data.description || '',
          priority: trigger.data.priority || 0,
          enabled: trigger.enabled,
          cooldown: trigger.data.cooldown || 0,
          tags: trigger.data.tags ? trigger.data.tags.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          on: trigger.data.eventType || 'UNKNOWN_EVENT',
          if: buildConditionTree(conditions),
          do: buildActionTree(actions)
        };
      });

    return yaml.dump(rules, { indent: 2, lineWidth: -1, noRefs: true });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 bg-slate-900 border-b border-slate-800">
        <span className="material-symbols-outlined text-emerald-400 text-sm">code</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Interpretation Engine (YAML)</span>
      </div>
      <div className="flex-1 p-6 overflow-auto custom-scrollbar bg-slate-950/50">
        <pre className="font-mono text-[11px] text-emerald-500/80 leading-relaxed whitespace-pre-wrap">
          {generateYaml()}
        </pre>
      </div>
    </div>
  );
};

export default YAMLView;
