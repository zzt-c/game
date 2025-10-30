# Supabase RLS策略问题解决方案

## 问题描述
用户在Supabase Authentication中显示，但在数据库users表中不显示。

## 根本原因
数据库启用了RLS（行级安全），但没有创建相应的插入策略，导致用户注册后无法将数据插入到users表中。

## 测试结果
通过测试脚本确认：
- ✅ 用户认证注册成功
- ❌ 插入用户记录失败，错误代码：42501
- ❌ 错误信息：`new row violates row-level security policy for table "users"`

## 解决方案

### 方案1：在Supabase控制台创建RLS策略（推荐）

1. 登录到 [Supabase控制台](https://supabase.com/dashboard)
2. 选择您的项目：`peqjtpoqycwxndacnwfc`
3. 进入 **SQL编辑器**
4. 执行以下SQL语句创建RLS策略：

```sql
-- 用户表RLS策略
-- 允许用户查看自己的信息
CREATE POLICY "用户可以查看自己的信息" ON users
  FOR SELECT USING (auth.uid() = id);

-- 允许用户插入自己的记录（注册时）
CREATE POLICY "用户可以创建自己的记录" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的信息
CREATE POLICY "用户可以更新自己的信息" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 其他表的策略（可选）
CREATE POLICY "所有人可以查看俱乐部" ON clubs FOR SELECT USING (true);
CREATE POLICY "所有人可以查看陪玩者" ON playmates FOR SELECT USING (true);
CREATE POLICY "所有人可以查看服务" ON services FOR SELECT USING (true);
```

### 方案2：临时禁用RLS（仅用于测试）

```sql
-- 临时禁用users表的RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 测试完成后重新启用
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 方案3：使用服务角色密钥（高级方案）

如果需要在未认证状态下插入用户记录，可以使用服务角色密钥：

```javascript
// 使用服务角色密钥创建客户端
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://peqjtpoqycwxndacnwfc.supabase.co',
  'YOUR_SERVICE_ROLE_KEY' // 从Supabase设置中获取
)
```

## 当前代码修改

已修改 `src/services/auth-service.js` 中的注册方法：

1. **添加了错误处理**：当RLS策略阻止插入时，不会完全失败
2. **提供警告信息**：告知用户认证成功但数据库记录可能未同步
3. **保持功能可用**：即使数据库插入失败，认证功能仍然正常工作

## 验证步骤

1. 在Supabase控制台执行RLS策略
2. 重新测试用户注册功能
3. 检查users表中是否出现新用户记录
4. 验证认证用户和数据库用户的ID是否匹配

## 预防措施

1. **数据库设计时考虑RLS**：在创建表结构时就规划好安全策略
2. **测试环境配置**：确保测试环境有正确的RLS策略
3. **文档记录**：记录所有表的RLS策略要求
4. **错误监控**：在生产环境中监控RLS相关的错误

## 相关文件

- `database-schema.sql` - 数据库架构（已启用RLS）
- `database-rls-policies.sql` - 完整的RLS策略配置
- `src/services/auth-service.js` - 修改后的认证服务

## 下一步行动

1. 立即执行方案1中的RLS策略
2. 重新测试用户注册功能
3. 验证数据同步是否正常
4. 如有需要，为其他表创建相应的RLS策略