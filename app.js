const WEATHER_API_KEY = '25962432a213f3a901a9d629e3c4d2a8'; // OpenWeatherMap API key
const GIPHY_API_KEY = 'GZKGwdu6xlIM0iV58yFKJOFRTU4HxzxL'; // Giphy API key

const weatherForm = document.getElementById('weather-form');
const locationInput = document.getElementById('location-input');
const loadingElement = document.getElementById('loading');
const weatherContainer = document.getElementById('weather-container');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');

const locationElement = document.getElementById('location');
const dateTimeElement = document.getElementById('date-time');
const temperatureElement = document.getElementById('temperature');
const weatherIconElement = document.getElementById('weather-icon');
const weatherConditionElement = document.getElementById('weather-condition');
const feelsLikeElement = document.getElementById('feels-like');
const humidityElement = document.getElementById('humidity');
const windElement = document.getElementById('wind');
const cloudsElement = document.getElementById('clouds');
const weatherGifElement = document.getElementById('weather-gif');
const celsiusBtn = document.getElementById('celsius');
const fahrenheitBtn = document.getElementById('fahrenheit');

let currentWeatherData = null;
let currentUnit = 'celsius';

function initApp() {
    weatherForm.addEventListener('submit', handleFormSubmit);
    celsiusBtn.addEventListener('click', () => changeTemperatureUnit('celsius'));
    fahrenheitBtn.addEventListener('click', () => changeTemperatureUnit('fahrenheit'));
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const location = locationInput.value.trim();
    
    if (location) {
        showLoading();
        try {
            const weatherData = await fetchWeatherData(location);
            processWeatherData(weatherData);
            await fetchAndDisplayWeatherGif(weatherData.weather[0].main);
            hideLoading();
            showWeatherInfo();
        } catch (error) {
            hideLoading();
            showError(error.message);
        }
    }
}

async function fetchWeatherData(location) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${WEATHER_API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Location not found. Please check the city name and try again.');
            }
            throw new Error('Failed to fetch weather data. Please try again later.');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

function processWeatherData(data) {
    currentWeatherData = {
        location: `${data.name}, ${data.sys.country}`,
        temperature: {
            celsius: Math.round(data.main.temp),
            fahrenheit: Math.round((data.main.temp * 9/5) + 32)
        },
        feelsLike: {
            celsius: Math.round(data.main.feels_like),
            fahrenheit: Math.round((data.main.feels_like * 9/5) + 32)
        },
        humidity: data.main.humidity,
        wind: {
            speed: data.wind.speed,
            direction: getWindDirection(data.wind.deg)
        },
        clouds: data.clouds.all,
        weather: {
            main: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon
        },
        datetime: new Date(data.dt * 1000),
        timezone: data.timezone
    };
    
    updateUI(currentWeatherData);
}

function updateUI(data) {
    locationElement.textContent = data.location;
    dateTimeElement.textContent = formatDateTime(data.datetime, data.timezone);
    
    temperatureElement.textContent = `${data.temperature[currentUnit]}°`;
    feelsLikeElement.textContent = `${data.feelsLike[currentUnit]}°`;
    
    humidityElement.textContent = `${data.humidity}%`;
    windElement.textContent = `${data.wind.speed} m/s ${data.wind.direction}`;
    cloudsElement.textContent = `${data.clouds}%`;
    
    weatherConditionElement.textContent = data.weather.description.charAt(0).toUpperCase() + 
                                          data.weather.description.slice(1);
    setWeatherIcon(data.weather.icon);
    
    applyWeatherTheme(data);
}

function setWeatherIcon(iconCode) {
    const iconMap = {
        '01d': '<i class="fas fa-sun" style="color: #FFD700;"></i>', 
        '01n': '<i class="fas fa-moon" style="color: #A9A9A9;"></i>', 
        '02d': '<i class="fas fa-cloud-sun" style="color: #87CEEB;"></i>', 
        '02n': '<i class="fas fa-cloud-moon" style="color: #A9A9A9;"></i>',
        '03d': '<i class="fas fa-cloud" style="color: #A9A9A9;"></i>', 
        '03n': '<i class="fas fa-cloud" style="color: #A9A9A9;"></i>', 
        '04d': '<i class="fas fa-cloud" style="color: #708090;"></i>', 
        '04n': '<i class="fas fa-cloud" style="color: #708090;"></i>', 
        '09d': '<i class="fas fa-cloud-rain" style="color: #4682B4;"></i>', 
        '09n': '<i class="fas fa-cloud-rain" style="color: #4682B4;"></i>', 
        '10d': '<i class="fas fa-cloud-sun-rain" style="color: #4682B4;"></i>', 
        '10n': '<i class="fas fa-cloud-moon-rain" style="color: #4682B4;"></i>', 
        '11d': '<i class="fas fa-bolt" style="color: #FFD700;"></i>', 
        '11n': '<i class="fas fa-bolt" style="color: #FFD700;"></i>', 
        '13d': '<i class="fas fa-snowflake" style="color: #E0FFFF;"></i>',
        '13n': '<i class="fas fa-snowflake" style="color: #E0FFFF;"></i>', 
        '50d': '<i class="fas fa-smog" style="color: #DCDCDC;"></i>', 
        '50n': '<i class="fas fa-smog" style="color: #DCDCDC;"></i>' 
    };
    
    weatherIconElement.innerHTML = iconMap[iconCode] || '<i class="fas fa-question-circle"></i>';
}

