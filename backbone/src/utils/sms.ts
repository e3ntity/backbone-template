/**
 * This file only contains a stub for sending SMS.
 * You need to hook it up to an SMS API.
 */

import { parsePhoneNumberFromString } from "libphonenumber-js";
import logger from "./logger";

const reserved: RegExp[] = [/^\+180055501\d{2}$/, /^\+4918000\d{6,}$/, /^\+447000\d{4,}$/];

const isValidNumber = async (number: string): Promise<boolean> => {
  let phoneNumber;
  try {
    phoneNumber = parsePhoneNumberFromString(number);
  } catch (error) {
    return false;
  }

  if (!phoneNumber || !phoneNumber.isValid()) return false;
  if (reserved.some((p) => p.test(phoneNumber.number))) return false;

  return true;
};

type SendVerificationSMSParams = { code: string; to: string };

export const sendVerificationSMS = async ({ code, to }: SendVerificationSMSParams) =>
  logger.info(
    `${to} (phone${(await isValidNumber(to)) ? "" : " [invalid]"})> Your sayso verification code is: ${code}`
  );
