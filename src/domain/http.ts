// Authentication and User Creation
export interface CreateUserResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  user_id: string;
  scope: string;
  expires_in: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  userType?: string;
  emailConfirmCode?: string;
}

export interface WhitelistRequest {
  external_id: string;
  email: string;
}

export interface CreateTelegramUserRequest {
  external_id: string;
  referral_code: string;
}

// Card and Quest Related
export interface PreorderCardRequest {
  external_id: string;
  card_type: string;
}

export interface CompleteQuestRequest {
  external_id: string;
  quest_id: number;
}

// User Data and Referrals
export interface UserResponse {
  email: string;
  points: number;
  referral_code: string;
  twitter_id: string;
}

export interface GetReferrerCodeRequest {
  access_token: string;
  user_id: number;
}

export interface ReferreesResponse {
  points: number;
  referral_code: string;
  code_users: User[];
  points_history: PointsHistory[];
}

// Zod schemas for runtime validation
import { z } from "zod";
import { PointsHistory, User } from "./db";

export const createUserRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  userType: z.string().optional(),
  emailConfirmCode: z.string().optional(),
});

export const whitelistRequestSchema = z.object({
  external_id: z.string(),
  email: z.string().email(),
});

export const completeQuestRequestSchema = z.object({
  external_id: z.string(),
  quest_id: z.number().int().positive(),
});

export const preorderCardRequestSchema = z.object({
  external_id: z.string(),
  card_type: z.string(),
});

// Type guards
export const isCreateUserResponse = (obj: any): obj is CreateUserResponse => {
  return (
    obj &&
    typeof obj.access_token === "string" &&
    typeof obj.token_type === "string" &&
    typeof obj.refresh_token === "string" &&
    typeof obj.user_id === "string" &&
    typeof obj.scope === "string" &&
    typeof obj.expires_in === "number"
  );
};

export const isUserResponse = (obj: any): obj is UserResponse => {
  return (
    obj &&
    typeof obj.email === "string" &&
    typeof obj.points === "number" &&
    typeof obj.referral_code === "string" &&
    typeof obj.twitter_id === "string"
  );
};

// Utility type for API responses
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Helper function for API responses
export const createApiResponse = <T>(
  data: T,
  error?: string
): ApiResponse<T> => ({
  data,
  error,
});
