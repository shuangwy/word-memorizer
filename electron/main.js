const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 1000,
        icon: path.join(__dirname, '../build/avatar_emoji.icns'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 确保路径正确
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // 打包后加载 browser 目录下的 index.html
    win.loadFile(path.join(__dirname, '../dist/word-memorizer/browser/index.html'));

    win.webContents.on('did-finish-load', () => {
        win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [
                        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';",
                    ],
                },
            });
        });
    });
    // 打开浏览器开发者工具
    // win.webContents.openDevTools();
    const fs = require('fs');
    const iconPath = path.join(__dirname, '../build/avatar_emoji.icns');
    if (fs.existsSync(iconPath)) {
        console.log('Icon file exists:', iconPath);
    } else {
        console.error('Icon file not found:', iconPath);
    }
}

app.whenReady().then(() => {
    const iconPath = path.join(__dirname, '../build/avatar_emoji.icns');
    try {
        app.dock.setIcon(iconPath);
    } catch (err) {
        console.error('Failed to set dock icon:', err);
    }
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});