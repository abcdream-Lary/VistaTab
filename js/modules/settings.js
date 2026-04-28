/**
 * 设置面板模块
 * 处理设置面板相关功能，包括主题切换、下拉菜单、设置项管理、标签页导航
 *
 * 主要功能：
 * - 设置面板的显示和隐藏
 * - 主题切换功能（自动、浅色、深色、蓝色、绿色）
 * - 设置面板标签页导航
 * - 自定义下拉菜单的交互
 * - 各种设置项的管理和保存
 * - 图标刷新功能
 * - 键盘快捷键支持
 */

import { showMessage } from './utils.js';

export class SettingsManager {
  constructor(storageManager, quickAccessManager) {
    this.storageManager = storageManager;
    this.quickAccessManager = quickAccessManager;

    this.settingsIcon = document.querySelector('.settings-icon');
    this.settingsPanel = document.querySelector('.settings-panel');
    this.closeSettingsBtn = document.getElementById('closeSettings');
    this.themeOptions = document.querySelectorAll('.theme-option');
    this.refreshIconsBtn = document.getElementById('refreshIcons');
    this.exportSitesBtn = document.getElementById('exportSites');
    this.importSitesBtn = document.getElementById('importSitesBtn');
    this.importSitesInput = document.getElementById('importSites');
    this.navItems = document.querySelectorAll('.settings-nav-item');
    this.settingsTabs = document.querySelectorAll('.settings-tab');
    this.systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.currentBrowserTheme = null;
  }

  init() {
    this.initSettingsNav();
    this.initCustomDropdowns();
    this.initThemeOptions();
    this.initSwitches();
    this.bindEvents();
    this.updateUI();
    this.initSystemThemeListener();
    this.initBrowserThemeListener();
  }

  async initBrowserThemeListener() {
    try {
      if (chrome && chrome.theme) {
        chrome.theme.getCurrent((themeInfo) => {
          if (chrome.runtime.lastError) {
            console.warn('无法获取浏览器主题:', chrome.runtime.lastError.message);
            return;
          }
          this.currentBrowserTheme = themeInfo;
          console.log('当前浏览器主题:', themeInfo);
          
          const settings = this.storageManager.getAllSettings();
          if (settings.theme === 'auto') {
            this.applyTheme('auto');
          }
        });

        chrome.theme.onUpdated.addListener((themeInfo) => {
          this.currentBrowserTheme = themeInfo;
          console.log('浏览器主题已更新:', themeInfo);
          
          const settings = this.storageManager.getAllSettings();
          if (settings.theme === 'auto') {
            this.applyTheme('auto');
          }
        });
      } else {
        console.warn('chrome.theme API不可用，使用系统主题检测');
      }
    } catch (error) {
      console.warn('初始化浏览器主题监听失败:', error);
    }
  }

  initSystemThemeListener() {
    this.systemThemeMediaQuery.addEventListener('change', (e) => {
      const settings = this.storageManager.getAllSettings();
      if (settings.theme === 'auto') {
        this.applyTheme('auto');
      }
    });
  }

