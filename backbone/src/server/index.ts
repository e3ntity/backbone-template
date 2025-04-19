import * as config from "@root/config";
import errors from "@root/errors";
import accessEnv from "@root/utils/accessEnv";
import logger from "@root/utils/logger";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import http from "http";
import https from "https";
import controllers from "./controllers";
import * as middlewares from "./middlewares";

const port = accessEnv("PORT", 7200);
const sslKey = accessEnv("SSL_KEY", null);
const sslCert = accessEnv("SSL_CERT", null);

const app = express();

const server =
  sslKey && sslCert
    ? https.createServer({ key: fs.readFileSync(sslKey, "utf8"), cert: fs.readFileSync(sslCert, "utf8") }, app)
    : http.createServer(app);

const limiter = rateLimit({
  limit: config.LIMIT_GLOBAL_REQUESTS,
  standardHeaders: "draft-8",
  windowMs: config.LIMIT_GLOBAL_REQUESTS_WINDOW,
});

app.set("trust proxy", ["linklocal", "loopback", "uniquelocal"]);
app.use(limiter, express.json(), middlewares.cors(), middlewares.core(), middlewares.auth());
app.use("/v1", controllers);
app.use((_: Request, __: Response, next: NextFunction) => next(errors.EndpointNotFound()));
app.use(middlewares.error());

server.listen(port, () => logger.info(`Server listening on port ${port} in ${config.NODE_ENV} mode`));

export default server;
