// 检查RLS策略状态和数据库结构
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://peqjtpoqycwxndacnwfc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWp0cG9xeWN3eG5kYWNud2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTgzNzcsImV4cCI6MjA3NzE5NDM3N30.ZK-OjFc_iEuUTPBfVq1IYKPoKxxford1T7c7HaxcZvg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLSStatus() {
  console.log('🔍 检查RLS策略状态...\n')
  
  try {
    // 1. 检查users表的RLS状态
    console.log('1. 检查users表的RLS状态...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
    
    if (tableError) {
      console.log('❌ 查询表信息失败:', tableError.message)
    } else {
      console.log('✅ 表权限信息:', tableInfo.length > 0 ? '有权限记录' : '无权限记录')
    }
    
    // 2. 尝试查看当前RLS策略
    console.log('\n2. 尝试查看RLS策略...')
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users')
    
    if (policyError) {
      console.log('❌ 查询策略失败:', policyError.message)
    } else {
      console.log(`✅ 当前有 ${policies.length} 条RLS策略`)
      policies.forEach(policy => {
        console.log(`   策略: ${policy.policyname} - ${policy.cmd}`)
      })
    }
    
    // 3. 检查表结构
    console.log('\n3. 检查users表结构...')
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    if (columnError) {
      console.log('❌ 查询表结构失败:', columnError.message)
    } else {
      console.log('✅ users表结构:')
      columns.forEach(col => {
        console.log(`   ${col.column_name} (${col.data_type}) - 可空: ${col.is_nullable}`)
      })
    }
    
    // 4. 测试插入操作（使用服务角色密钥模拟）
    console.log('\n4. 测试插入操作...')
    
    // 先创建一个测试用户认证
    const testEmail = `test${Date.now()}@valid-email.com`
    const testPassword = 'Test123456'
    const testUsername = `testuser${Date.now()}`
    
    console.log('   测试数据:', { testEmail, testUsername })
    
    // 尝试注册用户
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
      console.log('❌ 认证注册失败:', authError.message)
      console.log('   错误代码:', authError.code)
    } else {
      console.log('✅ 认证注册成功')
      console.log('   用户ID:', authData.user.id)
      
      // 尝试插入用户记录
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
        console.log('❌ 插入用户记录失败:', insertError.message)
        console.log('   错误代码:', insertError.code)
        console.log('   错误详情:', insertError.details)
        
        // 检查是否是特定错误类型
        if (insertError.code === '42501') {
          console.log('   🔍 确认是RLS策略错误')
        }
      } else {
        console.log('✅ 插入用户记录成功')
        console.log('   记录ID:', userData[0].id)
      }
    }
    
    // 5. 检查现有用户数据
    console.log('\n5. 检查现有用户数据...')
    const { data: existingUsers, error: queryError } = await supabase
      .from('users')
      .select('id, email, username, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (queryError) {
      console.log('❌ 查询用户数据失败:', queryError.message)
    } else {
      console.log(`✅ users表中有 ${existingUsers.length} 条记录`)
      if (existingUsers.length > 0) {
        console.log('   最新记录:')
        existingUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.username}) - ${user.created_at}`)
        })
      }
    }
    
  } catch (error) {
    console.log('❌ 检查过程异常:', error.message)
  }
}

// 运行检查
checkRLSStatus().catch(console.error)