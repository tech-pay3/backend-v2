import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { RegisterService } from "../service/register_service";

// Types
export interface Response<T = any> {
  data?: T;
  err?: string;
}

export interface CreateUserRequest {
  email: string;
}

export interface CreateUserResponse {
  userId: string;
}

// Constants
export const REGISTER_USER_PATH = "/reg/user";

// Utility functions
export function isUserRegistrationPath(path: string): boolean {
  return path.includes(REGISTER_USER_PATH);
}

export async function handleUserRegResponse(
  response: Response,
  context: Context,
  vaultService: RegisterService // Replace with actual VaultService type
): Promise<void> {
  if ((response as any).status !== 201) {
    return;
  }

  try {
    const userResp = response as CreateUserResponse;
    const userReq = context.get("userRequestData") as CreateUserRequest;

    if (!userReq) {
      throw new Error("Failed parsing create request from context");
    }

    await vaultService.handleUserReg(context, userReq, userResp);
  } catch (err) {
    console.error("Error handling user registration response:", err);
    throw new HTTPException(400, {
      message: "Failed to process user registration",
    });
  }
}

export function badRequest(message: string): Response {
  throw new HTTPException(400, { message });
}

export function ok<T>(data?: T): Response<T> {
  return {
    data,
    err: undefined,
  };
}

export function parseTelegramId(path: string): string {
  const trimmed = path.trim().replace(/^\/+|\/+$/g, "");
  const parts = trimmed.split("/");

  if (parts.length < 2) {
    throw new Error("Path must be /path/{userID | telegramID}");
  }

  return parts[1];
}

// Middleware
export const errorHandler = async (c: Context, next: () => Promise<void>) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof HTTPException) {
      return c.json(
        {
          err: err.message,
        },
        err.status
      );
    }

    console.error("Unhandled error:", err);
    return c.json(
      {
        err: "Internal server error",
      },
      500
    );
  }
};

// Request context middleware for user registration
export const userRegContextMiddleware = async (
  c: Context,
  next: () => Promise<void>
) => {
  if (isUserRegistrationPath(c.req.path)) {
    try {
      const body = await c.req.json<CreateUserRequest>();
      c.set("userRequestData", body);
    } catch (err) {
      throw new HTTPException(400, { message: "Invalid request body" });
    }
  }
  await next();
};

// Helper for consistent response formatting
export function createJsonResponse<T>(data: T): Response<T> {
  return {
    data,
    err: undefined,
  };
}
