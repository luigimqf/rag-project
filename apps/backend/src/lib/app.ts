import cors from "@fastify/cors";
import fastify from "fastify";
import { embeddingProvider } from "../infra/providers/index.js";
import { routes } from "../routes/index.js";

export const setupApp = () => {
  const app = fastify({
    logger: true,
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
  });

  app.register(cors);

  app.register(routes, { prefix: "/api" });

  app.addHook("onReady", async () => {
    await embeddingProvider.embedOne("ping");
    app.log.info("Modelo de embedding carregado");
  });

  return app;
};
