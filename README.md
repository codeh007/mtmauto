# mtmauto

用于验证 Midscene + Android 云手机自动化链路的 npm CLI。

当前内置业务流是 **红果免费短剧** 的最小真实任务链路。

## 安装与运行

```bash
npm install -g mtmauto
mtmauto --help
```

或直接使用：

```bash
npx mtmauto --help
```

## CLI 约定

- 根命令 `mtmauto`：只显示帮助，不会默认执行业务流
- 查看版本：`mtmauto --version`
- 执行红果流程：
  - `mtmauto hongguo`
  - `mtmauto hongguo run`

## 环境变量加载规则

CLI 按**调用方当前工作目录**加载环境变量（不是包安装目录）：

1. `.env`（若不存在则尝试 `env/dev.env`）
2. `.env.local`（覆盖同名变量）

也可以显式指定文件：

```bash
mtmauto hongguo run --env-file ./config/prod.env
```

## 必填环境变量

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

## 本地开发

```bash
npm install
npm run check
npm test
npm run build
```

快速执行红果流程（源码模式）：

```bash
npm run demo
```

## CI / 发布

- `ci.yml`：类型检查、测试、构建、打包校验，以及构建后 CLI help smoke test
- `publish.yml`：默认走 npm trusted publishing（GitHub OIDC），仅在 trusted publishing 不可用时使用 `NPM_TOKEN` 作为次要 fallback

发布流程会从 `package.json` 读取包名，不再硬编码旧包名。
