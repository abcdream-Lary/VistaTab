/**
 * 搜索功能模块
 * 处理搜索相关功能，包括搜索执行和键盘导航等
 *
 * 主要功能：
 * - 搜索框的交互处理
 * - 智能搜索（URL直接跳转，关键词使用搜索引擎）
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
  }

  /**
   * 初始化搜索管理器
   */
  async init() {
    // 引用元素
    this.searchBox = document.getElementById('searchBox');
    this.searchInput = document.getElementById('searchInput');
    this.searchButton = document.getElementById('searchButton');
    
    // 绑定事件
    this.bindEvents();
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
      }
    });
  }

  /**
   * 执行搜索
   */
  performSearch() {
    const query = this.searchInput.value.trim();
    if (query) {
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
