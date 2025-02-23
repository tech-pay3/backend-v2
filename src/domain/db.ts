// Base interface for common timestamp fields
interface Timestamped {
    created_at: Date
    updated_at?: Date
  }
  
  export interface User extends Timestamped {
    id: number
    email: string
    external_id: string
    referral_code: string
    twitter_id: string
    points: number
  }
  
  export interface PointsHistory {
    id: number
    user_id: string
    points: number
    activity: string
    created_at: Date
  }
  
  export interface Quest {
    id: number
    title: string
    description: string
    platform: string
    action: string
    target: string
    points: number
    message: string
    completed: number
    expires_at: Date
  }
  
  export interface Preorder {
    id: number
    user_external_id: string
    card_type: string
    created_at: Date
  }
  
  // Response types for API
  export interface UserResponse {
    points: number
    referral_code: string
    email: string
    twitter_id?: string
  }
  
  // Type guards
  export const isUser = (obj: any): obj is User => {
    return obj &&
      typeof obj.id === 'number' &&
      typeof obj.email === 'string' &&
      typeof obj.external_id === 'string' &&
      typeof obj.referral_code === 'string' &&
      typeof obj.points === 'number' &&
      obj.created_at instanceof Date
  }
  
  export const isQuest = (obj: any): obj is Quest => {
    return obj &&
      typeof obj.id === 'number' &&
      typeof obj.title === 'string' &&
      typeof obj.description === 'string' &&
      typeof obj.platform === 'string' &&
      typeof obj.action === 'string' &&
      typeof obj.target === 'string' &&
      typeof obj.points === 'number' &&
      typeof obj.completed === 'number' &&
      obj.expires_at instanceof Date
  }
  
  // Utility types for creating new records
  export type CreateUserInput = Omit<User, 'id' | 'created_at' | 'updated_at'>
  export type CreateQuestInput = Omit<Quest, 'id' | 'completed'>
  export type CreatePreorderInput = Omit<Preorder, 'id' | 'created_at'>