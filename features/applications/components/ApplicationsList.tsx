import { KanbanBoard } from "./KanbanBoard";
import type { ApplicationRowData } from "./types";

/**
 * Thin server-side entry point: fetches nothing itself (the page shim
 * already server-fetched the list), just hands it to the client kanban
 * board. Kept as a separate component (rather than inlining KanbanBoard
 * into the page) so the page shim doesn't need to know this feature
 * renders as a board rather than a list.
 */
export function ApplicationsList({ applications }: { applications: ApplicationRowData[] }) {
  return <KanbanBoard applications={applications} />;
}
