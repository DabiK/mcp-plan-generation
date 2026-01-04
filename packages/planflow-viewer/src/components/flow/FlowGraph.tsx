import { useMemo } from 'react';
import ReactFlow, {
    useNodesState,
    MiniMap,
    useEdgesState, ConnectionMode, Background, Controls,
} from 'reactflow';
import type {
    Node,
    Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface FlowGraphProps {
    nodes: Node[];
    edges: Edge[];
}

export default function FlowGraph({ nodes: initialNodes, edges: initialEdges }: FlowGraphProps) {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    return (
        <div className="w-full h-[600px] border border-border bg-background">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                connectionMode={ConnectionMode.Loose}
                fitView
                fitViewOptions={{
                    padding: 0.2,
                }}
                minZoom={0.1}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            >
                <Background
                    color="#27272a"
                    gap={16}
                    size={1}
                />
                <Controls
                    className="border border-border bg-background"
                />
                <MiniMap
                    nodeColor="#27272a"
                    maskColor="rgba(9, 9, 11, 0.8)"
                    className="border border-border bg-background"
                />
            </ReactFlow>
        </div>
    );
}
