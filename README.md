# VistaTab

一个简洁的Chrome浏览器新标签页扩展，提供搜索、快捷网站管理和主题切换功能。

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/abcdream-Lary/VistaTab/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/abcdream-Lary/VistaTab/blob/main/LICENSE)

## 功能特性

### 搜索功能
- 支持多个搜索引擎（Google、百度、必应等）
- 搜索历史记录保存
- 键盘导航搜索历史（上下箭头键）
- 输入时过滤历史记录
- 清除搜索历史

### 快捷网站管理
- 添加、编辑、删除网站
- 拖拽排序网站位置
- 自动获取网站图标
- 右键编辑网站信息
- 导出/导入网站数据（JSON格式）

### 主题切换
- 浅色、深色、蓝色、绿色主题
- 实时切换主题

### 设置选项
- 自定义搜索引擎
- 调整网站显示行数
- 搜索历史开关和数量限制
- 图标刷新功能

### 技术特点
- 模块化JavaScript架构
- Chrome Extension Manifest V3
- 本地数据存储
- 响应式布局



## 安装方法

### 从源码安装
1. 下载或克隆此仓库
```bash
git clone https://github.com/abcdream-Lary/VistaTab.git
```

2. 打开Chrome浏览器，访问 `chrome://extensions/`

3. 开启右上角的"开发者模式"

4. 点击"加载已解压的扩展程序"

5. 选择VistaTab文件夹

6. 安装完成

## 项目结构
```
VistaTab/
├── manifest.json          # 扩展程序清单
├── newtab.html            # 新标签页HTML
├── css/
│   └── newtab.css         # 样式文件
├── js/
│   ├── main.js            # 主入口文件
│   ├── newtab.js          # 原始文件备份（已重构）
│   ├── modules/           # 模块化代码目录
│   │   ├── config.js      # 配置和常量
│   │   ├── utils.js       # 工具函数
│   │   ├── storage.js     # 存储管理
│   │   ├── search.js      # 搜索功能
│   │   ├── quickAccess.js # 快捷网站管理
│   │   ├── settings.js    # 设置面板
│   │   └── modals.js      # 弹窗管理
│   └── CODE_DOCUMENTATION.md # 代码文档说明
├── icons/                 # 图标文件
│   ├── favicon.ico
│   ├── icon.png
│   ├── icon_128.png
│   ├── icon_width.png
│   └── ...
├── CHANGELOG.md           # 更新日志
├── LICENSE                # 许可证
└── README.md              # 项目说明
```

## 开发
1. 克隆仓库到本地
2. 按照安装方法加载扩展程序
3. 修改代码后刷新扩展程序查看效果

## 许可证
MIT License - 查看 [LICENSE](LICENSE) 文件

## 联系方式
- 提交 [Issue](https://github.com/abcdream-Lary/VistaTab/issues)
- 邮箱：3447139606@qq.com