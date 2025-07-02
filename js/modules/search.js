/**
 * 搜索功能模块
 * 处理搜索相关功能，包括搜索历史、搜索执行、键盘导航等
 *
 * 主要功能：
 * - 搜索框的交互处理
 * - 搜索历史的显示和管理
 * - 键盘导航（上下箭头选择历史记录）
 * - 智能搜索（URL直接跳转，关键词使用搜索引擎）
 * - 搜索历史的过滤和匹配
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
   * @param {StorageManager} storageManager - 存储管理器实例，用于管理搜索历史
   */
  constructor(storageManager) {
    // 存储管理器引用，用于保存和加载搜索历史
    this.storageManager = storageManager;
    // 当前选中的搜索历史项索引（-1表示未选中）
    this.selectedHistoryIndex = -1;
    // 标记搜索历史事件是否已初始化，避免重复绑定
    this.searchHistoryEventsInitialized = false;

    // 获取搜索相关的DOM元素
    this.searchInput = document.getElementById('searchInput');           // 搜索输入框
    this.searchButton = document.getElementById('searchButton');         // 搜索按钮
    this.searchHistory = document.getElementById('searchHistory');       // 搜索历史容器
    this.historyList = document.getElementById('historyList');           // 搜索历史列表
    this.clearHistoryBtn = document.getElementById('clearHistory');      // 清除历史按钮
  }

  /**
   * 初始化搜索功能
   * 设置所有必要的事件监听器和初始状态
   */
  init() {
    this.initSearchHistoryEvents();  // 初始化搜索历史相关事件
    this.bindEvents();               // 绑定其他事件
    this.renderSearchHistory();      // 渲染搜索历史列表
  }

  /**
   * 初始化搜索历史事件监听器
   * 设置搜索框的交互行为，包括点击、输入、键盘导航等
   * 使用标记避免重复初始化
   */
  initSearchHistoryEvents() {
    // 如果已经初始化过，直接返回，避免重复绑定事件
    if (this.searchHistoryEventsInitialized) {
      return;
    }

    // 点击搜索框时显示搜索历史下拉列表
    this.searchInput.addEventListener('click', () => {
      this.showSearchHistory();
    });

    // 用户输入时实时过滤搜索历史
    this.searchInput.addEventListener('input', () => {
      const settings = this.storageManager.getAllSettings();
      const searchHistory = this.storageManager.getSearchHistory();
      // 只有在启用搜索历史且有历史记录时才进行过滤
      if (settings.saveHistory && searchHistory.length > 0) {
        this.filterAndShowHistory(this.searchInput.value.trim());
      }
    });

    // 点击页面其他地方关闭历史记录
    document.addEventListener('click', (event) => {
      if (!this.searchInput.contains(event.target) &&
          !this.searchHistory.contains(event.target)) {
        this.searchHistory.classList.remove('active');
      }
    });

    // 搜索按钮点击事件
    this.searchButton.addEventListener('click', () => this.performSearch());

    // 输入框键盘事件
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      } else if (e.key === 'ArrowDown' && this.searchHistory.classList.contains('active')) {
        e.preventDefault();
        this.navigateHistory('down');
      } else if (e.key === 'ArrowUp' && this.searchHistory.classList.contains('active')) {
        e.preventDefault();
        this.navigateHistory('up');
      } else if (e.key === 'Escape' && this.searchHistory.classList.contains('active')) {
        this.searchHistory.classList.remove('active');
      }
    });

    this.searchHistoryEventsInitialized = true;
  }

  /**
   * 绑定其他事件
   */
  bindEvents() {
    // 监听窗口大小变化，重新调整搜索历史高度
    window.addEventListener('resize', () => {
      if (this.searchHistory.classList.contains('active')) {
        this.adjustHistoryHeight();
      }
    });

    // 清除搜索历史
    this.clearHistoryBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.storageManager.clearSearchHistory();
      this.renderSearchHistory();
      this.searchHistory.classList.remove('active');
    });
  }

  /**
   * 键盘导航搜索历史
   * @param {string} direction - 导航方向 ('up' 或 'down')
   */
  navigateHistory(direction) {
    const historyItems = this.historyList.querySelectorAll('.history-item');
    const searchHistory = this.storageManager.getSearchHistory();
    
    if (historyItems.length === 0) return;

    // 移除之前的选中状态
    historyItems.forEach(item => item.classList.remove('selected'));

    if (direction === 'down') {
      this.selectedHistoryIndex = Math.min(this.selectedHistoryIndex + 1, historyItems.length - 1);
    } else if (direction === 'up') {
      this.selectedHistoryIndex = Math.max(this.selectedHistoryIndex - 1, -1);
    }

    if (this.selectedHistoryIndex >= 0) {
      historyItems[this.selectedHistoryIndex].classList.add('selected');
      this.searchInput.value = searchHistory[this.selectedHistoryIndex];
    } else {
      this.searchInput.value = '';
    }
  }

  /**
   * 显示搜索历史
   */
  showSearchHistory() {
    const settings = this.storageManager.getAllSettings();
    const searchHistory = this.storageManager.getSearchHistory();
    
    if (settings.saveHistory && searchHistory.length > 0) {
      this.selectedHistoryIndex = -1; // 重置选中索引
      this.renderSearchHistory();
      this.adjustHistoryHeight();
      this.searchHistory.classList.add('active');
    }
  }

  /**
   * 动态调整搜索历史高度
   */
  adjustHistoryHeight() {
    const searchBox = document.querySelector('.search-box');
    const searchBoxRect = searchBox.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // 计算搜索框下方到窗口底部的可用空间，使用更保守的比例
    const availableHeight = (windowHeight - searchBoxRect.bottom) * 0.6; // 只使用60%的可用空间

    // 设置最大高度，但不超过250px，不少于120px
    const maxHeight = Math.max(120, Math.min(availableHeight, 250));

    this.historyList.style.maxHeight = maxHeight + 'px';
  }

  /**
   * 过滤并显示搜索历史
   * @param {string} query - 搜索查询
   */
  filterAndShowHistory(query) {
    if (!query) {
      this.showSearchHistory();
      return;
    }

    const searchHistory = this.storageManager.getSearchHistory();
    // 过滤匹配的历史记录
    const filteredItems = searchHistory.filter(item =>
      item.toLowerCase().includes(query.toLowerCase())
    );

    if (filteredItems.length > 0) {
      this.selectedHistoryIndex = -1;
      this.renderFilteredHistory(filteredItems);
      this.adjustHistoryHeight();
      this.searchHistory.classList.add('active');
    } else {
      this.searchHistory.classList.remove('active');
    }
  }

  /**
   * 渲染过滤后的搜索历史
   * @param {Array} filteredItems - 过滤后的历史记录
   */
  renderFilteredHistory(filteredItems) {
    if (!this.historyList) return;

    this.historyList.innerHTML = '';

    filteredItems.forEach((item) => {
      const historyItem = this.createHistoryItem(item);
      this.historyList.appendChild(historyItem);
    });
  }

  /**
   * 渲染搜索历史列表
   */
  renderSearchHistory() {
    if (!this.historyList) {
      console.error('historyList元素不存在！');
      return;
    }

    this.historyList.innerHTML = '';
    const searchHistory = this.storageManager.getSearchHistory();

    // 如果没有搜索历史，不渲染任何内容
    if (searchHistory.length === 0) {
      return;
    }
    
    searchHistory.forEach((item) => {
      const historyItem = this.createHistoryItem(item);
      this.historyList.appendChild(historyItem);
    });
  }

  /**
   * 创建历史记录项元素
   * @param {string} item - 历史记录项
   * @returns {HTMLElement} 历史记录项元素
   */
  createHistoryItem(item) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const icon = document.createElement('div');
    icon.className = 'history-item-icon';
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
    
    const text = document.createElement('div');
    text.className = 'history-item-text';
    text.textContent = item;
    
    historyItem.appendChild(icon);
    historyItem.appendChild(text);
    
    historyItem.addEventListener('click', () => {
      this.searchInput.value = item;
      this.searchHistory.classList.remove('active');
      this.performSearch();
    });
    
    return historyItem;
  }

  /**
   * 执行搜索
   */
  performSearch() {
    const query = this.searchInput.value.trim();
    if (query) {
      // 添加到搜索历史
      this.storageManager.addSearchHistory(query);
      
      // 判断是否是URL
      if (isURL(query)) {
        // 如果是URL，直接跳转
        let url = query;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        window.location.href = url;
      } else {
        // 如果不是URL，使用搜索引擎搜索
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
