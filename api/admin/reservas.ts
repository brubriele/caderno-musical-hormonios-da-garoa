import { Envolviment } from "../../src/bff/envolviment/Envolviment.js";
import { requireAdmin } from "../../src/bff/http/admin-session.js";
import { handle, readJson } from "../../src/bff/http/handle.js";
import { BookingAvailabilityUsecase } from "../../src/bff/usecases/event/BookingAvailabilityUsecase.js";
import { BookingAvailabilityRequest, type IBookingAvailabilityRequest } from "./_requests/BookingAvailabilityRequest.js";
import { EventResponse } from "../_responses/EventResponse.js";

// spec-8 B7
export const PUT = handle(async (request) => {
  await requireAdmin(request);

  const body = await readJson<IBookingAvailabilityRequest>(request);
  const event = BookingAvailabilityRequest.toDomain(body);
  const bookingAvailabilityUsecase = Envolviment.make<BookingAvailabilityUsecase>(BookingAvailabilityUsecase.token);
  const updated = await bookingAvailabilityUsecase.execute(event);

  return { body: EventResponse.fromDomain(updated) };
});
