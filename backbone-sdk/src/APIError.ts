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
}

export default APIError;
