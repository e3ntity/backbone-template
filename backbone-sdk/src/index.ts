import AccessVerification from "@root/api/AccessVerification";
import APIBase, { APIAdapterParams, APIBaseParams } from "@root/api/APIBase";
import User from "@root/api/User";
import APIError from "@root/APIError";
import Const from "@root/Const";

export * from "@root/api/APIBase";
export * from "@root/Socket";
export { AccessVerification, APIError, Const, User };

export default class API extends APIBase {
  accessVerification: AccessVerification.Adapter;

  constructor(params: APIBaseParams) {
    super(params);

    const adapterParams: APIAdapterParams = { api: this };
    this.accessVerification = new AccessVerification.Adapter(adapterParams);
  }
}
