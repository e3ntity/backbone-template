import { fetchUser } from "@root/db/queries/fetchUser";
import { Request, Response } from "express";

export default async (req: Request, res: Response) => {
  if (!req.locals.user) throw new Error("User not found in protected route");

  const { userId } = req.locals.user;
  const user = await fetchUser({ userId });

  return res.json(user);
};
