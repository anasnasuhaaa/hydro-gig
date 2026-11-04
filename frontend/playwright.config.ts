import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command:
        ".venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8100",
      cwd: resolve(__dirname, "../backend"),
      url: "http://localhost:8100/health",
      reuseExistingServer: false,
      env: {
        DATABASE_URL: "",
        DIRECT_DATABASE_URL: "",
        CORS_ORIGINS: "http://localhost:3100",
      },
    },
    {
      command: "pnpm start --hostname 127.0.0.1 --port 3100",
      env: { NEXT_DIST_DIR: ".next-e2e" },
      url: "http://localhost:3100",
      reuseExistingServer: false,
    },
  ],
});
