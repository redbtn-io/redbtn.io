import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@redbtn/red"],
  async headers() {
    // redbtn.io is the passkey relying party id for every redbtn app, so
    // native apps must be associated with THIS domain (see README,
    // "Passkey domain association"). The AASA has no file extension and
    // would otherwise be served as application/octet-stream.
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
