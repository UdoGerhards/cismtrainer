#!/usr/bin/env node

const { spawn } = require("child_process");
const https = require("https");

function openUrl(url) {
  const platform = process.platform;
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else if (platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}

// Starte expo (über npx, falls keine globale expo-cli installiert ist)
const env = Object.assign({}, process.env, { BROWSER: "none" });
const expo = spawn("npx", ["expo", "start", "--web", "--localhost", "--https"], {
  stdio: "inherit",
  shell: false,
  env,
});

// Poll auf erreichbare https://web.localhost (selbstsigniertes Zertifikat erlaubt)
const target = "https://web.localhost";
const agent = new https.Agent({ rejectUnauthorized: false });

let opened = false;
const check = () => {
  const req = https.request(target, { method: "HEAD", agent, timeout: 2000 }, (res) => {
    if (!opened && res.statusCode && res.statusCode < 400) {
      opened = true;
      openUrl(target);
    }
  });
  req.on("error", () => {});
  req.on("timeout", () => req.destroy());
  req.end();
};

const interval = setInterval(check, 1500);

// Cleanup bei Exit
function shutdown() {
  clearInterval(interval);
  try { expo.kill(); } catch (e) {}
  process.exit();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
