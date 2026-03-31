import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pillarsofesteem.app',
  appName: 'Pillars of Esteem',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
