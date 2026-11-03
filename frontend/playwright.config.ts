import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command:
        ".venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000",
      cwd: resolve(__dirname, "../backend"),
      url: "http://localhost:8000/health",
      reuseExistingServer: !process.env.CI,
      env: { DATABASE_URL: "", DIRECT_DATABASE_URL: "" },
    },
    {
      command: "pnpm start --hostname 127.0.0.1",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
