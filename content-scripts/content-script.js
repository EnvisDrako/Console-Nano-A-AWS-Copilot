// Console Nano Content Script - The In-Page Hands
// Handles page interaction, element highlighting, and context detection

class AWSContextDetector {
  constructor() {
    this.currentContext = null;
    this.errorObserver = null;
    this.highlightedElement = null;
  }

  detectContext() {
    try {
      const context = {
        service: this.detectService(),
        pageTitle: this.detectPageTitle(),
        url: window.location.href,
        elements: this.detectKeyElements() || { summary: [], inputs: [], buttons: [], dropdowns: [] },
        breadcrumbs: this.detectBreadcrumbs() || [],
        errors: this.detectErrors() || [],
        formState: this.detectFormState() || { visibleFields: [], filledFields: [], emptyFields: [], buttons: [], dropdowns: [] },
        currentAction: this.detectCurrentAction() || {}
      };

      this.currentContext = context;
      return context;
    } catch (error) {
      console.error('Error detecting context:', error);
      return {
        service: 'AWS Console',
        pageTitle: document.title,
        url: window.location.href,
        elements: { summary: [], inputs: [], buttons: [], dropdowns: [] },
        breadcrumbs: [],
        errors: [],
        formState: { visibleFields: [], filledFields: [], emptyFields: [], buttons: [], dropdowns: [] },
        currentAction: {}
      };
    }
  }

  detectService() {
    // Extract AWS service from URL
    const urlMatch = window.location.href.match(/console\.aws\.amazon\.com\/([^\/]+)/);
    if (urlMatch) {
      return urlMatch[1].toUpperCase();
    }

    // Try to detect from page
    const serviceNav = document.querySelector('[data-testid="awsc-nav-service-name"]');
    if (serviceNav) {
      return serviceNav.textContent.trim();
    }

    // Fallback to breadcrumbs
    const breadcrumb = document.querySelector('.awsui-breadcrumb-item');
    if (breadcrumb) {
      return breadcrumb.textContent.trim();
    }

    return 'AWS Console';
  }

  detectPageTitle() {
    // Try various title sources
    const h1 = document.querySelector('h1');
    if (h1) return h1.textContent.trim();

    const title = document.querySelector('[data-testid="header-title"]');
    if (title) return title.textContent.trim();

    return document.title;
  }

