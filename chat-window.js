// AI Multi-Window Extension - Chat Window Script
// 处理对话窗口的逻辑

class ChatWindow {
  constructor() {
    this.windowId = null;
    this.chatId = null;  // 对话历史ID
    this.title = null;   // 对话标题
    this.messages = [];
    this.isLoading = false;
    this.currentLanguage = 'zh-CN'; // 默认语言

    this.elements = {
      messagesContainer: document.getElementById('messagesContainer'),
      messageInput: document.getElementById('messageInput'),
      sendBtn: document.getElementById('sendBtn'),
      loadingIndicator: document.getElementById('loadingIndicator')
    };

    this.init();
  }

  async init() {
    // 初始化 i18n
    await initI18n();
    this.currentLanguage = getCurrentLanguage();

    // 更新页面翻译
    this.updateTranslations();

    this.setupEventListeners();
    this.setupPostMessageListener();
  }

  // 更新页面翻译
  updateTranslations() {
    // 更新带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = t(key);
    });

    // 更新带有 data-i18n-placeholder 属性的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = t(key);
    });

    // 更新带有 data-i18n-title 属性的元素
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = t(key);
    });
  }

  setupEventListeners() {
    // 发送按钮点击
    this.elements.sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });

    // 输入框事件
    this.elements.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 自动调整输入框高度
    this.elements.messageInput.addEventListener('input', () => {
      this.adjustTextareaHeight();
    });
  }

  setupPostMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'INIT_CHAT') {
        this.windowId = event.data.windowId;

        // 如果提供了 chatId，使用它；否则生成新的
        if (event.data.chatId) {
          this.chatId = event.data.chatId;
        } else {
          const now = new Date();
          this.chatId = `chat-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        }

        // 默认标题
        this.title = event.data.title || t('chat.windowTitle', { number: 1 });

        // 如果有历史消息，加载它们
        if (event.data.historyMessages && Array.isArray(event.data.historyMessages)) {
          this.loadHistoryMessages(event.data.historyMessages);
        }

        // 如果有初始消息，填入输入框
        if (event.data.initialMessage) {
          this.elements.messageInput.value = event.data.initialMessage;
          this.adjustTextareaHeight();
          this.elements.messageInput.focus();
        }

        // 监听标题更新
        window.addEventListener('message', (e) => {
          if (e.data.type === 'UPDATE_TITLE' && e.data.windowId === this.windowId) {
            this.title = e.data.title;
            this.saveChatHistory();
          }
        });
      }
    });
  }

  // 加载历史消息
  loadHistoryMessages(historyMessages) {
    historyMessages.forEach(msg => {
      // 移除欢迎消息
      const welcomeMessage = this.elements.messagesContainer.querySelector('.welcome-message');
      if (welcomeMessage) {
        welcomeMessage.remove();
      }

      // 创建消息元素
      const messageEl = document.createElement('div');
      messageEl.className = `message message-${msg.role}`;

      // 创建消息头部
      const messageHeader = document.createElement('div');
      messageHeader.className = 'message-header';

      const avatar = document.createElement('span');
      avatar.className = 'message-avatar';
      avatar.textContent = msg.role === 'user' ? '👤' : '🤖';

      const roleText = document.createElement('span');
      roleText.className = 'message-role';
      roleText.textContent = msg.role === 'user' ? t('chat.roleUser') : t('chat.roleAI');

      messageHeader.appendChild(avatar);
      messageHeader.appendChild(roleText);

      // 创建消息内容
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';

      if (msg.role === 'assistant') {
        messageContent.innerHTML = this.formatMessage(msg.content);
      } else {
        messageContent.textContent = msg.content;
      }

      messageEl.appendChild(messageHeader);
      messageEl.appendChild(messageContent);

      this.elements.messagesContainer.appendChild(messageEl);

      // 添加到消息数组
      this.messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    this.scrollToBottom();
  }

  adjustTextareaHeight() {
    const textarea = this.elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  async sendMessage() {
    const content = this.elements.messageInput.value.trim();

    if (!content || this.isLoading) return;

    // 添加用户消息
    this.addMessage('user', content);

    // 清空输入框
    this.elements.messageInput.value = '';
    this.adjustTextareaHeight();

    // 开始加载
    this.isLoading = true;
    this.showLoadingIndicator();

    // 发送到 background（非流式）
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHAT_REQUEST',
        messages: this.messages
      });

      if (response.success) {
        // 添加助手回复
        this.addMessage('assistant', response.data);
        // 保存对话历史
        await this.saveChatHistory();
      } else {
        // 显示错误
        this.addMessage('assistant', `❌ 错误: ${response.error}`);
      }
    } catch (error) {
      this.addMessage('assistant', `❌ 发生错误: ${error.message}`);
    } finally {
      this.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  addMessage(role, content) {
    const message = { role, content };
    this.messages.push(message);

    // 移除欢迎消息
    const welcomeMessage = this.elements.messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${role}`;

    // 创建消息头部
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const avatar = document.createElement('span');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const roleText = document.createElement('span');
    roleText.className = 'message-role';
    roleText.textContent = role === 'user' ? t('chat.roleUser') : t('chat.roleAI');

    messageHeader.appendChild(avatar);
    messageHeader.appendChild(roleText);

    // 创建消息内容
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (role === 'assistant') {
      messageContent.innerHTML = this.formatMessage(content);
    } else {
      messageContent.textContent = content;
    }

    messageEl.appendChild(messageHeader);
    messageEl.appendChild(messageContent);

    this.elements.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();

    return messageContent;
  }

  showLoadingIndicator() {
    this.elements.loadingIndicator.style.display = 'flex';
    this.scrollToBottom();
  }

  hideLoadingIndicator() {
    this.elements.loadingIndicator.style.display = 'none';
  }

  scrollToBottom() {
    const container = this.elements.messagesContainer;
    container.scrollTop = container.scrollHeight;
  }

  formatMessage(content) {
    // 使用 marked.js 进行完整的 markdown 渲染
    try {
      // 配置 marked 选项
      marked.setOptions({
        breaks: true, // 支持 GitHub 风格的换行
        gfm: true, // 启用 GitHub Flavored Markdown
        sanitize: false, // 允许 HTML（注意：仅用于可信内容）
        smartLists: true, // 优化列表输出
        smartypants: false // 不自动转换标点符号
      });

      return marked.parse(content);
    } catch (error) {
      console.error('Markdown parse error:', error);
      // 如果解析失败，回退到简单的格式化
      return content
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
    }
  }

  async saveChatHistory() {
    try {
      // 获取现有历史
      const result = await chrome.storage.local.get(['chat_history']);
      const history = result.chat_history || [];

      // 添加时间戳到每条消息
      const messagesWithTimestamp = this.messages.map(msg => ({
        ...msg,
        timestamp: new Date().toISOString()
      }));

      // 查找是否已存在该对话
      const existingIndex = history.findIndex(chat => chat.chatId === this.chatId);

      const chatData = {
        chatId: this.chatId,
        title: this.title,
        createdAt: this.chatId ? this.chatId.replace('chat-', '').replace(/-/g, ':') : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: this.messages.length,
        messages: messagesWithTimestamp
      };

      if (existingIndex >= 0) {
        // 更新现有对话
        history[existingIndex] = chatData;
      } else {
        // 添加新对话
        history.unshift(chatData);
      }

      // 保存到 storage
      await chrome.storage.local.set({ chat_history: history });
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }
}

// 初始化
new ChatWindow();
