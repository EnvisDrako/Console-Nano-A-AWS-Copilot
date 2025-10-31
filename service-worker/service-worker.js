// Console Nano Service Worker - The AI Brain
// Handles all AI interactions, message routing, and state management

// Mock AI for when AI is not available
const MockAI = {
  session: {
    async prompt(fullPrompt) {
      console.log('Using MOCK AI - Real AI not available');
      console.log('Full prompt received:', fullPrompt.substring(0, 500) + '...');

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Parse the context from the full prompt
      const userRequestMatch = fullPrompt.match(/USER REQUEST:\s*"([^"]+)"/);
      const contextMatch = fullPrompt.match(/Current AWS Console State:\s*([\s\S]*?)(?=\n\n|$)/);

      let currentService = 'AWS Console';
      let currentPageTitle = 'Unknown';
      let availableButtons = [];
      let availableInputs = [];
      let userRequest = '';

      if (userRequestMatch) {
        userRequest = userRequestMatch[1];
      }

      // Check if this is an unclear request that needs clarification
      const unclearRequests = ['hi', 'hello', 'hey', 'help', 'do something', 'aws', 'test'];
      const isUnclear = unclearRequests.includes(userRequest.toLowerCase()) ||
        userRequest.length < 3 ||
        !userRequest.includes(' '); // Very short or single word requests

      if (isUnclear) {
        return JSON.stringify({
          steps: [
            {
              id: 1,
              type: "instruction",
              description: "Please specify what you'd like to do in AWS Console",
              element: [],
              details: "I need more specific information about your AWS task. Try requests like 'create S3 bucket', 'launch EC2 instance', 'configure Lambda function', or ask questions like 'what is DynamoDB?'",
              buttonName: "Clarification Needed",
              executionSteps: [
                "Think about which AWS service you want to use (S3, EC2, Lambda, etc.)",
                "Specify the action you want to perform (create, configure, delete, etc.)",
                "Be specific about the resource type (bucket, instance, function, etc.)",
                "Try again with a clearer, more specific request"
              ]
            }
          ],
          externalActions: [],
          nextTasks: ["Create S3 bucket", "Launch EC2 instance", "Deploy to Elastic Beanstalk", "Set up Lambda function", "Configure IAM roles"]
        });
      }

      if (contextMatch) {
        const contextText = contextMatch[1];
        const serviceMatch = contextText.match(/Service:\s*([^\n]+)/);
        const titleMatch = contextText.match(/Page Title:\s*([^\n]+)/);
        const buttonsMatch = contextText.match(/Buttons \(\d+\):\s*([\s\S]*?)(?=\n\w|$)/);
        const inputsMatch = contextText.match(/Input Fields \(\d+\):\s*([\s\S]*?)(?=\n\w|$)/);

        if (serviceMatch) currentService = serviceMatch[1].trim();
        if (titleMatch) currentPageTitle = titleMatch[1].trim();
        if (buttonsMatch) {
          const buttonLines = buttonsMatch[1].split('\n').filter(line => line.trim().startsWith('-'));
          availableButtons = buttonLines.map(line => {
            const match = line.match(/- "([^"]+)"/);
            return match ? match[1] : '';
          }).filter(btn => btn);
        }
        if (inputsMatch) {
          const inputLines = inputsMatch[1].split('\n').filter(line => line.trim().startsWith('-'));
          availableInputs = inputLines.map(line => {
            const match = line.match(/- ([^(]+)/);
            return match ? match[1].trim() : '';
          }).filter(input => input);
        }
      }

      console.log('Mock AI Context:', {
        service: currentService,
        title: currentPageTitle,
        buttons: availableButtons,
        inputs: availableInputs,
        request: userRequest
      });

      // Generate complete workflow for the user's request
      let mockSteps = [];
      const userRequestLower = userRequest.toLowerCase();

      // Generate comprehensive workflow based on user request
      // Step 1: Navigation (if needed)
      if (!currentService.toLowerCase().includes('console') || currentPageTitle === 'Unknown') {
        mockSteps.push({
          id: 1,
          type: "navigation",
          description: "Navigate to AWS Console services",
          element: ["button", "[data-testid='services-menu']", "a[href*='console']"],
          details: "Access the AWS services menu to find the service you need for your task.",
          buttonName: "Services",
          executionSteps: [
            "Look for 'Services' in the top navigation bar",
            "Click on 'Services' to open the services menu",
            "Search for or browse to find the service you need",
            "Click on the appropriate service"
          ]
        });
      }

      // Step 2: Service-specific navigation
      mockSteps.push({
        id: mockSteps.length + 1,
        type: "navigation",
        description: `Navigate to the appropriate AWS service for: ${userRequest}`,
        element: ["a", "button", "[data-testid='service-link']"],
        details: "Find and click on the AWS service that handles your specific request.",
        buttonName: "Service Navigation",
        executionSteps: [
          "Identify which AWS service handles your request",
          "Look for the service in the navigation or services menu",
          "Click on the service name or icon",
          "Wait for the service console to load"
        ]
      });

      // Step 3: Initiate creation/action
      mockSteps.push({
        id: mockSteps.length + 1,
        type: "instruction",
        description: "Start the creation or configuration process",
        element: ["button:contains('Create')", "button:contains('Launch')", ".awsui-button-primary"],
        details: "Look for the main action button to begin your task.",
        buttonName: "Create/Launch",
        executionSteps: [
          "Look for the primary action button (usually orange or blue)",
          "Common button names: 'Create', 'Launch', 'Add', 'New'",
          "Click the button to start the process",
          "Wait for the configuration form to load"
        ]
      });

      // Step 4-8: Configuration steps
      for (let i = 0; i < 5; i++) {
        const configSteps = [
          "Configure basic settings and naming",
          "Select platform, region, or instance type",
          "Configure security and access settings",
          "Set up networking and storage options",
          "Configure monitoring and logging"
        ];

        mockSteps.push({
          id: mockSteps.length + 1,
          type: "form_field",
          description: configSteps[i],
          element: ["input", "select", "textarea", ".awsui-form-field"],
          details: `Complete the ${configSteps[i].toLowerCase()} section of the configuration form.`,
          buttonName: "Configuration Form",
          executionSteps: [
            "Review the form section carefully",
            "Fill in required fields (marked with *)",
            "Choose appropriate options from dropdowns",
            "Follow any validation messages or recommendations"
          ]
        });
      }

      // Step 9: Review configuration
      mockSteps.push({
        id: mockSteps.length + 1,
        type: "instruction",
        description: "Review your configuration settings",
        element: ["button:contains('Review')", "button:contains('Next')", ".awsui-button"],
        details: "Proceed to review all your configuration choices before final creation.",
        buttonName: "Review & Launch",
        executionSteps: [
          "Click 'Review' or 'Next' to proceed",
          "Carefully review all configuration settings",
          "Make any necessary changes by going back",
          "Ensure all settings match your requirements"
        ]
      });

      // Step 10: Final creation
      mockSteps.push({
        id: mockSteps.length + 1,
        type: "await_user_action",
        description: "Launch or create your resource",
        element: ["button:contains('Launch')", "button:contains('Create')", ".awsui-button-primary"],
        details: "Complete the final step to create your AWS resource.",
        buttonName: "Final Launch",
        executionSteps: [
          "Review the final summary one more time",
          "Click the final 'Launch' or 'Create' button",
          "Wait for the creation process to complete",
          "Note any important information displayed (like instance IDs, URLs, etc.)"
        ]
      });

      // Step 11: Verification
      mockSteps.push({
        id: mockSteps.length + 1,
        type: "instruction",
        description: "Verify your resource was created successfully",
        element: ["a", ".awsui-link", "[data-testid='resource-link']"],
        details: "Check that your resource is running and accessible.",
        buttonName: "Verification",
        executionSteps: [
          "Look for confirmation messages or status indicators",
          "Check that the resource appears in the service dashboard",
          "Verify the resource is in 'Running' or 'Available' state",
          "Note any connection details or next steps provided"
        ]
      });

      // Generate comprehensive contextual next tasks
      let nextTasks = [
        "Configure security groups and access permissions",
        "Set up monitoring and alerting",
        "Test the resource functionality",
        "Configure backup and disaster recovery",
        "Review cost optimization opportunities",
        "Set up logging and audit trails"
      ];

      const response = {
        steps: mockSteps,
        externalActions: [],
        nextTasks: nextTasks
      };

      console.log('Mock AI Response:', response);
      return JSON.stringify(response);
    }
  },

  async availability() {
    return 'readily';
  },

  async create() {
    return this.session;
  }
};

