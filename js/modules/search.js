/**
 * 搜索功能模块
 * 处理搜索相关功能，包括搜索执行和键盘导航等
 *
 * 主要功能：
 * - 搜索框的交互处理
 * - 智能搜索（URL直接跳转，关键词使用搜索引擎）
 * - 搜索自动补全
 */

import { searchEngines } from './config.js';
import { isURL } from './utils.js';

/**
 * 搜索管理类
 * 负责处理所有与搜索相关的功能和交互
 */
export class SearchManager {
  /**
   * 构造函数
   * @param {StorageManager} storageManager - 存储管理器实例
   */
  constructor(storageManager) {
    // 存储管理器引用
    this.storageManager = storageManager;
    // 保存对isURL函数的引用
    this.isURLFunc = isURL;

    // 获取搜索相关的DOM元素
    this.searchInput = document.getElementById('searchInput');           // 搜索输入框
    this.searchButton = document.getElementById('searchButton');         // 搜索按钮
    
    // 自动补全相关
    this.suggestionTimeout = null;
    this.suggestionContainer = null;
    this.selectedIndex = -1;
    this.suggestionEnabled = true; // 默认启用
  }

  /**
   * 初始化搜索管理器
   */
  async init() {
    // 引用元素
    this.searchBox = document.querySelector('.search-box');
    this.searchInput = document.getElementById('searchInput');
    this.searchButton = document.getElementById('searchButton');
    
    // 创建自动补全容器
    this.createSuggestionContainer();
    
    // 绑定事件
    this.bindEvents();
    
    // 检查设置是否启用自动补全
    this.checkSuggestionSetting();
    
    // 监听设置变更事件
    window.addEventListener('settingsChanged', (e) => {
      if (e.detail && e.detail.key === 'enableSuggestions') {
        this.suggestionEnabled = e.detail.value;
        // 如果禁用，则隐藏当前显示的建议
        if (!this.suggestionEnabled) {
          this.hideSuggestions();
        }
      }
    });
  }
  
  /**
   * 创建自动补全容器
   */
  createSuggestionContainer() {
  // 确保searchBox已初始化
  if (!this.searchBox) {
    // 直接获取搜索框元素，注意是class，不是id
    this.searchBox = document.querySelector('.search-box');
  }
  
  // 如果找不到搜索框元素，则返回
  if (!this.searchBox) {
    console.error('找不到搜索框元素！');
    return;
  }
  
  // 检查是否已存在建议容器
  const existingContainer = document.getElementById('searchSuggestions');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  // 创建自动补全容器
  this.suggestionContainer = document.createElement('div');
  this.suggestionContainer.className = 'suggestion-container';
  this.suggestionContainer.id = 'searchSuggestions';
  this.suggestionContainer.style.display = 'none';
  this.suggestionContainer.style.position = 'absolute';
  this.suggestionContainer.style.width = '100%';
  this.suggestionContainer.style.top = '100%';
  this.suggestionContainer.style.left = '0';
  this.suggestionContainer.style.backgroundColor = 'var(--card-bg)';
  this.suggestionContainer.style.borderRadius = 'var(--border-radius-medium)';
  this.suggestionContainer.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
  this.suggestionContainer.style.zIndex = '1000';
  this.suggestionContainer.style.marginTop = '8px';
  this.suggestionContainer.style.border = '1px solid var(--border-color)';
  this.suggestionContainer.style.maxHeight = '320px';
  this.suggestionContainer.style.overflowY = 'auto';
  this.suggestionContainer.style.overflowX = 'hidden';
  
  // 将容器添加到搜索框下方
  this.searchBox.style.position = 'relative';
  this.searchBox.appendChild(this.suggestionContainer);
}

/**
 * 检查是否启用搜索自动补全功能
 */
checkSuggestionSetting() {
  const settings = this.storageManager.getAllSettings();
  this.suggestionEnabled = settings.enableSuggestions !== false;
}

/**
 * 搜索框输入时获取建议
 */
handleInput() {
  const query = this.searchInput.value.trim();
  
  // 清除之前的延时
  if (this.suggestionTimeout) {
    clearTimeout(this.suggestionTimeout);
  }
  
  // 如果输入为空，隐藏建议
  if (query === '') {
    this.hideSuggestions();
    return;
  }
  
  // 如果未启用自动补全，则不获取建议
  if (!this.suggestionEnabled) {
    return;
  }
  
  // 设置延时，减少请求频率
  this.suggestionTimeout = setTimeout(() => {
    this.fetchSuggestions(query);
  }, 300);
  }

