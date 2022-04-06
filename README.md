# SynthFlight Beta

SynthFlight is a fully client-side software for planning aerial photography. Run it either on the desktop or in a [browser online](https://matafokka.github.io/SynthFlight/).

This is a beta version, so bugs, huge API changes and lack of backwards compatibility are to be expected.

Most of the planned functionality is here, however, a number of small changes will be introduced.

A stable version will be released in May or June 2022.

# Setup

## Introduction

There are numerous ways to set up SynthFlight, listed from most to least preferred:

1. **PWA** - works offline, requires low storage space, updates are silent and fast.
1. [**Browser**](https://matafokka.github.io/SynthFlight/) - that's what SynthFlight is built for.
1. [**Desktop builds**](https://github.com/matafokka/SynthFlight/releases/latest) - works offline and has a nice UI, but requires ~100 Mb of storage. Useful for environments where PWAs are not available.
1. **Opening a local copy in a browser** - it works but might impose performance issues.
1. **Outdated browser** - ew, but SynthFlight [got you covered](#for-browser).

## Installing desktop builds

1. Download the [latest build](https://github.com/matafokka/SynthFlight/releases/latest) for your OS and platform.
1. Extract the downloaded archive wherever you want.
1. Navigate to the extracted folder, open it and run `SynthFlight` executable file.

***Warning 1:** only Windows x64 builds has been tested so far.*

***Warning 2:** macOS builds are not signed, thus require disabling the Gatekeeper or something.*

# System requirements

## For PWA

A browser that supports it.

## For browser

One of:

* Chrome 8 or later.
* Firefox 22 or later.
* Safari 6 or later.
* Internet Explorer 9 or later.
* Any other modern desktop or mobile browser.

**Problems with outdated browsers:**

1. Can't read files. Chromium-based browsers have a "feature" that prevents `FileReader` from reading local files. **How to solve:** run browser with `--allow-file-access-from-files` flag or [host SynthFlight](#hosting) on a custom server.
1. Can't save files. **How to solve:** update your browser.
1. App page doesn't load in legacy browsers (browser can't verify SSL certificate). **How to solve:** enable TLS 1.3 support in your browser or [host SynthFlight](#hosting) on a custom server using protocols and/or certificates that your browser supports.
1. OSM search doesn't work in browsers that doesn't support TLS >= 1.2. **How to solve:** update your browser. **For IE9**, you need to serve SynthFlight over HTTPS and make sure your users have TLS 1.2 support enabled.

Of course, requirements for TLS might change in future with the new TLS versions coming out and GitHub and OSM changing their policies. You can't prevent this from happening, the only thing you can do is using an evergreen browser.


## For desktop builds

* **Operating system** - one of:
    * **Windows 7** or later. ARM64, x86 and x64 platforms are supported.
    * **Linux** with X11 installed (basically all modern distros). ARM32, ARM64, x86 and x64 platforms are supported.
    * **macOS**. I have no idea which versions are supported. Try and see if it works. Also, these builds are not signed.
* **CPU**: One that can handle web surfing. If you can browse the internet, SynthFlight will work fine.
* **RAM**: 1 GB or more.

# Building

If you want to build SynthFlight yourself, do the following:

1. Install [NodeJS](https://www.nodejs.org).
1. Download the source code and `cd` to the project's root.
1. Download dependencies by running `npm install`.
1. Build by running `node build.js`. There are additional options, to see them, run `node build.js -h`.
1. When build will be finished, in project root will be `dist` directory containing builds for different OSs and platforms.

***Warning:** To build for macOS, you may need to build on an actual macOS.*

# Hosting

You can easily host SynthFlight on your server:
1. Since SynthFlight is a fully client-side software, you can use your favorite HTTP server. So go ahead and install it.
1. Download the `browser` build [from here](https://github.com/matafokka/SynthFlight/releases/latest) or [build SynthFlight](#building) for the browser manually.
1. Configure your server to serve `index.html` file in that build.

# Contributing

There's a [development](https://github.com/matafokka/SynthFlight/tree/development) branch which you can fork and commit to. If you plan to contribute to this project, please, notify me before doing so because I might be working on a big feature and not commit until it's ready. I'll commit more often if someone will work with me.

Translating this app will be much appreciated. SynthFlight locales can be found in [`locales`](https://github.com/matafokka/SynthFlight/tree/development/locales) directory and ALS locales are available [here](https://github.com/matafokka/leaflet-advanced-layer-system/tree/master/locales). Both of these needs to be translated. Locales are plain JS objects where key is being used in the program itself and value is a string that's being added to the page. Only values needs translation. Copy one of the locales to a new file, change locale name and translate all the values.

You can also contribute by reporting bugs, requesting API changes, new functionality or something else. Please, create an issue and describe your request.

# FAQ

## Can a local copy work offline?
Yes.

## Projects compatibility?

There will be no compatibility between SynthFlight versions until first stable release.

## When a stable release will be available?
May or June 2022
