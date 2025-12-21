/* eslint-disable no-console */
const { spawnSync } = require("child_process");
import dotenv from "dotenv";
dotenv.config();
const MAX_RETRIES = Number(process.env.MIGRATE_RETRIES || 8);
const BASE_DELAY_MS = Number(process.env.MIGRATE_DELAY_MS || 3000);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function runMigrateOnce() {
  // استخدم prisma من node_modules لضمان نفس النسخة
  const prismaBin =
    process.platform === "win32"
      ? "node_modules\\.bin\\prisma.cmd"
      : "node_modules/.bin/prisma";

  const res = spawnSync(prismaBin, ["migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });

  return res.status === 0;
}

(async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\n[db] prisma migrate deploy (attempt ${attempt}/${MAX_RETRIES})`);
    const ok = runMigrateOnce();
    if (ok) {
      console.log("[db] migrations applied successfully");
      process.exit(0);
    }

    const delay = BASE_DELAY_MS * attempt; 
    console.log(`[db] migrate failed; retrying in ${delay}ms...`);
    await sleep(delay);
  }

  console.error("[db] migrate failed after maximum retries");
  process.exit(1);
})();
