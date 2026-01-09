const elements = {
  apiUrl: document.getElementById('apiUrl'),
  apiKey: document.getElementById('apiKey'),
  modelName: document.getElementById('modelName'),
  saveBtn: document.getElementById('saveBtn'),
  status: document.getElementById('status'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  historyList: document.getElementById('historyList'),
  historyStatus: document.getElementById('historyStatus'),
  exportAllBtn: document.getElementById('exportAllBtn'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  exportModal: document.getElementById('exportModal'),
  confirmModal: document.getElementById('confirmModal'),
  confirmText: document.getElementById('confirmText'),
  confirmBtn: document.getElementById('confirmBtn'),
  tabs: document.querySelectorAll('.tab'),
  tabContents: document.querySelectorAll('.tab-content')
};

let currentChatId = null;

async function init() {
  document.documentElement.lang = chrome.i18n.getUILanguage() || 'en';
  document.title = t('popup__pageTitle');
  const manifest = chrome.runtime.getManifest();
  const footer = document.getElementById('footer');
  if (footer) {
    footer.textContent = t('popup__footerVersion', manifest.version);
  }

  setupTabs();
  setupConfigHandlers();
  setupHistoryHandlers();
  loadConfig();
  loadHistory();
  updatePageTranslations();
}

function setupTabs() {
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      elements.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${targetTab}Tab`) {
          content.classList.add('active');
        }
      });

      if (targetTab === 'history') {
        loadHistory();
      }
    });
  });
}

function setupConfigHandlers() {
  elements.saveBtn.addEventListener('click', saveConfig);

  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.apiUrl.value = btn.dataset.url;
      elements.apiUrl.focus();
    });
  });
}

function setupHistoryHandlers() {
  elements.exportAllBtn.addEventListener('click', () => {
    currentChatId = 'all';
    openModal('exportModal');
  });

  elements.clearAllBtn.addEventListener('click', () => {
    showConfirmDialog(t('history__confirmDeleteAll'), async () => {
      await clearAllHistory();
    });
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modal;
      if (modalId) {
        closeModal(modalId);
      }
    });
  });

  document.querySelectorAll('.export-option').forEach(option => {
    option.addEventListener('click', () => {
      exportChat();
    });
  });

  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', () => {
      closeModal('confirmModal');
    });
  }

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}

async function loadConfig() {
  try {
    const result = await chrome.storage.local.get(['apiUrl', 'apiKey', 'modelName']);

    elements.apiUrl.value = result.apiUrl || 'https://api.openai.com/v1';
    elements.apiKey.value = result.apiKey || '';
    elements.modelName.value = result.modelName || '';
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

async function saveConfig() {
  const config = {
    apiUrl: elements.apiUrl.value.trim(),
    apiKey: elements.apiKey.value.trim(),
    modelName: elements.modelName.value.trim()
  };

  if (!config.apiUrl) {
    showStatus(t('popup__labelApiUrl') + ' ' + t('common__error'), 'error');
    return;
  }

  if (!config.apiKey) {
    showStatus(t('popup__labelApiKey') + ' ' + t('common__error'), 'error');
    return;
  }

  if (!config.modelName) {
    showStatus(t('popup__labelModelName') + ' ' + t('common__error'), 'error');
    return;
  }

  try {
    await chrome.storage.local.set(config);
    showStatus(t('popup__statusSaved'), 'success');
  } catch (error) {
    console.error('Failed to save config:', error);
    showStatus(t('popup__statusError'), 'error');
  }
}

function showStatus(message, type = 'success') {
  elements.status.textContent = message;
  elements.status.className = `status show ${type}`;

  setTimeout(() => {
    elements.status.classList.remove('show');
  }, 3000);
}

async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['chat_history']);
    const history = result.chat_history || [];

    if (history.length === 0) {
      elements.historyList.innerHTML = `
        <div class="history-empty">
          <div class="history-empty-icon">💬</div>
          <div data-i18n="history.empty">${t('history__empty')}</div>
        </div>
      `;
      return;
    }

    elements.historyList.innerHTML = history.map(chat => createHistoryItem(chat)).join('');

    history.forEach(chat => {
      const viewBtn = document.getElementById(`view-${chat.chatId}`);
      const deleteBtn = document.getElementById(`delete-${chat.chatId}`);
      const exportBtn = document.getElementById(`export-${chat.chatId}`);

      if (viewBtn) {
        viewBtn.addEventListener('click', () => viewChat(chat));
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          showConfirmDialog(t('history__confirmDeleteItem', escapeHtml(chat.title)), async () => {
            await deleteChat(chat.chatId);
          });
        });
      }

      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          currentChatId = chat.chatId;
          openModal('exportModal');
        });
      }
    });
  } catch (error) {
    console.error('Failed to load history:', error);
    elements.historyList.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon">⚠️</div>
        <div>${t('common__error')}: ${error.message}</div>
      </div>
    `;
  }
}

function createHistoryItem(chat) {
  const timeAgo = getRelativeTime(chat.updatedAt);

  return `
    <div class="history-item">
      <div class="history-item-header">
        <div class="history-item-icon">💬</div>
        <div class="history-item-title">${escapeHtml(chat.title)}</div>
      </div>
      <div class="history-item-meta">
        ${timeAgo} · ${t('history__messageCount', chat.messageCount)}
      </div>
      <div class="history-item-actions">
        <button class="btn btn-secondary" id="view-${chat.chatId}">${t('history__btnView')}</button>
        <button class="btn btn-secondary" id="export-${chat.chatId}">${t('history__btnExport')}</button>
        <button class="btn btn-danger" id="delete-${chat.chatId}">${t('history__btnDelete')}</button>
      </div>
    </div>
  `;
}

async function viewChat(chat) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showHistoryStatus(t('history__errorGetTab'), 'error');
      return;
    }

    chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_HISTORY_CHAT',
      chatId: chat.chatId,
      title: chat.title,
      messages: chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to send message:', chrome.runtime.lastError);
        showHistoryStatus(t('history__errorOpenWindow'), 'error');
      } else if (response && response.success) {
        showHistoryStatus(t('history__successWindowOpened'), 'success');
      }
    });
  } catch (error) {
    console.error('Failed to open chat:', error);
    showHistoryStatus(t('history__errorOpenFailed') + error.message, 'error');
  }
}

