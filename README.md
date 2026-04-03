# @codeh007/mtmauto

用于快速验证 Midscene + Android 云手机自动化链路的最小独立演示项目。

当前默认演示目标是 **红果免费短剧** 的最小真实业务任务流。

仓库当前已经按公开项目的方向整理为：

- 可通过 npm 安装/执行的 CLI 包
- 基于 GitHub Actions 的 CI（检查、测试、构建、打包校验）
- 主分支自动发布到 npm 的 workflow（优先 trusted publishing，兼容 `NPM_TOKEN`）

## 安装与运行

### 使用 npm 安装

```bash
npm install -g @codeh007/mtmauto
mtm-auto
```

或直接执行：

```bash
npx @codeh007/mtmauto
```

## 启动

在仓库根目录执行：

```bash
npm install
```

然后参考 `.env.example` 在仓库根目录创建 `.env` 或 `.env.local`，补齐 Midscene 模型配置，再执行：

```bash
npm run demo
```

如果通过已安装的 npm 包运行，也需要提供同样的环境变量。

### 必填环境变量

```bash
MIDSCENE_MODEL_API_KEY=
MIDSCENE_MODEL_NAME=
MIDSCENE_MODEL_BASE_URL=
MIDSCENE_MODEL_FAMILY=gpt-5
VMOS_SSH_USER=
VMOS_SSH_HOST=
VMOS_SSH_PORT=
VMOS_SSH_PASSWORD=
VMOS_LOCAL_ADB_PORT=
VMOS_REMOTE_ADB_HOST=
VMOS_REMOTE_ADB_PORT=
```

脚本会自动：

1. 读取项目根目录的 `.env` / `.env.local`（兼容 `env/dev.env`）
2. 建立云手机 ADB SSH 隧道
3. 连接 `adb`
4. 拉起红果免费短剧
5. 进入“赚钱”页
6. 在“赚钱”页执行一次最小真实任务动作（优先 `立即签到` / `立即领取`，否则回退到 `去看剧`）

## 说明

- 这是独立项目，直接在当前仓库根目录安装依赖并运行，不再依赖旧 monorepo 的 `packages/mtm-auto` 路径。
- 为了适配公开仓库与 npm 发布，云手机连接信息已经改为只从环境变量读取，不再写死在源码里。
- 入口脚本已经收敛为 `src/demo.ts`，公共逻辑位于 `src/lib/`。
- 当前只保留红果免费短剧这个应用的一段最小任务流，不再包含 Android 设置页之类的通用演示动作。
- 运行前请确认本机已安装并可直接调用 `adb` 与 `sshpass`。

## GitHub Actions 发布说明

仓库内新增了两个 workflow：

- `ci.yml`：用于 PR 和 `main` 分支 push 的检查、测试、构建与 `npm pack --dry-run`
- `publish.yml`：用于 `main` 分支 push 后自动构建并发布 npm 包

### 推荐的安全发布方式：npm Trusted Publishing

根据 npm 官方文档，优先使用 GitHub Actions OIDC trusted publishing，而不是长期有效的 `NPM_TOKEN`。

你需要由人类搭档在 npm 网站完成一次性配置：

1. 确认 `@codeh007/mtmauto` 是你最终要公开发布的 npm 包名
2. 在 npm 包设置里把 trusted publisher 指向：
   - GitHub user/org: `codeh007`
   - Repository: `mtmauto`
   - Workflow filename: `publish.yml`
3. 首次跑通后，可在 npm 包设置里进一步限制传统 token 发布权限

### 兼容方案：NPM_TOKEN

如果你暂时还没完成 trusted publishing，也可以在 GitHub 仓库里配置 `NPM_TOKEN` secret，workflow 会自动优先使用它来发布。

### 发布开关

为了避免在 npm 首发权限尚未就绪时让 `main` 分支持续报红，`publish.yml` 现在额外受仓库变量 `NPM_PUBLISH_ENABLED` 控制：

- 未设置或不等于 `true`：`Publish` job 会自动跳过
- 设置为 `true`：后续 `main` 分支 push 会自动进入发布流程

建议顺序：

1. 由 npm 账号持有人准备好可首发 `@codeh007/mtmauto` 的凭据，或先完成一次人工首发
2. 在 GitHub 仓库变量中设置 `NPM_PUBLISH_ENABLED=true`
3. 之后主分支每次版本变更/代码更新都会自动发布

### 自动版本策略

`publish.yml` 会在 `main` 分支每次代码更新后自动发布：

- 如果你已经手动提高了 `package.json` 版本号，workflow 会按你写入的版本发布
- 如果你没有改版本号，workflow 会在上一版 tag 基础上自动递增 patch 版本，避免 npm 因重复版本拒绝发布
