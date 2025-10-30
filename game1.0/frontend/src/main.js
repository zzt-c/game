// 主入口文件 - 前端集成示例
import { supabase } from './supabase-config.js'
import AuthService from './services/auth-service.js'
import UserService from './services/user-service.js'
import PlaymateService from './services/playmate-service.js'
import OrderService from './services/order-service.js'
import ClubService from './services/club-service.js'
import ChatService from './services/chat-service.js'
import FavoriteService from './services/favorite-service.js'
import ReviewService from './services/review-service.js'
import ApiClient from './utils/api-client.js'

// 全局API对象，供前端页面调用
window.GameCompanionAPI = {
  // 认证相关
  auth: AuthService,
  
  // 数据服务
  user: UserService,
  playmate: PlaymateService,
  order: OrderService,
  club: ClubService,
  chat: ChatService,
  favorite: FavoriteService,
  review: ReviewService,
  
  // 工具类
  utils: ApiClient,
  
  // Supabase客户端
  client: supabase
}

// 初始化应用
console.log('游戏陪玩服务平台后端API已加载')

// 实时订阅示例
supabase.auth.onAuthStateChange((event, session) => {
  console.log('认证状态变更:', event, session)
  
  if (event === 'SIGNED_IN') {
    console.log('用户已登录')
    // 可以在这里初始化用户相关数据
  } else if (event === 'SIGNED_OUT') {
    console.log('用户已退出')
  }
})

// 导出供模块化使用
export {
  supabase,
  AuthService,
  UserService,
  PlaymateService,
  OrderService,
  ClubService,
  ChatService,
  FavoriteService,
  ReviewService,
  ApiClient
}