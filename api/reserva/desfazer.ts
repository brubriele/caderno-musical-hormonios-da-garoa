import { Envolviment } from "../../src/bff/envolviment/Envolviment.js";
import { getOrCreateDevice } from "../../src/bff/http/device.js";
import { handle, readJson } from "../../src/bff/http/handle.js";
import { createUserCookie, readUserId } from "../../src/bff/http/user-cookie.js";
import {
  CreatingOrUpdatingAttendanceUsecase,
  type ICreatingOrUpdatingAttendanceBody,
} from "../../src/bff/usecases/booking/CreatingOrUpdatingAttendanceUsecase.js";
import { UserResponse } from "../_responses/UserResponse.js";

// D15, F7, F8
export const POST = handle(async (request) => {
  const { deviceId, cookie } = getOrCreateDevice(request);
  const body = await readJson<ICreatingOrUpdatingAttendanceBody>(request);
  const creatingOrUpdatingAttendanceUsecase = Envolviment.make<CreatingOrUpdatingAttendanceUsecase>(
    CreatingOrUpdatingAttendanceUsecase.token,
  );
  const userId = readUserId(request);
  const user = await creatingOrUpdatingAttendanceUsecase.execute({ ...body, deviceId, userId });
  const userCookie = createUserCookie(user.id);
  const cookies = cookie ? [userCookie, cookie] : [userCookie];

  return { status: 200, body: UserResponse.fromDomain(user), cookies };
});
