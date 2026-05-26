import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const TITLE = "Sunnyvale Pickleball";
const PAGE_URL =
  process.env.PAGE_URL ||
  "https://JimLiu0.github.io/sunnyvale-pickleball-weather/";
const BASE_URL = PAGE_URL.replace(/\/+$/, "");
const OUTPUT_PAGES = [
  {
    outputPath: new URL("../index.html", import.meta.url),
    pageUrl: `${BASE_URL}/`,
    label: "index.html",
  },
  {
    outputPath: new URL("../tuesday/index.html", import.meta.url),
    pageUrl: `${BASE_URL}/tuesday/`,
    label: "tuesday/index.html",
  },
  {
    outputPath: new URL("../thursday/index.html", import.meta.url),
    pageUrl: `${BASE_URL}/thursday/`,
    label: "thursday/index.html",
  },
];
const OPEN_METEO_HOURLY_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=37.3688&longitude=-122.0363&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles&forecast_days=1&hourly=temperature_2m,weather_code";
const OPEN_METEO_CURRENT_URLS = [
  "https://api.open-meteo.com/v1/forecast?latitude=37.3688&longitude=-122.0363&temperature_unit=fahrenheit&current=temperature_2m,weather_code",
  "https://api.open-meteo.com/v1/forecast?latitude=37.3688&longitude=-122.0363&temperature_unit=fahrenheit&current_weather=true",
];

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

function parseOpenMeteo(data) {
  const tempF =
    data?.current?.temperature_2m ?? data?.current_weather?.temperature;
  const weatherCode =
    data?.current?.weather_code ?? data?.current_weather?.weathercode;

  if (typeof tempF !== "number" || typeof weatherCode !== "number") {
    throw new Error("Missing weather fields");
  }

  return {
    tempF: Math.round(tempF),
    condition: toCondition(weatherCode),
  };
}

async function getDescription() {
  try {
    const hourlyResponse = await fetch(OPEN_METEO_HOURLY_URL, {
      headers: {
        accept: "application/json",
        "user-agent": "sunnyvale-pickleball-weather-bot",
      },
    });

    if (!hourlyResponse.ok) {
      throw new Error(`Unexpected status ${hourlyResponse.status}`);
    }

    const data = await hourlyResponse.json();
    const times = data?.hourly?.time;
    const temps = data?.hourly?.temperature_2m;
    const codes = data?.hourly?.weather_code;

    if (!Array.isArray(times) || !Array.isArray(temps) || !Array.isArray(codes)) {
      throw new Error("Missing hourly weather fields");
    }

    const targetIndex = times.findIndex((time) => String(time).endsWith("T16:00"));
    if (targetIndex < 0) {
      throw new Error("No 4 PM forecast entry found");
    }

    const tempF = temps[targetIndex];
    const weatherCode = codes[targetIndex];
    if (typeof tempF !== "number" || typeof weatherCode !== "number") {
      throw new Error("Invalid 4 PM forecast values");
    }

    const condition = toCondition(weatherCode);
    return `Weather today: ${Math.round(tempF)}F ${condition}`;
  } catch (error) {
    console.warn("4 PM forecast fetch failed; trying current weather fallback:", error);
  }

  for (const url of OPEN_METEO_CURRENT_URLS) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": "sunnyvale-pickleball-weather-bot",
        },
      });

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }

      const data = await response.json();
      const { tempF, condition } = parseOpenMeteo(data);
      return `Weather today: ${tempF}F ${condition}`;
    } catch (error) {
      console.warn(`Weather fetch attempt failed for ${url}:`, error);
    }
  }

  return "Weather today: --F Weather unavailable";
}

function buildHtml(description, pageUrl) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${TITLE}</title>
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${pageUrl}" />
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

for (const page of OUTPUT_PAGES) {
  const outputFile = fileURLToPath(page.outputPath);
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(page.outputPath, buildHtml(description, page.pageUrl), "utf8");
  console.log(`Updated ${page.label} with: ${description}`);
}
