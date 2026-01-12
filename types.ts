
export enum NodeType {
  TRIGGER = 'TRIGGER',
  CONDITION = 'CONDITION',
  ACTION = 'ACTION',
}

export interface NodePosition {
  x: number;
  y: number;
}

export type ComparisonOperator =
  | "EQ" | "==" | "NEQ" | "!=" | "GT" | ">" | "GTE" | ">=" 
  | "LT" | "<" | "LTE" | "<=" | "IN" | "NOT_IN" 
  | "CONTAINS" | "MATCHES" | "RANGE" | "AFTER" | "BEFORE";

export interface Condition {
  field: string;
  operator: ComparisonOperator;
  value: any;
}

export interface ConditionGroup {
  operator: "AND" | "OR";
  conditions: (Condition | ConditionGroup)[];
}

export interface Action {
  type: string;
  details?: string;
  params?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  subtitle: string;
  position: NodePosition;
  data: any;
  enabled: boolean;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface TestEvent {
  type: string;
  data: Record<string, any>;
  globals: Record<string, any>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: string;
  level: 'INIT' | 'TRIGGER' | 'CONDITION' | 'ACTION' | 'SUCCESS' | 'WAIT' | 'ERROR' | 'AI' | 'TEST';
  message: string;
  details?: any;
}
