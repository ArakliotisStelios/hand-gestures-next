/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    //svg from cms https://medium.com/@niniroula/nextjs-upgrade-next-image-and-dangerouslyallowsvg-c934060d79f8
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.codepen.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
