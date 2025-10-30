# 游戏陪玩服务平台 - 后端架构

基于Supabase的现代化游戏陪玩服务平台后端架构。

## 技术栈

- **数据库**: PostgreSQL (Supabase)
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **实时通信**: Supabase Realtime
- **前端构建**: Vite
- **部署**: Supabase Cloud + Vercel/Netlify

## 项目结构

```
├── src/
│   ├── services/           # 业务服务层
│   │   ├── auth-service.js     # 用户认证
│   │   ├── user-service.js     # 用户管理
│   │   ├── playmate-service.js # 陪玩者管理
│   │   ├── order-service.js    # 订单管理
│   │   ├── club-service.js     # 俱乐部管理
│   │   ├── chat-service.js     # 聊天服务
│   │   ├── favorite-service.js # 收藏服务
│   │   └── review-service.js   # 评价服务
│   ├── utils/
│   │   └── api-client.js        # API工具类
│   ├── supabase-config.js      # Supabase配置
│   └── main.js                 # 主入口文件
├── database-schema.sql          # 数据库架构
├── supabase-config.js          # 配置文件
├── package.json                # 依赖配置
├── vite.config.js             # 构建配置
└── README.md                  # 项目文档
```

## 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env
```

### 2. Supabase配置

1. 访问 [Supabase官网](https://supabase.com) 创建新项目
2. 获取项目URL和anon key
3. 在 `.env` 文件中配置：

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. 数据库初始化

1. 在Supabase控制台进入SQL编辑器
2. 执行 `database-schema.sql` 中的SQL语句
3. 配置行级安全策略(RLS)

### 4. 开发服务器

```bash
# 启动开发服务器
npm run dev
```

## 核心功能

### 用户系统
- 手机号/邮箱注册登录
- 第三方登录(微信/QQ)
- 实名认证
- 余额管理

### 陪玩服务
- 陪玩者信息管理
- 服务发布与管理
- 在线状态管理
- 评价系统

### 订单系统
- 订单创建与支付
- 订单状态跟踪
- 退款流程
- 结算管理

### 俱乐部管理
- 俱乐部入驻
- 陪玩者管理
- 订单统计
- 财务管理

### 实时聊天
- 一对一聊天
- 订单关联消息
- 实时消息推送
- 消息记录

## API使用示例

### 用户登录
```javascript
// 邮箱登录
const result = await GameCompanionAPI.auth.login('user@example.com', 'password')

// 手机号登录  
const result = await GameCompanionAPI.auth.loginWithPhone('13800138000', 'password')
```

### 获取热门陪玩
```javascript
const playmates = await GameCompanionAPI.playmate.getHotPlaymates(10, 0)
```

### 创建订单
```javascript
const order = await GameCompanionAPI.order.createOrder(
  userId, 
  serviceId, 
  scheduledTime, 
  serviceHours,
  '备注信息'
)
```

### 发送消息
```javascript
const message = await GameCompanionAPI.chat.sendMessage(
  senderId, 
  receiverId, 
  '你好，我想咨询一下服务详情',
  'text',
  orderId
)
```

## 数据库架构

### 核心表
- `users` - 用户表
- `clubs` - 俱乐部表  
- `playmates` - 陪玩者表
- `services` - 服务表
- `orders` - 订单表
- `reviews` - 评价表
- `messages` - 消息表
- `favorites` - 收藏表
- `games` - 游戏表

### 关系设计
- 用户与陪玩者: 一对一
- 俱乐部与陪玩者: 一对多
- 陪玩者与服务: 一对多
- 用户与订单: 一对多
- 订单与评价: 一对一

## 安全特性

- 行级安全策略(RLS)
- 数据加密存储
- 输入验证与清理
- 防SQL注入
- 认证授权机制

## 部署指南

### Supabase部署
1. 在Supabase控制台导入数据库架构
2. 配置环境变量
3. 启用必要的扩展

### 前端部署
```bash
# 构建项目
npm run build

# 部署到静态托管服务
# 将dist目录部署到Vercel/Netlify等平台
```

## 开发指南

### 添加新服务
1. 在 `src/services/` 创建服务文件
2. 实现业务逻辑
3. 在 `main.js` 中导出
4. 更新API文档

### 数据库变更
1. 修改 `database-schema.sql`
2. 在Supabase控制台执行变更
3. 更新相关服务代码

## 联系方式

如有问题请联系开发团队。

## 许可证

MIT License