import db from "@root/db";
import errors from "@root/errors";
import accessIsVerified from "@root/utils/accessIsVerified";
import { verifyGoogleIdentityToken } from "@root/utils/google";
import startUserSession from "@root/utils/startUserSession";
import validate, { custom } from "@root/utils/validate";
import { Const, authenticateReturnSchema } from "backbone-sdk";
import { Request, Response } from "express";
import z from "zod";

const schema = {
  body: {
    googleIdentityToken: z.string().optional(),
    localTZOffset: z.number().default(0),
    phone: custom.mobilePhone.optional(),
    token: z.string().optional(),
  },
};

export default async (req: Request, res: Response) => {
  const { googleIdentityToken, localTZOffset, phone, token } = await validate(req, schema);

  let userId: string;
  if (googleIdentityToken) {
    let tokenData;
    try {
      tokenData = await verifyGoogleIdentityToken(googleIdentityToken);
    } catch (err) {
      throw errors.GoogleIdentityTokenInvalid();
    }

    const user = await db
      .selectFrom("users")
      .select(["email", "userId"])
      .where("googleUserId", "=", tokenData.googleUserId)
      .executeTakeFirst();
    if (!user) throw errors.UserNotFound({ fields: ["googleIdentityToken"] });

    if (user.email !== tokenData.email)
      await db.updateTable("users").set({ email: tokenData.email }).where("userId", "=", user.userId).execute();

    userId = user.userId;
  } else {
    if (!phone || !token) throw errors.AccessNotVerified({ fields: ["phone", "token"] });

    if (!(await accessIsVerified({ emailOrPhone: phone, token, type: Const.accessVerificationType.signIn })))
      throw errors.AccessNotVerified({ fields: ["phone", "token"] });

    userId = (await db.selectFrom("users").select("userId").where("phone", "=", phone).executeTakeFirstOrThrow())
      .userId;
  }

  const result = await db.transaction().execute(async (trx) => {
    const tokens = await startUserSession({ ipAddress: req.locals.remoteIP, trx, userId });
    await trx.updateTable("users").set({ localTZOffset }).where("userId", "=", userId).execute();

    return tokens;
  });

  res.json(authenticateReturnSchema.strict().parse(result));
};
