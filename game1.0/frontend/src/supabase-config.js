// Supabase配置 - 修正版本
import { createClient } from '@supabase/supabase-js'

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  CLUBS: 'clubs',
  PLAYMATES: 'playmates',
  SERVICES: 'services',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  MESSAGES: 'messages',
  FAVORITES: 'favorites',
  GAMES: 'games'
}

// 存储桶名称常量
export const BUCKETS = {
  AVATARS: 'avatars',
  SERVICE_IMAGES: 'service-images',
  REVIEW_IMAGES: 'review-images'
}

export default supabase