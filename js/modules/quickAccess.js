/**
 * 快捷网站管理模块
 * 处理快捷网站相关功能，包括网站加载、图标管理、拖拽排序等
 *
 * 主要功能：
 * - 快捷网站的加载和显示
 * - 网站图标的获取、缓存和显示
 * - 拖拽排序功能
 * - 网格布局的自动调整
 * - 图标刷新和缓存管理
 * - 添加网站按钮的显示控制
 */

import { defaultSites } from './config.js';
import { getRandomColor, showMessage } from './utils.js';

/**
 * 快捷网站管理类
 * 负责管理快捷访问网站的所有功能
 * 包括网站的显示、图标处理、用户交互等
 */
export class QuickAccessManager {
  /**
   * 构造函数
   * @param {StorageManager} storageManager - 存储管理器实例
   */
  constructor(storageManager) {
    // 存储管理器引用，用于获取和保存网站数据
    this.storageManager = storageManager;
    // 图标缓存对象，用于存储已加载的图标数据（内存缓存）
    this.iconCache = {};

    // 获取快捷访问网格容器DOM元素
    this.quickAccessGrid = document.getElementById('quickAccessGrid');
  }

  /**
   * 初始化快捷网站功能
   * 加载并显示所有快捷访问网站
   */
  init() {
    this.loadQuickAccess();
  }

  /**
   * 加载快捷访问网站
   * 从存储中获取网站数据，创建网站卡片并显示
   * 处理网格布局和添加按钮的显示逻辑
   */
  loadQuickAccess() {
    // 清空现有的网格内容，准备重新加载
    this.quickAccessGrid.innerHTML = '';

    // 从存储管理器获取当前设置
    const settings = this.storageManager.getAllSettings();
    let sites = settings.quickSites;

    // 数据验证：确保网站列表是有效的数组
    if (!Array.isArray(sites) || sites.length === 0) {
      // 如果没有网站数据，使用默认网站列表
      sites = [...defaultSites];
      // 更新存储中的网站数据
      this.storageManager.updateSetting('quickSites', sites);
      this.storageManager.saveSettings();
    }

    console.log('加载网站数量:', sites.length);

    // 计算网格容量：每行最多10个网站
    const maxSitesPerRow = 10;
    const maxSites = maxSitesPerRow * settings.quickAccessRows;

    // 判断网格是否已满：如果网站数量达到或超过最大容量
    const gridIsFull = sites.length >= maxSites;

    // 确定要显示的网站：如果网格已满则截取，否则显示全部
    const sitesToShow = gridIsFull ? sites.slice(0, maxSites) : sites;

    console.log('显示网站数量:', sitesToShow.length, '最大显示:', maxSites, '网格已满:', gridIsFull);

    // 为每个网站创建卡片元素
    sitesToShow.forEach((site, index) => {
      this.createSiteCard(site, index);
    });

    // 只有当网格未满时，才显示"添加网站"按钮
    if (!gridIsFull) {
      this.createAddButton();
    }

    // 延迟更新布局，确保所有DOM元素都已创建完成
    setTimeout(() => {
      this.updateQuickAccessLayout();
    }, 0);
  }

  /**
   * 创建添加按钮
   */
  createAddButton() {
    const addSiteCard = document.createElement('div');
    addSiteCard.className = 'quick-access-item add-site';
    
    const addIcon = document.createElement('div');
    addIcon.className = 'quick-access-icon';
    addIcon.innerHTML = '<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; position: relative; top: -1px;">+</span>';
    
    const addName = document.createElement('div');
    addName.className = 'quick-access-name';
    addName.textContent = '添加';
    
    addSiteCard.appendChild(addIcon);
    addSiteCard.appendChild(addName);
    
    addSiteCard.addEventListener('click', () => {
      // 触发打开添加网站弹窗的事件
      window.dispatchEvent(new CustomEvent('openAddSiteModal'));
    });
    
    this.quickAccessGrid.appendChild(addSiteCard);
  }

