# Banana Studio Community 提交记录

- 日期：2026-10-30（Asia/Shanghai）。
- 来源：用户明确要求「你把这个发布到 obsidian 官方仓库里去」。
- 对象：独立项目 Banana Studio / `TreyDong/banana-studio`，插件 ID `banana-studio`。
- 授权范围：公开插件仓库、发布独立发行版并准备 Obsidian Community 目录提交。原 Banana Design 条目不属于本次变更。
- 首个独立发行版：0.12.2（继承 0.12.1 代码，补充发行来源证明与 README 使用披露）。

## 提交路径

当前官方提交入口为 Obsidian Community 的 New plugin 表单。GitHub 仓库默认分支需包含准确 manifest，匹配版本标签的 GitHub Release 需直接附带 main.js、manifest.json 和 styles.css；ZIP 不作为安装来源。

来源：https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin

## 发布者确认

2026-10-30 实际提交表单要求同意 Developer Policies，并承诺持续维护，无法维护时移除或转移插件。用户已在本会话明确回复「同意，勾选并提交」。已据此勾选两项并提交；官方已创建管理页并完成 Publish；最终审核状态为 Completed，公开页面已开放 Add to Obsidian 安装入口。

管理页：https://community.obsidian.md/account/plugins/banana-studio

GitHub 正式发行：https://github.com/TreyDong/banana-studio/releases/tag/0.12.2

发行验证：GitHub Actions 40990641359 成功，三个发行附件与本机构建逐字节一致，main.js 构建来源证明验证成功。自动化测试 131 项通过、0 项失败、1 项可选 Chrome 集成测试跳过。

公开页面：https://community.obsidian.md/plugins/banana-studio

最终审核结果：版本 0.12.2、源提交 419c2c0，状态 Completed。main.js 与 styles.css 的 GitHub artifact attestation、依赖安全检查、代码混淆检查、逐字节构建复现均为 Pass，无阻断 Error。11 MB 安装包与桌面能力（文件系统、子进程等）保留 Warning；README 已说明对应使用范围及 Sync Standard 限制。

公开安装验收：刷新官方公开页面后，Add to Obsidian 已由禁用按钮变为可用链接，目标为 obsidian://show-plugin?id=banana-studio。未点击该链接，未改动用户现有笔记库或安装。
