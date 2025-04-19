import APIBase, { APIAdapterParams } from "@root/api/APIBase";
import Const from "@root/Const";
import z from "zod";

namespace User {
  export namespace Preference {
    const upn = Const.userPreferenceName;

    type Schema<T extends boolean | number | string = any> = { default: T; schema: z.ZodType<T> };

    export const list: Record<Const.UserPreferenceName, Schema> = {
      [upn.chatMessagePN]: { default: true, schema: z.boolean() },
      [upn.practiceReminderPN]: { default: true, schema: z.boolean() },
      [upn.streakWarningPN]: { default: true, schema: z.boolean() },
    };

    export const loadParamsSchema = z.object({ name: z.nativeEnum(Const.userPreferenceName) });
    export const loadReturnSchema = z.object({
      name: z.nativeEnum(Const.userPreferenceName),
      value: z.union([z.boolean(), z.number(), z.string()]),
    });
    export type LoadParams = z.infer<typeof loadParamsSchema>;
    export type LoadReturn = z.infer<typeof loadReturnSchema>;

    export const setParamsSchema = z.object({
      name: z.nativeEnum(Const.userPreferenceName),
      value: z.union([z.boolean(), z.number(), z.string()]),
    });
    export const setReturnSchema = z.object({});
    export type SetParams = z.infer<typeof setParamsSchema>;
    export type SetReturn = z.infer<typeof setReturnSchema>;

    export class Adapter {
      private api: APIBase;

      constructor(params: APIAdapterParams) {
        this.api = params.api;
      }

      async load(params: LoadParams) {
        const { name } = loadParamsSchema.parse(params);

        const response = await this.api.request({ method: "GET", path: `/user/preference/${name}` });

        return loadReturnSchema.parse(response);
      }

      async set(params: SetParams) {
        const { name, ...data } = setParamsSchema.parse(params);

        const response = await this.api.request({ data, method: "POST", path: `/user/preference/${name}` });

        return setReturnSchema.parse(response);
      }
    }
  }

  export const userSchema = z.object({
    createdAt: z.coerce.date(),
    email: z.string().nullable(),
    googleUserId: z.string().nullable(),
    name: z.string(),
    phone: z.string().nullable(),
    updatedAt: z.coerce.date(),
    userId: z.string(),
  });
  export type User = z.infer<typeof userSchema>;

  export const connectGoogleParamsSchema = z.object({ googleIdentityToken: z.string() });
  export const connectGoogleReturnSchema = z.object({});
  export type ConnectGoogleParams = z.infer<typeof connectGoogleParamsSchema>;
  export type ConnectGoogleReturn = z.infer<typeof connectGoogleReturnSchema>;

  export const createParamsSchema = z.object({
    name: z.string(),
    googleIdentityToken: z.string().optional(),
    phone: z.string().optional(),
    token: z.string().optional(),
  });
  export const createReturnSchema = z.object({ accessToken: z.string(), refreshToken: z.string() });
  export type CreateParams = z.infer<typeof createParamsSchema>;
  export type CreateReturn = z.infer<typeof createReturnSchema>;

  export const deleteParamsSchema = z.object({ token: z.string() });
  export const deleteReturnSchema = z.object({});
  export type DeleteParams = z.infer<typeof deleteParamsSchema>;
  export type DeleteReturn = z.infer<typeof deleteReturnSchema>;

  export const fetchParamsSchema = z.object({});
  export const fetchReturnSchema = userSchema;
  export type FetchParams = z.infer<typeof fetchParamsSchema>;
  export type FetchReturn = z.infer<typeof fetchReturnSchema>;

  export const unblockParamsSchema = z.object({ userId: z.string().uuid() });
  export const unblockReturnSchema = z.object({});
  export type UnblockParams = z.infer<typeof unblockParamsSchema>;
  export type UnblockReturn = z.infer<typeof unblockReturnSchema>;

  export const updateParamsSchema = z.object({ localTZOffset: z.number().optional(), name: z.string().optional() });
  export const updateReturnSchema = z.object({});
  export type UpdateParams = z.infer<typeof updateParamsSchema>;
  export type UpdateReturn = z.infer<typeof updateReturnSchema>;

  export const updateEmailParamsSchema = z.object({ email: z.string(), token: z.string() });
  export const updateEmailReturnSchema = z.object({});
  export type UpdateEmailParams = z.infer<typeof updateEmailParamsSchema>;
  export type UpdateEmailReturn = z.infer<typeof updateEmailReturnSchema>;

  export const updatePhoneParamsSchema = z.object({ phone: z.string(), token: z.string() });
  export const updatePhoneReturnSchema = z.object({});
  export type UpdatePhoneParams = z.infer<typeof updatePhoneParamsSchema>;
  export type UpdatePhoneReturn = z.infer<typeof updatePhoneReturnSchema>;

  export class Adapter {
    private api: APIBase;

    public preference: Preference.Adapter;

    constructor(params: APIAdapterParams) {
      this.api = params.api;

      this.preference = new Preference.Adapter(params);
    }

    async connectGoogle(params: ConnectGoogleParams) {
      const data = connectGoogleParamsSchema.parse(params);

      const response = await this.api.request({ data, method: "POST", path: "/user/connect-google" });

      return connectGoogleReturnSchema.parse(response);
    }

    async create(params: CreateParams) {
      const data = createParamsSchema.parse(params);

      const response = await this.api.request({ data, method: "POST", path: "/user", unauthenticated: true });

      const { accessToken, refreshToken } = response;
      await this.api.setAccessToken(accessToken);
      this.api.refreshToken = refreshToken;

      return createReturnSchema.parse(response);
    }

    async delete(params: DeleteParams): Promise<DeleteReturn> {
      const data = deleteParamsSchema.parse(params);

      await this.api.request({ data, method: "DELETE", path: "/user" });
      await this.api.deauthenticate();

      return {};
    }

    async fetch(params: FetchParams = {}) {
      const data = fetchParamsSchema.parse(params);

      const response = await this.api.request({ data, method: "GET", path: "/user" });

      return fetchReturnSchema.parse(response);
    }

    async unblock(params: UnblockParams) {
      const { userId } = unblockParamsSchema.parse(params);

      const response = await this.api.request({ method: "POST", path: `/user/${userId}/unblock` });

      return unblockReturnSchema.parse(response);
    }

    async update(params: UpdateParams) {
      const data = updateParamsSchema.parse(params);

      const response = await this.api.request({ data, method: "POST", path: "/user/update" });

      return updateReturnSchema.parse(response);
    }

    async updateEmail(params: UpdateEmailParams) {
      const data = updateEmailParamsSchema.parse(params);

      const response = await this.api.request({ data, method: "POST", path: "/user/update-email" });

      return updateEmailReturnSchema.parse(response);
    }

    async updatePhone(params: UpdatePhoneParams) {
      const data = updatePhoneParamsSchema.parse(params);

      const response = await this.api.request({ data, method: "POST", path: "/user/update-phone" });

      return updatePhoneReturnSchema.parse(response);
    }
  }
}

export default User;
