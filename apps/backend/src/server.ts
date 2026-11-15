import { setupApp } from "./lib/app.js";
import { env } from "./lib/env.js";

const app = setupApp();

app.listen({ port: env.PORT }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
