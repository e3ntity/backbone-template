import db from "@root/db";
import errors from "@root/errors";
import accessIsVerified from "@root/utils/accessIsVerified";
import validate, { custom } from "@root/utils/validate";
import { Const, User } from "backbone-sdk";
import { Request, Response } from "express";
import z from "zod";

const schema = { body: { phone: custom.mobilePhone, token: z.string() } };

export default async (req: Request, res: Response) => {
  const { phone, token } = await validate(req, schema);
  const { userId } = req.locals.user!;

  await db.transaction().execute(async (trx) => {
    if (!(await accessIsVerified({ emailOrPhone: phone, token, trx, type: Const.accessVerificationType.updatePhone })))
      throw errors.AccessNotVerified({ fields: ["phone", "token"] });

    await trx.updateTable("users").set("phone", phone).where("userId", "=", userId).execute();
  });

  res.json(User.updatePhoneReturnSchema.parse({}));
};
