import accessEnv from "@root/utils/accessEnv";
import jwt from "jsonwebtoken";
import logger from "../logger";

const JWT_SECRET = accessEnv("JWT_SECRET");

type GenerateJWT = ({ payload, options }: { payload: object; options?: object }) => string | null;

/**
 * Generates and signs a JSON Web Token.
 * @param payload - The payload to set on the JWT.
 * @param options - An object of parameters to set on the JWT, passed
 *  to the jsonwebtoken library's sign function.
 * @returns The signed JWT or null if generation failed.
 */
export const generateJWT: GenerateJWT = function verifyJWT({ payload, options = {} }) {
  let token;

  try {
    token = jwt.sign(payload, JWT_SECRET, options);
  } catch (err) {
    logger.error("Failed to generate JWT: ", err);
  }

  if (!token) return null;

  return token;
};

type VerifyJWT = ({ token, options }: { token: string; options?: object }) => jwt.JwtPayload | null;

/**
 * Verifies a JSON Web Token (JWT) and returns the token data.
 * Verification includes expiration, not before and further optional checks as specified in the options argument.
 * @param token - The token to verify.
 * @param options - A set of options to verify on the token, passed on to the jsonwebtoken libary's verify function.
 * @returns The decoded token data or null if the token is invalid.
 * @throws {JsonWebTokenError} If the token is invalid.
 * @throws {NotBeforeError} If the token is not yet valid.
 * @throws {TokenExpiredError} If the token is expired.
 */
export const verifyJWT: VerifyJWT = function verifyJWT({ token, options = {} }) {
  const decoded = jwt.verify(token, JWT_SECRET, options);

  return typeof decoded === "object" ? decoded : null;
};

export const x5cToPem = (x5c: string) =>
  `-----BEGIN CERTIFICATE-----\n${x5c.match(/.{1,64}/g)?.join("\n")}\n-----END CERTIFICATE-----\n`;
