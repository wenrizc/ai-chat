// AI Multi-Window Extension - Popup Script
// 管理扩展配置和历史记录

// DOM 元素
const elements = {
  // 配置相关
  apiUrl: document.getElementById('apiUrl'),
  apiKey: document.getElementById('apiKey'),
  modelName: document.getElementById('modelName'),
  saveBtn: document.getElementById('saveBtn'),
  status: document.getElementById('status'),
  presetBtns: document.querySelectorAll('.preset-btn'),

  // 历史记录相关
  historyList: document.getElementById('historyList'),
  historyStatus: document.getElementById('historyStatus'),
  exportAllBtn: document.getElementById('exportAllBtn'),
  clearAllBtn: document.getElementById('clearAllBtn'),

  // 模态框
  viewModal: document.getElementById('viewModal'),
  viewModalTitle: document.getElementById('viewModalTitle'),
  viewModalBody: document.getElementById('viewModalBody'),
  exportModal: document.getElementById('exportModal'),
  confirmModal: document.getElementById('confirmModal'),
  confirmText: document.getElementById('confirmText'),
  confirmBtn: document.getElementById('confirmBtn'),

  // 标签页
  tabs: document.querySelectorAll('.tab'),
  tabContents: document.querySelectorAll('.tab-content')
};

// 当前操作的对话ID
let currentChatId = null;
let pendingAction = null;

// 初始化
function init() {
  setupTabs();
  setupConfigHandlers();
  setupHistoryHandlers();
  loadConfig();
  loadHistory();
}

// 设置标签页切换
function setupTabs() {
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // 更新标签状态
      elements.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 更新内容显示
      elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${targetTab}Tab`) {
          content.classList.add('active');
        }
      });

      // 如果切换到历史记录标签页，重新加载历史
      if (targetTab === 'history') {
        loadHistory();
      }
    });
  });
}

// 设置配置相关事件
function setupConfigHandlers() {
  elements.saveBtn.addEventListener('click', saveConfig);

  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.apiUrl.value = btn.dataset.url;
      elements.apiUrl.focus();
    });
  });
}

// 设置历史记录相关事件
function setupHistoryHandlers() {
  elements.exportAllBtn.addEventListener('click', () => {
    currentChatId = 'all';
    openModal('exportModal');
  });

  elements.clearAllBtn.addEventListener('click', () => {
    showConfirmDialog('确定要清空所有历史记录吗？此操作不可撤销。', async () => {
      await clearAllHistory();
    });
  });

  // 绑定所有模态框关闭按钮
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modal;
      if (modalId) {
        closeModal(modalId);
      }
    });
  });

  // 绑定导出选项点击事件
  document.querySelectorAll('.export-option').forEach(option => {
    option.addEventListener('click', () => {
      exportChat();
    });
  });

  // 绑定确认对话框取消按钮
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', () => {
      closeModal('confirmModal');
    });
  }

  // 点击模态框背景关闭
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}

// 加载配置
async function loadConfig() {
  try {
    const result = await chrome.storage.local.get(['apiUrl', 'apiKey', 'modelName']);

    elements.apiUrl.value = result.apiUrl || 'https://api.openai.com/v1';
    elements.apiKey.value = result.apiKey || '';
    elements.modelName.value = result.modelName || 'deepseek-chat';
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

// 保存配置
async function saveConfig() {
  const config = {
    apiUrl: elements.apiUrl.value.trim(),
    apiKey: elements.apiKey.value.trim(),
    modelName: elements.modelName.value.trim()
  };

  if (!config.apiUrl) {
    showStatus('请输入 API 地址', 'error');
    return;
  }

  if (!config.apiKey) {
    showStatus('请输入 API 密钥', 'error');
    return;
  }

  if (!config.modelName) {
    showStatus('请输入模型名称', 'error');
    return;
  }

  try {
    await chrome.storage.local.set(config);
    showStatus('配置已保存', 'success');
  } catch (error) {
    console.error('Failed to save config:', error);
    showStatus('保存配置失败', 'error');
  }
}

// 显示状态消息
function showStatus(message, type = 'success') {
  elements.status.textContent = message;
  elements.status.className = `status show ${type}`;

  setTimeout(() => {
    elements.status.classList.remove('show');
  }, 3000);
}

// 加载历史记录
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['chat_history']);
    const history = result.chat_history || [];

    if (history.length === 0) {
      elements.historyList.innerHTML = `
        <div class="history-empty">
          <div class="history-empty-icon">💬</div>
          <div>暂无历史对话</div>
        </div>
      `;
      return;
    }

    elements.historyList.innerHTML = history.map(chat => createHistoryItem(chat)).join('');

    // 绑定事件
    history.forEach(chat => {
      const viewBtn = document.getElementById(`view-${chat.chatId}`);
      const deleteBtn = document.getElementById(`delete-${chat.chatId}`);
      const exportBtn = document.getElementById(`export-${chat.chatId}`);

      if (viewBtn) {
        viewBtn.addEventListener('click', () => viewChat(chat));
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          showConfirmDialog(`确定要删除对话"${chat.title}"吗？`, async () => {
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
        <div>加载失败: ${error.message}</div>
      </div>
    `;
  }
}

