import os from 'os';
import { error } from './error.js';

export function getOsInfo(param) {
    try {
        switch (param) {
            case '--EOL':
                getEOL();
                break;
            case '--cpus':
                getCPUs();
                break
            case '--homedir':
                getHomeDirectory();
                break;
            case '--username':
                getUserName();
                break;
            case '--architecture':
                getArchitecture();
                break;
        }
    } catch {
        error.invalid()
    }
} 

function getEOL() {
    process.stdout.write(
        `${JSON.stringify(os.EOL)} \n`
    );
}

function getCPUs() {
    const cpus = os.cpus();
    console.log(`Number of CPUs: ${cpus.length}`);
    cpus.forEach((cpu, index) => {
      process.stdout.write(
        `CPU ${index + 1}: Model: ${cpu.model}, Speed: ${(cpu.speed / 1000).toFixed(2)} GHz\n`
      );
    });
}

function getHomeDirectory() {
    process.stdout.write(`Home Directory: ${os.homedir()} \n`);
  }
  
function getUserName() {
    const userInfo = os.userInfo();
    process.stdout.write(`Username: ${userInfo.username} \n`);
}

function getArchitecture() {
    process.stdout.write(`CPU Architecture: ${os.arch()} \n`);
}