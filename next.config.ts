import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
    output: 'standalone',
    async redirects() {
        return [
            {
                source: '/profile/addresses',
                destination: '/real-estate',
                permanent: true,
            },
            {
                source: '/profile/addresses/:path*',
                destination: '/real-estate/:path*',
                permanent: true,
            },
        ];
    },
    allowedDevOrigins: process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS?.split(',') ?? [],
    turbopack: {
        root: path.resolve(__dirname),
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000')
                    .hostname,
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            // Telegram CDN — аватары пользователей (photo_url мастеров)
            {
                protocol: 'https',
                hostname: '**.telegram.org',
            },
            {
                protocol: 'https',
                hostname: '**.t.me',
            },
        ],
    },
};

export default nextConfig;
