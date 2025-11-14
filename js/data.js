//https://api.open-meteo.com/v1/forecast?latitude=44.566&longitude=-0.056&hourly=wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,wind_gusts_10m,wind_speed_1000hPa,wind_speed_975hPa,wind_speed_950hPa,wind_speed_925hPa,wind_speed_900hPa,wind_speed_850hPa,wind_speed_800hPa,wind_speed_700hPa,wind_speed_600hPa,wind_direction_1000hPa,wind_direction_975hPa,wind_direction_950hPa,wind_direction_925hPa,wind_direction_900hPa,wind_direction_850hPa,wind_direction_800hPa,wind_direction_700hPa,wind_direction_600hPa&timezone=auto&forecast_days=1&wind_speed_unit=kn

const apiBaseUrl = 'https://api.open-meteo.com/v1/forecast';
const latitude = 44.566;
const longitude = -0.056;

var UNIT_METERS = "m";
var UNIT_PRESSION = "hPa";

const altitudeMap = {
  "10m": 10,
  "80m": 80,
  "120m": 120,
  "180m": 180,
  "1000hPa": 110,
  "975hPa": 320,    
  "950hPa": 500,    
  "925hPa": 800,    
  "900hPa": 1000,   
  "850hPa": 1500,   
  "800hPa": 1900,   
  "700hPa": 3000,   
  "600hPa": 4200
}

function WindParams(value, unit) {
  this.value = value;
  this.unit = unit;
  this.key = value + unit; 
  this.speed = "wind_speed_" + key;
  this.direction = "wind_direction_" + key;
  this.altitude = altitudeMap[this.key];
}

var windParameters = [];
windParameters.push(new WindParams(10, UNIT_METERS));
windParameters.push(new WindParams(80, UNIT_METERS));
windParameters.push(new WindParams(120, UNIT_METERS));
windParameters.push(new WindParams(180, UNIT_METERS));
windParameters.push(new WindParams(1000, UNIT_PRESSION));
windParameters.push(new WindParams(975, UNIT_PRESSION));
windParameters.push(new WindParams(950, UNIT_PRESSION));
windParameters.push(new WindParams(925, UNIT_PRESSION));
windParameters.push(new WindParams(900, UNIT_PRESSION));
windParameters.push(new WindParams(850, UNIT_PRESSION));
windParameters.push(new WindParams(800, UNIT_PRESSION));
windParameters.push(new WindParams(700, UNIT_PRESSION));
windParameters.push(new WindParams(600, UNIT_PRESSION));


function buildUrl(latitude, longitude, wantedModels, windParams) {
  const apiBaseUrl = 'https://api.open-meteo.com/v1/forecast';
  const url = new URL(apiBaseUrl);
  
  url.append("latitude", latitude);
  url.append("longitude", longitude);
  url.append("timezone", "auto");
  url.append("forecast_days", 1);
  url.append("wind_speed_unit", "kn");

  if (windParams.length > 0) {
    const hourlyParams = windParams.join(",");
    url.append("hourly", hourlyParams);
  }

  if (wantedModels.length > 0) {
    const modelsRaw = wantedModels.join(",");
    url.append("models", modelsRaw);
  }

  return url;
}

const testUrl = "https://api.open-meteo.com/v1/forecast?latitude=44.566&longitude=-0.056&hourly=wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,wind_gusts_10m,wind_speed_1000hPa,wind_speed_975hPa,wind_speed_950hPa,wind_speed_925hPa,wind_speed_900hPa,wind_speed_850hPa,wind_speed_800hPa,wind_speed_700hPa,wind_speed_600hPa,wind_direction_1000hPa,wind_direction_975hPa,wind_direction_950hPa,wind_direction_925hPa,wind_direction_900hPa,wind_direction_850hPa,wind_direction_800hPa,wind_direction_700hPa,wind_direction_600hPa&timezone=auto&forecast_days=1&wind_speed_unit=kn";

const table = document.querySelector('#data-table');
const tbody = table.querySelector('tbody');
const loading = document.querySelector('#loading');
const errorMessage = document.querySelector('#error-message');

var globalData = {};

fetch(testUrl)
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
    // Hide spinner and show table
    loading.classList.add('d-none');
    table.classList.remove('d-none');

    globalData = data;
    var windData = parse(data);
    console.log(windData);
    windData.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.altitude} m</td>
        <td>${user.speed} kt</td>
        <td>${user.direction} ° <img class="arrow" style="transform: rotate(${user.direction + 180}deg);" src="images/arrow.png" alt="Arrow"></td>
      `;
      tbody.appendChild(row);
    });
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    loading.classList.add('d-none');
    errorMessage.classList.remove('d-none');
  });

  function parse(data) {
    var result = [];
    result.push(getWindDataFromResponse(data,"10m"));
    result.push(getWindDataFromResponse(data,"80m"));
    result.push(getWindDataFromResponse(data,"120m"));
    result.push(getWindDataFromResponse(data,"180m"));
    result.push(getWindDataFromResponse(data,"1000hPa"));
    result.push(getWindDataFromResponse(data,"975hPa"));
    result.push(getWindDataFromResponse(data,"950hPa"));
    result.push(getWindDataFromResponse(data,"925hPa"));
    result.push(getWindDataFromResponse(data,"900hPa"));
    result.push(getWindDataFromResponse(data,"850hPa"));
    result.push(getWindDataFromResponse(data,"800hPa"));
    result.push(getWindDataFromResponse(data,"700hPa"));
    result.push(getWindDataFromResponse(data,"600hPa"));
    result.sort((a, b) => b.altitude - a.altitude);
    return result;
  }

function getWindDataFromResponse(data, key) {
  var hour = new Date().getHours();
  var direction = data.hourly["wind_direction_" + key][hour];
  var speed = data.hourly["wind_speed_" + key][hour];
  var altitude = altitudeMap["wind_speed_" + key];
  return new WindData(direction, speed, altitude);
}

  function WindData(direction, speed, altitude) {
    this.direction = direction;
    this.speed = speed;
    this.altitude = altitude;
  }