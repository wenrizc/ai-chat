/**
 * AI Multi-Window Extension - Internationalization (i18n) Module
 * Provides multi-language support with high extensibility
 */

// Language pack collection - easy to add new languages
const languages = {
  'zh-CN': {
    // Popup / Configuration Interface
    popup: {
      title: 'AI 助手',
      tabConfig: '配置',
      tabHistory: '历史记录',
      sectionApiConfig: 'API 配置',
      labelApiUrl: 'API 地址',
      labelApiKey: 'API 密钥',
      labelModelName: '模型名称',
      placeholderApiUrl: 'https://api.openai.com/v1',
      placeholderApiKey: '',
      placeholderModelName: '',
      btnSaveConfig: '保存配置',
      noteApiCompatibility: '支持所有 OpenAI 兼容的 API',
      statusSaved: '配置已保存',
      statusError: '保存失败，请检查输入',
      language: '语言'
    },
    // History Tab
    history: {
      title: 'ai chat',
      empty: '暂无历史对话',
      btnExportAll: '导出所有',
      btnClearHistory: '清空历史',
      modalViewTitle: '对话详情',
      modalExportTitle: '选择导出格式',
      exportFormatMarkdown: 'Markdown (.md)',
      btnView: '查看',
      btnExport: '导出',
      btnDelete: '删除',
      btnResume: '继续对话',
      confirmDeleteAll: '确定要清空所有历史记录吗？',
      confirmDeleteItem: '确定要删除对话"{title}"吗？',
      btnConfirm: '确定',
      btnCancel: '取消',
      messageCount: '{count} 条消息',
      errorGetTab: '无法获取当前标签页',
      errorOpenWindow: '无法打开聊天窗口，请确保在支持扩展的页面中使用',
      successWindowOpened: '聊天窗口已打开',
      errorOpenFailed: '打开聊天窗口失败: ',
      successDeleted: '对话已删除',
      errorDeleted: '删除失败',
      successCleared: '历史记录已清空',
      successExported: '导出成功',
      errorExported: '导出失败',
      errorChatNotFound: '对话不存在'
    },
    // Chat Window
    chat: {
      welcome: '开始对话',
      welcomeHint: '输入问题，开始与 AI 对话',
      placeholderInput: '输入你的问题...',
      btnSend: '发送',
      thinking: 'AI 正在思考...',
      windowTitle: '{number}',
      roleUser: '用户',
      roleAI: 'AI'
    },
    // Content Script / Selection Toolbar
    content: {
      toolbarChat: '在新的对话窗口中讨论',
      toolbarBtnChat: 'AI对话',
      btnMinimize: '最小化',
      btnClose: '关闭'
    },
    // Common
    common: {
      loading: '加载中...',
      error: '错误',
      success: '成功',
      cancel: '取消',
      confirm: '确定'
    }
  },

  'en-US': {
    // Popup / Configuration Interface
    popup: {
      title: 'AI Assistant',
      tabConfig: 'Config',
      tabHistory: 'History',
      sectionApiConfig: 'API Configuration',
      labelApiUrl: 'API URL',
      labelApiKey: 'API Key',
      labelModelName: 'Model Name',
      placeholderApiUrl: 'https://api.openai.com/v1',
      placeholderApiKey: '',
      placeholderModelName: '',
      btnSaveConfig: 'Save Config',
      noteApiCompatibility: 'Supports all OpenAI-compatible APIs',
      statusSaved: 'Configuration saved',
      statusError: 'Save failed, please check your input',
      language: 'Language'
    },
    // History Tab
    history: {
      title: 'ai chat',
      empty: 'No chat history yet',
      btnExportAll: 'Export All',
      btnClearHistory: 'Clear History',
      modalViewTitle: 'Chat Details',
      modalExportTitle: 'Select Export Format',
      exportFormatMarkdown: 'Markdown (.md)',
      btnView: 'View',
      btnExport: 'Export',
      btnDelete: 'Delete',
      btnResume: 'Resume Chat',
      confirmDeleteAll: 'Are you sure you want to clear all history?',
      confirmDeleteItem: 'Are you sure you want to delete chat "{title}"?',
      btnConfirm: 'Confirm',
      btnCancel: 'Cancel',
      messageCount: '{count} messages',
      errorGetTab: 'Unable to get current tab',
      errorOpenWindow: 'Unable to open chat window. Please make sure you are on a supported page.',
      successWindowOpened: 'Chat window opened',
      errorOpenFailed: 'Failed to open chat window: ',
      successDeleted: 'Chat deleted',
      errorDeleted: 'Delete failed',
      successCleared: 'History cleared',
      successExported: 'Export successful',
      errorExported: 'Export failed',
      errorChatNotFound: 'Chat not found'
    },
    // Chat Window
    chat: {
      welcome: 'Start Chatting',
      welcomeHint: 'Enter a question to start chatting with AI',
      placeholderInput: 'Enter your question...',
      btnSend: 'Send',
      thinking: 'AI is thinking...',
      windowTitle: '{number}',
      roleUser: 'User',
      roleAI: 'AI'
    },
    // Content Script / Selection Toolbar
    content: {
      toolbarChat: 'Discuss in a new chat window',
      toolbarBtnChat: 'AI Chat',
      btnMinimize: 'Minimize',
      btnClose: 'Close'
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm'
    }
  }
};

