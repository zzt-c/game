// 前端集成示例代码
// 这个文件展示了如何在前端页面中使用后端API

// 1. 引入API（如果使用模块化）
// import { GameCompanionAPI } from './main.js'

// 2. 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
  console.log('页面加载完成，初始化游戏陪玩平台API')
  
  // 检查用户登录状态
  await checkAuthStatus()
  
  // 初始化页面数据
  await initializePageData()
})

// 检查认证状态
async function checkAuthStatus() {
  try {
    const { data: { user } } = await GameCompanionAPI.client.auth.getUser()
    
    if (user) {
      console.log('用户已登录:', user.email)
      // 显示用户信息
      showUserInfo(user)
    } else {
      console.log('用户未登录')
      // 显示登录按钮
      showLoginButton()
    }
  } catch (error) {
    console.error('检查认证状态失败:', error)
  }
}

// 显示用户信息
function showUserInfo(user) {
  // 在实际项目中，这里会更新UI显示用户信息
  const userInfoElement = document.getElementById('user-info')
  if (userInfoElement) {
    userInfoElement.innerHTML = `
      <div class="user-avatar">
        <img src="${user.user_metadata?.avatar_url || '/default-avatar.png'}" alt="头像">
      </div>
      <div class="user-name">${user.user_metadata?.username || '用户'}</div>
      <button onclick="logout()">退出</button>
    `
  }
}

// 显示登录按钮
function showLoginButton() {
  const loginButton = document.getElementById('login-button')
  if (loginButton) {
    loginButton.style.display = 'block'
    loginButton.onclick = () => {
      // 跳转到登录页面或显示登录模态框
      window.location.href = 'login.html'
    }
  }
}

// 退出登录
async function logout() {
  try {
    await GameCompanionAPI.auth.logout()
    window.location.reload()
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

// 初始化页面数据
async function initializePageData() {
  // 获取热门陪玩
  await loadHotPlaymates()
  
  // 获取热门俱乐部
  await loadHotClubs()
  
  // 获取游戏分类
  await loadGameCategories()
}

// 加载热门陪玩
async function loadHotPlaymates() {
  try {
    const playmates = await GameCompanionAPI.playmate.getHotPlaymates(8, 0)
    renderPlaymates(playmates)
  } catch (error) {
    console.error('加载热门陪玩失败:', error)
  }
}

// 渲染陪玩列表
function renderPlaymates(playmates) {
  const container = document.getElementById('playmates-container')
  if (!container) return
  
  container.innerHTML = playmates.map(playmate => `
    <div class="playmate-card" data-id="${playmate.id}">
      <img src="${playmate.avatar_url || '/default-avatar.png'}" alt="${playmate.nickname}">
      <div class="playmate-info">
        <h4>${playmate.nickname}</h4>
        <p>评分: ${playmate.rating}/5.0</p>
        <p>¥ ${playmate.hourly_rate}/小时</p>
        <button onclick="viewPlaymateDetail('${playmate.id}')">查看详情</button>
      </div>
    </div>
  `).join('')
}

// 查看陪玩详情
async function viewPlaymateDetail(playmateId) {
  try {
    const playmate = await GameCompanionAPI.playmate.getPlaymateDetail(playmateId)
    // 在实际项目中，这里会跳转到详情页或显示详情模态框
    console.log('陪玩详情:', playmate)
    window.location.href = `detail.html?id=${playmateId}`
  } catch (error) {
    console.error('获取陪玩详情失败:', error)
  }
}

// 加载热门俱乐部
async function loadHotClubs() {
  try {
    const clubs = await GameCompanionAPI.club.getHotClubs(6, 0)
    renderClubs(clubs)
  } catch (error) {
    console.error('加载热门俱乐部失败:', error)
  }
}

// 渲染俱乐部列表
function renderClubs(clubs) {
  const container = document.getElementById('clubs-container')
  if (!container) return
  
  container.innerHTML = clubs.map(club => `
    <div class="club-card" data-id="${club.id}">
      <img src="${club.logo_url || '/default-club-logo.png'}" alt="${club.name}">
      <div class="club-info">
        <h4>${club.name}</h4>
        <p>评分: ${club.rating}/5.0</p>
        <p>陪玩者: ${club.playmates?.length || 0}人</p>
        <button onclick="viewClubDetail('${club.id}')">进入俱乐部</button>
      </div>
    </div>
  `).join('')
}

// 加载游戏分类
async function loadGameCategories() {
  try {
    // 在实际项目中，这里会从API获取游戏分类数据
    const games = [
      { id: 1, name: '英雄联盟', icon: '/games/lol.png' },
      { id: 2, name: '王者荣耀', icon: '/games/honor.png' },
      { id: 3, name: '原神', icon: '/games/genshin.png' },
      { id: 4, name: 'CS2', icon: '/games/cs2.png' },
      { id: 5, name: '永劫无间', icon: '/games/naraka.png' },
      { id: 6, name: '绝地求生', icon: '/games/pubg.png' }
    ]
    
    renderGameCategories(games)
  } catch (error) {
    console.error('加载游戏分类失败:', error)
  }
}

// 渲染游戏分类
function renderGameCategories(games) {
  const container = document.getElementById('games-container')
  if (!container) return
  
  container.innerHTML = games.map(game => `
    <div class="game-category" data-id="${game.id}">
      <img src="${game.icon}" alt="${game.name}">
      <span>${game.name}</span>
    </div>
  `).join('')
}

// 搜索功能
async function searchPlaymates() {
  const searchInput = document.getElementById('search-input')
  const query = searchInput.value.trim()
  
  if (!query) {
    alert('请输入搜索关键词')
    return
  }
  
  try {
    const results = await GameCompanionAPI.playmate.searchPlaymates(query, {})
    renderSearchResults(results)
  } catch (error) {
    console.error('搜索失败:', error)
  }
}

// 渲染搜索结果
function renderSearchResults(results) {
  const container = document.getElementById('search-results')
  if (!container) return
  
  if (results.length === 0) {
    container.innerHTML = '<p>未找到相关陪玩</p>'
    return
  }
  
  container.innerHTML = results.map(result => `
    <div class="search-result-item">
      <h4>${result.nickname}</h4>
      <p>${result.introduction || '暂无介绍'}</p>
      <button onclick="viewPlaymateDetail('${result.id}')">查看详情</button>
    </div>
  `).join('')
}

// 实时消息订阅示例
function subscribeToMessages() {
  const { data: { user } } = await GameCompanionAPI.client.auth.getUser()
  
  if (!user) return
  
  const subscription = GameCompanionAPI.chat.subscribeToMessages(user.id, (newMessage) => {
    // 显示新消息通知
    showNewMessageNotification(newMessage)
  })
  
  // 在页面卸载时取消订阅
  window.addEventListener('beforeunload', () => {
    subscription.unsubscribe()
  })
}

// 显示新消息通知
function showNewMessageNotification(message) {
  // 在实际项目中，这里会显示消息通知
  console.log('收到新消息:', message)
  
  // 示例：显示浏览器通知
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('新消息', {
      body: message.content,
      icon: '/message-icon.png'
    })
  }
}

// 导出函数供HTML调用
window.logout = logout
window.viewPlaymateDetail = viewPlaymateDetail
window.viewClubDetail = function(clubId) {
  window.location.href = `club.html?id=${clubId}`
}
window.searchPlaymates = searchPlaymates