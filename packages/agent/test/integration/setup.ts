import { ChildProcess, spawn } from "child_process";
import { setTimeout } from "timers/promises";

let serverProcess: ChildProcess | null = null;
const TEST_PORT = 3002;
const TEST_API_KEY = process.env.AGENT_API_KEY || "bluepilot_test_key_12345";

export async function startTestServer(): Promise<void> {
  if (serverProcess) {
    console.log("Test server already running");
    return;
  }

  return new Promise((resolve, reject) => {
    serverProcess = spawn("node", ["dist/index.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        AGENT_PORT: TEST_PORT.toString(),
        NODE_ENV: "test",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let started = false;

    serverProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      if (output.includes("Server running") && !started) {
        started = true;
        setTimeout(500).then(() => resolve());
      }
    });

    serverProcess.stderr?.on("data", (data) => {
      console.error("Server error:", data.toString());
    });

    serverProcess.on("error", (error) => {
      reject(error);
    });

    serverProcess.on("exit", (code) => {
      if (!started) {
        reject(new Error(`Server exited with code ${code}`));
      }
      serverProcess = null;
    });

    setTimeout(5000).then(() => {
      if (!started) {
        reject(new Error("Server failed to start within 5 seconds"));
      }
    });
  });
}

export async function stopTestServer(): Promise<void> {
  if (!serverProcess) return;

  return new Promise((resolve) => {
    serverProcess!.on("exit", () => {
      serverProcess = null;
      resolve();
    });

    serverProcess!.kill("SIGTERM");

    setTimeout(2000).then(() => {
      if (serverProcess) {
        serverProcess.kill("SIGKILL");
      }
      resolve();
    });
  });
}

export async function makeRequest<T = any>(
  endpoint: string,
  body?: any,
  method: string = "POST"
): Promise<T> {
  const url = `http://localhost:${TEST_PORT}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": TEST_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }

  return response.json();
}

export function getTestPort(): number {
  return TEST_PORT;
}

export function getTestApiKey(): string {
  return TEST_API_KEY;
}
