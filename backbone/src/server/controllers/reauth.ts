import db from "@root/db";
import errors from "@root/errors";
import { verifyJWT } from "@root/utils/crypto/jwt";
import startUserSession from "@root/utils/startUserSession";
import validate from "@root/utils/validate";
import { reauthenticateReturnSchema, refreshTokenSchema } from "backbone-sdk";
import { Request, Response } from "express";
import { sql } from "kysely";
import z from "zod";

const schema = { body: { localTZOffset: z.number().default(0), refreshToken: z.string() } };

export default async (req: Request, res: Response) => {
  const { localTZOffset, refreshToken: token } = await validate(req, schema);

  let tokenData;
  try {
    tokenData = refreshTokenSchema.strict().parse(await verifyJWT({ token }));
  } catch (err) {
    throw errors.RefreshTokenInvalid({ fields: ["token"] });
  }

  const { userSessionId } = tokenData;

  const result = await db.transaction().execute(async (trx) => {
    const session = await trx
      .selectFrom("userSessions")
      .forUpdate()
      .select(["deviceId", "userId"])
      .where((eb) => eb.and([eb("userSessionId", "=", userSessionId), eb("expiresAt", ">", sql<Date>`now()`)]))
      .executeTakeFirst();
    if (!session) throw errors.SessionInvalid();

    const user = await trx.selectFrom("users").selectAll().where("userId", "=", session.userId).executeTakeFirst();
    if (!user) throw errors.SessionInvalid();
    if (user.bannedAt !== null) throw errors.UserBanned();

    await trx.updateTable("users").set({ localTZOffset }).where("userId", "=", user.userId).execute();

    const tokens = await startUserSession({
      ipAddress: req.locals.remoteIP,
      trx,
      userId: session.userId,
      deviceId: session.deviceId,
    });

    return tokens;
  });

  return res.json(reauthenticateReturnSchema.strict().parse(result));
};
