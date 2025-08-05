const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
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

// Otomatik güncelleme sistemi
function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();
}

// Güncelleme olayları
autoUpdater.on('checking-for-update', () => {
  console.log('Güncelleme kontrol ediliyor...');
});

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Güncelleme Mevcut',
    message: `Yeni sürüm mevcut: ${info.version}\nGüncelleme indiriliyor...`,
    buttons: ['Tamam']
  });
});

autoUpdater.on('update-not-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Güncelleme Kontrolü',
    message: 'Uygulama güncel!',
    buttons: ['Tamam']
  });
});

autoUpdater.on('error', (err) => {
  dialog.showMessageBox(mainWindow, {
    type: 'error',
    title: 'Güncelleme Hatası',
    message: `Güncelleme hatası: ${err.message}`,
    buttons: ['Tamam']
  });
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`İndirme hızı: ${progressObj.bytesPerSecond}`);
  console.log(`İndirilen: ${progressObj.percent}%`);
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
  
  // Uygulama başladıktan 5 saniye sonra güncelleme kontrolü yap
  setTimeout(() => {
    checkForUpdates();
  }, 5000);
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