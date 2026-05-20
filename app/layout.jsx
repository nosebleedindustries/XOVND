import './globals.css';

export const metadata = {
  title: 'XOVND — Tools for sound',
  description: 'XOVND builds tools for sound. CLVSTER — stochastic polyalgorithmic sequencer. Plugins for Ableton, FL Studio, Bitwig, Logic, Reaper.',
  metadataBase: new URL('https://xovnd.com'),
  openGraph: {
    title: 'XOVND — Tools for sound',
    description: 'Stochastic polyalgorithmic sequencer plugin + more.',
    url: 'https://xovnd.com',
    siteName: 'XOVND',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
