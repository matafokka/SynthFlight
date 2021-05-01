# SynthFlight Alpha

SynthFlight is a fully client-side software for planning aerial photography. Run it either on the desktop or in a [browser online](https://matafokka.github.io/SynthFlight/).

This is a alpha version, so expect bugs, crashes, errors, missing functions, API changes, etc.

For now, it only can plan photography by a graticule or grid. However, planning by custom polygons or flight paths is on its way.

SynthFlight also features an advanced extendable layer system for Leaflet that will be released as a separate package when it'll be ready.

You can use layers to try and compare different parameters to choose which ones suites you best.

# Installation

You don't need to install it, just [use it online](https://matafokka.github.io/SynthFlight/). However, if you want to have a local copy:

1. Download the [latest build](https://github.com/matafokka/SynthFlight/releases/latest) for the browser *(if you plan to use it in a browser)* or for your OS and platform *(if you want a standalone application)*.
1. Extract the downloaded archive wherever you want.
1. Run SynthFlight:
    1. If you've downloaded the browser build, open `index.html` file.
    1. Otherwise, navigate to the extracted folder, open it and run `SynthFlight` executable file.

***Warning:** only browser and Windows x64 builds has been tested so far.*

***Warning:** macOS builds are not signed.*

# Usage

After running SynthFlight, you can see:
1. **Zoom buttons** in the top left corner. You can also zoom by rotating a mouse wheel.
1. **Current cursor position** in the bottom left corner.
1. **Menu button** in the top right corner.

In the menu, you can:
1. Close the menu by clicking **"x" button** on the top of the menu.
1. Change map provider in the **drop-down menu** on the top of the menu.
1. Add a new layer by clicking **"+" button** on the top of the menu. A **wizard menu** will show up containing:
    1. **Drop-down menu** where you can select layer type to add.
    1. Layer-specific controls.
    1. **Cancel button** to cancel creating new layer.
    1. **Add button** to confirm adding layer.
1. Remove selected layer by clicking **button with the trash icon** on the top of the menu.
1. Work with layers:
    1. To select a layer, click on it.
    1. Open or close a layer menu by clicking **button with the gear icon**.
    1. Change layer's settings by using controls in a menu. Each layer type has its own menu.
    1. Hide or show a layer by clicking button with the **eye icon**.
    1. Reorder layer by dragging the button with the **arrows icon**.
1. Export project to GeoJSON by clicking "Export" button at the bottom of the menu. Warning: other buttons do not work for now.

# System requirements

If you want to run the **client**:

* **Operating system**: one of:
    * **Windows 7** or later. ARM64, x86 and x64 platforms are supported.
    * **Linux** with X-Server installed (basically all of the modern distros). ARM32, ARM64, x86 and x64 platforms are supported.
    * **macOS**. I have no idea which versions are supported. Try and see if it works.
* **CPU**: One that can handle web surfing. If you can browse the internet, SynthFlight will work fine.
* **RAM**: 1 GB or more.

If you want to run from **browser**: one of:

* Chrome 7 or later.
* Firefox 22 or later.
* Internet Explorer 9 or later.
* Any other modern desktop or mobile browser.

***Note 1.*** *Outdated Chromium-based browsers have a "feature" that prevents FileReader from reading local files. If you're using such browser, please, either host SynthFlight on a web server or add ` --allow-file-access-from-files` flag when running browser.*

***Note 2:*** *Some of the outdated browsers can't download files normally. Please, update your browser for better user experience.*

# Building

If you want to build SynthFlight yourself, do the following:

1. Install [NodeJS](https://www.nodejs.org).
1. Download the source code and `cd` to the project's root.
1. Download dependencies by running `npm install`.
1. Build by running `node build.js`. There are additional options, to see them, run `nodejs build.js -h`.
1. When build will be finished, in project root will be `dist` directory containing builds for different OSs and platforms.

***Warning:** To build for macOS, you may need to build on an actual macOS.*

# Hosting

You can easily host SynthFlight on your server:
1. Since SynthFlight is a fully client-side software, you can use your favorite HTTP server. So go ahead and install it.
1. Download the `browser` build or build SynthFlight for the browser manually.
1. Configure your server to serve `index.html` file in that build.

# Contributing

There's a "Development" branch which you can fork and commit to. If you plan to contribute to this project, please, notify me before doing so because I might be working on a big feature and not commit until it's ready. I'll commit more often if someone will work with me.

If you speak any language other than Russian or English, you can help with the translation. Locales are located at `js/LeafletAdvancedLayerSystem/locales` and `js/SynthFlightModules/locales` directories. Locales are plain JS objects where key is being used in the program itself and value is a string that's being added to the page. Only values needs translation. Copy one of the locales to a new file, change locale name and translate all the values.

You can also contribute by reporting bugs, requesting API changes, new functionality or something else. Please, create an issue and describe your request.

# FAQ

## Can a local copy work offline?
Yes.

## Why did you release such an unstable version?
To pass a subject.

## Will this project will ever be finished?
Yes, because it's my master's degree.
