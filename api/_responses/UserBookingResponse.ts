import type { User } from "../../src/bff/domain/User.js";
import { emailHash } from "../../src/bff/lib/hash.js";
import { AttendanceResponse } from "./AttendanceResponse.js";

export class UserBookingResponse {
  static fromDomain(user: User) {
    return {
      id: user.id,
      name: user.name,
      pronoun: user.pronoun,
      email: user.anonymizedEmail,
      emailHash: emailHash(user.email),
      account: user.account ? user.account.toJson() : null,
      attendances: user.attendances.map((attendance) => AttendanceResponse.fromDomain(attendance)),
    };
  }
}
