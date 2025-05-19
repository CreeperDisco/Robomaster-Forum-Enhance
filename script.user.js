// ==UserScript==
// @name         Robomaster论坛优化
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  增强Robomaster论坛体验，自动签到和清除失效评论
// @copyright    2025 CreeperDisco(https://github.com/CreeperDisco)
// @homepage     https://github.com/CreeperDisco/
// @homepageURL  https://github.com/CreeperDisco/Robomaster-Forum-Enhance
// @updateURL    https://cdn.jsdelivr.net/gh/CreeperDisco/Robomaster-Forum-Enhance/script.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/CreeperDisco/Robomaster-Forum-Enhance/script.user.js
// @author       CreeperDisco
// @license      GPL-3.0
// @supportURL   https://github.com/CreeperDisco/Robomaster-Forum-Enhance/issues
// @match        https://bbs.robomaster.com/*
// @icon         https://www.robomaster.com/favicon.ico
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    let totalRemoved = 0; // 累计移除总数
    let init_href = window.location.href; // 初始href

    // 页面加载完成后注册菜单命令
    window.onload = function () {
        updateMenuCommand('isAutoSignOn', '自动签到');
        updateMenuCommand('isClearCommentsOn', '清除失效评论');
        updateMenuCommand('isClearPageOn', '清除页面杂物');

        // 页面加载完成后调用
        if (GM_getValue('isAutoSignOn', true)) {
            autoSign();
        }
    };

    // 菜单命令注册逻辑
    function updateMenuCommand(key, label) {
        const isEnabled = GM_getValue(key, true);
        const menuLabel = isEnabled ? `✅ ${label}` : `❌ ${label}`;

        GM_registerMenuCommand(menuLabel, () => {
            GM_setValue(key, !isEnabled);
            location.reload();
        });
    }

    // 移除失效评论并更新计数（写的太烂了，迟早重构）
    function removeComment_And_UpdateCount() {
        const containers = document.querySelectorAll('div.comment-main-container.group\\/main');
        const titleElement = document.querySelector('div.commentTextarea__title');


        containers.forEach(container => {
            const deleteFlag = container.querySelector('.comment-user-info .comment-detail.is-delete');
            if (deleteFlag) {
                container.remove();
                totalRemoved++;
            }
        });

        // 更新标题文本
        if (titleElement && (titleElement.textContent != `所有评论 (已移除${totalRemoved}个失效评论)` || titleElement.textContent == `所有评论 (无失效评论)`)) {
            if (totalRemoved > 0) {
                titleElement.textContent = `所有评论 (已移除${totalRemoved}个失效评论)`;
            } else if (!titleElement.textContent.includes('无失效评论')) {
                titleElement.textContent = `所有评论 (无失效评论)`;
            }
        } else {
            return;
        }
    }

    // 自动点击签到按钮
function autoSign() {
    checkSignInStatus()
        .then(isSignedIn => {
            if (!isSignedIn) sendSignInRequest();
        })
        .catch(error => {
            console.error('签到状态检查失败:', error);
        });
}

    // 清除页面上的杂物
    function clearPage() {
        deleteElements('div', 'slider-record-box');
        deleteElements('footer', 'page-footer');
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 根据指定类名删除页面中的 div 元素
    function deleteElements(type, className) {
        const elements = document.querySelectorAll(`${type}.${className}`);
        if (elements.length > 0) {
            elements.forEach(element => element.remove());
        }
    }

    // 发送签到请求
    async function sendSignInRequest() {
        const url = 'https://bbs.robomaster.com/developers-server/rest/user/sign-in';
        const data = await fetchWithHeaders(url, 'POST');

        if (data && data.code === 0 && data.message === 'success' && data.success === true) {
            console.log('✅签到请求成功');
        } else {
            console.log('❌签到请求失败');
        }
    }

    // 检测签到状态
    async function checkSignInStatus() {
        const url = 'https://bbs.robomaster.com/developers-server/rest/user/info';
        const data = await fetchWithHeaders(url, 'POST');

        if (data && data.data && data.data.hasSignIn === true) {
            console.log('签到状态检查成功：【已签到】，\n无需自动签到');
            return true;
        } else {
            console.log('签到状态检查失败：【未签到】，\n开始自动签到...');
            return false;
        }
    }

    // DOM 变更(观察者)回调函数
    const observerCallback = () => {
        if (GM_getValue('isClearCommentsOn', true)) {
            removeComment_And_UpdateCount();
        }
        if (GM_getValue('isClearPageOn', true)) {
            clearPage();
        }
        if (window.location.href !== init_href) {
            init_href = window.location.href;
            totalRemoved = 0;

            const titleElement = document.querySelector('div.commentTextarea__title');
            if (titleElement) {
                titleElement.textContent = `所有评论 (无失效评论)`;
            }
        }
    };

    // 初始化观察者
    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, { childList: true, subtree: true });

    // 封装通用的 fetch 请求函数
    async function fetchWithHeaders(url, method, body = null) {
        const headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'content-type': 'application/json',
            'cookie': document.cookie,
            'dnt': '1',
            'origin': 'https://bbs.robomaster.com',
            'priority': 'u=1, i',
            'referer': 'https://bbs.robomaster.com/',
            'request-id': '',
            'sec-ch-ua': '"Chromium";v="136", "Microsoft Edge";v="136", "Not.A/Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0'
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: body ? JSON.stringify(body) : null,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('请求失败:', error);
            return null;
        }
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
})();
