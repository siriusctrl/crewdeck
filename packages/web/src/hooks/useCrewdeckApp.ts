import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import type { Actor, Board, Card, CardDetail, CardStatus } from "@crewdeck/core";
import { canTransitionCard, cardStatuses } from "@crewdeck/core";

import {
  createCard as createCardRequest,
  createComment,
  getBoardSnapshot,
  getCard,
  listActors,
  listBoards,
  pingAgent,
  updateCardAssignment,
  updateCardStatus,
} from "../api";
import { defaultCardDraft, type CardDraft } from "../lib/draft";

const humanActorId = "human-you";

export function useCrewdeckApp() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>();
  const [selectedCardId, setSelectedCardId] = useState<string>();
  const [selectedCard, setSelectedCard] = useState<CardDetail>();
  const [detailTab, setDetailTab] = useState<"runs" | "discussion">("runs");
  const [draggedCardId, setDraggedCardId] = useState<string>();
  const [dragOverStatus, setDragOverStatus] = useState<CardStatus>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [draft, setDraft] = useState<CardDraft>(defaultCardDraft);
  const [commentBody, setCommentBody] = useState("");
  const dragSourceCardIdRef = useRef<string>();

  const selectedBoard = boards.find((board) => board.id === selectedBoardId);
  const draggedCard = cards.find((card) => card.id === draggedCardId);

  const groupedCards = useMemo(() => {
    return Object.fromEntries(
      cardStatuses.map((status) => [
        status,
        cards.filter((card) => card.status === status),
      ]),
    ) as Record<CardStatus, Card[]>;
  }, [cards]);

  useEffect(() => {
    async function boot() {
      try {
        const [nextBoards, nextActors] = await Promise.all([
          listBoards(),
          listActors(),
        ]);

        setBoards(nextBoards);
        setActors(nextActors);

        if (nextBoards[0]) {
          setSelectedBoardId(nextBoards[0].id);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load app");
      } finally {
        setIsLoading(false);
      }
    }

    void boot();
  }, []);

  useEffect(() => {
    if (!selectedBoardId) {
      return;
    }

    const boardId = selectedBoardId;

    async function loadBoard() {
      try {
        const snapshot = await getBoardSnapshot(boardId);
        setCards(snapshot.cards);

        setSelectedCardId((currentCardId) => {
          if (
            currentCardId &&
            snapshot.cards.some((card) => card.id === currentCardId)
          ) {
            return currentCardId;
          }

          return snapshot.cards[0]?.id;
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load board");
      }
    }

    void loadBoard();
  }, [selectedBoardId]);

  useEffect(() => {
    if (!selectedCardId) {
      setSelectedCard(undefined);
      return;
    }

    const cardId = selectedCardId;

    async function loadCard() {
      try {
        setSelectedCard(await getCard(cardId));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load card");
      }
    }

    void loadCard();
  }, [selectedCardId]);

  function updateDraft(field: keyof CardDraft, value: string): void {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function getErrorMessage(cause: unknown, fallback: string): string {
    return cause instanceof Error ? cause.message : fallback;
  }

  async function runSavingAction(
    action: () => Promise<void>,
    fallbackMessage: string,
    options?: { resetDragState?: boolean },
  ) {
    setIsSaving(true);
    setError(undefined);

    try {
      await action();
    } catch (cause) {
      setError(getErrorMessage(cause, fallbackMessage));
    } finally {
      setIsSaving(false);

      if (options?.resetDragState) {
        resetDragState();
      }
    }
  }

  async function refreshBoardAndCard(cardId?: string) {
    if (!selectedBoardId) {
      return;
    }

    const snapshot = await getBoardSnapshot(selectedBoardId);
    setCards(snapshot.cards);

    const nextCardId = cardId ?? selectedCardId ?? snapshot.cards[0]?.id;
    const resolvedCardId =
      nextCardId && snapshot.cards.some((card) => card.id === nextCardId)
        ? nextCardId
        : snapshot.cards[0]?.id;

    if (resolvedCardId) {
      setSelectedCardId(resolvedCardId);
      setSelectedCard(await getCard(resolvedCardId));
    } else {
      setSelectedCard(undefined);
    }
  }

  function canDropCard(cardId: string | undefined, status: CardStatus): boolean {
    if (!cardId) {
      return false;
    }

    const card = cards.find((candidate) => candidate.id === cardId);

    if (!card || card.status === status) {
      return false;
    }

    return canTransitionCard(card.status, status);
  }

  function resetDragState(): void {
    dragSourceCardIdRef.current = undefined;
    setDraggedCardId(undefined);
    setDragOverStatus(undefined);
  }

  function primeDrag(cardId: string): void {
    dragSourceCardIdRef.current = cardId;
  }

  function getDragSourceCardId(): string | undefined {
    return dragSourceCardIdRef.current;
  }

  function selectBoard(boardId: string): void {
    startTransition(() => {
      setSelectedBoardId(boardId);
      setSelectedCardId(undefined);
    });
  }

  function selectCard(cardId: string): void {
    setSelectedCardId(cardId);
  }

  function clearSelectedCard(): void {
    setSelectedCardId(undefined);
    setSelectedCard(undefined);
  }

  function startDrag(cardId: string): void {
    dragSourceCardIdRef.current = cardId;
    setDraggedCardId(cardId);
    setSelectedCardId(cardId);
  }

  async function handleCreateCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedBoardId) {
      return;
    }

    await runSavingAction(async () => {
      const card = await createCardRequest(selectedBoardId, {
        title: draft.title,
        description: draft.description,
        assigneeId: draft.assigneeId || undefined,
        reviewerId: draft.reviewerId || undefined,
      });

      setDraft({
        ...defaultCardDraft,
        assigneeId: draft.assigneeId,
        reviewerId: draft.reviewerId,
      });
      startTransition(() => {
        void refreshBoardAndCard(card.id);
      });
    }, "Unable to create card");
  }

  async function moveCard(cardId: string, status: CardStatus) {
    await runSavingAction(async () => {
      await updateCardStatus(cardId, status);
      await refreshBoardAndCard(cardId);
    }, "Unable to move card", { resetDragState: true });
  }

  async function updateAssignment(
    kind: "assigneeId" | "reviewerId",
    value: string,
  ) {
    if (!selectedCard) {
      return;
    }

    await runSavingAction(async () => {
      await updateCardAssignment(selectedCard.id, {
        assigneeId:
          kind === "assigneeId" ? value || undefined : selectedCard.assigneeId,
        reviewerId:
          kind === "reviewerId" ? value || undefined : selectedCard.reviewerId,
      });
      await refreshBoardAndCard(selectedCard.id);
    }, "Unable to update assignment");
  }

  async function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCard) {
      return;
    }

    await runSavingAction(async () => {
      await createComment(selectedCard.id, {
        authorId: humanActorId,
        body: commentBody,
      });
      setCommentBody("");
      await refreshBoardAndCard(selectedCard.id);
    }, "Unable to add comment");
  }

  async function pingSelectedAgent() {
    if (!selectedCard?.assignee || selectedCard.assignee.type !== "agent") {
      return;
    }

    await runSavingAction(async () => {
      await pingAgent(selectedCard.id);
      await refreshBoardAndCard(selectedCard.id);
    }, "Unable to ping agent");
  }

  return {
    actors,
    boards,
    cards,
    selectedBoard,
    selectedBoardId,
    selectedCard,
    selectedCardId,
    detailTab,
    draggedCardId,
    dragOverStatus,
    groupedCards,
    isLoading,
    isSaving,
    error,
    draft,
    commentBody,
    setDetailTab,
    setDragOverStatus,
    setCommentBody,
    updateDraft,
    primeDrag,
    getDragSourceCardId,
    selectBoard,
    selectCard,
    clearSelectedCard,
    startDrag,
    resetDragState,
    canDropCard,
    handleCreateCard,
    moveCard,
    updateAssignment,
    addComment,
    pingSelectedAgent,
  };
}