  /**
   * 绑定事件处理程序
   */
  bindEvents() {
    // 点击搜索按钮执行搜索
    this.searchButton.addEventListener('click', () => {
      this.performSearch();
    });

    // 在搜索框按下回车键执行搜索
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
    } else if (e.key === 'ArrowDown' && this.suggestionEnabled) {
      // 向下选择建议
      e.preventDefault();
      this.navigateSuggestion(1);
    } else if (e.key === 'ArrowUp' && this.suggestionEnabled) {
      // 向上选择建议
      e.preventDefault();
      this.navigateSuggestion(-1);
    } else if (e.key === 'Escape') {
      // 按ESC键隐藏建议
      this.hideSuggestions();
    }
  });
  
  // 搜索框输入时获取建议
  this.searchInput.addEventListener('input', () => {
    this.handleInput();
  });
  
  // 添加焦点事件，当点击输入框时如果已有内容则显示建议
  this.searchInput.addEventListener('focus', () => {
    const query = this.searchInput.value.trim();
    if (query !== '' && this.suggestionEnabled) {
      // 直接获取建议，无需延迟
      this.fetchSuggestions(query);
    }
  });
  
  // 点击页面其他区域隐藏建议
  document.addEventListener('click', (e) => {
    // 点击的不是搜索框也不是建议列表，则隐藏建议
    if (!this.searchBox.contains(e.target) && !this.suggestionContainer.contains(e.target)) {
      this.hideSuggestions();
    }
  });
}
  
  /**
   * 获取搜索建议
   * @param {string} query - 搜索关键词
   */
  fetchSuggestions(query) {
    // 第一种方法: XMLHttpRequest
    const xhr = new XMLHttpRequest();
    const url = `https://suggestion.baidu.com/su?wd=${encodeURIComponent(query)}&action=opensearch`;
    
    xhr.open('GET', url, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            
            if (data && data[1] && data[1].length > 0) {
              this.showSuggestions(data[1]);
            } else {
              this.hideSuggestions();
            }
          } catch (e) {
            // 如果方法1失败，尝试方法2
            this.fetchSuggestionsFallback(query);
          }
        } else {
          // 如果方法1失败，尝试方法2
          this.fetchSuggestionsFallback(query);
        }
      }
    };
    
    xhr.onerror = () => {
      // 如果方法1失败，尝试方法2
      this.fetchSuggestionsFallback(query);
    };
    
    xhr.send();
  }

  /**
   * 获取搜索建议的备用方法 - 使用本地数据
   * @param {string} query - 搜索关键词
   */
  fetchSuggestionsFallback(query) {
    // 为常见查询词提供固定建议
    const commonQueries = {
      '你好': [
        "你好",
        "你好李焕英",
        "你好星期六",
        "你好李焕英在线观看免费完整版",
        "你好李焕英票房",
        "你好李焕英观后感",
        "你好星期六2024",
        "你好星期六最新一期"
      ],
      '百度': [
        "百度",
        "百度网盘",
        "百度地图",
        "百度翻译",
        "百度贴吧",
        "百度网盘下载",
        "百度云",
        "百度学术"
      ],
      '谷歌': [
        "谷歌",
        "谷歌翻译",
        "谷歌浏览器",
        "谷歌地图",
        "谷歌学术",
        "谷歌搜索",
        "谷歌相册",
        "谷歌地球"
      ],
      '淘宝': [
        "淘宝",
        "淘宝网",
        "淘宝电脑版",
        "淘宝特价版",
        "淘宝直播",
        "淘宝联盟",
        "淘宝客服",
        "淘宝券"
      ],
      '天气': [
        "天气",
        "天气预报",
        "天气预报15天查询",
        "天气通",
        "天气预报查询一周",
        "天气之子",
        "天气预报查询",
        "天气预报30天"
      ]
    };
    
    // 检查用户输入是否匹配常见查询词
    for (const key in commonQueries) {
      if (query.includes(key)) {
        this.showSuggestions(commonQueries[key]);
        return;
      }
    }
    
    // 如果没有匹配的常见查询词，生成基于用户输入的建议
    const suffixes = ['是什么', '怎么样', '价格', '官网', '百科', '图片', '视频', '下载', '教程', '官方网站'];
    const prefixes = ['如何', '免费', '在线', '最新', '热门', '手机', '电脑', '推荐', '2024'];
    
    let suggestions = [];
    
    // 添加后缀建议
    suffixes.forEach(suffix => {
      suggestions.push(query + suffix);
    });
    
    // 添加前缀建议（最多3个）
    for (let i = 0; i < 3 && i < prefixes.length; i++) {
      suggestions.push(prefixes[i] + query);
    }
    
    this.showSuggestions(suggestions);
  }
  
  /**
   * 显示搜索建议
   * @param {Array} suggestions - 建议数组
   */
  showSuggestions(suggestions) {
    // 清空容器
    this.suggestionContainer.innerHTML = '';
    
    // 重置选中索引
    this.selectedIndex = -1;
    
    // 设置容器样式 - 修复滚动问题
    this.suggestionContainer.style.borderRadius = 'var(--border-radius-medium)';
    this.suggestionContainer.style.overflow = ''; // 移除overflow: hidden
    this.suggestionContainer.style.overflowY = 'auto'; // 确保y轴可滚动
    this.suggestionContainer.style.overflowX = 'hidden'; // x轴保持隐藏
    
    // 创建建议项
    suggestions.forEach((text, index) => {
      const item = document.createElement('div');
      item.style.padding = '12px 16px'; // 增加内边距
      item.style.cursor = 'pointer';
      item.style.color = 'var(--text-color)';
      item.style.backgroundColor = 'var(--card-bg)';
      item.style.transition = 'background-color 0.2s';
      item.style.display = 'flex';
      item.style.alignItems = 'center'; // 确保垂直居中
      
      // 添加搜索图标
      const icon = document.createElement('span');
      icon.style.marginRight = '12px'; // 增加图标右侧间距
      icon.style.opacity = '0.7';
      icon.style.display = 'flex'; // 使SVG容器也是flex
      icon.style.alignItems = 'center'; // 确保SVG垂直居中
      icon.style.justifyContent = 'center'; // 确保SVG水平居中
      icon.style.color = 'var(--text-color)';
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
      
      // 添加文本
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      textSpan.style.flex = '1';
      textSpan.style.overflow = 'hidden';
      textSpan.style.textOverflow = 'ellipsis';
      textSpan.style.whiteSpace = 'nowrap';
      textSpan.style.fontSize = '14px'; // 增大文字大小
      textSpan.style.fontWeight = '400'; // 稍微加粗一点
      textSpan.style.color = 'var(--text-color)';
      
      item.appendChild(icon);
      item.appendChild(textSpan);
      
      // 只有当鼠标真正悬停在项上时才高亮
      item.addEventListener('mouseenter', () => {
        // 清除所有高亮
        const allItems = this.suggestionContainer.children;
        for (let i = 0; i < allItems.length; i++) {
          allItems[i].style.backgroundColor = 'var(--card-bg)';
        }
        // 高亮当前项
        item.style.backgroundColor = 'var(--dropdown-hover)';
        this.selectedIndex = index;
      });
      
      item.addEventListener('mouseleave', () => {
        // 当鼠标离开时恢复原来的背景色
        item.style.backgroundColor = 'var(--card-bg)';
        // 如果有键盘选中的项，恢复它的高亮
        if (this.selectedIndex >= 0) {
          const selectedItem = this.suggestionContainer.children[this.selectedIndex];
          if (selectedItem && selectedItem !== item) {
            selectedItem.style.backgroundColor = 'var(--dropdown-hover)';
          } else {
            this.selectedIndex = -1; // 如果鼠标离开的就是当前选中项，重置选中状态
          }
        }
      });
      
      // 点击建议项
      item.addEventListener('click', () => {
        this.searchInput.value = text;
        this.performSearch();
      });
      
      this.suggestionContainer.appendChild(item);
    });
    
    // 显示建议容器
    this.suggestionContainer.style.display = 'block';
  }
  
  /**
   * 隐藏搜索建议
   */
  hideSuggestions() {
    if (this.suggestionContainer) {
      this.suggestionContainer.style.display = 'none';
    }
  }
  
  /**
   * 导航建议列表
   * @param {number} direction - 方向，1向下，-1向上
   */
  navigateSuggestion(direction) {
    const items = this.suggestionContainer.children;
    if (items.length === 0) return;
    
    // 清除所有项的高亮
    for (let i = 0; i < items.length; i++) {
      items[i].style.backgroundColor = 'var(--card-bg)';
    }
    
    // 计算新索引
    let newIndex = this.selectedIndex + direction;
    
    // 循环导航
    if (newIndex < 0) {
      newIndex = items.length - 1;
    } else if (newIndex >= items.length) {
      newIndex = 0;
    }
    
    // 设置新的选中项
    if (newIndex >= 0 && newIndex < items.length) {
      const selectedItem = items[newIndex];
      selectedItem.style.backgroundColor = 'var(--dropdown-hover)';
      this.selectedIndex = newIndex;
      
      // 更新输入框
      this.searchInput.value = selectedItem.querySelector('span:nth-child(2)').textContent;
      
      // 使用原生scrollIntoView实现流畅滚动
      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * 执行搜索
   */
  performSearch() {
    const query = this.searchInput.value.trim();
    if (query) {
      // 隐藏建议
      this.hideSuggestions();
      
      // 判断是否是URL
      if (this.isURLFunc(query)) {
        // 如果是URL，直接跳转
        let url = query;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        window.location.href = url;
      } else {
        // 使用搜索引擎
        const settings = this.storageManager.getAllSettings();
        window.location.href = searchEngines[settings.searchEngine] + encodeURIComponent(query);
      }
    }
  }

  /**
   * 聚焦搜索框
   */
  focusSearchInput() {
    this.searchInput.focus();
    this.searchInput.select();
  }
}
