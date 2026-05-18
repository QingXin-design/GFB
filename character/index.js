import { lib, game, ui, get, ai, _status } from '../../../noname.js'
import { characterData } from './characterData.js'
import { characterIntro } from './characterIntro.js'
import { characterReplace } from './characterReplace.js'
import { characterSort } from './characterSort.js'
import { characterSubstitute } from './characterSubstitute.js'
import { characterTitle } from './characterTitle.js'
import { perfectPair } from './perfectPair.js'
import { skill } from './skill.js'
import { translate } from './translate.js'
import { dynamicTranslate } from './dynamicTranslate.js'

const prefixToGroupName = {
	'gf': '鸽府',
	'wzzs': '无职转生',
	'cxm': '荼家将',
    'dmwc': '大明王朝',
	'tj': '汝家将',
	'gzhlb': '欢乐鸽',
	'gzt': '鸽杂谈',
	'seh': '赛尔号',
	'aqcs': '奥奇传说',
	'gzlj': '公主连结',
	'a': '实验体'
};

const allCharacterNames = new Set(Object.keys(characterData));
for (const [key, originalName] of Object.entries(translate)) {
	const [prefix] = key.split('_');
	if (allCharacterNames.has(key) && prefixToGroupName[prefix] && originalName) {
		translate[key] = `${prefixToGroupName[prefix]}${originalName}`;
		if (lib.translate) {
			lib.translate[key] = translate[key];
		}
	}
}

const filteredCharacterData = {};
const isConnectMode = _status.connectMode;
const baseCondition = char => {
    if (Array.isArray(char) && Array.isArray(char[4])) {
        char[4] = char[4].map(item => {
            if (item === 'noPool') return 'unseen';
            if (item === 'noYjhj' && lib.config.extension_鸽府包_gfb_yjhj) return 'unseen';
            return item;
        });
    }
    return !char.noPool && (isConnectMode ? !char.noOnline : true);
};
for (const name in characterData) {
    const char = characterData[name];
    const yjhj = !char.noYjhj && (isConnectMode ? !char.noYjhj : true);
    const Include = baseCondition(char) && (lib.config.extension_鸽府包_gfb_yjhj ? yjhj : true);
    if (Include) {
        filteredCharacterData[name] = char;
    }
}

const targetVersion = "1.11.1";
function isVersionGte(currentVer, requiredVer) {
    if (!currentVer || !requiredVer) return false;
    const cur = currentVer.split('.').map(Number);
    const req = requiredVer.split('.').map(Number);
    const maxLen = Math.max(cur.length, req.length);
    for (let i = 0; i < maxLen; i++) {
        const c = cur[i] || 0;
        const r = req[i] || 0;
        if (c > r) return true;
        if (c < r) return false;
    }
    return true;
}
const currentLibVersion = lib?.version || "0.0.0";
const isGte1110 = isVersionGte(currentLibVersion, targetVersion);

let block = {
    name: 'mode_extension_鸽府包',
    connect: true,
    character: isGte1110 ? { ...filteredCharacterData } : { ...characterData },
    characterIntro: { ...characterIntro },
    characterReplace: { ...characterReplace },
    characterSort: { ...characterSort },
    characterTitle: { ...characterTitle },
    characterSubstitute: { ...characterSubstitute },
    perfectPair: { ...perfectPair },
    translate: translate,
    dynamicTranslate: dynamicTranslate,
};

if (lib.device || lib.node) {
    if (!_status.postReconnect.gfb) _status.postReconnect.gfb = [function (list, info) {
        for (let i in list) {
            lib.character[i] = list[i];
        };
        for (let i in info) if (!lib.translate[i]) lib.translate[i] = info[i];
    }, {}, {}];
    if (isGte1110) {
        const outcropConfig = lib.config.extension_鸽府包_outcrop;
        if (outcropConfig || outcropConfig === true) {
            const imagePath = `extension/鸽府包/image/character/${outcropConfig === true ? "stand" : outcropConfig}/`;
            const suffix = ".jpg";
            for (const id in characterData) {
                const validPrefixes = ["gf_", "wzzs_", "cxm_","dmwc_" , "tj_", "gzhlb_", "gzt_", "seh_", "aqcs_", "gzlj_", "a_"];
                if (validPrefixes.some(prefix => id.startsWith(prefix))) {
                    const imgPath = imagePath + id + suffix;
                    const config = characterData[id];
                    if (config) {
                        config.img = imgPath;
                        if (Array.isArray(config)) config[4] ? (config[4] = [imgPath]) : config.push([imgPath]);
                        if (!config[4]) config[4] = [];
                        config[4].push('ext:鸽府包/image/character/' + (outcropConfig === true ? "stand" : outcropConfig) + '/' + id + '.jpg');
                    }
                }
            }
        }
        for (let name in characterData) {
            const underlineIndex = name.indexOf('_');
            const prefix = underlineIndex > 0 ? name.substring(0, underlineIndex) : 'a';
            const namex = underlineIndex > 0 ? name.substring(underlineIndex + 1) : name;
            if (characterSort.mode_extension_鸽府包[prefix]) characterSort.mode_extension_鸽府包[prefix].push(name);
            if (!translate[name + '_prefix']) translate[name + '_prefix'] = prefixToGroupName[prefix] || prefix;
            const charConfig = characterData[name];
            if (!charConfig[4]) charConfig[4] = [];
            charConfig[4].push(`die:ext:鸽府包/audio/die/${name}.mp3`);
            lib.arenaReady.push(() => {
                lib.characterReplace[namex] ? lib.characterReplace[namex].push(name) : (lib.characterReplace[namex] = [name]);
            });
        }
    } else {
        for (let name in characterData) {
            const outcrop = lib.config.extension_鸽府包_outcrop ? lib.config.extension_鸽府包_outcrop : 'loutou';
            const underlineIndex = name.indexOf('_');
            let prefix = '';
            let namex = name;
            if (underlineIndex > 0) {
                prefix = name.substring(0, underlineIndex);
                namex = name.substring(underlineIndex + 1);
            } else {
                prefix = 'a';
                namex = name;
            }
            if (characterSort.mode_extension_鸽府包[prefix]) characterSort.mode_extension_鸽府包[prefix].push(name);
            if (!translate[name + '_prefix']) translate[name + '_prefix'] = translate[prefix] || prefix;
            if (!characterData[name][4]) characterData[name][4] = [];
            characterData[name][4].push('extension/鸽府包/image/character/' + outcrop + '/' + name + '.jpg');
            characterData[name][4].push('ext:鸽府包/image/character/' + outcrop + '/' + name + '.jpg');
            characterData[name][4].push('die:ext:鸽府包/audio/die/' + name + '.mp3');
            lib.arenaReady.push(() => {
                if (lib.characterReplace[namex]) lib.characterReplace[namex].push(name);
                else lib.characterReplace[namex] = [name];
            });
        };
    }
}

if (lib.config.extension_鸽府包_gfb_logBan) {
    (() => {
        const blockLog = (args) => {
            const fullMsg = args.join(' ').toLowerCase();
            if (fullMsg.includes('duplicated skill in character') && fullMsg.includes('鸽府包')) {
                return true;
            }
            return false;
        };
        console.log = function(...args) {
            if (!blockLog(args)) {}
        };
    })();
}

if (!_status.postReconnect.extErdai_skill) {
	_status.postReconnect.extErdai_skill = [function (skills, info) {
		for (let skill in skills) {
			lib.skill[skill] = skills[skill];
			if (info[skill]) lib.translate[skill] = info[skill];
			if (info[skill + '_info']) lib.translate[skill + '_info'] = info[skill + '_info'];
			game.finishSkill(skill);
		}
	}, {}, {}];
};

for (let key in skill) {
	_status.postReconnect.extErdai_skill[1][key] = skill[key];
	if (translate[key]) _status.postReconnect.extErdai_skill[2][key] = translate[key];
	if (translate[key + '_info']) _status.postReconnect.extErdai_skill[2][key + '_info'] = translate[key + '_info'];
};

//分类
const Groups = characterSort.mode_extension_鸽府包;
for (const prefix of Object.keys(Groups)) {
    if (!Array.isArray(Groups[prefix])) {
        Groups[prefix] = [];
    }
}

for (const Id in characterData) {
    if (!characterData.hasOwnProperty(Id)) continue;
    const Config = characterData[Id];
    if (!Array.isArray(Config) || Config.length <= 1) continue;
    const heroPrefix = Id.split('_')[0];
    if (Groups.hasOwnProperty(heroPrefix)) {
        Groups[heroPrefix].push(Id);
    }
}

