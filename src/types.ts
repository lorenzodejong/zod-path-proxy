export type PropertyWithZodPathTuple<
  T extends Record<string, unknown>,
  P extends keyof T,
> = [T[P], (string | number)[]];

export type GetPropertyWithZodPathHandler<
  T extends Record<string, unknown>,
  P extends keyof T,
> = (property: P) => PropertyWithZodPathTuple<T, P>;
