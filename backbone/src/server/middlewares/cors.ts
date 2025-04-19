import cors from "cors";

/**
 * Creates a middleware for handling Cross-Origin Resource Sharing (CORS).
 * @param param0 - The options for the middleware.
 * @returns The middleware.
 */
export default function makeCORS({} = {}) {
  return cors({ origin: (origin, cb) => cb(null, true), optionsSuccessStatus: 200 });
}
