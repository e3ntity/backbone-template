import logger from "@root/utils/logger";
import { NextFunction, Request, Response } from "express";

export default function makeBenchmarkMiddleware({} = {}) {
  return async function benchmarkMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });

    next();
  };
}
