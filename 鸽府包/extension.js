
import { lib, game, ui, get, ai, _status } from '../../noname.js';
import { characterRank } from './character/characterRank.js'
import { gflib } from './main/gflib.js';
import { card } from './card/card.js';
import { content } from './main/content.js';
import { precontent } from './main/precontent.js';
import { config } from './main/config.js';
import { help } from './main/help.js';
import { basic } from './main/basic.js';
import { extensionDefaultPackage } from './main/main.js';
export let type = 'extension';

// ====================== 自更新配置（你只需要改这里！） ======================
const UPDATE_CONFIG = {
    repoUrl: "https://raw.giteeusercontent.com/li-ze54321/GFB/master/鸽府包", // 改成你的仓库地址
    extensionName: "鸽府包",
    currentVersion: "1.0.0", // 你当前版本号
};
// ========================================================================

gflib(lib, game, ui, get, ai, _status, '鸽府包');
//非常感谢源·天将士允许我搬运魔力值和通灵值机制，致敬，我在此基础上做了一些修改。
lib.gflib_custom.mp.push(function (player) {
	if (player.name == 'seh_hytz') return { gflib_mp: 0, gflib_maxMp: 100, type: 'seh_xinzhiqiM', color: 'linear-gradient(#cccccc, #0000FF)', color2: 'linear-gradient(#ff0000, #cc00ff)' }
});
lib.gflib_custom.mp.push(function (player) {
	if (player.name == 'wzzs_aesdd') return { gflib_mp: 100, gflib_maxMp: 100, type: 'wzzs_MoLi', color: 'linear-gradient(#cccccc, #0000FF)', color2: 'linear-gradient(#ff0000, #cc00ff)' }
});
lib.gflib_custom.mp.push(function (player) {
	if (player.name == 'aqcs_cssl') return { gflib_mp: 0, gflib_maxMp: 100, type: 'aqcs_csnl', color: 'linear-gradient(#cccccc, #4B0082)', color2: 'linear-gradient(#ff0000, #cc00ff)' }
});
lib.gflib_custom.tongling.push(function(player) {
    if (player.name == 'aqcs_lyjd') { return { gflib_tongling: 0, gflib_maxTongling: 2, type: 'gflib_tongling' }; }
});

lib.gflib_custom.frozen.push(function(player) {
    return { gflib_frozen: 0, type: 'gflib_frozen' };
});

const packList = [
	card,
];

function memberToString(key) {
	let str = '';
	for (let i = 0; i < packList.length; i++) {
		if (packList[i][key])
			str += `...packList[${i}].${key},`;
	}
	return eval('({' + str.slice(0, -1) + '})');
}
const packs = {
	name: "gfb",
	connect: true,
	translate: memberToString('translate'),
	card: memberToString('card'),
	skill: memberToString('skill'),
	list: []
}

