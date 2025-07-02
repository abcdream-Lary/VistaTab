/**
 * 存储管理模块
 * 处理Chrome存储API相关的功能，包括设置保存、加载、搜索历史管理
 *
 * 这个模块封装了所有与数据持久化相关的操作：
 * - Chrome存储API的封装和错误处理
 * - 应用设置的保存和加载
 * - 搜索历史的管理
 * - 数据的同步和本地存储
 */

import { defaultSettings, defaultSites } from './config.js';

/**
 * 存储管理类
 * 负责管理应用的所有数据存储操作
 * 使用Chrome的sync存储保存设置（可跨设备同步）
 * 使用Chrome的local存储保存搜索历史（仅本地）
 */
export class StorageManager {
  /**
   * 构造函数
   * 初始化设置和搜索历史的默认值
   */
  constructor() {
    // 使用展开运算符复制默认设置，避免直接修改原对象
    this.settings = { ...defaultSettings };
    // 初始化搜索历史数组
    this.searchHistoryItems = [];
  }

  /**
   * 从Chrome存储中加载应用设置
   * 使用Chrome的sync存储，支持跨设备同步
   * 如果没有保存的设置，会使用默认值并自动保存
   *
   * @returns {Promise<Object>} 返回加载的设置对象
   * @throws {Error} 当Chrome存储API不可用时抛出错误
   */
  async loadSettings() {
    return new Promise((resolve, reject) => {
      // 检查Chrome存储API是否可用（在非扩展环境中可能不可用）
      if (!chrome.storage) {
        console.error('Chrome存储API不可用');
        reject(new Error('Chrome存储API不可用'));
        return;
      }

      // 从sync存储中获取设置数据
      chrome.storage.sync.get(['settings'], (data) => {
        // 检查是否有运行时错误
        if (chrome.runtime.lastError) {
          console.error('加载设置时出错:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        // 如果存储中有设置数据，合并到当前设置中
        if (data.settings) {
          // 使用展开运算符合并设置，保留默认值的同时应用保存的设置
          this.settings = { ...this.settings, ...data.settings };
        }

        // 特殊处理快捷网站：如果没有保存的网站或数组为空，使用默认网站
        if (!this.settings.quickSites || !Array.isArray(this.settings.quickSites) || this.settings.quickSites.length === 0) {
          // 复制默认网站数组，避免直接引用
          this.settings.quickSites = [...defaultSites];

          // 立即保存默认网站到存储，确保下次加载时有数据
          this.saveSettings().then(() => {
            console.log('已保存默认网站到设置');
          });
        }

        // 返回加载完成的设置对象
        resolve(this.settings);
      });
    });
  }

  /**
   * 保存设置
   * @param {boolean} showMessage - 是否显示保存成功消息
   * @returns {Promise<void>}
   */
  async saveSettings(showMessage = false) {
    return new Promise((resolve, reject) => {
      if (!chrome.storage) {
        reject(new Error('Chrome存储API不可用'));
        return;
      }

      chrome.storage.sync.set({ 'settings': this.settings }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        
        if (showMessage) {
          // 这里可以触发一个事件来显示消息，而不是直接操作DOM
          window.dispatchEvent(new CustomEvent('showMessage', {
            detail: { message: '设置已保存', type: 'success' }
          }));
        }
        resolve();
      });
    });
  }

  /**
   * 加载搜索历史
   * @returns {Promise<Array>} 搜索历史数组
   */
  async loadSearchHistory() {
    return new Promise((resolve, reject) => {
      // 检查Chrome存储API是否可用
      if (!chrome.storage) {
        console.error('Chrome存储API不可用');
        resolve([]); // 返回空数组而不是拒绝
        return;
      }

      chrome.storage.local.get(['searchHistory'], (data) => {
        if (chrome.runtime.lastError) {
          console.error('加载搜索历史时出错:', chrome.runtime.lastError);
          resolve([]); // 出错时返回空数组
          return;
        }

        if (data.searchHistory) {
          this.searchHistoryItems = data.searchHistory;
        }
        resolve(this.searchHistoryItems);
      });
    });
  }

  /**
   * 保存搜索历史
   * @returns {Promise<void>}
   */
  async saveSearchHistory() {
    return new Promise((resolve, reject) => {
      if (!this.settings.saveHistory) {
        resolve();
        return;
      }

      if (!chrome.storage) {
        reject(new Error('Chrome存储API不可用'));
        return;
      }

      chrome.storage.local.set({ 'searchHistory': this.searchHistoryItems }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * 添加搜索历史项
   * @param {string} query - 搜索查询
   */
  addSearchHistory(query) {
    if (!this.settings.saveHistory || !query) return;
    
    // 移除已存在的相同查询
    this.searchHistoryItems = this.searchHistoryItems.filter(item => item !== query);
    
    // 添加到历史记录开头
    this.searchHistoryItems.unshift(query);
    
    // 限制历史记录数量
    if (this.searchHistoryItems.length > this.settings.historyLimit) {
      this.searchHistoryItems = this.searchHistoryItems.slice(0, this.settings.historyLimit);
    }
    
    // 保存历史记录
    this.saveSearchHistory();
  }

  /**
   * 清除搜索历史
   */
  clearSearchHistory() {
    this.searchHistoryItems = [];
    return this.saveSearchHistory();
  }

  /**
   * 更新设置项
   * @param {string} key - 设置键
   * @param {*} value - 设置值
   */
  updateSetting(key, value) {
    this.settings[key] = value;
  }

  /**
   * 获取设置项
   * @param {string} key - 设置键
   * @returns {*} 设置值
   */
  getSetting(key) {
    return this.settings[key];
  }

  /**
   * 获取所有设置
   * @returns {Object} 设置对象
   */
  getAllSettings() {
    return { ...this.settings };
  }

  /**
   * 获取搜索历史
   * @returns {Array} 搜索历史数组
   */
  getSearchHistory() {
    return [...this.searchHistoryItems];
  }
}
