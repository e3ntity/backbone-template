import { NODE_ENV } from "@root/config";
import errors from "@root/errors";
import { Request } from "express";
import parsePhoneNumber from "libphonenumber-js";
import z from "zod";

type Flatten<T extends object> = T extends {
  body?: infer B;
  params?: infer P;
  query?: infer Q;
}
  ? (B extends object ? B : {}) & (P extends object ? P : {}) & (Q extends object ? Q : {})
  : never;
type InferReturn<T> = T extends Record<string, z.ZodTypeAny> ? z.infer<z.ZodObject<T>> : {};

type ValidationSchema = {
  body?: Record<string, z.ZodTypeAny>;
  params?: Record<string, z.ZodTypeAny>;
  query?: Record<string, z.ZodTypeAny>;
};
type ValidateReturn<T extends ValidationSchema> = Flatten<{
  body: InferReturn<T["body"]>;
  params: InferReturn<T["params"]>;
  query: InferReturn<T["query"]>;
}>;

/**
 * Zod-based helper function to validate express request data.
 * @param req The request object.
 * @param schema The validation schemas for body, params, and query.
 * @returns The validated and sanitized data.
 * @throws {APIError} If the request data is invalid.
 */
async function validate<T extends ValidationSchema>(req: Request, schema: T): Promise<ValidateReturn<T>> {
  const dataToValidate: Partial<Record<keyof T, any>> = {};
  const schemaToUse: Partial<Record<keyof T, z.ZodTypeAny>> = {};

  if (schema.body) {
    dataToValidate.body = req.body;
    schemaToUse.body = z.object(schema.body as Record<string, z.ZodTypeAny>);
  }

  if (schema.params) {
    dataToValidate.params = req.params;
    schemaToUse.params = z.object(schema.params as Record<string, z.ZodTypeAny>);
  }

  if (schema.query) {
    dataToValidate.query = req.query;
    schemaToUse.query = z.object(schema.query as Record<string, z.ZodTypeAny>);
  }

  const zodSchema = z.object(schemaToUse as Record<string, z.ZodTypeAny>);
  try {
    const data = zodSchema.parse(dataToValidate);
    return { ...(data.body || {}), ...(data.params || {}), ...(data.query || {}) } as any;
  } catch (error: any) {
    const fields = (error as z.ZodError).errors.map((e) => e.path.slice(1).join("."));
    throw errors.RequestDataInvalid({ fields });
  }
}

const isPhoneNumber =
  NODE_ENV === "test"
    ? (phone: string) => parsePhoneNumber(phone, { extract: false })?.isPossible()
    : (phone: string) => parsePhoneNumber(phone, { extract: false })?.isValid();

const mobilePhoneSchema = z
  .string()
  .refine(isPhoneNumber)
  .transform((phone) => parsePhoneNumber(phone)!.format("E.164"));

// Custom re-usable validators
export const custom = {
  emailOrMobilePhone: z.string().email().or(mobilePhoneSchema),
  name: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[\p{L}`‘’'][ \p{L}'`´‘’-]*[\p{L}]$/u),
  mobilePhone: mobilePhoneSchema,
  userDescription: z.string().max(255),
  username: z
    .string()
    .min(3)
    .max(16)
    .regex(/^[\p{L}\p{N}\._-]+$/u),
};

export default validate;
