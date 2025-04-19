import * as config from "@root/config";
import db from "@root/db";
import errors from "@root/errors";
import { generatePIN } from "@root/utils/crypto/secureRandom";
import { sendVerificationEmail } from "@root/utils/email";
import makeLockId from "@root/utils/kysely/makeLockId";
import { sendVerificationSMS } from "@root/utils/sms";
import validate, { custom } from "@root/utils/validate";
import { AccessVerification, Const } from "backbone-sdk";
import { Request, Response } from "express";
import { sql } from "kysely";
import z from "zod";

const schema = {
  body: { emailOrPhone: custom.emailOrMobilePhone, type: z.nativeEnum(Const.accessVerificationType) },
};

const avt = Const.accessVerificationType;

export default async (req: Request, res: Response) => {
  const { emailOrPhone, type } = await validate(req, schema);
  const { user } = req.locals;

  const isPhoneVerification = custom.mobilePhone.safeParse(emailOrPhone).success;

  // For signUp: Check that the email / phone number doesn't yet exist
  if (type === avt.signUp) {
    const existingUser = await db
      .selectFrom("users")
      .where((eb) => eb.or([eb("email", "=", emailOrPhone), eb("phone", "=", emailOrPhone)]))
      .selectAll()
      .executeTakeFirst();
    if (existingUser)
      throw (isPhoneVerification ? errors.PhoneNumberTaken : errors.EmailTaken)({ fields: ["emailOrPhone"] });
  }

  // For signIn: Check that the email / phone number exists
  if (Array<Const.AccessVerificationType>(avt.signIn).includes(type)) {
    const existingUser = await db
      .selectFrom("users")
      .where((eb) => eb.or([eb("email", "=", emailOrPhone), eb("phone", "=", emailOrPhone)]))
      .selectAll()
      .executeTakeFirst();
    if (!existingUser) throw errors.UserNotFound({ fields: ["emailOrPhone"] });
  }

  // For deleteUser: Check that the email / phone number belongs to the signed in user
  if (type === avt.deleteUser) {
    if (!user) throw errors.NotSignedIn();

    if (isPhoneVerification && user.phone !== emailOrPhone) throw errors.NotAllowed();
    if (!isPhoneVerification && user.email !== emailOrPhone) throw errors.NotAllowed();
  }

  // For updateEmail, updatePhone: Check that the user is signed in and the email/phone number is not taken
  if (Array<Const.AccessVerificationType>(avt.updateEmail, avt.updatePhone).includes(type)) {
    if (!user) throw errors.NotSignedIn();

    const existingUser = await db
      .selectFrom("users")
      .selectAll()
      .where(isPhoneVerification ? "phone" : "email", "=", emailOrPhone)
      .executeTakeFirst();
    if (existingUser)
      throw (isPhoneVerification ? errors.PhoneNumberTaken : errors.EmailTaken)({ fields: ["emailOrPhone"] });
  }

  const lockId = makeLockId("accessVerifications", { emailOrPhone, type });

  const result = await db.transaction().execute(async (trx) => {
    await sql`SELECT pg_advisory_xact_lock(${lockId})`.execute(trx);

    const ongoingVerification = await trx
      .selectFrom("accessVerifications")
      .forUpdate()
      .where((eb) =>
        eb.and([eb("emailOrPhone", "=", emailOrPhone), eb("expiresAt", ">", sql<Date>`now()`), eb("type", "=", type)])
      )
      .selectAll()
      .executeTakeFirst();

    if (ongoingVerification) {
      if (ongoingVerification.resendableAt > new Date()) {
        const timeout = Math.ceil(ongoingVerification.resendableAt.getTime() - Date.now());

        throw errors.AccessVerificationBeginRateLimit({ timeout });
      }

      await trx
        .deleteFrom("accessVerifications")
        .where("accessVerificationId", "=", ongoingVerification.accessVerificationId)
        .execute();
    }

    const code = generatePIN(6);
    const expiresAt = new Date(Date.now() + config.ACCESS_VERIFICATION_EXPIRES_IN_SEC * 1000);
    const resendableAt = new Date(Date.now() + config.ACCESS_VERIFICATION_RESENDABLE_IN_SEC * 1000);

    await (isPhoneVerification ? sendVerificationSMS : sendVerificationEmail)({ code, to: emailOrPhone });

    const { accessVerificationId } = await trx
      .insertInto("accessVerifications")
      .values({ code, emailOrPhone, expiresAt, resendableAt, type })
      .returning("accessVerificationId")
      .executeTakeFirstOrThrow();

    return { accessVerificationId, expiresAt, resendableAt };
  });

  res.json(AccessVerification.beginReturnSchema.parse(result));
};
