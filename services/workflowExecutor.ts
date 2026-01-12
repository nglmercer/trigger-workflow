import {
  WorkflowNode,
  Connection,
  LogEntry,
  NodeType,
  TestEvent,
} from "../types";

export interface ExecutionResult {
  success: boolean;
  logs: LogEntry[];
  executedNodes: string[];
  failedNode?: string;
  error?: string;
}

export interface ExecutionContext {
  event: TestEvent;
  data: Record<string, any>;
  globals: Record<string, any>;
  variables: Record<string, any>;
}

class WorkflowExecutor {
  private nodes: WorkflowNode[];
  private connections: Connection[];
  private logs: LogEntry[] = [];
  private executedNodes: Set<string> = new Set();
  private nodeConditions = new Map<string, boolean>();

  constructor(nodes: WorkflowNode[], connections: Connection[]) {
    this.nodes = nodes.filter((n) => n.enabled);
    this.connections = connections;
  }

  /**
   * Execute workflow for a given event
   */
  async execute(event: TestEvent): Promise<ExecutionResult> {
    this.logs = [];
    this.executedNodes = new Set();
    this.nodeConditions = new Map();

    const context: ExecutionContext = {
      event,
      data: event.data || {},
      globals: event.globals || {},
      variables: {},
    };

    // Find trigger nodes
    const triggerNodes = this.findTriggerNodes();

    if (triggerNodes.length === 0) {
      this.addLog({
        id: `exec-${Date.now()}-no-trigger`,
        timestamp: new Date().toLocaleTimeString(),
        level: "ERROR",
        type: "ENGINE",
        message: "No enabled trigger nodes found",
        details: { event: event.type },
      });

      return {
        success: false,
        logs: this.logs,
        executedNodes: [],
        error: "No trigger nodes found",
      };
    }

    // Execute all trigger nodes
    for (const triggerNode of triggerNodes) {
      if (!this.shouldExecuteTrigger(triggerNode, event)) {
        continue;
      }

      await this.executeNode(triggerNode, context);
    }

    // Propagate through connected nodes
    await this.propagateExecution(context);

    return {
      success: true,
      logs: this.logs,
      executedNodes: Array.from(this.executedNodes),
    };
  }

  /**
   * Find all trigger nodes in workflow
   */
  private findTriggerNodes(): WorkflowNode[] {
    return this.nodes.filter((n) => n.type === NodeType.TRIGGER);
  }

  /**
   * Check if a trigger should fire based on event type
   */
  private shouldExecuteTrigger(
    triggerNode: WorkflowNode,
    event: TestEvent,
  ): boolean {
    const eventType = triggerNode.data.eventType || "any";

    if (eventType === "any") return true;

    // Support wildcard patterns (e.g., "tiktok.*")
    if (eventType.includes("*")) {
      const pattern = eventType.replace(/\*/g, ".*");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(event.type);
    }

    return event.type === eventType;
  }

