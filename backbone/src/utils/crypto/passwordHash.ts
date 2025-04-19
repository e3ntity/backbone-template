import bcrypt from "bcryptjs";

/**
 * Returns the hashed password.
 * @param param0
 * @param param0.password - The password to hash
 */
const passwordHashSync = ({ password }: { password: string }) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(12));
};

/**
 * Timing attack safe password comparison.
 * @param param0
 * @param param0.password - The password to compare
 * @param param0.passwordHash - The hashed password
 * @returns true if the password matches the hash, false otherwise
 */
const passwordCompareSync = ({ password, passwordHash }: { password: string; passwordHash: string }) => {
  return bcrypt.compareSync(password, passwordHash);
};

export { passwordCompareSync, passwordHashSync };
