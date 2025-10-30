// 用户认证功能测试脚本 - Node.js兼容版本
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 加载环境变量
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

// 创建Supabase客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// 模拟AuthService的功能
class TestAuthService {
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

    // 创建用户记录
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          username,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (userError) throw userError

    return { auth: authData, user: userData[0] }
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

  // 获取当前用户信息
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return userData
  }

  // 退出登录
  static async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}

async function testAuthFunctionality() {
  console.log('🚀 开始测试用户认证功能...\n')
  
  // 测试数据 - 使用时间戳确保唯一性
  const timestamp = Date.now()
  const testEmail = `test${timestamp}@game.com`
  const testPassword = 'Test123456'
  const testUsername = `测试用户${timestamp}`

  console.log('测试数据:', { testEmail, testUsername })

  try {
    // 1. 测试用户注册
    console.log('\n1. 测试用户注册...')
    const registerResult = await TestAuthService.register(testEmail, testPassword, testUsername)
    console.log('✅ 注册成功:', {
      userId: registerResult.user.id,
      email: registerResult.user.email,
      username: testUsername
    })

    // 2. 测试用户登录
    console.log('\n2. 测试用户登录...')
    const loginResult = await TestAuthService.login(testEmail, testPassword)
    console.log('✅ 登录成功:', {
      userId: loginResult.user.id,
      email: loginResult.user.email
    })

    // 3. 测试获取当前用户信息
    console.log('\n3. 测试获取当前用户信息...')
    const currentUser = await TestAuthService.getCurrentUser()
    console.log('✅ 获取用户信息成功:', {
      id: currentUser.id,
      username: currentUser.username,
      isVerified: currentUser.is_verified
    })

    // 4. 测试退出登录
    console.log('\n4. 测试退出登录...')
    await TestAuthService.logout()
    console.log('✅ 退出登录成功')

    // 5. 验证退出后无法获取用户信息
    console.log('\n5. 验证退出状态...')
    try {
      const userAfterLogout = await TestAuthService.getCurrentUser()
      console.log('❌ 退出状态验证失败 - 仍然能获取用户信息')
    } catch (error) {
      console.log('✅ 退出状态验证成功 - 无法获取用户信息')
    }

    console.log('\n🎉 所有认证功能测试通过！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    
    // 如果是用户已存在错误，尝试直接登录测试
    if (error.message.includes('已存在') || error.message.includes('already')) {
      console.log('\n🔧 用户已存在，尝试直接登录测试...')
      try {
        const loginResult = await TestAuthService.login(testEmail, testPassword)
        console.log('✅ 直接登录成功:', {
          userId: loginResult.user.id
        })
        
        // 测试其他功能
        const currentUser = await TestAuthService.getCurrentUser()
        console.log('✅ 获取用户信息成功')
        
        await TestAuthService.logout()
        console.log('✅ 退出登录成功')
        
      } catch (loginError) {
        console.error('❌ 登录测试也失败:', loginError.message)
      }
    }
  }
}

// 检查环境变量
console.log('检查环境变量配置...')
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? '已配置' : '未配置')
console.log('Supabase Key:', process.env.VITE_SUPABASE_ANON_KEY ? '已配置（部分隐藏）' : '未配置')

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ 请先配置.env文件中的Supabase连接信息')
  process.exit(1)
}

// 运行测试
testAuthFunctionality().catch(console.error)