/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
const nextConfig = {
  poweredByHeader: false,
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
  // Old e-Clubhouse paths cannot redirect to us (third-party host); these cover
  // any inbound links that keep the same path shape after a domain move.
  async redirects() {
    return [
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/page-8.php", destination: "/about", permanent: true },
      { source: "/page-6.php", destination: "/about/leadership", permanent: true },
      { source: "/projects.php", destination: "/community-service", permanent: true },
      { source: "/contact.php", destination: "/contact", permanent: true },
      { source: "/calendar.php", destination: "/events", permanent: true },
      { source: "/page-9.php", destination: "/community-service#photos", permanent: true },
    ];
  },
};
export default nextConfig;
