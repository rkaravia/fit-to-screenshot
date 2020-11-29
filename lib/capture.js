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
  await blocker.enableBlockingInPage(page);
  try {
    await page.goto("https://nytimes.com/", { waitUntil: "domcontentloaded" });
    if (
      config.headfulness === "headful" ||
      (config.os === "windows-2019" && config.browserType === "webkit")
    ) {
      await page.addStyleTag({
        content: "body { overflow: hidden !important; }",
      });
    }
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(waitAfterNetworkIdleSeconds * 1000);
    await page.screenshot({
      clip: { x: 0, y: 0, ...viewport },
      path,
    });
  } catch (error) {
    console.error("Failed with error", error);
  }
  await browser.close();
  return path;
}

module.exports = capture;
