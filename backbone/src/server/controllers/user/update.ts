import db from "@root/db";
import { Users } from "@root/db/db";
import validate, { custom } from "@root/utils/validate";
import { User } from "backbone-sdk";
import { Request, Response } from "express";
import { Updateable } from "kysely";
import z from "zod";

const schema = {
  body: {
    localTZOffset: z.number().min(-12).max(12).optional(),
    name: custom.name.optional(),
  },
};

export default async (req: Request, res: Response) => {
  if (!req.locals.user) throw new Error("User not found in protected route");

  const { name, localTZOffset } = await validate(req, schema);
  const { userId } = req.locals.user;

  let data: Updateable<Users> = {};
  if (name !== undefined) data = { ...data, name };
  if (localTZOffset !== undefined) data = { ...data, localTZOffset };

  await db.updateTable("users").set(data).where("userId", "=", userId).execute();

  res.json(User.updateReturnSchema.parse({}));
};