if (lib.config.extension_鸽府包_gfb_tlfb) {
    const originalHpKey = "original_hp";
    const originalMaxHpKey = "original_maxHp";
    const originalArmorKey = "original_armor";
    const hpIndex = 2;
    for (const Id in characterData) {
        const Config = characterData[Id];
        let isArrayFormat = Array.isArray(Config);
        // 老格式适配
        if (isArrayFormat) {
            if (Config.length <= hpIndex || Config[hpIndex] === undefined) {
                continue;
            }
            if (!Config[originalHpKey]) {
                Config[originalHpKey] = Config[hpIndex];
            }
            const originalHp = Config[originalHpKey];
            let newHp;
            if (typeof originalHp === "string" && originalHp.includes("/")) {
                newHp = originalHp.split("/")
                    .map(num => {
                        const numVal = Number(num);
                        return isNaN(numVal) ? num : numVal * 2;
                    })
                    .join("/");
            } else {
                const hpNum = Number(originalHp);
                newHp = isNaN(hpNum) ? originalHp : hpNum * 2;
            }
            Config[hpIndex] = newHp;
            continue;
        }
        if (Config.hp === undefined && Config.maxHp === undefined && Config.hujia === undefined) {
            continue;
        }
        // hp
        if (Config.hp !== undefined) {
            if (!Config[originalHpKey]) {
                Config[originalHpKey] = Config.hp;
            }
            const originalHp = Config[originalHpKey];
            let newHp;
            if (typeof originalHp === "string" && originalHp.includes("/")) {
                newHp = originalHp.split("/")
                    .map(num => {
                        const numVal = Number(num);
                        return isNaN(numVal) ? num : numVal * 2;
                    })
                    .join("/");
            } else {
                const hpNum = Number(originalHp);
                newHp = isNaN(hpNum) ? originalHp : hpNum * 2;
            }
            Config.hp = newHp;
        }
        // maxHp
        if (Config.maxHp !== undefined) {
            if (!Config[originalMaxHpKey]) {
                Config[originalMaxHpKey] = Config.maxHp;
            }
            const originalMaxHp = Config[originalMaxHpKey];
            let newMaxHp;
            if (typeof originalMaxHp === "string" && originalMaxHp.includes("/")) {
                newMaxHp = originalMaxHp.split("/")
                    .map(num => {
                        const numVal = Number(num);
                        return isNaN(numVal) ? num : numVal * 2;
            })
                    .join("/");
            } else {
                const maxHpNum = Number(originalMaxHp);
                newMaxHp = isNaN(maxHpNum) ? originalMaxHp : maxHpNum * 2;
            }
            Config.maxHp = newMaxHp;
        }
        // hujia
        if (Config.hujia !== undefined) {
            if (!Config[originalArmorKey]) {
                Config[originalArmorKey] = Config.hujia;
            }
            const originalArmor = Config[originalArmorKey];
            let newArmor;
            if (typeof originalArmor === "string" && originalArmor.includes("/")) {
                newArmor = originalArmor.split("/")
                    .map(num => {
                        const numVal = Number(num);
                        return isNaN(numVal) ? num : numVal * 2;
                    })
                    .join("/");
            } else {
                const armorNum = Number(originalArmor);
                newArmor = isNaN(armorNum) ? originalArmor : armorNum * 2;
            }
            Config.hujia = newArmor;
        }
    }
}
/*(function autoMountSkillToAllGenerals() {
    const FIXED_SKILL_NAME = "gf_ljqyInit";
    window.lib = window.lib || {};
    window.lib.skill = window.lib.skill || {};
    if (window.lib.skill[FIXED_SKILL_NAME]) return;
    const fixedSkillConfig = {};
    window.lib.skill[FIXED_SKILL_NAME] = fixedSkillConfig;
    for (const generalId in characterData) {
        const generalConfig = characterData[generalId];
        if (!generalConfig) continue;
        let skillList = Array.isArray(generalConfig)
            ? generalConfig[campConfig.skillListIndex] || []
            : generalConfig.skills || [];
        if (!Array.isArray(skillList)) skillList = [];
        if (!skillList.includes(FIXED_SKILL_NAME)) {
            skillList.push(FIXED_SKILL_NAME);
        }
        if (Array.isArray(generalConfig)) {
            generalConfig[campConfig.skillListIndex] = skillList;
        } else {
            generalConfig.skills = skillList;
        }
    }
})();
lib.skill["gf_ljqyInit"] = {
    trigger: {
        global: 'gameStart',
        player: 'enterGame',
    },
    usable: 1,
    forced: true,
    popup: false,
    silent: true,
    priority: 999,
    firstDo: true,
    fixed: true,
    direct: true,
    charlotte: true,
    superCharlotte: true,
    filter: function (event, player) {
        return true;
    },
    content: function (event, player) {
        player.draw(1);
    },
}*/
window.gfbSkillPools = {
    triggerPool: [
        { key: "1", config: { player: "phaseZhunbei", }, cnDesc: "准备阶段，" },
        { key: "2", config: { player: "damageEnd", }, cnDesc: "当你受到伤害后，" },
        { key: "3", config: { player: "changeHp", }, cnDesc: "当你的体力发生变化时，" },
        { key: "4", config: { player: "shaMiss", }, cnDesc: "当你的【杀】被响应时，" },
        { key: "5", config: { player: "useCard1", }, cnDesc: "当你使用牌时，" },
        { key: "6", config: { player: "useCardToPlayered", }, cnDesc: "当你使用牌指定目标后，" },
        { key: "7", config: { player: "useCardAfter", }, cnDesc: "在你使用一张牌之后，" },
        { key: "8", config: { player: "recoverEnd", }, cnDesc: "当你恢复体力后，" },
        { key: "9", config: { player: ["dying"], }, cnDesc: "当你进入濒死状态时，" }
    ],

    filterPool: [
        { key: "11", func: function (event, player) { return player.hp < player.maxHp; }, cnDesc: "若你已受伤，" },
        { key: "12", func: function (event, player) { return player.countCards('h') < 4; }, cnDesc: "若你的手牌数小于4，" },
        { key: "13", func: function (event, player) { return !player.getStat('damage'); }, cnDesc: "若你本回合未造成过伤害，" },
        { key: "14", func: function (event, player) { return !player.isMinHp(); }, cnDesc: "若你的体力不为全程最少，" },
        { key: "35", func: function (event, player) { return !player.getEquip(2); }, cnDesc: "若你没有防具且防具栏未被废除，" },
        { key: "36", func: function (event, player) { return player != _status.currentPhase; }, cnDesc: "若当前回合角色不是你，" },
		{ key: "47", func: function (event, player) { return player.countCards('e') > 1; }, cnDesc: "若你的装备数大于1，" },
		{ key: "48", func: function (event, player) { return player.countCards('h') >= player.maxHp; }, cnDesc: "若你的手牌数不小于体力值，" },
		{ key: "49", func: function (event, player) { return player.hp < 3; }, cnDesc: "若你的体力值小于3，" },
    ],

    useCardFilterPool: [
        { key: "15", func: function (event, player) { return event.card.name == "sha"; }, cnDesc: "若此牌为【杀】，" },
        { key: "16", func: function (event, player) { return get.type(event.card) == "trick" && get.tag(event.card, "damage"); }, cnDesc: "若此牌为伤害锦囊牌，" },
		{ key: "43", func: function (event, player) { return get.cardNameLength(event.card) == 4 && (get.type(event.card) == "trick" || get.type(event.card) == "delay"); }, cnDesc: "若此牌为四字锦囊牌，" },
		{ key: "44", func: function (event, player) { return get.type(event.card) == "basic" && event.card.name != "sha"; }, cnDesc: "若此牌是不为【杀】的基本牌，" },
		{ key: "37", func: function (event, player) { return get.type(event.card) == 'equip'; }, cnDesc: "若此牌为装备牌，" },
    ],

	useCardToPlayeredFilterPool: [
        { key: "15", func: function (event, player) { if (event.getParent().triggeredTargets3.length > 1) { return false; } return event.card.name == "sha"; }, cnDesc: "若此牌为【杀】，" },
        { key: "16", func: function (event, player) { if (event.getParent().triggeredTargets3.length > 1) { return false; } return get.type(event.card) == "trick" && get.tag(event.card, "damage"); }, cnDesc: "若此牌为伤害锦囊牌，" },
		{ key: "41", func: function (event, player) { if (event.getParent().triggeredTargets3.length > 1) { return false; } return event.targets.length > 1; }, cnDesc: "若此牌目标数大于1，" },
		{ key: "46", func: function (event, player) { if (event.getParent().triggeredTargets3.length > 1) { return false; } return get.cardNameLength(event.card) == 4 && (get.type(event.card) == "trick" || get.type(event.card) == "delay"); }, cnDesc: "若此牌为四字锦囊牌，" },
        { key: "58", func: function (event, player) { if (event.getParent().triggeredTargets3.length > 1) { return false; } return get.cardNameLength(event.card) == 2; }, cnDesc: "若此牌为两个字，" },
    ],

    useCardAfterFilterPool: [
        { key: "17", func: function (event, player) { return event.card.name == "shan"; }, cnDesc: "若此牌为【闪】，" },
        { key: "18", func: function (event, player) { return player.countCards('h') < 1; }, cnDesc: "若你没有手牌，" },
        { key: "56", func: function (event, player) { return get.type(event.card) == 'equip'; }, cnDesc: "若此牌为装备牌，" },
        { key: "38", func: function (event, player) { event.count = 0; player.countCards("h") && !player.hasCard(card => { if (player.hasUseTarget(card, true, true)) event.count++; }); return event.count < 1; }, cnDesc: "若你有牌但没有可使用的牌的目标，" },
        { key: "59", func: function (event, player) { return get.cardNameLength(event.card) == 2; }, cnDesc: "若此牌为两个字，" },
        { key: "60", func: function (event, player) { if (event.getParent().triggeredTargets3.length > 1) { return false; } return get.cardNameLength(event.card) == 4 && (get.type(event.card) == "trick" || get.type(event.card) == "delay"); }, cnDesc: "若此牌为四字锦囊牌，" },
    ],

    contentPool: [
        { key: "19", func: function (event, player) { player.draw && player.draw(2); }, cnName: "补二", cnDesc: "摸两张牌" },
        { key: "20", func: function (event, player) { player.recover && player.recover(); }, cnName: "回春", cnDesc: "恢复1点体力" },
        { key: "21", func: function (event, player) { player.draw(4); player.chooseToDiscard(4, 'he', true); }, cnName: "运筹", cnDesc: "摸4张牌，然后弃置4张牌" },
        { key: "22", func: function (event, player) { 
            "step 0";
            player.chooseTarget("摧朽：是否选择一名其他角色并进行拼点，若你赢，你对其造成1点伤害；否则你弃置一张手牌？", function (card, player, target) {
                return player.canCompare(target);
            }).set("ai", function (target) {
                if (!_status.event.goon) { return 0; } return -get.attitude(_status.event.player, target);
            }).set("goon", 
                player.needsToDiscard() || player.hasCard(function (card) { var val = get.value(card); if (val < 0) { return true; } if (val <= 5) { return card.number >= 11; } return false; })
            );
            "step 1";
            if (result.bool) { event.target = result.targets[0]; player.chooseToCompare(event.target); } else { event.finish(); }
            "step 2";
            if (result.bool) { event.target.damage(); } else { player.chooseToDiscard(1, true); }
        }, cnName: "摧朽", cnDesc: "选择一名其他角色并进行拼点，若你赢，你对其造成1点伤害；否则你弃置一张手牌" },
        { key: "23", func: function (event, player) { player.draw(3); player.chooseToDiscard(2, true); }, cnName: "取舍", cnDesc: "摸3张牌，然后弃置两张手牌" },
        { key: "24", func: function (event, player) { player.changeHujia(); }, cnName: "福甲", cnDesc: "获得1点护甲" },
        { key: "25", func: function (event, player) { player.turnOver();player.draw(3); }, cnName: "静养", cnDesc: "你翻面并摸三张牌" },
        { key: "26", func: function (event, player) { 
            event.count = 0; var a = []; const cardx = game.cardsGotoOrdering(get.cards(Math.min(5, ui.cardPile.childElementCount))).cards;
            player.showCards(cardx, get.translation(player) + "发动了【瞻星】");
            for (let card of cardx) { if (get.type2(card) == "trick" || get.type2(card) == "delay") { a.push(card); event.count++; } }
            if(event.count > 0) { player.gain(a, "gain2"); }
        }, cnName: "瞻星", cnDesc: "展示牌堆顶的5张牌，并获得其中的锦囊牌" },
		{ key: "54", func: function (event, player) { 
            event.count = 0; var a = [];
            const cardx = game.cardsGotoOrdering(get.cards(Math.min(3, ui.cardPile.childElementCount))).cards;
            player.showCards(cardx, get.translation(player) + "发动了【瞻月】");
            for (let card of cardx) { if (!(get.type2(card) == "trick" || get.type2(card) == "delay")) { a.push(card); event.count++; } }
            if(event.count > 0) { player.gain(a, "gain2"); }
        }, cnName: "瞻月", cnDesc: "展示牌堆顶的3张牌，并获得其中的非锦囊牌" },
        { key: "39", func: function (event, player) { 
            "step 0";
            player.judge(function (result) { if (get.suit(result) == "heart") { return 2; } return -1; }).judge2 = function (result) { return result.bool; };
            "step 1";
            if (result.bool) { player.recover(); } else { player.draw(2); }
        }, cnName: "礼遇", cnDesc: "进行一次判定，若结果为红桃，你恢复一点体力；否则，你摸两张牌" },
        { key: "40", func: function (event, player) { 
            "step 0";
            player.chooseTarget("不净：是否选择一名其他角色并进行拼点，若你赢，你获得对方一张牌？", function (card, player, target) {
                return player.canCompare(target);
            }).set("ai", function (target) { if (!_status.event.goon) { return 0; } return -get.attitude(_status.event.player, target); }).set("goon", player.needsToDiscard() || player.hasCard(function (card) { var val = get.value(card); if (val < 0) { return true; } if (val <= 5) { return card.number >= 11; } return false; }) );
            "step 1";
            if (result.bool) { event.target = result.targets[0]; player.chooseToCompare(event.target); } else { event.finish(); }
            "step 2";
            if (result.bool) { player.gainPlayerCard(event.target, true, "he"); }
        }, cnName: "不净", cnDesc: "选择一名其他角色并进行拼点，若你赢，你获得对方一张牌" },
		{ key: "50", func: function (event, player) { player.link(false); player.turnOver(false); player.draw(); }, cnName: "归元", cnDesc: "复原武将牌并摸一张牌" },
		{ key: "51", func: function (event, player) { player.discard(player.getCards("j")); player.draw(); }, cnName: "清愈", cnDesc: "弃置判断区所有牌并摸一张牌" },
		{ key: "52", func: function (event, player) { var a = player.countCards('e'); player.discard(player.getCards("e")); player.draw(2 * a); }, cnName: "卸甲", cnDesc: "弃置装备区所有牌并摸本次弃置牌数两倍的牌" },
		{ key: "53", func: function (event, player) { var a = player.countCards('h'); player.discard(player.getCards("h")); player.draw(a + 1); }, cnName: "舍得", cnDesc: "弃置手牌区所有牌并摸本次弃置牌数加1张牌" },
		{ key: "55", func: function (event, player) { player.chooseToUse('是否使用一张牌？'); }, cnName: "轻逸", cnDesc: "立即使用一张牌" },
        { key: "57", func: function (event, player) { 
            var list = [], list2 = []; for (var i = 1; i <= 5; i++) { if (player.hasEmptySlot(i)) { list.push(i); } list2.push(i); }
            if (list.length > 0) { var randomSlot = list.randomGet(); } else { var randomSlot = list2.randomGet(); }
            var cardx = get.cardPile2(function (card) { return get.subtype(card) === `equip${randomSlot}` && player.canUse(card, player); });
            if (cardx) { player.chooseUseTarget(cardx, true, "nopopup"); }
        }, cnName: "披挂", cnDesc: "随机获得并使用一张装备牌" },
    ],

    useCardToPlayeredPool: [
        { key: "27", func: function (event, player) { for ( let i = 0; i < trigger.targets.length; i++) { player.gainPlayerCard(trigger.targets[i], "he"); } }, cnName: "轻袭", cnDesc: "获得目标一张牌" },
        { key: "28", func: function (event, player) { for ( let i = 0; i < trigger.targets.length; i++) { trigger.targets[i].chooseToDiscard(2, "he", true); } }, cnName: "解离", cnDesc: "令目标弃置两张牌" },
        { key: "31", func: function (event, player) { for ( let i = 0; i < trigger.targets.length; i++) { if (!trigger.targets[i].hasSkill("fengyin")) {trigger.targets[i].addTempSkill("fengyin"); } } }, cnName: "铁骑", cnDesc: "令目标非锁定技失效直到本回合结束" },
        { key: "32", func: function (event, player) { player.draw(trigger.targets.length); }, cnName: "图射", cnDesc: "摸此牌指定目标数张牌" },
        { key: "33", func: function (event, player) { 
            "step 0";
            player.judge(function (card) { var suit = get.suit(card); if (suit == "spade") { return -2; } else { return -1; }}).judge2 = function (result) { return result.color == "spade" ? true : false; };
            "step 1";
            if (result.suit == "spade") { for ( let i = 0; i < trigger.targets.length; i++) { trigger.targets[i].damage("thunder"); } } else {
                for ( let i = 0; i < trigger.targets.length; i++) { trigger.targets[i].chooseToDiscard(true); player.draw(); }
            }
        }, cnName: "雷劫", cnDesc: "你可以进行一次判定，若结果为黑桃，目标受到1点雷电伤害；否则目标需弃置一张手牌，你摸一张牌" },
		{ key: "42", func: function (event, player) {
            const id = trigger.target.playerid; const map = trigger.getParent().customArgs;
            if (!map[id]) { map[id] = {}; } if (typeof map[id].extraDamage != "number") { map[id].extraDamage = 0; } map[id].extraDamage++;
        }, cnName: "利刃", cnDesc: "令此牌对目标造成的伤害+1" },
    ],

    useCardPool: [
        { key: "29", func: function (event, player) { trigger.baseDamage++; }, cnName: "暴袭", cnDesc: "令此牌伤害+1" },
        { key: "30", func: function (event, player) { trigger.directHit.addArray(game.filterPlayer(function (current) { return current != player; })); }, cnName: "蛮横", cnDesc: "令其他角色不可响应此牌" },
        { key: "34", func: function (event, player) { 
            "step 0";
            player.judge(function (result) { if (get.suit(result) == "heart") { return 2; } return -1; }).judge2 = function (result) { return result.bool; };
            "step 1";
            if (result.bool) { player.recover(); } else { player.draw(2); }
        }, cnName: "礼遇", cnDesc: "进行一次判定，若结果为红桃，你恢复一点体力；否则，你摸两张牌" },
		{ key: "45", func: function (event, player) { player.draw(); }, cnName: "补一", cnDesc: "摸一张牌" },
    ],
    
    contentBlacklist: {
        "2": ["20", "24"],
        "3": ["20", "24"],
        "wei": ["33", "34", "39"]
    }
};

