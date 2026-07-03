import type { NextConfig } from "next";

// Payload is wired here in Stage B via withPayload().
// `output: "standalone"` is added in Stage E for the Docker image.
const nextConfig: NextConfig = {};

export default nextConfig;
