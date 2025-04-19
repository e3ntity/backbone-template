import db from "@root/db";
import errors from "@root/errors";
import validate from "@root/utils/validate";
import { Const, User } from "backbone-sdk";
import { Request, Response } from "express";
import z from "zod";

const schema = {
  body: { value: z.union([z.boolean(), z.number(), z.string()]) },
  params: { name: z.nativeEnum(Const.userPreferenceName) },
};

export default async (req: Request, res: Response) => {
  const { name, value } = await validate(req, schema);
  const { userId } = req.locals.user!;

  const preferenceSchema: z.ZodTuple<any, any> = User.Preference.list[name];
  if (!preferenceSchema.safeParse(value).success) throw errors.RequestDataInvalid({ fields: ["value"] });

  await db
    .insertInto("userPreferences")
    .values({ name, userId, value })
    .onConflict((cb) => cb.constraint("unique_user_preferences_name_user_id").doUpdateSet({ value }))
    .execute();

  res.json(User.Preference.setReturnSchema.parse({}));
};
