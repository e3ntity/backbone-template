import { Users } from "@root/db/db";
import "express";
import { Selectable } from "kysely";

declare global {
  namespace Express {
    interface Request {
      locals: {
        remoteIP: string | null;
        user?: Selectable<Users>;
      };
    }
  }
}
