import { Context, Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { VaultService } from '../service/vault_service'
import { ReferralService } from '../service/referral_service'

// Types
interface WhitelistRequest {
  externalId: string
  email: string
}

interface CompleteQuestRequest {
  externalId: string
  questId: number
}

interface CreateUserRequest {
  email: string
}

interface CreateTelegramUserRequest {
  externalId: string
  referralCode?: string
}

interface PreorderCardRequest {
  externalId: string
  cardType: string
}

export class AppHandler {
  private app: Hono

  constructor(
    private vaultService: VaultService,
    private referralService: ReferralService
  ) {
    this.app = new Hono()
    this.setupMiddleware()
    this.setupRoutes()
  }

  private setupMiddleware() {
    this.app.use('*', cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization']
    }))
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', this.handleHealth)

    // User registration
    this.app.post('/reg/user', this.handleUserReg)
    this.app.post('/reg/telegram-user', this.handleCreateTelegramUser)

    // Whitelist
    this.app.post('/whitelist', this.handleWhitelist)

    // Quests
    this.app.get('/quests/:telegramId', this.handleGetQuests)
    this.app.post('/quest/complete', this.handleQuestComplete)
    this.app.post('/quest-invite/complete', this.handleInviteQuestComplete)

    // Referrals
    this.app.get('/referral/:telegramId', this.handleReferral)

    // Preorders
    this.app.post('/preorder', this.handlePreorder)
    this.app.get('/preorder/:telegramId', this.handleGetPreorders)
  }

  private handleHealth = (c: Context) => {
    return c.json({ status: 'healthy' })
  }

  private handleWhitelist = async (c: Context) => {
    try {
      const body = await c.req.json<WhitelistRequest>()
      await this.vaultService.whitelistUser(c, body.externalId, body.email)
      return c.json({ status: 'Success' })
    } catch (err) {
      console.error('Error whitelisting user:', err)
      throw new HTTPException(400, { message: 'Failed to whitelist user' })
    }
  }

  private handleQuestComplete = async (c: Context) => {
    try {
      const body = await c.req.json<CompleteQuestRequest>()
      await this.referralService.completeQuest(c, body.externalId, body.questId)
      return c.json({ status: 'Success' })
    } catch (err) {
      console.error('Failed to complete quest:', err)
      throw new HTTPException(400, { message: 'Failed to complete quest' })
    }
  }

  private handleInviteQuestComplete = async (c: Context) => {
    try {
      const body = await c.req.json<CompleteQuestRequest>()
      await this.referralService.completeInviteQuest(c, body.externalId)
      return c.json({ status: 'Success' })
    } catch (err) {
      console.error('Failed to complete invite quest:', err)
      throw new HTTPException(400, { message: 'Failed to complete invite quest' })
    }
  }

  private handleGetQuests = async (c: Context) => {
    try {
      const telegramId = c.req.param('telegramId')
      const quests = await this.referralService.getActiveQuests(c, telegramId)
      return c.json(quests)
    } catch (err) {
      console.error('Failed to fetch quests:', err)
      throw new HTTPException(400, { message: 'Failed to fetch quests' })
    }
  }

  private handleUserReg = async (c: Context) => {
    try {
      const body = await c.req.json<CreateUserRequest>()
      const userId = 'generated-user-id' // Replace with actual ID generation
      await this.vaultService.handleUserReg(c, body, { userId })
      return c.json({ status: 'Success', userId })
    } catch (err) {
      console.error('Failed to register user:', err)
      throw new HTTPException(400, { message: 'Failed to register user' })
    }
  }

  private handleCreateTelegramUser = async (c: Context) => {
    try {
      const body = await c.req.json<CreateTelegramUserRequest>()
      
      await this.vaultService.createTelegramUser(c, body)
      
      if (body.referralCode) {
        console.debug(`Using referral for user ${body.externalId} with code ${body.referralCode}`)
        await this.referralService.useReferralCode(c, body.externalId, body.referralCode)
      }
      
      return c.json({ status: 'Success' })
    } catch (err) {
      console.error('Failed to create telegram user:', err)
      throw new HTTPException(400, { message: 'Failed to create telegram user' })
    }
  }

  private handleReferral = async (c: Context) => {
    try {
      const telegramId = c.req.param('telegramId')
      const referralData = await this.referralService.getReferrerData(c, telegramId)
      return c.json(referralData)
    } catch (err) {
      console.error('Failed to get referral data:', err)
      throw new HTTPException(400, { message: 'Failed to get referral data' })
    }
  }

  private handlePreorder = async (c: Context) => {
    try {
      const body = await c.req.json<PreorderCardRequest>()
      await this.vaultService.preorderCard(c, body)
      return c.json({ status: 'success' })
    } catch (err) {
      console.error('Failed to preorder card:', err)
      throw new HTTPException(400, { message: 'Failed to preorder card' })
    }
  }

  private handleGetPreorders = async (c: Context) => {
    try {
      const telegramId = c.req.param('telegramId')
      const preorders = await this.vaultService.getUserPreorders(c, telegramId)
      return c.json(preorders)
    } catch (err) {
      console.error('Failed to get preorders:', err)
      throw new HTTPException(400, { message: 'Failed to get preorders' })
    }
  }

  public getApp() {
    return this.app
  }
}