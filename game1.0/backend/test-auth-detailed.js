// 详细测试Supabase认证功能
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://peqjtpoqycwxndacnwfc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWp0cG9xeWN3eG5kYWNud2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTgzNzcsImV4cCI6MjA3NzE5NDM3N30.ZK-OjFc_iEuUTPBfVq1IYKPoKxxford1T7c7HaxcZvg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSignUp() {
  console.log('🧪 测试用户注册...')
  
  const testEmail = `test${Date.now()}@example.com`
  const testPassword = 'Test123456'
  const testUsername = `testuser${Date.now()}`
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: testUsername
        }
      }
    })
    
    if (error) {
      console.error('❌ 注册失败:', error.message)
      console.log('错误详情:', error)
      return false
    }
    
    console.log('✅ 注册请求成功')
    console.log('用户数据:', data.user)
    console.log('会话:', data.session)
    console.log('是否需要确认:', data.user?.email_confirmed_at ? '否' : '是')
    
    return true
    
  } catch (error) {
    console.error('❌ 注册异常:', error.message)
    return false
  }
}

async function testSignIn() {
  console.log('\n🔑 测试用户登录...')
  
  const testEmail = 'test@example.com' // 使用已知测试账号
  const testPassword = 'Test123456'
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (error) {
      console.error('❌ 登录失败:', error.message)
      console.log('错误详情:', error)
      return false
    }
    
    console.log('✅ 登录成功')
    console.log('用户:', data.user)
    console.log('会话:', data.session ? '有效' : '无效')
    
    return true
    
  } catch (error) {
    console.error('❌ 登录异常:', error.message)
    return false
  }
}

async function testCurrentUser() {
  console.log('\n👤 测试当前用户获取...')
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('❌ 获取用户失败:', error.message)
      return false
    }
    
    if (user) {
      console.log('✅ 当前用户:', user.email)
      console.log('用户ID:', user.id)
    } else {
      console.log('ℹ️ 当前无登录用户')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ 获取用户异常:', error.message)
    return false
  }
}

async function runAuthTests() {
  console.log('🚀 开始详细认证测试\n')
  
  // 先测试当前状态
  await testCurrentUser()
  
  // 测试注册
  const signUpResult = await testSignUp()
  
  // 测试登录（如果注册成功）
  if (signUpResult) {
    await testSignIn()
  }
  
  console.log('\n📊 认证测试完成')
}

runAuthTests().catch(console.error)