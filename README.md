# AI Multi-Window Chat

<div align="center">

**A modern browser extension for multi-window AI conversations**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Version](https://img.shields.io/badge/Chrome-88%2B-brightgreen)](https://www.google.com/chrome/)

[English](README.md) | [简体中文](README_zh.md)

</div>

## Features

- **Text Selection Toolbar** - Automatically displays toolbar when selecting text on any webpage
- **Multi-Window Chat** - Open multiple independent chat windows simultaneously
- **Auto-Fill** - Selected text automatically copied to input field
- **Floating Windows** - Draggable, minimizable, closable floating chat windows
- **History Management** - Auto-save all conversations with view and export support
- **Export to Markdown** - Export conversations as Markdown files
- **OpenAI Compatible** - Works with all OpenAI-compatible APIs
- **Modern Design** - Clean minimalist white style

## Quick Start

### Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `ai-multi-window-extension` folder
5. Installation complete!

### Configure API

1. Click the extension icon in Chrome toolbar
2. Configure in the popup page:
   - **API URL**: e.g., `https://api.openai.com/v1`
   - **API Key**: Your API key
   - **Model Name**: e.g., `gpt-3.5-turbo`
3. Click "Save"

### Supported APIs

- **OpenAI**: `https://api.openai.com/v1`
- **DeepSeek**: `https://api.deepseek.com`
- **Moonshot**: `https://api.moonshot.cn/v1`
- Any OpenAI-compatible service

## Documentation

For complete documentation, please see:

- 📖 [Full Documentation (English)](README_EN.md)
- 📖 [完整文档 (中文)](README_zh.md)

## Security

- API keys stored locally in `chrome.storage.local`
- Direct communication with API servers, no third-party intermediaries
- No data collection or tracking

## License

[MIT License](LICENSE)

---

<div align="center">

**[English](README.md) | [简体中文](README_zh.md)**

Made with ❤️ by AI Multi-Window Extension Team

</div>
