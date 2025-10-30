// 俱乐部管理服务
import { supabase, TABLES } from '../supabase-config.js'

export class ClubService {
  // 获取热门俱乐部
  static async getHotClubs(limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from(TABLES.CLUBS)
      .select(`
        *,
        playmates(count),
        services(count)
      `)
      .eq('status', 'active')
      .eq('is_verified', true)
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  // 获取俱乐部详情
  static async getClubDetail(clubId) {
    const { data, error } = await supabase
      .from(TABLES.CLUBS)
      .select(`
        *,
        playmates(*, user:users(username, avatar_url)),
        services(*, game:games(*), playmate:playmates(nickname))
      `)
      .eq('id', clubId)
      .single()

    if (error) throw error
    return data
  }

  // 搜索俱乐部
  static async searchClubs(query, filters = {}, limit = 20, offset = 0) {
    let queryBuilder = supabase
      .from(TABLES.CLUBS)
      .select(`
        *,
        playmates(count),
        services(count)
      `)
      .eq('status', 'active')
      .eq('is_verified', true)

    // 关键词搜索
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // 应用筛选条件
    if (filters.minRating) {
      queryBuilder = queryBuilder.gte('rating', filters.minRating)
    }

    const { data, error } = await queryBuilder
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  // 创建俱乐部（入驻申请）
  static async createClub(ownerId, clubData) {
    const { data, error } = await supabase
      .from(TABLES.CLUBS)
      .insert([
        {
          ...clubData,
          owner_id: ownerId,
          status: 'pending', // 等待审核
          is_verified: false
        }
      ])
      .select()

    if (error) throw error
    return data[0]
  }

  // 更新俱乐部信息
  static async updateClub(clubId, ownerId, updates) {
    const { data, error } = await supabase
      .from(TABLES.CLUBS)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', clubId)
      .eq('owner_id', ownerId)
      .select()

    if (error) throw error
    return data[0]
  }

  // 获取俱乐部订单
  static async getClubOrders(clubId, status = null, limit = 20, offset = 0) {
    let query = supabase
      .from(TABLES.ORDERS)
      .select(`
        *,
        service:services(*, game:games(*)),
        user:users(username, avatar_url, phone),
        playmate:playmates(nickname, user:users(username))
      `)
      .eq('club_id', clubId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  // 获取俱乐部统计数据
  static async getClubStats(clubId) {
    const { data: orderStats, error: orderError } = await supabase
      .from(TABLES.ORDERS)
      .select('status, count')
      .eq('club_id', clubId)
      .group('status')

    if (orderError) throw orderError

    const { data: playmateStats, error: playmateError } = await supabase
      .from(TABLES.PLAYMATES)
      .select('is_online, count')
      .eq('club_id', clubId)
      .group('is_online')

    if (playmateError) throw playmateError

    const { data: serviceStats, error: serviceError } = await supabase
      .from(TABLES.SERVICES)
      .select('game_id, count')
      .eq('playmate.club_id', clubId)
      .group('game_id')

    if (serviceError) throw serviceError

    return {
      orders: orderStats,
      playmates: playmateStats,
      services: serviceStats
    }
  }

  // 添加陪玩者到俱乐部
  static async addPlaymateToClub(clubId, userId, playmateData) {
    // 先检查用户是否已经是陪玩者
    const { data: existingPlaymate, error: checkError } = await supabase
      .from(TABLES.PLAYMATES)
      .select('id')
      .eq('user_id', userId)
      .single()

    let playmateId

    if (checkError && checkError.code !== 'PGRST116') {
      // 如果不是"未找到"错误，则抛出
      throw checkError
    }

    if (existingPlaymate) {
      // 更新现有陪玩者
      const { data, error } = await supabase
        .from(TABLES.PLAYMATES)
        .update({
          club_id: clubId,
          ...playmateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPlaymate.id)
        .select()

      if (error) throw error
      playmateId = data[0].id
    } else {
      // 创建新陪玩者
      const { data, error } = await supabase
        .from(TABLES.PLAYMATES)
        .insert([
          {
            user_id: userId,
            club_id: clubId,
            ...playmateData
          }
        ])
        .select()

      if (error) throw error
      playmateId = data[0].id
    }

    return playmateId
  }
}

export default ClubService