# Console Nano: AWS Co-pilot 🤖

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Privacy First](https://img.shields.io/badge/Privacy-First-green)](https://github.com)
[![On Device AI](https://img.shields.io/badge/AI-On%20Device-orange)](https://github.com)

> **Privacy-first, on-device AI assistant for AWS Console with intelligent guidance and error detection**

Console Nano is a Chrome extension that provides step-by-step guidance for AWS Console tasks using Google's Gemini Nano AI model running entirely on your device. No data leaves your browser - complete privacy guaranteed.

![Console Nano Demo](https://youtu.be/G34KCvYEQPY)

## ✨ Features

### 🧠 **On-Device AI Intelligence**
- Powered by Google's Gemini Nano AI model
- **100% private** - all processing happens on your device
- No data sent to external servers
- Works offline once loaded

### 🎯 **Smart AWS Guidance**
- **Step-by-step instructions** for any AWS task
- **Real-time page context** detection
- **Intelligent error detection** and fixes
- **Adaptive workflows** that adjust to your current page

### 🚀 **Seamless Integration**
- **Side panel interface** - doesn't interfere with AWS Console
- **Element highlighting** - shows exactly what to click
- **Auto-navigation** detection between AWS services
- **Session persistence** - maintains context across page changes

### 📚 **Smart Features**
- **Task history** - track completed AWS tasks
- **Question answering** - get instant AWS knowledge
- **Next step suggestions** - contextual follow-up tasks
- **Multi-tab support** - works across multiple AWS tabs

## 🚀 Quick Start

### Prerequisites

1. **Chrome Browser** (version 127+)
2. **Enable Gemini Nano** (required for AI features):
   - Go to `chrome://flags`
   - Enable: `#prompt-api-for-gemini-nano`
   - Enable: `#optimization-guide-on-device-model`
   - Restart Chrome

### Installation

#### Option 1: Chrome Web Store (Coming Soon)
```bash
# Will be available on Chrome Web Store
```

#### Option 2: Developer Mode (Current)
1. **Download** or clone this repository
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top right)
4. **Click "Load unpacked"** and select the extension folder
5. **Pin the extension** to your toolbar for easy access

### First Use

1. **Navigate to AWS Console** (console.aws.amazon.com)
2. **Click the Console Nano icon** in your toolbar
3. **Try a simple request** like "create S3 bucket"
4. **Follow the step-by-step guidance**

## 💡 Usage Examples

### Creating Resources
```
"help me create an S3 bucket"
"launch an EC2 instance"
"set up a Lambda function"
"create a DynamoDB table"
```

### Configuration Tasks
```
"configure security groups for EC2"
"set up IAM roles"
"create a VPC"
"configure CloudWatch monitoring"
```

### Getting Information
```
"what is Lambda?"
"explain S3 storage classes"
"how does RDS work?"
"best practices for IAM"
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Side Panel    │    │  Service Worker  │    │ Content Script  │
│                 │    │                  │    │                 │
│ • User Interface│◄──►│ • AI Processing  │◄──►│ • Page Context  │
│ • Task Display  │    │ • Task Memory    │    │ • Element Detect│
│ • History       │    │ • Message Router │    │ • Error Monitor │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Gemini Nano    │
                       │   (On-Device)    │
                       │ • Task Planning  │
                       │ • Error Analysis │
                       │ • Q&A Generation │
                       └──────────────────┘
```

### Core Components

- **`sidepanel/`** - User interface and interaction handling
- **`service-worker/`** - AI processing and state management  
- **`content-scripts/`** - AWS Console integration and context detection
- **`manifest.json`** - Extension configuration and permissions

## 🔧 Development

### Project Structure
```
console-nano/
├── manifest.json              # Extension manifest
├── sidepanel/
│   ├── sidepanel.html        # Main UI
│   ├── sidepanel.js          # UI logic and state management
│   └── sidepanel.css         # Styling
├── service-worker/
│   └── service-worker.js     # AI processing and background tasks
├── content-scripts/
│   ├── content-script.js     # AWS Console integration
│   └── content-script.css    # Element highlighting styles
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### Key Technologies

- **Manifest V3** - Latest Chrome extension standard
- **Gemini Nano API** - On-device AI processing
- **Chrome Side Panel API** - Non-intrusive UI
- **Content Scripts** - AWS Console integration
- **Chrome Storage API** - Session and history persistence

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/console-nano.git
   cd console-nano
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select the project folder

3. **Enable AI Features**
   - Go to `chrome://flags`
   - Enable Gemini Nano flags (see Prerequisites)
   - Restart Chrome

4. **Test on AWS Console**
   - Navigate to AWS Console
   - Open the side panel
   - Try various AWS tasks

## 🔒 Privacy & Security

### Complete Privacy
- **No external API calls** - all AI processing on-device
- **No data collection** - nothing leaves your browser
- **No tracking** - no analytics or telemetry
- **Local storage only** - session data stays on your machine

### Permissions Explained
- **`sidePanel`** - Display the assistant interface
- **`storage`** - Save task history locally
- **`scripting`** - Inject context detection scripts
- **`tabs`** - Detect AWS Console pages
- **`activeTab`** - Read current page context
- **AWS domains only** - Limited to AWS Console URLs

### Security Features
- **Content Security Policy** - Prevents code injection
- **Minimal permissions** - Only what's necessary
- **Sandboxed execution** - Isolated from other extensions
- **No remote code** - All code bundled with extension

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Bug Reports
1. Check existing issues first
2. Provide detailed reproduction steps
3. Include Chrome version and OS
4. Attach console logs if possible

### Feature Requests
1. Describe the use case clearly
2. Explain how it improves the user experience
3. Consider privacy implications

### Pull Requests
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on AWS Console
5. Submit a pull request with clear description

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test on multiple AWS services
- Ensure privacy compliance
- Update documentation as needed

## 📋 Roadmap

### Version 1.1
- [ ] Support for more AWS services
- [ ] Enhanced error detection
- [ ] Keyboard shortcuts
- [ ] Dark/light theme toggle

### Version 1.2
- [ ] Multi-language support
- [ ] Advanced task templates
- [ ] Export/import task history
- [ ] Performance optimizations

### Version 2.0
- [ ] Custom workflow builder
- [ ] Team collaboration features
- [ ] Advanced analytics (local only)
- [ ] Plugin system for custom tasks

## 🐛 Troubleshooting

### Common Issues

**AI not working / Using Mock AI**
- Ensure Gemini Nano flags are enabled in `chrome://flags`
- Restart Chrome after enabling flags
- Check Chrome version (127+ required)

**Extension not loading**
- Check Developer mode is enabled
- Verify all files are present
- Check console for error messages

**Steps not appearing**
- Refresh the AWS Console page
- Check if you're on a supported AWS page
- Try a simpler request first

**Context not detected**
- Ensure you're on console.aws.amazon.com
- Try refreshing the page
- Check if content script loaded properly

### Getting Help

1. **Check the console** - Press F12 and look for errors
2. **Try incognito mode** - Rules out extension conflicts
3. **Disable other extensions** - Test for compatibility issues
4. **Create an issue** - Include detailed information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Chrome Team** - For the excellent extension APIs
- **Google AI Team** - For Gemini Nano on-device AI
- **AWS Team** - For the comprehensive AWS Console
- **Open Source Community** - For inspiration and best practices

## 📞 Support

- **GitHub Issues** - For bugs and feature requests
- **Discussions** - For questions and community support

---

**Made with ❤️ for AWS developers who value privacy and efficiency**


*Console Nano - Your private AWS co-pilot, powered by on-device AI*

