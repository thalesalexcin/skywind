const apiBaseUrl = 'https://api.open-meteo.com/v1/forecast';
const latitude = 44.566;
const longitude = -0.056;

var UNIT_METERS = "m";
var UNIT_KNOTS = "kt";
var UNIT_TEMPERATURE = "°";
var UNIT_CLOUD_COVER = "%";
var UNIT_PRESSION = "hPa";
var WIND_SPEED_PREFIX = "wind_speed_";
var WIND_DIRECTION_PREFIX = "wind_direction_"
var TEMPERATURE_PREFIX = "temperature_";
var CLOUD_COVER_PREFIX = "cloud_cover_";
var WIND_GUST_KEY = "wind_gusts_10m";



var MODELS = [
  new ModelData("Automatique", "best_match"),
  new ModelData("ICON (Seamless)", "icon_seamless"),
  new ModelData("ICON (Global)", "icon_global"),
  new ModelData("Meteo France", "meteofrance_seamless"),
  new ModelData("GEM (Seamless)", "gem_seamless")
];

var HOURS = [
  "12:00 AM",
  "1:00 AM",
  "2:00 AM",
  "3:00 AM",
  "4:00 AM",
  "5:00 AM",
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM"
]

const altitudeMap = new Map([
  ["10m", 10],
  ["80m", 80],
  ["120m", 120],
  ["180m", 180],
  ["1000hPa", 110],
  ["975hPa", 320],
  ["950hPa", 500],
  ["925hPa", 750],
  ["900hPa", 1000],
  ["850hPa", 1500],
  ["800hPa", 2000],
  ["750hPa", 2500],
  ["700hPa", 3000],
  ["650hPa", 3500],
  ["600hPa", 4200]
]);

var windParameters = [];
altitudeMap.forEach((value, key) => {
  windParameters.push(new WindParams(key, value));  
});

function ModelData(name, value) {
  this.name = name;
  this.value = value;
}

function HourData(name, value) {
  this.name = name;
  this.value = value;
}

function WindParams(key, altitude) {
  this.key = key; 
  this.speed = WIND_SPEED_PREFIX + this.key;
  this.direction = WIND_DIRECTION_PREFIX + this.key;
  this.temperature = TEMPERATURE_PREFIX + this.key;
  this.cloudCover = CLOUD_COVER_PREFIX + this.key;
  this.altitude = altitude;
}

function WindData(direction, speed, temperature, cloudCover, altitude) {
  this.direction = direction;
  this.speed = speed;
  this.temperature = temperature;
  this.cloudCover = cloudCover;
  this.altitude = altitude;
}

function Coordinates(latitude, longitude) {
  this.latitude = latitude;
  this.longitude = longitude;
}

function buildUrl(coordinates, wantedModels, windParams) {
  var url = new URL(apiBaseUrl);
  
  url.searchParams.append("latitude", coordinates.latitude);
  url.searchParams.append("longitude", coordinates.longitude);
  url.searchParams.append("timezone", "auto");
  url.searchParams.append("forecast_days", 1);
  url.searchParams.append("wind_speed_unit", "kn");

  if (windParams.length > 0) {
    const hourlyParams = windParams.join(",");
    url.searchParams.append("hourly", hourlyParams);
  }

  if (wantedModels.length > 0) {
    const modelsRaw = wantedModels.join(",");
    url.searchParams.append("models", modelsRaw);
  }

  return url;
}


var fetchedData = {};

const daytime = document.querySelector('#daytime');
const table = document.querySelector('#data-table');
const loading = document.querySelector('#loading');
const errorMessage = document.querySelector('#error-message');
const tbody = table.querySelector('tbody');
const gust = document.querySelector('#gust');

function refresh() {
  var windParamsRaw = getWindParameters();
  console.log(windParamsRaw);
  var modelsRaw = getModels();
  var coords = getCoords();
  var url = buildUrl(coords, modelsRaw, windParamsRaw);  

  fetch(url)
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
    // Hide spinner
    loading.classList.add('d-none');
    setLastFetchedData(data);

    var hour = new Date().getHours();
    setSelectedHour(hour);
    displayForHour(hour);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    loading.classList.add('d-none');
    errorMessage.classList.remove('d-none');
  });
}

