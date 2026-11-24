import type { ManagerEvent } from "../../src/bff/domain/ManagerEvent.js";
import { EventResponse } from "./EventResponse.js";
import { UserResponse } from "./UserResponse.js";

export class ManagerEventResponse {
  static fromDomain(managerEvent: ManagerEvent) {
    return {
      event: EventResponse.fromDomain(managerEvent.event),
      users: managerEvent.users.map((user) => UserResponse.fromDomain(user)),
    };
  }
}
