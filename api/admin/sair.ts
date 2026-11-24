import { buildCookie } from "../../src/bff/http/cookies.js";
import { handle } from "../../src/bff/http/handle.js";

export const POST = handle(async () => ({
  cookies: [buildCookie("hg_admin", "", 0)],
}));
