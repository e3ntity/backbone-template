import db from "@root/db";
import errors from "@root/errors";
import { verifyJWT } from "@root/utils/crypto/jwt";
import { accessTokenSchema, Const } from "backbone-sdk";
import { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";

type AuthenticateParams = { token: string };

async function authenticate({ token }: AuthenticateParams) {
  let tokenData;
  try {
    tokenData = accessTokenSchema.strict().parse(await verifyJWT({ token }));
  } catch (err) {
    if (err instanceof TokenExpiredError) throw errors.AccessTokenExpired();
    throw errors.AccessTokenInvalid();
  }

  if (tokenData?.sub !== Const.accessTokenSubject) throw errors.AccessTokenInvalid();

  const user = await db.selectFrom("users").selectAll().where("userId", "=", tokenData.userId).executeTakeFirst();

  if (!user) throw errors.AccessTokenInvalid();
  if (user.bannedAt) throw errors.UserBanned();

  return user;
}

export default function makeAuthMiddleware({} = {}) {
  return async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
    const { authorization } = req.headers;

    if (!authorization) return next();

    const [type, token] = authorization.split(" ", 2);
    if (type.toLowerCase() !== "bearer" || !token) throw errors.AccessTokenInvalid();

    req.locals.user = await authenticate({ token });

    return next();
  };
}
