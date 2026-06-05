export const metadata = {
  title: 'SKVVELCH — Coming soon · XOVND',
  description: 'SKVVELCH synth by XOVND — coming soon.',
};

export default function SkvvelchPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0a07',
        padding: '24px',
      }}
    >
      <h1
        style={{
          fontFamily: "'Archivo Black', system-ui, sans-serif",
          color: '#ffe000',
          fontSize: 'clamp(44px, 11vw, 150px)',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: 0.95,
          margin: 0,
          textShadow: '0 0 40px rgba(255,224,0,0.45)',
        }}
      >
        Coming soon
      </h1>
    </main>
  );
}
