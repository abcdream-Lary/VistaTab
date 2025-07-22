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
    // 清理过期的图标缓存
    this.cleanExpiredIconCache();
    // 加载快捷访问网站
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
    
    // 为GitHub站点添加特殊标记以便CSS选择器识别
    if (site.url.includes('github.com')) {
      siteCard.dataset.github = 'true';
    }
    
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
    const memCacheKey = `mem_${domain}`;

    // 首先尝试从内存缓存获取（最快）
    if (this.iconCache[memCacheKey]) {
      const cachedIcon = this.iconCache[memCacheKey];
      this.displayCachedIcon(iconContainer, cachedIcon, siteName);
      return;
    }

    // 否则从存储中获取缓存的图标
    chrome.storage.local.get([cacheKey], (result) => {
      if (result[cacheKey]) {
        const cachedIcon = result[cacheKey];
        const now = Date.now();
        const cacheAge = now - (cachedIcon.timestamp || 0);

        // 缓存策略：
        // - 真实图标缓存7天 (7 * 24 * 60 * 60 * 1000)
        // - 首字母图标缓存1天，但会在后台尝试获取真实图标
        const realIconMaxAge = 7 * 24 * 60 * 60 * 1000;
        const letterIconMaxAge = 24 * 60 * 60 * 1000;

        if (cachedIcon.type === 'image' && cacheAge < realIconMaxAge) {
          // 使用缓存的真实图标（未过期）
          this.displayCachedIcon(iconContainer, cachedIcon, siteName);
          // 保存到内存缓存
          this.iconCache[memCacheKey] = cachedIcon;
        } else if (cachedIcon.type === 'letter' && cacheAge < letterIconMaxAge) {
          // 显示缓存的首字母图标，但在后台尝试获取真实图标
          this.displayCachedIcon(iconContainer, cachedIcon, siteName);
          // 保存到内存缓存
          this.iconCache[memCacheKey] = cachedIcon;
          // 异步尝试获取真实图标
          setTimeout(() => {
            this.tryLoadRealIcon(iconContainer, domain, siteName, cacheKey);
          }, 100);
        } else {
          // 缓存已过期，重新加载
          this.loadAndCacheIcon(iconContainer, domain, siteName, cacheKey);
        }
      } else {
        // 没有缓存，加载新图标
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
        console.log(`缓存图标加载失败: ${siteName}`);
        iconContainer.innerHTML = ''; // 清空容器
        this.showLetterIcon(iconContainer, siteName);
        
        // 删除错误的缓存，以便下次重新获取
        const cacheKey = `icon_${new URL('https://' + iconData.domain).hostname}`;
        chrome.storage.local.remove(cacheKey, () => {
          console.log(`已删除损坏的图标缓存: ${cacheKey}`);
        });
      };
    } else if (iconData.type === 'url' && iconData.url) {
      // 直接使用URL来源的图片
      const iconImg = document.createElement('img');
      iconImg.src = iconData.url;
      iconImg.alt = siteName;
      iconContainer.appendChild(iconImg);
      
      // 添加错误处理
      iconImg.onerror = () => {
        console.log(`URL图标加载失败: ${siteName}`);
        iconContainer.innerHTML = '';
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
   * 在后台尝试加载真实图标（不影响当前显示）
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {string} domain - 域名
   * @param {string} siteName - 网站名称
   * @param {string} cacheKey - 缓存键
   */
  tryLoadRealIcon(iconContainer, domain, siteName, cacheKey) {
    // 创建一个隐藏的图片元素来测试图标是否可用
    const testImg = document.createElement('img');
    testImg.style.display = 'none';

    // 图标URL优先级列表
    // 添加时间戳参数以控制缓存（每天更新一次）
    const dayTimestamp = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const iconUrls = [
      `https://${domain}/favicon.ico?t=${dayTimestamp}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://icon.horse/icon/${domain}?fallback=false`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://${domain}/apple-touch-icon.png?t=${dayTimestamp}`,
      `https://${domain}/apple-touch-icon-precomposed.png?t=${dayTimestamp}`,
      `https://${domain}/apple-touch-icon-120x120.png?t=${dayTimestamp}`,
      `https://${domain}/apple-touch-icon-152x152.png?t=${dayTimestamp}`,
      `https://${domain}/apple-touch-icon-167x167.png?t=${dayTimestamp}`,
      `https://${domain}/apple-touch-icon-180x180.png?t=${dayTimestamp}`,
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`
    ];

    let currentUrlIndex = 0;

    const tryNextUrl = () => {
      if (currentUrlIndex >= iconUrls.length) {
        // 所有URL都失败了，保持当前的首字母图标
        document.body.removeChild(testImg);
        return;
      }

      testImg.src = iconUrls[currentUrlIndex];
      currentUrlIndex++;
    };

    testImg.onload = () => {
      // 图标加载成功，更新显示和缓存
      this.updateIconDisplay(iconContainer, testImg, siteName, cacheKey);
      document.body.removeChild(testImg);
    };

    testImg.onerror = () => {
      // 当前URL失败，尝试下一个
      tryNextUrl();
    };

    // 添加到DOM中开始加载（虽然是隐藏的）
    document.body.appendChild(testImg);
    tryNextUrl();
  }

  /**
   * 更新图标显示并缓存
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {HTMLImageElement} imgElement - 图片元素
   * @param {string} siteName - 网站名称
   * @param {string} cacheKey - 缓存键
   */
  updateIconDisplay(iconContainer, imgElement, siteName, cacheKey) {
    // 只有当图片成功加载时才更新显示
    if (!imgElement.complete || imgElement.naturalWidth === 0) {
      console.warn('尝试使用未成功加载的图片更新图标');
      return;
    }
    
    // 清空容器
    iconContainer.innerHTML = '';
    iconContainer.style.backgroundColor = '';
    iconContainer.style.color = '';
    iconContainer.style.fontWeight = '';

    // 创建新的图片元素
    const newImg = document.createElement('img');
    newImg.src = imgElement.src;
    newImg.alt = siteName;

    // 添加错误处理
    newImg.onerror = () => {
      console.log(`新图标加载失败: ${siteName}`);
      // 如果新图片加载失败，恢复首字母图标
      iconContainer.innerHTML = '';
      this.showLetterIcon(iconContainer, siteName);
    };

    // 添加到DOM
    iconContainer.appendChild(newImg);

    // 缓存图标
    this.cacheIconFromImage(newImg, cacheKey);
  }

  /**
   * 从图片元素缓存图标
   * @param {HTMLImageElement} imgElement - 图片元素
   * @param {string} cacheKey - 缓存键
   */
  cacheIconFromImage(imgElement, cacheKey) {
    try {
      // 提取域名
      let domain = '';
      try {
        const urlMatch = imgElement.src.match(/https?:\/\/([^\/]+)/);
        domain = urlMatch ? urlMatch[1] : '';
      } catch (e) {
        console.error('无法提取域名', e);
      }
      
      // 对于跨域图片，我们不能使用canvas转换
      // 而是直接保存图片URL，这样避免跨域安全问题
      if (!this.isSameDomain(imgElement.src)) {
        const iconData = {
          type: 'url',
          url: imgElement.src,
          domain: domain,
          timestamp: Date.now()
        };
        
        // 保存到存储和内存缓存
        chrome.storage.local.set({
          [cacheKey]: iconData
        }).catch(error => {
          console.error('缓存图标URL失败:', error);
        });
        
        // 保存到内存缓存
        if (domain) {
          this.iconCache[`mem_${domain}`] = iconData;
        }
        
        return;
      }
      
      // 创建canvas将图片转为base64以缓存
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      // 绘制图片到canvas
      ctx.drawImage(imgElement, 0, 0, 64, 64);

      // 尝试转换为base64，如果失败则回退到URL存储
      let dataUrl;
      try {
        dataUrl = canvas.toDataURL('image/png', 0.8); // 使用0.8质量压缩
      } catch (e) {
        console.warn('Canvas转换失败，使用URL存储:', e);
        // 如果canvas导出失败，使用URL存储模式
        const iconData = {
          type: 'url',
          url: imgElement.src,
          domain: domain,
          timestamp: Date.now()
        };
        
        // 保存到存储和内存缓存
        chrome.storage.local.set({
          [cacheKey]: iconData
        });
        
        if (domain) {
          this.iconCache[`mem_${domain}`] = iconData;
        }
        
        return;
      }

      // 检查数据大小，避免存储过大的图标
      if (dataUrl.length > 100000) { // 约100KB限制
        console.warn('图标文件过大，跳过缓存:', cacheKey);
        return;
      }

      // 缓存图标数据
      const iconData = {
          type: 'image',
          data: dataUrl,
        domain: domain,
          timestamp: Date.now(),
          size: dataUrl.length
      };
      
      // 保存到存储和内存缓存
      chrome.storage.local.set({
        [cacheKey]: iconData
      }).catch(error => {
        console.error('缓存图标失败:', error);
      });
      
      // 保存到内存缓存
      if (domain) {
        this.iconCache[`mem_${domain}`] = iconData;
      }

    } catch (error) {
      console.error('处理图标缓存时出错:', error);
    }
  }

  /**
   * 判断是否为同源URL
   * @param {string} url - 要检查的URL
   * @returns {boolean} 是否为同源
   */
  isSameDomain(url) {
    try {
      // 创建一个a标签来解析URL
      const a = document.createElement('a');
      a.href = url;
      
      // 检查是否为data:URI (这些是同源的)
      if (url.startsWith('data:')) {
        return true;
      }
      
      // 检查是否为同源
      return a.hostname === window.location.hostname;
    } catch (e) {
      return false;
    }
  }

  /**
   * 加载并缓存图标
   * @param {HTMLElement} iconContainer - 图标容器
   * @param {string} domain - 域名
   * @param {string} siteName - 网站名称
   * @param {string} cacheKey - 缓存键
   */
  loadAndCacheIcon(iconContainer, domain, siteName, cacheKey) {
    // 图标URL优先级列表
    // 添加时间戳参数以控制缓存（每天更新一次）
    const dayTimestamp = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const iconUrls = [
      `https://${domain}/favicon.ico?t=${dayTimestamp}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://icon.horse/icon/${domain}?fallback=false`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://${domain}/apple-touch-icon.png?t=${dayTimestamp}`,
      `https://${domain}/apple-touch-icon-precomposed.png?t=${dayTimestamp}`,
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`
    ];

    let currentUrlIndex = 0;
    const iconImg = document.createElement('img');
    iconImg.alt = siteName;

    // 添加加载超时机制
    let loadTimeout;

    const tryNextUrl = () => {
      if (currentUrlIndex >= iconUrls.length) {
        // 所有URL都失败，显示首字母图标
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
        }).catch(error => {
          console.error('缓存首字母图标失败:', error);
        });
        return;
      }

      // 清除之前的超时
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }

      // 设置3秒超时，提高响应速度
      loadTimeout = setTimeout(() => {
        console.log(`图标加载超时: ${iconUrls[currentUrlIndex]}`);
        currentUrlIndex++;
        tryNextUrl();
      }, 3000);

      iconImg.src = iconUrls[currentUrlIndex];
      currentUrlIndex++;
    };

    // 图片加载成功
    iconImg.onload = () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }

      // 缓存成功加载的图标
      this.cacheIconFromImage(iconImg, cacheKey);
    };

    // 图片加载失败，尝试下一个URL
    iconImg.onerror = () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
      console.log(`图标加载失败: ${iconImg.src}`);
      tryNextUrl();
    };

    // 开始加载
    iconContainer.appendChild(iconImg);
    tryNextUrl();
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

        // 清除内存缓存
        this.iconCache = {};

        if (iconKeys.length > 0) {
          // 删除所有图标缓存
          chrome.storage.local.remove(iconKeys, () => {
            console.log(`已删除 ${iconKeys.length} 个图标缓存项`);
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

  /**
   * 清理过期的图标缓存
   * 定期清理过期的缓存数据，释放存储空间
   */
  cleanExpiredIconCache() {
    chrome.storage.local.get(null, (result) => {
      if (chrome.runtime.lastError) {
        console.error('获取缓存数据失败:', chrome.runtime.lastError);
        return;
      }

      const now = Date.now();
      const expiredKeys = [];
      const realIconMaxAge = 7 * 24 * 60 * 60 * 1000; // 7天
      const letterIconMaxAge = 30 * 24 * 60 * 60 * 1000; // 30天（首字母图标保留更久）

      let totalCacheSize = 0;
      let expiredCacheSize = 0;

      // 检查所有图标缓存项
      Object.keys(result).forEach(key => {
        if (key.startsWith('icon_')) {
          const iconData = result[key];
          if (iconData) {
            // 记录总缓存大小
            if (iconData.size) {
              totalCacheSize += iconData.size;
            }
            
            if (iconData.timestamp) {
            const age = now - iconData.timestamp;
            const maxAge = iconData.type === 'image' ? realIconMaxAge : letterIconMaxAge;

            if (age > maxAge) {
              expiredKeys.push(key);
                if (iconData.size) {
                  expiredCacheSize += iconData.size;
                }
            }
          } else {
            // 没有时间戳的旧缓存数据也删除
            expiredKeys.push(key);
            }
          }
        }
      });

      // 删除过期的缓存
      if (expiredKeys.length > 0) {
        chrome.storage.local.remove(expiredKeys, () => {
          console.log(`已清理 ${expiredKeys.length} 个过期的图标缓存，释放 ${(expiredCacheSize/1024).toFixed(2)}KB 空间`);
        });
      }

      // 检查存储使用情况
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        const mbUsed = (bytesInUse / 1024 / 1024).toFixed(2);
        console.log(`图标缓存使用存储空间: ${mbUsed} MB (${(totalCacheSize/1024/1024).toFixed(2)} MB 为图标数据)`);

        // 如果使用空间超过5MB，清理一些较老的缓存
        if (bytesInUse > 5 * 1024 * 1024) {
          this.cleanOldCache();
        }
      });
    });
  }

  /**
   * 清理较老的缓存（当存储空间不足时）
   */
  cleanOldCache() {
    chrome.storage.local.get(null, (result) => {
      const iconEntries = [];

      // 收集所有图标缓存项及其时间戳
      Object.keys(result).forEach(key => {
        if (key.startsWith('icon_') && result[key] && result[key].timestamp) {
          iconEntries.push({
            key: key,
            timestamp: result[key].timestamp,
            size: result[key].size || 0
          });
        }
      });

      // 按时间戳排序，删除最老的一半
      iconEntries.sort((a, b) => a.timestamp - b.timestamp);
      const keysToRemove = iconEntries.slice(0, Math.floor(iconEntries.length / 2)).map(entry => entry.key);

      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove, () => {
          console.log(`已清理 ${keysToRemove.length} 个较老的图标缓存以释放空间`);
        });
      }
    });
  }
}
