import APIError from "@root/APIError";
import Const from "@root/Const";
import { SocketWrapper } from "@root/Socket";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import z from "zod";

const { ErrorCode } = APIError;

export const accessTokenPayloadSchema = z.object({ userId: z.string() });
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export const accessTokenSchema = accessTokenPayloadSchema.extend({
  exp: z.number(),
  iat: z.number(),
  sub: z.literal(Const.accessTokenSubject),
});

export const refreshTokenPayloadSchema = z.object({ userSessionId: z.string() });
export type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>;

export const refreshTokenSchema = refreshTokenPayloadSchema.extend({
  exp: z.number(),
  iat: z.number(),
  sub: z.literal(Const.refreshTokenSubject),
});

export type APIBaseParams = {
  baseURL: string;
  debug?: boolean;
  log?: (text: string) => void;
  reauthenticate?: boolean;
  socket?: boolean;
};
export type RequestParams = {
  data?: any;
  headers?: Record<string, string>;
  method?: "DELETE" | "GET" | "POST" | "PUT";
  path: string;
  unauthenticated?: boolean;
};
export type RequestParams_ = RequestParams & { reauthenticate?: boolean };

export const authenticateParamsSchema = z.object({
  googleIdentityToken: z.string().optional(),
  phone: z.string().optional(),
  token: z.string().optional(),
});
export const authenticateReturnSchema = z.object({ accessToken: z.string(), refreshToken: z.string() });
export type AuthenticateParams = z.infer<typeof authenticateParamsSchema>;
export type AuthenticateReturn = z.infer<typeof authenticateReturnSchema>;

export const reauthenticateParamsSchema = z.object({ refreshToken: z.string().optional() });
export const reauthenticateReturnSchema = z.object({ accessToken: z.string(), refreshToken: z.string() });
export type ReauthenticateParams = z.infer<typeof reauthenticateParamsSchema>;
export type ReauthenticateReturn = z.infer<typeof reauthenticateReturnSchema>;

class APIBase {
  accessToken_: string | null = null;
  refreshToken_: string | null = null;

  autoReauth: boolean;
  onAccessTokenChange?: (accessToken: string | null) => void;
  onRefreshTokenChange?: (refreshToken: string | null) => void;

  private baseURL: string;
  private debug: boolean;
  private reauthLock: boolean = false;
  private enableSocket: boolean;

  private log: (text: string) => void;

  socket: SocketWrapper | null = null;

  get connectedSocket() {
    if (!this.socket) throw new Error("Socket is not connected.");

    return this.socket;
  }

  /**
   * @param param0
   * @param param0.baseURL - The base URL for the API.
   * @param param0.debug - Whether to log debug information.
   * @param param0.log - Logging handler.
   * @param param0.reauthenticate - Whether or not to reauthenticate automatically when the access token expires.
   * @param param0.socket - Whether to enable the socket.io client (auto-connects on accessToken change).
   */
  constructor({ baseURL, debug = false, log = console.log, reauthenticate = true, socket = false }: APIBaseParams) {
    this.autoReauth = reauthenticate;
    this.baseURL = baseURL;
    this.debug = debug;
    this.enableSocket = socket;
    this.log = log;
  }

  get accessToken() {
    return this.accessToken_;
  }

  async setAccessToken(accessToken: string | null) {
    if (this.socket) this.socket.disconnect();
    if (accessToken && this.enableSocket) {
      this.socket = new SocketWrapper(io(this.baseURL, { auth: { accessToken } }));
      await new Promise<void>((resolve) => this.socket?.wrappedSocket.once("connect", () => resolve()));
    } else {
      this.socket = null;
    }

    this.accessToken_ = accessToken;

    if (this.onAccessTokenChange) this.onAccessTokenChange(accessToken);
  }

  get accessTokenData() {
    if (!this.accessToken) return null;

    return accessTokenSchema.parse(jwtDecode(this.accessToken));
  }

  get refreshToken() {
    return this.refreshToken_;
  }