// 创建历史记录项
function createHistoryItem(chat) {
  const timeAgo = getRelativeTime(chat.updatedAt);

  return `
    <div class="history-item">
      <div class="history-item-header">
        <div class="history-item-icon">💬</div>
        <div class="history-item-title">${escapeHtml(chat.title)}</div>
      </div>
      <div class="history-item-meta">
        ${timeAgo} · ${chat.messageCount} 条消息
      </div>
      <div class="history-item-actions">
        <button class="btn btn-secondary" id="view-${chat.chatId}">查看</button>
        <button class="btn btn-secondary" id="export-${chat.chatId}">导出</button>
        <button class="btn btn-danger" id="delete-${chat.chatId}">删除</button>
      </div>
    </div>
  `;
}

// 查看对话详情 - 在新窗口中打开历史聊天
async function viewChat(chat) {
  try {
    // 获取当前活动的标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showHistoryStatus('无法获取当前标签页', 'error');
      return;
    }

    // 向 content script 发送消息，打开历史聊天窗口
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
        showHistoryStatus('无法打开聊天窗口，请确保在支持扩展的页面中使用', 'error');
      } else if (response && response.success) {
        showHistoryStatus('聊天窗口已打开', 'success');
      }
    });
  } catch (error) {
    console.error('Failed to open chat:', error);
    showHistoryStatus('打开聊天窗口失败: ' + error.message, 'error');
  }
}

// 删除对话
async function deleteChat(chatId) {
  try {
    const result = await chrome.storage.local.get(['chat_history']);
    const history = result.chat_history || [];

    const newHistory = history.filter(chat => chat.chatId !== chatId);
    await chrome.storage.local.set({ chat_history: newHistory });

    showHistoryStatus('对话已删除', 'success');
    await loadHistory();
  } catch (error) {
    console.error('Failed to delete chat:', error);
    showHistoryStatus('删除失败', 'error');
  }
}

// 清空所有历史
async function clearAllHistory() {
  try {
    await chrome.storage.local.set({ chat_history: [] });
    showHistoryStatus('历史记录已清空', 'success');
    await loadHistory();
  } catch (error) {
    console.error('Failed to clear history:', error);
    showHistoryStatus('清空失败', 'error');
  }
}

// 导出对话
async function exportChat() {
  closeModal('exportModal');

  try {
    const result = await chrome.storage.local.get(['chat_history']);
    const history = result.chat_history || [];

    let content = '';
    let filename = '';
    const type = 'text/markdown';

    if (currentChatId === 'all') {
      // 导出所有对话
      content = exportAllAsMarkdown(history);
      filename = `ai-chats-all-${getTimestamp()}.md`;
    } else {
      // 导出单个对话
      const chat = history.find(c => c.chatId === currentChatId);
      if (!chat) {
        showHistoryStatus('对话不存在', 'error');
        return;
      }

      content = exportSingleAsMarkdown(chat);
      filename = `ai-chat-${getTimestamp()}.md`;
    }

    // 下载文件
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showHistoryStatus('导出成功', 'success');
  } catch (error) {
    console.error('Failed to export:', error);
    showHistoryStatus('导出失败', 'error');
  }
}

function exportSingleAsMarkdown(chat) {
  const date = new Date(chat.updatedAt).toLocaleString('zh-CN');

  let content = `# ${chat.title}\n\n`;
  content += `**对话时间**：${date}\n`;
  content += `**消息数**：${chat.messageCount}\n\n`;
  content += `---\n\n`;

  chat.messages.forEach(msg => {
    const role = msg.role === 'user' ? '## 👤 用户' : '## 🤖 AI';
    content += `${role}\n\n${msg.content}\n\n`;
  });

  return content;
}

function exportAllAsMarkdown(history) {
  let content = `# AI 对话记录汇总\n\n`;
  content += `**导出时间**：${new Date().toLocaleString('zh-CN')}\n`;
  content += `**对话数**：${history.length}\n\n`;
  content += `---\n\n`;

  history.forEach((chat, index) => {
    content += `## ${index + 1}. ${chat.title}\n\n`;
    content += `**时间**：${new Date(chat.updatedAt).toLocaleString('zh-CN')}\n`;
    content += `**消息数**：${chat.messageCount}\n\n`;

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

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 获取时间戳文件名
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

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 显示历史记录状态
function showHistoryStatus(message, type = 'success') {
  elements.historyStatus.textContent = message;
  elements.historyStatus.className = `status show ${type}`;

  setTimeout(() => {
    elements.historyStatus.classList.remove('show');
  }, 3000);
}

// 打开模态框
function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

// 关闭模态框
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

// 显示确认对话框
function showConfirmDialog(text, onConfirm) {
  elements.confirmText.textContent = text;
  openModal('confirmModal');

  // 移除旧的事件监听器
  const newBtn = elements.confirmBtn.cloneNode(true);
  elements.confirmBtn.parentNode.replaceChild(newBtn, elements.confirmBtn);
  elements.confirmBtn = newBtn;

  // 添加新的事件监听器
  elements.confirmBtn.addEventListener('click', async () => {
    closeModal('confirmModal');
    await onConfirm();
  });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
