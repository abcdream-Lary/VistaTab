document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const settingsIcon = document.querySelector('.settings-icon');
  const settingsPanel = document.querySelector('.settings-panel');
  const closeSettingsBtn = document.getElementById('closeSettings');
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const searchHistory = document.getElementById('searchHistory');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const saveHistoryToggle = document.getElementById('saveHistory');
  const historyLimitSelect = document.getElementById('historyLimit');
  const quickAccessGrid = document.getElementById('quickAccessGrid');
  const quickAccessRowsSelect = document.getElementById('quickAccessRows');
  const themeOptions = document.querySelectorAll('.theme-option');
  const searchEngineSelect = document.getElementById('searchEngine');
  const refreshIconsBtn = document.getElementById('refreshIcons');
  
  // 弹窗元素
  const addSiteModal = document.getElementById('addSiteModal');
  const editSiteModal = document.getElementById('editSiteModal');
  const confirmDeleteModal = document.getElementById('confirmDeleteModal');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const siteNameInput = document.getElementById('siteName');
  const siteUrlInput = document.getElementById('siteUrl');
  const editSiteNameInput = document.getElementById('editSiteName');
  const editSiteUrlInput = document.getElementById('editSiteUrl');
  const confirmAddSiteBtn = document.getElementById('confirmAddSite');
  const cancelAddSiteBtn = document.getElementById('cancelAddSite');
  const confirmEditSiteBtn = document.getElementById('confirmEditSite');
  const cancelEditSiteBtn = document.getElementById('cancelEditSite');
  const deleteSiteBtn = document.getElementById('deleteSite');
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  const deleteItemNameSpan = document.getElementById('deleteItemName');
  
  // 当前编辑的网站索引
  let currentEditIndex = -1;
  
  // 搜索引擎URL配置
  const searchEngines = {
    bing: 'https://www.bing.com/search?q=',
    google: 'https://www.google.com/search?q=',
    baidu: 'https://www.baidu.com/s?wd=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    sogou: 'https://www.sogou.com/web?query=',
    ecosia: 'https://www.ecosia.org/search?q=',
    qwant: 'https://www.qwant.com/?q=',
    startpage: 'https://www.startpage.com/do/search?q='
  };
  
  // 搜索引擎显示名称
  const engineNames = {
    bing: 'Bing',
    google: 'Google',
    baidu: '百度',
    duckduckgo: 'DuckDuckGo',
    sogou: '搜狗',
    ecosia: 'Ecosia',
    qwant: 'Qwant',
    startpage: 'Startpage'
  };
  
  // 常用网站配置
  const defaultSites = [
    { name: '百度', url: 'https://www.baidu.com' },
    { name: 'Google', url: 'https://www.google.com' },
    { name: '哔哩哔哩', url: 'https://www.bilibili.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'QQ邮箱', url: 'https://mail.qq.com' },
    { name: '网易邮箱', url: 'https://mail.163.com/' },
  ];
  
  // 默认设置
  let settings = {
    searchEngine: 'bing',
    saveHistory: true,
    historyLimit: 10,
    theme: 'light',
    quickSites: [],
    quickAccessRows: 2
  };
  
  // 搜索历史
  let searchHistoryItems = [];
  
  // 初始化
  initCustomDropdowns();
  initThemeOptions();

  // 加载保存的设置（其他初始化将在设置加载完成后进行）
  loadSettings();
  
  // 应用主题
  function applyTheme(themeName) {
    // 移除所有主题类
    document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'green-theme');
    
    // 添加选中的主题类
    if (themeName !== 'light') {
      document.body.classList.add(themeName + '-theme');
    }
    
    // 更新主题选项的选中状态
    themeOptions.forEach(option => {
      if (option.dataset.theme === themeName) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
    
    // 保存主题设置
    settings.theme = themeName;
  }
  
  // 搜索历史事件监听器标记
  let searchHistoryEventsInitialized = false;

  // 当前选中的历史记录索引
  let selectedHistoryIndex = -1;

  // 初始化搜索历史事件监听器
  function initSearchHistoryEvents() {
    if (searchHistoryEventsInitialized) {
      return;
    }

    // 只有点击搜索框时才显示历史记录
    searchInput.addEventListener('click', function() {
      showSearchHistory();
    });

    // 输入时过滤搜索历史
    searchInput.addEventListener('input', function() {
      if (settings.saveHistory && searchHistoryItems.length > 0) {
        filterAndShowHistory(this.value.trim());
      }
    });

    // 点击页面其他地方关闭历史记录
    document.addEventListener('click', function(event) {
      if (!searchInput.contains(event.target) &&
          !searchHistory.contains(event.target)) {
        searchHistory.classList.remove('active');
      }
    });

    // 搜索按钮点击事件
    searchButton.addEventListener('click', performSearch);

    // 输入框键盘事件
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      } else if (e.key === 'ArrowDown' && searchHistory.classList.contains('active')) {
        e.preventDefault();
        navigateHistory('down');
      } else if (e.key === 'ArrowUp' && searchHistory.classList.contains('active')) {
        e.preventDefault();
        navigateHistory('up');
      } else if (e.key === 'Escape' && searchHistory.classList.contains('active')) {
        searchHistory.classList.remove('active');
      }
    });

    searchHistoryEventsInitialized = true;
  }

  // 监听窗口大小变化，重新调整搜索历史高度
  window.addEventListener('resize', function() {
    if (searchHistory.classList.contains('active')) {
      adjustHistoryHeight();
    }
  });

  // 键盘导航搜索历史
  function navigateHistory(direction) {
    const historyItems = historyList.querySelectorAll('.history-item');
    if (historyItems.length === 0) return;

    // 移除之前的选中状态
    historyItems.forEach(item => item.classList.remove('selected'));

    if (direction === 'down') {
      selectedHistoryIndex = Math.min(selectedHistoryIndex + 1, historyItems.length - 1);
    } else if (direction === 'up') {
      selectedHistoryIndex = Math.max(selectedHistoryIndex - 1, -1);
    }

    if (selectedHistoryIndex >= 0) {
      historyItems[selectedHistoryIndex].classList.add('selected');
      searchInput.value = searchHistoryItems[selectedHistoryIndex];
    } else {
      searchInput.value = '';
    }
  }

  // 显示搜索历史
  function showSearchHistory() {
    if (settings.saveHistory && searchHistoryItems.length > 0) {
      selectedHistoryIndex = -1; // 重置选中索引
      renderSearchHistory();
      adjustHistoryHeight();
      searchHistory.classList.add('active');
    }
  }

  // 动态调整搜索历史高度
  function adjustHistoryHeight() {
    const searchBox = document.querySelector('.search-box');
    const searchBoxRect = searchBox.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // 计算搜索框下方到窗口底部的可用空间，使用更保守的比例
    const availableHeight = (windowHeight - searchBoxRect.bottom) * 0.6; // 只使用60%的可用空间

    // 设置最大高度，但不超过250px，不少于120px
    const maxHeight = Math.max(120, Math.min(availableHeight, 250));

    historyList.style.maxHeight = maxHeight + 'px';
  }

  // 过滤并显示搜索历史
  function filterAndShowHistory(query) {
    if (!query) {
      showSearchHistory();
      return;
    }

    // 过滤匹配的历史记录
    const filteredItems = searchHistoryItems.filter(item =>
      item.toLowerCase().includes(query.toLowerCase())
    );

    if (filteredItems.length > 0) {
      selectedHistoryIndex = -1;
      renderFilteredHistory(filteredItems);
      adjustHistoryHeight();
      searchHistory.classList.add('active');
    } else {
      searchHistory.classList.remove('active');
    }
  }

  // 渲染过滤后的搜索历史
  function renderFilteredHistory(filteredItems) {
    if (!historyList) return;

    historyList.innerHTML = '';

    filteredItems.forEach(function(item) {
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

      historyItem.addEventListener('click', function() {
        searchInput.value = item;
        searchHistory.classList.remove('active');
        performSearch();
      });

      historyList.appendChild(historyItem);
    });
  }
  
  // 初始化主题选择
  function initThemeOptions() {
    themeOptions.forEach(option => {
      option.addEventListener('click', function() {
        const theme = this.dataset.theme;
        applyTheme(theme);
        saveSettings();
      });
    });
  }
  
  // 加载设置
  function loadSettings() {
    // 检查Chrome存储API是否可用
    if (!chrome.storage) {
      console.error('Chrome存储API不可用');
      return;
    }

    chrome.storage.sync.get(['settings'], function(data) {
      if (chrome.runtime.lastError) {
        console.error('加载设置时出错:', chrome.runtime.lastError);
        return;
      }

      if (data.settings) {
        settings = {...settings, ...data.settings};
      }
      
      // 如果没有保存的快捷网站，使用默认网站
      if (!settings.quickSites || !Array.isArray(settings.quickSites) || settings.quickSites.length === 0) {
        settings.quickSites = [...defaultSites];
        
        // 确保立即保存默认网站到存储
        chrome.storage.sync.set({ 'settings': settings }, function() {
          console.log('已保存默认网站到设置');
        });
      }
      
      // 更新UI显示
      saveHistoryToggle.checked = settings.saveHistory;
      
      // 更新自定义下拉菜单
      updateCustomDropdown('rowsDropdown', 'quickAccessRows', settings.quickAccessRows || 2);
      updateCustomDropdown('historyDropdown', 'historyLimit', settings.historyLimit);
      updateCustomDropdown('engineDropdown', 'searchEngine', settings.searchEngine);
      
      // 应用主题
      applyTheme(settings.theme || 'light');

      // 加载快捷访问网站
      loadQuickAccess();

      // 加载搜索历史
      loadSearchHistory();

      // 初始化搜索历史事件监听器
      initSearchHistoryEvents();
    });
  }
  
  // 加载搜索历史
  function loadSearchHistory() {
    // 检查Chrome存储API是否可用
    if (!chrome.storage) {
      console.error('Chrome存储API不可用');
      renderSearchHistory(); // 仍然渲染，显示"暂无搜索历史"
      return;
    }

    chrome.storage.local.get(['searchHistory'], function(data) {
      if (chrome.runtime.lastError) {
        console.error('加载搜索历史时出错:', chrome.runtime.lastError);
        renderSearchHistory(); // 出错时仍然渲染
        return;
      }

      if (data.searchHistory) {
        searchHistoryItems = data.searchHistory;
      }
      // 无论是否有数据都要渲染，这样可以显示"暂无搜索历史"
      renderSearchHistory();
    });
  }
  
  // 保存搜索历史
  function saveSearchHistory() {
    if (settings.saveHistory) {
      chrome.storage.local.set({ 'searchHistory': searchHistoryItems });
    }
  }
  
  // 渲染搜索历史列表
  function renderSearchHistory() {
    if (!historyList) {
      console.error('historyList元素不存在！');
      return;
    }

    historyList.innerHTML = '';

    // 如果没有搜索历史，不渲染任何内容
    if (searchHistoryItems.length === 0) {
      return;
    }
    
    searchHistoryItems.forEach(function(item) {
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
      
      historyItem.addEventListener('click', function() {
        searchInput.value = item;
        searchHistory.classList.remove('active');
        performSearch();
      });
      
      historyList.appendChild(historyItem);
    });
  }
  
  // 加载快捷访问网站
  function loadQuickAccess() {
    // 清空网格
    quickAccessGrid.innerHTML = '';
    
    // 获取保存的网站
    let sites = settings.quickSites;
    
    // 确保sites是数组
    if (!Array.isArray(sites) || sites.length === 0) {
      sites = [...defaultSites];
      settings.quickSites = sites;
      saveSettings();
    }
    
    console.log('加载网站数量:', sites.length);
    
    // 根据设置的行数限制显示的网站数量
    const maxSitesPerRow = 10;
    const maxSites = maxSitesPerRow * settings.quickAccessRows;
    
    // 检查是否网格已满或者超出
    const gridIsFull = sites.length >= maxSites;
    
    // 如果网格已满或超出，只显示最大数量的网站，不显示添加按钮
    // 如果网格未满，显示所有网站和添加按钮
    const sitesToShow = gridIsFull ? sites.slice(0, maxSites) : sites;
    
    console.log('显示网站数量:', sitesToShow.length, '最大显示:', maxSites, '网格已满:', gridIsFull);
    
    // 创建网站卡片
    sitesToShow.forEach(function(site, index) {
      createSiteCard(site, index);
    });
    
    // 只有当网格未满时，才显示添加按钮
    if (!gridIsFull) {
      // 添加"添加"按钮 - 固定在最后一个位置
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
      
      addSiteCard.addEventListener('click', function() {
        openAddSiteModal();
      });
      
      quickAccessGrid.appendChild(addSiteCard);
    }
    
    // 更新布局 - 确保在所有网站加载完成后调用
    setTimeout(() => {
      updateQuickAccessLayout();
    }, 0);
  }
  
  // 图标缓存对象
  const iconCache = {};
  
  // 创建网站卡片
  function createSiteCard(site, index) {
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
    
    // 尝试从缓存中获取图标
    const cacheKey = `icon_${domain}`;
    
    // 尝试从存储中获取缓存的图标
    chrome.storage.local.get([cacheKey], function(result) {
      if (result[cacheKey]) {
        // 使用缓存的图标数据，不检查过期时间
        // 只有当是首字母图标时才尝试重新加载
        if (result[cacheKey].type === 'letter') {
          // 是首字母图标，尝试重新加载真实图标
          loadAndCacheIcon(siteIcon, domain, site.name, cacheKey);
        } else {
          // 使用缓存的图标数据
          displayCachedIcon(siteIcon, result[cacheKey], site.name);
        }
      } else {
        // 没有缓存或缓存数据不完整，加载新图标
        loadAndCacheIcon(siteIcon, domain, site.name, cacheKey);
      }
    });
    
    const siteName = document.createElement('div');
    siteName.className = 'quick-access-name';
    siteName.textContent = site.name;
    
    siteCard.appendChild(siteIcon);
    siteCard.appendChild(siteName);
    
    // 点击跳转
    siteCard.addEventListener('click', function() {
      window.location.href = site.url;
    });
    
    // 右键编辑
    siteCard.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      openEditSiteModal(index);
    });

    // 添加拖拽功能
    siteCard.draggable = true;
    siteCard.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', index);
      siteCard.classList.add('dragging');
    });

    siteCard.addEventListener('dragend', function(e) {
      siteCard.classList.remove('dragging');
    });

    siteCard.addEventListener('dragover', function(e) {
      e.preventDefault();
    });

    siteCard.addEventListener('drop', function(e) {
      e.preventDefault();
      const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const targetIndex = index;

      if (draggedIndex !== targetIndex) {
        reorderSites(draggedIndex, targetIndex);
      }
    });
    
    quickAccessGrid.appendChild(siteCard);
  }

  // 重新排序网站
  function reorderSites(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;

    const sites = [...settings.quickSites];
    const [movedSite] = sites.splice(fromIndex, 1);
    sites.splice(toIndex, 0, movedSite);

    settings.quickSites = sites;
    saveSettings();
    loadQuickAccess();
  }
  
  // 显示缓存的图标
  function displayCachedIcon(iconContainer, iconData, siteName) {
    if (iconData.type === 'image' && iconData.data) {
      const iconImg = document.createElement('img');
      iconImg.src = iconData.data;
      iconImg.alt = siteName;
      iconContainer.appendChild(iconImg);
      
      // 添加错误处理，如果缓存的图片无法加载，尝试重新获取
      iconImg.onerror = function() {
        // 提取域名
        let domain = '';
        try {
          // 从URL中提取域名
          const siteCards = document.querySelectorAll('.quick-access-item');
          for (let card of siteCards) {
            if (card.querySelector('.quick-access-name').textContent === siteName) {
              const index = card.dataset.index;
              if (index !== undefined) {
                const site = settings.quickSites[index];
                if (site && site.url) {
                  domain = new URL(site.url).hostname;
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.error('无法提取域名:', e);
        }
        
        if (domain) {
          // 如果能获取到域名，尝试重新加载图标
          const cacheKey = `icon_${domain}`;
          loadAndCacheIcon(iconContainer, domain, siteName, cacheKey);
        } else {
          // 否则显示首字母
          showLetterIcon(iconContainer, siteName);
        }
      };
    } else if (iconData.type === 'letter' && iconData.backgroundColor) {
      showLetterIcon(iconContainer, siteName, iconData.backgroundColor);
    } else {
      // 数据不完整，显示首字母
      showLetterIcon(iconContainer, siteName);
    }
  }
  
  // 显示首字母图标
  function showLetterIcon(iconContainer, siteName, backgroundColor) {
    iconContainer.textContent = siteName.charAt(0).toUpperCase();
    iconContainer.style.backgroundColor = backgroundColor || getRandomColor(siteName);
    iconContainer.style.color = '#fff';
    iconContainer.style.fontWeight = 'bold';
  }
  
  // 加载并缓存图标
  function loadAndCacheIcon(iconContainer, domain, siteName, cacheKey) {
    const iconImg = document.createElement('img');
    
    // 设置图标源 - 使用多个备选服务以提高可靠性
    // 首选：favicon.ico 直接获取
    const faviconUrl = `https://${domain}/favicon.ico`;
    iconImg.src = faviconUrl;
    iconImg.alt = siteName;
    
    // 添加加载错误处理
    iconImg.onerror = function() {
      // 备选1：DuckDuckGo 图标服务
      iconImg.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      
      // 如果备选1也失败
      iconImg.onerror = function() {
        // 备选2：Google 图标服务
        iconImg.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        
        // 如果备选2也失败，显示首字母
        iconImg.onerror = function() {
          // 备选3：尝试获取网站根目录的apple-touch-icon
          iconImg.src = `https://${domain}/apple-touch-icon.png`;
          
          // 如果备选3也失败，显示首字母
          iconImg.onerror = function() {
            iconImg.style.display = 'none';
            iconContainer.textContent = siteName.charAt(0).toUpperCase();
            const backgroundColor = getRandomColor(siteName);
            iconContainer.style.backgroundColor = backgroundColor;
            iconContainer.style.color = '#fff';
            iconContainer.style.fontWeight = 'bold';
            
            // 缓存首字母图标
            chrome.storage.local.set({
              [cacheKey]: {
                type: 'letter',
                backgroundColor: backgroundColor,
                timestamp: Date.now() // 添加时间戳
              }
            });
          };
        };
      };
    };
    
    // 图片加载成功时缓存
    iconImg.onload = function() {
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
            timestamp: Date.now() // 添加时间戳
          }
        });
      } catch (e) {
        console.error('无法缓存图标:', e);
      }
    };
    
    iconContainer.appendChild(iconImg);
  }
  
  // 打开添加网站弹窗
  function openAddSiteModal() {
    // 清空输入框
    siteNameInput.value = '';
    siteUrlInput.value = '';
    
    // 显示弹窗
    addSiteModal.classList.add('active');
    
    // 聚焦到网站名称输入框
    setTimeout(() => siteNameInput.focus(), 100);
  }
  
  // 打开编辑网站弹窗
  function openEditSiteModal(index) {
    currentEditIndex = index;
    
    // 获取网站信息
    const site = settings.quickSites[index];
    
    // 填充表单
    editSiteNameInput.value = site.name;
    editSiteUrlInput.value = site.url;
    
    // 显示弹窗
    editSiteModal.classList.add('active');
    
    // 聚焦到网站名称输入框
    setTimeout(() => editSiteNameInput.focus(), 100);
  }
  
  // 关闭所有弹窗
  function closeAllModals() {
    addSiteModal.classList.remove('active');
    editSiteModal.classList.remove('active');
    confirmDeleteModal.classList.remove('active');
  }
  
  // 添加网站
  function addSite() {
    const name = siteNameInput.value.trim();
    let url = siteUrlInput.value.trim();
    
    // 验证输入
    if (!name) {
      showInputError(siteNameInput, '请输入网站名称');
      return;
    }

    if (!url) {
      showInputError(siteUrlInput, '请输入网站地址');
      return;
    }

    // 验证URL格式
    if (!isValidUrl(url)) {
      showInputError(siteUrlInput, '请输入有效的网站地址');
      return;
    }
    
    // 确保URL格式正确
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // 初始化quickSites数组（如果还没有的话）
    if (!settings.quickSites || !Array.isArray(settings.quickSites)) {
      settings.quickSites = [];
    }
    
    // 添加新网站
    settings.quickSites.push({
      name: name,
      url: url
    });
    
    // 保存设置
    saveSettings();
    
    // 关闭弹窗
    closeAllModals();
    
    // 重新加载快捷访问网站
    loadQuickAccess();
  }
  
  // 更新网站
  function updateSite() {
    const name = editSiteNameInput.value.trim();
    let url = editSiteUrlInput.value.trim();
    
    // 验证输入
    if (!name) {
      alert('请输入网站名称');
      return;
    }
    
    if (!url) {
      alert('请输入网站地址');
      return;
    }
    
    // 确保URL格式正确
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // 更新网站
    if (currentEditIndex >= 0 && currentEditIndex < settings.quickSites.length) {
      settings.quickSites[currentEditIndex] = {
        name: name,
        url: url
      };
      
      // 保存设置
      saveSettings();
      
      // 关闭弹窗
      closeAllModals();
      
      // 重新加载快捷访问网站
      loadQuickAccess();
    }
  }
  
  // 删除网站
  function deleteSite() {
    if (currentEditIndex >= 0 && currentEditIndex < settings.quickSites.length) {
      // 获取要删除的网站名称
      const siteName = settings.quickSites[currentEditIndex].name;
      
      // 显示确认删除弹窗
      deleteItemNameSpan.textContent = siteName;
      confirmDeleteModal.classList.add('active');
      
      // 关闭编辑弹窗
      editSiteModal.classList.remove('active');
    }
  }
  
  // 确认删除网站
  function confirmDeleteSite() {
    if (currentEditIndex >= 0 && currentEditIndex < settings.quickSites.length) {
      // 获取网站名称用于提示
      const siteName = settings.quickSites[currentEditIndex].name;
      
      // 删除网站
      settings.quickSites.splice(currentEditIndex, 1);
      
      // 保存设置，但不显示保存提示
      saveSettings(false);
      
      // 关闭弹窗
      closeAllModals();
      
      // 显示删除成功提示
      showDeletedMessage(siteName);
      
      // 重新加载快捷访问网站
      loadQuickAccess();
    }
  }
  
  // 显示删除成功提示
  function showDeletedMessage(siteName) {
    const deletedMsg = document.createElement('div');
    deletedMsg.textContent = `已删除 "${siteName}"`;
    deletedMsg.className = 'deleted-message';
    document.body.appendChild(deletedMsg);
    
    // 添加样式
    deletedMsg.style.position = 'fixed';
    deletedMsg.style.bottom = '20px';
    deletedMsg.style.left = '50%';
    deletedMsg.style.transform = 'translateX(-50%)';
    deletedMsg.style.backgroundColor = '#d9534f';
    deletedMsg.style.color = 'white';
    deletedMsg.style.padding = '10px 20px';
    deletedMsg.style.borderRadius = '8px';
    deletedMsg.style.fontSize = '15px';
    deletedMsg.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    deletedMsg.style.zIndex = '1000';
    deletedMsg.style.opacity = '0';
    deletedMsg.style.transition = 'opacity 0.3s';
    
    // 显示消息
    setTimeout(() => { deletedMsg.style.opacity = '1'; }, 10);
    
    // 2秒后移除提示
    setTimeout(function() {
      deletedMsg.style.opacity = '0';
      setTimeout(() => { deletedMsg.remove(); }, 300);
    }, 2000);
  }
  
  // 显示刷新成功提示
  function showRefreshSuccessMessage() {
    const refreshMsg = document.createElement('div');
    refreshMsg.textContent = '刷新成功';
    refreshMsg.className = 'refresh-message';
    document.body.appendChild(refreshMsg);
    
    // 添加样式
    refreshMsg.style.position = 'fixed';
    refreshMsg.style.bottom = '20px';
    refreshMsg.style.left = '50%';
    refreshMsg.style.transform = 'translateX(-50%)';
    refreshMsg.style.backgroundColor = '#4CAF50';
    refreshMsg.style.color = 'white';
    refreshMsg.style.padding = '10px 20px';
    refreshMsg.style.borderRadius = '8px';
    refreshMsg.style.fontSize = '15px';
    refreshMsg.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    refreshMsg.style.zIndex = '1000';
    refreshMsg.style.opacity = '0';
    refreshMsg.style.transition = 'opacity 0.3s';
    
    // 显示消息
    setTimeout(() => { refreshMsg.style.opacity = '1'; }, 10);
    
    // 2秒后移除提示
    setTimeout(function() {
      refreshMsg.style.opacity = '0';
      setTimeout(() => { refreshMsg.remove(); }, 300);
    }, 2000);
  }
  
  // 事件监听器
  // 关闭弹窗按钮
  closeModalBtns.forEach(function(btn) {
    btn.addEventListener('click', closeAllModals);
  });
  
  // 点击弹窗外部关闭弹窗
  window.addEventListener('click', function(event) {
    if (event.target === addSiteModal) {
      closeAllModals();
    }
    if (event.target === editSiteModal) {
      closeAllModals();
    }
    if (event.target === confirmDeleteModal) {
      closeAllModals();
    }
  });
  
  // 添加网站按钮
  confirmAddSiteBtn.addEventListener('click', addSite);
  
  // 取消添加按钮
  cancelAddSiteBtn.addEventListener('click', closeAllModals);
  
  // 保存编辑按钮
  confirmEditSiteBtn.addEventListener('click', updateSite);
  
  // 取消编辑按钮
  cancelEditSiteBtn.addEventListener('click', closeAllModals);
  
  // 删除网站按钮
  deleteSiteBtn.addEventListener('click', deleteSite);
  
  // 确认删除按钮
  confirmDeleteBtn.addEventListener('click', confirmDeleteSite);
  
  // 取消删除按钮
  cancelDeleteBtn.addEventListener('click', closeAllModals);
  
  // 添加键盘事件处理
  siteNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      siteUrlInput.focus();
    }
  });

  siteUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addSite();
    }
  });

  // 输入时清除错误状态
  siteNameInput.addEventListener('input', function() {
    clearInputError(this);
  });

  siteUrlInput.addEventListener('input', function() {
    clearInputError(this);
  });
  
  editSiteNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      editSiteUrlInput.focus();
    }
  });
  
  editSiteUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      updateSite();
    }
  });
  
  // 根据字符串生成随机但一致的颜色
  function getRandomColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#4285F4', // Google Blue
      '#34A853', // Google Green
      '#FBBC05', // Google Yellow
      '#EA4335', // Google Red
      '#5851DB', // Instagram Purple
      '#E1306C', // Instagram Pink
      '#FD1D1D', // Instagram Orange
      '#F77737', // Instagram Yellow
      '#833AB4', // Instagram Purple
      '#1DA1F2', // Twitter Blue
      '#0077B5', // LinkedIn Blue
      '#FF0000'  // YouTube Red
    ];
    
    return colors[Math.abs(hash) % colors.length];
  }
  
  // 添加搜索历史
  function addSearchHistory(query) {
    if (!settings.saveHistory || !query) return;
    
    // 移除已存在的相同查询
    searchHistoryItems = searchHistoryItems.filter(item => item !== query);
    
    // 添加到历史记录开头
    searchHistoryItems.unshift(query);
    
    // 限制历史记录数量
    if (searchHistoryItems.length > settings.historyLimit) {
      searchHistoryItems = searchHistoryItems.slice(0, settings.historyLimit);
    }
    
    // 保存并渲染
    saveSearchHistory();
    renderSearchHistory();
  }
  
  // 清除搜索历史
  clearHistoryBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    searchHistoryItems = [];
    saveSearchHistory();
    renderSearchHistory();
    searchHistory.classList.remove('active');
  });
  
  // 打开设置面板
  settingsIcon.addEventListener('click', function(e) {
    settingsPanel.classList.add('active');
    e.stopPropagation();
  });
  
  // 关闭设置面板
  closeSettingsBtn.addEventListener('click', function() {
    settingsPanel.classList.remove('active');
  });
  
  // 点击设置面板外部关闭面板
  document.addEventListener('click', function(event) {
    if (settingsPanel.classList.contains('active') && 
        !settingsPanel.contains(event.target) && 
        !settingsIcon.contains(event.target)) {
      settingsPanel.classList.remove('active');
    }
  });
  
  // 搜索历史开关
  saveHistoryToggle.addEventListener('change', function() {
    settings.saveHistory = this.checked;
    saveSettings();
  });
  
  // 历史记录数量限制
  historyLimitSelect.addEventListener('change', function() {
    settings.historyLimit = parseInt(this.value);
    
    // 如果当前历史记录超过新限制，则裁剪
    if (searchHistoryItems.length > settings.historyLimit) {
      searchHistoryItems = searchHistoryItems.slice(0, settings.historyLimit);
      saveSearchHistory();
      renderSearchHistory();
    }
    
    saveSettings();
  });
  
  // 搜索引擎选择
  searchEngineSelect.addEventListener('change', function() {
    settings.searchEngine = this.value;
    saveSettings();
  });
  
  // 保存设置
  function saveSettings(showMessage = false) {
    chrome.storage.sync.set({ 'settings': settings }, function() {
      // 显示保存成功提示，如果需要的话
      if (showMessage) {
        showSavedMessage();
      }
    });
  }
  
  // 显示保存成功提示
  function showSavedMessage() {
    const savedMsg = document.createElement('div');
    savedMsg.textContent = '设置已保存';
    savedMsg.className = 'saved-message';
    document.body.appendChild(savedMsg);
    
    // 添加样式
    savedMsg.style.position = 'fixed';
    savedMsg.style.bottom = '20px';
    savedMsg.style.left = '50%';
    savedMsg.style.transform = 'translateX(-50%)';
    savedMsg.style.backgroundColor = '#4CAF50';
    savedMsg.style.color = 'white';
    savedMsg.style.padding = '10px 20px';
    savedMsg.style.borderRadius = '8px';
    savedMsg.style.fontSize = '15px';
    savedMsg.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    savedMsg.style.zIndex = '1000';
    savedMsg.style.opacity = '0';
    savedMsg.style.transition = 'opacity 0.3s';
    
    // 显示消息
    setTimeout(() => { savedMsg.style.opacity = '1'; }, 10);
    
    // 2秒后移除提示
    setTimeout(function() {
      savedMsg.style.opacity = '0';
      setTimeout(() => { savedMsg.remove(); }, 300);
    }, 2000);
  }
  
  // 处理搜索功能
  function performSearch() {
    const query = searchInput.value.trim();
    if (query) {
      // 添加到搜索历史
      addSearchHistory(query);
      
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
        window.location.href = searchEngines[settings.searchEngine] + encodeURIComponent(query);
      }
    }
  }
  
  // 判断字符串是否为URL
  function isURL(str) {
    // 简单的URL检测规则
    const pattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
    return pattern.test(str);
  }

  // 验证URL格式（更严格）
  function isValidUrl(str) {
    try {
      // 如果没有协议，添加https://
      if (!str.startsWith('http://') && !str.startsWith('https://')) {
        str = 'https://' + str;
      }
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  // 显示输入错误
  function showInputError(inputElement, message) {
    // 移除之前的错误状态
    clearInputError(inputElement);

    // 添加错误样式
    inputElement.classList.add('error');

    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.textContent = message;

    // 插入错误提示
    inputElement.parentNode.appendChild(errorDiv);

    // 聚焦到错误输入框
    inputElement.focus();

    // 3秒后自动清除错误状态
    setTimeout(() => clearInputError(inputElement), 3000);
  }

  // 清除输入错误
  function clearInputError(inputElement) {
    inputElement.classList.remove('error');
    const errorDiv = inputElement.parentNode.querySelector('.input-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }
  
  // 页面加载时聚焦到搜索框
  searchInput.focus();

  // 全局键盘快捷键
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + , 打开设置
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      settingsPanel.classList.add('active');
    }

    // ESC 关闭设置面板
    if (e.key === 'Escape' && settingsPanel.classList.contains('active')) {
      settingsPanel.classList.remove('active');
    }

    // Ctrl/Cmd + K 聚焦搜索框
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
  
  // 常用网站行数设置
  quickAccessRowsSelect.addEventListener('change', function() {
    const rows = parseInt(this.value);
    settings.quickAccessRows = rows;
    
    // 保存设置并重新加载网站以应用新的行数设置
    saveSettings();
    loadQuickAccess();
  });
  
  // 应用常用网站行数设置
  function applyQuickAccessRows(rows) {
    // 设置行数
    settings.quickAccessRows = rows;
    
    // 重新加载网站以确保显示正确数量
    // 布局更新会在loadQuickAccess中完成
    loadQuickAccess();
  }
  
  // 更新快捷访问布局
  function updateQuickAccessLayout() {
    const items = quickAccessGrid.children;
    const itemCount = items.length;
    
    // 计算当前行的网站数量
    const maxSitesPerRow = 10;
    
    // 如果总数小于一行的最大数量，则居中显示
    if (itemCount <= maxSitesPerRow) {
      // 使用自动网格布局使其居中
      const gridTemplateColumns = `repeat(${itemCount}, 65px)`;
      quickAccessGrid.style.gridTemplateColumns = gridTemplateColumns;
      quickAccessGrid.style.justifyContent = 'center';
      
      // 添加样式使网站居中
      quickAccessGrid.style.display = 'grid';
      quickAccessGrid.style.width = 'fit-content';
      quickAccessGrid.style.margin = '0 auto';
    } else {
      // 如果超过一行，始终使用标准10列布局
      quickAccessGrid.style.gridTemplateColumns = 'repeat(10, 65px)';
      quickAccessGrid.style.justifyContent = 'center';
      quickAccessGrid.style.width = '100%';
      
      // 计算行数
      const rows = Math.ceil(itemCount / maxSitesPerRow);
      
      // 如果最后一行不满，添加空白项使其对齐
      const lastRowItems = itemCount % maxSitesPerRow;
      if (lastRowItems > 0 && lastRowItems < maxSitesPerRow) {
        const emptyItemsNeeded = maxSitesPerRow - lastRowItems;
        
        // 移除之前可能添加的空白项
        const existingEmptyItems = quickAccessGrid.querySelectorAll('.empty-grid-item');
        existingEmptyItems.forEach(item => item.remove());
        
        // 添加新的空白项
        for (let i = 0; i < emptyItemsNeeded; i++) {
          const emptyItem = document.createElement('div');
          emptyItem.className = 'quick-access-item empty-grid-item';
          emptyItem.style.visibility = 'hidden';
          quickAccessGrid.appendChild(emptyItem);
        }
      } else {
        // 如果是满行，移除所有空白项
        const existingEmptyItems = quickAccessGrid.querySelectorAll('.empty-grid-item');
        existingEmptyItems.forEach(item => item.remove());
      }
    }
  }
  
  // 初始化自定义下拉菜单
  function initCustomDropdowns() {
    // 行数下拉菜单
    initDropdown('rowsDropdown', 'quickAccessRows', function(value) {
      settings.quickAccessRows = parseInt(value);
      saveSettings();
      loadQuickAccess();
    });
    
    // 历史记录数量下拉菜单
    initDropdown('historyDropdown', 'historyLimit', function(value) {
      settings.historyLimit = parseInt(value);
      
      // 如果当前历史记录超过新限制，则裁剪
      if (searchHistoryItems.length > settings.historyLimit) {
        searchHistoryItems = searchHistoryItems.slice(0, settings.historyLimit);
        saveSearchHistory();
        renderSearchHistory();
      }
      
      saveSettings();
    });

    // 搜索引擎下拉菜单
    initDropdown('engineDropdown', 'searchEngine', function(value) {
      settings.searchEngine = value;
      saveSettings();
    });
  }
  
  // 初始化单个下拉菜单
  function initDropdown(dropdownId, selectId, changeCallback) {
    const dropdown = document.getElementById(dropdownId);
    const select = document.getElementById(selectId);
    const selectedOption = dropdown.querySelector('.selected-option');
    const options = dropdown.querySelectorAll('.dropdown-option');
    
    // 点击选中项打开/关闭下拉菜单
    selectedOption.addEventListener('click', function() {
      dropdown.classList.toggle('active');
      
      // 关闭其他下拉菜单
      document.querySelectorAll('.custom-dropdown').forEach(function(el) {
        if (el.id !== dropdownId) {
          el.classList.remove('active');
        }
      });
      
      // 标记当前选中的选项
      const currentValue = select.value;
      options.forEach(function(option) {
        option.classList.toggle('selected', option.dataset.value === currentValue);
      });
    });
    
    // 点击选项
    options.forEach(function(option) {
      option.addEventListener('click', function() {
        const value = this.dataset.value;
        
        // 更新显示文本
        selectedOption.textContent = this.textContent;
        
        // 更新隐藏的select元素
        select.value = value;
        
        // 触发select的change事件
        const event = new Event('change');
        select.dispatchEvent(event);
        
        // 调用回调函数
        if (changeCallback) {
          changeCallback(value);
        }
        
        // 关闭下拉菜单
        dropdown.classList.remove('active');
      });
    });
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', function(event) {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
      }
    });
    
    // 初始化选中项
    const initialValue = select.value;
    options.forEach(function(option) {
      if (option.dataset.value === initialValue) {
        selectedOption.textContent = option.textContent;
        option.classList.add('selected');
      }
    });
  }
  
  // 更新自定义下拉菜单
  function updateCustomDropdown(dropdownId, selectId, value) {
    const dropdown = document.getElementById(dropdownId);
    const select = document.getElementById(selectId);
    const selectedOption = dropdown.querySelector('.selected-option');
    const options = dropdown.querySelectorAll('.dropdown-option');
    
    // 更新select的值
    select.value = value;
    
    // 更新显示文本
    options.forEach(function(option) {
      if (option.dataset.value == value) {
        selectedOption.textContent = option.textContent;
      }
    });
  }
  
  // 刷新所有网站图标
  refreshIconsBtn.addEventListener('click', function() {
    // 禁用按钮并更改文本
    refreshIconsBtn.textContent = '刷新中...';
    refreshIconsBtn.disabled = true;
    
    // 清除本地存储中的图标缓存
    chrome.storage.local.get(null, function(result) {
      // 找出所有图标缓存项
      const iconKeys = Object.keys(result).filter(key => key.startsWith('icon_'));
      
      if (iconKeys.length > 0) {
        // 删除所有图标缓存
        chrome.storage.local.remove(iconKeys, function() {
          // 重新加载所有网站图标
          loadQuickAccess();
          
          // 显示成功信息弹窗
          showRefreshSuccessMessage();
          
          // 恢复按钮状态
          refreshIconsBtn.textContent = '刷新';
          refreshIconsBtn.disabled = false;
        });
      } else {
        // 没有图标缓存，直接重新加载
        loadQuickAccess();
        
        // 显示成功信息弹窗
        showRefreshSuccessMessage();
        
        // 恢复按钮状态
        refreshIconsBtn.textContent = '刷新';
        refreshIconsBtn.disabled = false;
      }
    });
  });
});