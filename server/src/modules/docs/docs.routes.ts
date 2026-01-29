import type { FastifyInstance } from "fastify";
import { docsController } from "./docs.controller.js";

export async function docsRoutes(fastify: FastifyInstance): Promise<void> {
    // API documentation endpoint
    fastify.get("/", docsController.getApiInfo.bind(docsController));
}
