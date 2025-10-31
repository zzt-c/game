// 用户管理服务
import { supabase, TABLES } from '../supabase-config.js'

export class UserService {
  // 获取用户信息
  static async getUserProfile(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  // 更新用户信息
  static async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()

    if (error) throw error
    return data[0]
  }

  // 实名认证
  static async verifyRealName(userId, realName, idCard) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update({
        real_name: realName,
        id_card: idCard,
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()

    if (error) throw error
    return data[0]
  }

  // 获取用户余额
  static async getUserBalance(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('balance')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data.balance
  }

  // 充值余额
  static async rechargeBalance(userId, amount) {
    const { data, error } = await supabase.rpc('increment_balance', {
      user_id: userId,
      amount
    })

    if (error) throw error
    return data
  }

  // 获取用户订单统计
  static async getUserStats(userId) {
    const { data: orderStats, error: orderError } = await supabase
      .from(TABLES.ORDERS)
      .select('status, count')
      .eq('user_id', userId)
      .group('status')

    if (orderError) throw orderError

    const { data: favoriteStats, error: favoriteError } = await supabase
      .from(TABLES.FAVORITES)
      .select('target_type, count')
      .eq('user_id', userId)
      .group('target_type')

    if (favoriteError) throw favoriteError

    return {
      orders: orderStats,
      favorites: favoriteStats
    }
  }
}

export default UserService