  detectKeyElements() {
    const elements = [];
    const visibleInputs = [];
    const visibleButtons = [];
    const visibleDropdowns = [];

    // Buttons - detailed state
    const buttons = document.querySelectorAll('button:not([disabled]), [role="button"]:not([disabled])');
    buttons.forEach(btn => {
      if (this.isElementVisible(btn)) {
        const text = btn.textContent.trim();
        if (text && text.length < 100) {
          elements.push(`Button: ${text}`);
          
          visibleButtons.push({
            text: text,
            selector: this.getMultipleSelectors(btn),
            isPrimary: this.isPrimaryButton(btn),
            ariaLabel: btn.getAttribute('aria-label') || '',
            className: btn.className || ''
          });
        }
      }
    });

    // Form inputs - get detailed state
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
    inputs.forEach(input => {
      if (this.isElementVisible(input)) {
        const label = this.findLabelForInput(input);
        const value = input.value || '';
        const placeholder = input.placeholder || '';
        const isRequired = input.required || false;
        const isEmpty = value.trim() === '';
        
        elements.push(`Input: ${label} = "${value}"`);
        
        visibleInputs.push({
          label: label,
          type: input.tagName.toLowerCase(),
          inputType: input.type || 'text',
          value: value,
          placeholder: placeholder,
          isEmpty: isEmpty,
          isRequired: isRequired,
          selector: this.getMultipleSelectors(input),
          hasValue: value.length > 0,
          ariaLabel: input.getAttribute('aria-label') || ''
        });
      }
    });

    // Dropdowns and selects
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      if (this.isElementVisible(select)) {
        const label = this.findLabelForInput(select);
        const options = Array.from(select.options).map(opt => ({
          text: opt.text.trim(),
          value: opt.value,
          selected: opt.selected
        }));
        
        visibleDropdowns.push({
          label: label,
          value: select.value,
          selectedText: select.options[select.selectedIndex]?.text?.trim() || '',
          options: options,
          selector: this.getMultipleSelectors(select),
          ariaLabel: select.getAttribute('aria-label') || ''
        });
      }
    });

    // Links
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const text = link.textContent.trim();
      if (text && text.length < 50 && !text.startsWith('http')) {
        elements.push(`Link: ${text}`);
      }
    });

    return {
      summary: [...new Set(elements)].slice(0, 30),
      inputs: visibleInputs,
      buttons: visibleButtons,
      dropdowns: visibleDropdowns
    };
  }

  detectFormState() {
    const formState = {
      visibleFields: [],
      filledFields: [],
      emptyFields: [],
      buttons: [],
      dropdowns: []
    };

    // Detect all visible form fields
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    inputs.forEach(input => {
      if (this.isElementVisible(input)) {
        const fieldInfo = {
          label: this.findLabelForInput(input),
          type: input.tagName.toLowerCase(),
          inputType: input.type || 'text',
          value: input.value || '',
          placeholder: input.placeholder || '',
          required: input.required || false,
          disabled: input.disabled || false,
          selector: this.getElementSelector(input)
        };

        formState.visibleFields.push(fieldInfo);

        if (input.value && input.value.trim() !== '') {
          formState.filledFields.push(fieldInfo);
        } else if (!input.disabled) {
          formState.emptyFields.push(fieldInfo);
        }
      }
    });

    // Detect dropdowns
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      if (this.isElementVisible(select)) {
        const options = Array.from(select.options).map(opt => ({
          text: opt.text,
          value: opt.value,
          selected: opt.selected
        }));

        formState.dropdowns.push({
          label: this.findLabelForInput(select),
          options: options,
          selectedValue: select.value,
          selector: this.getElementSelector(select)
        });
      }
    });

    // Detect visible buttons
    const buttons = document.querySelectorAll('button:not([disabled]), [role="button"]:not([disabled])');
    buttons.forEach(btn => {
      if (this.isElementVisible(btn)) {
        const text = btn.textContent.trim();
        if (text && text.length < 100) {
          formState.buttons.push({
            text: text,
            type: btn.getAttribute('type') || 'button',
            selector: this.getElementSelector(btn),
            classes: btn.className
          });
        }
      }
    });

    return formState;
  }

  getElementSelector(element) {
    if (!element) return '';
    
    // Generate a reliable CSS selector
    if (element.id) {
      return `#${element.id}`;
    }

    // Try aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return `[aria-label="${ariaLabel}"]`;
    }

    // Try name attribute
    if (element.name) {
      return `[name="${element.name}"]`;
    }

    // Try data-testid (AWS uses these)
    const testId = element.getAttribute('data-testid');
    if (testId) {
      return `[data-testid="${testId}"]`;
    }

    // Fallback to class-based selector
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.length > 0).slice(0, 2);
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  getMultipleSelectors(element) {
    if (!element) return [];
    
    const selectors = [];
    
    // Try all different selector strategies
    if (element.id) {
      selectors.push(`#${element.id}`);
    }
    
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      selectors.push(`[aria-label="${ariaLabel}"]`);
    }
    
    if (element.name) {
      selectors.push(`[name="${element.name}"]`);
    }
    
    const testId = element.getAttribute('data-testid');
    if (testId) {
      selectors.push(`[data-testid="${testId}"]`);
    }
    
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        selectors.push(`.${classes.join('.')}`);
        if (classes.length > 1) {
          selectors.push(`.${classes[0]}`);
        }
      }
    }
    
    const text = element.textContent.trim();
    if (text && text.length < 50) {
      const tag = element.tagName.toLowerCase();
      selectors.push(`${tag}:contains("${text}")`);
    }
    
    return selectors;
  }

  isPrimaryButton(button) {
    if (!button) return false;
    
    const className = button.className || '';
    const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
    
    // Check for primary button indicators
    return className.includes('primary') || 
           className.includes('awsui-button-variant-primary') ||
           ariaLabel.includes('create') ||
           ariaLabel.includes('save') ||
           ariaLabel.includes('submit');
  }

  isElementVisible(element) {
    if (!element) return false;
    
    // Check if element is visible
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetParent !== null;
  }

  detectCurrentAction() {
    // Detect what the user is currently doing
    const activeElement = document.activeElement;
    const modals = document.querySelectorAll('[role="dialog"], .modal, .awsui-modal');
    const alerts = document.querySelectorAll('[role="alert"]');

    return {
      focusedElement: activeElement && activeElement !== document.body ? {
        tag: activeElement.tagName,
        type: activeElement.type || '',
        label: this.findLabelForInput(activeElement),
        value: activeElement.value || ''
      } : null,
      hasOpenModal: modals.length > 0,
      modalContent: modals.length > 0 ? Array.from(modals).map(m => m.textContent.substring(0, 200)) : [],
      recentAlerts: Array.from(alerts).map(a => a.textContent.trim()).slice(0, 3),
      scrollPosition: window.scrollY,
      pageReady: document.readyState === 'complete'
    };
  }

  findLabelForInput(input) {
    if (!input) return 'Unnamed field';
    
    // Try to find associated label
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent.trim();
    }

    // Try parent label
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();

    // Try aria-label
    const ariaLabel = input.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Try placeholder
    if (input.placeholder) return input.placeholder;
    
    return 'Unnamed field';
  }

  detectBreadcrumbs() {
    const breadcrumbs = [];
    const breadcrumbItems = document.querySelectorAll('.awsui-breadcrumb-item, [aria-label="Breadcrumb"] a');
    
    breadcrumbItems.forEach(item => {
      const text = item.textContent.trim();
      if (text) breadcrumbs.push(text);
    });

    return breadcrumbs;
  }

  detectErrors() {
    const errors = [];
    
    // AWS UI Kit error alerts
    const errorAlerts = document.querySelectorAll('[data-testid="flash-bar"] [role="alert"]');
    errorAlerts.forEach(alert => {
      if (alert.className.includes('error') || alert.className.includes('warning')) {
        errors.push({
          type: alert.className.includes('error') ? 'error' : 'warning',
          message: alert.textContent.trim(),
          element: alert
        });
      }
    });

    // Generic error messages
    const errorMessages = document.querySelectorAll('.error-message, .alert-error, [role="alert"][class*="error"]');
    errorMessages.forEach(msg => {
      errors.push({
        type: 'error',
        message: msg.textContent.trim(),
        element: msg
      });
    });

    return errors;
  }
}

