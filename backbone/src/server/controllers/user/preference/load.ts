import db from "@root/db";
import validate from "@root/utils/validate";
import { Const, User } from "backbone-sdk";
import { Request, Response } from "express";
import z from "zod";

const schema = { params: { name: z.nativeEnum(Const.userPreferenceName) } };

export default async (req: Request, res: Response) => {
  const { name } = await validate(req, schema);
  const { userId } = req.locals.user!;

  const preference = await db
    .selectFrom("userPreferences")
    .select("value")
    .where("name", "=", name)
    .where("userId", "=", userId)
    .executeTakeFirst();

  const preferenceSchema: z.ZodTuple<any, any> = User.Preference.list[name];
  const { value = preferenceSchema.default } = preference ?? {};

  res.json(User.Preference.loadReturnSchema.parse({ name, value }));
};
