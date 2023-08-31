import { existsSync, rmSync } from "fs";
import { join } from "path";
import { exec as _exec, spawn } from "child_process";
import { promisify } from "util";
import express from "express";
import { Octokit } from "octokit";
import { config } from "dotenv";
import { IncomingMessage, Server, ServerResponse } from "http";
config();

const exec = promisify(_exec);

let latestVersion = "0.0";
let isDumping = false;
let server: Server<typeof IncomingMessage, typeof ServerResponse>;

if (process.env.IS_TEST) latestVersion = "1.0";

const app = express();

const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

let baseDir = process.cwd();
if (!existsSync(join(baseDir, "dump.py"))) {
  if (existsSync(join(baseDir, "../", "dump.py"))) {
    baseDir = join(baseDir, "../");
  } else {
    console.error("install.sh not found");
    process.exit(1);
  }
}

function spawnAndLog(command: string, ...args: string[]) {
  const child = spawn(command, [...args], { cwd: baseDir, stdio: "inherit" });
  return new Promise<void>((resolve, reject) => {
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
}

app.use("/discord.ipa", (req, res) => {
  console.log("Serving file...");
  res.sendFile(join(baseDir, "discord.ipa"));
});
app.use("/done", (req, res) => {
  console.log("Server stopping...");
  res.send("Done");
  server.close();

  console.log("Deleting file...");
  rmSync(join(baseDir, "discord.ipa"));
});

async function dumpApp() {
  isDumping = true;

  console.log("Uninstalling old app...");
  await spawnAndLog("ideviceinstaller", "-U", "com.hammerandchisel.discord");

  console.log("Downloading app...");
  await spawnAndLog(
    "ipatool",
    "download",
    "-b",
    "com.hammerandchisel.discord",
    "-o",
    "discord.ipa"
  );

  console.log("Installing app...");
  await spawnAndLog("ideviceinstaller", "-i", "discord.ipa");

  console.log("Cleaning up...");
  rmSync(join(baseDir, "discord.ipa"));

  console.log("Dumping app...");
  await spawnAndLog(
    "python3",
    "dump.py",
    "com.hammerandchisel.discord",
    "-p",
    process.env.PORT,
    "-H",
    process.env.IP,
    "-o",
    "discord.ipa"
  );

  console.log("Dumping finished");
  console.log("Uninstalling app...");
  spawnAndLog("ideviceinstaller", "-U", "com.hammerandchisel.discord");
  console.log("Serving file...");

  console.log("Starting server...");
  server = app.listen(process.env.SERVER_PORT, () => {
    console.log(`Server listening on port ${process.env.SERVER_PORT}`);
  });

  console.log("Starting workflow...");
  await github.rest.actions.createWorkflowDispatch({
    owner: process.env.GITHUB_REPO.split("/")[0],
    repo: process.env.GITHUB_REPO.split("/")[1],
    workflow_id: "build.yml",
    ref: "master",
    inputs: {
      ipa: process.env.SERVER_HOST,
      version: latestVersion,
    },
  });
  isDumping = false;
}

async function checkForUpdates() {
  const data = await exec('ipatool search "Discord - Chat, Talk"');

  const versionNumber = data.stdout.match(/(?<=version":")[\d\.]+/)?.[0];

  if (versionNumber && versionNumber !== latestVersion) {
    if (latestVersion == "0.0") {
      latestVersion = versionNumber;
      return;
    }
    if (isDumping) return console.log("Already dumping");
    latestVersion = versionNumber;

    console.log("New version found:", versionNumber);

    await dumpApp();
  }
}

checkForUpdates();

setInterval(checkForUpdates, 1000 * 60);
