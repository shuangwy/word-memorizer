const { contextBridge } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

console.log('Preload script loaded');
console.log('fs-extra:', fs);

contextBridge.exposeInMainWorld('electronAPI', {
    writeFile: (arrayBuffer) => {
        const tempPath = path.join(os.tmpdir(), '../cihuibiao.pdf');
        fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));
        return tempPath;
    },
    unlinkFile: (filePath) => {
        fs.unlinkSync(filePath);
    },
    pathJoin: (dir, fileName) => {
        return path.join(dir, fileName);
    },
});