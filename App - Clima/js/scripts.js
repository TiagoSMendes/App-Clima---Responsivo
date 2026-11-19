// Dados do Open-Meteo (https://open-meteo.com): gratuito e sem chave de API.
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const FLAG_URL = "https://flagcdn.com/24x18/";

const form = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const locateBtn = document.querySelector("#locate");

const cityElement = document.querySelector("#city");
const regionElement = document.querySelector("#region");
const tempElement = document.querySelector("#temperature span");
const descElement = document.querySelector("#description");
const weatherIconElement = document.querySelector("#weather-icon");
const countryElement = document.querySelector("#country");
const minmaxElement = document.querySelector("#minmax");
const feelsElement = document.querySelector("#feels span");
const humidityElement = document.querySelector("#humidity span");
const windElement = document.querySelector("#wind span");

const weatherContainer = document.querySelector("#weather-data");
const errorMessageContainer = document.querySelector("#error-message");
const errorText = errorMessageContainer.querySelector("p");
const loader = document.querySelector("#loader");
const suggestionContainer = document.querySelector("#suggestions");
const suggestionButtons = document.querySelectorAll("#suggestions button");

// Se a bandeira não carregar, some com ela em vez de mostrar o texto alternativo
countryElement.addEventListener("error", () => {
  countryElement.style.display = "none";
});

// Códigos de tempo da OMM (WMO) -> descrição, ícone e tema de fundo
const WEATHER_CODES = {
  0: ["Céu limpo", "☀️", "limpo"],
  1: ["Predominantemente limpo", "🌤️", "limpo"],
  2: ["Parcialmente nublado", "⛅", "nublado"],
  3: ["Nublado", "☁️", "nublado"],
  45: ["Neblina", "🌫️", "neblina"],
  48: ["Neblina com geada", "🌫️", "neblina"],
  51: ["Garoa fraca", "🌦️", "chuva"],
  53: ["Garoa", "🌦️", "chuva"],
  55: ["Garoa forte", "🌧️", "chuva"],
  56: ["Garoa congelante", "🌧️", "chuva"],
  57: ["Garoa congelante forte", "🌧️", "chuva"],
  61: ["Chuva fraca", "🌦️", "chuva"],
  63: ["Chuva", "🌧️", "chuva"],
  65: ["Chuva forte", "🌧️", "chuva"],
  66: ["Chuva congelante", "🌧️", "chuva"],
  67: ["Chuva congelante forte", "🌧️", "chuva"],
  71: ["Neve fraca", "🌨️", "neve"],
  73: ["Neve", "🌨️", "neve"],
  75: ["Neve forte", "❄️", "neve"],
  77: ["Grãos de neve", "🌨️", "neve"],
  80: ["Pancadas de chuva fracas", "🌦️", "chuva"],
  81: ["Pancadas de chuva", "🌧️", "chuva"],
  82: ["Pancadas de chuva fortes", "⛈️", "chuva"],
  85: ["Pancadas de neve", "🌨️", "neve"],
  86: ["Pancadas de neve fortes", "❄️", "neve"],
  95: ["Trovoada", "⛈️", "tempestade"],
  96: ["Trovoada com granizo", "⛈️", "tempestade"],
  99: ["Trovoada com granizo forte", "⛈️", "tempestade"],
};

const setLoading = (loading) => loader.classList.toggle("hide", !loading);

const hideInformation = () => {
  errorMessageContainer.classList.add("hide");
  weatherContainer.classList.add("hide");
  suggestionContainer.classList.add("hide");
};

const showErrorMessage = (msg) => {
  errorText.textContent = msg;
  errorMessageContainer.classList.remove("hide");
  suggestionContainer.classList.remove("hide");
};

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function findCity(name) {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=1&language=pt&format=json`;
  const data = await getJSON(url);
  return data.results && data.results[0];
}

async function getWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "1",
  });
  return getJSON(`${WEATHER_URL}?${params}`);
}

function renderWeather(place, data) {
  const c = data.current;
  const [desc, icon, tema] = WEATHER_CODES[c.weather_code] || ["Condição desconhecida", "🌡️", "nublado"];

  cityElement.textContent = place.name;
  regionElement.textContent = [place.admin1, place.country].filter(Boolean).join(", ");

  if (place.country_code) {
    countryElement.src = FLAG_URL + place.country_code.toLowerCase() + ".png";
    countryElement.alt = `Bandeira: ${place.country || place.country_code}`;
    countryElement.style.display = "inline-block";
  } else {
    countryElement.style.display = "none";
  }

  tempElement.textContent = Math.round(c.temperature_2m);
  descElement.textContent = desc;
  weatherIconElement.textContent = icon;
  minmaxElement.textContent = `Mín. ${Math.round(data.daily.temperature_2m_min[0])}° · Máx. ${Math.round(data.daily.temperature_2m_max[0])}°`;
  feelsElement.textContent = `${Math.round(c.apparent_temperature)}°C`;
  humidityElement.textContent = `${c.relative_humidity_2m}%`;
  windElement.textContent = `${Math.round(c.wind_speed_10m)} km/h`;

  // Fundo muda conforme o tempo e se é dia ou noite
  document.body.dataset.tema = c.is_day ? tema : "noite";

  weatherContainer.classList.remove("hide");
}

async function showWeatherData(city) {
  city = city.trim();
  if (!city) return;

  hideInformation();
  setLoading(true);

  try {
    const place = await findCity(city);
    if (!place) {
      showErrorMessage("Não foi possível encontrar uma cidade com este nome.");
      return;
    }
    const data = await getWeather(place.latitude, place.longitude);
    renderWeather(place, data);
  } catch (err) {
    console.error(err);
    showErrorMessage("Não foi possível buscar o clima agora. Verifique sua internet e tente de novo.");
  } finally {
    setLoading(false);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  showWeatherData(cityInput.value);
});

suggestionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    cityInput.value = btn.dataset.city;
    showWeatherData(btn.dataset.city);
  });
});

// Clima da localização atual (o navegador pede permissão)
locateBtn.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    showErrorMessage("Seu navegador não permite usar a localização.");
    return;
  }
  hideInformation();
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const data = await getWeather(coords.latitude, coords.longitude);
        renderWeather({ name: "Sua localização" }, data);
      } catch (err) {
        console.error(err);
        showErrorMessage("Não foi possível buscar o clima agora.");
      } finally {
        setLoading(false);
      }
    },
    () => {
      setLoading(false);
      showErrorMessage("Não conseguimos acessar sua localização. Digite o nome da cidade.");
    },
    { timeout: 10000 }
  );
});
