const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const { notificationWebSocket } = require('./lib/js/websocket.cjs');

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize WebSocket server
  notificationWebSocket.initialize();

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url, true);
    if (pathname === '/api/ws/notifications') {
        notificationWebSocket.wss.handleUpgrade(request, socket, head, (ws) => {
            notificationWebSocket.wss.emit('connection', ws, request);
        });
    }
    else {
        socket.destroy();
    }
});

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`Server listening on port ${port}`);
  });
});