function applyWeatherTheme(data) {
    const container = document.querySelector('.container');
    const body = document.body;
    
    const themeClasses = ['clear-sky', 'cloudy', 'rainy', 'snowy', 'stormy', 'night', 'foggy'];
    themeClasses.forEach(cls => {
        container.classList.remove(cls);
        body.classList.remove(cls);
    });
    
    const weatherMain = data.weather.main.toLowerCase();
    const isNight = data.weather.icon.includes('n');
    
    let themeClass = '';
    
    if (isNight) {
        themeClass = 'night';
    } else if (weatherMain.includes('clear')) {
        themeClass = 'clear-sky';
    } else if (weatherMain.includes('cloud') || weatherMain.includes('few') || weatherMain.includes('scatter') || weatherMain.includes('broken')) {
        themeClass = 'cloudy';
    } else if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
        themeClass = 'rainy';
    } else if (weatherMain.includes('snow')) {
        themeClass = 'snowy';
    } else if (weatherMain.includes('thunderstorm')) {
        themeClass = 'stormy';
    } else if (weatherMain.includes('mist') || weatherMain.includes('fog') || weatherMain.includes('haze')) {
        themeClass = 'foggy';
    } else {
        themeClass = 'clear-sky'; 
    }
    
    container.classList.add(themeClass);
    body.classList.add(themeClass);
}

async function fetchAndDisplayWeatherGif(weatherCondition) {
    try {
        const searchTermMap = {
            'Clear': 'sunny weather',
            'Clouds': 'cloudy sky',
            'Rain': 'rain weather',
            'Drizzle': 'light rain',
            'Thunderstorm': 'lightning storm',
            'Snow': 'snowing weather',
            'Mist': 'foggy weather',
            'Smoke': 'smoky atmosphere',
            'Haze': 'hazy day',
            'Dust': 'dust storm',
            'Fog': 'foggy weather',
            'Sand': 'sand storm',
            'Ash': 'volcanic ash',
            'Squall': 'squall weather',
            'Tornado': 'tornado weather'
        };
        
        const searchTerm = searchTermMap[weatherCondition] || `${weatherCondition} weather`;
        
        const response = await fetch(
            `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${searchTerm}&limit=1&rating=g`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather GIF');
        }
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const gifUrl = data.data[0].images.fixed_height.url;
            weatherGifElement.innerHTML = `<img src="${gifUrl}" alt="${weatherCondition} weather">`;
        } else {
            weatherGifElement.innerHTML = ''; 
        }
    } catch (error) {
        console.error('Error fetching weather GIF:', error);
        weatherGifElement.innerHTML = ''; 
    }
}

function changeTemperatureUnit(unit) {
    if (currentUnit === unit || !currentWeatherData) return;
    
    currentUnit = unit;
    
    if (unit === 'celsius') {
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    } else {
        celsiusBtn.classList.remove('active');
        fahrenheitBtn.classList.add('active');
    }
    
    temperatureElement.textContent = `${currentWeatherData.temperature[unit]}°`;
    feelsLikeElement.textContent = `${currentWeatherData.feelsLike[unit]}°`;
}

function formatDateTime(date, timezone) {
    const localTime = new Date(date.getTime() + (timezone * 1000));
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    };
    
    return localTime.toLocaleString('en-US', options);
}

function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

function showLoading() {
    loadingElement.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
}

function hideLoading() {
    loadingElement.classList.add('hidden');
}

function showWeatherInfo() {
    weatherContainer.classList.remove('hidden');
    errorContainer.classList.add('hidden');
}

function showError(message) {
    errorContainer.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
    errorMessage.textContent = message;
}

document.addEventListener('DOMContentLoaded', initApp);