window.gfbSkillUtils = {
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Function) {
            return function() {
                return obj.apply(this, arguments);
            };
        }
        if (obj instanceof Array) {
            const arrCopy = [];
            for (let i = 0; i < obj.length; i++) {
                arrCopy[i] = this.deepClone(obj[i]);
            }
            return arrCopy;
        }
        if (obj instanceof Object) {
            const objCopy = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    objCopy[key] = this.deepClone(obj[key]);
                }
            }
            return objCopy;
        }
        return obj;
    },

    // 蜀阵营额外摸牌
    shuAddExtraDraw(content) {
        if (!content._hasAddedDrawLogic) {
            const originalFuncStr = content.func.toString();
            let funcBody = originalFuncStr.slice(
                originalFuncStr.indexOf('{') + 1,
                originalFuncStr.lastIndexOf('}')
            );
            const lastStepReg = /(["'])step\s+(\d+)\1\s*;?\s*([\s\S]*)$/;
            if (lastStepReg.test(funcBody)) {
                funcBody = funcBody.replace(lastStepReg, (match, quote, num, rest) => {
                    const cleanRest = rest.trim();
                    return `${quote}step ${num}${quote};${cleanRest}\nif (player && player.draw) { player.draw(); }`;
                });
            } else {
                funcBody = `${funcBody.trim()}\nif (player && player.draw) { player.draw(); }`;
            }
            content.func = new Function("event", "player", funcBody);
            content._hasAddedDrawLogic = true;
        }
        if (!content._hasAddedDrawDesc) {
            const cleanDesc = content.cnDesc.replace(/[。；，]$/, "");
            const appendText = cleanDesc.includes("然后") ? "，最后摸一张牌" : "，然后摸一张牌";
            content.cnDesc = `${cleanDesc}${appendText}`;
            content._hasAddedDrawDesc = true;
        }
    },

    // 随机抽取池内元素
    pickFromPool(pool) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        return pool[randomIndex];
    },

    // 带黑名单抽取内容
    pickContentWithBlacklist(triggerKey, filter = null, generalCamp) {
        const skillPools = window.gfbSkillPools;
        if (triggerKey === "6") {
            return this.pickFromPool(skillPools.useCardToPlayeredPool);
        }
        let blacklist = [];
        if (skillPools.contentBlacklist[triggerKey]) {
            blacklist = [...skillPools.contentBlacklist[triggerKey]];
        }
        if (skillPools.contentBlacklist["wei"] && (triggerKey === "wei" || generalCamp === "wei")) {
            blacklist = [...new Set([...blacklist, ...skillPools.contentBlacklist["wei"]])];
        }
        const filteredPool = skillPools.contentPool.filter(content => !blacklist.includes(content.key));
        const useCardFilterKeys = window.gfbSkillPools?.useCardFilterPool?.map(item => item.key) || [];
        const isUseCardBeforeFilter = filter && useCardFilterKeys.includes(filter.key);
        if (isUseCardBeforeFilter) {
            var num = [1, 2, 3].randomGet();
            if(num == 1 || num == 2) {
                const baseDamageContent = this.pickFromPool(skillPools.useCardPool);
                if (["33", "34", "39"].includes(baseDamageContent.key)) {
                    return this.pickFromPool(filteredPool);
                }
                return baseDamageContent;
            }
        }
        return this.pickFromPool(filteredPool);
    },

    // 根据触发器获取对应过滤池
    getFilterPoolByTrigger(triggerKey) {
        const skillPools = window.gfbSkillPools;
        switch (triggerKey) {
            case "5":
                return skillPools.useCardFilterPool;
            case "7":
                return skillPools.useCardAfterFilterPool;
            case "6":
                return skillPools.useCardToPlayeredFilterPool;
            default:
                return skillPools.filterPool;
        }
    },

    // 创建技能翻译
    createSkillTranslate(skillName, trigger, filter, content, generalCamp) {
        const wuSpecialPrefix = filter.key === "dynamicNameFilter" ? "每回合各限一次，出牌阶段，你可无视条件的发动此技能。" : "每回合限一次，";
        const qunModDesc = (generalCamp === 'qun' && content.qunModDesc) ? `${content.qunModDesc}` : "";
        const coreContent = generalCamp === 'shu' 
            ? content.cnDesc 
            : content.cnDesc.replace("，然后摸一张牌", "").replace("，最后摸一张牌", "");
        const triggerDesc = Array.isArray(trigger) 
            ? trigger.map(t => t.cnDesc).join("") 
            : trigger.cnDesc;
        const filterDesc = filter.key === "10" ? "" : `${filter.cnDesc}，`;
        const skillAnchor = `<a class='gefu_text' onclick="javascript:window.gefu_text(\`鸽府包里的所有武将随机拼装并获得一个技能（扩展菜单按钮可关闭）<br><font color='#ADFF2F'>魏</font>：触发器增加“任意角色判定牌生效后”。<br><font color='#ADFF2F'>蜀</font>：技能无条件限制，且在发动后额外摸一张牌。<br><font color='#ADFF2F'>吴</font>：新增出牌阶段可发动，且出牌阶段和触发器发动每回合各限一次。<br><font color='#ADFF2F'>群</font>：额外在mod池获得一个技能（仅群有mod池）。<br><font color='#ADFF2F'>其他</font>：在“魏蜀吴群”中随机。\`)"><font color='#ADFF2F'><u>拼装技，</u></font></a>`;
		const coreSkillContent = generalCamp === 'shu' 
			? `${triggerDesc}${filterDesc}你可以${coreContent}。` 
			: `${triggerDesc}${filterDesc}你可以${coreContent}。`.replace("，你可以", "你可以");
        const fullSkillContent = `${skillAnchor}${wuSpecialPrefix}${coreSkillContent}`;
        const skillInfo = filter.key === "dynamicNameFilter" 
            ? fullSkillContent 
            : `${fullSkillContent} ${qunModDesc}`;
        return {
            [skillName]: content.cnName,
            [`${skillName}_info`]: skillInfo
        };
    },

    // 生成拼装技能
    generateSkillByCamp(player, finalCamp, customSkillName) {
        const skillPools = window.gfbSkillPools;
        const campConfig = window.gfbCampConfig;
        let trigger, filter, content, skillConfig;
        switch (finalCamp) {
            case 'wei':
                // 魏
                const randomNormalTrigger = this.pickFromPool(skillPools.triggerPool);
                const originalTriggerKey = randomNormalTrigger.key; 
                const mergedTriggerConfig = {
                    ...campConfig.weiFixedTrigger.config,
                    ...randomNormalTrigger.config
                };
                const mergedCnDesc = `${campConfig.weiFixedTrigger.cnDesc.replace("或", "")}或${randomNormalTrigger.cnDesc}`;
                trigger = {
                    key: `${campConfig.weiFixedTrigger.key}_${originalTriggerKey}`,
                    config: mergedTriggerConfig,
                    cnDesc: mergedCnDesc
                };
                const filterPool = this.getFilterPoolByTrigger(originalTriggerKey); 
                filter = this.pickFromPool(filterPool);
                content = this.pickContentWithBlacklist("wei", filter);
                break;

            case 'shu':
                // 蜀
                const forbiddenTriggerKeys = ['5', '6', '7'];
                const shuAvailableTriggers = skillPools.triggerPool.filter(
                    triggerItem => !forbiddenTriggerKeys.includes(triggerItem.key)
                );
                trigger = this.pickFromPool(shuAvailableTriggers);
                filter = {
                    key: "10", 
                    func: function (event, player) { return true; }, 
                    cnDesc: ""
                };
                content = this.pickContentWithBlacklist(trigger.key, filter);
                content = this.deepClone(content);
                this.shuAddExtraDraw(content);
                break;

            case 'wu':
                // 吴
                const wuAvailableTriggers = skillPools.triggerPool.filter(
                    triggerItem => triggerItem.key !== "6"
                );
                trigger = this.pickFromPool(wuAvailableTriggers);
                const triggerKeyToEventMap = {
                    "1": "phaseZhunbei",
                    "2": "damageEnd",
                    "3": "changeHp",
                    "4": "shaMiss",
                    "5": "useCard",
                    "6": "useCardToPlayered",
                    "7": "useCardAfter",
                    "8": "recoverEnd",
                    "9": ["dying","dyingAfter"]
                };
                const randomTriggerKey = triggerKeyToEventMap[trigger.key];
                const filterPoolWu = this.getFilterPoolByTrigger(trigger.key);
                const wuOriginalFilter = this.pickFromPool(filterPoolWu);
                filter = {
                    key: "dynamicNameFilter",
                    func: function(event, player, name) {
                        if (Array.isArray(randomTriggerKey) && randomTriggerKey.some(eventName => name === eventName)) {
                            return wuOriginalFilter.func(event, player);
                        } else if (name === randomTriggerKey) {
                            return wuOriginalFilter.func(event, player); 
                        } else {
                            return true;
                        }
                    },
                    cnDesc: wuOriginalFilter.cnDesc
                };
                content = this.pickContentWithBlacklist(trigger.key, filter);
                skillConfig = {
                    trigger: Array.isArray(trigger) ? trigger.map(t => t.config) : trigger.config,
                    enable: campConfig.wuFixedConfig.enable,
                    usable: campConfig.wuFixedConfig.usable,
                    filter: filter.func,
                    content: content.func,
                    mod: undefined,
                };
                break;

            case 'qun':
                // 群
                trigger = this.pickFromPool(skillPools.triggerPool);
                const filterPoolQun = this.getFilterPoolByTrigger(trigger.key);
                filter = this.pickFromPool(filterPoolQun);
                content = this.pickContentWithBlacklist(trigger.key, filter);
                const qunModGroup1 = {
                    desc: "你使用【杀】的次数+1。",
                    cardUsable: function (card, player, num) {
                        if (card.name == 'sha') return num + 1;
                    }
                };
                const qunModGroup2 = {
                    desc: "你的【杀】可额外指定一名角色。",
                    selectTarget(card, player, range) {
                        if (_status.currentPhase == player) {
                            if (card.name == "sha" && range[1] != -1) {
                                if (
                                    !game.hasPlayer(function (current) {
                                        return get.distance(player, current) > 1;
                                    })
                                ) {
                                    range[1]++;
                                }
                            }
                        }
                    }
                };
                const qunModGroup3 = {
                    desc: "<其他角色/你>计算与<你/其他角色>的距离<+1/-1>。",
                    globalFrom(from, to, distance) {
                        return distance - 1;
                    },
                    globalTo(from, to, distance) {
                        return distance + 1;
                    }
                };
                const qunModPools = [qunModGroup1, qunModGroup2, qunModGroup3];
                const randomQunMod = this.pickFromPool(qunModPools);
                skillConfig = {
                    trigger: Array.isArray(trigger) ? trigger.map(t => t.config) : trigger.config,
                    usable: 1,
                    mod: randomQunMod,
                    filter: filter.func,
                    content: content.func,
                };
                content.qunModDesc = randomQunMod.desc;
                break;

            default:
                // 其他势力
                trigger = this.pickFromPool(skillPools.triggerPool);
                const filterPoolDefault = this.getFilterPoolByTrigger(trigger.key);
                filter = this.pickFromPool(filterPoolDefault);
                content = this.pickContentWithBlacklist(trigger.key, filter);
                skillConfig = {
                    trigger: Array.isArray(trigger) ? trigger.map(t => t.config) : trigger.config,
                    usable: 1,
                    filter: filter.func,
                    content: content.func,
                    mod: undefined
                };
                break;
        }
        // 生成技能名
        const skillName = customSkillName || `gf_pinzhuang_${finalCamp}_${Date.now().toString().slice(-6)}`;
        // 挂载技能配置
        if (!skillConfig) {
            skillConfig = {
                trigger: trigger.config,
                filter: filter.func,
                content: content.func,
            };
        }
        skillConfig.usable = 1;
        window.lib.skill[skillName] = skillConfig;
        // 生成并挂载翻译
        const skillTrans = this.createSkillTranslate(skillName, trigger, filter, content, finalCamp);
        Object.assign(window.translate, skillTrans);
        if (window.lib.translate) {
            Object.assign(window.lib.translate, skillTrans);
        }
        // 返回技能信息
        return {
            skillName,
            camp: finalCamp,
            trigger,
            filter,
            content,
            desc: skillTrans[`${skillName}_info`]
        };
    }
};

