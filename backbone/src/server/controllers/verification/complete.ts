import * as config from "@root/config";
import db from "@root/db";
import errors from "@root/errors";
import { generateIdentifier } from "@root/utils/crypto/secureRandom";
import validate from "@root/utils/validate";
import { AccessVerification } from "backbone-sdk";
import { Request, Response } from "express";
import z from "zod";

const schema = { body: { code: z.string().length(6) }, params: { accessVerificationId: z.string().uuid() } };

const DEMO_PHONES = ["+18005550100", "+18005550101"];
const DEMO_CODE = "873423";

export default async (req: Request, res: Response) => {
  const { code, accessVerificationId } = await validate(req, schema);

  // Update attempts within a transaction to prevent race conditions
  const result = await db
    .transaction()
    .execute(async (trx) => {
      const pv = await trx
        .selectFrom("accessVerifications")
        .forUpdate()
        .where("accessVerificationId", "=", accessVerificationId)
        .selectAll()
        .executeTakeFirst();

      if (!pv) throw errors.ResourceNotFound({ fields: ["emailVerificationId"] });
      if (pv.expiresAt < new Date()) throw errors.AccessVerificationCodeExpired();
      if (pv.token) throw errors.AccessVerificationAlreadyCompleted();
      if (pv.attempts >= config.ACCESS_VERIFICATION_MAX_ATTEMPTS) throw errors.AccessVerificationAttemptsExceeded();

      if (
        (pv.code !== code && !DEMO_PHONES.includes(pv.emailOrPhone)) ||
        (code !== DEMO_CODE && DEMO_PHONES.includes(pv.emailOrPhone))
      ) {
        await trx
          .updateTable("accessVerifications")
          .set("attempts", pv.attempts + 1)
          .where("accessVerificationId", "=", accessVerificationId)
          .execute();

        // Return error (do not throw) to trigger commit that updates attempts
        return errors.AccessVerificationCodeInvalid({ fields: ["code"] });
      }

      const token = generateIdentifier(64);
      await trx
        .updateTable("accessVerifications")
        .set({ attempts: pv.attempts + 1, token })
        .where("accessVerificationId", "=", accessVerificationId)
        .execute();

      return { token };
    })
    .catch((e) => e);

  if (result instanceof Error) throw result;
  else res.json(AccessVerification.completeReturnSchema.parse(result));
};
