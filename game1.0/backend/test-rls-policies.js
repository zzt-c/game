// 测试RLS策略和用户数据同步问题
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://peqjtpoqycwxndacnwfc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWp0cG9xeWN3eG5kYWNud2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTgzNzcsImV4cCI6MjA3NzE5NDM3N30.ZK-OjFc_iEuUTPBfVq1IYKPoKxxford1T7c7HaxcZvg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRLSPolicies() {
  console.log('🧪 测试RLS策略...\n')
  
  // 1. 先测试未登录状态下能否查看用户数据
  console.log('1. 测试未登录状态下的数据访问...')
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ 未登录状态访问用户表失败:', error.message)
      console.log('   这可能是RLS策略生效的表现')
    } else {
      console.log('✅ 未登录状态可以访问用户表，数据条数:', users.length)
      if (users.length > 0) {
        console.log('   示例用户:', users[0].email)
      }
    }
  } catch (error) {
    console.log('❌ 测试异常:', error.message)
  }
  
  // 2. 注册一个新用户测试数据同步
  console.log('\n2. 测试用户注册和数据同步...')
  const testEmail = `test${Date.now()}@example.com`
  const testPassword = 'Test123456'
  const testUsername = `testuser${Date.now()}`
  
  try {
    // 注册用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: testUsername
        }
      }
    })
    
    if (authError) {
      console.log('❌ 注册失败:', authError.message)
      return
    }
    
    console.log('✅ 认证注册成功')
    console.log('   用户ID:', authData.user.id)
    console.log('   邮箱:', authData.user.email)
    
    // 尝试插入用户记录到数据库
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: testEmail,
          username: testUsername,
          created_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (userError) {
      console.log('❌ 插入用户记录失败:', userError.message)
      console.log('   错误详情:', userError)
    } else {
      console.log('✅ 用户记录插入成功')
      console.log('   数据库用户ID:', userData[0].id)
    }
    
  } catch (error) {
    console.log('❌ 测试异常:', error.message)
  }
  
  // 3. 测试登录后能否查看自己的数据
  console.log('\n3. 测试登录后的数据访问...')
  try {
    // 使用已知测试账号登录
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'Test123456'
    })
    
    if (loginError) {
      console.log('❌ 登录失败:', loginError.message)
      console.log('   跳过登录后测试')
      return
    }
    
    console.log('✅ 登录成功')
    console.log('   当前用户:', loginData.user.email)
    
    // 尝试查看用户数据
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single()
    
    if (userError) {
      console.log('❌ 获取用户数据失败:', userError.message)
    } else {
      console.log('✅ 成功获取用户数据')
      console.log('   用户名:', currentUser.username)
      console.log('   邮箱:', currentUser.email)
    }
    
  } catch (error) {
    console.log('❌ 测试异常:', error.message)
  }
}

async function checkCurrentRLSStatus() {
  console.log('\n🔍 检查当前RLS状态...')
  
  try {
    // 检查users表的RLS状态
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, is_insertable_into')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'clubs', 'playmates', 'services', 'orders'])
    
    if (error) {
      console.log('❌ 查询表信息失败:', error.message)
      return
    }
    
    console.log('当前表状态:')
    tables.forEach(table => {
      console.log(`   ${table.table_name}: 可插入=${table.is_insertable_into}`)
    })
    
  } catch (error) {
    console.log('❌ 检查状态异常:', error.message)
  }
}

// 运行测试
testRLSPolicies()
  .then(() => checkCurrentRLSStatus())
  .catch(console.error)