window.gfbCampConfig = {
    // 魏专属
    weiFixedTrigger: { key: "judgeEnd", config: { global: "judgeEnd", }, cnDesc: "任意角色判定牌生效后或" },
    // 蜀专属
    shuFixedFilter: {
        key: "10", 
        func: function (event, player) { return true; }, 
        cnDesc: ""
    },
    // 吴专属
    wuFixedConfig: {
        enable: "phaseUse",
        usable: 1,
    },
    camp2SkillNames: {
        wei: ["gzj_pzjn_wei"],
        shu: ["gzj_pzjn_shu"],
        wu: ["gzj_pzjn_wu"],
        qun: ["gzj_pzjn_qun"]
    },
    randomCampList: ['wei', 'shu', 'wu', 'qun'],
    targetGeneralPrefixes: ["gf", "wzzs", "cxm", "dmwc", "tj", "gzhlb", "gzt", "seh", "aqcs", "gzlj", "a"],
    campIndex: 1,
    skillListIndex: 3,
    skillMountKey: "_skill_name_mounted_flag"
};

// 自动挂载
if (lib.config.extension_鸽府包_gfb_sjpz) {
    (function autoMountSkillNamesToGenerals() {
        const skillPools = window.gfbSkillPools;
        const skillUtils = window.gfbSkillUtils;
        const campConfig = window.gfbCampConfig;
        for (const generalId in characterData) {
            const generalPrefix = generalId.split('_')[0];
            if (!campConfig.targetGeneralPrefixes.includes(generalPrefix)) continue;
            const generalConfig = characterData[generalId];
            let isArrayFormat = Array.isArray(generalConfig);
            let generalCamp = null;
            let skillList = null;
            let skillMounted = generalConfig[campConfig.skillMountKey];
            // 老数据适配
            if (isArrayFormat) {
                if (generalConfig[campConfig.campIndex] === undefined || !Array.isArray(generalConfig[campConfig.skillListIndex])) {
                    continue;
                }
                generalCamp = generalConfig[campConfig.campIndex];
                skillList = generalConfig[campConfig.skillListIndex];
            } else {
                if (generalConfig.group === undefined || !Array.isArray(generalConfig.skills)) {
                    continue;
                }
                generalCamp = generalConfig.group;
                skillList = generalConfig.skills;
                skillMounted = generalConfig[campConfig.skillMountKey];
            }
            if (skillMounted) {
                continue;
            }
            const isValidCamp = ['wei', 'shu', 'wu', 'qun'].includes(generalCamp);
            const finalCamp = isValidCamp ? generalCamp : skillUtils.pickFromPool(campConfig.randomCampList);
            const skillNamesToAppend = campConfig.camp2SkillNames[finalCamp] || [];
            if (skillNamesToAppend.length > 0) {
                const uniqueSkills = skillNamesToAppend.filter(skillName => !skillList.includes(skillName));
                if (uniqueSkills.length > 0) {
                    skillList.push(...uniqueSkills);
                    // 标记已挂载
                    if (isArrayFormat) {
                        generalConfig[campConfig.skillMountKey] = true;
                    } else {
                        generalConfig[campConfig.skillMountKey] = true;
                    }
                    uniqueSkills.forEach(skillName => {
                        let trigger, filter, content;
                        let randomTriggerKey, wuOriginalFilter, skillConfig;
                        switch (finalCamp) {
                            case 'wei':
                                const randomNormalTrigger = skillUtils.pickFromPool(skillPools.triggerPool);
                                const originalTriggerKey = randomNormalTrigger.key; 
                                const mergedTriggerConfig = {
                                    ...campConfig.weiFixedTrigger.config,
                                    ...randomNormalTrigger.config
                                };
                                const mergedCnDesc = `${campConfig.weiFixedTrigger.cnDesc.replace("或", "")}或${randomNormalTrigger.cnDesc}`;
                                trigger = {
                                    key: `${campConfig.weiFixedTrigger.key}_${originalTriggerKey}`,
                                    config: mergedTriggerConfig,
                                    cnDesc: mergedCnDesc
                                };
                                const filterPool = skillUtils.getFilterPoolByTrigger(originalTriggerKey); 
                                filter = skillUtils.pickFromPool(filterPool);
                                content = skillUtils.pickContentWithBlacklist("wei", filter);
                                break;

                            case 'shu':
                                const forbiddenTriggerKeys = ['5', '6', '7'];
                                const shuAvailableTriggers = skillPools.triggerPool.filter(
                                    triggerItem => !forbiddenTriggerKeys.includes(triggerItem.key)
                                );
                                trigger = skillUtils.pickFromPool(shuAvailableTriggers);
                                filter = campConfig.shuFixedFilter;
                                content = skillUtils.pickContentWithBlacklist(trigger.key, filter);
                                content = skillUtils.deepClone(content);
                                skillUtils.shuAddExtraDraw(content);
                                break;

                            case 'wu':
                                const wuAvailableTriggers = skillPools.triggerPool.filter(
                                    triggerItem => triggerItem.key !== "6"
                                );
                                trigger = skillUtils.pickFromPool(wuAvailableTriggers);
                                const triggerKeyToEventMap = {
                                    "1": "phaseZhunbei",
                                    "2": "damageEnd",
                                    "3": "changeHp",
                                    "4": "shaMiss",
                                    "5": "useCard",
                                    "6": "useCardToPlayered",
                                    "7": "useCardAfter",
                                    "8": "recoverEnd",
                                    "9": ["dying","dyingAfter"]
                                };
                                randomTriggerKey = triggerKeyToEventMap[trigger.key];
                                const filterPoolWu = skillUtils.getFilterPoolByTrigger(trigger.key);
                                wuOriginalFilter = skillUtils.pickFromPool(filterPoolWu);
                                filter = {
                                    key: "dynamicNameFilter",
                                    func: function(event, player, name) {
                                        if (Array.isArray(randomTriggerKey) && randomTriggerKey.some(eventName => name === eventName)) {
                                            return wuOriginalFilter.func(event, player);
                                        } else if (name === randomTriggerKey) {
                                            return wuOriginalFilter.func(event, player); 
                                        } else {
                                            return true;
                                        }
                                    },
                                    cnDesc: wuOriginalFilter.cnDesc
                                };
                                content = skillUtils.pickContentWithBlacklist(trigger.key, filter);
                                skillConfig = {
                                    trigger: Array.isArray(trigger) ? trigger.map(t => t.config) : trigger.config,
                                    enable: campConfig.wuFixedConfig.enable,
                                    usable: campConfig.wuFixedConfig.usable,
                                    filter: filter.func,
                                    content: content.func,
                                    mod: undefined
                                };
                                break;

                            case 'qun':
                                trigger = skillUtils.pickFromPool(skillPools.triggerPool);
                                const filterPoolQun = skillUtils.getFilterPoolByTrigger(trigger.key);
                                filter = skillUtils.pickFromPool(filterPoolQun);
                                content = skillUtils.pickContentWithBlacklist(trigger.key, filter);
                                const qunModGroup1 = {
                                    desc: "你使用【杀】的次数+1。",
                                    cardUsable: function (card, player, num) {
                                        if (card.name == 'sha') return num + 1;
                                    }
                                };
                                const qunModGroup2 = {
                                    desc: "你的【杀】可额外指定一名角色。",
                                    selectTarget(card, player, range) {
                                        if (_status.currentPhase == player) {
                                            if (card.name == "sha" && range[1] != -1) {
                                                if (
                                                    !game.hasPlayer(function (current) {
                                                        return get.distance(player, current) > 1;
                                                    })
                                                ) {
                                                    range[1]++;
                                                }
                                            }
                                        }
                                    }
                                };
                                const qunModGroup3 = {
                                    desc: "<其他角色/你>计算与<你/其他角色>的距离<+1/-1>。",
                                    globalFrom(from, to, distance) {
                                        return distance - 1;
                                    },
                                    globalTo(from, to, distance) {
                                        return distance + 1;
                                    }
                                };
                                const qunModPools = [qunModGroup1, qunModGroup2, qunModGroup3];
                                const randomQunMod = skillUtils.pickFromPool(qunModPools);
                                skillConfig = {
                                    trigger: Array.isArray(trigger) ? trigger.map(t => t.config) : trigger.config,
                                    usable: 1,
                                    mod: randomQunMod,
                                    filter: filter.func,
                                    content: content.func
                                };
                                content.qunModDesc = randomQunMod.desc;
                                break;

                            default:
                                trigger = skillUtils.pickFromPool(skillPools.triggerPool);
                                const filterPoolDefault = skillUtils.getFilterPoolByTrigger(trigger.key);
                                filter = skillUtils.pickFromPool(filterPoolDefault);
                                content = skillUtils.pickContentWithBlacklist(trigger.key, filter);
                                skillConfig = undefined;
                                break;
                        }
                        // 挂载技能到lib
                        if (['wu', 'qun'].includes(finalCamp)) {
                            lib.skill[skillName] = skillConfig || {};
                        } else {
                            lib.skill[skillName] = {
                                trigger: Array.isArray(trigger) ? trigger.map(t => t.config) : trigger.config,
                                usable: 1,
                                filter: filter.func,
                                content: content.func,
                                mod: undefined
                            };
                        }
                        // 生成并挂载翻译
                        const skillTrans = skillUtils.createSkillTranslate(skillName, trigger, filter, content, finalCamp);
                        Object.assign(translate, skillTrans);
                        if (lib.translate) {
                            Object.assign(lib.translate, skillTrans);
                        }
                    });
                }
            }
        }
    })();
}

