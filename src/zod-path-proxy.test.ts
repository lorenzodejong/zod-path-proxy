import { describe, expect, it } from "vitest";

import {
  createZodPathObjectProxy,
  getPropertyWithZodPath,
} from "./zod-path-proxy";

describe("zod-path-proxy", () => {
  it("should return the property value and the Zod path of the accessed property", () => {
    const example = {
      deeply: {
        nested: {
          property: {
            list: [
              {
                test: "test",
              },
            ],
          },
        },
      },
    } as const;

    const proxy = createZodPathObjectProxy(example);

    const [propertyValue, zodPath] = getPropertyWithZodPath(
      proxy.deeply.nested.property.list[0],
      "test"
    );

    expect(propertyValue).toBe("test");
    expect(zodPath).toEqual([
      "deeply",
      "nested",
      "property",
      "list",
      0,
      "test",
    ]);
  });
});
