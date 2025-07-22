/**
 * 弹窗管理模块
 * 处理所有弹窗相关功能，包括添加、编辑、删除网站弹窗
 *
 * 主要功能：
 * - 添加网站弹窗的显示和处理
 * - 编辑网站弹窗的显示和处理
 * - 删除确认弹窗的显示和处理
 * - 表单验证和错误提示
 * - 键盘交互支持（Enter键提交、ESC键取消）
 * - 弹窗外部点击关闭功能
 */

import { isValidUrl, showInputError, clearInputError, showMessage } from './utils.js';

/**
 * 弹窗管理类
 * 负责管理所有弹窗的显示、隐藏和用户交互
 * 处理网站的添加、编辑、删除操作
 */
export class ModalManager {
  /**
   * 构造函数
   * @param {StorageManager} storageManager - 存储管理器实例
   * @param {QuickAccessManager} quickAccessManager - 快捷访问管理器实例
   */
  constructor(storageManager, quickAccessManager) {
    // 存储管理器引用，用于保存网站数据
    this.storageManager = storageManager;
    // 快捷访问管理器引用，用于刷新网站显示
    this.quickAccessManager = quickAccessManager;
    // 当前正在编辑的网站索引（-1表示未选中）
    this.currentEditIndex = -1;

    // 获取弹窗相关的DOM元素
    this.addSiteModal = document.getElementById('addSiteModal');           // 添加网站弹窗
    this.editSiteModal = document.getElementById('editSiteModal');         // 编辑网站弹窗
    this.confirmDeleteModal = document.getElementById('confirmDeleteModal'); // 删除确认弹窗
    this.closeModalBtns = document.querySelectorAll('.close-modal');       // 所有关闭按钮
    
    // 添加网站弹窗元素
    this.siteNameInput = document.getElementById('siteName');
    this.siteUrlInput = document.getElementById('siteUrl');
    this.confirmAddSiteBtn = document.getElementById('confirmAddSite');
    this.cancelAddSiteBtn = document.getElementById('cancelAddSite');
    
    // 编辑网站弹窗元素
    this.editSiteNameInput = document.getElementById('editSiteName');
    this.editSiteUrlInput = document.getElementById('editSiteUrl');
    this.confirmEditSiteBtn = document.getElementById('confirmEditSite');
    this.cancelEditSiteBtn = document.getElementById('cancelEditSite');
    this.deleteSiteBtn = document.getElementById('deleteSite');
    
    // 删除确认弹窗元素
    this.confirmDeleteBtn = document.getElementById('confirmDelete');
    this.cancelDeleteBtn = document.getElementById('cancelDelete');
    this.deleteItemNameSpan = document.getElementById('deleteItemName');
  }

  /**
   * 初始化弹窗功能
   */
  init() {
    this.bindEvents();
    this.bindCustomEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 关闭弹窗按钮
    this.closeModalBtns.forEach((btn) => {
      btn.addEventListener('click', () => this.closeAllModals());
    });
    
    // 点击弹窗外部关闭弹窗
    window.addEventListener('click', (event) => {
      if (event.target === this.addSiteModal) {
        this.closeAllModals();
      }
      if (event.target === this.editSiteModal) {
        this.closeAllModals();
      }
      if (event.target === this.confirmDeleteModal) {
        this.closeAllModals();
      }
    });
    
    // 添加网站相关事件
    this.confirmAddSiteBtn.addEventListener('click', () => this.addSite());
    this.cancelAddSiteBtn.addEventListener('click', () => this.closeAllModals());
    
    // 编辑网站相关事件
    this.confirmEditSiteBtn.addEventListener('click', () => this.updateSite());
    this.cancelEditSiteBtn.addEventListener('click', () => this.closeAllModals());
    this.deleteSiteBtn.addEventListener('click', () => this.deleteSite());
    
    // 删除确认相关事件
    this.confirmDeleteBtn.addEventListener('click', () => this.confirmDeleteSite());
    this.cancelDeleteBtn.addEventListener('click', () => this.closeAllModals());
    
    // 键盘事件
    this.bindKeyboardEvents();
    
    // 输入验证事件
    this.bindInputValidationEvents();
  }

  /**
   * 绑定自定义事件
   */
  bindCustomEvents() {
    // 监听打开添加网站弹窗的事件
    window.addEventListener('openAddSiteModal', () => {
      this.openAddSiteModal();
    });
    
    // 监听打开编辑网站弹窗的事件
    window.addEventListener('openEditSiteModal', (event) => {
      this.openEditSiteModal(event.detail.index);
    });
  }

