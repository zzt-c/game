// API客户端工具类
import { supabase } from '../supabase-config.js'

export class ApiClient {
  // 统一错误处理
  static handleError(error) {
    console.error('API Error:', error)
    
    if (error.message) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: '网络请求失败，请稍后重试' }
  }

  // 统一响应格式
  static formatResponse(data, message = '操作成功') {
    return {
      success: true,
      data,
      message
    }
  }

  // 带认证的API调用包装器
  static async withAuth(apiCall) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('用户未登录')
      }
      return await apiCall(user.id)
    } catch (error) {
      return this.handleError(error)
    }
  }

  // 文件上传工具
  static async uploadFile(file, bucketName = 'avatars') {
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file)

      if (error) throw error

      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path)

      return this.formatResponse(publicUrl, '文件上传成功')
    } catch (error) {
      return this.handleError(error)
    }
  }

  // 批量操作工具
  static async batchOperation(operations, batchSize = 10) {
    const results = []
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(op => op()))
      results.push(...batchResults)
    }
    
    return results
  }

  // 缓存工具
  static createCache(ttl = 5 * 60 * 1000) { // 默认5分钟
    const cache = new Map()
    
    return {
      get(key) {
        const item = cache.get(key)
        if (item && Date.now() - item.timestamp < ttl) {
          return item.value
        }
        cache.delete(key)
        return null
      },
      
      set(key, value) {
        cache.set(key, {
          value,
          timestamp: Date.now()
        })
      },
      
      delete(key) {
        cache.delete(key)
      },
      
      clear() {
        cache.clear()
      }
    }
  }
}

export default ApiClient