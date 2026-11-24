import { z } from "zod";
import { UserMapper } from "../../domain/mappers/UserMapper.js";
import type { User } from "../../domain/User.js";
import { AppError } from "../../errors/app-error.js";
import type { IHormoniosRepository } from "../../interfaces/IHormoniosRepository.js";
import { emailHash } from "../../lib/hash.js";
import { createLogger, LogContext } from "../../lib/logger.js";
import { validateSchema } from "../../lib/schema.js";
import { type IdentifyingUserCommand, IdentifyingUserCommandSchema } from "./IdentifyingUserUsecase.js";

const logger = createLogger("FindingUserUsecase", LogContext.User);

const EmailSchema = z.email();

export class FindingUserUsecase {
  constructor(private readonly hormoniosRepository: IHormoniosRepository) {}

  async execute(command: IdentifyingUserCommand): Promise<User | null> {
    try {
      const user = await this._execute(command);

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        logger.appError(error, { hormoniosUserId: command.userId ?? undefined });
        throw error;
      }

      logger.error({ err: error }, "unexpected error");
      throw new Error("Unexpected error");
    }
  }

  // D3, spec-9 A2
  private async _execute(command: IdentifyingUserCommand): Promise<User | null> {
    logger.track("finding user", { hormoniosUserId: command.userId ?? undefined });

    const valid = this.validateInput(command);
    const cookieUser = await this.findCookieUser(valid);

    if (cookieUser) {
      return cookieUser;
    }

    this.validateEmail(valid.user.email);

    return this.findUserByEmail(valid.user.email);
  }

  private validateInput(command: IdentifyingUserCommand): IdentifyingUserCommand {
    return validateSchema(IdentifyingUserCommandSchema, command);
  }

  private async findCookieUser(command: IdentifyingUserCommand): Promise<User | null> {
    if (command.userId === null) {
      return null;
    }

    const user = await this.hormoniosRepository.findUser({ id: command.userId });

    if (!user) {
      return null;
    }

    const email = command.user.email;
    const sameEmail = email === user.email || this.isSameAnonymizedEmail(email, command.emailHash, user);

    if (!sameEmail) {
      return null;
    }

    const json = user.toJson();

    return UserMapper.fromData(json, []);
  }

  private isSameAnonymizedEmail(email: string, sentHash: string | null, user: User): boolean {
    const anonymized = email === user.anonymizedEmail;
    const hash = emailHash(user.email);

    return anonymized && sentHash === hash;
  }

  private validateEmail(email: string): void {
    validateSchema(EmailSchema, email, "email");
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    return this.hormoniosRepository.findUser({ email });
  }
}
