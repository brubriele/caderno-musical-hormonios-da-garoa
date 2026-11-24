import { Envolviment } from "../../../src/bff/envolviment/Envolviment.js";
import { requireAdmin } from "../../../src/bff/http/admin-session.js";
import { handle } from "../../../src/bff/http/handle.js";
import { ActiveNextEventUsecase } from "../../../src/bff/usecases/event/ActiveNextEventUsecase.js";
import { EventResponse } from "../../_responses/EventResponse.js";

// spec-8 B3
export const POST = handle(async (request) => {
  await requireAdmin(request);

  const activeNextEventUsecase = Envolviment.make<ActiveNextEventUsecase>(ActiveNextEventUsecase.token);
  const current = await activeNextEventUsecase.execute();

  return { body: EventResponse.fromDomain(current) };
});