// 定义技能池
window.skillPools = window.gfbSkillPools;
//全局挂载拼装逻辑函数
window.generatedPingzhuangSkills = {};

/**
 * 生成拼装技能并返回技能名
 * @param {Object} player
 * @param {string} [customSkillName]
 * @returns {string}
 */
window.generatePingzhuangSkill = function(player, customSkillName) {
    window.lib = window.lib || {};
    window.lib.skill = window.lib.skill || {};
    window.translate = window.translate || {};
    window.lib.translate = window.lib.translate || {};
    function addTempgfTrigger(count = 3) {
        const triggerPool = deepClone(window.skillPools.triggerPool || []);
        const safeCount = Math.min(count, triggerPool.length);
        const pickedTriggers = [];
        for (let i = 0; i < safeCount; i++) {
            if (triggerPool.length === 0) break;
            const randomIdx = Math.floor(Math.random() * triggerPool.length);
            const trigger = triggerPool.splice(randomIdx, 1)[0] || {};
            pickedTriggers.push({
                key: trigger.key || "",
                trigger: { player: Array.isArray(trigger.config?.player) ? trigger.config.player[0] : trigger.config?.player || "phaseBegin" },
                cnDesc: trigger.cnDesc || "回合开始阶段"
            });
        }
        player.tempgfTriggers = pickedTriggers;
        return pickedTriggers;
    }
    function addTempgfFilter(count = 3) {
        const selectedTrigger = player.tempgfTriggers?.[0] || {};
        if (!selectedTrigger.key) return [];
        const getFilterPoolByTrigger = (key) => {
            switch (key) {
                case "5": return window.skillPools.useCardFilterPool || [];
                case "7": return window.skillPools.useCardAfterFilterPool || [];
                case "6": return window.skillPools.useCardToPlayeredFilterPool || [];
                default: return window.skillPools.filterPool || [];
            }
        };
        const filterPool = deepClone(getFilterPoolByTrigger(selectedTrigger.key));
        const safeCount = Math.min(count, filterPool.length);
        const pickedFilters = [];
        for (let i = 0; i < safeCount; i++) {
            if (filterPool.length === 0) break;
            const randomIdx = Math.floor(Math.random() * filterPool.length);
            pickedFilters.push(filterPool.splice(randomIdx, 1)[0] || { key: "10", cnDesc: "", func: () => true });
        }
        player.tempgfFilters = pickedFilters;
        return pickedFilters;
    }
    function addTempgfContent(count = 3) {
        const selectedTrigger = player.tempgfTriggers?.[0] || {};
        const selectedFilter = player.tempgfFilters?.[0] || { func: () => true };
        const camp = player.group || "shu";
        // 黑名单过滤
        const getFilteredContentPool = (triggerKey, filter, camp) => {
            let blacklist = [];
            if (window.skillPools.contentBlacklist?.[triggerKey]) blacklist = [...window.skillPools.contentBlacklist[triggerKey]];
            if (window.skillPools.contentBlacklist?.["wei"] && (camp === "wei" || triggerKey === "wei")) {
                blacklist = [...new Set([...blacklist, ...window.skillPools.contentBlacklist["wei"]])];
            }
            let contentPool = [
                ...(window.skillPools.contentPool || []),
                ...(window.skillPools.useCardPool || []),
                ...(window.skillPools.useCardToPlayeredPool || [])
            ].filter(c => !blacklist.includes(c?.key));
            contentPool = contentPool.map(content => {
                const newContent = deepClone(content || { key: "", cnDesc: "摸1张牌", func: () => {} });
                const filterFunc = filter.func || (() => true);
                newContent.contentFunc = function() {
                    const p = this;
                    const event = window._status?.event || {};
                    if (!filterFunc(event, p)) return;
                    // 阵营
                    if (camp === "wei" && newContent.cnDesc.includes("摸两张牌")) {
                        p.draw && p.draw(1);
                        return;
                    }
                    if (camp === "shu") {
                        newContent.func?.(event, p);
                        p.draw && p.draw(1);
                        return;
                    }
                    if (camp === "wu" && !p._wuSkillUsed) {
                        newContent.func?.(event, p);
                        p._wuSkillUsed = true;
                        return;
                    }

                    newContent.func?.(event, p);
                };
                return newContent;
            });
            return contentPool;
        };
        const contentPool = getFilteredContentPool(selectedTrigger.key, selectedFilter, camp);
        const safeCount = Math.min(count, contentPool.length);
        const pickedContents = [];
        for (let i = 0; i < safeCount; i++) {
            if (contentPool.length === 0) break;
            const randomIdx = Math.floor(Math.random() * contentPool.length);
            pickedContents.push(contentPool.splice(randomIdx, 1)[0]);
        }
        player.tempgfContents = pickedContents;
        return pickedContents;
    }

    // 拼装技能
    function addTempgfPingzhuang() {
        addTempgfTrigger(3);
        addTempgfFilter(3);
        addTempgfContent(3);
        const finalCamp = window.gfbSkillUtils.pickFromPool(window.gfbCampConfig.randomCampList);
        const skillResult = window.gfbSkillUtils.generateSkillByCamp(
            player, 
            finalCamp, 
            customSkillName || `gf_pinzhuang_${finalCamp}_${Date.now().toString().slice(-6)}`
        );
        // 存储技能信息
        window.generatedPingzhuangSkills[skillResult.skillName] = {
            camp: finalCamp,
            desc: skillResult.desc,
            trigger: skillResult.trigger,
            filter: skillResult.filter,
            content: skillResult.content
        };
        // 清空临时数据
        player.tempgfTriggers = [];
        player.tempgfFilters = [];
        player.tempgfContents = [];
        return skillResult;
    }
    // 执行拼装流程
    try {
        const result = addTempgfPingzhuang();
        return result.skillName;
    } catch (e) {
        return null;
    }
};

