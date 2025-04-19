import crypto from "crypto";

/**
 * Generates a random hexadecimal string.
 * @param size - The amount of bytes to generate
 * @returns A random hexadecimal string (The length of the string is `size * 2`)
 */
const generateIdentifier = (size: number = 64) => {
  return crypto.randomBytes(size).toString("hex");
};

/**
 * Generates a random PIN.
 * @param length - The length of the PIN to generate
 * @returns A random PIN
 */
const generatePIN = (length: number = 6) => {
  let pin = "";

  for (let i = 0; i < length; i++) pin += crypto.randomInt(9).toString();

  return pin;
};

export { generateIdentifier, generatePIN };
