// Console Nano Side Panel - UI Manager and State Handler

class SidePanelUI {
  constructor() {
    this.state = {
      currentTask: null,
      currentStep: 0,
      completedTasks: []
    };
    
    this.elements = {
      welcomeScreen: document.getElementById('welcomeScreen'),
      taskContainer: document.getElementById('taskContainer'),
      completionScreen: document.getElementById('completionScreen'),
      contextDisplay: document.getElementById('contextDisplay'),
      errorBanner: document.getElementById('errorBanner'),
      errorMessage: document.getElementById('errorMessage'),
      logoHome: document.getElementById('logoHome'),
      homeBtn: document.getElementById('homeBtn'),
      taskTitle: document.getElementById('taskTitle'),
      stepsContainer: document.getElementById('stepsContainer'),
      externalActions: document.getElementById('externalActions'),
      externalActionsList: document.getElementById('externalActionsList'),
      nextTasks: document.getElementById('nextTasks'),
      nextTasksList: document.getElementById('nextTasksList'),
      completionMessage: document.getElementById('completionMessage'),
      userInput: document.getElementById('userInput'),
      sendBtn: document.getElementById('sendBtn'),
      resetTask: document.getElementById('resetTask'),
      closeError: document.getElementById('closeError'),
      loadingOverlay: document.getElementById('loadingOverlay'),
      historyPanel: document.getElementById('historyPanel'),
      tasksTab: document.getElementById('tasksTab'),
      questionsTab: document.getElementById('questionsTab'),
      tasksContent: document.getElementById('tasksContent'),
      questionsContent: document.getElementById('questionsContent'),
      completedList: document.getElementById('completedList'),
      questionsList: document.getElementById('questionsList'),
      clearAllTasks: document.getElementById('clearAllTasks'),
      clearAllQuestions: document.getElementById('clearAllQuestions')
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadState();
    this.updateContext();
    this.autoResizeTextarea();
  }

  setupEventListeners() {
    // Send button
    this.elements.sendBtn.addEventListener('click', () => this.handleSend());
    
    // Enter key to send (Shift+Enter for new line)
    this.elements.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        this.elements.userInput.value = action;
        this.handleSend();
      });
    });

    // Reset task
    this.elements.resetTask.addEventListener('click', () => this.handleReset());

    // Close error
    this.elements.closeError.addEventListener('click', () => {
      this.elements.errorBanner.style.display = 'none';
    });

    // History tabs
    this.elements.tasksTab.addEventListener('click', () => this.switchHistoryTab('tasks'));
    this.elements.questionsTab.addEventListener('click', () => this.switchHistoryTab('questions'));
    
    // Clear history buttons
    this.elements.clearAllTasks.addEventListener('click', () => this.clearTaskHistory());
    this.elements.clearAllQuestions.addEventListener('click', () => this.clearQuestionHistory());

    // Home button and logo click
    this.elements.homeBtn.addEventListener('click', () => this.goHome());
    this.elements.logoHome.addEventListener('click', () => this.goHome());

    // Listen for messages from service worker
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message);
      sendResponse({ received: true });
    });
  }

  autoResizeTextarea() {
    this.elements.userInput.addEventListener('input', () => {
      this.elements.userInput.style.height = 'auto';
      this.elements.userInput.style.height = this.elements.userInput.scrollHeight + 'px';
    });
  }

  async loadState() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CURRENT_STATE'
      });

      if (response.success) {
        this.state = response.state;
        this.renderCurrentState();
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }

  async updateContext() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) return;

      // Request context from content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_PAGE_CONTEXT'
      });

      if (response.success) {
        const context = response.context;
        this.elements.contextDisplay.innerHTML = `
          <span class="context-label">${context.service}</span>
        `;

        // Check for errors
        if (context.errors && context.errors.length > 0) {
          this.showError(context.errors[0]);
        }
      }
    } catch (error) {
      console.log('Could not get context:', error);
    }
  }

  renderCurrentState() {
    if (!this.state.currentTask) {
      this.showWelcome();
    } else {
      this.renderTask();
    }

    this.renderCompletedTasks();
  }

  showWelcome() {
    this.elements.welcomeScreen.style.display = 'block';
    this.elements.taskContainer.style.display = 'none';
    this.elements.completionScreen.style.display = 'none';
  }

  async handleSend() {
    const userPrompt = this.elements.userInput.value.trim();
    
    if (!userPrompt) return;

    // Clear input
    this.elements.userInput.value = '';
    this.elements.userInput.style.height = 'auto';

    // Determine if this is a question or instruction
    const isQuestion = this.isGeneralQuestion(userPrompt);
    
    if (isQuestion) {
      // Handle as a general question
      await this.handleGeneralQuestion(userPrompt);
    } else {
      // Handle as an instruction/task
      await this.handleTaskInstruction(userPrompt);
    }
  }

  isGeneralQuestion(prompt) {
    const questionIndicators = [
      'what is', 'what are', 'how does', 'how do', 'why does', 'why do',
      'explain', 'tell me about', 'describe', 'define', 'difference between',
      'best practices', 'recommend', 'suggest', 'which is better',
      'pros and cons', 'advantages', 'disadvantages', 'when should',
      'what happens if', 'how much does', 'pricing', 'cost'
    ];
    
    const promptLower = prompt.toLowerCase();
    return questionIndicators.some(indicator => promptLower.includes(indicator)) ||
           prompt.endsWith('?');
  }

  async handleGeneralQuestion(question) {
    // Show loading
    this.showLoading();
    
    try {
      // Add to questions history
      await this.addToQuestionHistory(question);
      
      // Generate answer using AI
      const response = await chrome.runtime.sendMessage({
        type: 'ANSWER_QUESTION',
        data: { question }
      });
      
      this.hideLoading();
      
      if (response && response.success) {
        this.showQuestionAnswer(question, response.answer);
      } else {
        // Fallback to basic AWS knowledge
        const answer = this.generateBasicAnswer(question);
        this.showQuestionAnswer(question, answer);
      }
    } catch (error) {
      this.hideLoading();
      this.showError({
        type: 'error',
        message: 'Failed to process question. Please try again.'
      });
    }
  }

  async handleTaskInstruction(userPrompt) {
    // Show loading
    this.showLoading();

    try {
      console.log('Sending START_NEW_TASK with prompt:', userPrompt);
      
      const response = await chrome.runtime.sendMessage({
        type: 'START_NEW_TASK',
        data: { userPrompt }
      });

      console.log('Received response:', response);
      
      this.hideLoading();

      if (response && response.success) {
        // Update state
        this.state.currentTask = {
          userPrompt,
          plan: response.plan,
          context: response.context
        };
        this.state.currentStep = 0;

        // Handle special cases
        if (response.needsNavigation) {
          this.showNavigationMessage();
        } else if (response.needsRefresh) {
          this.showRefreshMessage();
        } else if (response.needsTabSwitch) {
          this.showTabSwitchMessage();
        } else if (response.needsTabChoice) {
          this.showTabChoiceMessage(response.awsTabs);
        }

        // Render task
        this.renderTask();
        
        // Log if using mock AI
        if (response.usingMockAI) {
          console.warn('Using Mock AI - Real Gemini Nano AI not available');
        } else {
          console.log('✓ Using Real Gemini Nano AI');
        }
      } else {
        const errorMsg = response?.error || 'Failed to generate task plan';
        console.error('Task creation failed:', errorMsg);
        this.showError({
          type: 'error',
          message: errorMsg
        });
      }
    } catch (error) {
      console.error('Communication error details:', error);
      this.hideLoading();
      this.showError({
        type: 'error',
        message: `Failed to communicate with service worker: ${error.message}`
      });
    }
  }

  async renderTask() {
    const task = this.state.currentTask;
    
    if (!task) return;

    // Hide welcome, show task
    this.elements.welcomeScreen.style.display = 'none';
    this.elements.taskContainer.style.display = 'block';
    this.elements.completionScreen.style.display = 'none';

    // Set title
    this.elements.taskTitle.textContent = task.userPrompt;

    // Render steps
    this.renderSteps(task.plan.steps);

    // Auto-highlight current step's element with multiple attempts
    const currentStep = task.plan.steps[this.state.currentStep];
    if (currentStep && currentStep.element && currentStep.element.length > 0) {
      // Try to highlight after a short delay to ensure DOM is ready
      setTimeout(async () => {
        await this.highlightElement(currentStep.element);
      }, 200);
      
      // Retry after longer delay if first attempt fails
      setTimeout(async () => {
        await this.highlightElement(currentStep.element);
      }, 1000);
      
      // Final retry for slow-loading pages
      setTimeout(async () => {
        await this.highlightElement(currentStep.element);
      }, 3000);
    }

    // Render external actions
    if (task.plan.externalActions && task.plan.externalActions.length > 0) {
      this.renderExternalActions(task.plan.externalActions);
      this.elements.externalActions.style.display = 'block';
    } else {
      this.elements.externalActions.style.display = 'none';
    }

    // Render next tasks
    if (task.plan.nextTasks && task.plan.nextTasks.length > 0) {
      this.renderNextTasks(task.plan.nextTasks);
      this.elements.nextTasks.style.display = 'block';
    } else {
      this.elements.nextTasks.style.display = 'none';
    }
  }

  renderSteps(steps) {
    this.elements.stepsContainer.innerHTML = '';

    steps.forEach((step, index) => {
      const stepEl = this.createStepElement(step, index);
      this.elements.stepsContainer.appendChild(stepEl);
    });
  }

  createStepElement(step, index) {
    const div = document.createElement('div');
    div.className = 'step-item';
    
    // Add state classes
    if (index < this.state.currentStep) {
      div.classList.add('step-done');
    } else if (index === this.state.currentStep) {
      div.classList.add('step-active');
    }

    const isActive = index === this.state.currentStep;

    // Create execution steps HTML
    let executionStepsHtml = '';
    if (step.executionSteps && Array.isArray(step.executionSteps) && step.executionSteps.length > 0) {
      executionStepsHtml = `
        <div class="execution-steps">
          <div class="execution-steps-title">Detailed Steps:</div>
          <ol class="execution-steps-list">
            ${step.executionSteps.map(execStep => `<li>${execStep}</li>`).join('')}
          </ol>
        </div>
      `;
    }

    div.innerHTML = `
      <div class="step-header">
        <div class="step-number">${index + 1}</div>
        <div class="step-content">
          <div class="step-type type-${step.type}">${step.type.replace('_', ' ')}</div>
          <div class="step-description">${step.description}</div>
          ${step.buttonName ? `<div class="button-name">Button: <strong>"${step.buttonName}"</strong></div>` : ''}
          ${step.details ? `<div class="step-details">${step.details}</div>` : ''}
          ${executionStepsHtml}
        </div>
      </div>
      ${isActive ? this.createStepActions(step) : ''}
    `;

    return div;
  }

  createStepActions(step) {
    let html = '<div class="step-actions">';
    
    // Only show continue/done buttons - no show me button
    
    // Add continue button for all step types that require user action
    if (step.type === 'await_user_action' || step.type === 'instruction' || 
        step.type === 'navigation' || step.type === 'form_field') {
      html += `
        <button class="step-btn continue-btn" data-action="continue">
          ✓ Done
        </button>
      `;
    }

    // Auto-advance for verification steps
    if (step.type === 'verification') {
      html += `
        <button class="step-btn continue-btn" data-action="continue">
          ✓ Continue
        </button>
      `;
    }

    html += '</div>';

    // Enhanced event listeners with better reliability
    setTimeout(() => {
      const stepActions = this.elements.stepsContainer.querySelector('.step-active .step-actions');
      if (stepActions) {
        // Remove any existing listeners to prevent duplicates
        stepActions.querySelectorAll('.step-btn').forEach(btn => {
          const newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
        });
        
        // Add fresh event listeners
        stepActions.querySelectorAll('.step-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleStepAction(e);
          });
          
          // Add visual feedback
          btn.addEventListener('mousedown', (e) => {
            e.target.style.transform = 'scale(0.95)';
          });
          
          btn.addEventListener('mouseup', (e) => {
            e.target.style.transform = 'scale(1)';
          });
        });
      }
    }, 0);

    return html;
  }

  async handleStepAction(e) {
    const action = e.target.getAttribute('data-action');
    const button = e.target;

    // Show loading state immediately
    const originalText = button.textContent;
    const originalDisabled = button.disabled;

    if (action === 'continue') {
      // Show brief loading for Done/Continue action
      button.textContent = '✓ Processing...';
      button.disabled = true;
      button.classList.add('loading');

      try {
        await this.completeStep();
      } finally {
        // Restore button state (though it might be replaced by new step)
        button.textContent = originalText;
        button.disabled = originalDisabled;
        button.classList.remove('loading');
      }
    }
  }

  async highlightElement(selector) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if selector is an array or single selector
      if (Array.isArray(selector)) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'HIGHLIGHT_MULTIPLE',
          data: { selectors: selector }
        });
      } else {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'HIGHLIGHT_ELEMENT',
          data: { selector }
        });
      }
      
      // Silent handling - no error messages to user
      if (!response || !response.success) {
        console.log('Element highlighting failed silently - element may not be visible on current page');
      }
    } catch (error) {
      // Silent error handling - just log for debugging
      console.log('Failed to highlight element (silent):', error.message);
    }
  }

  async completeStep() {
    try {
      console.log('Completing step:', this.state.currentStep + 1);
      
      const response = await chrome.runtime.sendMessage({
        type: 'COMPLETE_STEP',
        data: { step: this.state.currentStep }
      });

      console.log('Step completion response:', response);

      if (response.success) {
        if (response.taskComplete) {
          // Task is done but keep in session
          this.showCompletion(response.nextTasks, response.completedTask);
        } else {
          // Update state with new step
          this.state.currentStep = response.newStep;
          
          // If plan was adapted, update our task state
          if (response.planAdapted && response.plan) {
            console.log('Plan was adapted, updating task');
            this.state.currentTask.plan = response.plan;
          }
          
          // Re-render to show next step
          this.renderTask();
          
          // Show adaptation message if plan changed
          if (response.planAdapted) {
            this.showError({
              type: 'info',
              message: 'Plan adapted to current page state. Continuing with updated steps.'
            });
          }
        }
      } else {
        this.showError({
          type: 'error',
          message: response.error || 'Failed to complete step'
        });
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
      this.showError({
        type: 'error',
        message: 'Communication error while completing step'
      });
    }
  }

  renderExternalActions(actions) {
    this.elements.externalActionsList.innerHTML = '';

    actions.forEach(action => {
      const actionEl = this.createExternalActionElement(action);
      this.elements.externalActionsList.appendChild(actionEl);
    });
  }

  createExternalActionElement(action) {
    const div = document.createElement('div');
    div.className = 'external-action-item';

    const typeIcon = {
      cli: '💻',
      iam: '🔐',
      file: '📄',
      cost: '💰'
    };

    div.innerHTML = `
      <div class="action-type">${typeIcon[action.type] || '📋'} ${action.type}</div>
      <div class="action-description">${action.description}</div>
      <div class="action-content">
        <button class="copy-btn" data-content="${this.escapeHtml(action.content)}">
          Copy
        </button>
        <pre>${this.escapeHtml(action.content)}</pre>
      </div>
    `;

    // Add copy functionality
    setTimeout(() => {
      const copyBtn = div.querySelector('.copy-btn');
      copyBtn.addEventListener('click', async (e) => {
        const content = e.target.getAttribute('data-content');
        await navigator.clipboard.writeText(content);
        e.target.textContent = 'Copied!';
        setTimeout(() => {
          e.target.textContent = 'Copy';
        }, 2000);
      });
    }, 0);

    return div;
  }

  renderNextTasks(tasks) {
    this.elements.nextTasksList.innerHTML = '';

    tasks.forEach(task => {
      const taskEl = document.createElement('div');
      taskEl.className = 'next-task-item';
      taskEl.innerHTML = `→ ${task}`;
      
      taskEl.addEventListener('click', () => {
        this.elements.userInput.value = task;
        this.handleSend();
      });

      this.elements.nextTasksList.appendChild(taskEl);
    });
  }

  showCompletion(nextTasks, completedTask) {
    this.elements.taskContainer.style.display = 'none';
    this.elements.completionScreen.style.display = 'block';

    let message = 'Task completed successfully! ✅';
    
    // Show what was completed
    if (completedTask) {
      message += `\n\nCompleted: "${completedTask}"`;
    }

    // Set the basic completion message
    this.elements.completionMessage.innerHTML = `
      <div class="completion-text">${message.replace(/\n/g, '<br>')}</div>
      ${nextTasks && nextTasks.length > 0 ? this.renderCompletionNextTasks(nextTasks) : '<div class="completion-help">Feel free to start a new task or ask questions about what we just did.</div>'}
    `;

    // Update completed tasks history without triggering navigation
    setTimeout(() => {
      this.refreshCompletedTasks();
    }, 100);

    // Don't auto-clear - let user decide when to start new task
    // Keep the completed task in session for context
  }

  renderCompletionNextTasks(nextTasks) {
    let html = '<div class="completion-next-tasks"><h4>Suggested next steps:</h4><div class="completion-next-tasks-list">';
    
    nextTasks.forEach((task, index) => {
      let taskText = '';
      
      if (typeof task === 'string') {
        taskText = task;
      } else if (task && typeof task === 'object') {
        // Handle different object structures
        taskText = task.description || task.title || task.name || task.userPrompt || JSON.stringify(task);
      } else {
        taskText = String(task);
      }
      
      if (taskText && taskText !== '{}' && taskText !== '[object Object]') {
        html += `<div class="completion-next-task-item" data-task="${this.escapeHtml(taskText)}">→ ${taskText}</div>`;
      }
    });
    
    html += '</div></div>';
    
    // Add event listeners after a short delay to ensure DOM is ready
    setTimeout(() => {
      document.querySelectorAll('.completion-next-task-item').forEach(item => {
        item.addEventListener('click', () => {
          const taskText = item.getAttribute('data-task');
          this.elements.userInput.value = taskText;
          this.handleSend();
        });
      });
    }, 0);
    
    return html;
  }

  async refreshCompletedTasks() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CURRENT_STATE'
      });

      if (response.success && response.state.completedTasks) {
        this.state.completedTasks = response.state.completedTasks;
        this.renderCompletedTasks();
      }
    } catch (error) {
      console.error('Failed to refresh completed tasks:', error);
    }
  }

  renderCompletedTasks() {
    const completed = this.state.completedTasks;

    if (!completed || completed.length === 0) {
      this.elements.completedList.innerHTML = '<p class="empty-state">No completed tasks yet</p>';
      return;
    }

    this.elements.completedList.innerHTML = '';

    completed.forEach((task, index) => {
      const taskEl = document.createElement('div');
      taskEl.className = 'completed-item';
      
      const date = new Date(task.completedAt);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Enhanced display with service and action info
      const serviceIcon = this.getServiceIcon(task.service);
      const actionText = task.action ? `${task.action}d` : 'completed';
      
      taskEl.innerHTML = `
        <div class="question-content">
          <div class="task-info">
            <span class="service-icon">${serviceIcon}</span>
            <span class="completed-task-text">${task.prompt || task.summary}</span>
          </div>
          <span class="completed-task-time">${timeStr}</span>
        </div>
        <button class="delete-question-btn" data-index="${index}" title="Delete this task">🗑️</button>
      `;

      // Add click to re-run task
      taskEl.querySelector('.question-content').addEventListener('click', () => {
        this.elements.userInput.value = task.prompt;
        this.handleSend();
      });

      // Add delete functionality
      taskEl.querySelector('.delete-question-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteCompletedTask(index);
      });

      this.elements.completedList.appendChild(taskEl);
    });
  }

  getServiceIcon(service) {
    const serviceIcons = {
      'S3': '🪣',
      'EC2': '🖥️', 
      'Lambda': '⚡',
      'RDS': '🗄️',
      'Elastic Beanstalk': '🌱',
      'IAM': '🔐',
      'VPC': '🌐',
      'CloudFormation': '📋',
      'API Gateway': '🚪',
      'CloudWatch': '📊',
      'SNS': '📢',
      'SQS': '📬',
      'DynamoDB': '⚡',
      'Route 53': '🌍',
      'CloudFront': '🚀'
    };
    
    return serviceIcons[service] || '☁️';
  }

  async deleteCompletedTask(index) {
    try {
      await chrome.runtime.sendMessage({
        type: 'DELETE_COMPLETED_TASK',
        data: { index }
      });
      this.loadState(); // Reload to refresh the display
    } catch (error) {
      console.error('Failed to delete completed task:', error);
    }
  }

  async handleReset() {
    try {
      await chrome.runtime.sendMessage({ type: 'RESET_TASK' });
      
      // Reset step but keep task for session context
      this.state.currentStep = 0;
      
      // Clear highlights
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHT' });
      } catch (error) {
        console.log('Could not clear highlights:', error);
      }

      // Just re-render the current task from step 0, don't exit to welcome
      if (this.state.currentTask) {
        this.renderTask();
      } else {
        this.showWelcome();
      }
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  }

  async goHome() {
    try {
      // Visual feedback
      this.elements.homeBtn.textContent = '⏳';
      this.elements.homeBtn.disabled = true;
      
      // Clear current session completely
      await chrome.runtime.sendMessage({ type: 'CLEAR_SESSION' });
      
      // Reset local state
      this.state = {
        currentTask: null,
        currentStep: 0,
        completedTasks: []
      };
      
      // Clear highlights
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHT' });
      } catch (error) {
        console.log('Could not clear highlights:', error);
      }

      // Show welcome screen
      this.showWelcome();
      
      // Clear any error messages
      this.elements.errorBanner.style.display = 'none';
      
      // Restore button
      this.elements.homeBtn.textContent = '🏠';
      this.elements.homeBtn.disabled = false;
      
    } catch (error) {
      console.error('Failed to go home:', error);
      // Fallback: just show welcome screen
      this.showWelcome();
      
      // Restore button
      this.elements.homeBtn.textContent = '🏠';
      this.elements.homeBtn.disabled = false;
    }
  }

  showError(error) {
    this.elements.errorMessage.textContent = error.message;
    this.elements.errorBanner.style.display = 'flex';
    
    // Update banner style based on error type
    const banner = this.elements.errorBanner;
    banner.className = 'error-banner';
    if (error.type === 'info') {
      banner.classList.add('info-banner');
    }

    // Auto-hide after 10 seconds for errors, 15 seconds for info
    const hideDelay = error.type === 'info' ? 15000 : 10000;
    setTimeout(() => {
      this.elements.errorBanner.style.display = 'none';
    }, hideDelay);
  }

  showLoading() {
    this.elements.loadingOverlay.style.display = 'flex';
    this.elements.sendBtn.disabled = true;
  }

  hideLoading() {
    this.elements.loadingOverlay.style.display = 'none';
    this.elements.sendBtn.disabled = false;
  }

  handleMessage(message) {
    console.log('Side panel received message:', message.type);

    switch (message.type) {
      case 'ERROR_DETECTED':
        this.showError({
          type: 'error',
          message: message.data.message
        });
        break;

      case 'DISPLAY_ERROR_FIX':
        this.showErrorFix(message.data);
        break;

      case 'PAGE_CHANGED':
        this.updateContext();
        break;

      case 'CONTEXT_UPDATED':
        this.handleContextUpdate(message.data);
        break;

      case 'ELEMENT_INTERACTED':
        // User clicked highlighted element, could auto-advance
        console.log('User interacted with element');
        break;
    }
  }

  async handleContextUpdate(data) {
    console.log('Context updated, just re-highlighting current step (plan unchanged)');
    // Don't re-render the entire task, just re-highlight if needed
    if (this.state.currentTask && this.state.currentTask.plan) {
      const currentStep = this.state.currentTask.plan.steps[this.state.currentStep];
      if (currentStep && currentStep.element && currentStep.element.length > 0) {
        // Re-highlight the current step's element without regenerating plan
        setTimeout(async () => {
          await this.highlightElement(currentStep.element);
        }, 300);
      }
    }
  }

  showErrorFix(data) {
    // Create a task from the error fix plan
    this.state.currentTask = {
      userPrompt: `Fix: ${data.errorInfo.message}`,
      plan: data.fixPlan,
      context: {}
    };
    this.state.currentStep = 0;

    this.renderTask();
  }

  showNavigationMessage() {
    this.showError({
      type: 'info',
      message: 'Please navigate to AWS Console first, then try your request again.'
    });
  }

  showRefreshMessage() {
    this.showError({
      type: 'info', 
      message: 'Please refresh this page (F5 or Ctrl+R) to activate Console Nano, then try again.'
    });
  }

  showTabSwitchMessage() {
    this.showError({
      type: 'success',
      message: 'Switched to your AWS Console tab. Please try your request again.'
    });
  }

  showTabChoiceMessage(awsTabs) {
    const tabList = awsTabs.map((tab, index) => {
      const urlParts = new URL(tab.url);
      const service = urlParts.pathname.split('/')[1] || 'Console';
      return `${index + 1}. ${tab.title || service}`;
    }).join('<br>');

    this.showError({
      type: 'info',
      message: `Multiple AWS tabs found:<br>${tabList}<br><br>Please click on the tab you want to use, then try your request again.`
    });
  }

  switchHistoryTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.history-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.history-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName + 'Content').classList.add('active');
    
    // Load content for the active tab
    if (tabName === 'questions') {
      this.renderQuestionHistory();
    }
  }

  async addToQuestionHistory(question) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ADD_QUESTION_HISTORY',
        data: { question }
      });
    } catch (error) {
      console.error('Failed to add question to history:', error);
    }
  }

  async renderQuestionHistory() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_QUESTION_HISTORY'
      });
      
      if (response && response.success && response.questions) {
        this.displayQuestionHistory(response.questions);
      }
    } catch (error) {
      console.error('Failed to load question history:', error);
    }
  }

  displayQuestionHistory(questions) {
    if (!questions || questions.length === 0) {
      this.elements.questionsList.innerHTML = '<p class="empty-state">No questions asked yet</p>';
      return;
    }

    this.elements.questionsList.innerHTML = '';

    questions.forEach((item, index) => {
      const questionEl = document.createElement('div');
      questionEl.className = 'question-item';
      
      const date = new Date(item.askedAt);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      questionEl.innerHTML = `
        <div class="question-content">
          <div class="question-text">❓ ${item.question}</div>
          <div class="question-time">${timeStr}</div>
        </div>
        <button class="delete-question-btn" data-index="${index}" title="Delete this question">🗑️</button>
      `;

      // Add click to re-ask
      questionEl.querySelector('.question-content').addEventListener('click', () => {
        this.elements.userInput.value = item.question;
        this.handleSend();
      });

      // Add delete functionality
      questionEl.querySelector('.delete-question-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteQuestion(index);
      });

      this.elements.questionsList.appendChild(questionEl);
    });
  }

  async deleteQuestion(index) {
    try {
      await chrome.runtime.sendMessage({
        type: 'DELETE_QUESTION',
        data: { index }
      });
      this.renderQuestionHistory();
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  }

  async clearTaskHistory() {
    if (confirm('Are you sure you want to clear all task history?')) {
      try {
        await chrome.runtime.sendMessage({
          type: 'CLEAR_TASK_HISTORY'
        });
        this.renderCompletedTasks();
      } catch (error) {
        console.error('Failed to clear task history:', error);
      }
    }
  }

  async clearQuestionHistory() {
    if (confirm('Are you sure you want to clear all question history?')) {
      try {
        await chrome.runtime.sendMessage({
          type: 'CLEAR_QUESTION_HISTORY'
        });
        this.renderQuestionHistory();
      } catch (error) {
        console.error('Failed to clear question history:', error);
      }
    }
  }

  showQuestionAnswer(question, answer) {
    // Hide other screens
    this.elements.welcomeScreen.style.display = 'none';
    this.elements.taskContainer.style.display = 'none';
    this.elements.completionScreen.style.display = 'block';

    // Show the answer
    this.elements.completionMessage.innerHTML = `
      <div class="question-answer">
        <div class="answered-question">
          <strong>Question:</strong> ${question}
        </div>
        <div class="answer-content">
          <strong>Answer:</strong><br>
          ${answer.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
  }

  generateBasicAnswer(question) {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('s3')) {
      return 'Amazon S3 (Simple Storage Service) is a scalable object storage service. It\'s commonly used for backup, archiving, data lakes, and static website hosting. S3 offers different storage classes for different use cases and cost optimization.';
    } else if (questionLower.includes('ec2')) {
      return 'Amazon EC2 (Elastic Compute Cloud) provides scalable virtual servers in the cloud. You can choose from various instance types optimized for different workloads like compute, memory, or storage intensive applications.';
    } else if (questionLower.includes('lambda')) {
      return 'AWS Lambda is a serverless compute service that runs code without managing servers. You pay only for compute time consumed. It\'s great for event-driven applications and microservices.';
    } else if (questionLower.includes('rds')) {
      return 'Amazon RDS (Relational Database Service) is a managed database service supporting MySQL, PostgreSQL, Oracle, SQL Server, and MariaDB. It handles backups, patching, and scaling automatically.';
    } else if (questionLower.includes('iam')) {
      return 'AWS IAM (Identity and Access Management) controls access to AWS services and resources. It uses users, groups, roles, and policies to manage permissions securely.';
    } else {
      return 'I can help you with AWS services and tasks. For detailed information, please ask specific questions about AWS services like S3, EC2, Lambda, RDS, or IAM. You can also ask me to help you create or configure these services.';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the UI
const ui = new SidePanelUI();

// Refresh context periodically
setInterval(() => {
  ui.updateContext();
}, 5000);

console.log('Console Nano Side Panel initialized');