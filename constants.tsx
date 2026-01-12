import { NodeType, WorkflowNode, Connection, LogEntry } from "./types";

export const INITIAL_NODES: WorkflowNode[] = [
  {
    id: "node-1",
    type: NodeType.TRIGGER,
    name: "TikTok Live",
    subtitle: "Stream Event Listener",
    position: { x: 100, y: 150 },
    enabled: true,
    data: {
      ruleId: "gift-tracker-v1",
      name: "Gift Handler",
      description:
        "Escucha todos los regalos entrantes en el stream de TikTok.",
      eventType: "tiktok.gift_received",
      priority: 1,
      cooldown: 500,
      tags: "stream, tiktok, gifts",
    },
  },
  {
    id: "node-2",
    type: NodeType.CONDITION,
    name: "Gift Filter",
    subtitle: "Gift Type Check",
    position: { x: 500, y: 350 },
    enabled: true,
    data: {
      mode: "SIMPLE",
      field: "data.gift.id",
      operator: "EQ",
      value: "1",
      logic: "AND",
      conditions: [],
    },
  },
  {
    id: "node-3",
    type: NodeType.ACTION,
    name: "Stream Alerts",
    subtitle: "Engagement Block",
    position: { x: 900, y: 150 },
    enabled: true,
    data: {
      mode: "SEQUENCE",
      actions: [
        {
          type: "TTS_SPEECH",
          label: "Agradecimiento TTS",
          details:
            'text: "¡{user} ha enviado un {gift}! Muchas gracias."\nvoice: "es_mx_002"\nvolume: 0.8',
        },
        {
          type: "OVERLAY_ALERT",
          label: "Pop-up Visual",
          details:
            'animation: "bounceIn"\nduration: 3000\nimage: "https://example.com/gift_glow.gif"',
        },
      ],
    },
  },
  {
    id: "node-4",
    type: NodeType.CONDITION,
    name: "High Value Gift",
    subtitle: "Multi-Condition Check",
    position: { x: 500, y: 650 },
    enabled: true,
    data: {
      mode: "GROUP",
      logic: "OR",
      conditions: [
        { field: "data.gift.id", operator: "EQ", value: "20" },
        { field: "data.coins", operator: "GTE", value: 500 },
      ],
    },
  },
];

export const INITIAL_CONNECTIONS: Connection[] = [
  { id: "conn-1", sourceId: "node-1", targetId: "node-2" },
  { id: "conn-2", sourceId: "node-2", targetId: "node-3" },
  { id: "conn-3", sourceId: "node-1", targetId: "node-4" },
  { id: "conn-4", sourceId: "node-4", targetId: "node-3" },
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: "l1",
    timestamp: new Date().toLocaleTimeString(),
    level: "INIT",
    type: "SYSTEM",
    message: "Stream Engine ready. Listening for TikTok Live socket...",
  },
];
