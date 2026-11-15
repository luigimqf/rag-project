import type { FastifyInstance } from "fastify";

import { askRoutes } from "../modules/chat/chat.routes.js";

export async function routes(app: FastifyInstance) {
  app.register(askRoutes);
}
