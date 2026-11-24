import { z } from "zod";
import type { Attendance } from "../../domain/Attendance.js";
import type { Event } from "../../domain/Event.js";
import { Job, JobEntity } from "../../domain/Job.js";
import type { User } from "../../domain/User.js";
import { AppError, UpstreamUnavailableError } from "../../errors/app-error.js";
import type { IHormoniosRepository } from "../../interfaces/IHormoniosRepository.js";
import type { ITransicionaisRepo } from "../../interfaces/transicionais.js";
import { createLogger, LogContext } from "../../lib/logger.js";
import { isTransicionaisEnabled } from "../../lib/upstream.js";
import { validateSchema } from "../../lib/schema.js";
import { AttendanceJobUsecase } from "./AttendanceJobUsecase.js";
import { EventJobUsecase } from "./EventJobUsecase.js";
import { UserJobUsecase } from "./UserJobUsecase.js";

const logger = createLogger("JobUsecase", LogContext.Job);

const JobInputSchema = z.object({
  entity: z.enum(JobEntity),
});

type IJobData = z.infer<typeof JobInputSchema>;

export type IJobInput = z.input<typeof JobInputSchema>;

export class JobUsecase {
  static readonly token = "JobUsecase";

  constructor(
    private readonly transicionaisRepo: ITransicionaisRepo,
    private readonly hormoniosRepository: IHormoniosRepository,
  ) {}

  async execute(input: IJobInput): Promise<Event[] | User[] | Attendance[]> {
    try {
      const items = await this._execute(input);

      return items;
    } catch (error) {
      if (error instanceof AppError) {
        logger.appError(error);
        throw error;
      }

      logger.error({ err: error }, "unexpected error");
      throw new Error("Unexpected error");
    }
  }

  private async _execute(input: IJobInput): Promise<Event[] | User[] | Attendance[]> {
    logger.track("processing job");

    this.validateTransicionaisEnabled();

    const data = this.validateInput(input);
    const job = new Job(data.entity);

    if (job.entity === JobEntity.Event) {
      const usecase = new EventJobUsecase(this.transicionaisRepo, this.hormoniosRepository);

      return usecase.execute(job);
    }

    if (job.entity === JobEntity.User) {
      const usecase = new UserJobUsecase(this.transicionaisRepo, this.hormoniosRepository);

      return usecase.execute(job);
    }

    const usecase = new AttendanceJobUsecase(this.transicionaisRepo, this.hormoniosRepository);

    return usecase.execute(job);
  }

  // J0
  private validateTransicionaisEnabled(): void {
    const enabled = isTransicionaisEnabled();

    if (!enabled) {
      throw new UpstreamUnavailableError("Transicionais is disabled");
    }
  }

  private validateInput(input: IJobInput): IJobData {
    return validateSchema(JobInputSchema, input);
  }
}