export default async function () {
	try {
		const extensionInfo = await lib.init.promises.json(`${basic.extensionDirectoryPath}info.json`);
		const extension = {
			name: extensionInfo.name,
			editable: false,
			precontent() {
				lib.group.push("ge");
				lib.translate["ge"] = "鸽";
				lib.namePrefix.set("鸽", {
					color: "#000000",
					nature: "gefu",
				});
				lib.group.push("zhi");
				lib.translate["zhi"] = "职";
				lib.namePrefix.set("职", {
					color: "#000000",
					nature: "gefu",
				});
				lib.group.push("ming");
				lib.translate["ming"] = "明";
				lib.namePrefix.set("明", {
					color: "#000000",
					nature: "gefu",
				});
				const a = game.getRarity;
				game.getRarity = function (name2) {
					if (characterRank.SSS.includes(name2)) return "sss";
					if (characterRank.SS.includes(name2)) return "ss";
					if (characterRank.S.includes(name2)) return "s";
					if (characterRank.A.includes(name2)) return "a";
					return a.call(this, name2);
				};
				const b = ui.create.rarity;
				ui.create.rarity = function (button) {
					b.call(this, button);
					const roleName = button.link;
					const isMatchPrefix = ["gf_", "wzzs_", "cxm_","dmwc_" , "tj_", "gzhlb_", "gzt_", "seh_", "aqcs_", "gzlj_", "a_"].some(prefix => roleName.startsWith(prefix));
					if (!isMatchPrefix) return;
					const rarity = game.getRarity(roleName);
					const intro = button.node.intro;
					intro.classList.add("showintro");
					intro.style.position = "absolute";
					intro.style.fontFamily = "yuanli";
					intro.style.fontSize = "14px";
					intro.style.bottom = "6px";
					intro.style.left = "2px";
					intro.style.color = "#ffffff";
					intro.style.fontWeight = "bold";
					intro.style.background = "transparent";
					if (rarity === "sss") {
						intro.innerHTML = "传说";
						intro.style.textShadow = "-1px -1px 0 #FF0000, 1px -1px 0 #FF0000, -1px 1px 0 #FF0000, 1px 1px 0 #FF0000";
					} else if (rarity === "ss") {
						intro.innerHTML = "史诗";
						intro.style.textShadow = "-1px -1px 0 #8400ff, 1px -1px 0 #8400ff, -1px 1px 0 #8400ff, 1px 1px 0 #8400ff";
					} else if (rarity === "s") {
						intro.innerHTML = "稀有";
						intro.style.textShadow = "-1px -1px 0 #0080ff, 1px -1px 0 #0080ff, -1px 1px 0 #0080ff, 1px 1px 0 #0080ff";
					} else if (rarity === "a") {
						intro.innerHTML = "普通";
						intro.style.textShadow = "-1px -1px 0 #888888, 1px -1px 0 #888888, -1px 1px 0 #888888, 1px 1px 0 #888888";
					}
				};
				game.import("card", function () {
					return packs;
				});
				lib.translate['gfb_card_config'] = "鸽府包";
				precontent()
				//以下内容取自《火灵月影》，仅用于视频视频播放，感谢火哥允许我搬运，致敬！！！
				const video = function () {
					HTMLDivElement.prototype.setBackgroundImage = function (src) {
						if (Array.isArray(src)) {
							src = src[0];
						}
						if (typeof src === 'string' && src.includes('.mp4')) {
							this.style.backgroundImage = 'none';
							this.setBackgroundMp4(src);
						} else if (typeof src === 'string') {
							this.style.backgroundImage = `url(${src})`;
						} else {
							this.style.backgroundImage = 'none';
						}
						return this;
					};
					HTMLElement.prototype.setBackgroundMp4 = function (src) {
						const video = document.createElement('video');
						video.src = src;
						video.style.cssText = 'bottom: 0%; left: 0%; width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; position: absolute; z-index: -5;';
						video.autoplay = true;
						video.loop = true;
						this.appendChild(video);
						video.addEventListener('error', function () {
							video.remove();
						});
						return video;
					}; //给父元素添加一个覆盖的背景mp4
					game.charactersrc = function (name) {
						const info = lib.character[name];
						if (info && info.trashBin) {
							for (const value of info.trashBin) {
								if (value.startsWith('img:')) {
									return value.slice(4);
								}
								if (value.startsWith('ext:')) {
									return value.replace(/^ext:/, 'extension/');
								}
								if (value.startsWith('character:')) {
									name = value.slice(10);
									break;
								}
							}
						}
						return `image/character/stand/${name}.jpg`;
					}; //获取武将名对应立绘路径
					game.cardsrc = function (name) {
						const info = lib.card[name];
						if (info) {
							if (info.image) {
								if (info.image.startsWith('ext:')) {
									return info.image.replace(/^ext:/, 'extension/');
								}
								return info.image;
							}
							const ext = info.fullskin ? 'png' : 'jpg';
							if (info.modeimage) {
								return `image/mode/${info.modeimage}/card/${name}.${ext}`;
							}
							if (info.cardimage) {
								name = info.cardimage;
							}
							return `image/card/${name}.${ext}`;
						}
					}; //获取武将名对应立绘路径
					game.GF_mp4 = async function (name) {
						return new Promise((resolve) => {
							const video = document.createElement('video');
							video.src = `extension/鸽府包/image/animation/${name}.mp4`;
							video.style.cssText = 'z-index: 999; height: 100%; width: 100%; position: fixed; object-fit: cover; left: 0; right: 0; mix-blend-mode: screen; pointer-events: none;';
							video.autoplay = true;
							video.loop = false;
							const backButton = document.createElement('div');
							backButton.innerHTML = '返回游戏'; //文字内容
							backButton.style.cssText = 'z-index: 999; position: absolute; bottom: 10px; right: 10px; color: red; font-size: 16px; padding: 5px 10px; background: rgba(0, 0, 0, 0.3);';
							backButton.onclick = function () {
								backButton.remove();
								video.remove();
								resolve();
							}; //设置返回按钮的点击事件
							document.body.appendChild(video); //document上面创建video元素之后不要立刻贴上,加一个延迟可以略过前面的播放框,配置越烂延迟越大
							document.body.appendChild(backButton);
							video.addEventListener('error', function () {
								backButton.remove();
								video.remove();
								resolve();
							});
							video.addEventListener('ended', function () {
								backButton.remove();
								video.remove();
								resolve();
							});
						});
					}; //播放mp4
				};
				video();
			},
			arenaReady() {
			},
			content: function (config, pack) {
				content()
				const zhiyin = () => {
					if (!game || !game.players) return false;
					for (let player of game.players) {
						const sm = player.name === "gzhlb_sm" ||
							(player.character && player.character.includes("gzhlb_sm")) ||
							(player.character2 && player.character2.includes("gzhlb_sm"));
						const aesdd = player.name === "wzzs_aesdd" ||
							(player.character && player.character.includes("wzzs_aesdd")) ||
							(player.character2 && player.character2.includes("wzzs_aesdd"));
						if (sm || aesdd) return true;
					}
					return false;
				};
				const originalDisable = lib.skill?.player?.disableSkill;
				if (originalDisable) {
					lib.skill.player.disableSkill = function (...args) {
						if (zhiyin()) {
							if (this.name === "gzhlb_sm" || this.name === "wzzs_aesdd") {
								return undefined;
							}
						}
						return originalDisable.apply(this, args);
					};
				}

				const originalBlock = lib.skill?.player?.addSkillBlocker;
				if (originalBlock) {
					lib.skill.player.addSkillBlocker = function (...args) {
						if (zhiyin()) {
							if (this.name === "gzhlb_sm" || this.name === "wzzs_aesdd") {
								return undefined;
							}
						}
						return originalBlock.apply(this, args);
					};
				}
				const trigger = lib.element?.trigger?.execute;
				if (trigger) {
					lib.element.trigger.execute = function (event) {
						forceRedefine();
						shtcHasBoss();
						return trigger.call(this, event);
					};
				}

				const cancel = lib.element?.trigger?.cancel;
				if (cancel) {
					lib.element.trigger.cancel = function () {
						if (this && this.type === "card" && (
							this.player.name === "gzhlb_sm" ||
							this.player.name === "wzzs_aesdd"
						)) return undefined;
						if (this && this.type === "damage" && (
							this.player.name !== "gzhlb_sm" &&
							this.player.name !== "wzzs_aesdd"
						)) return undefined;
						return cancel.call(this);
					};
				}
			},

			// ====================== 自动加入的更新按钮 ======================
			config: await (async () => {
				const original = await basic.resolve(config);
				return {
					...original,
					update_gf: {
						name: "<button style='padding:4px 8px'>检查鸽府包更新</button>",
						onclick: checkExtensionUpdate,
					},
				};
			})(),
			// ================================================================

			help: await basic.resolve(help),
			package: await basic.resolve(extensionDefaultPackage),
			files: { 'character': [], 'card': [], 'skill': [], 'audio': [] },
		};

		// 版本号注入
		extension.package.version = UPDATE_CONFIG.currentVersion;

		Object.keys(extensionInfo)
			.filter(key => key !== 'name')
			.forEach(key => {
				extension.package[key] = extensionInfo[key];
			});

		return extension;
	} catch (err) {
		console.error('扩展加载失败：', err);
		throw err;
	}
}

