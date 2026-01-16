/**
 * Server Manager Module
 *
 * Handles starting and stopping the generated Next.js site
 * for comparison purposes.
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

interface ServerStatus {
  running: boolean;
  url?: string;
  pid?: number;
}

// Track running server process
let serverProcess: ChildProcess | null = null;

/**
 * Check if a port is in use
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

/**
 * Wait for server to be ready by checking the URL
 */
async function waitForServer(
  url: string,
  maxAttempts: number = 30,
  intervalMs: number = 1000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok || response.status === 200) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

/**
 * Check if generated site is running
 */
export async function checkGeneratedSiteStatus(port: number = 3002): Promise<ServerStatus> {
  const inUse = await isPortInUse(port);
  const url = `http://localhost:${port}`;

  if (inUse) {
    // Verify it's actually responding
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok || response.status === 200) {
        return { running: true, url };
      }
    } catch {
      // Port in use but not responding to HTTP
    }
  }

  return { running: false };
}

/**
 * Start the generated Next.js site
 */
export async function startGeneratedSite(options: {
  websiteId: string;
  websitesDir: string;
  port?: number;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const { websiteId, websitesDir, port = 3002 } = options;
  const generatedDir = path.join(websitesDir, websiteId, 'generated');

  // Check if generated directory exists
  if (!fs.existsSync(generatedDir)) {
    return {
      success: false,
      error: `Generated directory not found: ${generatedDir}`,
    };
  }

  // Check if package.json exists
  const packageJsonPath = path.join(generatedDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return {
      success: false,
      error: 'Generated site not scaffolded. Run scaffold first.',
    };
  }

  // Check if node_modules exists
  const nodeModulesPath = path.join(generatedDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('Installing dependencies...');
    // Run npm install first
    const installResult = await runNpmInstall(generatedDir);
    if (!installResult.success) {
      return {
        success: false,
        error: `Failed to install dependencies: ${installResult.error}`,
      };
    }
  }

  // Check if server is already running on the port
  const status = await checkGeneratedSiteStatus(port);
  if (status.running) {
    console.log(`Generated site already running at ${status.url}`);
    return { success: true, url: status.url };
  }

  // Start the server
  console.log(`Starting generated site at http://localhost:${port}...`);

  return new Promise((resolve) => {
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: generatedDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      detached: false,
    });

    let startupOutput = '';

    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      startupOutput += output;
      console.log('[Generated Site]', output.trim());
    });

    serverProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      startupOutput += output;
      // Next.js outputs some info to stderr
      if (!output.includes('warn') && !output.includes('ready')) {
        console.error('[Generated Site Error]', output.trim());
      }
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      resolve({
        success: false,
        error: `Failed to start server: ${error.message}`,
      });
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Server exited with code ${code}`);
      }
      serverProcess = null;
    });

    // Wait for server to be ready
    const url = `http://localhost:${port}`;
    waitForServer(url, 30, 1000)
      .then((ready) => {
        if (ready) {
          console.log(`Generated site ready at ${url}`);
          resolve({ success: true, url });
        } else {
          resolve({
            success: false,
            error: 'Server started but not responding. Check the logs.',
          });
        }
      })
      .catch((error) => {
        resolve({
          success: false,
          error: `Error waiting for server: ${error.message}`,
        });
      });
  });
}

/**
 * Stop the generated site server
 */
export function stopGeneratedSite(): void {
  if (serverProcess) {
    console.log('Stopping generated site server...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

/**
 * Run npm install in a directory
 */
async function runNpmInstall(
  dir: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const installProcess = spawn('npm', ['install'], {
      cwd: dir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let errorOutput = '';

    installProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    installProcess.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    installProcess.on('exit', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: errorOutput || `npm install exited with code ${code}`,
        });
      }
    });
  });
}
