const { app, BrowserWindow, shell } = require("electron");
const remote = require("@electron/remote/main");
remote.initialize();
const integrate = require("leaflet-advanced-layer-system/ElectronIntegration");

function createWindow () {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		icon: "img/logo.ico",
		frame: false,
		titleBarStyle: 'customButtonsOnHover',
		webPreferences: {
			enableRemoteModule: true,
			nodeIntegration: true,
			contextIsolation: false,
		}
	});

	mainWindow.loadFile("index.html");
	process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true; // Security warnings creates annoying warning about HTTP. We're using HTTP to support older browsers. So we better off with just suppressing those warnings.
	if (process.argv.indexOf("-d") !== -1)
		mainWindow.webContents.openDevTools();
	mainWindow.removeMenu();
	mainWindow.maximize();
	remote.enable(mainWindow.webContents);
	integrate(mainWindow, {
		useToolbarAsFrame: true,
	});

	// Open links in a browser
	mainWindow.webContents.setWindowOpenHandler(details => {
		shell.openExternal(details.url);
		return {action: "deny"}
	})
}

app.commandLine.appendSwitch("enable-experimental-web-platform-features");

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow();

	app.on("activate", function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
	if (process.platform !== "darwin") app.quit();
});