function checkExtensionUpdate() {
	const url = "https://gitee.com/li-ze54321/GFB/raw/master/鸽府包/update.json";

	fetch(url)
		.then(res => {
			if (!res.ok) throw new Error("获取更新文件失败");
			return res.json();
		})
		.then(data => {
			const newVer = data.version;
			const currentVersion = UPDATE_CONFIG.currentVersion;
			if (newVer === currentVersion) {
				alert("✅ 鸽府包已是最新版本");
				return;
			}

			if (!confirm(`发现新版本：${currentVersion} → ${newVer}\n是否立即更新？`)) return;

			const files = data.files || [];
			let index = 0;

			function next() {
				if (index >= files.length) {
					alert("✅ 更新完成！即将重启游戏");
					game.reload();
					return;
				}

				const file = files[index];
				const fileUrl = `https://gitee.com/li-ze54321/GFB/raw/master/鸽府包/${file}`;

				game.download(fileUrl, () => {
					index++;
					next();
				}, (err) => {
					alert(`下载失败：${file}`);
				});
			}

			next();
		})
		.catch(err => {
			alert("❌ 更新失败：" + err.message);
			console.error(err);
		});
}
// ================================================================

lib.translate['gfb_card_config'] = "鸽府包";
lib.config.all.cards.push('gfb');
if (!lib.config.cards.includes('gfb')) lib.config.cards.push('gfb');
