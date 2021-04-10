const { app, BrowserWindow, dialog } = require("electron");
const fs = require("fs");

function createWindow () {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		icon: "logo.ico",
		webPreferences: {
			nodeIntegration: true
		}
	});

	mainWindow.loadFile("index.html");
	process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true; // Security warnings creates annoying warning about HTTP. We're using HTTP to support older browsers. So we better off with just suppressing those warnings.
	if (process.argv.indexOf("--debug") !== -1)
		mainWindow.webContents.openDevTools();
	mainWindow.removeMenu();
	mainWindow.maximize();

	// Insert dark theme CSS
	let cssPath = "css/dark.css";
	let css = fs.readFileSync(cssPath).toString();
	let toReplace = ":root"; // Replace root selector with .dark selector
	css = "body.dark" + css.substring(css.indexOf(toReplace) + toReplace.length, css.length);
	mainWindow.webContents.on("did-finish-load", () =>  {
		mainWindow.webContents.insertCSS(css).catch((reason => {
			dialog.showMessageBoxSync({
				message: `File "${path.normalize(__dirname + "/" + cssPath)}" either doesn't exist or corrupted.
				Please, download the program again.`
			});
			process.exit(1);
		}));
	});
}

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