  get refreshTokenData() {
    if (!this.refreshToken) return null;

    return refreshTokenSchema.parse(jwtDecode(this.refreshToken));
  }

  get localTZOffset() {
    return -Math.round(new Date().getTimezoneOffset() / 60);
  }

  set refreshToken(refreshToken: string | null) {
    this.refreshToken_ = refreshToken;

    if (this.onRefreshTokenChange) this.onRefreshTokenChange(refreshToken);
  }

  private async waitForReauthLock({ timeout = 5000 } = {}) {
    const start = new Date().getTime();
    while (this.reauthLock && new Date().getTime() - start < timeout)
      await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async request_<T = any>(args: RequestParams_): Promise<T> {
    const { method = "GET", path, unauthenticated = false } = args;
    const url = `${this.baseURL}/v1/${path.replace(/^\//, "")}`;

    let headers: Record<string, string> = { "Content-Type": "application/json" };
    if (!unauthenticated && this.accessToken) headers = { ...headers, Authorization: `Bearer ${this.accessToken}` };
    if (args.headers) headers = { ...headers, ...args.headers };

    const data = method !== "GET" ? args.data : undefined;
    const params = method === "GET" ? args.data : undefined;

    let response;
    try {
      response = await axios.request<T>({ data, headers, method, params, url });
    } catch (error: any) {
      if (!error.response?.data) throw error;

      const { data } = error.response;

      if ([ErrorCode.UserBanned, ErrorCode.RefreshTokenInvalid, ErrorCode.SessionInvalid].includes(data.code)) {
        await this.setAccessToken(null);
        this.refreshToken = null;
      } else if (
        [ErrorCode.AccessTokenExpired, ErrorCode.AccessTokenInvalid].includes(data.code) &&
        headers.Authorization &&
        args.reauthenticate !== false &&
        this.autoReauth &&
        this.refreshToken
      ) {
        await this.reauthenticate({ refreshToken: this.refreshToken });
        return this.request_({ ...args, reauthenticate: false });
      }

      throw error;
    }

    return response.data;
  }

  async request<T = any>(params: RequestParams): Promise<T> {
    const start = new Date().getTime();

    const result = await this.request_<T>(params);

    if (this.debug) this.log(`${params.method} ${params.path} took ${new Date().getTime() - start}ms`);

    return result;
  }

  async authenticate(params: AuthenticateParams) {
    const data_ = authenticateParamsSchema.parse(params);
    const data = { ...data_, localTZOffset: this.localTZOffset };

    const response = await this.request<AuthenticateReturn>({
      unauthenticated: true,
      data,
      method: "POST",
      path: "/auth",
    });

    await this.setAccessToken(response.accessToken);
    this.refreshToken = response.refreshToken;

    return authenticateReturnSchema.parse(response);
  }

  async deauthenticate({} = {}) {
    if (this.refreshTokenData) {
      const { userSessionId } = this.refreshTokenData;
      const path = `/session/${userSessionId}`;

      await this.request({ method: "DELETE", path }).catch(() => {});
    }

    await this.setAccessToken(null);
    this.refreshToken = null;

    return {};
  }

  async reauthenticate(params: ReauthenticateParams = {}) {
    if (this.reauthLock) return await this.waitForReauthLock();
    this.reauthLock = true;

    let response;
    try {
      response = await this.reauthenticate_(params);
    } finally {
      this.reauthLock = false;
    }

    return response;
  }

  async reauthenticate_(params: ReauthenticateParams = {}) {
    const data_ = reauthenticateParamsSchema.parse(params);
    const data = { refreshToken: this.refreshToken, ...data_, localTZOffset: this.localTZOffset };

    const response = await this.request({ data, method: "POST", path: "/reauth", unauthenticated: true });

    await this.setAccessToken(response.accessToken);
    this.refreshToken = response.refreshToken;

    return reauthenticateReturnSchema.parse(response);
  }
}

export type APIAdapterParams = { api: APIBase };
export default APIBase;
