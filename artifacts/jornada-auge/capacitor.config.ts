import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clubedoauge.jornada',
  appName: 'Jornada AUGE',
  webDir: 'dist/public',
  backgroundColor: '#1A1712',
  ios: {
    contentInset: 'always',
  },
};

export default config;
