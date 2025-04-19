import { DB } from "@root/db/db";
import wrapTransaction from "@root/utils/kysely/wrapTransaction";
import { User } from "backbone-sdk";
import { Transaction } from "kysely";

type FetchUserParams = { trx: Transaction<DB>; userId: string };

export const fetchUser = wrapTransaction(async ({ trx, userId }: FetchUserParams) => {
  const user = await trx.selectFrom("users").selectAll().where("userId", "=", userId).executeTakeFirstOrThrow();

  return User.userSchema.parse(user);
});
