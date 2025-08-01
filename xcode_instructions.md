# AmayAI iOS App Wrapper - Xcode Instructions

## Overview
This guide provides step-by-step instructions to create an iOS app wrapper for AmayAI using Xcode. The iOS app will essentially be a native container that displays the web application with enhanced mobile features.

## Prerequisites
- Mac computer with macOS 12.0 or later
- Xcode 14.0 or later (download from Mac App Store)
- Apple Developer Account (free for testing, $99/year for App Store distribution)
- AmayAI project files (downloaded zip)

## Project Setup

### 1. Create New iOS Project
1. Open Xcode
2. Select "Create a new Xcode project"
3. Choose "iOS" → "App"
4. Configure project:
   - Product Name: `AmayAI`
   - Team: Your Apple Developer Team
   - Organization Identifier: `com.cmac.amayai` (or your preferred identifier)
   - Bundle Identifier: `com.cmac.amayai`
   - Language: Swift
   - Interface: Storyboard
   - Use Core Data: No
   - Include Tests: Yes (optional)

### 2. Basic WebView Implementation

#### 2.1 Update Info.plist
Add these keys to your `Info.plist` file:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
<key>NSCameraUsageDescription</key>
<string>AmayAI needs camera access for document scanning and image processing features.</string>
<key>NSMicrophoneUsageDescription</key>
<string>AmayAI needs microphone access for voice commands and audio transcription.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>AmayAI needs photo library access to process and analyze images.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>AmayAI uses location for context-aware scheduling and smart suggestions.</string>
```

#### 2.2 ViewController.swift Implementation

Replace the contents of `ViewController.swift`:

```swift
import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    
    var webView: WKWebView!
    var activityIndicator: UIActivityIndicatorView!
    
    // MARK: - Configuration
    let webAppURL = "https://your-deployed-amayai-url.replit.app" // Replace with your actual Replit URL
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        setupActivityIndicator()
        setupNavigationBar()
        loadWebApp()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        setupStatusBarStyle()
    }
    
    // MARK: - WebView Setup
    func setupWebView() {
        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.allowsInlineMediaPlayback = true
        webConfiguration.mediaTypesRequiringUserActionForPlayback = []
        
        // Enable JavaScript
        let preferences = WKPreferences()
        preferences.javaScriptEnabled = true
        webConfiguration.preferences = preferences
        
        webView = WKWebView(frame: view.bounds, configuration: webConfiguration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        
        // Enable pull-to-refresh
        let refreshControl = UIRefreshControl()
        refreshControl.addTarget(self, action: #selector(refreshWebView), for: .valueChanged)
        webView.scrollView.addSubview(refreshControl)
        
        view.addSubview(webView)
    }
    
    func setupActivityIndicator() {
        activityIndicator = UIActivityIndicatorView(style: .large)
        activityIndicator.center = view.center
        activityIndicator.hidesWhenStopped = true
        activityIndicator.color = UIColor.systemBlue
        view.addSubview(activityIndicator)
    }
    
    func setupNavigationBar() {
        navigationController?.setNavigationBarHidden(true, animated: false)
    }
    
    func setupStatusBarStyle() {
        if #available(iOS 13.0, *) {
            let appearance = UINavigationBarAppearance()
            appearance.configureWithTransparentBackground()
            navigationController?.navigationBar.standardAppearance = appearance
            navigationController?.navigationBar.scrollEdgeAppearance = appearance
        }
    }
    
    // MARK: - Web App Loading
    func loadWebApp() {
        guard let url = URL(string: webAppURL) else {
            showErrorAlert(message: "Invalid URL configuration")
            return
        }
        
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        request.setValue("AmayAI-iOS/1.0", forHTTPHeaderField: "User-Agent")
        
        activityIndicator.startAnimating()
        webView.load(request)
    }
    
    @objc func refreshWebView() {
        webView.reload()
        webView.scrollView.refreshControl?.endRefreshing()
    }
    
    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        activityIndicator.stopAnimating()
        
        // Inject iOS-specific styles and features
        let jsCode = """
            // Add iOS-specific styling
            const style = document.createElement('style');
            style.textContent = `
                * { -webkit-user-select: none; -webkit-touch-callout: none; }
                body { -webkit-overflow-scrolling: touch; }
                .ios-safe-area-top { padding-top: env(safe-area-inset-top); }
                .ios-safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
            `;
            document.head.appendChild(style);
            
            // Add iOS app indicator
            window.isIOSApp = true;
            
            // Disable context menu
            document.addEventListener('contextmenu', e => e.preventDefault());
            
            // Handle iOS keyboard
            document.addEventListener('focusin', () => {
                document.body.classList.add('keyboard-open');
            });
            document.addEventListener('focusout', () => {
                document.body.classList.remove('keyboard-open');
            });
        """
        
        webView.evaluateJavaScript(jsCode, completionHandler: nil)
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        activityIndicator.stopAnimating()
        showErrorAlert(message: "Failed to load AmayAI: \\(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        activityIndicator.stopAnimating()
        showErrorAlert(message: "Connection failed: \\(error.localizedDescription)")
    }
    
    // MARK: - WKUIDelegate
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
        }
        return nil
    }
    
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "AmayAI", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { _ in
            completionHandler()
        }))
        present(alert, animated: true)
    }
    
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "AmayAI", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: { _ in
            completionHandler(false)
        }))
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { _ in
            completionHandler(true)
        }))
        present(alert, animated: true)
    }
    
    // MARK: - Error Handling
    func showErrorAlert(message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Retry", style: .default) { _ in
            self.loadWebApp()
        })
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        present(alert, animated: true)
    }
}
```

### 3. App Icon and Launch Screen

#### 3.1 App Icon Setup
1. Create app icons in these sizes:
   - 1024x1024 (App Store)
   - 180x180 (iPhone)
   - 120x120 (iPhone)
   - 87x87 (iPhone)
   - 58x58 (iPhone)
   - 167x167 (iPad)
   - 152x152 (iPad)
   - 76x76 (iPad)
   - 40x40 (Spotlight)
   - 29x29 (Settings)
   - 20x20 (Notification)

2. Use the AmayAI logo from the project: `client/public/amayai-logo.png`
3. Resize using online tools or Photoshop
4. Add to `Assets.xcassets/AppIcon.appiconset`

#### 3.2 Launch Screen
Update `LaunchScreen.storyboard`:
1. Set background color to black (#000000)
2. Add AmayAI logo image (center)
3. Add "AmayAI" label with neon blue color
4. Add loading indicator below logo

### 4. Environment Configuration

#### 4.1 Configuration Files
Create `Config.swift`:

```swift
import Foundation

