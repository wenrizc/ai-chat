# AI 多窗口聊天

<div align="center">

**现代化的多窗口 AI 对话浏览器扩展**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [简体中文](README_zh.md)

</div>

## 概述

AI 多窗口聊天允许你在任意网页上打开多个可拖拽的聊天窗口，将选中的文字发送到新对话，并管理/导出对话历史。通过配置 API 地址、密钥和模型，可对接任何 OpenAI 兼容接口。

## 功能特色

- **多窗口聊天** - 同时打开多个独立的聊天窗口
- **浮动窗口** - 支持拖拽、缩放、最小化、关闭，点击标题可重命名
- **选中文本工具栏** - 选中文本后快速开启新对话
- **历史管理** - 自动保存、重开、删除、导出
- **Markdown 导出** - 支持单条或全部对话导出
- **OpenAI 兼容** - 适配任意 OpenAI 兼容 API

## 安装（开发者模式）

1. 安装依赖：
   - `npm install`
2. 构建后台脚本：
   - `npm run build`
3. 打开 Chrome 并访问 `chrome://extensions/`
4. 开启右上角“开发者模式”
5. 点击“加载已解压的扩展程序”，选择仓库根目录（例如 `ai-chat`）

## 配置 API

1. 点击扩展图标打开设置弹窗
2. 填写：
   - **API URL**：例如 `https://api.openai.com/v1`
   - **API Key**：你的 API 密钥
   - **模型名称**：例如 `gpt-5`
3. 点击“保存配置”

## 使用方法

- 选中文本后点击浮动工具栏的 **AI Chat** 按钮。
- 按 `Alt+N` 打开新聊天窗口，内容为当前选中文本。
- 点击窗口标题可重命名。
- 在 **History** 标签页中重开、导出或删除对话。

## 构建说明

- `build.mjs` 使用 esbuild 将 `background.js` 打包到 `dist/background.js`。
- `manifest.json` 指向 `dist/background.js`，因此必须先完成构建。

## 权限说明

- `storage` 用于本地保存设置与历史
- `activeTab` 与 `host_permissions`（`<all_urls>`）用于在页面上显示选择工具栏

## 许可

[MIT 许可](LICENSE)
