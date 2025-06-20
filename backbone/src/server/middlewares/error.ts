import errors from "@root/errors";
import logger from "@root/utils/logger";
import { APIError } from "backbone-sdk";
import { NextFunction, Request, Response } from "express";

/**
 * Creates a middleware for handling API errors.
 * @param param0 - The options for the middleware.
 * @returns The middleware.
 */
export default function makeErrorMiddleware({} = {}) {
  return function errorMiddleware(err: APIError.APIError | Error, req: Request, res: Response, _next: NextFunction) {
    if (err instanceof APIError.APIError) {
      err.expressResponse(res);
      return;
    }

    logger.error(
      `Received an unexpected ${err.name} error in "${req.method} ${req.originalUrl}": ${err.message}.\nStack trace: ${err.stack}`
    );

    errors.ServerError().expressResponse(res);
  };
}
