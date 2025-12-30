import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.869f6244fef84967a5e1a3413f6607ef',
  appName: 'imagi-craft-game',
  webDir: 'dist',
  server: {
    url: 'https://869f6244-fef8-4967-a5e1-a3413f6607ef.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F172A',
      showSpinner: false
    }
  }
};

export default config;
