// Dev seed: placeholder profile + the 3 portfolio entries the owner confirmed.
// Idempotent (skips entries whose slug already exists). Run: pnpm --filter web seed
// Real content is edited in /admin; this just makes Stage C render locally.
import { getPayload } from "payload";
import config from "../src/payload.config";

const lex = (text: string) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children: [
      {
        type: "paragraph",
        version: 1,
        format: "",
        indent: 0,
        direction: "ltr" as const,
        textFormat: 0,
        textStyle: "",
        children: [
          {
            type: "text",
            text,
            format: 0,
            style: "",
            mode: "normal",
            detail: 0,
            version: 1,
          },
        ],
      },
    ],
  },
});

const entries = [
  {
    title: "Telegram Cloud Drive",
    slug: "telegram-cloud-drive",
    entryType: "project",
    featured: true,
    priorityScore: 50,
    isOngoing: true,
    startDate: "2025-01-01T00:00:00.000Z",
    role: "Creator & maintainer",
    summary:
      "Self-hosted cloud storage that uses a private Telegram channel as the backend, with a Next.js dashboard and PostgreSQL metadata index.",
    body: lex(
      "A four-process system: a Next.js dashboard, a FastAPI service, a Telegram indexer, and a background media worker. Supports resumable uploads, HTTP range video streaming with disk caching, and daily encrypted backups. (Placeholder — edit in /admin.)",
    ),
    techStack: ["TypeScript", "Next.js", "Python", "FastAPI", "PostgreSQL", "Docker"],
    links: [
      { label: "Live demo", url: "https://cloud-drive-telegram.vercel.app", kind: "demo" },
      { label: "GitHub", url: "https://github.com/TNCP06/Cloud-Drive-Telegram", kind: "github" },
    ],
    _status: "published",
  },
  {
    title: "Toll-Gate Monitoring & Traffic Analytics",
    slug: "sistem-monitoring-palang-tol",
    entryType: "project",
    organization: "Politeknik Negeri Malang — Group 5",
    featured: true,
    priorityScore: 45,
    startDate: "2025-01-01T00:00:00.000Z",
    role: "Firmware, MQTT architecture, Python backend, Hadoop pipeline",
    summary:
      "IoT toll-gate system: ESP32 + RFID at the edge, MQTT over HiveMQ Cloud, a Python subscriber on AWS with DynamoDB/S3, and a Hadoop MapReduce analytics pipeline.",
    body: lex(
      "My scope: ESP32 firmware (RFID, ultrasonic, servo), the MQTT topic design over HiveMQ (TLS), a Python subscriber running as a systemd service on EC2 with balance/tariff business logic, DynamoDB + S3 storage, and a 4-node Hadoop MapReduce pipeline (traffic, access, revenue). Also authored the IEEE-830 SKPL and an active-active HA design. (Placeholder — edit in /admin.)",
    ),
    techStack: ["ESP32", "MQTT", "HiveMQ", "Python", "AWS", "DynamoDB", "Hadoop", "Next.js"],
    links: [
      { label: "Live demo", url: "https://sistem-monitoring-palang-tol-one.vercel.app", kind: "demo" },
      { label: "GitHub", url: "https://github.com/sirfara12/SISTEM-MONITORING-PALANG-TOL-", kind: "github" },
    ],
    _status: "published",
  },
  {
    title: "Profile Switcher",
    slug: "profile-switcher",
    entryType: "project",
    featured: false,
    priorityScore: 40,
    role: "Creator",
    summary:
      "Chrome/Brave extension that switches accounts instantly via cookie snapshots, stored locally with no backend (Manifest V3).",
    body: lex(
      "Captures and restores authentication cookies as named session snapshots, with incognito support, domain-variant handling, and skip patterns for non-portable cookies. Service-worker architecture, Manifest V3. (Placeholder — edit in /admin.)",
    ),
    techStack: ["JavaScript", "Chrome Extensions API", "Manifest V3"],
    links: [
      { label: "GitHub", url: "https://github.com/TNCP06/profile-switcher", kind: "github" },
    ],
    _status: "published",
  },
];

const run = async (): Promise<void> => {
  const payload = await getPayload({ config });

  await payload.updateGlobal({
    slug: "profile",
    data: {
      fullName: "Tionusa Catur Pamungkas",
      headline: "Backend developer building messaging, data, and cloud systems.",
      location: "Malang, Indonesia",
      availableForWork: true,
      bio: lex(
        "D4 Informatics Engineering student at Politeknik Negeri Malang, aiming at backend development with Node.js, Express, MySQL, Docker, and AWS. I build the parts users never see — APIs, data pipelines, and self-hosted infrastructure. (Placeholder bio — edit in /admin.)",
      ),
      socials: [{ label: "GitHub", url: "https://github.com/TNCP06", kind: "github" }],
    },
  });
  console.log("profile: updated");

  for (const data of entries) {
    const existing = await payload.find({
      collection: "portfolio-entries",
      where: { slug: { equals: data.slug } },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      console.log(`entry: skip ${data.slug} (exists)`);
      continue;
    }
    await payload.create({
      collection: "portfolio-entries",
      data: data as never,
    });
    console.log(`entry: created ${data.slug}`);
  }

  console.log("seed done");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
