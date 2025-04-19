import { NextFunction, Request, Response } from "express";

/**
 * Creates a middleware for setting up the core of the application.
 * @param param0 - The options for the middleware.
 * @returns The middleware.
 */
export default function makeCoreMiddleware({} = {}) {
  return function coreMiddleware(req: Request, _res: Response, next: NextFunction) {
    const remoteIP = req.ip?.replace(/^::ffff:/, "") || null;

    req.locals = { remoteIP };

    return next();
  };
}
