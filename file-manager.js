import path from 'node:path';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import url from 'node:url';
import { error } from './error.js';
import { getOsInfo } from './os-manager.js';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export class FileManager {
    constructor(userName) {
        this.userName = userName || "Anonymous";
        this.currentPath = process.cwd();

        this.commands = {
            up: this.handleUp.bind(this),
            cd: this.handleCd.bind(this),
            ls: this.handleLs.bind(this),
            cat: this.handleCat.bind(this),
            add: this.handleAdd.bind(this),
            mkdir: this.handleMkdir.bind(this),
            rn: this.handleRename.bind(this),
            cp: this.handleCopy.bind(this),
            mv: this.handleMove.bind(this),
            rm: this.handleRemove.bind(this),
            os: this.handleOs.bind(this),
            hash: this.handleHash.bind(this),
            compress: this.handleCompress.bind(this),
            decompress: this.handleDecompress.bind(this),
        };
        this.sayHi();
        this.currentDirectory();
    }

    sayHi() {
        process.stdout.write(`\nWelcome to the File Manager, ${this.userName}!\n`);
    }

    currentDirectory() {
        process.stdout.write(`> You are currently in ${this.currentPath} \n> `);
    }

    handleUp() {
        this.currentPath = path.resolve(this.currentPath, "..");
    }

    handleCd(newPath) {
        const tempPath = path.resolve(this.currentPath, newPath);
        if (!fs.existsSync(tempPath)) {
            error.invalid();
        }
        this.currentPath = tempPath;
    }

    async handleLs() {
        try {
            const files = await fsPromises.readdir(this.currentPath, {
              withFileTypes: true,
            });
      
            const result = files
                .sort((a, b) => {
                    if (Number(b.isDirectory()) === Number(a.isDirectory())) {
                        return a.name.localeCompare(b.name);
                    }
                    return Number(b.isDirectory()) - Number(a.isDirectory());
                })
                .map((item) => ({
                    Name: item.name,
                    Type: item.isDirectory() ? "directory" : "file",
                }));
        
                console.log();
                console.table(result);
                process.stdout.write(`> `);          
        } catch (err) {
            error.failed();
        }
    }

    handleCat(fileName) {
        const filePath = path.join(this.currentPath, fileName);
        if (!fs.existsSync(filePath)) {
            error.invalid();
            return;
        }
        const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
        readStream.on('data', (chunk) => {
            process.stdout.write(chunk);
        });
        readStream.on('error', (err) => {
            error.failed();
        });
        readStream.on('end', () => {
            process.stdout.write('\n> ');
        });
    }

    handleAdd(fileName) {
        const filePath = path.join(this.currentPath, fileName);
        if (fs.existsSync(filePath)) {
            error.invalid();
            return;
        }
        const writeStream = fs.createWriteStream(filePath, { flags: 'a' });
        process.stdin.pipe(writeStream);
        writeStream.on('finish', () => {
            process.stdout.write('\n> ');
        });
    }

    handleMkdir(dirName) {
        const dirPath = path.join(this.currentPath, dirName);
        if (fs.existsSync(dirPath)) {
            error.invalid();
            return;
        }
        fs.mkdir(dirPath, { recursive: false }, (err) => {
            if (err) {
                error.failed();
                return;
            }        
        });
    }

    handleRename(oldName, newName) {
        const oldPath = path.join(this.currentPath, oldName);
        const newPath = path.join(this.currentPath, newName);
        if (!fs.existsSync(oldPath)) {
            error.invalid();
            return;
        }
        if (fs.existsSync(newPath)) {
            error.invalid();
            return;
        }
        fs.rename(oldPath, newPath, (err) => {
            if (err) {
                error.failed();
                return;
            }        
        });
    }   

    handleCopy(src, dest) {
        const srcPath = path.join(this.currentPath, src);
        const destPath = path.join(this.currentPath, dest);
        if (!fs.existsSync(srcPath)) {
            error.invalid();
            return;
        }
        if (!fs.existsSync(destPath)) {
            error.invalid();
            return;
        }
        fs.cp(srcPath, destPath, (err) => {
            if (err) {
                error.failed();
                return;
            }        
        });
    }

    handleRemove(fileName) {
        const filePath = path.join(this.currentPath, fileName);
        if (!fs.existsSync(filePath)) {
            error.invalid();
            return;
        }
        fs.unlink(filePath, (err) => {
            if (err) {
                error.failed();
                return;
            }        
        });
    }

    async handleMove(src, dest) {
        const oldF = path.resolve(this.currentPath, src)
        const newF = path.resolve(this.currentPath, dest, src.split('/').pop())
        if (!fs.existsSync(oldF)) {
            error.invalid();
            return;
        }
        if (!fs.existsSync(newF)) {
            error.invalid();
            return;
        }
        await pipeline(
            fs.createReadStream(oldF),
            fs.createWriteStream(newF, { flags: 'a' }),
        ).then(() => fsPromises.unlink(oldF));
    }

    handleOs(param) {
        return getOsInfo(param)
    }

    handleHash(fileName) {
        const filePath = path.resolve(this.currentPath, fileName);
        if (!fs.existsSync(filePath)) {
            error.invalid();
            return;
        }
        const hash = crypto.createHash('sha256');
        const readStream = fs.createReadStream(filePath);
        readStream.on('data', (chunk) => {
            hash.update(chunk);
        });
        readStream.on('end', () => {
            process.stdout.write(`${hash.digest('hex')} \n`);
        });
    }

    async handleCompress(src, dest) {
        const srcPath = path.resolve(this.currentPath, src);
        const destPath = path.resolve(this.currentPath, dest);

        await fsPromises.access(srcPath);

        await pipeline(
            fs.createReadStream(srcPath),
            zlib.createBrotliCompress(),
            fs.createWriteStream(destPath)
        );
    }

    async handleDecompress(src, dest) {
        const srcPath = path.resolve(this.currentPath, src);
        const destPath = path.resolve(this.currentPath, dest);

        await fsPromises.access(srcPath);

        await pipeline(
            fs.createReadStream(srcPath),
            zlib.createBrotliDecompress(),
            fs.createWriteStream(destPath)
        );
    }
}


