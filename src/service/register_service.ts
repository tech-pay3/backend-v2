import { Context } from "hono";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// Types
interface CreateUserRequest {
  email: string;
}

interface CreateUserResponse {
  userId: string;
}

interface CreateTelegramUserRequest {
  externalId: string;
  telegramUsername: string;
  telegramProfilePic?: string;
  referralCode?: string;
  email: string;
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

export class RegisterService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async handleUserReg(
    ctx: Context,
    req: CreateUserRequest,
    metadata: { userId: string }
  ): Promise<void> {
    const { error } = await this.supabase.from("users").insert({
      email: req.email,
      external_id: metadata.userId,
    });

    if (error) throw error;
    console.debug(`Inserted user ${metadata.userId}`);
  }

  async createTelegramUser(
    ctx: Context,
    req: CreateTelegramUserRequest
  ): Promise<any> {
    const { data, error } = await this.supabase
      .from("users")
      .insert({
        external_id: req.externalId,
        telegram_id: req.externalId,
        email: req.email || "",
        telegram_username: req.telegramUsername,
        telegram_profile_pic: req.telegramProfilePic,
        referral_code: req.referralCode || "",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

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

  async preorderCard(ctx: Context, req: PreorderCardRequest): Promise<void> {
    const { error } = await this.supabase.from("preorders").insert({
      external_id: req.externalId,
      card_type: req.cardType,
    });

    if (error) throw error;
  }

  async getUserPreorders(ctx: Context, telegramId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("preorders")
      .select("*")
      .eq("external_id", telegramId);

    if (error) throw error;
    return data as any[];
  }

  async getAllUsers(): Promise<any[]> {
    const { data, error } = await this.supabase.from("users").select("*");
    if (error) throw error;
    return data || [];
  }
}
