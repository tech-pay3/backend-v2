import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";

const app = new Hono({
  strict: false,
}).basePath("/api");

// Add middleware
app.use(logger());
app.use(
  cors({
    origin: "*",
    allowHeaders: ["*"],
    allowMethods: ["POST", "GET", "OPTIONS", "PATCH", "DELETE", "PUT"],
    exposeHeaders: ["*"],
    maxAge: 600,
    credentials: true,
  })
);

// Health check endpoint
app.get("/health", (c) => {
  return c.text("healthy");
});

// Server configuration
const port = parseInt(process.env.PORT || "3000");

// Start the server
serve(
  {
    fetch: app.fetch,
    port: port,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`);
  }
);
