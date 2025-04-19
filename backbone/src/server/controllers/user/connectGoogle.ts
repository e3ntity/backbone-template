import db from "@root/db";
import { Users } from "@root/db/db";
import errors from "@root/errors";
import { verifyGoogleIdentityToken } from "@root/utils/google";
import validate from "@root/utils/validate";
import { User } from "backbone-sdk";
import { Request, Response } from "express";
import { Updateable } from "kysely";
import z from "zod";

const schema = { body: { googleIdentityToken: z.string() } };

export default async (req: Request, res: Response) => {
  const { googleIdentityToken } = await validate(req, schema);
  const user = req.locals.user!;

  await db.transaction().execute(async (trx) => {
    let tokenData;
    try {
      tokenData = await verifyGoogleIdentityToken(googleIdentityToken);
    } catch (err) {
      throw errors.GoogleIdentityTokenInvalid();
    }

    const existingUser = await trx
      .selectFrom("users")
      .selectAll()
      .where((eb) => eb.or([eb("email", "=", tokenData.email), eb("googleUserId", "=", tokenData.googleUserId)]))
      .executeTakeFirst();
    if (existingUser) throw errors.GoogleIdentityExistsAlready({ fields: ["googleIdentityToken"] });

    let values: Updateable<Users> = { googleUserId: tokenData.googleUserId };
    if (!user.email) values = { ...values, email: tokenData.email };

    await trx.updateTable("users").set(values).where("userId", "=", user.userId).execute();
  });

  res.json(User.updateEmailReturnSchema.parse({}));
};
