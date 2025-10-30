// 评价服务
import { supabase, TABLES } from '../supabase-config.js'

export class ReviewService {
  // 创建评价
  static async createReview(orderId, reviewerId, revieweeId, rating, comment = '', images = []) {
    // 检查订单是否已完成
    const { data: order, error: orderError } = await supabase
      .from(TABLES.ORDERS)
      .select('status')
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError
    if (order.status !== 'completed') {
      throw new Error('只能对已完成的订单进行评价')
    }

    // 检查是否已经评价过
    const { data: existingReview, error: checkError } = await supabase
      .from(TABLES.REVIEWS)
      .select('id')
      .eq('order_id', orderId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') throw checkError
    if (existingReview) {
      throw new Error('该订单已经评价过了')
    }

    const { data, error } = await supabase
      .from(TABLES.REVIEWS)
      .insert([
        {
          order_id: orderId,
          reviewer_id: reviewerId,
          reviewee_id: revieweeId,
          rating,
          comment,
          images,
          is_verified: true // 已验证的评价（来自真实订单）
        }
      ])
      .select(`
        *,
        reviewer:users(username, avatar_url)
      `)

    if (error) throw error

    // 更新被评价者的平均评分
    await this.updateRevieweeRating(revieweeId)

    return data[0]
  }

  // 更新被评价者的平均评分
  static async updateRevieweeRating(revieweeId) {
    // 获取所有评价计算平均分
    const { data: reviews, error } = await supabase
      .from(TABLES.REVIEWS)
      .select('rating')
      .eq('reviewee_id', revieweeId)

    if (error) throw error

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / reviews.length

      // 更新陪玩者评分
      const { error: updateError } = await supabase
        .from(TABLES.PLAYMATES)
        .update({ rating: averageRating })
        .eq('user_id', revieweeId)

      if (updateError) throw updateError
    }
  }

  // 获取评价列表
  static async getReviews(revieweeId, limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from(TABLES.REVIEWS)
      .select(`
        *,
        reviewer:users(username, avatar_url),
        order:orders(service:services(title, game:games(name)))
      `)
      .eq('reviewee_id', revieweeId)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  // 获取评价统计
  static async getReviewStats(revieweeId) {
    const { data, error } = await supabase
      .from(TABLES.REVIEWS)
      .select('rating, count')
      .eq('reviewee_id', revieweeId)
      .eq('is_verified', true)
      .group('rating')

    if (error) throw error

    const stats = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
      total: 0,
      average: 0
    }

    data.forEach(item => {
      stats[item.rating] = item.count
      stats.total += item.count
    })

    if (stats.total > 0) {
      const totalScore = data.reduce((sum, item) => sum + (item.rating * item.count), 0)
      stats.average = totalScore / stats.total
    }

    return stats
  }

  // 回复评价（商家回复）
  static async replyToReview(reviewId, replyContent) {
    const { data, error } = await supabase
      .from(TABLES.REVIEWS)
      .update({
        reply: replyContent,
        replied_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()

    if (error) throw error
    return data[0]
  }
}

export default ReviewService