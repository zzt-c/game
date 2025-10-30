// 用户认证服务
import { supabase, TABLES } from '../supabase-config.js'

export class AuthService {
  // 用户注册
  static async register(email, password, username) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    })

    if (authError) throw authError

    // 创建用户记录（处理RLS策略问题）
    try {
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .insert([
          {
            id: authData.user.id,
            email,
            username,
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (userError) {
        console.warn('用户记录插入失败（可能是RLS策略问题）:', userError.message)
        // 返回认证数据，但提示用户记录可能未创建
        return { 
          auth: authData, 
          user: null,
          warning: '用户认证成功，但数据库记录可能未同步。请检查RLS策略设置。'
        }
      }

      return { auth: authData, user: userData[0] }
    } catch (error) {
      console.error('用户记录创建异常:', error)
      // 仍然返回认证数据，但标记用户记录创建失败
      return { 
        auth: authData, 
        user: null,
        error: '用户认证成功，但数据库记录创建失败。'
      }
    }
  }

  // 用户登录
  static async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }



  // 第三方登录
  static async socialLogin(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return data
  }

  // 退出登录
  static async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // 获取当前用户信息
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userData, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return userData
  }

  // 重置密码
  static async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
    return data
  }

  // 更新密码
  static async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return data
  }
}

export default AuthService