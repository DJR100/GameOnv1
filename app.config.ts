export default {
    expo: {
      // ... other config
      ios: {
        // ... other iOS config
        bundleIdentifier: "com.djr.GameOn",
        infoPlist: {
          NSFaceIDUsageDescription: "Allow Face ID to authenticate users with Apple Sign-In",
        },
        entitlements: {
          "com.apple.developer.applesignin": ["Default"], // Correct Apple Sign-In entitlement
        },
      },
      extra: {
        eas: {
          projectId: "66105bd1-c84f-40e8-a73a-6bc3bd09365d"
        }
      }
    }
    
};
  