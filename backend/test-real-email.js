// 使用真实邮箱格式测试Supabase认证
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://peqjtpoqycwxndacnwfc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWp0cG9xeWN3eG5kYWNud2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTgzNzcsImV4cCI6MjA3NzE5NDM3N30.ZK-OjFc_iEuUTPBfVq1IYKPoKxxford1T7c7HaxcZvg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWithRealEmail() {
  console.log('📧 测试真实邮箱格式...')
  
  // 使用更真实的邮箱格式
  const testEmails = [
    'test.user@gmail.com',
    'test_user@outlook.com', 
    'test-user@yahoo.com',
    'test123@hotmail.com'
  ]
  
  for (const email of testEmails) {
    console.log(`\n尝试邮箱: ${email}`)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'Test123456',
        options: {
          data: {
            username: `testuser${Date.now()}`
          }
        }
      })
      
      if (error) {
        console.log(`❌ ${email} 失败:`, error.message)
        
        // 如果是域名问题，尝试其他域名
        if (error.message.includes('invalid') || error.message.includes('domain')) {
          console.log('  可能域名被限制，尝试下一个...')
          continue
        }
      } else {
        console.log(`✅ ${email} 注册请求成功`)
        console.log('用户:', data.user)
        return true
      }
      
    } catch (error) {
      console.log(`❌ ${email} 异常:`, error.message)
    }
  }
  
  console.log('\n⚠️ 所有邮箱格式都失败，可能是项目配置问题')
  return false
}

async function checkProjectConfig() {
  console.log('\n🔧 检查项目配置状态...')
  
  try {
    // 尝试获取项目信息
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('项目设置查询错误:', error.message)
      
      // 根据错误类型判断问题
      if (error.message.includes('permission')) {
        console.log('❌ 权限问题 - 可能需要配置RLS策略')
      } else if (error.message.includes('JWT')) {
        console.log('❌ JWT配置问题 - 检查anon key有效性')
      } else {
        console.log('❌ 其他配置问题')
      }
    } else {
      console.log('✅ 项目设置查询成功')
    }
    
  } catch (error) {
    console.log('配置检查异常:', error.message)
  }
}

async function runDiagnostic() {
  console.log('🔍 Supabase配置诊断\n')
  
  await testWithRealEmail()
  await checkProjectConfig()
  
  console.log('\n💡 建议:')
  console.log('1. 检查Supabase项目状态是否为Active')
  console.log('2. 确认Authentication设置正确')
  console.log('3. 检查是否有域名限制')
  console.log('4. 确认项目没有达到使用限制')
}

runDiagnostic().catch(console.error)