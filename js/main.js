/**
 * 主入口文件
 * 
 * 这是整个插件的大脑，负责：
 * - 把各个模块组合在一起
 * - 启动整个应用
 * - 让不同模块之间能互相协作
 * - 处理全局的事件和错误
 */

// 导入各个功能模块
import { StorageManager } from './modules/storage.js';
import { SearchManager } from './modules/search.js';
import { QuickAccessManager } from './modules/quickAccess.js';
import { SettingsManager } from './modules/settings.js';
import { ModalManager } from './modules/modals.js';
import { showMessage } from './modules/utils.js';

/**
 * VistaTab应用主类
 * 这就像一个总指挥，协调各个模块一起工作
 */
class VistaTabApp {
  /**
   * 构造函数
   * 先把所有模块的引用都初始化为null
   */
  constructor() {
    // 各个功能模块的实例
    this.storageManager = null;      // 负责数据存储
    this.searchManager = null;       // 负责搜索功能
    this.quickAccessManager = null;  // 负责快捷网站管理
    this.settingsManager = null;     // 负责设置界面
    this.modalManager = null;        // 负责弹窗效果
  }

  /**
   * 初始化应用
   * 按照模块间的依赖关系，一个一个地初始化它们
   */
  async init() {
    try {
      // 第一步：先初始化存储模块（其他模块都要用它来读写数据）
      this.storageManager = new StorageManager();

      // 第二步：加载设置数据
      await this.storageManager.loadSettings();

      // 第三步：初始化其他模块（按依赖顺序）
      this.quickAccessManager = new QuickAccessManager(this.storageManager);
      this.searchManager = new SearchManager(this.storageManager);
      this.settingsManager = new SettingsManager(this.storageManager, this.quickAccessManager);
      this.modalManager = new ModalManager(this.storageManager, this.quickAccessManager);

      // 第四步：让各个模块开始工作
      this.quickAccessManager.init();  // 显示快捷网站
      this.searchManager.init();       // 启用搜索框
      this.settingsManager.init();     // 设置面板准备就绪
      this.modalManager.init();        // 弹窗功能准备就绪

      // 第五步：绑定全局事件和快捷键
      this.bindGlobalEvents();
      
      console.log('VistaTab 启动完成 👌');

    } catch (error) {
      // 出错了就记录下来并显示
      console.error('启动出错啦:', error);
      showMessage('启动失败，请刷新重试', 'error');
    }
  }

  /**
   * 绑定全局事件和快捷键
   * 设置跨模块的事件通信和用户交互
   */
  bindGlobalEvents() {
    // 阻止Logo拖动
    const logoImg = document.querySelector('.logo img');
    if (logoImg) {
      // 阻止所有可能触发拖动的事件
      const preventDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      logoImg.addEventListener('dragstart', preventDrag);
      logoImg.addEventListener('mousedown', preventDrag);
      logoImg.addEventListener('touchstart', preventDrag);
      logoImg.addEventListener('touchmove', preventDrag);
      logoImg.parentElement.addEventListener('dragstart', preventDrag);
      logoImg.parentElement.addEventListener('mousedown', preventDrag);
    }
    
    // 监听自定义消息显示事件（模块间通信）
    window.addEventListener('showMessage', (event) => {
      const { message, type } = event.detail;
      showMessage(message, type);
    });

    // 设置全局键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K：快速聚焦到搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.searchManager.focusSearchInput();
      }
    });

    // 监听页面卸载事件，执行清理工作
    window.addEventListener('beforeunload', () => {
      // 在页面关闭前可以执行数据保存等清理操作
      console.log('页面即将卸载，执行清理工作');
    });

    // 监听页面可见性变化，优化性能
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // 页面变为可见时，可以执行一些刷新操作
        console.log('页面变为可见');
      } else {
        // 页面变为隐藏时，可以执行一些保存操作
        console.log('页面变为隐藏');
      }
    });
  }

  /**
   * 聚焦搜索框
   */
  focusSearchInput() {
    if (this.searchManager) {
      // 延迟一点时间确保DOM完全加载
      setTimeout(() => {
        this.searchManager.focusSearchInput();
      }, 100);
    }
  }

  /**
   * 获取存储管理器
   * @returns {StorageManager} 存储管理器实例
   */
  getStorageManager() {
    return this.storageManager;
  }

  /**
   * 获取搜索管理器
   * @returns {SearchManager} 搜索管理器实例
   */
  getSearchManager() {
    return this.searchManager;
  }

  /**
   * 获取快捷访问管理器
   * @returns {QuickAccessManager} 快捷访问管理器实例
   */
  getQuickAccessManager() {
    return this.quickAccessManager;
  }

  /**
   * 获取设置管理器
   * @returns {SettingsManager} 设置管理器实例
   */
  getSettingsManager() {
    return this.settingsManager;
  }

  /**
   * 获取弹窗管理器
   * @returns {ModalManager} 弹窗管理器实例
   */
  getModalManager() {
    return this.modalManager;
  }
}

// 创建全局应用实例
let app = null;

/**
 * 获取应用实例
 * @returns {VistaTabApp} 应用实例
 */
export function getApp() {
  return app;
}

/**
 * 页面加载完成后初始化应用
 */
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM 加载完成，开始初始化应用...');
  
  try {
    app = new VistaTabApp();
    await app.init();
  } catch (error) {
    console.error('应用启动失败:', error);
    
    // 显示错误信息给用户
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translateX(-50%)';
    errorDiv.style.backgroundColor = '#d9534f';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px 20px';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.zIndex = '9999';
    errorDiv.textContent = '应用启动失败，请刷新页面重试';
    document.body.appendChild(errorDiv);
    
    // 5秒后移除错误提示
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
});

// 导出应用类供其他模块使用
export { VistaTabApp };
