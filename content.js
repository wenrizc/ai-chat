// AI Multi-Window Extension - Content Script
// 监听文本选择并创建悬浮对话窗口

class AIMultiWindow {
  constructor() {
    this.windows = new Map();
    this.windowCounter = 0;
    this.currentLanguage = 'zh-CN'; // 默认语言
    this.init();
  }

  async init() {
    // 尝试加载语言设置
    try {
      const result = await chrome.storage.local.get(['language']);
      if (result.language && this.isSupportedLanguage(result.language)) {
        this.currentLanguage = result.language;
      }
    } catch (error) {
      console.warn('Failed to load language preference:', error);
    }

    this.setupTextSelection();
    this.setupKeyboardShortcuts();
    this.setupRuntimeMessageListener();
    this.setupLanguageChangeListener();
    console.log('AI Multi-Window Extension initialized');
  }

  // 设置语言变化监听
  setupLanguageChangeListener() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.language) {
        const newLanguage = changes.language.newValue;
        if (this.isSupportedLanguage(newLanguage)) {
          this.currentLanguage = newLanguage;
        }

        // 更新所有现有工具栏
        this.updateAllToolbars();
      }
    });
  }

  // 更新所有工具栏的语言
  updateAllToolbars() {
    const toolbar = document.querySelector('.ai-selection-toolbar');
    if (toolbar) {
      // 移除现有工具栏，下次选择文本时会用新语言重新创建
      toolbar.remove();
    }
  }

  // 获取翻译文本
  isSupportedLanguage(langCode) {
    return langCode === 'zh-CN' || langCode === 'en-US';
  }

  t(key, params = {}) {
    // 如果 i18n 已加载，使用它；否则使用简化版本
    if (typeof window !== 'undefined' && window.t) {
      return window.t(key, params);
    }

    // 简化版本的翻译（仅作为回退）
    const translations = {
      'zh-CN': {
        'content.toolbarChat': '在新的对话窗口中讨论',
        'content.toolbarBtnChat': 'AI对话',
        'content.btnMinimize': '最小化',
        'content.btnClose': '关闭',
        'chat.windowTitle': '{number}'
      },
      'en-US': {
        'content.toolbarChat': 'Discuss in a new chat window',
        'content.toolbarBtnChat': 'AI Chat',
        'content.btnMinimize': 'Minimize',
        'content.btnClose': 'Close',
        'chat.windowTitle': '{number}'
      }
    };

    let value = translations[this.currentLanguage] && translations[this.currentLanguage][key];
    if (!value) {
      value = translations['zh-CN'][key] || key;
    }

    // 处理参数替换
    if (typeof value === 'string' && params) {
      Object.keys(params).forEach(paramKey => {
        value = value.replace(`{${paramKey}}`, params[paramKey]);
      });
    }

    return value;
  }

  // 设置文本选择监听
  setupTextSelection() {
    let selectionTimeout;

    document.addEventListener('mouseup', (e) => {
      // 忽略在悬浮窗口内的选择
      if (e.target.closest('.ai-multi-window') || e.target.closest('.ai-selection-toolbar')) return;

      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        this.handleTextSelection(e);
      }, 300);
    });

    // 当选择改变时隐藏之前的工具栏
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.ai-selection-toolbar')) {
        this.hideToolbar();
      }
    });
  }

  // 处理文本选择
  handleTextSelection(event) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length < 2) return;

    // 获取选择范围
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 显示浮动工具栏
    this.showToolbar(rect, selectedText);
  }

  // 显示浮动工具栏
  showToolbar(rect, selectedText) {
    let toolbar = document.querySelector('.ai-selection-toolbar');

    if (!toolbar) {
      toolbar = this.createToolbar();
      document.body.appendChild(toolbar);
    }

    // 保存选择内容
    toolbar.dataset.selectedText = selectedText;

    // 计算位置
    const toolbarRect = toolbar.getBoundingClientRect();
    let top = rect.top - toolbarRect.height - 8;
    let left = rect.left + (rect.width - toolbarRect.width) / 2;

    // 边界检查
    if (top < 10) top = rect.bottom + 8;
    if (left < 10) left = 10;
    if (left + toolbarRect.width > window.innerWidth - 10) {
      left = window.innerWidth - toolbarRect.width - 10;
    }

    toolbar.style.top = `${top + window.scrollY}px`;
    toolbar.style.left = `${left + window.scrollX}px`;
    toolbar.style.display = 'flex';
  }

  // 创建工具栏
  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'ai-selection-toolbar';
    toolbar.innerHTML = `
      <button class="ai-toolbar-btn" data-action="chat" title="${this.t('content.toolbarChat')}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        <span>${this.t('content.toolbarBtnChat')}</span>
      </button>
    `;

    // 绑定按钮事件
    const btn = toolbar.querySelector('.ai-toolbar-btn');
    btn.addEventListener('click', () => {
      const selectedText = toolbar.dataset.selectedText;
      this.handleAction('chat', selectedText);
      this.hideToolbar();
    });

    return toolbar;
  }

  // 隐藏工具栏
  hideToolbar() {
    const toolbar = document.querySelector('.ai-selection-toolbar');
    if (toolbar) {
      toolbar.style.display = 'none';
    }
  }

  // 处理工具栏操作
  handleAction(action, selectedText) {
    switch (action) {
      case 'chat':
        this.createChatWindow(selectedText);
        break;
    }
  }

  // 创建新的对话窗口
  createChatWindow(initialMessage = '', chatId = null, title = null, historyMessages = null) {
    this.windowCounter++;
    const windowId = `ai-window-${this.windowCounter}`;

    // 创建窗口容器
    const windowContainer = document.createElement('div');
    windowContainer.id = windowId;
    windowContainer.className = 'ai-multi-window';
    windowContainer.innerHTML = `
      <div class="ai-window-header">
        <div class="ai-window-title">
          <span class="ai-window-number">${title || this.t('chat.windowTitle', { number: this.windowCounter })}</span>
        </div>
        <div class="ai-window-controls">
          <button class="ai-window-btn ai-minimize-btn" title="${this.t('content.btnMinimize')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H5v-2h14v2z"/>
            </svg>
          </button>
          <button class="ai-window-btn ai-close-btn" title="${this.t('content.btnClose')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="ai-window-content">
        <iframe class="ai-chat-iframe" src="${chrome.runtime.getURL('chat-window.html')}"></iframe>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(windowContainer);

    // 设置初始位置（层叠式排列）
    const offset = (this.windowCounter - 1) * 30;
    windowContainer.style.top = `${80 + offset}px`;
    windowContainer.style.left = `${200 + offset}px`;

    // 使窗口可拖动
    this.makeDraggable(windowContainer);

    // 使窗口可调整大小
    this.makeResizable(windowContainer);

    // 绑定窗口控制按钮事件
    this.bindWindowControls(windowContainer, windowId);

    // 保存窗口引用
    this.windows.set(windowId, {
      element: windowContainer,
      initialMessage: initialMessage
    });

    // 等待iframe加载完成后发送初始化消息
    setTimeout(() => {
      const iframe = windowContainer.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'INIT_CHAT',
          windowId: windowId,
          initialMessage: initialMessage,
          chatId: chatId,
          title: title,
          historyMessages: historyMessages
        }, '*');
      }
    }, 500);

    return windowId;
  }

  // 使窗口可拖动
  makeDraggable(windowElement) {
    const header = windowElement.querySelector('.ai-window-header');
    let isDragging = false;
    let startX, startY, initialX, initialY;
    let onMouseMove = null;
    let onMouseUp = null;

    // Drag only from the header.
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.ai-window-controls')) return;
      if (e.target.closest('.ai-window-number')) return;
      if (e.target.closest('.ai-title-input')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = windowElement.offsetLeft;
      initialY = windowElement.offsetTop;
      windowElement.style.zIndex = this.getHighestZIndex() + 1;
      windowElement.style.cursor = 'move';

      onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        windowElement.style.left = `${initialX + dx}px`;
        windowElement.style.top = `${initialY + dy}px`;
      };

      onMouseUp = () => {
        isDragging = false;
        windowElement.style.cursor = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  getHighestZIndex() {
    let max = 100;
    document.querySelectorAll('.ai-multi-window').forEach(win => {
      const zIndex = parseInt(window.getComputedStyle(win).zIndex) || 100;
      if (zIndex > max) max = zIndex;
    });
    return max;
  }

  // 使窗口可调整大小
  makeResizable(windowElement) {
    const minWidth = 350;
    const minHeight = 400;

    // 只创建左、右、下三个边框的调整手柄
    const resizeHandles = ['e', 'w', 's', 'se', 'sw'];

    resizeHandles.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `ai-resize-handle ai-resize-${position}`;
      windowElement.appendChild(handle);

      let isResizing = false;
      let startX, startY, startWidth, startHeight, startLeft, startTop;

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = windowElement.offsetWidth;
        startHeight = windowElement.offsetHeight;
        startLeft = windowElement.offsetLeft;
        startTop = windowElement.offsetTop;

        windowElement.style.zIndex = this.getHighestZIndex() + 1;

        const onMouseMove = (e) => {
          if (!isResizing) return;

          const dx = e.clientX - startX;
          const dy = e.clientY - startY;

          // 根据手柄位置调整窗口
          if (position.includes('e')) {
            const newWidth = Math.max(minWidth, startWidth + dx);
            windowElement.style.width = `${newWidth}px`;
          }
          if (position.includes('w')) {
            const newWidth = Math.max(minWidth, startWidth - dx);
            if (newWidth > minWidth) {
              windowElement.style.width = `${newWidth}px`;
              windowElement.style.left = `${startLeft + dx}px`;
            }
          }
          if (position.includes('s')) {
            const newHeight = Math.max(minHeight, startHeight + dy);
            windowElement.style.height = `${newHeight}px`;
          }
        };

        const onMouseUp = () => {
          isResizing = false;
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  }

  // 绑定窗口控制按钮
  bindWindowControls(windowElement, windowId) {
    const titleElement = windowElement.querySelector('.ai-window-number');

    // 单击标题编辑
    titleElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.editTitle(titleElement, windowId);
    });

    // 关闭按钮
    const closeBtn = windowElement.querySelector('.ai-close-btn');
    closeBtn.addEventListener('click', () => {
      this.closeWindow(windowId);
    });

    // 最小化按钮
    const minimizeBtn = windowElement.querySelector('.ai-minimize-btn');
    minimizeBtn.addEventListener('click', () => {
      const content = windowElement.querySelector('.ai-window-content');
      const isMinimized = content.style.display === 'none';
      content.style.display = isMinimized ? 'block' : 'none';
      windowElement.classList.toggle('minimized', !isMinimized);
    });

    // 点击窗口时提升z-index
    windowElement.addEventListener('mousedown', () => {
      windowElement.style.zIndex = this.getHighestZIndex() + 1;
    });
  }

  // 编辑标题
  editTitle(titleElement, windowId) {
    const currentTitle = titleElement.textContent;
    const windowContainer = document.getElementById(windowId);

    // 创建输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.className = 'ai-title-input';

    // 替换为输入框
    titleElement.style.display = 'none';
    titleElement.parentNode.insertBefore(input, titleElement.nextSibling);
    input.focus();
    input.select();

    // 保存标题的函数
    const saveTitle = () => {
      const newTitle = input.value.trim() || currentTitle;
      titleElement.textContent = newTitle;
      titleElement.style.display = '';
      input.remove();

      // 通知 chat-window 更新标题并保存
      const iframe = windowContainer.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'UPDATE_TITLE',
          windowId: windowId,
          title: newTitle
        }, '*');
      }
    };

    // 事件监听
    input.addEventListener('blur', saveTitle);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        titleElement.style.display = '';
        input.remove();
      }
    });
  }

  // 关闭窗口
  closeWindow(windowId) {
    const windowData = this.windows.get(windowId);
    if (windowData) {
      windowData.element.remove();
      this.windows.delete(windowId);
    }
  }

  // 设置快捷键
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + N: 新建对话窗口
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        this.createChatWindow(selectedText);
      }

      // Alt + Escape: 关闭所有窗口
      if (e.altKey && e.key === 'Escape') {
        e.preventDefault();
        this.windows.forEach((_, windowId) => {
          this.closeWindow(windowId);
        });
      }
    });
  }

  // 设置运行时消息监听
  setupRuntimeMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'OPEN_HISTORY_CHAT') {
        const { chatId, title, messages } = request;
        this.createChatWindow('', chatId, title, messages);
        sendResponse({ success: true });
      }
      return true;
    });
  }


}

// 初始化扩展
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AIMultiWindow();
  });
} else {
  new AIMultiWindow();
}
