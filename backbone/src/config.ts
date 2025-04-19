import accessEnv from "@root/utils/accessEnv";

export const NODE_ENV = accessEnv("NODE_ENV", "development");
export const DEBUG = NODE_ENV === "development" || NODE_ENV === "test";
export const DOMAIN = accessEnv("DOMAIN");
export const VERSION = "0.0.1";

export const LIMIT_GLOBAL_REQUESTS = 1000;
export const LIMIT_GLOBAL_REQUESTS_WINDOW = 1000 * 60;

export const ACCESS_VERIFICATION_EXPIRES_IN_SEC = 60 * 5;
export const ACCESS_VERIFICATION_MAX_ATTEMPTS = 5;
export const ACCESS_VERIFICATION_RESENDABLE_IN_SEC = 30;

export const JWT_ACCESS_TOKEN_EXPIRES_IN_MINUTES = 15;
export const JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;
