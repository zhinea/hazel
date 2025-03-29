# 🎬 Hazel Browser Recorder 🎬

## ✨ Automate Your Browser Like Magic! ✨

Hazel is a powerful Chrome extension that lets you record, save, and replay your browser interactions with cloud synchronization capabilities. Say goodbye to repetitive tasks! 🎉


## 🚀 Awesome Features

### 📹 Recording Superpowers
- **🖱️ Capture Every Move**: Clicks, typing, form submissions, navigation - we've got it all!
- **⏯️ Pause & Resume**: Take a break when needed and pick up right where you left off
- **🔄 Dynamic Variables**: Set up flexible values that change during playback (plain text, AI-generated, or API)
- **📊 Visual Tracking**: Sleek recording toolbar shows status with real-time event counter

### ▶️ Magical Playback
- **🎯 Precision Replay**: Watch Hazel faithfully recreate your recorded actions
- **🧠 Smart Element Finding**: Multiple fallback strategies ensure playback works even when pages change
- **🛡️ Error Recovery**: Hazel tries to keep going even when unexpected changes occur

### ☁️ Cloud Powers
- **🔐 Secure Auth**: Easy and secure cloud authentication
- **🔄 Sync Anywhere**: Access your recordings across devices
- **✈️ Offline Mode**: Works without internet using local storage

## 💻 Installation

1. 📥 Download the repository
2. 🧩 Open Chrome and navigate to `chrome://extensions/`
3. 👨‍💻 Enable "Developer mode" in the top right
4. 📁 Click "Load unpacked" and select the extension directory
5. 🎉 The Browser Recorder icon will appear in your Chrome toolbar!

## 🎮 How to Use

### 🎥 Recording Like a Pro

1. 🖱️ Click the Hazel extension icon
2. ✏️ Give your recording an awesome name
3. 🚀 Hit "Start Recording"
4. ⚙️ In the settings modal:
    - Configure recording options
    - Add any custom variables you need
    - Click "Start Recording" to launch!
5. 🎬 The recording toolbar appears in the top-right corner
6. 🎭 Do your thing! Hazel is watching (in a good way)
7. ⏹️ Use the toolbar to pause/resume or stop recording

### ▶️ Playback Magic

1. 📂 Open the Hazel extension popup
2. 🔍 Find your recording in the list
3. ▶️ Click "Play" and sit back
4. 🪄 Watch as Hazel recreates your actions perfectly!

## 🗂️ Project Structure

- **background.js**: 🧠 The brain of the operation
- **content/** directory: 🛠️ Scripts that work within web pages
    - **content-script.js**: 🏁 Main entry point
    - **recorder.js**: 🎥 Captures your interactions
    - **player.js** and **player-new.js**: ▶️ Replays your recordings
    - **recording-toolbar.js**: 📊 The UI you see while recording
    - **recording-settings-modal.js**: ⚙️ Configuration screen
    - **api-service.js** and **auth-helper.js**: 🔌 API communication
- **popup/** directory: 💻 Extension popup interface
- **lib/** directory: 🧰 Shared utilities
- **manifest.json**: 📝 Extension configuration

## 🌟 Features Spotlight

### 🔮 Custom Variables - Three Flavors!

1. **📝 Plain Text**: Simple static values - "admin@example.com"
2. **🤖 AI Generated**: Dynamic values created by AI - "random product name"
3. **🌐 API Response**: Real-time data from APIs - "current stock price"

### 🔑 Secure Authentication

Hazel connects securely with the cloud platform using OAuth authentication. Your data stays safe! 🔒

### 🎯 Smart Element Targeting

During playback, Hazel uses these strategies to find elements (in order):

1. ✅ Exact CSS selector
2. 🔄 Simplified selector without nth-child parts
3. 🆔 ID-based selection
4. 📊 Attribute-based selection
5. 📋 Name-based selection for form elements

This smart approach ensures reliable playback even when websites change! 💪

## 🌐 API Integration

Hazel talks smoothly with its cloud API to:

- ✅ Verify your login
- 💾 Save recordings to the cloud
- 📥 Download your recordings anywhere
- 🗑️ Manage your library

## 👨‍💻 Development

### 📋 Prerequisites

- 🌐 Chrome browser
- 📦 Node.js (for future enhancements)

### 🔧 Local Development

1. 📝 Make your code changes
2. 🔄 Reload the extension in `chrome://extensions/`
3. 🧪 Test your amazing improvements!

## 🔮 Future Magic Coming Soon

- 🖱️ Support for complex interactions like drag and drop
- 🚀 Enhanced API capabilities
- 👥 Team sharing of recordings
- 💪 Even better error recovery
- 🧠 Conditional logic in recordings

## 🆘 Troubleshooting

- 🚫 Recording not starting? Check you're not on a restricted page (chrome://, extension pages)
- ❌ Playback misbehaving? Try recording again with the latest version
- 🔑 Authentication issues? Log in again through the cloud platform

## 📜 License

[MIT License](https://choosealicense.com/licenses/mit/)

---

### 🌟 Made with love for productive people! 🌟

*Stop repeating yourself. Start recording with Hazel!* ✨