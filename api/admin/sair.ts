import { buildCookie } from "../../src/bff/http/cookies";
import { handle } from "../../src/bff/http/handle";

export const POST = handle(async () => ({
  cookies: [buildCookie("hg_admin", "", 0)],
}));
