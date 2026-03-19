import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
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
        ],
    },
};

export default nextConfig;
