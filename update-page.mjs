import { writeFile } from "node:fs/promises";

const TITLE = "Sunnyvale Pickleball";
const PAGE_URL =
  process.env.PAGE_URL ||
  "https://JimLiu0.github.io/sunnyvale-pickleball-weather/";
const OUTPUT_PATH = new URL("../index.html", import.meta.url);
const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=37.3688&longitude=-122.0363&current=temperature_2m,weather_code";

function toCondition(weatherCode) {
  if (weatherCode === 0) {
    return "Sunny";
  }

  if (
    weatherCode === 51 ||
    weatherCode === 53 ||
    weatherCode === 55 ||
    weatherCode === 56 ||
    weatherCode === 57 ||
    weatherCode === 61 ||
    weatherCode === 63 ||
    weatherCode === 65 ||
    weatherCode === 66 ||
    weatherCode === 67 ||
    weatherCode === 80 ||
    weatherCode === 81 ||
    weatherCode === 82 ||
    weatherCode === 95 ||
    weatherCode === 96 ||
    weatherCode === 99
  ) {
    return "Raining";
  }

  return "Cloudy";
}

async function getDescription() {
  try {
    const response = await fetch(OPEN_METEO_URL, {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`);
    }

    const data = await response.json();
    const tempC = data?.current?.temperature_2m;
    const weatherCode = data?.current?.weather_code;

    if (typeof tempC !== "number" || typeof weatherCode !== "number") {
      throw new Error("Missing weather fields");
    }

    const tempF = Math.round((tempC * 9) / 5 + 32);
    const condition = toCondition(weatherCode);
    return `Weather today: ${tempF}F ${condition}`;
  } catch (error) {
    console.warn("Weather fetch failed; using fallback:", error);
    return "Weather today: --F Weather unavailable";
  }
}

function buildHtml(description) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${TITLE}</title>
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${PAGE_URL}" />
  </head>
  <body>
    <main>
      <h1>${TITLE}</h1>
      <p>${description}</p>
    </main>
  </body>
</html>
`;
}

const description = await getDescription();
await writeFile(OUTPUT_PATH, buildHtml(description), "utf8");
console.log(`Updated index.html with: ${description}`);
