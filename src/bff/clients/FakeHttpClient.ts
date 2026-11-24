import type { IHttpRequest } from "./http-client.js";
import type { IClientResponse } from "../interfaces/client-response.js";
import type { IHttpClient } from "../interfaces/IHttpClient.js";
import { createLogger, LogContext } from "../lib/logger.js";

const logger = createLogger("FakeHttpClient", LogContext.TransicionaisRepository);

const DISABLED_STATUS = 503;

// K4
export class FakeHttpClient implements IHttpClient {
  async get<T>(url: string): Promise<IClientResponse<T>> {
    const response = await this.request<T>({ url });

    return response;
  }

  async request<T>(input: IHttpRequest): Promise<IClientResponse<T>> {
    logger.debug({ method: input.method ?? "GET", url: input.url, status: DISABLED_STATUS }, "Transicionais disabled");

    return { status: DISABLED_STATUS, error: { message: "Transicionais disabled" } };
  }
}
