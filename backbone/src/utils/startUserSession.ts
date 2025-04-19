import * as config from "@root/config";
import { DB } from "@root/db/db";
import { generateJWT } from "@root/utils/crypto/jwt";
import wrapTransaction from "@root/utils/kysely/wrapTransaction";
import { accessTokenPayloadSchema, Const, refreshTokenPayloadSchema } from "backbone-sdk";
import { sql, Transaction } from "kysely";
import * as uuid from "uuid";

type StartUserSessionParams = {
  deviceId?: string;
  ipAddress: string | null;
  trx: Transaction<DB>;
  userId: string;
};
type StartUserSessionReturn = { accessToken: string; refreshToken: string };

const accessOptions = {
  expiresIn: config.DEBUG ? "10s" : `${config.JWT_ACCESS_TOKEN_EXPIRES_IN_MINUTES}m`,
  subject: Const.accessTokenSubject,
};
const refreshOptions = {
  expiresIn: `${config.JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS}d`,
  subject: Const.refreshTokenSubject,
};

/**
 * Starts a new user session.
 * If a deviceID is provided, any active user session for that device is invalidated.
 * @param params - The parameters of the function.
 * @param params.ipAddress - The IP address of the user.
 * @param params.userSessionId - The ID of the user session.
 * @param params.trx - The transaction to use.
 * @param params.userId - The ID of the user.
 * @returns The access and refresh tokens.
 * @throws {Error} If the tokens could not be generated.
 */
async function startUserSession({ deviceId, ipAddress, trx, userId }: StartUserSessionParams) {
  if (deviceId) {
    const oldSessions = await trx
      .selectFrom("userSessions")
      .selectAll()
      .where((eb) => eb.and([eb("deviceId", "=", deviceId!), eb("expiresAt", ">", sql<Date>`now()`)]))
      .execute();
    const oldSessionIds = oldSessions.map(({ userSessionId }) => userSessionId);

    await trx
      .updateTable("userSessions")
      .set({ expiresAt: sql`now() - interval '1 second'` })
      .where("userSessionId", "in", oldSessionIds)
      .execute();
  } else {
    deviceId = uuid.v4();
  }

  const expiresAt = new Date(Date.now() + config.JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
  const { userSessionId } = await trx
    .insertInto("userSessions")
    .values({ deviceId, expiresAt, ipAddress, userId })
    .returning("userSessionId")
    .executeTakeFirstOrThrow();

  const accessToken = generateJWT({
    options: accessOptions,
    payload: accessTokenPayloadSchema.strict().parse({ userId }),
  });
  const refreshToken = generateJWT({
    options: refreshOptions,
    payload: refreshTokenPayloadSchema.strict().parse({ userSessionId }),
  });

  if (!accessToken || !refreshToken) throw new Error("Failed to generate tokens");

  return { accessToken, refreshToken } as StartUserSessionReturn;
}

export default wrapTransaction(startUserSession);
