import errors from "@root/errors";
import accessEnv from "@root/utils/accessEnv";
import logger from "@root/utils/logger";
import { OAuth2Client } from "google-auth-library";

export const googleClientId = accessEnv("GOOGLE_CLIENT_ID", undefined);
const google = new OAuth2Client(googleClientId);

async function verifyGoogleIdentityToken(token: string): Promise<{ googleUserId: string; email: string }> {
  if (!googleClientId) {
    logger.error("Attempted to verify google identity token without valid google client ID.");
    throw errors.GoogleAuthenticationNotSupported();
  }

  const ticket = await google.verifyIdToken({ idToken: token, audience: googleClientId });
  const payload = ticket.getPayload();

  if (!payload) throw new Error("Invalid Google identity token payload.");

  const { sub: googleUserId, email } = payload;

  if (!email || !googleUserId) throw new Error("Google identity token is missing required claims");

  return { googleUserId, email };
}

export default verifyGoogleIdentityToken;
