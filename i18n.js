function t(key, substitutions = []) {
  if (!Array.isArray(substitutions)) {
    substitutions = [substitutions];
  }

  try {
    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key;
  } catch (error) {
    console.warn(`Translation not found for key: ${key}`, error);
    return key;
  }
}

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

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = t(key);
  });
}
