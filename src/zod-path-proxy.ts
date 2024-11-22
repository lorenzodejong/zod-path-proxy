import {
  GetPropertyWithZodPathHandler,
  PropertyWithZodPathTuple,
} from "./types";

const INTERNAL_GET_PROPERTY_WITH_ZOD_PATH_METHOD =
  "__INTERNAL_GET_PROPERTY_WITH_ZOD_PATH";

const makeHandler = (zodPath: (string | number)[] = []) => {
  return {
    get(target: Record<string, unknown>, key: string) {
      if (key === INTERNAL_GET_PROPERTY_WITH_ZOD_PATH_METHOD) {
        return (property: string) => [target[property], [...zodPath, property]];
      }

      if (typeof target[key] === "object" && target[key] !== null) {
        const nextZodPath = [
          ...zodPath,
          // If the target is an array, the key represents the index
          // The Zod path convention is to use numeric values for array indices
          Array.isArray(target) ? Number(key) : key,
        ];

        return new Proxy(target[key], makeHandler(nextZodPath));
      } else {
        return target[key];
      }
    },
  };
};

/**
 * Create an object proxy which tracks the path of the property access.
 *
 * @param data the data to be wrapped in the object proxy
 * @returns the original data wrapped in the object proxy
 * @example
 * ```typescript
 * const schema = z.object({
 *   example: z.boolean()
 * });
 * const proxy = createZodPathObjectProxy(schema.parse({ example: true }));
 * ```
 */
export const createZodPathObjectProxy = <T extends Record<string, unknown>>(
  data: T
) => {
  return new Proxy<T>(data, makeHandler());
};

/**
 * Get the property value and the Zod path of the accessed property.
 *
 * @param proxy the object proxy created by `createZodPathObjectProxy`
 * @param property the property to be accessed
 * @returns the property value and the Zod path of the accessed property
 */
export const getPropertyWithZodPath = <
  T extends Record<string, unknown>,
  P extends keyof T,
>(
  proxy: ReturnType<typeof createZodPathObjectProxy<T>>,
  property: P
): PropertyWithZodPathTuple<T, P> => {
  return (
    proxy as T & {
      __INTERNAL_GET_PROPERTY_WITH_ZOD_PATH: GetPropertyWithZodPathHandler<
        T,
        P
      >;
    }
  )[INTERNAL_GET_PROPERTY_WITH_ZOD_PATH_METHOD](property);
};
