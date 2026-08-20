# 用户偏好记忆（每次会话开始时请先读取本文件并遵守）

## 核心规则：尽量避免占用 C 盘空间

用户明确要求：**以后尽量不要占用 C 盘空间**。

### 具体约束

1. **不向 C 盘安装大型工具/依赖**：
   - 不安装 Playwright / Puppeteer / agent-browser 等浏览器自动化工具（会下载几百 MB 的浏览器内核到 `AppData\Local`）
   - 不全局安装大型 npm 包；不向 `Program Files` 或系统 Python 安装大型包
   - 优先复用本机已有的工具（如系统 Chrome、Git、已有 Python 环境）
2. **临时产物就近放置并事后清理**：
   - 中间脚本、截图、下载文件一律放工作区 `_build\` 目录
   - 任务完成后必须删除 `_build\` 及相关缓存，不遗留到 C 盘
3. **确需安装时**：
   - 优先使用清华镜像 `-i https://pypi.tuna.tsinghua.edu.cn/simple` 减少下载体积与超时
   - 优先 `--user` 安装或装到工作区目录
   - 使用后立即卸载并清理缓存目录
4. **清理检查点**（安装过任何东西后）：
   - `AppData\Local\ms-playwright`（Playwright 浏览器缓存）
   - `AppData\Roaming\npm`（npm 全局包）
   - `AppData\Roaming\Python`（--user 安装的包）
   - 工作区 `_build\` 临时目录

### 背景（2026-08-14 会话）

本次会话为做功能审计安装了 Playwright（约 40MB 包 + 部分浏览器下载残留）与 agent-browser（npm 全局），并多次重启本地服务器，占用了 C 盘空间。用户由此提出此规则。已全部清理。
