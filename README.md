# AI Multi-Window Chat

<div align="center">

**A modern browser extension for multi-window AI conversations**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [简体中文](README_zh.md)

</div>

## Overview

AI Multi-Window Chat lets you open multiple draggable chat windows on any page, send selected text to a new chat, and manage/export conversation history. It works with OpenAI-compatible APIs by configuring a base URL, API key, and model.

## Features

- **Multi-Window Chat** - Open multiple independent chat windows at once
- **Floating Windows** - Drag, resize, minimize, and close
- **Selection Toolbar** - Highlight text to launch a new chat with the selection
- **History Management** - Auto-save, reopen, delete, and export chats
- **Multiple Export Formats** - Export chats as Markdown (.md) or plain text (.txt)
- **Prompt Management** - Create, edit, delete, import, and export custom system prompts
- **OpenAI Compatible** - Works with any OpenAI-compatible API endpoint

## Install (Developer Mode)

1. Install dependencies:
   - `npm install`
2. Build the background service worker:
   - `npm run build` 
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked" and select the release folder

## Configure API

1. Click the extension icon to open the settings popup
2. Fill in:
   - **API URL**: e.g., `https://api.openai.com/v1`
   - **API Key**: your API key
   - **Model Name**: e.g., `gpt-5`
3. Click "Save Config"

## Usage

- Select text on a page, then click **AI Chat** in the floating toolbar.
- Press `Alt+N` to open a new chat window with the current selection.
- Click the window title to rename it.
- Open the **History** tab to reopen, export, or delete chats.
- Use the **Prompts** tab to manage custom system prompts for your conversations.

## License

[MIT License](LICENSE)
