// 使用有效邮箱测试RLS策略问题
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://peqjtpoqycwxndacnwfc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWp0cG9xeWN3eG5kYWNud2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTgzNzcsImV4cCI6MjA3NzE5NDM3N30.ZK-OjFc_iEuUTPBfVq1IYKPoKxxford1T7c7HaxcZvg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWithValidEmail() {
  console.log('🧪 使用有效邮箱测试...\n')
  
  // 使用gmail邮箱测试（通常被认为是有效邮箱）
  const testEmail = `test${Math.random().toString(36).substring(2, 10)}@gmail.com`
  const testPassword = 'Test123456'
  const testUsername = `testuser${Math.random().toString(36).substring(2, 8)}`
  
  console.log('测试邮箱:', testEmail)
  
  try {
    // 1. 测试注册
    console.log('1. 测试用户注册...')
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
      console.log('   错误代码:', authError.code)
      
      // 尝试使用其他常见邮箱域名
      console.log('\n尝试使用其他邮箱域名...')
      const alternativeEmail = `test${Math.random().toString(36).substring(2, 10)}@qq.com`
      console.log('测试邮箱:', alternativeEmail)
      
      const { data: altAuthData, error: altAuthError } = await supabase.auth.signUp({
        email: alternativeEmail,
        password: testPassword,
        options: {
          data: {
            username: testUsername
          }
        }
      })
      
      if (altAuthError) {
        console.log('❌ 备用邮箱也失败:', altAuthError.message)
        console.log('   这表明Supabase项目配置了严格的邮箱验证')
        return
      } else {
        console.log('✅ 备用邮箱注册成功')
        testEmail = alternativeEmail
        authData = altAuthData
      }
    } else {
      console.log('✅ 注册成功')
      console.log('   用户ID:', authData.user.id)
    }
    
    // 2. 测试插入用户记录
    console.log('\n2. 测试插入用户记录到数据库...')
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
      console.log('❌ 插入失败:', userError.message)
      console.log('   错误代码:', userError.code)
      console.log('   错误详情:', userError.details)
      
      // 检查是否是RLS策略问题
      if (userError.code === '42501') {
        console.log('   🔍 这是RLS策略错误 - 需要创建插入策略')
      }
    } else {
      console.log('✅ 插入成功')
      console.log('   数据库记录ID:', userData[0].id)
    }
    
    // 3. 验证数据是否同步
    console.log('\n3. 验证数据同步...')
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('id', authData.user.id)
      .single()
    
    if (queryError) {
      console.log('❌ 查询失败:', queryError.message)
    } else {
      console.log('✅ 数据同步成功')
      console.log('   认证用户ID:', authData.user.id)
      console.log('   数据库用户ID:', users.id)
      console.log('   邮箱:', users.email)
    }
    
  } catch (error) {
    console.log('❌ 测试异常:', error.message)
  }
  
  // 4. 检查现有用户数据
  console.log('\n4. 检查现有用户数据...')
  try {
    const { data: existingUsers, error } = await supabase
      .from('users')
      .select('id, email, username, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.log('❌ 查询失败:', error.message)
    } else {
      console.log(`✅ 用户表中有 ${existingUsers.length} 条记录`)
      if (existingUsers.length > 0) {
        console.log('最新5条记录:')
        existingUsers.slice(0, 5).forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.username}) - ${user.created_at}`)
        })
      }
    }
  } catch (error) {
    console.log('❌ 查询异常:', error.message)
  }
}

// 运行测试
testWithValidEmail().catch(console.error)