#!/usr/bin/env node

/**
 * Do It Platform - Local Development Server Launcher
 * Starts backend, mobile (web), and website services in parallel
 */

const { spawn } = require('child_process');
const path = require('path');

const services = [
  {
    name: 'Backend API',
    dir: 'backend',
    command: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[36m', // Cyan
  },
  {
    name: 'Website (Next.js)',
    dir: 'web',
    command: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[35m', // Magenta
  },
  {
    name: 'Mobile App (Expo Web)',
    dir: 'mobile',
    command: 'npm',
    args: ['run', 'web'],
    color: '\x1b[33m', // Yellow
  },
];

const reset = '\x1b[0m';
const bold = '\x1b[1m';

console.log(`
${bold}${'\x1b[32m'}╔════════════════════════════════════════════════════════════╗${reset}
${bold}${'\x1b[32m'}║         Do It Platform - Development Server Launcher        ║${reset}
${bold}${'\x1b[32m'}╚════════════════════════════════════════════════════════════╝${reset}

${bold}Starting all services...${reset}
`);

const processes = [];

services.forEach((service) => {
  const projectPath = path.join(__dirname, service.dir);
  const proc = spawn(service.command, service.args, {
    cwd: projectPath,
    stdio: 'inherit',
    shell: true,
  });

  console.log(`${service.color}[${service.name}]${reset} Started (PID: ${proc.pid})`);
  processes.push({ name: service.name, process: proc });
});

console.log(`
${bold}Services running:${reset}
  🔧 Backend:  http://localhost:8080
  🌐 Website:  http://localhost:3000
  📱 Mobile:   http://localhost:19000

${bold}To stop all services, press Ctrl+C${reset}
`);

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log(`\n${bold}${'\x1b[31m'}Shutting down all services...${reset}\n`);

  processes.forEach(({ name, process: proc }) => {
    console.log(`${'\x1b[31m'}[${name}]${reset} Stopping...`);
    proc.kill('SIGTERM');
  });

  setTimeout(() => {
    console.log(`${bold}${'\x1b[32m'}All services stopped.${reset}\n`);
    process.exit(0);
  }, 1000);
});
