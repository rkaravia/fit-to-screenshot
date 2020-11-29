const playwright = require("playwright");
const { fullLists, PlaywrightBlocker } = require("@cliqz/adblocker-playwright");
const fetch = require("node-fetch");

const iPhone11 = playwright.devices["iPhone 11 Pro"];
const viewport = { width: 375, height: 800 };

const waitAfterNetworkIdleSeconds = 10;

const tweaks = {
  "ubuntu-18.04_chromium_headless": {
    browserArgs: ["--font-render-hinting=none"],
  },
};

const adblockerRules = `
  www.nytimes.com##.gdpr
  ||mwcm.nytimes.com^$domain=www.nytimes.com
`;

async function capture(config, matrix) {
  const path = `output/${matrix}.png`;
  const blocker = await PlaywrightBlocker.fromLists(fetch, fullLists, {
    enableCompression: true,
  });
  blocker.updateFromDiff({ added: [adblockerRules] });

  const browserArgs = tweaks[matrix]?.args ?? [];
  const browser = await playwright[config.browserType].launch({
    args: browserArgs,
    headless: config.headfulness === "headless",
  });
  const page = await browser.newPage({
    deviceScaleFactor: 2,
    isMobile: config.browserType !== "firefox",
    hasTouch: true,
    userAgent: iPhone11.userAgent,
    viewport,
  });
  try {
    if (
      config.headfulness === "headful" ||
      (config.os === "windows-2019" && config.browserType === "webkit")
    ) {
      const { onRequest } = blocker;
      blocker.onRequest = async (route) => {
        blocker.onRequest = onRequest;
        const url = route.request().url();
        const response = await fetch(url, {
          headers: route.request().headers(),
        });
        const text = await response.text();
        const body = text.replace(
          "<head>",
          "<head><style>html, body { overflow: hidden !important; }</style>"
        );
        route.fulfill({ body, headers: response.headers.raw() });
      };
    }
    await blocker.enableBlockingInPage(page);

    // TODO detect redirect
    await page.goto("https://www.nytimes.com/", { waitUntil: "networkidle" });
    await page.waitForTimeout(waitAfterNetworkIdleSeconds * 1000);
    await page.screenshot({ clip: { x: 0, y: 0, ...viewport }, path });
  } catch (error) {
    console.error("Failed with error", error);
  }
  await browser.close();
  return path;
}

module.exports = capture;
