import { createClient } from '@supabase/supabase-js'
import { Database } from './types/supabase'  // You'll need to generate these types

// Environment variables for Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

// Database client class
export class DatabaseClient {
  private static instance: DatabaseClient
  private supabase

  private constructor() {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    })
  }

  // Singleton pattern
  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient()
    }
    return DatabaseClient.instance
  }

  // Users Repository
  public users = {
    async getById(id: string): Promise<any> {
      const { data, error } = await (this as any).supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    async create(userData: { email: string, name: string }): Promise<any> {
      const { data, error } = await (this as any).supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      
      if (error) throw error
      return data
    },

    // Add more user-related methods as needed
  }

  // Quests Repository
  public quests = {
    async getAll(): Promise<any> {
      const { data, error } = await (this as any).supabase
        .from('quests')
        .select('*')
      if (error) throw error
      return data
    },

    async create(questData: { title: string, description: string }): Promise<any> {
      const { data, error } = await (this as any).supabase
        .from('quests')
        .insert(questData)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    // Add more quest-related methods as needed
  }

  // Helper method to check connection
  public async checkConnection() {
    try {
      const { data, error } = await this.supabase.from('users').select('id').limit(1)
      if (error) throw error
      return true
    } catch (error) {
      console.error('Database connection error:', error)
      return false
    }
  }
}

// Usage example
export const db = DatabaseClient.getInstance()