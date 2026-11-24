import { Envolviment } from "../../src/bff/envolviment/Envolviment.js";
import { handle, readJson } from "../../src/bff/http/handle.js";
import { requireWebhookKey } from "../../src/bff/http/webhook-auth.js";
import { type IWebhookInput, WebhookUsecase } from "../../src/bff/usecases/sync/WebhookUsecase.js";

export const POST = handle(async (request) => {
  await requireWebhookKey(request);

  const body = await readJson<IWebhookInput>(request);
  const webhookUsecase = Envolviment.make<WebhookUsecase>(WebhookUsecase.token);
  const result = await webhookUsecase.execute(body);

  return { body: result.toJson() };
});
