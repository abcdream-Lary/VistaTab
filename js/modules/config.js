/**
 * 配置文件
 * 
 * 这里存放了所有的默认配置和常量：
 * - 搜索引擎列表
 * - 默认网站
 * - 默认设置
 * - 图标颜色等
 * 
 * 修改这个文件就能改变程序的默认行为
 */

/**
 * 搜索引擎URL配置
 * 搜索时会把关键词拼到这些URL后面
 */
export const searchEngines = {
  bing: 'https://www.bing.com/search?q=',           // 必应
  google: 'https://www.google.com/search?q=',       // 谷歌
  baidu: 'https://www.baidu.com/s?wd=',             // 百度
  duckduckgo: 'https://duckduckgo.com/?q=',         // DuckDuckGo(注重隐私)
  sogou: 'https://www.sogou.com/web?query=',        // 搜狗
  ecosia: 'https://www.ecosia.org/search?q=',       // Ecosia(种树搜索引擎)
  qwant: 'https://www.qwant.com/?q=',               // Qwant(欧洲搜索引擎)
  startpage: 'https://www.startpage.com/do/search?q=' // Startpage(隐私搜索)
};

/**
 * 搜索引擎显示名称
 * 用在搜索引擎选择下拉菜单里
 */
export const engineNames = {
  bing: 'Bing',
  google: 'Google',
  baidu: '百度',
  duckduckgo: 'DuckDuckGo',
  sogou: '搜狗',
  ecosia: 'Ecosia',
  qwant: 'Qwant',
  startpage: 'Startpage'
};

/**
 * 默认网站列表
 * 新用户第一次使用时会看到这些网站
 */
export const defaultSites = [
  { name: '百度', url: 'https://www.baidu.com' },
  { name: 'Google', url: 'https://www.google.com' },
  { name: '哔哩哔哩', url: 'https://www.bilibili.com' },  // B站
  { name: 'GitHub', url: 'https://github.com' },          // 程序员社区
  { name: 'QQ邮箱', url: 'https://mail.qq.com' },
  { name: '网易邮箱', url: 'https://mail.163.com/' },
];

/**
 * 默认设置
 * 第一次使用时的默认值，可以在设置面板修改
 */
export const defaultSettings = {
  searchEngine: 'bing',        // 默认搜索引擎
  theme: 'light',              // 默认主题(白天模式)
  quickSites: [],              // 快捷网站(刚开始是空的，会用上面的defaultSites填充)
  quickAccessRows: 2,          // 快捷网站显示几行
  enableSuggestions: true,     // 开启搜索建议
  enableIconAutoCache: true    // 开启图标缓存
};

/**
 * 图标颜色列表
 * 当获取不到网站图标时，会用首字母 + 这些颜色作为替代
 * 同一网站总是用相同的颜色，这样看起来一致
 */
export const iconColors = [
  '#4285F4', // 谷歌蓝
  '#34A853', // 谷歌绿
  '#FBBC05', // 谷歌黄
  '#EA4335', // 谷歌红
  '#5851DB', // Instagram紫
  '#E1306C', // Instagram粉
  '#FD1D1D', // Instagram橙
  '#F77737', // Instagram黄
  '#833AB4', // Instagram深紫
  '#1DA1F2', // 推特蓝
  '#0077B5', // 领英蓝
  '#FF0000'  // YouTube红
];
