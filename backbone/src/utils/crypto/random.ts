const ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a random alphanumeric string.
 * @param size - The size of the string to generate
 * @returns A random alphanumeric string
 */
export function randomAlphanumeric(size: number = 64) {
  const result = Array(size)
    .fill(null)
    .map(() => ALPHANUMERIC_CHARS.charAt(Math.floor(Math.random() * ALPHANUMERIC_CHARS.length)))
    .join("");

  return result;
}

/**
 * Samples a random element from an array.
 * @param array - The source array to sample from.
 * @returns The randomly sampled element.
 */
export function sample<T>(array: Array<T>) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Samples n random elements from an array without replacement.
 * @param array - The source array to sample from.
 * @param n - The number of elements to sample.
 * @returns A new array containing n randomly selected elements.
 * @throws Will throw an error if n is negative or exceeds the array length.
 */
export function sampleWithoutReplacement<T>(array: T[], n: number): T[] {
  if (n < 0) throw new Error("Sample size cannot be negative.");
  if (n > array.length) throw new Error("Sample size cannot be larger than the array length.");

  const result = array.slice();
  for (let i = 0; i < n; i++) {
    const randomIndex = i + Math.floor(Math.random() * (result.length - i));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }

  return result.slice(0, n);
}

/**
 * Samples n random elements from an array with replacement.
 * @param array - The source array to sample from.
 * @param n - The number of elements to sample.
 * @returns A new array containing n randomly selected elements.
 * @throws Will throw an error if n is negative.
 */
export function sampleWithReplacement<T>(array: T[], n: number): T[] {
  if (n < 0) throw new Error("Sample size cannot be negative.");

  const result = Array.from({ length: n }).map(() => sample(array));

  return result;
}

/**
 * Randomly shuffles the array.
 * @param array The array to shuffle.
 * @returns The randomly shuffled array.
 */
export function shuffle<T>(array: Array<T>) {
  return sampleWithoutReplacement(array, array.length);
}
