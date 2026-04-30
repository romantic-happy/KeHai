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

项目会加载：
- 通用配置：`backend/src/config/config.default.ts`
- 本地环境配置：`backend/src/config/config.local.ts`（推荐你自己新建）
- 生产环境配置：`backend/src/config/config.prod.ts`

其中 `config.local.ts` 已在 `.gitignore` 中忽略，适合放本地数据库账号密码。

### 3.1 新建本地配置文件

在 `backend/src/config/` 下新建 `config.local.ts`，可参考：

```ts
import { CoolConfig } from '@cool-midway/core';
import { MidwayConfig } from '@midwayjs/core';
import { entities } from '../entities';
import { TenantSubscriber } from '../modules/base/db/tenant';

export default {
  typeorm: {
    dataSource: {
      default: {
        type: 'mysql',
        host: '127.0.0.1',
        port: 3306,
        username: 'root',
        password: '123456',
        database: 'cool',
        synchronize: false,
        logging: false,
        charset: 'utf8mb4',
        cache: true,
        entities,
        subscribers: [TenantSubscriber],
      },
    },
  },
  cool: {
    eps: true,
    initDB: false,
    initJudge: 'db',
    initMenu: false,
  } as CoolConfig,
} as MidwayConfig;
```

### 3.2 `synchronize` 建议

- 开发环境：可按需开启（便于快速迭代）
- 生产环境：建议关闭，避免误改表结构

## 4. Dify 连接配置

当前项目存在两类 Dify 集成：**合同生成 Webhook** 和 **业务工作流调用**。

### 4.1 合同生成（Webhook + 回调密钥）

后端配置项在 `backend/src/config/config.default.ts`：
- `DIFY_CONTRACT_WEBHOOK_URL`
- `DIFY_CONTRACT_CALLBACK_SECRET`

建议在启动后端前设置环境变量：

```bash
# PowerShell 示例
$env:DIFY_CONTRACT_WEBHOOK_URL="http://your-dify-host/v1/workflows/run"
$env:DIFY_CONTRACT_CALLBACK_SECRET="your-callback-secret"
npm run dev
```

用途：
- `DIFY_CONTRACT_WEBHOOK_URL`：后端发起合同生成任务时调用的 Dify Webhook 地址
- `DIFY_CONTRACT_CALLBACK_SECRET`：Dify 回调后端时用于校验身份

若未配置，合同相关流程会报错（代码中已显式校验）。

### 4.2 业务工作流（API Key 模式）

配置文件：`backend/src/modules/company/dify.config.ts`
- 每个工作流都有 `apiKey`
- `backend/src/modules/company/service/dify.ts` 中 `DIFY_API_URL` 为 Dify 工作流统一入口

落地时请至少完成：
1. 把 `dify.config.ts` 中各工作流 `apiKey` 替换为你自己的 Key
2. 把 `service/dify.ts` 里的 `DIFY_API_URL` 改成你的 Dify 地址
3. 校验对应工作流输入字段名与 Dify 工作流配置一致

注意：仓库中的部分 Key/URL 是开发占位或历史值，部署前请全部替换为真实环境配置。

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
- 确认 `config.local.ts` 的 `host/port/username/password/database` 正确
- 确认数据库字符集支持 `utf8mb4`

### 6.3 Dify 调用失败
- 先检查 `DIFY_CONTRACT_WEBHOOK_URL`、`DIFY_CONTRACT_CALLBACK_SECRET` 是否已设置
- 再检查 `dify.config.ts` 的 `apiKey` 与 `DIFY_API_URL` 是否为当前环境可用值
