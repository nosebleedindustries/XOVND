export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/admin', '/api', '/auth'] },
    ],
    sitemap: 'https://xovnd.com/sitemap.xml',
  };
}
