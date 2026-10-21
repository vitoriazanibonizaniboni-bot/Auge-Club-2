import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clubedoauge.jornada',
  appName: 'Clube do Auge',
  webDir: 'dist/public',
  backgroundColor: '#FBF7F1', // creme: faixa do relógio e da barra de baixo no iPhone
  // O app nativo carrega o site ao vivo (Vercel): tudo funciona de imediato
  // (ISA, Supabase, conteúdos) e as atualizações entram sem reenviar às lojas.
  // Para empacotar offline no futuro, remova o bloco "server" e use os arquivos de dist/public.
  server: {
    url: 'https://auge-club-2.vercel.app',
    cleartext: false,
  },
  ios: {
    // de ponta a ponta: a barra de abas desce ate o fim da tela, por baixo da
    // barrinha do home (antes ficava uma faixa de outra cor embaixo)
    contentInset: 'never',
    // marca lida pelo index.html para ligar o viewport-fit=cover so neste app
    appendUserAgent: 'AugeBordaABorda',
  },
};

export default config;
