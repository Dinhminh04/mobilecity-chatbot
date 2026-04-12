/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_RASA_URL: process.env.NEXT_PUBLIC_RASA_URL || 'http://localhost:5005',
  },
}
module.exports = nextConfig
