import { APIError } from "backbone-sdk";

export interface ErrorOptions extends Omit<APIError.APIErrorOptions, "code"> {
  message?: string;
}

type ErrorFunctionMap = {
  [K in keyof typeof APIError.ErrorCode]: (options?: ErrorOptions) => APIError.APIError;
};

const errors = Object.fromEntries(
  Object.entries(APIError.ErrorCode).map(([key, value]) => [
    key,
    ({ message, ...options }: ErrorOptions = {}) =>
      new APIError.APIError(APIError.ErrorStatus[key], key || "", { code: Number(value), ...options }),
  ])
) as ErrorFunctionMap;

export default errors;
