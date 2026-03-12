/** Card status on the board */
export type CardStatus = "backlog" | "in_progress" | "review" | "done";

/** Who can be assigned — human or agent */
export type AssigneeType = "human" | "agent";

/** Supported agent backends */
export type AgentBackend = "codex" | "claude-code" | "openclaw" | string;

export interface Assignee {
  type: AssigneeType;
  id: string;
  name: string;
  /** Only relevant when type === "agent" */
  backend?: AgentBackend;
}

export interface Card {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  status: CardStatus;
  assignee?: Assignee;
  reviewer?: Assignee;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  /** Optional git repo URL */
  repoUrl?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  cardId: string;
  author: Assignee;
  body: string;
  createdAt: string;
}

/** Automation rule: trigger action when card enters a column */
export interface AutomationRule {
  id: string;
  boardId: string;
  /** Trigger when card moves to this status */
  onStatus: CardStatus;
  /** Action to perform */
  action: "assign_reviewer" | "notify" | "trigger_agent";
  /** Target assignee for the action */
  target: Assignee;
}
