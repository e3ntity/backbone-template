import { Response as ExpressResponse } from "express";
import { z } from "zod";

namespace APIError {
  export enum BadRequestCode {
    RequestDataInvalid = 1000,
  }

  export enum UnauthorizedCode {
    AccessTokenInvalid = 2000,
    AccessTokenExpired,
    NotSignedIn,
    RefreshTokenInvalid,
    SessionInvalid,
  }

  export enum ForbiddenCode {
    NotAllowed = 3000,
    UserBanned,
  }

  export enum NotFoundCode {
    EndpointNotFound = 4000,
    ResourceNotFound,
    UserNotFound,
  }

  export enum UnprocessableEntityCode {
    AccessVerificationCodeExpired = 5000,
    AccessVerificationCodeInvalid,
    AccessVerificationAttemptsExceeded,
    AccessVerificationAlreadyCompleted,
    AccessNotVerified,
    FileTooLarge,
    FileInvalid,
    EmailTaken,
    PhoneNumberTaken,
    GoogleAuthenticationNotSupported,
    GoogleIdentityTokenInvalid,
    GoogleIdentityExistsAlready,
  }

  export enum TooManyRequestsCode {
    AccessVerificationBeginRateLimit = 6000,
  }

  export enum InternalServerErrorCode {
    ServerError = 7000,
  }

  export const ErrorCode = {
    ...BadRequestCode,
    ...UnauthorizedCode,
    ...ForbiddenCode,
    ...NotFoundCode,
    ...UnprocessableEntityCode,
    ...TooManyRequestsCode,
    ...InternalServerErrorCode,
  };

  export const ErrorStatus = {
    ...Object.fromEntries(Object.entries(BadRequestCode).map(([key, _]) => [key, 400])),
    ...Object.fromEntries(Object.entries(UnauthorizedCode).map(([key, _]) => [key, 401])),
    ...Object.fromEntries(Object.entries(ForbiddenCode).map(([key, _]) => [key, 403])),
    ...Object.fromEntries(Object.entries(NotFoundCode).map(([key, _]) => [key, 404])),
    ...Object.fromEntries(Object.entries(UnprocessableEntityCode).map(([key, _]) => [key, 422])),
    ...Object.fromEntries(Object.entries(TooManyRequestsCode).map(([key, _]) => [key, 429])),
    ...Object.fromEntries(Object.entries(InternalServerErrorCode).map(([key, _]) => [key, 500])),
  };

  export const responseSchema = z.object({
    code: z.number(),
    fields: z.string().array().optional(),
    message: z.string(),
    statusCode: z.number(),
    timeout: z.number().optional(),
  });
  export type Response = z.infer<typeof responseSchema>;

  export interface APIErrorOptions extends Omit<Response, "message" | "statusCode"> {}
  export interface APIErrorResponse extends Response {}

  /**
   * The APIError can be used to return any error in a fixed format.
   * @param statusCode - A HTTP status code that describes the error.
   * @param message - A message that specifies the error.
   * @param options - Further parameters that can be set.
   */
  export class APIError extends Error {
    name: string;
    message: string;
    statusCode: number;

    code: number;
    fields?: string[];
    timeout?: number;

    constructor(statusCode: number, message: string, { code, fields, timeout }: APIErrorOptions) {
      super();
      this.name = "APIError";
      this.message = message;
      this.statusCode = statusCode;

      this.code = code;
      this.fields = fields;
      this.timeout = timeout;
    }

    /**
     * Alias to response for socket.io
     */
    get data() {
      return this.response;
    }

    /**
     * Builds a response object that can be returned to the client..
     * @returns The response object.
     */
    get response() {
      let data: APIErrorResponse = { code: this.code, message: this.message, statusCode: this.statusCode };

      if (this.fields !== undefined) data = { ...data, fields: this.fields };
      if (this.timeout !== undefined) data = { ...data, timeout: this.timeout };

      return data;
    }

    /**
     * Creates a response for express framework controllers.
     * @param res - The express response.
     * @returns The modified express response object.
     */
    expressResponse(res: ExpressResponse) {
      return res.status(this.statusCode).json(this.response);
    }
  }
}

export default APIError;
