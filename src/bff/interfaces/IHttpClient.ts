import type { IHttpRequest } from "../clients/http-client.js";
import type { IClientResponse } from "./client-response.js";

// K4
export interface IHttpClient {
  get<T>(url: string, headers?: Record<string, string>): Promise<IClientResponse<T>>;
  request<T>(input: IHttpRequest): Promise<IClientResponse<T>>;
}
