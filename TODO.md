# TODO

- [ ] "mtmauto" 项目改为公开项目, 并完善为常见的基于 github 的CICD工作流程.
    提示:
    1. /workspace/gomtm/env/dev.env 有 github pat 登录凭据.
    2. 注意不要泄露任何敏感信息.

    提示:
    1. 如果需要人类搭档协助,应当及时主动提出.

    验收:
    1. 后续 我在主分支更高了代码, 应当自动触发 github actions 自动构建和发布.并且发布的包可以在其他电脑通过 npm 的方式安装使用.