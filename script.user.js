// ==UserScript==
// @name         Robomaster论坛优化
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  增强Robomaster论坛体验，自动签到和清除失效评论
// @copyright    2025 CreeperDisco(https://github.com/CreeperDisco)
// @homepage     https://github.com/CreeperDisco/
// @homepageURL  https://github.com/CreeperDisco/Robomaster-Forum-Enhance
// @updateURL    https://cdn.jsdelivr.net/gh/CreeperDisco/Robomaster-Forum-Enhance/script.js
// @downloadURL  https://cdn.jsdelivr.net/gh/CreeperDisco/Robomaster-Forum-Enhance/script.js
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

    // 移除失效评论并更新计数
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
    function checkSignButton() {
        const greetingBtn = document.querySelector('div.greeting__btn');
        const greetingSlogan = document.querySelector('div.greeting__slogan');
        const disabledBtn = document.querySelector('div.greeting__btn--disabled');

        if (greetingSlogan && greetingSlogan.textContent != '已帮您自动签到') {
            if (greetingBtn && !disabledBtn) {
                unsafeWindow.eval('_gAuthEvents[0](event)');
                console.log('签到成功');
            } else if (disabledBtn) {
                greetingSlogan.textContent = '已帮您自动签到';
            }
        }
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

    // DOM 变更(观察者)回调函数
    const observerCallback = () => {
        if (GM_getValue('isClearCommentsOn', true)) {
            removeComment_And_UpdateCount();
        }
        if (GM_getValue('isAutoSignOn', true)) {
            checkSignButton();
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
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
})();
