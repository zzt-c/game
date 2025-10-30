# Supabase RLS策略问题 - 详细解决方案

## 问题描述
用户在Supabase Authentication中注册成功，但在Table Editor的users表中不显示数据。

## 根本原因
数据库启用了RLS（行级安全），但没有创建允许用户插入自己记录的策略。

## 解决方案

### 方法1：在Supabase控制台执行RLS策略（推荐）

**步骤1：登录Supabase控制台**
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目：`peqjtpoqycwxndacnwfc`

**步骤2：进入SQL编辑器**
1. 在左侧菜单点击 **SQL Editor**
2. 点击 **New query** 创建新查询

**步骤3：执行RLS策略**
复制并执行以下SQL语句：

```sql
-- 为用户表创建RLS策略
-- 允许用户查看自己的信息
CREATE POLICY "用户可以查看自己的信息" ON users
  FOR SELECT USING (auth.uid() = id);

-- 允许用户插入自己的记录（注册时）
CREATE POLICY "用户可以创建自己的记录" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的信息
CREATE POLICY "用户可以更新自己的信息" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 为其他表创建基本策略（可选）
CREATE POLICY "所有人可以查看俱乐部" ON clubs FOR SELECT USING (true);
CREATE POLICY "所有人可以查看陪玩者" ON playmates FOR SELECT USING (true);
CREATE POLICY "所有人可以查看服务" ON services FOR SELECT USING (true);
```

**步骤4：验证策略**
1. 在左侧菜单点击 **Authentication** → **Users**
2. 注册一个新用户测试
3. 在左侧菜单点击 **Table Editor** → **users**
4. 检查新用户是否出现在表中

### 方法2：临时禁用RLS（仅用于测试）

如果方法1不奏效，可以临时禁用RLS进行测试：

```sql
-- 临时禁用users表的RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 测试注册功能
-- 注册成功后重新启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 方法3：使用数据库触发器（高级方案）

创建一个数据库触发器，在用户注册时自动创建用户记录：

```sql
-- 创建插入用户记录的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, created_at)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username', now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 验证步骤

1. **测试注册功能**
   - 访问 http://localhost:3000/login.html
   - 注册一个新用户
   - 检查Authentication中是否显示新用户

2. **检查数据库**
   - 登录Supabase控制台
   - 进入 **Table Editor** → **users**
   - 检查新用户是否出现在表中

3. **验证数据同步**
   - 新用户的ID应该与Authentication中的用户ID一致
   - 邮箱、用户名等信息应该正确同步

## 故障排除

### 如果策略创建失败
- 检查是否有足够的权限创建策略
- 确保表名和列名正确
- 检查RLS是否已启用：`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`

### 如果数据仍然不同步
1. 检查注册代码中的错误处理
2. 查看浏览器控制台是否有错误信息
3. 检查Supabase项目的日志

### 常见错误
- **错误42501**: RLS策略阻止操作
- **错误23505**: 唯一约束冲突（用户已存在）
- **错误23503**: 外键约束失败

## 预防措施

1. **开发环境配置**
   - 在开发初期就配置好RLS策略
   - 使用测试账号验证策略有效性

2. **代码错误处理**
   - 注册失败时提供清晰的错误信息
   - 记录详细的错误日志

3. **监控和日志**
   - 监控数据库操作失败
   - 设置警报通知

## 相关文件

- `database-schema.sql` - 数据库架构（已启用RLS）
- `database-rls-policies.sql` - 完整的RLS策略配置
- `src/services/auth-service.js` - 认证服务（已添加错误处理）

## 下一步

1. 立即执行方法1中的RLS策略
2. 测试用户注册功能
3. 验证数据同步是否正常
4. 如有需要，为其他表创建相应的RLS策略