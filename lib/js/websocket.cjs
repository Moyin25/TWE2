"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationWebSocket = void 0;
exports.createAndBroadcastNotification = createAndBroadcastNotification;
const ws_1 = require("ws");
const database_1 = require("./database.cjs");
class NotificationWebSocketServer {
    constructor() {
        this.wss = null;
        this.clients = new Set();
    }
    initialize() {
        this.wss = new ws_1.WebSocketServer({ noServer: true, path: "/api/ws/notifications" });
        this.wss.on("connection", (ws, request) => {
            ws.isAlive = true;
            this.clients.add(ws);
            // Handle ping/pong for connection health
            ws.on("pong", () => {
                ws.isAlive = true;
            });
            ws.on("message", (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(ws, message);
                }
                catch (error) {
                    console.error("Error parsing WebSocket message:", error);
                }
            });
            ws.on("close", () => {
                this.clients.delete(ws);
            });
            ws.on("error", (error) => {
                console.error("WebSocket error:", error);
                this.clients.delete(ws);
            });
        });
        // Ping clients every 30 seconds to keep connections alive
        setInterval(() => {
            this.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    ws.terminate();
                    this.clients.delete(ws);
                    return;
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 60000);
    }
    handleMessage(ws, message) {
        switch (message.type) {
            case "auth":
                ws.userId = message.userId;
                break;
            case "ping":
                ws.send(JSON.stringify({ type: "pong" }));
                break;
        }
    }
    broadcastNotification(notification) {
        if (!this.wss)
            return;
        const message = JSON.stringify({
            type: "notification",
            data: notification,
        });
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    broadcastGalleryUpdate(update) {
        if (!this.wss)
            return;
        const message = JSON.stringify({
            type: "gallery_update",
            data: update,
        });
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    sendToUser(userId, notification) {
        if (!this.wss)
            return;
        const message = JSON.stringify({
            type: "notification",
            data: notification,
        });
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN && client.userId === userId) {
                client.send(message);
            }
        });
    }
    getConnectedClientsCount() {
        return this.clients.size;
    }
}
exports.notificationWebSocket = new NotificationWebSocketServer();
// Helper function to create and broadcast notifications
async function createAndBroadcastNotification(title, description, type = "INFO") {
    try {
        const notification = await database_1.prisma.notification.create({
            data: {
                title,
                description,
                type,
            },
        });
        exports.notificationWebSocket.broadcastNotification(notification);
        return notification;
    }
    catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
}
