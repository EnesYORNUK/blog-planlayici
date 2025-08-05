const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Geliştirme modunda DevTools'u aç
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets/icon.png');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Uygulamayı Aç', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Çıkış', click: () => app.quit() }
  ]);
  
  tray.setToolTip('Blog Planlayıcı');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    mainWindow.show();
  });
}

// Basit güncelleme kontrolü
function checkForUpdates() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Güncelleme Kontrolü',
    message: 'Güncellemeler için GitHub sayfasını ziyaret edin: https://github.com/EnesYORNUK/blog-planlayici/releases',
    buttons: ['Tamam']
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC olayları
ipcMain.handle('check-updates', () => {
  checkForUpdates();
});

ipcMain.handle('minimize-to-tray', () => {
  mainWindow.hide();
});

ipcMain.handle('show-window', () => {
  mainWindow.show();
}); 