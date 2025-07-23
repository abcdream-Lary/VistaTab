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

    // 获取快捷访问网格容器DOM元素
    this.quickAccessGrid = document.getElementById('quickAccessGrid');
  }

  /**
   * 初始化快捷网站功能
   * 加载并显示所有快捷访问网站
   */
  init() {
    // 加载快捷访问网站
    this.loadQuickAccess();
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
    
    // 为GitHub站点添加特殊标记以便CSS选择器识别
    if (site.url.includes('github.com')) {
      siteCard.dataset.github = 'true';
    }
    
    const siteIcon = document.createElement('div');
    siteIcon.className = 'quick-access-icon';
    
    // 提取域名
    let domain = '';
    try {
      // 尝试使用URL API解析域名
      const url = new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`);
      domain = url.hostname;
    } catch (e) {
      // 如果URL API失败，使用简单的字符串操作提取域名
      domain = site.url.replace(/^https?:\/\//, '').split('/')[0];
      if (!domain) {
        // 如果域名提取失败，则使用URL作为备用
        domain = site.url;
      }
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
   * 加载网站图标
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {string} domain - 域名
   * @param {string} siteName - 网站名称
   */
  loadIcon(iconContainer, domain, siteName) {
    // 首先检查缓存
    const cacheKey = `icon_${domain}`;
    
    chrome.storage.local.get([cacheKey], (result) => {
      // 检查是否有缓存且未过期
      if (result[cacheKey]) {
        const cachedIcon = result[cacheKey];
        const now = Date.now();
        // 缓存有效期7天
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        
        // 检查缓存类型
        if (cachedIcon.type === 'url' && cachedIcon.url && now - cachedIcon.timestamp < maxAge) {
          // URL类型的图标缓存
          const img = document.createElement('img');
          img.src = cachedIcon.url;
          img.alt = siteName;
          
          // 如果加载成功就使用缓存的图标
          img.onload = () => {
            iconContainer.innerHTML = '';
            iconContainer.appendChild(img);
          };
          
          // 如果加载失败（可能是缓存的URL已失效），重新加载
          img.onerror = () => {
            this.loadFreshIcon(iconContainer, domain, siteName, cacheKey);
          };
          
          return;
        } else if (cachedIcon.type === 'letter' && cachedIcon.backgroundColor && now - cachedIcon.timestamp < maxAge) {
          // 字母图标缓存
          this.showLetterIcon(iconContainer, domain, siteName, cachedIcon.backgroundColor, cacheKey);
          return;
        }
      }
      
      // 没有缓存或缓存已过期，加载新图标
      this.loadFreshIcon(iconContainer, domain, siteName, cacheKey);
    });
  }

  /**
   * 加载新图标并缓存
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {string} domain - 域名
   * @param {string} siteName - 网站名称
   * @param {string} cacheKey - 缓存键名
   */
  loadFreshIcon(iconContainer, domain, siteName, cacheKey) {
    // 检查是否有本地图标可用
    const localIconMap = {
      // 这里可以添加网站的本地图标映射
      // 格式: '域名': '图标路径'
    };

    // 检查是否有本地图标
    const hasLocalIcon = localIconMap[domain] !== undefined;
    
    // 先尝试使用本地图标（如果有的话）
    if (hasLocalIcon) {
      // 尝试加载本地图标
      const localImg = new Image();
      localImg.onload = () => {
        // 本地图标加载成功
        iconContainer.innerHTML = '';
        const newImg = document.createElement('img');
        newImg.src = localImg.src;
        newImg.alt = siteName;
        iconContainer.appendChild(newImg);
        
        // 缓存本地图标
        this.cacheIconUrl(cacheKey, localImg.src);
      };
      
      localImg.onerror = () => {
        // 本地图标加载失败，尝试在线图标
        this.loadOnlineIcon(iconContainer, domain, siteName, cacheKey);
      };
      
      // 设置本地图标路径
      localImg.src = localIconMap[domain];
      return;
    }
    
    // 如果没有本地图标，尝试在线图标
    this.loadOnlineIcon(iconContainer, domain, siteName, cacheKey);
  }

  /**
   * 缓存图标URL或字母图标颜色
   * @param {string} cacheKey - 缓存键名
   * @param {string} url - 图标URL，如果是字母图标则为null
   * @param {string} backgroundColor - 字母图标的背景色，仅在url为null时使用
   */
  cacheIconUrl(cacheKey, url, backgroundColor) {
    // 根据参数创建不同类型的缓存对象
    let cacheData;
    
    if (url) {
      // 图片URL类型缓存
      cacheData = {
        type: 'url',
        url: url,
        timestamp: Date.now()
      };
    } else if (backgroundColor) {
      // 字母图标类型缓存
      cacheData = {
        type: 'letter',
        backgroundColor: backgroundColor,
        timestamp: Date.now()
      };
    } else {
      // 无效参数，不缓存
      return;
    }
    
    // 保存到chrome.storage.local
    chrome.storage.local.set({[cacheKey]: cacheData});
  }

  /**
   * 加载在线图标
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {string} domain - 域名
   * @param {string} siteName - 网站名称
   * @param {string} cacheKey - 缓存键名
   */
  loadOnlineIcon(iconContainer, domain, siteName, cacheKey) {
    // 构建分组的图标URL列表
    const primarySources = [
      // 优先使用 favicon.im 服务
      `https://favicon.im/${domain}?larger=true`
    ];
    
    // 次要来源 - 当主要来源失败时使用
    const secondarySources = [
      // 网站自身的各种格式图标
      `https://${domain}/favicon.ico`,
      `https://${domain}/favicon.png`,
      `https://${domain}/favicon.svg`,
      `https://${domain}/apple-touch-icon.png`,
      `https://${domain}/apple-touch-icon-precomposed.png`,
      `https://${domain}/favicon-32x32.png`,
      
      // 第三方服务
      `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
      `https://api.iowen.cn/favicon/${domain}.png`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://icon.horse/icon/${domain}`
    ];
    
    // 使用一个标志来跟踪当前是否在使用主要来源
    let usingPrimarySources = true;
    let currentUrlIndex = 0;
    let loadTimeout = null;
    
    // 创建一个图片元素来加载图标
    const iconImg = new Image();
    
    // 尝试加载下一个URL
    const tryNextUrl = () => {
      // 确定当前要使用的URL列表和索引
      const currentList = usingPrimarySources ? primarySources : secondarySources;
      
      // 检查是否已尝试当前列表中的所有URL
      if (currentUrlIndex >= currentList.length) {
        // 如果是主要来源，切换到次要来源
        if (usingPrimarySources) {
          usingPrimarySources = false;
          currentUrlIndex = 0;
          tryNextUrl();
          return;
        } else {
          // 如果次要来源也都失败了，显示首字母图标
          const backgroundColor = getRandomColor(siteName);
          this.showLetterIcon(iconContainer, domain, siteName, backgroundColor, cacheKey);
          return;
        }
      }

      // 设置加载超时
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
      
      // 主要来源使用较短的超时时间，次要来源使用稍长的时间
      const timeoutDuration = usingPrimarySources ? 1000 : 1500;
      
      loadTimeout = setTimeout(() => {
        currentUrlIndex++;
        tryNextUrl();
      }, timeoutDuration);

      // 设置当前要尝试的URL
      const currentUrl = currentList[currentUrlIndex];
      iconImg.src = currentUrl;
      currentUrlIndex++;
    };

    iconImg.onload = () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
      
      // .ico格式可能会很小，但我们仍然接受它
      const isIcoFormat = iconImg.src.toLowerCase().includes('.ico');
      
      // 图标加载成功，检查质量
      if (isIcoFormat || (iconImg.naturalWidth >= 32 && iconImg.naturalHeight >= 32)) {
        // 图标尺寸足够大或者是ico格式，接受
        iconContainer.innerHTML = '';
        iconContainer.style.backgroundColor = '';
        iconContainer.style.color = '';
        iconContainer.style.fontWeight = '';
        
        const newImg = document.createElement('img');
        newImg.src = iconImg.src;
        newImg.alt = siteName;
        iconContainer.appendChild(newImg);
        
        // 缓存成功加载的图标URL
        this.cacheIconUrl(cacheKey, iconImg.src);
      } else {
        // 图标太小，尝试下一个源
        tryNextUrl();
      }
    };

    iconImg.onerror = () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
      // 当前URL失败，尝试下一个
      tryNextUrl();
    };

    // 开始加载
    tryNextUrl();
  }

  /**
   * 显示首字母图标
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {string} domain - 域名
   * @param {string} siteName - 网站名称
   * @param {string} backgroundColor - 背景颜色
   * @param {string} [cacheKey] - 缓存键名，可选参数
   */
  showLetterIcon(iconContainer, domain, siteName, backgroundColor, cacheKey) {
    // 清除任何现有内容和样式
    iconContainer.innerHTML = '';

    // 确保有siteName，如果没有，使用更有力的默认值
    let displayChar = '?';
    let usedName = '';
    
    if (siteName && typeof siteName === 'string') {
      usedName = siteName.trim();
      // 尝试获取第一个可见字符（跳过空格、符号等）
      const firstChar = usedName.match(/\p{L}/u); // 匹配任何Unicode字母
      if (firstChar) {
        displayChar = firstChar[0].toUpperCase();
      } else if (usedName.length > 0) {
        displayChar = usedName.charAt(0).toUpperCase();
      }
    }
    
    // 确保使用随机生成的背景色
    const bgColor = backgroundColor || getRandomColor(usedName || Math.random().toString());
    
    // 设置样式和内容
    iconContainer.textContent = displayChar;
    iconContainer.style.backgroundColor = bgColor;
    iconContainer.style.color = '#fff';
    iconContainer.style.fontWeight = 'bold';
    iconContainer.style.display = 'flex';
    iconContainer.style.justifyContent = 'center';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.fontSize = '1.2rem'; // 确保字体大小合适
    
    // 也缓存首字母图标的背景色
    if (cacheKey) {
      this.cacheIconUrl(cacheKey, null, bgColor);
    }
  }

  /**
   * 更新快捷访问布局
   */
  updateQuickAccessLayout() {
    const items = this.quickAccessGrid.children;
    const itemCount = items.length;
    
    // 计算当前行的网站数量
    const maxSitesPerRow = 10;
    
    // 计算行数
    const rows = Math.ceil(itemCount / maxSitesPerRow);
    
    // 根据行数设置不同的类名
    if (rows > 2) {
      // 超过2行，添加multi-row类
      document.body.classList.add('multi-row');
    } else {
      // 2行或更少，移除multi-row类
      document.body.classList.remove('multi-row');
    }
    
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
   * @returns {Promise} 刷新完成的Promise
   */
  refreshAllIcons() {
    return new Promise((resolve) => {
      try {
        // 删除所有图标缓存
        chrome.storage.local.get(null, (result) => {
          if (chrome.runtime.lastError) {
            console.error('获取缓存失败:', chrome.runtime.lastError);
            this.loadQuickAccess(); // 即使出错也重新加载
            resolve();
            return;
          }
          
          // 找出所有图标缓存项
          const iconKeys = Object.keys(result).filter(key => key.startsWith('icon_'));
          
          if (iconKeys.length > 0) {
            // 删除所有图标缓存
            chrome.storage.local.remove(iconKeys, () => {
              console.log(`已清除 ${iconKeys.length} 个图标缓存`);
              this.loadQuickAccess(); // 重新加载所有网站
              resolve();
            });
          } else {
            // 没有图标缓存，直接重新加载
            this.loadQuickAccess();
            resolve();
          }
        });
      } catch (error) {
        console.error('刷新图标时出错:', error);
        this.loadQuickAccess(); // 确保在出错时仍然重新加载
        resolve();
      }
    });
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

    // 预先检查行数并设置类名
    const rows = Math.ceil((sitesToShow.length + (gridIsFull ? 0 : 1)) / maxSitesPerRow);
    if (rows > 2) {
      document.body.classList.add('multi-row');
    } else {
      document.body.classList.remove('multi-row');
    }

    // 延迟更新布局，确保所有DOM元素都已创建完成
    setTimeout(() => {
      this.updateQuickAccessLayout();
    }, 0);
  }
}

// 添加全局访问调试的方法
window.debugIconStorage = function() {
  try {
    // 尝试从导入的模块获取实例
    console.log("开始调试图标存储...");
    
    // 直接访问存储
    chrome.storage.local.get(null, (result) => {
      if (chrome.runtime.lastError) {
        console.error(`获取所有存储失败: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      const iconKeys = Object.keys(result).filter(key => key.startsWith('icon_'));
      console.log(`存储中共有 ${iconKeys.length} 个图标缓存`);
      
      // 显示一些样本
      if (iconKeys.length > 0) {
        const samples = iconKeys.slice(0, 3);
        samples.forEach(key => {
          const iconData = result[key];
          console.log(`图标: ${key}, 类型: ${iconData.type}, 时间: ${new Date(iconData.timestamp).toLocaleString()}`);
        });
      } else {
        console.log("没有找到任何图标缓存，缓存可能未正确保存");
      }
    });
  } catch (error) {
    console.error("调试存储时出错:", error);
  }
};