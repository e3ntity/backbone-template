import APIBase, { APIAdapterParams } from "@root/api/APIBase";
import Const from "@root/Const";
import z from "zod";

const avt = Const.accessVerificationType;

namespace AccessVerification {
  export const beginParamsSchema = z.object({ emailOrPhone: z.string(), type: z.nativeEnum(avt) });
  export const beginReturnSchema = z.object({
    accessVerificationId: z.string(),
    expiresAt: z.coerce.date(),
    resendableAt: z.coerce.date(),
  });
  export type BeginParams = z.infer<typeof beginParamsSchema>;
  export type BeginReturn = z.infer<typeof beginReturnSchema>;

  export const completeParamsSchema = z.object({ accessVerificationId: z.string(), code: z.string() });
  export const completeReturnSchema = z.object({ token: z.string() });
  export type CompleteParams = z.infer<typeof completeParamsSchema>;
  export type CompleteReturn = z.infer<typeof completeReturnSchema>;

  export class Adapter {
    private api: APIBase;

    constructor(params: APIAdapterParams) {
      this.api = params.api;
    }

    async begin(params: BeginParams) {
      const data = beginParamsSchema.parse(params);
      const path = "/access-verification";
      const unauthenticated = Array<Const.AccessVerificationType>(avt.signIn, avt.signUp).includes(params.type);

      const response = await this.api.request<BeginReturn>({ data, method: "POST", path, unauthenticated });

      return beginReturnSchema.parse(response);
    }

    async complete(params: CompleteParams) {
      const { accessVerificationId, ...data } = completeParamsSchema.parse(params);
      const path = `/access-verification/${accessVerificationId}`;

      const response = await this.api.request<CompleteReturn>({ data, method: "POST", path, unauthenticated: true });

      return completeReturnSchema.parse(response);
    }
  }
}

export default AccessVerification;
