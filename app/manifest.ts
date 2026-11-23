import type { MetadataRoute } from 'next';

// Lets browsers install the site as an app / desktop shortcut with the Agua Del Pedregal icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Agua Del Pedregal',
    short_name: 'Agua Del Pedregal',
    description: 'Agua mineral natural sin gas: botellas, botellones y bidones con entrega en Maldonado, Montevideo y Canelones.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBFBFD',
    theme_color: '#1e3a8a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