class ConsoleNanoAI {
  constructor() {
    this.session = null;
    this.isInitialized = false;
    this.usingMock = false;
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('=== Initializing AI ===');
      console.log('Checking for LanguageModel API...');

      // Check if LanguageModel is available (newest Chrome API)
      if (typeof LanguageModel === 'undefined') {
        console.warn('❌ LanguageModel API not available. Using MOCK AI.');
        console.log('Make sure chrome://flags are enabled:');
        console.log('  - #prompt-api-for-gemini-nano');
        console.log('  - #optimization-guide-on-device-model');
        this.usingMock = true;
        this.session = MockAI.session;
        this.isInitialized = true;
        return true;
      }

      console.log('✓ Found LanguageModel API');

      // Check AI availability
      console.log('Checking AI availability...');
      const availability = await LanguageModel.availability();
      console.log('AI Availability:', availability);

      if (availability === 'no') {
        console.warn('AI not available on this device, falling back to MOCK AI.');
        this.usingMock = true;
        this.session = MockAI.session;
        this.isInitialized = true;
        return true;
      }

      if (availability === 'after-download') {
        console.log('AI model needs download. Triggering download...');
        // Trigger download with progress monitoring
        try {
          this.session = await LanguageModel.create({
            monitor(m) {
              m.addEventListener('downloadprogress', (e) => {
                console.log(`AI Model download: ${Math.round(e.loaded * 100)}%`);
              });
            }
          });
          console.log('✓ AI session created (downloading in background)');
          this.isInitialized = true;
          this.usingMock = false;
          return true;
        } catch (err) {
          console.warn('Download failed, using MOCK AI:', err);
          this.usingMock = true;
          this.session = MockAI.session;
          this.isInitialized = true;
          return true;
        }
      }

      // Create real AI session - availability is "readily"
      console.log('Creating AI session with LanguageModel.create()...');

      this.session = await LanguageModel.create({
        systemPrompt: `You are an expert AWS Console assistant. You provide clear, step-by-step guidance for ANY AWS task, adapting to the current page state.

CRITICAL: Your response MUST be ONLY valid JSON. Do not include any text before or after the JSON.

Response format:
{
  "steps": [
    {
      "id": 1,
      "type": "verification",
      "description": "Check current page state and location",
      "element": ["h1", "[data-testid='page-title']", ".awsui-header-title"],
      "details": "Always start by verifying where we are"
    },
    {
      "id": 2,
      "type": "instruction",
      "description": "Specific action based on current page",
      "element": ["button", ".awsui-button-primary", "[aria-label*='action']"],
      "details": "Use ACTUAL elements available on current page"
    }
  ],
  "externalActions": [],
  "nextTasks": []
}

Valid step types: verification, instruction, await_user_action, cli_command
Valid action types: cli, iam, file, cost

CORE PRINCIPLES:
1. ALWAYS start with verification of current page state
2. NEVER assume what page the user is on - check first
3. Use ONLY elements that actually exist on the current page
4. If current page doesn't have needed elements, provide navigation steps
5. Adapt to ANY AWS service - EC2, S3, Lambda, RDS, VPC, IAM, etc.
6. Be context-aware and responsive to page changes

ENHANCED GUIDANCE RULES:
- Start every plan with page verification
- Use actual button text and input labels from current page context
- When multiple options exist, provide specific recommendations based on user intent
- For performance requirements: recommend larger instances, optimized storage
- For cost-conscious requests: recommend smaller instances, basic configurations  
- For security-focused requests: emphasize security groups, IAM roles, encryption
- Include WHY specific options are recommended in details field
- Be specific about form field values and dropdown selections

ELEMENT SELECTOR RULES:
- Use multiple fallback selectors: ["primary-selector", "fallback1", "fallback2"]
- Match actual button text from page context
- Use aria-labels and data-testids when available
- Provide text-based selectors as fallbacks

ADAPTATION RULES:
- If user request doesn't match current page, provide navigation steps first
- If errors are detected, address them before continuing
- If form state changes, adapt remaining steps accordingly
- Keep session context but adapt to current page reality

Rules:
- Return ONLY the JSON object, nothing else
- Use double quotes for all strings
- No trailing commas
- Escape special characters in strings
- Keep descriptions actionable and specific
- Always provide element selector arrays with fallbacks
- Follow AWS best practices and security guidelines`
      });

      console.log('✓ Real AI initialized successfully!');
      this.isInitialized = true;
      this.usingMock = false;
      return true;

    } catch (error) {
      console.error('AI initialization error:', error);
      console.error('Error details:', error.message);
      console.warn('Falling back to MOCK AI');
      this.usingMock = true;
      this.session = MockAI.session;
      this.isInitialized = true;
      return true;
    }
  }

  async generateTaskPlan(userPrompt, pageContext) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Build detailed context description
    const contextDetails = [];
    contextDetails.push(`Service: ${pageContext.service}`);
    contextDetails.push(`Page Title: ${pageContext.pageTitle}`);
    contextDetails.push(`URL: ${pageContext.url}`);

    if (pageContext.breadcrumbs && pageContext.breadcrumbs.length > 0) {
      contextDetails.push(`Navigation: ${pageContext.breadcrumbs.join(' > ')}`);
    }

    if (pageContext.elements && pageContext.elements.inputs && pageContext.elements.inputs.length > 0) {
      contextDetails.push(`\nInput Fields (${pageContext.elements.inputs.length}):`);
      pageContext.elements.inputs.forEach(input => {
        const status = input.hasValue ? `(value: "${input.value}")` : '(empty)';
        const selectors = Array.isArray(input.selector) ? input.selector.join(' OR ') : input.selector;
        contextDetails.push(`  - ${input.label} ${status} (selectors: ${selectors})`);
      });
    }

    if (pageContext.elements && pageContext.elements.buttons && pageContext.elements.buttons.length > 0) {
      contextDetails.push(`\nButtons (${pageContext.elements.buttons.length}):`);
      pageContext.elements.buttons.forEach(btn => {
        const primary = btn.isPrimary ? ' [PRIMARY]' : '';
        const selectors = Array.isArray(btn.selector) ? btn.selector.join(' OR ') : btn.selector;
        contextDetails.push(`  - "${btn.text}"${primary} (selectors: ${selectors})`);
      });
    }

    if (pageContext.elements && pageContext.elements.dropdowns && pageContext.elements.dropdowns.length > 0) {
      contextDetails.push(`\nDropdowns (${pageContext.elements.dropdowns.length}):`);
      pageContext.elements.dropdowns.forEach(dropdown => {
        const selectors = Array.isArray(dropdown.selector) ? dropdown.selector.join(' OR ') : dropdown.selector;
        contextDetails.push(`  - ${dropdown.label} (selected: "${dropdown.selectedText}", selectors: ${selectors})`);
      });
    }

    // Check if this is a continuation/adaptation request
    const isContinuation = userPrompt.includes('CONTINUE FROM WHERE WE LEFT OFF');

    let requestSection;
    if (isContinuation) {
      requestSection = userPrompt; // Use the full continuation prompt as-is
    } else {
      requestSection = `User Request: "${userPrompt}"`;
    }

    // No hardcoded service detection - let AI determine everything from context

    console.log(`🎯 User request: "${userPrompt}"`);
    console.log(`📍 Current page service: ${pageContext.service}`);

    const prompt = `USER REQUEST: "${userPrompt}"

STEP 1 - REQUEST VALIDATION:
First, analyze if "${userPrompt}" is a clear, actionable AWS task or question.

UNCLEAR REQUESTS that need clarification:
- Greetings: "hi", "hello", "hey", "good morning"
- Vague requests: "help", "do something", "aws", "show me"
- Incomplete actions: "create", "delete", "configure" (without specifying what)
- Non-AWS requests: "weather", "news", "math", "random text"
- Too ambiguous: "fix this", "make it work", "help me"

If the request is UNCLEAR, respond with this EXACT format:
{
  "steps": [
    {
      "id": 1,
      "type": "instruction",
      "description": "Please specify what you'd like to do in AWS Console",
      "element": [],
      "details": "I need more specific information about your AWS task. Try requests like 'create S3 bucket', 'launch EC2 instance', or ask questions like 'what is Lambda?'",
      "buttonName": "Clarification Needed",
      "executionSteps": [
        "Think about what specific AWS task you want to accomplish",
        "Use clear action words like 'create', 'launch', 'configure', 'delete'",
        "Specify the AWS service or resource you want to work with",
        "Try again with a more specific request"
      ]
    }
  ],
  "externalActions": [],
  "nextTasks": []
}

STEP 2 - IF REQUEST IS CLEAR, generate a COMPLETE end-to-end workflow:

Current AWS Console State (for reference only):
${contextDetails.join('\n')}

COMPLETE WORKFLOW GENERATION INSTRUCTIONS:
Generate a comprehensive, step-by-step guide that takes the user from their current state to fully completing: "${userPrompt}"

WORKFLOW REQUIREMENTS:
1. **COMPLETE JOURNEY**: Generate ALL steps needed from start to finish, not just current page
2. **ANTICIPATE ALL PAGES**: Include steps for navigation, creation forms, configuration pages, review pages, etc.
3. **DETAILED GUIDANCE**: Each step should have clear instructions and explanations
4. **DECISION SUPPORT**: Include guidance for choices user needs to make (regions, instance types, platforms, etc.)
5. **NO GAPS**: Don't stop at page boundaries - continue through the entire workflow
6. **PRACTICAL DETAILS**: Include specific recommendations for configurations, naming, security settings

WORKFLOW STRUCTURE TO GENERATE:
- **Navigation Steps**: How to get to the right AWS service
- **Initiation Steps**: Starting the creation/configuration process  
- **Configuration Steps**: All required and recommended settings
- **Advanced Options**: Important optional configurations
- **Review Steps**: Verification before deployment
- **Completion Steps**: Final actions and verification
- **Follow-up Steps**: What to do after the resource is created

STEP DETAIL REQUIREMENTS:
- **Specific Button Names**: Use common AWS button patterns (Create, Launch, Next, Review, etc.)
- **Form Field Guidance**: What to enter in each field with specific recommendations
- **Choice Explanations**: Why to select certain options over others with reasoning
- **Best Practices**: Security, performance, and cost considerations for each step
- **Decision Support**: Help users choose between options (instance types, regions, etc.)
- **Troubleshooting**: Common issues and how to resolve them
- **Follow-up Questions**: Address common questions users have at each step

EXAMPLE WORKFLOW DEPTH:
For "create S3 bucket" - include navigation, bucket creation, naming recommendations, region selection, security settings, permissions, lifecycle policies, and verification steps.

For "launch EC2 instance" - include navigation, AMI selection, instance type recommendations, security group configuration, key pair setup, storage configuration, review, launch, and connection steps.

For "create Elastic Beanstalk application" - include navigation, platform selection, application creation, environment configuration, deployment options, scaling settings, monitoring setup, and health verification.

DECISION SUPPORT EXAMPLES:
- **Region Selection**: "Choose us-east-1 for lowest latency to US users, eu-west-1 for European users"
- **Instance Types**: "t3.micro for testing/learning, t3.medium for small applications, m5.large for production workloads"
- **Security Groups**: "Allow only necessary ports - SSH (22) for Linux, RDP (3389) for Windows, HTTP (80) and HTTPS (443) for web servers"
- **Storage Options**: "gp3 for general purpose, io2 for high IOPS requirements, st1 for throughput-intensive workloads"

RESPONSE FORMAT:
{
  "steps": [
    // Complete workflow from current state to finished resource
    // Include 15-30+ detailed steps covering the entire process
    // Each step should have clear button names and detailed execution guidance
  ],
  "externalActions": [],
  "nextTasks": [
    // Logical follow-up tasks after completing the main workflow
  ]
}

USER REQUEST: "${userPrompt}"
CURRENT PAGE: ${pageContext.service} - ${pageContext.pageTitle}

Generate a complete, comprehensive workflow that fully accomplishes the user's request with detailed step-by-step guidance throughout the entire process.

Generate the response for: "${userPrompt}"`;

    try {
      if (this.usingMock) {
        console.log('📝 Generating plan with MOCK AI');
      } else {
        console.log('📝 Generating plan with REAL AI');
      }

      const response = await this.session.prompt(prompt);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  async generateErrorFix(errorInfo, pageContext) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const prompt = `AWS Console Error Detected:
Error Type: ${errorInfo.type}
Error Message: ${errorInfo.message}
Page Context: ${pageContext.service} - ${pageContext.pageTitle}

Analyze this error and provide:
    1. What went wrong
    2. Why it happened
    3. Step - by - step fix instructions

Return response in JSON format with the standard structure.`;

    try {
      if (this.usingMock) {
        console.log('📝 Generating error fix with MOCK AI');
      } else {
        console.log('📝 Generating error fix with REAL AI');
      }

      const response = await this.session.prompt(prompt);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Error fix generation failed:', error);
      throw error;
    }
  }

  parseAIResponse(response) {
    try {
      console.log('Raw AI response:', response);

      // Try to extract JSON from response (handle markdown code blocks)
      let jsonStr = response;

      // Remove markdown code blocks if present
      const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      console.log('Extracted JSON string:', jsonStr);

      // Replace all invalid whitespace characters with regular spaces
      jsonStr = jsonStr.replace(/[^\S \n\r\t]/g, ' ');

      // Fix common AI JSON mistakes before parsing
      jsonStr = this.fixCommonJSONErrors(jsonStr);

      const parsed = JSON.parse(jsonStr);
      console.log('Parsed JSON:', parsed);

      // Transform to expected format
      return this.transformToExpectedFormat(parsed);

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Full response was:', response);

      // Try one more time with aggressive JSON fixing
      try {
        console.warn('Attempting aggressive JSON repair...');
        const repairedJson = this.aggressiveJSONRepair(response);
        console.log('Repaired JSON:', repairedJson.substring(0, 200) + '...');
        const parsed = JSON.parse(repairedJson);
        console.log('Successfully repaired and parsed JSON');
        return this.transformToExpectedFormat(parsed);
      } catch (repairError) {
        console.error('JSON repair also failed:', repairError);
        console.error('Attempted repair result:', repairedJson?.substring(0, 200) + '...');
      }

      // Fallback: create structured response from text
      console.warn('Creating fallback response');

      // Try to extract at least the target service for a better fallback
      const userRequestLower = response.toLowerCase();
      let serviceName = 'AWS service';
      if (userRequestLower.includes('lambda')) serviceName = 'Lambda';
      else if (userRequestLower.includes('s3')) serviceName = 'S3';
      else if (userRequestLower.includes('ec2')) serviceName = 'EC2';
      else if (userRequestLower.includes('rds')) serviceName = 'RDS';

      return {
        steps: [
          {
            id: 1,
            type: 'instruction',
            description: `AI response could not be parsed. Navigate to ${serviceName} service manually.`,
            element: [],
            details: `The AI generated an invalid response format. Please navigate to the ${serviceName} service in the AWS Console and try a simpler request like "help me create" or "show me the steps".`
          },
          {
            id: 2,
            type: 'instruction',
            description: 'Try a simpler request',
            element: [],
            details: 'Break your request into smaller steps, like "create function" instead of "setup lambda with all configurations".'
          }
        ],
        externalActions: [],
        nextTasks: [`Navigate to ${serviceName} service`, 'Try a simpler request', 'Ask for help with specific steps']
      };
    }
  }

  fixCommonJSONErrors(jsonStr) {
    // Fix common AI mistakes in JSON
    return jsonStr
      // Fix malformed arrays with extra brackets/braces
      .replace(/\[([^\]]*)"]\]/g, '[$1"]')
      .replace(/\[([^\]]*)\}"\]/g, '[$1"]')  // Fix "}"] pattern
      .replace(/\[([^\]]*)\}([^\]]*)\]/g, '[$1$2]')  // Fix } inside arrays
      // Fix missing commas in arrays - more comprehensive
      .replace(/"(\s*)"([^"]*)"(?=\s*\])/g, '", "$2"')  // Fix missing commas between array elements
      .replace(/"\s+"([^"]*)"(?=\s*[,\]])/g, '", "$1"')  // Fix spaces instead of commas
      .replace(/"\s*\n\s*"([^"]*)"(?=\s*[,\]])/g, '", "$1"')  // Fix newlines instead of commas
      // Fix missing quotes in array elements
      .replace(/\[([^\]]*)'([^']*)'([^\]]*)\]/g, '[$1"$2"$3]')
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix double quotes inside single quotes
      .replace(/'([^']*)"([^']*)'([^']*)/g, '"$1\\"$2\\"$3"')
      // Fix common aria-label syntax errors
      .replace(/\[aria-label='([^']*)'"\]/g, '["[aria-label=\'$1\']"]')
      .replace(/\[aria-label\*='([^']*)'"\]/g, '["[aria-label*=\'$1\']"]')
      // Fix malformed element arrays - ensure proper comma separation
      .replace(/"element":\s*\[\s*"([^"]*)"([^"]*)"([^"]*)"([^"]*)"([^\]]*)\]/g, '"element": ["$1", "$2", "$3", "$4"]')
      .replace(/"element":\s*\[\s*"([^"]*)"([^"]*)"([^"]*)"([^\]]*)\]/g, '"element": ["$1", "$2", "$3"]')
      .replace(/"element":\s*\[\s*"([^"]*)"([^"]*)"([^\]]*)\]/g, '"element": ["$1", "$2"]')
      // Fix nested nextTasks issue - flatten complex structures
      .replace(/"nextTasks":\s*\[([^\]]*"nextTasks"[^\]]*)\]/g, '"nextTasks": []')
      // Remove any nested objects in nextTasks array
      .replace(/"nextTasks":\s*\[\s*\{[^}]*\}[^]]*\]/g, '"nextTasks": []')
      // Fix invalid step types - remove steps with invalid types
      .replace(/,?\s*\{\s*"id":\s*\d+,\s*"type":\s*"(externalActions|nextTasks)"[^}]*\}/g, '')
      // Clean up any double commas from removals
      .replace(/,,/g, ',')
      // Clean up trailing commas before closing brackets
      .replace(/,(\s*\])/g, '$1')
      // Fix malformed element arrays with extra braces
      .replace(/"element":\s*\[([^"]*)"([^"]*)\}([^"]*)"([^\]]*)\]/g, '"element": [$1"$2$3"$4]');
  }

  aggressiveJSONRepair(response) {
    // Extract JSON more aggressively and fix major structural issues
    let jsonStr = response;

    // Remove markdown
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // Fix major structural issues
    jsonStr = jsonStr
      // Ensure proper array closing
      .replace(/\[([^\]]*)"]\]/g, '[$1"]')
      // Fix malformed selector arrays
      .replace(/"element":\s*\[([^\]]*)"]\]/g, '"element": [$1"]')
      // Remove any trailing text after the main JSON object
      .replace(/^(\{[\s\S]*\})\s*[\s\S]*$/, '$1')
      // Fix common quote issues
      .replace(/([{,]\s*"[^"]*":\s*)"([^"]*)"]/g, '$1"$2"]')
      // Remove invalid step types completely
      .replace(/,?\s*\{\s*"id":\s*\d+,\s*"type":\s*"(?:externalActions|nextTasks)"[^}]*\}/g, '')
      // Fix malformed element arrays with extra braces
      .replace(/"element":\s*\[([^"]*)"([^"]*)\}([^"]*)"([^\]]*)\]/g, '"element": [$1"$2$3"$4]')
      // Fix any stray braces in arrays
      .replace(/\[([^"]*)"([^"]*)\}([^"]*)"([^\]]*)\]/g, '[$1"$2$3"$4]')
      // Fix specific pattern: "[name='something']}" -> "[name='something']"
      .replace(/"(\[[^"]*\])(\}+)"/g, '"$1"')
      // Clean up double commas
      .replace(/,,+/g, ',')
      // Clean up trailing commas
      .replace(/,(\s*[\]}])/g, '$1');

    return jsonStr;
  }

  transformToExpectedFormat(parsed) {
    // Handle different AI response formats with simplified structure
    let steps = [];

    if (parsed.steps && Array.isArray(parsed.steps)) {
      // Remove duplicate navigation steps
      const filteredSteps = [];
      let hasNavigationStep = false;

      for (const step of parsed.steps) {
        // CHANGED: Only filter out completely invalid steps
        if (!step || !step.type) {
          continue;
        }

        // Skip duplicate navigation steps
        if (step.type === 'navigation') {
          if (hasNavigationStep) {
            console.log('Skipping duplicate navigation step:', step.description);
            continue;
          }
          hasNavigationStep = true;
        }

        filteredSteps.push(step);
      }

      steps = filteredSteps
        .map((step, index) => {
          // *** NEW: Map AI's semantic types to your app's internal types ***
          let mappedType = 'instruction'; // Default type
          const aiType = step.type.toLowerCase();

          if (aiType.includes('navigation')) {
            mappedType = 'navigation';
          } else if (aiType.includes('input') || aiType.includes('form') || aiType.includes('config') || aiType.includes('selection')) {
            mappedType = 'form_field';
          } else if (aiType.includes('action') || aiType.includes('click') || aiType.includes('create') || aiType.includes('initiated_action')) {
            mappedType = 'await_user_action';
          } else if (aiType.includes('verify') || aiType.includes('verification') || aiType.includes('success')) {
            mappedType = 'verification';
          } else if (aiType.includes('review') || aiType.includes('follow_up') || aiType.includes('cleanup') || aiType.includes('monitoring')) {
            mappedType = 'instruction'; // These are all instructional steps
          }
          // *** END NEW MAPPING LOGIC ***

          // Handle various step formats with new fields
          const stepObj = {
            id: step.id || step.step_number || index + 1,
            type: mappedType, // Use the new mappedType
            description: step.description || 'No description',
            element: null,
            details: step.details || null,
            buttonName: step.buttonName || 'Action Button',
            executionSteps: step.executionSteps || ['Complete this step']
          };

          // *** ADDED: Get details from formField if top-level details are missing ***
          if (!stepObj.details && step.formField && step.formField.recommendation) {
            stepObj.details = step.formField.recommendation;
          }

          // Make description more specific using formField label
          if (step.formField && step.formField.label && !stepObj.description.includes(step.formField.label)) {
            stepObj.description = `${step.description} (Field: ${step.formField.label})`;
          }
          // *** END ADDED ***

          // Extract element selector from actions if present
          if (step.actions && Array.isArray(step.actions) && step.actions.length > 0) {
            const firstAction = step.actions[0];
            stepObj.element = firstAction.css_selector || firstAction.locator || firstAction.element || null;
            stepObj.type = firstAction.action_type === 'click' ? 'await_user_action' : 'instruction';

            // Combine details if available
            if (firstAction.details) {
              stepObj.details = firstAction.details;
            }
          }

          // Handle element field directly (can be string or array)
          if (step.element) {
            // Ensure element is always an array
            stepObj.element = Array.isArray(step.element) ? step.element : [step.element];
          } else {
            stepObj.element = [];
          }

          // Ensure executionSteps is always an array
          if (stepObj.executionSteps && !Array.isArray(stepObj.executionSteps)) {
            stepObj.executionSteps = [stepObj.executionSteps];
          }

          return stepObj;
        });
    }

    // Clean up nextTasks to ensure they're simple strings
    let nextTasks = parsed.nextTasks || parsed.next_tasks || [];

    // Flatten and clean nextTasks
    const cleanNextTasks = [];
    if (Array.isArray(nextTasks)) {
      nextTasks.forEach(task => {
        if (typeof task === 'string') {
          cleanNextTasks.push(task);
        } else if (task && typeof task === 'object') {
          // Extract description from object
          const taskText = task.description || task.title || task.name || task.summary;
          if (taskText && typeof taskText === 'string') {
            cleanNextTasks.push(taskText);
          }
        }
      });
    }

    return {
      steps: steps,
      externalActions: parsed.externalActions || [],
      nextTasks: cleanNextTasks
    };
  }
}

// Initialize AI instance
// Removed complex intent analysis - AI prompt now handles this intelligently

const aiEngine = new ConsoleNanoAI();

// Memory Management System
class TaskMemoryManager {
  async getCurrentTask() {
    const result = await chrome.storage.session.get(['currentTask']);
    return result.currentTask || null;
  }

  async setCurrentTask(task) {
    await chrome.storage.session.set({ currentTask: task });
  }

  async getCompletedTasks() {
    const result = await chrome.storage.session.get(['completedTasks']);
    return result.completedTasks || [];
  }

  async addCompletedTask(task) {
    const completed = await this.getCompletedTasks();
    const summary = this.summarizeTask(task);
    completed.push(summary);

    // Keep only last 10 completed tasks
    if (completed.length > 10) {
      completed.shift();
    }

    await chrome.storage.session.set({ completedTasks: completed });
  }

  async getQuestionHistory() {
    const result = await chrome.storage.session.get(['questionHistory']);
    return result.questionHistory || [];
  }

  async addQuestionHistory(question) {
    const questions = await this.getQuestionHistory();
    questions.push({
      question: question,
      askedAt: new Date().toISOString()
    });

    // Keep only last 20 questions
    if (questions.length > 20) {
      questions.shift();
    }

    await chrome.storage.session.set({ questionHistory: questions });
  }

  async deleteQuestion(index) {
    const questions = await this.getQuestionHistory();
    if (index >= 0 && index < questions.length) {
      questions.splice(index, 1);
      await chrome.storage.session.set({ questionHistory: questions });
    }
  }

  async clearQuestionHistory() {
    await chrome.storage.session.remove(['questionHistory']);
  }

  async clearTaskHistory() {
    await chrome.storage.session.remove(['completedTasks']);
  }

  async deleteCompletedTask(index) {
    const completed = await this.getCompletedTasks();
    if (index >= 0 && index < completed.length) {
      completed.splice(index, 1);
      await chrome.storage.session.set({ completedTasks: completed });
    }
  }

  summarizeTask(task) {
    // Extract service and action from the task for better summary
    const service = this.extractServiceFromTask(task);
    const action = this.extractActionFromTask(task);

    return {
      prompt: task.userPrompt,
      completedAt: new Date().toISOString(),
      stepCount: task.plan.steps.length,
      service: service,
      action: action,
      summary: task.userPrompt.length > 50
        ? `${task.userPrompt.substring(0, 50)}...`
        : task.userPrompt,
      createdResources: task.createdResources || [],
      finalContext: task.currentContext || {}
    };
  }

  extractServiceFromTask(task) {
    // Use the service from context instead of hardcoded patterns
    return task.currentContext?.service || 'AWS';
  }

  extractActionFromTask(task) {
    const prompt = task.userPrompt.toLowerCase();
    if (prompt.includes('create')) return 'create';
    if (prompt.includes('launch')) return 'launch';
    if (prompt.includes('deploy')) return 'deploy';
    if (prompt.includes('configure')) return 'configure';
    if (prompt.includes('delete')) return 'delete';
    if (prompt.includes('update')) return 'update';
    return 'manage';
  }

  async getCurrentStep() {
    const result = await chrome.storage.session.get(['currentStep']);
    return result.currentStep || 0;
  }

  async setCurrentStep(stepIndex) {
    await chrome.storage.session.set({ currentStep: stepIndex });
  }

  async clearCurrent() {
    await chrome.storage.session.remove(['currentTask', 'currentStep']);
  }
}

const memoryManager = new TaskMemoryManager();

// Message Router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Indicates async response
});

async function handleMessage(message, sender) {
  console.log('Service Worker received message:', message.type);

  // Handle messages from different contexts (sidepanel vs content_script)
  const tabId = sender.tab ? sender.tab.id : (message.tabId || null);

  switch (message.type) {
    case 'START_NEW_TASK':
      // Assuming START_NEW_TASK comes from the side panel, which is in a tab
      // We need to get the *active* tab to send a message to the content script
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        return { success: false, error: 'No active tab found. Please open an AWS Console page.' };
      }
      const activeTab = tabs[0];
      return await handleNewTask(message.data, activeTab.id);

    case 'ERROR_DETECTED':
      // This comes from the content script, which includes the sender.tab.id
      return await handleErrorDetection(message.data, sender.tab.id);

    case 'GET_PAGE_CONTEXT':
      // This also comes from the content script
      if (!tabId) {
        console.error("Cannot get page context, tabId is unknown.");
        return { success: false, error: 'Unknown tab' };
      }
      return await requestPageContext(tabId);

    case 'COMPLETE_STEP':
      return await handleStepCompletion(message.data);

    case 'RESET_TASK':
      return await handleTaskReset();

    case 'CLEAR_SESSION':
      return await handleSessionClear();

    case 'GET_CURRENT_STATE':
      return await getCurrentState();

    case 'PAGE_CHANGED':
      return await handlePageChange(message.data, tabId);

    case 'ADAPT_PLAN':
      return await handlePlanAdaptation(data, tabId);

    case 'ANSWER_QUESTION':
      return await handleQuestionAnswer(message.data);

    case 'ADD_QUESTION_HISTORY':
      return await handleAddQuestionHistory(message.data);

    case 'GET_QUESTION_HISTORY':
      return await handleGetQuestionHistory();

    case 'DELETE_QUESTION':
      return await handleDeleteQuestion(message.data);

    case 'CLEAR_QUESTION_HISTORY':
      return await handleClearQuestionHistory();

    case 'CLEAR_TASK_HISTORY':
      return await handleClearTaskHistory();

    case 'DELETE_COMPLETED_TASK':
      return await handleDeleteCompletedTask(message.data);

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

function extractTaskType(userPrompt) {
  const prompt = userPrompt.toLowerCase();
  if (prompt.includes('create') || prompt.includes('new')) return 'create';
  if (prompt.includes('launch') || prompt.includes('start')) return 'launch';
  if (prompt.includes('deploy') || prompt.includes('upload')) return 'deploy';
  if (prompt.includes('configure') || prompt.includes('setup') || prompt.includes('set up')) return 'configure';
  if (prompt.includes('delete') || prompt.includes('remove')) return 'delete';
  if (prompt.includes('update') || prompt.includes('modify')) return 'update';
  if (prompt.includes('monitor') || prompt.includes('watch')) return 'monitor';
  return 'manage';
}

async function handleNewTask(data, tabId) {
  try {
    // Check if we can communicate with the tab
    let contextResponse;
    try {
      // First ping to check if content script is loaded
      await chrome.tabs.sendMessage(tabId, { type: 'PING' });

      // If ping succeeds, get context
      contextResponse = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_PAGE_CONTEXT'
      });
    } catch (error) {
      console.log('Content script not available, checking for AWS tabs');

      // Check all tabs for AWS pages
      const allTabs = await chrome.tabs.query({});
      const awsTabs = allTabs.filter(tab =>
        tab.url && (
          tab.url.includes('console.aws.amazon.com') ||
          tab.url.includes('aws.amazon.com')
        )
      );

      const currentTab = await chrome.tabs.get(tabId);
      const isCurrentTabAWS = currentTab.url && (
        currentTab.url.includes('console.aws.amazon.com') ||
        currentTab.url.includes('aws.amazon.com')
      );

      if (awsTabs.length === 0) {
        // No AWS tabs found - generate navigation plan with current page context
        const navigationPlan = await generateNavigationToAWS(data.userPrompt, currentTab.url);
        return {
          success: true,
          plan: navigationPlan,
          context: { service: 'Navigation', pageTitle: 'Navigate to AWS', url: currentTab.url },
          usingMockAI: aiEngine.usingMock,
          needsNavigation: true
        };
      } else if (awsTabs.length === 1) {
        // Single AWS tab found
        const awsTab = awsTabs[0];
        if (awsTab.id === tabId) {
          // Current tab is AWS but content script not loaded - auto refresh
          console.log('Auto-refreshing AWS tab to activate Console Nano');
          await chrome.tabs.reload(tabId);

          // Wait a moment for reload, then try again
          await new Promise(resolve => setTimeout(resolve, 2000));

          try {
            await chrome.tabs.sendMessage(tabId, { type: 'PING' });
            contextResponse = await chrome.tabs.sendMessage(tabId, {
              type: 'GET_PAGE_CONTEXT'
            });
          } catch (retryError) {
            // If still fails after refresh, show manual refresh instruction
            const refreshPlan = {
              steps: [
                {
                  id: 1,
                  type: "instruction",
                  description: "Page refreshed automatically. If this message persists, please refresh manually",
                  element: [],
                  details: "Press F5 or Ctrl+R (Cmd+R on Mac) to reload the page, then try again"
                }
              ],
              externalActions: [],
              nextTasks: [data.userPrompt]
            };

            return {
              success: true,
              plan: refreshPlan,
              context: { service: 'AWS Console', pageTitle: 'Refresh Required', url: awsTab.url },
              usingMockAI: aiEngine.usingMock,
              needsRefresh: true
            };
          }
        } else {
          // Switch to the AWS tab
          await chrome.tabs.update(awsTab.id, { active: true });
          await chrome.windows.update(awsTab.windowId, { focused: true });

          const switchPlan = {
            steps: [
              {
                id: 1,
                type: "instruction",
                description: "Switched to your AWS Console tab. Please try your request again.",
                element: [],
                details: "Console Nano has switched to your open AWS tab. You can now proceed with your request."
              }
            ],
            externalActions: [],
            nextTasks: [data.userPrompt]
          };

          return {
            success: true,
            plan: switchPlan,
            context: { service: 'AWS Console', pageTitle: 'Tab Switched', url: awsTab.url },
            usingMockAI: aiEngine.usingMock,
            needsTabSwitch: true
          };
        }
      } else {
        // Multiple AWS tabs - ask user to choose
        const tabChoices = awsTabs.map((tab, index) => {
          const urlParts = new URL(tab.url);
          const service = urlParts.pathname.split('/')[1] || 'Console';
          return `${index + 1}. ${tab.title || service} (${urlParts.hostname})`;
        }).join('\n');

        const choicePlan = {
          steps: [
            {
              id: 1,
              type: "instruction",
              description: "Multiple AWS tabs detected. Please choose which tab to use:",
              element: [],
              details: `Found ${awsTabs.length} AWS tabs: \n${tabChoices} \n\nPlease click on the tab you want to use, then try your request again.`
            }
          ],
          externalActions: [],
          nextTasks: [data.userPrompt]
        };

        return {
          success: true,
          plan: choicePlan,
          context: { service: 'AWS Console', pageTitle: 'Multiple Tabs', url: currentTab.url },
          usingMockAI: aiEngine.usingMock,
          needsTabChoice: true,
          awsTabs: awsTabs
        };
      }
    }

    if (!contextResponse.success) {
      throw new Error('Failed to get page context from content script');
    }

    // Generate task plan using AI with enhanced context
    const plan = await aiEngine.generateTaskPlan(
      data.userPrompt,
      contextResponse.context
    );

    // Save to memory with enhanced tracking
    const task = {
      userPrompt: data.userPrompt,
      plan: plan,
      originalContext: contextResponse.context,
      currentContext: contextResponse.context,
      completedSteps: [],
      createdResources: [],
      taskType: extractTaskType(data.userPrompt),
      createdAt: new Date().toISOString()
    };

    await memoryManager.setCurrentTask(task);
    await memoryManager.setCurrentStep(0);

    return {
      success: true,
      plan: plan,
      context: contextResponse.context,
      usingMockAI: aiEngine.usingMock
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function generateNavigationToAWS(userPrompt, currentPageUrl = '') {
  // Smart navigation based on current page context
  const steps = [];

  // Analyze current page to provide contextual navigation
  if (currentPageUrl.includes('google.com') || currentPageUrl.includes('search')) {
    steps.push({
      id: 1,
      type: "instruction",
      description: "Navigate to AWS Console from your current search page",
      element: ["input[name='q']", "input[type='search']", "#search"],
      details: "Type 'AWS Console' in the search bar and click the first result, or directly type 'console.aws.amazon.com' in the address bar"
    });
  } else if (currentPageUrl.includes('github.com')) {
    steps.push({
      id: 1,
      type: "instruction",
      description: "Open AWS Console in a new tab from GitHub",
      element: [],
      details: "Press Ctrl+T (Cmd+T on Mac) to open a new tab, then type 'console.aws.amazon.com' in the address bar"
    });
  } else if (currentPageUrl === '' || currentPageUrl.includes('chrome://') || currentPageUrl.includes('about:')) {
    steps.push({
      id: 1,
      type: "instruction",
      description: "Navigate to AWS Console",
      element: ["input[type='url']", "#omnibox", ".address-bar"],
      details: "Click on the address bar and type 'console.aws.amazon.com', then press Enter"
    });
  } else {
    steps.push({
      id: 1,
      type: "instruction",
      description: "Open AWS Console in a new tab",
      element: [],
      details: "Press Ctrl+T (Cmd+T on Mac) to open a new tab, then type 'console.aws.amazon.com' in the address bar"
    });
  }

  steps.push({
    id: 2,
    type: "await_user_action",
    description: "Sign in to your AWS account if prompted",
    element: [],
    details: "Enter your AWS credentials, use SSO, or select your saved account if already configured"
  });

  steps.push({
    id: 3,
    type: "instruction",
    description: "Once logged in, return to Console Nano and try your request again",
    element: [],
    details: `Original request: "${userPrompt}".Console Nano will automatically detect you're now on AWS and provide the appropriate steps.`
  });

  return {
    steps,
    externalActions: [],
    nextTasks: [userPrompt]
  };
}

async function handleErrorDetection(errorData, tabId) {
  try {
    // Get current page context
    const contextResponse = await chrome.tabs.sendMessage(tabId, {
      type: 'GET_PAGE_CONTEXT'
    });

    // Generate error fix plan
    const fixPlan = await aiEngine.generateErrorFix(
      errorData,
      contextResponse.context
    );

    return {
      success: true,
      fixPlan: fixPlan,
      errorInfo: errorData
    };
  } catch (error) {
    console.error('Error fix generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function requestPageContext(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'GET_PAGE_CONTEXT'
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get page context. Is the tab open and on an AWS page?'
    };
  }
}

async function handleStepCompletion(data) {
  try {
    const currentStep = await memoryManager.getCurrentStep();
    const currentTask = await memoryManager.getCurrentTask();

    if (!currentTask) {
      return { success: false, error: 'No active task' };
    }

    console.log(`Completing step ${currentStep + 1} of ${currentTask.plan.steps.length}`);

    // ALWAYS get fresh page context after user completes a step
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      return { success: false, error: 'No active tab found' };
    }

    let contextResponse;
    try {
      // Enhanced context retrieval with retry logic
      contextResponse = await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'GET_PAGE_CONTEXT'
      });

      if (!contextResponse.success) {
        // Retry once if failed
        await new Promise(resolve => setTimeout(resolve, 500));
        contextResponse = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GET_PAGE_CONTEXT'
        });
      }
    } catch (error) {
      console.log('Could not get fresh context:', error);
      // Continue without context update
      contextResponse = { success: false };
    }

    // Track completed steps
    if (!currentTask.completedSteps) {
      currentTask.completedSteps = [];
    }
    currentTask.completedSteps.push(currentStep);

    const newStep = currentStep + 1;

    // Check if task is complete
    if (newStep >= currentTask.plan.steps.length) {
      // Generate contextual next tasks based on what was just completed
      let contextualNextTasks = currentTask.plan.nextTasks || [];

      // If we have fresh context, generate smarter next tasks
      if (contextResponse.success) {
        try {
          contextualNextTasks = await generateContextualNextTasks(
            currentTask.userPrompt,
            contextResponse.context,
            currentTask
          );
        } catch (error) {
          console.log('Failed to generate contextual next tasks, using default');
          contextualNextTasks = currentTask.plan.nextTasks || [];
        }
      }

      await memoryManager.addCompletedTask(currentTask);
      // DON'T clear current task - keep it for context in session
      await memoryManager.setCurrentStep(0); // Reset step but keep task

      return {
        success: true,
        taskComplete: true,
        nextTasks: contextualNextTasks,
        completedTask: currentTask.userPrompt
      };
    }

    // SIMPLIFIED STEP PROGRESSION - No complex grouping
    let planAdapted = false;

    if (contextResponse.success) {
      // Always update context for current page state
      currentTask.currentContext = contextResponse.context;

      console.log('📝 Step completed, continuing with next step');
    }

    // Store updated task and advance step
    await memoryManager.setCurrentTask(currentTask);
    await memoryManager.setCurrentStep(newStep);

    return {
      success: true,
      taskComplete: false,
      newStep: newStep,
      planAdapted: planAdapted,
      plan: planAdapted ? currentTask.plan : undefined,
      contextUpdated: contextResponse.success
    };
  } catch (error) {
    console.error('Step completion failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function checkIfPlanNeedsAdaptation(task, currentContext, nextStepIndex) {
  // SMART ADAPTATION: Only adapt when there's actual navigation or significant state changes

  console.log('🧠 Checking if plan needs adaptation...');
  console.log('User Intent:', task.userPrompt);
  console.log('Current page:', currentContext.service, '-', currentContext.pageTitle);
  console.log('Next step index:', nextStepIndex);

  // If no expected context yet, adapt to current page
  if (!task.currentContext) {
    console.log('No previous context, adapting to current page');
    return true;
  }

  const oldService = task.currentContext.service;
  const newService = currentContext.service;
  const oldTitle = task.currentContext.pageTitle || '';
  const newTitle = currentContext.pageTitle || '';
  const oldUrl = task.currentContext.url || '';
  const newUrl = currentContext.url || '';

  // ONLY ADAPT FOR SIGNIFICANT NAVIGATION CHANGES

  // 1. Service change (EC2 → S3) - Major navigation
  if (oldService && newService && oldService !== newService) {
    console.log(`🔄 Service changed: ${oldService} → ${newService}, adapting plan`);
    return true;
  }

  // 2. URL change indicating new workflow (e.g., /instances → /launch-instance)
  if (oldUrl !== newUrl && newUrl.length > 0) {
    const urlChanged = !oldUrl.includes(newUrl.split('?')[0]) && !newUrl.includes(oldUrl.split('?')[0]);
    if (urlChanged) {
      console.log(`🔗 URL changed significantly: ${oldUrl} → ${newUrl}, adapting plan`);
      return true;
    }
  }

  // 3. Expected workflow progression (S3 → Create Bucket)
  if (oldTitle !== newTitle && newTitle.length > 0) {
    const isExpectedProgression = checkExpectedProgression(oldTitle, newTitle, task.userPrompt);
    if (isExpectedProgression) {
      console.log('✅ Expected workflow progression detected, adapting to new page context');
      return true;
    }
  }

  // 4. Critical errors that require handling
  if (currentContext.errors && currentContext.errors.length > 0) {
    const criticalErrors = currentContext.errors.filter(e =>
      e.type === 'error' &&
      !e.message.toLowerCase().includes('warning')
    );

    if (criticalErrors.length > 0) {
      console.log('❌ Critical errors detected on page, adapting to handle them');
      return true;
    }
  }

  // 5. CONSERVATIVE: Only adapt if we're clearly on a different workflow page
  // Don't adapt for minor page changes or form interactions
  if (oldTitle !== newTitle && newTitle.length > 0) {
    // Only adapt if the page change is significant (different workflow)
    const isSignificantChange = checkSignificantPageChange(oldTitle, newTitle, task.userPrompt);
    if (isSignificantChange) {
      console.log('🔀 Significant workflow change detected, adapting');
      return true;
    }
  }

  // DEFAULT: Don't adapt for minor changes, form interactions, or same-page updates
  console.log('✋ No significant changes detected, continuing with current plan');
  return false;

}

function checkExpectedProgression(oldTitle, newTitle, userPrompt) {
  // Smart detection of expected page progressions
  const oldLower = oldTitle.toLowerCase();
  const newLower = newTitle.toLowerCase();
  const promptLower = userPrompt.toLowerCase();

  // Common AWS progression patterns
  const progressionPatterns = [
    // S3 progressions
    { from: ['s3', 'buckets'], to: ['create', 'bucket'], intent: ['bucket', 's3'] },
    { from: ['s3'], to: ['create', 'bucket'], intent: ['bucket', 's3'] },

    // EC2 progressions
    { from: ['ec2', 'instances'], to: ['launch', 'instance'], intent: ['instance', 'ec2'] },
    { from: ['ec2'], to: ['launch', 'instance'], intent: ['instance', 'ec2'] },

    // RDS progressions
    { from: ['rds', 'databases'], to: ['create', 'database'], intent: ['database', 'rds'] },
    { from: ['rds'], to: ['create', 'database'], intent: ['database', 'rds'] },

    // Lambda progressions
    { from: ['lambda', 'functions'], to: ['create', 'function'], intent: ['function', 'lambda'] },
    { from: ['lambda'], to: ['create', 'function'], intent: ['function', 'lambda'] },

    // IAM progressions
    { from: ['iam'], to: ['create', 'user', 'role', 'policy'], intent: ['user', 'role', 'policy', 'iam'] }
  ];

  for (const pattern of progressionPatterns) {
    const fromMatch = pattern.from.some(word => oldLower.includes(word));
    const toMatch = pattern.to.some(word => newLower.includes(word));
    const intentMatch = pattern.intent.some(word => promptLower.includes(word));

    if (fromMatch && toMatch && intentMatch) {
      console.log(`✅ Expected progression detected: ${pattern.from.join('/')} → ${pattern.to.join('/')}`);
      return true;
    }
  }

  return false;
}

function checkIfPageActuallyChanged(oldContext, newContext) {
  // Simple check: only adapt if page actually changed significantly
  if (!oldContext || !newContext) {
    return true; // No previous context, adapt
  }

  // Check for service change (EC2 → S3)
  if (oldContext.service !== newContext.service) {
    console.log(`Service changed: ${oldContext.service} → ${newContext.service}`);
    return true;
  }

  // Check for URL change (different workflow)
  if (oldContext.url !== newContext.url) {
    const oldPath = oldContext.url?.split('?')[0] || '';
    const newPath = newContext.url?.split('?')[0] || '';

    if (oldPath !== newPath) {
      console.log(`URL changed: ${oldPath} → ${newPath}`);
      return true;
    }
  }

  // Check for significant title change
  if (oldContext.pageTitle !== newContext.pageTitle) {
    const oldTitle = oldContext.pageTitle || '';
    const newTitle = newContext.pageTitle || '';

    // Only adapt if it's a major change (not just form steps)
    const isMinorChange = ['step', 'page', 'review', 'confirm', 'summary'].some(word =>
      newTitle.toLowerCase().includes(word) && oldTitle.toLowerCase().includes(word.substring(0, 3))
    );

    if (!isMinorChange) {
      console.log(`Page title changed significantly: "${oldTitle}" → "${newTitle}"`);
      return true;
    }
  }

  console.log('No significant page change detected');
  return false;
}

function checkSignificantPageChange(oldTitle, newTitle, userPrompt) {
  // Simplified version - kept for compatibility
  return checkIfPageActuallyChanged(
    { pageTitle: oldTitle },
    { pageTitle: newTitle }
  );
}

function checkIfStepCausesPageChange(stepInfo) {
  // Determine if this step should cause the page to change/navigate
  if (!stepInfo) return false;

  const description = (stepInfo.description || '').toLowerCase();
  const details = (stepInfo.details || '').toLowerCase();
  const stepText = `${description} ${details}`;

  // Steps that typically cause page changes
  const pageChangeIndicators = [
    // Navigation actions
    'navigate', 'go to', 'click.*link', 'open.*page', 'visit',

    // Major action buttons that lead to new pages
    'create.*bucket', 'launch.*instance', 'create.*database', 'create.*function',
    'create.*user', 'create.*role', 'create.*policy',

    // Workflow progression buttons
    'next', 'continue', 'proceed', 'launch', 'create', 'submit',

    // Service navigation
    'services.*menu', 'search.*service', 'select.*service'
  ];

  const causesPageChange = pageChangeIndicators.some(pattern => {
    const regex = new RegExp(pattern, 'i');
    return regex.test(stepText);
  });

  // Form interactions typically don't cause page changes
  const formInteractions = [
    'select.*option', 'choose.*from.*dropdown', 'enter.*text', 'type.*in',
    'fill.*field', 'check.*box', 'uncheck', 'toggle', 'configure.*setting'
  ];

  const isFormInteraction = formInteractions.some(pattern => {
    const regex = new RegExp(pattern, 'i');
    return regex.test(stepText);
  });

  if (isFormInteraction) {
    console.log('📝 Form interaction detected, should not cause page change');
    return false;
  }

  if (causesPageChange) {
    console.log('🔄 Step should cause page change:', stepText.substring(0, 50) + '...');
    return true;
  }

  console.log('📄 Step should not cause page change:', stepText.substring(0, 50) + '...');
  return false;
}

async function handleTaskReset() {
  try {
    // Only reset the current step, keep the task for session context
    await memoryManager.setCurrentStep(0);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleSessionClear() {
  try {
    // Completely clear the session for fresh start
    await memoryManager.clearCurrent();

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getCurrentState() {
  try {
    const currentTask = await memoryManager.getCurrentTask();
    const currentStep = await memoryManager.getCurrentStep();
    const completedTasks = await memoryManager.getCompletedTasks();

    return {
      success: true,
      state: {
        currentTask,
        currentStep,
        completedTasks
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function handlePageChange(data, tabId) {
  try {
    console.log('Page changed detected:', data.url);

    // Get fresh context from new page
    const contextResponse = await chrome.tabs.sendMessage(tabId, {
      type: 'GET_PAGE_CONTEXT'
    });

    if (!contextResponse.success) {
      console.log('Could not get context from new page');
      return { success: true, contextUpdated: false };
    }

    const currentTask = await memoryManager.getCurrentTask();

    // If there's an active task, update current context but DON'T modify the plan
    if (currentTask) {
      // Update current context but keep original plan
      currentTask.currentContext = contextResponse.context;
      await memoryManager.setCurrentTask(currentTask);

      console.log('Updated current context for new page (original plan preserved)');
    }

    return {
      success: true,
      contextUpdated: false // Don't trigger plan regeneration
    };
  } catch (error) {
    console.error('Page change handling failed:', error);
    return { success: false, error: error.message };
  }
}

async function handlePlanAdaptation(data, tabId) {
  try {
    const currentTask = await memoryManager.getCurrentTask();
    const currentStep = data.currentStep || await memoryManager.getCurrentStep();

    if (!currentTask) {
      return { success: false, error: 'No active task' };
    }

    console.log(`Adapting plan from step ${currentStep + 1} onwards`);

    // Use provided context or get fresh context
    let contextResponse;
    if (data.freshContext) {
      contextResponse = { success: true, context: data.freshContext };
    } else {
      contextResponse = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_PAGE_CONTEXT'
      });
    }

    if (!contextResponse.success) {
      throw new Error('Failed to get page context');
    }

    // Create a smart continuation prompt that adapts to current page
    const completedSteps = data.completedSteps || currentTask.completedSteps || [];
    const remainingSteps = data.remainingSteps || currentTask.plan.steps.slice(currentStep);

    const completedStepsText = completedSteps
      .map(i => currentTask.plan.steps[i]?.description || 'Unknown step')
      .slice(-3)
      .join(', ');

    const continuationPrompt = `SMART PLAN ADAPTATION:

ORIGINAL USER REQUEST: "${currentTask.userPrompt}"

COMPLETED STEPS: ${completedStepsText}

REMAINING PLANNED STEPS: ${remainingSteps.map(s => s.description).join(', ')}

CURRENT PAGE STATE:
- Service: ${contextResponse.context.service}
- Page: ${contextResponse.context.pageTitle}
- Available buttons: ${contextResponse.context.elements?.buttons?.map(b => b.text).join(', ') || 'None'}
- Available inputs: ${contextResponse.context.elements?.inputs?.map(i => i.label).join(', ') || 'None'}

TASK: Review the remaining steps and adapt them to work with the current page state. 
- Keep steps that are still valid
- Modify steps that need adjustment for current page
- Add new steps if needed to complete the original user request
- Group steps by page changes as before
- Page URL: ${contextResponse.context.url}

TASK: Generate the REMAINING steps needed to complete the original user request, starting from the CURRENT page state. 

CRITICAL RULES:
1. Start from where we are NOW - don't assume navigation
2. Use the ACTUAL elements available on the current page
3. If the current page doesn't have what we need, provide navigation steps
4. Be specific about form values and selections based on user intent
5. Each step should be actionable with current page elements

Generate ONLY the remaining steps in JSON format. Make sure element selectors match what's actually available on the current page.`;

    // Use AI to generate remaining steps with current context
    const remainingPlan = await aiEngine.generateTaskPlan(continuationPrompt, contextResponse.context);

    // Create new complete plan with completed steps + new remaining steps
    const newPlan = {
      steps: [
        ...currentTask.plan.steps.slice(0, currentStep), // Keep completed steps
        ...remainingPlan.steps // Add new remaining steps
      ],
      externalActions: remainingPlan.externalActions || [],
      nextTasks: remainingPlan.nextTasks || []
    };

    // Update task with new plan and context
    currentTask.plan = newPlan;
    currentTask.currentContext = contextResponse.context;

    // Save updated task
    await memoryManager.setCurrentTask(currentTask);

    console.log(`Plan adapted: ${newPlan.steps.length} total steps, starting from step ${currentStep + 1}`);

    return {
      success: true,
      plan: newPlan
    };
  } catch (error) {
    console.error('Plan adaptation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

console.log('Console Nano Service Worker initialized');

async function handleQuestionAnswer(data) {
  try {
    // Use AI to generate a comprehensive answer
    const questionPrompt = `You are an AWS expert assistant. Answer this question clearly and concisely:

Question: "${data.question}"

Provide a helpful, accurate answer about AWS services, best practices, or concepts. Keep the response informative but not too lengthy. If the question is about a specific AWS service, include practical information about use cases, pricing considerations, and best practices.

Focus on being helpful and educational. If you're not certain about specific details, acknowledge that and suggest where to find authoritative information.`;

    const answer = await aiEngine.session.prompt(questionPrompt);

    return {
      success: true,
      answer: answer
    };
  } catch (error) {
    console.error('Failed to generate answer:', error);
    return {
      success: false,
      error: 'Failed to generate answer'
    };
  }
}

async function handleAddQuestionHistory(data) {
  try {
    await memoryManager.addQuestionHistory(data.question);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleGetQuestionHistory() {
  try {
    const questions = await memoryManager.getQuestionHistory();
    return { success: true, questions };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleDeleteQuestion(data) {
  try {
    await memoryManager.deleteQuestion(data.index);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleClearQuestionHistory() {
  try {
    await memoryManager.clearQuestionHistory();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleClearTaskHistory() {
  try {
    await memoryManager.clearTaskHistory();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleDeleteCompletedTask(data) {
  try {
    await memoryManager.deleteCompletedTask(data.index);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function generateContextualNextTasks(completedUserPrompt, currentContext, completedTask) {
  try {
    // Create a smart prompt for generating contextual next tasks
    const nextTasksPrompt = `The user just completed this AWS task: "${completedUserPrompt}"

Current AWS Console State:
- Service: ${currentContext.service}
- Page: ${currentContext.pageTitle}
- URL: ${currentContext.url}

Generate 5-6 comprehensive follow-up tasks that users typically need to do after completing "${completedUserPrompt}".

Consider the complete lifecycle and best practices:

COMPREHENSIVE FOLLOW-UP CATEGORIES:
1. **Security & Access**: Configure permissions, security groups, IAM roles, encryption
2. **Monitoring & Logging**: Set up CloudWatch, alerts, logging, performance monitoring  
3. **Testing & Validation**: Test functionality, validate configuration, verify connectivity
4. **Optimization**: Cost optimization, performance tuning, resource scaling
5. **Backup & Recovery**: Set up backups, disaster recovery, data protection
6. **Integration**: Connect with other services, set up APIs, configure networking

Generate 5-6 specific, actionable next steps that cover different aspects of managing and optimizing the resource after "${completedUserPrompt}".

Focus on practical, real-world tasks that users actually need to do next.

Return ONLY a JSON array of strings, no other text:
["next task 1", "next task 2", "next task 3", "next task 4", "next task 5", "next task 6"]`;

    const response = await aiEngine.session.prompt(nextTasksPrompt);

    // Try to parse the AI response as JSON array
    try {
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      const nextTasks = JSON.parse(cleanResponse);

      if (Array.isArray(nextTasks) && nextTasks.length > 0) {
        return nextTasks.slice(0, 5); // Limit to 5 tasks
      }
    } catch (parseError) {
      console.log('Failed to parse AI next tasks response, using fallback');
    }

    // Fallback to service-based suggestions if AI parsing fails
    return generateFallbackNextTasks(completedUserPrompt, currentContext.service);

  } catch (error) {
    console.error('Error generating contextual next tasks:', error);
    return generateFallbackNextTasks(completedUserPrompt, currentContext.service);
  }
}

function generateFallbackNextTasks(completedPrompt, currentService) {
  // Comprehensive generic fallback covering all important aspects
  return [
    "Configure security groups and access permissions",
    "Set up monitoring and alerting with CloudWatch",
    "Test the resource functionality and connectivity",
    "Configure backup and disaster recovery options",
    "Review and optimize cost settings",
    "Set up logging and audit trails"
  ];
}

// Initialize AI on startup
aiEngine.initialize().then(() => {
  console.log('AI Engine ready. Using:', aiEngine.usingMock ? 'MOCK AI' : 'Real AI');
});