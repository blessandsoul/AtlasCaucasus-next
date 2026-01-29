# Public Directory - Test Tools

This directory contains HTML test tools for the Tourism Server API.

## Available Test Tools

### 1. Chat Tester (`chat-tester.html`)
- **URL**: http://localhost:3000/chat-tester.html
- **Purpose**: Test real-time chat functionality
- **Features**:
  - Send and receive messages
  - Typing indicators
  - Read receipts
  - Message history
  - Real-time updates via WebSocket

### 2. WebSocket Tester (`websocket-tester.html`)
- **URL**: http://localhost:3000/websocket-tester.html
- **Purpose**: Test WebSocket connections and presence system
- **Features**:
  - WebSocket connection testing
  - Presence status updates
  - Connection state monitoring

### 3. Index Page (`index.html`)
- **URL**: http://localhost:3000/
- **Purpose**: Landing page with links to all test tools
- **Features**:
  - Quick access to all test tools
  - Server status indicator
  - Modern, responsive design

## Why Serve from Server?

Previously, these HTML files were opened directly from the filesystem (`file://` protocol), which caused CORS errors when trying to access the API at `http://localhost:3000`.

By serving them from the server's public directory:
- ✅ **No CORS issues** - Same origin (both at `http://localhost:3000`)
- ✅ **More realistic testing** - Mimics production environment
- ✅ **Easier workflow** - Just navigate to `http://localhost:3000`
- ✅ **Future-proof** - Ready for when client is hosted on the same server

## Technical Implementation

The server uses `@fastify/static` to serve files from this directory:

```typescript
app.register(fastifyStatic, {
  root: join(__dirname, "..", "public"),
  prefix: "/",
});
```

CORS is enabled for development:

```typescript
app.register(fastifyCors, {
  origin: true, // Allow all origins in development
  credentials: true,
});
```

## Adding New Test Tools

To add a new test HTML file:

1. Create your HTML file in this directory
2. Add a link to it in `index.html`
3. Access it at `http://localhost:3000/your-file.html`

No server restart needed - files are served statically!
