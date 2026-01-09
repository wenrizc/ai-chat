import OpenAI from 'openai';

const CONFIG_KEYS = ['apiUrl', 'apiKey', 'modelName'];

// Handle async message responses by returning true
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHAT_REQUEST') {
    handleChatRequest(request)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.type === 'GET_CONFIG') {
    getConfig()
      .then(config => sendResponse({ success: true, config }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function getConfig() {
  const result = await chrome.storage.local.get(CONFIG_KEYS);

  if (!result.apiKey || !result.modelName) {
    throw new Error(chrome.i18n.getMessage('error__apiConfigMissing'));
  }

  return {
    apiUrl: result.apiUrl,
    apiKey: result.apiKey,
    modelName: result.modelName
  };
}

async function handleChatRequest(request) {
  const { messages } = request;
  const config = await getConfig();

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: normalizeBaseUrl(config.apiUrl),
    dangerouslyAllowBrowser: true
  });

  const data = await client.chat.completions.create({
    model: config.modelName,
    messages
  });

  const content = data?.choices?.[0]?.message?.content || '';
  if (!content) {
    throw new Error(chrome.i18n.getMessage('error__emptyApiResponse'));
  }

  return content;
}

// Remove trailing slash to ensure consistent URL formatting
function normalizeBaseUrl(apiUrl) {
  if (!apiUrl) return undefined;
  return apiUrl.replace(/\/$/, '');
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});
