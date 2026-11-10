import { setupApp } from "./lib/app.js";
import { env } from "./lib/env.js";

const app = setupApp();

app.listen({ port: env.PORT }, (err, _) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server is running on port ${env.PORT}`);
});
