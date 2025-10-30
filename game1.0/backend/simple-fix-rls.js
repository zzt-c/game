// 简化版RLS问题修复脚本 - 使用有效邮箱域名
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://peqjtpoqycwxndacnwfc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWp0cG9xeWN3eG5kYWNud2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTgzNzcsImV4cCI6MjA3NzE5NDM3N30.ZK-OjFc_iEuUTPBfVq1IYKPoKxxford1T7c7HaxcZvg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAndFixRLS() {
  console.log('🔧 测试和修复RLS问题（使用有效邮箱）...\n')
  
  try {
    // 测试数据 - 使用有效的邮箱域名
    const timestamp = Date.now()
    const testEmail = `test${timestamp}@gmail.com`  // 使用有效的Gmail域名
    const testPassword = 'Test123456'
    const testUsername = `testuser${timestamp}`

    console.log('测试数据:', { testEmail, testUsername })
    
    // 1. 测试用户注册
    console.log('\n1. 测试用户注册...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { username: testUsername }
      }
    })
    
    if (authError) {
      console.log('❌ 认证注册失败:', authError.message)
      console.log('   错误代码:', authError.code)
      console.log('   这表明需要调整Supabase项目的邮箱验证设置')
      return
    }
    
    console.log('✅ 认证注册成功')
    console.log('   用户ID:', authData.user.id)
    
    // 2. 测试插入用户记录
    console.log('\n2. 测试插入用户记录...')
    const { data: userData, error: insertError } = await supabase
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
    
    if (insertError) {
      console.log('❌ 插入失败 - RLS策略阻止:', insertError.message)
      console.log('   错误代码:', insertError.code)
      
      // 提供解决方案
      console.log('\n🎯 RLS策略解决方案:')
      console.log('在Supabase控制台执行以下SQL语句之一:')
      console.log('')
      console.log('方案1 (推荐 - 允许所有操作):')
      console.log('CREATE POLICY "允许所有用户操作" ON users FOR ALL USING (true);')
      console.log('')
      console.log('方案2 (仅允许插入):')
      console.log('CREATE POLICY "允许用户插入" ON users FOR INSERT WITH CHECK (true);')
      console.log('')
      console.log('方案3 (临时禁用RLS测试):')
      console.log('ALTER TABLE users DISABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('执行步骤:')
      console.log('1. 登录 https://supabase.com/dashboard')
      console.log('2. 选择项目: peqjtpoqycwxndacnwfc')
      console.log('3. 进入 SQL Editor')
      console.log('4. 执行上述SQL语句之一')
      console.log('5. 重新测试注册功能')
      
    } else {
      console.log('✅ 插入成功! RLS问题已解决')
      console.log('   记录ID:', userData[0].id)
    }
    
    // 3. 检查现有数据
    console.log('\n3. 检查现有用户数据...')
    const { data: existingUsers, error: queryError } = await supabase
      .from('users')
      .select('id, email, username, created_at')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (queryError) {
      console.log('❌ 查询失败:', queryError.message)
    } else {
      console.log(`✅ users表中有 ${existingUsers.length} 条记录`)
      if (existingUsers.length > 0) {
        existingUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} - ${user.created_at}`)
        })
      }
    }
    
  } catch (error) {
    console.log('❌ 测试过程异常:', error.message)
  }
}

// 运行测试
testAndFixRLS().catch(console.error)