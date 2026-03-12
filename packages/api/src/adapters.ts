import {
  isAgentActor,
  type Actor,
  type AgentAdapter,
  type AgentExecutionContext,
  type AgentExecutionOutput,
} from "@crewdeck/core";

type AdapterTemplate = {
  label: string;
  summaries: string[];
  nextStatus?: AgentExecutionOutput["nextStatus"];
};

const templates: Record<string, AdapterTemplate> = {
  codex: {
    label: "Codex",
    summaries: [
      "I tightened the MVP around a local operator, shared domain rules, and a narrow workflow loop.",
      "The code path is simpler now: core rules stay pure, API owns persistence, and the board drives execution.",
      "The useful constraint is single-user operation. It removes auth complexity without weakening the product.",
    ],
  },
  "claude-code": {
    label: "Claude Code",
    summaries: [
      "Adapter surface is now explicit: the backend needs only task context, an execution result, and optional next-state intent.",
      "The current design keeps provider-specific behavior behind a small contract instead of leaking it into routes.",
      "The workflow reads clearly now: assign to an agent, collect progress, then route into review.",
    ],
    nextStatus: "review",
  },
  openclaw: {
    label: "OpenClaw",
    summaries: [
      "Review pressure is working as intended: work can bounce back to in progress without losing the thread.",
      "The board is readable because execution history is attached to the card, not spread across chat tabs.",
      "This flow is ready for stronger review automation once real adapters are wired in.",
    ],
  },
};

function createStaticAdapter(
  backend: string,
  template: AdapterTemplate,
): AgentAdapter {
  return {
    backend,
    label: template.label,
    supports(actor) {
      return isAgentActor(actor) && actor.backend === backend;
    },
    execute(context: AgentExecutionContext): AgentExecutionOutput {
      const index =
        (context.card.comments.length + context.card.runs.length) %
        template.summaries.length;
      const summary = template.summaries[index]!;

      return {
        status: "completed",
        summary,
        commentBody: `${summary}\n\nCard: ${context.card.title}`,
        nextStatus: template.nextStatus,
      };
    },
  };
}

const registry = Object.entries(templates).map(([backend, template]) =>
  createStaticAdapter(backend, template),
);

export function listAgentAdapters(): AgentAdapter[] {
  return registry;
}

export function getAgentAdapter(actor: Actor): AgentAdapter | undefined {
  return registry.find((adapter) => adapter.supports(actor));
}
