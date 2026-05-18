import {lib,game,ui,get,ai,_status} from '../../../../noname.js';
import { gflib } from '../../main/gflib.js';
gflib(lib, game, ui, get, ai, _status, '鸽府包');
lib.init.css(lib.assetURL + 'extension/鸽府包/extension/Wish', 'Wish');
if (!window.SyncModule && gflib?.SyncModule) {
    window.SyncModule = gflib.SyncModule;
}
window.SyncModule.init();
let playerOwnedExtensions = [];

function isInOnlineRoom() {
    return !!_status.connectMode && !!game.roomId;
}

function stripHTML(html) {
    if (!html) return '';
    html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<[^>]+>/g, '');
    html = html.replace(/\s+/g, ' ').trim();
    return html;
}
function cleanText(str) {
    return (str || '').trim().replace(/\s+/g, '');
}
function splitAuthors(authorStr) {
    if (!authorStr) return [];
    return authorStr.split(/，|、|&&|&|\||\s+/).filter(item => item);
}

// 获取所有扩展名称
function getAllExtensions() {
    return new Promise((resolve) => {
        game.getFileList('extension/', (folders) => {
            resolve(folders || []);
        }, () => resolve([]));
    });
}

// 遍历扩展
function findMyInfoAndAuthor() {
    return new Promise((resolve) => {
        if (isInOnlineRoom()) {
            var playerName = window.SyncModule.utils.getNickname();
            // 先读取扩展预留作者名与当前玩家是否匹配，若匹配失败，进行默认组合
            playerOwnedExtensions = [];
            if(playerName == "源·天将士" || playerName == "摆烂の猫") {
                playerOwnedExtensions = ['错乱时空'];
            }
            if(playerName == "御·sky") {
                playerOwnedExtensions = ['一中杀'];
            }
            if(playerName == "若怜" || playerName == "梦见月") {
                playerOwnedExtensions = ['REACGN'];
            }
            if(playerName == "可爱の鸽子" || playerName == "我去，扫福瑞") {
                playerOwnedExtensions = ['鸽府包'];
            }
            if(playerName == "诺离鸡") {
                playerOwnedExtensions = ['诺言'];
            }
            return resolve(true);
        }

        game.getFileList('extension/', (folders) => {
            let checkedCount = 0;
            const totalFolders = folders?.length || 0;
            playerOwnedExtensions = [];
            if (!folders || totalFolders === 0) return resolve(false);
            const currentUid = window.SyncModule.utils.getNickname();
            const myOnlineName = cleanText(game.me?.nickname || currentUid || '');
            folders.forEach(folder => {
                const infoPath = `extension/${folder}/info.json`;
                game.readFileAsText(infoPath, (data) => {
                    checkedCount++;
                    try {
                        const info = JSON.parse(data);
                        if (info.author) {
                            const rawAuthor = info.author;
                            const pureText = stripHTML(rawAuthor);
                            const cleanAuthor = cleanText(pureText);
                            const authorList = splitAuthors(cleanAuthor);
                            if (myOnlineName && authorList.includes(myOnlineName)) {
                                playerOwnedExtensions.push(folder);
                            }
                        }
                    } catch (e) {}
                    if (checkedCount === totalFolders) resolve(true);
                }, () => {
                    checkedCount++;
                    if (checkedCount === totalFolders) resolve(true);
                });
            });
        });
    });
}

function getExtensionCharacters(extName) {
    const list = [];
    for (const packName in lib.characterPack) {
        const charPack = lib.characterPack[packName];
        for (const charName in charPack) {
            const char = charPack[charName];
            if (char.pack === extName || charPack.extension === extName) {
                list.push(charName);
            }
        }
    }
    if (list.length === 0) {
        if (lib.characterPack[extName]) {
            list.push(...Object.keys(lib.characterPack[extName]));
        }
    }
    return list;
}

// 渲染单个扩展的武将板块（复用函数）
function renderExtensionBox(extName, parent, configItem) {
    const chars = getExtensionCharacters(extName);
    // 空武将扩展直接不显示
    if (chars.length === 0) return;

    const extBox = ui.create.div('ext-box', parent);
    extBox.style.width = '100%';
    extBox.style.marginBottom = '24px';
    extBox.style.boxSizing = 'border-box';
    extBox.style.overflow = 'hidden';
    extBox.style.position = 'relative';
    extBox.style.zIndex = 'auto';
    
    const extTitle = ui.create.div('.ext-title', `【${extName}】的武将`, extBox);
    extTitle.style.color = '#fff';
    extTitle.style.fontSize = '16px';
    extTitle.style.marginBottom = '12px';
    extTitle.style.width = '100%';
    extTitle.style.display = 'block';
    extTitle.style.clear = 'both';
    extTitle.style.float = 'none';
    extTitle.style.position = 'relative';
    extTitle.style.zIndex = '2';
    
    const charWrap = ui.create.div('char-wrap', extBox);
    charWrap.style.display = 'flex';
    charWrap.style.flexWrap = 'wrap';
    charWrap.style.gap = '8px';
    charWrap.style.width = '100%';
    charWrap.style.boxSizing = 'border-box';
    charWrap.style.clear = 'both';
    charWrap.style.position = 'relative';
    charWrap.style.zIndex = '1';
    
    chars.forEach(charName => {
        const imgNode = ui.create.div('char-img', charWrap);
        imgNode.style.width = '64px';
        imgNode.style.height = '64px';
        imgNode.style.borderRadius = '8px';
        imgNode.style.backgroundSize = 'cover';
        imgNode.style.backgroundPosition = 'center';
        imgNode.style.flexShrink = '0';
        imgNode.style.position = 'relative';
        imgNode.style.zIndex = '1';
        imgNode.style.cursor = 'pointer';
        if (isInOnlineRoom()) {
            try { imgNode.setBackground(charName, 'character'); } catch (e) {}
        } else {
            game.getFileList('image/stand', (folders, files) => {
                if (files.includes(charName + '.jpg')) {
                    imgNode.style.backgroundImage = `url(image/stand/${charName}.jpg)`;
                } else {
                    imgNode.setBackground(charName, 'character');
                }
            }, () => {
                imgNode.setBackground(charName, 'character');
            });
        }
        imgNode.addEventListener('click', (e) => {
            e.preventDefault();
            const keyword = get.translation(charName.trim());
            lib.config.extension_鸽府包_ljqy = keyword;
            game.saveConfig('extension_鸽府包_ljqy', keyword);
            // 修正变量名拼写
            configItem.innerText = '当前关键词：\n' + keyword;
            if (isInOnlineRoom()) {
                if (window.SyncModule?.savePlayerData) {
                    window.SyncModule.savePlayerData({
                        extension_鸽府包_ljqy: lib.config.extension_鸽府包_ljqy
                    });
                }
            }
        });

        imgNode.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (game.createCharacterSkill) {
                game.createCharacterSkill(charName);
            }
        });
    });
}

