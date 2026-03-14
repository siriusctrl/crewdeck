import type { Actor, CardStatus } from "@crewdeck/core";

export type StatusColumn = {
  status: CardStatus;
  label: string;
  eyebrow: string;
};

export const columns: StatusColumn[] = [
  { status: "inbox", label: "Inbox", eyebrow: "Collect" },
  { status: "in_progress", label: "In Progress", eyebrow: "Build" },
  { status: "review", label: "Review", eyebrow: "Challenge" },
  { status: "done", label: "Done", eyebrow: "Archive" },
];

export function formatStatus(status: CardStatus): string {
  return status.replace("_", " ");
}

export function actorLabel(
  actorId: string | undefined,
  actors: Actor[],
): string {
  if (!actorId) {
    return "Unassigned";
  }

  return actors.find((actor) => actor.id === actorId)?.name || "Unknown";
}

export function nextStatusOptions(status: CardStatus): CardStatus[] {
  switch (status) {
    case "inbox":
      return ["in_progress"];
    case "in_progress":
      return ["inbox", "review"];
    case "review":
      return ["in_progress", "done"];
    case "done":
      return ["review"];
  }
}
