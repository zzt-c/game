// 陪玩者服务
import { supabase, TABLES } from '../supabase-config.js'

export class PlaymateService {
  // 获取热门陪玩者
  static async getHotPlaymates(limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from(TABLES.PLAYMATES)
      .select(`
        *,
        user:users(username, avatar_url),
        services!inner(*)
      `)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  // 根据游戏筛选陪玩者
  static async getPlaymatesByGame(gameId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from(TABLES.PLAYMATES)
      .select(`
        *,
        user:users(username, avatar_url),
        services!inner(*)
      `)
      .eq('services.game_id', gameId)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  // 搜索陪玩者
  static async searchPlaymates(query, filters = {}, limit = 20, offset = 0) {
    let queryBuilder = supabase
      .from(TABLES.PLAYMATES)
      .select(`
        *,
        user:users(username, avatar_url),
        services(*)
      `)
      .eq('is_available', true)

    // 关键词搜索
    if (query) {
      queryBuilder = queryBuilder.or(`nickname.ilike.%${query}%,introduction.ilike.%${query}%`)
    }

    // 应用筛选条件
    if (filters.gameId) {
      queryBuilder = queryBuilder.eq('services.game_id', filters.gameId)
    }
    if (filters.minRating) {
      queryBuilder = queryBuilder.gte('rating', filters.minRating)
    }
    if (filters.maxPrice) {
      queryBuilder = queryBuilder.lte('hourly_rate', filters.maxPrice)
    }
    if (filters.tags && filters.tags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', filters.tags)
    }

    const { data, error } = await queryBuilder
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  // 获取陪玩者详情
  static async getPlaymateDetail(playmateId) {
    const { data, error } = await supabase
      .from(TABLES.PLAYMATES)
      .select(`
        *,
        user:users(*),
        services(*, game:games(*)),
        reviews:reviews(*, reviewer:users(username, avatar_url)),
        club:clubs(name, logo_url, rating)
      `)
      .eq('id', playmateId)
      .single()

    if (error) throw error
    return data
  }

  // 获取陪玩者服务
  static async getPlaymateServices(playmateId) {
    const { data, error } = await supabase
      .from(TABLES.SERVICES)
      .select(`
        *,
        game:games(*)
      `)
      .eq('playmate_id', playmateId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // 更新陪玩者在线状态
  static async updateOnlineStatus(playmateId, isOnline) {
    const { data, error } = await supabase
      .from(TABLES.PLAYMATES)
      .update({
        is_online: isOnline,
        updated_at: new Date().toISOString()
      })
      .eq('id', playmateId)
      .select()

    if (error) throw error
    return data[0]
  }

  // 获取陪玩者统计数据
  static async getPlaymateStats(playmateId) {
    const { data: orderStats, error: orderError } = await supabase
      .from(TABLES.ORDERS)
      .select('status, count')
      .eq('playmate_id', playmateId)
      .group('status')

    if (orderError) throw orderError

    const { data: reviewStats, error: reviewError } = await supabase
      .from(TABLES.REVIEWS)
      .select('rating, count')
      .eq('reviewee_id', playmateId)
      .group('rating')

    if (reviewError) throw reviewError

    return {
      orders: orderStats,
      reviews: reviewStats
    }
  }
}

export default PlaymateService