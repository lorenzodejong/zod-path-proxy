# zod-path-proxy

This library provides helpers for determining Zod paths in error messages. This is commonly required when doing more complex [`superRefine`](https://zod.dev/?id=superrefine) operations. This library leans on using [Proxy objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) for determining the accessed properties and resolving it to a Zod path.

## Usage

To use the library, two main functions are provided:

- `createZodPathObjectProxy`: sets up a [Proxy object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) which tracks the accessed properties.
- `getPropertyWithZodPath`: retrieves a property from the proxy returned from `createZodPathObjectProxy` and returns a tuple containing the property value and Zod path.

### Nested objects

The library correctly resolves the path when retrieving nested objects.

```typescript
import { z } from 'zod';

import { createZodPathObjectProxy, getPropertyWithZodPath } from 'zod-path-proxy';

const schema = z
  .object({
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
      origin: z.object({
        country: z.string(),
        isForeigner: z.boolean(),
      }),
    }),
  })
  .superRefine((value, ctx) => {
    const proxy = createZodPathObjectProxy(value);

    const [country] = getPropertyWithZodPath(proxy.user.origin, 'country');

    const [isForeigner, isForeignerPath] = getPropertyWithZodPath(proxy.user.origin, 'isForeigner');

    if (country === 'Netherlands' && isForeigner) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `User is not a foreigner when born in the Netherlands`,
        path: isForeignerPath,
      });
    }
  });

schema.parse({
  user: {
    firstName: 'John',
    lastName: 'Doe',
    origin: {
      country: 'Netherlands',
      isForeigner: true,
    },
  },
});
/* [
    {
      "code": "custom",
      "path": [ "user", "origin", "isForeigner" ],
      "message": "User is not a foreigner when born in the Netherlands"
    }
] */
```

### Nested arrays

Any regular object and/or array operations can be used in between, the proxy correctly propogates the Zod path in the result.

```typescript
import { z } from 'zod';

import { createZodPathObjectProxy, getPropertyWithZodPath } from 'zod-path-proxy';

const schema = z
  .object({
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
      origin: z.object({
        country: z.string(),
        isForeigner: z.boolean(),
      }),
      hobbies: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
        }),
      ),
    }),
  })
  .superRefine((value, ctx) => {
    const proxy = createZodPathObjectProxy(value);

    const hobbies = proxy.user.hobbies;

    const disallowedHobby = hobbies.find((hobby) => hobby.id === 'arson');

    if (disallowedHobby) {
      const [_disallowedHobbyId, disallowedHobbyIdPath] = getPropertyWithZodPath(disallowedHobby, 'id');

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Arson is a criminal act, not a hobby`,
        path: disallowedHobbyIdPath,
      });
    }
  });

schema.parse({
  user: {
    firstName: 'John',
    lastName: 'Doe',
    origin: {
      country: 'Netherlands',
      isForeigner: true,
    },
    hobbies: [
      {
        id: 'guitar',
        label: 'Playing guitar',
      },
      {
        id: 'arson',
        label: 'Setting fire to buildings',
      },
    ],
  },
});
/* [
    {
      "code": "custom",
      "path": [ "user", "hobbies", 1, "id" ],
      "message": "Arson is a criminal act, not a hobby"
    }
] */
```
