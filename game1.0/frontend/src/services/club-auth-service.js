// 俱乐部认证服务
import { supabase, TABLES } from '../supabase-config.js'

export class ClubAuthService {
  // 俱乐部邮箱登录
  static async loginWithEmail(email, password) {
    try {
      // 先通过Supabase认证
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      // 验证是否为俱乐部账户 - 使用正确的字段名 contact_email
      const { data: clubData, error: clubError } = await supabase
        .from(TABLES.CLUBS)
        .select('*')
        .eq('contact_email', email)
        .eq('status', 'active')
        .single()

      if (clubError) {
        console.error('俱乐部查询失败:', clubError)
        // 如果查询失败，可能是表不存在或权限问题
        if (clubError.code === 'PGRST116') {
          throw new Error('俱乐部账户不存在，请先注册')
        }
        throw new Error('俱乐部账户查询失败: ' + clubError.message)
      }

      if (!clubData) {
        throw new Error('该邮箱未注册为俱乐部账户或账户未激活')
      }

      return {
        auth: authData,
        club: clubData
      }
    } catch (error) {
      console.error('俱乐部登录失败:', error)
      throw error
    }
  }

  // 俱乐部邮箱注册
  static async registerWithEmail(email, password, clubName, contactPerson, phone) {
    try {
      // 先注册Supabase账户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: 'club',
            club_name: clubName
          }
        }
      })

      if (authError) throw authError

      // 创建俱乐部记录 - 使用正确的字段名
      const { data: clubData, error: clubError } = await supabase
        .from(TABLES.CLUBS)
        .insert([
          {
            id: authData.user.id,
            name: clubName,
            contact_email: email,
            contact_person: contactPerson,
            contact_phone: phone,
            status: 'pending', // 待审核状态
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (clubError) {
        console.error('俱乐部记录创建失败:', clubError)
        // 尝试回滚用户注册（需要管理员权限）
        throw new Error('俱乐部注册失败: ' + clubError.message)
      }

      return {
        auth: authData,
        club: clubData[0],
        message: '注册成功，请等待管理员审核'
      }
    } catch (error) {
      console.error('俱乐部注册失败:', error)
      throw error
    }
  }

  // 发送邮箱验证码
  static async sendVerificationCode(email) {
    try {
      // 检查邮箱是否已注册 - 使用正确的字段名 contact_email
      const { data: existingClub, error: checkError } = await supabase
        .from(TABLES.CLUBS)
        .select('id, status')
        .eq('contact_email', email)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error('邮箱验证失败: ' + checkError.message)
      }

      if (!existingClub) {
        throw new Error('该邮箱未注册为俱乐部账户')
      }

      if (existingClub.status !== 'active') {
        throw new Error('俱乐部账户未激活，请联系管理员')
      }

      // 这里可以集成邮件服务发送验证码
      // 暂时返回成功消息
      return {
        success: true,
        message: '验证码已发送到您的邮箱'
      }
    } catch (error) {
      console.error('发送验证码失败:', error)
      throw error
    }
  }

  // 邮箱验证码登录
  static async loginWithVerificationCode(email, code) {
    try {
      // 验证邮箱和验证码（这里需要集成验证码验证逻辑）
      // 暂时模拟验证码验证
      if (code !== '123456') { // 演示用固定验证码
        throw new Error('验证码错误')
      }

      // 验证俱乐部账户 - 使用正确的字段名 contact_email
      const { data: clubData, error: clubError } = await supabase
        .from(TABLES.CLUBS)
        .select('*')
        .eq('contact_email', email)
        .eq('status', 'active')
        .single()

      if (clubError) {
        throw new Error('俱乐部账户查询失败: ' + clubError.message)
      }

      if (!clubData) {
        throw new Error('俱乐部账户不存在或未激活')
      }

      // 使用魔术链接登录
      const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) throw authError

      return {
        auth: authData,
        club: clubData
      }
    } catch (error) {
      console.error('验证码登录失败:', error)
      throw error
    }
  }

  // 获取当前俱乐部信息
  static async getCurrentClub() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: clubData, error } = await supabase
        .from(TABLES.CLUBS)
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return clubData
    } catch (error) {
      console.error('获取俱乐部信息失败:', error)
      throw error
    }
  }

  // 退出登录
  static async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // 重置密码
  static async resetPassword(email) {
    try {
      // 验证是否为俱乐部账户 - 使用正确的字段名 contact_email
      const { data: clubData, error: clubError } = await supabase
        .from(TABLES.CLUBS)
        .select('id')
        .eq('contact_email', email)
        .single()

      if (clubError || !clubData) {
        throw new Error('该邮箱未注册为俱乐部账户')
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('重置密码失败:', error)
      throw error
    }
  }
}

export default ClubAuthService