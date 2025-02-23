import { Context } from 'hono'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../db/types/supabase'

// Types
interface Quest {
  id: number
  title: string
  message: string
  target: string
  action: string
  points: number
}

interface Referee {
  external_id: string
  created_at: string
}

interface PointHistory {
  points: number
  message: string
  created_at: string
}

interface ReferreesResponse {
  referralCode: string
  points: number
  referrees: Referee[]
  pointsHistory: PointHistory[]
}

class QuestManager {
  constructor(private supabase: SupabaseClient<Database>) {}

  async isQuestCompleted(quest: Quest, externalId: string): Promise<boolean> {
    // Implement quest completion logic based on quest.action
    const { data, error } = await this.supabase
      .from('user_quests')
      .select('*')
      .eq('external_id', externalId)
      .eq('quest_id', quest.id)
      .single()

    if (error) throw error
    return data?.completed || false
  }
}

export class ReferralService {
  private questManager: QuestManager

  constructor(private supabase: SupabaseClient<Database>) {
    this.questManager = new QuestManager(supabase)
  }

  async getActiveQuests(ctx: Context, externalId: string): Promise<Quest[]> {
    const { data, error } = await this.supabase
      .from('quests')
      .select('*')
      .eq('active', true)
      .order('id', { ascending: true })

    if (error) throw error
    return data as Quest[]
  }

  async getReferrerData(ctx: Context, telegramId: string): Promise<ReferreesResponse> {
    // Get user data
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('referral_code, points')
      .eq('external_id', telegramId)
      .single()

    if (userError) throw userError

    // Get referrees
    const { data: referrees, error: refError } = await this.supabase
      .from('user_referrals')
      .select('referee_id, created_at')
      .eq('referrer_id', telegramId)

    if (refError) throw refError

    // Get points history
    const { data: pointsHistory, error: pointsError } = await this.supabase
      .from('user_points_history')
      .select('points, message, created_at')
      .eq('user_id', telegramId)
      .order('created_at', { ascending: false })

    if (pointsError) throw pointsError

    return {
      referralCode: user.referral_code,
      points: user.points,
      referrees: referrees.map(r => ({
        external_id: r.referee_id,
        created_at: r.created_at
      })),
      pointsHistory: pointsHistory
    }
  }

  async useReferralCode(ctx: Context, externalId: string, referralCode: string): Promise<void> {
    // Get user's own referral code
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('referral_code')
      .eq('external_id', externalId)
      .single()

    if (userError) throw userError
    if (user.referral_code === referralCode) {
      throw new Error('Cannot use your own referral code')
    }

    // Check if referee exists
    const { data: referee, error: refError } = await this.supabase
      .from('user_referrals')
      .select('*')
      .eq('referee_id', externalId)
      .single()

    if (refError && refError.code !== 'PGRST116') throw refError
    if (referee) throw new Error(`Referee with ID ${externalId} has already used a referral code`)

    // Get referrer
    const { data: referrer, error: referrerError } = await this.supabase
      .from('users')
      .select('external_id')
      .eq('referral_code', referralCode)
      .single()

    if (referrerError) throw referrerError

    // Start a transaction
    const { error: transactionError } = await this.supabase.rpc('process_referral', {
      p_referrer_id: referrer.external_id,
      p_referee_id: externalId,
      p_points: 100
    })

    if (transactionError) throw transactionError
  }

  async completeQuest(ctx: Context, externalId: string, questId: number): Promise<void> {
    // Get quest
    const { data: quest, error: questError } = await this.supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .single()

    if (questError) throw questError

    const completed = await this.questManager.isQuestCompleted(quest, externalId)
    if (!completed) throw new Error('Quest not completed')

    // Start a transaction
    const { error: transactionError } = await this.supabase.rpc('process_quest_completion', {
      p_external_id: externalId,
      p_quest_id: questId,
      p_points: quest.points,
      p_message: quest.message
    })

    if (transactionError) throw transactionError
  }

  async completeInviteQuest(ctx: Context, externalId: string): Promise<void> {
    // Get invite count
    const { count, error: countError } = await this.supabase
      .from('user_referrals')
      .select('*', { count: 'exact' })
      .eq('referrer_id', externalId)

    if (countError) throw countError

    // Get invite quests
    const { data: inviteQuests, error: questError } = await this.supabase
      .from('quests')
      .select('*')
      .eq('action', 'INVITE')
      .order('target', { ascending: true })

    if (questError) throw questError

    if (count === null) return

    const targetQuest = parseInt(inviteQuests[inviteQuests.length - 1].target)
    if (count > targetQuest) return

    const currQuest = inviteQuests.find(q => parseInt(q.target) > count)
    if (!currQuest) return

    const completed = await this.questManager.isQuestCompleted(currQuest, externalId)

    // Update quest status and points
    const { error: transactionError } = await this.supabase.rpc('process_invite_quest', {
      p_external_id: externalId,
      p_quest_id: currQuest.id,
      p_completed: completed,
      p_points: currQuest.points,
      p_message: currQuest.message
    })

    if (transactionError) throw transactionError
  }
}