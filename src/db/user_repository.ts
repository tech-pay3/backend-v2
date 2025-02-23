import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/supabase";

interface PointsHistory {
  id: number;
  user_id: string;
  points: number;
  activity: string;
  created_at: Date;
}

interface UserResponse {
  points: number;
  referral_code: string;
  email: string;
  twitter_id?: string;
}

interface Preorder {
  id: number;
  user_external_id: string;
  card_type: string;
  created_at: Date;
}

interface User {
  id: number;
  email: string;
  external_id: string;
  referral_code: string;
  points: number;
  created_at: Date;
  updated_at: Date;
}

export class UsersRepository {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async whitelistUser(externalId: string, email: string): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .update({
        email,
        updated_at: new Date().toISOString(),
      })
      .eq("external_id", externalId);

    if (error) throw new Error(`Failed to whitelist user: ${error.message}`);
  }

  async getUserPointsHistory(externalId: string): Promise<PointsHistory[]> {
    const { data, error } = await this.supabase
      .from("user_points")
      .select("*")
      .eq("user_id", externalId)
      .order("created_at", { ascending: false });

    if (error)
      throw new Error(`Failed to get points history: ${error.message}`);
    return data || [];
  }

  async insertUser(email: string, externalId: string): Promise<void> {
    const referralCode = this.generateReferralCode();

    const { error } = await this.supabase.from("users").insert({
      email,
      external_id: externalId,
      referral_code: referralCode,
      points: 0,
      twitter_id: "",
    });

    if (error) throw new Error(`Failed to insert user: ${error.message}`);
  }

  async insertPreorder(externalId: string, cardType: string): Promise<void> {
    const { error } = await this.supabase.from("preorders").insert({
      user_external_id: externalId,
      card_type: cardType,
    });

    if (error) throw new Error(`Failed to insert preorder: ${error.message}`);
  }

  async insertUserReferral(
    referrerId: string,
    refereeId: string
  ): Promise<void> {
    const { error } = await this.supabase.from("user_referrals").insert({
      referrer_id: referrerId,
      referee_id: refereeId,
    });

    if (error)
      throw new Error(`Failed to insert user referral: ${error.message}`);
  }

  async checkReferee(refereeId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("user_referrals")
      .select("*", { count: "exact" })
      .eq("referee_id", refereeId);

    if (error) throw new Error(`Failed to check referee: ${error.message}`);
    return (data?.length || 0) > 0;
  }

  async getReferrerOfReferee(refereeId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from("user_referrals")
      .select("referrer_id")
      .eq("referee_id", refereeId)
      .single();

    if (error) throw new Error(`Failed to get referrer: ${error.message}`);
    return data.referrer_id;
  }

  async getUserByReferralCode(referralCode: string): Promise<string> {
    const { data, error } = await this.supabase
      .from("users")
      .select("external_id")
      .eq("referral_code", referralCode)
      .single();

    if (error)
      throw new Error(`Failed to get user by referral code: ${error.message}`);
    return data.external_id;
  }

  async getReferralCodeByExternalId(externalId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from("users")
      .select("referral_code")
      .eq("external_id", externalId)
      .single();

    if (error) throw new Error(`Failed to get referral code: ${error.message}`);
    return data.referral_code;
  }

  async getRefereesByReferralCode(referralCode: string): Promise<User[]> {
    // Fetch the external_id for the given referral code
    const { data: userData, error: userError } = await this.supabase
      .from("users")
      .select("external_id")
      .eq("referral_code", referralCode)
      .single();

    if (userError)
      throw new Error(
        `Failed to get user by referral code: ${userError.message}`
      );

    // Get the referee_ids from user_referrals table
    const { data: referralData, error: referralError } = await this.supabase
      .from("user_referrals")
      .select("referee_id")
      .eq("referrer_id", userData.external_id);

    if (referralError)
      throw new Error(`Failed to get user referrals: ${referralError.message}`);

    const refereeIds = referralData.map((referral: any) => referral.referee_id);

    // Query users with those referee ids
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .in("external_id", refereeIds);

    if (error) throw new Error(`Failed to get referees: ${error.message}`);
    return data || [];
  }

  async incrementUserPoints(
    userId: string,
    pointsToAdd: number
  ): Promise<void> {
    const { error } = await this.supabase.rpc("increment_user_points", {
      user_id: userId,
      points_to_add: pointsToAdd,
    });

    if (error) throw new Error(`Failed to increment points: ${error.message}`);
  }

  async insertUserPoints(
    externalId: string,
    points: number,
    activity: string
  ): Promise<void> {
    const { error } = await this.supabase.from("user_points").insert({
      user_id: externalId,
      points,
      activity,
    });

    if (error)
      throw new Error(`Failed to insert user points: ${error.message}`);
  }

  async getUserDataByExternalId(externalId: string): Promise<UserResponse> {
    const { data, error } = await this.supabase
      .from("users")
      .select("points, referral_code, email, twitter_id")
      .eq("external_id", externalId)
      .single();

    if (error) throw new Error(`Failed to get user data: ${error.message}`);
    return data;
  }

  async getPreordersByExternalId(externalId: string): Promise<Preorder[]> {
    const { data, error } = await this.supabase
      .from("preorders")
      .select("*")
      .eq("user_external_id", externalId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to get preorders: ${error.message}`);
    return data || [];
  }

  private generateReferralCode(): string {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 10 }, () =>
      charset.charAt(Math.floor(Math.random() * charset.length))
    ).join("");
  }
}
