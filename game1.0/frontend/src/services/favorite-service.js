// 收藏服务
import { supabase, TABLES } from '../supabase-config.js'

export class FavoriteService {
  // 添加收藏
  static async addFavorite(userId, targetType, targetId) {
    const { data, error } = await supabase
      .from(TABLES.FAVORITES)
      .insert([
        {
          user_id: userId,
          target_type: targetType,
          target_id: targetId
        }
      ])
      .select()

    if (error) throw error
    return data[0]
  }

  // 移除收藏
  static async removeFavorite(userId, targetType, targetId) {
    const { data, error } = await supabase
      .from(TABLES.FAVORITES)
      .delete()
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .select()

    if (error) throw error
    return data[0]
  }

  // 检查是否已收藏
  static async isFavorited(userId, targetType, targetId) {
    const { data, error } = await supabase
      .from(TABLES.FAVORITES)
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  }

  // 获取用户收藏列表
  static async getUserFavorites(userId, targetType = null, limit = 20, offset = 0) {
    let query = supabase
      .from(TABLES.FAVORITES)
      .select(`
        *,
        playmate:playmates!favorites_target_id_fkey(*, user:users(username, avatar_url)),
        club:clubs!favorites_target_id_fkey(*),
        service:services!favorites_target_id_fkey(*, game:games(*), playmate:playmates(nickname))
      `)
      .eq('user_id', userId)

    if (targetType) {
      query = query.eq('target_type', targetType)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  // 获取收藏统计
  static async getFavoriteStats(targetType, targetId) {
    const { count, error } = await supabase
      .from(TABLES.FAVORITES)
      .select('*', { count: 'exact', head: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId)

    if (error) throw error
    return count || 0
  }
}

export default FavoriteService