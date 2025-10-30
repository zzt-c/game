// 用户认证功能测试脚本
import { supabase } from './supabase-config.js'

async function testAuthFunctionality() {
  console.log('🚀 开始测试用户认证功能...\n')
  
  // 测试数据
  const testEmail = `test${Date.now()}@game.com`
  const testPassword = 'Test123456'
  const testUsername = `测试用户${Date.now()}`

  try {
    // 1. 测试用户注册
    console.log('1. 测试用户注册...')
    const registerResult = await AuthService.register(testEmail, testPassword, testUsername)
    console.log('✅ 注册成功:', {
      userId: registerResult.user.id,
      email: registerResult.user.email,
      username: testUsername
    })

    // 2. 测试用户登录
    console.log('\n2. 测试用户登录...')
    const loginResult = await AuthService.login(testEmail, testPassword)
    console.log('✅ 登录成功:', {
      userId: loginResult.user.id,
      email: loginResult.user.email
    })

    // 3. 测试获取当前用户信息
    console.log('\n3. 测试获取当前用户信息...')
    const currentUser = await AuthService.getCurrentUser()
    console.log('✅ 获取用户信息成功:', {
      id: currentUser.id,
      username: currentUser.username,
      isVerified: currentUser.is_verified
    })

    // 4. 测试退出登录
    console.log('\n4. 测试退出登录...')
    await AuthService.logout()
    console.log('✅ 退出登录成功')

    // 5. 验证退出后无法获取用户信息
    console.log('\n5. 验证退出状态...')
    try {
      const userAfterLogout = await AuthService.getCurrentUser()
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
        const loginResult = await AuthService.login(testEmail, testPassword)
        console.log('✅ 直接登录成功:', {
          userId: loginResult.user.id
        })
        
        // 测试其他功能
        const currentUser = await AuthService.getCurrentUser()
        console.log('✅ 获取用户信息成功')
        
        await AuthService.logout()
        console.log('✅ 退出登录成功')
        
      } catch (loginError) {
        console.error('❌ 登录测试也失败:', loginError.message)
      }
    }
  }
}

// 运行测试
testAuthFunctionality().catch(console.error)