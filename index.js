import {error} from './error.js'
import { FileManager } from './file-manager.js';

const username = process.argv.slice(2).find(arg => arg.startsWith('--username=')).split('=')[1] || 'defaultUser';

const fileManager = new FileManager(username);

process.stdin.setEncoding("utf-8");

process.stdin.on('data', async (data) => {
    const [command, ...args] = data.split(" ").map((item) => item.trim());
    const fn = fileManager.commands[command];
    if (!fn) {
        error.invalid(true);
        return;
    }
    
    try {
        await fn(...args);
        fileManager.currentDirectory();
    } catch {
        error.failed();
    }
})

process.on('SIGINT', () => {
    process.stdout.write(`\n> Thank you for using File Manager, ${username}, goodbye!`);
    process.exit()
})
