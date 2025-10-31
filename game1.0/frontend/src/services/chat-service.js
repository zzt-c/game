// 聊天服务
import { supabase, TABLES } from '../supabase-config.js'

export class ChatService {
  // 发送消息
  static async sendMessage(senderId, receiverId, content, messageType = 'text', orderId = null) {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          order_id: orderId,
          content,
          message_type: messageType
        }
      ])
      .select()

    if (error) throw error
    return data[0]
  }

  // 获取聊天记录
  static async getChatHistory(userId, otherUserId, orderId = null, limit = 50, offset = 0) {
    let query = supabase
      .from(TABLES.MESSAGES)
      .select(`
        *,
        sender:users(username, avatar_url),
        receiver:users(username, avatar_url)
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data.reverse() // 返回按时间正序排列的消息
  }

  // 获取用户聊天列表
  static async getChatList(userId) {
    // 获取与用户有过聊天的所有联系人
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .select(`
        sender_id,
        receiver_id,
        sender:users!messages_sender_id_fkey(username, avatar_url),
        receiver:users!messages_receiver_id_fkey(username, avatar_url),
        created_at
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // 去重并获取最新消息
    const chatMap = new Map()
    
    data.forEach(message => {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id
      const otherUser = message.sender_id === userId ? message.receiver : message.sender
      
      if (!chatMap.has(otherUserId) || new Date(message.created_at) > new Date(chatMap.get(otherUserId).lastMessageTime)) {
        chatMap.set(otherUserId, {
          userId: otherUserId,
          username: otherUser.username,
          avatarUrl: otherUser.avatar_url,
          lastMessageTime: message.created_at,
          unreadCount: 0 // 需要单独查询未读消息数
        })
      }
    })

    // 获取未读消息数
    for (let [otherUserId, chat] of chatMap) {
      const { count } = await supabase
        .from(TABLES.MESSAGES)
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', userId)
        .eq('is_read', false)

      chat.unreadCount = count || 0
    }

    return Array.from(chatMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    )
  }

  // 标记消息为已读
  static async markMessagesAsRead(senderId, receiverId) {
    const { data, error } = await supabase
      .from(TABLES.MESSAGES)
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('is_read', false)

    if (error) throw error
    return data
  }

  // 获取未读消息数
  static async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from(TABLES.MESSAGES)
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)

    if (error) throw error
    return count || 0
  }

  // 实时消息订阅
  static subscribeToMessages(userId, callback) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()
  }
}

export default ChatService