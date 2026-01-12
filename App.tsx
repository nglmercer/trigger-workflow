import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  WorkflowNode,
  Connection,
  LogEntry,
  NodeType,
  TestEvent,
} from "./types";
import { INITIAL_NODES, INITIAL_CONNECTIONS, INITIAL_LOGS } from "./constants";
import Node from "./components/Node";
import CreationModal from "./components/CreationModal";
import Debugger from "./components/Debugger";
import YAMLView from "./components/YAMLView";
import TestEditor from "./components/TestEditor";
import { TopHUD, RightHUD, BottomLeftHUD } from "./components/HUD";
import { executeWorkflow, validateWorkflow } from "./services/workflowExecutor";

interface ConnectionDrag {
  sourceId: string;
  side: "left" | "right";
  startX: number;
  startY: number;
}

interface HoveredSocket {
  nodeId: string;
  side: "left" | "right";
}

const NODE_WIDTH = 320;
const HEADER_CENTER_Y = 34; // Relative to node top. Although we now use DOM-based targeting, we keep this as a safe fallback.

const App: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [connections, setConnections] =
    useState<Connection[]>(INITIAL_CONNECTIONS);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [zoom, setZoom] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showYaml, setShowYaml] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);

  const [dragConn, setDragConn] = useState<ConnectionDrag | null>(null);
  const [hoveredSocket, setHoveredSocket] = useState<HoveredSocket | null>(
    null,
  );
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Dynamic Workspace Bounds calculation
  const workspaceSize = useMemo(() => {
    let maxX = window.innerWidth;
    let maxY = window.innerHeight;
    nodes.forEach((n) => {
      maxX = Math.max(maxX, n.position.x + 1000);
      maxY = Math.max(maxY, n.position.y + 1000);
    });
    return { width: maxX, height: maxY };
  }, [nodes]);

  const getWorkspaceCoords = (e: MouseEvent | React.MouseEvent) => {
    if (!workspaceRef.current) return { x: e.pageX, y: e.pageY };
    const rect = workspaceRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left + workspaceRef.current.scrollLeft) / zoom,
      y: (e.clientY - rect.top + workspaceRef.current.scrollTop) / zoom,
    };
  };

  // Cache for socket coordinates to avoid repeated DOM queries
  const socketCache = useRef<Map<string, { x: number; y: number; timestamp: number }>>(new Map());

  const getSocketCoords = (nodeId: string, side: "left" | "right") => {
    const cacheKey = `${nodeId}-${side}`;
    const now = Date.now();
    const cached = socketCache.current.get(cacheKey);
    
    // Use cache if valid (less than 16ms old, ~60fps)
    if (cached && now - cached.timestamp < 16) {
      return { x: cached.x, y: cached.y };
    }

    const el = document.getElementById(`socket-${side}-${nodeId}`);
    if (el && workspaceRef.current) {
      const socketRect = el.getBoundingClientRect();
      const workspaceRect = workspaceRef.current.getBoundingClientRect();
      // Calculate the position relative to the workspace container
      // Since the workspace is transformed by zoom, we need to divide by zoom
      const relativeX = socketRect.left - workspaceRect.left;
      const relativeY = socketRect.top - workspaceRect.top;
      const coords = {
        x: (relativeX + workspaceRef.current.scrollLeft) / zoom,
        y: (relativeY + workspaceRef.current.scrollTop) / zoom,
      };
      // Cache the result
      socketCache.current.set(cacheKey, { ...coords, timestamp: now });
      return coords;
    }
    // Fallback if element not found (e.g. during first render)
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const coords = {
      x: side === "right" ? node.position.x + NODE_WIDTH : node.position.x,
      y: node.position.y + HEADER_CENTER_Y,
    };
    socketCache.current.set(cacheKey, { ...coords, timestamp: now });
    return coords;
  };

  const handleNodeDrag = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, position: { x, y } } : n)),
    );
  }, []);

  const handleUpdateNodeData = useCallback((id: string, newData: any) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, data: newData } : n)),
    );
  }, []);

  const handleToggleEnabled = useCallback((id: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)),
    );
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) =>
      prev.filter((c) => c.sourceId !== id && c.targetId !== id),
    );
  }, []);

  const handleDeleteConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const onSocketMouseDown = (
    id: string,
    side: "left" | "right",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const coords = getSocketCoords(id, side);
    setDragConn({
      sourceId: id,
      side: side,
      startX: coords.x,
      startY: coords.y,
    });
    setMousePos(getWorkspaceCoords(e));
  };

  const onSocketMouseEnter = (id: string, side: "left" | "right") => {
    if (dragConn) setHoveredSocket({ nodeId: id, side });
  };

  const onSocketMouseLeave = () => setHoveredSocket(null);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragConn) setMousePos(getWorkspaceCoords(e));
    };

    const handleGlobalMouseUp = () => {
      if (dragConn && hoveredSocket) {
        const isValid =
          (dragConn.side === "right" && hoveredSocket.side === "left") ||
          (dragConn.side === "left" && hoveredSocket.side === "right");

        if (isValid && dragConn.sourceId !== hoveredSocket.nodeId) {
          const sourceId =
            dragConn.side === "right"
              ? dragConn.sourceId
              : hoveredSocket.nodeId;
          const targetId =
            dragConn.side === "left" ? dragConn.sourceId : hoveredSocket.nodeId;

          if (
            !connections.some(
              (c) => c.sourceId === sourceId && c.targetId === targetId,
            )
          ) {
            setConnections((prev) => [
              ...prev,
              { id: `conn-${Date.now()}`, sourceId, targetId },
            ]);
          }
        }
      }
      setDragConn(null);
      setHoveredSocket(null);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragConn, hoveredSocket, connections]);

  const createNode = (type: NodeType) => {
    const id = `node-${Date.now()}`;
    let data: any = {};
    let subtitle = "";
    let name = "";

    switch (type) {
      case NodeType.TRIGGER:
        name = "Trigger";
        subtitle = "Event Listener";
        data = {
          ruleId: `rule-${Date.now().toString(36)}`,
          name: "New Rule",
          description: "",
          eventType: "http.request",
          priority: 1,
          cooldown: 0,
          tags: "",
        };
        break;
      case NodeType.CONDITION:
        name = "Condition";
        subtitle = "Logical Gate";
        data = {
          mode: "SIMPLE",
          logic: "AND",
          conditions: [{ field: "data.value", operator: "EQ", value: 100 }],
          field: "data.value",
          operator: "EQ",
          value: 100,
        };
        break;
      case NodeType.ACTION:
        name = "Action Group";
        subtitle = "Effect Executer";
        data = {
          mode: "SEQUENCE",
          actions: [{ type: "STATE_SET", details: "key: value" }],
        };
        break;
    }

    const newNode: WorkflowNode = {
      id,
      type,
      name,
      subtitle,
      position: {
        x: (workspaceRef.current?.scrollLeft || 0) + 100,
        y: (workspaceRef.current?.scrollTop || 0) + 100,
      },
      enabled: true,
      data,
    };

    setNodes((prev) => [...prev, newNode]);
    setShowModal(false);
  };

  const simulateWorkflow = async (testEvent?: TestEvent) => {
    setIsDeploying(true);
    setShowDebugger(true);

    // Create test event if not provided
    const defaultTestEvent: TestEvent = {
      type: "tiktok.gift_received",
      data: {
        gift: {
          id: 16,
          name: "Galaxy",
          coins: 500,
          type: "gift",
        },
        user: {
          username: "test_user",
          id: "123456",
        },
        coins: 500,
      },
      globals: {},
    };

    const eventToExecute = testEvent || defaultTestEvent;
    const eventType = eventToExecute?.type || "simulation.default";

    // Add init log
    setLogs((prev) => [
      {
        id: `l-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: testEvent ? "TEST" : "INIT",
        type: "SIMULATION",
        message: testEvent
          ? `Starting test run for event: ${eventType}`
          : "Starting engine simulation...",
        details: {
          eventType,
          eventData: eventToExecute.data,
        },
      },
      ...prev,
    ]);

    try {
      // Validate workflow first
      const validation = validateWorkflow(nodes, connections);
      if (!validation.valid) {
        setLogs((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            level: "ERROR",
            type: "SYSTEM",
            message: "Workflow validation failed",
            details: { errors: validation.errors },
          },
        ]);
        setIsDeploying(false);
        return;
      }

      // Execute workflow
      const result = await executeWorkflow(nodes, connections, eventToExecute);

      // Add execution logs
      setLogs((prev) => [
        ...result.logs,
        {
          id: `exec-${Date.now()}-complete`,
          timestamp: new Date().toLocaleTimeString(),
          level: result.success ? "SUCCESS" : "ERROR",
          type: "ENGINE",
          message: result.success
            ? "Workflow execution completed successfully"
            : "Workflow execution failed",
          details: {
            success: result.success,
            executedNodes: result.executedNodes.length,
            error: result.error,
          },
        },
        ...prev,
      ]);
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: "ERROR",
          type: "SYSTEM",
          message: "Engine execution failed",
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        },
      ]);
    } finally {
      setIsDeploying(false);
    }
  };

  // Save state to localStorage
  useEffect(() => {
    const state = {
      nodes,
      connections,
      logs,
      zoom,
    };
    localStorage.setItem("agnostic-trigger-workflow", JSON.stringify(state));
  }, [nodes, connections, logs, zoom]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("agnostic-trigger-workflow");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.nodes) setNodes(state.nodes);
        if (state.connections) setConnections(state.connections);
        if (state.logs) setLogs(state.logs);
        if (state.zoom) setZoom(state.zoom);
      } catch (error) {
        console.error("Failed to load state from localStorage:", error);
      }
    }
  }, []);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const togglePanel = (panel: "yaml" | "test" | "debug") => {
    if (panel === "yaml") {
      setShowYaml(!showYaml);
      setShowTestPanel(false);
      setShowDebugger(false);
    } else if (panel === "test") {
      setShowTestPanel(!showTestPanel);
      setShowYaml(false);
      setShowDebugger(false);
    } else {
      setShowDebugger(!showDebugger);
      setShowYaml(false);
      setShowTestPanel(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background-dark font-sans select-none">
      <div className="absolute inset-0 dot-grid opacity-30 z-0 pointer-events-none" />

      <main
        ref={workspaceRef}
        className="relative inset-0 w-full h-full z-20 overflow-auto cursor-grab active:cursor-grabbing custom-scrollbar scroll-smooth"
      >
        <div
          style={{
            width: workspaceSize.width,
            height: workspaceSize.height,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            transition: "transform 0.05s ease-out",
          }}
          className="relative"
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            {dragConn && (
              <path
                d={`M ${dragConn.startX} ${dragConn.startY} C ${dragConn.startX + (dragConn.side === "right" ? 100 : -100)} ${dragConn.startY}, ${mousePos.x + (dragConn.side === "right" ? -100 : 100)} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                fill="none"
                stroke="#135bec"
                strokeWidth="3"
                strokeDasharray="6 6"
                className="opacity-60"
              />
            )}
            {connections.map((conn) => {
              const source = nodes.find((n) => n.id === conn.sourceId);
              const target = nodes.find((n) => n.id === conn.targetId);
              if (!source || !target) return null;

              const start = getSocketCoords(conn.sourceId, "right");
              const end = getSocketCoords(conn.targetId, "left");

              const dist = Math.abs(end.x - start.x);
              const cpOffset = Math.max(80, dist / 2.5);
              const path = `M ${start.x} ${start.y} C ${start.x + cpOffset} ${start.y}, ${end.x - cpOffset} ${end.y}, ${end.x} ${end.y}`;

              const mx = start.x + (end.x - start.x) / 2,
                my = start.y + (end.y - start.y) / 2;
              const color =
                source.enabled && target.enabled ? "#3b82f6" : "#334155";
              return (
                <g key={conn.id} className="group/conn pointer-events-auto">
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="transition-opacity duration-150 opacity-60 group-hover/conn:opacity-100"
                  />
                  <g
                    className="cursor-pointer"
                    onClick={() => handleDeleteConnection(conn.id)}
                  >
                    <circle
                      cx={mx}
                      cy={my}
                      r="14"
                      fill="#0f172a"
                      className="opacity-0 group-hover/conn:opacity-100 shadow-2xl transition-opacity duration-150 stroke-slate-700"
                      strokeWidth="1"
                    />
                    <text
                      x={mx}
                      y={my + 4}
                      textAnchor="middle"
                      className="opacity-0 group-hover/conn:opacity-100 fill-red-500 font-bold text-base select-none"
                    >
                      ×
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
          {nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              onDrag={handleNodeDrag}
              onUpdateData={handleUpdateNodeData}
              onToggleEnabled={handleToggleEnabled}
              onDelete={handleDeleteNode}
              onSocketMouseDown={onSocketMouseDown}
              onSocketMouseEnter={onSocketMouseEnter}
              onSocketMouseLeave={onSocketMouseLeave}
              isDraggingConnection={!!dragConn}
            />
          ))}
        </div>
      </main>

      <TopHUD nodeCount={nodes.length} />
      <RightHUD
        onDeploy={() => simulateWorkflow()}
        isDeploying={isDeploying}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        zoom={zoom}
      />

      <div className="fixed bottom-6 left-6 flex flex-col gap-2 z-40">
        <BottomLeftHUD onAddNode={() => setShowModal(true)} />

        <div className="flex flex-col gap-2">
          <button
            onClick={() => togglePanel("debug")}
            className={`size-11 flex items-center justify-center rounded-xl backdrop-blur-xl border border-slate-700/50 shadow-2xl transition-all ${showDebugger ? "bg-red-500 text-white" : "bg-slate-900/70 text-slate-400 hover:text-white ring-1 ring-white/5"}`}
            title="Live Debugger"
          >
            <span className="material-symbols-outlined">bug_report</span>
          </button>

          <button
            onClick={() => togglePanel("test")}
            className={`size-11 flex items-center justify-center rounded-xl backdrop-blur-xl border border-slate-700/50 shadow-2xl transition-all ${showTestPanel ? "bg-purple-500 text-white" : "bg-slate-900/70 text-slate-400 hover:text-white ring-1 ring-white/5"}`}
            title="Test Engine"
          >
            <span className="material-symbols-outlined">science</span>
          </button>

          <button
            onClick={() => togglePanel("yaml")}
            className={`size-11 flex items-center justify-center rounded-xl backdrop-blur-xl border border-slate-700/50 shadow-2xl transition-all ${showYaml ? "bg-emerald-500 text-white" : "bg-slate-900/70 text-slate-400 hover:text-white ring-1 ring-white/5"}`}
            title="YAML View"
          >
            <span className="material-symbols-outlined">description</span>
          </button>
        </div>
      </div>

      {showDebugger && (
        <aside className="fixed top-0 bottom-0 right-0 w-[400px] z-50 animate-in slide-in-from-right duration-300">
          <Debugger
            logs={logs}
            onClose={() => setShowDebugger(false)}
            onClear={() => setLogs(INITIAL_LOGS)}
          />
        </aside>
      )}

      {showYaml && (
        <aside className="fixed top-14 bottom-0 right-6 w-96 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-l-2xl shadow-3xl z-[45] animate-in slide-in-from-right duration-300 ring-1 ring-white/5">
          <YAMLView nodes={nodes} connections={connections} />
        </aside>
      )}

      {showTestPanel && (
        <aside className="fixed top-14 bottom-0 right-6 w-96 z-[45] animate-in slide-in-from-right duration-300">
          <TestEditor
            onRunTest={(e) => simulateWorkflow(e)}
            onClose={() => setShowTestPanel(false)}
          />
        </aside>
      )}

      {showModal && (
        <CreationModal
          onClose={() => setShowModal(false)}
          onCreate={createNode}
        />
      )}
    </div>
  );
};

export default App;
