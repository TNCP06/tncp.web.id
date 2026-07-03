import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" is added in Stage E for the Docker image.
};

export default withPayload(nextConfig);
