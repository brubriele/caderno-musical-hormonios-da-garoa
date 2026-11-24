import type { User } from "../../src/bff/domain/User.js";
import { AttendanceResponse } from "./AttendanceResponse.js";

export class UserResponse {
  static fromDomain(user: User) {
    return {
      id: user.id,
      name: user.name,
      pronoun: user.pronoun,
      email: user.email,
      attendances: user.attendances.map((attendance) => AttendanceResponse.fromDomain(attendance)),
    };
  }
}
