import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@google-cloud/storage",
    "google-auth-library",
    "gcp-metadata",
  ],
};

export default nextConfig;