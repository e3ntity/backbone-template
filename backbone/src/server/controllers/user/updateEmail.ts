import db from "@root/db";
import errors from "@root/errors";
import accessIsVerified from "@root/utils/accessIsVerified";
import validate from "@root/utils/validate";
import { Const, User } from "backbone-sdk";
import { Request, Response } from "express";
import z from "zod";

const schema = { body: { email: z.string().email(), token: z.string() } };

export default async (req: Request, res: Response) => {
  const { email, token } = await validate(req, schema);
  const { userId } = req.locals.user!;

  await db.transaction().execute(async (trx) => {
    if (!(await accessIsVerified({ emailOrPhone: email, token, trx, type: Const.accessVerificationType.updateEmail })))
      throw errors.AccessNotVerified({ fields: ["email", "token"] });

    await trx.updateTable("users").set("email", email).where("userId", "=", userId).execute();
  });

  res.json(User.updateEmailReturnSchema.parse({}));
};
