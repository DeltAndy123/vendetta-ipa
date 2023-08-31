import { existsSync, rmSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";
import express from "express";
import { Octokit } from "octokit";
import { config } from "dotenv";
config();

const app = express();

const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

let baseDir = process.cwd();
if (!existsSync(join(baseDir, "install.sh"))) {
  if (existsSync(join(baseDir, "../", "install.sh"))) {
    baseDir = join(baseDir, "../");
  } else {
    console.error("install.sh not found");
    process.exit(1);
  }
}

function spawnAndLog(command: string, ...args: string[]) {
  const child = spawn(command, [...args], { cwd: baseDir });
  child.stdout.on("data", (data) => {
    console.log(data.toString());
  });
  child.stderr.on("data", (data) => {
    console.error(data.toString());
  });
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

let server: any;

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

async function main() {
  // Run install.sh
  await spawnAndLog("bash", "install.sh");

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
    },
  });
}

main();
