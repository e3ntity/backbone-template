import errors from "@root/errors";
import { NextFunction, Request, Response } from "express";

/**
 * Creates a middleware that requires authentication for subsequent routes.
 * @param param0 - The options for the middleware.
 * @returns The middleware.
 */
export default function makeRequireAuthMiddleware({} = {}) {
  return function requireAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
    if (!req.locals.user) throw errors.NotSignedIn();

    return next();
  };
}