struct AppConfig {
    // MARK: - Server Configuration
    static let baseURL = "https://your-amayai-app.replit.app"
    static let websocketURL = "wss://your-amayai-app.replit.app/ws"
    
    // MARK: - API Keys (Set these in Build Settings or use Info.plist)
    static var openAIAPIKey: String {
        return Bundle.main.infoDictionary?["OPENAI_API_KEY"] as? String ?? ""
    }
    
    static var googleClientID: String {
        return Bundle.main.infoDictionary?["GOOGLE_CLIENT_ID"] as? String ?? ""
    }
    
    static var slackBotToken: String {
        return Bundle.main.infoDictionary?["SLACK_BOT_TOKEN"] as? String ?? ""
    }
    
    // MARK: - Feature Flags
    static let enableOfflineMode = true
    static let enablePushNotifications = true
    static let enableBiometricAuth = true
}
```

#### 4.2 Secure API Key Storage
Add to `Info.plist` (replace with your actual keys):

```xml
<key>OPENAI_API_KEY</key>
<string>sk-your-openai-api-key-here</string>
<key>GOOGLE_CLIENT_ID</key>
<string>your-google-client-id.googleusercontent.com</string>
<key>GOOGLE_CLIENT_SECRET</key>
<string>your-google-client-secret</string>
<key>SLACK_BOT_TOKEN</key>
<string>xoxb-your-slack-bot-token</string>
<key>SLACK_CHANNEL_ID</key>
<string>C1234567890</string>
```

## Required API Keys and Secrets

### 1. Google Workspace APIs
- **Google Client ID**: Get from Google Cloud Console
- **Google Client Secret**: Get from Google Cloud Console
- **Required Scopes**: 
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/tasks`

