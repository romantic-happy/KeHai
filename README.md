# KeHai

Cool-Admin 二次开发项目，包含：
- `backend`：Midway + TypeORM + MySQL
- `frontend`：Vue3 + Vite

本文档重点说明：**如何启动项目、如何配置数据库、如何连接 Dify**。

## 1. 环境要求

- Node.js `>= 18`（后端 `package.json` 已声明）
- MySQL `5.7/8.0`（建议 8.0）
- npm（项目脚本使用 npm）

## 2. 快速启动

### 2.1 启动后端

在 `backend` 目录执行：

```bash
npm install
npm run dev
```

默认后端地址：`http://127.0.0.1:8001`

### 2.2 启动前端

在 `frontend` 目录执行：

```bash
npm install
npm run dev
```

默认前端地址：`http://127.0.0.1:8003`

前端开发代理会把 `/dev/`、`/agent/` 请求转发到后端 `8001` 端口。

### 2.3 登录

浏览器打开前端地址后登录系统。若你使用的是初始化数据，默认可尝试：
- 账号：`admin`
- 密码：`123456`

（若本地数据库数据已变更，请以你实际用户数据为准）

## 3. 数据库连接配置
`backend/src/config/config.local.ts` 中数据库配置为优先读取环境变量：
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`

仓库提供了示例文件：`backend/.env.development`。你可以按自己的环境修改上述字段。

### 3.1 推荐做法

1. 先参考并维护 `backend/.env.development` 中的数据库配置
2. 启动前保证对应环境变量已生效（或按你的启动方式加载到进程中）

### 3.2 `synchronize` 建议

当前 `config.local.ts` 为 `synchronize: true`（便于本地开发）。  
生产环境建议关闭，避免误改表结构。

## 4. Dify 连接配置

当前项目存在两类 Dify 集成：**合同生成 Webhook** 和 **业务工作流调用**。

### 4.1 合同生成（Webhook + 回调密钥）

对应环境变量：
- `DIFY_CONTRACT_WEBHOOK_URL`
- `DIFY_CONTRACT_CALLBACK_SECRET`

用途：
- `DIFY_CONTRACT_WEBHOOK_URL`：后端发起合同生成任务时调用的 Dify Webhook 地址
- `DIFY_CONTRACT_CALLBACK_SECRET`：Dify 回调后端时用于校验身份

### 4.2 业务工作流（API Key 模式）

统一入口与调用身份也改为环境变量：
- `DIFY_API_URL`
- `DIFY_USER`

各工作流 API Key 在 `backend/src/modules/company/dify.config.ts` 中按规则读取：
- 环境变量命名：`DIFY_KEY_${workflowKey}`
- 例如：`DIFY_KEY_materialQuote=app-xxx`

当前涉及的 workflowKey：
- `materialQuote`
- `customerInfo`
- `receptionScript`
- `supplierRecommend`
- `leadAnalysis`
- `customerPortrait`
- `customerOrderAnalysis`

建议：
1. 在环境变量中维护所有 `DIFY_KEY_*`
2. 不再直接改 `dify.config.ts` / `service/dify.ts` 的常量
3. 校验工作流输入字段名与 Dify 工作流配置一致

## 5. 最小联调检查清单

1. 后端启动日志无数据库连接报错
2. 前端可正常打开并登录
3. CRUD 页面可读写数据（验证 MySQL 连接）
4. 调用 Dify 相关页面/接口时不再出现“未配置 Dify 地址/密钥”错误
5. 合同生成场景能触发任务并收到回调结果

## 6. 常见问题

### 6.1 前端请求失败 / 404
- 确认前端是 `8003`，后端是 `8001`
- 确认 `frontend/src/config/proxy.ts` 代理未被误改

### 6.2 后端连不上数据库
- 确认 MySQL 已启动
- 确认 `DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE` 配置正确且已注入运行进程
- 确认数据库字符集支持 `utf8mb4`

### 6.3 Dify 调用失败
- 先检查 `DIFY_CONTRACT_WEBHOOK_URL`、`DIFY_CONTRACT_CALLBACK_SECRET` 是否已设置
- 再检查 `DIFY_API_URL`、`DIFY_USER` 与各项 `DIFY_KEY_*` 是否已正确注入进程环境
