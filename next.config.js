// next.config.js — substituir o arquivo existente
const withNextIntl = require('next-intl/plugin')('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  staticPageGenerationTimeout: 180,
}

module.exports = withNextIntl(nextConfig)
