export type CardDraft = {
  title: string;
  description: string;
  assigneeId: string;
  reviewerId: string;
};

export const defaultCardDraft: CardDraft = {
  title: "",
  description: "",
  assigneeId: "agent-codex",
  reviewerId: "human-you",
};
