/**
 * 天气模块
 * 使用免费天气API获取天气信息并显示
 */

export class WeatherManager {
  constructor() {
    this.weatherWidget = document.getElementById('weatherWidget');
    this.weatherTemp = document.getElementById('weatherTemp');
    this.weatherDesc = document.getElementById('weatherDesc');
    this.weatherIcon = document.getElementById('weatherIcon');
    this.weatherLoading = document.getElementById('weatherLoading');
    this.updateInterval = null;
    this.currentWeatherData = null;
  }

  async init(storageManager) {
    this.storageManager = storageManager;
    this.bindEvents();
    await this.loadWeather();
    this.startAutoUpdate();
  }

  bindEvents() {
    if (this.weatherWidget) {
      this.weatherWidget.addEventListener('click', async () => {
        if (this.currentWeatherData && this.currentWeatherData.city) {
          const city = encodeURIComponent(this.currentWeatherData.city);
          const weatherUrl = `https://www.msn.com/zh-cn/weather/forecast/in-${city}`;
          window.open(weatherUrl, '_blank');
        } else {
          window.open('https://www.msn.com/zh-cn/weather', '_blank');
        }
      });
    }

    window.addEventListener('settingsChanged', (e) => {
      if (e.detail && e.detail.key === 'enableWeather') {
        this.toggleWeatherWidget(e.detail.value);
      }
      if (e.detail && e.detail.key === 'weatherCity') {
        this.refreshWeather();
      }
    });
  }

  toggleWeatherWidget(show) {
    if (this.weatherWidget) {
      this.weatherWidget.style.display = show ? 'flex' : 'none';
    }
  }

  async loadWeather() {
    const settings = this.storageManager.getAllSettings();
    
    if (settings.enableWeather === false) {
      this.toggleWeatherWidget(false);
      return;
    }

    await this.fetchWeather(settings.weatherCity || 'auto');
  }

  async fetchWeather(city) {
    this.showLoading(true);
    
    try {
      let query;
      if (city === 'auto') {
        query = '';
      } else {
        const cityMap = {
          'beijing': 'Beijing',
          'shanghai': 'Shanghai',
          'guangzhou': 'Guangzhou',
          'shenzhen': 'Shenzhen',
          'chengdu': 'Chengdu',
          'hangzhou': 'Hangzhou',
          'wuhan': 'Wuhan',
          'nanjing': 'Nanjing',
          'chongqing': 'Chongqing',
          'tianjin': 'Tianjin',
          'xian': 'Xi\'an',
          'qingdao': 'Qingdao',
          'dalian': 'Dalian',
          'xiamen': 'Xiamen',
          'changsha': 'Changsha',
          'zhengzhou': 'Zhengzhou',
          'jinan': 'Jinan',
          'shenyang': 'Shenyang',
          'harbin': 'Harbin',
          'kunming': 'Kunming'
        };
        query = cityMap[city] || 'Beijing';
      }

      const weatherData = await this.fetchFromWttrIn(query);
      if (weatherData) {
        this.updateWeatherDisplay(weatherData);
        this.currentWeatherData = weatherData;
        this.updateWeatherDetailText(weatherData);
      } else {
        this.showDefaultWeather();
      }
    } catch (error) {
      console.error('获取天气失败:', error);
      this.showDefaultWeather();
    } finally {
      this.showLoading(false);
    }
  }

  async fetchFromWttrIn(query) {
    try {
      const url = query ? `https://wttr.in/${encodeURIComponent(query)}?format=j1` : 'https://wttr.in/?format=j1';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.current_condition && data.current_condition.length > 0) {
        const current = data.current_condition[0];
        const nearestArea = data.nearest_area && data.nearest_area[0];
        
        let cityName = '未知城市';
        if (nearestArea && nearestArea.areaName && nearestArea.areaName.length > 0) {
          const areaName = nearestArea.areaName[0];
          cityName = areaName.value || nearestArea.city || '未知城市';
        }

        const weatherDesc = this.getWeatherDescInChinese(current.weatherDesc && current.weatherDesc[0] ? current.weatherDesc[0].value : '');
        
        return {
          temp: Math.round(parseFloat(current.temp_C)),
          weather: weatherDesc,
          city: cityName,
          humidity: current.humidity,
          windspeedKmph: current.windspeedKmph
        };
      }
    } catch (error) {
      console.error('天气API请求失败:', error);
    }
    return null;
  }

  getWeatherDescInChinese(desc) {
    const weatherMap = {
      'Sunny': '晴',
      'Clear': '晴',
      'Partly cloudy': '多云',
      'Cloudy': '阴',
      'Overcast': '阴',
      'Mist': '薄雾',
      'Patchy rain possible': '可能有雨',
      'Patchy snow possible': '可能有雪',
      'Patchy sleet possible': '可能有雨夹雪',
      'Patchy freezing drizzle possible': '可能有冻雨',
      'Thundery outbreaks possible': '可能有雷暴',
      'Blowing snow': '吹雪',
      'Blizzard': '暴风雪',
      'Fog': '雾',
      'Freezing fog': '冻雾',
      'Patchy light drizzle': '小毛毛雨',
      'Light drizzle': '毛毛雨',
      'Freezing drizzle': '冻雨',
      'Heavy freezing drizzle': '大冻雨',
      'Patchy light rain': '小阵雨',
      'Light rain': '小雨',
      'Moderate rain at times': '时有中雨',
      'Moderate rain': '中雨',
      'Heavy rain at times': '时有大雨',
      'Heavy rain': '大雨',
      'Light snow': '小雪',
      'Moderate snow': '中雪',
      'Heavy snow': '大雪',
      'Ice pellets': '冰雹',
      'Light rain shower': '小阵雨',
      'Moderate or heavy rain shower': '中到大阵雨',
      'Thundery rain': '雷雨',
      'Torrential rain shower': '暴雨',
      'Light sleet': '小雨夹雪',
      'Moderate or heavy sleet': '中到大雨夹雪',
      'Light snow grains': '小冰晶',
      'Light snow shower': '小阵雪'
    };

    for (const [key, value] of Object.entries(weatherMap)) {
      if (desc.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return desc || '未知';
  }

  updateWeatherDisplay(data) {
    if (this.weatherTemp) {
      this.weatherTemp.textContent = `${data.temp}°`;
    }
    if (this.weatherDesc) {
      this.weatherDesc.textContent = data.weather;
    }
    if (this.weatherWidget) {
      this.weatherWidget.title = `${data.city} ${data.weather} ${data.temp}°C`;
    }
  }

  updateWeatherDetailText(data) {
    const weatherDetailText = document.getElementById('weatherDetailText');
    if (weatherDetailText) {
      weatherDetailText.textContent = `${data.city} · ${data.weather} · ${data.temp}°C`;
    }
  }

  showDefaultWeather() {
    if (this.weatherTemp) {
      this.weatherTemp.textContent = '--°';
    }
    if (this.weatherDesc) {
      this.weatherDesc.textContent = '获取失败';
    }
    if (this.weatherWidget) {
      this.weatherWidget.title = '天气数据获取失败';
    }
  }

  showLoading(show) {
    if (this.weatherLoading) {
      this.weatherLoading.classList.toggle('active', show);
    }
    if (this.weatherIcon) {
      this.weatherIcon.style.display = show ? 'none' : 'flex';
    }
  }

  async refreshWeather() {
    const settings = this.storageManager.getAllSettings();
    await this.fetchWeather(settings.weatherCity || 'auto');
  }

  startAutoUpdate() {
    this.updateInterval = setInterval(() => {
      this.refreshWeather();
    }, 30 * 60 * 1000);
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
