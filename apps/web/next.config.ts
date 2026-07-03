import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

// Not using `output: standalone` — Next's file tracer misses Payload's
// dynamically-required sqlite driver (libsql). The Docker image ships prod
// node_modules instead (see apps/web/Dockerfile).
const nextConfig: NextConfig = {};

export default withPayload(nextConfig);
