const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;

// Otomatik güncelleme ayarları
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

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
    { label: 'Güncellemeleri Kontrol Et', click: checkForUpdates },
    { type: 'separator' },
    { label: 'Çıkış', click: () => app.quit() }
  ]);
  
  tray.setToolTip('Blog Planlayıcı');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    mainWindow.show();
  });
}

function checkForUpdates() {
  autoUpdater.checkForUpdates();
}

// Güncelleme olayları
autoUpdater.on('checking-for-update', () => {
  mainWindow.webContents.send('update-status', 'Güncellemeler kontrol ediliyor...');
});

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Güncelleme Mevcut',
    message: `Yeni sürüm ${info.version} mevcut. İndiriliyor...`,
    buttons: ['Tamam']
  });
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', () => {
  mainWindow.webContents.send('update-status', 'Güncelleme yok');
});

autoUpdater.on('error', (err) => {
  mainWindow.webContents.send('update-status', `Güncelleme hatası: ${err.message}`);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow.webContents.send('update-progress', progressObj);
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Güncelleme Hazır',
    message: 'Güncelleme indirildi. Uygulama yeniden başlatılacak.',
    buttons: ['Tamam']
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  
  // İlk açılışta güncelleme kontrolü
  setTimeout(() => {
    checkForUpdates();
  }, 3000);
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