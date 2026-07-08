import type { NextConfig } from 'next';
import path from 'path';

const internalApiUrl = (process.env.INTERNAL_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const internalSlovoApiUrl = (process.env.INTERNAL_SLOVO_API_URL || 'http://localhost:3101').replace(
    /\/$/,
    '',
);

const nextConfig: NextConfig = {
    output: 'standalone',
    reactCompiler: true,
    async rewrites() {
        return {
            beforeFiles: [
                {
                    source: '/api/docs',
                    destination: `${internalApiUrl}/api/docs`,
                },
                {
                    source: '/api/docs/:path*',
                    destination: `${internalApiUrl}/api/docs/:path*`,
                },
                {
                    source: '/api/:path*',
                    destination: `${internalApiUrl}/:path*`,
                },
                {
                    source: '/smart-search/:path*',
                    destination: `${internalSlovoApiUrl}/:path*`,
                },
            ],
            afterFiles: [],
            fallback: [],
        };
    },
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
        unoptimized: process.env.NODE_ENV === 'development',
        // Прокси картинок МойСклад отдаёт относительный путь со своей query-строкой
        // (/api/moysklad/image?href=...) — по умолчанию оптимизатор Next.js блокирует
        // локальные src с query-параметрами, если явно не разрешить их здесь.
        localPatterns: [
            {
                pathname: '/api/moysklad/image',
            },
        ],
        remotePatterns: [
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
                hostname: 't.me',
            },
            {
                protocol: 'https',
                hostname: '**.t.me',
            },
        ],
    },
};

export default nextConfig;