function setLastFetchedData(data) {
  fetchedData = data;
}

function getWindParameters() {
  var windParamsRaw = [];
  windParameters.forEach(p => {
    windParamsRaw.push(p.direction);
    windParamsRaw.push(p.speed);
    windParamsRaw.push(p.temperature);
    windParamsRaw.push(p.cloudCover);
  });

  windParamsRaw.push(WIND_GUST_KEY);
  return windParamsRaw;
}

function getCoords() {
  return new Coordinates(latitude, longitude);
}

function getWindDataForHour(data, hour, param) {;
  var direction = data.hourly[param.direction][hour];
  var speed = data.hourly[param.speed][hour];
  var temperature = data.hourly[param.temperature][hour];
  var cloudCover = data.hourly[param.cloudCover][hour];
  var altitude = altitudeMap.get(param.key);
  return new WindData(direction, speed, temperature, cloudCover, altitude);
}

function displayTable(windData, gustData) {
  tbody.replaceChildren();
  windData.forEach(wind => {
    const row = createRow(wind);
    tbody.appendChild(row);
  });

  gust.innerHTML = (gustData == null ? "--" : gustData) + " " + UNIT_KNOTS;
}

function createRow(windData) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td class="text-center">${windData.altitude} m</td>
    <td class="text-center">${ windData.speed == null ? "--" : windData.speed} ${UNIT_KNOTS}</td>
    <td class="text-center">${windData.direction == null ? "-- " : windData.direction} ° <img class="arrow" style="transform: rotate(${windData.direction + 180}deg);" src="images/up-arrow.png" alt="Arrow"></td>
    <td class="text-center">${ windData.temperature == null ? "--" : windData.temperature} ${UNIT_TEMPERATURE}</td>
  `;
  return row;
}

function displayModels() {
  const modelChoice = document.querySelector('#models');
  
  MODELS.forEach((element, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.innerHTML = element.name;
    modelChoice.appendChild(option);
  });

  modelChoice.addEventListener('change', () => {
    loading.classList.remove('d-none');
    refresh();
  });
}

function getModels() {
  const modelChoice = document.querySelector('#models');
  return [MODELS[modelChoice.value].value];
}

function displayHours() {
  const hoursChoice = document.querySelector('#hours');
  const prevHourButton = document.querySelector('#prevHourButton');
  const nextHourButton = document.querySelector('#nextHourButton');
  
  HOURS.forEach((element, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.innerHTML = element;
    hoursChoice.appendChild(option);
  });

  hoursChoice.addEventListener('change', () => {
    displayForHour(hoursChoice.value);
  });

  prevHourButton.addEventListener("click", () => {
    hoursChoice.value = Math.max(parseInt(hoursChoice.value - 1), 0);
    displayForHour(hoursChoice.value);
  });

  nextHourButton.addEventListener("click", () => {
    hoursChoice.value = Math.min( parseInt(hoursChoice.value) + 1, 23);
    displayForHour(hoursChoice.value);
  });
}

function displayForHour(hour) {
  var windData = parse(fetchedData, hour);
  var gustData = fetchedData.hourly[WIND_GUST_KEY][hour];
  displayTable(windData, gustData);
}

function setSelectedHour(hour) {
  const hoursChoice = document.querySelector('#hours');
  hoursChoice.value = hour;
}

function parse(data, hour) {
  var result = [];
  windParameters.forEach(p => result.push(getWindDataForHour(data, hour, p)));
  result.sort((a, b) => b.altitude - a.altitude);
  return result;
}

function displayDummyData() {
  var dummyData = [];
  altitudeMap.forEach((value, key) => {
    dummyData.push(new WindData(null, null, value));  
  });

  dummyData.sort((a, b) => b.altitude - a.altitude);
  displayTable(dummyData, null);
}

let lastTouchEnd = 0;

document.addEventListener('touchend', function (event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) { // double-tap threshold (300ms)
    event.preventDefault();        // prevent double-tap zoom
  }
  lastTouchEnd = now;
}, false);

displayHours();
displayModels();
displayDummyData();

refresh();