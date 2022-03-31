const { app, BrowserWindow, shell, session } = require("electron");
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

	// Fix OSM denying requests from Electron. Headers are what Chrome on my machine sends.
	session.defaultSession.webRequest.onBeforeSendHeaders({urls: ["http://*.tile.openstreetmap.org/*"]}, (details, callback) => {
		details.requestHeaders["Referer"] = "https://matafokka.github.io/";
		details.requestHeaders["sec-ch-ua"] = '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"';
		details.requestHeaders["sec-ch-ua-mobile"] = "?0";
		details.requestHeaders["sec-ch-ua-platform"] = "Windows";
		details.requestHeaders["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36";
		callback({ requestHeaders: details.requestHeaders });
	});

	// Security warnings creates annoying warning about HTTP. We're using HTTP to support older browsers.
	// So we better off with just suppressing those warnings.
	process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

	mainWindow.loadFile("index.html");
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