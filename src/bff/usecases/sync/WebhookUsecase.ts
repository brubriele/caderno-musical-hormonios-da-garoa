import { z } from "zod";
import { SyncStatus } from "../../domain/SyncStatus.js";
import { Webhook, WebhookEntity, WebhookResult } from "../../domain/Webhook.js";
import { AppError } from "../../errors/app-error.js";
import type { IHormoniosRepository } from "../../interfaces/IHormoniosRepository.js";
import type { ITransicionaisRepo } from "../../interfaces/transicionais.js";
import { createLogger, LogContext } from "../../lib/logger.js";
import { DateTimeSchema, NonBlankSchema, UuidSchema, validateSchema } from "../../lib/schema.js";
import { AttendanceWebhookUsecase } from "./AttendanceWebhookUsecase.js";
import { EventWebhookUsecase } from "./EventWebhookUsecase.js";
import { UserWebhookUsecase } from "./UserWebhookUsecase.js";

const logger = createLogger("WebhookUsecase", LogContext.Sync);

const WebhookInputSchema = z
  .object({
    entity: NonBlankSchema,
    requestId: z.number().int().optional(),
    sendAt: DateTimeSchema,
    body: z.object({
      eventId: z.union([z.number().int().positive(), UuidSchema]).optional(),
      userId: UuidSchema.optional(),
      validationId: z.number().int().positive().optional(),
    }),
  })
  .refine((input) => input.entity !== WebhookEntity.Event || input.body.eventId !== undefined, {
    path: ["body", "eventId"],
    message: "is required",
  })
  .refine((input) => input.entity !== WebhookEntity.User || input.body.userId !== undefined, {
    path: ["body", "userId"],
    message: "is required",
  })
  .refine((input) => input.entity !== WebhookEntity.Validation || input.body.validationId !== undefined, {
    path: ["body", "validationId"],
    message: "is required",
  });

type IWebhookData = z.infer<typeof WebhookInputSchema>;

export type IWebhookInput = z.input<typeof WebhookInputSchema>;

export class WebhookUsecase {
  static readonly token = "WebhookUsecase";

  constructor(
    private readonly transicionaisRepo: ITransicionaisRepo,
    private readonly hormoniosRepository: IHormoniosRepository,
  ) {}

  async execute(input: IWebhookInput): Promise<WebhookResult> {
    try {
      const result = await this._execute(input);

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        logger.appError(error);
        throw error;
      }

      logger.error({ err: error }, "unexpected error");
      throw new Error("Unexpected error");
    }
  }

  private async _execute(input: IWebhookInput): Promise<WebhookResult> {
    logger.track("receiving webhook");

    const data = this.validateInput(input);

    const { eventId, userId, validationId } = data.body;

    if (data.entity === WebhookEntity.Event && eventId !== undefined) {
      const webhook = new Webhook(eventId, WebhookEntity.Event);
      const usecase = new EventWebhookUsecase(this.transicionaisRepo, this.hormoniosRepository);

      return usecase.execute(webhook);
    }

    if (data.entity === WebhookEntity.User && userId !== undefined) {
      const webhook = new Webhook(userId, WebhookEntity.User);
      const usecase = new UserWebhookUsecase(this.transicionaisRepo, this.hormoniosRepository);

      return usecase.execute(webhook);
    }

    if (data.entity === WebhookEntity.Validation && validationId !== undefined) {
      const webhook = new Webhook(validationId, WebhookEntity.Validation);
      const usecase = new AttendanceWebhookUsecase(this.transicionaisRepo, this.hormoniosRepository);

      return usecase.execute(webhook);
    }

    return new WebhookResult(SyncStatus.Rejected, false);
  }

  private validateInput(input: IWebhookInput): IWebhookData {
    return validateSchema(WebhookInputSchema, input);
  }
}
