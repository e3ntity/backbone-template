import db from "@root/db";
import errors from "@root/errors";
import accessIsVerified from "@root/utils/accessIsVerified";
import validate from "@root/utils/validate";
import { Const, User } from "backbone-sdk";
import { Request, Response } from "express";
import z from "zod";

const schema = { body: { token: z.string() } };

export default async (req: Request, res: Response) => {
  const { token } = await validate(req, schema);
  const { user } = req.locals;
  const { email, phone, userId } = user!;

  const emailVerified =
    email && (await accessIsVerified({ emailOrPhone: email, token, type: Const.accessVerificationType.deleteUser }));
  const phoneVerified =
    phone && (await accessIsVerified({ emailOrPhone: phone, token, type: Const.accessVerificationType.deleteUser }));

  if (!emailVerified && !phoneVerified) throw errors.AccessNotVerified({ fields: ["token"] });

  await db.deleteFrom("users").where("userId", "=", userId).execute();

  res.json(User.deleteReturnSchema.parse({}));
};
