import {lib,game,ui,get,ai,_status} from '../../../../noname.js';
import { gflib } from '../../main/gflib.js';
gflib(lib, game, ui, get, ai, _status, '鸽府包');
lib.init.css(lib.assetURL + 'extension/鸽府包/extension/Wish', 'Wish');
if (!window.SyncModule && gflib?.SyncModule) {
    window.SyncModule = gflib.SyncModule;
}
window.SyncModule.init();
let playerOwnedExtensions = [];
// 扩展名到作者名
let infoAuthorMap = {};
// 武将包到所属扩展文件夹
let packHintCache = {};
// 按字母表顺序
function cmpWishName(a, b) {
    return String(a).localeCompare(String(b));
}
function isInOnlineRoom() {
    return !!_status.connectMode && !!game.roomId;
}
function stripHTML(html) {
    if (!html) return '';
    html = Array.isArray(html) ? html.join("&") : String(html);
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
function gfWishHasHiddenTag(tags) {
	if (!Array.isArray(tags)) return false;
	for (const t of tags) {
		if (typeof t !== 'string') continue;
		const low = t.toLowerCase();
		if (low === 'boss' || low === 'forbidai' || low === 'unseen') return true;
	}
	return false;
}
function gfWishCharDefHidden(c) {
	if (!c) return false;
	if (!Array.isArray(c)) {
		if (c.isUnseen === true) return true;
		if (c.isAiForbidden === true) return true;
		if (c.isBoss === true) return true;
		if (c.isHiddenBoss === true) return true;
		if (c.forbidai) return true;
		if (c.boss) return true;
		if (c.unseen) return true;
		if (gfWishHasHiddenTag(c.tags)) return true;
		return false;
	}
	if (gfWishHasHiddenTag(c[4])) return true;
	if (c.isUnseen === true || c.isAiForbidden === true || c.isBoss === true || c.forbidai || c.boss) return true;
	return false;
}
function gfWishCharHidden(charName, rawChar) {
	const sources = [];
	if (lib.character && lib.character[charName]) sources.push(lib.character[charName]);
	if (rawChar) sources.push(rawChar);
	for (const c of sources) {
		if (gfWishCharDefHidden(c)) return true;
	}
	return false;
}
// 已安装的全部扩展名
function getAllExtensions() {
    const list = [];
    const push = (name) => {
        if (!name || list.includes(name)) return;
        list.push(name);
    };
    try {
        (lib.config.extensions || []).forEach(push);
    } catch (e) {}
    Object.keys(lib.extensionPack || {}).forEach(push);
    return list;
}
// 全部武将包名
function getAllPackNames() {
    const list = [];
    const push = (name) => {
        if (!name || list.includes(name)) return;
        list.push(name);
    };
    Object.keys(lib.characterPack || {}).forEach(push);
    try {
        (lib.config.characters || []).forEach(push);
    } catch (e) {}
    return list;
}
// 从武将立绘路径推出所属扩展
function getPackHint(packName) {
    if (packHintCache[packName] !== undefined) return packHintCache[packName];
    let hint = '';
    const pack = (lib.characterPack || {})[packName] || {};
    for (const charName in pack) {
        const raw = pack[charName];
        const paths = [];
        if (Array.isArray(raw)) {
            (raw[4] || []).forEach(item => {
                if (typeof item === 'string') paths.push(item);
            });
        } else if (raw && typeof raw === 'object') {
            if (typeof raw.img === 'string') paths.push(raw.img);
            if (Array.isArray(raw.dieAudios)) {
                raw.dieAudios.forEach(item => {
                    if (typeof item === 'string') paths.push(item);
                });
            }
        }
        for (const path of paths) {
            const match = /(?:ext:|extension\/|db:extension-)([^\/:]+)[\/:]/.exec(path);
            if (match && match[1]) {
                hint = match[1];
                break;
            }
        }
        if (hint) break;
    }
    packHintCache[packName] = hint;
    return hint;
}
// 扩展对应的武将包
function getExtensionPacks(extName) {
    const list = [];
    const push = (packName) => {
        if (!packName || list.includes(packName)) return;
        if (!(lib.characterPack || {})[packName]) return;
        list.push(packName);
    };
    const lower = String(extName).toLowerCase();
    push(extName);
    getAllPackNames().forEach(packName => {
        if (String(packName).toLowerCase() === lower) push(packName);
        else if (getPackHint(packName).toLowerCase() === lower) push(packName);
    });
    return list;
}
// 扩展作者名
function getExtensionAuthors(extName) {
    const list = [];
    const push = (author) => {
        if (!author || list.includes(author)) return;
        list.push(author);
    };
    const pack = (lib.extensionPack || {})[extName];
    if (pack && pack.author) {
        const rawAuthor = Array.isArray(pack.author) ? pack.author.join("&") : pack.author;
        splitAuthors(cleanText(stripHTML(String(rawAuthor)))).forEach(push);
    }
    (infoAuthorMap[extName] || []).forEach(push);
    return list;
}
// 读info.json补全扩展名到作者名
function loadAuthorMap() {
    return new Promise((resolve) => {
        game.getFileList('extension/', (folders) => {
            const total = (folders || []).length;
            if (!total) return resolve(true);
            let checked = 0;
            const finish = () => {
                checked++;
                if (checked >= total) resolve(true);
            };
            folders.forEach(folder => {
                game.readFileAsText(`extension/${folder}/info.json`, (data) => {
                    try {
                        const info = JSON.parse(data);
                        const authors = splitAuthors(cleanText(stripHTML(info.author || '')));
                        if (authors.length) {
                            const name = info.name || folder;
                            if (!infoAuthorMap[name]) infoAuthorMap[name] = [];
                            authors.forEach(author => {
                                if (!infoAuthorMap[name].includes(author)) infoAuthorMap[name].push(author);
                            });
                        }
                    } catch (e) {}
                    finish();
                }, finish);
            });
        }, () => resolve(true));
    });
}
// 预设昵称对应的扩展
const wishPresetAuthors = {
    '源·天将士': ['错乱时空'],
    '摆烂の猫': ['错乱时空'],
    '御.sky': ['一中杀'],
    '若怜': ['REACGN'],
    '梦见月': ['REACGN'],
    '可爱の鸽子': ['鸽府包'],
    'Mimi': ['鸽府包'],
    '我去，扫福瑞': ['鸽府包'],
    '电翼单推人': ['鸽府包'],
    '诺离鸡': ['诺岩'],
    'ES': ['苍翼默示录'],
    '。。': ['赛尔计划'],
    'rock': ['重塑系列削弱版'],
};
const wishDefaultOrder = ['REACGN', '鸽府包', '错乱时空', '苍翼默示录', '一中杀'];
// 自己的扩展，先按作者名匹配，匹配不到再用预设
function findMyInfoAndAuthor() {
    return loadAuthorMap().then(() => {
        const connectName = cleanText(window.SyncModule.utils.getNickname() || '');
        const myNames = [connectName, cleanText(game.me?.nickname || '')].filter(name => name);
        const all = getAllExtensions();
        const owned = [];
        all.forEach(extName => {
            const authors = getExtensionAuthors(extName);
            if (!authors.length) return;
            if (!authors.some(author => myNames.includes(author))) return;
            if (!owned.includes(extName)) owned.push(extName);
        });
        if (!owned.length) {
            myNames.forEach(name => {
                (wishPresetAuthors[name] || []).forEach(extName => {
                    if (all.includes(extName) && !owned.includes(extName)) owned.push(extName);
                });
            });
        }
        playerOwnedExtensions = owned;
        return true;
    });
}
// 扩展的武将
function getExtensionCharacters(extName) {
    const list = [];
    const add = (charName, rawChar) => {
        if (!charName || list.includes(charName)) return;
        if (!(lib.character && lib.character[charName])) return;
        if (gfWishCharHidden(charName, rawChar)) return;
        list.push(charName);
    };
    getExtensionPacks(extName).forEach(packName => {
        const pack = (lib.characterPack || {})[packName] || {};
        for (const charName in pack) add(charName, pack[charName]);
    });
    const extPack = (lib.extensionPack || {})[extName];
    const extMap = extPack && extPack.character && extPack.character.character;
    if (extMap) {
        for (const charName in extMap) add(charName, extMap[charName]);
    }
    return list;
}
// 单个武将包的武将
function getPackCharacters(packName) {
    const list = [];
    const pack = (lib.characterPack || {})[packName] || {};
    for (const charName in pack) {
        if (list.includes(charName)) continue;
        if (!(lib.character && lib.character[charName])) continue;
        if (gfWishCharHidden(charName, pack[charName])) continue;
        list.push(charName);
    }
    return list;
}
// 没归属到任何扩展的武将包
function getOrphanPacks(claimed) {
    const list = [];
    getAllPackNames().forEach(packName => {
        if (claimed.includes(packName)) return;
        if (!getPackHint(packName)) return;
        if (!getPackCharacters(packName).length) return;
        list.push(packName);
    });
    return list;
}
// 渲染单个扩展的武将板块
function renderExtensionBox(extName, parent, configItem) {
    renderCharBox(`【${extName}】的武将`, getExtensionCharacters(extName), parent, configItem);
}
// 渲染一个武将板块
function renderCharBox(title, chars, parent, configItem) {
    if (!chars || chars.length === 0) return;
    const extBox = ui.create.div('ext-box', parent);
    extBox.style.width = '100%';
    extBox.style.marginBottom = '24px';
    extBox.style.boxSizing = 'border-box';
    extBox.style.overflow = 'hidden';
    extBox.style.position = 'relative';
    extBox.style.zIndex = 'auto';
    const extTitle = ui.create.div('.ext-title', title, extBox);
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
        if (gfWishCharHidden(charName)) return;
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
    window.gfDataMap = window.gfDataMap || {};
    const savedKeyword =
        window.gfDataMap[uid]?.extension_鸽府包_ljqy || lib.config?.extension_鸽府包_ljqy|| '';
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
        // 自己的扩展最前 其次默认顺序 最后字母表
        const allExts = getAllExtensions();
        const mineExts = allExts.filter(ext => playerOwnedExtensions.includes(ext)).sort(cmpWishName);
        const restExts = allExts.filter(ext => !playerOwnedExtensions.includes(ext));
        const orderExts = [];
        wishDefaultOrder.forEach(name => {
            const hit = restExts.find(ext => String(ext).toLowerCase() === String(name).toLowerCase());
            if (hit && !orderExts.includes(hit)) orderExts.push(hit);
        });
        const otherExts = restExts.filter(ext => !orderExts.includes(ext)).sort(cmpWishName);
        mineExts.forEach(extName => {
            renderExtensionBox(extName, rightBg, configItem);
        });
        orderExts.forEach(extName => {
            renderExtensionBox(extName, rightBg, configItem);
        });
        otherExts.forEach(extName => {
            renderExtensionBox(extName, rightBg, configItem);
        });
        // 没归属到扩展的武将包也补上
        const claimed = [];
        allExts.forEach(extName => {
            getExtensionPacks(extName).forEach(packName => {
                if (!claimed.includes(packName)) claimed.push(packName);
            });
        });
        getOrphanPacks(claimed).sort(cmpWishName).forEach(packName => {
            const title = lib.translate[packName + '_character_config'] || packName;
            renderCharBox(`【${title}】的武将`, getPackCharacters(packName), rightBg, configItem);
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