/**
 * 快捷方法：生成并为玩家添加拼装技能
 * @param {Object} player - 玩家对象
 * @param {string} [customSkillName] - 自定义技能名
 * @returns {string} 已添加的技能名
 */
window.addPingzhuangSkillToPlayer = function(player, customSkillName) {
    const skillName = window.generatePingzhuangSkill(player, customSkillName);
    if (!skillName) return null;
    // 为玩家添加技能
    if (typeof player.addSkill === 'function') {
        player.addSkill(skillName);
    } else if (typeof player.addTempSkill === 'function') {
        player.addTempSkill(skillName);
    } else {
        player.skills = player.skills || [];
        player.skills.push(skillName);
    }
    return skillName;
};

/**
 * 从触发器池中随机抽取指定数量的触发器（默认3个）
 * @param {number} count
 * @returns {Array}
 */
window.getRandomTriggers = function (count = 3) {
    if (!window.gfbSkillPools || !Array.isArray(window.gfbSkillPools.triggerPool)) {
        console.error("触发器池不存在！");
        return [];
    }
    const triggerPoolCopy = window.gfbSkillUtils.deepClone(window.gfbSkillPools.triggerPool);
    const safeCount = Math.min(count, triggerPoolCopy.length);
    const pickedTriggers = [];
    for (let i = 0; i < safeCount; i++) {
        if (triggerPoolCopy.length === 0) break;
        const randomIndex = Math.floor(Math.random() * triggerPoolCopy.length);
        const selectedTrigger = triggerPoolCopy.splice(randomIndex, 1)[0];
        pickedTriggers.push(selectedTrigger);
    }
    return pickedTriggers;
}

function syncExistingPingzhuangSkills(player) {
	var PINGZHUANG_FLAG = "<font color='#ADFF2F'><u>拼装技，</u></font></a>";
	var allSkills = Array.isArray(player.skills) ? player.skills : [];
	for (var j = 0; j < allSkills.length; j++) {
		var skillName = allSkills[j];
		var isRecorded = false;
		for (var k = 0; k < player.storage.gf_skill_history.length; k++) {
			if (player.storage.gf_skill_history[k].skillName === skillName) {
				isRecorded = true;
				break;
			}
		}
		if (isRecorded) continue;
		var skillDesc = lib.translate[skillName + "_info"] || window.translate[skillName + "_info"] || "";
		if (skillDesc && skillDesc.indexOf(PINGZHUANG_FLAG) != -1) {
			var skillConfig = window.lib && window.lib.skill ? window.lib.skill[skillName] : {};
			var triggerKey = null, filterKey = null, contentKey = null;
			if (skillConfig.trigger && window.gfbSkillPools && window.gfbSkillPools.triggerPool) {
				for (var t = 0; t < window.gfbSkillPools.triggerPool.length; t++) {
					var tItem = window.gfbSkillPools.triggerPool[t];
					var tConfig = Array.isArray(tItem.config?.player) ? tItem.config.player[0] : tItem.config?.player;
					var sTrigger = Array.isArray(skillConfig.trigger?.player) ? skillConfig.trigger.player[0] : skillConfig.trigger?.player;
					if (tConfig === sTrigger) {
						triggerKey = tItem.key;
						break;
					}
				}
			}
			if (skillConfig.filter && window.gfbSkillPools) {
				var allFilters = [].concat(
					window.gfbSkillPools.filterPool || [],
					window.gfbSkillPools.useCardFilterPool || [],
					window.gfbSkillPools.useCardAfterFilterPool || [],
					window.gfbSkillPools.useCardToPlayeredFilterPool || []
				);
				var filterFuncStr = skillConfig.filter.toString();
				for (var f = 0; f < allFilters.length; f++) {
					var fItem = allFilters[f];
					if (fItem.func && fItem.func.toString() === filterFuncStr) {
						filterKey = fItem.key;
						break;
					}
				}
			}
			if (skillConfig.content && window.gfbSkillPools) {
				var allContents = [].concat(
					window.gfbSkillPools.contentPool || [],
					window.gfbSkillPools.useCardPool || [],
					window.gfbSkillPools.useCardToPlayeredPool || []
				);
				var contentFuncStr = skillConfig.content.toString();
				for (var c = 0; c < allContents.length; c++) {
					var cItem = allContents[c];
					if (cItem.func && cItem.func.toString() === contentFuncStr) {
						contentKey = cItem.key;
						break;
					}
				}
			}
			if (triggerKey && player.storage.gf_selected_triggers.indexOf(triggerKey) == -1) {
				player.storage.gf_selected_triggers.push(triggerKey);
			}
			if (filterKey && player.storage.gf_selected_filters.indexOf(filterKey) == -1) {
				player.storage.gf_selected_filters.push(filterKey);
			}
			if (contentKey && player.storage.gf_selected_contents.indexOf(contentKey) == -1) {
				player.storage.gf_selected_contents.push(contentKey);
			}
			player.storage.gf_skill_history.push({
				skillName: skillName,
				trigger: triggerKey,
				filter: filterKey,
				content: contentKey,
				desc: skillDesc
			});
			console.log("识别到拼装技：" + skillName, {triggerKey: triggerKey, filterKey: filterKey, contentKey: contentKey});
		}
	}
}

