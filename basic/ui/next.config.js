/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		appDir: true,
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: "http://127.0.0.1:4501/:path*",
			},
		];
	},
};

module.exports = nextConfig;
