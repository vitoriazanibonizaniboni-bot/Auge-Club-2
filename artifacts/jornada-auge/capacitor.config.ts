import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clubedoauge.jornada',
  appName: 'Jornada AUGE',
  webDir: 'dist/public',
  backgroundColor: '#1A1712',
  // O app nativo carrega o site ao vivo (Vercel): tudo funciona de imediato
  // (ISA, Supabase, conteúdos) e as atualizações entram sem reenviar às lojas.
  // Para empacotar offline no futuro, remova o bloco "server" e use os arquivos de dist/public.
  server: {
    url: 'https://auge-club-2.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
