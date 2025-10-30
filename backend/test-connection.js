// 测试Supabase连接配置
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const supabaseUrl = 'https://peqjtpoqycwxndacnwfc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWp0cG9xeWN3eG5kYWNud2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTgzNzcsImV4cCI6MjA3NzE5NDM3N30.ZK-OjFc_iEuUTPBfVq1IYKPoKxxford1T7c7HaxcZvg'

console.log('🔍 开始测试Supabase连接...')
console.log('URL:', supabaseUrl)
console.log('Key 前20位:', supabaseKey.substring(0, 20) + '...')

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

async function testConnection() {
  try {
    console.log('\n📡 测试数据库连接...')
    
    // 测试简单的查询
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ 连接失败:', error.message)
      console.log('错误详情:', error)
      return false
    }
    
    console.log('✅ 连接成功！')
    console.log('返回数据:', data)
    return true
    
  } catch (error) {
    console.error('❌ 连接异常:', error.message)
    return false
  }
}

async function testAuth() {
  try {
    console.log('\n🔐 测试认证功能...')
    
    // 测试认证状态
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('❌ 认证测试失败:', error.message)
      return false
    }
    
    console.log('✅ 认证功能正常')
    console.log('当前用户:', user ? '已登录' : '未登录')
    return true
    
  } catch (error) {
    console.error('❌ 认证异常:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 开始Supabase配置测试\n')
  
  const connectionTest = await testConnection()
  const authTest = await testAuth()
  
  console.log('\n📊 测试结果汇总:')
  console.log('数据库连接:', connectionTest ? '✅ 成功' : '❌ 失败')
  console.log('认证功能:', authTest ? '✅ 正常' : '❌ 异常')
  
  if (connectionTest && authTest) {
    console.log('\n🎉 配置正确！可以正常使用Supabase服务')
  } else {
    console.log('\n⚠️ 配置存在问题，请检查Supabase项目设置')
  }
}

runTests().catch(console.error)