  /**
   * 绑定键盘事件
   */
  bindKeyboardEvents() {
    // 添加网站弹窗键盘事件
    this.siteNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.siteUrlInput.focus();
      }
    });

    this.siteUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addSite();
      }
    });
    
    // 编辑网站弹窗键盘事件
    this.editSiteNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.editSiteUrlInput.focus();
      }
    });
    
    this.editSiteUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.updateSite();
      }
    });
  }

  /**
   * 绑定输入验证事件
   */
  bindInputValidationEvents() {
    // 输入时清除错误状态
    this.siteNameInput.addEventListener('input', () => {
      clearInputError(this.siteNameInput);
    });

    this.siteUrlInput.addEventListener('input', () => {
      clearInputError(this.siteUrlInput);
    });
  }

  /**
   * 打开添加网站弹窗
   */
  openAddSiteModal() {
    // 清空输入框
    this.siteNameInput.value = '';
    this.siteUrlInput.value = '';
    
    // 清除可能存在的错误状态
    clearInputError(this.siteNameInput);
    clearInputError(this.siteUrlInput);
    
    // 显示弹窗
    this.addSiteModal.classList.add('active');
    
    // 不再自动聚焦输入框
  }

  /**
   * 打开编辑网站弹窗
   * @param {number} index - 网站索引
   */
  openEditSiteModal(index) {
    this.currentEditIndex = index;
    
    // 获取网站信息
    const settings = this.storageManager.getAllSettings();
    const site = settings.quickSites[index];
    
    if (!site) {
      console.error('网站不存在:', index);
      return;
    }
    
    // 填充表单
    this.editSiteNameInput.value = site.name;
    this.editSiteUrlInput.value = site.url;
    
    // 显示弹窗
    this.editSiteModal.classList.add('active');
    
    // 不再自动聚焦输入框
  }

  /**
   * 关闭所有弹窗
   */
  closeAllModals() {
    // 为活动的弹窗添加淡出动画
    if (this.addSiteModal.classList.contains('active')) {
      this.addSiteModal.classList.add('fade-out');
    }
    if (this.editSiteModal.classList.contains('active')) {
      this.editSiteModal.classList.add('fade-out');
    }
    if (this.confirmDeleteModal.classList.contains('active')) {
      this.confirmDeleteModal.classList.add('fade-out');
    }
    
    // 等待动画完成后隐藏弹窗
    setTimeout(() => {
      // 移除活动状态和淡出类
      this.addSiteModal.classList.remove('active', 'fade-out');
      this.editSiteModal.classList.remove('active', 'fade-out');
      this.confirmDeleteModal.classList.remove('active', 'fade-out');
      
      // 清除错误状态
      clearInputError(this.siteNameInput);
      clearInputError(this.siteUrlInput);
      clearInputError(this.editSiteNameInput);
      clearInputError(this.editSiteUrlInput);
    }, 200); // 动画持续时间
  }

  /**
   * 添加网站
   */
  addSite() {
    const name = this.siteNameInput.value.trim();
    let url = this.siteUrlInput.value.trim();
    
    // 验证输入
    if (!name) {
      showInputError(this.siteNameInput, '请输入网站名称');
      return;
    }

    if (!url) {
      showInputError(this.siteUrlInput, '请输入网站地址');
      return;
    }

    // 验证URL格式
    if (!isValidUrl(url)) {
      showInputError(this.siteUrlInput, '请输入有效的网站地址');
      return;
    }
    
    // 确保URL格式正确
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // 获取当前设置
    const settings = this.storageManager.getAllSettings();
    
    // 初始化quickSites数组（如果还没有的话）
    if (!settings.quickSites || !Array.isArray(settings.quickSites)) {
      settings.quickSites = [];
    }
    
    // 添加新网站
    settings.quickSites.push({
      name: name,
      url: url
    });
    
    // 更新设置
    this.storageManager.updateSetting('quickSites', settings.quickSites);
    this.storageManager.saveSettings();
    
    // 关闭弹窗
    this.closeAllModals();
    
    // 重新加载快捷访问网站
    this.quickAccessManager.loadQuickAccess();
    
    // 显示成功消息
    showMessage(`已添加 "${name}"`, 'success');
  }

  /**
   * 更新网站
   */
  updateSite() {
    const name = this.editSiteNameInput.value.trim();
    let url = this.editSiteUrlInput.value.trim();
    
    // 验证输入
    if (!name) {
      showInputError(this.editSiteNameInput, '请输入网站名称');
      return;
    }
    
    if (!url) {
      showInputError(this.editSiteUrlInput, '请输入网站地址');
      return;
    }
    
    // 验证URL格式
    if (!isValidUrl(url)) {
      showInputError(this.editSiteUrlInput, '请输入有效的网站地址');
      return;
    }
    
    // 确保URL格式正确
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // 获取当前设置
    const settings = this.storageManager.getAllSettings();
    
    // 更新网站
    if (this.currentEditIndex >= 0 && this.currentEditIndex < settings.quickSites.length) {
      settings.quickSites[this.currentEditIndex] = {
        name: name,
        url: url
      };
      
      // 更新设置
      this.storageManager.updateSetting('quickSites', settings.quickSites);
      this.storageManager.saveSettings();
      
      // 关闭弹窗
      this.closeAllModals();
      
      // 重新加载快捷访问网站
      this.quickAccessManager.loadQuickAccess();
      
      // 显示成功消息
      showMessage(`已更新 "${name}"`, 'success');
    }
  }

  /**
   * 删除网站
   */
  deleteSite() {
    const settings = this.storageManager.getAllSettings();
    
    if (this.currentEditIndex >= 0 && this.currentEditIndex < settings.quickSites.length) {
      // 获取要删除的网站名称
      const siteName = settings.quickSites[this.currentEditIndex].name;
      
      // 显示确认删除弹窗
      this.deleteItemNameSpan.textContent = siteName;
      this.confirmDeleteModal.classList.add('active');
      
      // 关闭编辑弹窗
      this.editSiteModal.classList.remove('active');
    }
  }

  /**
   * 确认删除网站
   */
  confirmDeleteSite() {
    const settings = this.storageManager.getAllSettings();
    
    if (this.currentEditIndex >= 0 && this.currentEditIndex < settings.quickSites.length) {
      // 获取网站名称用于提示
      const siteName = settings.quickSites[this.currentEditIndex].name;
      
      // 删除网站
      settings.quickSites.splice(this.currentEditIndex, 1);
      
      // 更新设置
      this.storageManager.updateSetting('quickSites', settings.quickSites);
      this.storageManager.saveSettings();
      
      // 关闭弹窗
      this.closeAllModals();
      
      // 重新加载快捷访问网站
      this.quickAccessManager.loadQuickAccess();
      
      // 显示删除成功提示
      showMessage(`已删除 "${siteName}"`, 'error');
    }
  }
}
