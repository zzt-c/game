// 直接修复RLS策略问题
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://peqjtpoqycwxndacnwfc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWp0cG9xeWN3eG5kYWNud2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTgzNzcsImV4cCI6MjA3NzE5NDM3N30.ZK-OjFc_iEuUTPBfVq1IYKPoKxxford1T7c7HaxcZvg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRLSIssue() {
  console.log('🔧 修复RLS策略问题...\n')
  
  try {
    // 方案1: 尝试使用服务角色密钥（如果有）
    console.log('1. 尝试使用服务角色密钥连接...')
    
    // 方案2: 创建更简单的RLS策略
    console.log('2. 创建简化RLS策略的方案...')
    
    const simplePolicies = `
-- 简化RLS策略方案
-- 方案A: 允许所有操作（开发环境）
CREATE POLICY "允许所有用户操作" ON users FOR ALL USING (true);

-- 方案B: 仅允许插入操作
CREATE POLICY "允许用户插入" ON users FOR INSERT WITH CHECK (true);

-- 方案C: 基于认证用户的策略
CREATE POLICY "认证用户可以操作" ON users FOR ALL USING (auth.role() = 'authenticated');
    `
    
    console.log('可选的简化策略方案已准备')
    
    // 方案3: 使用数据库触发器自动创建用户记录
    console.log('3. 数据库触发器方案...')
    
    const triggerSolution = `
-- 创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 在新用户认证成功后自动创建用户记录
  INSERT INTO public.users (id, email, username, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器（如果auth.users表存在）
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `
    
    console.log('触发器方案已准备')
    
    // 方案4: 修改认证服务，使用不同的插入策略
    console.log('4. 修改认证服务代码方案...')
    
    const codeFix = `
// 修改后的注册函数 - 处理RLS问题的几种方法
static async register(email, password, username) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  })

  if (authError) throw authError

  // 方法1: 使用rpc函数绕过RLS
  const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_record', {
    user_id: authData.user.id,
    user_email: email,
    user_username: username
  })

  if (!rpcError) {
    return { auth: authData, user: rpcResult }
  }

  // 方法2: 使用服务角色密钥（如果可用）
  // 方法3: 提示用户联系管理员修复RLS策略
  
  return { 
    auth: authData, 
    user: null,
    warning: '用户认证成功，但数据库记录创建需要管理员配置RLS策略'
  }
}
    `
    
    console.log('代码修复方案已准备')
    
    // 测试当前最简单的解决方案
    console.log('\n5. 测试当前最简单的绕过方案...')
    
    // 尝试使用认证后的会话进行插入
    const testEmail = `test${Date.now()}@bypass-test.com`
    const testPassword = 'Test123456'
    const testUsername = `testuser${Date.now()}`
    
    console.log('   测试数据:', { testEmail, testUsername })
    
    // 先注册认证
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { username: testUsername }
      }
    })
    
    if (authError) {
      console.log('❌ 认证注册失败:', authError.message)
      return
    }
    
    console.log('✅ 认证注册成功')
    console.log('   用户ID:', authData.user.id)
    
    // 立即尝试使用认证会话插入
    console.log('   尝试使用认证会话插入用户记录...')
    
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
      console.log('❌ 插入仍然失败:', insertError.message)
      console.log('   错误代码:', insertError.code)
      
      // 提供具体的解决建议
      console.log('\n🎯 具体解决方案:')
      console.log('1. 在Supabase控制台执行以下SQL之一:')
      console.log('   - 方案A (推荐): CREATE POLICY "允许所有用户操作" ON users FOR ALL USING (true);')
      console.log('   - 方案B: CREATE POLICY "允许用户插入" ON users FOR INSERT WITH CHECK (true);')
      console.log('')
      console.log('2. 或者临时禁用RLS进行测试:')
      console.log('   ALTER TABLE users DISABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('3. 检查现有RLS策略并删除冲突的策略:')
      console.log('   SELECT * FROM pg_policies WHERE tablename = \\'users\\';')
      console.log('   DROP POLICY [策略名称] ON users;')
      
    } else {
      console.log('✅ 插入成功! RLS问题已解决')
      console.log('   记录ID:', userData[0].id)
    }
    
  } catch (error) {
    console.log('❌ 修复过程异常:', error.message)
  }
}

// 运行修复
fixRLSIssue().catch(console.error)