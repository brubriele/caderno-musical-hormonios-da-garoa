import { z } from "zod";
import type { Attendance } from "../../domain/Attendance.js";
import { EventPosition, FindingInternalFilter } from "../../domain/FindingInternalFilter.js";
import { ManagerEvent } from "../../domain/ManagerEvent.js";
import { AppError, NotFoundError } from "../../errors/app-error.js";
import type { IHormoniosRepository } from "../../interfaces/IHormoniosRepository.js";
import { createLogger, LogContext } from "../../lib/logger.js";
import { validateSchema } from "../../lib/schema.js";
import { emptyState } from "../../repos/supabase/mock/emptyState.js";
import type { CreatingInternalEventUsecase } from "./CreatingInternalEventUsecase.js";

const logger = createLogger("FindingInternalEventUsecase", LogContext.Event);

const FindingInternalEventInputSchema = z.instanceof(FindingInternalFilter);

export class FindingInternalEventUsecase {
  static readonly token = "FindingInternalEventUsecase";

  constructor(
    private readonly hormoniosRepository: IHormoniosRepository,
    private readonly creatingInternalEventUsecase: CreatingInternalEventUsecase,
  ) {}

  async execute(filter: FindingInternalFilter): Promise<ManagerEvent> {
    try {
      const managerEvent = await this._execute(filter);

      return managerEvent;
    } catch (error) {
      if (error instanceof AppError) {
        logger.appError(error);
        throw error;
      }

      logger.error({ err: error }, "unexpected error");
      throw new Error("Unexpected error");
    }
  }

  // spec-8 D1, D2
  private async _execute(filter: FindingInternalFilter): Promise<ManagerEvent> {
    logger.track("finding internal event", { position: filter.position ?? undefined, hormoniosEventId: filter.eventId ?? undefined });

    const valid = this.validateInput(filter);
    const found = await this.findEventOrMock(valid);
    const attendances = this.toAttendances(found);
    const counted = found.event.withAttendances(attendances, true);

    return new ManagerEvent(counted, found.users);
  }

  private validateInput(filter: FindingInternalFilter): FindingInternalFilter {
    return validateSchema(FindingInternalEventInputSchema, filter);
  }

  private async findEventOrMock(filter: FindingInternalFilter): Promise<ManagerEvent> {
    const found = await this.hormoniosRepository.findCurrentEvent(filter);

    if (found) {
      return found;
    }

    if (filter.position !== EventPosition.Current) {
      throw new NotFoundError("Event Not Found");
    }

    return this.createMockEvent();
  }

  // spec-8 B5, C4
  private async createMockEvent(): Promise<ManagerEvent> {
    try {
      const event = emptyState();
      const created = await this.creatingInternalEventUsecase.execute(event);

      logger.info("createMockEvent", created.id);

      return new ManagerEvent(created, []);
    } catch (error) {
      logger.error({ err: error }, "mock event not created");
      throw new NotFoundError("Event Not Found");
    }
  }

  private toAttendances(managerEvent: ManagerEvent): Attendance[] {
    return managerEvent.users.flatMap((user) => user.attendances);
  }
}
