import http, { IncomingMessage, ServerResponse } from "http";

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
