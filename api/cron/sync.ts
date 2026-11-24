import { Envolviment } from "../../src/bff/envolviment/Envolviment.js";
import { requireCron } from "../../src/bff/http/cron-auth.js";
import { handle } from "../../src/bff/http/handle.js";
import { type IJobInput, JobUsecase } from "../../src/bff/usecases/job/JobUsecase.js";

export const GET = handle(async (request) => {
  await requireCron(request);

  const url = new URL(request.url);
  const entity = url.searchParams.get("type") as IJobInput["entity"];
  const jobUsecase = Envolviment.make<JobUsecase>(JobUsecase.token);
  const items = await jobUsecase.execute({ entity });

  return { body: items.map((item) => item.toJson()) };
});
