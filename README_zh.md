# AI 多窗口聊天

<div align="center">

**现代化的多窗口 AI 对话浏览器扩展**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Version](https://img.shields.io/badge/Chrome-88%2B-brightgreen)](https://www.google.com/chrome/)

[English](README.md) | [简体中文](README_zh.md)

</div>

## 功能特性

- **文本选择工具栏** - 在任何网页上选中文本时自动显示工具栏
- **多窗口聊天** - 同时打开多个独立的聊天窗口
- **自动填充** - 选中的文本自动复制到输入框
- **浮动窗口** - 可拖动、可最小化、可关闭的浮动聊天窗口
- **历史记录管理** - 自动保存所有对话，支持查看和导出
- **导出为 Markdown** - 将对话导出为 Markdown 文件
- **OpenAI 兼容** - 适用于所有 OpenAI 兼容的 API
- **现代设计** - 简洁的白色极简风格

## 快速开始

### 安装步骤

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启"开发者模式"（右上角）
3. 点击"加载已解压的扩展程序"
4. 选择 `ai-multi-window-extension` 文件夹
5. 安装完成！

### 配置 API

1. 点击 Chrome 工具栏中的扩展图标
2. 在弹出页面中进行配置：
   - **API 地址**：例如 `https://api.openai.com/v1`
   - **API 密钥**：您的 API 密钥
   - **模型名称**：例如 `gpt-3.5-turbo`
3. 点击"保存"

### 支持的 API

- **OpenAI**: `https://api.openai.com/v1`
- **DeepSeek**: `https://api.deepseek.com`
- **Moonshot**: `https://api.moonshot.cn/v1`
- 任何 OpenAI 兼容的服务

## 文档

完整文档请查看：

- 📖 [完整文档 (英文)](README_EN.md)
- 📖 [完整文档 (中文)](README_zh.md)

## 安全性

- API 密钥存储在本地 `chrome.storage.local` 中
- 直接与 API 服务器通信，无第三方中转
- 不收集任何数据或进行跟踪

## 许可证

[MIT 许可证](LICENSE)

---

<div align="center">

**[English](README.md) | [简体中文](README_zh.md)**

用 ❤️ 制作 by AI Multi-Window Extension Team

</div>
