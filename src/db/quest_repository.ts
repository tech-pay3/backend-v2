import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/supabase";

// Types
interface Quest {
  id: number;
  title: string;
  description: string;
  platform: string;
  action: string;
  target: string;
  points: number;
  message?: string;
  expires_at?: Date;
  completed?: number;
}

export class QuestRepository {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async getActiveQuestsForUser(externalId: string): Promise<Quest[]> {
    try {
      // First get the count of INVITE quests for the user
      const { data: inviteCount, error: countError } = await this.supabase
        .from("user_quests")
        .select("quest_id", { count: "exact" })
        .eq("user_id", externalId)
        .eq("action", "INVITE");

      if (countError) throw countError;
      const { data: quests, error: questsError } = await this.supabase
        .from("quests")
        .select("*")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .not(
          "id",
          "in",
          (sb: {
            from: (arg0: string) => {
              (): any;
              new (): any;
              select: {
                (arg0: string): {
                  (): any;
                  new (): any;
                  eq: {
                    (arg0: string, arg1: string): {
                      (): any;
                      new (): any;
                      eq: { (arg0: string, arg1: boolean): any; new (): any };
                    };
                    new (): any;
                  };
                };
                new (): any;
              };
            };
          }) =>
            sb
              .from("user_quests")
              .select("quest_id")
              .eq("user_id", externalId)
              .eq("fully_completed", true)
        );

      if (questsError) throw questsError;

      return (
        quests?.map((quest) => ({
          ...quest,
          completed: quest.action === "INVITE" ? inviteCount?.length || 0 : 0,
        })) || []
      );
    } catch (error) {
      throw new Error(`Failed to get active quests: ${error}`);
    }
  }

  async getQuestsByAction(action: string, sortBy?: string): Promise<Quest[]> {
    try {
      let query = this.supabase
        .from("quests")
        .select("*")
        .eq("action", action)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (sortBy) {
        query = query.order(sortBy);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to get quests by action: ${error}`);
    }
  }

  async markQuestCompleted(
    externalId: string,
    questId: number,
    fullyCompleted: boolean
  ): Promise<void> {
    try {
      const { error } = await this.supabase.from("user_quests").insert({
        user_id: externalId,
        quest_id: questId,
        fully_completed: fullyCompleted,
      });

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to mark quest as completed: ${error}`);
    }
  }

  async getQuestById(questId: number): Promise<Quest | null> {
    try {
      const { data, error } = await this.supabase
        .from("quests")
        .select("*")
        .eq("id", questId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get quest by id: ${error}`);
    }
  }

  async countUserQuests(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from("user_quests")
        .select("quest_id", { count: "exact" })
        .eq("user_id", userId)
        const count = data?.length ?? 0;
        return count;
    } catch (error) {
      throw new Error(`Failed to count user quests: ${error}`);
    }
  }
}
