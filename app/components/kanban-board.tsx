"use client";

import {
  CircleCheck,
  CircleDashed,
  Clock3,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { isStatus, STATUSES, type Card, type Status } from "@/lib/kanban";

const columns: { status: Status; label: string; icon: typeof CircleDashed }[] = [
  { status: "todo", label: "To do", icon: CircleDashed },
  { status: "doing", label: "Doing", icon: Clock3 },
  { status: "done", label: "Done", icon: CircleCheck },
];

const statusNames: Record<Status, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
};

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error ?? "The request could not be completed.");
  }
  return result as T;
}

async function loadCards(signal?: AbortSignal) {
  const response = await fetch("/api/cards", {
    signal,
    cache: "no-store",
  });
  return readResponse<Card[]>(response);
}

export function KanbanBoard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComposer, setActiveComposer] = useState<Status | null>(null);
  const [draft, setDraft] = useState("");
  const [busyCard, setBusyCard] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState(false);
  const [dropTarget, setDropTarget] = useState<Status | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void loadCards(controller.signal)
      .then(setCards)
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== "AbortError") {
          setError(reason.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setCards(await loadCards());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the board.");
    } finally {
      setLoading(false);
    }
  }

  function openComposer(status: Status) {
    setActiveComposer(status);
    setDraft("");
    setError(null);
  }

  async function addCard(event: FormEvent<HTMLFormElement>, status: Status) {
    event.preventDefault();
    const title = draft.trim();
    if (!title || savingCard) return;

    setSavingCard(true);
    setError(null);
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status }),
      });
      const card = await readResponse<Card>(response);
      setCards((current) => [...current, card]);
      setActiveComposer(null);
      setDraft("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add that task.");
    } finally {
      setSavingCard(false);
    }
  }

  async function moveCard(id: string, status: Status) {
    const current = cards.find((card) => card.id === id);
    if (!current || current.status === status || busyCard) return;

    setBusyCard(id);
    setError(null);
    setCards((previous) => previous.map((card) => (card.id === id ? { ...card, status } : card)));
    try {
      const response = await fetch(`/api/cards/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const updated = await readResponse<Card>(response);
      setCards((previous) => previous.map((card) => (card.id === id ? updated : card)));
    } catch (reason) {
      setCards((previous) =>
        previous.map((card) => (card.id === id ? { ...card, status: current.status } : card)),
      );
      setError(reason instanceof Error ? reason.message : "Could not move that task.");
    } finally {
      setBusyCard(null);
    }
  }

  async function deleteCard(id: string) {
    if (busyCard) return;
    setBusyCard(id);
    setError(null);
    try {
      const response = await fetch(`/api/cards/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) await readResponse(response);
      setCards((previous) => previous.filter((card) => card.id !== id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete that task.");
    } finally {
      setBusyCard(null);
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: Status) {
    event.preventDefault();
    setDropTarget(null);
    const id = event.dataTransfer.getData("text/plain");
    if (id) void moveCard(id, status);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <LayoutDashboard size={18} strokeWidth={2.2} />
          </span>
          <span className="brand-name">Kansan</span>
          <span className="workspace-label">Team workspace</span>
        </div>
        <span className="sync-indicator">
          <span className="sync-dot" aria-hidden="true" />
          Open board
        </span>
      </header>

      <section className="page-intro" aria-labelledby="page-title">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" /> Project overview</p>
          <h1 className="page-title" id="page-title">The work, <span>in motion.</span></h1>
          <p className="page-description">A clear place to keep every task moving forward.</p>
        </div>
        <div className="board-summary" aria-live="polite">
          <span className="summary-count">{cards.length}</span>
          <span>{cards.length === 1 ? "task on the board" : "tasks on the board"}</span>
        </div>
      </section>

      {error && (
        <div className="board-message" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw size={13} aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      <section className="board" aria-label="Kanban board">
        {columns.map(({ status, label, icon: ColumnIcon }) => {
          const columnCards = cards.filter((card) => card.status === status);
          return (
            <section
              key={status}
              className={`column${dropTarget === status ? " column--over" : ""}`}
              data-status={status}
              aria-labelledby={`column-${status}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDropTarget(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDropTarget(null);
                }
              }}
              onDrop={(event) => handleDrop(event, status)}
            >
              <div className="column-header">
                <div className="column-heading">
                  <ColumnIcon className="column-icon" size={17} strokeWidth={2} aria-hidden="true" />
                  <h2 className="column-title" id={`column-${status}`}>{label}</h2>
                  <span className="column-count" aria-label={`${columnCards.length} tasks`}>
                    {columnCards.length}
                  </span>
                </div>
                <button
                  className="add-trigger"
                  type="button"
                  title={`Add a task to ${label}`}
                  aria-label={`Add a task to ${label}`}
                  onClick={() => openComposer(status)}
                >
                  <Plus size={17} aria-hidden="true" />
                </button>
              </div>

              {activeComposer === status && (
                <form className="composer" onSubmit={(event) => void addCard(event, status)}>
                  <input
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="What needs to get done?"
                    aria-label={`New task for ${label}`}
                    maxLength={200}
                  />
                  <div className="composer-actions">
                    <button
                      className="quiet-button"
                      type="button"
                      onClick={() => setActiveComposer(null)}
                      disabled={savingCard}
                    >
                      <X size={13} aria-hidden="true" /> Cancel
                    </button>
                    <button className="submit-button" type="submit" disabled={!draft.trim() || savingCard}>
                      {savingCard ? "Adding" : "Add task"}
                    </button>
                  </div>
                </form>
              )}

              <ul className="task-list">
                {loading ? (
                  <li className="loading-column" aria-label="Loading tasks" />
                ) : columnCards.length ? (
                  columnCards.map((card) => (
                    <li
                      className={`task-card${busyCard === card.id ? " task-card--busy" : ""}`}
                      key={card.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", card.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDropTarget(null)}
                    >
                      <div className="task-card-top">
                        <p className="task-title">{card.title}</p>
                        <button
                          className="delete-task"
                          type="button"
                          aria-label={`Delete ${card.title}`}
                          title={`Delete ${card.title}`}
                          onClick={() => void deleteCard(card.id)}
                          disabled={busyCard === card.id}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="task-card-footer">
                        <span className="task-date">
                          {new Date(card.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                        <select
                          className="move-select"
                          aria-label={`Move ${card.title}`}
                          value={card.status}
                          onChange={(event) => {
                            if (isStatus(event.target.value)) void moveCard(card.id, event.target.value);
                          }}
                          disabled={busyCard === card.id}
                        >
                          {STATUSES.map((option) => (
                            <option value={option} key={option}>Move to {statusNames[option]}</option>
                          ))}
                        </select>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="empty-state">
                    <CircleDashed size={21} strokeWidth={1.5} aria-hidden="true" />
                    <p>{status === "todo" ? "Nothing queued up" : `No tasks ${status === "doing" ? "in progress" : "completed"}`}</p>
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </section>

      <footer className="board-footer">
        <span>Drag tasks to change their status, or use the status menu.</span>
        <span>Anyone with this board link can edit its tasks.</span>
      </footer>
    </main>
  );
}