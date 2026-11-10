import cors from "@fastify/cors";
import fastify from "fastify";

export const setupApp = () => {
  const app = fastify({
    logger: true,
  });

  app.register(cors);

  return app;
};