async function deleteChat(chatId) {
  try {
    const result = await chrome.storage.local.get(['chat_history']);
    const history = result.chat_history || [];

    const newHistory = history.filter(chat => chat.chatId !== chatId);
    await chrome.storage.local.set({ chat_history: newHistory });

    showHistoryStatus(t('history__successDeleted'), 'success');
    await loadHistory();
  } catch (error) {
    console.error('Failed to delete chat:', error);
    showHistoryStatus(t('history__errorDeleted'), 'error');
  }
}

async function clearAllHistory() {
  try {
    await chrome.storage.local.set({ chat_history: [] });
    showHistoryStatus(t('history__successCleared'), 'success');
    await loadHistory();
  } catch (error) {
    console.error('Failed to clear history:', error);
    showHistoryStatus(t('history__errorDeleted'), 'error');
  }
}

async function exportChat() {
  closeModal('exportModal');

  try {
    const result = await chrome.storage.local.get(['chat_history']);
    const history = result.chat_history || [];

    let content = '';
    let filename = '';
    const type = 'text/markdown';

    if (currentChatId === 'all') {
      content = exportAllAsMarkdown(history);
      filename = `ai-chats-all-${getTimestamp()}.md`;
    } else {
      const chat = history.find(c => c.chatId === currentChatId);
      if (!chat) {
        showHistoryStatus(t('history__errorChatNotFound'), 'error');
        return;
      }

      content = exportSingleAsMarkdown(chat);
      filename = `ai-chat-${getTimestamp()}.md`;
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showHistoryStatus(t('history__successExported'), 'success');
  } catch (error) {
    console.error('Failed to export:', error);
    showHistoryStatus(t('history__errorExported'), 'error');
  }
}

function exportSingleAsMarkdown(chat) {
  const date = new Date(chat.updatedAt).toLocaleString(chrome.i18n.getUILanguage());

  let content = `# ${chat.title}\n\n`;
  content += `${t('export__chatTime')}: ${date}\n`;
  content += `${t('export__messageCount')}: ${chat.messageCount}\n\n`;
  content += `---\n\n`;

  chat.messages.forEach(msg => {
    const role = msg.role === 'user' ? t('export__roleUser') : t('export__roleAI');
    content += `${role}\n\n${msg.content}\n\n`;
  });

  return content;
}

function exportAllAsMarkdown(history) {
  let content = `# ${t('export__title')}\n\n`;
  content += `${t('export__exportTime')}: ${new Date().toLocaleString(chrome.i18n.getUILanguage())}\n`;
  content += `${t('export__chatCount')}: ${history.length}\n\n`;
  content += `---\n\n`;

  history.forEach((chat, index) => {
    content += `## ${index + 1}. ${chat.title}\n\n`;
    content += `${t('export__time')}: ${new Date(chat.updatedAt).toLocaleString(chrome.i18n.getUILanguage())}\n`;
    content += `${t('export__messageCount')}: ${chat.messageCount}\n\n`;

    chat.messages.forEach(msg => {
      const role = msg.role === 'user' ? '👤' : '🤖';
      content += `### ${role}\n\n${msg.content}\n\n`;
    });

    content += `---\n\n`;
  });

  return content;
}

function getRelativeTime(isoString) {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('time__justNow');
  if (diffMins < 60) return t('time__minutesAgo', diffMins);
  if (diffHours < 24) return t('time__hoursAgo', diffHours);
  if (diffDays < 7) return t('time__daysAgo', diffDays);

  const locale = chrome.i18n.getUILanguage();
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hour}${minute}${second}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showHistoryStatus(message, type = 'success') {
  elements.historyStatus.textContent = message;
  elements.historyStatus.className = `status show ${type}`;

  setTimeout(() => {
    elements.historyStatus.classList.remove('show');
  }, 3000);
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

function showConfirmDialog(text, onConfirm) {
  elements.confirmText.textContent = text;
  openModal('confirmModal');

  // Clone and replace button to remove previous event listeners
  const newBtn = elements.confirmBtn.cloneNode(true);
  elements.confirmBtn.parentNode.replaceChild(newBtn, elements.confirmBtn);
  elements.confirmBtn = newBtn;

  elements.confirmBtn.addEventListener('click', async () => {
    closeModal('confirmModal');
    await onConfirm();
  });
}

document.addEventListener('DOMContentLoaded', init);
