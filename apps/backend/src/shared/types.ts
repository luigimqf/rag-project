import type { FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify";

export interface Controller<T extends RouteGenericInterface = RouteGenericInterface> {
  handle(req: FastifyRequest<T>, res: FastifyReply): Promise<unknown>;
}