  /**
   * 创建网站卡片
   * @param {Object} site - 网站信息
   * @param {number} index - 网站索引
   */
  createSiteCard(site, index) {
    const siteCard = document.createElement('div');
    siteCard.className = 'quick-access-item';
    siteCard.dataset.index = index;
    
    const siteIcon = document.createElement('div');
    siteIcon.className = 'quick-access-icon';
    
    // 提取域名
    let domain = '';
    try {
      domain = new URL(site.url).hostname;
    } catch (e) {
      domain = site.url.replace(/^https?:\/\//, '').split('/')[0];
    }
    
    // 加载图标
    this.loadIcon(siteIcon, domain, site.name);
    
    const siteName = document.createElement('div');
    siteName.className = 'quick-access-name';
    siteName.textContent = site.name;
    
    siteCard.appendChild(siteIcon);
    siteCard.appendChild(siteName);
    
    // 点击跳转
    siteCard.addEventListener('click', () => {
      window.location.href = site.url;
    });
    
    // 右键编辑
    siteCard.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // 触发打开编辑网站弹窗的事件
      window.dispatchEvent(new CustomEvent('openEditSiteModal', {
        detail: { index }
      }));
    });

    // 添加拖拽功能
    this.addDragFunctionality(siteCard, index);
    
    this.quickAccessGrid.appendChild(siteCard);
  }

  /**
   * 添加拖拽功能
   * @param {HTMLElement} siteCard - 网站卡片元素
   * @param {number} index - 网站索引
   */
  addDragFunctionality(siteCard, index) {
    siteCard.draggable = true;
    
    siteCard.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', index);
      siteCard.classList.add('dragging');
    });

    siteCard.addEventListener('dragend', () => {
      siteCard.classList.remove('dragging');
    });

    siteCard.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    siteCard.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const targetIndex = index;

      if (draggedIndex !== targetIndex) {
        this.reorderSites(draggedIndex, targetIndex);
      }
    });
  }

  /**
   * 重新排序网站
   * @param {number} fromIndex - 源索引
   * @param {number} toIndex - 目标索引
   */
  reorderSites(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;

    const settings = this.storageManager.getAllSettings();
    const sites = [...settings.quickSites];
    const [movedSite] = sites.splice(fromIndex, 1);
    sites.splice(toIndex, 0, movedSite);

    this.storageManager.updateSetting('quickSites', sites);
    this.storageManager.saveSettings();
    this.loadQuickAccess();
  }

  /**
   * 加载图标
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {string} domain - 域名
   * @param {string} siteName - 网站名称
   */
  loadIcon(iconContainer, domain, siteName) {
    const cacheKey = `icon_${domain}`;
    
    // 尝试从存储中获取缓存的图标
    chrome.storage.local.get([cacheKey], (result) => {
      if (result[cacheKey]) {
        // 使用缓存的图标数据，不检查过期时间
        // 只有当是首字母图标时才尝试重新加载
        if (result[cacheKey].type === 'letter') {
          // 是首字母图标，尝试重新加载真实图标
          this.loadAndCacheIcon(iconContainer, domain, siteName, cacheKey);
        } else {
          // 使用缓存的图标数据
          this.displayCachedIcon(iconContainer, result[cacheKey], siteName);
        }
      } else {
        // 没有缓存或缓存数据不完整，加载新图标
        this.loadAndCacheIcon(iconContainer, domain, siteName, cacheKey);
      }
    });
  }

  /**
   * 显示缓存的图标
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {Object} iconData - 图标数据
   * @param {string} siteName - 网站名称
   */
  displayCachedIcon(iconContainer, iconData, siteName) {
    if (iconData.type === 'image' && iconData.data) {
      const iconImg = document.createElement('img');
      iconImg.src = iconData.data;
      iconImg.alt = siteName;
      iconContainer.appendChild(iconImg);
      
      // 添加错误处理，如果缓存的图片无法加载，显示首字母
      iconImg.onerror = () => {
        this.showLetterIcon(iconContainer, siteName);
      };
    } else if (iconData.type === 'letter' && iconData.backgroundColor) {
      this.showLetterIcon(iconContainer, siteName, iconData.backgroundColor);
    } else {
      // 数据不完整，显示首字母
      this.showLetterIcon(iconContainer, siteName);
    }
  }

  /**
   * 显示首字母图标
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {string} siteName - 网站名称
   * @param {string} backgroundColor - 背景颜色
   */
  showLetterIcon(iconContainer, siteName, backgroundColor) {
    iconContainer.textContent = siteName.charAt(0).toUpperCase();
    iconContainer.style.backgroundColor = backgroundColor || getRandomColor(siteName);
    iconContainer.style.color = '#fff';
    iconContainer.style.fontWeight = 'bold';
  }

  /**
   * 加载并缓存图标
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {string} domain - 域名
   * @param {string} siteName - 网站名称
   * @param {string} cacheKey - 缓存键
   */
  loadAndCacheIcon(iconContainer, domain, siteName, cacheKey) {
    const iconImg = document.createElement('img');
    
    // 设置图标源 - 使用多个备选服务以提高可靠性
    const faviconUrl = `https://${domain}/favicon.ico`;
    iconImg.src = faviconUrl;
    iconImg.alt = siteName;
    
    // 添加加载错误处理
    iconImg.onerror = () => {
      // 备选1：DuckDuckGo 图标服务
      iconImg.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      
      iconImg.onerror = () => {
        // 备选2：Google 图标服务
        iconImg.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        
        iconImg.onerror = () => {
          // 备选3：尝试获取网站根目录的apple-touch-icon
          iconImg.src = `https://${domain}/apple-touch-icon.png`;
          
          iconImg.onerror = () => {
            // 所有备选都失败，显示首字母
            iconImg.style.display = 'none';
            const backgroundColor = getRandomColor(siteName);
            this.showLetterIcon(iconContainer, siteName, backgroundColor);
            
            // 缓存首字母图标
            chrome.storage.local.set({
              [cacheKey]: {
                type: 'letter',
                backgroundColor: backgroundColor,
                timestamp: Date.now()
              }
            });
          };
        };
      };
    };
    
    // 图片加载成功时缓存
    iconImg.onload = () => {
      // 创建canvas将图片转为base64以缓存
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(iconImg, 0, 0, 64, 64);
      
      try {
        const dataUrl = canvas.toDataURL('image/png');
        
        // 缓存图标，添加时间戳
        chrome.storage.local.set({
          [cacheKey]: {
            type: 'image',
            data: dataUrl,
            timestamp: Date.now()
          }
        });
      } catch (e) {
        console.error('无法缓存图标:', e);
      }
    };
    
    iconContainer.appendChild(iconImg);
  }

  /**
   * 更新快捷访问布局
   */
  updateQuickAccessLayout() {
    const items = this.quickAccessGrid.children;
    const itemCount = items.length;
    
    // 计算当前行的网站数量
    const maxSitesPerRow = 10;
    
    // 如果总数小于一行的最大数量，则居中显示
    if (itemCount <= maxSitesPerRow) {
      // 使用自动网格布局使其居中
      const gridTemplateColumns = `repeat(${itemCount}, 65px)`;
      this.quickAccessGrid.style.gridTemplateColumns = gridTemplateColumns;
      this.quickAccessGrid.style.justifyContent = 'center';
      
      // 添加样式使网站居中
      this.quickAccessGrid.style.display = 'grid';
      this.quickAccessGrid.style.width = 'fit-content';
      this.quickAccessGrid.style.margin = '0 auto';
    } else {
      // 如果超过一行，始终使用标准10列布局
      this.quickAccessGrid.style.gridTemplateColumns = 'repeat(10, 65px)';
      this.quickAccessGrid.style.justifyContent = 'center';
      this.quickAccessGrid.style.width = '100%';
      
      // 计算行数
      const rows = Math.ceil(itemCount / maxSitesPerRow);
      
      // 如果最后一行不满，添加空白项使其对齐
      const lastRowItems = itemCount % maxSitesPerRow;
      if (lastRowItems > 0 && lastRowItems < maxSitesPerRow) {
        const emptyItemsNeeded = maxSitesPerRow - lastRowItems;
        
        // 移除之前可能添加的空白项
        const existingEmptyItems = this.quickAccessGrid.querySelectorAll('.empty-grid-item');
        existingEmptyItems.forEach(item => item.remove());
        
        // 添加新的空白项
        for (let i = 0; i < emptyItemsNeeded; i++) {
          const emptyItem = document.createElement('div');
          emptyItem.className = 'quick-access-item empty-grid-item';
          emptyItem.style.visibility = 'hidden';
          this.quickAccessGrid.appendChild(emptyItem);
        }
      } else {
        // 如果是满行，移除所有空白项
        const existingEmptyItems = this.quickAccessGrid.querySelectorAll('.empty-grid-item');
        existingEmptyItems.forEach(item => item.remove());
      }
    }
  }

  /**
   * 刷新所有图标
   */
  refreshAllIcons() {
    return new Promise((resolve) => {
      // 清除本地存储中的图标缓存
      chrome.storage.local.get(null, (result) => {
        // 找出所有图标缓存项
        const iconKeys = Object.keys(result).filter(key => key.startsWith('icon_'));
        
        if (iconKeys.length > 0) {
          // 删除所有图标缓存
          chrome.storage.local.remove(iconKeys, () => {
            // 重新加载所有网站图标
            this.loadQuickAccess();
            resolve();
          });
        } else {
          // 没有图标缓存，直接重新加载
          this.loadQuickAccess();
          resolve();
        }
      });
    });
  }
}
