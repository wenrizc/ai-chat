// AI Multi-Window Extension - Background Service Worker
// 处理与 AI API 的通信

// 监听来自 content script 和 chat window 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHAT_REQUEST') {
    handleChatRequest(request)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开启以支持异步响应
  }

  if (request.type === 'GET_CONFIG') {
    getConfig()
      .then(config => sendResponse({ success: true, config }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// 获取配置
async function getConfig() {
  const result = await chrome.storage.local.get(['apiUrl', 'apiKey', 'modelName']);

  if (!result.apiUrl || !result.apiKey || !result.modelName) {
    throw new Error('API 配置不完整，请在扩展设置中配置');
  }

  return {
    apiUrl: result.apiUrl,
    apiKey: result.apiKey,
    modelName: result.modelName
  };
}

// 处理聊天请求（非流式）
async function handleChatRequest(request) {
  const { messages } = request;
  const config = await getConfig();

  const endpoint = `${config.apiUrl.replace(/\/$/, '')}/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: messages,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 扩展安装时的处理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装，打开设置页面
    chrome.runtime.openOptionsPage();
  }
});
