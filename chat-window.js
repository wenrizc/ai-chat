import { marked } from 'marked';

class ChatWindow {
  constructor() {
    this.windowId = null;
    this.chatId = null;
    this.title = null;
    this.messages = [];
    this.isLoading = false; 

    this.elements = {
      messagesContainer: document.getElementById('messagesContainer'),
      messageInput: document.getElementById('messageInput'),
      sendBtn: document.getElementById('sendBtn'),
      loadingIndicator: document.getElementById('loadingIndicator')
    };

    this.init();
  }

  async init() {
    document.documentElement.lang = chrome.i18n.getUILanguage() || 'en';

    updatePageTranslations();

    this.setupEventListeners();
    this.setupPostMessageListener();
  }

  setupEventListeners() {
    this.elements.sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });

    this.elements.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.elements.messageInput.addEventListener('input', () => {
      this.adjustTextareaHeight();
    });
  }

  setupPostMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'INIT_CHAT') {
        this.windowId = event.data.windowId;

        // Use existing chatId or generate new one in format: chat-YYYYMMDD-HHMMSS
        if (event.data.chatId) {
          this.chatId = event.data.chatId;
        } else {
          const now = new Date();
          this.chatId = `chat-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        }

        this.title = event.data.title || t('chat__windowTitle', '1');

        if (event.data.historyMessages && Array.isArray(event.data.historyMessages)) {
          this.loadHistoryMessages(event.data.historyMessages);
        }

        if (event.data.initialMessage) {
          this.elements.messageInput.value = event.data.initialMessage;
          this.adjustTextareaHeight();
          this.elements.messageInput.focus();
        }

        window.addEventListener('message', (e) => {
          if (e.data.type === 'UPDATE_TITLE' && e.data.windowId === this.windowId) {
            this.title = e.data.title;
            this.saveChatHistory();
          }
        });
      }
    });
  }

  loadHistoryMessages(historyMessages) {
    historyMessages.forEach(msg => {
      this.removeWelcomeMessage();
      const messageEl = this.createMessageElement(msg);
      this.elements.messagesContainer.appendChild(messageEl);

      this.messages.push({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || null
      });
    });

    this.scrollToBottom();
  }

  createMessageElement(msg) {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${msg.role}`;

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const avatar = document.createElement('span');
    avatar.className = 'message-avatar';
    avatar.textContent = msg.role === 'user' ? '👤' : '🤖';

    const roleText = document.createElement('span');
    roleText.className = 'message-role';
    roleText.textContent = msg.role === 'user' ? t('chat__roleUser') : t('chat__roleAI');

    messageHeader.appendChild(avatar);
    messageHeader.appendChild(roleText);

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (msg.role === 'assistant') {
      messageContent.innerHTML = this.formatMessage(msg.content);
    } else {
      messageContent.textContent = msg.content;
    }

    messageEl.appendChild(messageHeader);
    messageEl.appendChild(messageContent);

    return messageEl;
  }

  adjustTextareaHeight() {
    const textarea = this.elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  removeWelcomeMessage() {
    const welcomeMessage = this.elements.messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
  }

  async sendMessage() {
    const content = this.elements.messageInput.value.trim();

    if (!content || this.isLoading) return;

    this.addMessage('user', content);

    this.elements.messageInput.value = '';
    this.adjustTextareaHeight();

    this.isLoading = true;
    this.showLoadingIndicator();

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHAT_REQUEST',
        messages: this.messages
      });

      if (response.success) {
        this.addMessage('assistant', response.data);
        await this.saveChatHistory();
      } else {
        this.addMessage('assistant', `❌ ${response.error}`);
      }
    } catch (error) {
      this.addMessage('assistant', `❌: ${error.message}`);
    } finally {
      this.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  addMessage(role, content) {
    const message = {
      role,
      content,
      timestamp: new Date().toISOString()
    };
    this.messages.push(message);

    this.removeWelcomeMessage();

    const messageEl = this.createMessageElement(message);
    this.elements.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();

    return messageEl.querySelector('.message-content');
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

  // Parse markdown content for assistant messages
  formatMessage(content) {
    return marked.parse(content);
  }

  async saveChatHistory() {
    try {
      const result = await chrome.storage.local.get(['chat_history']);
      const history = result.chat_history || [];

      const messagesWithTimestamp = this.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString()
      }));

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
        history[existingIndex] = chatData;
      } else {
        history.unshift(chatData);
      }

      await chrome.storage.local.set({ chat_history: history });
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }
}

new ChatWindow();
