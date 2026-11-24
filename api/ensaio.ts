import { Envolviment } from "../src/bff/envolviment/Envolviment.js";
import { handle } from "../src/bff/http/handle.js";
import { FindingPublicEventUsecase } from "../src/bff/usecases/event/FindingPublicEventUsecase.js";
import { EventResponse } from "./_responses/EventResponse.js";

export const GET = handle(async () => {
  const findingPublicEventUsecase = Envolviment.make<FindingPublicEventUsecase>(FindingPublicEventUsecase.token);
  const event = await findingPublicEventUsecase.execute();

  return { body: EventResponse.fromDomain(event) };
});