class ElementHighlighter {
  constructor() {
    this.currentHighlight = null;
    this.highlightClass = 'console-nano-highlight';
    this.injectHighlightStyles();
  }

  injectHighlightStyles() {
    // Inject CSS styles for highlighting if not already present
    if (!document.getElementById('console-nano-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'console-nano-highlight-styles';
      style.textContent = `
        .console-nano-highlight {
          outline: 3px solid #FF9900 !important;
          outline-offset: 2px !important;
          background-color: rgba(255, 153, 0, 0.1) !important;
          border-radius: 4px !important;
          box-shadow: 0 0 10px rgba(255, 153, 0, 0.5) !important;
          position: relative !important;
          z-index: 9999 !important;
        }

        .console-nano-pulse {
          animation: console-nano-pulse-animation 2s ease-in-out 3 !important;
        }

        @keyframes console-nano-pulse-animation {
          0%, 100% { 
            outline-color: #FF9900 !important;
            box-shadow: 0 0 10px rgba(255, 153, 0, 0.5) !important;
          }
          50% { 
            outline-color: #ffb84d !important;
            box-shadow: 0 0 20px rgba(255, 153, 0, 0.8) !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  highlightElement(selector) {
    // Remove previous highlight
    this.clearHighlight();

    // Support both string selector and array of selectors
    const selectors = Array.isArray(selector) ? selector : [selector];
    
    // Find element using CSS selectors only
    let element = null;
    let foundWithSelector = null;
    
    for (const sel of selectors) {
      if (!sel || sel.trim() === '') continue;
      
      try {
        // Try direct CSS selector
        element = document.querySelector(sel);
        if (element && this.isElementVisible(element)) {
          console.log('Found element with selector:', sel);
          foundWithSelector = sel;
          break;
        }
      } catch (e) {
        console.log('Invalid CSS selector:', sel);
      }
    }

    // Enhanced fallback search if still not found
    if (!element && selectors.length > 0) {
      element = this.findElementBySmartMatch(selectors);
      if (element) {
        console.log('Found element with smart match');
        foundWithSelector = 'smart-match';
      }
    }

    if (!element) {
      // Try to find the most likely element on the page
      element = this.findMostLikelyElement(selectors);
      if (element) {
        console.log('Found most likely element as fallback');
        foundWithSelector = 'fallback';
      }
    }

    if (!element) {
      // Silent failure - just log for debugging
      console.log('No suitable element found for highlighting (silent failure)');
      return false;
    }

    // Add highlight with enhanced visual feedback
    element.classList.add(this.highlightClass);
    this.currentHighlight = element;

    // Scroll into view with better positioning
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });

    // Add pulsing effect for better visibility
    this.addPulseEffect(element);

    // Setup removal after interaction
    this.setupAutoRemove(element);

    return true;
  }

  findElementBySmartMatch(selectors) {
    // Extract meaningful keywords from selectors
    const keywords = new Set();
    
    selectors.forEach(sel => {
      // Extract text from quotes
      const textMatches = sel.match(/['"](.*?)['"]/g);
      if (textMatches) {
        textMatches.forEach(m => {
          const text = m.replace(/['"]/g, '').toLowerCase();
          if (text.length > 2) keywords.add(text);
        });
      }
      
      // Extract words from selectors
      const words = sel.toLowerCase().match(/\b\w{3,}\b/g);
      if (words) {
        words.forEach(word => keywords.add(word));
      }
    });

    // Search for elements matching these keywords
    const allElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [data-testid], label, div[class*="button"], span[class*="button"]');
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const el of allElements) {
      if (!this.isElementVisible(el)) continue;
      
      let score = 0;
      const elementText = (el.textContent || '').toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      const className = (typeof el.className === 'string' ? el.className : el.className?.baseVal || '').toLowerCase();
      const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
      
      // Score based on keyword matches
      keywords.forEach(keyword => {
        if (elementText.includes(keyword)) score += 3;
        if (ariaLabel.includes(keyword)) score += 2;
        if (className.includes(keyword)) score += 1;
        if (placeholder.includes(keyword)) score += 2;
      });
      
      // Bonus for interactive elements
      if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') score += 1;
      if (el.type === 'submit' || className.includes('primary')) score += 1;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = el;
      }
    }
    
    return bestScore > 0 ? bestMatch : null;
  }

  findMostLikelyElement(selectors) {
    // As a last resort, find the most prominent interactive element
    const primaryButtons = document.querySelectorAll('button[class*="primary"], .awsui-button-primary, [role="button"][class*="primary"]');
    for (const btn of primaryButtons) {
      if (this.isElementVisible(btn)) return btn;
    }
    
    const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
    for (const btn of submitButtons) {
      if (this.isElementVisible(btn)) return btn;
    }
    
    const allButtons = document.querySelectorAll('button:not([disabled]), [role="button"]:not([disabled])');
    for (const btn of allButtons) {
      if (this.isElementVisible(btn) && btn.textContent.trim().length > 0) return btn;
    }
    
    return null;
  }

  addPulseEffect(element) {
    // Add a temporary pulsing class for extra attention
    element.classList.add('console-nano-pulse');
    setTimeout(() => {
      if (element.classList.contains('console-nano-pulse')) {
        element.classList.remove('console-nano-pulse');
      }
    }, 3000);
  }

  isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           rect.width > 0 &&
           rect.height > 0 &&
           element.offsetParent !== null;
  }

  findElementByPartialMatch(selectors) {
    // Extract keywords from selectors to search for
    const keywords = [];
    selectors.forEach(sel => {
      // Extract text from selectors like "button[aria-label='Launch Instance']"
      const textMatches = sel.match(/['"](.*?)['"]/g);
      if (textMatches) {
        textMatches.forEach(m => {
          const text = m.replace(/['"]/g, '');
          if (text.length > 2) keywords.push(text);
        });
      }
      
      // Extract class/id from selectors like ".button-primary"
      const classMatches = sel.match(/\.(\w+)/g);
      if (classMatches) {
        classMatches.forEach(m => keywords.push(m.substring(1)));
      }
    });

    // Search for elements matching these keywords
    for (const keyword of keywords) {
      const element = this.findElementByText(keyword);
      if (element) return element;
    }

    return null;
  }

  findElementByText(text) {
    if (!text) return null;
    
    const searchText = text.toLowerCase();
    
    // Search for element containing text
    const allElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [data-testid], label');
    
    for (const el of allElements) {
      // Check text content
      const textContent = el.textContent?.trim() || '';
      if (textContent.toLowerCase().includes(searchText)) {
        return el;
      }
      
      // Check aria-label
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.toLowerCase().includes(searchText)) {
        return el;
      }
      
      // Check placeholder
      const placeholder = el.getAttribute('placeholder');
      if (placeholder && placeholder.toLowerCase().includes(searchText)) {
        return el;
      }
      
      // Check title attribute
      const title = el.getAttribute('title');
      if (title && title.toLowerCase().includes(searchText)) {
        return el;
      }
      
      // Check value attribute
      const value = el.getAttribute('value');
      if (value && value.toLowerCase().includes(searchText)) {
        return el;
      }
      
      // Check for associated label element
      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label && label.textContent?.toLowerCase().includes(searchText)) {
          return el;
        }
      }
      
      // Check parent label
      const parentLabel = el.closest('label');
      if (parentLabel && parentLabel.textContent?.toLowerCase().includes(searchText)) {
        return el;
      }
    }

    // Search by partial word match
    const words = searchText.split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue; // Skip very short words
      
      for (const el of allElements) {
        const textContent = el.textContent?.trim() || '';
        if (textContent.toLowerCase().includes(word)) {
          return el;
        }
      }
    }

    console.warn('Could not find element by text:', text);
    return null;
  }

  setupAutoRemove(element) {
    // Remove highlight after click
    const clickHandler = () => {
      setTimeout(() => {
        this.clearHighlight();
        // Notify that user interacted with element
        chrome.runtime.sendMessage({
          type: 'ELEMENT_INTERACTED',
          data: { elementText: element.textContent.trim() }
        }).catch(err => console.log('Message send failed:', err));
      }, 500);
    };

    element.addEventListener('click', clickHandler, { once: true });
  }

  clearHighlight() {
    if (this.currentHighlight) {
      this.currentHighlight.classList.remove(this.highlightClass);
      this.currentHighlight = null;
    }

    // Clear any orphaned highlights
    document.querySelectorAll(`.${this.highlightClass}`).forEach(el => {
      el.classList.remove(this.highlightClass);
    });
  }

  highlightMultiple(selectors) {
    this.clearHighlight();
    
    let foundAny = false;
    
    selectors.forEach(selector => {
      try {
        const element = document.querySelector(selector);
        if (element && this.isElementVisible(element)) {
          element.classList.add(this.highlightClass);
          foundAny = true;
        }
      } catch (e) {
        console.log('Invalid selector (silent):', selector);
      }
    });
    
    return foundAny;
  }
}

class ErrorMonitor {
  constructor(contextDetector) {
    this.contextDetector = contextDetector;
    this.observer = null;
    this.reportedErrors = new Set();
  }

  startMonitoring() {
    // Initial error check
    this.checkForErrors();

    // Setup mutation observer for dynamic errors
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          this.checkForErrors();
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  checkForErrors() {
    const errors = this.contextDetector.detectErrors();
    
    errors.forEach(error => {
      const errorKey = error.message;
      
      // Avoid duplicate reports
      if (!this.reportedErrors.has(errorKey)) {
        this.reportedErrors.add(errorKey);
        this.reportError(error);
      }
    });
  }

  reportError(error) {
    console.log('Error detected:', error);
    
    chrome.runtime.sendMessage({
      type: 'ERROR_DETECTED',
      data: {
        type: error.type,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }).catch(err => console.log('Message send failed:', err));
  }

  stopMonitoring() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Initialize components with error handling
let contextDetector, highlighter, errorMonitor;

try {
  contextDetector = new AWSContextDetector();
  highlighter = new ElementHighlighter();
  errorMonitor = new ErrorMonitor(contextDetector);

  // Start error monitoring
  errorMonitor.startMonitoring();
  
  console.log('Console Nano content script initialized successfully');
} catch (error) {
  console.error('Console Nano initialization failed:', error);
  
  // Create minimal fallback implementations
  contextDetector = {
    detectContext: () => ({
      service: 'AWS Console',
      pageTitle: document.title,
      url: window.location.href,
      elements: { summary: [], inputs: [], buttons: [], dropdowns: [] },
      breadcrumbs: [],
      errors: [],
      formState: { visibleFields: [], filledFields: [], emptyFields: [], buttons: [], dropdowns: [] },
      currentAction: {}
    })
  };
  
  highlighter = {
    highlightElement: () => false,
    clearHighlight: () => {},
    highlightMultiple: () => {}
  };
}

// Message handler with enhanced error handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message.type);

  try {
    switch (message.type) {
      case 'GET_PAGE_CONTEXT':
        const context = contextDetector.detectContext();
        sendResponse({ success: true, context: context });
        break;

      case 'HIGHLIGHT_ELEMENT':
        const success = highlighter.highlightElement(message.data.selector);
        // Always return success to avoid showing errors to user
        sendResponse({ success: true, elementFound: success });
        break;

      case 'CLEAR_HIGHLIGHT':
        highlighter.clearHighlight();
        sendResponse({ success: true });
        break;

      case 'HIGHLIGHT_MULTIPLE':
        const multiSuccess = highlighter.highlightMultiple(message.data.selectors);
        // Always return success to avoid showing errors to user
        sendResponse({ success: true, elementsFound: multiSuccess });
        break;

      case 'PING':
        // Health check to verify content script is loaded
        sendResponse({ success: true, loaded: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Content script error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }

  return true; // Async response
});

// Detect page changes (SPA navigation)
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (lastUrl !== window.location.href) {
    lastUrl = window.location.href;
    
    // Clear highlights on navigation
    highlighter.clearHighlight();
    
    // Notify about page change
    chrome.runtime.sendMessage({
      type: 'PAGE_CHANGED',
      data: { url: window.location.href }
    }).catch(err => console.log('Message send failed:', err));
  }
});

urlObserver.observe(document, { subtree: true, childList: true });

// Monitor DOM changes for dynamic page updates
let lastContextHash = '';
const contextMonitor = new MutationObserver(() => {
  // Debounce: only check every 2 seconds
  setTimeout(() => {
    const context = contextDetector.detectContext();
    const contextHash = JSON.stringify(context.elements);
    
    if (lastContextHash && lastContextHash !== contextHash) {
      console.log('Page structure changed, notifying service worker');
      chrome.runtime.sendMessage({
        type: 'PAGE_CHANGED',
        data: { 
          url: window.location.href,
          timestamp: Date.now()
        }
      }).catch(err => console.log('Message send failed:', err));
    }
    
    lastContextHash = contextHash;
  }, 2000);
});

// Observe document for significant structural changes
contextMonitor.observe(document.body || document, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'id', 'data-testid']
});

console.log('Console Nano content script initialized');