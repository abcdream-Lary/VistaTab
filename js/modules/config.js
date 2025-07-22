/**
 * 配置和常量模块
 * 包含搜索引擎配置、默认网站、设置默认值等
 *
 * 这个模块集中管理所有的配置项和常量，便于统一维护和修改
 * 所有配置都使用export导出，供其他模块使用
 */

/**
 * 搜索引擎URL配置
 * 定义各个搜索引擎的搜索URL模板
 * 使用时会将查询参数附加到URL后面
 */
export const searchEngines = {
  bing: 'https://www.bing.com/search?q=',           // 微软必应搜索
  google: 'https://www.google.com/search?q=',       // 谷歌搜索
  baidu: 'https://www.baidu.com/s?wd=',             // 百度搜索
  duckduckgo: 'https://duckduckgo.com/?q=',         // DuckDuckGo隐私搜索
  sogou: 'https://www.sogou.com/web?query=',        // 搜狗搜索
  ecosia: 'https://www.ecosia.org/search?q=',       // Ecosia环保搜索
  qwant: 'https://www.qwant.com/?q=',               // Qwant欧洲搜索
  startpage: 'https://www.startpage.com/do/search?q=' // Startpage隐私搜索
};

/**
 * 搜索引擎显示名称
 * 用于在UI界面中显示搜索引擎的友好名称
 * 键名必须与searchEngines中的键名一致
 */
export const engineNames = {
  bing: 'Bing',                    // 微软必应
  google: 'Google',                // 谷歌
  baidu: '百度',                   // 百度
  duckduckgo: 'DuckDuckGo',        // DuckDuckGo
  sogou: '搜狗',                   // 搜狗
  ecosia: 'Ecosia',                // Ecosia
  qwant: 'Qwant',                  // Qwant
  startpage: 'Startpage'           // Startpage
};

/**
 * 默认常用网站配置
 * 当用户首次使用或没有自定义网站时显示的默认网站列表
 * 每个网站对象包含name（显示名称）和url（网站地址）
 */
export const defaultSites = [
  { name: '百度', url: 'https://www.baidu.com' },        // 百度搜索
  { name: 'Google', url: 'https://www.google.com' },     // 谷歌搜索
  { name: '哔哩哔哩', url: 'https://www.bilibili.com' }, // B站视频
  { name: 'GitHub', url: 'https://github.com' },         // 代码托管
  { name: 'QQ邮箱', url: 'https://mail.qq.com' },        // QQ邮箱
  { name: '网易邮箱', url: 'https://mail.163.com/' },    // 网易邮箱
];

/**
 * 应用默认设置配置
 * 定义应用的初始设置值，当用户首次使用时会使用这些默认值
 * 所有设置项都会保存到Chrome存储中
 */
export const defaultSettings = {
  searchEngine: 'bing',        // 默认搜索引擎
  theme: 'light',              // 默认主题（浅色）
  quickSites: [],              // 快捷网站列表（初始为空，会使用defaultSites）
  quickAccessRows: 2           // 快捷网站显示行数
};

/**
 * 网站图标颜色配置
 * 当无法获取网站favicon时，会使用这些颜色作为首字母图标的背景色
 * 颜色会根据网站名称的哈希值确定，确保同一网站始终使用相同颜色
 */
export const iconColors = [
  '#4285F4', // Google Blue - 谷歌蓝
  '#34A853', // Google Green - 谷歌绿
  '#FBBC05', // Google Yellow - 谷歌黄
  '#EA4335', // Google Red - 谷歌红
  '#5851DB', // Instagram Purple - Instagram紫
  '#E1306C', // Instagram Pink - Instagram粉
  '#FD1D1D', // Instagram Orange - Instagram橙
  '#F77737', // Instagram Yellow - Instagram黄
  '#833AB4', // Instagram Purple - Instagram深紫
  '#1DA1F2', // Twitter Blue - 推特蓝
  '#0077B5', // LinkedIn Blue - 领英蓝
  '#FF0000'  // YouTube Red - YouTube红
];
