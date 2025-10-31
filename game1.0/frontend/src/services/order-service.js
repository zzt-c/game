// 订单管理服务
import { supabase, TABLES } from '../supabase-config.js'

export class OrderService {
  // 创建订单
  static async createOrder(userId, serviceId, scheduledTime, serviceHours, notes = '') {
    // 获取服务信息
    const { data: service, error: serviceError } = await supabase
      .from(TABLES.SERVICES)
      .select('*, playmate:playmates(*, club:clubs(id))')
      .eq('id', serviceId)
      .single()

    if (serviceError) throw serviceError

    const totalAmount = service.price_per_hour * serviceHours
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase()

    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .insert([
        {
          user_id: userId,
          playmate_id: service.playmate_id,
          service_id: serviceId,
          club_id: service.playmate.club?.id,
          order_number: orderNumber,
          total_amount: totalAmount,
          service_hours: serviceHours,
          scheduled_time: scheduledTime,
          user_notes: notes,
          status: 'pending',
          payment_status: 'pending'
        }
      ])
      .select(`
        *,
        service:services(*, game:games(*)),
        playmate:playmates(*, user:users(username, avatar_url)),
        club:clubs(name, logo_url)
      `)

    if (error) throw error
    return data[0]
  }

  // 获取用户订单列表
  static async getUserOrders(userId, status = null, limit = 20, offset = 0) {
    let query = supabase
      .from(TABLES.ORDERS)
      .select(`
        *,
        service:services(*, game:games(*)),
        playmate:playmates(*, user:users(username, avatar_url)),
        club:clubs(name, logo_url)
      `)
      .eq('user_id', userId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  // 获取陪玩者订单列表
  static async getPlaymateOrders(playmateId, status = null, limit = 20, offset = 0) {
    let query = supabase
      .from(TABLES.ORDERS)
      .select(`
        *,
        service:services(*, game:games(*)),
        user:users(username, avatar_url, phone)
      `)
      .eq('playmate_id', playmateId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  // 更新订单状态
  static async updateOrderStatus(orderId, status, notes = '') {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    }

    if (notes) {
      updates.playmate_notes = notes
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .update(updates)
      .eq('id', orderId)
      .select()

    if (error) throw error
    return data[0]
  }

  // 取消订单
  static async cancelOrder(orderId, userId, reason = '') {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .update({
        status: 'cancelled',
        user_notes: reason ? `${reason} - 用户取消` : '用户取消',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', userId)
      .select()

    if (error) throw error
    return data[0]
  }

  // 确认订单完成
  static async confirmOrderCompletion(orderId, userId) {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', userId)
      .select()

    if (error) throw error
    return data[0]
  }

  // 获取订单统计
  static async getOrderStats(userId = null, playmateId = null) {
    let query = supabase
      .from(TABLES.ORDERS)
      .select('status, count')

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (playmateId) {
      query = query.eq('playmate_id', playmateId)
    }

    const { data, error } = await query.group('status')

    if (error) throw error
    return data
  }
}

export default OrderService