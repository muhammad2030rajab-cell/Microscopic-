import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { cormorant, sourcesans, amiri } from "./font-data.js";

const html = "/workspace/.grok/og-card.html";
const out = "/workspace/.grok/og-card-raw.png";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});
await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle", timeout: 30000 });
await page.addStyleTag({
  content: `
    @font-face {
      font-family: "CormorantGaramond";
      src: url(data:font/ttf;base64,${cormorant}) format("truetype");
      font-weight: 300 700;
      font-style: normal;
    }
    @font-face {
      font-family: "SourceSans3";
      src: url(data:font/ttf;base64,${sourcesans}) format("truetype");
      font-weight: 300 700;
      font-style: normal;
    }
    @font-face {
      font-family: "Amiri";
      src: url(data:font/ttf;base64,${amiri}) format("truetype");
      font-weight: 400;
      font-style: normal;
    }
  `,
});
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('600 112px "CormorantGaramond"'),
    document.fonts.load('500 15px "SourceSans3"'),
    document.fonts.load('400 28px "Amiri"'),
  ]);
});
await page.waitForTimeout(200);
await page.screenshot({ path: out, type: "png" });
await browser.close();
console.log("wrote", out);
