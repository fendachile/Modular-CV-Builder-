# Modular CV Builder

一个本地运行的模块化简历编辑工具。左侧填写结构化内容，右侧实时生成简历预览，支持栏目排序、排版模式、板块拖动、磁吸吸附、网格线和浏览器打印导出 PDF。

![Uploading Interface Diagram.png…]()


## 功能概览

- 基本信息、核心优势、项目经历、工作经历、教育经历、技能和其他信息编辑
- 右侧简历实时预览
- 左侧栏目顺序拖拽调整
- 右侧排版模式，可拖动简历板块
- 板块拖动支持磁吸吸附到纸张边缘、中心线和其他板块
- 支持显示网格线和重置排版
- 支持通过浏览器打印导出 PDF
- 默认参考内容已改为计算机/前端开发方向，并做了脱敏处理

## 环境要求

需要先安装 Node.js。安装后可以在终端中检查：

```powershell
node -v
npm.cmd -v
```

如果 PowerShell 中直接运行 `npm` 报脚本权限错误，请使用 `npm.cmd`。

## 本地启动

1. 打开 PowerShell。

2. 进入项目目录：

```powershell
cd D:\softsetup\Trae\project-reserve-V1
```

3. 启动开发服务：

```powershell
npm.cmd run dev
```

4. 打开终端中显示的地址，通常是：

```text
http://localhost:5173/
```

如果这个端口被占用，Vite 会自动给出另一个可用地址，按终端显示的地址打开即可。

## 如何使用

1. 在左侧编辑简历内容。
2. 在“栏目顺序”中拖动栏目，调整右侧简历展示顺序。
3. 点击右侧的“开启排版模式”。
4. 在简历预览中拖动大板块，靠近纸张边缘、中心线或其他板块时会自动吸附。
5. 点击“显示网格线”可以查看网格辅助线。
6. 点击“重置排版”可以恢复板块位置。
7. 点击“导出 PDF”，使用浏览器打印功能保存为 PDF。

## 测试项目

运行自动化测试：

```powershell
npm.cmd test
```

## 构建项目

生成生产版本：

```powershell
npm.cmd run build
```

构建结果会生成到 `dist` 目录。

本地预览构建结果：

```powershell
npm.cmd run preview
```

## 主要目录说明

- `src/App.tsx`：主页面和核心交互逻辑
- `src/data/defaultResume.ts`：默认简历参考数据
- `src/styles.css`：页面和简历样式
- `src/utils/resume.ts`：排序、吸附、数据判断等工具函数
- `src/types/resume.ts`：简历数据类型定义
- `src/App.test.tsx`：页面功能测试
- `src/utils/resume.test.ts`：工具函数测试
- `docs/`：设计说明和实现记录
- `resume-image-redacted.png`：脱敏后的参考图片

## 常见问题

### 双击 package.json 能启动项目吗？

不能。`package.json` 是项目说明文件，真正启动项目需要在终端运行：

```powershell
npm.cmd run dev
```

### 如何停止正在运行的项目？

回到启动项目的终端窗口，按：

```text
Ctrl + C
```

如果提示是否终止，输入 `Y` 后回车。

### 页面内容没有更新怎么办？

可以尝试刷新浏览器页面。如果开发服务没有运行，重新执行：

```powershell
npm.cmd run dev
```

### 为什么仓库里没有 node_modules 和 dist？

`node_modules` 是依赖目录，体积很大，可以通过 `npm.cmd install` 重新安装。`dist` 是构建产物，可以通过 `npm.cmd run build` 重新生成。

## 上传后继续更新 GitHub

修改代码或文档后，可以按下面步骤提交并上传：

```powershell
git add .
git commit -m "更新说明"
git push
```
