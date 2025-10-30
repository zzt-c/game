// Supabase配置
import { createClient } from '@supabase/supabase-js'

// 从环境变量获取配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://peqjtpoqycwxndacnwfc.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWp0cG9xeWN3eG5kYWNud2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTgzNzcsImV4cCI6MjA3NzE5NDM3N30.ZK-OjFc_iEuUTPBfVq1IYKPoKxxford1T7c7HaxcZvg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

export default supabase