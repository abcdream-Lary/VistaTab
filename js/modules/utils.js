/**
 * 工具函数模块
 * 包含各种通用的工具函数
 *
 * 这个模块提供了应用中常用的工具函数，包括：
 * - URL验证和处理
 * - 颜色生成
 * - 用户界面交互（错误提示、消息显示）
 * - 性能优化函数（防抖、节流）
 */

import { iconColors } from './config.js';

/**
 * 判断字符串是否为URL
 * 使用正则表达式检测字符串是否符合URL格式
 * 支持http/https协议，也支持不带协议的域名
 *
 * @param {string} str - 要检测的字符串
 * @returns {boolean} 是否为URL格式
 *
 * @example
 * isURL('https://www.google.com') // true
 * isURL('google.com') // true
 * isURL('not a url') // false
 */
export function isURL(str) {
  // 正则表达式说明：
  // ^(https?:\/\/)? - 可选的http或https协议
  // ([a-zA-Z0-9-]+\.)+ - 一个或多个域名部分（包含字母、数字、连字符）
  // [a-zA-Z]{2,} - 顶级域名（至少2个字母）
  // (\/\S*)? - 可选的路径部分
  const pattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
  return pattern.test(str);
}

/**
 * 验证URL格式（更严格的验证）
 * 使用浏览器原生URL构造函数进行验证，比正则表达式更准确
 * 会自动为没有协议的URL添加https://前缀
 *
 * @param {string} str - 要验证的URL字符串
 * @returns {boolean} 是否为有效的URL
 *
 * @example
 * isValidUrl('https://www.google.com') // true
 * isValidUrl('google.com') // true (会自动添加https://)
 * isValidUrl('invalid url') // false
 */
export function isValidUrl(str) {
  try {
    // 如果URL没有协议前缀，自动添加https://
    // 这样可以支持用户输入简化的域名
    if (!str.startsWith('http://') && !str.startsWith('https://')) {
      str = 'https://' + str;
    }
    // 使用URL构造函数验证，如果格式不正确会抛出异常
    new URL(str);
    return true;
  } catch {
    // 如果URL格式不正确，构造函数会抛出异常
    return false;
  }
}

/**
 * 根据字符串生成随机但一致的颜色
 * 使用字符串哈希算法确保相同的字符串总是生成相同的颜色
 * 主要用于网站图标的背景色生成
 *
 * @param {string} str - 输入字符串（通常是网站名称）
 * @returns {string} 十六进制颜色值
 *
 * @example
 * getRandomColor('Google') // 总是返回相同的颜色
 * getRandomColor('百度') // 总是返回相同的颜色
 */
export function getRandomColor(str) {
  // 计算字符串的哈希值
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // 使用位运算生成哈希值，确保结果的一致性
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 使用哈希值从预定义的颜色数组中选择颜色
  // Math.abs确保索引为正数，取模运算确保索引在数组范围内
  return iconColors[Math.abs(hash) % iconColors.length];
}

/**
 * 显示输入框错误提示
 * 在输入框下方显示错误消息，并添加错误样式
 * 会自动聚焦到错误的输入框，并在3秒后自动清除错误状态
 *
 * @param {HTMLElement} inputElement - 输入框DOM元素
 * @param {string} message - 要显示的错误消息
 *
 * @example
 * showInputError(document.getElementById('email'), '请输入有效的邮箱地址')
 */
export function showInputError(inputElement, message) {
  // 先清除之前可能存在的错误状态，避免重复显示
  clearInputError(inputElement);

  // 为输入框添加错误样式类，通常会改变边框颜色等
  inputElement.classList.add('error');

  // 创建错误提示元素
  const errorDiv = document.createElement('div');
  errorDiv.className = 'input-error';
  errorDiv.textContent = message;

  // 将错误提示插入到输入框的父元素中
  inputElement.parentNode.appendChild(errorDiv);

  // 自动聚焦到有错误的输入框，提升用户体验
  inputElement.focus();

  // 设置定时器，3秒后自动清除错误状态
  setTimeout(() => clearInputError(inputElement), 3000);
}

/**
 * 清除输入错误
 * @param {HTMLElement} inputElement - 输入框元素
 */
export function clearInputError(inputElement) {
  inputElement.classList.remove('error');
  const errorDiv = inputElement.parentNode.querySelector('.input-error');
  if (errorDiv) {
    errorDiv.remove();
  }
}

/**
 * 显示临时消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 ('success', 'error', 'info') - 现在忽略此参数，始终使用绿色成功样式
 * @param {number} duration - 显示时长（毫秒）
 */
export function showMessage(message, type = 'success', duration = 2000) {
  // 检查是否已存在消息，如果有则移除
  const existingMessages = document.querySelectorAll('div[class^="message-"]');
  existingMessages.forEach(msg => msg.remove());

  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.className = `message-success`; // 始终使用success类
  document.body.appendChild(messageDiv);
  
  // 设置样式 - 统一使用绿色成功样式
  const backgroundColor = '#4CAF50'; // 始终使用绿色
  
  messageDiv.style.position = 'fixed';
  messageDiv.style.bottom = '20px';
  messageDiv.style.left = '50%';
  messageDiv.style.transform = 'translateX(-50%)';
  messageDiv.style.backgroundColor = backgroundColor;
  messageDiv.style.color = 'white';
  messageDiv.style.padding = '10px 20px';
  messageDiv.style.borderRadius = '8px';
  messageDiv.style.fontSize = '15px';
  messageDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  messageDiv.style.zIndex = '1000';
  messageDiv.style.opacity = '0';
  messageDiv.style.transition = 'opacity 0.3s';
  
  // 显示消息
  setTimeout(() => { messageDiv.style.opacity = '1'; }, 10);
  
  // 指定时间后移除提示
  setTimeout(function() {
    messageDiv.style.opacity = '0';
    setTimeout(() => { messageDiv.remove(); }, 300);
  }, duration);
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
