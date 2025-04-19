namespace Const {
  export const accessTokenSubject = "access-token" as const;
  export const refreshTokenSubject = "refresh-token" as const;

  export const accessVerificationType = {
    deleteUser: "delete-user",
    signIn: "sign-in",
    signUp: "sign-up",
    updateEmail: "update-email",
    updatePhone: "update-phone",
  } as const;
  export type AccessVerificationType = (typeof accessVerificationType)[keyof typeof accessVerificationType];

  export const userPreferenceName = {} as const;
  export type UserPreferenceName = (typeof userPreferenceName)[keyof typeof userPreferenceName];
}

export default Const;