// Current language (default: Chinese)
let currentLanguage = 'zh-CN';

/**
 * Initialize i18n module
 * Loads language preference from storage
 */
async function initI18n() {
  try {
    const result = await chrome.storage.local.get(['language']);
    if (result.language && languages[result.language]) {
      currentLanguage = result.language;
    }
  } catch (error) {
    console.warn('Failed to load language preference:', error);
  }
}

/**
 * Get translation for a key
 * @param {string} key - Translation key in format 'module.key' (e.g., 'popup.title')
 * @param {Object} params - Optional parameters for string interpolation
 * @returns {string} Translated text
 */
function t(key, params = {}) {
  const keys = key.split('.');
  let value = languages[currentLanguage];

  // Navigate through the language object
  for (const k of keys) {
    if (value && value[k] !== undefined) {
      value = value[k];
    } else {
      // Fallback to Chinese if translation not found
      value = languages['zh-CN'];
      for (const fallbackKey of keys) {
        if (value && value[fallbackKey] !== undefined) {
          value = value[fallbackKey];
        } else {
          // Return key if translation not found
          return key;
        }
      }
      break;
    }
  }

  // Handle string interpolation
  if (typeof value === 'string' && params) {
    Object.keys(params).forEach(paramKey => {
      value = value.replace(`{${paramKey}}`, params[paramKey]);
    });
  }

  return value;
}

/**
 * Get current language code
 * @returns {string} Current language code
 */
function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Set current language and save to storage
 * @param {string} langCode - Language code (e.g., 'zh-CN', 'en-US')
 */
async function setLanguage(langCode) {
  if (languages[langCode]) {
    currentLanguage = langCode;
    try {
      await chrome.storage.local.set({ language: langCode });
      return true;
    } catch (error) {
      console.error('Failed to save language preference:', error);
      return false;
    }
  }
  return false;
}

/**
 * Get list of available languages
 * @returns {Array<{code: string, name: string}>} Available languages
 */
function getAvailableLanguages() {
  return [
    { code: 'zh-CN', name: '简体中文' },
    { code: 'en-US', name: 'English' }
  ];
}

/**
 * Translate all elements with data-i18n attribute
 * This function updates DOM elements in real-time
 */
function updatePageTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = t(key);

    if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
      element.placeholder = translation;
    } else {
      element.textContent = translation;
    }
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

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initI18n,
    t,
    getCurrentLanguage,
    setLanguage,
    getAvailableLanguages,
    updatePageTranslations
  };
}
