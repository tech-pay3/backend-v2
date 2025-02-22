import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono({
  strict: false,
}).basePath("/api");

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

app.get("/health", (c) => {
  return c.text("healthy");
});
const port = parseInt(process.env.PORT || "3000");
console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
