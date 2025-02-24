import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createProxyMiddleware } from "http-proxy-middleware";
import { AppHandler } from "./handler";
import { VaultService } from "../service/vault_service";
import { ReferralService } from "../service/referral_service";
import { handleUserRegResponse, isUserRegistrationPath } from "./helper";
import http, { IncomingMessage, ServerResponse } from "http";

interface VaultApiConfig {
  url: string;
  port: number;
}

export class ProxyServer {
  private app: Hono;
  private handler: AppHandler;
  private port: number;
  private backendUrl: string;

  constructor(
    config: VaultApiConfig,
    private vaultService: VaultService,
    private referralService: ReferralService
  ) {
    this.port = config.port;
    this.backendUrl = config.url;
    this.app = new Hono();

    // Initialize handler
    this.handler = new AppHandler(vaultService, referralService);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Add CORS middleware
    this.app.use(
      "*",
      cors({
        origin: "*",
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Add logging middleware
    this.app.use("*", logger());

    // Add proxy middleware for backend requests
    const proxy = createProxyMiddleware({
      target: this.backendUrl,
      changeOrigin: true,
      onProxyRes: async (
        proxyRes: { statusCode: number },
        req: { url: string },
        res: any
      ) => {
        if (
          proxyRes.statusCode &&
          proxyRes.statusCode >= 200 &&
          proxyRes.statusCode < 300
        ) {
          if (isUserRegistrationPath(req.url!)) {
            try {
              const response = await handleUserRegResponse(
                proxyRes as any,
                req as any,
                this.vaultService
              );
              console.info(
                `Register user: ${req.url} - ${proxyRes.statusCode}`
              );
            } catch (err) {
              console.error("User registration handle failed:", err);
            }
          }
        }
      },
    });

    // Apply proxy middleware to specific paths
    this.app.use("/reg/*", async (c, next) => {
      await proxy(c.req, c.res, next);
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get("/health", async (c) => {
      return c.json({ status: "healthy" });
    });

    // User registration routes
    this.app.post("/reg/user", (c) => this.handler["handleUserReg"](c));
    this.app.post("/reg/telegram-user", (c) =>
      this.handler["handleTelegramUser"](c)
    ); // Fixed method name

    // Referral routes
    this.app.get("/referral/:telegramId", (c) =>
      this.handler["handleReferral"](c)
    );
    this.app.get("/quests/:telegramId", (c) =>
      this.handler["handleGetQuests"](c)
    );

    // Preorder routes
    this.app.post("/preorder", (c) => this.handler["handlePreorder"](c));
    this.app.get("/preorder/:telegramId", (c) =>
      this.handler["handleGetPreorders"](c)
    );

    // Whitelist and quest routes
    this.app.post("/whitelist", (c) => this.handler["handleWhitelist"](c));
    this.app.post("/quest/complete", (c) =>
      this.handler["handleQuestComplete"](c)
    );
    this.app.post("/quest-invite/complete", (c) =>
      this.handler["handleInviteQuestComplete"](c)
    );
  }

  public start(): void {
    serve(
      {
        fetch: this.app.fetch,
        port: this.port,
        hostname: "0.0.0.0",
      },
      (info) => {
        console.info(`Server started on http://localhost:${info.port}`);
      }
    );
  }
}

// Server configuration and initialization
interface ServerConfig {
  vaultApi: VaultApiConfig;
  // Add other config options as needed
}

export function createServer(
  config: ServerConfig,
  vaultService: VaultService,
  referralService: ReferralService
): ProxyServer {
  try {
    const server = new ProxyServer(
      config.vaultApi,
      vaultService,
      referralService
    );
    return server;
  } catch (err) {
    console.error("Failed to create server:", err);
    throw err;
  }
}

export class MockVault {
  host: string;
  port: number;
  callCount = 0;
  server?: http.Server;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  // Start spins up an HTTP server that mocks the Vault API.
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(
        (req: IncomingMessage, res: ServerResponse) => {
          if (req.url === "/reg/user") {
            this.handleRegUser(req, res);
          } else {
            res.statusCode = 404;
            res.end("Not Found");
          }
        }
      );

      this.server.on("error", (err) => {
        reject(err);
      });

      this.server.listen(this.port, this.host, () => {
        console.info(`MockVault server listening on ${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  // Shutdown stops the server gracefully.
  shutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        console.info("Shutting down MockVault server...");
        this.server.close((err?: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // handleRegUser responds differently on the 1st vs. 2nd+ calls.
  handleRegUser(req: IncomingMessage, res: ServerResponse): void {
    // In Node.js the single-threaded event loop minimizes concurrency issues.
    this.callCount++;
    console.debug(`MockVault: /reg/user call, callCount: ${this.callCount}`);

    if (this.callCount === 1) {
      // First call → return 202 Accepted with an empty JSON object.
      res.statusCode = 202;
      res.end("{}");
      return;
    }

    // Second & subsequent calls → return 201 Created with a JSON response.
    res.statusCode = 201;
    res.setHeader("Content-Type", "application/json");

    const respData = {
      access_token: "fake-access-token-123",
      error: "",
      error_description: "",
      expires_in: 86400,
      mfa_token: "fake-mfa-token",
      refresh_token: "fake-refresh-token-456",
      scope: "user:read user:write",
      token_type: "bearer",
      user_id: "usr-abcdef123",
    };

    res.end(JSON.stringify(respData));
  }
}
