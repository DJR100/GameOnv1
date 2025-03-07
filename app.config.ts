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
      }
    }
  };
  