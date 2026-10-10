import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Roadmap, SkillNode as SkillNodeType } from '../types';
import { CustomSkillNode } from './CustomSkillNode';

interface Props {
  roadmap: Roadmap;
  selectedNodeId: string | null;
  onNodeClick: (node: SkillNodeType) => void;
}

const nodeTypes: NodeTypes = { skill: CustomSkillNode };



export function RoadmapGraph({ roadmap, selectedNodeId, onNodeClick }: Props) {
  // Build React Flow nodes with auto-layout by level
  const levelGroups = useMemo(() => {
    const groups: Record<number, SkillNodeType[]> = {};
    for (const node of roadmap.nodes) {
      const lvl = node.level || 1;
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(node);
    }
    return groups;
  }, [roadmap.nodes]);

  const flowNodes: Node[] = useMemo(() => {
    return roadmap.nodes.map(node => {
      const lvl = node.level || 1;
      const groupNodes = levelGroups[lvl] || [node];
      const idx = groupNodes.indexOf(node);
      const count = groupNodes.length;
      const x = (lvl - 1) * 300;
      const ySpacing = Math.max(120, 700 / count);
      const yStart = -(count - 1) * ySpacing / 2;
      const y = yStart + idx * ySpacing;

      return {
        id: node.id,
        type: 'skill',
        position: { x, y },
        data: {
          skillNode: node,
          isSelected: node.id === selectedNodeId,
          onClick: () => onNodeClick(node),
        },
      };
    });
  }, [roadmap.nodes, levelGroups, selectedNodeId, onNodeClick]);

  const flowEdges: Edge[] = useMemo(() => {
    return roadmap.edges.map(e => ({
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#334155', strokeWidth: 1.5 },
      markerEnd: { type: 'arrowclosed' as const, color: '#475569', width: 14, height: 14 },
    }));
  }, [roadmap.edges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const skillNode = roadmap.nodes.find(n => n.id === node.id);
      if (skillNode) onNodeClick(skillNode);
    },
    [roadmap.nodes, onNodeClick]
  );


  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e293b" />
        <Controls />
        <MiniMap
          nodeColor={node => {
            const skill = roadmap.nodes.find(n => n.id === node.id);
            if (!skill) return '#1e293b';
            if (skill.status === 'completed') return '#10b981';
            if (skill.status === 'in_progress') return '#f59e0b';
            return '#6366f1';
          }}
          maskColor="rgba(7,11,20,0.8)"
        />
      </ReactFlow>
    </div>
  );
}
