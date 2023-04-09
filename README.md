# Aws Policy

```js
import { Policy } from "../src";

const policy = new Policy({
  name: "lambda-policy",
  path: "./example/policy.json",
  description: "lambda policy",
});

await policy.create();
```
