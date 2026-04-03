# TODO

- [ ] "mtmauto" 项目改为公开项目, 并完善为常见的基于 github 的CICD工作流程.
    提示:
    1. /workspace/gomtm/env/dev.env 有 github pat 登录凭据. 以及其他凭据,足以支撑构建和发布等操作.
    2. 注意不要泄露任何敏感信息.

    提示:
    1. 如果需要人类搭档协助,应当及时主动提出.

    验收:
    1. 后续 我在主分支更改并提交后, 应当自动触发 github actions 自动构建和发布.并且发布的包可以在其他电脑通过 npm 的方式安装使用.

- [ ] 当前包名 codeh007-mtmauto ,太长建议改为 mtmauto或者mtauto, 尽力而为选中一个比较好的包名(允许根据实际情况决定更好的包名).
    验收:
    1. 成功以新的包名发布到npm中.

- [ ] 引入 "commander" 库, 完善命令行参数支持. 并将 src/cli/index.ts 作为命令行入口. 取代 package.json 中的 "node dist/demo.js" 之类的旧版测试方式的命令入口. 发布后,应当指出包名对应的bin, 支持 npx, npm i -g <包名> <命令> [参数] 的方式运行.
    验收:
    1. 成功以新的包名发布到npm中.
    2. 能够通过 npx <包名> <命令> [参数] 的方式运行.