lib.skill["gf_pinzhuang"] = {
    init: function (player) {
        player.storage.gf_pinzhuang = ["gf_pinzhuang1", "gf_pinzhuang2", "gf_pinzhuang3"];
        player.storage.gf_selected_triggers = player.storage.gf_selected_triggers || [];
        player.storage.gf_selected_filters = player.storage.gf_selected_filters || [];
        player.storage.gf_selected_contents = player.storage.gf_selected_contents || [];
        player.storage.gf_skill_history = player.storage.gf_skill_history || [];
    },
    trigger: { 
        player: "phaseZhunbei",
    },
	frequent: true,
    "prompt2": "是否进行一次技能拼装？",
    async content(event, trigger, player) {
        function syncSkillHistory(player) {
            let currentSkills = [];
            if (Array.isArray(player.skills)) {
                currentSkills = player.skills.filter(skillName => 
                    skillName.startsWith("gf_pinzhuang_") || skillName.startsWith("gf_pinzhuang_1_")
                );
            }
            const validHistory = player.storage.gf_skill_history.filter(historyItem => 
                currentSkills.includes(historyItem.skillName)
            );
            const lostSkillNames = player.storage.gf_skill_history
                .filter(historyItem => !currentSkills.includes(historyItem.skillName))
                .map(historyItem => historyItem.skillName);
            if (lostSkillNames.length > 0) {
                console.log("检测到已失去的拼装技能：", lostSkillNames);
                lostSkillNames.forEach(lostName => {
                    const lostItem = player.storage.gf_skill_history.find(item => item.skillName === lostName);
                    if (lostItem) {
                        player.storage.gf_selected_triggers = player.storage.gf_selected_triggers.filter(key => key !== lostItem.trigger);
                        player.storage.gf_selected_filters = player.storage.gf_selected_filters.filter(key => key !== lostItem.filter);
                        player.storage.gf_selected_contents = player.storage.gf_selected_contents.filter(key => key !== lostItem.content);
                    }
                });
                player.storage.gf_skill_history = validHistory;
            }
            
            return validHistory;
        }
        syncSkillHistory(player);
		syncExistingPingzhuangSkills(player);
        function getRandomTriggers(count = 3) {
            if (!window.gfbSkillPools || !Array.isArray(window.gfbSkillPools.triggerPool)) {
                console.error("触发器池不存在！");
                return [];
            }
            const triggerPoolCopy = window.gfbSkillUtils?.deepClone 
                ? window.gfbSkillUtils.deepClone(window.gfbSkillPools.triggerPool)
                : JSON.parse(JSON.stringify(window.gfbSkillPools.triggerPool));
            const filteredPool = triggerPoolCopy.filter(t => !player.storage.gf_selected_triggers.includes(t.key));
            const safeCount = Math.min(count, filteredPool.length);
            const pickedTriggers = [];
            for (let i = 0; i < safeCount; i++) {
                if (filteredPool.length === 0) break;
                const randomIndex = Math.floor(Math.random() * filteredPool.length);
                const selectedTrigger = filteredPool.splice(randomIndex, 1)[0];
                pickedTriggers.push(selectedTrigger);
            }
            return pickedTriggers;
        }
        const randomTriggers = getRandomTriggers(3);
        if (randomTriggers.length === 0) {
            return event.finish();
        }
        const choices = []; 
        const choiceList = [];
        const optionTexts = ["选项一", "选项二", "选项三"];
        randomTriggers.forEach((triggerItem, idx) => {
            const skillKey = `gf_pinzhuang${idx + 1}`;
            const triggerDesc = triggerItem.cnDesc || "未知触发时机";
            const displayText = `${triggerDesc}`;
            if (player.storage.gf_pinzhuang.includes(skillKey)) {
                choices.push(optionTexts[idx]); 
                choiceList.push(displayText);
            }
        });
        if (choices.length === 0) {
            return event.finish();
        }
        if (_status.connectMode) {
            await game.broadcastAll(() => {
                _status.noclearcountdown = true;
            });
        }
        let result;
        try {
            result = await player
                .chooseControl(choices, "cancel2")
                .set("choiceList", choiceList)
                .set("prompt", get.prompt("gf_pinzhuang"))
                .set("ai", () => get.event("choice"))
                .forResult();
        } catch (err) {
            console.error("玩家选择出错：", err);
            if (_status.connectMode) {
                await game.broadcastAll(() => {
                    delete _status.noclearcountdown;
                    game.stopCountChoose();
                });
            }
            return event.finish();
        }
        if (result.control == "cancel2") {
            if (_status.connectMode) {
                await game.broadcastAll(() => {
                    delete _status.noclearcountdown;
                    game.stopCountChoose();
                });
            }
            return event.finish();
        }
        const selectedOptionText = result.control;
        const selectedIdx = optionTexts.indexOf(selectedOptionText);
        const selectedTrigger = randomTriggers[selectedIdx];
        if (selectedTrigger) {
            player.storage.gf_selected_triggers.push(selectedTrigger.key);
            const skillKey = `gf_pinzhuang${selectedIdx + 1}`;
            if (!Array.prototype.remove) {
                Array.prototype.remove = function(val) {
                    const index = this.indexOf(val);
                    if (index > -1) {
                        this.splice(index, 1);
                    }
                };
            }
            player.storage.gf_pinzhuang.remove(skillKey);
            function getRandomFilters(triggerKey, count = 3) {
                let filterPool = [];
                if (window.gfbSkillUtils && typeof window.gfbSkillUtils.getFilterPoolByTrigger === 'function') {
                    filterPool = window.gfbSkillUtils.getFilterPoolByTrigger(triggerKey);
                } else {
                    filterPool = window.gfbSkillPools?.filterPool || [];
                    if (triggerKey && window.gfbSkillPools) {
                        if (triggerKey === "5" && window.gfbSkillPools.useCardFilterPool) {
                            filterPool = window.gfbSkillPools.useCardFilterPool;
                        } else if (triggerKey === "7" && window.gfbSkillPools.useCardAfterFilterPool) {
                            filterPool = window.gfbSkillPools.useCardAfterFilterPool;
                        } else if (triggerKey === "6" && window.gfbSkillPools.useCardToPlayeredFilterPool) {
                            filterPool = window.gfbSkillPools.useCardToPlayeredFilterPool;
                        }
                    }
                }
                if (!Array.isArray(filterPool)) return [];
                const filterPoolCopy = window.gfbSkillUtils?.deepClone 
                    ? window.gfbSkillUtils.deepClone(filterPool)
                    : JSON.parse(JSON.stringify(filterPool));
                const filteredPool = filterPoolCopy.filter(f => !player.storage.gf_selected_filters.includes(f.key));
                const safeCount = Math.min(count, filteredPool.length);
                const pickedFilters = [];
                for (let i = 0; i < safeCount; i++) {
                    if (filteredPool.length === 0) break;
                    const randomIndex = Math.floor(Math.random() * filteredPool.length);
                    pickedFilters.push(filteredPool.splice(randomIndex, 1)[0]);
                }
                return pickedFilters;
            }
            const randomFilters = getRandomFilters(selectedTrigger.key, 3);
            if (randomFilters.length === 0) return event.finish();
            const filterChoices = [];
            const filterChoiceList = [];
            player.storage.gf_pinzhuang = ["gf_pinzhuang1", "gf_pinzhuang2", "gf_pinzhuang3"];
            randomFilters.forEach((filterItem, idx) => {
                const skillKey = `gf_pinzhuang${idx + 1}`;
                const filterDesc = filterItem.cnDesc || "未知条件";
                const displayText = `${selectedTrigger.cnDesc}${filterDesc}`;
                if (player.storage.gf_pinzhuang.includes(skillKey)) {
                    filterChoices.push(optionTexts[idx]); 
                    filterChoiceList.push(displayText);
                }
            });
            if (filterChoices.length === 0) return event.finish();
            let filterResult;
            try {
                filterResult = await player
                    .chooseControl(filterChoices, "cancel2")
                    .set("choiceList", filterChoiceList)
                    .set("prompt", get.prompt("gf_pinzhuang"))
                    .set("ai", () => get.event("choice"))
                    .forResult();
            } catch (err) {
                console.error("条件选择出错：", err);
                return event.finish();
            }
            if (filterResult.control == "cancel2") return event.finish();
            const selectedFilterIdx = optionTexts.indexOf(filterResult.control);
            const selectedFilter = randomFilters[selectedFilterIdx];
            player.storage.gf_selected_filters.push(selectedFilter.key);
            function getRandomContents(triggerKey, filter, count = 3) {
                const blacklist = window.gfbSkillPools?.contentBlacklist?.[triggerKey] || [];
                let contentPool = [];
                if (triggerKey === "6") {
                    contentPool = window.gfbSkillPools?.useCardToPlayeredPool || [];
                } else {
                    if (window.gfbSkillPools?.contentPool) {
                        contentPool = contentPool.concat(window.gfbSkillPools.contentPool);
                    }
                    if (window.gfbSkillPools?.useCardPool) {
                        contentPool = contentPool.concat(window.gfbSkillPools.useCardPool);
                    }
                }
                const contentPoolCopy = window.gfbSkillUtils?.deepClone 
                    ? window.gfbSkillUtils.deepClone(contentPool)
                    : JSON.parse(JSON.stringify(contentPool));
                const filteredContentPool = contentPoolCopy.filter(c => 
                    !blacklist.includes(c.key) && !player.storage.gf_selected_contents.includes(c.key)
                );
                const useCardFilterKeys = window.gfbSkillPools?.useCardFilterPool?.map(item => item.key) || [];
                if (useCardFilterKeys.includes(filter.key) && window.gfbSkillPools?.v && triggerKey !== "6") {
                    const num = Math.floor(Math.random() * 3) + 1;
                    if (num <= 2) {
                        const damagePoolCopy = window.gfbSkillUtils?.deepClone 
                            ? window.gfbSkillUtils.deepClone(window.gfbSkillPools.useCardPool)
                            : JSON.parse(JSON.stringify(window.gfbSkillPools.useCardPool));
                        const filteredDamagePool = damagePoolCopy.filter(c => 
                            !blacklist.includes(c.key) && !player.storage.gf_selected_contents.includes(c.key)
                        );
                        if (filteredDamagePool.length > 0) {
                            const pickedContents = [];
                            // 随机选
                            while (pickedContents.length < count && filteredDamagePool.length > 0) {
                                const randomIdx = Math.floor(Math.random() * filteredDamagePool.length);
                                pickedContents.push(filteredDamagePool.splice(randomIdx, 1)[0]);
                            }
                            return pickedContents;
                            // return filteredDamagePool.slice(0, count);
                        }
                    }
                }
                const safeCount = Math.min(count, filteredContentPool.length);
                const pickedContents = [];
                for (let i = 0; i < safeCount; i++) {
                    if (filteredContentPool.length === 0) break;
                    const randomIndex = Math.floor(Math.random() * filteredContentPool.length);
                    pickedContents.push(filteredContentPool.splice(randomIndex, 1)[0]);
                }
                return pickedContents;
            }
            const randomContents = getRandomContents(selectedTrigger.key, selectedFilter, 3);
            if (randomContents.length === 0) return event.finish();
            const contentChoices = [];
            const contentChoiceList = [];
            player.storage.gf_pinzhuang = ["gf_pinzhuang1", "gf_pinzhuang2", "gf_pinzhuang3"];
            randomContents.forEach((contentItem, idx) => {
                const skillKey = `gf_pinzhuang${idx + 1}`;
                const contentDesc = contentItem.cnDesc || contentItem.cnName || "未知效果";
                const displayText = `${selectedTrigger.cnDesc}${selectedFilter.cnDesc}${contentDesc}`;
                if (player.storage.gf_pinzhuang.includes(skillKey)) {
                    contentChoices.push(optionTexts[idx]); 
                    contentChoiceList.push(displayText);
                }
            });
            if (contentChoices.length === 0) return event.finish();
            let contentResult;
            try {
                contentResult = await player
                    .chooseControl(contentChoices, "cancel2")
                    .set("choiceList", contentChoiceList)
                    .set("prompt", get.prompt("gf_pinzhuang"))
                    .set("ai", () => get.event("choice"))
                    .forResult();
            } catch (err) {
                return event.finish();
            }
            if (contentResult.control == "cancel2") return event.finish();
            const selectedContentIdx = optionTexts.indexOf(contentResult.control);
            const selectedContent = randomContents[selectedContentIdx];
            player.storage.gf_selected_contents.push(selectedContent.key);
            const finalContent = window.gfbSkillUtils?.deepClone 
                ? window.gfbSkillUtils.deepClone(selectedContent)
                : JSON.parse(JSON.stringify(selectedContent));
            const skillName = `gf_pinzhuang_${Date.now().toString().slice(-6)}`;
            lib.skill[skillName] = {
                trigger: selectedTrigger.config,
                usable: 1,
                filter: selectedFilter.func,
                content: finalContent.func,
            };
            const skillTrans = (window.gfbSkillUtils && typeof window.gfbSkillUtils.createSkillTranslate === 'function') 
                ? window.gfbSkillUtils.createSkillTranslate(skillName, selectedTrigger, selectedFilter, finalContent) || {}
                : {
                    [skillName]: finalContent.cnName || "拼装技",
                    [`${skillName}_info`]: `${selectedTrigger.cnDesc}${selectedFilter.cnDesc || ""}你可以${finalContent.cnDesc || "发动技能"}。`
                };
            window.translate = window.translate || {};
            Object.assign(window.translate, skillTrans);
            if (window.lib && typeof window.lib.translate === 'object') {
                window.lib.translate = window.lib.translate || {};
                Object.assign(window.lib.translate, skillTrans);
            }
            if (typeof player.addSkill === 'function') {
                player.addSkill(skillName);
            } else if (typeof player.addTempSkill === 'function') {
                player.addTempSkill(skillName);
            } else {
                player.skills = player.skills || [];
                player.skills.push(skillName);
            }
            player.storage.gf_skill_history.push({
                skillName,
                trigger: selectedTrigger.key,
                filter: selectedFilter.key,
                content: selectedContent.key,
                desc: skillTrans[`${skillName}_info`]
            });
        }
        if (_status.connectMode) {
            await game.broadcastAll(() => {
                delete _status.noclearcountdown;
                game.stopCountChoose();
            });
        }
        event.finish();
    },
	group: "gf_pinzhuang_b",
	subSkill: {
		b: {
			trigger: { 
				player: "gf_pinzhuangAfter",
			},
			forced: true,
			async content(event, trigger, player) {
				const validSkillHistory = player.storage.gf_skill_history?.filter(item => 
					Array.isArray(player.skills) && player.skills.includes(item.skillName)
				) || [];
				if (validSkillHistory.length > 3) {
					try {
						const removeChoices = [];
						const removeChoiceList = [];
						validSkillHistory.forEach((skillItem, idx) => {
							let skillCnName = "未知技能";
							if (typeof get?.translation === 'function' && skillItem.skillName) {
								skillCnName = get.translation(skillItem.skillName) || `拼装技能${idx + 1}`;
							} else if (skillItem.content && window.gfbSkillPools) {
								const allContents = [].concat(
									window.gfbSkillPools?.contentPool || [],
									window.gfbSkillPools?.useCardPool || [],
									window.gfbSkillPools?.useCardToPlayeredPool || []
								);
								const contentItem = allContents.find(item => item.key === skillItem.content);
								skillCnName = contentItem?.cnName || `拼装技能${idx + 1}`;
							}
							let finalCnName = skillCnName;
							let duplicateCount = 1;
							while (removeChoices.includes(finalCnName)) {
								duplicateCount++;
								finalCnName = `${skillCnName}(${duplicateCount})`;
							}
							removeChoices.push(finalCnName);
							const pureDesc = skillItem.desc?.replace(/【[^】]+】/, "") || "无描述";
							removeChoiceList.push(`【${finalCnName}】${pureDesc}`);
						});
						const removeResult = await player
							.chooseControl(removeChoices)
							.set("choiceList", removeChoiceList)
							.set("prompt", "你的拼装技能已达到【" + validSkillHistory.length + "】个，请选择一个移除：")
							.set("ai", () => get.event("choice"))
							.forResult();
						const selectedCnName = removeResult.control;
						const selectedIdx = removeChoices.indexOf(selectedCnName);
						const skillToRemove = validSkillHistory[selectedIdx].skillName;
						if (skillToRemove) {
							player.removeSkill(skillToRemove);
							const removedItem = validSkillHistory.find(item => item.skillName === skillToRemove);
							if (removedItem) {
								player.storage.gf_selected_triggers = player.storage.gf_selected_triggers.filter(key => key !== removedItem.trigger);
								player.storage.gf_selected_filters = player.storage.gf_selected_filters.filter(key => key !== removedItem.filter);
								player.storage.gf_selected_contents = player.storage.gf_selected_contents.filter(key => key !== removedItem.content);
								player.storage.gf_skill_history = player.storage.gf_skill_history.filter(item => item.skillName !== skillToRemove);
							}
						}
					} catch (err) {}
				}
			},
			sub: true,
		},
	},
};

