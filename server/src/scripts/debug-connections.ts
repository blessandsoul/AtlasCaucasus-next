import net from 'net';
import { env } from '../config/env.js';

async function checkPort(host: string, port: number, name: string) {
    return new Promise<void>((resolve) => {
        console.log(`Testing connection to ${name} at ${host}:${port}...`);
        const socket = new net.Socket();

        socket.setTimeout(2000); // 2 second timeout

        socket.on('connect', () => {
            console.log(`✅ SUCCESS: Connected to ${name} at ${host}:${port}`);
            socket.destroy();
            resolve();
        });

        socket.on('timeout', () => {
            console.log(`❌ TIMEOUT: Could not connect to ${name} at ${host}:${port}`);
            socket.destroy();
            resolve();
        });

        socket.on('error', (err) => {
            console.log(`❌ ERROR: Failed to connect to ${name} at ${host}:${port} - ${err.message}`);
            resolve();
        });

        socket.connect(port, host);
    });
}

async function run() {
    console.log('--- Network Connectivity Test ---');
    console.log(`Env Config: DB=${env.DB_HOST}:${env.DB_PORT}, Redis=${env.REDIS_HOST}:${env.REDIS_PORT}`);

    await checkPort(env.DB_HOST, env.DB_PORT, 'MySQL (Prisma)');
    await checkPort(env.REDIS_HOST, env.REDIS_PORT, 'Redis');
    await checkPort('127.0.0.1', 3307, 'MySQL (Hardcoded 127.0.0.1:3307)');
    await checkPort('localhost', 3307, 'MySQL (Hardcoded localhost:3307)');
}

run().catch(console.error);
