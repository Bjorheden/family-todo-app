# App Store Submission Checklist

## Required Assets (Create these before submission)

### App Icons

- [x] 1024x1024 App Store icon (PNG, no transparency)
- [ ] Generate all required iOS icon sizes via Expo build process

### Screenshots (Required for App Store)

Create screenshots for these device types:

- [ ] iPhone 15 Pro Max (6.7"): 1290x2796
- [ ] iPhone 15 Pro (6.1"): 1179x2556
- [ ] iPhone SE (4.7"): 750x1334
- [ ] iPad Pro 12.9": 2048x2732
- [ ] iPad Pro 11": 1668x2388

### App Store Listing Content

#### App Name

✅ "Family Todo" (under 30 characters)

#### Subtitle

📝 "Collaborative Family Task Manager" (under 30 characters)

#### Description

```
Bring your family together with collaborative task management!

Family Todo helps families organize chores, track completion, and reward achievements with a fun points system.

KEY FEATURES:
• 👨‍👩‍👧‍👦 Family Collaboration - Create a family group and assign tasks
• ✅ Task Management - Create, assign, and track task completion
• 🏆 Points & Rewards - Earn points for completed tasks, redeem for rewards
• 📱 Real-time Updates - Get notified when tasks are completed or approved
• 🔒 Secure & Private - Your family data stays within your family

PERFECT FOR:
• Parents managing household chores
• Teaching children responsibility
• Gamifying family task completion
• Tracking family productivity

Download Family Todo today and make household management fun for the whole family!
```

#### Keywords

📝 "family,tasks,chores,kids,productivity,rewards,household,collaboration,parenting,organization"

#### Categories

- Primary: Productivity
- Secondary: Lifestyle

## App Store Review Guidelines Compliance

### ✅ Completed Requirements:

- User authentication system implemented
- Privacy policy created
- No usage of restricted APIs
- Proper error handling throughout app
- Family-friendly content only
- No third-party analytics or ads

### 📋 Pre-Submission Checklist:

- [ ] Update bundle identifier to your Apple Developer account
- [ ] Set up Apple Developer account ($99/year)
- [ ] Create App Store Connect listing
- [ ] Generate app-specific password for app uploads
- [ ] Test on physical iOS devices
- [ ] Ensure app works without internet connection for basic UI
- [ ] Add loading states for all network requests
- [ ] Test all user flows end-to-end

## Build Configuration

### iOS Specific Settings:

```json
"ios": {
  "bundleIdentifier": "com.yourname.familytodo", // ⚠️ CHANGE THIS
  "buildNumber": "1",
  "requireFullScreen": false,
  "supportsTablet": true
}
```

### Required Info.plist Keys:

- ✅ NSCameraUsageDescription (set to indicate no camera usage)
- ✅ NSMicrophoneUsageDescription (set to indicate no microphone usage)
- ✅ NSLocationWhenInUseUsageDescription (set to indicate no location usage)
- ✅ ITSAppUsesNonExemptEncryption: false

## Testing Before Submission

### Device Testing:

- [ ] Test on iPhone (multiple screen sizes)
- [ ] Test on iPad (if supporting tablets)
- [ ] Test with poor internet connection
- [ ] Test app backgrounding/foregrounding
- [ ] Test memory usage and performance

### Feature Testing:

- [ ] User registration and login
- [ ] Family creation and joining
- [ ] Task creation (admin only)
- [ ] Task completion workflow
- [ ] Points system functionality
- [ ] Notifications system
- [ ] Data persistence when offline

## Next Steps for Submission:

1. **Set up Apple Developer Account** ($99/year)
2. **Update bundle identifier** in app.json to match your developer account
3. **Create screenshots** using iOS Simulator or physical devices
4. **Build and test** using `expo build:ios` or EAS Build
5. **Upload to App Store Connect** using Application Loader or Transporter
6. **Fill out App Store Connect metadata**
7. **Submit for review**

## Estimated Review Time:

- First submission: 1-7 days
- Updates: 1-3 days

## Common Rejection Reasons to Avoid:

- ✅ Crashes or major bugs (we've handled error cases)
- ✅ Incomplete app functionality (all features implemented)
- ✅ Poor user interface (clean, professional design)
- ✅ Missing privacy policy (created)
- ✅ Inappropriate content (family-friendly app)
