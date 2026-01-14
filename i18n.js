function t(key, substitutions = []) {
  // Handle named placeholders (object format)
  if (substitutions && typeof substitutions === 'object' && !Array.isArray(substitutions)) {
    // Chrome getMessage only supports positional substitutions, so do manual replacement.
    try {
      let result = chrome.i18n.getMessage(key) || key;
      for (const [name, value] of Object.entries(substitutions)) {
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(`\\$${escapedName}\\$`, 'g'), value);
      }
      return result;
    } catch (error) {
      console.warn(`Translation not found for key: ${key}`, error);
      return key;
    }
  }

  // Handle positional placeholders (array format)
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
