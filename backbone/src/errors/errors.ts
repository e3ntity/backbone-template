import { APIError } from "backbone-sdk";
import APIErrorClass, { APIErrorOptions } from "./APIError";

export interface ErrorOptions extends Omit<APIErrorOptions, "code"> {
  message?: string;
}

type ErrorFunctionMap = {
  [K in keyof typeof APIError.ErrorCode]: (options?: ErrorOptions) => APIErrorClass;
};

const errors = Object.fromEntries(
  Object.entries(APIError.ErrorCode).map(([key, value]) => [
    key,
    ({ message, ...options }: ErrorOptions = {}) =>
      new APIErrorClass(APIError.ErrorStatus[key], key || "", { code: Number(value), ...options }),
  ])
) as ErrorFunctionMap;

export default errors;
