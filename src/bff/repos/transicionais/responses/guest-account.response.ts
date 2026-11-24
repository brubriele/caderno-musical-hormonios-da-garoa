import { UserMapper } from "../../../domain/mappers/UserMapper.js";
import type { User } from "../../../domain/User.js";
import { OrganizationUserResponse } from "./organization-user.response.js";

const OPERATION = "registerGuest";

// resposta do POST v2/manager-organization/users: a conta (convidado ou membro), com o userId (D41)
export class GuestAccountResponse {
  static toDomain(raw: unknown, user: User): User {
    const account = OrganizationUserResponse.toDomain(raw, OPERATION);
    const data = user.toJson();
    const metadata = { ...data.metadata, integrationId: account.userId, account: account.toJson() };

    return UserMapper.fromData({ ...data, metadata }, user.attendances);
  }
}
