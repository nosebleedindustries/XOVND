export default function sitemap() {
  const base = 'https://xovnd.com';
  const today = new Date().toISOString().split('T')[0];
  const pages = [
    { url: '/', priority: 1.0, changeFrequency: 'monthly' },
    { url: '/clvster', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/trials', priority: 0.8, changeFrequency: 'monthly' },
    { url: '/subscription', priority: 0.7, changeFrequency: 'monthly' },
    { url: '/support', priority: 0.6, changeFrequency: 'monthly' },
    { url: '/forum', priority: 0.6, changeFrequency: 'daily' },
    { url: '/walkthrough', priority: 0.5, changeFrequency: 'monthly' },
  ];
  return pages.map((p) => ({
    url: base + p.url,
    lastModified: today,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