lib.skill["gf_pinzhuang_1"] = {
    trigger: {
		global: "phaseBefore",
		player: "enterGame",
	},
	forced: true,
	filter: function (event, player) {
		return (event.name != 'phase' || game.phaseNumber == 0);
	},
    async content(event, trigger, player) {
        function syncSkillHistory(player) {
            let currentSkills = [];
            if (Array.isArray(player.skills)) {
                currentSkills = player.skills.filter(skillName => 
                    skillName.startsWith("gf_pinzhuang_") || skillName.startsWith("gf_pinzhuang_1_")
                );
            }
            const validHistory = player.storage.gf_skill_history.filter(historyItem => 
                currentSkills.includes(historyItem.skillName)
            );
            const lostSkillNames = player.storage.gf_skill_history
                .filter(historyItem => !currentSkills.includes(historyItem.skillName))
                .map(historyItem => historyItem.skillName);
            if (lostSkillNames.length > 0) {
                console.log("自动版检测到已失去的拼装技能：", lostSkillNames);
                lostSkillNames.forEach(lostName => {
                    const lostItem = player.storage.gf_skill_history.find(item => item.skillName === lostName);
                    if (lostItem) {
                        player.storage.gf_selected_triggers = player.storage.gf_selected_triggers.filter(key => key !== lostItem.trigger);
                        player.storage.gf_selected_filters = player.storage.gf_selected_filters.filter(key => key !== lostItem.filter);
                        player.storage.gf_selected_contents = player.storage.gf_selected_contents.filter(key => key !== lostItem.content);
                    }
                });
                player.storage.gf_skill_history = validHistory;
            }
            
            return validHistory;
        }
        syncSkillHistory(player);
        function randomOne(arr) {
            if (!arr || arr.length === 0) return null;
            return arr[Math.floor(Math.random() * arr.length)];
        }
        function getRandomTrigger() {
            if (!window.gfbSkillPools || !Array.isArray(window.gfbSkillPools.triggerPool)) return null;
            const pool = window.gfbSkillPools.triggerPool.filter(
                t => !player.storage.gf_selected_triggers.includes(t.key)
            );
            return randomOne(pool);
        }
        const selectedTrigger = getRandomTrigger();
        if (!selectedTrigger) return event.finish();
        player.storage.gf_selected_triggers.push(selectedTrigger.key);
        function getRandomFilter(triggerKey) {
            let filterPool = [];
            if (window.gfbSkillUtils && typeof window.gfbSkillUtils.getFilterPoolByTrigger === 'function') {
                filterPool = window.gfbSkillUtils.getFilterPoolByTrigger(triggerKey);
            } else {
                filterPool = window.gfbSkillPools?.filterPool || [];
                if (triggerKey === "5" && window.gfbSkillPools.useCardFilterPool) {
                    filterPool = window.gfbSkillPools.useCardFilterPool;
                } else if (triggerKey === "7" && window.gfbSkillPools.useCardAfterFilterPool) {
                    filterPool = window.gfbSkillPools.useCardAfterFilterPool;
                } else if (triggerKey === "6" && window.gfbSkillPools.useCardToPlayeredFilterPool) {
                    filterPool = window.gfbSkillPools.useCardToPlayeredFilterPool;
                }
            }
            if (!Array.isArray(filterPool)) return null;
            const pool = filterPool.filter(f => !player.storage.gf_selected_filters.includes(f.key));
            return randomOne(pool);
        }
        const selectedFilter = getRandomFilter(selectedTrigger.key);
        if (!selectedFilter) return event.finish();
        player.storage.gf_selected_filters.push(selectedFilter.key);
        function getRandomContent(triggerKey, filter) {
            const blacklist = window.gfbSkillPools?.contentBlacklist?.[triggerKey] || [];
            let contentPool = [];
            if (triggerKey === "6") {
                contentPool = window.gfbSkillPools?.useCardToPlayeredPool || [];
            } else {
                if (window.gfbSkillPools?.contentPool) contentPool = contentPool.concat(window.gfbSkillPools.contentPool);
                if (window.gfbSkillPools?.useCardPool) contentPool = contentPool.concat(window.gfbSkillPools.useCardPool);
            }
            const pool = contentPool.filter(c =>
                !blacklist.includes(c.key) && !player.storage.gf_selected_contents.includes(c.key)
            );
            return randomOne(pool);
        }
        const selectedContent = getRandomContent(selectedTrigger.key, selectedFilter);
        if (!selectedContent) return event.finish();
        player.storage.gf_selected_contents.push(selectedContent.key);
        const finalContent = window.gfbSkillUtils?.deepClone
            ? window.gfbSkillUtils.deepClone(selectedContent)
            : JSON.parse(JSON.stringify(selectedContent));
        const skillName = `gf_pinzhuang_1_${Date.now().toString().slice(-6)}`;
        lib.skill[skillName] = {
            trigger: selectedTrigger.config,
            usable: 1,
            filter: selectedFilter.func,
            content: finalContent.func,
        };
        const skillTrans = (window.gfbSkillUtils && typeof window.gfbSkillUtils.createSkillTranslate === 'function')
            ? window.gfbSkillUtils.createSkillTranslate(skillName, selectedTrigger, selectedFilter, finalContent) || {}
            : {
                [skillName]: finalContent.cnName || "拼装技",
                [`${skillName}_info`]: `${selectedTrigger.cnDesc}${selectedFilter.cnDesc || ""}你可以${finalContent.cnDesc || "发动技能"}。`
            };
        window.translate = Object.assign(window.translate || {}, skillTrans);
        if (window.lib) window.lib.translate = Object.assign(window.lib.translate || {}, skillTrans);
        // 加技能
        if (typeof player.addSkill === 'function') {
            player.addSkill(skillName);
        } else if (typeof player.addTempSkill === 'function') {
            player.addTempSkill(skillName);
        } else {
            player.skills = player.skills || [];
            player.skills.push(skillName);
        }
        player.storage.gf_skill_history.push({
            skillName,
            trigger: selectedTrigger.key,
            filter: selectedFilter.key,
            content: selectedContent.key,
            desc: skillTrans[`${skillName}_info`]
        });
        event.finish();
    },
};
export const character = block;