  /**
   * Propagate execution through connected nodes
   */
  private async propagateExecution(context: ExecutionContext): Promise<void> {
    let changed = true;
    const maxIterations = 100; // Prevent infinite loops
    let iterations = 0;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const node of this.nodes) {
        if (this.executedNodes.has(node.id)) continue;
        if (node.type === NodeType.TRIGGER) continue;

        // Check if all parent nodes have been executed
        const parentConnections = this.connections.filter(
          (c) => c.targetId === node.id,
        );

        if (parentConnections.length === 0) continue;

        const allParentsExecuted = parentConnections.every((c) =>
          this.executedNodes.has(c.sourceId),
        );

        if (!allParentsExecuted) continue;

        // Check if any parent node passed conditions
        const anyParentPassed = parentConnections.some((c) =>
          this.nodePassedCondition(c.sourceId),
        );

        if (!anyParentPassed) continue;

        await this.executeNode(node, context);
        changed = true;
      }
    }

    if (iterations >= maxIterations) {
      this.addLog({
        id: `exec-${Date.now()}-timeout`,
        timestamp: new Date().toLocaleTimeString(),
        level: "ERROR",
        type: "ENGINE",
        message: "Workflow execution timeout - possible infinite loop",
        details: { iterations },
      });
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: WorkflowNode,
    context: ExecutionContext,
  ): Promise<void> {
    this.addLog({
      id: `exec-${Date.now()}-${node.id}-start`,
      timestamp: new Date().toLocaleTimeString(),
      level: "INIT",
      type: "ENGINE",
      message: `Executing ${node.type} node: ${node.name}`,
      details: { nodeId: node.id, nodeType: node.type },
    });

    try {
      switch (node.type) {
        case NodeType.TRIGGER:
          await this.executeTrigger(node, context);
          break;
        case NodeType.CONDITION:
          await this.executeCondition(node, context);
          break;
        case NodeType.ACTION:
          await this.executeAction(node, context);
          break;
      }

      this.executedNodes.add(node.id);
    } catch (error) {
      this.addLog({
        id: `exec-${Date.now()}-${node.id}-error`,
        timestamp: new Date().toLocaleTimeString(),
        level: "ERROR",
        type: "ENGINE",
        message: `Error executing ${node.type}: ${node.name}`,
        details: { nodeId: node.id, error: String(error) },
      });
    }
  }

  /**
   * Execute a trigger node
   */
  private async executeTrigger(
    node: WorkflowNode,
    context: ExecutionContext,
  ): Promise<void> {
    const eventType = node.data.eventType || "unknown";
    const eventData = context.data;

    this.addLog({
      id: `exec-${Date.now()}-${node.id}-trigger`,
      timestamp: new Date().toLocaleTimeString(),
      level: "TRIGGER",
      type: "ENGINE",
      message: `Trigger fired: ${node.data.name}`,
      details: {
        nodeId: node.id,
        eventType,
        eventData: this.sanitizeData(eventData),
        priority: node.data.priority || 1,
      },
    });

    // Mark trigger as passed (triggers always pass)
    this.nodeConditions.set(node.id, true);
  }

  /**
   * Execute a condition node
   */
  private async executeCondition(
    node: WorkflowNode,
    context: ExecutionContext,
  ): Promise<void> {
    const mode = node.data.mode || "SIMPLE";
    let passed = false;

    if (mode === "SIMPLE") {
      passed = this.evaluateSimpleCondition(node.data, context);
    } else if (mode === "GROUP") {
      passed = this.evaluateGroupCondition(node.data, context);
    }

    this.addLog({
      id: `exec-${Date.now()}-${node.id}-condition`,
      timestamp: new Date().toLocaleTimeString(),
      level: "CONDITION",
      type: "ENGINE",
      message: `Condition ${passed ? "PASSED" : "FAILED"}: ${node.name}`,
      details: {
        nodeId: node.id,
        mode,
        passed,
        condition: this.sanitizeData(node.data),
      },
    });

    // Store condition result for propagation
    this.nodeConditions.set(node.id, passed);
  }

  /**
   * Execute an action node
   */
  private async executeAction(
    node: WorkflowNode,
    context: ExecutionContext,
  ): Promise<void> {
    const actions = node.data.actions || [];
    const mode = node.data.mode || "SINGLE";

    this.addLog({
      id: `exec-${Date.now()}-${node.id}-action-start`,
      timestamp: new Date().toLocaleTimeString(),
      level: "ACTION",
      type: "ENGINE",
      message: `Executing ${actions.length} action(s) in ${mode} mode`,
      details: {
        nodeId: node.id,
        mode,
        actionCount: actions.length,
        actions: actions.map((a: any) => ({
          type: a.type,
          label: a.label || "Unnamed",
        })),
      },
    });

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      await this.executeSingleAction(action, i, context);

      // Add delay between actions in sequence mode
      if (mode === "SEQUENCE" && i < actions.length - 1) {
        await this.delay(100);
      }
    }

    this.addLog({
      id: `exec-${Date.now()}-${node.id}-action-complete`,
      timestamp: new Date().toLocaleTimeString(),
      level: "ACTION",
      type: "ENGINE",
      message: `Actions completed: ${node.name}`,
      details: { nodeId: node.id, totalActions: actions.length },
    });

    // Mark action as passed (actions always pass)
    this.nodeConditions.set(node.id, true);
  }

  /**
   * Execute a single action
   */
  private async executeSingleAction(
    action: any,
    index: number,
    context: ExecutionContext,
  ): Promise<void> {
    this.addLog({
      id: `exec-${Date.now()}-action-${index}`,
      timestamp: new Date().toLocaleTimeString(),
      level: "ACTION",
      type: "ENGINE",
      message: `Executing action [${index + 1}]: ${action.type}`,
      details: {
        actionType: action.type,
        label: action.label,
        details: action.details,
        params: action.params,
      },
    });

    // Simulate action execution
    await this.delay(50);
  }

  /**
   * Evaluate a simple condition
   */
  private evaluateSimpleCondition(
    conditionData: any,
    context: ExecutionContext,
  ): boolean {
    const fieldPath = conditionData.field || "";
    const operator = conditionData.operator || "EQ";
    const expectedValue = conditionData.value;
    const actualValue = this.getValueFromPath(fieldPath, context);

    return this.compareValues(actualValue, operator, expectedValue);
  }

  /**
   * Evaluate a group condition (AND/OR logic)
   */
  private evaluateGroupCondition(
    conditionData: any,
    context: ExecutionContext,
  ): boolean {
    const logic = conditionData.logic || "AND";
    const conditions = conditionData.conditions || [];

    if (conditions.length === 0) return true;

    const results = conditions.map((cond: any) =>
      this.evaluateSimpleCondition(cond, context),
    );

    if (logic === "AND") {
      return results.every((r) => r === true);
    } else if (logic === "OR") {
      return results.some((r) => r === true);
    }

    return false;
  }

  /**
   * Get value from a dot-separated path
   */
  private getValueFromPath(path: string, context: ExecutionContext): any {
    if (!path) return undefined;

    const parts = path.split(".");
    let value: any = {
      ...context.data,
      ...context.event,
      ...context.globals,
    };

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Compare values using specified operator
   */
  private compareValues(actual: any, operator: string, expected: any): boolean {
    // Convert to appropriate types
    const actualNum = Number(actual);
    const expectedNum = Number(expected);
    const actualStr = String(actual || "").toLowerCase();
    const expectedStr = String(expected || "").toLowerCase();

    switch (operator) {
      case "EQ":
      case "==":
        return actual == expected;
      case "NEQ":
      case "!=":
        return actual != expected;
      case "GT":
      case ">":
        return (
          !isNaN(actualNum) && !isNaN(expectedNum) && actualNum > expectedNum
        );
      case "LT":
      case "<":
        return (
          !isNaN(actualNum) && !isNaN(expectedNum) && actualNum < expectedNum
        );
      case "GTE":
      case ">=":
        return (
          !isNaN(actualNum) && !isNaN(expectedNum) && actualNum >= expectedNum
        );
      case "LTE":
      case "<=":
        return (
          !isNaN(actualNum) && !isNaN(expectedNum) && actualNum <= expectedNum
        );
      case "CONTAINS":
        return actualStr.includes(expectedStr);
      case "MATCHES":
        try {
          const regex = new RegExp(expectedStr);
          return regex.test(actualStr);
        } catch {
          return false;
        }
      case "IN":
        const expectedArray = String(expected)
          .split(",")
          .map((s) => s.trim());
        return expectedArray.includes(String(actual));
      case "NOT_IN":
        const excludeArray = String(expected)
          .split(",")
          .map((s) => s.trim());
        return !excludeArray.includes(String(actual));
      case "RANGE":
        const [min, max] = String(expected).split(",").map(Number);
        return (
          !isNaN(actualNum) &&
          !isNaN(min) &&
          !isNaN(max) &&
          actualNum >= min &&
          actualNum <= max
        );
      default:
        return false;
    }
  }

  /**
   * Check if a node passed its condition
   */
  private nodePassedCondition(nodeId: string): boolean {
    // Trigger and Action nodes always pass
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return false;
    if (node.type === NodeType.TRIGGER || node.type === NodeType.ACTION) {
      return true;
    }

    return this.nodeConditions.get(nodeId) === true;
  }

  /**
   * Add a log entry
   */
  private addLog(log: LogEntry): void {
    this.logs.push(log);
  }

  /**
   * Sanitize data for logging (remove sensitive info)
   */
  private sanitizeData(data: any): any {
    const sanitized = { ...data };

    // Remove sensitive fields
    const sensitiveFields = ["password", "token", "secret", "apiKey"];
    for (const field of sensitiveFields) {
      if (sanitized[field] !== undefined) {
        sanitized[field] = "***REDACTED***";
      }
    }

    return sanitized;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Execute a workflow with given nodes, connections, and test event
 */
export async function executeWorkflow(
  nodes: WorkflowNode[],
  connections: Connection[],
  event: TestEvent,
): Promise<ExecutionResult> {
  const executor = new WorkflowExecutor(nodes, connections);
  return await executor.execute(event);
}

/**
 * Validate a workflow configuration
 */
export function validateWorkflow(
  nodes: WorkflowNode[],
  connections: Connection[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for orphaned nodes
  const connectedNodeIds = new Set([
    ...connections.map((c) => c.sourceId),
    ...connections.map((c) => c.targetId),
  ]);

  for (const node of nodes) {
    if (node.type !== NodeType.TRIGGER && !connectedNodeIds.has(node.id)) {
      errors.push(`Node "${node.name}" (${node.id}) is not connected`);
    }
  }

  // Check for circular dependencies (simple check)
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoing = connections.filter((c) => c.sourceId === nodeId);
    for (const conn of outgoing) {
      if (!visited.has(conn.targetId)) {
        if (hasCycle(conn.targetId)) return true;
      } else if (recursionStack.has(conn.targetId)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        errors.push("Circular dependency detected in workflow");
        break;
      }
    }
  }

  // Check for multiple triggers (warning)
  const triggers = nodes.filter((n) => n.type === NodeType.TRIGGER);
  if (triggers.length === 0) {
    errors.push("No trigger node found in workflow");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default WorkflowExecutor;
