import { FastifyInstance } from "fastify";
import { handleWebSocketConnection } from "./websocket.handler.js";

export async function websocketRoutes(app: FastifyInstance): Promise<void> {
    // WebSocket endpoint
    // Connect with: ws://localhost:3000/ws?token=YOUR_ACCESS_TOKEN
    app.get("/ws", { websocket: true }, handleWebSocketConnection);
}
