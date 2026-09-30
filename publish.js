#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// L'indirizzo pubblico del servizio condiviso, in un file che l'app legge da
// sola. bore.pub assegna una porta nuova a ogni riavvio del tunnel, quindi la
// porta non puo' stare dentro l'app: starebbe ferma mentre l'indirizzo cambia.
//
// Usage:
//   node publish.js --port 12345 [--host bore.pub] [--tls] [--fingerprint SHA256] [--commit]
//   node publish.js --output "Listening on bore.pub:12345" [--commit]

const ROOT = __dirname;
const JSON_FILE = path.join(ROOT, 'endpoint.json');
const MD_FILE = path.join(ROOT, 'endpoint.md');

// "Listening on bore.pub:12345" -> { host, port }
function fromOutput(text) {
  const match = String(text || '').match(/([A-Za-z0-9._-]+):(\d{2,5})/);
  if (!match) return null;
  return { host: match[1], port: Number(match[2]) };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--commit') out.commit = true;
    else if (arg === '--tls') out.tls = true;
    else if (arg === '--host') out.host = argv[++i];
    else if (arg === '--port') out.port = argv[++i];
    else if (arg === '--fingerprint') out.fingerprint = argv[++i];
    else if (arg === '--output') out.output = argv[++i];
  }
  return out;
}

function build(args) {
  let host = args.host;
  let port = args.port ? Number(args.port) : 0;
  if (args.output) {
    const found = fromOutput(args.output);
    if (!found) throw new Error('no host:port in the output');
    host = host || found.host;
    port = port || found.port;
  }
  if (!host || !port || port < 1 || port > 65535) {
    throw new Error('need a host and a port (1-65535)');
  }
  return {
    updatedAt: new Date().toISOString(),
    host,
    port,
    tls: args.tls === true,
    fingerprint: args.fingerprint || ''
  };
}

function renderJson(endpoint) {
  return JSON.stringify(endpoint, null, 2) + '\n';
}

function renderMd(endpoint) {
  return [
    '# Current endpoint',
    '',
    'The app reads `endpoint.json`; this file is for people.',
    '',
    '- Updated: ' + endpoint.updatedAt,
    '- Host: ' + endpoint.host,
    '- Port: ' + endpoint.port,
    '- TLS: ' + (endpoint.tls ? 'yes' : 'no'),
    '- Certificate fingerprint: ' + (endpoint.fingerprint || '(none)'),
    '',
    'The address changes whenever the tunnel is restarted, so it is written by',
    '`publish.js` and never by hand.',
    ''
  ].join('\n');
}

function write(endpoint) {
  fs.writeFileSync(JSON_FILE, renderJson(endpoint));
  fs.writeFileSync(MD_FILE, renderMd(endpoint));
}

function commitAndPush(endpoint) {
  execFileSync('git', ['add', 'endpoint.json', 'endpoint.md'], { cwd: ROOT });
  execFileSync('git', ['commit', '-m',
    'Publish the endpoint ' + endpoint.host + ':' + endpoint.port], { cwd: ROOT });
  execFileSync('git', ['push'], { cwd: ROOT });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const endpoint = build(args);
  write(endpoint);
  console.log(renderJson(endpoint).trim());
  if (args.commit) commitAndPush(endpoint);
}

if (require.main === module) main();

module.exports = { parseArgs, fromOutput, build, renderJson, renderMd };