### 2. OpenAI API
- **API Key**: Get from OpenAI Platform
- **Model**: gpt-4o (latest)
- **Usage**: Email analysis, task generation, AI suggestions

### 3. Slack Integration
- **Bot Token**: From Slack App configuration
- **Channel ID**: Target channel for notifications
- **Permissions**: `chat:write`, `channels:read`

### 4. Database (Neon PostgreSQL)
- **Database URL**: From Neon dashboard
- **Connection String**: Already configured in the web app

## Deployment Steps

### 1. Configure Signing & Capabilities
1. Select your project in Xcode
2. Go to "Signing & Capabilities"
3. Select your development team
4. Enable these capabilities:
   - Background Modes (Background fetch, Background processing)
   - Push Notifications
   - Associated Domains (for deep linking)

### 2. Build Settings
1. Set deployment target to iOS 14.0+
2. Configure URL schemes for OAuth redirects
3. Set bundle identifier: `com.cmac.amayai`

### 3. Testing
1. Build and run on simulator
2. Test on physical device with development profile
3. Verify all features work:
   - Web app loading
   - OAuth authentication
   - WebSocket connections
   - Push notifications

### 4. App Store Preparation
1. Create app listing in App Store Connect
2. Add screenshots (required sizes):
   - iPhone 6.7": 1290×2796
   - iPhone 6.5": 1242×2688
   - iPhone 5.5": 1242×2208
   - iPad Pro 12.9": 2048×2732

3. App Store metadata:
   - **Title**: AmayAI - AI Personal Assistant
   - **Subtitle**: Smart Google Workspace Automation
   - **Keywords**: AI, productivity, email, calendar, tasks, automation
   - **Description**: Use the description from README.md

## Additional Features (Optional)

### 1. Push Notifications
Add UserNotifications framework:
```swift
import UserNotifications

func requestNotificationPermission() {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
        // Handle permission result
    }
}
```

### 2. Biometric Authentication
Add LocalAuthentication framework:
```swift
import LocalAuthentication

func authenticateWithBiometrics() {
    let context = LAContext()
    var error: NSError?
    
    if context.canEvaluatePolicy(.biometryAny, error: &error) {
        context.evaluatePolicy(.biometryAny, localizedReason: "Authenticate to access AmayAI") { success, error in
            // Handle authentication result
        }
    }
}
```

### 3. Offline Mode
Implement caching for basic functionality when network is unavailable.

### 4. Widget Extension
Create iOS widgets for quick stats and recent tasks.

## Troubleshooting

### Common Issues
1. **WebView not loading**: Check URL in AppConfig.swift
2. **OAuth redirect fails**: Verify URL schemes in Info.plist
3. **API calls fail**: Check CORS settings on server
4. **Build errors**: Clean build folder (Cmd+Shift+K)

### Performance Optimization
1. Enable WKWebView caching
2. Implement lazy loading for images
3. Optimize JavaScript execution
4. Use compression for API responses

## Final Notes

1. **Security**: Never commit API keys to version control
2. **Updates**: The iOS app will automatically reflect web app updates
3. **Analytics**: Consider adding Firebase or similar for usage tracking
4. **Feedback**: Implement in-app feedback mechanism

Remember to replace all placeholder URLs and API keys with your actual values before building the app.

## Support
For issues specific to the iOS implementation, refer to:
- Apple Developer Documentation
- WKWebView Documentation
- iOS Human Interface Guidelines

For AmayAI-specific issues, refer to the main project documentation in README.md and Instructions.txt.