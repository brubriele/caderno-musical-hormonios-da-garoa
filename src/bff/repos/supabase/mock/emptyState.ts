import type { Event } from "../../../domain/Event.js";
import { EventResponse } from "../responses/EventResponse.js";
import rows from "./emptyState.json";

export function emptyState(): Event {
  const [row] = rows;

  return EventResponse.toDomain(row);
}
