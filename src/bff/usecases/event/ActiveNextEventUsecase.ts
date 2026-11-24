import type { Event } from "../../domain/Event.js";
import { EventPosition, FindingInternalFilter } from "../../domain/FindingInternalFilter.js";
import type { ManagerEvent } from "../../domain/ManagerEvent.js";
import { AppError, NotFoundError } from "../../errors/app-error.js";
import type { IHormoniosRepository } from "../../interfaces/IHormoniosRepository.js";
import { createLogger, LogContext } from "../../lib/logger.js";

const logger = createLogger("ActiveNextEventUsecase", LogContext.Event);

export class ActiveNextEventUsecase {
  static readonly token = "ActiveNextEventUsecase";

  constructor(private readonly hormoniosRepository: IHormoniosRepository) {}

  async execute(): Promise<Event> {
    try {
      const current = await this._execute();

      return current;
    } catch (error) {
      if (error instanceof AppError) {
        logger.appError(error);
        throw error;
      }

      logger.error({ err: error }, "unexpected error");
      throw new Error("Unexpected error");
    }
  }

  // spec-8 B3
  private async _execute(): Promise<Event> {
    logger.track("activating next event");

    const current = await this.findEvent(EventPosition.Current);
    const next = await this.findEvent(EventPosition.Next);

    logger.track("switching current event", { hormoniosEventId: current.event.id, nextEventId: next.event.id });

    return this.updateCurrentEvent(next);
  }

  private async findEvent(position: EventPosition): Promise<ManagerEvent> {
    const filter = new FindingInternalFilter({ position });
    const found = await this.hormoniosRepository.findCurrentEvent(filter);

    if (!found) {
      throw new NotFoundError(`${position} Event Not Found`);
    }

    return found;
  }

  private async updateCurrentEvent(next: ManagerEvent): Promise<Event> {
    return this.hormoniosRepository.updateCurrentEvent(next.event, null, true, null);
  }
}
