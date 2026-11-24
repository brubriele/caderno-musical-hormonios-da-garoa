import { NotFoundError } from "../src/bff/errors/app-error.js";
import { Envolviment } from "../src/bff/envolviment/Envolviment.js";
import { handle } from "../src/bff/http/handle.js";
import { readUserId } from "../src/bff/http/user-cookie.js";
import { FindingUserBookingUsecase } from "../src/bff/usecases/booking/FindingUserBookingUsecase.js";
import { UserBookingResponse } from "./_responses/UserBookingResponse.js";

export const GET = handle(async (request) => {
  const userId = readUserId(request);
  if (!userId) throw new NotFoundError("User Not Found");

  const findingUserBookingUsecase = Envolviment.make<FindingUserBookingUsecase>(FindingUserBookingUsecase.token);
  const userBooking = await findingUserBookingUsecase.execute({ userId });

  return { body: UserBookingResponse.fromDomain(userBooking.user) };
});
