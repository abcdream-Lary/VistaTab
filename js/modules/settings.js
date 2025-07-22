/**
 * 设置面板模块
 * 处理设置面板相关功能，包括主题切换、下拉菜单、设置项管理
 *
 * 主要功能：
 * - 设置面板的显示和隐藏
 * - 主题切换功能（浅色、深色、蓝色、绿色）
 * - 自定义下拉菜单的交互
 * - 各种设置项的管理和保存
 * - 图标刷新功能
 * - 键盘快捷键支持
 */

import { showMessage } from './utils.js';

/**
 * 设置管理类
 * 负责管理应用的所有设置功能和用户界面交互
 */
export class SettingsManager {
  /**
   * 构造函数
   * @param {StorageManager} storageManager - 存储管理器实例
   * @param {QuickAccessManager} quickAccessManager - 快捷访问管理器实例
   */
  constructor(storageManager, quickAccessManager) {
    // 存储管理器引用，用于保存和加载设置
    this.storageManager = storageManager;
    // 快捷访问管理器引用，用于刷新图标等操作
    this.quickAccessManager = quickAccessManager;

    // 获取设置面板相关的DOM元素
    this.settingsIcon = document.querySelector('.settings-icon');         // 设置图标按钮
    this.settingsPanel = document.querySelector('.settings-panel');       // 设置面板容器
    this.closeSettingsBtn = document.getElementById('closeSettings');     // 关闭设置按钮
    this.themeOptions = document.querySelectorAll('.theme-option');       // 主题选项
    this.refreshIconsBtn = document.getElementById('refreshIcons');       // 刷新图标按钮
    this.exportSitesBtn = document.getElementById('exportSites');         // 导出网站按钮
    this.importSitesBtn = document.getElementById('importSitesBtn');       // 导入网站按钮
    this.importSitesInput = document.getElementById('importSites');       // 导入文件输入框
  }

  /**
   * 初始化设置功能
   */
  init() {
    this.initCustomDropdowns();
    this.initThemeOptions();
    this.bindEvents();
    this.updateUI();
  }

