import { DB } from "@root/db/db";
import wrapTransaction from "@root/utils/kysely/wrapTransaction";
import { Const } from "backbone-sdk";
import { sql, Transaction } from "kysely";

type AccessIsVerifiedParams = {
  emailOrPhone: string;
  trx: Transaction<DB>;
  token: string;
  type: Const.AccessVerificationType;
};

/**
 * Checks if the phone number has been verified.
 * @param param0
 * @param param0.emailOrPhone Email address or phone number to check.
 * @param param0.token The verification token.
 * @param param0.type The type of verification to check.
 * @returns Whether the phone number has been verified.
 * @throws If an error occurs while checking the verification status.
 */
async function accessIsVerified({ emailOrPhone, trx, token, type }: AccessIsVerifiedParams): Promise<boolean> {
  const phoneVerification = await trx
    .selectFrom("accessVerifications")
    .forUpdate()
    .selectAll()
    .where((eb) =>
      eb.and([
        eb("emailOrPhone", "=", emailOrPhone),
        eb("expiresAt", ">", sql<Date>`now()`),
        eb("token", "=", token),
        eb("type", "=", type),
      ])
    )
    .executeTakeFirst();

  if (!phoneVerification) return false;

  await trx
    .updateTable("accessVerifications")
    .set("expiresAt", sql<Date>`now()`)
    .where("accessVerificationId", "=", phoneVerification.accessVerificationId)
    .execute();

  return true;
}

export default wrapTransaction(accessIsVerified);