// 权限判断
function checkAuthorMatch() {
    return true;
}

game.gfb_ljqy = async function() {
    await findMyInfoAndAuthor();
    if (!checkAuthorMatch()) {
        return;
    }
    game.pause2();
    const LeaderboardBg = ui.create.div(document.body, '.wishBg');
    const LeaderboardBgHide = ui.create.div('.wishBgHide', LeaderboardBg);
    ui.create.div('.close', LeaderboardBgHide, function() {
        LeaderboardBg.remove();
        game.resume2();
    });
    ui.create.div('.modeText', '祈愿关键词', LeaderboardBgHide);
    const uid = SyncModule.utils.getNickname();
    window.clskDataMap = window.clskDataMap || {};
    const savedKeyword =
        window.clskDataMap[uid]?.extension_鸽府包_ljqy || lib.config?.extension_鸽府包_ljqy|| '';
        const rightBg = ui.create.div('.rightBg', LeaderboardBgHide);
        rightBg.style.padding = '10px';
        rightBg.style.boxSizing = 'border-box';
        rightBg.style.overflowY = 'auto';
        const leftBg = ui.create.div('.leftBg', LeaderboardBgHide);
        const configItem = ui.create.div('.modeLbtn', '当前关键词：\n' + savedKeyword, leftBg);
        configItem.style.marginTop = '60px';
        configItem.style.marginBottom = '20px';
        const introItem = ui.create.div('.modeLbtn intro-panel', `
        功能简介：
        1. 点击武将头像，可快速将该武将名设为祈愿关键词
        2. 点击搜索按钮，可手动输入自定义关键词（若名称不全，则游戏中会自动匹配符合要求的武将）
        3. 联机连胜或连败时，下把有概率出现祈愿武将，且每局游戏至多一位玩家会刷出祈愿按钮
        `, leftBg);
        introItem.style.marginTop = '20px';
        introItem.style.padding = '10px';
        introItem.style.lineHeight = '1.6';
        introItem.style.fontSize = '14px';
        introItem.style.color = '#664a2a';
        introItem.style.whiteSpace = 'pre-line';

        // 先渲染自己作者的扩展
        playerOwnedExtensions.forEach(extName => {
            renderExtensionBox(extName, rightBg, configItem);
        });

        // 再渲染其他所有扩展（每个扩展单独分组，空武将不显示）
        const allExts = await getAllExtensions();
        const otherExts = allExts.filter(ext => !playerOwnedExtensions.includes(ext));
        otherExts.forEach(extName => {
            renderExtensionBox(extName, rightBg, configItem);
        });

    let shuru = null;
    const sousuo = ui.create.div('.sousuo', LeaderboardBgHide, function(event) {
        event.stopPropagation();
        event.preventDefault();
        if (!shuru) {
            shuru = document.createElement('input');
            shuru.type = 'text';
            shuru.className = 'sousuoInput';
            shuru.placeholder = '输入武将关键词进行祈愿';
            ui.window.appendChild(shuru);
            const closeInput = function(e) {
                if (shuru.style.display === 'block' && !shuru.contains(e.target) && e.target !== sousuo) {
                    shuru.style.display = 'none';
                }
            };
            document.addEventListener('mousedown', closeInput);
        }
        shuru.value = savedKeyword;
        shuru.style.display = 'block';
        setTimeout(() => shuru.focus(), 50);
    });
    document.addEventListener('keydown', function(event) {
        if (shuru && shuru.style.display === 'block' && event.key === 'Enter') {
            const inputValue = shuru.value.trim();
            if (!inputValue) return;
            lib.config.extension_鸽府包_ljqy = inputValue;
            game.saveConfig('extension_鸽府包_ljqy', inputValue);
            shuru.style.display = 'none';
            configItem.innerText = '当前关键词：\n' + inputValue;
            if (isInOnlineRoom()) {
                if (window.SyncModule?.savePlayerData) {
                    window.SyncModule.savePlayerData({
                        extension_鸽府包_ljqy: lib.config.extension_鸽府包_ljqy
                    });
                }
            }
        }
    });
};