  /**
   * 更新UI显示
   */
  updateUI() {
    const settings = this.storageManager.getAllSettings();
    
    // 更新自定义下拉菜单
    this.updateCustomDropdown('rowsDropdown', 'quickAccessRows', settings.quickAccessRows || 2);
    this.updateCustomDropdown('engineDropdown', 'searchEngine', settings.searchEngine);
    
    // 应用主题
    this.applyTheme(settings.theme || 'light');
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 打开设置面板
    this.settingsIcon.addEventListener('click', (e) => {
      this.settingsPanel.classList.add('active');
      e.stopPropagation();
    });
    
    // 关闭设置面板
    this.closeSettingsBtn.addEventListener('click', () => {
      this.settingsPanel.classList.remove('active');
    });
    
    // 点击设置面板外部关闭面板
    document.addEventListener('click', (event) => {
      if (this.settingsPanel.classList.contains('active') && 
          !this.settingsPanel.contains(event.target) && 
          !this.settingsIcon.contains(event.target)) {
        this.settingsPanel.classList.remove('active');
      }
    });
    
    // 刷新图标按钮
    this.refreshIconsBtn.addEventListener('click', async () => {
      // 禁用按钮并更改文本
      this.refreshIconsBtn.textContent = '刷新中...';
      this.refreshIconsBtn.disabled = true;

      try {
        await this.quickAccessManager.refreshAllIcons();
        showMessage('刷新成功', 'success');
      } catch (error) {
        showMessage('刷新失败', 'error');
        console.error('刷新图标失败:', error);
      } finally {
        // 恢复按钮状态
        this.refreshIconsBtn.textContent = '刷新';
        this.refreshIconsBtn.disabled = false;
      }
    });

    // 导出网站按钮
    this.exportSitesBtn.addEventListener('click', () => {
      this.exportSites();
    });

    // 导入网站按钮
    this.importSitesBtn.addEventListener('click', () => {
      this.importSitesInput.click();
    });

    // 导入文件选择
    this.importSitesInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.importSites(file);
      }
    });

    // 全局键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + , 打开设置
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        this.settingsPanel.classList.add('active');
      }

      // ESC 关闭设置面板
      if (e.key === 'Escape' && this.settingsPanel.classList.contains('active')) {
        this.settingsPanel.classList.remove('active');
      }
    });
  }

  /**
   * 应用主题
   * @param {string} themeName - 主题名称
   */
  applyTheme(themeName) {
    // 移除所有主题类
    document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'green-theme');
    
    // 添加选中的主题类
    if (themeName !== 'light') {
      document.body.classList.add(themeName + '-theme');
    }

    // 根据主题切换LOGO
    const logoImg = document.querySelector('.logo img');
    const logoContainer = document.querySelector('.logo');
    if (logoImg && logoContainer) {
      if (themeName === 'dark') {
        logoImg.src = 'icons/icon_width_Black.png';
        logoContainer.style.backgroundImage = 'url(icons/icon_width_Black.png)';
      } else {
        logoImg.src = 'icons/icon_width.png';
        logoContainer.style.backgroundImage = 'url(icons/icon_width.png)';
      }
    }
    
    // 更新主题选项的选中状态
    this.themeOptions.forEach(option => {
      if (option.dataset.theme === themeName) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
    
    // 保存主题设置
    this.storageManager.updateSetting('theme', themeName);
  }

  /**
   * 初始化主题选择
   */
  initThemeOptions() {
    this.themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        this.applyTheme(theme);
        this.storageManager.saveSettings();
      });
    });
  }

  /**
   * 初始化自定义下拉菜单
   */
  initCustomDropdowns() {
    // 行数下拉菜单
    this.initDropdown('rowsDropdown', 'quickAccessRows', (value) => {
      this.storageManager.updateSetting('quickAccessRows', parseInt(value));
      this.storageManager.saveSettings();
      this.quickAccessManager.loadQuickAccess();
    });
    
    // 搜索引擎下拉菜单
    this.initDropdown('engineDropdown', 'searchEngine', (value) => {
      this.storageManager.updateSetting('searchEngine', value);
      this.storageManager.saveSettings();
    });
  }

  /**
   * 初始化单个下拉菜单
   * @param {string} dropdownId - 下拉菜单ID
   * @param {string} selectId - 选择框ID
   * @param {Function} changeCallback - 变化回调函数
   */
  initDropdown(dropdownId, selectId, changeCallback) {
    const dropdown = document.getElementById(dropdownId);
    const select = document.getElementById(selectId);
    const selectedOption = dropdown.querySelector('.selected-option');
    const options = dropdown.querySelectorAll('.dropdown-option');
    
    // 点击选中项打开/关闭下拉菜单
    selectedOption.addEventListener('click', () => {
      dropdown.classList.toggle('active');
      
      // 关闭其他下拉菜单
      document.querySelectorAll('.custom-dropdown').forEach((el) => {
        if (el.id !== dropdownId) {
          el.classList.remove('active');
        }
      });
      
      // 标记当前选中的选项
      const currentValue = select.value;
      options.forEach((option) => {
        option.classList.toggle('selected', option.dataset.value === currentValue);
      });
    });
    
    // 点击选项
    options.forEach((option) => {
      option.addEventListener('click', () => {
        const value = option.dataset.value;
        
        // 更新显示文本
        selectedOption.textContent = option.textContent;
        
        // 更新隐藏的select元素
        select.value = value;
        
        // 触发select的change事件
        const event = new Event('change');
        select.dispatchEvent(event);
        
        // 调用回调函数
        if (changeCallback) {
          changeCallback(value);
        }
        
        // 关闭下拉菜单
        dropdown.classList.remove('active');
      });
    });
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
      }
    });
    
    // 初始化选中项
    const initialValue = select.value;
    options.forEach((option) => {
      if (option.dataset.value === initialValue) {
        selectedOption.textContent = option.textContent;
        option.classList.add('selected');
      }
    });
  }

  /**
   * 更新自定义下拉菜单
   * @param {string} dropdownId - 下拉菜单ID
   * @param {string} selectId - 选择框ID
   * @param {*} value - 值
   */
  updateCustomDropdown(dropdownId, selectId, value) {
    const dropdown = document.getElementById(dropdownId);
    const select = document.getElementById(selectId);
    const selectedOption = dropdown.querySelector('.selected-option');
    const options = dropdown.querySelectorAll('.dropdown-option');

    // 更新select的值
    select.value = value;

    // 更新显示文本
    options.forEach((option) => {
      if (option.dataset.value == value) {
        selectedOption.textContent = option.textContent;
      }
    });
  }

  /**
   * 导出常用网站数据
   * 将当前的常用网站列表导出为JSON文件
   */
  exportSites() {
    try {
      // 获取当前设置
      const settings = this.storageManager.getAllSettings();
      let sites = settings.quickSites || [];

      // 导出前去重（以防存储中有重复数据）
      const uniqueSites = [];
      const seenUrls = new Set();

      for (const site of sites) {
        if (site && site.url && !seenUrls.has(site.url)) {
          seenUrls.add(site.url);
          uniqueSites.push(site);
        }
      }

      // 创建导出数据对象
      const exportData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        sites: uniqueSites
      };

      // 转换为JSON字符串
      const jsonString = JSON.stringify(exportData, null, 2);

      // 创建Blob对象
      const blob = new Blob([jsonString], { type: 'application/json' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VistaTab_常用网站_${new Date().toISOString().split('T')[0]}.json`;

      // 触发下载
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // 释放URL对象
      URL.revokeObjectURL(url);

      // 显示导出结果
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

  /**
   * 导入常用网站数据
   * 从JSON文件导入常用网站列表
   * @param {File} file - 要导入的JSON文件
   */
  importSites(file) {
    // 验证文件类型
    if (!file.type.includes('json')) {
      showMessage('请选择JSON格式的文件', 'error');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        // 解析JSON数据
        const jsonData = JSON.parse(e.target.result);

        // 验证数据格式
        if (!jsonData.sites || !Array.isArray(jsonData.sites)) {
          showMessage('文件格式不正确，缺少sites数组', 'error');
          return;
        }

        // 验证每个网站数据的格式并去重
        const validSites = [];
        const seenUrls = new Set(); // 用于检测重复URL
        const seenNames = new Set(); // 用于检测重复名称

        for (const site of jsonData.sites) {
          if (site && typeof site === 'object' && site.name && site.url) {
            // 确保URL格式正确
            let url = site.url.trim();
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              url = 'https://' + url;
            }

            const name = site.name.trim();

            // 检查是否重复（基于URL去重，因为URL是唯一标识）
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

        // 显示去重信息
        const originalCount = jsonData.sites.length;
        const duplicateCount = originalCount - validSites.length;

        // 更新设置（完全替换现有网站）
        this.storageManager.updateSetting('quickSites', validSites);
        this.storageManager.saveSettings();

        // 重新加载快捷访问网站
        this.quickAccessManager.loadQuickAccess();

        // 显示导入结果消息
        let message = `已导入 ${validSites.length} 个网站`;
        if (duplicateCount > 0) {
          message += `，已自动去除 ${duplicateCount} 个重复项`;
        }
        showMessage(message, 'success');

      } catch (error) {
        console.error('导入失败:', error);
        showMessage('文件格式错误，请检查JSON格式', 'error');
      }

      // 清空文件输入框，允许重复选择同一文件
      this.importSitesInput.value = '';
    };

    reader.onerror = () => {
      showMessage('文件读取失败', 'error');
      this.importSitesInput.value = '';
    };

    // 读取文件内容
    reader.readAsText(file);
  }
}
