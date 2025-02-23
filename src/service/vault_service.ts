import { Context } from "hono";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../db/types/supabase";

// Types
interface CreateUserRequest {
  email: string;
}

interface CreateUserResponse {
  userId: string;
}

interface CreateTelegramUserRequest {
  externalId: string;
}

interface PreorderCardRequest {
  externalId: string;
  cardType: string;
}

interface Preorder {
  id: number;
  external_id: string;
  card_type: string;
  created_at: string;
}

export class VaultService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async whitelistUser(
    ctx: Context,
    externalId: string,
    email: string
  ): Promise<void> {
    // Whitelist the user
    const { error: whitelistError } = await this.supabase
      .from("users")
      .update({
        whitelisted: true,
        email: email,
      })
      .eq("external_id", externalId);

    if (whitelistError) throw whitelistError;

    // Get referrer
    const { data: referral, error: referralError } = await this.supabase
      .from("user_referrals")
      .select("referrer_id")
      .eq("referee_id", externalId)
      .single();

    if (referralError) {
      if (referralError.code === "PGRST116") return; // No referrer found
      throw referralError;
    }

    // Start a transaction to update referrer's points
    const { error: pointsError } = await this.supabase.rpc(
      "update_referrer_points",
      {
        p_referrer_id: referral.referrer_id,
        p_points: 300,
        p_message: "Your friend signed up for the whitelist",
      }
    );

    if (pointsError) throw pointsError;
  }

  async handleUserReg(
    ctx: Context,
    req: CreateUserRequest,
    resp: CreateUserResponse
  ): Promise<void> {
    const { error } = await this.supabase.from("users").insert({
      email: req.email,
      external_id: resp.userId,
    });

    if (error) throw error;
    console.debug(`Inserted user ${resp.userId}`);
  }

  async createTelegramUser(
    ctx: Context,
    req: CreateTelegramUserRequest
  ): Promise<void> {
    const { error } = await this.supabase.from("users").insert({
      external_id: req.externalId,
      telegram_id: req.externalId,
    });

    if (error) throw error;
  }

  async preorderCard(ctx: Context, req: PreorderCardRequest): Promise<void> {
    const { error } = await this.supabase.from("preorders").insert({
      external_id: req.externalId,
      card_type: req.cardType,
    });

    if (error) throw error;
  }

  async getUserPreorders(
    ctx: Context,
    externalId: string
  ): Promise<Preorder[]> {
    const { data, error } = await this.supabase
      .from("preorders")
      .select("*")
      .eq("external_id", externalId);

    if (error) throw error;
    return data as Preorder[];
  }
}
