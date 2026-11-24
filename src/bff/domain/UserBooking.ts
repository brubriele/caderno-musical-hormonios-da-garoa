import { z } from "zod";
import { validateSchema } from "../lib/schema.js";
import { ManagerEvent } from "./ManagerEvent.js";
import { User } from "./User.js";

const UserBookingSchema = z.object({
  managerEvent: z.instanceof(ManagerEvent),
  user: z.instanceof(User),
});

// spec-9 C1: o ensaio e a pessoa
export class UserBooking {
  constructor(
    readonly managerEvent: ManagerEvent,
    readonly user: User,
  ) {
    this.validate();
  }

  private validate() {
    validateSchema(UserBookingSchema, this, "userBooking");
  }
}
