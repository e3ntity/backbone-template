import db from "@root/db";
import { Users } from "@root/db/db";
import errors from "@root/errors";
import accessIsVerified from "@root/utils/accessIsVerified";
import { verifyGoogleIdentityToken } from "@root/utils/google";
import startUserSession from "@root/utils/startUserSession";
import validate, { custom } from "@root/utils/validate";
import { Const, User } from "backbone-sdk";
import { Request, Response } from "express";
import { Insertable } from "kysely";
import z from "zod";

const schema = {
  body: {
    googleIdentityToken: z.string().optional(),
    name: custom.name,
    phone: custom.mobilePhone.optional(),
    token: z.string().optional(),
  },
};

export default async (req: Request, res: Response) => {
  const requestData = await validate(req, schema);

  const { name, googleIdentityToken, phone, token } = requestData;

  const userId = await db.transaction().execute(async (trx) => {
    let data: Insertable<Users> = { name };
    if (googleIdentityToken) {
      let tokenData;
      try {
        tokenData = await verifyGoogleIdentityToken(googleIdentityToken);
      } catch (err) {
        throw errors.GoogleIdentityTokenInvalid();
      }

      const user = await db
        .selectFrom("users")
        .selectAll()
        .where((eb) => eb.or([eb("email", "=", tokenData.email), eb("googleUserId", "=", tokenData.googleUserId)]))
        .executeTakeFirst();
      if (user) throw errors.GoogleIdentityExistsAlready({ fields: ["googleIdentityToken"] });

      data = { ...data, ...tokenData };
    } else {
      if (!phone || !token) throw errors.AccessNotVerified({ fields: ["phone", "token"] });

      if (!(await accessIsVerified({ emailOrPhone: phone, token, trx, type: Const.accessVerificationType.signUp })))
        throw errors.AccessNotVerified({ fields: ["phone", "token"] });

      data = { ...data, phone };
    }

    const { userId } = await trx.insertInto("users").values(data).returning("userId").executeTakeFirstOrThrow();

    return userId;
  });

  const tokens = await startUserSession({ ipAddress: req.locals.remoteIP, userId });

  res.json(User.createReturnSchema.parse(tokens));
};
