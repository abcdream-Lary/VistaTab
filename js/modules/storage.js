/**
 * 存储模块
 * 
 * 负责所有数据的保存和读取：
 * - 用Chrome的storage API来存储数据
 * - 保存和加载用户设置
 * - 处理默认数据
 * 
 * 相当于整个应用的数据仓库
 */

import { defaultSettings, defaultSites } from './config.js';

/**
 * 存储管理类
 * 负责处理插件的数据存储
 */
export class StorageManager {
  /**
   * 构造函数
   * 先初始化默认设置
   */
  constructor() {
    // 复制一份默认设置，避免意外修改原始对象
    this.settings = { ...defaultSettings };
  }

  /**
   * 从Chrome存储中加载设置
   * 如果是第一次使用，就用默认设置
   *
   * @returns {Promise<Object>} 返回设置对象
   */
  async loadSettings() {
    return new Promise((resolve, reject) => {
      // 检查Chrome存储API是否可用
      if (!chrome.storage) {
        console.error('Chrome存储API不可用，可能不是在插件环境运行');
        reject(new Error('Chrome存储API不可用'));
        return;
      }

      // 从存储中读取设置
      chrome.storage.sync.get(['settings'], (data) => {
        // 检查是否有错误
        if (chrome.runtime.lastError) {
          console.error('读取设置时出错:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        // 如果有保存的设置，就用它覆盖默认设置
        if (data.settings) {
          this.settings = { ...this.settings, ...data.settings };
        }

        // 特殊处理：如果没有保存的网站，使用默认网站列表
        if (!this.settings.quickSites || !Array.isArray(this.settings.quickSites) || this.settings.quickSites.length === 0) {
          // 复制一份默认网站列表，避免直接引用
          this.settings.quickSites = [...defaultSites];

          // 顺便把默认网站保存起来
          this.saveSettings().then(() => {
            console.log('已保存默认网站列表');
          });
        }

        // 返回最终的设置对象
        resolve(this.settings);
      });
    });
  }

  /**
   * 保存设置到Chrome存储
   * @param {boolean} showMessage - 是否显示"保存成功"的提示
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
          // 触发一个事件来显示保存成功的消息
          window.dispatchEvent(new CustomEvent('showMessage', {
            detail: { message: '设置已保存', type: 'success' }
          }));
        }
        resolve();
      });
    });
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
}