  initSettingsNav() {
    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  switchTab(tabName) {
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    this.settingsTabs.forEach(tab => {
      const tabId = `tab-${tabName}`;
      tab.style.display = tab.id === tabId ? 'block' : 'none';
    });
  }

  updateUI() {
    const settings = this.storageManager.getAllSettings();
    
    this.updateCustomDropdown('rowsDropdown', 'quickAccessRows', settings.quickAccessRows || 2);
    this.updateCustomDropdown('engineDropdown', 'searchEngine', settings.searchEngine);
    this.updateCustomDropdown('cityDropdown', 'weatherCity', settings.weatherCity || 'auto');
    
    const enableSuggestionsSwitch = document.getElementById('enableSuggestions');
    if (enableSuggestionsSwitch) {
      enableSuggestionsSwitch.checked = settings.enableSuggestions !== false;
    }

    const enableWeatherSwitch = document.getElementById('enableWeather');
    if (enableWeatherSwitch) {
      enableWeatherSwitch.checked = settings.enableWeather !== false;
    }
    
    this.applyTheme(settings.theme || 'light');
  }

  bindEvents() {
    this.settingsIcon.addEventListener('click', (e) => {
      this.settingsPanel.classList.add('active');
      e.stopPropagation();
    });
    
    this.closeSettingsBtn.addEventListener('click', () => {
      this.settingsPanel.classList.remove('active');
    });
    
    document.addEventListener('click', (event) => {
      if (this.settingsPanel.classList.contains('active') && 
          !this.settingsPanel.contains(event.target) && 
          !this.settingsIcon.contains(event.target)) {
        this.settingsPanel.classList.remove('active');
      }
    });
    
    this.refreshIconsBtn.addEventListener('click', async () => {
      this.refreshIconsBtn.textContent = '刷新中...';
      this.refreshIconsBtn.disabled = true;

      try {
        await this.quickAccessManager.refreshAllIcons();
        showMessage('图标已刷新');
      } catch (error) {
        console.error('刷新图标失败:', error);
        showMessage('刷新图标失败');
      } finally {
        this.refreshIconsBtn.textContent = '刷新';
        this.refreshIconsBtn.disabled = false;
      }
    });

    this.exportSitesBtn.addEventListener('click', () => {
      this.exportSites();
    });

    this.importSitesBtn.addEventListener('click', () => {
      this.importSitesInput.click();
    });

    this.importSitesInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.importSites(file);
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        this.settingsPanel.classList.add('active');
      }

      if (e.key === 'Escape' && this.settingsPanel.classList.contains('active')) {
        this.settingsPanel.classList.remove('active');
      }
    });
  }

  applyTheme(themeName) {
    document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'green-theme', 'purple-theme', 'orange-theme', 'pink-theme');
    
    const logoImg = document.querySelector('.logo img');
    const logoContainer = document.querySelector('.logo');
    
    let effectiveTheme = themeName;
    
    if (themeName === 'auto') {
      effectiveTheme = this.detectAutoTheme();
    }
    
    if (effectiveTheme === 'dark') {
      document.body.classList.add('dark-theme');
      if (logoImg && logoContainer) {
        logoImg.src = 'icons/icon_width_Black.png';
        logoContainer.style.backgroundImage = 'url(icons/icon_width_Black.png)';
      }
    } else if (effectiveTheme === 'light') {
      if (logoImg && logoContainer) {
        logoImg.src = 'icons/icon_width.png';
        logoContainer.style.backgroundImage = 'url(icons/icon_width.png)';
      }
    } else {
      document.body.classList.add(effectiveTheme + '-theme');
      if (logoImg && logoContainer) {
        logoImg.src = 'icons/icon_width.png';
        logoContainer.style.backgroundImage = 'url(icons/icon_width.png)';
      }
    }
    
    this.themeOptions.forEach(option => {
      if (option.dataset.theme === themeName) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
    
    this.storageManager.updateSetting('theme', themeName);
  }

  detectAutoTheme() {
    if (this.currentBrowserTheme && this.currentBrowserTheme.colors) {
      const frameColor = this.currentBrowserTheme.colors.frame;
      if (frameColor) {
        const detectedTheme = this.analyzeColor(frameColor);
        console.log('根据浏览器主题色检测到:', detectedTheme);
        return detectedTheme;
      }
    }
    
    return this.systemThemeMediaQuery.matches ? 'dark' : 'light';
  }

  analyzeColor(color) {
    let r, g, b;
    
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }
    } else if (color.startsWith('rgb')) {
      const matches = color.match(/(\d+)/g);
      if (matches && matches.length >= 3) {
        r = parseInt(matches[0]);
        g = parseInt(matches[1]);
        b = parseInt(matches[2]);
      }
    }
    
    if (r === undefined) {
      return this.systemThemeMediaQuery.matches ? 'dark' : 'light';
    }
    
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const isDark = brightness < 128;
    
    if (isDark) {
      if (r > 100 && g < 80 && b > 100) return 'blue';
      if (g > r + 30 && b < 100) return 'green';
      return 'dark';
    } else {
      if (b > r + 40 && b > g + 40) return 'blue';
      if (g > r + 40 && b < 150) return 'green';
      return 'light';
    }
  }

  initThemeOptions() {
    this.themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        this.applyTheme(theme);
        this.storageManager.saveSettings();
      });
    });
  }

  initCustomDropdowns() {
    this.initDropdown('rowsDropdown', 'quickAccessRows', (value) => {
      this.storageManager.updateSetting('quickAccessRows', parseInt(value));
      this.storageManager.saveSettings();
      this.quickAccessManager.loadQuickAccess();
    });
    
    this.initDropdown('engineDropdown', 'searchEngine', (value) => {
      this.storageManager.updateSetting('searchEngine', value);
      this.storageManager.saveSettings();
    });

    this.initDropdown('cityDropdown', 'weatherCity', (value) => {
      this.storageManager.updateSetting('weatherCity', value);
      this.storageManager.saveSettings();
      window.dispatchEvent(new CustomEvent('settingsChanged', { 
        detail: { key: 'weatherCity', value }
      }));
    });
  }

  initDropdown(dropdownId, selectId, changeCallback) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    const select = document.getElementById(selectId);
    const selectedOption = dropdown.querySelector('.selected-option');
    const options = dropdown.querySelectorAll('.dropdown-option');
    
    selectedOption.addEventListener('click', () => {
      dropdown.classList.toggle('active');
      
      document.querySelectorAll('.custom-dropdown').forEach((el) => {
        if (el.id !== dropdownId) {
          el.classList.remove('active');
        }
      });
      
      const currentValue = select.value;
      options.forEach((option) => {
        option.classList.toggle('selected', option.dataset.value === currentValue);
      });
    });
    
    options.forEach((option) => {
      option.addEventListener('click', () => {
        const value = option.dataset.value;
        
        selectedOption.textContent = option.textContent;
        select.value = value;
        
        const event = new Event('change');
        select.dispatchEvent(event);
        
        if (changeCallback) {
          changeCallback(value);
        }
        
        dropdown.classList.remove('active');
      });
    });
    
    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
      }
    });
    
    const initialValue = select.value;
    options.forEach((option) => {
      if (option.dataset.value === initialValue) {
        selectedOption.textContent = option.textContent;
        option.classList.add('selected');
      }
    });
  }

  updateCustomDropdown(dropdownId, selectId, value) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    const select = document.getElementById(selectId);
    const selectedOption = dropdown.querySelector('.selected-option');
    const options = dropdown.querySelectorAll('.dropdown-option');

    select.value = value;

    options.forEach((option) => {
      if (option.dataset.value == value) {
        selectedOption.textContent = option.textContent;
      }
    });
  }

  exportSites() {
    try {
      const settings = this.storageManager.getAllSettings();
      let sites = settings.quickSites || [];

      const uniqueSites = [];
      const seenUrls = new Set();

      for (const site of sites) {
        if (site && site.url && !seenUrls.has(site.url)) {
          seenUrls.add(site.url);
          uniqueSites.push(site);
        }
      }

      const exportData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        sites: uniqueSites
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VistaTab_常用网站_${new Date().toISOString().split('T')[0]}.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      let message = `已导出 ${uniqueSites.length} 个网站`;
      if (uniqueSites.length < sites.length) {
        message += `（已去除 ${sites.length - uniqueSites.length} 个重复项）`;
      }
      showMessage(message, 'success');

    } catch (error) {
      console.error('导出失败:', error);
      showMessage('导出失败', 'error');
    }
  }

  importSites(file) {
    if (!file.type.includes('json')) {
      showMessage('请选择JSON格式的文件', 'error');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);

        if (!jsonData.sites || !Array.isArray(jsonData.sites)) {
          showMessage('文件格式不正确，缺少sites数组', 'error');
          return;
        }

        const validSites = [];
        const seenUrls = new Set();
        const seenNames = new Set();

        for (const site of jsonData.sites) {
          if (site && typeof site === 'object' && site.name && site.url) {
            let url = site.url.trim();
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              url = 'https://' + url;
            }

            const name = site.name.trim();

            if (!seenUrls.has(url)) {
              seenUrls.add(url);
              seenNames.add(name);

              validSites.push({
                name: name,
                url: url
              });
            }
          }
        }

        if (validSites.length === 0) {
          showMessage('文件中没有有效的网站数据', 'error');
          return;
        }

        const originalCount = jsonData.sites.length;
        const duplicateCount = originalCount - validSites.length;

        this.storageManager.updateSetting('quickSites', validSites);
        this.storageManager.saveSettings();

        this.quickAccessManager.loadQuickAccess();

        let message = `已导入 ${validSites.length} 个网站`;
        if (duplicateCount > 0) {
          message += `，已自动去除 ${duplicateCount} 个重复项`;
        }
        showMessage(message, 'success');

      } catch (error) {
        console.error('导入失败:', error);
        showMessage('文件格式错误，请检查JSON格式', 'error');
      }

      this.importSitesInput.value = '';
    };

    reader.onerror = () => {
      showMessage('文件读取失败', 'error');
      this.importSitesInput.value = '';
    };

    reader.readAsText(file);
  }

  initSwitches() {
    const enableSuggestionsSwitch = document.getElementById('enableSuggestions');
    if (enableSuggestionsSwitch) {
      enableSuggestionsSwitch.addEventListener('change', () => {
        this.storageManager.updateSetting('enableSuggestions', enableSuggestionsSwitch.checked);
        this.storageManager.saveSettings();
        
        window.dispatchEvent(new CustomEvent('settingsChanged', { 
          detail: { key: 'enableSuggestions', value: enableSuggestionsSwitch.checked }
        }));
      });
    }

    const enableWeatherSwitch = document.getElementById('enableWeather');
    if (enableWeatherSwitch) {
      enableWeatherSwitch.addEventListener('change', () => {
        this.storageManager.updateSetting('enableWeather', enableWeatherSwitch.checked);
        this.storageManager.saveSettings();
        
        window.dispatchEvent(new CustomEvent('settingsChanged', { 
          detail: { key: 'enableWeather', value: enableWeatherSwitch.checked }
        }));
      });
    }
  }
}
