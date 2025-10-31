// 简单测试RLS策略问题
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://peqjtpoqycwxndacnwfc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWp0cG9xeWN3eG5kYWNud2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTgzNzcsImV4cCI6MjA3NzE5NDM3N30.ZK-OjFc_iEuUTPBfVq1IYKPoKxxford1T7c7HaxcZvg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBasicRLS() {
  console.log('🧪 基础RLS测试...\n')
  
  // 1. 测试未登录状态下的数据访问
  console.log('1. 测试未登录状态访问用户表...')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single()
    
    if (error) {
      console.log('❌ 访问失败（RLS可能生效）:', error.message)
    } else {
      console.log('✅ 可以访问用户表')
    }
  } catch (error) {
    console.log('❌ 测试异常:', error.message)
  }
  
  // 2. 测试注册功能
  console.log('\n2. 测试用户注册...')
  const testEmail = `test${Math.random().toString(36).substring(2, 10)}@test.com`
  const testPassword = 'Test123456'
  const testUsername = `testuser${Math.random().toString(36).substring(2, 8)}`
  
  try {
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
      console.log('   错误详情:', authError)
    } else {
      console.log('✅ 认证注册成功')
      console.log('   用户ID:', authData.user.id)
      
      // 3. 测试插入用户记录
      console.log('\n3. 测试插入用户记录到数据库...')
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
        console.log('❌ 插入失败（RLS阻止）:', userError.message)
        console.log('   错误代码:', userError.code)
        console.log('   错误详情:', userError.details)
      } else {
        console.log('✅ 插入成功')
        console.log('   数据库记录:', userData[0])
      }
    }
  } catch (error) {
    console.log('❌ 测试异常:', error.message)
  }
  
  // 4. 检查当前用户表数据
  console.log('\n4. 检查用户表数据...')
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, username, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.log('❌ 查询失败:', error.message)
    } else {
      console.log(`✅ 用户表中有 ${users.length} 条记录`)
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.username}) - ${user.created_at}`)
      })
    }
  } catch (error) {
    console.log('❌ 查询异常:', error.message)
  }
}

// 运行测试
testBasicRLS().catch(console.error)