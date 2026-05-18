import{lib,game,ui,get,ai,_status}from '../../../noname.js'
import { translate } from './translate.js'
let block = {
	//在这里编写技能。
	"gzt_pingjian": {
		init: function (player) {
			player.storage.gzt_pingjian = 4;
		},
		banned: [],
		trigger: {
			player: "phaseZhunbei",
		},
		forced: true,
		filter(event, player, name) {
			return true;
		},
		getAllSkillTriggers: function (player) {
			const triggerSet = {
				player: new Set(),
				global: new Set()
			};
			const excludeSkills = [
				"sbpingjian",
			];
			function scanSkill(skill) {
				if (!skill) return;
				if (skill.name && excludeSkills.includes(skill.name)) {
					return;
				}
				if (skill.trigger && skill.trigger.player) {
					const p = skill.trigger.player;
					if (Array.isArray(p)) {
						p.forEach(t => triggerSet.player.add(t));
					} else if (typeof p === 'string') {
						triggerSet.player.add(p);
					}
				}
				if (skill.trigger && skill.trigger.global) {
					const g = skill.trigger.global;
					if (Array.isArray(g)) {
						g.forEach(t => triggerSet.global.add(t));
					} else if (typeof g === 'string') {
						triggerSet.global.add(g);
					}
				}
				if (skill.subSkill) {
					for (let key in skill.subSkill) {
						scanSkill(skill.subSkill[key]);
					}
				}
			}
			let charList = [];
			if (_status.connectMode) {
				charList = get.charactersOL() || [];
			} else {
				for (let name in lib.character) {
					if (lib.filter.characterDisabled2(name) || lib.filter.characterDisabled(name)) continue;
					charList.push(name);
				}
			}
			for (let charName of charList) {
				const char = lib.character[charName];
				if (!char || !char[3]) continue;
				char[3].forEach(skillName => scanSkill(lib.skill[skillName]));
			}
			for (let skName in lib.skill) {
				scanSkill(lib.skill[skName]);
			}
			return {
				player: Array.from(triggerSet.player),
				global: Array.from(triggerSet.global)
			};
		},
		async content(event, trigger, player) {
			const { player: allPlayerTriggers, global: allGlobalTriggers } = lib.skill.gzt_pingjian.getAllSkillTriggers(player);
			const skillName = "gzt_all_trigger_listener";
			lib.skill[skillName] = {
				init: function (player) {
					player.storage.gzt_pingjian_cd = [];
					player.storage.gzt_pingjian_temp = [];
				},
				trigger: {
					player: allPlayerTriggers,
					global: allGlobalTriggers,
				},
				silentForce: true,
				filter(event, player, name) {
					// 30% 基础概率
					// if (Math.random() > 0.7) return false;

					// 防止同时机重复触发
					if (player.storage.gzt_pingjian_cd === name) return false;

					// 时机黑名单（安全版，不报错）
					const TRIGGER_BLACKLIST = ["logSkill"];
					if (typeof name === "string" && TRIGGER_BLACKLIST.some(keyword => name.includes(keyword))) {
						return false;
					}

					// ===================== 概率逻辑完整放入 filter =====================
					const nowTrigger = name;
					const blackListMethod = [
						"awakenSkill","removeSkill","addSkill","addTempSkill",
						"update","init","die","removeGaintag","hasSkillTag","useSkill",
						"addJudge","clearSkills","GFBgmAndBg","GFVideo","playerBgm","audio","music"
					];

					const mainSkills = [];
					const subSkills = [];

					for (const skName in lib.skill) {
						const sk = lib.skill[skName];
						if (!sk || !sk.content) continue;

						const code = sk.content.toString();
						let forbidden = false;
						for (const m of blackListMethod) {
							if (code.includes(`player.${m}(`)) {
								forbidden = true;
								break;
							}
						}
						if (forbidden) continue;

						// 安全匹配时机，绝对不报错
						let match = false;
						if (sk.trigger?.player) {
							const p = sk.trigger.player;
							if (typeof p === "string" && p === nowTrigger) {
								match = true;
							} else if (Array.isArray(p) && p.includes(nowTrigger)) {
								match = true;
							}
						}
						if (sk.trigger?.global) {
							const g = sk.trigger.global;
							if (typeof g === "string" && g === nowTrigger) {
								match = true;
							} else if (Array.isArray(g) && g.includes(nowTrigger)) {
								match = true;
							}
						}
						if (!match) continue;

						if (sk.sub === true || sk.subSkill) {
							subSkills.push(sk);
						} else {
							mainSkills.push(sk);
						}
					}

					const total = mainSkills.length > 0 ? mainSkills.length : subSkills.length;
					if (total === 0) return false;

					// 概率公式：5个=10%，50个及以上=100%
					let rate;
					if (total >= 50) {
						rate = 100;
					} else {
						rate = 10 + 2 * (total - 5);
					}
					rate = Math.max(rate, 0);

					const roll = Math.random() * 100;
					return roll <= rate;
					// ==================================================================
				},
				async content(event, trigger, player) {
					player.storage.gzt_pingjian_cd = event.triggername;
					const nowTrigger = event.triggername;
					const tempSkillName = "gzt_pingjian_temp_skill";

					// 清理旧技能
					if (player.storage.gzt_pingjian_temp) {
						const last = player.storage.gzt_pingjian_temp;
						if (player.hasSkill(last)) player.removeSkill(last);
						if (lib.skill[last]) delete lib.skill[last];
						player.storage.gzt_pingjian_temp = [];
					}

					const blackListMethod = [
						"awakenSkill","removeSkill","addSkill","addTempSkill",
						"update","init","die","removeGaintag","hasSkillTag","useSkill",
						"addJudge","clearSkills","GFBgmAndBg","GFVideo","playerBgm","audio","music"
					];

					const mainSkills = [];
					const mainSkillNames = [];
					const subSkills = [];
					const subSkillNames = [];

					for (const skName in lib.skill) {
						const sk = lib.skill[skName];
						if (!sk || !sk.content) continue;
						const code = sk.content.toString();
						let forbidden = false;
						for (const m of blackListMethod) {
							if (code.includes(`player.${m}(`)) { forbidden = true; break; }
						}
						if (forbidden) continue;

						let match = false;
						if (sk.trigger?.player) {
							const p = sk.trigger.player;
							if (Array.isArray(p) && p.includes(nowTrigger)) match = true;
							else if (p === nowTrigger) match = true;
						}
						if (sk.trigger?.global) {
							const g = sk.trigger.global;
							if (Array.isArray(g) && g.includes(nowTrigger)) match = true;
							else if (g === nowTrigger) match = true;
						}
						if (!match) continue;

						if (sk.sub === true || sk.subSkill) {
							subSkills.push(sk);
							subSkillNames.push(skName);
						} else {
							mainSkills.push(sk);
							mainSkillNames.push(skName);
						}
					}

					let finalSkills, finalSkillNames;
					if (mainSkills.length > 0) {
						finalSkills = mainSkills;
						finalSkillNames = mainSkillNames;
						console.log(`【评鉴】当前时机找到主技能，共${mainSkills.length}个`);
					} else {
						finalSkills = subSkills;
						finalSkillNames = subSkillNames;
						console.log(`【评鉴】无主技能，启用子技能池，共${subSkills.length}个`);
					}

					if (finalSkills.length === 0) {
						console.log(`【评鉴】时机：${nowTrigger}，无匹配技能`);
						event.finish();
						return;
					}

					const randomIndex = Math.floor(Math.random() * finalSkills.length);
					const randSkill = finalSkills[randomIndex];
					const randSkillName = finalSkillNames[randomIndex];

					console.log(`==================================================`);
					console.log(`【评鉴】时机：${nowTrigger}，技能：${randSkillName}`);
					console.log(`【评鉴】触发时机：${nowTrigger}`);
					console.log(`【评鉴】随机到技能：${randSkillName}`);
					console.log(`【评鉴】技能完整内容：`);
					console.log(randSkill.content);
					console.log(`==================================================`);

					// 创建临时技能
					if (lib.skill[tempSkillName]) delete lib.skill[tempSkillName];
					lib.skill[tempSkillName] = {
						trigger: { 
							player: [nowTrigger],
							global: [nowTrigger],
						},
						forced: true,
						filter: randSkill.filter || (() => true),
						content: randSkill.content,
					};

					player.addSkill(tempSkillName);
					player.storage.gzt_pingjian_temp = tempSkillName;

					event.finish();
				},
			};
			if (!player.hasSkill(skillName)) player.addSkill(skillName);
			event.finish();
		},
		group: ["gzt_pingjian_a", "gzt_pingjian_b"],
		subSkill: {
			a: {
				trigger:{
                	player: "changeCharacterBefore",
                },
				silentForce: true,
                async content(event, trigger, player) {
                   trigger.cancel();
                },
				sub: true,
			},
			b: {
				trigger: {
					player: "phaseBefore",
				},
				forceOut: true,
				forceDie: true,
				forced: true,
				charlotte: true,
				silent: true,
				popup: false,
				async content(event, trigger, player) {
					var list = game.filterPlayer();
					for (var i = 0; i < game.players.length; i++) {
						var pl = game.players[i];
						game.broadcastAll(function(p) { p.forceIn(); }, pl);
					}
				},
				sub: true,
			},
		},
	},
	"gzt_zhiyin": {
		init: (player, skill) => {
			player.storage.gzt_zhiyin_yl = 0;
			player.storage.gzt_zhiyin_zh = 0;
			player.storage.gzt_zhiyin_clear = 0;
			player.storage.gzt_zhiyin_phase = [];
			const num = player.countMark("zhiyin") % 2;
			const list = ["平：你将手牌弃至1并展示等量张牌，你可获得其中任意张花色一样的牌并使用。", "仄：你将手牌摸至体力上限，然后令一名角色摸一张牌并视为对其使用一张<阳：【推心置腹】/阴：【知己知彼】>。"];
			player.addTip("gzt_zhiyin_yl", get.translation("gzt_zhiyin") + "：" + list[num]);
		},
		intro: {
			content(storage, player) {
				let str;
				let str2;
				const num2 = player.countMark("gzt_zhiyin_clear") + 1;
				if (!player.hasMark("gzt_zhiyin_zh")) {
					str = `阳：你弃【${num2}】张手牌且若本阶段未执行则额外执行一次。`;
					str2 = `推心置腹`;
				} else {
					str = "阴：你摸【1】张牌并跳过此阶段。";
					str2 = `知己知彼`;
				}
				const num = player.countMark("gzt_zhiyin_yl") % 2;
				const list = [
					"平：你将手牌弃至1并展示等量张牌，你可获得其中任意张花色一样的牌并使用；<br><br>" + str,
					`仄：你将手牌摸至体力上限，然后令一名角色摸一张牌并视为对其使用一张【${str2}】；<br><br>` + str
				];
				return list[num];
			},
		},
		trigger: {
			player: ["phaseJudgeBefore", "phaseDrawBefore", "phaseUseBefore", "phaseDiscardBefore"],
		},
		enable: "phaseUse",
		yunlvji: true,
		mark: true,
		zhuanhuanji: true,
		marktext: "☯",
		filter(event, player, name) {
			if (name) {
				return true;
			} else {
				return player.countCards("h") > 0;
			}
		},
		"prompt2": function (event, player, name, skill, storage) {
			const map = {
				phaseJudgeBefore: "判定阶段", phaseDrawBefore: "摸牌阶段", phaseUseBefore: "出牌阶段", phaseDiscardBefore: "弃牌阶段"
			};
			const num2 = player.countMark("gzt_zhiyin_clear") + 1;
			const cnPhase = map[name] || "此阶段";
			let str;
			let str2;
			if (!player.hasMark("gzt_zhiyin_zh")) {
				str = `阳：你弃【${num2}】张手牌且<span style="color:#FF0000;">额外执行</span>一次【${cnPhase}】。`;
				str2 = `推心置腹`;
			} else {
				str = `阴：你摸【1】张牌并<span style="color:#FF0000;">跳过</span>【${cnPhase}】。`;
				str2 = `知己知彼`;
			}
			const num = player.countMark("gzt_zhiyin_yl") % 2;
			const list = [
				"平：你将手牌弃至1并展示等量张牌，你可获得其中任意张花色一样的牌并使用；<br><br>" + str,
				`仄：你将手牌摸至体力上限，然后令一名角色摸一张牌并视为对其使用一张【<span style="color:#FF0000;">${str2}</span>】；<br><br>` + str
			];
			return list[num];
		},
		async content(event, trigger, player) {
			player.storage.gzt_zhiyin_clear++;
			player.addTempSkill("gzt_zhiyin_clear");
			player.changeZhuanhuanji("gzt_zhiyin");
			const a = player.countMark("gzt_zhiyin_yl") % 2;
			if (a == 0) {
				game.broadcastAll((p) => {
					game.playAudio(`../extension/鸽府包/audio/skill/gzt_zhiyin${[1, 2].randomGet()}.mp3`);
				}, player);
				event.count = player.countCards("h") - 1; 
				if (player.countCards("h") > 1) {
					player.chooseToDiscard(event.count, true);
					const cards = get.cards(event.count, true);
					await player.showCards(cards, `${get.translation(player)}发动了【${get.translation(event.name)}】`, true).set("clearArena", false);
					const list = cards.map(card => get.suit(card)).unique();
					const result = await player
						.chooseCardButton(`知音：获得其中任意张花色一样的牌并使用其中一张`, cards, [1, Infinity], true)
						.set("filterButton", function (button) {
							for (let i = 0; i < ui.selected.buttons.length; i++) {
								if (get.suit(ui.selected.buttons[i].link) != get.suit(button.link)) {
									return false;
								}
							}
							return true;
						})
						.set("ai", function (button) {
							return get.value(button.link, _status.event.player);
						})
						.forResult();
					game.broadcastAll(ui.clear);
					if (result?.links?.length) {
						await player.gain(result.links, "gain2").gaintag.add('gzt_zhiyin');
						await player.chooseToUse("知音：是否使用一张展示的牌？", function (card, player) {
							if (player.hp == player.maxHp && card.name == "tao") return false;
							return card.hasGaintag('gzt_zhiyin') && !get.info(card).notarget && card.name != "ying";
						}).set('ai', function (card) {
							return get.tag(card, 'damage');
						});
						await player.removeGaintag("gzt_zhiyin");
					}
				}
			}
			if (a == 1) {
				game.broadcastAll((p) => {
					game.playAudio(`../extension/鸽府包/audio/skill/gzt_zhiyin${[3, 4].randomGet()}.mp3`);
				}, player);
				player.drawTo(player.maxHp);
				let str;
				if (!player.hasMark("gzt_zhiyin_zh")) {
					str = `推心置腹`;
				} else {
					str = `知己知彼`;
				}
				const target = await player.chooseTarget(
					get.prompt("gzt_zhiyin"),
					`是否令一名角色摸一张牌并视为对其使用一张【<span style="color:#FF0000;">${str}</span>】？`,
				)
				.set("ai", function (target) {
					return get.attitude(_status.event.player, target) < 0;
				})
				.forResult();
				if (target && target.targets?.length) {
					await target.targets[0].draw();
					if (player.storage.gzt_zhiyin){
						await player.useCard({ name: 'tuixinzhifu' }, target.targets[0]);
					} else {
						await player.useCard({ name: 'zhibi' }, target.targets[0]);
					}
				}
			}
			if (player.storage.gzt_zhiyin){
				game.broadcastAll((p) => {
					game.playAudio(`../extension/鸽府包/audio/skill/gzt_zhiyin${[5].randomGet()}.mp3`);
				}, player);
				player.chooseToDiscard(player.countMark("gzt_zhiyin_clear"), true);
				player.storage.gzt_zhiyin_zh = 1;
				if (trigger.name) {
					player.storage.gzt_zhiyin_phase = trigger.name;
				}
			} else {
				game.broadcastAll((p) => {
					game.playAudio(`../extension/鸽府包/audio/skill/gzt_zhiyin${[6].randomGet()}.mp3`);
				}, player);
				player.draw();
				player.storage.gzt_zhiyin_zh = 0;
				if (trigger.name) {
					trigger.cancel();
				}
			}
		},
		onremove(player, skill) {
			player.removeSkill("gzt_zhiyin_a");
			player.removeTip("gzt_zhiyin_yl");
		},
		group: ["gzt_zhiyin_a", "gzt_zhiyin_b"],
		subSkill: {
			a: {
				trigger: {
					player: ["loseAfter", "gainAfter"],
				},
				silentForce: true,
				filter(event, player, name) {
					if (name == "loseAfter") {
						if (player != _status.currentPhase || event.type != "discard" ) {
							return false;
						}
					}
					return player.hp <= player.countCards("h") || player.countCards("h") == 1;
				},
				async content(event, trigger, player) {
					player.storage.gzt_zhiyin_yl++;
					const num = player.countMark("gzt_zhiyin_yl") % 2;
					if (num == 0) {
						game.log(player, "重置了", "#g" + get.translation("gzt_zhiyin"), "的使用次数");
					}
					const list = ["平：你将手牌弃至1并展示等量张牌，你可获得其中任意张花色一样的牌并使用。", "仄：你将手牌摸至体力上限，然后令一名角色摸一张牌并视为对其使用一张<阳：【推心置腹】/阴：【知己知彼】>。",];
					player.addTip("gzt_zhiyin_yl", get.translation("gzt_zhiyin") + list[num]);
				},
				sub: true,
				sourceSkill: "gzt_zhiyin",
				"_priority": 0,
			},
			b: {
				trigger: {
					player: "phaseAnyEnd",
				},
				silentForce: true,
				filter(event, player) {
					return player.storage.gzt_zhiyin_phase.length > 0;
				},
				async content(event, trigger, player) {
					game.broadcastAll((p) => {
						game.playAudio(`../extension/鸽府包/audio/skill/gzt_zhiyin${[7].randomGet()}.mp3`);
					}, player);
					let next = player[player.storage.gzt_zhiyin_phase]();
					event.next.remove(next);
					trigger.next.push(next);
					player.storage.gzt_zhiyin_phase = [];
				},
				sub: true,
			},
			clear: {
				onremove: function (player) {
					player.storage.gzt_zhiyin_clear = 0;
				},
				sourceSkill: "gzt_zhiyin",
				sub: true,
			},
		},
	},
	"gzt_lidan":{
		init: function (player) {
			player.storage.gzt_lidan = [];
		},
		trigger: {
			global: "phaseUseBefore",
		},
		silentForce: true,
		filter(event, player) {
			return !player.storage.gzt_lidan.includes(event.player);
		},
		async content(event, trigger, player) {
			let delList = ["确定", "取消", "永远取消"];
			const delResult = await trigger.player.chooseControl(...delList)
				.set("prompt", "砺胆：是否对自己造成一点伤害？")
				.set("ai", function () {
					if (trigger.player == player) {
						return 0;
					} else {
						if (trigger.player.hp > 1) {
							return 0;
						}
					}
					return 1;
				})
				.forResult();
			let delIndex = delResult.index;
			if (delIndex == 0) trigger.player.damage(trigger.player);
			if (delIndex == 2) player.markAuto("gzt_lidan", [trigger.player]);
		},
	},
	"gzt_zhuying":{
		init: function (player) {
			player.storage.gzt_zhuying_skill = [];
		},
		intro: {
			content(storage) {
				if (storage) {
					return "你将体力变为与全场体力最低一致";
				}
				return "你将体力变为与全场体力最高一致";
			},
		},
		trigger: {
			global: "changeHpAfter",
		},
		audio: "ext:鸽府包/audio/skill:2",
		mark: true,
		zhuanhuanji: true,
		marktext: "☯",
		frequent: true,
		async content(event, trigger, player) {
			event.count = player.hp;
			player.changeZhuanhuanji("gzt_zhuying");
			if (!player.storage.gzt_zhuying){
				var list = game.filterPlayer(function (current) {
					return (
						!game.hasPlayer(function (current2) {
							return current2.hp < current.hp;
						})
					);
				});
				if (list.length) {
					var target = list.randomGet();
					player.hp = target.hp;
					player.update();
					if(event.count != target.hp && player.hasSkill("gzt_zhihuo")){
						if (player.hp == 0) player.loseMaxHp(1);
						const result = await player.chooseCard("hes", "你可选择一张牌或有1/3的概率将牌堆顶的牌置于武将牌上称为“财”").forResult();
						if (result?.bool && result?.cards?.length) {
							await player.addToExpansion(result.cards, player, "give").gaintag.add('gzt_zhihuo');
						} else {
							if (Math.random() < 0.33) {
								await player.addToExpansion(get.cards(1), 'draw').gaintag.add('gzt_zhihuo');
							}
						}
					}
				}
			} else {
				var list = game.filterPlayer(function (current) {
					return (
						!game.hasPlayer(function (current2) {
							return current2.hp > current.hp;
						})
					);
				});
				if (list.length) {
					var target = list.randomGet();
					player.hp = target.hp;
					player.update();
					if(event.count != target.hp && player.hasSkill("gzt_zhihuo")){
						if (player.hp == 0) player.loseMaxHp(1);
						const result = await player.chooseCard("hes", "你可选择一张牌或有1/3的概率将牌堆顶的牌置于武将牌上称为“财”").forResult();
						if (result?.bool && result?.cards?.length) {
							await player.addToExpansion(result.cards, player, "give").gaintag.add('gzt_zhihuo');
						} else {
							if (Math.random() < 0.33) {
								await player.addToExpansion(get.cards(1), 'draw').gaintag.add('gzt_zhihuo');
							}
						}
					}
				}
			}
		},
		group: "gzt_zhuying_change",
		subSkill: {
			change: {
				trigger: {
					global: "gameStart",
				},
				silentForce: true,
				filter(event, player) {
					var list = game.filterPlayer(function (current) {
						return (
							!game.hasPlayer(function (current2) {
								return current2.maxHp > current.maxHp;
							})
						);
					});
					if (list.length) {
						var target = list.randomGet();
						return player.maxHp < target.maxHp;
					}
				},
				async content(event, trigger, player) {
					var list = game.filterPlayer(function (current) {
						return (
							!game.hasPlayer(function (current2) {
								return current2.maxHp > current.maxHp;
							})
						);
					});
					if (list.length) {
						var target = list.randomGet();
						player.maxHp = target.maxHp;
						player.update();
					}
				},
				sub: true,
			},
		},
	},
	"gzt_zhihuo": {
		init: function (player) {
			player.storage.gzt_zhihuo_a = 0;
		},
		intro: {
			markcount: "expansion",
			mark: function (dialog, content, player) {
				var content = player.getExpansions('gzt_zhihuo');
				if (content && content.length) {
					if (player == game.me || player.isUnderControl()) {
						dialog.addAuto(content);
					}
					else {
						return '共有' + get.cnNumber(content.length) + '张财';
					}
				}
			},
			content: function (content, player) {
				var content = player.getExpansions('gzt_zhihuo');
				if (content && content.length) {
					if (player == game.me || player.isUnderControl()) {
						return get.translation(content);
					}
					return '共有' + get.cnNumber(content.length) + '张财';
				}
			},
		},
		trigger: {
			player: "changeHp",
		},
		frequent: true,
		async content(event, trigger, player) {
			const hes = player.getCards("he");
			if (!hes.length) {
				await player.addToExpansion(get.cards(1), 'draw').gaintag.add('gzt_zhihuo');
				return;
			}
			const result = await player.chooseCard("hes", "你可选择一张牌或有1/4的概率将牌堆顶的牌置于武将牌上称为“财”").forResult();
			if (result?.bool && result?.cards?.length) {
				await player.addToExpansion(result.cards, player, "give").gaintag.add('gzt_zhihuo');
			} else {
				if (Math.random() < 0.33) {
					await player.addToExpansion(get.cards(1), 'draw').gaintag.add('gzt_zhihuo');
				}
			}
		},
		global: "gzt_zhihuo_a",
		subSkill: {
			a: {
				init: function (player) {
					player.storage.gzt_zhihuo_b = 0;
				},
				enable: "phaseUse",
				audio: "ext:鸽府包/audio/skill:2",
				usable: 1,
				filter(event, player) {
					return player.countMark("gzt_zhihuo_b") < 1 && player.countCards("he") && game.hasPlayer(current => current.hasSkill("gzt_zhihuo") && current.getExpansions('gzt_zhihuo').length > 0);
				},
				log: false,
				delay: false,
				filterCard: true,
				discard: false,
				lose: false,
				selectCard: [1, Infinity],
				position: "he",
				prompt() {
					const player = get.player();
					const targets = game.filterPlayer(current => current.hasSkill("gzt_zhihuo"));
					if (targets.length === 1 && targets[0] === player) {
						return "将任意张牌交给自己";
					}
					let str = `将任意张牌交给${get.translation(targets)}`;
					if (targets.length > 1) {
						str += "中的一人";
					}
					return str;
				},
				content() {
					"step 0"
					const targets = game.filterPlayer(current => current.hasSkill("gzt_zhihuo"));
					let target;
					if (targets.length === 1) {
						event.target = targets[0];
					} else {
						player
							.chooseTarget(true, "选择【殖货】的目标", function (card, player, target) {
								return _status.event.list.includes(target);
							})
							.set("list", targets)
							.set("ai", function (target) {
								var player = _status.event.player;
								return get.attitude(player, target);
							})
							.set("chessForceAll", true)
					}
					"step 1"
					if (!result.bool || !result.targets.length) {
						const targets = game.filterPlayer(current => current.hasSkill("gzt_zhihuo"));
						event.target = targets[0];
					} else {
						event.target = result.targets[0];
					}
					"step 2"
					player.storage.gzt_zhihuo_a = cards.length;
					player.give(cards, event.target);
					const cardsd = event.target.getExpansions('gzt_zhihuo');
					player.chooseButton([1, cardsd.length], ["请选择任意张“财”牌并获得", cardsd], true).set("ai", function (button) {
						return get.value(button.link, player);
					});
					"step 3"
					if (result.bool) {
						player.gain(result.links, "gain2", "log");
						if (result.links.length > player.countMark("gzt_zhihuo_a")) {
							event.target.chooseControl('确定', 'cancel2',
							ui.create.dialog(get.prompt('gzt_zhihuo_a'), "是否令【" + get.translation(player) + "】不可再通过〖殖货〗交给你牌？",'hidden')).ai = function () {
								if (get.attitude(player, event.target) > 0) return 1;
								return 0;
							}
						}
					}
					"step 4"
					if (result.control == '确定') {
						game.broadcastAll((p) => {
							game.playAudio(`../extension/鸽府包/audio/skill/gzt_zhihuo${[1].randomGet()}.mp3`);
						}, player);
						player.storage.gzt_zhihuo_b++;
					}
				},
				sub: true,
			},
		},
	},
	"gzt_baihe": {
		trigger: { 
			global: "useCard",
		},
		audio: "ext:鸽府包/audio/skill:2",
		filter(event, player) {
			return event.player.getHistory("useCard").filter(evt => !get.info(evt.card).notarget).indexOf(event) == 0 && event.player.countCards("he") > 0 && event.player != player;
		},
		check: function (event, player) {
			return get.attitude(player, event.player) <= 0;
		},
		async content(event, trigger, player) {
		     if (trigger.card.name == "sha" && trigger.addCount !== false) {
                trigger.addCount = false;
                const stat = trigger.player.getStat().card,
                    name = trigger.card.name;
                if (typeof stat[name] === "number") {
                    stat[name]--;
                }
            }
			const cards = trigger.player.getCards("he");
			if (cards.length == 0) return;
			const random = cards[Math.floor(Math.random() * cards.length)];
			await trigger.player.useCard(random, trigger.targets);
			trigger.cancel();
			trigger.targets.length = 0;
            trigger.all_excluded = true;
		},
	},
	"gzt_xiyun": {
		trigger: {
			player: "phaseZhunbei",
		},
		frequent: true,
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt(event.name.slice(0, -5)), "你可选择一名角色，其可使用一张牌，若其不如此做你摸两张牌、恢复一点体力并翻面。")
				.set("ai", target => {
					const player = get.event().player, att = get.attitude(player, target);
					return att > 0;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			game.broadcastAll((p) => {
				game.playAudio(`../extension/鸽府包/audio/skill/gzt_xiyun${[1, 2].randomGet()}.mp3`);
			}, player);
			const target = event.targets[0];
			const result = await target
				.chooseToUse({
					filterCard(card) {
						if (get.itemtype(card) != "card" || (get.position(card) != "h" && get.position(card) != "s")) {
							return false;
						}
						return lib.filter.filterCard.apply(this, arguments);
					},
					prompt: "栖云：是否使用一张手牌？",
					addCount: false,
					ai1(card) {
						const player = get.player();
						if (get.tag(card, "damage") && player.hasValueTarget(card)) {
							return 10 + get.cacheOrder(card);
						}
						return get.cacheOrder(card);
					},
				})
				.forResult();
			if (!result?.bool) {
				await player.draw(2);
				await player.recover();
				await player.turnOver();
			}
		},
		ai: {
			threaten: 1.7,
		},
	},
	"dmwc_xiangfu": {
		trigger: {
			global: "gainAfter",
		},
		audio: "ext:鸽府包/audio/skill:2",
		"prompt2": function (event, player) {
			return '是否令' + get.translation(event.player) + '摸一张牌？';
		},
		filter(event, player) {
			event.count = 0;
			for (let i = 0; i < event.cards.length; i++) {
				if (get.type(event.cards[i]) == "equip" && get.color(event.cards[i]) == "black") {
					event.count++;
				}
			}
			return event.count > 0;
		},
		async content(event, trigger, player) {
			trigger.player.draw();
		},
	},
	"dmwc_cangshen": {
		trigger: {
			player: "useCardAfter",
		},
		audio: "ext:鸽府包/audio/skill:2",
		frequent: true,
		filter: function(event, player) {
			// return get.type2(event.card) == "basic" || get.suit(event.card) == "heart";
			return get.color(event.card) == "red";
		},
		async content(event, trigger, player) {
			player.gain(get.cards(2, true), "gain2", false);
			var { result: result } = await player.chooseCard("he", true, 2, "选择两张牌洗入牌堆")
				.set('ai', function (card) {
					return 8 - get.value(card);
				});
			if (result.cards && result.cards.length > 0) {
				await player.$throw(result.cards.length, 1000);
				player.lose(result.cards, ui.cardPile).insert_index = function () {
					return ui.cardPile.childNodes[get.rand(0, player.countCards("h") - 2)];
				};
			}
			/*if (get.type2(trigger.card) == "basic") player.draw();
			if (get.suit(trigger.card) == "heart") {
				player.gain(get.cards(2, true), "gain2", false);
				var { result: result } = await player.chooseCard("he", true, 2, "选择两张牌洗入牌堆")
					.set('ai', function (card) {
						return 8 - get.value(card);
					});
				if (result.cards && result.cards.length > 0) {
					await player.$throw(result.cards.length, 1000);
					player.lose(result.cards, ui.cardPile).insert_index = function () {
						return ui.cardPile.childNodes[get.rand(0, player.countCards("h") - 2)];
					};
				}
			}*/
		},
	},
	"dmwc_gangzheng": {
		init: function (player) {
			player.storage.dmwc_gangzheng_clear = [];
		},
		trigger: {
			player: "gainEnd",
		},
		audio: "ext:鸽府包/audio/skill:2",
		forced: true,
		filter: function (event, player) {
			return event.source && event.source.isIn() && event.cards.length >= 1 && !player.storage.dmwc_gangzheng_clear.includes(event.source);
		},
		logTarget: "source",
		async content(event, trigger, player) {
			player.draw();
			player.markAuto("dmwc_gangzheng_clear", [trigger.source]);
			player.addTempSkill("dmwc_gangzheng_clear");
			var { result: result } = await player.chooseCard('he', true, trigger.cards.length, '请选择【' + trigger.cards.length + '】张牌并交给【' + get.translation(trigger.source) + '】')
				.set('ai', function (card) {
                    var evt = _status.event.getParent();
                    if (get.attitude(_status.event.player, evt.player) > 0) {
                        return 8 - get.value(card);
                    }
                    return -1;
				});
			if (result.cards && result.cards.length > 0) {
				await player.give(result.cards, trigger.source);
			}
		},
		subSkill: {
			clear: {
				onremove: function (player) {
					player.storage.dmwc_gangzheng_clear = [];
				},
				sourceSkill: "dmwc_qinglv",
				sub: true,
			},
		},
	},
	"dmwc_qinglv": {
		init: function (player) {
			player.storage.dmwc_qinglv_clear = [];
			player.storage.dmwc_qinglv_cleard = [];
		},
		trigger: {
			player: "useCardToPlayered",
		},
		frequent: true,
		audio: "ext:鸽府包/audio/skill:2",
		filter(event, player) {
			return event.target.countCards("he") >= 2 && !player.storage.dmwc_qinglv_cleard.includes(event.target);
		},
		async content(event, trigger, player) {
			player.markAuto("dmwc_qinglv_cleard", [trigger.target]);
			player.addTempSkill("dmwc_qinglv_cleard");
			var { result: result } = await trigger.target.chooseCard('he', 2, `是否交给【${get.translation(player)}】两张牌？`)
				.set('ai', function (card) {
                    var evt = _status.event.getParent();
                    if (get.attitude(_status.event.player, evt.player) > 0) {
                        return 8 - get.value(card);
                    }
                    return -1;
				});
			if (result.cards && result.cards.length > 0) {
				await trigger.target.give(result.cards, player);
			} else {
				await player.markAuto("dmwc_qinglv_clear", [trigger.target]);
				await player.addTempSkill("dmwc_qinglv_clear");
			}
		},
		subSkill: {
			clear: {
				trigger: {
					player: "useCard",
				},
				silentForce: true,
				async content(event, trigger, player) {
					trigger.directHit.addArray(
						game.filterPlayer(function (current) {
							return player.storage.dmwc_qinglv_clear.includes(current);
						})
					);
				},
				ai: {
					"directHit_ai": true,
					skillTagFilter(player, tag, arg) {
						return player.storage.dmwc_qinglv_clear.includes(arg.target);
					},
				},
				onremove: function (player) {
					player.storage.dmwc_qinglv_clear = [];
				},
				sourceSkill: "dmwc_qinglv",
				sub: true,
			},
			cleard: {
				onremove: function (player) {
					player.storage.dmwc_qinglv_cleard = [];
				},
				sourceSkill: "dmwc_qinglv",
				sub: true,
			},
		},
	},
	"dmwc_guchen": {
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha' && !player.hasFriend()) return num + 1;
			},
		},
		trigger: {
			player: "drawBegin",
		},
		audio: "ext:鸽府包/audio/skill:2",
		frequent: true,
		filter: function (event, player) {
			return !player.hasFriend() && (event.num > 0 || event.cards.length > 0);
		},
		async content(event, trigger, player) {
			trigger.num++;
		},
	},
	"dmwc_hengyi": {
		init: function (player) {
			player.storage.dmwc_hengyi = [];
		},
		trigger: {
			global: "useCardAfter",
		},
		frequent: true,
		filter(event) {
			if(!event.card || !event.targets) return false;
			return event.targets.length > 1;
		},
		async content(event, trigger, player) {
			const targets = await player.chooseTarget(
				get.prompt("dmwc_hengyi"),
			    "衡议：请选择【" + get.translation(trigger.card) + "】中的一个目标并对其造成一点伤害，然后其在本回合结束阶段恢复一点体力",
				function(card, player, target) {
					return player.storage.dmwc_hengyi_a.includes(target);
				}
			)
			.set("ai", function (target) {
				return get.attitude(_status.event.player, target) < 0;
			})
			.forResult();
			if (targets && targets.targets && targets.targets.length > 0) {
				game.broadcastAll((p) => {
					game.playAudio(`../extension/鸽府包/audio/skill/dmwc_hengyi${[1, 2].randomGet()}.mp3`);
				}, player);
				await targets.targets[0].damage(1, player);
				await player.addTempSkill("dmwc_hengyi_b");
				await player.markAuto("dmwc_hengyi", [targets.targets[0]]);
			}
		},
		group: "dmwc_hengyi_a",
		subSkill: {
			a: {
				init: function (player) {
					player.storage.dmwc_hengyi_a = [];
				},
				trigger: {
					global: "useCardToTargeted",
				},
				silentForce: true,
				filter(event, player) {
					return event.targets && event.targets.length && event.targets.length > 1;
				},
				async content(event, trigger, player) {
					player.storage.dmwc_hengyi_a = trigger.targets;
				},
				sub: true,
			},
			b: {
				trigger:{
					global: "phaseJieshuBegin",
				},
				silentForce: true,
				filter(event, player) {
					return player.storage.dmwc_hengyi.length > 0;
				},
				async content(event, trigger, player) {
					player.storage.dmwc_hengyi_a = trigger.targets;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (player.storage.dmwc_hengyi.includes(list[i])) {
							list[i].recover();
						}
					}
				},
				onremove: function (player) {
					player.storage.dmwc_hengyi = [];
				},
				sub: true,
			},
		},
	},
	"dmwc_huchu": {
		trigger: {
			global: "damageBegin",
		},
		audio: "ext:鸽府包/audio/skill:2",
		round: 1,
		filter(event) {
			return event.player.isAlive;
		},
		"prompt2": function (event, player, skill) {
			var list = game.filterPlayer(function (current) {
				return (!game.hasPlayer(function (current2) { return current2.hp < current.hp; }));
			});
			if (list.length && list.includes(event.player)) {
				return '是否令【' + get.translation(event.player) + '】摸两张牌，并防止此次受到的伤害？';
			} else {
				return '是否令【' + get.translation(event.player) + '】摸两张牌？';
			}
		},
		check: function (event, player) {
			return get.attitude(player, event.player) > 0;
		},
		async content(event, trigger, player) {
			await  trigger.player.draw(2);
			var list = game.filterPlayer(function (current) {
				return (!game.hasPlayer(function (current2) { return current2.hp < current.hp; }));
			});
			if (list.length && list.includes(trigger.player)) {
				trigger.cancel();
				player.line(trigger.playe);
			}
		},
	},
	"dmwc_zhitui": {
		trigger: {
			player: "phaseZhunbei",
		},
		audio: "ext:鸽府包/audio/skill:2",
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		content() {
			"step 0"
			player.discard(player.getCards("j"));
			player.addTempSkill("dmwc_zhitui_a");
			game.broadcastAll(function (player) {
				player.node.avatar.setBackgroundImage(`../extension/鸽府包/image/character/yongchang/dmwc_cyq_yc.jpg`);
			}, player);
			player.chooseUseTarget("wugu", true);
			player.clearSkills();
			"step 1"
			player.addTempSkill("dmwc_zhitui_a");
		},
		subSkill: {
			a: {
				trigger: {
					source: "damageBegin1",
				},
				silentForce: true,
				async content(event, trigger, player) {
					trigger.num++;
				},
				sub: true,
			},
		},
	},
	"dmwc_jiaokou": {
		init: function (player) {
			player.storage.dmwc_jiaokou_clear = [];
			player.storage.dmwc_jiaokou_ban = [];
		},
		trigger: {
			player: "useCardToPlayered",
		},
		audio: "ext:鸽府包/audio/skill:2",
		filter(event, player) {
			if (event.card.name !== "sha") return false;
			const record = player.storage.dmwc_jiaokou_clear || [];
			return record.length < 2;
		},
		async content(event, trigger, player) {
			const target = event.target || trigger.target;
			if (!target) return;
			let lockParity;
			if (player.storage.dmwc_jiaokou_clear.length < 1) {
				const delList = ["奇数","偶数","取消"];
				const result = await player.chooseControl(...delList)
				.set("prompt","是否选择一种奇偶数，令目标本回合不可使用此点数的牌，然后你获得两张对应奇偶点数的牌？")
				.set("ai",()=>0)
				.forResult();
				let resIndex = result.index;
				if (resIndex == 2) return;
				lockParity = resIndex == 0 ? "odd" : "even";
				player.storage.dmwc_jiaokou_clear = [lockParity];
			} else {
				const old = player.storage.dmwc_jiaokou_clear[0];
				lockParity = old == "odd" ? "even" : "odd";
				player.storage.dmwc_jiaokou_clear = ["odd", "even"];
			}
			player.addTempSkill("dmwc_jiaokou_clear");
			if (!target.hasSkill("dmwc_jiaokou_ban")) {
				target.storage.dmwc_jiaokou_ban = [lockParity];
			} else {
				target.storage.dmwc_jiaokou_ban = player.storage.dmwc_jiaokou_clear;
			}
			target.addTempSkill("dmwc_jiaokou_ban");
			let cards = [];
			const num = 2;
			const filter = lockParity == "odd" ? c => get.number(c) % 2 == 1 : c => get.number(c) % 2 == 0;
			while (cards.length < num) {
				const card = get.cardPile((card2) => filter(card2) && !cards.includes(card2), null, "random");
				if (card) {
					cards.push(card);
				} else {
					break;
				}
			}
			if (cards.length) {
				await player.gain(cards);
			}
		},
		subSkill: {
			clear: {
				onremove: function (player) {
					player.storage.dmwc_jiaokou_clear = [];
				},
				sourceSkill: "dmwc_jiaokou",
				sub: true,
			},
			ban: {
				charlotte: true,
				mark: true,
				marktext: "禁",
				intro: {
					content(storage) {
						if (!storage || storage.length == 0) return "无封锁";
						if (storage.includes("odd") && storage.includes("even")) {
							return "本回合不可使用奇数牌或偶数牌";
						}
						if (storage.includes("odd")) {
							return "本回合不可使用奇数牌";
						}
						if (storage.includes("even")) {
							return "本回合不可使用偶数牌";
						}
						return "无封锁";
					}
				},
				onremove(player) {
					player.storage.dmwc_jiaokou_ban = [];
				},
				mod: {
					cardEnabled(card, player) {
						const storage = player.getStorage("dmwc_jiaokou_ban");
						if (!storage || storage.length == 0) return true;
						const hes = player.getCards("hes"),
							cards = [card];
						if (Array.isArray(card.cards)) {
							cards.addArray(card.cards);
						}
						let num = get.number(card);
						if (cards.containsSome(...hes) && ((storage.includes("odd") && num % 2 == 1) || (storage.includes("even") && num % 2 == 0))) {
							return false;
						}
					},
					cardSavable(card, player) {
						const storage = player.getStorage("dmwc_jiaokou_ban");
						if (!storage || storage.length == 0) return true;
						const hes = player.getCards("hes"),
							cards = [card];
						if (Array.isArray(card.cards)) {
							cards.addArray(card.cards);
						}
						let num = get.number(card);
						if (cards.containsSome(...hes) && ((storage.includes("odd") && num % 2 == 1) || (storage.includes("even") && num % 2 == 0))) {
							return false;
						}
					},
				},
				sub: true,
				sourceSkill: "dmwc_jiaokou",
			},
		},
	},
	"dmwc_panfu": {
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		usable: 1,
		filterCard: true,
		selectCard: [1,Infinity],
		allowChooseAll: true,
		discard: false,
		lose: false,
		delay: 0,
		filterTarget(card, player, target) {
			return player != target;
		},
		check(card) {
			if (ui.selected.cards.length > 0) {
				const selectedSuits = ui.selected.cards.map(c => get.suit(c));
				const currentSuit = get.suit(card);
				if (selectedSuits.includes(currentSuit)) {
					return -1;
				}
			}
			const player = get.owner(card);
			const target = ui.selected.targets[0];
			if (target) {
				if (get.attitude(player, target) < 0) {
					return -1;
				}
			}
			if (ui.selected.cards.length && ui.selected.cards[0].name == "du") {
				return 0;
			}
			if (!ui.selected.cards.length && card.name == "du") {
				return 20;
			}
			const evt2 = _status.event.getParent();
			let num = 0;
			player.getHistory("lose", (evt) => {
				if (evt.getParent().skill == "rende" && evt.getParent(3) == evt2) {
					num += evt.cards.length;
				}
			});
			if (player.hp == player.maxHp || num > 1 || player.countCards("h") <= 1) {
				if (ui.selected.cards.length) {
					return -1;
				}
				const players = game.filterPlayer();
				for (let i = 0; i < players.length; i++) {
					if (players[i].hasSkill("haoshi") && !players[i].isTurnedOver() && !players[i].hasJudge("lebu") && get.attitude(player, players[i]) >= 3 && get.attitude(players[i], player) >= 3) {
						return 11 - get.value(card);
					}
				}
				if (player.countCards("h") > player.hp) {
					return 10 - get.value(card);
				}
				if (player.countCards("h") > 2) {
					return 6 - get.value(card);
				}
				return -1;
			}
			return 10 - get.value(card);
		},
		async content(event, trigger, player) {
			let count = event.cards.length;
			player.storage.dmwc_panfu_parity = count % 2;
			event.target.storage.dmwc_panfu_parity = count % 2;
			event.target.addTempSkill('dmwc_panfu_a');
			player.addTempSkill('dmwc_panfu_a');
			player.give(event.cards, event.target);
		},
		subSkill: {
			a: {
				trigger: {
					player: "useCardAfter",
				},
				forced:true,
				audio: "ext:鸽府包/audio/skill:2",
				filter(event, player) {
					if (get.number(event.card) % 2 != player.storage.dmwc_panfu_parity) return false;
					return typeof get.number(event.card) == "number";
				},
				async content(event, trigger, player) {
					player.draw();
				},
				onremove: function (player) {
					player.storage.dmwc_panfu_parity = [];
				},
				sub: true,
			},
		},
	},
	"dmwc_dangyuan": {
		mark: true,
		intro: {
			mark(dialog, storage, player) {
				dialog.addText("当前回合摸牌弃牌情况");
				let data = player.storage.dmwc_dangyuan_a || [[], []];
				let players = data[0];
				let counts = data[1];
				game.filterPlayer().forEach(p => {
					let index = players.indexOf(p);
					let num = index !== -1 ? counts[index] : 0;
					dialog.addText(get.translation(p) + "：" + num + " 张");
				});
			},
		},
		trigger: {
			player: "dmwc_dangyuan_aAfter",
		},
		"prompt2": function (event, player, skill) {
			return "是否令【" + get.translation(_status.currentPhase) + "】摸一张牌？";
		},
		frequent: true,
		filter: function (event, player) {
			let data = player.storage.dmwc_dangyuan_a || [[], []];
			let players = data[0];
			let counts = data[1];
			return game.hasPlayer(p => {
				let i = players.indexOf(p);
				return i !== -1 && counts[i] >= 4;
			});
		},
		async content(event, trigger, player) {
			event.count = 0;
			let data = player.storage.dmwc_dangyuan_a || [[], []];
			let players = data[0];
			let counts = data[1];
			for (let i = 0; i < players.length; i++) {
				if (counts[i] >= 4) {
					counts[i] -= 4;
					event.count++;
				}
			}
			let hasMore = game.hasPlayer(p => {
				let i = players.indexOf(p);
				return i !== -1 && counts[i] >= 4;
			});
			if (event.count > 0) {
				let result = await player.chooseBool("是否令【" + get.translation(_status.currentPhase) + "】摸一张牌？")
					// .set("frequentSkill", "dmwc_dangyuan")
					.forResult();
				if (result?.bool) {
					game.broadcastAll((p) => {
						game.playAudio(`../extension/鸽府包/audio/skill/dmwc_dangyuan${[1, 2].randomGet()}.mp3`);
					}, player);
					await _status.currentPhase.draw(1);
				}
			}
			if (hasMore) {
				var next = game.createEvent('dmwc_dangyuan');
				next.player = player;
				next.setContent(lib.skill.dmwc_dangyuan.content);
			}
		},
		ai:{
			result: {
				target: 1,
			},
		},
		group: "dmwc_dangyuan_a",
		subSkill: {
			a: {
				init: function (player) {
					player.storage.dmwc_dangyuan_a = [[], []];
				},
				trigger: {
					global: ["drawBegin", "discardBegin"],
				},
				forced: true,
				silent: true,
				popup: false,
				filter: function (event, player) {
					return event.num > 0 || event.cards.length > 0;
				},
				async content(event, trigger, player) {
					player.addTempSkill("dmwc_dangyuan_clear");
					let data = player.storage.dmwc_dangyuan_a;
					let players = data[0];
					let counts = data[1];
					let tarPlayer = trigger.player;
					if(event.triggername == 'drawBegin'){
						var addNum = trigger.num || 1;
					} else {
						var addNum = trigger.cards.length || 1;
					}
					let idx = players.indexOf(tarPlayer);
					if (idx == -1) {
						players.push(tarPlayer);
						counts.push(addNum);
					} else {
						counts[idx] += addNum;
					}
				},
				sub: true,
			},
			clear: {
				onremove: function (player) {
					player.storage.dmwc_dangyuan_a = [[], []];
				},
				sourceSkill: "dmwc_dangyuan",
				sub: true,
			},
		},
	},
	"dmwc_kuiji": {
		enable: "phaseUse",
		usable: 1,
		audio: "ext:鸽府包/audio/skill:2",
		filterTarget(card, player, target) {
			return player != target && target.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			const { target, name } = event;
			const result = await player.choosePlayerCard(target, "h", [1, 4], true).forResult();
			const { cards: shown } = result;
			if(!shown.length) return;
			await player.showCards(shown, `${get.translation(player)}展示了${get.translation(target)}的手牌`);
			let red = 0, black = 0;
			shown.forEach(c => {
				if(get.color(c) == "red") red++;
				else black++;
			});
			if(red > black) {
				await target.damage();
				let allRedHand = target.getCards("he").filter(c=>
					get.color(c) == "red" && !shown.includes(c)
				);
				if(allRedHand.length) {
					await target.discard(allRedHand);
				}
			} else if(black > red) {
				let num = shown.length;
				await target.draw(num);
				if(num) await player.gainPlayerCard(target, "h", num, true);
			}
		},
	},
	"dmwc_bijian": {
		init: function (player) {
			player.storage.dmwc_bijian_a = 0;
			player.storage.dmwc_bijian_b = 0;
			player.storage.dmwc_bijian_c = 0;
		},
		trigger: {
			player: "damageBegin",
			source: "damageBegin",
			target: "useCardToTargeted",
		},
		audio: "ext:鸽府包/audio/skill:2",
		frequent: true,
		filter(event, player, name) {
			if (name == 'damageBegin' && event.source) {
				if (event.source == player) {
					return player.storage.dmwc_bijian_b < 1 && event.player.hp < player.hp;
				} else {
					return player.storage.dmwc_bijian_a < 1 && event.source.hp > player.hp;
				}
			}
			if (name == 'useCardToTargeted') {
				return player.storage.dmwc_bijian_c < 1 && event.player.hp == player.hp;
			}
		},
		async content(event, trigger, player) {
			if (event.triggername == 'damageBegin' && trigger.source) {
				if (trigger.source == player) {
					trigger.num++;
					player.storage.dmwc_bijian_b = 1;
				} else {
					trigger.num--;
					player.storage.dmwc_bijian_a = 1;
				}
			}
			if (event.triggername == 'useCardToTargeted') {
				player.draw();
				trigger.player.draw();
				player.storage.dmwc_bijian_c = 1;
			}
			player.addTempSkill("dmwc_bijian_clear");
		},
		subSkill: {
			clear: {
				onremove: function (player) {
					player.storage.dmwc_bijian_a = 0;
					player.storage.dmwc_bijian_b = 0;
					player.storage.dmwc_bijian_c = 0;
				},
				sourceSkill: "dmwc_bijian",
				sub: true,
			},
		},
	},
	"dmwc_guxian": {
		init: function (player) {
			player.storage.dmwc_guxian_clear = 0;
		},
		enable: "phaseUse",
		usable(skill, player) {
			return 1 + player.countMark("dmwc_guxian_clear");
		},
		audio: "ext:鸽府包/audio/skill:2",
		async content(event, trigger, player) {
			event.count = 0;
			var list = game.filterPlayer();
			var maxHand = 0;
			for (var i = 0; i < list.length; i++) {
				if (list[i].countCards("h") > maxHand) {
					maxHand = list[i].countCards("h");
				}
			}
			var targets = [];
			for (var j = 0; j < list.length; j++) {
				if (list[j].countCards("h") == maxHand) {
					event.count++;
					var delNum = Math.ceil(list[j].countCards("h") / 2);
					await list[j].chooseToDiscard(delNum, true, "h");
					var drawNum = Math.floor(Math.random() * (delNum + 1));
					if (drawNum > 0) list[j].draw(drawNum);
				}
			}
			if (event.count > 1) {
				player.storage.dmwc_guxian_clear = 1;
				player.addTempSkill("dmwc_guxian_clear");
			}
		},
		subSkill: {
			clear: {
				onremove: function (player) {
					player.storage.dmwc_guxian_clear = 0;
				},
				sourceSkill: "dmwc_bijian",
				sub: true,
			},
		},
	},
	"dmwc_yudi": {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		audio: "ext:鸽府包/audio/skill:2",
		forced: true,
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		content() {
			player.draw(game.countGroup());
		},
		group: ["dmwc_yudi_a", "dmwc_yudi_b", "dmwc_yudi_c", "dmwc_yudi_d"],
		subSkill: {
			a: {
				init: function (player) {
					player.storage.dmwc_yudi_a = 0;
				},
				trigger: {
					player: "gainAfter",
					global: "loseAsyncAfter",
				},
				silentForce: true,
				filter(event, player) {
					if (!event.getg(player).some(card => get.position(card) == "h" && get.owner(card) == player)) {
						return false;
					}
					return _status.currentPhase != player;
				},
				async content(event, trigger, player) {
					player.addGaintag(trigger.getg(player).filter(card => get.position(card) == "h" && get.owner(card) == player), "dmwc_yudi");
				},
				sub: true,
			},
			b: {
				hiddenCard(player, name) {
					return player.countCards("hes") > 0 && lib.inpile.includes(name);
				},
				enable: "chooseToUse",
				filter(event, player) {
					return player.countCards("hes", c => c.hasGaintag('dmwc_yudi')) > 0;
				},
				chooseButton: {
					dialog(event, player) {
						var list = [];
						for (var name of lib.inpile) {
							if (get.type(name) == "trick") {
								list.push([get.translation(get.type(name)), "", name]);
							}
						}
						return ui.create.dialog("裕邸", [list, "vcard"]);
					},
					filter(button, player) {
						return _status.event.getParent().filterCard({ name: button.link[2] }, player, _status.event.getParent());
					},
					check(button) {
						let player = _status.event.player;
						return _status.event.getParent().type == "phase" ? player.getUseValue() : 1;
					},
					backup(links, player) {
						return {
							popname: true,
							position: "hes",
							viewAs: { 
								name: links[0][2],
								storage: {
									dmwc_yudi_b: true,
								},
							},
							audio: "ext:鸽府包/audio/skill:2",
							filterCard(card, player) {
								return card.hasGaintag('dmwc_yudi');
							},
							onuse(result, player) {
								player.storage.dmwc_yudi_c = 0;
							},
						};
					},
					prompt(links, player) {
						return "将回合外获得的牌当做 " + get.translation(links[0][2]) + " 使用";
					}
				},
				ai: {
					order: 4,
					threaten: 1.8,
					skillTagFilter(player, tag, arg) {
						return player.countCards("hes", c => c.hasGaintag('dmwc_yudi')) > 0;
					}
				},
				sub: true,
			},
			c: {
				init: function (player) {
					player.storage.dmwc_yudi_c = 0;
					player.storage.dmwc_yudi_d = 0;
				},
				trigger: {
					global: "useCardToTargeted",
				},
				silentForce: true,
				filter: function (event, player) {
					return event.card.storage && event.card.storage.dmwc_yudi_b && player.countMark("dmwc_yudi_c") < 1;
				},
				async content(event, trigger, player) {
					player.storage.dmwc_yudi_c++;
					if (player.countMark("dmwc_yudi_c")) {
						const next = player.judge(function(card) {
							const color2 = get.color(card);
							if (color2 == "black") {
								return -2;
							}
							return 0;
						});
						next.judge2 = function(result) {
							return result.bool == false;
						};
						const { color } = await next.forResult();
						if (color == "black") {
							var list = game.filterPlayer();
							for (var i = 0; i < list.length; i++) {
								trigger.targets.remove(list[i]);
								trigger.getParent().triggeredTargets1.remove(list[i]);
							}
							trigger.untrigger();
							trigger.targets.push(player);
							game.broadcastAll((p) => {
								game.playAudio(`../extension/鸽府包/audio/skill/dmwc_yudi_c${[1, 2].randomGet()}.mp3`);
							}, player);
							await player.storage.dmwc_yudi_d++;
							await player.chooseToDiscard(2, true, "he");
						} else {
							player.addTempSkill("dmwc_yudi_e");
						}
					}
				},
				sub: true,
			},
			d: {
				trigger: {
					global: "phaseAfter",
				},
				silentForce: true,
				filter: function (event, player) {
					return player.countMark("dmwc_yudi_d") > 0;
				},
				async content(event, trigger, player) {
					var cards = game.cardsGotoOrdering(get.cards(player.countMark("dmwc_yudi_d"))).cards;
					player.gain(cards).gaintag.add('dmwc_yudi');
					player.storage.dmwc_yudi_d = 0;
				},
				sub: true,
			},
			e: {
				trigger: {
					global: "recoverBefore",
				},
				silentForce: true,
				content: function () {
					trigger.cancel();
				},
				sub: true,
			},
		},
	},
	"dmwc_xunjin": {
		trigger: {
			player: "dying",
		},
		audio: "ext:鸽府包/audio/skill:2",
		"prompt2": "是否将所有角色区域内的红色牌移出游戏，然后所有角色将手牌随机弃置到与你一致，因此弃置牌的角色流失一点体力，若有角色因此流失体力你死亡？",
		async content(event, trigger, player) {
			event.count = 0;
			const filter = card => ["heart", "diamond"].includes(card.suit);
			for (const target of game.filterPlayer()) {
				const sishis = target.getCards("hej", filter);
				if (sishis.length) {
					target.$throw(sishis);
					game.log(sishis, "被移出了游戏");
					await target.lose(sishis, ui.special);
				}
			}
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (list[i].countCards("h") > player.countCards("h")) {
					list[i].discard(list[i].getDiscardableCards(list[i], "h").randomGets(list[i].countCards("h") - player.countCards("h")));
					list[i].loseHp();
					event.count++;
				}
			}
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if(list[i].hasMark("dulie")) list[i].removeMark("dulie", list[i].countMark("dulie"));
			}
			if(event.count > 0) await player.die();
		},
		group: "dmwc_xunjin_a",
		subSkill: {
			a: {
				init: function (player) {
					player.storage.dmwc_xunjin_U = 0;
					player.storage.dmwc_xunjin_D = 0;
				},
				trigger: {
					player: ["useCardAfter", "damageEnd"],
				},
				audio: "ext:鸽府包/audio/skill:2",
				frequent: true,
				filter(event, player, name) {
					if (name == 'useCardAfter') {
						return event.card.isCard && get.info(event.card).notarget && player.countMark("dmwc_xunjin_U") < 1;
					} else {
						return event.num > 0 && player.countMark("dmwc_xunjin_D") < 1;
					}
				},
				async content(event, trigger, player) {
					if (event.triggername == 'useCardAfter') {
						player.storage.dmwc_xunjin_U = 1;
					} else {
						player.storage.dmwc_xunjin_D = 1;
					}
					player.draw();
					player.addTempSkill("dmwc_xunjin_clear");
				},
				sub: true,
			},
			clear: {
				onremove: function (player) {
					player.storage.dmwc_xunjin_U = 0;
					player.storage.dmwc_xunjin_D = 0;
				},
				sourceSkill: "dmwc_xunjin",
				sub: true,
			},
		},
	},
	"dmwc_tiaobian": {
		global: "dmwc_tiaobian_global",
		group: "dmwc_tiaobian_c",
		subSkill: {
			global: {
				init: function (player) {
					player.storage.dmwc_tiaobian = 0;
				},
				enable: "phaseUse",
				filter(event, player) {
					var num = game.countPlayer(function (current) {
						return current.hasSkill("dmwc_tiaobian");
					});
					return player.countMark("dmwc_tiaobian") < 1 && num > 0;
				},
				filterTarget(card, player, target) {
					return target.hasSkill("dmwc_tiaobian");
				},
				selectTarget() {
					if (game.countPlayer((current) => {
						return current.hasSkill("dmwc_tiaobian");
					}) > 1) {
						return 1;
					}
					return -1;
				},
				prompt() {
					const player = get.player(), targets = game.filterPlayer((current) => {
						return current.hasSkill("dmwc_tiaobian");
					});
					let list = get.translation(targets);
					if (targets.length > 1) {
						list += "】中的一人";
					}
					if (targets.length == 1 && targets[0] == player) {
						return `你可获得〖辅政〗并摸两张牌，然后本局游戏限x次，你可将一张红色牌当任意基本牌使用（x为场上拥有〖辅政〗的角色数）。`;
					}
					return `你可获得〖辅政〗并令【${list}摸两张牌，然后本局游戏限x次，你可将一张红色牌当任意基本牌使用（x为场上拥有〖辅政〗的角色数）。`;
				},
				async content(event, trigger, player) {
					game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/dmwc_tiaobian${[1, 2].randomGet()}.mp3`);
					}, player);
					player.storage.dmwc_tiaobian = 1;
					player.addSkill("dmwc_fuzheng");
					player.addSkill("dmwc_tiaobian_b");
					event.target.draw(2);
				},
				ai: {
					order: 11,
					result: {
						player(player, target) {
							if (game.countPlayer((current) => {
								return current.hasSkill("dmwc_tiaobian") && get.attitude(player, current);
							}) > 1) {
								return 2;
							}
						},
					},
				},
				sub: true,
			},
			b: {
				init: function (player) {
					player.storage.dmwc_tiaobian_b = 0;
				},
				enable: ["chooseToUse","chooseToRespond"],
				filter(event, player) {
					var num = game.countPlayer(function (current) {
						return current.hasSkill("dmwc_fuzheng");
					});
					if (event.type == "wuxie" || player.countMark("dmwc_tiaobian_b") >= num) {
						return false;
					}
					for (var name of lib.inpile) {
						if (get.type(name) != "basic") {
							continue;
						}
						if (player.hasCard({ color: "red" }, "hes")) {
							if (event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) {
								return true;
							}
							if (name == "sha") {
								for (var nature of lib.inpile_nature) {
									if (event.filterCard(get.autoViewAs({ name, nature }, "unsure"), player, event)) {
										return true;
									}
								}
							}
						}
					}
					return false;
				},
				chooseButton: {
					dialog(event, player) {
						var list = [];
						for (var name of lib.inpile) {
							if (get.type(name) != "basic") {
								continue;
							}
							if (player.hasCard({ color: "red" }, "hes")) {
								if (event.filterCard(get.autoViewAs({ name }, "unsure"), player, event)) {
									list.push(["基本", "", name]);
								}
								if (name == "sha") {
									for (var nature of lib.inpile_nature) {
										if (event.filterCard(get.autoViewAs({ name, nature }, "unsure"), player, event)) {
											list.push(["基本", "", name, nature]);
										}
									}
								}
							}
						}
						const dialog = ui.create.dialog("条鞭", [list, "vcard"], "hidden");
						dialog.direct = true;
						return dialog;
					},
					check(button) {
						return 1;
					},
					backup(links, player) {
						return {
							audio: "ext:鸽府包/audio/skill:2",
							viewAs: {
								name: links[0][2],
								nature: links[0][3],
							},
							filterCard: { color: "red" },
							position: "he",
							popname: true,
							check(card) {
								return 6 / Math.max(1, get.value(card));
							},
							precontent() {
								player.storage.dmwc_tiaobian_b++;
							},
						};
					},
					prompt(links, player) {
						var card = {
							name: links[0][2],
							nature: links[0][3],
							isCard: true,
						};
						return "将一张红色牌当做" + get.translation(card) + "使用或打出";
					},
				},
				hiddencards: true,
				hiddencardFilter(card, player) {
					return card.color == "red" && get.type(card) == "basic";
				},
				ai: {
					respondSha: true,
					respondShan: true,
					skillTagFilter(player, tag) {
						return player.hasCard({ color: "red", type: "basic" }, "hes");
					},
					order: 9,
					result: {
						player(player) {
							if (_status.event.dying) {
								return get.attitude(player, _status.event.dying);
							}
							return 1;
						},
					},
				},
				getFilter(name, player) {
					return { color: "red" };
				},
				sub: true,
			},
			c: {
				trigger: {
					player: "damageBegin",
				},
				filter: function (event,player){
					return event.source != player && event.source.hasSkill("dmwc_fuzheng");
				},
				silentForce: true,
				content: function (){
					trigger.source.removeSkill("dmwc_fuzheng");
				},
				sub: true,
			},
		},
	},
	"dmwc_fuzheng": {
		trigger:{
			player:"phaseJieshuBegin",
		},
		audio: "ext:鸽府包/audio/skill:2",
		"prompt2": function (event, player, skill) {
			var player = _status.event.player;
			var list = game.filterPlayer();
			var count = 0;
			for (var i = 0; i < list.length; i++) {
				var num = list[i].countCards("h");
				if (num > count) {
					count = num;
				}
			}
			var minNum = Math.min(count, 10);
			return '是否将手牌补至【' + minNum + '】张牌，然后流失一点体力？';
		},
		check: function (button) {
            var player = _status.event.player;
			var list = game.filterPlayer();
			var count = 0;
			for (var i = 0; i < list.length; i++) {
				var num = list[i].countCards("h");
				if (num > count) {
					count = num;
				}
			}
			var minNum = Math.min(count, 10);
			return minNum - player.countCards("h") - 2 >= 0;
		},
		async content(event, trigger, player) {
			var list = game.filterPlayer();
			var count = 0;
			for (var i = 0; i < list.length; i++) {
				var num = list[i].countCards("h");
				if (num > count) {
					count = num;
				}
			}
			var minNum = Math.min(count, 10);
			player.drawTo(minNum);
			player.loseHp(1);
		},
	},
	"dmwc_zhoumi": {
		init: function (player) {
			player.storage.dmwc_zhoumi = 0;
		},
		mod: {
			cardname(card, player) {
				if (_status.currentPhase != player && get.color(card)=='red') {
					return "wuxie";
				}
			},
		},
		trigger: {
			player: "dying",
		},
		"prompt2": function (event, player, skill) {
			const num = game.getAllGlobalHistory("everything", evt => {
				if (evt.name != "dying" || evt.player != player) {
					return false;
				}
				return true;
			}).length;
			return '是否弃置【' + num + '】张牌并将体力恢复至1点，然后摸【' + (num + 1) + '】张牌？';
		},
		filter(event, player, name) {
			const num = game.getAllGlobalHistory("everything", evt => {
				if (evt.name != "dying" || evt.player != player) {
					return false;
				}
				return true;
			}).length;
			return num <= player.countCards("he");
		},
		async content(event, trigger, player) {
			const num = game.getAllGlobalHistory("everything", evt => {
				if (evt.name != "dying" || evt.player != player) {
					return false;
				}
				return true;
			}).length;
			const discard = await player.chooseCard("请弃置【" + num + "】张牌", num, true, "he").forResult();
			if(!discard.bool) {
				return;
			} else {
				game.broadcastAll((p) => {
					game.playAudio(`../extension/鸽府包/audio/skill/dmwc_zhoumi${[1, 2].randomGet()}.mp3`);
				}, player);
			}
			await player.discard(discard.cards);
			await player.recover(1 - player.hp);
			await player.draw(num + 1);
		},
	},
	"dmwc_chujian": {
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		usable: 1,
		filterTarget(card, player, target) {
			return target !== player && target.countCards("h") > 0;
		},
		filterCard: true,
		selectCard: [1, Infinity],
		lose: false,
		delay: false,
		prompt:function(links,player){
			return "可选择一名其他角色，然后你与其各展示任意张牌，总点数小的角色获得本次展示的牌；总花色数小的受到x点伤害（x为双方花色数之差）";
		},
		async content(event, trigger, player) {
			const target = event.target;
			const cards = event.cards;
			const choose = await target.chooseCard("请选择任意张手牌进行展示，总点数小的角色获得本次展示的牌；总花色数小的受到x点伤害（x为双方花色数之差）", [1, Infinity], "h", true, "allowChooseAll").forResult();
			if (!choose.bool) return;
			const show = choose.cards;
			await target.showCards(show);
			await player.showCards(cards);
			const getTotalPoint = (cardList, owner) => {
				return cardList.reduce((sum, c) => sum + get.number(c, owner), 0);
			};
			const getSuitCount = (cardList) => {
				let suits = [];
				for (let i of cardList) {
					if (!suits.includes(i.suit)) {
						suits.push(i.suit);
					}
				}
				return suits.length;
			};
			const tarPoint = getTotalPoint(show, target);
			const selfPoint = getTotalPoint(cards, player);
			const tarSuit = getSuitCount(show);
			const selfSuit = getSuitCount(cards);
			if (tarPoint < selfPoint) {
				await player.give(cards, target);
				await target.give(show, target);
			} else if (selfPoint < tarPoint) {
				await player.give(cards, player);
				await target.give(show, player);
			}
			const suitDiff = Math.abs(selfSuit - tarSuit);
			if (suitDiff > 0) {
				if (tarSuit < selfSuit) {
					await target.damage(suitDiff);
				} else if (selfSuit < tarSuit) {
					await player.damage(suitDiff);
				}
			}
		},
		ai: {
			order: 8,
			target: {
				enemy: 1,
				friend: -1
			}
		},
	},
	"gzt_chudu": {
		global: "gzt_chudu_a",
		subSkill: {
			a: {
				init: function (player) {
					player.storage.gzt_weixing_0 = ["gzt_weixing_1", "gzt_weixing_2", "gzt_weixing_3", "gzt_weixing_4"];
				},
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					var num = game.countPlayer(function (current) {
						return current.hasSkill("gzt_chudu");
					});
					return num > 0 && player.countCards("he") && !player.hasSkill("gzt_chudu");
				},
				filterCard: true,
				allowChooseAll: true,
				discard: false,
				lose: false,
				delay: 0,
				prompt() {
					// const player = get.player();
					const targets = game.filterPlayer(current => current.hasSkill("gzt_chudu"));
					let str = `将一张牌交给【${get.translation(targets)}】`;
					if (targets.length > 1) {
						str += "中的随机一个";
					}
					return str;
				},
				check(card) {
					return 8 - get.value(card);
				},
				async content(event, trigger, player) {
					const targets = game.filterPlayer(current => current.hasSkill("gzt_chudu"));
					if (targets.length === 0) return;
					var target = targets.randomGet();
					target.addTempSkill("gzt_weixing_clear");
					await player.give(event.cards, target);
					await player.draw();
					let delList = ["摸牌", "弃置", "伤害", "重铸", "取消"];
					const delResult = await target.chooseControl(...delList)
						.set("prompt", "黜赌：你可剔除结果中的一项")
						.set("ai", function () {
							const player = get.player();
							const attitude = get.attitude(player, target);
							if (attitude > 0) {
								return 2;
							} else {
								return 0;
							}
						})
						.forResult();
					let delIndex = delResult.index;
					if (delIndex == 0) target.storage.gzt_weixing_0.remove('gzt_weixing_1');
					if (delIndex == 1) target.storage.gzt_weixing_0.remove('gzt_weixing_2');
					if (delIndex == 2) target.storage.gzt_weixing_0.remove('gzt_weixing_3');
					if (delIndex == 3) target.storage.gzt_weixing_0.remove('gzt_weixing_4');
					if (delIndex != 4) {
						game.broadcastAll((p) => {
							game.playAudio(`../extension/鸽府包/audio/skill/gzt_chudu${[1, 2].randomGet()}.mp3`);
						}, player);
					}
					const allXings = [
						"赵","钱","孙","李","周","吴","郑","王","冯","陈",
						"褚","卫","蒋","沈","韩","杨","朱","秦","尤","许",
						"何","吕","施","张","孔","曹","严","华","金","魏",
						"陶","姜","戚","谢","邹","喻","柏","水","章","云",
						"苏","潘","葛","范","彭","郎","鲁","韦","昌","马",
						"苗","凤","花","方","俞","任","袁","柳","酆","鲍",
						"史","唐","费","廉","岑","薛","雷","贺","倪","汤",
						"滕","殷","罗","毕","郝","邬","安","常","乐","于",
						"时","傅","皮","卞","齐","康","伍","余","元","卜",
						"顾","孟","平","黄","和","穆","萧","尹","姚","邵"
					];
					let choiceList = [];
					while (choiceList.length < 5) {
						let idx = Math.floor(Math.random() * allXings.length);
						let x = allXings[idx];
						if (!choiceList.includes(x)) {
							choiceList.push(x);
						}
					}
					const result = await player
						.chooseControl(...choiceList)
						.set("prompt", "【闱赌】请选择一个姓氏（姓氏笔画越多，数值越高）")
						.set("ai", () => 0)
						.forResult();
					const chooseXing = choiceList[result.index];
					const bihuaMap = {
						"赵":12,"钱":10,"孙":6,"李":7,"周":8,"吴":7,"郑":8,"王":4,"冯":5,"陈":7,
						"褚":14,"卫":3,"蒋":12,"沈":7,"韩":12,"杨":7,"朱":6,"秦":10,"尤":4,"许":6,
						"何":7,"吕":6,"施":9,"张":7,"孔":4,"曹":11,"严":7,"华":6,"金":8,"魏":17,
						"陶":10,"姜":9,"戚":11,"谢":12,"邹":7,"喻":12,"柏":9,"水":4,"章":11,"云":4,
						"苏":7,"潘":15,"葛":12,"范":8,"彭":12,"郎":8,"鲁":12,"韦":4,"昌":8,"马":3,
						"苗":8,"凤":4,"花":7,"方":4,"俞":9,"任":6,"袁":10,"柳":9,"酆":20,"鲍":13,
						"史":5,"唐":10,"费":9,"廉":13,"岑":7,"薛":16,"雷":13,"贺":9,"倪":10,"汤":6,
						"滕":15,"殷":10,"罗":8,"毕":6,"郝":9,"邬":6,"安":6,"常":11,"乐":5,"于":3,
						"时":7,"傅":12,"皮":5,"卞":4,"齐":6,"康":11,"伍":6,"余":7,"元":4,"卜":2,
						"顾":10,"孟":8,"平":5,"黄":11,"和":8,"穆":16,"萧":11,"尹":4,"姚":9,"邵":7
					};
					game.log(player, '选择了', '#y' + choiceList[result.index] + '氏');
					const bihua = bihuaMap[chooseXing] || 8;
					const a = Math.ceil(bihua / 4);
					const b = Math.min(player.countCards("h"), a);
					let pool = [];
					if (target.storage.gzt_weixing_0.contains("gzt_weixing_1")) pool.push(1);
					if (target.storage.gzt_weixing_0.contains("gzt_weixing_2")) pool.push(2);
					if (target.storage.gzt_weixing_0.contains("gzt_weixing_3")) pool.push(3);
					if (target.storage.gzt_weixing_0.contains("gzt_weixing_4")) pool.push(4);
					if (pool.length === 0) return;
					const num = pool.randomGet();
					if (num == 1) {
						player.draw(a);
						target.storage.gzt_weixing_0.remove('gzt_weixing_1');
					}
					if (num == 2) {
						target.discardPlayerCard(b, true, player, 'he');
						target.storage.gzt_weixing_0.remove('gzt_weixing_2');
					}
					if (num == 3) {
						player.damage(a);
						target.storage.gzt_weixing_0.remove('gzt_weixing_3');
					}
					if (num == 4) {
						target.storage.gzt_weixing_0.remove('gzt_weixing_4');
						var { result: resultd } = await player.chooseCard([1, b], true, `请重铸【1~${b}】张手牌`, "h")
							.set('ai', function (card) {
								return 8 - get.value(card);
							});
						if (resultd.cards && resultd.cards.length > 0) {
							await player.recast(resultd.cards);
						}
					}
				},
				ai: {
					order: 4,
					threaten: 1.5,
					result: {
						player(player, target) {
							var target = game.findPlayer(function (current) {
								return current.hasSkill("gzt_chudu");
							});
							if (target) {
								return get.attitude(player, target);
							}
						},
					},
				},
				sub: true,
			},
		},
	},
	"gzt_weixing": {
		init: function (player) {
			player.storage.gzt_weixing = 0;
			player.storage.gzt_weixing_0 = ["gzt_weixing_1", "gzt_weixing_2", "gzt_weixing_3", "gzt_weixing_4"];
		},
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		filter(event, player) {
			return player.storage.gzt_weixing_0.length != 0 && player.countMark("gzt_weixing") <= player.countCards("he");
		},
		filterCard: function(card, player) {
			var player = _status.event.player;
			if(player.countMark("gzt_weixing") < 1){	
				return false;
			} else {
				return true;
			}
		},
		position: "he",
		filterTarget: true,
		selectCard: function () {
			var player = _status.event.player;
			return player.countMark("gzt_weixing");
		},
		prompt:function(links,player){
			return "你可弃置【" + player.countMark("gzt_weixing") + "】张牌并选择一名角色，该角色随机执行一些效果";
		},
		async content(event, trigger, player) {
			player.addTempSkill("gzt_weixing_clear");
			player.storage.gzt_weixing++;
			const allXings = [
				"赵","钱","孙","李","周","吴","郑","王","冯","陈",
				"褚","卫","蒋","沈","韩","杨","朱","秦","尤","许",
				"何","吕","施","张","孔","曹","严","华","金","魏",
				"陶","姜","戚","谢","邹","喻","柏","水","章","云",
				"苏","潘","葛","范","彭","郎","鲁","韦","昌","马",
				"苗","凤","花","方","俞","任","袁","柳","酆","鲍",
				"史","唐","费","廉","岑","薛","雷","贺","倪","汤",
				"滕","殷","罗","毕","郝","邬","安","常","乐","于",
				"时","傅","皮","卞","齐","康","伍","余","元","卜",
				"顾","孟","平","黄","和","穆","萧","尹","姚","邵"
			];
			let choiceList = [];
			while (choiceList.length < 5) {
				let idx = Math.floor(Math.random() * allXings.length);
				let x = allXings[idx];
				if (!choiceList.includes(x)) {
					choiceList.push(x);
				}
			}
			let target = event.targets[0];
			const result = await target
				.chooseControl(...choiceList)
				.set("prompt", "【闱赌】请选择一个姓氏（姓氏笔画越多，数值越高）")
				.set("ai", () => 0)
				.forResult();
			const chooseXing = choiceList[result.index];
			const bihuaMap = {
				"赵":12,"钱":10,"孙":6,"李":7,"周":8,"吴":7,"郑":8,"王":4,"冯":5,"陈":7,
				"褚":14,"卫":3,"蒋":12,"沈":7,"韩":12,"杨":7,"朱":6,"秦":10,"尤":4,"许":6,
				"何":7,"吕":6,"施":9,"张":7,"孔":4,"曹":11,"严":7,"华":6,"金":8,"魏":17,
				"陶":10,"姜":9,"戚":11,"谢":12,"邹":7,"喻":12,"柏":9,"水":4,"章":11,"云":4,
				"苏":7,"潘":15,"葛":12,"范":8,"彭":12,"郎":8,"鲁":12,"韦":4,"昌":8,"马":3,
				"苗":8,"凤":4,"花":7,"方":4,"俞":9,"任":6,"袁":10,"柳":9,"酆":20,"鲍":13,
				"史":5,"唐":10,"费":9,"廉":13,"岑":7,"薛":16,"雷":13,"贺":9,"倪":10,"汤":6,
				"滕":15,"殷":10,"罗":8,"毕":6,"郝":9,"邬":6,"安":6,"常":11,"乐":5,"于":3,
				"时":7,"傅":12,"皮":5,"卞":4,"齐":6,"康":11,"伍":6,"余":7,"元":4,"卜":2,
				"顾":10,"孟":8,"平":5,"黄":11,"和":8,"穆":16,"萧":11,"尹":4,"姚":9,"邵":7
			};
			game.log(target, '选择了', '#y' + choiceList[result.index] + '氏');
			const bihua = bihuaMap[chooseXing] || 8;
			const a = Math.ceil(bihua / 4);
			const b = Math.min(target.countCards("h"), a);
			let pool = [];
			if (player.storage.gzt_weixing_0.contains("gzt_weixing_1")) pool.push(1);
			if (player.storage.gzt_weixing_0.contains("gzt_weixing_2")) pool.push(2);
			if (player.storage.gzt_weixing_0.contains("gzt_weixing_3")) pool.push(3);
			if (player.storage.gzt_weixing_0.contains("gzt_weixing_4")) pool.push(4);
			if (pool.length === 0) return;
			const num = pool.randomGet();
			if (num == 1) {
				target.draw(a);
				player.storage.gzt_weixing_0.remove('gzt_weixing_1');
			}
			if (num == 2) {
				player.discardPlayerCard(b, true, target, 'he');
				player.storage.gzt_weixing_0.remove('gzt_weixing_2');
			}
			if (num == 3) {
				target.damage(a, target);
				player.storage.gzt_weixing_0.remove('gzt_weixing_3');
			}
			if (num == 4) {
				player.storage.gzt_weixing_0.remove('gzt_weixing_4');
				var { result: resultd } = await target.chooseCard([1, b], true, `请重铸【1~${b}】张手牌`, "h")
					.set('ai', function (card) {
						return 8 - get.value(card);
					});
				if (resultd.cards && resultd.cards.length > 0) {
					await target.recast(resultd.cards);
				}
			}
		},
		subSkill: {
			clear: {
				onremove: function (player) {
					player.storage.gzt_weixing_0 = ["gzt_weixing_1", "gzt_weixing_2", "gzt_weixing_3", "gzt_weixing_4"];
					player.storage.gzt_weixing = 0;
				},
				sourceSkill: "gzt_weixing",
				sub: true,
			},
		},
	},
	"gzhlb_aa": {
		enable: "phaseUse",
		forced: true,
		filterTarget: true,
		content: function () {
			target.damage(3);
			target.recover(4);
		},
	},
	"gzt_longming": {
		init: function (player) {
			player.storage.gzt_longming = 4;
			// player.storage.gzt_longming = player.hp;
		},
		banned: [],
		trigger: {
			player: ["changeHpAfter", "loseMaxHpAfter", "logSkill", "phaseZhunbei"],
		},
		audio: "ext:鸽府包/audio/skill:5",
		forced: true,
		// charlotte: true,
		filter(event, player, name) {
			if (name == 'phaseZhunbei'){
			    return true;
			} else {
				const recordHp = player.countMark("gzt_longming");
				const nowHp = player.hp;
				const maxHp = player.maxHp;
				const getHpColor = (current, max) => {
					const oneThird = max / 3;
					const twoThirds = (max * 2) / 3;
					if (current >= twoThirds) {
						return "high";
					} else if (current > oneThird) {
						return "mid";
					} else {
						return "low";
					}
				};
				const recordColor = getHpColor(recordHp, maxHp);
				const nowColor = getHpColor(nowHp, maxHp);
				return recordColor != nowColor;
			}
		},
		initList: function (player) {
			var list, skills = [];
			if (_status.connectMode) list = get.charactersOL();
			else {
				list = [];
				for (var i in lib.character) {
					if (lib.filter.characterDisabled2(i) || lib.filter.characterDisabled(i)) continue;
					list.push(i);
				}
			}
			for (var i of list) {
				for (var j of lib.character[i][3]) {
					if (j == 'gzt_longming') continue;
					var skill = lib.skill[j];
					if (!skill || skill.charlotte || skill.hiddenSkill || skill.dutySkill || lib.skill.gzt_longming.banned.contains(j)) continue;
					if (skill.ai && (skill.ai.combo || skill.ai.notemp || skill.ai.neg)) continue;
					var info = lib.translate[j + '_info'];
					if (info && info.indexOf('拼点') !== -1) continue;
					skills.push(j);
				}
			}
			return skills;
		},
		async content(event, trigger, player) {
			try {
				await new Promise(resolve => setTimeout(resolve, 10));
				player.storage.gzt_longming = player.hp;
				if (!player.hasSkill("gzt_longming_b")) player.addSkill("gzt_longming_b");
				var skills = lib.skill.gzt_longming.initList(player);
				var allLines = [];
				const blackList = [
					"line","logSkill","awakenSkill","removeSkill","markAuto", "chooseToCompare",
					"syncStorage","addMark","addSkill","addTempSkill","update",
					"removeGaintag","gainCard","tempBanSkill","hasSkillTag","useSkill",
					"storage","canUse","popup","addJudge","addTip","clearSkills",
					"judge","removeMark","chooseToPlayBeatmap","chooseCard",

					"GFBgmAndBg","GFVideo","playerBgm","GFVideo","audio","music"
				];
				skills = skills.filter(skillName => {
					const s = lib.skill[skillName];
					if (!s) return false;
					if (s.intro) return false;
					return typeof s.content === "function" || typeof s.cost === "function";
				});
				const lineSkillMap = new Map();
				function getFunctionVars(fn) {
					try {
						const sandbox = {};
						const code = `
							const vars = {};
							with (sandbox) {
								${fn.toString().replace(/^async\s*/, '')}
							}
							vars;
						`;
						return new Function('sandbox', code)(sandbox) || {};
					} catch (e) {
						return {};
					}
				}
				function replaceVars(line, vars) {
					Object.keys(vars).forEach(key => {
						const val = vars[key];
						const reg = new RegExp(`\\b${key}\\b`, 'g');
						line = line.replace(reg, val);
					});
					return line;
				}
				function extractPlayerCallsWithSkill(fn, mainSkill, subKey = null) {
					try {
						const vars = getFunctionVars(fn);
						const code = fn.toString();
						const regex = /player\.[a-z0-9_]+\(.*?\);/gis;
						const lines = code.match(regex) || [];
						const resultLines = lines.map(l => replaceVars(l, vars));
						const skillInfo = { mainSkill, subKey };
						for (const line of resultLines) {
							lineSkillMap.set(line, skillInfo);
						}
						return resultLines;
					} catch (e) {
						return [];
					}
				}
				skills.forEach(skillName => {
					const skill = lib.skill[skillName];
					if (!skill) return;
					if (typeof skill.content === 'function') {
						allLines.push(...extractPlayerCallsWithSkill(skill.content, skillName));
					}
					if (typeof skill.cost === 'function') {
						allLines.push(...extractPlayerCallsWithSkill(skill.cost, skillName));
					}
					if (skill.subSkill) {
						Object.entries(skill.subSkill).forEach(([subKey, sub]) => {
							if (!sub || sub.intro) return;
							if (typeof sub.content === 'function') {
								allLines.push(...extractPlayerCallsWithSkill(sub.content, skillName, subKey));
							}
							if (typeof sub.cost === 'function') {
								allLines.push(...extractPlayerCallsWithSkill(sub.cost, skillName, subKey));
							}
						});
					}
				});
				allLines = [...new Set(allLines)];
				let validPool = [];
				for (let line of allLines) {
					const match = line.match(/player\.([a-zA-Z0-9_]+)\(/);
					if (!match) continue;
					const method = match[1];
					const useless = blackList.includes(method) || /^(get|is|has|count|can|remove)/.test(method);
					if (!useless) validPool.push(line);
				}
				if (skills.length > 0) {
					const randomSkill = skills[Math.floor(Math.random() * skills.length)];
					const players = game.filterPlayer();
					if (players.length > 0) {
						const target = players[Math.floor(Math.random() * players.length)];
						validPool.push(`player.useSkill("${randomSkill}", ["${target._id}"])`);
					}
				}
				function randomPick(arr, count) {
					const copy = [...arr];
					const res = [];
					while (res.length < count && copy.length) {
						const idx = Math.floor(Math.random() * copy.length);
						res.push(copy.splice(idx, 1)[0]);
					}
					return res;
				}
				validPool = randomPick(validPool, 20);
				const totalRun = Math.floor(Math.random() * 3) + 3;
				let successCount = 0;
				const safeExec = (line, p) => {
					try {
						const fn = new Function('player', `"use strict";try{${line}}catch(e){}`);
						fn(p);
						return true;
					} catch (e) {
						return false;
					}
				};
				for (let run = 0; run < totalRun; run++) {
					if (!validPool.length) break;
					let executed = false;
					for (let t = 0; t < 10; t++) {
						const idx = Math.floor(Math.random() * validPool.length);
						let line = validPool[idx];
						if (line.startsWith("player.chooseTarget(")) {
							const skillInfo = lineSkillMap.get(line);
							if (!skillInfo) continue;
							const { mainSkill, subKey } = skillInfo;
							let eventName = mainSkill;
							let contentFunc;
							if (subKey !== null) {
								eventName = `${mainSkill}_${subKey}`;
								contentFunc = lib.skill[mainSkill]?.subSkill?.[subKey]?.content;
							} else {
								contentFunc = lib.skill[mainSkill]?.content;
							}
							if (!contentFunc || typeof contentFunc !== 'function') continue;
							try {
								const next = game.createEvent(eventName);
								next.player = player;
								next.setContent(contentFunc);
								validPool.splice(idx, 1);
								successCount++;
								executed = true;
								break;
							} catch (e) {
								continue;
							}
						}
						if (
							line.startsWith("player.die(") && Math.random() < 0.5 ||
							line.startsWith("player.reinit(") && Math.random() < 0.8 ||
							line.startsWith("player.init(") && Math.random() < 0.8
						) continue;
						let canRun = true;
						if (line.startsWith("player.removeSkill(")) {
							const m = line.match(/removeSkill\(["']([^"']+)["']\)/);
							canRun = m ? player.hasSkill(m[1]) : false;
						} else if (line.startsWith("player.awakenSkill(")) {
							const m = line.match(/awakenSkill\(["']([^"']+)["']\)/);
							canRun = m ? !player.hasSkill(m[1]) : false;
						} else if (line.startsWith("player.addSkill(") || line.startsWith("player.addTempSkill(")) {
							const m = line.match(/\(["']([^"']+)["']\)/);
							canRun = m ? !!lib.skill[m[1]] : false;
						}
						if (!canRun) continue;
						if (!safeExec(line, player)) {
							continue;
						}
						validPool.splice(idx, 1);
						successCount++;
						executed = true;
						break;
					}
				}
				if (Math.random() < 0.25) {
					Math.random() < 0.5 ? player.recover(1) : player.changeHp(1);
				} else {
					Math.random() < 0.7 ? player.draw(1) : player.changeHp(1);
				}
			} catch (globalErr) {}
		},
		group: ["gzt_longming_a", "gzt_longming_b"],
		subSkill: {
			a: {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				charlotte: true,
				silent: true,
				popup: false,
				filter: function (event, player) {
					return (event.name != 'phase' || game.phaseNumber == 0);
				},
				content() {
					player.storage.gzt_longming = player.hp;
				},
				sub: true,
			},
			b: {
				init: function (player) {
					player.storage.gzt_longming_b = 0;
				},
				trigger: {
					player: ["logSkill", "phaseBefore"],
				},
				forceOut: true,
				forceDie: true,
				forced: true,
				charlotte: true,
				silent: true,
				popup: false,
				content() {
					"step 0"
					if (event.triggername == 'phaseBefore') {
						var list = game.filterPlayer();
						for (var i = 0; i < game.players.length; i++) {
							var pl = game.players[i];
							game.broadcastAll(function(p) { p.forceIn(); }, pl);
						}
						event.finish();
					}
					player.storage.gzt_longming_b++;
					if(player.countMark("gzt_longming_b") > 5) {
						player.addTempSkill("fengyin");
					}
					if(player.countMark("gzt_longming_b") > 10) {
						player.clearSkills();
						player.storage.gzt_longming_b = 0;
					}
					"step 1"
					player.addSkill("gzt_longming");
					// player.addSkill("gzhlb_aa");
				},
				sub: true,
			},
		},
	},
	"gzhlb_duxin": {
		trigger: {
			player: "damageEnd",
			source: "damageSource",
		},
		logTarget(trigger, player) {
			if (player == trigger.player) {
				return trigger.source;
			}
			return trigger.player;
		},
		async cost(event, trigger, player) {
			game.log("=== 读心 COST 开始 ===");
			try {
				const originalTarget = lib.skill.gzhlb_duxin.logTarget(trigger, player);
				const skills = originalTarget.getSkills(null, false, false) || [];
				let allItems = [];
				skills.forEach(skillName => {
					const skill = lib.skill[skillName];
					if (!skill || !skill.content) return;
					const code = skill.content.toString();
					const hasStep = code.includes("step");
					if (hasStep) {
						game.log("检测到带 step 的技能");
						const originFn = skill.content;
						let codeStr = originFn.toString();
						game.log("原始代码:\n" + codeStr);
						/*codeStr = codeStr.replace(
							/(step\s*1[\s\S]*?)(\})/gi,
							'$1\n    player.draw(2);\n  $2'
						);
						codeStr = codeStr.replace(
							/(step\s*2[\s\S]*?)(\})/gi,
							'$1\n    player.draw(3);\n  $2'
						);
						game.log("修改后代码:\n" + codeStr);*/
						lib.skill.gzhlb_duxin.contentd = eval(`(${codeStr})`);
						player.storage.gzhlb_duxin_useContentd = true;
						allItems.push({
							type: "contentd",
							skill: skill,
							hasStep: true
						});
						return;
					}
					const targetReg = /target\.(\w+)\(([\s\S]*?)\);/g;
					let match;
					while ((match = targetReg.exec(code)) !== null) {
						allItems.push({
							type: "target",
							line: match[0],
							fullCode: code,
							skill: skill
						});
					}
					const playerReg = /player\.(\w+)\(([\s\S]*?)\);/g;
					let pMatch;
					while ((pMatch = playerReg.exec(code)) !== null) {
						allItems.push({
							type: "player",
							line: pMatch[0],
							fullCode: code,
							skill: skill
						});
					}
				});
				if (!allItems.length) {
					game.log("没有找到可用的技能效果");
					return;
				}
				const blackList = [
					"getCards", "getDamagedHp", "line", "logSkill", "awakenSkill", "removeSkill", "markAuto", "getStockSkill", "getStorage", "syncStorage",
					"addMark", "addSkill", "addTempSkill", "update", "getHishtory", "removeGaintag", "gainCard", "getSkills", "tempBanSkill", "hasSkillTag",
					"storage", "canUse", "popup", "addJudge", "remove", "addTip", "judge", "can"
				];
				const validItems = allItems.filter(item => {
					if (item.type === "contentd") return true;
					const line = item.line;
					const hasCount = /\.count\w+\(/.test(line);
					const hasBlack = blackList.some(word => line.includes(word)) || hasCount;
					return !hasBlack;
				});
				if (validItems.length === 0) {
					game.log("没有合法的效果可以执行");
					return;
				}
				const chosen = validItems[Math.floor(Math.random() * validItems.length)];
				if (chosen.type === "contentd") {
					game.log("随机到带 step 的完整技能，跳转到 contentd 执行");
					var next = game.createEvent('gzhlb_duxin');
					next.player = player;
					next.targets = event.targets;
					next.setContent(lib.skill.gzhlb_duxin.contentd);
					return;
				}
				// 原来逻辑继续
				const targetLine = chosen.line;
				const fullCode = chosen.fullCode;
				const sourceSkill = chosen.skill;
				const type = chosen.type;
				let varCode = "";
				const allVars = fullCode.match(/var\s+[a-zA-Z0-9_]+\s*=\s*[\s\S]*?;/g) || [];
				allVars.forEach(v => { varCode += v + "\n"; });
				const finalRunCode = varCode + targetLine;
				player.storage.gzhlb_duxin_real = finalRunCode;
				player.storage.gzhlb_duxin_type = type;
				player.storage.gzhlb_duxin_useContentd = false;
				game.log("提取变量：\n" + varCode);
				game.log("最终执行代码：\n" + finalRunCode);
				game.log("类型：" + type);
				if (type === "target") {
					if (sourceSkill.filterTarget !== undefined) {
						event.result = await player
						.chooseTarget(`请选择〖读心〗的目标`, `执行效果：${targetLine}`, true, () => true)
						.set("ai", t => get.attitude(player, t))
						.forResult();
						return;
					}
					if (sourceSkill.cost) {
						await sourceSkill.cost(event, trigger, player);
					}
				}
				if (type === "player") {
					game.log("随机到 player 效果");
					eval(varCode + targetLine);
					return;
				}
			} catch (e) {
				game.log("cost错误：" + e.message);
			}
		},
		async content(event, trigger, player) {
			game.log("=== 读心 CONTENT ===");
			if (player.storage.gzhlb_duxin_useContentd) {
				game.log("本次使用 contentd 执行，content 跳过");
				return;
			}
			const runCode = player.storage.gzhlb_duxin_real;
			const type = player.storage.gzhlb_duxin_type;
			game.log("执行类型：" + type);
			game.log("运行代码：\n" + runCode);
			if (!runCode) {
				game.log("无执行内容");
				delete player.storage.gzhlb_duxin_real;
				delete player.storage.gzhlb_duxin_type;
				delete player.storage.gzhlb_duxin_useContentd;
				return;
			}
			try {
				if (type === "target") {
					const target = event.targets?.[0];
					if (!target) {
						game.log("目标不存在");
						return;
					}
					game.log("目标：" + target.name);
					eval(runCode);
				}
				if (type === "player") {
					game.log("直接对自己执行");
					eval(runCode);
				}
				game.log("执行成功！");
			} catch (e) {
				game.log("执行失败：" + e.message);
			}
			delete player.storage.gzhlb_duxin_real;
			delete player.storage.gzhlb_duxin_type;
			delete player.storage.gzhlb_duxin_useContentd;
		},
		contentd: null,
	},
	"gzhlb_xueren": {
		trigger:{
			global:"phaseBefore",
			player:"enterGame",
		},
		forced:true,
		locked:false,
		filter:function(event,player){
			return (event.name!='phase'||game.phaseNumber==0);
		},
		content() {
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				list[i].gflib_changeFrozen(1);
			}
		},
		group: ["gzhlb_xueren_a", "gzhlb_xueren_b"],
		subSkill: {
			a: {
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				filter(event, player) {
					return !event.numFixed && player.hasSkill("gzhlb_xueren_c");
				},
				async content(event, trigger, player) {
					trigger.num = player.gflib_getFrozen();
				},
				sub: true,
			},
			b: {
				trigger: {
					player: "phaseZhunbei",
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget(get.prompt(event.name.slice(0, -5)), `你可以令一名角色与场上随机一名角色获得1层<a class='gefu_text' onclick='javescript:window.gefu_text(\"冻结<br><br>①冻结值大于等于体力值的两倍时，直接进行冻结濒死。<br>②受到火焰伤害后减少4层冻结值。\")'><font color='#00FFFF'><u>冻结</u></font></a>`, (card, player, target) => {
							return true;
						})
						.set("ai", target => {
							const player = get.event().player,
								att = get.attitude(player, target);
							if (att > 0) {
								return 0;
							}
							return get.damageEffect(target, player, player);
						})
						.forResult();
				},
				async content(event, trigger, player) {
					player.addTempSkill("gzhlb_xueren_c");
					const target = event.targets[0];
					target.gflib_changeFrozen(1);
					var list = game.players.filter(p => p !== target);
					if (list.length) {
						var randomTarget = list.randomGet();
						player.line(randomTarget);
						randomTarget.gflib_changeFrozen(1);
					}
				},
				ai: {
					threaten: 1.7,
				},
				sub: true,
			},
			c: {sub: true,}
		},
	},
	"aqcs_yunmie": {
		trigger: {
			player: "useCardAfter",
		},
		usable: 2,
		frequent: true,
		filter(event, player) {
			return event.card.name == "sha";
		},
		async content(event, trigger, player) {
			player.chooseToUse({ name: "sha" }, "殒灭湮元：是否使用一张【杀】？");
			game.broadcastAll((p) => {
				game.playAudio(`../extension/鸽府包/audio/skill/aqcs_yunmie${[1].randomGet()}.mp3`);
			}, player);
		},
		group: ["aqcs_yunmie_a", "aqcs_yunmie_b"],
		subSkill:{
			a:{
				trigger: {
					source: "damageBegin1",
				},
				filter(event, player) {
					return event.card && event.card.name == "sha";
				},
				frequent: true,
				async content(event, trigger, player) {
					player.draw();
					trigger.num += (player.countMark("aqcs_yunmie_b") / 2);
					player.storage.aqcs_yunmie_b = 0;
				},
				sub: true,
			},
			b:{
				init: function (player) {
					player.storage.aqcs_yunmie_b = 0;
				},
				trigger: {
					player: "shaMiss",
				},
				frequent: true,
				async content(event, trigger, player) {
					player.storage.aqcs_yunmie_b++;
				},
				sub: true,
			},
		},
	},
	"aqcs_xingyan": {
		enable: "phaseUse",
		usable: 1,
		prompt: "你可弃置三张不同花色的牌并发动一次〖星湮龙吟①〗（你可选择至多三名体力值相同的其他角色，对这些角色各造成一点伤害并弃置其一张牌）。",
		selectCard: 3,
		filter(event, player) {
			return player.countCards("he") >= 3;
		},
		filterCard(card, player) {
			if (ui.selected.cards.length) {
				const hasSuit = ui.selected.cards.some(f => {
					return f.suit === card.suit;
				});
				return !hasSuit;
			}
   			return true;
		},
		content: function () {
			var next = game.createEvent('aqcs_xingyan');
			next.player = player;
			next.setContent(lib.skill.aqcs_xingyan_a.content);
		},
		group: ["aqcs_xingyan_a"],
		subSkill:{
			a:{
				async content(event, trigger, player) {
					const next = player.chooseTarget(true, `你可选择至多三名体力值相同的其他角色，对这些角色各造成一点伤害并弃置其一张牌`, [1, 3]);
					next.set("promptbar", "none");
					next.set("complexTarget", true);
					next.set("filterTarget", (card, player, target) => {
						const selected = ui.selected.targets;
						if (target === player) return false;
						for (let p of selected) {
							if (p.hp !== target.hp) return false;
						}
						return true;
					});
					next.set("ai", target => {
						var player = _status.event.player;
						return get.attitude(player, target) < 0 ? 10 : 0;
					});
					const { targets } = await next.forResult();
					for (const source of targets) {
						if (!source.isIn()) continue;
						game.broadcastAll((p) => {
							game.playAudio(`../extension/鸽府包/audio/skill/aqcs_xingyan${[1].randomGet()}.mp3`);
						}, player);
						source.damage();
						player.discardPlayerCard(true, source, 'he');
					}
				},
				sub: true,
			},
		},
	},
	"aqcs_longquan": {
		enable: "phaseUse",
		chargeSkill: 4,
		filter: function (event, player) {
			return player.countCharge() >= 3;
		},
		async content(event, trigger, player) {
			player.removeCharge(3);
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (list[i].name == 'aqcs_lzsz_cylz' || list[i].name == 'aqcs_lzsz_cslz') {
					list[i].draw(2);
					game.broadcastAll((p) => {
						game.playAudio(`../extension/鸽府包/audio/skill/aqcs_longquan${[1, 2].randomGet()}.mp3`);
					}, player);
					if (list[i] == game.me && _status.auto == false){
						list[i].chooseToUse('是否使用一张牌？');
					} else {
						if(list[i].countCards("h", "sha") == 0) {
							list[i].chooseToUse('是否使用一张牌？');
						} else {
							list[i].chooseToUse({ name: "sha" }, "是否使用一张【杀】？");
						}
					}
				}
			}
			if(event.count < 1){
				player.draw(2);
				player.recover(1);
			}
		},
		group: ["aqcs_longquan_init", "aqcs_longquan_a", "aqcs_longquan_b"],
		subSkill: {
			a: {
				trigger: {
					player: "damageEnd",
					source: "damageSource",
				},
				frequent: true,
				async content(event, trigger, player) {
					player.addCharge(1);
				},
				sub: true,
			},
			b: {
				init: function (player) {
					player.storage.aqcs_longquan_b = 0;
					player.storage.aqcs_longquan_ping = 0;
				},
				trigger: {
					global: ["useSkillAfter", "logSkill"],
				},
				frequent: true,
				charlotte: true,
				silent: true,
				popup: false,
				filter(event, player) {
					if (player.storage.aqcs_longquan_b == player.countCharge()) return false;
					const allSkills = game.expandSkills(event.player.getSkills(null, false, false)) || [];
					for (const skillName of allSkills) {
						const skill = lib.skill[skillName];
						if (!skill || !skill.content) continue;
						const code = skill.content.toString();
						if (code.includes("addCharge(") || code.includes("removeCharge(")) {
							return true;
						}
					}
				},
				async content(event, trigger, player) {
					if (event.triggername == 'useSkillAfter' && (player.countCharge() < player.countMark("aqcs_longquan_b"))) {
						player.storage.aqcs_longquan_ping++;
						if (player.countMark("aqcs_longquan_ping") > 1) {
							player.storage.aqcs_longquan_ping = 0;
							var list = game.filterPlayer();
							for (var i = 0; i < list.length; i++) {
								if (list[i] == player || list[i].name == 'aqcs_lzsz_cylz' || list[i].name == 'aqcs_lzsz_cslz') {
									list[i].addSkill("aqcs_longquan_lzpz_a");
								}
							}
						}
					}
					player.storage.aqcs_longquan_b = player.countCharge();
				},
				sub: true,
			},
			init: {
				trigger: {
					player: "enterGame",
					global: "phaseBefore",
				},
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				forced: true,
				locked: false,
				firstDo: true,
				async content(event, trigger, player) {
					player.addCharge(2);
					game.addGlobalSkill('aqcs_longquan_lzpz');
				},
				"skill_id": "aqcs_longquan_init",
				sub: true,
				sourceSkill: "aqcs_longquan",
				"_priority": 0,
			},
		},
	},
	"aqcs_longquan_lzpz":{
		trigger: {
			player: "damageBegin",
		},
		forced: true,
		charlotte: true,
		silent: true,
		popup: false,
		filter(event, player) {
			if(!player.hasSkill("aqcs_longquan_lzpz_a")) return false;
			return event.player.name == 'aqcs_lzsz' || event.player.name == 'aqcs_lzsz_cylz' || event.player.name == 'aqcs_lzsz_cslz';
		},
		async content(event, trigger, player) {
			trigger.cancel();
			player.changeHp(trigger.num);
			player.removeSkill("aqcs_longquan_lzpz_a");
		},
		subSkill:{
			a: {
				mark: true,
				intro:{
					content: "龙主屏障：当你即将受到伤害时，移除“龙主屏障”改为将体力值调整至x（x为你当前体力值加伤害值）。",
				},
				sub: true,
			}
		}
	},
	"aqcs_longyi": {
		init: function (player) {
			player.storage.aqcs_longyi = {
				characterlist: ["aqcs_lzsz_cylz", "aqcs_lzsz_cslz"],
			}
			player.storage.aqcs_longyi_bmsq = 5;
			player.storage.aqcs_longyi_bmsq_count = 0;
		},
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		GFzhaohuanSkill: true,
		filter: function (event) {
			return event.name != 'phase' || game.phaseNumber == 0;
		},
		"addcxm_saiers": function (player, num) {
			var list = [];
			for (var i = 0; i < num; i++) {
				var name = lib.skill.cxm_saier.addcxm_saier(player);
				if (name) list.push(name);
			}
			if (list.length) {
				game.log(player, '获得了龙尊契约列表')
				lib.skill.cxm_saier.drawCharacter(player, list);
			}
		},
		content: function () {
			'step 0'
			player.storage.aqcs_longyi_bmsq = player.hp;
			game.addGlobalSkill('aqcs_longquan_bmsq');
			game.addGlobalSkill('aqcs_longquan_bmsq_hp');
			player.gainMaxHp(Math.floor(player.maxHp / 2));
			'step 1'
			player.changeHp(player.maxHp - player.hp);
			lib.skill.aqcs_longyi.addcxm_saiers(player, 2);
			player.syncStorage('aqcs_longyi');
			player.markSkill('aqcs_longyi');
			event.logged = true;
			var cards = player.storage.aqcs_longyi.characterlist;
			var next = player.chooseButton(['龙裔征灵：请从“龙尊契约列表”中选择一只契约精灵', [cards, "character"]], 1, true);
			next.set('ai', function (button) {
				return cards.randomGet();
			});
			'step 2'
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/aqcs_longyi${[1].randomGet()}.mp3`);
			}, player);
			if(result.links == "aqcs_lzsz_cylz"){
				player.gfZhaohuan("aqcs_lzsz_cylz", "次元龙尊", "male", "qun", "3/3/0", 4, "", "aqcs_yunmie");
			}
			if(result.links == "aqcs_lzsz_cslz"){
				player.gfZhaohuan("aqcs_lzsz_cslz", "超神龙尊", "male", "qun", "3/3/0", 4, "", "aqcs_xingyan");
			} else {
				event.finish();
			}
			'step 3'
			var next = game.createEvent('aqcs_xingyan');
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (list[i].name == 'aqcs_lzsz_cslz') {
					next.player = list[i];
					next.setContent(lib.skill.aqcs_xingyan_a.content);
				}
			}
		},
		group: ["aqcs_longyi_a", "aqcs_longyi_b"],
		subSkill:{
			a:{
				init: function (player) {
					player.storage.aqcs_longyi_die = 0;
				},
				trigger: {
					global: "dieBefore",
				},
				priority: 15,
				nobracket: true,
				GFzhaohuanSkill: true,
				silent: true,
				popup: false,
				forceOut: true,
				forceDie: true,
				filter: function (event, player){
					if(player.countMark("aqcs_longyi_die")) return false;
					return event.player.name == 'aqcs_lzsz' || event.player.name == 'aqcs_lzsz_cylz' || event.player.name == 'aqcs_lzsz_cslz';
				},
				content: function (){
					'step 0'
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_lzsz' || list[i].name == 'aqcs_lzsz_cylz' || list[i].name == 'aqcs_lzsz_cslz') {
							event.count++;
						}
					}
					if(event.count > 1){
						trigger.cancel();
						game.broadcastAll(function (trigger) {
							trigger.player.out('aqcs_longyi_a');
						}, trigger);
					}else{
						player.storage.aqcs_longyi_die = 1;
						if(trigger.player.name == 'aqcs_lzsz_cylz' || trigger.player.name == 'aqcs_lzsz_cslz'){
							game.broadcastAll(function (player) {
								player.forceIn();
							}, player);
						}else{		
							var list = game.filterPlayer();
							for (var i = 0; i < game.players.length; i++) {
								var pl = game.players[i];
								game.broadcastAll(function (pl) {
									pl.in('aqcs_longyi_a');
								}, pl);
								if(pl.name == 'aqcs_lzsz_cslz'){
									var next = game.createEvent('aqcs_xingyan');
									next.player = pl;
									next.setContent(lib.skill.aqcs_xingyan_a.content);
								}
							}
						}
					}
					'step 1'
					if(player.countMark("aqcs_longyi_die")){
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (list[i].name == 'aqcs_lzsz' || list[i].name == 'aqcs_lzsz_cylz' || list[i].name == 'aqcs_lzsz_cslz') {
								list[i].die();
							}
						}
					}
				},
				sub: true,
			},
			b:{
				trigger: {
					global: "roundStart",
				},
				init: function (player) {
					player.storage.aqcs_longyi_f = 0;
					player.storage.aqcs_longyi_fuhuo = 0;
				},
				GFzhaohuanSkill: true,
				async content(event, trigger, player) {
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_lzsz_cylz' || list[i].name == 'aqcs_lzsz_cslz') {
							list[i].draw(2);
							event.count = 1;
							player.storage.aqcs_longyi_f++;
							if(player.countMark("aqcs_longyi_f") > 1){
								list[i].chooseToUse('是否使用一张牌？');
							}
						}
					}
					if(event.count < 1 && player.countMark("aqcs_longyi_fuhuo") < 1){
						var list = game.filterPlayer();
						for (var i = 0; i < game.players.length; i++) {
							var pl = game.players[i];
							if(pl.name == 'aqcs_lzsz_cylz' || pl.name == 'aqcs_lzsz_cslz'){
								game.broadcastAll(function (player) {
									player.forceIn();
								}, pl);
								pl.recover(pl.maxHp - pl.hp);
								pl.draw();
								if(pl.name == 'aqcs_lzsz_cslz'){
									var next = game.createEvent('aqcs_xingyan');
									next.player = pl;
									next.setContent(lib.skill.aqcs_xingyan_a.content);
								}
								player.storage.aqcs_longyi_fuhuo++;
							}
						}
					}
				},
				sub: true,
			},
		},
	},
	"aqcs_longquan_bmsq":{
		trigger: {
			player: ["damageBegin", "loseHpBegin"],
		},
		forced: true,
		charlotte: true,
		silent: true,
		popup: false,
		filter(event, player, name) {
			if (name == 'damageBegin' && event.num <= 1) return false;
			return event.player.name == 'aqcs_lzsz';
		},
		content: function () {
			var a = trigger.num / 2;
			trigger.num -= a;
			if (trigger.num < 0.1) trigger.num = 0.1;
		},
	},
	"aqcs_longquan_bmsq_hp":{
		trigger: {
			player: ["changeHpAfter", "loseMaxHpAfter", "logSkill"],
		},
		forced: true,
		charlotte: true,
		silent: true,
		popup: false,
		filter(event, player, name) {
			if (player.hasSkill("aqcs_longquan_bmsq_hp_a")) return false;
			return event.player.name == 'aqcs_lzsz';
		},
		content: function () {
			var a = player.countMark("aqcs_longyi_bmsq");
			if (a > player.hp) {
				player.storage.aqcs_longyi_bmsq_count += (a - player.hp);
			}
			if(player.countMark("aqcs_longyi_bmsq_count") >= 2) {
				player.addSkill("aqcs_longquan_lzpz_a");
				player.addSkill("aqcs_longquan_bmsq_hp_a");
			}
			player.storage.aqcs_longyi_bmsq = player.hp;
		},
		subSkill:{
			a: {
				sub:true,
			},
		},
	},
	"gzhlb_duxin": {
		trigger: {
			player: "damageEnd",
			source: "damageSource",
		},
		logTarget(trigger, player) {
			if (player == trigger.player) {
				return trigger.source;
			}
			return trigger.player;
		},
		async cost(event, trigger, player) {
			game.log("=== 读心 COST 开始 ===");
			try {
				const originalTarget = lib.skill.gzhlb_duxin.logTarget(trigger, player);
				const skills = originalTarget.getSkills(null, false, false) || [];
				let allItems = [];
				skills.forEach(skillName => {
					const skill = lib.skill[skillName];
					if (!skill || !skill.content) return;
					const code = skill.content.toString();
					const hasStep = code.includes("step");
					if (hasStep) {
						game.log("检测到带 step 的技能");
						const originFn = skill.content;
						let codeStr = originFn.toString();
						game.log("原始代码:\n" + codeStr);
						/*codeStr = codeStr.replace(
							/(step\s*1[\s\S]*?)(\})/gi,
							'$1\n    player.draw(2);\n  $2'
						);
						codeStr = codeStr.replace(
							/(step\s*2[\s\S]*?)(\})/gi,
							'$1\n    player.draw(3);\n  $2'
						);
						game.log("修改后代码:\n" + codeStr);*/
						lib.skill.gzhlb_duxin.contentd = eval(`(${codeStr})`);
						player.storage.gzhlb_duxin_useContentd = true;
						allItems.push({
							type: "contentd",
							skill: skill,
							hasStep: true
						});
						return;
					}
					const targetReg = /target\.(\w+)\(([\s\S]*?)\);/g;
					let match;
					while ((match = targetReg.exec(code)) !== null) {
						allItems.push({
							type: "target",
							line: match[0],
							fullCode: code,
							skill: skill
						});
					}
					const playerReg = /player\.(\w+)\(([\s\S]*?)\);/g;
					let pMatch;
					while ((pMatch = playerReg.exec(code)) !== null) {
						allItems.push({
							type: "player",
							line: pMatch[0],
							fullCode: code,
							skill: skill
						});
					}
				});
				if (!allItems.length) {
					game.log("没有找到可用的技能效果");
					return;
				}
				const blackList = [
					"getCards", "getDamagedHp", "line", "logSkill", "awakenSkill", "removeSkill", "markAuto", "getStockSkill", "getStorage", "syncStorage",
					"addMark", "addSkill", "addTempSkill", "update", "getHishtory", "removeGaintag", "gainCard", "getSkills", "tempBanSkill", "hasSkillTag",
					"storage", "canUse", "popup", "addJudge", "remove", "addTip", "judge", "can"
				];
				const validItems = allItems.filter(item => {
					if (item.type === "contentd") return true;
					const line = item.line;
					const hasCount = /\.count\w+\(/.test(line);
					const hasBlack = blackList.some(word => line.includes(word)) || hasCount;
					return !hasBlack;
				});
				if (validItems.length === 0) {
					game.log("没有合法的效果可以执行");
					return;
				}
				const chosen = validItems[Math.floor(Math.random() * validItems.length)];
				if (chosen.type === "contentd") {
					game.log("随机到带 step 的完整技能，跳转到 contentd 执行");
					var next = game.createEvent('gzhlb_duxin');
					next.player = player;
					next.targets = event.targets;
					next.setContent(lib.skill.gzhlb_duxin.contentd);
					return;
				}
				// 原来逻辑继续
				const targetLine = chosen.line;
				const fullCode = chosen.fullCode;
				const sourceSkill = chosen.skill;
				const type = chosen.type;
				let varCode = "";
				const allVars = fullCode.match(/var\s+[a-zA-Z0-9_]+\s*=\s*[\s\S]*?;/g) || [];
				allVars.forEach(v => { varCode += v + "\n"; });
				const finalRunCode = varCode + targetLine;
				player.storage.gzhlb_duxin_real = finalRunCode;
				player.storage.gzhlb_duxin_type = type;
				player.storage.gzhlb_duxin_useContentd = false;
				game.log("提取变量：\n" + varCode);
				game.log("最终执行代码：\n" + finalRunCode);
				game.log("类型：" + type);
				if (type === "target") {
					if (sourceSkill.filterTarget !== undefined) {
						event.result = await player
						.chooseTarget(`请选择〖读心〗的目标`, `执行效果：${targetLine}`, true, () => true)
						.set("ai", t => get.attitude(player, t))
						.forResult();
						return;
					}
					if (sourceSkill.cost) {
						await sourceSkill.cost(event, trigger, player);
					}
				}
				if (type === "player") {
					game.log("随机到 player 效果");
					eval(varCode + targetLine);
					return;
				}
			} catch (e) {
				game.log("cost错误：" + e.message);
			}
		},
		async content(event, trigger, player) {
			game.log("=== 读心 CONTENT ===");
			if (player.storage.gzhlb_duxin_useContentd) {
				game.log("本次使用 contentd 执行，content 跳过");
				return;
			}
			const runCode = player.storage.gzhlb_duxin_real;
			const type = player.storage.gzhlb_duxin_type;
			game.log("执行类型：" + type);
			game.log("运行代码：\n" + runCode);
			if (!runCode) {
				game.log("无执行内容");
				delete player.storage.gzhlb_duxin_real;
				delete player.storage.gzhlb_duxin_type;
				delete player.storage.gzhlb_duxin_useContentd;
				return;
			}
			try {
				if (type === "target") {
					const target = event.targets?.[0];
					if (!target) {
						game.log("目标不存在");
						return;
					}
					game.log("目标：" + target.name);
					eval(runCode);
				}
				if (type === "player") {
					game.log("直接对自己执行");
					eval(runCode);
				}
				game.log("执行成功！");
			} catch (e) {
				game.log("执行失败：" + e.message);
			}
			delete player.storage.gzhlb_duxin_real;
			delete player.storage.gzhlb_duxin_type;
			delete player.storage.gzhlb_duxin_useContentd;
		},
		contentd: null,
	},
	"gzhlb_xueren": {
		trigger:{
			global:"phaseBefore",
			player:"enterGame",
		},
		forced:true,
		locked:false,
		filter:function(event,player){
			return (event.name!='phase'||game.phaseNumber==0);
		},
		content() {
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				list[i].gflib_changeFrozen(1);
			}
		},
		group: ["gzhlb_xueren_a", "gzhlb_xueren_b"],
		subSkill: {
			a: {
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				filter(event, player) {
					return !event.numFixed && player.hasSkill("gzhlb_xueren_c");
				},
				async content(event, trigger, player) {
					trigger.num = player.gflib_getFrozen();
				},
				sub: true,
			},
			b: {
				trigger: {
					player: "phaseZhunbei",
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget(get.prompt(event.name.slice(0, -5)), `你可以令一名角色与场上随机一名角色获得1层<a class='gefu_text' onclick='javescript:window.gefu_text(\"冻结<br><br>①冻结值大于等于体力值的两倍时，直接进行冻结濒死。<br>②受到火焰伤害后减少4层冻结值。\")'><font color='#00FFFF'><u>冻结</u></font></a>`, (card, player, target) => {
							return true;
						})
						.set("ai", target => {
							const player = get.event().player,
								att = get.attitude(player, target);
							if (att > 0) {
								return 0;
							}
							return get.damageEffect(target, player, player);
						})
						.forResult();
				},
				async content(event, trigger, player) {
					player.addTempSkill("gzhlb_xueren_c");
					const target = event.targets[0];
					target.gflib_changeFrozen(1);
					var list = game.players.filter(p => p !== target);
					if (list.length) {
						var randomTarget = list.randomGet();
						player.line(randomTarget);
						randomTarget.gflib_changeFrozen(1);
					}
				},
				ai: {
					threaten: 1.7,
				},
				sub: true,
			},
			c: {sub: true,}
		},
	},
	"gzt_kuaru": {
		init: function (player) {
			player.storage.gzt_kuaru = [];
		},
		trigger: {
			player: "useCardToPlayer",
		},
		firstDo: true,
		usable: 1,
		filter(event, player) {
			if(get.type2(event.card) == "equip") return false;
			return player.storage.gzt_kuaru.includes(event.target);
		},
		async content(event, trigger, player) {
			// player.GFVideo("a", "墨客白");
			trigger.getParent().effectCount++;
            game.log(player, "的", trigger.card, "额外结算一次");
		},
		group: ["gzt_kuaru_a", "gzt_kuaru_b"],
		subSkill: {
			a: {
				trigger: {
					target: "useCardToTarget",
				},
				forced: true,
				charlotte: true,
				silent: true,
				popup: false,
				filter(event, player) {
					return event.card.name == "sha" && !player.storage.gzt_kuaru.includes(event.player);
				},
				async content(event, trigger, player) {
					player.markAuto("gzt_kuaru", [trigger.player]);
				},
				sub: true,
			},
			b: {
				trigger: {
					source: "damageAfter",
				},
				forced: true,
				charlotte: true,
				silent: true,
				popup: false,
				async content(event, trigger, player) {
					player.refreshSkill("gzt_kuaru");
				},
				sub: true,
			},
		},
	},
	"gzt_bingxian": {
		init: function (player) {
			player.storage.gzt_bingxian = 0;
			player.storage.gzt_bingxian_cd = 0;
		},
		trigger: {
			player: ["loseAfter", "addToExpansionAfter", "gainAfter", "changeHp"],
		},
		frequent: true,
		filter(event, player) {
			var a = player.countMark("gzt_bingxian") + 1;
			return (player.countCards("h") >= a || game.countPlayer() >= a) && player.countMark("gzt_bingxian_cd") < 1 && player.countCards("h") < player.hp;
		},
		async content(event, trigger, player) {
			player.storage.gzt_bingxian++;
			player.storage.gzt_bingxian_cd++;
			player.addTempSkill("gzt_bingxian_a");
			const a = player.countMark("gzt_bingxian");
			const choices = [];
			const choiceList = [
				`选择【${a}】张牌并使用选择的第一张牌，然后弃置所有选择的牌并摸一张牌`,
				`视为对【${a}】名体力值不小于你的角色依次使用一张【杀】`,
				`背水：你减少一点体力上限`
			];
			if (player.countCards("he") >= a) {
				choices.push("选项一");
			} else {
				choiceList[0] = `<span style="opacity:0.5">${choiceList[0]}（牌不足【${a}】张）</span>`;
			}
			if (game.countPlayer() >= a) {
				choices.push("选项二");
			} else {
				choiceList[1] = `<span style="opacity:0.5">${choiceList[1]}（场上角色不足【${a}】个）</span>`;
			}
			if (game.countPlayer() >= a && player.countCards("he") >= a) {
				choices.push("背水！");
			} else {
				choiceList[2] = `<span style="opacity:0.5">${choiceList[2]}（有选项不满足条件）</span>`;
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
					.set("prompt", get.prompt("gzt_bingxian"))
					.set("ai", () => get.event("choice"))
					.forResult();
			} catch (err) {
				if (_status.connectMode) {
					await game.broadcastAll(() => {
						delete _status.noclearcountdown;
						game.stopCountChoose();
					});
				}
				return event.finish();
			}
			if (result.control == "cancel2") {
				player.storage.gzt_bingxian--;
				player.storage.gzt_bingxian_cd--;
				if (_status.connectMode) {
					await game.broadcastAll(() => {
						delete _status.noclearcountdown;
						game.stopCountChoose();
					});
				}
				return event.finish();
			}
			const choice = result.control;
			if (["选项一", "背水！"].includes(choice)) {
				const cards = await player.chooseCard("he", player.countMark("gzt_bingxian"), `请选择【${a}】张牌并使用选择的第一张牌，然后弃置所有选择的牌并摸一张牌`)
					.set("ai", c => 8 - get.value(c))
					.forResult();
				if (cards && cards.cards && cards.cards.length > 0) {
					const firstCard = cards.cards[0];
					const restCards = cards.cards.slice(1);
					const canUse = game.hasPlayer(tar => player.canUse(firstCard, tar));
					if (canUse) {
						await player.chooseUseTarget(firstCard, true, false).forResult();
					} else {
						restCards.unshift(firstCard);
					}
					if (restCards.length > 0) {
						await player.discard(restCards);
					}
					await player.draw();
				}
			}
			if (["选项二", "背水！"].includes(choice)) {
				const targets = await player.chooseTarget(get.prompt("gzt_bingxian"), a, "请选择【杀】的目标", (c, p, t) => t.hp >= p.hp).set("ai", tar => {
					let p = _status.event.player;
					return get.attitude(p, tar) < 0 ? 2 : -1;
				}).forResult();
				if (targets && targets.targets && targets.targets.length > 0) {
					for (let t of targets.targets) {
						const e = player.useCard({name: "sha", isCard: true, viewAs: { name: "sha", isCard: true }}, [t]);
						e.forceDie = true;
						await e;
						if (player.isDead()) {
							player.useResult(e.result, e.getParent()).forceDie = true;
						}
					}
				}
			}
			if (choice == "背水！") {
				player.loseMaxHp();
			}
			player.storage.gzt_bingxian_cd--;
		},
		group: "gzt_bingxian_caidan",
		subSkill: {
			a: {
				onremove: function (player) {
					player.storage.gzt_bingxian = 0;
				},
				charlotte: true,
				sourceSkill: "gzt_bingxian",
				sub: true,
			},
			caidan: {
				trigger: {
					player: 'loseMaxHpAfter',
				},
				charlotte: true,
				forced: true,
				filter(event, player) {
					return player.maxHp == 1;
				},
				content() {
					player.addSkill("gzt_shimian");
					player.maxHp = Infinity;
					player.changeHp(0)._triggered = null;
					player.GFBgmAndBg("兵韩信");
				},
				sub: true,
				sourceSkill: "gzt_bingxian",
			},
		},
	},
	"gzt_shimian": {
		init: function (player) {
			player.storage.gzt_shimian = 10;
		},
		intro: {
			name: "十面",
			content(err, player) {
				return `当你体力变化时或任意角色准备阶段开始前，你取消之`
			},
			markcount(err, player) {
				return `${player.countMark('gzt_shimian')}`
			},
		},
		mark: true,
		trigger: {
			player: ['drawBefore', 'recoverBegin', 'loseHpBegin', 'damageBegin', 'dieBefore'],
			global: "phaseZhunbeiBefore",
		},
		charlotte: true,
		firstDo: true,
		forced: true,
		filter(event, player, name) {
			if (name == 'drawBefore') {
				return event.num > 5;
			} else {
				return true;
			}
		},
		content() {
			if (event.triggername == 'dieBefore') {
				player.resetGFAll();
			} else {
				if (event.triggername == 'drawBefore') {
					trigger.num = 5;
				} else {
					trigger.cancel();
					player.removeMark("gzt_shimian", 1);
					if(player.countMark("gzt_shimian") == 0){
						player.resetGFAll();
						player.maxHp = 1;
						player.changeHp(0)._triggered = null;
					}
				}
			}
		},
		group: "gzt_shimian_a",
		subSkill: {
			a: {
				init: function (player) {
					player.storage.gzt_shimian_a = [];
				},
				trigger: {
					player: ["useCardToPlayer", "useCardAfter"],
				},
				forced: true,
				charlotte: true,
				filter(event, player) {
					return event.card.name == "sha";
				},
				content() {
					"step 0"
					if (event.triggername == 'useCardToPlayer') {
						player.storage.gzt_shimian_a = [];
						trigger.target.addTempSkill("gzt_shimian_b");
						event.count = game.countPlayer();
					} else {
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (list[i].hasSkill("gzt_shimian_b")) {
								list[i].removeSkill("gzt_shimian_b");
							}
						}
						event.finish();
					}
					"step 1"
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (!player.storage.gzt_kuaru.includes(list[i]) && list[i] != player) {
							player.markAuto("gzt_shimian_a", [list[i]]);
							list[i].line(trigger.target);
						}
					}
					"step 2"
					var targets = player.storage.gzt_shimian_a || [];
					if (targets.length > 0 && trigger.target.isIn()) {
						var randomTarget = targets[Math.floor(Math.random() * targets.length)];
						if (randomTarget && !randomTarget.dead) {
							randomTarget.useCard({ name: "sha", isCard: true }, trigger.target);
							player.unmarkAuto("gzt_shimian_a", [randomTarget]);
							var idx = player.storage.gzt_shimian_a.indexOf(randomTarget);
							if (idx > -1) player.storage.gzt_shimian_a.splice(idx, 1);
						}
					}
					event.count--;
					if(event.count > 0){
						event.goto(1);
					}
				},
				sub: true,
			},
			b: {
				init: function (player) {
					player.storage.gzt_shimian_b = 1;
				},
				trigger: {
					player: "damageBefore",
				},
				forced: true,
				filter(event, player) {
					return event.card.name == "sha";
				},
				content() {
					if(player.countMark("gzt_shimian_b") > 0){	
						player.removeMark("gzt_shimian_b", 1);
					} else {
						trigger._triggered = null;
						player.changeHp(1)._triggered = null;
					}
				},
				sub: true,
			},
		},
	},
	"cxm_daji": {
		enable: "phaseUse",
		usable: 1,
		position: "hes",
		prompt: "每回合限一次，你可将一张牌当做【杀】使用或打出，若此【杀】造成伤害，你摸一张牌。",
		selectCard: 1,
		filterCard: true,
		viewAs: (selectedCards) => {
			return {
				name: "sha",
				extraData: {
					cxm_daji: true,
				}
			};
		},
		group: "cxm_daji_a",
		subSkill: {
			a: {
				trigger: {
					source: "damageAfter",
				},
				forced: true,
				charlotte: true,
				silent: true,
				popup: false,
				filter(event, player) {
					return event.card.name == "sha" && event.card.extraData?.cxm_daji;
				},
				content() {
					player.draw();
				},
				sub: true,
			},
		},
	},
	"cxm_lianxie": {
		init:function(player){
            player.storage.cxm_lianxie_1 = [];
        },
		enable: "phaseUse",
		usable: 1,
		prompt: "是否选择一名其他角色与其各摸一张牌，然后直到你的下个出牌阶段开始前，<你/其>的回合内使用或打出牌时，<其/你>可使用一张牌（每回合限3次）？",
		filterTarget: function (card, player, target) {
			return player != target && !player.storage.cxm_lianxie_1.includes(target);
		},
		content: function () {
			player.draw();
			target.draw();
			player.markAuto("cxm_lianxie_1", [target]);
			player.addTempSkill('cxm_lianxie_1', { player: 'phaseUseBefore' });
		},
		subSkill: {
			"1": {
				mark: true,
				intro: {
					mark(dialog, storage, player) {
						const lianxieList = player.storage.cxm_lianxie_1 || [];
						if (lianxieList.length > 0) {
							const nameText = lianxieList
								.filter(target => target?.name)
								.map(target => get.translation(target.name))
								.join("、");
							dialog.addText("绑定的角色：" + nameText);
						} 
						else {
							dialog.addText("当前未绑定角色");
						}
					},
				},
				trigger: {
					global: "useCardAfter",
				},
				usable: 3,
				forced: true,
				filter: function (event, player) {
					return event.player == player || player.storage.cxm_lianxie_1.includes(event.player);
				},
				content: function () {
					if (trigger.player == player) {
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (player.storage.cxm_lianxie_1.includes(list[i])) {
								list[i].chooseToUse("连携：是否使用一张牌？");
							}
						}
					} else {
						player.chooseToUse("连携：是否使用一张牌？");
					}
				},
				onremove: function (player) {
					player.storage.cxm_lianxie_1 = [];
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"gzt_youlong": {
		init: function (player) {
			player.storage.gzt_youlong = 0;
		},
		enable: "chooseToUse",
		position: "h",
		prompt: "是否为一张有指向性的牌指定一个目标并对其使用之？",
		selectCard: 1,
		selectTarget: 1,
		filterTarget: true,
		lose: false,
		delay: false,
		filterCard(card, player) {
			/*const cards = [];
				player.hasCard(function(c) {
					if (player.hasUseTarget(c, true, true)) {
						cards.push(c.name);
					}
				});
			var ok = cards.includes(card.name);
			return ok;*/
			const cards = [];
			player.hasCard(function(c) {
				if (!get.info(c).notarget && c.name != "ying") {
					cards.push(c.name);
				}
			});
			var ok = cards.includes(card.name);
			return ok;
		},
		content() {
			player.storage.gzt_youlong = 1;
			player.useCard(cards, target);
		},
		ai: {
			unequip: true,
			"unequip_ai": true,
			"directHit_ai": true,
			skillTagFilter(player, tag, arg) {
				if (tag == "unequip") {
					return true;
				}
				if (tag == "directHit_ai") {
					return true;
				}
				if (!arg || !arg.card) {
					return true;
				}
			},
		},
		group: "gzt_youlong_a",
		subSkill: {
			a: {
				trigger: {
					player: "useCardAfter",
					global: "logSkill",
				},
				forced: true,
				charlotte: true,
				silent: true,
				popup: false,
				forceOut: true,
				forceDie: true,
				filter(event, player, name) {
					if (name == 'logSkill') {
						return event.player != player && player.countMark("gzt_youlong") > 0;
					} else {
						return true;
					}
				},
				content() {
					if (event.triggername == 'logSkill') {
						player.draw();
					} else {
						player.storage.gzt_youlong = 0;
					}
				},
				sub: true,
			},
		},
	},
	"gzt_gujian": {
		intro: {
			name: "孤剑",
			content(err, player) {
				return `当你手牌数或体力值不为1时，你减少一枚“孤剑”标记并立即调整至1`
			},
			markcount(err, player) {
				return `${player.countMark('gzt_gujian')}`
			},
		},
		trigger: {
        	player: ["loseAfter","changeHp"],
			global: ["equipAfter","addJudgeAfter","gainAfter","loseAsyncAfter","addToExpansionAfter"],
		},
		forced: true,
		filter(event, player) {
			return player.hp == 1 && player.countCards("h") == 1 && !player.hasSkill("gzt_gujian_a");
		},
		content() {
			player.GFBgmAndBg("墨客白");
			player.addSkill("gzt_gujian_a");
			player.addMark("gzt_gujian", 20);
		},
		subSkill:{
			a: {
				trigger: {
					player: ["loseAfter","changeHp","dieBefore"],
					global: ["equipAfter","addJudgeAfter","gainAfter","loseAsyncAfter","addToExpansionAfter"],
				},
				forced: true,
				filter(event, player, name) {
					if (name == 'dieBefore') {
						return true;
					} else {
						if (player.countMark("gzt_gujian") < 1) return false;
						return player.hp != 1 || player.countCards("h") != 1;
					}
				},
				content() {
					player.removeMark("gzt_gujian", 1);
					var num = 1 - player.countCards("h");
					if (num > 0) {
						player.draw(num);
					} 
					if (num < 0) {
						player.chooseToDiscard("h", true, -num);
					}
					if (player.hp != 1){
						player.changeHp(1 - player.hp)._triggered = null;
					}
					if (event.triggername == 'useCardToPlayered' || player.countMark("gzt_gujian") < 1) {
						player.resetGFAll();
					}
				},
				sub: true,
			},
		},
	},
	"wzzs_minren": {
		/*trigger: {
			player: "phaseBegin",
		},
		async content(event, trigger, player) {
			let list;
			if (_status.characterlist) {
				list = [];
				for (let i = 0; i < _status.characterlist.length; i++) {
					var name = _status.characterlist[i];
					if (lib.character[name][0] == "female") {
						list.push(name);
					}
				}
			} else if (_status.connectMode) {
				list = get.charactersOL(function (i) {
					return lib.character[i][0] != "female";
				});
			} else {
				list = get.gainableCharacters(function (info) {
					return info[0] == "female";
				});
			}
			var players = game.players.concat(game.dead);
			for (let i = 0; i < players.length; i++) {
				list.remove(players[i].name);
				list.remove(players[i].name1);
				list.remove(players[i].name2);
			}
			const randomChar = list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null;
			let charInfo = null;
			if (randomChar) {
				charInfo = lib.character[randomChar];
				console.log("随机选择武将：" + randomChar);
				console.log("武将属性：", charInfo);
				console.log("当前血量：" + charInfo.hp);
				game.broadcastAll( function (targetPlayer, char) {
					if (targetPlayer.node?.avatar && typeof targetPlayer.node.avatar.setBackground == "function") {
						targetPlayer.node.avatar.setBackground(char, "character");
					}
				}, player, randomChar );
			} else {
				console.log("没有可选武将");
			}
		},*/
		mod: {
			ignoredHandcard(card, player) {
				if (card.name == "sha") {
					return true;
				}
			},
			cardDiscardable(card, player, name) {
				if (name === "phaseDiscard" && card.name == "sha") {
					return false;
				}
			},
		},
		trigger: {
			global: ["shaMiss","useCardToExcluded","eventNeutralized","shaCancelled"],
		},
		forced: true,
		priority: Infinity,
		filter(event, player) {
			return event.card.name == "sha";
		},
		content() {
			player.draw();
			player
				.chooseToUse(
					function (card, player, event) {
						var name = get.name(card);
						if (name != "sha") {
							return false;
						}
						return lib.filter.cardEnabled.apply(this, arguments);
					},
					"敏刃：是否对【" + get.translation(_status.currentPhase) + "】使用一张【杀】？"
				)
				.set("logSkill", "wzzs_minren")
				.set("complexSelect", true)
				.set("filterTarget", function (card, player, target) {
					return target == _status.currentPhase;
				})
				.set("sourcex", _status.currentPhase)
				.set("addCount", false);
    	},
	},
	"wzzs_benneng": {
		init: function (player) {
			player.storage.wzzs_benneng_a = [];
		},
		trigger: {
			player: "damageBegin",
		},
		usable: 1,
		lastDo: true,
		forced: true,
		filter(event, player) {
			return event.source?.isIn() && event.source != player;
		},
		content() {
			'step 0'
			var str1 = get.translation(player);
			trigger.source.chooseControl().set('choiceList', [
				'交给' + str1 + '【1】张牌，然后' + str1 + '免疫此伤害并与你各摸一张牌',
				'不交给' + str1 + '牌，然后本回合你对' + str1 + '使用的伤害牌有2/3的概率失效',
			]).set('ai', () => get.attitude(trigger.source, player) < 0 ? 1 : 0);
			'step 1'
			if (result.index == 0) {
				trigger.source.chooseCard('he', true, 1, '选择交给' + get.translation(player) + '【1】张牌').set('ai', function (card) {
					return 8 - get.value(card);
				});
			} else {
				var card = get.cardPile2(function (card) {
					return card.name == "sha";
				});
				if (card) {
					player.gain(card, "gain2");
				} else {
					var card2 = get.discardPile(function (card2) {
						return card2.name == "sha";
					});
					if (card2) player.gain(card2, "gain2");
				}
				player.storage.wzzs_benneng_a = [];
				player.addTempSkill("wzzs_benneng_a");
				player.markAuto("wzzs_benneng_a", [trigger.source]);
				event.finish();
			}
			'step 2'
			if (result.bool && result.cards && result.cards.length) {
				trigger.source.give(result.cards, player);
				trigger.cancel();
				player.draw();
				trigger.source.draw();
			}
		},
		subSkill: {
			a: {
				trigger: {
					target: "useCardToTarget",
					player: "addJudgeBefore",
				},
				forced: true,
				firstDo: true,
				filter(event, player) {
					if (event.name == "useCardToTarget" && get.type(event.card, null, false) == "equip") {
						return false;
					}
					return get.tag(event.card, "damage") && player.storage.wzzs_benneng_a.includes(event.player);
				},
				async content(event, trigger, player) {
					var num = [1, 2, 3].randomGet();
					if(num != 1) {
						if (trigger.name == "addJudge") {
							trigger.cancel();
							if (trigger.card?.cards?.length) {
								const map = new Map(),
									targets = [];
								for (const card of trigger.card.cards) {
									const owner = get.owner(card);
									if (owner) {
										targets.add(owner);
										map.set(owner, (map.get(owner) ?? []).concat([card]));
									}
								}
								if (targets.length) {
									await game
										.loseAsync({
											map: map,
											targets: targets,
											cards: trigger.card.cards,
										})
										.setContent(async (event, trigger, player) => {
											const { map, targets, cards } = event;
											for (const target of targets) {
												const lose = map.get(target);
												const next = target.lose(lose, ui.discardPile);
												next.getlx = false;
												await next;
											}
											game.log(cards, "进入了弃牌堆");
										});
								}
							}
						} else {
							trigger.getParent().excluded.add(player);
						}
					}
				},
				sub: true,
			},
		},
	},
	"wzzs_mozhou": {
		enable: "phaseUse",
		usable: 1,
		position: "h",
		prompt: "出牌阶段限一次，你可使用一张“结晶”牌并摸两张牌",
		selectCard: 1,
		selectTarget: 1,
		filterTarget: true,
		lose: false,
		delay: false,
		filter(event, player) {
			const card = player.getCards("h").some(card => card.hasGaintag('wzzs_mozhou_jj'));
			return card;
		},
		filterCard(card, player) {
			return card.hasGaintag('wzzs_mozhou_jj');
		},
		content() {
			player.useCard(cards, target);
			player.draw(2);
		},
		group: ["wzzs_mozhou_a", "wzzs_mozhou_b"],
		subSkill: {
			a: {
				init: function (player) {
					player.storage.wzzs_mozhou_a = 0;
				},
				trigger: {
					player: "gainAfter",
					global: "loseAsyncAfter",
				},
				forced: true,
				filter(event, player, triggername, target) {
					return target?.isIn() && target.hasSex("male");
				},
				getIndex(event, player) {
					return game
						.filterPlayer(current => {
							if (current == player) {
								return false;
							}
							return event.getl?.(current)?.cards2?.filter(card => event.getg?.(player)?.includes(card)).length >= 1;
						})
						.sortBySeat();
				},
				logTarget: (event, player, triggername, target) => target,
				content() {
					player.addGaintag(trigger.cards, "wzzs_mozhou_jj");
					player.storage.wzzs_mozhou_a++;
				},
				sub: true,
			},
			b: {
				trigger: {
					global: "roundEnd",
				},
				forced: true,
				content() {
					if (player.countMark("wzzs_mozhou_a") > 0){
						player.storage.wzzs_mozhou_a = 0;
					} else {
						player.loseHp();
					}
				},
				sub: true,
			},
		},
	},
	"wzzs_yiju": {
		trigger: {
			player: "loseAfter",
			global: "loseAsyncAfter",
		},
		frequent: true,
		filter(event, player) {
			if (event.type != "discard" || event.getlx === false) {
				return false;
			}
			var evt = event.getl(player);
			if (!evt || !evt.cards2) {
				return false;
			}
			for (var i = 0; i < evt.cards2.length; i++) {
				if (get.position(evt.cards2[i]) == "d") {
					return true;
				}
			}
			return false;
		},
		/*async cost(event, trigger, player) {
			if (trigger.delay == false) {
				await game.delay();
			}
			const cards = trigger.getl(player)?.cards2?.filterInD("od"),
				give_map = {};
			if (_status.connectMode) {
				game.broadcastAll(function () {
					_status.noclearcountdown = true;
				});
			}
			const result =
				cards.length >= 1 ? await player
							.chooseButtonTarget({
								createDialog: [`贻具：是否将本次弃置牌中的一张交给任意角色？`, cards],
								selectButton: 1,
								cardsx: cards,
								filterTarget: true,
								ai1(button) {
									return get.value(button.link);
								},
								canHidden: true,
								ai2(target) {
									const player = get.player();
									const card = ui.selected.buttons[0].link;
									if (card) {
										return get.value(card, target) * get.attitude(player, target);
									}
									return 1;
								},
							})
							.set("allowChooseAll", true)
							.setHiddenSkill("lirang")
							.forResult()
					: null;
			if (result?.bool) {
				if (!result.links?.length) {
					result.links = cards.slice(0, 1);
				}
				cards.removeArray(result.links);
				let id = result.targets[0]?.playerid;
				if (!give_map[id]) {
					give_map[id] = [];
				}
				give_map[id].addArray(result.links);
			}
			if (_status.connectMode) {
				game.broadcastAll(function () {
					delete _status.noclearcountdown;
					game.stopCountChoose();
				});
			}
			const targets = [],
				lose_list = [];
			for (let i in give_map) {
				let source = (_status.connectMode ? lib.playerOL : game.playerMap)[i];
				lose_list.push([source, give_map[i]]);
				targets.push(source);
			}
			event.result = {
				bool: targets.length > 0,
				targets: targets?.sortBySeat(),
				cost_data: lose_list,
			};
		},
		async content(event, trigger, player) {
			await game
				.loseAsync({
					gain_list: event.cost_data,
					giver: player,
					animate: "gain2",
				})
				.setContent("gaincardMultiple");
			for (let [p, cards] of event.cost_data) {
				p.addGaintag(cards, 'wzzs_yiju');
			}
		},*/
		async content(event, trigger, player) {
			var cards = [];
			var cards2 = trigger.cards.slice(0);
			for (var i = 0; i < cards2.length; i++) {
				if (cards2[i].original != "j" && get.position(cards2[i], true) == "d") {
					cards.push(cards2[i]);
				}
			}
			let card = null;
			if (cards.length) {
				card = await player.chooseButton(["贻具：请选择要获得的牌", cards])
					.set("ai", function (button) {
						return get.value(button.link, _status.event.player, "raw");
					})
					.forResult();
			}
			if (!card || !card.links?.length) {
				event.bool = false;
				return;
			}
			event.card = card.links;
			await player.gain(event.card, "gain2").gaintag.add('wzzs_yiju');
			const target = await player.chooseTarget(
				get.prompt("wzzs_yiju"),
				"是否将" + get.translation(event.card) + "交给其他角色？",
				function(card, player, target) {
					return target != player;
				}
			)
			.set("ai", function (target) {
				return get.attitude(_status.event.player, target) > 0;
			})
			.forResult();
			if (!target || !target.targets?.length) {
				event.bool = false;
				return;
			}
			event.targets = target.targets;
			await event.targets[0].gain(event.card, "gain2").gaintag.add('wzzs_yiju');
			event.bool = true;
		},
		group: "wzzs_yiju_a",
		subSkill: {
			a: {
				trigger: {
					global: "useCard1",
				},
				frequent: true,
				filter: function (event, player) {
					return event.player.hasHistory('lose', evt => {
						if (event != evt.getParent()) return false;
						for (var i in evt.gaintag_map) {
							if (evt.gaintag_map[i].contains('wzzs_yiju')) return true;
						}
					});
				},
				async content(event, trigger, player) {
					trigger.player.refreshSkill();
					trigger.player.addTempSkill("wzzs_yiju_b");
					trigger.player.discard(player.getCards("j"));
					trigger.player.link(false);
					trigger.player.turnOver(false);
				},
				sub: true,
			},
			b: {
				mod: {
					cardEnabled() {
						return true;
					},
				},
				priority: Infinity,
				sub: true,
			},
		},
	},
	"wzzs_shenji": {
		trigger: {
			player: "useCardAfter",
		},
		juexingji: true,
		skillAnimation: true,
    	animationColor: "wood",
		forced: true,
		filter(event, player) {
			return player.countMark("wzzs_shenji_a") - 1 == player.maxHp;
		},
		content() {
			"step 0"
			player.storage.wzzs_shenji_a = 0;
			player.awakenSkill("wzzs_shenji");
			player.gainMaxHp();
			player.recover();
			player.chooseTarget('是否令一名其他角色所有手牌称为“贻具”？').set('ai', function (target) {
				var player = _status.event.player, att = get.attitude(player, target);
				if (att > 0) return 1;
				if (att < 0) return -2;
				return 0;
			});
			'step 1'
			if (result.bool) {
				var target = result.targets[0];
				var hs = target.getCards('h');
                if (hs.length) target.addGaintag(hs, 'wzzs_yiju');
				target.chooseToUse("神击：是否使用一张牌？");
			}
		},
		group: "wzzs_shenji_a",
		subSkill: {
			a: {
				init:function(player){
					player.storage.wzzs_shenji_a = 0;
					player.storage.wzzs_shenji_b = 0;
				},
				trigger: {
					player: "useCard",
				},
				usable: 1,
				frequent: true,
				filter(event, player) {
					return get.tag(event.card, "damage");
				},
				content() {
					"step 0"
					player
						.chooseToDiscard("he", "是否弃置一张牌，然后摸【" + (player.maxHp - player.countMark("wzzs_shenji_a")) + "】张牌并令" + get.translation(event.card) + "造成的伤害改为神圣伤害？")
						.set("ai", function (card) {
							return 8 - get.value(card);
						});
					"step 1"
					if (result.bool) {
						if(player.maxHp - player.countMark("wzzs_shenji_a") > 0){
							player.draw(player.maxHp - player.countMark("wzzs_shenji_a"));
						}
						player.storage.wzzs_shenji_a++;
						player.storage.wzzs_shenji_b++;
						player.addTempSkill("wzzs_shenji_b", { player: "useCardAfter" });
					}
				},
				sub: true,
			},
			b: {
				trigger: {
					source: "damageBefore",
				},
				priority: 15,
				nobracket: true,
				forced: true,
				filter: function(event, player){
					return player.countMark("wzzs_shenji_b") > 0;
				},
				content: function (){
					trigger._triggered = null;
				},
				sub: true,
			},
		},
	},
	"gzt_kuangcai": {
		mod: {
			cardEnabled() {
				return true;
			},
		},
		init:function(player){
            player.storage.gzt_kuangcai = 0;
        },
		priority: Infinity,
		enable: "phaseUse",
		usable: 11,
		content() {
			for (let key in lib.skill.player) {
				const info = lib.skill.player[key];
				if (info && info.mod && info.mod.cardEnabled) {
					delete info.mod.cardEnabled;
				}
			}
			for (let key in lib.skill.global) {
				const info = lib.skill.global[key];
				if (info && info.mod && info.mod.cardEnabled) {
					delete info.mod.cardEnabled;
				}
			}
			if (player.drawCardTimer) clearTimeout(player.drawCardTimer);
			player.drawCardTimer = setTimeout(() => {
				player.storage.gzt_kuangcai = 0;
				player.drawCardTimer = null;
			}, 5000);
			player.LingYu = setInterval(() => {
				player.refreshSkill();
				player.draw();
			}, 5000);
			player.storage.gzt_kuangcai++;
			player.getStockSkills().filter(function(skill) {
				return get.info(skill);
			}).forEach(function(skill) {
				player.enableSkill(skill);
			});
			player.addTempSkill("gzt_kuangcai_use");
		},
		subSkill: {
			use: {
				mod: {
					cardUsable(card) {
						if (get.info(card) && get.info(card).forceUsable) {
							return;
						}
						return Infinity;
					},
					targetInRange() {
						return true;
					},
					aiOrder(player, card, num) {
						var name = get.name(card);
						if (name == "tao") {
							return num + 7 + Math.pow(player.getDamagedHp(), 2);
						}
						if (name == "sha") {
							return num + 6;
						}
						if (get.subtype(card) == "equip2") {
							return num + get.value(card) / 3;
						}
					},
				},
				trigger: {
					player: "useCard",
					global:["logSkill"],
				},
				forced: true,
				charlotte: true,
				silent: true,
				popup: false,
				filter(event, player, name) {
					if (name == 'useCard') {
						return player.countMark("gzt_kuangcai") > 0;
					} else {
						return event.player != player;
					}
				},
				content() {
					console.clear();
					if (event.triggername == 'useCard') {
						player.draw();
						trigger.directHit.addArray(game.filterPlayer());
					} else {
						console.warn(trigger.player.getStockSkills().filter(function(skill) { return get.info(skill); }));
						game.broadcastAll(function (trigger) {
							trigger.player.outSkill('gzt_kuangcai_use');
						}, trigger);
						player.draw(5);
					}
				},
				ai: {
                	"directHit_ai": true,
				},
				sub: true,
			},
		},
	},
	"cxm_nishi": {
		enable: "phaseUse",
		usable: 1,
		filterCard: true,
		selectCard: 1,
		filter(event, player) {
			return player.countCards("h") > 0;
		},
		content() {
			"step 0"
			player.addTempSkill('cxm_nishi_a', {player: "phaseUseBefore"});
			"step 1"
			if(player.countCards("h", "shan") >= player.countCards("h", "sha")){
            	player.chooseUseTarget({ name: "tao", isCard: true }, true, false);
			}
			if(player.countCards("h", "sha") >= player.countCards("h", "shan")){
            	player.chooseUseTarget({ name: "jiu", isCard: true }, true, false);
			}
		},
		subSkill: {
			a: {
				mod: {
					cardname(card, player) {
						if (card.name == "shan") {
							return "sha";
						}
						if (card.name == "sha") {
							return "shan";
						}
					},
				},
				sub: true,
			},
		},
	},
	"cxm_anluan": {
		trigger: {
			player: "phaseUseAfter",
		},
		juexingji: true,
		skillAnimation: true,
    	animationColor: "wood",
		forced: true,
		filter(event, player) {
			return player.getStat('damage') && player.isMaxHp();;
		},
		derivation: ['cxm_yingwu'],
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			player.insertPhase();
			await player.loseMaxHp();
			await player.addSkills(["cxm_yingwu"]);
		},
	},
	"cxm_yingwu": {
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha') return num + 1;
			},
			maxHandcard(player, num) {
				return num + 2;
			},
		},
		trigger: {
			player: "phaseDrawBegin2",
		},
		forced: true,
		filter(event, player) {
			return !event.numFixed;
		},
		async content(event, trigger, player) {
			trigger.num++;
		},
	},
	"gzhlb_baimian": {
		enable: function(player) {
			try {
				return true;
			} catch (e) {
				return false;
			}
		},
		usable: 1,
		/*trigger: {
			global: "phaseBegin",
		},*/
		prompt: "是否摸两张牌？",
		content: function () {
			/*var allPlayers = game.filterPlayer() || [];
			for (var i = 0; i < allPlayers.length; i++) {
				var targetPlayer = allPlayers[i];
				game.send(targetPlayer, function (player) {
					var exclusiveText = `专属提示${player.name || player.playerid}`;
					player.CreateGefuTip(exclusiveText);
				});
			}*/
			player.draw(2);
			//player.gfDuoKui(player, trigger.player);
			/*
			"step 0";
			game.log(player, "对", trigger.player, "发起了猜拳");
			if (_status.connectMode) {
				player
					.GFchooseButtonOL(
						[
							[
								player,
								[
									"猜拳：请选择一种手势",
									[
										[
											["", "", "pss_stone"],
											["", "", "pss_scissor"],
										],
										"vcard",
									],
								],
								true,
							],
							[
								trigger.player,
								[
									"猜拳：请选择一种手势",
									[
										[
											["", "", "pss_stone"],
											["", "", "pss_scissor"],
										],
										"vcard",
									],
								],
								true,
							],
						],
						function () {},
						function () {
							return 1 + Math.random();
						}
					)
					.set("switchToAuto", function () {
						_status.event.result = "ai";
					})
					.set("processAI", function () {
						var buttons = _status.event.dialog.buttons;
						return {
							bool: true,
							links: [buttons.randomGet().link],
						};
					});
			}
			"step 1";
			if (_status.connectMode) {
				event.mes = result[player.playerid].links[0][2];
				event.tes = result[trigger.player.playerid].links[0][2];
				event.goto(4);
			} else {
				player.chooseButton(
					[
						"猜拳：请选择一种手势",
						[
							[
								["", "", "pss_stone"],
								["", "", "pss_scissor"],
							],
							"vcard",
						],
					],
					true
				).ai = function () {
					return 1 + Math.random();
				};
			}
			"step 2";
			event.mes = result.links[0][2];
			trigger.player.chooseButton(
				[
					"猜拳：请选择一种手势",
					[
						[
							["", "", "pss_stone"],
							["", "", "pss_scissor"],
						],
						"vcard",
					],
				],
				true
			).ai = function () {
				return 1 + Math.random();
			};
			"step 3";
			event.tes = result.links[0][2];
			"step 4";
			game.broadcast(function () {
				ui.arena.classList.add("thrownhighlight");
			});
			ui.arena.classList.add("thrownhighlight");
			game.addVideo("thrownhighlight1");
			player.$compare(game.createCard(event.mes, "", ""), trigger.player, game.createCard(event.tes, "", ""));
			game.log(player, "选择的手势为", "#g" + get.translation(event.mes));
			game.log(trigger.player, "选择的手势为", "#g" + get.translation(event.tes));
			game.delay(0, 1500);
			"step 5";
			var mes = event.mes.slice(4);
			var tes = event.tes.slice(4);
			var str;
			if (mes == tes) {
				str = "二人平局";
				player.popup("平", "metal");
				trigger.player.popup("平", "metal");
				game.log("猜拳的结果为", "#g平局");
				event.result = { tie: true };
			} else {
				if ({ paper: "stone", scissor: "paper", stone: "scissor" }[mes] == tes) {
					str = get.translation(player) + "胜利";
					player.popup("胜", "wood");
					trigger.player.popup("负", "fire");
					game.log(player, "#g胜");
					event.result = { bool: true };
				} else {
					str = get.translation(trigger.player) + "胜利";
					trigger.player.popup("胜", "wood");
					player.popup("负", "fire");
					game.log(trigger.player, "#g胜");
					event.result = { bool: false };
				}
			}
			game.broadcastAll(function (str) {
				var dialog = ui.create.dialog(str);
				dialog.classList.add("center");
				setTimeout(function () {
					dialog.close();
				}, 1000);
			}, str);
			game.delay(2);
			"step 6";
			game.broadcastAll(function () {
				ui.arena.classList.remove("thrownhighlight");
			});
			game.addVideo("thrownhighlight2");
			if (event.clear !== false) {
				game.broadcastAll(ui.clear);
			}*/
		},
	},
	"cxm_shixiao":{
		group: ["cxm_shixiao_a", "cxm_shixiao_b"],
		subSkill:{
			a: {
				enable: ["chooseToRespond","chooseToUse"],
				filter: function (event, player) {
					return player.hasSkill("cxm_shixiao_c");
				},
				filterCard(card, player) {
					return card.hasGaintag("cxm_shixiao");
				},
				position: "hes",
				viewAs: {
					name: "sha",
				},
				viewAsFilter(player) {
					const a = player.getCards("hes").some(card => {
						return card.hasGaintag("cxm_shixiao");
					});
					return a;
				},
				prompt: "将一张“狮哮”牌当【杀】使用或打出",
				check(card) {
					const val = get.value(card);
					if (_status.event.name == "chooseToRespond") {
						return 1 / Math.max(0.1, val);
					}
					return 5 - val;
				},
				sub: true,
			},
			b: {
				enable: "phaseUse",
				usable: 1,
				filter: function (event, player) {
					return !player.hasSkill("cxm_shixiao_c");
				},
				filterTarget(card, player, target) {
					return target != player && target.countCards("he") > 0;
				},
				selectTarget: [1, 2],
				multiline: true,
				async content(event, trigger, player) {
					const target = event.target;
					const { bool } = await target
						.chooseToUse(
							function (card, player, event) {
								if (get.name(card) != "sha") {
									return false;
								}
								return lib.filter.filterCard.apply(this, arguments);
							},
							"狮哮：对【" + get.translation(player) + "】使用【杀】，若未使用或使用的【杀】未对" + get.translation(player) + "造成伤害，则" + get.translation(player) + "获得你一张牌"
						)
						.set("targetRequired", true)
						.set("complexSelect", true)
						.set("complexTarget", true)
						.set("filterTarget", function (card, player, target) {
							if (target != _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) {
								return false;
							}
							return lib.filter.targetEnabled.apply(this, arguments);
						})
						.set("sourcex", player)
						.forResult();
					if (!target.countGainableCards(player, "he")) {
						return;
					}
					if (!bool || (bool && !target.hasHistory("sourceDamage", evt => evt.getParent(4) == event))) {
						await player.gainPlayerCard(target, "he", true).gaintag.add('cxm_shixiao');
						await player.addTempSkill("cxm_shixiao_c");
					}
				},
				ai: {
					threaten: 1.2,
					order: 4,
					expose: 0.2,
					result: {
						target(player, target) {
							if (target.countGainableCards(player, "he") == 0) {
								return 0;
							}
							return -1;
						},
						player(player, target) {
							if (!target.canUse("sha", player)) {
								return 0;
							}
							if (target.countCards("h") == 0) {
								return 0;
							}
							if (target.countCards("h") == 1) {
								return -0.1;
							}
							if (player.hp <= 2) {
								return -2;
							}
							if (player.countCards("h", "shan") == 0) {
								return -1;
							}
							return -0.5;
						},
					},
				},
				sub: true,
			},
			c: {
				onremove(player) {
					player.removeGaintag("cxm_shixiao");
				},
				sourceSkill: "cxm_shixiao",
				sub: true,
			 },
		},
	},
	"cxm_wuwei": {
		trigger: {
			global: "phaseBegin",
		},
		chargeSkill: 5,
		filter: function (event, player) {
			return player.countCharge() >= 3;
		},
		content: function () {
			var a = trigger.player.countCards("j");
			player.removeCharge(3);
			trigger.player.skip("phaseJudge");
			trigger.player.draw(a + 1);
			trigger.player.addTempSkill("cxm_wuwei_a");
		},
		group: ["cxm_wuwei_init", "cxm_wuwei_b"],
		subSkill: {
			a: {
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == 'sha') return num + 1;
					},
				},
				sub: true,
			},
			b: {
				trigger: {
					target: "useCardToTarget",
					global: "roundEnd",
				},
				frequent: true,
				filter(event, player, name) {
					if (name != 'roundEnd') {
						return event.card.name == "sha";
					} else {
						return true;
					}
				},
				async content(event, trigger, player) {
					if (event.triggername != 'roundEnd') {
						player.draw();
					}
					player.addCharge(1);
				},
				sub: true,
			},
			init: {
				trigger: {
					player: "enterGame",
					global: "phaseBefore",
				},
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				forced: true,
				locked: false,
				firstDo: true,
				async content(event, trigger, player) {
					player.addCharge(5);
				},
				"skill_id": "cxm_wuwei_init",
				sub: true,
				sourceSkill: "cxm_wuwei",
				"_priority": 0,
			},
		},
	},
	"gzhlb_huanzi": {
	},
	"gzhlb_jieyuan": {
		mark:true,
		init: function (player) {
			player.storage.gzhlb_jieyuan_a = [];
			player.storage.gzhlb_jieyuan_b = [];
			player.storage.gzhlb_jieyuan_c = [];
			player.storage.gzhlb_jieyuan_d = [];
		},
		intro: {
			mark(dialog, storage, player) {
				const fateGroups = [
					{
						groupName: '尘缘',
						items: [
							{ key: 'gzhlb_jieyuan_a', label: '强运' },
							{ key: 'gzhlb_jieyuan_c', label: '弱运' }
						]
					},
					{
						groupName: '劫缘',
						items: [
							{ key: 'gzhlb_jieyuan_b', label: '强运' },
							{ key: 'gzhlb_jieyuan_d', label: '弱运' }
						]
					}
				];
				let FateData = false;
				fateGroups.forEach(group => {
					const groupItems = [];
					group.items.forEach(item => {
						const targetList = player.storage?.[item.key] || [];
						if (targetList.length > 0 && targetList[0]?.name) {
							groupItems.push(`${item.label}：${ get.translation(targetList[0].name)}`);
							FateData = true;
						}
					});
					if (groupItems.length > 0) {
						dialog.addText(`【${group.groupName}】`);
						groupItems.forEach(text => {
							dialog.addText(text);
						});
						dialog.addText('——————');
					}
				});
				if (!FateData) {
					dialog.addText('当前无尘缘/劫缘绑定角色');
				}
			},
		},
		trigger: {
			global: "roundStart",
		},
		frequent: true,
		firstDo: true,
		content: function () {
			"step 0"
			event.count = 0;
			player.chooseControl('尘缘', '劫缘', 'cancel2', ui.create.dialog(get.prompt('gzhlb_jieyuan'), '是否选择“尘缘”或“劫缘”，然后依次选择两名角色AB，若选择<“尘缘”/“劫缘”>，则A使用有花色的<非伤害牌/伤害牌>结算后视为对B使用一张同牌名的无花色牌（场上至多同时存在一个“尘缘”与“夙缘”）？', 'hidden')).ai = function () {
				return 1;
			}
			"step 1"
			if (result.control == 'cancel2') {
				game.broadcastAll(function (player) {
					game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_jieyuan${[1, 2, 3, 4].randomGet()}.mp3`);
				}, player);
				player.draw(2);
				event.finish();
			}
			if (result.control == '尘缘') {
				event.count++;
				game.broadcastAll(function (player) {
					game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_jieyuan${[1, 2].randomGet()}.mp3`);
				}, player);
				player.storage.gzhlb_jieyuan_a = [];
				player.storage.gzhlb_jieyuan_c = [];
				player.chooseTarget(get.prompt('gzhlb_jieyuan'),'请先选择角色【A】，A使用有花色的非伤害牌结算后视为对B使用一张同牌名的无花色牌').set('ai',function(target){
					return 1;
				});
			}
			if (result.control == '劫缘') {
				game.broadcastAll(function (player) {
					game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_jieyuan${[3, 4].randomGet()}.mp3`);
				}, player);
				player.storage.gzhlb_jieyuan_b = [];
				player.storage.gzhlb_jieyuan_d = [];
				player.chooseTarget(get.prompt('gzhlb_jieyuan'),'请先选择角色【A】，A使用有花色的伤害牌结算后视为对B使用一张同牌名的无花色牌').set('ai',function(target){
					return 1;
				});
			}
			"step 2"
			if(result.bool){
				if(event.count > 0){
					player.markAuto("gzhlb_jieyuan_a", [result.targets[0]]);
					player.chooseTarget(true, get.prompt('gzhlb_jieyuan'),'请选择角色【B】，A使用有花色的非伤害牌结算后视为对B使用一张同牌名的无花色牌',function(card,player,target){
						return !player.storage.gzhlb_jieyuan_a.includes(target);
					}).set('ai',function(target){
						var player=_status.event.player,att=get.attitude(player,target);
						if(att<=0) return -3;
						if(att>0) return 2;
						return -1;
					});
				} else {
					player.markAuto("gzhlb_jieyuan_b", [result.targets[0]]);
					player.chooseTarget(true, get.prompt('gzhlb_jieyuan'),'请选择角色【B】，A使用有花色的伤害牌结算后视为对B使用一张同牌名的无花色牌',function(card,player,target){
						return !player.storage.gzhlb_jieyuan_b.includes(target);
					}).set('ai',function(target){
						var player=_status.event.player,att=get.attitude(player,target);
						if(att<=0) return 3;
						if(att>0) return -2;
						return -1;
					});
				}
			} else {
				player.draw(2);
				event.finish();
			}
			"step 3"
			if(result.bool){
				if(event.count > 0){
					player.markAuto("gzhlb_jieyuan_c", [result.targets[0]]);
				} else {
					player.markAuto("gzhlb_jieyuan_d", [result.targets[0]]);
				}
			}
		},
		group: "gzhlb_jieyuan_a",
		subSkill: {
			a: {
				/*init: function (player) {
					player.storage.gzhlb_jieyuan_lian = 0;
				},*/
				trigger:{
					global: "useCardAfter",
					//global: "useCardToPlayered",
				},
				forced: true,
				filter(event, player) {
					if (!event.targets) {
						return false;
					}
					if (get.info(event.card).complexTarget) {
						return false;
					}
					if (!lib.filter.cardEnabled(event.card, player, event.parent)) {
						return false;
					}
					var tag = get.tag(event.card, "damage");
					if (tag && !player.storage.gzhlb_jieyuan_b.includes(event.player)){
						return false;
					}
					if (!tag && !player.storage.gzhlb_jieyuan_a.includes(event.player)){
						return false;
					}
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (get.tag(event.card, "damage") && player.storage.gzhlb_jieyuan_d.includes(list[i])) {
							if (!list[i].isIn()) {
								return false;
							}
							if (!player.canUse({ name: event.card.name }, list[i], false, false)) {
								return false;
							}
						}
						if (!get.tag(event.card, "damage") && player.storage.gzhlb_jieyuan_c.includes(list[i])) {
							if (!list[i].isIn()) {
								return false;
							}
						}
					}
					return lib.suit.includes(get.suit(event.card));
				},
				content() {
					/*var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (get.tag(trigger.card, "damage") && player.storage.gzhlb_jieyuan_d.includes(list[i])) {
							if (player.storage.gzhlb_jieyuan_d.includes(list[i])) {
								trigger.player.line(list[i], "green");
								if (list[i] == trigger.target && player.countMark("gzhlb_jieyuan_lian") < 1) {
									trigger.getParent().effectCount++;
								} 
								if (list[i] != trigger.target && player.countMark("gzhlb_jieyuan_lian") < 1) {
									player.storage.gzhlb_jieyuan_lian += 2;
									trigger.targets.add(list[i]);
									trigger.getParent().triggeredTargets2.add(list[i]);
								}
							}
						}
						if (!get.tag(trigger.card, "damage") && player.storage.gzhlb_jieyuan_c.includes(list[i])) {
							if (player.storage.gzhlb_jieyuan_c.includes(list[i])) {
								trigger.player.line(list[i], "green");
								if (list[i] == trigger.target && player.countMark("gzhlb_jieyuan_lian") < 1) {
									trigger.getParent().effectCount++;
								} 
								if (list[i] != trigger.target && player.countMark("gzhlb_jieyuan_lian") < 1) {
									player.storage.gzhlb_jieyuan_lian += 2;
									trigger.targets.add(list[i]);
									trigger.getParent().triggeredTargets2.add(list[i]);
								}
							}
						}
					}
					player.storage.gzhlb_jieyuan_lian--;*/
					var card = game.createCard(trigger.card.name, "none", trigger.card.number, trigger.card.nature);
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (get.tag(trigger.card, "damage") && player.storage.gzhlb_jieyuan_d.includes(list[i])) {
							if (player.storage.gzhlb_jieyuan_d.includes(list[i])) {
								trigger.player.useCard(card, list[i]);
								game.broadcastAll(function (player) {
									game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_jieyuan${[3, 4].randomGet()}.mp3`);
								}, player);
							}
						}
						if (!get.tag(trigger.card, "damage") && player.storage.gzhlb_jieyuan_c.includes(list[i])) {
							if (player.storage.gzhlb_jieyuan_c.includes(list[i])) {
								trigger.player.useCard(card, list[i]);
								game.broadcastAll(function (player) {
									game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_jieyuan${[1, 2].randomGet()}.mp3`);
								}, player);
							}
						}
					}
				},
				sub: true,
				parentskill: "gzhlb_jieyuan",
				sourceSkill: "gzhlb_jieyuan",
				"_priority": 0,
			},
		},
	},
	"gzhlb_tianshi":{
		enable: "phaseUse",
        trigger:{
            player: "dying",
        },
		usable: 1,
        content:function(){
            "step 0"
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_tianshi${[1, 2].randomGet()}.mp3`);
			}, player);
            player.draw();
            'step 1'
			if (player.hasUseTarget(result[0], true, true)) {
				player.chooseUseTarget(result[0]);
			} else {
				event.finish();
			}
            'step 2'
            if(result.bool){
                event.goto(0);
            }
        },
        ai:{
            order:3,
            effect:{
                target:function(card,player,target){
                    if(get.color(card)=='red') return [1,0.6];
                },
                player:function(card,player,target){
                    if(get.color(card)=='red') return [1,1];
                },
            },
        },
        "_priority":0,
	},
	"gzhlb_yuanqing":{
		trigger:{
			player:"useCard",
			target:"useCardToTargeted",
		},
		forced:true,
		filter:function(event,player,name){
			if(name!='useCard'&&player==event.player) return false;
			var suit=get.suit(event.card);
			if(!lib.suit.contains(suit)) return false;
			if(player.getStorage("gzhlb_yuanqing").includes(suit)) return false;
			return true;
		},
		content:function(){ 
			var card=trigger.cards[0];
			player.logSkill("yuanqing");
			player.addToExpansion(card,'gain2').gaintag.add('gzhlb_yuanqing_4');
			player.markAuto('gzhlb_yuanqing',[get.suit(trigger.card)]);
		},
		group:["gzhlb_yuanqing_1","gzhlb_yuanqing_2","gzhlb_yuanqing_3","gzhlb_yuanqing_4"],
		subSkill:{
			"1":{
				trigger:{
					player:"gzhlb_yuanqingAfter",
				},
				frequent:true,
				filter:function(event,player,name){
					if(player.countMark('gzhlb_yuanqing_3')>0) return false;
					var cards=player.getExpansions('gzhlb_yuanqing_4').slice(0);
					if(cards.length>3){
						return true;
					}
				},
				content:function(){
					player.logSkill("shuchen");
					player.storage.gzhlb_yuanqing=[];
					player.addMark('gzhlb_yuanqing_3',1);
					var cards=player.getExpansions('gzhlb_yuanqing_4');
					if(cards.length) player.gain(cards,'draw');
				},
				sub:true,
				"_priority":0,
			},
			"2":{
				trigger:{
					player:"dying",
				},
				usable:1,
				frequent:true,
				filter:function(event,player,name){
					if(player.countMark('gzhlb_yuanqing_3')>0) return false;
					var cards=player.getExpansions('gzhlb_yuanqing_4').slice(0);
					if(cards.length>0){
						return true;
					}
				},
				content:function(){
					player.logSkill("shuchen");
					player.storage.gzhlb_yuanqing=[];
					player.addMark('gzhlb_yuanqing_3',1);
					var cards=player.getExpansions('gzhlb_yuanqing_4');
					if(cards.length) player.gain(cards,'draw');
				},
				sub:true,
				"_priority":0,
			},
			"3":{
				trigger:{
					global:"phaseEnd",
				},
				intro:{
					mark:true,
					content:function(storage,player,skill){
						if(player.countMark('gzhlb_yuanqing_3')>0) return '本回合已使用1次';
						if(player.countMark('gzhlb_yuanqing_3')<1) return '本回合已使用0次';
					},
					onunmark:true,
				},
				forced:true,
				popup:false,
				content:function(){
					player.removeMark('gzhlb_yuanqing_3',1);
				},
				sub:true,
				"_priority":0,
			},
			"4":{
				intro: {
					markcount(storage, player) {
						const cards = player.getExpansions('gzhlb_yuanqing_4') || [];
						if (!cards.length) return "暂无卡牌";
						const suitMap = { 'spade': '♠', 'heart': '♥', 'club': '♣', 'diamond': '♦', 'none': '◈' };
						const suitSymbols = [...new Set(cards.map(card => card.suit || 'none'))]
							.map(suit => suitMap[suit])
							.join('');
						return suitSymbols;
					},
					mark(dialog, storage, player) {
						const cards = player.getExpansions('gzhlb_yuanqing_4') || [];
						if (!cards.length) {
							dialog.addText("暂无卡牌");
							return;
						}
						dialog.addAuto(cards);
						dialog.addText(`<br>总计：${cards.length}张卡牌`);
					},
				},
				trigger:{
					player:["gzhlb_yuanqing_1After","gzhlb_yuanqing_2After"],
				},
				frequent:true,
				logTarget:function(){
					return _status.currentPhase;
				},
				content:function(){
					player.line(_status.currentPhase,'green');
					_status.currentPhase.addTempSkill('gzhlb_yuanqing_5','phaseUseEnd');
				},
				sub:true,
				"_priority":0,
			},
			"5":{
				mod:{
					cardUsable:function(card,player,num){
						if(card.name=='sha') return num+1;
					},
				},
				sub:true,
				"_priority":0,
			},
		},
		"_priority":0,
	},
	"gzhlb_dunjian":{
        mark:true,
        marktext:"盾",
        intro:{
            name:"遁剑",
            content:"你的拥有#个“盾”标记。",
        },
        init:function(player){
            player.storage.gzhlb_dunjian=0;
            player.markSkill("gzhlb_dunjian");
            player.syncStorage("gzhlb_dunjian");
        },
        trigger:{
            player:"damageEnd",
        },
        forced:true,
        filter:function(event,player){
            return player.countMark('gzhlb_dunjian')<3;
        },
        content:function(){
            'step 0'
			player.logSkill("xinjushou");
            player.judge();
            'step 1'
            if(result.color=='black'){
                player.changeHujia();
            }else{
                player.draw();
            }
            player.addMark('gzhlb_dunjian',1);
        },
        group:["gzhlb_dunjian_1","gzhlb_dunjian_2","gzhlb_dunjian_init"],
        subSkill:{
            "1":{
                trigger:{
                    source:"damageBegin1",
                },
                filter:function(event,player){
                    return player.countMark('gzhlb_dunjian')>0;
                },
                "prompt2":function(event,player){
                    var a=player.countMark('gzhlb_dunjian');
                    var num=get.cnNumber(event.num,true);
                    if(a>event.num){
                        return '你可以将即将'+num+'点伤害调整为'+a+'并摸'+a+'张牌。';
                    }else{
                        return '你可以将即将'+num+'点伤害调整为'+a+'并摸'+2*a+'张牌。';
                    }
                },
                content:function(){
					player.logSkill("xinjiewei");
                    var a=player.countMark('gzhlb_dunjian');
                    if(a>trigger.num){
                        trigger.num+=a-trigger.num;
                        player.draw(a);
                    }else{
                        trigger.num-=trigger.num-a;
                        player.draw(2*a);
                    }
                    player.removeMark('gzhlb_dunjian',a);
                },
                sub:true,
                "_priority":0,
            },
            "2":{
                trigger:{
                    player:"phaseZhunbeiBefore",
                },
                frequent:true,
                filter:function(event,player){
                    return player.countMark('gzhlb_dunjian')<3;
                },
                content:function(){
                    player.addMark('gzhlb_dunjian',1);
                },
                sub:true,
                "_priority":0,
            },
            init:{
                trigger:{
                    global:"phaseBefore",
                    player:"enterGame",
                },
                forced:true,
                locked:false,
                filter:function(event,player){
                    return (event.name!='phase'||game.phaseNumber==0);
                },
                content:function(){
                    'step 0'
                    var map={};
                    var list=[];
                    for(var i=0;i<=2;i++){
                        var cn=get.cnNumber(i,true);
                        map[cn]=i;
                        list.push(cn);
                    }
                    event.map=map;
                    player.chooseControl(list,function(){
                        return get.cnNumber(_status.event.goon,true);
                    }).set('prompt','请选择获得0~2个“盾”标记').set('goon',num);
                    'step 1'
                    var num=event.map[result.control];
                    if(num>0){
						player.logSkill("xinjushou");
                        player.addMark("gzhlb_dunjian",num);
                    }
                },
                sub:true,
                "_priority":0,
            },
        },
        "_priority":0,
    },
    "gzhlb_huishann":{
        enable:"phaseUse",
        usable:1,
        content:function(){
            event.count=0;
			player.logSkill("zuoding");
            var list=game.filterPlayer();
            for(var i=0;i<list.length;i++){
                if(list[i].countMark('gzhlb_huishann_1')<1){
                    if(list[i].countMark('gzhlb_huishann_3')<1){
                        list[i].addMark('gzhlb_huishann_3',1,false);
                        event.count++;
                    }
                }
            }
            if(list.length-event.count>0){
                player.draw(list.length-event.count);
            }
        },
        ai:{
            order:11,
            result:{
                player:1,
            },
            threaten:1,
        },
        group:["gzhlb_huishann_1","gzhlb_huishann_2"],
        global:"gzhlb_huishann_3",
        subSkill:{
            "1":{
                trigger:{
                    global:"roundStart",
                },
                forced:true,
                popup:false,
                logTarget:function(event,player){
                    return game.filterPlayer((current)=>current)||player;
                },
                content:function(){
                    var list=game.filterPlayer();
                    for(var i=0;i<list.length;i++){
                        if(list[i].countMark('gzhlb_huishann_1')>0){
                            list[i].removeMark('gzhlb_huishann_1',
                            list[i].countMark('gzhlb_huishann_1'));
                        }
                    }
                },
                sub:true,
                "_priority":0,
            },
            "2":{
                trigger:{
                    global:"damageAfter",
                },
                frequent:true,
                popup:false,
                filter:function(event){
                    return event.num>0;
                },
                content:function(){
                    trigger.player.addMark('gzhlb_huishann_1',1);
                },
                sub:true,
                "_priority":0,
            },
            "3":{
                marktext:"绘",
                intro:{
                    name:"绘山",
                    content:"你的手牌上限减2，弃牌阶段结束后，摸两张牌",
                },
                mod:{
                    maxHandcard:function(player,num){
                        if(player.hasMark('gzhlb_huishann_3')){
                            return num-2;
                        }
                    },
                },
                trigger:{
                    player:"phaseDiscardEnd",
                },
                popup:false,
                forced:true,
                charlotte:true,
                filter:function(event,player){
                    return event.player.hasMark('gzhlb_huishann_3');
                },
                content:function(){
					player.logSkill("zuoding");
                    trigger.player.draw(2);
                },
                sub:true,
                "_priority":0,
            },
        },
        "_priority":0,
    },
    "gzhlb_huimeng":{
        enable:"chooseToUse",
        filter:function(event,player){
            return player.countCards('hes')>0;
        },
        hiddenCard:function(player,name){
            return (!player.getStorage('gzhlb_huimeng').contains(name)&&player.countCards('hes')>0&&lib.inpile.contains(name));
        },
        init:function(player){
            if(!player.storage.gzhlb_huimeng) player.storage.gzhlb_huimeng=[];
        },
        onremove:true,
        chooseButton:{
            dialog:function(event,player){
                var list=[];
                for(var i=0;i<lib.inpile.length;i++){
                    var name=lib.inpile[i];
                    if(player.storage.gzhlb_huimeng&&player.storage.gzhlb_huimeng.contains(name)) continue;
                    if(name=='sha'){
                        list.push(['基本','','sha']);
                        for(var j of lib.inpile_nature) list.push(['基本','','sha',j]);
                    }
                    else if(get.type(name)=='trick') list.push(['锦囊','',name]);
                    else if(get.type(name)=='basic') list.push(['基本','',name]);
                    else if(get.type(name)=='delay') list.push(['延时锦囊','',name]);
                }
                if(list.length==0){
                    return ui.create.dialog('绘梦已无可用牌');
                }
                return ui.create.dialog('绘梦',[list,'vcard']);
            },
            filter:function(button,player){
                return _status.event.getParent().filterCard({name:button.link[2]},player,_status.event.getParent());
            },
            check:function(button){
                var player=_status.event.player;
                if(player.countCards('hs',button.link[2])>0) return 0;
                if(button.link[2]=='wugu') return 0;
                var effect=player.getUseValue(button.link[2]);
                if(effect>0) return effect;
                return 0;
            },
            backup:function(links,player){
                return {
                    filterCard:true,
                    selectCard:1,
                    popname:true,
                    check:function(card){
                        return 6-get.value(card);
                    },
                    position:'hes',
                    viewAs:{name:links[0][2],nature:links[0][3]},
                    onuse:function(result,player){
						player.logSkill("huomo");
                        player.storage.gzhlb_huimeng.add(result.card.name);
                    },
                }
            },
            prompt:function(links,player){
                return '将一张牌当做'+(get.translation(links[0][3])||'')+get.translation(links[0][2])+'使用';
            },
        },
        ai:{
            combo:"gzhlb_huishann_3",
            fireAttack:true,
            respondSha:true,
            respondShan:true,
            skillTagFilter:function(player){
                if(!player.countCards('hse')) return false;
            },
            order:4,
            result:{
                player:function(player){
                    var allshown=true,players=game.filterPlayer();
                    for(var i=0;i<players.length;i++){
                        if(players[i].ai.shown==0){
                            allshown=false;
                        }
                        if(players[i]!=player&&players[i].countCards('h')&&get.attitude(player,players[i])>0){
                            return 1;
                        }
                    }
                    if(allshown) return 1;
                    return 0;
                },
            },
            threaten:1.5,
        },
        group:"gzhlb_huimeng_1",
        subSkill:{
            "1":{
                trigger:{
                    player:["useCardAfter","respondAfter"],
                },
                forced:true,
                filent:true,
                popup:false,
                charlotte:true,
                filter:function(event,player){
                    if(!game.hasPlayer(current=>current!=player)) return false;
                    return event.skill=='gzhlb_huimeng_backup';
                },
                content:function(){
                    "step 0"
                    event.count=0;
                    var list=game.filterPlayer();
                    for(var i=0;i<list.length;i++){
                        if(list[i].countMark('gzhlb_huishann_3')>0){
                            event.count++;
                        }
                    }
                    "step 1"
                    if(event.count>0){
                        player.chooseTarget(get.prompt('gzhlb_huimeng'),'选择一名角色失去“绘”标记，或者你失去1点体力上限',function(card,player,target){
                            return target.countMark('gzhlb_huishann_3')>0;
                        }).set('ai',function(target){
                            var player=_status.event.player,att=get.attitude(player,target);
                            if(att<=0) return 3;
                            if(att>0) return 2;
                            return 1;
                        });
                    }
                    "step 2"
                    if(result.bool){
                        result.targets[0].removeMark('gzhlb_huishann_3',1);
                    }else{
                        player.loseMaxHp(); 
                    }
                },
                sub:true,
                "_priority":0,
            },
        },
        "_priority":0,
    },
	"gzhlb_tiaoxi":{
		intro:{
			content: "〖调戏〗还可使用#次",
		},
		enable:["chooseToUse", "chooseToRespond"],
		filter:function(event,player){
			if(player.countMark('gzhlb_tiaoxi')<(1)||player.countCards('hse')<2) return false;
			for(var i of lib.inpile){
				var type=get.type2(i);
				if((type=='basic'||type=='trick')&&lib.filter.filterCard({name:i},player,event)) return true;
			}
			return false;
		},
		chooseButton:{
			dialog:function(event,player){
				var list=[];
				for(var i=0;i<lib.inpile.length;i++){
					var name=lib.inpile[i];
					if(name=='sha'){
						if(event.filterCard({name:name},player,event)) list.push(['基本','','sha']);
						for(var j of lib.inpile_nature){
							if(event.filterCard({name:name,nature:j},player,event)) list.push(['基本','','sha',j]);
						}
					}
					else if(get.type2(name)=='trick'&&event.filterCard({name:name},player,event)) list.push(['锦囊','',name]);
					else if(get.type(name)=='basic'&&event.filterCard({name:name},player,event)) list.push(['基本','',name]);
				}
				return ui.create.dialog('调戏',[list,'vcard']);
			},
			filter:function(button,player){
				return _status.event.getParent().filterCard({name:button.link[2]},player,_status.event.getParent());
			},
			check:function(button){
				if(_status.event.getParent().type!='phase') return 1;
				var player=_status.event.player;
				if(['wugu','zhulu_card','yiyi','lulitongxin','lianjunshengyan','diaohulishan'].contains(button.link[2])) return 0;
				return player.getUseValue({
					name:button.link[2],
					nature:button.link[3],
				});
			},
			backup:function(links,player){
				return {
					filterCard:true,
					popname:true,
					check:function(card){
						return 8-get.value(card);
					},
					position:'hse',
					viewAs:{name:links[0][2],nature:links[0][3]},
					precontent:function(){
						player.logSkill("olsbwujing_draw");
						player.removeMark('gzhlb_tiaoxi',1);
					},
				}
			},
			prompt:function(links,player){
				return '将一张牌当做'+(get.translation(links[0][3])||'')+get.translation(links[0][2])+'使用';
			},
		},
		hiddenCard:function(player,name){
			var type=get.type2(name);
			return (type=='basic'||type=='trick')&&player.countCards('she')>0;
		},
		ai:{
			fireAttack:true,
			respondSha:true,
			respondShan:true,
			skillTagFilter:function(player){
				if(!player.countCards('hse')) return false;
			},
			order:1,
			result:{
				player:function(player){
					if(_status.event.dying) return get.attitude(player,_status.event.dying);
					return 1;
				},
			},
		},
		group:["gzhlb_tiaoxi_jiyu","gzhlb_tiaoxi_2","gzhlb_tiaoxi_jieshu"],
		subSkill:{
			"2":{
				trigger:{
					global:"phaseDiscardAfter",
				},
				forced:true,
				locked:false,
				filter:function(event,player){
					return event.player!=player&&event.player.countMark('gzhlb_tiaoxi_jiyu')>(0);
				},
				logTarget:"player",
				content:function(){
					'step 0'
					var target=trigger.player;
					event.target=target;
					'step 1'
					player.line(target,'green');
					var hs=target.getCards('he');
					var b=target.countMark('gzhlb_tiaoxi_jiyu');
					event.target.chooseCard(b,true,'交给'+get.translation(player)+b+'张牌','he');
					event.target.removeMark('gzhlb_tiaoxi_jiyu',b,false);
					event.target.syncStorage('gzhlb_tiaoxi_jiyu');
					player.addMark('gzhlb_tiaoxi',b,false);
					player.syncStorage('gzhlb_tiaoxi');
					'step 2'
					player.gain(result.cards,target,'give');
				},
				sub:true,
				"_priority":0,
			},
			jieshu:{
				trigger:{
					global:"phaseJieshuBegin",
				},
				filter:function(event,player){
					return !player.hasMark('gzhlb_tiaoxi_jieshu_1');
				},
				popup:false,
				forced:true,
				content:function(){
					player.drawTo(Math.min(player.maxHp));
					var a=trigger.player.hp;
					player.addMark('gzhlb_tiaoxi',a);
					player.addMark('gzhlb_tiaoxi_jieshu_1',1);
					player.loseMaxHp();
					player.removeSkill('gzhlb_tiaoxi_jieshu');
				},
				ai:{
					threaten:4,
				},
				derivation:"gzhlb_tiaoxi",
				sub:true,
				"_priority":0,
			},
			jiyu:{
				marktext:"调",
				intro:{
					name:"调",
					content:"弃牌阶段结束后需交给拥有〖调戏〗的角色#张牌",
				},
				trigger:{
					player:["useCardAfter","respondAfter"],
				},
				forced:true,
				popup:false,
				filter:function(event,player){
					return event.skill=='gzhlb_tiaoxi_backup';
				},
				content:function(){
					'step 0'
					player.chooseTarget(true,function(card,player,target){
						return target!=player;
					},'奇策<br><br><div class="text center">交给一名其他角色一张手牌').set('ai',function(target){
						var player=_status.event.player;
						if(get.attitude(player,target)>0){
							if(get.attitude(target,player)>0){
								return target.countCards('hse');
							}
							return target.countCards('hse')/2;
						}
						return 0;
					});
					'step 1'
					var target=result.targets[0];
					event.target=target;
					player.line(target,'green');
					player.chooseCard(1,true,'交给'+get.translation(target)+'一张牌','hse');
					'step 2'
					var target=event.target;
					if(result.bool){
						target.gain(result.cards,player,'give');
						target.addMark('gzhlb_tiaoxi_jiyu',1);
					}
				},
				sub:true,
				"_priority":0,
			},
		},
		"_priority":0,
	},
	"gzhlb_yikong": {
		trigger: {
			global: "roundStart",
		},
		forced: true,
		popup: false,
		init(player) {
			if (game.online) {
				return;
			}
			player.removeAdditionalSkill("gzhlb_yikong");
			var list = [];
			if (player.phaseNumber % 2 == 0) {
				list.push("yiji");
			} else {
				list.push("kongcheng");
			}
			if (list.length) {
				player.addAdditionalSkill("gzhlb_yikong", list);
			}
		},
		derivation: ["kongcheng","yiji"],
		content() {
			player.removeAdditionalSkill("gzhlb_yikong");
			var list = [];
			if (trigger.num != undefined) {
				player.logSkill("olsbwujing");
			}
			if (player.phaseNumber % 2 == 0) {
				list.push("yiji");
			} else {
				list.push("kongcheng");
			}
			if (list.length) {
				player.addAdditionalSkill("gzhlb_yikong", list);
			}
		},
	},
	"gzhlb_chenyu":{
		trigger: {
			global: "phaseJieshuBegin",
		},
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		prompt: function (event, player, name) {
			if (name != 'phaseJieshuBegin') {
				return '是弃置1/2/3张牌，然后你进行一次判定，若结果为方片/红色/有色，你摸3张牌；若不为，你弃置1/2/3张牌？';
			} else {
				return '是否发动〖谶语〗？';
			}
		},
		frequent: true,
		filterCard: true,
		selectCard: [1, 3],
		filter: function (event, player) {
			return player.countCards("h") > 0 && !player.hasSkill("gzhlb_chenyu_1");
		},
		position: "h",
		content: function () {
			'step 0'
			if(event.triggername == 'phaseJieshuBegin'){
				player
					.chooseToDiscard("h", [1, 3], "是弃置1/2/3张牌，然后【" + get.translation(_status.currentPhase) + "】进行一次判定，若结果为方片/红色/有色，其摸3张牌；若不为，你弃置其1/2/3张牌？")
					.set("ai", function (card) {
						if (_status.event.goon) {
							return 8 - get.value(card);
						}
						return 0;
					})
					.set("goon");
			}
			'step 1'
			if(event.triggername == 'phaseJieshuBegin' && result.bool){
				var cards = result.cards;
				event.cards = cards;
			}
			if (cards && cards.length == 1) {
				_status.currentPhase.judge(function (card) {
					if (get.suit(card) == "diamond") {
						return 3;
					}
					return -2;
				}).judge2 = function (result) {
					return result.bool == false ? false : true;
				};
			}
			if (cards && cards.length == 2) {
				_status.currentPhase.judge(function (card) {
					if (get.color(card) == 'red') {
						return 3;
					}
					return -2;
				}).judge2 = function (result) {
					return result.bool == false ? false : true;
				};
			}
			if (cards && cards.length == 3) {
				_status.currentPhase.judge(function (card) {
					if (get.color(card) != 'none') {
						return 3;
					}
					return -2;
				}).judge2 = function (result) {
					return result.bool == false ? false : true;
				};
			}
			'step 2'
			player.addTempSkill("gzhlb_chenyu_1");
			if (result.bool == true) {
				_status.currentPhase.draw(3);
			} else {
				if(event.triggername == 'phaseJieshuBegin'){
					var cards = event.cards;
				}
				if(cards) {
					player.discardPlayerCard(true, _status.currentPhase, 'he', cards.length);
					player.draw(cards.length);
				}
			}
		},
		subSkill: { "1": { sub: true, }, },
	},
	"gzhlb_yuduan":{
		init: function (player) {
			player.storage.gzhlb_yuduan = [];
		},
		trigger: {
			global: "judgeBefore",
		},
		frequent: true,
		content() {
			"step 0"
			var suitd = lib.suit.concat([{ name: "取消", value: "cancel" }]);
			player
				.chooseControl(suitd)
				.set("prompt", "请选择一种花色，若选择花色与本次判定花色相同，你可更改本次判定的花色并摸一张牌")
				.set("ai", function () {
					return lib.suit.randomGet() || suitd[0].value;
				});
			"step 1"
			if (result.control != "cancel") {
				game.broadcastAll(function (player) {
					game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_yuduan${[1, 2].randomGet()}.mp3`);
				}, player);
				player.storage.gzhlb_yuduan = result.control;
				console.warn(`${player.storage.gzhlb_yuduan}`);
			} else {
				player.storage.gzhlb_yuduan = [];
			}
		},
		group: "gzhlb_yuduan_a",
		subSkill: {
			a: {
				trigger: {
					global: "judge",
				},
				popup: false,
				filter(event, player) {
					if (event.fixedResult && event.fixedResult.suit) {
						return event.fixedResult.suit == player.storage.gzhlb_yuduan;
					}
					return get.suit(event.player.judging[0], event.player) == player.storage.gzhlb_yuduan;
				},
				async cost(event, trigger, player) {
					const str = "预断：【" + get.translation(trigger.player) + "】的" + (trigger.judgestr || "") + "判定为" + get.translation(trigger.player.judging[0]) + "，请将其改为一种花色";
					const { control } = await player
						.chooseControl("spade", "heart", "diamond", "club")
						.set("prompt", str)
						.set("ai", function () {
							const player = get.player();
							const judging = _status.event.judging;
							const trigger = _status.event.getTrigger();
							const list = lib.suit.slice(0);
							const attitude = get.attitude(player, trigger.player);
							if (attitude == 0) {
								return 0;
							}
							const getj = function (suit) {
								return trigger.judge({
									name: get.name(judging),
									nature: get.nature(judging),
									suit: suit,
									number: get.number(judging),
								});
							};
							list.sort(function (a, b) {
								return (getj(b) - getj(a)) * get.sgn(attitude);
							});
							return list[0];
						})
						.set("judging", trigger.player.judging[0])
						.forResult();
					event.result = {
						bool: control != "cancel2",
						cost_data: control,
					};
				},
				async content(event, trigger, player) {
					const control = event.cost_data;
					game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_yuduan${[1, 2, 3].randomGet()}.mp3`);
					}, player);
					player.addExpose(0.25);
					player.popup(control);
					game.log(player, "将判定结果改为了", "#y" + get.translation(control + 2));
					if (!trigger.fixedResult) {
						trigger.fixedResult = {};
					}
					trigger.fixedResult.suit = control;
					trigger.fixedResult.color = get.color({ suit: control });
					player.draw();
				},
				ai: {
					rejudge: true,
					tag: {
						rejudge: 0.4,
					},
					expose: 0.5,
				},
				sub: true,
			},
		},
	},
	"gzhlb_mianju":{
		enable:"phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		prompt:"是否选择一名拥有“面”标记的其他角色，然后其流失1点体力且你获得其武将牌并展示之（你视为该武将）、将体力上限调整为1、将所有手牌置于武将牌上、摸4张牌、获得1点护甲？",
		filter:function(event,player){
			var list=game.filterPlayer();
			event.count=0
			for(var i=0;i<list.length;i++){
				if(list[i].countMark('gzhlb_mianju_a')>0&&list[i]!=player){
					event.count++;
				}
			}
			return event.count>0;
		},
		filterTarget:function (event,player,target) {
			return target!=player&&target.countMark('gzhlb_mianju_a')>0;
		},
		selectTarget:1,
		content:function(){
			target.loseHp();
			player.gfMianJu({ name: target.name, hp: 1, maxHp: 1, hujia: 1, group: target.group, sex: player.sex, skills: target.getStockSkills().filter(function(skill) { return get.info(skill); }), });
			player.addSkill('gzhlb_mianju_1');
			player.addSkill('gzhlb_mianju_3');
			target.removeMark('gzhlb_mianju_a',target.countMark('gzhlb_mianju_a'));
			//target.addSkill('gzhlb_mianju_2'); 
		},
		"_priority":0,
		group: ["gzhlb_mianju_a", "gzhlb_mianju_b", "gzhlb_mianju_1"],
		subSkill:{
			a: {
				intro: {
					name: "面具",
					content: "你已被〖面具〗标记。",
				},
				trigger: {
					player: "phaseUseBefore",
				},
				frequent:true,
				filter:function(event,player){
					return player.countCards("h")>0;
				},
				content() {
					"step 0"
					player
						.chooseTarget(get.prompt("gzhlb_mianju"), "是否与一名没用“面”标记的其他角色进行拼点，对方的点数减其拥有的手牌数，若你赢，其获得一枚“面”标记？", function (card, player, target) {
							return target != player && player.canCompare(target) && target.countMark('gzhlb_mianju_a') < 1;
						})
						.set("ai", function (target) {
							var player = _status.event.player;
							return get.attitude(player, target) < 0;
						});
					"step 1"
					if (result?.bool) {
						game.broadcastAll(function (player) {
							game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_mianju${[3, 4].randomGet()}.mp3`);
						}, player);
						event.target = result.targets[0];
						player.chooseToCompare(event.target);
					}
					"step 2"
					if (result?.bool) {
						event.target.addMark("gzhlb_mianju_a", 1);
					}
				},
				sub: true,
			},
			b: {
				trigger: {
					player: "compare",
				},
				forced: true,
				popup: false,
				filter(event, player) {
					return event.getParent().name == "gzhlb_mianju_a" && event.num2 > 0 && event.target.countCards("h") > 0;
				},
				content() {
					const num = (trigger.num2 - trigger.target.countCards("h") < 0) ? trigger.num2 : trigger.target.countCards("h");
					game.log(trigger.target, "的拼点牌点数-", num);
					trigger.num2 = Math.max(0, trigger.num2 - num);
				},
				"skill_id": "gzhlb_mianju_b",
				sub: true,
				sourceSkill: "gzhlb_mianju",
			},
			"1":{
				trigger:{
					player:"dieBefore",
				},
				filter:function(event,player){
					var list=game.filterPlayer();
					event.count=0
					for(var i=0;i<list.length;i++){
						if(list[i].countMark('gzhlb_mianju_a')>0&&list[i]!=player){
							event.count++;
						}
					}
					return event.count>0;
				},
				"prompt2":'是否选择一名拥有“面”标记的其他角色，然后其流失1点体力且你获得其武将牌并展示之（你视为该武将）、将体力上限调整为1、将所有手牌置于武将牌上、摸4张牌、获得1点护甲？',
				content:function(){
					'step 0'
					var list=game.filterPlayer();
					for(var i=0;i<list.length;i++){
						if(list[i].hasSkill('gzhlb_mianju_2')){
							list[i].removeSkill('gzhlb_mianju_2');
						}
					}
					player.removeSkill('gzhlb_mianju_1');
					player.removeSkill('gzhlb_mianju_3');
					'step 1'
					var list=game.filterPlayer();
					event.count=0
					for(var i=0;i<list.length;i++){
						if(list[i].countMark('gzhlb_mianju_a')>0&&list[i]!=player){
							event.count++;
						}
					}
					if(event.count>0){
						player.chooseTarget(get.prompt('gzhlb_mianju'),'你可以选择一名拥有“面”标记的其他角色，然后你获得其武将牌并展示之、将体力上限调整为1、将所有手牌置于武将牌上、弃1枚“戏”标记、获得其所有非Charlotte技、摸3张牌、获得1点护甲，最后你令其翻面且相应技能失效直至你弃置展示的武将牌或其回合开始前。',function(card,player,target){
							return target!=player&&target.countMark('gzhlb_mianju_a')>0;
						})
					}
					'step 2'
					if(result.targets&&result.targets.length){
						trigger.cancel();
						game.broadcastAll(function (player) {
							game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_mianju${[1, 2].randomGet()}.mp3`);
						}, player);
						var target=result.targets[0];
						target.loseHp();
						player.gfMianJu({ name: target.name, hp: 1, maxHp: 1, hujia: 1, skills: target.getStockSkills().filter(function(skill) { return get.info(skill); }), });
						player.addSkill('gzhlb_mianju_1');
						player.addSkill('gzhlb_mianju_3');
						target.removeMark('gzhlb_mianju_a',target.countMark('gzhlb_mianju_a'));
						//target.addSkill('gzhlb_mianju_2'); 
					}
				},
				sub:true,
				"_priority":0,
			},
			/*"2":{
				init:function(player,skill){
					player.addSkillBlocker(skill);
				},
				onremove:function(player,skill){
					player.removeSkillBlocker(skill);
				},
				charlotte:true,
				skillBlocker:function(skill,player){
					return !lib.skill[skill].charlotte;
				},
				mark:true,
				intro:{
					content:function(storage,player,skill){
						var list=player.getSkills(null,false,false).filter(function(i){
							return lib.skill.gzhlb_mianju_2.skillBlocker(i,player);
						});
						if(list.length) return '失效技能：'+get.translation(list);
						return '无失效技能';
					},
				},
				trigger:{
					player:"phaseBefore",
				},
				forced:true,
				content:function(){
					var list=game.filterPlayer();
					for(var i=0;i<list.length;i++){
						if(list[i].countMark('gzhlb_mianju_1')>0){
							list[i].die();
						}
					}
				},
				sub:true,
				"_priority":0,
			},*/
		},
	},
	"aqcs_xuri":{
		marktext: "光明护盾",
		intro: {
			name: "旭日卫冕",
			content(err, player) {
				return `拥有“光明护盾”的角色受到伤害时，移除一枚“光明护盾”，然后若此伤害为红色牌造成的伤害，此伤害降低50%；若此伤害不为红牌造成的伤害或受伤角色为此技能的拥有者，则此伤害降低100%`
			},
			markcount(err, player) {
				return `${player.countMark('aqcs_xuri')}`
			},
		},
		enable: "phaseUse",
		chargeSkill: 4,
		filter: function (event, player) {
			return player.countCharge() >= 4;
		},
		filterTarget: function (card, player, target) {
			return player.canUse("sha", target, null, false);
		},
		prompt: function () {
			return '是否移除4点蓄力值，视为对一名其他角色使用一张无距离次数限制且不计入次数的火【杀】并获得一枚“光明护盾”，然后你可选择一名其他角色并令其获得一枚“光明护盾”（至多为3）？';
		},
		content: function () {
			"step 0"
			player.removeCharge(4);
			player.useCard({ name: "sha" }, targets, false).animate = false;
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/aqcs_xuri${[1].randomGet()}.mp3`);
			}, player);
			if(player.countMark("aqcs_xuri") < 3) player.addMark("aqcs_xuri", 1);
			player.chooseTarget(get.prompt('aqcs_xuri'), "是否选择一名其他角色并令其获得一枚“光明护盾”？", function(card,player,target){
				return target != player && target.countMark("aqcs_xuri") < 3;
			}).set('ai', function (target) {
				var player = _status.event.player, att = get.attitude(player, target);
				if (att > 0) return 1;
				return -0.5;
			});
			"step 1"
			if (result.bool) {
				if(result.targets[0].countMark("aqcs_xuri") < 3) result.targets[0].addMark("aqcs_xuri", 1);
			}
		},
		init: function (player) {
			player.storage.aqcs_xuri_clear = 0;
		},
		mod: {
			cardUsable(card, player) {
				if (card?.storage?.aqcs_xuri) {
					return Infinity;
				}
			},
		},
		/*marktext: "光明护盾",
		intro: {
			name: "旭日卫冕",
			content(err, player) {
				return `拥有“光明护盾”的角色受到伤害时，移除一枚“光明护盾”，然后若此伤害为红色牌造成的伤害，此伤害降低50%；若此伤害不为红牌造成的伤害或受伤角色为此技能的拥有者，则此伤害降低100%`
			},
			markcount(err, player) {
				return `${player.countMark('aqcs_xuri')}`
			},
		},
		enable: "chooseToUse",
		prompt: function () {
			return '是否移除4点蓄力值，视为对一名其他角色使用一张无距离次数限制且不计入次数的火【杀】并获得一枚“光明护盾”，然后你可选择一名其他角色并令其获得一枚“光明护盾”（至多为3）？';
		},
		viewAsFilter(player) {
			return player.countCharge() >= 4;
		},
		viewAs: {
			name: "sha",
			isCard: true,
			nature: "fire",
			storage: {
				aqcs_xuri: true,
			},
		},
		filterCard: () => false,
		selectCard: -1,
		filterTarget: function (card, player, target) {
			return target != player;
		},
		chargeSkill: 4,
		log: false,
		precontent() {
			"step 0"
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/aqcs_xuri${[1].randomGet()}.mp3`);
			}, player);
			player.removeCharge(4);
			if(player.countMark("aqcs_xuri") < 3) player.addMark("aqcs_xuri", 1);
			player.chooseTarget(get.prompt('aqcs_xuri'), "是否选择一名其他角色并令其获得一枚“光明护盾”？", function(card,player,target){
				return target != player && target.countMark("aqcs_xuri") < 3;
			}).set('ai', function (target) {
				var player = _status.event.player, att = get.attitude(player, target);
				if (att > 0) return 1;
				return -0.5;
			});
			"step 1"
			if (result.bool) {
				if(result.targets[0].countMark("aqcs_xuri") < 3) result.targets[0].addMark("aqcs_xuri", 1);
			}
		},*/
		group: ["aqcs_xuri_init", "aqcs_xuri_a", "aqcs_xuri_b"],
		subSkill: {
			init: {
				trigger: {
					player: "enterGame",
					global: "phaseBefore",
				},
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				forced: true,
				locked: false,
				firstDo: true,
				async content(event, trigger, player) {
					player.addCharge(4);
				},
				"skill_id": "aqcs_xuri_init",
				sub: true,
				sourceSkill: "aqcs_xuri",
				"_priority": 0,
			},
			a:{
				trigger: {
					global: "damageBegin",
				},
				filter(event, player) {
					return event.player.countMark("aqcs_xuri") > 0;
				},
				forced: true,
				locked: false,
				firstDo: true,
				async content(event, trigger, player) {
					trigger.player.removeMark("aqcs_xuri", 1);
					if(get.color(trigger.card, false) != "red" || trigger.player.hasSkill("aqcs_xuri")){
						trigger.num -= trigger.num;
					} else if(get.color(trigger.card, false) == "red"){
						trigger.num -= trigger.num * 0.5;
					} 
				},
				sub: true,
			},
			b:{
				trigger: {
					player: ["damageEnd", "damageCancelled", "damageZero"],
					source: "damageSource",
				},
				frequent: true,
				content() {
					if(event.triggername != 'damageSource'){
						player.addCharge();
						player.draw();
					} else {
						player.addCharge();
					}
				},
				sub: true,
			},
			c: {
				trigger: {
					player: "shaBegin",
				},
				silentForce: true,
				filter(event, player) {
					if (event.card?.storage?.aqcs_xuri) {
						return event.name != "phase" || game.phaseNumber == 0;
					}
				},
				async content(event, trigger, player) {
					player.getStat().card.sha--;
				},
				/*mod: {
					cardUsable: function (card, player, num) {
						if (card.name == 'sha') return num += player.countMark('aqcs_xuri_clear');
					},
				},
				onremove: function (player) {
					player.unmarkSkill("aqcs_xuri_clear");
					delete player.storage.aqcs_xuri_clear;
				},*/
				sub: true,
			},
		},
	},
	"aqcs_rishen":{
		init: function (player) {
			player.storage.aqcs_rishen = {
				characterlist: ["aqcs_gmw_hjsl", "aqcs_gmw_ydn"],
			}
		},
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		GFzhaohuanSkill: true,
		filter: function (event) {
			return event.name != 'phase' || game.phaseNumber == 0;
		},
		"addcxm_saiers": function (player, num) {
			var list = [];
			for (var i = 0; i < num; i++) {
				var name = lib.skill.cxm_saier.addcxm_saier(player);
				if (name) list.push(name);
			}
			if (list.length) {
				game.log(player, '获得了光明王契约列表')
				lib.skill.cxm_saier.drawCharacter(player, list);
			}
		},
		content: function () {
			'step 0'
			lib.skill.aqcs_rishen.addcxm_saiers(player, 2);
			player.syncStorage('aqcs_rishen');
			player.markSkill('aqcs_rishen');
			event.logged = true;
			var cards = player.storage.aqcs_rishen.characterlist;
			var next = player.chooseButton(['日神祭礼：请从“光明王契约列表”中选择一只契约精灵', [cards, "character"]], 1, true);
			next.set('ai', function (button) {
				return cards.randomGet();
			});
			'step 1'
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/aqcs_rishen${[1].randomGet()}.mp3`);
			}, player);
			if(result.links == "aqcs_gmw_hjsl"){
				player.gfZhaohuan("aqcs_gmw_hjsl", "黄金圣龙", "male", "qun", "4/4/0", 4, "", "aqcs_huangjin");
			}
			if(result.links == "aqcs_gmw_ydn"){
				player.gfZhaohuan("aqcs_gmw_ydn", "雅典娜", "female", "qun", "3/3/1", 4, "", "aqcs_shengzhan");
			}
		},
		group: ["aqcs_rishen_a", "aqcs_rishen_f"],
		subSkill:{
			a:{
				init: function (player) {
					player.storage.aqcs_rishen_die = 0;
				},
				trigger: {
					global: "dieBefore",
				},
				priority: 15,
				nobracket: true,
				GFzhaohuanSkill: true,
				silent: true,
				popup: false,
				forceOut: true,
				forceDie: true,
				filter: function (event, player){
					if(player.countMark("aqcs_rishen_die")) return false;
					return event.player.name == 'aqcs_gmw_hjsl' || event.player.name == 'aqcs_gmw' || event.player.name == 'aqcs_gmw_ydn';
				},
				content: function (){
					'step 0'
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_gmw_hjsl' || list[i].name == 'aqcs_gmw_ydn' || list[i].name == 'aqcs_gmw') {
							event.count++;
						}
					}
					if(event.count > 1){
						trigger.cancel();
						game.broadcastAll(function (trigger) {
							trigger.player.out('aqcs_tianjue_e');
						}, trigger);
					}else{
						player.storage.aqcs_rishen_die = 1;
						if(trigger.player.name == 'aqcs_gmw_hjsl' || trigger.player.name == 'aqcs_gmw_ydn'){
							game.broadcastAll(function (player) {
								player.forceIn();
							}, player);
						}else{		
							var list = game.filterPlayer();
							for (var i = 0; i < game.players.length; i++) {
								var pl = game.players[i];
								game.broadcastAll(function (pl) {
									pl.in('aqcs_tianjue_e');
								}, pl);
							}
						}
					}
					'step 1'
					if(player.countMark("aqcs_rishen_die")){
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (list[i].name == 'aqcs_gmw_hjsl' || list[i].name == 'aqcs_gmw_ydn' || list[i].name == 'aqcs_gmw') {
								list[i].die();
							}
						}
					}
				},
				sub: true,
			},
			f:{
				trigger: {
					player: "useCard",
				},
				popup: false,
				silent: true,
				firstDo: true,
				GFzhaohuanSkill: true,
				async content(event, trigger, player) {
					trigger.directHit.addArray(
						game.filterPlayer(function (current) {
							return current.name == 'aqcs_gmw_hjsl' || current.name == 'aqcs_gmw_ydn';
						})
					);
				},
				sub: true,
			},
		},
	},
	"aqcs_huangjin":{
		/*mod: {
			playerEnabled(card, player, target, range) {
				var range2 = get.select(get.info(card).selectTarget);
				if((get.tag(card, "damage") && range2[0] == 1 && range2[1] == 1) || get.type(card, "trick") || card.name == "shunshou" || card.name == "guohe"){
					if (target.name == 'aqcs_gmw') return false;
				}
			},
		},*/
		trigger: {
			player: "phaseBegin",
		},
		forced: true,
		round: 1,
		content() {
			event.count = 0;
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (list[i].name == 'aqcs_gmw') {
					event.count++;
					player.draw();
					list[i].draw();
					var next = list[i].phaseUse();
					event.next.remove(next);
					trigger.next.push(next);
				}
			}
			if(event.count == 0) player.draw(2);
		},
		group: "aqcs_huangjin_a",
		subSkill:{
			a:{
				trigger: {
					player: "damageEnd",
					source: "damageSource",
				},
				filter: function(event, player, name){
					if(name == 'damageSource') {
						return event.player?.isIn() && event.player.countCards("he") > 0;
					} else {
						return event.source?.isIn() && event.source.countCards("he") > 0;
					}
				},
				forced: true,
				content() {
					const target = event.triggername === 'damageEnd' ? trigger.source : trigger.player;
					const hasEquip = target.countCards("e") > 0;
					var card = hasEquip ? target.getCards("e").randomGet() : target.getCards("h").randomGet();
					player.gain(card, "giveAuto", "bySelf");
				},
				sub:true,
			},
		},
	},
	"aqcs_shengzhan":{
		init: function (player) {
			player.storage.aqcs_shengzhan = 0;
		},
		/*mod: {
			playerEnabled(card, player, target, range) {
				var range2 = get.select(get.info(card).selectTarget);
				if((get.tag(card, "damage") && range2[0] == 1 && range2[1] == 1) || get.type(card, "trick") || card.name == "shunshou" || card.name == "guohe"){
					if (target.name == 'aqcs_gmw') return false;
				}
			},
		},*/
		trigger: {
			player: "useCardToPlayered",
		},
		forced: true,
		filter: function (event){
			if (event.getParent().triggeredTargets3.length > 1) return false;
			return event.card && event.card.name == 'sha';
		},
		async content(event, trigger, player) {
			var card = trigger.target.getCards("h").randomGet();
			trigger.target.addToExpansion(card, "giveAuto", trigger.target).gaintag.add("aqcs_shengzhan_b");
			trigger.target.addSkill("aqcs_shengzhan_b");
			const judgeEvent = player.judge(card => {
				if (get.color(card) == "red") {
					return 2;
				}
				return -0.5;
			});
			judgeEvent.judge2 = result => result.bool;
			const {
				result: { bool },
			} = await judgeEvent;
			if (bool) {
				trigger.target.storage.aqcs_shengzhan = 2;
				trigger.target.addTempSkill("qinggang2");
				trigger.target.storage.qinggang2?.add(trigger.card);
				trigger.target.markSkill("qinggang2");
			} else {
				player.draw();
				trigger.target.storage.aqcs_shengzhan = 5;
			}
			trigger.target.addTempSkill("aqcs_shengzhan_a");
		},
		group: "aqcs_shengzhan_d",
		subSkill:{
			a:{
				trigger: {
					player: "damageBegin3",
				},
				silentForce: true,
				async content(event, trigger, player) {
					player.removeSkill("aqcs_shengzhan_a");
					if (player.countMark("aqcs_shengzhan") > 2) {
						trigger.num = trigger.num * player.countMark("aqcs_shengzhan") * 0.1;
					} else {
						trigger.num = trigger.num * player.countMark("aqcs_shengzhan");
					}
				},
				sub:true,
			},
			b:{
				intro: {
					markcount: "expansion",
					mark(dialog, storage, player) {
						var cards = player.getExpansions("aqcs_shengzhan_b");
						if (player.isUnderControl(true)) {
							dialog.addAuto(cards);
						} else {
							return "共有" + get.cnNumber(cards.length) + "张牌";
						}
					},
				},
				trigger: {
					global: "useCardAfter",
				},
				silentForce: true,
				charlotte: true,
    			sourceSkill: "aqcs_shengzhan",
				filter: function (event, player){
					return event.card && event.card.name == 'sha' && player.getExpansions("aqcs_shengzhan_b").length > 0;
				},
				async content(event, trigger, player) {
					var cards = player.getExpansions("aqcs_shengzhan_b");
					player.gain(cards, "draw");
					game.log(player, "收回了" + get.cnNumber(cards.length) + "张“圣战之意”牌");
					player.removeSkill("aqcs_shengzhan_b");
				},
				sub:true,
			},
			c:{
				intro: {
					name: "圣战之意",
					content(err, player) {
						return "你免疫下一次黑色牌造成的伤害"
					},
				},
				mark: true,
				trigger: {
					player: "damageBefore",
				},
				filter(event, player) {
					return get.color(event.card, false) == "black";
				},
				forced: true,
				charlotte: true,
				async content(event, trigger, player) {
					trigger.cancel();
					player.removeSkill("aqcs_shengzhan_c");
				},
				sub:true,
			},
			d:{
				trigger: {
					source: "damageSource",
				},
				silentForce: true,
				content() {
					player.addSkill("aqcs_shengzhan_c");
				},
			}
		},
	},
	"seh_wangshi":{
		enable: "phaseUse",
		prompt: function () {
			var player = _status.event.player;
			if(player.hasSkill("seh_kongwang_loseMaxHp")){
				return '是否视为使用一张你手牌中存在的基本牌或普通锦囊牌，你可将此牌转化为任意花色？';
			}else{				
				if(player.countMark("seh_kongwang_die") > 0){
					return '是否移除一枚“诗章”视为使用一张你手牌中存在的基本牌或普通锦囊牌，你可将此牌转化为任意花色？';
				} else {
					return '是否将两张基本牌或普通锦囊牌当做一张你选择的牌使用，你可将此牌转化为任意花色？';
				}
			}
		},
		check: function (card) {
			return 6 - get.value(card)
		},
		position: "he",
		selectCard: function () {
			var player = _status.event.player;
			if(player.countMark("seh_kongwang_die") < 1 && !player.hasSkill("seh_kongwang_loseMaxHp")){	
				return 2;
			} else {
				return 1;
			}
		},
		discard: false,
		lose: false,
		delay: 0,
		filterCard(card, player, event) {
			if((player.countMark("seh_kongwang_die") > 0 || player.hasSkill("seh_kongwang_loseMaxHp")) && player.getStorage("seh_wangshi_clear").includes(card.name)){	
				return false;
			}
			return get.type(card, player) == "basic" || get.type(card, player) == "trick";
		},
		content: function () {
			"step 0"
			var suitd = lib.suit.concat([{ name: "取消", value: "cancel" }]);
			player
				.chooseControl(suitd)
				.set("prompt", "请选择一种花色作为本次转化牌的花色")
				.set("ai", function () {
					return lib.suit.randomGet() || suitd[0].value;
				});
			"step 1"
			if (result.control != "cancel") {
				event.suit = result.control;
			}
			var cardNames = [];
			var selectedCards = []; 
			for (var card of event.cards) {
				if (card && card.name) {
					cardNames.push(card.name);
					selectedCards.push(card);
				}
			}
			player.storage.seh_wangshi_backup = [];
			player.markAuto("seh_wangshi_backup", selectedCards);
			var dialog = [get.prompt("seh_wangshi")];
			list = lib.inpile.filter(function (i) {
				return cardNames.includes(i);
			});
			if (list.length == 1) {
				autoName = list[0];
				result.links = [[null, null, autoName]];
				selectedCard = event.cards[0]; 
			} else if (list.length) {
				dialog.push('<div class="text center">请选择你要转化的目标</div>');
				dialog.push([list, "vcard"]);
				player.chooseButton(true, dialog).set("ai", function (button) {
					var player = _status.event.player,
						name = button.link[2];
					return -get.effect(player, { name: name }, player, player);
				});
			}
			"step 2"
			const selectedLink = result.links?.[0];
			const finalCardName = (selectedLink?.[2] || autoName) || "";
			event.named = finalCardName;
			player.storage.seh_wangshi_backupName = [];
			player.markAuto("seh_wangshi_backupName", finalCardName);
			if (selectedLink) {
				const viewAsConfig = { name: finalCardName };
				if (typeof event.suit === "string" && event.suit.length > 0) {
					viewAsConfig.suit = event.suit;
				}
				game.broadcastAll(function (config) {
					lib.skill.seh_wangshi_backup.viewAs = config;
				}, viewAsConfig);
			}
			const next = player.chooseToUse();
			const targetPrompt = "妄世律裁：请选择【" + get.translation(finalCardName) + "】的目标";
			next.set("openskilldialog", targetPrompt);
			next.set("norestore", true);
			next.set("_backupevent", "seh_wangshi_backup");
			next.set("custom", {
				add: {},
				replace: { window: function () {} },
			});
			next.backup("seh_wangshi_backup");
			next.set("addCount", true);
			"step 3"
			if (result.bool) {
				if(player.countMark("seh_kongwang_die") > 0 || player.hasSkill("seh_kongwang_loseMaxHp")){
					player.addTempSkill("seh_wangshi_clear");
					player.markAuto("seh_wangshi_clear", [event.named]);
				}
				if(player.countMark("seh_kongwang_die") > 0 && !player.hasSkill("seh_kongwang_loseMaxHp")) player.removeMark("seh_kongwang_die", 1);
			}
		},
		group: ["seh_wangshi_a", "seh_wangshi_b"],
		subSkill:{
			backup: {
				filterCard: function(card, player) {
					if (get.itemtype(card) !== "card") return false;
					var targetCards = player.storage.seh_wangshi_backup || [];
					if(player.countMark("seh_kongwang_die") > 0 || player.hasSkill("seh_kongwang_loseMaxHp")){
						return false;
					} else {	
						var finalName = player.storage.seh_wangshi_backupName;
						var a = game.countPlayer(function (current) {
							return player.canUse({ name: finalName }, current);
						});
						if(a > 0) return targetCards.includes(card);
					}
				},
    			selectCard: -1,
				filterTarget: function(card, player, target) {
					if (!card || !target || target.removed || target.isDead() || target.isOut()) {
						return false;
					}
					const info = get.info(card);
					if (!info?.deadTarget && target.isDead()) {
						return false;
					}
					if (!info?.includeOut && target.isOut()) {
						return false;
					}
					const filter = info.filterTarget;
					if (typeof filter === "boolean") {
						return filter;
					}
					if (typeof filter === "function") {
						var finalName = player.storage.seh_wangshi_backupName;
						return Boolean(filter(card, player, target)) && player.canUse({ name: finalName }, target);
					}
					return false;
				},
				sub: true,
				selectedCards: [],
			},
			a: {
				trigger: {
					player: "phaseUseBegin",
				},
				prompt: function () {
					var player = _status.event.player;
					if(player.countMark("seh_kongwang_die") > 0){
						return '是否弃置两张牌并获得【' + (player.hp - player.countMark("seh_kongwang_die")) + '】枚“诗章”？';
					} else {
						return '是否弃置两张牌并获得【' + (1 + player.hp) + '】枚“诗章”？';
					}
				},
				frequent: true,
				filter: function (event, player) {
					return player.countCards("he") > 1 && player.countMark("seh_kongwang_die") < player.hp && !player.hasSkill("seh_kongwang_loseMaxHp");
				},
				content: function () {
				    event.count = 0;
					let cards = player.getCards("e");
					let suits = [];

					for (let i = 0; i < cards.length; i++) {
					let s = cards[i].suit;
					if (!suits.includes(s)) {
						suits.push(s);
					}
					}
					event.count = Math.min(suits.length, 12);
					if(event.count > player.countMark("seh_kongwang_die")){
						if(player.countMark("seh_kongwang_die") > 0){
							player.addMark("seh_kongwang_die", event.count);
						} else {
							player.addMark("seh_kongwang_die", event.count + 1);
						}
					}
				},
				sub:true,
			},
			b: {
				init: function (player) {
					player.storage.seh_wangshi_b = [];
				},
				trigger: {
					player: ["chooseToUseBefore"],
				},
				prompt: function (event) {
					var player = _status.event.player;
					if(player.hasSkill("seh_kongwang_loseMaxHp")){
						if (event.filterCard({ name: "shan", isCard: true }, player, event)) {
							return '是否视为使用一张你手牌中存在的【闪】，你可将此牌转化为任意花色？';
						} else {
							return '是否视为使用一张你手牌中存在的【无懈可击】，你可将此牌转化为任意花色？';
						}
					}else{	
						if (event.filterCard({ name: "shan", isCard: true }, player, event)) {
							return '是否移除一枚“诗章”视为使用一张你手牌中存在的【闪】，你可将此牌转化为任意花色？';
						} else {
							return '是否移除一枚“诗章”视为使用一张你手牌中存在的【无懈可击】，你可将此牌转化为任意花色？';
						}
					}
				},
				filter(event, player) {
					if(!player.hasSkill("seh_kongwang_loseMaxHp") && player.countMark("seh_kongwang_die") == 0) return false;
					if (event.type == "wuxie" && player.countCards("h", "wuxie") == 0) {
						return false;
					}
					if (event.filterCard({ name: "shan", isCard: true }, player, event)) {
						return player.countCards("h", "shan") >= 1 && !player.getStorage("seh_wangshi_clear").includes("shan");
					}
					if (event.filterCard({ name: "wuxie", isCard: true }, player, event)) {
						return player.countCards("h", "wuxie") >= 1 && !player.getStorage("seh_wangshi_clear").includes("wuxie");
					}
					return false;
				},
				content() {
					"step 0"
					var suitd = lib.suit.concat([{ name: "取消", value: "cancel" }]);
					player
						.chooseControl(suitd)
						.set("prompt", "请选择一种花色作为本次转化牌的花色")
						.set("ai", function () {
							return lib.suit.randomGet() || suitd[0].value;
						});
					"step 1"
					if (result.control != "cancel") {
						event.suit = result.control;
					}
					for (var card of player.getCards()) {
						if(trigger.filterCard({ name: "wuxie", isCard: true }, player, trigger)){	
							if (card && card.name == "wuxie" ) {
								player.storage.seh_wangshi_b = card.name;
							}
						} else {
							if (card && card.name == "shan" ) {
								player.storage.seh_wangshi_b = card.name;
							}
						}
					}
					player.chooseCard('h', '妄世律裁：请选择一张牌，然后你视为使用此牌', function (card, player) {
						return player.getStorage("seh_wangshi_b").includes(card.name);
					}).set('ai', function (card) {
						return 6 - get.value(card);
					})
					"step 2"
					if (result.bool) {
						if(!player.hasSkill("seh_kongwang_loseMaxHp")) player.removeMark("seh_kongwang_die", 1);
						player.addTempSkill("seh_wangshi_clear");
						player.markAuto("seh_wangshi_clear", [result.cards[0].name]);
						trigger.result = { bool: true, card: { name: result.cards[0].name, suit: event.suit, isCard: true } };
						trigger.responded = true;
						trigger.animate = false;
					}
				},
			},
			clear: {
				onremove: function (player) {
					player.unmarkSkill("seh_wangshi_clear");
					delete player.storage.seh_wangshi_clear;
				},
				sourceSkill: "seh_wangshi",
				sub: true,
			},
		},
	},
	"seh_kongwang":{
		init: function (player) {
			player.storage.seh_kongwang_spade = 1;
			player.storage.seh_kongwang_club = 0;
			player.storage.seh_kongwang_heart = 0;
			player.storage.seh_kongwang_diamond = 0;
			player.storage.seh_kongwang_diamondd = 0;
		},
		trigger: {
			player: "useCardAfter",
		},
		frequent: true,
		content() {
			"step 0"
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				list[i].removeSkill("seh_kongwang_clubbd");
			}
			player.addTempSkill("seh_kongwang_clear");
			player.storage.seh_kongwang_heart += 1;
			if(get.suit(trigger.card) == "spade" && player.countMark("seh_kongwang_spade") > 0){
				player.chooseTarget(true, get.prompt('seh_kongwang'), "请选择一名角色并对其造成一点神圣伤害").set('ai', function (target) {
					var player = _status.event.player, att = get.attitude(player, target);
					if (att < 0) return 1;
					return -0.5;
				});
			}
			if(get.suit(trigger.card) == "club"){
				if(player.countMark("seh_kongwang_club") > 0 && player.countMark("seh_kongwang_clubbd") < 1){	
					player.chooseTarget(true, get.prompt('seh_kongwang'), "请选择一名角色并弃置其一张牌", function(card,player,target){
						return target.countCards("he") > 0;
					}).set('ai', function (target) {
						var player = _status.event.player, att = get.attitude(player, target);
						if (att < 0) return 1;
						return -0.5;
					});
					event.goto(2);
				} 
				if(player.countMark("seh_kongwang_clubbd") > 0){
					player.chooseTarget(true, get.prompt('seh_kongwang'), "请选择一名角色并弃置其至多两张牌", function(card,player,target){
						return target.countCards("he") > 0;
					}).set('ai', function (target) {
						var player = _status.event.player, att = get.attitude(player, target);
						if (att < 0) return 1;
						return -0.5;
					});
					event.goto(2);
				}
			}
			if(get.suit(trigger.card) == "heart" && player.countMark("seh_kongwang_heart") > player.hp){
				player.recover();
			}
			if(get.suit(trigger.card) == "diamond" && player.countMark("seh_kongwang_diamond") > 0 && player.countMark("seh_kongwang_diamondd") < 2){
				player.draw(2);
				player.addSkill("seh_kongwang_phase");
				player.storage.seh_kongwang_diamondd += 1;
			}
			if(get.suit(trigger.card) == "none" && player.maxHp > 1 && game.hasPlayer(function (current) { return current.maxHp <= player.maxHp; })){
				player.chooseTarget(get.prompt('seh_kongwang'), "是否减少一点体力上限并获得一名其他角色的一张牌，然后对其造成一点神圣伤害", function(card,player,target){
					return target != player;
				}).set('ai', function (target) {
					var player = _status.event.player, att = get.attitude(player, target);
					if (att < 0) return 1;
					return -0.5;
				});
				event.goto(3);
			}
			player.storage.seh_kongwang_spade = 0;
			"step 1"
			if (result.bool) {
				var target = result.targets[0];
				target.damage()._triggered = null;
			}
			event.finish();
			"step 2"
			if (result.bool) {
				var target = result.targets[0];
				if(player.countMark("seh_kongwang_clubbd") > 0){
					player.discardPlayerCard(target, 'he', [1, 2]);
					player.storage.seh_kongwang_clubbd = 0;
					if(player.countMark("seh_kongwang_club") > 0) event.goto(0);
				} else if(player.countMark("seh_kongwang_club") > 0){
					player.discardPlayerCard(target, 'he');
					player.storage.seh_kongwang_club = 0;
				}
			}
			event.finish();
			"step 3"
			if (result.bool) {
				var target = result.targets[0];
				player.loseMaxHp();
				player.gainPlayerCard(target, 'he');
				target.damage()._triggered = null;
			}
		},
		group: ["seh_kongwang_die", "seh_kongwang_club", "seh_kongwang_clubb", "seh_kongwang_diamond"],
		subSkill:{
			phase: {
				trigger: {
					player: ['phaseDrawSkipped', 'phaseDrawCancelled', 'phaseUseSkipped', 'phaseUseCancelled'],
				},
				popup: false,
				silent: true,
				forced: true,
				async content(event, trigger, player) {
					if (event.triggername == 'phaseDrawSkipped' || event.triggername == 'phaseDrawCancelled') {
						const next = player.phaseDraw();
						await event.next.remove(next);
						await trigger.next.push(next);
					}
					if (event.triggername == 'phaseUseSkipped' || event.triggername == 'phaseUseCancelled') {
						const next = player.phaseUse();
						await event.next.remove(next);
						await trigger.next.push(next);
					}
					player.removeSkill("seh_kongwang_phase");
				},
				sub: true,
			},
			die: {
				marktext: "诗章",
				intro: {
					name: "空妄诗章",
					content(err, player) {
						return `你拥有【${player.countMark('seh_kongwang_die')}】枚“诗章”`
					},
					markcount(storage, player) {
						return `${player.countMark('seh_kongwang_die')}`
					},
				},
				trigger: {
					player: "dieBefore",
					global: "dieBegin",
				},
				frequent: true,
				filter(event, player) {
					return event.player.maxHp > 0;
				},
				filter: function(event, player, name){
					if(name == 'dieBefore') {
						return !player.hasSkill("seh_kongwang_loseMaxHp");
					} else {
						return event.player.maxHp > 0;
					}
				},
				content() {
					if(event.triggername == 'dieBegin'){
						trigger.player.loseMaxHp(trigger.player.maxHp);
						if(player.countMark("seh_kongwang_die") < 12){
						player.addMark("seh_kongwang_die", 1);
						}
						player.gainMaxHp();
						player.draw();
					} else {
						player.removeMark("seh_kongwang_die", player.countMark("seh_kongwang_die"));
						trigger.cancel();
						player.recover();
						player.draw(player.maxHp);
						player.addTempSkill('seh_kongwang_cancel', {player: "phaseUseBefore"});
						player.addSkill("seh_kongwang_loseMaxHp");
					}
				},
				sub: true,
			},
			cancel: {
			    trigger: {
					player: ["damageBegin", "loseHpBegin"],
				},
				forced: true,
				content() {
					trigger.cancel();
				},
				sub: true,
			},
			loseMaxHp: {
				trigger: {
					player: "phaseJieshuBegin",
				},
				forced: true,
				content() {
					player.loseMaxHp();
					player.draw();
				},
				sub: true,
			},
			clear: {
				onremove: function (player) {
					player.storage.seh_kongwang_spade = 1;
					player.storage.seh_kongwang_club = 0;
					player.storage.seh_kongwang_heart = 0;
					player.storage.seh_kongwang_diamond = 0;
					player.storage.seh_kongwang_diamondd = 0;
				},
				sub: true,
			},
			club: {
				trigger: {
					player: ["respond","useCard"],
				},
				silentForce: true,
				firstDo: true,
				filter(event, player) {
					if (!event.respondTo) {
						return false;
					}
					return get.suit(event.card) == "club";
				},
				content() {
					player.storage.seh_kongwang_club = 1;
				},
				sub: true,
			},
			clubb: {
				init: function (player) {
					player.storage.seh_kongwang_clubbd = 0;
				},
				trigger: {
					player: "useCardToTargeted",
				},
				silentForce: true,
				firstDo: true,
				filter(event, player, name) {
					return get.suit(event.card) == "club";
				},
				content() {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						list[i].addTempSkill("seh_kongwang_clubbd");
					}
				},
				sub: true,
			},
			clubbd: {
				trigger: {
					player: ["respond","useCard"],
				},
				silentForce: true,
				firstDo: true,
				filter(event, player, name) {
					if(!event.respondTo) return false;
					return true;
				},
				content() {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].hasSkill("seh_kongwang")) {
							list[i].storage.seh_kongwang_clubbd = 1;
						}
					}
				},
				sub: true,
			},
			diamond: {
				init: function (player) {
					player.storage.seh_kongwang_lose = 0;
				},
				trigger: {
					player: ["addJudgeBefore", "loseAfter", "loseBefore"],
				},
				silentForce: true,
				firstDo: true,
				content() {
					if(event.triggername == 'loseAfter' && player.storage.seh_kongwang_lose != player.countCards("j")){
						player.storage.seh_kongwang_diamond = 1;
						player.storage.seh_kongwang_lose = 0;
					}
					if(event.triggername == 'loseBefore'){
						player.storage.seh_kongwang_lose = player.countCards("j");
					}
					if(event.triggername == 'addJudgeBefore'){
						player.storage.seh_kongwang_diamond = 1;
					}
				},
				sub: true,
			},
		},
	},
	"wzzs_shuidan":{
		trigger: {
			player: "useCardAfter",
		},
		filter: function(event, player) {
			return (get.tag(event.card, "damage") && (get.type2(event.card) == "trick" || get.type2(event.card) == "delay")) || (event.card.name == "sha" && !game.hasNature(event.card, "linked"));
		},
		frequent: true,
		content() {
			game.broadcastAll(() => (lib.skill.wzzs_shuidan_backup.viewAs = { name: "sha", nature: "ice"}));
			const next = player.chooseToUse();
			next.set("openskilldialog", "水弹：是否将一张基本牌当作无距离限制的冰【杀】使用？");
			next.set("norestore", true);
			next.set("_backupevent", "wzzs_shuidan_backup");
			next.set("custom", {
				add: {},
				replace: { window: function () {} },
			});
			next.backup("wzzs_shuidan_backup");
			next.set("addCount", true);
		},
		subSkill:{
			backup : {
				filterCard: function(card) {
					return get.itemtype(card) == "card" && get.type2(card) == "basic";
				},
				filterTarget: function(card, player, target) {
					if (!card || !target || target.removed || target.isDead() || target.isOut()) {
						return false;
					}
					const info = get.info(card);
					if (!info?.deadTarget && target.isDead()) {
						return false;
					}
					if (!info?.includeOut && target.isOut()) {
						return false;
					}
					const filter = info.filterTarget;
					if (typeof filter === "boolean") {
						return filter;
					}
					if (typeof filter === "function") {
						return Boolean(filter(card, player, target));
					}
					return false;
				},
				sub: true,
			},
		},
	},
	/*"wzzs_yuyu":{
		gger: {
			player: "phaseEnd",
		},
		filter(event, player) {
       		return (game.hasPlayer(function (current) { return current.getDamagedHp(); }));
		},
		async cost(event, gger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill),'是否令一名角色摸x张牌并恢复一点体力（x为其已损失体力值）？', function (card, player, target) {
					return target.getDamagedHp() > 0;
				})
				.set("ai", target => {
					var att = get.attitude(_status.event.player, target);
					if (att > 0) return 2;
					return 0;
				})
				.forResult();
		},
		async content(event, gger, player) {
			const target = event.targets[0];
			target.draw(target.getDamagedHp());
			target.recover();
		},
	},*/
	"wzzs_jiyun":{
		intro: {
			markcount(storage, player) {
				const cards = player.getExpansions('wzzs_jiyun') || [];
				if (!cards.length) return "暂无卡牌";
				const suitMap = { 'spade': '♠', 'heart': '♥', 'club': '♣', 'diamond': '♦', 'none': '◈' };
				const suitSet = new Set();
				cards.forEach(card => {
					if (card.suit) suitSet.add(card.suit);
				});
				const suitSymbols = Array.from(suitSet).map(suit => suitMap[suit] || suitMap['none']).join('');
				return `${suitSymbols}`;
			},
			mark(dialog, storage, player) {
				const cards = player.getExpansions('wzzs_jiyun') || [];
				if (!cards.length) {
					dialog.addText("暂无卡牌");
					return;
				}
				const suitMap = { 'spade': '♠', 'heart': '♥', 'club': '♣', 'diamond': '♦', 'none': '◈' };
				const suitGroups = {};
				cards.forEach(card => {
					const suit = card.suit || 'none';
					if (!suitGroups[suit]) suitGroups[suit] = [];
					suitGroups[suit].push(card);
				});
				let index = 1;
				for (const [suit, groupCards] of Object.entries(suitGroups)) {
					const suitSymbol = suitMap[suit] || suitMap['none'];
					dialog.addText(`<br>${index}. ${suitSymbol}（共${groupCards.length}张）：`);
					dialog.addAuto(groupCards);
					index++;
				}
				dialog.addText(`<br>总计：${cards.length}张卡牌，${Object.keys(suitGroups).length}种花色`);
			},
		},
		enable: "phaseUse",
		filter: function (event, player) {
			return player.gfYongchangTime() == 0 && !player.hasSkill("gf_YongchangProcess");
		},
		GFyongchangSkill: true,
		content:function(){
			if(player.hasSkill("wzzs_jiyun_success")) player.removeSkill("wzzs_jiyun_success");
        	player.addToExpansion(get.cards(5 - player.getExpansions("wzzs_jiyun").length), 'giveAuto', player).gaintag.add('wzzs_jiyun');
			player.gfYongchang(3, "wzzs_lqx", "wzzs_jiyun");
		},
		group: "wzzs_jiyun_a",
		subSkill:{
			condition: {
				trigger: {
					global: "phaseBefore",
				},
				GFyongchangSkill: true,
				popup: false,
				silent: true,
				filter: function (event, player) {
					return player.gfYongchangTime() != 0;
				},
				content: function () {
					player.gfYongchangTime(-1);
					if(player.gfYongchangTime() == 0) {
						player.gfYongchangCheng();
						player.recover();
						player.draw(2);
					}
				},
				sub: true,
			},
			process: {
				trigger: {
					global: "useCardAfter",
				},
				forced: true,
				filter: function (event, player) {
					event.count = 0;
					for (var i = 0; i < player.getExpansions("wzzs_jiyun").length; i++) {
						if(get.suit(event.card) == get.suit(player.getExpansions("wzzs_jiyun")[i])){
							event.count++;
						}
					}
					return event.count > 0 && player.countMark("wzzs_jiyun_a") < 1;
				},
				content: function () {
					"step 0"
					player.storage.wzzs_jiyun_a = 1;
					var list = [];
					var cards = player.getExpansions("wzzs_jiyun");
					for (var j = 0; j < cards.length; j++) {
						if (get.suit(cards[j]) == get.suit(trigger.card)) list.push(cards[j]);
					}
					trigger.player.gain(list, 'give', player, 'bySelf');
					"step 1"
					if(player.getExpansions("wzzs_jiyun").length == 0){
						player.gfYongchangJie(player.gfYongchangImgName);
						player.addTempSkill("gf_YongchangProcess");
						game.log(player, get.translation(player) + '咏唱失败了');
					} else {
						player.addToExpansion(get.cards(1), 'draw').gaintag.add('wzzs_jiyun');
					}
				},
				sub: true,
			},
			success: {
				trigger: {
					global: "useCardAfter",
				},
				forced: true,
				filter: function (event, player) {
					event.count = 0;
					for (var i = 0; i < player.getExpansions("wzzs_jiyun").length; i++) {
						if(get.suit(event.card) == get.suit(player.getExpansions("wzzs_jiyun")[i])){
							event.count++;
						}
					}
					return event.count > 0;
				},
				"prompt2": function (event, player, skill) {
					return '是否对【' + get.translation(event.player) + '】造成一点冰属性伤害，然后你摸一张牌';
				},
				content: function () {
					'step 0'
					player.chooseCardButton('是否弃置一张“积云”牌，然后对【' + get.translation(trigger.player) + '】造成一点冰属性伤害，最后你摸一张牌？', player.getExpansions('wzzs_jiyun'));
					'step 1'
					if (result.bool) {
						player.loseToDiscardpile(result.links[0]);
						trigger.player.damage("ice");
						player.draw();
					}
				},
				sub: true,
			},
			a: {
				init: function (player) {
					player.storage.wzzs_jiyun_a = 0;
				},
				trigger: {
					player: "gainAfter",
				},
				popup: false,
				silent: true,
				GFyongchangSkill: true,
				content: function () {
					player.storage.wzzs_jiyun_a = 0;
					player.addTempSkill("wzzs_jiyun_clear");
				},
				sub: true,
			},
			clear: {
				onremove: function (player) {
					player.storage.wzzs_jiyun_a = 0;
				},
				sub: true,
			},
		},
	},
	"sssss":{
		trigger:{
			global:"phaseBefore",
		},
		/*filter:function(event,player){
			event.cards=[];
			game.countPlayer2(function(current){
				current.getHistory('lose',function(evt){
					for(var i=0;i<evt.cards.length;i++){
						if(get.position(evt.cards[i])=='d'&&event.cards.contains(evt.cards[i])){
							event.cards.push(evt.cards[i]);
						}
					}
				})
			});
			game.getGlobalHistory('cardMove',function(evt){
				if(evt.name=='cardsDiscard'){
					for(var i=0;i<evt.cards.length;i++){
						if(get.position(evt.cards[i])=='d'&&!event.cards.contains(evt.cards[i])){
							event.cards.push(evt.cards[i]);
						}
					}
				}
			});
			return event.cards.length;
		},*/
		"prompt2":"你可以获得本回合因使用进入弃牌堆的一张牌",
		content:function(){
			'step 0'
			player.chooseTarget(get.prompt('seh_xinzhiqi'), "你可将一名其他角色<a class='gefu_text' onclick='javescript:window.gefu_text(\"驱逐：<br>被驱逐者将会被移除游戏，此状态解除时其流失一点体力。\")'><font color='#00FFFF'><u>驱逐</u></font></a>直到你的下个回合开始或你死亡时", function (card, player, target) {
				return target != player;
			}).set('ai', function (target) {
				var player = _status.event.player;
				return get.attitude(player, target) < 0;
			});
			"step 1";
			if (result.bool) {
				var target = result.targets[0];
				game.broadcastAll(function (target) {
					target.out('sssss');
				}, target);
			}
			/*"step 0"
			player.chooseCardButton(1,trigger.cards,true);
			"step 1"
			player.gain(result.links,'gain2');*/
		},
	},
	"aqcs_tianjue":{
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		GFzhaohuanSkill: true,
		filter: function (event) {
			return event.name != 'phase' || game.phaseNumber == 0;
		},
		content: function () {
			player.gfZhaohuan("aqcs_tianjue_lei", "小路因", "male", "qun", "2/2/0", 4, "", "aqcs_shouxin");
		},
		group: ["aqcs_tianjue_a", "aqcs_tianjue_b", "aqcs_tianjue_c", "aqcs_tianjue_e", "aqcs_tianjue_f", "aqcs_tianjue_g"],
		subSkill: {
			a: {
				trigger: {
					target: "useCardToTargeted",
				},
				GFzhaohuanSkill: true,
				filter: function (event, player) {
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_tianjue_lei') {
							event.count++;
						}
					}
					if (event.card.name == "juedou" || event.card.name == "sha") {
						return event.count > 0;
					}
				},
				content: function () {
					trigger.targets.remove(trigger.target);
					trigger.getParent().triggeredTargets1.remove(trigger.target);
					trigger.untrigger();
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_tianjue_lei') {
							trigger.targets.push(list[i]);
						}
					}
				},
				sub: true,
			},
			b: {
				trigger: {
					global: "roundEnd",
				},
				audio: "ext:鸽府包/audio/skill:1",
				GFtonglingSkill: true,
				filter: function (event, player) {
					return player.TonglingSuccess == 0;
				},
				content: function () { 
					player.gflib_changeTongling(1);
					if(player.gflib_tongling >= 2){
						player.gflib_changeTongling(-2);
						player.TonglingEffect("破坏圣龙", "aqcs_phsl")
						game.addGlobalSkill('aqcs_tianjue_phsl');
						game.addGlobalSkill('aqcs_tianjue_phsl_a');
						game.addGlobalSkill('aqcs_tianjue_phsl_b');
						player.insertPhase();
					}
				},
				sub: true,
			},
			c:{
				trigger: {
					player: "useCardToPlayered",
				},
				GFzhaohuanSkill: true,
				filter: function (event){
					return event.card && event.card.name == 'sha';
				},
				content: function (){
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_tianjue_lei') {
							list[i].addTempSkill("aqcs_tianjue_d");
						}
					}
				},
				sub: true,
			},
			d:{
				mod: {
					cardEnabled(card, player) {
						return false;
					},
				},
				sub: true,
			},
			e:{
				init: function (player) {
					player.storage.aqcs_tianjue_die = 0;
				},
				trigger: {
					global: "dieBefore",
				},
				priority: 15,
				nobracket: true,
				GFzhaohuanSkill: true,
				silent: true,
				popup: false,
				forceOut: true,
				forceDie: true,
				filter: function (event, player){
					if(player.countMark("aqcs_tianjue_die")) return false;
					return event.player.name == 'aqcs_tianjue_lei' || event.player.name == 'aqcs_lyjd';
				},
				content: function (){
					'step 0'
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_tianjue_lei' || list[i].name == 'aqcs_lyjd') {
							event.count++;
						}
					}
					if(event.count > 1){
						trigger.cancel();
						if(trigger.player.hasSkill("aqcs_shouxin")) player.insertPhase();
						game.broadcastAll(function (trigger) {
							trigger.player.out('aqcs_tianjue_e');
						}, trigger);
					}else{
						if(trigger.player.name == 'aqcs_tianjue_lei'){
							game.broadcastAll(function (player) {
								player.forceIn();
							}, player);
							player.recover(player.maxHp - player.hp);
							player.draw(4);
						}else{		
							var list = game.filterPlayer();
							player.storage.aqcs_tianjue_die = 1;
							for (var i = 0; i < game.players.length; i++) {
								var pl = game.players[i];
								game.broadcastAll(function (pl) {
									pl.in('aqcs_tianjue_e');
								}, pl);
							}
						}
					}
					'step 1'
					if(player.countMark("aqcs_tianjue_die")){
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (list[i].name == 'aqcs_tianjue_lei' || list[i].name == 'aqcs_lyjd') {
								list[i].die();
							}
						}
					}
				},
				sub: true,
			},
			f:{
				trigger: {
					player: "useCard",
				},
				popup: false,
				silent: true,
				firstDo: true,
				GFzhaohuanSkill: true,
				async content(event, trigger, player) {
					trigger.directHit.addArray(
						game.filterPlayer(function (current) {
							return current.name == "aqcs_tianjue_lei";
						})
					);
				},
				sub: true,
			},
			g:{
				init: function (player) {
					player.storage.aqcs_tianjue_g = 1;
				},
				mod: {
					maxHandcard: function (player, num) {
						return num += 2;
					},
				},
				trigger: {
					player: "phaseBegin",
				},
				GFyingxiongSkill: true,
				filter: function(event, player){
					return player.countMark("aqcs_tianjue_g") > 0;
				},
				async content(event, trigger, player) {
					player.storage.aqcs_tianjue_g = 0;
					player.drawTo(player.getHandcardLimit());
				},
				GFyingxiongSkill: true,
				sub: true,
			},
		},
	},
	"aqcs_zhongyan":{
		enable: "phaseUse",
		usable: 1,
		position: "hes",
		prompt: "出牌阶段限一次，你可将任意张不同类型的牌视为一张“杀”使用，若被转化的牌包含基本牌/锦囊牌/装备牌，此“杀”有对应效果",
		selectCard: [1,3],
		complexSelect: true,
		complexCard: true,
		filter(event, player) {
			var filter = event.filterCard;
			return filter(get.autoViewAs({ name: "sha" }, "unsure"), player, event) && player.countCards("hes");
		},
		filterCard(card, player) {
			if (ui.selected.cards.length) {
				const cards = get.type(card, player);
				const a = (type) => {
					if (["trick", "delay"].includes(type)) {
						return "trick_delay_group";
					}
					return type;
				};
				const b = a(cards);
				const c = ui.selected.cards.some(f => {
					const d = get.type(f, player);
					const e = a(d);
					return e === b;
				});
				return !c;
			}
			var type = get.type(card, player);
			return ["basic", "trick", "equip", "delay"].includes(type);
		},
		viewAs: (selectedCards) => {
			const includedTypes = new Set();
			selectedCards.forEach(card => {
				const cardType = get.type(card);
				includedTypes.add(["delay", "trick"].includes(cardType) ? "trick" : cardType);
			});
			const hasBasic = includedTypes.has("basic");
			const hasTrick = includedTypes.has("trick");
			const hasEquip = includedTypes.has("equip");
			const hasAllTypes = includedTypes.size === 3;
			const virtualSha = {
				name: "sha",
				extraData: {
					hasBasic,
					hasTrick,
					hasEquip,
					hasAllTypes
				},
				cardData: {
					extraData: { hasBasic, hasTrick, hasEquip, hasAllTypes }
				},
			};
			if (typeof _status !== "undefined") {
				_status.multiTypeShaExtra = { hasBasic, hasTrick, hasEquip, hasAllTypes };
			}
			if (selectedCards && typeof selectedCards === "object") {
				selectedCards.extraData = { hasBasic, hasTrick, hasEquip, hasAllTypes };
			}
			return virtualSha;
		},
		precontent: function (result, player, selectedCards) {
			player.addMark("aqcs_zhongyan_o", 1);
			player.addTempSkill('aqcs_zhongyan_e', {player: "useCardAfter"});
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/aqcs_zhongyan${[1].randomGet()}.mp3`);
			}, player);
			/*let extraData = result?.extraData || result?.cardData?.extraData || _status?.multiTypeShaExtra || selectedCards?.extraData;
			if (!extraData || typeof extraData !== "object") {
				extraData = { hasTrick: false, hasBasic: false, hasEquip: false, hasAllTypes: false };
			}
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/aqcs_zhongyan${[1].randomGet()}.mp3`);
			}, player);
			const maxTargets = extraData.hasEquip ? 1 : 0;
			if(maxTargets > 0){
				player.addTempSkill('aqcs_zhongyan_a', {player: "useCardAfter"});
			}
			let maxTargetsd = 0;
			if (extraData.hasEquip) maxTargetsd += 1; 
			if (extraData.hasBasic) maxTargetsd += 1; 
			if (extraData.hasTrick) maxTargetsd += 1; 
			if (maxTargetsd > 0) {
				player.addMark("aqcs_zhongyan_o", 1);
			}
			if (maxTargetsd > 2) {
				player.addTempSkill('aqcs_zhongyan_e', {player: "useCardAfter"});
			}*/
		},
		hiddenCard(player, name) {
			if (get.type(name) != "basic" && name != "sha") {
				return false;
			}
			return player.countCards("hes");
		},
		mod: {
			selectTarget: function (card, player, range, selectedCards) {
				const evt = get.event();
				const judge = evt.skill !== "aqcs_zhongyan";
				if (get.itemtype(card) === "vcard" && Array.isArray(card.cards)) {
					if (judge) {
						return false;
					}
				}
				if (judge) {
					return false;
				}
				let extraData = card?.extraData || card?.cardData?.extraData || _status?.multiTypeShaExtra || selectedCards?.extraData;
				if (!extraData || typeof extraData !== "object") {
					extraData = { hasTrick: false, hasBasic: false, hasEquip: false, hasAllTypes: false };
					return;
				}
				const maxTargets = extraData.hasTrick ? 2 : 0;
				if (_status?.currentPhase === player && card?.name === "sha" && range[1] !== -1) {
					range[1] += maxTargets;
				}
			},
			targetInRange: function (card, player, selectedCards) {
				const evt = get.event();
				const judge = evt.skill == "aqcs_zhongyan";
				let extraData = card?.extraData || card?.cardData?.extraData || _status?.multiTypeShaExtra || selectedCards?.extraData;
				if (!extraData || typeof extraData !== "object") {
					extraData = { hasTrick: false, hasBasic: false, hasEquip: false, hasAllTypes: false };
					return;
				}
				const maxTargets = extraData.hasBasic ? 1 : 0;
				if(maxTargets > 0){
					if (get.itemtype(card) === "vcard" && Array.isArray(card.cards)) {
						if (judge) {
							return _status?.currentPhase === player && card?.name === "sha";
						}
					}
					if (judge) {
						return _status?.currentPhase === player && card?.name === "sha";
					}
				}
			},
		},
		group: ["aqcs_zhongyan_a", "aqcs_zhongyan_b"],
		subSkill:{
			a:{
				trigger: {
					player: "useCardToPlayered",
				},
				filter(event, player, card) {
					return event.card.name == "sha" && player.hasSkill("aqcs_zhongyan_e");
				},
				lastDo:true,
				silentForce: true,
				logTarget: "target",
				async content(event,trigger,player) {
					event.count1 = 0; event.count2 = 0;
					for (var i of trigger.cards) {
						if (get.type(i) == "equip") {
							event.count1++;
						}
						if (get.type(i) == "basic") {
							event.count2++;
						}
						if (get.type(i) == "delay" || get.type(i) == "trick") {
							event.count2++;
						}
					}
					if(event.count1 > 0){
						trigger.target.addTempSkill("qinggang2");
						trigger.target.storage.qinggang2?.add(trigger.card);
						trigger.target.markSkill("qinggang2");
					}
					if(event.count1 + event.count2 >= 3){
						trigger.target.addTempSkill('aqcs_zhongyan_d', {global: "useCardAfter"});
					}
				},
				sub:true,
			},
			b:{
				trigger: {
					player: "loseAfter",
					global: ["equipAfter","addJudgeAfter","loseAsyncAfter","addToExpansionAfter"],
				},
				"prompt2": function (event, player, skill) {
					var player = _status.event.player;
					if (!event.getl || !event.getl(player) || !event.getl(player).hs || event.getl(player).hs.length === 0) {
						return;
					}
					const normalizeType = (type) => {
						return type === "delay" ? "trick" : type;
					};
					const lostCardTypes = event.getl(player).hs
						.reduce((uniqueTypes, card) => {
							const originalType = card.type || get.type(card);
							const normalizedType = normalizeType(originalType);
							if (normalizedType && !uniqueTypes.includes(normalizedType)) {
								uniqueTypes.push(normalizedType);
							}
							return uniqueTypes;
						}, []);
					const emptyTypes = lostCardTypes.filter(type => {
						const countCondition = type === "trick" ? { type: ["trick", "delay"] }: { type: type };
						return player.countCards("h", countCondition) === 0;
					});
					const drawNum = emptyTypes.length;
					return '你是否摸【' + drawNum + '】张牌？';
				},
				filter(event, player) {
					let lose = 0;
					if (event.player && event.getl) {
						lose = event.getl(event.player).hs.length;
					}
					const normalizeType = (type) => {
						return type === "delay" ? "trick" : type;
					};
					const lostCardTypes = event.getl(player).hs
						.reduce((uniqueTypes, card) => {
							const originalType = card.type || get.type(card);
							const normalizedType = normalizeType(originalType);
							if (normalizedType && !uniqueTypes.includes(normalizedType)) {
								uniqueTypes.push(normalizedType);
							}
							return uniqueTypes;
						}, []);
					const emptyTypes = lostCardTypes.filter(type => {
						const countCondition = type === "trick" ? { type: ["trick", "delay"] }: { type: type };
						return player.countCards("h", countCondition) === 0;
					});
					const drawNum = emptyTypes.length;
					return drawNum && (lose > 0 || !event.player);
				},
				async content(event, trigger, player) {
					if (!trigger.getl || !trigger.getl(player) || !trigger.getl(player).hs || trigger.getl(player).hs.length === 0) {
						return;
					}
					const normalizeType = (type) => {
						return type === "delay" ? "trick" : type;
					};
					const lostCardTypes = trigger.getl(player).hs
						.reduce((uniqueTypes, card) => {
							const originalType = card.type || get.type(card);
							const normalizedType = normalizeType(originalType);
							if (normalizedType && !uniqueTypes.includes(normalizedType)) {
								uniqueTypes.push(normalizedType);
							}
							return uniqueTypes;
						}, []);
					const emptyTypes = lostCardTypes.filter(type => {
						const countCondition = type === "trick" ? { type: ["trick", "delay"] }: { type: type };
						return player.countCards("h", countCondition) === 0;
					});
					const drawNum = emptyTypes.length;
					if (drawNum > 0) {
						await player.draw(drawNum);
					}
				},
				sub:true,
			},
			d:{
				trigger: {
					player: "damageBegin3",
				},
				logTarget: "target",
				forced:true,
				popup: false,
				silent: true,
				firstDo: true,
				async content(event, trigger, player) {
					trigger.num += trigger.num;
					player.removeSkill("aqcs_zhongyan_d");
				},
				sub:true,
			},
			e:{ sub:true, },
		},
	},
	aqcs_tianjue_phsl:{
		trigger: {
			player: ["useCardAfter", "useCardBefore"],
			source: "damageBefore",
		},
		priority: 15,
		nobracket: true,
		forced: true,
		filter: function(event, player, name){
			if(name == 'useCardAfter') {
				return event.card.name == 'sha';
			}else{
				return event.card && event.card.name == 'sha' && player.countMark("aqcs_zhongyan_o") > 0;
			}
		},
		content: function (){
			if(event.triggername == 'useCardAfter'){
				player.removeMark("aqcs_zhongyan_o", player.countMark("aqcs_zhongyan_o"));
				player.removeSkill("gf_card");
			}else{
				if(event.triggername == 'useCardBefore'){
					player.addTempSkill("gf_card", {player: "useCardAfter"});
				} else {
					trigger.cancel = () => {};
					trigger._triggered = null;
				}
			}
		},
		subSkill:{
			a:{
				trigger: {
					player: "useCardToPlayered",
				},
				forced:true,
				filter(event, player) {
					return event.card.name == "sha" && event.target.hujia > 0;
				},
				content() {
					trigger.target.changeHujia(-Math.ceil(trigger.target.hujia * 0.5));
				},
				sub:true,
			},
			b:{
				trigger: {
					player: "phaseDiscardAfter",
				},
				forced:true,
				filter: function (event, player){
					return event.player.name == 'aqcs_lyjd';
				},
				content() {
					game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/aqcs_tianjue_phsl${[1].randomGet()}.mp3`);
					}, player);
					var next = player.phaseUse();
						event.next.remove(next);
						trigger.next.push(next);
				},
				sub:true,
			},
		},
	},
	"aqcs_shouxin":{
		mod: {
			playerEnabled(card, player, target, range) {
				var range2 = get.select(get.info(card).selectTarget);
				if((get.tag(card, "damage") && range2[0] == 1 && range2[1] == 1) || get.type(card, "trick") || card.name == "shunshou" || card.name == "guohe"){
					if (target.name == 'aqcs_lyjd') return false;
				}
			},
			maxHandcard: function (player, num) {
				return num = player.hp * 2;
			}
		},
		trigger: {
			player: ["damageBegin3", "dieBefore"],
        	source: "damageBegin1",
		},
		audio: "ext:鸽府包/audio/skill:1",
		forced: true,
		firstDo :true,
		content() {
			if(event.triggername != 'dieBefore'){
				event.count = 0;
				trigger.num -= Math.round((trigger.num / 2) * 10) / 10;
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].name == 'aqcs_lyjd') {
						event.count++;
					}
				}
				if(event.count < 1) trigger.num += trigger.num;
			}else{
				/*var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].name == 'aqcs_lyjd') {
						list[i].addSkill("aqcs_shouxin_a");
					}
				}*/
			}
		},
		subSkill:{
			a:{
				trigger: {
					global: "phaseAfter",
				},
				silentForce: true,
				content() {
					player.insertPhase();
					player.removeSkill("aqcs_shouxin_a");
				},
				sub:true,
			},
		},
	},
	"cxm_yingzi":{
		mod: {
			maxHandcard: function (player, num) {
				return num = player.maxHp + player.countCards("e");
			},
		},
		trigger: {
			player: "phaseBegin",
		},
		audio: "ext:鸽府包/audio/skill:2",
		frequent: true,
		content() {
			if (player.countCards("j") > 0){
				player.discardPlayerCard(player, "j", true, player.countCards("j"));
			} else {
				player.addTempSkill("cxm_yingzi_a");
			}
		},
		group: "cxm_yingzi_b",
		subSkill: {
			a: {
				trigger: {
					player: "phaseDrawBegin2",
				},
				frequent: true,
				filter(event, player) {
					return !event.numFixed;
				},
				preHidden: true,
				async content(event, trigger, player) {
					trigger.num += 2;
				},
				sub: true,
			},
			b: {
				trigger: {
					player: "loseHpEnd",
				},
				frequent: true,
				filter(event, player) {
					return player.isIn() && event.num > 0;
				},
				getIndex: event => event.num,
				content() {
					"step 0";
					player.chooseTarget(get.prompt("cxm_yingzi"), "令一名角色摸一张牌").set("ai", function (target) {
						return get.attitude(_status.event.player, target);
					});
					"step 1";
					if (result.bool) {
						result.targets[0].draw("visible");
					}
				},
				sub: true,
			},
		},
	},
	"cxm_fanjian":{
		init: function (player) {
			player.storage.cxm_fanjian = 0;
			player.storage.cxm_fanjian2 = 0;
			player.storage.cxm_fanjian3 = 0;
		},
		enable: "phaseUse",
		usable(skill, player) {
			return player.countMark("cxm_fanjian3");
		},
		prompt: "是否展示一张牌并令两名角色选择是否获得此牌，若两名角色选择相同选项，则两名角色各流失一点体力，否则你将此牌交给选择“是”的角色",
		check: function (card) {
			return 6 - get.value(card)
		},
		position: "he",
		selectCard: 1,
		selectTarget: 2,
		filterCard: true,
		filterTarget: true,
		discard: false,
		lose: false,
		delay: false,
		content: function () {
			'step 0'
			if(player.hasSkill("cxm_fanjian_a")) event.finish();
			player.showCards(cards);
			event.count = 2, event.count2 = 0, event.count3 = 0, event.count4 = 0;
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				list[i].storage.cxm_fanjian = 0;
				list[i].storage.cxm_fanjian2 = 0;
			}
			"step 1"
			event.a = targets.length - event.count;
			if (event.count > 0) {
				player.line(target);
				var str = get.translation(cards);
				if(event.a == 0) {
					var str2 = get.translation(targets[1]);
				}else{
					var str2 = get.translation(targets[0]);
				}
				if ((get.attitude(player, targets[0]) > 0 || get.attitude(player, targets[1]) > 0) && (targets[0] == player) || (targets[1] == player)) {
					targets[event.a].chooseControl().set("choiceList", ["获得" + str, "不获得" + str]).set('prompt', "若【" + str2 + "】与你选择项相同，你与其各流失一点体力").set('ai', () => 0);
				} else {
					targets[event.a].chooseControl().set("choiceList", ["获得" + str, "不获得" + str]).set('prompt', "若【" + str2 + "】与你选择项相同，你与其各流失一点体力").set('ai', function (event, player, targets) {
						var num=[1,2].randomGet();
						if(event.count4==3) return 0;
						if(event.count4==4) return 1;
						if(num==1) return 0;
						if(num==2) return 1;
						return 0;
					});
				}
				event.count--;
			}
			"step 2";
			if(event.a == 0) {
				if (result.index == 0) {
					targets[0].storage.cxm_fanjian = 1;
				} else {
					targets[0].storage.cxm_fanjian2 = 1;
				}
			}else{
				if (result.index == 0) {
					targets[1].storage.cxm_fanjian = 1;
				} else {
					targets[1].storage.cxm_fanjian2 = 1;
				}
			}
			if(event.count > 0) {
				event.count4 = [3, 4].randomGet();
				event.goto(1);
			} else {
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if(list[i].countMark("cxm_fanjian") > 0){
						event.count2++;
					}
					if(list[i].countMark("cxm_fanjian2") > 0){
						event.count3++;
					}
				}
			}
			"step 3"
			var list2 = game.filterPlayer();
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/cxm_fanjian${[1, 2].randomGet()}.mp3`);
			}, player);
			for (var i = 0; i < list2.length; i++) {
				if(list2[i].countMark("cxm_fanjian") > 0){
					if(event.count2 > 1 || event.count3 > 1){
						list2[i].loseHp();
						if(event.count2 > 1){
							list2[i].say("你怎如此贪心！");
						} else {
							if (list2[i] != player){
								list2[i].say("这破烂我崩血都不要！");
							}
						}
					}
					if(event.count2 == 1){
						list2[i].gain(cards, "gain2");
						list2[i].say("这张牌我要定了！");
					}
				}
				if(list2[i].countMark("cxm_fanjian2") > 0){
					if(event.count2 > 1 || event.count3 > 1){
						list2[i].loseHp();
						if(event.count2 > 1){
							list2[i].say("你怎如此贪心！");
						} else {
							if (list2[i] != player){
								list2[i].say("这破烂我崩血都不要！");
							}
						}
					}
				}
			}
			player.addTempSkill("cxm_fanjian_a", { player: "useSkillAfter" });
		},
		ai: {
			order: 5,
			result: {
				player: 1,
				target: -1,
			},
			threaten: 1,
		},
		group: "cxm_fanjian_b",
		subSkill: { a: {sub: true,},
			b: {
				trigger: {
					player: "phaseBegin",
				},
				silentForce: true,
				content() {
					player.storage.cxm_fanjian3 = game.countGroup();
				},
				sub: true,
			},
		},
	},
	"cxm_zhefu":{
		mod: {
			targetEnabled(card, player, target, now) {
				if (target.isTurnedOver()) {
					if ((get.type(card) == "trick" || get.type(card) == "delay") && !get.tag(card, 'damage')) {
						return false;
					}
				}
			},
		},
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		frequent: true,
		filter: function (event, player) {
			return (event.name != 'phase' || game.phaseNumber == 0);
		},
		content() {
			"step 0"
			player.draw(3);
			player.turnOver();
			player.chooseToUse(function (card) {
				if (!lib.filter.cardEnabled(card, _status.event.player, _status.event)) {
					return false;
				}
				const type = get.type(card, "trick");
				return type == "equip";
			}, "是否使用一张装备牌？");
			"step 1"
			if(player.countCards("h") > 6){
				player.chooseToDiscard(player.countCards("h") - 6, true, "h");
				var card = get.cardPile2(function (card) {
					return get.subtype(card) == "equip1";
				});
				if (card) {
					player.gain(card, "gain2");
				}
			}
		},
		group: "cxm_zhefu_b",
		subSkill: {
			a: {
				trigger: {
					player: "drawAfter",
				},
				silentForce: true,
				filter(event, player) {
					var list = [];
					for (var i = 0; i < event.result.length; i++) {
						if (get.type(event.result[i]) == "equip") {
							list.push(event.result[i]);
						}
					}
					return list.length > 0 || player.countCards("h") > 6;
				},
				async content(event, trigger, player) {
					event.count = 0;
					for (var i = 0; i < trigger.result.length; i++) {
						var currentEquip = trigger.result[i];
						if (get.type(currentEquip) == "equip") {
							var { result } = await player.chooseBool(
								get.prompt2('cxm_zhefu'), 
								"是否使用" + get.translation(currentEquip) +"？"
							);
							if (result?.bool) {
								event.count++;
								player.chooseUseTarget(currentEquip, true, "nopopup");
							}
						}
					}
					if(player.countCards("h") > 6 + event.count){
						player.chooseToDiscard(player.countCards("h") - 6 - event.count, true, "h");
					}
					if(player.hasSkill("cxm_zhefu_a")) player.removeSkill("cxm_zhefu_a");
				},
				sub: true,
			},
			b: {
				trigger: {
					global: "phaseDiscardEnd",
				},
				filter: function (event, player) {
					return !player.getStat('damage') && !player.isTurnedOver();
				},
				"prompt2": "是否发动一次〖蛰伏①〗？",
				content: function () {
					var next = game.createEvent('cxm_zhefu');
					next.player = player;
					next.setContent(lib.skill.cxm_zhefu.content);
				},
				sub: true,
			},
		},
	},
	"cxm_xici":{
		trigger: {
			player: "useCard",
		},
		frequent: true,
		filter(event, player) {
			return event.card.name == "sha" && player != _status.currentPhase;
		},
		content() {
			trigger.directHit.addArray(game.players);
		},
		group: ["cxm_xici_a", "cxm_xici_b", "cxm_xici_c"],
		subSkill:{
			a: {
				trigger: {
					player: "useCardToPlayered",
				},
				frequent: true,
				filter(event, player) {
					return event.card.name == "sha" && player != _status.currentPhase && event.target.countCards("h") < player.countCards("h") && player.countCards("he") >= 2;
				},
				content() {
					"step 0"
					player
						.chooseToDiscard(2, "he", "是否弃置两张牌，令" + get.translation(event.card) + "伤害+1？")
						.set("ai", function (card) {
							return 8 - get.value(card);
						});
					"step 1";
					if (result.bool) {
						player.addTempSkill('cxm_xici_d', 'shaAfter');
					}
				},
				sub:true,
			},
			b: {
				trigger: {
					global: "damageEnd",
				},
				filter(event, player) {
					return player.isTurnedOver();
				},
				"prompt2": "是否翻面然后，然后可使用一张手牌？",
				content() {
					player.turnOver();
					event.count = 0;
					player.countCards("h") && player.hasCard(card => {
						if (player.hasUseTarget(card, true, true)) event.count++;
					});
					if (event.count > 0) player.chooseToUse("袭刺：是否使用一张牌？");
    			},
				sub:true,
			},
			c: {
				trigger: {
					source: "damageAfter",
				},
				frequent: true,
				filter(event, player) {
					return player != _status.currentPhase;
				},
				content: function () {
					player.gainPlayerCard(trigger.num, trigger.player, true, "he");
				},
				sub:true,
			},
			d: {
				trigger: {
					source: "damageBegin1",
				},
				popup: false,
				forced: true,
				silent: true,
				filter: function (event, player) {
					return event.num > 0;
				},
				content: function () {
					trigger.num++;
				},
				sub:true,
			},
		},
	},
	"cxm_jingce":{
		trigger: {
			player: ["useCardAfter","respondAfter"],
		},
		frequent: true,
		mark: true,
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content: function (storage, player, skill) {
				if (player.storage.cxm_jingce == true) {
					var str = '当你使用或打出一张牌后，你可以摸两张牌';
				} else {
					var str = '当你使用或打出一张牌后，你可以弃置一张牌';
				}
				return str;
			},
		},
		content: function () {
			'step 0'
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/cxm_jingce${[1, 2].randomGet()}.mp3`);
			}, player);
			if (player.storage.cxm_jingce == true) {
				player.chooseToDiscard('he', true);
			} else {
				player.draw(2);
			}
			'step 1'
			player.changeZhuanhuanji("cxm_jingce");
		},
		group: "cxm_jingce_a",
		subSkill:{
			a: {
				trigger: {
					player: "phaseJieshuBegin",
				},
				frequent: true,
				content() {
					var list = 0;
					const suits = ["spade", "heart", "diamond", "club", "none"];
					suits.forEach(suit => {
						const cardArr = lib.skill.cxm_jingce_a.count(player, suit);
						if (cardArr && cardArr.length) {
							list++;
						}
					});
					game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/cxm_jingce${[3, 4].randomGet()}.mp3`);
					}, player);
					player.draw(list);
				},
				count: (player, suit) => {
					return player.getHistory("lose", evt => evt.type === "discard")
						.flatMap(evt => [...(evt.cards || []), ...(evt.cards2 || [])])
						.filter(card => get.suit(card) === suit);
				},
				sub:true,
			},
		},
	},
	/*"aqcs_tianjue":{
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		direct: true,
		filter: function (event) {
			return game.players.length > 1 && (event.name != 'phase' || game.phaseNumber == 0);
		},
		content: function () {
			'step 0'
			game.broadcastAll((player) => {
				var group1 = player.group;
				game.addCharacter('aqcs_tianjue_lei', {
					sex: 'male',
					group: 'qun',
					hp: 2,
					skills: [],
					groupInGuozhan: group1,
					isUnseen: true,
					extension: '衍生武将',
					translate: '小路因',
				});
				lib.character['aqcs_tianjue_lei'][4] = ['ext:鸽府包/image/character/stand/aqcs_xly.jpg', 'unseen', group1];
			}, player);
			'step 1'
			if (_status.connectMode === true) {
				var id = Math.floor(Math.random() * 8000000000);
				game.broadcastAll((player, id) => {
					var aqcs_tianjue_lx = ui.create.player(ui.arena).addTempClass("start");
					const position = +player.dataset.position + 1;
					const players = game.players.concat(game.dead);
					ui.arena.setNumber(players.length + 1);
					players.forEach(value => {
						if (parseInt(value.dataset.position) >= position) {
							value.dataset.position = parseInt(value.dataset.position) + 1;
						}
					});
					aqcs_tianjue_lx.playerid = id;
					lib.playerOL[id] = aqcs_tianjue_lx;
					aqcs_tianjue_lx.init('aqcs_tianjue_lei');
					game.players.push(aqcs_tianjue_lx);
					aqcs_tianjue_lx.dataset.position = position;
					game.arrangePlayers();
				}, player, id);
				var aqcs_tianjue_l = game.findPlayer2(current => (current.name1 == 'aqcs_tianjue_lei' || current.name2 == 'aqcs_tianjue_lei'));
				if (!aqcs_tianjue_l) aqcs_tianjue_l = player.next;
			} else {
				var aqcs_tianjue_l = game.addPlayer(+player.dataset.position + 1, 'aqcs_tianjue_lei');
			}
			if (!aqcs_tianjue_l.playerid) aqcs_tianjue_l.getId();
			event.aqcs_tianjue_l = aqcs_tianjue_l;
			if (!_status.aqcs_tianjue_l_die) _status.aqcs_tianjue_l_die = [];
			_status.aqcs_tianjue_l_die.add(aqcs_tianjue_l.playerid);
			if (!_status.aqcs_tianjue_l_auto) _status.aqcs_tianjue_l_auto = [];
			_status.aqcs_tianjue_l_auto.add(player.playerid, aqcs_tianjue_l.playerid);
			game.log(player, '制造了', lib.translate['aqcs_tianjue_lei']);
			game.broadcastAll((aqcs_tianjue_l, player) => {
				if (get.mode() == 'guozhan') {
					if (aqcs_tianjue_l.name2 == undefined) aqcs_tianjue_l.name2 = aqcs_tianjue_l.name1;
				}
				if (player.side || (game.me && game.me.side) || get.mode() == 'versus') {
					aqcs_tianjue_l.side = player.side;
					aqcs_tianjue_l.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
					aqcs_tianjue_l.node.identity.dataset.color = player.node.identity.dataset.color;
				}
				aqcs_tianjue_l.skillH = [];
				aqcs_tianjue_l.storage.zhibi = [];
				aqcs_tianjue_l.storage.stratagem_expose = [];
				aqcs_tianjue_l.storage.stratagem_fury = 0;
			}, aqcs_tianjue_l, player);
			game.broadcastAll((aqcs_tianjue_l, player) => {
				const identity = (aqcs_tianjue_l.identity = (identity => {
					switch (identity) {
						case "zhu":
						case "mingzhong":
							return "zhong";
						case "zhu_false":
							return "zhong_false";
						case "bZhu":
							return "bZhong";
						case "rZhu":
							return "rZhong";
						case "nei":
							return "commoner";
						default:
							return identity;
					}
				})(player.identity));
				if (get.mode() == 'doudizhu') lib.translate['zhong'] = "忠";
				if (!lib.translate[identity]) lib.translate[identity] = "民";
				const goon = player !== game.me && aqcs_tianjue_l !== game.me && player.node.identity.classList.contains("guessing") && !player.identityShown;
				if (goon) {
					if (aqcs_tianjue_l.identityShown) delete aqcs_tianjue_l.identityShown;
					if (!aqcs_tianjue_l.node.identity.classList.contains("guessing")) aqcs_tianjue_l.node.identity.classList.add("guessing");
				}
				aqcs_tianjue_l.setIdentity(goon ? "cai" : undefined);
				if (aqcs_tianjue_l.node.dieidentity) aqcs_tianjue_l.node.dieidentity.innerHTML = get.translation(aqcs_tianjue_l.identity + 2);
				if (typeof player.ai?.shown === "number" && aqcs_tianjue_l.ai) aqcs_tianjue_l.ai.shown = player.ai.shown;
			}, aqcs_tianjue_l, player);
			game.broadcastAll((aqcs_tianjue_l, player) => {
				aqcs_tianjue_l.setSeatNum(player.getSeatNum() + 1);
				const playerx = game.players.concat(game.dead);
				var minx = playerx.length;
				ui.arena.setNumber(minx);
				for (var i of playerx) {
					if (i.getSeatNum() < minx) minx = i.getSeatNum();
				}
				playerx.sortBySeat(game.findPlayer2(current => current.getSeatNum() == minx), true);
				for (var i = 0; i < playerx.length; i++) {
					playerx[i].setSeatNum(i + 1);
				}
				ui.update();
			}, aqcs_tianjue_l, player);
			game.broadcastAll((aqcs_tianjue_l, player) => {
				aqcs_tianjue_l["aqcs_tianjue"] = player;
				if (typeof game.checkResult === "function") {
					const origin_checkResult = game.checkResult;
					game.checkResult = function () {
						const player = game.me._trueMe || game.me;
						if (game.players.filter(i => i !== player).every(i => i["aqcs_tianjue"] === player)) {
							game.log('●游戏结束');
							game.over(true);
						}
						return origin_checkResult.apply(this, arguments);
					};
				}
				if (typeof game.checkOnlineResult === "function") {
					const origin_checkOnlineResult = game.checkOnlineResult;
					game.checkOnlineResult = function (player) {
						if (game.players.filter(i => i !== player).every(i => i["aqcs_tianjue"] === player)) return true;
						return origin_checkOnlineResult.apply(this, arguments);
					};
				}
				if (typeof lib.element.player.getFriends === "function") {
					const origin_getFriends = lib.element.player.getFriends;
					const getFriends = function (func, includeDie) {
						const player = this;
						return [...origin_getFriends.apply(this, arguments),
						...game[includeDie ? "filterPlayer2" : "filterPlayer"](target => (target["aqcs_tianjue"] || target) === (player["aqcs_tianjue"] || player))
						].filter(i => i !== player || func === true).unique().sortBySeat(player);
					};
					lib.element.player.getFriends = getFriends;
					[...game.players, ...game.dead].forEach(i => (i.getFriends = getFriends));
				}
				if (typeof lib.element.player.isFriendOf === "function") {
					const origin_isFriendOf = lib.element.player.isFriendOf;
					const isFriendOf = function (player) {
						if ((this["aqcs_tianjue"] || this) === (player["aqcs_tianjue"] || player)) return true;
						return origin_isFriendOf.apply(this, arguments);
					};
					lib.element.player.isFriendOf = isFriendOf;
					[...game.players, ...game.dead].forEach(i => (i.isFriendOf = isFriendOf));
				}
				if (typeof lib.element.player.getEnemies === "function") {
					const origin_getEnemies = lib.element.player.getEnemies;
					const getEnemies = function (func, includeDie) {
						if (this["aqcs_tianjue"]) return this["aqcs_tianjue"].getEnemies(func, includeDie);
						else {
							const player = this;
							return [...origin_getEnemies.apply(this, arguments),
							...game[includeDie ? "filterPlayer2" : "filterPlayer"](target => {
								return origin_getEnemies.apply(this, arguments).includes(target["aqcs_tianjue"] || target);
							}),
							].filter(i => player != (i["aqcs_tianjue"] || i)).unique().sortBySeat(player);
						}
					};
					lib.element.player.getEnemies = getEnemies;
					[...game.players, ...game.dead].forEach(i => (i.getEnemies = getEnemies));
				}
			}, aqcs_tianjue_l, player);
			player.ai.modAttitudeFrom = (from, to, att) => {
				if (player.isFriendsOf(to)) return get.attitude(from, to);
				return get.attitude(from, to) - 0.1;
			};
			aqcs_tianjue_l.ai.modAttitudeFrom = (from, to, att) => {
				if (to == player || player.isFriendsOf(to)) return 114514;
				return get.attitude(player, to) - 0.1;
			};
			aqcs_tianjue_l.ai.modAttitudeTo = (from, to, att) => {
				if (from == player || player.isFriendsOf(from)) return 7;
				return get.attitude(from, to);
			};
			aqcs_tianjue_l.addSkill('aqcs_shouxin');
			aqcs_tianjue_l.directgain(get.cards(4));
			game.addGlobalSkill('aqcs_tianjue_l_die');
			game.addGlobalSkill('aqcs_tianjue_l_over');
		},
		ai: {
			order: 10,
			result: {
				player: 1,
			},
			effect: {
				player: function (card, player, target) {
					if (game.zhu && player != game.zhu && get.itemtype(target) == 'player' && target == game.zhu && !player.getFriends().includes(game.zhu)) {
						if (game.players.filter(i => i != player && i != game.zhu).every(i => i.identity && i.identity == 'commoner')) {
							if (get.tag(card, 'recover') || get.tag(card, 'save')) return [1, -30];
						}
					}
				},
			},
		},
		group: ["aqcs_tianjue_a", "aqcs_tianjue_b", "aqcs_tianjue_c", "aqcs_tianjue_e", "aqcs_tianjue_f"],
		subSkill: {
			a: {
				trigger: {
					target: "useCardToTargeted",
				},
				forced: true,
				filter: function (event, player) {
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_tianjue_lei') {
							event.count++;
						}
					}
					if (event.card.name == "juedou" || event.card.name == "sha") {
						return event.count > 0;
					}
				},
				content: function () {
					trigger.targets.remove(trigger.target);
					trigger.getParent().triggeredTargets1.remove(trigger.target);
					trigger.untrigger();
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_tianjue_lei') {
							trigger.targets.push(list[i]);
						}
					}
				},
				sub: true,
			},
			b: {
				trigger: {
					global: "roundEnd",
				},
				audio: "ext:鸽府包/audio/skill:1",
				init: function (player) {
					player.storage.aqcs_tianjue_b = 0;
				},
				skillAnimation: true,
				animationColor: "gray",
				frequent: true,
				filter: function (event, player) {
					return player.phaseNumber >= 2 && !player.hasMark("aqcs_tianjue_b");
				},
				content: function () { 
					player.storage.aqcs_tianjue_b++;
					game.broadcastAll(function (player) {
						player.node.avatar.setBackgroundImage(`../extension/鸽府包/image/character/stand/aqcs_phsl.jpg`);
					}, player);
					game.addGlobalSkill('aqcs_tianjue_phsl');
					game.addGlobalSkill('aqcs_tianjue_phsl_a');
					game.addGlobalSkill('aqcs_tianjue_phsl_b');
					player.insertPhase();
				},
				sub: true,
			},
			c:{
				trigger: {
					player: "useCardToPlayered",
				},
				forced: true,
				filter: function (event){
					return event.card && event.card.name == 'sha';
				},
				content: function (){
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_tianjue_lei') {
							list[i].addTempSkill("aqcs_tianjue_d");
						}
					}
				},
				sub: true,
			},
			d:{
				mod: {
					cardEnabled(card, player) {
						return false;
					},
				},
				sub: true,
			},
			e:{
				init: function (player) {
					player.storage.aqcs_tianjue_die = 0;
				},
				trigger: {
					global: "dieBefore",
				},
				priority: 15,
				nobracket: true,
				forced: true,
				silent: true,
				popup: false,
				forceOut: true,
				forceDie: true,
				filter: function (event, player){
					if(player.countMark("aqcs_tianjue_die")) return false;
					return event.player.name == 'aqcs_tianjue_lei' || event.player.name == 'aqcs_lyjd';
				},
				content: function (){
					'step 0'
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].name == 'aqcs_tianjue_lei' || list[i].name == 'aqcs_lyjd') {
							event.count++;
						}
					}
					if(event.count > 1){
						trigger.cancel();
						game.broadcastAll(function (player) {
							trigger.player.out('aqcs_tianjue_e');
						}, player);
					}else{
						var list = game.filterPlayer();
						player.storage.aqcs_tianjue_die = 1;
						for (var i = 0; i < game.players.length; i++) {
							var pl = game.players[i];
							game.broadcastAll(function (pl) {
								pl.in('aqcs_tianjue_e');
							}, pl);
						}
					}
					'step 1'
					if(player.countMark("aqcs_tianjue_die")){
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (list[i].name == 'aqcs_tianjue_lei' || list[i].name == 'aqcs_lyjd') {
								list[i].die();
							}
						}
					}
				},
				sub: true,
			},
			f:{
				trigger: {
					player: "useCard",
				},
				popup: false,
				silent: true,
				firstDo: true,
				forced: true,
				persevereSkill: true,
				charlotte: true,
				async content(event, trigger, player) {
					trigger.directHit.addArray(
						game.filterPlayer(function (current) {
							return current.name == "aqcs_tianjue_lei";
						})
					);
				},
				sub: true,
			},
		},
	},
	
	aqcs_tianjue_l_die: {
		trigger: { player: 'dieAfaqcs_tianjue_lter' },
		fixed: true,
		priority: -2,
		direct: true,
		forced: true,
		charlotte: true,
		superCharlotte: true,
		lastDo: true,
		forceDie: true,
		silent: true,
		popup: false,
		filter: function (event, player) {
			if (_status.aqcs_tianjue_l_die) return _status.aqcs_tianjue_l_die.includes(event.player.playerid);
			return false;
		},
		content: function () {
			var targetd = trigger.player;
			game.broadcastAll(function (player, targetd) {
				game.dead.remove(targetd);
				game.removePlayer(targetd);
				const playerx = game.players.concat(game.dead);
				var minx = playerx.length;
				ui.arena.setNumber(minx);
				for (var i of playerx) {
					if (i.getSeatNum() < minx) minx = i.getSeatNum();
				}
				playerx.sortBySeat(game.findPlayer2(current => current.getSeatNum() == minx), true);
				for (var i = 0; i < playerx.length; i++) {
					playerx[i].setSeatNum(i + 1);
				}
			}, player, targetd);
			game.arrangePlayers();
			if (_status.currentPhase && _status.currentPhase == player) get.event().getParent("phaseLoop").player = player.getPrevious();
		},
	},
	"aqcs_zhongyan":{
		enable: "phaseUse",
		usable: 1,
		position: "hes",
		prompt: "出牌阶段限一次，你可将任意张不同类型的牌视为一张“杀”使用，若被转化的牌包含基本牌/锦囊牌/装备牌，此“杀”有对应效果",
		selectCard: [1,3],
		complexSelect: true,
		complexCard: true,
		filter(event, player) {
			var filter = event.filterCard;
			return filter(get.autoViewAs({ name: "sha" }, "unsure"), player, event) && player.countCards("hes");
		},
		filterCard(card, player) {
			if (ui.selected.cards.length) {
				const cards = get.type(card, player);
				const a = (type) => {
					if (["trick", "delay"].includes(type)) {
						return "trick_delay_group";
					}
					return type;
				};
				const b = a(cards);
				const c = ui.selected.cards.some(f => {
					const d = get.type(f, player);
					const e = a(d);
					return e === b;
				});
				return !c;
			}
			var type = get.type(card, player);
			return ["basic", "trick", "equip", "delay"].includes(type);
		},
		viewAs: (selectedCards) => {
			const includedTypes = new Set();
			selectedCards.forEach(card => {
				const cardType = get.type(card);
				includedTypes.add(["delay", "trick"].includes(cardType) ? "trick" : cardType);
			});
			const hasBasic = includedTypes.has("basic");
			const hasTrick = includedTypes.has("trick");
			const hasEquip = includedTypes.has("equip");
			const hasAllTypes = includedTypes.size === 3;
			const virtualSha = {
				name: "sha",
				extraData: {
					hasBasic,
					hasTrick,
					hasEquip,
					hasAllTypes
				},
				cardData: {
					extraData: { hasBasic, hasTrick, hasEquip, hasAllTypes }
				},
			};
			if (typeof _status !== "undefined") {
				_status.multiTypeShaExtra = { hasBasic, hasTrick, hasEquip, hasAllTypes };
			}
			if (selectedCards && typeof selectedCards === "object") {
				selectedCards.extraData = { hasBasic, hasTrick, hasEquip, hasAllTypes };
			}
			return virtualSha;
		},
		precontent: function (result, player, selectedCards) {
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/aqcs_zhongyan${[1].randomGet()}.mp3`);
			
				let extraData = card?.extraData || card?.cardData?.extraData || _status?.multiTypeShaExtra || selectedCards?.extraData;
				if (!extraData || typeof extraData !== "object") {
					extraData = { hasTrick: false, hasBasic: false, hasEquip: false, hasAllTypes: false };
					return;
				}
				const maxTargets = extraData.hasEquip ? 1 : 0;
				if(maxTargets > 0){
					player.addTempSkill('aqcs_zhongyan_a', {player: "useCardAfter"});
				}
				let maxTargetsd = 0;
				if (extraData.hasEquip) maxTargetsd += 1; 
				if (extraData.hasBasic) maxTargetsd += 1; 
				if (extraData.hasTrick) maxTargetsd += 1; 
				if (maxTargetsd > 0) {
					player.addMark("aqcs_zhongyan_o", 1);
				}
				if (maxTargetsd > 2) {
					player.addTempSkill('aqcs_zhongyan_d', {player: "useCardAfter"});
				}
			}, player);
		},
		hiddenCard(player, name) {
			if (get.type(name) != "basic" && name != "sha") {
				return false;
			}
			return player.countCards("hes");
		},
		mod: {
			selectTarget: function (card, player, range, selectedCards) {
				const evt = get.event();
				const judge = evt.skill !== "aqcs_zhongyan";
				if (get.itemtype(card) === "vcard" && Array.isArray(card.cards)) {
					if (judge) {
						return false;
					}
				}
				if (judge) {
					return false;
				}
				let extraData = card?.extraData || card?.cardData?.extraData || _status?.multiTypeShaExtra || selectedCards?.extraData;
				if (!extraData || typeof extraData !== "object") {
					extraData = { hasTrick: false, hasBasic: false, hasEquip: false, hasAllTypes: false };
					return;
				}
				const maxTargets = extraData.hasTrick ? 2 : 0;
				if (_status?.currentPhase === player && card?.name === "sha" && range[1] !== -1) {
					range[1] += maxTargets;
				}
			},
			targetInRange: function (card, player, selectedCards) {
				const evt = get.event();
				const judge = evt.skill == "aqcs_zhongyan";
				let extraData = card?.extraData || card?.cardData?.extraData || _status?.multiTypeShaExtra || selectedCards?.extraData;
				if (!extraData || typeof extraData !== "object") {
					extraData = { hasTrick: false, hasBasic: false, hasEquip: false, hasAllTypes: false };
					return;
				}
				const maxTargets = extraData.hasBasic ? 1 : 0;
				if(maxTargets > 0){
					if (get.itemtype(card) === "vcard" && Array.isArray(card.cards)) {
						if (judge) {
							return _status?.currentPhase === player && card?.name === "sha";
						}
					}
					if (judge) {
						return _status?.currentPhase === player && card?.name === "sha";
					}
				}
			},
		},
		group: "aqcs_zhongyan_b",
		subSkill:{
			a:{
				trigger: {
					player: "useCardToPlayered",
				},
				filter({ card }) {
					return card.name == "sha";
				},
				lastDo:true,
				silentForce: true,
				logTarget: "target",
				async content(event,trigger,player) {
					trigger.target.addTempSkill("qinggang2");
					trigger.target.storage.qinggang2?.add(trigger.card);
					trigger.target.markSkill("qinggang2");
				},
				sub:true,
			},
			b:{
				trigger: {
					player: "loseAfter",
					global: ["equipAfter","addJudgeAfter","loseAsyncAfter","addToExpansionAfter"],
				},
				"prompt2": function (event, player, skill) {
					var player = _status.event.player;
					if (!event.getl || !event.getl(player) || !event.getl(player).hs || event.getl(player).hs.length === 0) {
						return;
					}
					const normalizeType = (type) => {
						return type === "delay" ? "trick" : type;
					};
					const lostCardTypes = event.getl(player).hs
						.reduce((uniqueTypes, card) => {
							const originalType = card.type || get.type(card);
							const normalizedType = normalizeType(originalType);
							if (normalizedType && !uniqueTypes.includes(normalizedType)) {
								uniqueTypes.push(normalizedType);
							}
							return uniqueTypes;
						}, []);
					const emptyTypes = lostCardTypes.filter(type => {
						const countCondition = type === "trick" ? { type: ["trick", "delay"] }: { type: type };
						return player.countCards("h", countCondition) === 0;
					});
					const drawNum = emptyTypes.length;
					return '你是否摸【' + drawNum + '】张牌？';
				},
				filter(event, player) {
					let lose = 0;
					if (event.player && event.getl) {
						lose = event.getl(event.player).hs.length;
					}
					const normalizeType = (type) => {
						return type === "delay" ? "trick" : type;
					};
					const lostCardTypes = event.getl(player).hs
						.reduce((uniqueTypes, card) => {
							const originalType = card.type || get.type(card);
							const normalizedType = normalizeType(originalType);
							if (normalizedType && !uniqueTypes.includes(normalizedType)) {
								uniqueTypes.push(normalizedType);
							}
							return uniqueTypes;
						}, []);
					const emptyTypes = lostCardTypes.filter(type => {
						const countCondition = type === "trick" ? { type: ["trick", "delay"] }: { type: type };
						return player.countCards("h", countCondition) === 0;
					});
					const drawNum = emptyTypes.length;
					return drawNum && (lose > 0 || !event.player);
				},
				async content(event, trigger, player) {
					if (!trigger.getl || !trigger.getl(player) || !trigger.getl(player).hs || trigger.getl(player).hs.length === 0) {
						return;
					}
					const normalizeType = (type) => {
						return type === "delay" ? "trick" : type;
					};
					const lostCardTypes = trigger.getl(player).hs
						.reduce((uniqueTypes, card) => {
							const originalType = card.type || get.type(card);
							const normalizedType = normalizeType(originalType);
							if (normalizedType && !uniqueTypes.includes(normalizedType)) {
								uniqueTypes.push(normalizedType);
							}
							return uniqueTypes;
						}, []);
					const emptyTypes = lostCardTypes.filter(type => {
						const countCondition = type === "trick" ? { type: ["trick", "delay"] }: { type: type };
						return player.countCards("h", countCondition) === 0;
					});
					const drawNum = emptyTypes.length;
					if (drawNum > 0) {
						await player.draw(drawNum);
					}
				},
				sub:true,
			},
			d:{
				trigger: {
					player: "useCardToTargeted",
				},
				logTarget: "target",
				forced:true,
				popup: false,
				silent: true,
				firstDo: true,
				async content(event, trigger, player) {
					const id = trigger.target.playerid;
					const map = trigger.getParent().customArgs;
					if (!map[id]) {
						map[id] = {};
					}
					if (typeof map[id].extraDamage != "number") {
						map[id].extraDamage = 0;
					}
					map[id].extraDamage++;
				},
				sub:true,
			},
		},
	},*/
	"gzhlb_baiyan":{
		mod: {
			maxHandcard: function (player, num) {
				return num + player.countMark('gzhlb_baiyan_hand');
			},
		},
		trigger: {
        	global: ["equipAfter","addJudgeAfter","loseAfter","loseAsyncAfter","addToExpansionAfter"],
		},
		popup: false,
		silent: true,
		forced: true,
		init: function (player) {
			player.storage.gzhlb_baiyan_a = 1;
			player.storage.gzhlb_baiyan = 0;
			player.storage.gzhlb_baiyan_cg = 0;
			player.storage.gzhlb_baiyan_sb = 0;
			player.storage.gzhlb_baiyan_hand = 0;
		},
		filter(event, player, name) {
			let lose = 0;
			if (event.player && event.getl) {
				lose = event.getl(event.player).hs.length;
			}
			return lose > 0 || !event.player;
		},
		content: function () {
			"step 0"
			if(!trigger.player){
				player.storage.gzhlb_baiyan ++;
			}else{
				player.storage.gzhlb_baiyan += trigger.getl(trigger.player).hs.length;
			}
			"step 1"
			if(player.countMark("gzhlb_baiyan") > 2){
				player.popup("百言");
				game.log(player,'发动了', "<font color='#64dc64'>【百言】</font>");
				game.broadcastAll(function (player) {
					game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_baiyan${[1, 2].randomGet()}.mp3`);
				}, player);
				var num = Math.floor(Math.random() * player.countMark("gzhlb_baiyan_a")) + 1;
				if (num == 1) {
					player.draw();
					game.log(player, get.translation(player) + '〖百言〗以【1/' + player.countMark("gzhlb_baiyan_a") + '】的概率发动成功了');
					if(player.countMark("gzhlb_baiyan_a") < 4) player.addMark('gzhlb_baiyan_a', 1);
					player.storage.gzhlb_baiyan_cg++;
					player.storage.gzhlb_baiyan_sb -= player.countMark("gzhlb_baiyan_sb");
				} else {
					game.log(player, get.translation(player) + '〖百言〗以【' + (player.countMark("gzhlb_baiyan_a") - 1) + '/' + player.countMark("gzhlb_baiyan_a") + '】的概率发动失败了');
					player.removeMark('gzhlb_baiyan_a', 1);
					player.storage.gzhlb_baiyan_sb++;
					player.storage.gzhlb_baiyan_cg -= player.countMark("gzhlb_baiyan_cg");
				}
				player.storage.gzhlb_baiyan -= 3;
				player.judge().set("callback", lib.skill.gzhlb_baiyan.callback);
				if(player.countMark("gzhlb_baiyan") > 2) event.goto(1);
			}
		},
		callback: function (event, trigger, player) {
			if(get.color(event.card) == "red"){
				if(player.countMark("gzhlb_baiyan_sb") > 1) {
					player.recover();
				}else{
					if(player.maxHp < 9) player.gainMaxHp();
				}
			}else{
				if(player.countMark("gzhlb_baiyan_sb") > 1) {
					player.draw(2);
				}else{
					if(player.getHandcardLimit() < 9) player.storage.gzhlb_baiyan_hand++;
				}
			}
		},
	},
	"gzhlb_ninglian":{
		mod: {
			maxHandcard: function (player, num) {
				return num - player.countMark('gzhlb_ninglian_hand');
			},
		},
		init: function (player) {
			player.storage.gzhlb_ninglian_hand = 0;
			player.storage.gzhlb_ninglian_clear = 0;
			player.storage.gzhlb_ninglian_cs = 0;
		},
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		usable(skill, player) {
			return 1 + player.countMark("gzhlb_ninglian_cs");
		},
		content() {
			"step 0"
			player.chooseControl('体力上限','手牌上限', 'cancel2',ui.create.dialog(get.prompt('gzhlb_ninglian'), 'hidden')).ai = function () {
				return 0;
			}
			"step 1"
			event.count = 0;
			if (result.control == '体力上限') {
				event.count ++;
				player
                    .chooseNumbers(
                        get.translation(event.name),
                        [
                            {
                                prompt: "失去任意点体力上限，然后摸选择数量两倍的牌",
                                min: 1,
                                max: player.maxHp,
                            },
                        ],
                        true
                    )
                    .set("processAI", () => {
                        const player = get.player();
                        let num = Math.floor(player.countCards("h") / 2);
                        return [num];
                    });
                if (typeof result?.numbers?.[0] != "number") {
                    return;
                }
			}
			if (result.control == '手牌上限') {
				event.count += 2;
				player
                    .chooseNumbers(
                        get.translation(event.name),
                        [
                            {
                                prompt: "失去任意点手牌上限，然后本回合出杀加本次选择的数字",
                                min: 1,
                                max: player.getHandcardLimit(),
                            },
                        ],
                        true
                    )
                    .set("processAI", () => {
                        const player = get.player();
                        let num = Math.floor(player.countCards("h") / 2);
                        return [num];
                    });
                if (typeof result?.numbers?.[0] != "number") {
                    return;
                }
			}
			if (result.control == 'cancel2') {
				player.addTempSkill("gzhlb_ninglian_cs");
				player.storage.gzhlb_ninglian_cs++
				event.finish();
			}
			"step 2"
			if(event.count == 1){
				player.loseMaxHp(result.numbers[0]);
				player.draw(2*result.numbers[0]);
			}
			if(event.count == 2){
				player.storage.gzhlb_ninglian_hand += result.numbers[0];
				player.storage.gzhlb_ninglian_clear += result.numbers[0];
				player.addTempSkill("gzhlb_ninglian_clear");
			}
		},
		subSkill:{
			clear: {
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == 'sha') return num + player.countMark('gzhlb_ninglian_clear');
					},
				},
				onremove: function (player) {
					player.storage.gzhlb_ninglian_clear = 0;
				},
				sub: true,
			},
			cs: {
				onremove: function (player) {
					player.unmarkSkill("gzhlb_ninglian_cs");
					delete player.storage.gzhlb_ninglian_cs;
				},
				sub: true,
			},
		},
	},
	"aqcs_bitian":{
		trigger: {
			global: "roundEnd",
		},
		lastDo: true,
		filter(event, player) {
			return !player.getRoundHistory("damage").length;
		},
		content() {
			'step 0'
			delete player.storage.aqcs_bitian; 
			player.chooseTarget('请选择一名角色，其于下轮使用的所有基本牌均改为对你使用的【杀】', true, function(card,player,target){
				return target != player;
			}).set('ai',function(target){
				var player = _status.event.player, att = get.attitude(player, target);
				if (att < 0) return 1;
				if (att >= 0) return -1;
			});
			'step 1'
			if (result.bool) {
				player.markAuto("aqcs_bitian", [result.targets[0]]);
			}
		},
		group: ["aqcs_bitian_a", "aqcs_bitian_b", "aqcs_bitian_c", "aqcs_bitian_d"],
		subSkill:{
			a:{
				trigger: {
					global: "useCard",
				},
				forced: true,
				init: function (player) {
					player.storage.aqcs_bitian = [];
				},
				filter(event, player) {
					if(player.storage.aqcs_bitian){
						return get.type(event.card) == 'basic' && player.storage.aqcs_bitian.includes(event.player);
					}
				},
				content() {
					trigger.targets.length = 0;
					trigger.targets.push(player);
					trigger.card.name = "sha";
					trigger.card.isCard = false;
				},
				sub:true,
			},
			b:{
				trigger: {
					player: ["dyingBefore", "dyingBegin", "phaseDiscardBefore"],
				},
				lastDo: true,
				frequent: true,
				filter(event, player) {
					return player.hujia > 0;
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				sub:true,
			},
			c:{
				trigger: {
					player: "recoverBegin",
				},
				frequent: true,
				content: function () {
					trigger.cancel();
					player.changeHujia(trigger.num);
				},
				sub:true,
			},
			d:{
				trigger: {
					global: "roundEnd",
				},
				popup: false,
				silent: true,
				forced: true,
				content() {
					delete player.storage.aqcs_bitian; 
				},
				sub:true,
			},
		},
	},
	"aqcs_senluo":{
		trigger: {
			global: "gameStart",
		},
		forced: true,
		content() {
			player.addMark("aqcs_senluo_zhsx", 1);
			game.addGlobalSkill("aqcs_senluo_zhsx");
			game.addGlobalSkill("aqcs_senluo_xuji");
		},
		group:["aqcs_senluo_a", "aqcs_senluo_b"],
		subSkill: {
			b:{
				init: function (player) {
					player.storage.aqcs_senluo = ["aqcs_senluo1", "aqcs_senluo2", "aqcs_senluo3", "aqcs_senluo4", "aqcs_senluo5"];
					player.storage.aqcs_senluo_bb = 0;
				},
				trigger: {
					global: "aqcs_senluo_xujiAfter",
				},
				forced:true,
				async content(event, trigger, player) {
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].hasMark('aqcs_senluo_b')) {
							event.count += list[i].countMark('aqcs_senluo_b');
						}
					}
					player.storage.aqcs_senluo.remove('aqcs_senluo5');
					if((event.count == 2 && player.countMark('aqcs_senluo_bb') != 1 )|| (event.count == 4 && player.countMark('aqcs_senluo_bb') != 2 ) || (event.count == 6 && player.countMark('aqcs_senluo_bb') != 3 )){
						player.storage.aqcs_senluo_bb++;
						const choices = [];
						const choiceList = [
							"[每轮游戏开始或受到伤害时]改为[每轮游戏开始、受到伤害、你响应“杀”时]",
							"[若其的手牌数大于其体力上限]改为[若其的手牌数不小于其体力值]",
							"[展示牌堆顶两张牌]改为[展示牌堆顶四张牌]",
							"[选择一名角色，获得其中一张牌]改为[选择一名角色，你与其各获得其中一张牌]并解锁〖额外描述5〗",
							"[获得其中一张牌]改为[你获得其中两张牌并可将至多两张牌交给你选择的角色]"
						];
						if (player.storage.aqcs_senluo.contains("aqcs_senluo1")) {
							choices.push("选项一");
						} else {
							choiceList[0] = `<span style="opacity:0.5">${choiceList[0]}（已被选择过）</span>`;
						}
						if (player.storage.aqcs_senluo.contains("aqcs_senluo2")) {
							choices.push("选项二");
						} else {
							choiceList[1] = `<span style="opacity:0.5">${choiceList[1]}（已被选择过）</span>`;
						}
						if (player.storage.aqcs_senluo.contains("aqcs_senluo3")) {
							choices.push("选项三");
						} else {
							choiceList[2] = `<span style="opacity:0.5">${choiceList[2]}（已被选择过）</span>`;
						}
						if (player.storage.aqcs_senluo.contains("aqcs_senluo4")) {
							choices.push("选项四");
						} else {
							choiceList[3] = `<span style="opacity:0.5">${choiceList[3]}（已被选择过）</span>`;
						}
						if (player.storage.aqcs_senluo.contains("aqcs_senluo5") || player.storage.aqcs_senluo.contains("aqcs_senluo6")) {
							choices.push("选项五");
						} else {
							choiceList[4] = `<span style="opacity:0.5">${choiceList[4]}（已被选择过）</span>`;
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
								.set("prompt", get.prompt("aqcs_senluo"))
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
						const choice = result.control;
						if (choice == "选项一") {
							player.storage.aqcs_senluo.remove('aqcs_senluo1');
							player.addMark("aqcs_senluo1_b", 1);
						}
						if (choice == "选项二") {
							player.storage.aqcs_senluo.remove('aqcs_senluo2');
							player.addMark("aqcs_senluo2_b", 1);
						}
						if (choice == "选项三") {
							player.storage.aqcs_senluo.remove('aqcs_senluo3');
							player.addMark("aqcs_senluo3_b", 1);
						}
						if (choice == "选项四") {
							player.storage.aqcs_senluo.remove('aqcs_senluo4');
							player.markAuto("aqcs_senluo", 'aqcs_senluo6');
							player.addMark("aqcs_senluo4_b", 1);
						}
						if (choice == "选项五") {
							player.storage.aqcs_senluo.remove('aqcs_senluo6');
							player.addMark("aqcs_senluo5_b", 1);
						}
					}
				},
			},
			a:{
				trigger: {
					player: ["damageBegin", "useCard"],
					global: "roundStart",
				},
				filter:function(event, player, name){
					if(name != 'useCard') {
						return true;
					}else{
						return Array.isArray(event.respondTo) && event.card.name == "shan" && player.hasMark("aqcs_senluo1_b");
					}
				},
				"prompt2": function (event, player) {
					return '是否选择一名角色并令其展示牌堆顶的两张牌，然后其选择其中一张并获得之，若其的手牌数若大于其体力上限，其获得一层“蓄击”效果（可叠加，至多叠加3层）？';
				},
				content() {
					"step 0"
					player.chooseTarget('请选择一名角色').set('ai', function (target) {
						var player = _status.event.player, att = get.attitude(player, target);
						if (att > 0) return 1;
						if (att < 0) return -2;
						return 0;
					});
					'step 1'
					if (result.bool) {
						var target = result.targets[0]; 
						event.target = target;
						if(player.hasMark("aqcs_senluo3_b")){
							var cards = get.cards(4);
						}else{
							var cards = get.cards(2);
						}
						event.cardsd = cards;
						target.showCards(cards, get.translation(player) + "发动了〖森罗〗");
						game.cardsGotoOrdering(cards);
						if(player.hasMark("aqcs_senluo4_b")){
							if(player.hasMark("aqcs_senluo5_b")){
								player.chooseCardButton('森罗：请选择其中两张牌并获得', cards, 2, true)
								.set('ai', function (button) {
									return get.value(button.link);
								});
							}else{
								player.chooseCardButton('森罗：请选择其中一张牌并获得', cards, true)
								.set('ai', function (button) {
									return get.value(button.link);
								});
							}
						}else{
							target.chooseCardButton('森罗：请选择其中一张牌并获得', cards, true)
							.set('ai', function (button) {
								return get.value(button.link);
							});
						}
					}
					"step 2"
					if (result.bool && result.links && result.links.length) {
						if(player.hasMark("aqcs_senluo4_b")){
							player.gain(result.links, "gain2");
							event.cardsd.removeArray(result.links);
							game.log(player, `获得了${result.links.length}张牌`);
							if(player.hasMark("aqcs_senluo5_b")){
								if((player.hasMark("aqcs_senluo2_b") && player.countCards("h") + 2 >= player.hp || player.countCards("h") + 2 > player.maxHp) && player.countMark("aqcs_senluo_xuji") < 3){
									player.addMark("aqcs_senluo_xuji", 1);
								}
								player.chooseCard([1, 2], '交给' + get.translation(event.target) + '至多两张牌', 'he').set('ai', function (card) {
									if (att > 1) return 4 - get.value(card);
									return -1;
								});
								event.goto(4);
							}else{
								if((player.hasMark("aqcs_senluo2_b") && player.countCards("h") + 1 >= player.hp || player.countCards("h") + 1 > player.maxHp) && player.countMark("aqcs_senluo_xuji") < 3){
									player.addMark("aqcs_senluo_xuji", 1);
								}
								event.target.chooseCardButton('森罗：请选择其中一张牌并获得', event.cardsd, true)
								.set('ai', function (button) {
									return get.value(button.link);
								});
							}
						}else{
							event.target.gain(result.links, "gain2");
							game.log(event.target, `获得了${result.links.length}张牌`);
							if((player.hasMark("aqcs_senluo2_b") && event.target.countCards("h") + 1 >= event.target.hp || event.target.countCards("h") + 1 > event.target.maxHp) && event.target.countMark("aqcs_senluo_xuji") < 3){
								event.target.addMark("aqcs_senluo_xuji", 1);
								if(event.target != player) event.target.addTempSkill('aqcs_senluo_xuji');
							}
							event.finish();
						}
					}
					"step 3"
					if (result.bool && result.links && result.links.length) {
						event.target.gain(result.links, "gain2");
						game.log(event.target, `获得了${result.links.length}张牌`);
						if((player.hasMark("aqcs_senluo2_b") && event.target.countCards("h") + 1 >= event.target.hp || event.target.countCards("h") + 1 > event.target.maxHp) && event.target.countMark("aqcs_senluo_xuji") < 3){
							event.target.addMark("aqcs_senluo_xuji", 1);
							if(event.target != player) event.target.addTempSkill('aqcs_senluo_xuji');
						}
					}
					event.finish();
					"step 4"
					if (result.bool) {
						player.give(result.cards, event.target);
						if((player.hasMark("aqcs_senluo2_b") && event.target.countCards("h") + result.cards.length >= event.target.hp || event.target.countCards("h") + result.cards.length > event.target.maxHp) && event.target.countMark("aqcs_senluo_xuji") < 3){
							event.target.addMark("aqcs_senluo_xuji", 1);
							if(event.target != player) event.target.addTempSkill('aqcs_senluo_xuji');
						}
					}else{
						if((player.hasMark("aqcs_senluo2_b") && event.target.countCards("h") >= event.target.hp || event.target.countCards("h") > event.target.maxHp) && event.target.countMark("aqcs_senluo_xuji") < 3){
							event.target.addMark("aqcs_senluo_xuji", 1);
							if(event.target != player) event.target.addTempSkill('aqcs_senluo_xuji');
						}
					}
				},
				sub:true,
			},
			zhsx: {
				trigger: {
					player: ["dying","damageBegin3"],
				},
				forced: true,
				popup: false,
				filter:function(event, player, name){
					if(name=='dying') {
						return event.player.hasMark("aqcs_senluo_zhsx") && player.countMark("aqcs_senluo_dying") < 2;
					}else{
						return event.player.hasMark("aqcs_senluo_zhsx");
					}
				},
				content() {
					if(event.triggername=='dying'){
						if(player.countMark("aqcs_senluo_dying") < 2){
							player.addMark("aqcs_senluo_dying", 1);
							player.changeHp(1 - player.hp);
							player.changeHujia(2);
						}
					}else{
						if(trigger.hasNature("fire")){
							var a = Math.round((trigger.num / 2) * 10) / 10;
							trigger.num += a;
						}else if(trigger.num > 1){
							var a = Math.round((trigger.num / 2) * 10) / 10;
							trigger.num -= a;
						}
					}
				},
				sub: true,
				parentskill: "aqcs_senluo",
				"_priority": 0,
				sourceSkill: "aqcs_senluo",
			},
			xuji: {
				trigger: {
					player: "useCardAfter",
					global: "aqcs_senluo_aAfter",
				},
				frequent: true,
				popup: false,
				"prompt2": function (event, player) {
					return '是否选消耗一层“蓄击”使用一张不限次数和距离的【杀】？';
				},
				intro: {
					name: "蓄击",
					content(err, player) {
						return `你拥有【${player.countMark('aqcs_senluo_xuji')}】层蓄击`
					},
					markcount(storage, player) {
						return `${player.countMark('aqcs_senluo_xuji')}`
					},
				},
				filter:function(event, player, name){
					if(player.hasSkill("cxm_saier_cs_4")) return false;
					if(name=='useCardAfter') {
						return event.player.hasMark("aqcs_senluo_xuji");
					}else{
						return event.player.countMark("aqcs_senluo_xuji") > 2;
					}
				},
				content() {
					"step 0"
					player.addTempSkill('cxm_saier_cs_4');
					"step 1"
					player.chooseToUse({ name: "sha" }, "森罗：是否使用一张不限次数和距离的【杀】？");
					"step 2"
					player.removeSkill("cxm_saier_cs_4");
					if (result.bool) {
						player.removeMark("aqcs_senluo_xuji", 1);
						player.addMark("aqcs_senluo_b", 1);
					}
				},
				sub: true,
				parentskill: "aqcs_senluo",
				"_priority": 0,
				sourceSkill: "aqcs_senluo",
			},
		},
	},

	"aqcs_zhigao": {
		trigger: {
			global: ["roundStart","useCardEnd"],
		},
		forced: true,
		persevereSkill: true,
		filter: function (event, player, name) {
			if (name == 'roundStart') return true;
			return event.card.name == "sha";
		},
		content: function () {
			if (event.triggername == 'roundStart') {
				player.storage.aqcs_zhigao_useCardEnd = 0;
				player.gflib_changeMp(25, 'aqcs_csnl');
			} else {
				var a = 25 - player.countMark("aqcs_zhigao_useCardEnd") * 5;
				var b = a < 10 ? 10 : a;
				player.gflib_changeMp(b, 'aqcs_csnl');
			}
		},
		group: ["aqcs_zhigao_a", "aqcs_zhigao_c", "aqcs_zhigao_d"],
		subSkill: {
			a: {
				trigger: {
					global: "dying",
				},
				popup: false,
				silent: true,
				forced: true,
				persevereSkill: true,
				charlotte: true,
				filter(event, player) {
					return player.countMark("aqcs_zhigao_aa");
				},
				content: function () {
					player.storage.aqcs_zhigao_a = 1;
					player.removeSkill("aqcs_zhigao_b");
				},
				sub:true,
			},
			b: {
				trigger: {
					player: "aqcs_zhigao_dAfter",
				},
				popup: false,
				silent: true,
				forced: true,
				persevereSkill: true,
				charlotte: true,
				content: function () {
					if (player.countMark("aqcs_zhigao_a") < 1 && player.storage.aqcs_zhigao_target) {
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (player.storage.aqcs_zhigao_target.includes(list[i])) {
								list[i].damage()._triggered = null;
							}
						}
					}
					player.storage.aqcs_zhigao_a = 0;
					player.storage.aqcs_zhigao_aa = 0;
					player.removeSkill("aqcs_zhigao_b");
				},
				sub: true,
			},
			c: {
				trigger: {
					player: ["phaseJudgeBefore", "turnOverBegin", "loseMaxHpEnd"],
				},
				forced: true,
				persevereSkill: true,
				content: function () {
					if (event.triggername == 'roundStart') {
						trigger.cancel();
					}
					if (event.triggername == 'turnOverBegin') {
						player.gflib_changeMp(100, 'aqcs_csnl');
					}
					if (event.triggername == 'loseMaxHpEnd') {
						if (4 - player.maxHp > 0) player.gainMaxHp(4 - player.maxHp);
						else if (player.maxHp - 4 > 0) player.loseMaxHp(player.maxHp - 4);
					}
				},
			},
			d: {
				mod: {
					targetInRange(card, player, target, now) {
						if (player.countMark("aqcs_zhigao_wjl")) {
							return true;
						}
					},
				},
				trigger: {
					player: "aqcs_zhigaoAfter",
				},
				popup: false,
				silent: true,
				forced: true,
				persevereSkill: true,
				filter: function (event, player) {
					return player.gflib_getMp('aqcs_csnl') == 100;
				},
				content: function () {
					'step 0'
					player.storage.aqcs_zhigao_wjl = 1;
					player.gflib_changeMp(-75, 'aqcs_csnl');
					player.storage.aqcs_zhigao_aa = 1;
					player.storage.aqcs_zhigao_a = 0;
					player.storage.aqcs_zhigao_useCardEnd++;
					'step 1'
					player.chooseToUse(true, "至高：请使用一张无视距离的牌，若此牌为【杀】，且目标未因此【杀】入濒死状态，则你对其造成1点神圣伤害。");
					'step 2'
					player.storage.aqcs_zhigao_wjl = 0;
					if (result.bool) {
						if (result.cards[0].name == "sha" || player.countMark("aqcs_tianli_a") > 0) {
							delete player.storage.aqcs_zhigao_target;
							player.markAuto("aqcs_zhigao_target", [result.targets[0]]);
							player.addTempSkill("aqcs_zhigao_b");
						}
					}
					
				},
				sub:true,
			},
		},
	},
	"aqcs_tianli": {
		enable: ["chooseToUse", "chooseToRespond"],
		forced: true,
		persevereSkill: true,
		hiddenCard(player, name) {
			return name == "sha" && player.countCards("hes");
		},
		filter(event, player) {
			if (player.gflib_getMp('aqcs_csnl') < 25) return false;
			return event.filterCard(get.autoViewAs({ name: "sha" }, "unsure"), player, event) || lib.inpile_nature.some(nature => event.filterCard(get.autoViewAs({ name: "sha", nature }, "unsure"), player, event));
		},
		chooseButton: {
			dialog(event, player) {
				var list = [];
				if (event.filterCard(get.autoViewAs({ name: "sha" }, "unsure"), player, event)) {
					list.push(["基本", "", "sha"]);
				}
				for (var j of lib.inpile_nature) {
					if (event.filterCard(get.autoViewAs({ name: "sha", nature: j }, "unsure"), player, event)) {
						list.push(["基本", "", "sha", j]);
					}
				}
				var dialog = ui.create.dialog("天理", [list, "vcard"], "hidden");
				dialog.direct = true;
				return dialog;
			},
			check(button) {
				var player = _status.event.player;
				var card = { name: button.link[2], nature: button.link[3] };
				if (
					_status.event.getParent().type == "phase" &&
					game.hasPlayer(function (current) {
						return player.canUse(card, current) && get.effect(current, card, player, player) > 0;
					})
				) {
					switch (button.link[2]) {
						case "sha":
							if (button.link[3] == "fire") {
								return 2.95;
							} else if (button.link[3] == "thunder" || button.link[3] == "ice") {
								return 2.92;
							} else {
								return 2.9;
							}
					}
				}
				return 1 + Math.random();
			},
			backup(links, player) {
				return {
					filterCard: true,
					check(card) {
						return 6 - get.value(card);
					},
					viewAs: { name: links[0][2], nature: links[0][3] },
					position: "hes",
					popname: true,
					precontent: function () {
						player.addMark("aqcs_tianli_a", 1);
						player.gflib_changeMp(-25, 'aqcs_csnl');
					},
				};
			},
			prompt(links, player) {
				return "将一张牌当作" + get.translation(links[0][3] || "") + "【" + get.translation(links[0][2]) + "】" + (_status.event.name == "chooseToUse" ? "使用" : "打出");
			},
		},
		ai: {
			respondSha: true,
			fireAttack: true,
			skillTagFilter(player, tag) {
				if (!player.countCards("hes")) {
					return false;
				}
			},
			order(item, player) {
				if (player && _status.event.type == "phase") {
					var max = 0;
					if (lib.inpile_nature.some(i => player.getUseValue({ name: "sha", nature: i }) > 0)) {
						var temp = get.order({ name: "sha" });
						if (temp > max) {
							max = temp;
						}
					}
					if (max > 0) {
						max += 0.3;
					}
					return max;
				}
				return 4;
			},
			result: {
				player: 1,
			},
		},
		group: ["aqcs_tianli_a", "aqcs_tianli_b"],
		subSkill: {
			a: {
				trigger: {
					target: "useCardToTargeted",
				},
				forced: true,
				persevereSkill: true,
				filter(event, player) {
					return event.card.name == "sha" && player.countCards("he") > 0;
				},
				content: function () {
					"step 0"
					player.chooseToDiscard("是否弃置任意张手牌然后摸一张牌？", [1, Infinity], lib.filter.cardRecastable).set("ai", function (card) {
						return 7.5 - get.value(card);
					});
					"step 1";
					if (result.bool) {
						player.draw()
					}
				},
				sub:true,
			},
			b: {
				trigger: {
					player: ["loseEnd", "aqcs_zhigaoEnd"],
				},
				forced: true,
				persevereSkill: true,
				unique: true,
				filter: function (event, player) {
					return player.countCards("h") < Math.min(Math.floor(player.gflib_getMp('aqcs_csnl') / 25) * 2, 5);
				},
				content: function () {
					player.draw(Math.min(Math.floor(player.gflib_getMp('aqcs_csnl') / 25) * 2, 5) - player.countCards("h"));
				},
				ai: {
					effect: {
						target: function (card, player, target) {
							if (card.name == "shunshou") {
								return;
							}
							if (card.name == "guohe") {
								if (!target.countCards("e")) {
									return [0, 1];
								}
							} else if (get.tag(card, "loseCard")) {
								return [0, 1];
							}
						},
					},
					noh: true,
					freeSha: true,
					freeShan: true,
					skillTagFilter() {
						return true;
					},
				},
				sub: true,
			},
		},
	},
	"seh_mojun": {
		trigger: {
			player: "damageBegin",
		},
		forced: true,
		persevereSkill: true,
		filter: function (event, player) {
			return event.num > 0;
		},
		content: function () {
			"step 0"
			var card = get.bottomCards()[0];
			event.card = card;
			player.showCards(card, get.translation(player) + "发动了〖魔君〗");
			"step 1"
			if (get.color(card, false) == "black") {
				trigger.cancel();
				game.log(player, '本次判定为黑【' + get.translation(player) + '】免疫了【' + trigger.num +'】伤害');
			} else {
				var next = player.chooseUseTarget(card);
				if (get.info(card).updateUsable == "phaseUse") {
					next.addCount = false;
				}
				game.log(player, '本次判定不为黑【' + get.translation(player) + '】可以使用' + get.translation(card) + '。');
			}
		},
		group: ["seh_mojun_a", "seh_mojun_b", "seh_mojun_c"],
		subSkill: {
			a: {
				trigger: {
					global: ["useCard", "useCardToPlayer"],
				},
				persevereSkill: true,
				charlotte: true,
				"prompt2": function (event, player, name) {
					if (name == 'useCardToPlayer') {
						return '你是否与' + get.translation(event.player) + '进行拼点，若你赢，你将' + get.translation(event.card) + '的目标改为你？';
					} else {
						return '你是否与' + get.translation(event.player) + '进行拼点，若你赢，你令' + get.translation(event.card) + '无效？';
					}
				},
				filter(event, player, name) {
					if (event.player == player) return false;
					if (name == 'useCardToPlayer') {
						return event.card.name == "sha" && (event.target != player || event.targets.length > 1);
					} else {
						return get.type(event.card) == "trick";
					}
				},
				content: function () {
					"step 0"
					var a = player.getCards("s", function (card) {
						return card.hasGaintag("seh_hundun");
					}).length;
					if (player.countCards("h") < 1 && a > 0) {
						player
							.chooseCard("s", 1, function (card, player) {
								return card.hasGaintag("seh_hundun");
							})
							.set("prompt2", get.prompt("seh_mojun") + '<div class="text center">请获得一张“黯”牌</div >')
							.set("ai", card => {
								return 8 - get.value(card);
							})
							.forResult();
					}
					"step 1"
					if (result.bool) {
						player.gain(result.cards);
					}
					player.chooseToCompare(trigger.player);
					"step 2"
					if (result.bool) {
						if (event.triggername == 'useCardToPlayer') {
							trigger.targets.length = 0;
							trigger.getParent().triggeredTargets1.length = 0;
							trigger.targets.push(player);
							game.log(player, '【' + get.translation(trigger.player) + '】' + get.translation(trigger.card) + '的目标改为了【' + get.translation(player) + '】');
						} else {
							trigger.targets.length = 0;
							trigger.all_excluded = true;
							game.log(player, '【' + get.translation(trigger.player) + '】的' + get.translation(trigger.card) + '被无效了');
						}
					} 
				},
				sub:true,
			},
			b: {
				trigger: {
					player: "damageEnd",
				},
				forced: true,
				persevereSkill: true,
				filter: function (event, player) {
					return event.num >= 1 && event.source?.isIn();
				},
				content: function () {
					if (player.countCards("h") < trigger.source.countCards("h")) {
						trigger.source.chooseToDiscard(trigger.source.countCards("h") - player.countCards("h"), true);
					} else {
						trigger.source.loseHp();
					}
				},
				sub:true,
			},
			c: {
				trigger: {
					player: "compare",
					target: "compare",
				},
				popup: false,
				silent: true,
				forced: true,
				persevereSkill: true,
				charlotte: true,
				filter(event, player, name) {
					if (player == event.player) {
						return event.num2 >= event.num1;
					} else {
						return event.num1 >= event.num2;
					}
				},
				content() {
					player.addMark('seh_mojun_clear', 1);
					player.addTempSkills("seh_mojun_clear", { player: "phaseEnd" });
				},
				sub: true,
			},
			clear: {
				mod: {
					maxHandcard: function (player, num) {
						return num - player.countMark('seh_mojun_clear');
					},
				},
				onremove: function (player) {
					player.unmarkSkill("seh_mojun_clear");
					delete player.storage.seh_mojun_clear;
				},
				sub: true,
			},
		},
	},
	"seh_hundun": {
		marktext: "黯",
		intro: {
			mark(dialog, storage, player) {
				dialog.addAuto(
					player.getCards("s", function (card) {
						return card.hasGaintag("seh_hundun");
					})
				);
			},
			markcount(storage, player) {
				return player.getCards("s", function (card) {
					return card.hasGaintag("seh_hundun");
				}).length;
			},
			onunmark(storage, player) {
				var cards = player.getCards("s", function (card) {
					return card.hasGaintag("seh_hundun");
				});
				if (cards.length) {
					player.lose(cards, ui.discardPile);
					player.$throw(cards, 1000);
					game.log(cards, "进入了弃牌堆");
				}
			},
		},
		trigger: {
			player: ["useCardAfter"],
		},
		filter: function (event, player) {
			var a = player.getCards("s", function (card) {
				return card.hasGaintag("seh_hundun");
			}).length;
			return get.color(event.card) == "black" && a < 3;
		},
		"prompt2": function (event, player) {
			return '你是否将' + get.translation(event.card) + '置于你的武将牌上称为“黯”（你至多同时拥有3张“黯”）？';
		},
		content: function () {
			'step 0'
			var cards = trigger.cards;
			player.loseToSpecial(cards, "seh_hundun").visible = true;
			'step 1'
			player.markSkill("seh_hundun");
		},
		group: ["seh_hundun_a", "seh_hundun_b", "seh_hundun_c"],
		subSkill: {
			a: {
				trigger: {
					global: ["chooseCardOLBegin", "chooseCardOLEnd"],
				},
				filter(event, player) {
					return event.type === "compare" && !event.directresult;
				},
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					if (event.triggername == "chooseCardOLBegin") {
						trigger._set.push(["position", "hs"]);
						const originalFilter = trigger.filterCard;
						trigger._set.push([
							"filterCard",
							function (card) {
								if (typeof originalFilter === "function" && !originalFilter(card)) {
									return false;
								}
								if (get.position(card) == "s") {
									var player = _status.event.player;
									var cards = player.getCards("s", function (card) {
										return card.hasGaintag("seh_hundun");
									});
									return cards;
								}
								return true;
							},
						]);
					} else {
						const cards = player.getCards("s", card => card.hasGaintag("seh_hundun_a"));
						if (cards?.length) {
							game.deleteFakeCards(cards);
						}
						const card = trigger.result[trigger.targets.indexOf(player)].cards[0],
							precard = player.getExpansions("seh_hundun_a").find(cardx => cardx.cardid == card._cardid);
						if (precard) {
							trigger.result[trigger.targets.indexOf(player)].cards = [precard];
						}
					}
				},
				sub: true,
				parentskill: "seh_hundun",
				"_priority": 0,
				sourceSkill: "seh_hundun",
			},
			b: {
				trigger: {
					player: "phaseBegin",
				},
				forced: true,
				async content(event, trigger, player) {
					player.draw(3);
					if (player.getHandcardLimit() > 0) {
						const minNum = Math.min(3, player.getHandcardLimit());
						await player.chooseToDiscard("hes", minNum, true);
					}
				},
				sub:true,
			},
			c: {
				mod: {
					cardUsable(card, player) {
						var player = _status.event.player, a = Math.min(player.getHandcardLimit(), 3);
						if (player.countMark("seh_hundun_clear") < a) {
							if (get.color(card) == "black" ) return Infinity;
						}
					},
					targetInRange(card) {
						var player = _status.event.player, a = Math.min(player.getHandcardLimit(), 3);
						if (get.color(card) == "black" && player.countMark("seh_hundun_clear") < a) {
							return true;
						}
					},
					cardEnabled2(card, player, result) {
						if (card.hasGaintag('seh_hundun')) return false;
					},
				},
				trigger: {
					global: "phaseBegin",
					player: "useCard",
				},
				popup: false,
				silent: true,
				forced: true,
				filter(event, player, name) {
					if (name == 'phaseBegin') {
						return true;
					} else{
						return get.color(event.card) == "black";
					}
				},
				content: function () {
					if (event.triggername == "useCard") {
						player.addMark('seh_hundun_clear', 1);
					} else {
						player.storage.seh_hundun_clear = 0;
						player.syncStorage('seh_hundun_clear');
						player.updateMarks('seh_hundun_clear');
						player.addSkill('seh_hundun_clear');
					}
				},
				parentskill: "seh_hundun",
				"_priority": 0,
				sourceSkill: "seh_hundun",
				sub:true,
			},
			clear: {
				mark:true,
				intro: {
					name: "混沌",
					content(err, player) {
						return `你本回合还有【${Math.min(player.getHandcardLimit(), 3) - player.countMark('seh_hundun_clear')}】次使用黑色牌不限次数和距离的机会`
					},
					markcount(storage, player) {
						return `${Math.min(player.getHandcardLimit(), 3) - player.countMark('seh_hundun_clear')}`
					},
				},
				sub: true,
			},
		},
	},
	"gzhlb_chuanshu": {
		trigger: {
			global: "damageAfter",
		},
		init: function (player) {
			player.storage.gzhlb_sazi = player;
		},
		forced: true,
		filter: function (event, player) {
			return event.player.countCards("he") && !event.player.hasSkill("gzhlb_chuanshu_b");
		},
		content: function () {
			"step 0"
			trigger.player.chooseCardTarget({
				filterTarget(card, player, target) {
					return _status.event.player != target;
				},
				ai1(card) {
					if (get.tag(card, "damage")) {
						return 20;
					}
					return 9 - get.value(card);
				},
				ai2(target) {
					var att = get.attitude(_status.event.player, target);
					if (att > 0) {
						if (target.isTurnedOver()) {
							att += 3;
						}
						if (target.hp == 1) {
							att += 3;
						}
					}
					return att;
				},
				position: "he",
				selectCard: [1, 4],
				prompt: "你可将至多4张牌交给一名其他角色，然后【" + get.translation(player) + "】可令你根据交出牌包含的花色选择执行其中一项：<br><li>♥、你恢复一点体力；<br><li>♦、你摸两张牌；<br><li>♠、你选择的目标恢复一点体力；<br><li>♣、你选择的目标摸两张牌。",
			});
			"step 1";
			if (result.bool) {
				var target = result.targets[0], cards = result.cards;
				event.count1 = 0; event.count2 = 0; event.count3 = 0; event.count4 = 0;
				event.target = target;
				for (var j = 0; j < cards.length; j++) {
					if (get.suit(cards[j]) == "heart") event.count1++;
					if (get.suit(cards[j]) == "diamond") event.count2++;
					if (get.suit(cards[j]) == "spade") event.count3++;
					if (get.suit(cards[j]) == "club") event.count4++;
				}
				trigger.player.line(target);
				trigger.player.give(result.cards, target, "give");
				trigger.player.addTempSkill("gzhlb_chuanshu_b");
				player.chooseBool(get.prompt2('gzhlb_chuanshu'), "是否令【" + get.translation(trigger.player) + "】执行交出牌后的选项？").ai = function () {
								var att = get.attitude(player, trigger.player);
								if (att > 0 ) return 1;
							}
			} else {
				event.finish();
			}
			"step 2"
			if (result.bool) {
				var controls = [];
				if (event.count1 > 0) {
					controls.push("♥你恢复体力");
				}
				if (event.count2 > 0) {
					controls.push("♦你摸两张牌");
				}
				if (event.count3 > 0) {
					controls.push("♠【" + get.translation(event.target) + "】恢复体力");
				}
				if (event.count4 > 0) {
					controls.push("♣【" + get.translation(event.target) + "】摸两张牌");
				}
				trigger.player.chooseControl(controls).ai = function () {
					if (event.count1 > 0 && trigger.player < 3) {
						return "♥你恢复体力";
					} else if (event.count3 > 0 && target.hp < 3) {
						return "♠【" + get.translation(event.target) + "】恢复体力";
					} else if (event.count2 > 0 && trigger.player.countCards("h") < 6) {
						return "♦你摸两张牌";
					} else if (event.count4 > 0) {
						return "♣【" + get.translation(event.target) + "】摸两张牌";
					}
				};
			} else {
				event.finish();
			}
			"step 3"
			event.control = result.control;
			switch (event.control) {
				case "♥你恢复体力":
					trigger.player.recover();
					event.finish();
					break;
				case "♦你摸两张牌":
					trigger.player.draw(2);
					event.finish();
					break;
				case "♠【" + get.translation(event.target) +"】恢复体力":
					event.target.recover();
					event.finish();
					break;
				case "♣【" + get.translation(event.target) +"】摸两张牌":
					event.target.draw(2);
					break;
			}
		},
		global: "gzhlb_chuanshu_a",
		subSkill: {
			a: {
				enable: "phaseUse",
				forced: true,
				usable: 1,
				prompt: function (event, player, name) {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].hasSkill("gzhlb_chuanshu")) {
							return '你是否将至多4张牌交给一名其他角色，然后【' + get.translation(list[i]) + '】可令你根据交出牌包含的花色选择执行其中一项：<br><li>♥、你恢复一点体力；<br><li>♦、你摸两张牌；<br><li>♠、你选择的目标恢复一点体力；<br><li>♣、你选择的目标摸两张牌？';
						}
					}
				},
				check: function (card) {
					return 6 - get.value(card)
				},
				position: "he",
				selectCard: [1, 4],
				selectTarget: 1,
				discard: false,
				lose: false,
				delay: 0,
				filter: function (event, player) {
					return player.countCards("he") > 0;
				},
				filterCard: true,
				filterTarget: function (card, player, target) {
					return target != player;
				},
				content: function () {
					"step 0"
					player.line(target);
					event.count1 = 0; event.count2 = 0; event.count3 = 0; event.count4 = 0;
					for (var j = 0; j < cards.length; j++) {
						if (get.suit(cards[j]) == "heart") event.count1++;
						if (get.suit(cards[j]) == "diamond") event.count2++;
						if (get.suit(cards[j]) == "spade") event.count3++;
						if (get.suit(cards[j]) == "club") event.count4++;
					}
					player.give(cards, target, "give");
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].hasSkill("gzhlb_chuanshu")){
							list[i].chooseBool(get.prompt2('gzhlb_chuanshu'), "是否令【" + get.translation(player) + "】执行交出牌后的选项？").ai = function () {
							var listb = game.filterPlayer();
					for (var l = 0; l < listb.length; l++) {
						if (listb[l].hasSkill("gzhlb_chuanshu")) {
								var att = get.attitude(listb[l],player);
								if (att > 0 ) return 1;
								}
							}
			            };
					}
					}
					"step 1"
					if (result.bool) {
						var controls = [];
						if (event.count1 > 0) {
							controls.push("♥你恢复体力");
						}
						if (event.count2 > 0) {
							controls.push("♦你摸两张牌");
						}
						if (event.count3 > 0) {
							controls.push("♠【" + get.translation(target) + "】恢复体力");
						}
						if (event.count4 > 0) {
							controls.push("♣【" + get.translation(target) + "】摸两张牌");
						}
						player.chooseControl(controls).ai = function () {
							if (event.count1 > 0 && player < 3) {
								return "♥你恢复体力";
							} else if (event.count3 > 0 && target.hp < 3) {
								return "♠【" + get.translation(target) + "】恢复体力";
							} else if (event.count2 > 0 && player.countCards("h") < 6) {
								return "♦你摸两张牌";
							} else if (event.count4 > 0){
								return "♣【" + get.translation(target) + "】摸两张牌";
							}
						};
					} else {
						event.finish();
					}
					"step 2"
					event.control = result.control;
					switch (event.control) {
						case "♥你恢复体力":
							player.recover();
							event.finish();
							break;
						case "♦你摸两张牌":
							player.draw(2);
							event.finish();
							break;
						case "♠【" + get.translation(target) + "】恢复体力":
							event.target.recover();
							event.finish();
							break;
						case "♣【" + get.translation(target) + "】摸两张牌":
							event.target.draw(2);
							break;
					}
				},
				ai: {
					order: 4,
					result: {
						player: function (player, target) {
							if (player.hasFriend()) {
								return 2;
							}
						},
						target: 1,
					},
					expose: 0.4,
					threaten: 1,
				},
				sub: true,
			},
			b: { sub: true, },
		},
	},
	"gzhlb_zheyi": {
		trigger: {
			player: ["dying", "dyingAfter"],
		},
		"prompt2": function (event, player, name) {
			if (name == 'dying') {
				return '你是否废除一个装备栏并将体力调整为体力上限？';
			} else {
				return '你是否受到一点无来源伤害并增加一点体力上限？';
			}
		},
		content: function () {
			"step 0"
			if (event.triggername == 'dyingAfter') {
				player.gainMaxHp();
				player.damage("nosource");
				event.finish();
			}
			"step 1"
			var list = [];
			if (!player.hasDisabledSlot(1)) list.push("武器");
			if (!player.hasDisabledSlot(2)) list.push("防具");
			if (!player.hasDisabledSlot(3)) list.push("防御马");
			if (!player.hasDisabledSlot(4)) list.push("进攻马");
			if (!player.hasDisabledSlot(5)) list.push("宝物");
			if (list) {
				player.chooseControl(list).set('prompt', "请选择你要废除的装备栏").ai = function () {
					var list = [2, 5, 1, 3, 4];
					return list.randomGet();
				};
			} else event.finish();
			"step 2"
			if (result.control) {
				switch (result.control) {
					case "武器":
						player.disableEquip('equip1');
						break;
					case "防具":
						player.disableEquip('equip2');
						break;
					case "防御马":
						player.disableEquip('equip3');
						break;
					case "进攻马":
						player.disableEquip('equip4');
						break;
					case "宝物":
						player.disableEquip('equip5');
						break;
				}
				if (player.hp < player.maxHp) {
					player.changeHp(player.maxHp - player.hp);
				}
			}
		},
		group: "gzhlb_zheyi_a",
		subSkill: {
			a: {
				trigger: {
					global: "gameStart",
				},
				frequent: true,
				content: function () {
					var suit = ["heart", "diamond"];
					var min = 1, max = 13;
					var cards = [];
					var cardCount = Math.ceil(ui.cardPile.childElementCount / 30);
					if (cardCount > 0) {
						for (var i = 0; i < cardCount; i++) {
							var randomSuit = suit[Math.floor(Math.random() * suit.length)];
							var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
							cards.push(game.createCard2("gzhlb_yy", randomSuit, randomNum));
						}
					}
					game.broadcastAll(function () {
						lib.inpile.add("gzhlb_yy");
					});
					game.cardsGotoPile(cards, () => {
						return ui.cardPile.childNodes[get.rand(0, ui.cardPile.childNodes.length - 1)];
					});
				},
				sub: true,
			},
		},
	},
	"gzhlb_wangxiang": {
		trigger: {
			player: ["loseEnd", "useCardToPlayered"],
			source: "damageBegin1",
		},
		forced: true,
		filter(event, player, name) {
			if (name == 'useCardToPlayered') {
				if (event.getParent().triggeredTargets3.length < 2) return get.tag(event.card, "damage");
			} else {
				if (name == 'loseEnd') {
					return (event.type == 'discard');
				} else {
					return event.num >= player.hp;
				}
			}
		},
		content: function () {
			'step 0'
			if (event.triggername == 'useCardToPlayered') {
				var probability = Math.max(0, Math.min(1, player.getDamagedHp() / player.maxHp));
				var isTrigger = Math.random() < probability;
				if (isTrigger && player.getDamagedHp() > 0) {
					if (trigger.targets.length > 1) {
						const targets = trigger.targets;
						let target = targets[0];
						let card = target.countCards("h");
						for (let i = 1; i < targets.length; i++) {
							const currentTarget = targets[i];
							const currentHandNum = currentTarget.countCards("h");
							if (currentHandNum > card) {
								card = currentHandNum;
								target = currentTarget;
							}
						}
						player.drawTo(target.countCards("h"));
					} else {
						player.drawTo(trigger.target.countCards("h"));
					}
					game.log(player, get.translation(player) + '〖妄想〗以【' + player.getDamagedHp() + '/' + player.maxHp + '】的概率发动成功了');
				} else {
					game.log(player, get.translation(player) + '〖妄想〗以【' + (player.maxHp - player.getDamagedHp()) + '/' + player.maxHp + '】的概率发动失败了');
				}
				event.finish();
			}
			if (event.triggername == 'loseEnd') {
				var probability = Math.max(0, Math.min(1, player.getDamagedHp() / player.maxHp));
				var isTrigger = Math.random() < probability;
				if (isTrigger && player.getDamagedHp() > 0) {
					player.draw(trigger.cards.length);
					game.log(player, get.translation(player) + '〖妄想〗以【' + player.getDamagedHp() + '/' + player.maxHp + '】的概率发动成功了');
				} else {
					game.log(player, get.translation(player) + '〖妄想〗以【' + (player.maxHp - player.getDamagedHp()) + '/' + player.maxHp + '】的概率发动失败了');
				}
				event.finish();
			}
			'step 1'
			event.list = [];
			if (player.hasDisabledSlot(1)) event.list.push("武器");
			if (player.hasDisabledSlot(2)) event.list.push("防具");
			if (player.hasDisabledSlot(3)) event.list.push("防御马");
			if (player.hasDisabledSlot(4)) event.list.push("进攻马");
			if (player.hasDisabledSlot(5)) event.list.push("宝物");
			'step 2'
			if (player.countDisabled() > 0) {
				player.chooseControl(event.list).set('prompt', "恢复一个装备栏并使用一张对应装备牌").ai = function () {
					var player = _status.event.player;
					var list = [2, 5, 1, 3, 4];
					for (var i of list) {
						if (player.isDisabled(i)) return 'equip' + i;
					}
					return list.randomGet();
				};
			} else event.finish();
			'step 3'
			if (result.control) {
				event.list.remove(result.control);
				switch (result.control) {
					case "武器":
						player.enableEquip('equip1');
						var card1 = get.cardPile2(function (card1) {
							return get.subtype(card1) == 'equip1';
						});
						var card2 = get.discardPile(function (card2) {
							return get.subtype(card2) == 'equip1';
						});
						var num = [1, 2].randomGet();
						if (num == 1) {
							if (card1) {
								player.chooseUseTarget(card1, true, 'nopopup');
							} else {
								if (card2) { player.chooseUseTarget(card2, true, 'nopopup'); }
							}
						}
						if (num == 2) {
							if (card2) {
								player.chooseUseTarget(card2, true, 'nopopup');
							} else {
								if (card1) { player.chooseUseTarget(card1, true, 'nopopup'); }
							}
						}
						break;
					case "防具":
						player.enableEquip('equip2');
						var card1 = get.cardPile2(function (card1) {
							return get.subtype(card1) == 'equip2';
						});
						var card2 = get.discardPile(function (card2) {
							return get.subtype(card2) == 'equip2';
						});
						var num = [1, 2].randomGet();
						if (num == 1) {
							if (card1) {
								player.chooseUseTarget(card1, true, 'nopopup');
							} else {
								if (card2) { player.chooseUseTarget(card2, true, 'nopopup'); }
							}
						}
						if (num == 2) {
							if (card2) {
								player.chooseUseTarget(card2, true, 'nopopup');
							} else {
								if (card1) { player.chooseUseTarget(card1, true, 'nopopup'); }
							}
						}
						break;
					case "防御马":
						player.enableEquip('equip3');
						var card1 = get.cardPile2(function (card1) {
							return get.subtype(card1) == 'equip3';
						});
						var card2 = get.discardPile(function (card2) {
							return get.subtype(card2) == 'equip3';
						});
						var num = [1, 2].randomGet();
						if (num == 1) {
							if (card1) {
								player.chooseUseTarget(card1, true, 'nopopup');
							} else {
								if (card2) { player.chooseUseTarget(card2, true, 'nopopup'); }
							}
						}
						if (num == 2) {
							if (card2) {
								player.chooseUseTarget(card2, true, 'nopopup');
							} else {
								if (card1) { player.chooseUseTarget(card1, true, 'nopopup'); }
							}
						}
						break;
					case "进攻马":
						player.enableEquip('equip4');
						var card1 = get.cardPile2(function (card1) {
							return get.subtype(card1) == 'equip4';
						});
						var card2 = get.discardPile(function (card2) {
							return get.subtype(card2) == 'equip4';
						});
						var num = [1, 2].randomGet();
						if (num == 1) {
							if (card1) {
								player.chooseUseTarget(card1, true, 'nopopup');
							} else {
								if (card2) { player.chooseUseTarget(card2, true, 'nopopup'); }
							}
						}
						if (num == 2) {
							if (card2) {
								player.chooseUseTarget(card2, true, 'nopopup');
							} else {
								if (card1) { player.chooseUseTarget(card1, true, 'nopopup'); }
							}
						}
						break;
					case "宝物":
						player.enableEquip('equip5');
						var card1 = get.cardPile2(function (card1) {
							return get.subtype(card1) == 'equip5';
						});
						var card2 = get.discardPile(function (card2) {
							return get.subtype(card2) == 'equip5';
						});
						var num = [1, 2].randomGet();
						if (num == 1) {
							if (card1) {
								player.chooseUseTarget(card1, true, 'nopopup');
							} else {
								if (card2) { player.chooseUseTarget(card2, true, 'nopopup'); }
							}
						}
						if (num == 2) {
							if (card2) {
								player.chooseUseTarget(card2, true, 'nopopup');
							} else {
								if (card1) { player.chooseUseTarget(card1, true, 'nopopup'); }
							}
						}
						break;
				}
			}
		},
	},
	"wzzs_longmen": {
		trigger: {
			global: "gameStart",
		},
		firstDo: true,
		frequent: true,
		content: function () {
			"step 0"
			if (!lib.inpile.includes("wzzs_qlm")) {
				lib.inpile.push("wzzs_qlm");
			}
			event.card = game.createCard2("wzzs_qlm", "spade", 1);
			"step 1"
			if (card) {
				player.equip(card);
			}
			if (!lib.inpile.includes("wzzs_hlm")) {
				lib.inpile.push("wzzs_hlm");
			}
			event.card = game.createCard2("wzzs_hlm", "heart", 13);
			'step 2'
			if (card) {
				player.equip(card);
			}
		},
	},
	"wzzs_jianzhen": {
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		frequent: true,
		filter(event, player, name) {
			if (name == 'useCardToPlayered') {
				if (event.getParent().triggeredTargets3.length > 1) return false;
			}
			return get.tag(event.card, "damage");
		},
		content: function () {
			if (event.triggername == 'useCardToPlayered') {
				if (trigger.targets.length > 1) {
					const targets = trigger.targets;
					let target = targets[0]; 
					let card = target.countCards("h");
					for (let i = 1; i < targets.length; i++) {
						const currentTarget = targets[i];
						const currentHandNum = currentTarget.countCards("h");
						if (currentHandNum > card) {
							card = currentHandNum;
							target = currentTarget;
						}
					}
					player.drawTo(target.countCards("h"));
				} else {
					player.drawTo(trigger.target.countCards("h"));
				}
			} else {
				player.drawTo(trigger.player.countCards("h"));
			}
		},
		group: ["wzzs_jianzhen_a", "wzzs_jianzhen_b"],
		subSkill: {
			a: {
				trigger: {
					player: ["damageBegin3", "damageAfter"],
				},
				popup: false,
				silent: true,
				firstDo: true,
				forced: true,
				persevereSkill: true,
				charlotte: true,
				content: function () {
					if (event.triggername == 'damageAfter') {
						player.storage.wzzs_jianzhen_a = 0;
					}else{
						if (trigger.num > 1 || !trigger.card) {
							player.storage.wzzs_jianzhen_a = 1;
						} else {
							player.storage.wzzs_jianzhen_a = 0;
						}
					}
				},
				sub:true,
			},
			b: {
				trigger: {
					player: "dying",
				},
				"prompt2": "你是否执行一次〖读档〗？",
				filter(event, player, name) {
					return player.countMark("wzzs_jianzhen_a");
				},
				content: function () {
					const next = game.createEvent('wzzs_dudang_a');
					next.player = player;
					next.setContent(lib.skill.wzzs_dudang_a.content);
				},
			},
		},
	},
	"wzzs_douqi": {
		trigger: {
			player: 'changeHp',
		},
		derivation: ['gf_hp', 'gf_phase', 'gf_damage'],
		forced: true,
		async content(event, trigger, player) {
			const shaNatures = ['none', 'fire', 'thunder', 'ice'];
			const randomNature = shaNatures[Math.floor(Math.random() * shaNatures.length)];
			var list = game.filterPlayer(function (current) {
				if (player.identity == 'zhu') {
					return current != player && current.identity != 'zhong' && current.isAlive();
				}
				if (player.identity == 'zhong') {
					return current != player && current.identity != 'zhu' && current.identity != 'zhong' && current.isAlive();
				}
				return current != player && current.identity != player.identity && current.isAlive();
			});
			if (list.length) {
				var target = list.randomGet(), randomNum = Math.floor(Math.random() * 13) + 1;
				player.line(target);
				var card = game.createCard('sha', 'none', randomNum, randomNature);
				player.useCard(card, target);
			}
		},
		group: ['gf_hp', 'gf_phase', 'gf_damage', 'gf_damage_a', 'wzzs_douqi_a', 'wzzs_douqi_b'],
		subSkill: {
			a: {
				trigger: {
					player: ['useCardToBefore','useCardBefore', 'useCard'],
				},
				popup: false,
				silent: true,
				firstDo: true,
				forced: true,
				persevereSkill: true,
				charlotte: true,
				async content(event, trigger, player) {
					if (event.triggername == 'useCardToBefore') {
						trigger.cancel = () => { };
					}
					if (event.triggername == 'useCardBefore') {
						const originalTargets = [...trigger.targets];
						player.storage.gf_card = [];//xxx
						player.storage.gf_card.add(originalTargets);//xxx
						if (originalTargets.length === 0) return;
						const originalTargetRemove = trigger.targets.remove;
						trigger.targets.remove = function (target) {
							if (originalTargets.includes(target)) {
								return;
							}
							return originalTargetRemove.call(this, target);
						};
						const parentTrigger = trigger.getParent();
						if (parentTrigger && parentTrigger.triggeredTargets2) {
							const originalParentRemove = parentTrigger.triggeredTargets2.remove;
							parentTrigger.triggeredTargets2.remove = function (target) {
								if (originalTargets.includes(target)) {
									return;
								}
								return originalParentRemove.call(this, target);
							};
						}
						const originalUntrigger = trigger.untrigger;
					}
				},
				sub:true,
			},
			b: {
				trigger: {
					player: ['useCardToTargeted'],
				},
				popup: false,
				silent: true,
				lastDo: true,
				forced: true,
				persevereSkill: true,
				charlotte: true,
				async content(event, trigger, player) {
					if (event.triggername == 'useCardToTargeted') {
						const originalTargets = [...trigger.targets];
						const parentExcluded = trigger.getParent().excluded;
						originalTargets.forEach(target => {
							if (parentExcluded.remove) {
								parentExcluded.remove(target);
							} else if (parentExcluded.delete) {
								parentExcluded.delete(target);
							}
						});
					}
				},
				sub: true,
			},
		},
	},
	"wzzs_dudang": {
		trigger: {
			global: "gameStart",
		},
		frequent: true,
		content() {
			var list = game.filterPlayer(function (current) {
				if (player.identity == 'zhu') {
					return current != player && current.identity != 'zhong' && current.isAlive();
				}
				if (player.identity == 'zhong') {
					return current != player && current.identity != 'zhu' && current.identity != 'zhong' && current.isAlive();
				}
				return current != player && current.identity != player.identity && current.isAlive();
			});
			if (list.length) {
				var target = list.randomGet();
				target.addMark("wzzs_dudang_mark", 1);
			}
		},
		group: "wzzs_dudang_a",
		subSkill: {
			mark: {
				mark: true,
				intro: {
					name: "读档",
					markcount(storage, player) {
						return `人神`;
					},
					content: "你死后〖读档〗失去触发条件",
				},
				sub: true,
			},
			a: {
				trigger: {
					global: "roundStart",
					player: "dieBegin",
				},
				persevereSkill: true,
				forced: true,
				filter(event, player, name) {
					var num = game.countPlayer(function (current) {
						return current.hasMark("wzzs_dudang_mark");
					});
					var nei = game.countPlayer(function (current) {
						return current.identity == 'nei';
					});
					if (name == 'roundStart') {
						return game.roundNumber % 2 == 0 && num > 0;
					} else {
						if (nei > 0) {
							return num > 0 && game.countPlayer() > 3;
						} else {
							return num > 0 && game.countPlayer() > 2;
						}
					}
				},
				content: function () {
					'step 0'
					if (event.triggername == 'roundStart') {
						player.gainMaxHp();
					}
					if (event.triggername == 'dieBegin') {
						trigger.cancel();
					}
					player.discard(player.getCards("hej"));
					player.link(false);
					player.turnOver(false);
					'step 1'
					player.drawTo(player.maxHp);
					if (player.hp < player.maxHp) {
						player.changeHp(player.maxHp - player.hp);
					}
					'step 2'
					var card = get.cardPile("wzzs_qlm", "field");
					if (card) {
						player.equip(card, "gain2", "log");
					}
					'step 3'
					var card = get.cardPile("wzzs_hlm", "field");
					if (card) {
						player.equip(card, "gain2", "log");
					}
				},
				sub: true,
			},
		},
	},
	"wzzs_shendao": {
		limited: true,
		skillAnimation: false,
		enable: "phaseUse",
		filter: function (event, player) {
			return player.gflib_getMp('wzzs_MoLi') >= 30;
		},
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		content: function () {
			'step 0'
			player.awakenSkill('wzzs_shendao');
			player.gflib_changeMp(-30, 'wzzs_MoLi');
			if (!lib.inpile.includes("wzzs_sdkas")) {
				lib.inpile.push("wzzs_sdkas");
			}
			event.card = game.createCard2("wzzs_sdkas", "diamond", 13);
			'step 1'
			if (card) {
				player.equip(card);
			}
			player.addSkill('wzzs_shendao_gain');
			player.addSkill('wzzs_shendao_b');
			game.broadcastAll(function (player) {
				gfDouDong(30, 2600);
			}, player);
		},
		ai: {
			order: 11,
			result: {
				player: 0.5,
				target: -1,
			},
			expose: 0.4,
			threaten: 3,
		},
		group: "wzzs_shendao_a",
		subSkill: {
			a: {
				trigger: {
					global: "gameStart",
				},
				popup: false,
				silent: true,
				lastDo: true,
				forced: true,
				persevereSkill: true,
				charlotte: true,
				content: function () {
					player.drawCardTimer = setInterval(() => {
						if (player != _status.currentPhase && player.gflib_getMp('wzzs_MoLi') < 100) {
							player.gflib_changeMp(1, 'wzzs_MoLi');
						}
					}, 10000);
				},
				sub: true,
			},
			b: {
				trigger: {
					player: "wzzs_shendaoEnd",
				},
				forced:true,
				skillAnimation: true,
				animationColor: "wood",
				content: function () {},
				sub: true,
			},
			gain: {
				trigger: {
					global: ["loseEnd", "equipEnd", "addJudgeEnd", "gainEnd", "loseAsyncEnd", "addToExpansionEnd"],
				},
				filter(event, player) {
					return event.getd()?.some(i => i.name == "wzzs_sdkas") && player.countCards("he") > 0;
				},
				async cost(event, trigger, player) {
					const gains = trigger.getd().filter(i => i.name == "wzzs_sdkas");
					event.result = await player
						.chooseCard("he", [1, player.countCards("he")])
						.set("prompt", get.prompt(event.name.slice(0, -5)))
						.set("prompt2", get.prompt("wzzs_shendao") + '<div class="text center">重铸至少1张牌并受到1点无来源伤害，然后获得' + get.translation(gains) + "</div >")
						.set("ai", card => {
							return 8 - get.value(card);
						})
						.forResult();
				},
				async content(event, trigger, player) {
					await player.recast(event.cards);
					await player.damage("nosource");
					await player.gain(
						trigger.getd().filter(i => i.name == "wzzs_sdkas"),
						"gain2"
					);
				},
				sub: true,
			},
		},
	},
	"wzzs_guaili": {
		trigger: {
			player: "damageBegin3",
			source: "damageBegin1",
			global: "phaseBefore",
		},
		forced: true,
		content() {
			if (event.triggername == 'phaseBefore') {
				player.storage.wzzs_guaili = 1;
			} else {
				var num = Math.floor(Math.random() * player.countMark("wzzs_guaili")) + 1;
				if (num == 1) {
					game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/wzzs_guaili${[1, 2].randomGet()}.mp3`);
					}, player);
					if (trigger.source == player) {
						trigger.num++;
					}
					if (trigger.player == player) {
						trigger.num--;
					}
					game.log(player, get.translation(player) + '〖怪力〗以【1/' + player.countMark("wzzs_guaili") + '】的概率发动成功了');
					player.addMark('wzzs_guaili', 1);
				} else {
					game.log(player, get.translation(player) + '〖怪力〗以【' + (player.countMark("wzzs_guaili") - 1) + '/' + player.countMark("wzzs_guaili") + '】的概率发动失败了');
				}
			}
		},
	},
	"wzzs_jiangxin": {
		enable: "phaseUse",
		usable: 1,
		filterTarget: function (card, player, target) {
			return target.countCards("he") > 0;
		},
		prompt: "请选择一名角色并令其重铸一张牌，然后其从牌堆或弃牌堆中随机获得并使用一张防具或武器，若该角色为你，则有概率获得失败并摸4减x张牌；不为，其摸x张牌（x为目标装备区装备数）。",
		content: function () {
			"step 0"
			target.chooseCard("请重铸【1】张牌。", "操作提示：选择要重铸的牌并点击“确定”", 1, "he", lib.filter.cardRecastable).set("ai", function (card) {
				return 7.5 - get.value(card);
			});
			"step 1";
			if (result.bool) {
				game.broadcastAll(function (player) {
					game.playAudio(`../extension/鸽府包/audio/skill/wzzs_jiangxin${[1, 2].randomGet()}.mp3`);
				}, player);
				target.recast(result.cards);
				var num = [1, 2].randomGet();
				if (num == 1) {
					var card = get.cardPile(card => get.subtype(card) == "equip1" && target.hasUseTarget(card));
					if (!card) {
						var card = get.discardPile(card => get.subtype(card) == "equip1" && target.hasUseTarget(card));
					}
				}
				if (num == 2) {
					var card = get.cardPile(card => get.subtype(card) == "equip2" && target.hasUseTarget(card));
					if (!card) {
						var card = get.discardPile(card => get.subtype(card) == "equip2" && target.hasUseTarget(card));
					}
				}
				if (card) {
					if (target != player) {
						target.equip(card, true);
					} else {
						var num = [3, 4, 5].randomGet();
						if (num != 3) {
							target.equip(card, true);
						}
					}
				}
			}
			"step 2"
			if (target == player) {
				if (4 - target.countCards("e") > 0) {
					target.draw(4 - target.countCards("e"));
				}
			} else {
				if (target.countCards("e")) target.draw(target.countCards("e"));
			}
		},
		ai: {
			order: 11,
			result: {
				player: 3,
				target: 3,
			},
			threaten: 2,
		},
	},
	"wzzs_jianliu": {
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		frequent: true,
		filter(event, player, name) {
			if (name == 'useCardToPlayered') {
				if (event.getParent().triggeredTargets3.length > 1) return false;
			}
			if (player.hasSkill("wzzs_jianliu_d") || !get.tag(event.card, "damage")) return false;
			return player.storage.wzzs_jianliu.contains("wzzs_jianliu1") || player.storage.wzzs_jianliu.contains("wzzs_jianliu2") || player.storage.wzzs_jianliu.contains("wzzs_jianliu3");
		},
		init: function (player) {
			player.storage.wzzs_jianliu = ["wzzs_jianliu1", "wzzs_jianliu2", "wzzs_jianliu3"];
		},
		async content(event, trigger, player) {
			delete player.storage.wzzs_jianliu_b;
			if (trigger.player == player) {
				var target = trigger.target;
			} else {
				var target = trigger.player;
			}
			const choices = [];
			const choiceList = [
				"剑神流：若此牌被响应，你视为对对方使用一张【杀】",
				"水神流：若此牌未被响应，你摸两张牌对方需重铸一张牌",
				"北神流：令本次伤害±1且对方不可响应此牌，然后此技能本回合不可再使用"
			];
			if (player.storage.wzzs_jianliu.contains("wzzs_jianliu1")) {
				choices.push("剑神流");
			} else {
				choiceList[0] = `<span style="opacity:0.5">${choiceList[0]}（已被选择过）</span>`;
			}
			if (player.storage.wzzs_jianliu.contains("wzzs_jianliu2")) {
				choices.push("水神流");
			} else {
				choiceList[1] = `<span style="opacity:0.5">${choiceList[1]}（已被选择过）</span>`;
			}
			if (player.storage.wzzs_jianliu.contains("wzzs_jianliu3")) {
				choices.push("北神流");
			} else {
				choiceList[2] = `<span style="opacity:0.5">${choiceList[2]}（已被选择过）</span>`;
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
					.set("prompt", get.prompt("wzzs_jianliu"))
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
			const choice = result.control;
			player.addTempSkills("wzzs_jianliu_b", { global: "useCardAfter" });
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/wzzs_jianliu${[1, 2].randomGet()}.mp3`);
			}, player);
			if (choice == "剑神流") {
				player.storage.wzzs_jianliu.remove('wzzs_jianliu1');
				player.storage.wzzs_jianliu_b = target;
			}
			if (choice == "水神流") {
				player.addTempSkills("wzzs_jianliu_c", { global: "useCardAfter" });
				player.addTempSkills("wzzs_jianliu_g", { global: "useCardAfter" });
				player.storage.wzzs_jianliu_c = target;
				player.storage.wzzs_jianliu.remove('wzzs_jianliu2');
			}
			if (choice == "北神流") {
				player.storage.wzzs_jianliu.remove('wzzs_jianliu3');
				player.storage.wzzs_jianliu_e = target;
				player.addTempSkill("wzzs_jianliu_d");
				const next = game.createEvent('wzzs_jianliu_d');
				next.player = player;
				next.setContent(lib.skill.wzzs_jianliu_d.content);
			}
		},
		group: ["wzzs_jianliu_a"],
		subSkill: {
			a: {
				trigger: {
					global: "phaseAfter",
					source: "damageEnd",
				},
				silentForce: true,
				firstDo: true,
				async content(event, trigger, player) {
					player.storage.wzzs_jianliu.add('wzzs_jianliu1');
					player.storage.wzzs_jianliu.add('wzzs_jianliu2');
					player.storage.wzzs_jianliu.add('wzzs_jianliu3');
				},
				sub: true,
				sourceSkill: "wzzs_jianliu",
			},
			b: {
				trigger: {
					global: ["respond", "useCard"],
				},
				silentForce: true,
				firstDo: true,
				filter(event, player) {
					if (!event.respondTo || event.card.name == "tao") {
						return false;
					}
					return event.cards.filterInD("od").length > 0;
				},
				content() {
					if (player.storage.wzzs_jianliu_c) {
						player.removeSkill("wzzs_jianliu_c");
						delete player.storage.wzzs_jianliu_c;
					}
					if (player.storage.wzzs_jianliu_b) {
						if (trigger.player == player) {
							if (player.canUse(get.autoViewAs({ name: 'sha' }), player.storage.wzzs_jianliu_b, false)) {
								player.useCard({ name: 'sha' }, player.storage.wzzs_jianliu_b);
							}
						} else {
							if (player.canUse(get.autoViewAs({ name: 'sha' }), trigger.player, false)) {
								player.useCard({ name: 'sha' }, trigger.player);
							}
						}
						player.popup("剑神流");
						game.log(player, "发动了【剑神流】");
					}
					player.removeSkill("wzzs_jianliu_b");
				},
				sub: true,
			},
			c: {
				trigger: {
					global: "useCardEnd",
				},
				silentForce: true,
				firstDo: true,
				content: function () {
					'step 0'
					player.draw(2);
					player.popup("水神流");
					game.log(player, "发动了【水神流】");
					player.removeSkill("wzzs_jianliu_c");
					player.storage.wzzs_jianliu_c.chooseCard(true, "请重铸【1】张牌。", "操作提示：选择要重铸的牌并点击“确定”", 1, "he", lib.filter.cardRecastable).set("ai", function (card) {
						return 7.5 - get.value(card);
					});
					'step 1'
					if (result.bool) {
						player.storage.wzzs_jianliu_c.recast(result.cards);
					}
					delete player.storage.wzzs_jianliu_c;
				},
				sub: true,
				sourceSkill: "wzzs_jianliu",
			},
			d: {
				content: function () {
					"step 0"
					player.chooseControl('伤害+1', '伤害-1',
						ui.create.dialog(get.prompt('wzzs_jianliu'), 'hidden')).ai = function () {
							return 0;
						}
					"step 1"
					if (result.control == '伤害+1') {
						player.storage.wzzs_jianliu_e.addTempSkill("wzzs_jianliu_f", { global: "useCardAfter" });
						player.addTempSkill("wzzs_jianliu_f", { global: "useCardAfter" });
					} else {
						player.storage.wzzs_jianliu_e.addTempSkill("wzzs_jianliu_e", { global: "useCardAfter" });
						player.addTempSkill("wzzs_jianliu_e", { global: "useCardAfter" });
					}
				},
				sub: true,
				sourceSkill: "wzzs_jianliu",
			},
			e: {
				trigger: {
					player: "damageBegin1",
				},
				silentForce: true,
				firstDo: true,
				content() {
					player.popup("北神流");
					game.log(player, "发动了【北神流】");
					trigger.num--;
					player.removeSkill("wzzs_jianliu_e");
				},
				sub: true,
				sourceSkill: "wzzs_jianliu",
			},
			f: {
				trigger: {
					player: "damageBegin1",
				},
				silentForce: true,
				firstDo: true,
				content() {
					player.popup("北神流");
					game.log(player, "发动了【北神流】");
					trigger.num++;
					player.removeSkill("wzzs_jianliu_f");
				},
				sub: true,
				sourceSkill: "wzzs_jianliu",
			},
			g: {
				trigger: {
					global: ["respond", "useCard"],
				},
				silentForce: true,
				firstDo: true,
				filter(event, player) {
					return event.card.name != "tao"
				},
				async content(event, trigger, player) {
					player.removeSkill("wzzs_jianliu_c");
					player.removeSkill("wzzs_jianliu_g");
				},
				sub: true,
				sourceSkill: "wzzs_jianliu",
			},
		},
	},
	"cxm_lingren": {
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		filter(event, player) {
			return get.tag(event.card, "damage");
		},
		usable: 1,
		derivation: ["cxm_jianxiong","cxm_xingshang"],
		async cost(event, trigger, player) {
			delete player.storage.cxm_lingren; 
			if (trigger.player != player) {
				player.markAuto("cxm_lingren", [trigger.player]);
			}
			event.result = await player
				.chooseTarget(get.prompt(event.name.slice(0, -5)), "选择一名目标角色并猜测其手牌构成", (card, player, target) => {
					if (!player.storage.cxm_lingren){
						return _status.event.targets.includes(target);
					} else {
						return player.storage.cxm_lingren.includes(target);
					}
			})
			.set("ai", target => {
				return 2 - get.attitude(get.player(), target);
			})
			.set("targets", trigger.targets)
			.forResult();
		},
		async content(event, trigger, player) {
			if(trigger.player == player){
				var target = event.targets[0]; 
				game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/cxm_lingren${[1, 2].randomGet()}.mp3`);
					}, player);
			}else{
				var target = trigger.player;
				 game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/cxm_lingren${[3, 4].randomGet()}.mp3`);
					}, player);
			}
			const list = ["basic", "trick", "equip"].map(type => ["", "", "caoying_" + type]);
			const { result } = await player
				.chooseButton(["凌人：猜测其有哪些类别的手牌", [list, "vcard"]], [0, 3], true)
				.set("ai", button => {
					return get.event("choice").includes(button.link[2].slice(8));
				})
				.set(
					"choice",
					(() => {
						if (!target.countCards("h")) {
							return [];
						}
						let choice = [],
							known = target.getKnownCards(player),
							unknown = target.getCards("h", i => !known.includes(i));
						for (let i of known) {
							choice.add(get.type2(i, target));
						}
						if (!unknown.length || choice.length > 2) {
							return choice;
						}
						let rand = 0.05;
						if (!choice.includes("basic")) {
							if (unknown.some(i => get.type(i, null, target) === "basic")) {
								rand = 0.95;
							}
							if (Math.random() < rand) {
								choice.push("basic");
							}
						}
						if (!choice.includes("trick")) {
							if (unknown.some(i => get.type(i, "trick", target) === "trick")) {
								rand = 0.9;
							} else {
								rand = 0.1;
							}
							if (Math.random() < rand) {
								choice.push("trick");
							}
						}
						if (!choice.includes("equip")) {
							if (unknown.some(i => get.type(i, null, target) === "equip")) {
								rand = 0.75;
							} else {
								rand = 0.25;
							}
							if (Math.random() < rand) {
								choice.push("equip");
							}
						}
						return choice;
					})()
				);
			if (!result?.bool) {
				return;
			}
			const choices = result.links.map(i => i[2].slice(8));
			if (!event.isMine() && !event.isOnline()) {
				await game.delayx();
			}
			let num = 0;
			["basic", "trick", "equip"].forEach(type => {
				if (choices.includes(type) == target.hasCard(card => get.type2(card, target) === type, "h")) {
					num++;
				}
			});
			player.popup("猜对" + get.cnNumber(num) + "项");
			game.log(player, "猜对了" + get.cnNumber(num) + "项");
			if (num > 0) {
				if(trigger.player == player){
					const map = trigger.customArgs;
					const id = target.playerid;
					map[id] ??= {};
					if (typeof map[id].extraDamage != "number") {
						map[id].extraDamage = 0;
					}
					map[id].extraDamage++;
				}else{
					await player.draw();
				}
			}
			if (num > 1) {
				if(trigger.player == player){
					await player.draw(2);
				}else{
					await player.addTempSkills("cxm_jianxiong");
				}
			}
			if (num > 2) {
				if(trigger.player == player){
					await player.addTempSkills("cxm_xingshang", { player: "phaseBegin" });
				}else{
					await player.addTempSkills("cxm_lingren_a");
				}
			}
		},
		ai: {
			threaten: 2.4,
		},
		subSkill:{
			a:{
				trigger: {
					player: "damageAfter",
				},
				forced: true,
				async content(event, trigger, player) {
					player.recover();
					player.removeSkill("cxm_lingren_a");
				},
				sub:true,
			},
		},
	},
	"cxm_jianxiong":{
		audio: "ext:鸽府包/audio/skill:2",
		trigger: {
			player: "damageEnd",
		},
		forced:true,
		content() {
			"step 0"
			player.chooseControl().set("choiceList", ["摸两张牌", "获得" + get.translation(trigger.card) + "并摸一张牌"]);
			"step 1";
			if (result.index == 0) {
				player.draw(2, "nodelay");
			} else {
				if (get.itemtype(trigger.cards) == "cards" && get.position(trigger.cards[0], true) == "o") {
					player.gain(trigger.cards, "gain2");
				}
				player.draw("nodelay");
			}
		},
		ai: {
			maixie: true,
			"maixie_hp": true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return [1, -1];
					}
					if (get.tag(card, "damage") && player != target) {
						var cards = card.cards,
							evt = _status.event;
						if (evt.player == target && card.name == "damage" && evt.getParent().type == "card") {
							cards = evt.getParent().cards.filterInD();
						}
						if (target.hp <= 1) {
							return;
						}
						if (get.itemtype(cards) != "cards") {
							return;
						}
						for (var i of cards) {
							if (get.name(i, target) == "tao") {
								return [1, 4.5];
							}
						}
						if (get.value(cards, target) >= 7 + target.getDamagedHp()) {
							return [1, 2.5];
						}
						return [1, 0.6];
					}
				},
			},
		},
	},
	"cxm_xingshang":{
		audio: "ext:鸽府包/audio/skill:2",
		trigger: {
			global: "die",
		},
		forced: true,
		filter(event, player) {
			return player.isDamaged() || event.player.countCards("he") > 0;
		},
		direct: true,
		content() {
			"step 0";
			var choice = [];
			if (player.isDamaged()) {
				choice.push("回复体力");
			}
			if (trigger.player.countCards("he")) {
				choice.push("获得牌");
			}
			choice.push("cancel2");
			player
				.chooseControl(choice)
				.set("prompt", get.prompt2("rexingshang"))
				.set("ai", function () {
					if (choice.length == 2) {
						return 0;
					}
					if (get.value(trigger.player.getCards("he")) > 8) {
						return 1;
					}
					return 0;
				});
			"step 1";
			if (result.control != "cancel2") {
				player.logSkill(event.name, trigger.player);
				if (result.control == "获得牌") {
					event.togain = trigger.player.getCards("he");
					player.gain(event.togain, trigger.player, "giveAuto", "bySelf");
				} else {
					player.recover();
				}
			}
		},
	},
	"cxm_fujian": {
		trigger: {
			player: "phaseJieshuBegin",
		},
		audio: "ext:鸽府包/audio/skill:2",
		filter(event, player) {
			return game.hasPlayer(target => target != player && target.countCards("h"));
		},
		forced: true,
		content: function () {
			"step 0"
			player.chooseTarget('请选择一名其他角色并观看其手牌',true,function(card,player,target){
				return target != player && target.countCards("h");
			}).set('ai',function(target){
				var att=get.attitude(_status.event.player,target);
				return att < 0;
			}).animate=false;
			'step 1'
			if(result.bool){
				var target = result.targets[0];
				event.target = target;
				player.choosePlayerCard(target, "h", [1,player.getHistory("sourceDamage").reduce((sum, evt) => sum + evt.num, 0)], true);
				player.addExpose(0.2);
			} else {
				event.finish();
			}
			"step 2";
			if (result.bool) {
				player.chooseButton(["你正在观看【" + get.translation(event.target) +"】手牌中的【" + result.cards.length +"】张牌", result.cards]);
			} else {
				event.finish();
			}
		},
	},
	"gzhlb_huashi": {
		trigger: {
			global: "roundStart",
		},
		frequent: true,
		async content(event, trigger, player) {	
			const a = player.countCards('h', card => !card.hasGaintag('gzhlb_huashi'));
			if (player.countCards('h', card => card.hasGaintag('gzhlb_huashi'))) {
				player.draw().then(() => {
					if (!a) {
						return;
					}
				});
				var { result } = await player.chooseCard("请将一张手牌标记为“花饰”", true, function (card, player) {
					return !card.hasGaintag('gzhlb_huashi');
				}).set('ai', function (card) {
					return 6 - get.value(card);
				});
			} else {
				player.draw(2).then(() => {
					if (!a) {
						return;
					}
				});
				var { result } = await player.chooseCard("请1~2张手牌标记为“花饰”", [1, 2], true, function (card, player) {
					return !card.hasGaintag('gzhlb_huashi');
				}).set('ai', function (card) {
					return 6 - get.value(card);
				});
			}
			if (result?.bool && result?.cards?.length) {
				const next = player.addGaintag(result.cards, 'gzhlb_huashi');
				await next;
			}
		},
		group:"gzhlb_huashi_a",
		subSkill: {
			a: {
				trigger: {
					player: "phaseDrawBegin2",
				},
				frequent: true,
				filter: event => !event.numFixed,
				content() {
					trigger.num += player.countCards('h', card => card.hasGaintag('gzhlb_huashi'));
				},
				sub: true,
			},
		},
	},
	"gzhlb_sazi": {
		mod: {
			maxHandcard: function (player, num) {
				return num + player.countMark('gzhlb_sazi_hand');
			},
		},
		init: function (player) {
			player.storage.gzhlb_sazi = ["gzhlb_sazi1", "gzhlb_sazi2", "gzhlb_sazi3", "gzhlb_sazi4", "gzhlb_sazi5"];
		},
		enable: "phaseUse",
		filter(event, player) {
			return !player.hasSkill("gzhlb_sazi_a") && (!player.isTempBanned("gzhlb_sazi1") || !player.isTempBanned("gzhlb_sazi2") || !player.isTempBanned("gzhlb_sazi3") || !player.isTempBanned("gzhlb_sazi4") || !player.isTempBanned("gzhlb_sazi5"));
		},
		content: function* (event, map) {
			const player = map.player;
			const a = Math.max(1, player.countCards('h', card => card.hasGaintag('gzhlb_huashi')));
			const choices = [];
			const choiceList = [`手牌上限加【${a}】`, `本回合出杀次数加【${a}】`, `重铸所有非“花饰”张牌并获得【${a}】点体力上限`, `将【${a}】张手牌标记为“花饰”`, `重铸至多【${a}】张“花饰”牌并恢复等量点体力`];
			if (!player.isTempBanned("gzhlb_sazi1")) choices.push("选项一");
			else choiceList[0] = '<span style="opacity:0.5">' + choiceList[0] + "（已被选择过）</span>";
			if (!player.isTempBanned("gzhlb_sazi2")) choices.push("选项二");
			else choiceList[1] = '<span style="opacity:0.5">' + choiceList[1] + "（已被选择过）</span>";
			if (!player.isTempBanned("gzhlb_sazi3")) choices.push("选项三");
			else choiceList[2] = '<span style="opacity:0.5">' + choiceList[2] + "（已被选择过）</span>";
			if (!player.isTempBanned("gzhlb_sazi4")) choices.push("选项四");
			else choiceList[3] = '<span style="opacity:0.5">' + choiceList[3] + "（已被选择过）</span>";
			if (!player.isTempBanned("gzhlb_sazi5")) choices.push("选项五");
			else choiceList[4] = '<span style="opacity:0.5">' + choiceList[4] + "（已被选择过）</span>";
			let result;
			if (_status.connectMode)
				game.broadcastAll(() => {
					_status.noclearcountdown = true;
				});
			result = yield player
				.chooseControl(choices, "cancel2")
				.set("choiceList", choiceList)
				.set("prompt", get.prompt("gzhlb_sazi"))
				.set("ai", () => {
					return get.event("choice");
				});
			if (result.control == "cancel2") {
				if (_status.connectMode) {
					game.broadcastAll(() => {
						delete _status.noclearcountdown;
						game.stopCountChoose();
					});
				}
				return event.finish();
			}
			const choice = result.control;
			if (choice == "选项一") {
				player.addMark('gzhlb_sazi_hand', a);
				player.tempBanSkill("gzhlb_sazi1", { player: "die" }, false);
				player.addTempSkill("gzhlb_sazi_a");
			}
			if (choice == "选项二") {
				player.tempBanSkill("gzhlb_sazi2", { player: "die" }, false);
				player.addTempSkill("gzhlb_sazi_sha");
				player.storage.gzhlb_sazi_sha = a;
				player.addTempSkill("gzhlb_sazi_a");
			}
			if (choice == "选项三") {
				const cards = player.getCards('h'),
				card = [];
				for (var i of cards) {
					if (!i.hasGaintag('gzhlb_huashi')) card.push(i);
				}
				player.recast(card);
				player.gainMaxHp(a); 
				player.tempBanSkill("gzhlb_sazi3", { player: "die" }, false);
				player.addTempSkill("gzhlb_sazi_a");
			}
			if (choice == "选项四") {
				player.storage.gzhlb_sazi_a = 4;
				player.tempBanSkill("gzhlb_sazi4", { player: "die" }, false);
				player.addTempSkill("gzhlb_sazi_a");
			}
			if (choice == "选项五") {
				player.storage.gzhlb_sazi_a = 5;
				player.tempBanSkill("gzhlb_sazi5", { player: "die" }, false);
				player.addTempSkill("gzhlb_sazi_a");
			}
			if (choice == "选项四" || choice == "选项五") {
				const next = game.createEvent('gzhlb_sazi_a');
				next.player = player;
				next.setContent(lib.skill.gzhlb_sazi_a.content);
			}
		},
		subSkill: {
			a: {
				content: function () {
					'step 0'
					var a = Math.max(1, player.countCards('h', card => card.hasGaintag('gzhlb_huashi')));
					if (player.countMark('gzhlb_sazi_a') == 4) {
						var b = Math.min(a, player.countCards('h', card => !card.hasGaintag('gzhlb_huashi')));
						player.chooseCard(true, 'h', b, get.prompt('gzhlb_huashi'), '请选择【' + b + '】张牌并标记为“花饰”', function (card, player) {
							return !card.hasGaintag('gzhlb_huashi');
						}).set('ai', function (card) {
							return 6 - get.value(card);
						})
					}
					if (player.countMark('gzhlb_sazi_a') == 5) {
						player.chooseCard('h', [1, a], get.prompt('gzhlb_huashi'), '请重铸至多【' + a + '】张“花饰”牌并恢复等量点体力', function (card, player) {
							return card.hasGaintag('gzhlb_huashi');
						}).set('ai', function (card) {
							return 6 - get.value(card);
						})
					}
					'step 1'
					if (result.bool) {
						if (player.countMark('gzhlb_sazi_a') == 4) {
							player.addGaintag(result.cards, 'gzhlb_huashi');
						}
						if (player.countMark('gzhlb_sazi_a') == 5) {
							player.recast(result.cards);
							player.recover(result.cards.length);
						}
					}
				},
				sub:true,
			},
			sha: {
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == 'sha') return num + player.countMark('gzhlb_sazi_sha');
					},
				},
				sub: true,
			},
		},
	},
	"cxm_zhenbian": {
		enable: "phaseUse",
		usable: 1,
		filterCard: true,
		position: "he",
		selectCard: 2,
		prompt: "出牌阶段限一次，你可弃置两张牌令其他角色依次选择是否弃置一张与本次弃置牌花色不同的牌，否则受到一点由你造成的伤害。",
		async content(event, trigger, player) {
			event.delay = false;
			event.targets = game.filterPlayer();
			event.targets.remove(player);
			if (event.targets.length === 0) {
				return;
			}
			event.targets.sort(lib.sort.seat);
			player.line(event.targets, "green");
			event.targets2 = event.targets.slice(0);
			const list = ['heart', 'diamond', 'spade', 'club'],
				cardst = [];
			for (let i = 0; i < list.length; i++) {
				const targetSuit = list[i];
				let isExisted = false;
				for (let j = 0; j < event.cards.length; j++) {
					const currentSuit = (event.cards[j].suit || '').toLowerCase();
					if (currentSuit === targetSuit) {
						isExisted = true;
						break;
					}
				}
				if (!isExisted) {
					cardst.push(targetSuit);
				}
			}
			while (event.targets.length > 0) {
				event.current = event.targets.shift();
				event.count = event.current.countCards("he");
				const result = await event.current
					.chooseToDiscard(`镇边：是否弃置一张【${cardst.map(s => get.translation(s)).join("、")}】牌，否则受到一点来自【${get.translation(player)}】的伤害？`, { suit: cardst }, "he")
					.set("ai", card => {
						return 6 - get.value(card);
					})
				if (event.count <= event.current.countCards("he")) event.current.damage();
			}
		},
		group: "cxm_zhenbian_a",
		subSkill: {
			a: {
				trigger: {
					global: "phaseUseBegin",
				},
				"prompt2": function (event, player) {
					return '你是否将至少两张手牌交给【' + get.translation(event.player) + '】并令其选择：<br>1、本回合出牌阶段结束时，手牌上限-x(x为你交给其的手牌数)；<br>2、令你使用其手牌中的一张牌？';
				},
				filter(event, player) {
					return event.player != player && event.player.maxHp <= player.maxHp && player.countCards("h") >= 2;
				},
				content: function () {
					'step 0'
					player.chooseCard(true, [2, Infinity], "h", "交给" + get.translation(trigger.player) + "至少两张手牌").set("ai", function (card) {
						if (get.position(card) == "e") {
							return -1;
						}
						if (card.name == "shan") {
							return 1;
						}
						if (get.type(card) == "equip") {
							return 0.5;
						}
						return 0;
					});
					'step 1'
					trigger.player.storage.cxm_zhenbian_b = result.cards.length;
					player.give(result.cards, trigger.player, "give");
					var str = get.translation(player);
					trigger.player.chooseControl().set('choiceList', [
						'本回合手牌上限减【' + result.cards.length + '】',
						'令' + str + '使用你手牌中的一张牌',
					]).set('ai', () => get.attitude(trigger.player, player) < 0 ? 0 : 1);
					'step 2'
					if (result.index == 0) {
						trigger.player.addTempSkill('cxm_zhenbian_b');
						event.finish();
					}
					'step 3'
					var cards = trigger.player.getCards('h');
					player.chooseButton(['镇边：是否使用其中一张牌？', cards]).set('filterButton', button => {
						var player = _status.event.player;
						var card = button.link;
						var cardx = {
							name: get.name(card, get.owner(card)),
							nature: get.nature(card, get.owner(card)),
							cards: [card],
						}
						return player.hasUseTarget(cardx, null, false);
					}).set('ai', button => {
						var len = _status.event.len;
						var card = button.link;
						var fix = 1;
						if (get.cardNameLength(card) == len) fix = 2;
						return fix * _status.event.player.getUseValue(card);
					}).set('len', function () {
						return 0;
						var list = [];
						player.getHistory('useCard', evt => {
							var len = get.cardNameLength(evt.card);
							list.add(len);
						});
						if (!list.contains(count)) return count;
						if (list.length) return list.randomGet();
						return 4;
					}());
					'step 4'
					if (result.bool) {
						var card = result.links[0];
						var cardx = {
							name: get.name(card, get.owner(card)),
							nature: get.nature(card, get.owner(card)),
							cards: [card],
						}
						var next = player.chooseUseTarget(cardx, [card], true, false).set('oncard', (card) => {
							var owner = _status.event.getParent().owner;
							if (owner) owner.$throw(card.cards);
						});
						if (card.name != cardx.name || !get.is.sameNature(card, cardx)) next.viewAs = true;
						var owner = get.owner(card);
						if (owner != player && get.position(card) == 'h') {
							next.throw = false;
							next.set('owner', owner);
						}
					}
				},
				sub: true,
			},
			b: {
				mod: {
					maxHandcard: function (player, num) {
						return num - player.countMark('cxm_zhenbian_b');
					},
				},
				onremove: function (player) {
					player.unmarkSkill("cxm_zhenbian_b");
					delete player.storage.cxm_zhenbian_b;
				},
				sub: true,
			},
		},
	},
	"cxm_hengzheng": {
		trigger: {
			global: ["loseAfter", "cardsDiscardAfter", "loseAsyncAfter", "equipAfter"],
		},
		filter(event, player) {
			if (event.type != "discard" || event.getlx === false) {
				return false;
			}
			if (event.name !== "cardsDiscard") {
				if (event.position !== ui.discardPile) {
					return false;
				}
				if (
					!game.hasPlayer(current => {
						const evt = event.getl(current);
						return evt.cards?.someInD("od");
					})
				) {
					return false;
				}
			} else {
				const evt = event.getParent();
				if (evt.relatedEvent && (evt.relatedEvent.name === "useCard" || evt.relatedEvent.name === "respond")) {
					return false;
				}
			}
			return player.countCards("h") <= player.maxHp;
		},
		direct: true,
		content() {
			"step 0";
			if (trigger.delay == false) {
				game.delay();
			}
			"step 1";
			var cards = [],
				cards2 = trigger.cards.slice(0);
			for (var i = 0; i < cards2.length; i++) {
				if (cards2[i].original != "j" && get.position(cards2[i], true) == "d") {
					cards.push(cards2[i]);
				}
			}
			if (cards.length) {
				player.chooseButton(["镇边：选择要获得的牌", cards]).set("ai", function (button) {
					return get.value(button.link, _status.event.player, "raw");
				});
			}
			"step 2";
			if (result.bool) {
				player.logSkill(event.name);
				player.gain(result.links, "gain2", "log");
				if (!player.getStorage("cxm_hengzheng").includes(get.suit(result.links))) player.markAuto("cxm_hengzheng", [get.suit(result.links)]);
			}
		},
		mark: true,
		intro: {
			content: "已记录花色$",
			onunmark(storage, player) {
				delete player.storage.cxm_hengzheng;
				player.removeTip("cxm_hengzheng");
			},
		},
		onremove: (player, skill) => player.removeTip(skill),
		group: ["cxm_hengzheng_a", "cxm_hengzheng_judge"],
		subSkill: {
			a: {
				trigger: {
					global: "phaseEnd",
				},
				forced: true,
				filter: function (event, player) {
					return player.getStorage("cxm_hengzheng").length >= 4;
				},
				content: function () {
					player.unmarkSkill("cxm_hengzheng");
					player.gainMaxHp();
					player.recover();
				},
				sub: true,
			},
			judge: {
				trigger: {
					global: "cardsDiscardAfter",
				},
				direct: true,
				filter(event, player) {
					var evt = event.getParent().relatedEvent;
					if (!evt || evt.name != "judge") {
						return;
					}
					if (get.position(event.cards[0], true) != "d") {
						return false;
					}
					return player.countCards("h") <= player.maxHp;
				},
				content() {
					"step 0";
					player.chooseButton(["镇边：选择要获得的牌", trigger.cards]).set("ai", function (button) {
						return get.value(button.link, _status.event.player, "raw");
					});
					"step 1";
					if (result.bool) {
						player.gain(result.links, "gain2", "log");
						if (!player.getStorage("cxm_hengzheng").includes(get.suit(result.links))) player.markAuto("cxm_hengzheng", [get.suit(result.links)]);
					}
				},
				sub: true,
				parentskill: "cxm_hengzheng",
				"_priority": 0,
				sourceSkill: "cxm_hengzheng",
			},
		},
	},
	"cxm_hengzheng_rewrite": {
		trigger: {
			global: ["loseAfter", "cardsDiscardAfter", "loseAsyncAfter", "equipAfter"],
		},
		filter(event, player) {
			if (event.type != "discard" || event.getlx === false) {
				return false;
			}
			if (event.name !== "cardsDiscard") {
				if (event.position !== ui.discardPile) {
					return false;
				}
				if (
					!game.hasPlayer(current => {
						const evt = event.getl(current);
						return evt.cards?.someInD("od");
					})
				) {
					return false;
				}
			} else {
				const evt = event.getParent();
				if (evt.relatedEvent && (evt.relatedEvent.name === "useCard" || evt.relatedEvent.name === "respond")) {
					return false;
				}
			}
			return player.countCards("h") <= player.maxHp;
		},
		direct: true,
		content() {
			"step 0";
			if (trigger.delay == false) {
				game.delay();
			}
			"step 1";
			var cards = [],
				cards2 = trigger.cards.slice(0);
			for (var i = 0; i < cards2.length; i++) {
				if (cards2[i].original != "j" && get.position(cards2[i], true) == "d") {
					cards.push(cards2[i]);
				}
			}
			if (cards.length) {
				player.chooseButton(["镇边：选择要获得的牌", cards]).set("ai", function (button) {
					return get.value(button.link, _status.event.player, "raw");
				});
			}
			"step 2";
			if (result.bool) {
				player.logSkill(event.name);
				player.gain(result.links, "gain2", "log");
				if (!player.getStorage("cxm_hengzheng_rewrite").includes(get.suit(result.links))) player.markAuto("cxm_hengzheng_rewrite", [get.suit(result.links)]);
			}
		},
		mark:true,
		intro: {
			content: "已记录花色$",
			onunmark(storage, player) {
				delete player.storage.cxm_hengzheng_rewrite;
				player.removeTip("cxm_hengzheng_rewrite");
			},
		},
		onremove: (player, skill) => player.removeTip(skill),
		group: ["cxm_hengzheng_rewrite_b", "cxm_hengzheng_rewrite_judge"],
		subSkill: {
			b: {
				trigger: {
					player: "phaseUseBegin",
				},
				forced: true,
				filter: function (event, player) {
					return player.getStorage("cxm_hengzheng_rewrite").length >= 4;
				},
				content: function () {
					player.unmarkSkill("cxm_hengzheng_rewrite");
					player.useCard({ name: "jiu", isCard: true }, player);
					player.addTempSkill("cxm_hengzheng_rewrite_c");
				},
				sub: true,
			},
			c: {
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == 'sha') return num + 1;
					},
				},
				sub: true,
			},
			judge: {
				trigger: {
					global: "cardsDiscardAfter",
				},
				direct: true,
				filter(event, player) {
					var evt = event.getParent().relatedEvent;
					if (!evt || evt.name != "judge") {
						return;
					}
					if (get.position(event.cards[0], true) != "d") {
						return false;
					}
					return player.countCards("h") <= player.maxHp;
				},
				content() {
					"step 0";
					player.chooseButton(["镇边：选择要获得的牌", trigger.cards]).set("ai", function (button) {
						return get.value(button.link, _status.event.player, "raw");
					});
					"step 1";
					if (result.bool) {
						player.gain(result.links, "gain2", "log");
						if (!player.getStorage("cxm_hengzheng_rewrite").includes(get.suit(result.links))) player.markAuto("cxm_hengzheng_rewrite", [get.suit(result.links)]);
					}
				},
				sub: true,
				parentskill: "cxm_hengzheng_rewrite",
				"_priority": 0,
				sourceSkill: "cxm_hengzheng_rewrite",
			},
		},
	},
	"cxm_zhiquan": {
		trigger: {
			player: "phaseZhunbei",
		},
		derivation: ["cxm_jiuchi", "cxm_baonue", "cxm_benghuai"],
		forced: true,
		filter: function (event, player) {
			return player.maxHp >= 4;
		},
		content: function () {
			if (player.maxHp >= 4) {
				player.drawTo(player.maxHp);
			}
			if (player.maxHp >= 6) {
				player.addSkill("cxm_jiuchi");
				player.addSkill("cxm_baonue");
			}
			if (player.maxHp >= 8) {
				if (player.storage.cxm_hengzheng && !player.hasSkill("cxm_hengzheng_rewrite")) {
					player.storage.cxm_hengzheng_rewrite = player.storage.cxm_hengzheng;
				}
				player.addSkill("cxm_benghuai");
				player.removeSkill("cxm_hengzheng");
				player.addSkill("cxm_hengzheng_rewrite");
			}
		},
	},
	"cxm_jiuchi": {
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "jiu") {
					return Infinity;
				}
			},
		},
		audio: "ext:鸽府包/audio/skill:2",
		enable: "chooseToUse",
		filterCard(card) {
			return get.suit(card) == "spade";
		},
		viewAs: {
			name: "jiu",
		},
		position: "hs",
		viewAsFilter(player) {
			return player.hasCard(card => get.suit(card) == "spade", "hs");
		},
		prompt: "将一张黑桃手牌当酒使用",
		check(cardx, player) {
			if (player && player == cardx.player) {
				return true;
			}
			if (_status.event.type == "dying") {
				return 1;
			}
			var player = _status.event.player;
			var shas = player.getCards("hs", function (card) {
				return card != cardx && get.name(card, player) == "sha";
			});
			if (!shas.length) {
				return -1;
			}
			if (shas.length > 1 && (player.getCardUsable("sha") > 1 || player.countCards("hs", "zhuge"))) {
				return 0;
			}
			shas.sort(function (a, b) {
				return get.order(b) - get.order(a);
			});
			var card = false;
			if (shas.length) {
				for (var i = 0; i < shas.length; i++) {
					if (shas[i] != cardx && lib.filter.filterCard(shas[i], player)) {
						card = shas[i];
						break;
					}
				}
			}
			if (card) {
				if (
					game.hasPlayer(function (current) {
						return (
							get.attitude(player, current) < 0 &&
							!current.hasShan() &&
							current.hp + current.countCards("h", { name: ["tao", "jiu"] }) > 1 + (player.storage.jiu || 0) &&
							player.canUse(card, current, true, true) &&
							!current.hasSkillTag("filterDamage", null, {
								player: player,
								card: card,
								jiu: true,
							}) &&
							get.effect(current, card, player) > 0
						);
					})
				) {
					return 4 - get.value(cardx);
				}
			}
			return -1;
		},
		ai: {
			threaten: 1.5,
			basic: {
				useful: (card, i) => {
					if (_status.event.player.hp > 1) {
						if (i === 0) {
							return 4;
						}
						return 1;
					}
					if (i === 0) {
						return 7.3;
					}
					return 3;
				},
				value: (card, player, i) => {
					if (player.hp > 1) {
						if (i === 0) {
							return 5;
						}
						return 1;
					}
					if (i === 0) {
						return 7.3;
					}
					return 3;
				},
			},
			order(item, player) {
				if (_status.event.dying) {
					return 9;
				}
				let sha = get.order({ name: "sha" });
				if (sha <= 0) {
					return 0;
				}
				let usable = player.getCardUsable("sha");
				if (
					usable < 2 &&
					player.hasCard(i => {
						return get.name(i, player) == "zhuge";
					}, "hs")
				) {
					usable = Infinity;
				}
				let shas = Math.min(usable, player.mayHaveSha(player, "use", item, "count"));
				if (shas != 1 || (lib.config.mode === "stone" && !player.isMin() && player.getActCount() + 1 >= player.actcount)) {
					return 0;
				}
				return sha + 0.2;
			},
			result: {
				target: (player, target, card) => {
					if (target && target.isDying()) {
						return 2;
					}
					if (!target || target._jiu_temp || !target.isPhaseUsing()) {
						return 0;
					}
					let effs = { order: 0 },
						temp;
					target.getCards("hs", i => {
						if (get.name(i) !== "sha" || ui.selected.cards.includes(i)) {
							return false;
						}
						temp = get.order(i, target);
						if (temp < effs.order) {
							return false;
						}
						if (temp > effs.order) {
							effs = { order: temp };
						}
						effs[i.cardid] = {
							card: i,
							target: null,
							eff: 0,
						};
					});
					delete effs.order;
					for (let i in effs) {
						if (!lib.filter.filterCard(effs[i].card, target)) {
							continue;
						}
						game.filterPlayer(current => {
							if (
								get.attitude(target, current) >= 0 ||
								!target.canUse(effs[i].card, current, null, true) ||
								current.hasSkillTag("filterDamage", null, {
									player: target,
									card: effs[i].card,
									jiu: true,
								})
							) {
								return false;
							}
							temp = get.effect(current, effs[i].card, target, player);
							if (temp <= effs[i].eff) {
								return false;
							}
							effs[i].target = current;
							effs[i].eff = temp;
							return false;
						});
						if (!effs[i].target) {
							continue;
						}
						if (
							target.hasSkillTag(
								"directHit_ai",
								true,
								{
									target: effs[i].target,
									card: i,
								},
								true
							) ||
							//(Math.min(target.getCardUsable("sha"), target.mayHaveSha(player, "use", item, "count")) === 1 && (
							target.needsToDiscard() > Math.max(0, 3 - target.hp) ||
							!effs[i].target.mayHaveShan(player, "use")
							//))
						) {
							delete target._jiu_temp;
							return 1;
						}
					}
					delete target._jiu_temp;
					return 0;
				},
			},
			tag: {
				save: 1,
				recover: 0.1,
			},
		},
		trigger: {
			source: "damageEnd",
		},
		locked: false,
		forced: true,
		filter(event, player) {
			if (event.name == "chooseToUse") {
				return player.hasCard(card => get.suit(card) == "spade", "hs");
			}
			return event.card && event.card.name == "sha" && event.getParent(2).jiu == true && !player.isTempBanned("cxm_benghuai");
		},
		content() {
			player.logSkill("oljiuchi");
			player.tempBanSkill("cxm_benghuai");
		},
		"_priority": 0,
	},
	"cxm_baonue": {
		zhuSkill: true,
		trigger: {
			global: "damageSource",
		},
		audio: "ext:鸽府包/audio/skill:2",
		filter(event, player) {
			if (player == event.source || !event.source || event.source.group != "qun") {
				return false;
			}
			return player.hasZhuSkill("cxm_baonue", event.source);
		},
		getIndex: event => event.num,
		logTarget: "source",
		async content(event, trigger, player) {
			const next = player.judge(card => {
				if (get.suit(card) == "spade") {
					return 4;
				}
				return 0;
			});
			next.set("callback", async event => {
				if (event.judgeResult.suit == "spade") {
					await player.recover();
					if (get.position(event.judgeResult.card, true) == "o") {
						await player.gain(event.judgeResult.card, "gain2", "log");
					}
				}
			});
			next.judge2 = result => result.bool;
			await next;
		},
	},
	"cxm_benghuai": {
		trigger: {
			player: "phaseJieshuBegin",
		},
		audio: "ext:鸽府包/audio/skill:2",
		forced: true,
		check() {
			return false;
		},
		filter(event, player) {
			return !player.isMinHp();
		},
		async content(event, trigger, player) {
			const control = await player
				.chooseControl("体力", "体力上限", function (event, player) {
					if (player.hp == player.maxHp) {
						return "体力";
					}
					if (player.hp < player.maxHp - 1 || player.hp <= 2) {
						return "体力上限";
					}
					return "体力";
				})
				.set("prompt", "崩坏：失去1点体力或减1点体力上限")
				.forResultControl();
			if (control == "体力") {
				await player.loseHp();
			} else {
				await player.loseMaxHp(true);
			}
		},
		ai: {
			threaten: 0.5,
			neg: true,
		},
	},
	"gzhlb_yiwei": {
		trigger: {
			player: "damageEnd",
			global: "roundStart",
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2(event.skill),'是否选择一名其他角色，若目标未被记录，你记录其并摸两张牌；已记录，则取消对其的记录并弃置其至多两张牌，若当前回合角色为目标，你被移出游戏？', lib.filter.notMe)
				.set("ai", target => {
					const player = get.event().player;
					if (get.attitude(player, target) > 0) {
						return 2;
					}
					return 1;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_yiwei${[1, 2].randomGet()}.mp3`);
			}, player);
			const first = new Promise((resolve) => {
				if (player.storage.gzhlb_yiwei) {
					if (player.storage.gzhlb_yiwei.includes(target)) {
						player.unmarkAuto("gzhlb_yiwei", [target]);
						target.removeSkill('gzhlb_yiwei_b');
						player.discardPlayerCard(target, 'he', [1,2]).then(resolve);
					} else {
						player.markAuto("gzhlb_yiwei", [target]);
						target.addSkill('gzhlb_yiwei_b');
						player.draw(2).then(resolve);
					}
				} else {
					player.markAuto("gzhlb_yiwei", [target]);
					target.addSkill('gzhlb_yiwei_b');
					player.draw(2).then(resolve);
				}
			});
			first.then(() => {
				if (_status.currentPhase == target) {
					game.broadcastAll(function (player) {
						player.out('gzhlb_yiwei_clear');
					}, player);
				}
			});
		},
		group:"gzhlb_yiwei_clear",
		subSkill: {
			a: {
				trigger: {
					global: "phaseAfter",
				},
				popup: false,
				silent: true,
				forced: true,
				forceOut: true,
				content: function () {
				    "step 0"
				    if (player.isOut()) {
						var list = game.filterPlayer();
						for (var i = 0; i < game.players.length; i++) {
							var pl = game.players[i];
							game.broadcastAll(function (pl) {
								pl.in('gzhlb_yiwei_clear');
							}, pl);
						}
					}
				    "step 1"
					player.insertPhase();
					player.removeSkill('gzhlb_yiwei_a');
				},
				sub:true,
			},
			b: {
				mark: true,
				intro: {
					name: "依偎",
					content: "你已被【依偎】记录",
				},
				sub: true,
			},
			clear: {
				trigger: {
					global: "phaseBefore",
				},
				forced: true,
				charlotte: true,
				silent: true,
				forceOut: true,
				filter(event, player) {
					return event.player != player;
				},
				content: function () {
					game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_yiwei${[1, 2].randomGet()}.mp3`);
					}, player);
					if (player.getStorage("gzhlb_yiwei").includes(trigger.player)) {
						if (player.isOut()) {
							var list = game.filterPlayer();
							for (var i = 0; i < game.players.length; i++) {
								var pl = game.players[i];
								game.broadcastAll(function (pl) {
									pl.in('gzhlb_yiwei_clear');
								}, pl);
							}
						}
						player.addSkill('gzhlb_yiwei_a');
					} else {
						if (player.isOut()) {
							var list = game.filterPlayer();
							for (var i = 0; i < game.players.length; i++) {
								var pl = game.players[i];
								game.broadcastAll(function (pl) {
									pl.in('gzhlb_yiwei_clear');
								}, pl);
							}
							player.draw();
						} else {
							game.broadcastAll(function (player) {
								player.out('gzhlb_yiwei_clear');
							}, player);
						}
					}
				},
				sub: true,
			},
		},
	},
	"cxm_lianji": {
		comboSkill: true,
		mod: {
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && (get.type2(evt.card) == "trick" || get.type2(evt.card) == "delay") && !evt.cxm_lianji && (get.type2(card, player) == "trick" || get.type2(card, player) == "delay")) {
						return num + 10;
					}
				}
			},
		},
		trigger: {
			player: "useCard",
		},
		usable: 3,
		getLastUsed(player, event) {
			var history = player.getAllHistory("useCard");
			var index;
			if (event) {
				index = history.indexOf(event) - 1;
			} else {
				index = history.length - 1;
			}
			if (index >= 0) {
				return history[index];
			}
			return false;
		},
		filter(event, player) {
			const evt = lib.skill.cxm_lianji.getLastUsed(player, event);
			if (get.type2(event.card) != "trick" && get.type2(event.card) != "delay") {
				return false;
			}
			if (!evt || !evt.card || evt.cxm_lianji) {
				return false;
			}
			return (get.type2(evt.card) == "trick" || get.type2(evt.card) == "delay") && get.suit(evt.card) != get.suit(event.card);
		},
		locked: false,
		check(event, player) {
			return true;
		},
		content() {
			"step 0"
			player.draw();
			var cards = [];
			var card = get.discardPile(function (card) {
				return get.type(card) == "trick";
			});
			if (card) {
				cards.push(card);
			}
			if (cards.length) {
				player.$gain2(cards, false);
				player.gain(cards).gaintag.add('cxm_lianji_a');
				game.log(player, "将", cards, "作为“连”置于了武将牌上");
				player.loseToSpecial(cards, "cxm_lianji_a").visible = true;
			}
			"step 1"
			player.markSkill("cxm_lianji_a");
		},
		init(player, skill) {
			player.addSkill(skill + "_mark");
		},
		onremove(player, skill) {
			player.removeSkill(skill + "_mark");
		},
		ai: {
			"directHit_ai": true,
			skillTagFilter(player, tag, arg) {
				const evt = lib.skill.dcjianying.getLastUsed(player);
				if (!arg?.card || (get.type2(arg.card) != "trick" && get.type2(arg.card) != "delay")) {
					return;
				}
				return evt?.card && get.suit(arg.card) != get.suit(evt.card) && (get.type2(evt.card) == "trick" || get.type2(evt.card) == "delay") && !evt.cxm_lianji;
			},
		},
		group: ["cxm_lianji_b", "cxm_lianji_c"],
		subSkill: {
			a: {
				marktext: "计",
				intro: {
					mark(dialog, storage, player) {
						var cards = player.getCards("s", function (card) {
							return card.hasGaintag("cxm_lianji_a");
						});
						if (!cards || !cards.length) {
							return;
						}
						dialog.addAuto(cards);
					},
					markcount(storage, player) {
						return player.countCards("s", function (card) {
							return card.hasGaintag("cxm_lianji_a");
						});
					},
					onunmark(storage, player) {
						var cards = player.getCards("s", function (card) {
							return card.hasGaintag("cxm_lianji_a");
						});
						if (cards.length) {
							player.loseToDiscardpile(cards);
						}
					},
				},
				
				sub: true,
				parentskill: "cxm_lianji",
				"_priority": 0,
				sourceSkill: "cxm_lianji",
			},
			b: {
				enable: "chooseToUse",
				filter(event, player) {
					var a = player.getCards("s", function (card) {
						return card.hasGaintag("cxm_lianji_a");
					});
					return a.length > 0;
				},
				filterCard:true,
				position: "s",
				viewAs: {
					name: "wuxie",
				},
				prompt: "是否将一张“计”当【无懈可击】使用？",
				sub: true,
				parentskill: "cxm_lianji",
				"_priority": 0,
				sourceSkill: "cxm_lianji",
			},
			c: {
				mod: {
					cardEnabled2(card, player, result) {
						if (!card.hasGaintag('cxm_lianji_a')) return;
						const evt = get.event();
						const judge = evt.skill !== "cxm_lianji_b";
						if (get.itemtype(card) === "vcard" && Array.isArray(card.cards)) {
							if (judge) {
								return false;
							}
						}
						if (judge) {
							return false;
						}
					},
				},
				trigger: {
					player: "phaseUseBegin",
				},
				forced: true,
				content() {
					var cards = player.getCards("hes", function (card) {
							return card.hasGaintag("cxm_lianji_a");
						});
					if (cards.length) {
						player.gain(cards, "draw");
					}
				},
				sub: true,
			},
			mark: {
				init(player, skill, arg) {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && get.suit(arg.card) != get.suit(evt.card) && (get.type2(evt.card) == "trick" || get.type2(evt.card) == "delay") && !evt[skill]) {
						player.addTip(skill, "连计 可连击");
					}
				},
				onremove(player, skill) {
					player.removeTip(skill);
				},
				charlotte: true,
				trigger: {
					player: ["useCard1", "useCardAfter"],
				},
				silentForce: true,
				firstDo: true,
				async content(event, trigger, player) {
					const evt = lib.skill.cxm_lianji.getLastUsed(player, event);
					if (event.triggername == "useCard1") {
						if ((get.type2(trigger.card) == "trick" || get.type2(trigger.card) == "delay") && get.suit(trigger.card) != get.suit(evt.card)) {
							player.addTip("cxm_lianji", "连计 可连击");
						} else {
							player.removeTip("cxm_lianji");
						}
					} else if (trigger.cxm_lianji) {
						player.removeTip("cxm_lianji");
					}
				},
				sub: true,
				parentskill: "cxm_lianji",
				"_priority": 0,
				sourceSkill: "cxm_lianji",
			},
		},
		"_priority": 0,
	},
	"cxm_mousheng": {
		trigger: {
			target: "useCardToTarget",
			player: "addJudgeBefore",
		},
		"prompt2": function (event, player) {
			if (player.countMark('cxm_mousheng_clear')) { var a = player.countMark('cxm_mousheng_clear'); } else { var a = 0; }
			return '你是否流失【' + a +'】点体力然后改为将此牌当做任意延时锦囊牌对自己使用然后本回合此技能【】内数字+1至多加2？';
		},
		filter(event, player, name) {
			if (name == 'useCardToTarget') {
				return event.targets.length == 1 && player != event.player;
			} else {
				return player != event.player;
			}
		},
		content: function () {
			'step 0'
			var dialog = [get.prompt("cxm_mousheng")];
			list = lib.inpile.filter(function (i) {
				return !player.hasJudge(i) && get.type(i) == "delay";
			});
			if (list.length) {
				dialog.push('<div class="text center">未记录</div>');
				dialog.push([list, "vcard"]);
			}
			player.chooseButton(dialog).set("ai", function (button) {
				var player = _status.event.player,
					name = button.link[2];
				return -get.effect(player, { name: name }, player, player);
			});
			'step 1'
			if (result.bool) {
				if (!player.hasMark("cxm_mousheng_clear")) {
					if (!player.hasSkill('cxm_mousheng_a')) player.addTempSkill('cxm_mousheng_a');
					if (!player.hasSkill('cxm_mousheng_clear')) player.addTempSkill('cxm_mousheng_clear');
				}
				player.loseHp(player.countMark("cxm_mousheng_clear"));
				if (player.hasSkill('cxm_mousheng_a')) player.removeSkill('cxm_mousheng_a');
				if (player.countMark("cxm_mousheng_clear") < 2) player.addMark("cxm_mousheng_clear", 1);
				trigger.card.name = result.links[0][2];
				trigger.card.isCard = false;
			}
		},
		group: ["cxm_mousheng_b", "cxm_mousheng_c"],
		subSkill: {
			clear: {
				onremove: function (player) {
					player.unmarkSkill("cxm_mousheng_clear");
					delete player.storage.cxm_mousheng_clear;
				},
				sourceSkill: "cxm_mousheng",
				sub: true,
				parentskill: "cxm_mousheng",
				"_priority": 0,
			},
			a: {
				trigger: {
					player: "loseHpBegin",
				},
				popup: false,
				silent: true,
				forced: true,
				content: function () {
					trigger.num --;
				},
				sub:true,
			},
			b: {
				trigger: {
					player: "judgeEnd",
				},
				frequent(event) {
					return event.result.card.name !== "du";
				},
				check(event) {
					return event.result.card.name !== "du";
				},
				filter(event, player) {
					return get.position(event.result.card, true) == "o";
				},
				async content(event, trigger, player) {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (!list[i].hasSkill('cxm_mousheng_d')) {
							list[i].addTempSkill("cxm_mousheng_d");
						}
					}
					player.gain(trigger.card, "gain2");
					player.gain(trigger.result.card, "gain2");
				},
				sub:true,
			},
			c: {
				trigger: {
					player: ["phaseDiscardBefore", "phaseDiscardEnd"],
				},
				forced: true,
				filter(event, player) {
					return !player.getHistory("useCard").length;
				},
				content() {
					if (event.triggername == 'phaseDiscardBefore') {
						player.storage.cxm_mousheng_c = player.countCards('h');
					} else {
						if (player.countCards('h') < player.storage.cxm_mousheng_c) {
							var a = player.storage.cxm_mousheng_c - player.countCards('h');
							if (a > 3) { var b = 3; } else { var b = a; }
							player.draw(b);
						}
					}
				},
				sub:true,
			},
			d: {
				mod: {
					targetEnabled(card, player, target) {
						if (get.type(card) == "delay") {
							return false;
						}
					},
				},
				trigger: {
					global: ["phaseBefore", "phaseUseBefore"],
				},
				popup: true,
				forced: true,
				silent:true,
				content() {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].hasSkill('cxm_mousheng_d')) {
							list[i].removeSkill("cxm_mousheng_d");
						}
					}
				},
				sub:true,
			},
		},
	},
	/*
	"cxm_lianji": {
		comboSkill: true,
		mod: {
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && (get.type2(evt.card) == "trick" || get.type2(evt.card) == "delay") && !evt.cxm_lianji && (get.type2(card, player) == "trick" || get.type2(card, player) == "delay")) {
						return num + 10;
					}
				}
			},
		},
		trigger: {
			player: "useCard",
		},
		getLastUsed(player, event) {
			var history = player.getAllHistory("useCard");
			var index;
			if (event) {
				index = history.indexOf(event) - 1;
			} else {
				index = history.length - 1;
			}
			if (index >= 0) {
				return history[index];
			}
			return false;
		},
		filter(event, player) {
			const evt = lib.skill.cxm_lianji.getLastUsed(player, event);
			if (get.type2(event.card) != "trick" && get.type2(event.card) != "delay") {
				return false;
			}
			if (!evt || !evt.card || evt.cxm_lianji) {
				return false;
			}
			return (get.type2(evt.card) == "trick" || get.type2(evt.card) == "delay") && get.suit(evt.card) != get.suit(event.card) && get.suit(evt.card) != player.storage.cxm_mousheng_suit;
		},
		locked: false,
		check(event, player) {
			return true;
		},
		content() {
			"step 0"
			player.draw();
			var cards = [];
			var card = get.discardPile(function (card) {
				return get.type(card) == "trick";
			});
			if (card) {
				cards.push(card);
			}
			if (cards.length) {
				player.$gain2(cards, false);
				player.gain(cards).gaintag.add('cxm_lianji_a');
				game.log(player, "将", cards, "作为“连”置于了武将牌上");
				player.loseToSpecial(cards, "cxm_lianji_a").visible = true;
			}
			"step 1"
			player.markSkill("cxm_lianji_a");
		},
		init(player, skill) {
			player.addSkill(skill + "_mark");
		},
		onremove(player, skill) {
			player.removeSkill(skill + "_mark");
		},
		ai: {
			"directHit_ai": true,
			skillTagFilter(player, tag, arg) {
				const evt = lib.skill.dcjianying.getLastUsed(player);
				if (!arg?.card || (get.type2(arg.card) != "trick" && get.type2(arg.card) != "delay")) {
					return;
				}
				return evt?.card && get.suit(arg.card) != get.suit(evt.card) && (get.type2(evt.card) == "trick" || get.type2(evt.card) == "delay") && !evt.cxm_lianji;
			},
		},
		group: ["cxm_lianji_b", "cxm_lianji_c"],
		subSkill: {
			a: {
				marktext: "计",
				intro: {
					mark(dialog, storage, player) {
						var cards = player.getCards("s", function (card) {
							return card.hasGaintag("cxm_lianji_a");
						});
						if (!cards || !cards.length) {
							return;
						}
						dialog.addAuto(cards);
					},
					markcount(storage, player) {
						return player.countCards("s", function (card) {
							return card.hasGaintag("cxm_lianji_a");
						});
					},
					onunmark(storage, player) {
						var cards = player.getCards("s", function (card) {
							return card.hasGaintag("cxm_lianji_a");
						});
						if (cards.length) {
							player.loseToDiscardpile(cards);
						}
					},
				},
				
				sub: true,
				parentskill: "cxm_lianji",
				"_priority": 0,
				sourceSkill: "cxm_lianji",
			},
			b: {
				enable: "chooseToUse",
				filter(event, player) {
					var a = player.getCards("s", function (card) {
						return card.hasGaintag("cxm_lianji_a");
					});
					return a.length > 0;
				},
				filterCard:true,
				position: "s",
				viewAs: {
					name: "wuxie",
				},
				prompt: "是否将一张“计”当【无懈可击】使用？",
				sub: true,
				parentskill: "cxm_lianji",
				"_priority": 0,
				sourceSkill: "cxm_lianji",
			},
			c: {
				mod: {
					cardEnabled2(card, player, result) {
						if (!card.hasGaintag('cxm_lianji_a')) return;
						const evt = get.event();
						const judge = evt.skill !== "cxm_lianji_b";
						if (get.itemtype(card) === "vcard" && Array.isArray(card.cards)) {
							if (judge) {
								return false;
							}
						}
						if (judge) {
							return false;
						}
					},
				},
				trigger: {
					player: "phaseUseBegin",
				},
				forced: true,
				content() {
					var cards = player.getCards("hes", function (card) {
							return card.hasGaintag("cxm_lianji_a");
						});
					if (cards.length) {
						player.gain(cards, "draw");
					}
				},
				sub: true,
			},
			mark: {
				init(player, skill, arg) {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && get.suit(arg.card) != get.suit(evt.card) && (get.type2(evt.card) == "trick" || get.type2(evt.card) == "delay") && !evt[skill]) {
						player.addTip(skill, "连计 可连击");
					}
				},
				onremove(player, skill) {
					player.removeTip(skill);
				},
				charlotte: true,
				trigger: {
					player: ["useCard1", "useCardAfter"],
				},
				silentForce: true,
				firstDo: true,
				async content(event, trigger, player) {
					if (player.countMark("cxm_mousheng") < 1) {
						const evt = lib.skill.cxm_lianji.getLastUsed(player, event);
						if (event.triggername == "useCard1") {
							player.storage.cxm_mousheng_suit = get.suit(trigger.card);
							if ((get.type2(trigger.card) == "trick" || get.type2(trigger.card) == "delay") && get.suit(trigger.card) != get.suit(evt.card) && get.suit(trigger.card) != player.storage.cxm_mousheng_suit) {
								player.addTip("cxm_lianji", "连计 可连击");
							} else {
								player.removeTip("cxm_lianji");
							}
						} else if (trigger.cxm_lianji) {
							player.removeTip("cxm_lianji");
						}
					} else {
						if (event.triggername == "useCard1") {
							player.storage.cxm_mousheng_suit = get.suit(trigger.card);
						}
						player.removeMark("cxm_mousheng", player.countMark("cxm_mousheng"));
					}
				},
				sub: true,
				parentskill: "cxm_lianji",
				"_priority": 0,
				sourceSkill: "cxm_lianji",
			},
		},
		"_priority": 0,
	},
	"cxm_mousheng": {
		trigger: {
			target: "useCardToTarget",
			player: "addJudgeBefore",
		},
		"prompt2": function (event, player) {
			if (player.countMark('cxm_mousheng_clear')) { var a = player.countMark('cxm_mousheng_clear'); } else { var a = 0; }
			return '你是否流失【' + a +'】点体力然后改为将此牌当做任意延时锦囊牌对自己使用然后本回合此技能【】内数字+1至多加2？';
		},
		filter(event, player, name) {
			if (name == 'useCardToTarget') {
				return event.targets.length == 1 && player != event.player;
			} else {
				return player != event.player;
			}
		},
		content: function () {
			'step 0'
			var dialog = [get.prompt("cxm_mousheng")];
			list = lib.inpile.filter(function (i) {
				return !player.hasJudge(i) && get.type(i) == "delay";
			});
			if (list.length) {
				dialog.push('<div class="text center">未记录</div>');
				dialog.push([list, "vcard"]);
			}
			player.chooseButton(dialog).set("ai", function (button) {
				var player = _status.event.player,
					name = button.link[2];
				return -get.effect(player, { name: name }, player, player);
			});
			'step 1'
			if (result.bool) {
				if (!player.hasMark("cxm_mousheng_clear")) {
					if (!player.hasSkill('cxm_mousheng_a')) player.addTempSkill('cxm_mousheng_a');
					if (!player.hasSkill('cxm_mousheng_clear')) player.addTempSkill('cxm_mousheng_clear');
				}
				player.loseHp(player.countMark("cxm_mousheng_clear"));
				trigger.untrigger();
				trigger.getParent().player = player;
				if (player.hasSkill('cxm_mousheng_a')) player.removeSkill('cxm_mousheng_a');
				if (player.countMark("cxm_mousheng_clear") < 2) player.addMark("cxm_mousheng_clear", 1);
				trigger.card.name = result.links[0][2];
				trigger.card.isCard = false;
				player.addMark("cxm_mousheng", 1);
				if (player.storage.cxm_mousheng_suit && get.suit(trigger.card) != player.storage.cxm_mousheng_suit) {
					player.chooseBool(get.prompt2('cxm_lianji'));
				} else event.finish();
			}
			'step 2'
			if (result.bool) {
				player.storage.cxm_mousheng_suit = get.suit(trigger.card);
				var next = game.createEvent('cxm_lianji');
				next.player = player;
				next.setContent(lib.skill.cxm_lianji.content);
			};
		},
		group: ["cxm_mousheng_b", "cxm_mousheng_c"],
		subSkill: {
			clear: {
				onremove: function (player) {
					player.unmarkSkill("cxm_mousheng_clear");
					delete player.storage.cxm_mousheng_clear;
				},
				sourceSkill: "cxm_mousheng",
				sub: true,
				parentskill: "cxm_mousheng",
				"_priority": 0,
			},
			a: {
				trigger: {
					player: "loseHpBegin",
				},
				popup: false,
				silent: true,
				forced: true,
				content: function () {
					trigger.num --;
				},
				sub:true,
			},
			b: {
				trigger: {
					player: "judgeEnd",
				},
				frequent(event) {
					return event.result.card.name !== "du";
				},
				check(event) {
					return event.result.card.name !== "du";
				},
				filter(event, player) {
					return get.position(event.result.card, true) == "o";
				},
				async content(event, trigger, player) {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (!list[i].hasSkill('cxm_mousheng_d')) {
							list[i].addTempSkill("cxm_mousheng_d");
						}
					}
					player.gain(trigger.card, "gain2");
					player.gain(trigger.result.card, "gain2");
				},
				sub:true,
			},
			c: {
				trigger: {
					player: ["phaseDiscardBefore", "phaseDiscardEnd"],
				},
				forced: true,
				filter(event, player) {
					return !player.getHistory("useCard").length;
				},
				content() {
					if (event.triggername == 'phaseDiscardBefore') {
						player.storage.cxm_mousheng_c = player.countCards('h');
					} else {
						if (player.countCards('h') < player.storage.cxm_mousheng_c) {
							var a = player.storage.cxm_mousheng_c - player.countCards('h');
							if (a > 3) { var b = 3; } else { var b = a; }
							player.draw(b);
						}
					}
				},
				sub:true,
			},
			d: {
				mod: {
					targetEnabled(card, player, target) {
						if (get.type(card) == "delay") {
							return false;
						}
					},
				},
				trigger: {
					global: ["phaseBefore", "phaseUseBefore"],
				},
				popup: true,
				forced: true,
				silent:true,
				content() {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].hasSkill('cxm_mousheng_d')) {
							list[i].removeSkill("cxm_mousheng_d");
						}
					}
				},
				sub:true,
			},
		},
	},
	*/
	"cxm_youlong": {
		init(player) {
			player.storage.cxm_youlong_a = 0;
			player.syncStorage("cxm_youlong_a");
			player.storage.cxm_youlong_b = 0;
			player.syncStorage("cxm_youlong_b");
		},
		mark: true,
		intro: {
			name: "游龙",
			content(err, player) {
				return `〖游龙〗本回合还可以使用【${player.countMark('cxm_youlong_b') - player.countMark('cxm_youlong_a')}】次`
			},
			markcount(storage, player) {
				return `${player.countMark('cxm_youlong_b') - player.countMark('cxm_youlong_a')}`
			},
		},
		trigger: {
			player: ["useCardEnd", "respondEnd"],
		},
		audio: "ollongdan",
		"prompt2": function (event, player) {
			return '你是否展示牌堆顶的三张牌，你可获得其中任意张与你使用或打出的牌花色相同的牌，若你未获得牌，你摸一张牌并增加一点手牌上限；若你获得一张牌，则你可选择一名角色恢复一点体力；若你获得两张牌，则你可弃置两张牌然后获得一名其他角色的一张牌；若你获得三张牌，则你流失一点体力？';
		},
		mod: {
			maxHandcard: function (player, num) {
				return num + player.countMark('cxm_youlong_Handcard');
			}
		},
		filter: function (event, player) {
			return event.card.suit && player.countMark('cxm_youlong_a') < player.countMark('cxm_youlong_b');
		},
		content: function () {
			'step 0'
			player.addMark('cxm_youlong_a', 1);
			if (!player.hasSkill('cxm_youlong_a')) player.addTempSkill('cxm_youlong_a');
			var cards = get.cards(3);
			player.showCards(cards, get.translation(player) + "发动了〖游龙〗");
			game.cardsGotoOrdering(cards);
			if (get.suit(trigger.card) == "heart") {
				player.chooseCardButton('〖游龙〗：请选择要获得的牌', cards, [1, Infinity])
					.set("filterButton", function (button) {
						return get.suit(button.link) == "heart";
					})
					.set('ai', function (button) {
						return get.value(button.link);
					});
			}
			if (get.suit(trigger.card) == "spade") {
				player.chooseCardButton('〖游龙〗：请选择要获得的牌', cards, [1, Infinity])
					.set("filterButton", function (button) {
						return get.suit(button.link) == "spade";
					})
					.set('ai', function (button) {
						return get.value(button.link);
					});
			}
			if (get.suit(trigger.card) == "club") {
				player.chooseCardButton('〖游龙〗：请选择要获得的牌', cards, [1, Infinity])
					.set("filterButton", function (button) {
						return get.suit(button.link) == "club";
					})
					.set('ai', function (button) {
						return get.value(button.link);
					});
			}
			if (get.suit(trigger.card) == "diamond") {
				player.chooseCardButton('〖游龙〗：请选择要获得的牌', cards, [1, Infinity])
					.set("filterButton", function (button) {
						return get.suit(button.link) == "diamond";
					})
					.set('ai', function (button) {
						return get.value(button.link);
					});
			}
			'step 1'
			if (result.bool) {
				player.gain(result.links, "gain2");
				game.log(player, `获得了${result.links.length}张牌`);
				if (result.links.length == 1) {
					player
						.chooseTarget("请选择一名角色并令其回复1点体力", true)
						.set("ai", function (target) {
							var att = get.attitude(_status.event.player, target);
							if (att < 0) {
								return -att + 3;
							}
							return Math.random();
						});
				}
				if (result.links.length == 2) {
					player.chooseToDiscard(2, 'he');
					event.goto(3);
				}
				if (result.links.length == 3) {
					player.loseHp();
					event.finish();
				}
			} else {
				player.draw();
				player.addMark('cxm_youlong_Handcard', 1);
				game.log(player, "摸了1张牌并增加了1点手牌上限");
				event.finish();
			}
			'step 2'
			result.targets[0].recover();
			event.finish();
			'step 3'
			if (result.bool) {
				player
					.chooseTarget("请选择一名其他角色并获得其一张牌", true, function (card, player, target) {
						return target != player;
					})
					.set("ai", function (target) {
						var att = get.attitude(_status.event.player, target);
						if (att < 0) {
							return -att + 3;
						}
						return Math.random();
					});
			} else {
				event.finish();
			}
			'step 4'
			player.gainPlayerCard(result.targets[0], "he", true);
		},
		group:"cxm_youlong_b",
		subSkill: {
			a: {
				onremove: function (player) {
					player.storage.cxm_youlong_a = [];
				},
				sub:true,
			},
			b: {
				trigger: {
					global: "phaseBegin",
				},
				forced: true,
				charlotte: true,
				popup: false,
				silent: true,
				content: function () {
					if (player.getDamagedHp() > 0) { var a = player.getDamagedHp(); } else { var a = 1; }
					player.storage.cxm_youlong_b = a;
					player.syncStorage("cxm_youlong_b");
				},
				sub:true,
			},
		},
	},
	"gzhlb_rumo": {
		trigger: {
			player: ["useCardBegin", "respondBegin"],
		},
		audio: "ext:鸽府包/audio/skill:3",
		forced: true,
		filter(event, player) {
			return player.storage.gzhlb_rumo.length < 4;
		},
		async content(event, trigger, player) {
			const list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (!list[i].hasSkill('gzhlb_rumo_a')) {
					list[i].addTempSkill('gzhlb_rumo_a');
				}
				list[i].markAuto("gzhlb_rumo", [trigger.card.suit]);
			}
			await player.addTempSkill('gzhlb_rumo_b');
			await player.markAuto("gzhlb_rumo_b", [trigger.card.suit]);
			if (player.storage.gzhlb_rumo.includes("none")) {
				await player.draw(5 - player.storage.gzhlb_rumo.length);
			} else {
				await player.draw(4 - player.storage.gzhlb_rumo.length);
			}
		},
		init(player) {
			player.storage.gzhlb_rumo = player.storage.gzhlb_rumo || [];
		},
		subSkill: {
			a: {
				mod: {
					"cardEnabled2": function (card, player) {
						if (get.itemtype(card) == 'card' && player.storage.gzhlb_rumo.includes(card.suit)) return false;
					},
				},
				onremove: function (player) {
					player.storage.gzhlb_rumo = [];
				},
				sub:true,
			},
			b: {
				intro: {
					markcount(storage, player) {
						const a = player.storage?.gzhlb_rumo_b || [];
						const suitMap = { 'spade': '♠', 'heart': '♥', 'club': '♣', 'diamond': '♦', 'none': '◈' };
						const suitSymbols = a.map(suit => suitMap[suit] || suitMap['none']).join('');
						return `全程封印：${suitSymbols}`;
					},
					mark(dialog, storage, player) {
						const a = player.storage.gzhlb_rumo_b;
						const suitMap = { 'spade': '♠', 'heart': '♥', 'club': '♣', 'diamond': '♦', 'none': '◈' };
						dialog.addText(`所有玩家不可使用的花色<br>（共${a.length}种）：`);
						for (let i = 0; i < a.length; i++) {
							const suit = a[i];
							const suitSymbol = suitMap[suit] || suitMap['none'];
							dialog.addText(`${i + 1}. ${suitSymbol}`);
						}
					},
				},
				onremove: function (player) {
					player.storage.gzhlb_rumo_b = [];
				},
				sub:true,
			},
		},
	},
	"gzhlb_chegui": {
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") {
					return num + player.countMark("gzhlb_chegui_sha");
				}
			},
			maxHandcard: function (player, num) {
				return num + player.countMark('gzhlb_chegui_Handcard');
			},
		},
		trigger: {
			player: "useCardEnd",
		},
		frequent: true,
		filter(event, player) {
			return lib.suit.includes(get.suit(event.card));
		},
		init(player) {
			player.storage.gzhlb_chegui = player.storage.gzhlb_chegui || [];
			player.storage.chehui_recordedPoints = player.storage.chehui_recordedPoints || [];
		},
		async cost(event, trigger, player) {
			const currentCard = trigger.card;
			if (!currentCard) {
				event.result = { bool: false };
				return;
			}
			const cardPoint = currentCard.number || 0;
			const recordedCards = player.storage.gzhlb_chegui;
			const needRecord = true;
			const targetPoint = 14 - cardPoint;
			const validRecordedCards = recordedCards.filter(c => c.number === targetPoint);
			const canViewAs = validRecordedCards.length > 0;
			const isPointRecorded = player.storage.chehui_recordedPoints.includes(cardPoint);
			event.result = {
				bool: true,
				cost_data: {
					needRecord,
					currentCard,
					canViewAs,
					targetPoint,
					validCards: validRecordedCards,
					isPointRecorded
				}
			};
		},
		async content(event, trigger, player) {
			const costData = event.cost_data;
			if (!costData) return;
			const { needRecord, currentCard, canViewAs, targetPoint, validCards, isPointRecorded } = costData;
			const recordedCards = player.storage.gzhlb_chegui;
			const recordedPoints = player.storage.chehui_recordedPoints;
			const cardPoint = currentCard.number || 0;
			if (needRecord) {
				if (!isPointRecorded) {
					await player.draw();
					game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_chegui${[1, 2, 3].randomGet()}.mp3`);
					}, player);
					game.log(player, `发动车轨，记录点数【${cardPoint}】并摸一张牌`);
					recordedPoints.push(cardPoint);
				}
				recordedCards.push(currentCard);
				game.log(player, `发动车轨，记录了${get.translation(currentCard.name)}（点数${cardPoint}）`);
			}
			if (canViewAs) {
				const selectList = validCards.map((card, index) => {
					const displayText = `${get.translation(card.name)}（${card.number}，记录序号：${index + 1}）`;
					return ['card', '', displayText, '', index];
				});
				const { result: { bool: chooseBool, links: chooseLinks } } = await player.chooseButton(
					[`车轨：是否视为使用记录中点数为【${targetPoint}】的牌？`, [selectList, "vcard"]]
				).set("ai", get.buttonValue);
				if (chooseBool) {
					const selectedRecord = validCards[chooseLinks[0][4]];
					game.log(player, `发动掣桧，创建并使用使用记录的【${get.translation(selectedRecord.name)}】`);
					const fakeCard = game.createCard(
						selectedRecord.name,
						'none',
						selectedRecord.number,
						selectedRecord.nature
					);
					await player.useCard(fakeCard, (trigger._targets || trigger.targets).slice(0));
					game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_chegui${[4, 5].randomGet()}.mp3`);
					}, player);
				}
			}
			if (player.storage.chehui_recordedPoints.includes(targetPoint)) {
				const choiceList = ["移除点数为【" + get.translation(targetPoint) + "】中的一个记录，然后出杀次数+1", "手牌上限+1"];
				const { result } = await player.chooseControl()
					.set("choiceList", choiceList)
					.set("ai", function (event, player) {
						return 0;
					})
					.set("canCancel", false); 
				if (result.index == 0) {
					const targetIndexes = recordedCards
						.map((card, idx) => ({ card, idx }))
						.filter(item => item.card.number === targetPoint)
						.map(item => item.idx);
					if (targetIndexes.length === 0) {
						game.log(player, `没有点数为${targetPoint}的记录，无法移除`);
						return;
					}
					const suitMap = { 'spade': '♠', 'heart': '♥', 'club': '♣', 'diamond': '♦', 'none': '◈' };
					let removeIndex = targetIndexes[0];
					if (targetIndexes.length > 1) {
						const removeList = targetIndexes.map(idx => {
							const card = recordedCards[idx];
							const suitSymbol = suitMap[card?.suit] || suitMap['none'];
							const displayText = `${get.translation(card.name)} ${suitSymbol}${card.number}（序号${idx + 1}）`;
							return [
								'card',
								'',
								displayText,
								'',
								idx
							];
						});
						const { result: { links } } = await player.chooseButton(
							[`请选择要移除的点数${targetPoint}的记录：`, [removeList, "vcard"]]
						).set("ai", get.buttonValue);
						removeIndex = links[0][4];
					}
					const removedCard = recordedCards.splice(removeIndex, 1)[0];
					const removedSuit = suitMap[removedCard?.suit] || suitMap['none'];
					player.addMark("gzhlb_chegui_sha", 1);
					game.log(player, `移除了记录的${get.translation(removedCard.name)} ${removedSuit}${removedCard.number}（点数${targetPoint}）`);
				}
				if (result.index == 1) {
					player.addMark("gzhlb_chegui_Handcard", 1);
				}
				game.broadcastAll(function (player) {
					game.playAudio(`../extension/鸽府包/audio/skill/gzhlb_chegui${[6, 7].randomGet()}.mp3`);
				}, player);
			}
		},
		mark: true,
		intro: {
			markcount(storage) {
				return storage?.gzhlb_chegui?.length || 0;
			},
			mark(dialog, storage, player) {
				const recordedCards = player.storage.gzhlb_chegui;
				if (!recordedCards || recordedCards.length === 0) {
					dialog.addText("无记录的牌");
					return;
				}
				const suitMap = { 'spade': '♠', 'heart': '♥', 'club': '♣', 'diamond': '♦', 'none': '◈' };
				dialog.addText(`记录的牌（共${recordedCards.length}张）：`);
				for (let i = 0; i < recordedCards.length; i++) {
					const card = recordedCards[i];
					const cardName = get.translation(card?.name || "未知牌");
					const point = card?.number || "无点数";
					const suitSymbol = suitMap[card?.suit] || suitMap['none'];
					dialog.addText(`${i + 1}. ${cardName} ${suitSymbol}${point}`);
				}
			},
			onunmark(storage, player) {
				player.storage.gzhlb_chegui = [];
				player.storage.chehui_recordedPoints = [];
			},
		},
	},
	/*"seh_senluo": {
		enable: "phaseUse",
		usable: 10,
		filterTarget: true,
		prompt: "你可流失一点体力令一名角色获得一点护甲，若选择的角色不为你，则你摸两张牌；为你，你摸一张牌。",
		async content(event, trigger, player) {
			const { target } = event;
			player.line(target, "green");
			pindianByCard(player, target);
			await player.loseHp();
			if (target.hujia < 5) await target.changeHujia();
			if (player != target) {
			    await player.draw(2);
			    game.broadcastAll(function (player) {
					game.playAudio(`../extension/鸽府包/audio/skill/seh_senluo${[2].randomGet()}.mp3`);
				}, player);
			} else {
				await player.draw();
			    game.broadcastAll(function (player) {
					game.playAudio(`../extension/鸽府包/audio/skill/seh_senluo${[1].randomGet()}.mp3`);
				}, player);
			}
		},
		group: ["seh_senluo_a", "seh_senluo_b"],
		subSkill: {
			a: {
				mod: {
					maxHandcard: function (player, num) {
						return num = player.hujia + player.getDamagedHp();
					},
				},
				trigger: {
					player: ["dyingBefore", "dyingBegin"],
				},
				lastDo: true,
				forced:true,
				persevereSkill: true,
				filter(event, player) {
					return player.hujia > 0;
				},
				async content(event, trigger, player) {
					await player.addMark('seh_senluo_c', 1);
					await player.addTempSkill("seh_senluo_c");
					trigger.cancel();
				},
				sub:true,
			},
			b: {
				trigger: {
					global: "dyingBegin",
				},
				"prompt2": function (event, player) {
					if (player.countMark('seh_senluo_c') > 0) {
						var a = player.countMark('seh_senluo_c');
					} else { var a = 1; }
					return '是否发动【森罗】选择：1、你弃置【' + a + '】张牌获得1点护甲；2、你移除一点护甲令其恢复一点体力(此技能至多令玩家获得5点护甲）？';
				},
				filter(event, player) {
					if (player.countMark('seh_senluo_c') > 0) {
						var a = player.countMark('seh_senluo_c');
					} else { var a = 1; }
					return player.hujia > 0 || player.countCards("he") >= a;
				}, 
				content: function () {
					"step 0"
					if (player.hujia < 1) {
						if (player.countMark('seh_senluo_c') > 0) {
							var a = player.countMark('seh_senluo_c');
						} else { var a = 1; }
						player.chooseToDiscard('he', a, true);
						player.changeHujia();
						event.finish();
					} else {
						if (player.countCards("he") < 1) {
							player.changeHujia(-1);
							trigger.player.recover();
							event.finish();
						} else {
							if (player.countMark('seh_senluo_c') > 0) {
								var a = player.countMark('seh_senluo_c');
							} else { var a = 1; }
							var str = get.translation(trigger.player);
							player.chooseControl().set("choiceList", ["你弃置【" + a + "】张牌获得1点护甲", "你移除一点护甲令" + str + "恢复一点体力"]).set("ai", function (event, player) {
								return 0;
							});
						}
					}
					"step 1"
					if (result.index == 0) {
						if (player.countMark('seh_senluo_c') > 0) {
							var a = player.countMark('seh_senluo_c');
						} else {var a = 1; }
						player.chooseToDiscard('he',a , true);
						if (player.hujia < 5) player.changeHujia();
						game.broadcastAll(function (player) {
							game.playAudio(`../extension/鸽府包/audio/skill/seh_senluo${[1].randomGet()}.mp3`);
						}, player);
					}
					if (result.index == 1) {
						player.changeHujia(-1);
						trigger.player.recover();
						game.broadcastAll(function (player) {
							game.playAudio(`../extension/鸽府包/audio/skill/seh_senluo${[2].randomGet()}.mp3`);
						}, player);
					}
				},
				sub:true,
			},
			c: {
				onremove: function (player) {
					player.unmarkSkill("seh_senluo_c");
					delete player.storage.seh_senluo_c;
				},
				sub:true,
			},
		},
	},
	"seh_hanlei": {
		trigger: {
			target: "useCardToTarget",
		},
		filter: function (event, player) {
			if (!player.hasEnabledSlot() || event.player == player) {
				return false;
			}
			const cards = event.cards || [];
			const hasNonEquip = cards.some(card => get.type(card) != "equip");
			return hasNonEquip;
		},
		async cost(event, trigger, player) {
			const choiceList = ["发动撼垒（废除装备栏并记录卡牌）","不发动"];
			const { result } = await player.chooseControl()
				.set("choiceList", choiceList)
				.set("ai", function (event, player) {
					return 0;
				});
			if (result.index == 1) {
				event.result = { bool: false };
				return;
			}
			player.chooseToDisable().ai = function (event, player, list) {
				if (list.includes("equip5")) {
					return "equip5";
				}
				return list.randomGet();
			};
			const cards = trigger.cards || [];
			if (cards.length == 0) {
				event.result = { bool: false };
				return;
			}
			const nonEquipCards = cards.filter(card => get.type(card) !== "equip");
			if (nonEquipCards.length == 0) {
				event.result = { bool: false };
				return;
			}
			if (nonEquipCards.length == 1) {
				event.result = {
					bool: true,
					cost_data: nonEquipCards[0]
				};
				return;
			}
			const suitMap = {
				'spade': '♠', 'heart': '♥', 'club': '♣', 'diamond': '♦', 'none': '◈'
			};
			const selectList = nonEquipCards.map((card, index) => {
				const cardNature = card.nature ? `·${get.translation(card.nature)}` : '';
				const displayText = `${get.translation(card.name)}（${suitMap[card.suit] || card.suit
					}${card.number || ''}${ 
					cardNature
					}）`;
				return [
					'card',
					'',
					displayText,
					'',
					index
				];
			});
			const { result: { bool: chooseBool, links: chooseLinks } } = await player.chooseButton(
				["撼垒：选择一张牌记录", [selectList, "vcard"]]
			).set("ai", get.buttonValue);
			event.result = {
				bool: chooseBool,
				cost_data: chooseBool ? {
					selectedIdx: chooseLinks[0][4],
					nonEquipCards: nonEquipCards
				} : null
			};
		},
		async content(event, trigger, player) {
			const costData = event.cost_data;
			if (!costData) return;
			const selectedCard = costData.name ? costData : costData.nonEquipCards[costData.selectedIdx];
			player.storage.seh_hanlei.push(selectedCard);
			game.log(player, "发动撼垒，废除装备栏并记录了", "#y" + get.translation(selectedCard));
			game.broadcastAll(function (player) {
			game.playAudio(`../extension/鸽府包/audio/skill/seh_hanlei${[2].randomGet()}.mp3`);
			}, player);
		},
		mark:true,
		init: function (player) {
			player.storage.seh_hanlei = [];
			player.syncStorage("seh_hanlei");
		},
		intro: {
			markcount(storage) {
				if (!storage) {
					return 0;
				}
				return storage.length;
			},
			mark(dialog, storage) {
				if (!storage) {
					return;
				}
				dialog.addAuto(storage);
			},
			onunmark(storage, player) {
				player.storage.seh_hanlei = [];
			},
		},
		group: ["seh_hanlei_a", "seh_hanlei_c", "seh_hanlei_e"],
		subSkill: {
			b: {
				onremove: function (player) {
					player.unmarkSkill("seh_hanlei_b");
					delete player.storage.seh_hanlei_b;
				},
				sub: true,
			},
			c: {
				trigger: {
					player: ["useCardBegin", "respondBegin"],
				},
				frequent: true,
				filter(event, player) {		
					const originalCards = player.storage.seh_hanlei || [];
					return originalCards.map(card => card.name).includes(event.card.name) && event.card.isCard;
				},
				content: function () {
					"step 0"
					const storedCards = player.storage.seh_hanlei;
					const suitMap = {
						'spade': '♠',
						'heart': '♥',
						'club': '♣',
						'diamond': '♦',
						'none': '◈'
					};
					const list = storedCards
						.map((card, index) => {
							const displayText = `${get.translation(card.name)}（${suitMap[card.suit] || card.suit
								}${card.number || ''}${card.nature ? '·' + get.translation(card.nature) : ''
								}）`;
							return [
								'card',
								'',
								displayText,
								'',
								index
							];
						});
					const listWithOriginalIndex = storedCards
						.map((card, originalIndex) => ({ card, originalIndex }))
						.filter(({ card }) => {
							return trigger.card.name == card.name && get.type(card) != "equip";
						})
						.map(({ card, originalIndex }) => {
							const displayText = `${get.translation(card.name)}（${suitMap[card.suit] || card.suit
								}${card.number || ''}${card.nature ? '·' + get.translation(card.nature) : ''
								}）`;
							return [
								'card',
								'',
								displayText,
								'',
								originalIndex
							];
						});
					const dialog = [get.prompt("seh_hanlei")];
					dialog.push('<div class="text center">是否移除一张【' + get.translation(trigger.card.name) +'】的记录？</div>');
					dialog.push([listWithOriginalIndex, "vcard"]);
					player.chooseButton(dialog).set("ai", function (button) {
						var player = _status.event.player, 
							name = button.link[2];
						if (player.getStorage("seh_hanlei").includes(name)) {
							return -get.effect(player, { name: name }, player, player);
						} else {
							return get.effect(player, { name: name }, player, player) * (1 + player.countCards("hs", name));
						}
					});
					"step 1"
					if (result.bool) {
						game.broadcastAll(function (player) {
							game.playAudio(`../extension/鸽府包/audio/skill/seh_hanlei${[1].randomGet()}.mp3`);
						}, player);
						const originalIndex = result.links[0][4];
						const selectedCard = player.storage.seh_hanlei[originalIndex];
						player.unmarkAuto("seh_hanlei", [selectedCard]);
						if (get.tag(selectedCard, "damage")) {
							
							player.addTempSkill('seh_hanlei_d', 'useCardAfter');
						} else {
							
							player.draw();
						}
						game.log(player, "从撼垒记录中移除了", "#y" + get.translation(selectedCard));
						player.chooseToEnable();
						game.delayx();
					}
				},
				sub: true,
				"_priority": 0,
				parentskill: "seh_hanlei",
				sourceSkill: "seh_hanlei",
			},
			d: {
				trigger: {
					source: "damageBegin2",
				},
				filter: function (event, player) {
					return event.num > 0;
				},
				forced: true,
				content: function () {
					trigger.num++;
				},
				sub: true,
				"_priority": 0,
				parentskill: "seh_hanlei",
				sourceSkill: "seh_hanlei",
			},
			e: {
				trigger: {
					global: "gameStart",
				},
				audio: "ext:鸽府包/audio/skill:1",
				forced: true,
				content: function () {
					player.changeHp(0 - player.hp);
				},
				sub: true,
				parentskill: "seh_hanlei",
				sourceSkill: "seh_hanlei",
			},
			a: {
				enable: ["chooseToUse", "chooseToRespond"],
				filter: function (event, player) {
					for (const name of lib.inpile) {
						if (event.filterCard({ name: name }, player, event)) return true;
					}
					return false;
				},
				chooseButton: {
					dialog: function (event, player) {
						const storedCards = player.storage.seh_hanlei;
						const suitMap = {
							'spade': '♠',
							'heart': '♥',
							'club': '♣',
							'diamond': '♦',
							'none': '◈'
						};
						const list = storedCards
							.filter(card => {
								return !player.getStorage("seh_hanlei_b").includes(card);
							})
							.map((card, index) => {
								const displayText = `${get.translation(card.name)}（${suitMap[card.suit] || card.suit
									}${card.number || ''}${card.nature ? '·' + get.translation(card.nature) : ''
									}）`;
								return [
									'card',
									'',
									displayText,
									'',
									index
								];
							});
						const listWithOriginalIndex = storedCards
							.map((card, originalIndex) => ({ card, originalIndex }))
							.filter(({ card }) => {
								return !player.getStorage("seh_hanlei_b").includes(card) && get.type(card) != "equip";
							})
							.map(({ card, originalIndex }) => {
								const displayText = `${get.translation(card.name)}（${suitMap[card.suit] || card.suit
									}${card.number || ''}${card.nature ? '·' + get.translation(card.nature) : ''
									}）`;
								return [
									'card',
									'',
									displayText,
									'',
									originalIndex
								];
							});
						return listWithOriginalIndex.length > 0
							? ui.create.dialog('撼垒', [listWithOriginalIndex, 'vcard'], 'hidden')
							: ui.create.dialog('撼垒', 'hidden', '已无可转换的牌');
					},
					check: function (button) {
						if (_status.event.getParent().type !== 'phase') return 1;
						const player = _status.event.player;
						const cardName = button.link[2].split('（')[0];
						const card = { name: cardName, nature: button.link[3] };
						if (card.name === 'jiu') return 0;
						return player.getUseValue(card, null, true);
					},
					backup: function (links, player) {
						const originalIndex = links[0][4];
						const selectedCard = player.storage.seh_hanlei[originalIndex];
						return {
							viewAs: {
								name: selectedCard.name,
								suit: selectedCard.suit,
								number: selectedCard.number,
								nature: selectedCard.nature || ''
							},
							filterCard: true,
							position: 'he',
							popname: true,
							check: function (card) {
								return 6 / Math.max(1, get.value(card));
							},
							onuse(result, player) {
							    game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/seh_hanlei${[1].randomGet()}.mp3`);
			}, player);
								player.markAuto("seh_hanlei_b", [selectedCard]);
								player.addTempSkill("seh_hanlei_b");
							},
						}
					},
					prompt: function (links, player) {
						const originalIndex = links[0][4];
						const selectedCard = player.storage.seh_hanlei[originalIndex];
						var card = {
							name: selectedCard.name,
							suit: selectedCard.suit,
							number: selectedCard.number,
							nature: selectedCard.nature || '',
							isCard: true,
						};
						return '将一张牌当做' + get.translation(card) + '使用';
					},
				},
				mod: {
					targetInRange: function (card, player, target) {
						const originalCards = player.storage.seh_hanlei || [];
						const cancelCards = player.storage.seh_hanlei_b || [];
						const cancelCount = {};
						cancelCards.forEach(card => {
							const name = card.name;
							cancelCount[name] = (cancelCount[name] || 0) + 1;
						});
						const remainingNames = [];
						const usedCancel = { ...cancelCount };
						originalCards.forEach(card => {
							const name = card.name;
							if (usedCancel[name] > 0) {
								usedCancel[name]--;
							} else {
								remainingNames.push(name);
							}
						});
						if (card.cards && card.cards.length > 0) {
							for (const subCard of card.cards) {
								for (var i of card.cards) {
									if (remainingNames.includes(i.name)) return true;
								}
							}
						} else {
							for (var i of card.cards) {
								if (remainingNames.includes(i.name)) return true;
							}
						}
					},
				},
				ai: {
					respondSha: true,
					respondShan: true,
					skillTagFilter: function (player, tag) {
						let name;
						switch (tag) {
							case 'respondSha':
							case 'respondShan':
							case 'save':
								name = 'red';
								break;
						}
						return player.countCards('hes', { color: name }) > 0;
					},
					order: 11,
					result: {
						player: function (player) {
							if (_status.event.dying) {
								return get.attitude(player, _status.event.dying);
							}
							return 1;
						},
					},
				},
				sub: true,
			},
		},
	},*/
	"cxm_guowu": {
		trigger: {
			player: "phaseUseBegin",
		},
		filter(event, player) {
			return player.countCards("h");
		},
		"prompt2": function (event, player) {
			return '是否展示全部手牌，然后根据你展示的类型数，你获得对应效果：至少一类，从弃牌堆获得一张“杀”和一张“普通锦囊牌”；至少两类，此阶段使用牌无次数限制；至少三类，此阶段首次使用的“杀”和“普通锦囊牌”额外结算一次？';
		},
		async content(event, trigger, player) {
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/cxm_guowu_b${[1, 2].randomGet()}.mp3`);
			}, player);
			await player.showHandcards(`${get.translation(player)}发动了【帼武】`);
			var cards = player.getCards("h");
			event.count1 = 0, event.count2 = 0, event.count3 = 0, event.count4 = 0;
			for (var i = 0; i < cards.length; i++) {
				if (get.type(cards[i]) == "basic") event.count1++;
				if (get.type(cards[i]) == "trick" || get.type(cards[i]) == "delay") event.count2++;
				if (get.type(cards[i]) == "equip") event.count3++;
			}
			if (event.count1 > 0) event.count4++;
			if (event.count2 > 0) event.count4++;
			if (event.count3 > 0) event.count4++;
			if (event.count4 > 0) {
				var cards = [];
				var card = get.discardPile(function (i) {
					return i.name == "sha";
				});
				if (card) {
					cards.push(card);
				}
				var card2 = get.discardPile(function (i) {
					return get.type(i) == "trick";
				});
				if (card2) {
					cards.push(card2);
				}
				if (cards.length) {
					player.gain(cards, "gain2");
				}
				game.log(player, "触发了帼武一：从弃牌堆获得一张“杀”和一张“普通锦囊牌”。");
			}
			if (event.count4 > 1) {
				player.addTempSkill("cxm_guowu_a", "phaseUseAfter");
				game.log(player, "触发了帼武二：此阶段使用牌无次数限制。");
			}
			if (event.count4 > 2) {
				player.addTempSkill("cxm_guowu_b", "phaseUseAfter");
				game.log(player, "触发了帼武三：此阶段首次使用的“杀”和“普通锦囊牌”额外结算一次。");
			}
		},
		subSkill: {
			a: {
				charlotte: true,
				mod: {
					cardUsable: () => Infinity,
				},
				sub: true,
				parentskill: "cxm_guowu",
				sourceSkill: "cxm_guowu",
			},
			b: {
				trigger: {
					player: "useCardAfter",
				},
				audio: "ext:鸽府包/audio/skill:2",
				forced:true,
				charlotte: true,
				filter(event, player) {
					if (event.parent.name == "cxm_guowu_b") {
						return false;
					}
					if (_status.currentPhase != player) {
						return false;
					}
					if (!event.targets || !event.card) {
						return false;
					}
					if (get.info(event.card).complexTarget) {
						return false;
					}
					if (!lib.filter.cardEnabled(event.card, player, event.parent)) {
						return false;
					}
					var type = get.type(event.card);
					if (type != "basic" && type != "trick") {
						return false;
					}
					var card = game.createCard(event.card.name, event.card.suit, event.card.number, event.card.nature);
					var targets = event._targets || event.targets;
					for (var i = 0; i < targets.length; i++) {
						if (!targets[i].isIn()) {
							return false;
						}
						if (!player.canUse({ name: event.card.name }, targets[i], false, false)) {
							return false;
						}
					}
					return (event.card.name == "sha" && player.countMark('cxm_guowu_basic') < 1) || (type == "trick" && player.countMark('cxm_guowu_trick') < 1);
				},
				check(event, player) {
					if (get.tag({ name: event.card.name }, "norepeat")) {
						return false;
					}
					return true;
				},
				content() {
					if (get.type(trigger.card) == "basic") player.addMark('cxm_guowu_basic', 1);
					if (get.type(trigger.card) == "trick") player.addMark('cxm_guowu_trick', 1);
					var card = game.createCard(trigger.card.name, trigger.card.suit, trigger.card.number, trigger.card.nature);
					player.useCard(card, (trigger._targets || trigger.targets).slice(0));
				},
				onremove: function (player) {
					player.unmarkSkill("cxm_guowu_basic");
					delete player.storage.cxm_guowu_basic;
					player.unmarkSkill("cxm_guowu_trick");
					delete player.storage.cxm_guowu_trick;
				},
				sub: true,
				parentskill: "cxm_guowu",
				sourceSkill: "cxm_guowu",
			},
		},
	},
	"cxm_zhuangrong": {
		trigger: {
			global: "phaseEnd",
		},
		audio: "ext:鸽府包/audio/skill:2",
		derivation: ['cxm_shenwei', 'cxm_wushuang'],
		forced: true,
		juexingji: true,
		skillAnimation: true,
		animationColor: "gray",
		filter(event, player) {
			return player.hp == 1 || player.countCards("h") == 1;
		},
		content() {
			"step 0"
			player.awakenSkill(event.name);
			"step 1";
			if (player.maxHp > player.hp) {
				player.recover(player.maxHp - player.hp);
			}
			"step 2"
			player.drawTo(player.maxHp);
			player.addSkills(["cxm_shenwei", "cxm_wushuang"]);
		},
		"_priority": 0,
	},
	"cxm_shenwei": {
		trigger: {
			player: "phaseDrawBegin2",
		},
		audio: "ext:鸽府包/audio/skill:2",
		forced: true,
		filter: event => !event.numFixed,
		content() {
			"step 0"
			player.chooseControlList(["令你本回合摸牌阶段额定摸牌数 + 1且本回合手牌上限 + 3；本回合结束时，你摸一张牌", "令你本回合摸牌阶段额定摸牌数 + 2且本回合手牌上限 + 2", "令你本回合摸牌阶段额定摸牌数 + 3且本回合手牌上限 + 1；本回合结束时，你弃置一张牌"], true).set("ai", function (event, player) {
				return 2;
			});
			"step 1"
			if (result.index == 0) {
				trigger.num += 1;
				player.storage.cxm_shenwei = 3;
				player.addTempSkill('cxm_shenwei_a');
			} 
			if (result.index == 1) {
				trigger.num += 2;
				player.storage.cxm_shenwei = 2;
			} 
			if (result.index == 2) {
				trigger.num += 3;
				player.storage.cxm_shenwei = 1;
				player.addTempSkill('cxm_shenwei_b');
			} 
		},
		mod: {
			maxHandcard: (player, num) => num + player.countMark('cxm_shenwei'),
		},
		subSkill: {
			a: {
				trigger: {
					player: "phaseEnd",
				},
				forced: true,
				charlotte: true,
				content() {
					player.draw();
				},
				sub:true,
			},
			b: {
				trigger: {
					player: "phaseEnd",
				},
				forced: true,
				charlotte: true,
				content() {
					player.chooseToDiscard(true);
				},
				sub: true,
			},
		},
	},
	"cxm_wushuang": {
		trigger: {
			source: "damageBegin1",
		},
		audio: "ext:鸽府包/audio/skill:2",
		filter(event, player) {
			const target = event.player;
			const evtx = event.getParent(2);
			const card = event.card;
			const name = card?.name;
			if (!card || !["sha", "juedou"].includes(name)) {
				return false;
			}
			if (name == "sha") {
				return !target.hasHistory("useCard", evt => {
					return evt.card.name == "shan" && evt.respondTo && evt.getParent(3) == evtx;
				});
			}
			return !target.hasHistory("respond", evt => {
				return evt.card.name == "sha" && evt.respondTo && evt.getParent(3) == evtx;
			});
		},
		forced: true,
		logTarget: "player",
		usable: 1,
		content() {
			trigger.num++;
		},
		group: ["cxm_wushuang_1", "cxm_wushuang_2"],
		preHidden: ["cxm_wushuang_1", "cxm_wushuang_2"],
		subSkill: {
			"1": {
				sourceSkill: "cxm_wushuang",
				sub: true,
				parentskill: "cxm_wushuang",
				trigger: {
					player: "useCardToPlayered",
				},
				forced: true,
				filter(event, player) {
					return event.card.name == "sha" && !event.getParent().directHit.includes(event.target);
				},
				logTarget: "target",
				async content(event, trigger, player) {
					const id = trigger.target.playerid;
					const map = trigger.getParent().customArgs;
					if (!map[id]) {
						map[id] = {};
					}
					if (typeof map[id].shanRequired == "number") {
						map[id].shanRequired++;
					} else {
						map[id].shanRequired = 2;
					}
				},
				ai: {
					"directHit_ai": true,
					skillTagFilter(player, tag, arg) {
						if (arg.card.name != "sha" || arg.target.countCards("h", "shan") > 1) {
							return false;
						}
					},
				},
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: "useCardToPlayered",
					target: "useCardToTargeted",
				},
				forced: true,
				logTarget(trigger, player) {
					return player == trigger.player ? trigger.target : trigger.player;
				},
				filter(event, player) {
					return event.card.name == "juedou";
				},
				async content(event, trigger, player) {
					const id = (player == trigger.player ? trigger.target : trigger.player)["playerid"];
					const idt = trigger.target.playerid;
					const map = trigger.getParent().customArgs;
					if (!map[idt]) {
						map[idt] = {};
					}
					if (!map[idt].shaReq) {
						map[idt].shaReq = {};
					}
					if (!map[idt].shaReq[id]) {
						map[idt].shaReq[id] = 1;
					}
					map[idt].shaReq[id]++;
				},
				ai: {
					"directHit_ai": true,
					skillTagFilter(player, tag, arg) {
						if (arg.card.name != "juedou" || Math.floor(arg.target.countCards("h", "sha") / 2) > player.countCards("h", "sha")) {
							return false;
						}
					},
				},
				sourceSkill: "cxm_wushuang",
				parentskill: "cxm_wushuang",
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gf_damage": {
	trigger: {
		source: ['damageBefore', 'damageCancelled', 'damageZero','damageAfter'],
	},
	popup: false,
	silent: true,
	firstDo: true,
	forced: true,
	persevereSkill: true,
	charlotte: true,
	filter: function (event, player) {
		return player.name == 'gf_pg' || player.name == 'wzzs_aesdd';
	},
	async content(event, trigger, player) {
		if (event.triggername == 'damageBefore') {
			trigger.cancel = () => { };
			player.storage.gf_damage = trigger.num;
			player.syncStorage("gf_damage");
		} else {
			trigger.cancel = () => { };
			if (event.triggername == "damageCancelled") {
				trigger.player.damage(player.countMark("gf_damage"), "nosource");	
			}
		}
	},
	group: "gf_damage_a",
	subSkill: {
		a: {
			trigger: {
				source: ['damageBegin4'],
			},
			popup: false,
			silent: true,
			lastDo: true,
			forced: true,
			persevereSkill: true,
			charlotte: true,
			priority: 999,
			filter: function (event, player) {
				return player.name == 'gf_pg' || player.name == 'wzzs_aesdd';
			},
			async content(event, trigger, player) {
				trigger.cancel = () => { };
				if (event.triggername == "damageCancelled") {
					trigger.player.damage(player.countMark("gf_damage"), "nosource");	
				}
				for (var i of trigger.change_history) {
					if (i < 0) {
						trigger.num = player.countMark("gf_damage");
					}
				}
			},
			sub: true,
		},
	},
},

	"gf_card": {
		trigger: {
			player: ['useCardToBefore','useCardBefore', 'useCard'],
		},
		popup: false,
		silent: true,
		firstDo: true,
		forced: true,
		persevereSkill: true,
		charlotte: true,
		filter: function (event, player) {
		    return player.name == 'gf_pg' || player.name == 'wzzs_aesdd' || player.name == 'aqcs_lyjd';
		},
		async content(event, trigger, player) {
			if (!player.hasSkill('gf_card_a')) player.addSkill('gf_card_a');
			if (event.triggername == 'useCardToBefore') {
				trigger.cancel = () => { };
			}
			if (event.triggername == 'useCard') {
				trigger.cancel = () => { };
				trigger.directHit.addArray(game.filterPlayer());
			} else if (event.triggername == 'useCardBefore'){
				const originalTargets = [...trigger.targets];
				player.storage.gf_card = [];//xxx
				player.storage.gf_card.add(originalTargets);//xxx
				if (originalTargets.length === 0) return;
				const originalTargetRemove = trigger.targets.remove;
				trigger.targets.remove = function (target) {
					if (originalTargets.includes(target)) {
						return;
					}
					return originalTargetRemove.call(this, target);
				};
				const parentTrigger = trigger.getParent();
				if (parentTrigger && parentTrigger.triggeredTargets2) {
					const originalParentRemove = parentTrigger.triggeredTargets2.remove;
					parentTrigger.triggeredTargets2.remove = function (target) {
						if (originalTargets.includes(target)) {
							return;
						}
						return originalParentRemove.call(this, target);
					};
				}
				const originalUntrigger = trigger.untrigger;
			}
		},
		subSkill: {
			a: {
				trigger: {
					player: ['useCardToTargeted'],
				},
				popup: false,
				silent: true,
				lastDo: true,
				forced: true,
				persevereSkill: true,
				charlotte: true,
				filter: function (event, player) {
					return player.name == 'gf_pg' || player.name == 'wzzs_aesdd';
				},
				async content(event, trigger, player) {
					if (event.triggername == 'useCardToTargeted') {
						const originalTargets = [...trigger.targets];
						const parentExcluded = trigger.getParent().excluded;
						originalTargets.forEach(target => {
							if (parentExcluded.remove) {
								parentExcluded.remove(target);
							} else if (parentExcluded.delete) {
								parentExcluded.delete(target);
							}
						});
					}
				},
				sub:true,
			},
		},
	},
	"gf_phase": {
		trigger: {
			player: ['phaseSkipped', 'phaseCancelled', 'phaseDrawSkipped', 'phaseDrawCancelled', 'phaseUseSkipped', 'phaseUseCancelled'],
		},
		popup: false,
		silent: true,
		firstDo: true,
		forced: true,
		persevereSkill: true,
		charlotte: true,
		filter: function (event, player) {
		    return player.name == 'gf_pg' || player.name == 'wzzs_aesdd';
		},
		async content(event, trigger, player) {
			if (player.hasSkill('gf_phase_a')) {
				if (event.triggername == 'phaseSkipped' || event.triggername == 'phaseCancelled') { 
					player.gainMaxHp();
					player.recover();
				}
				player.removeSkill('gf_phase_a');
			} else {
				if (event.triggername == 'phaseSkipped' || event.triggername == 'phaseCancelled') {
					player.insertPhase(event.name);
					player.addTempSkill('gf_phase_a');
				}
			}
			if (player.hasSkill('gf_phase_b')) {
				if (event.triggername == 'phaseDrawSkipped' || event.triggername == 'phaseDrawCancelled') {
					player.gainMaxHp();
					player.recover();
				}
				player.removeSkill('gf_phase_b');
			} else {
				if (event.triggername == 'phaseDrawSkipped' || event.triggername == 'phaseDrawCancelled') {
					const next = player.phaseDraw();
					await event.next.remove(next);
					await trigger.next.push(next);
					player.addTempSkill('gf_phase_b');
				}
			}
			if (player.hasSkill('gf_phase_c')) {
				if (event.triggername == 'phaseUseSkipped' || event.triggername == 'phaseUseCancelled') {
					player.gainMaxHp();
					player.recover();
				}
				player.removeSkill('gf_phase_c');
			} else {
				if (event.triggername == 'phaseUseSkipped' || event.triggername == 'phaseUseCancelled') {
					const next = player.phaseUse();
					await event.next.remove(next);
					await trigger.next.push(next);
					player.addTempSkill('gf_phase_c');
				}
			}
		},
		subSkill: {
			a: {
				sub: true,
			},
			b: {
				sub: true,
			},
			c: {
				sub: true,
			},
		},
	},
	"gf_hp": {
		trigger: {
			player: ['loseMaxHpBefore', 'loseHpBefore'],
		},
		filter: function (event, player) {
		    return player.name == 'gf_pg' || player.name == 'wzzs_aesdd';
		},
		popup: false,
		silent: true,
		firstDo: true,
		forced: true,
		persevereSkill: true,
		charlotte: true,
		async content(event, trigger, player) {
			player.update();
			trigger.untrigger();
			trigger.finish();
		},
	},
	"gf_tiemian": {
		trigger: {
			player: 'damageBegin3',
		},
		derivation: ['gf_hp', 'gf_phase', 'gf_damage', 'gf_card'],
		forced: true,
		lastDo: true,
		filter(event) {
			return event.num > 1 || !event.card;
		},
		async content(event, trigger, player) {
			player.update();
			trigger.untrigger();
			trigger.finish();
			game.broadcastAll(function (player) {
				game.playAudio(`../extension/鸽府包/audio/skill/gf_duanan${[4, 7].randomGet()}.mp3`);
			}, player);
		},
		group: ['gf_hp', 'gf_phase', 'gf_damage', 'gf_card', 'gf_card_a'],
	},
	"gf_duanan": {
		init(player) {
			game.broadcastAll(function (player) {
				game.GF_mp4('鸽判官');
				game.playAudio(`../extension/鸽府包/audio/skill/gf_duanan7.mp3`);
			}, player); //判官动画
		},
		mark: true,
		marktext: "断",
		intro: {
			name: "断案",
			content(err, player) {
				return `任意角色回合内使用的牌数不小于【${player.countMark('gf_duanan') + player.hp}】时，其本回合不可再使用牌`
			},
			markcount(err, player) {
				return `${player.countMark('gf_duanan') + player.hp}`
			},
		},
		trigger: {
			player: ["phaseBegin", "changeHpEnd"],
			global: "useCardEnd",
		},
		filter(event, player, name) {
			if (event.player == player) {
				if (name != 'changeHpEnd') {
					return player == _status.currentPhase;
				} else {
					return true;
				}
				return event.player == _status.currentPhase;
			} else {
				return event.player == _status.currentPhase && name == 'useCardEnd';
			}
		},
		async cost(event, trigger, player) {
			event.count = 0;
			player.countCards("h") && !player.hasCard(card => {
				if (player.hasUseTarget(card, true, true)) event.count++;
			});
			if (event.triggername != 'useCardEnd') {
				event.count++;
				if (event.triggername == 'phaseBegin') {
					player.storage.gf_duanan = 0;
					player.syncStorage("gf_duanan");
				}
			} else {
				if (trigger.player == player) {
					player.addMark("gf_duanan", 1);
				}
				if (trigger.player.countUsed() >= player.countMark('gf_duanan') + player.hp) {
					trigger.player.addTempSkill("gf_duanan_a");
					game.broadcastAll(function (player) {
						game.playAudio(`../extension/鸽府包/audio/skill/gf_duanan${[5, 6].randomGet()}.mp3`);
					}, player);
				}
			}
			if (event.count < 1 && player == _status.currentPhase) {
				event.result = await player
					.chooseTarget(`${get.translation("gf_duanan")}：是否对一名其他角色造成其体力上限除以4（向上取整）点伤害？`, function (card, player, target) {
						return target != player;
					})
					.set("ai", function (target) {
						let att = get.attitude(_status.event.player, target);
						return att < 0;
					})
					.forResult();
			}
		},
		async content(event, trigger, player) {
		player.GFVideo("d", "判官电流");
			game.broadcastAll(function (player) {
				// game.GF_mp4('鸽判官');
				game.playAudio(`../extension/鸽府包/audio/skill/gf_duanan${[1, 2, 3].randomGet()}.mp3`);
			}, player);
			const target = event.targets[0], num = Math.ceil(target.maxHp / 4);
			await target.damage(num);
		},
		subSkill: {
			a: {
				mod: {
					cardEnabled(card, player) {
						if (_status.currentPhase == player) {
							return false;
						}
					},
				},
				sub:true,
			},
		},
	},
	"cxm_juyi": {
		enable: 'phaseUse',
		usable: 1,
		selectTarget: 1,
		filterTarget: true,
		content: function () {
			"step 0"
			player.storage.cxm_juyi = [];
			player.syncStorage("cxm_juyi");
			event.num = 0, event.count = 0, event.count2 = 0, event.count3 = target.countCards('hej');
			var targets = game.filterPlayer();
			targets.sort(lib.sort.seat);
			event.targets = targets;
			"step 1"
			for (var i = 0; i < targets.length; i++) {
				if (event.count < 1) {
					event.num++;
					event.count4++;
				}
				if (targets[i] == target) {
					event.count++;
				}
			}
			event.count4 = event.num;
			"step 2"
			if (num < event.targets.length) {
				player.line(event.targets[num], 'green');
				event.targets[num].chooseControl().set('choiceList', [
					'令【' + get.translation(target) + '】摸一张牌',
					'获得【' + get.translation(target) + '】一张牌',
				]).set('ai', () => get.attitude(event.targets[num], player) < 0 ? 1 : 0);
			} else {
				event.goto(4);
			}
			"step 3"
			if (result.index == 0) {
				target.draw();
				player.markAuto("cxm_juyi", event.targets[num]);
			} else {
				if (target.countCards('he') > 0) {
					event.targets[num].gainPlayerCard(target, "he", true);
				}
			}
			event.num++;
			event.goto(2);
			"step 4"
			if (event.count2 < event.count4) {
				if (event.targets[event.count2] == target && target != player) {} else {
					player.line(event.targets[event.count2], 'green');
					event.targets[event.count2].chooseControl().set('choiceList', [
						'令【' + get.translation(target) + '】摸一张牌',
						'获得【' + get.translation(target) + '】一张牌',
					]).set('ai', () => get.attitude(event.targets[event.count2], player) < 0 ? 0 : 1);
				}
			} else {
				var list = game.filterPlayer();
				if (event.count3 > target.countCards('hej')) {
					target.damage();
				}
				for (var i = 0; i < list.length; i++) {
					if (event.count3 < target.countCards('hej')) {
						if (player.getStorage("cxm_juyi").includes(list[i])) {
							list[i].recover();
							player.line(list[i], 'green');
						}
					}
					if (event.count3 > target.countCards('hej')) {
						if (player.getStorage("cxm_juyi").includes(list[i])) {
							list[i].damage();
							player.line(list[i], 'green');
						}
					}
				}
				event.finish();
			}
			"step 5"
			if (result.index == 0) {
				target.draw();
				player.markAuto("cxm_juyi", event.targets[event.count2]);
			}
			if (result.index == 1) {
				if (target.countCards('he') > 0) {
					event.targets[event.count2].gainPlayerCard(target, "he", true);
				}
			}
			event.count2++;
			event.goto(4);
		},
		ai: {
			order: 11,
			result: {
				target: -1,
			},
			threaten: 2,
		},
	},
	"seh_yeying": {
		trigger: {
			player: ["phaseBegin", "phaseJieshu"],
		},
		frequent: true,
		content: function () {
			if (event.triggername == 'phaseBegin') {
				player.storage.seh_yeying = player.hp;
				player.syncStorage("seh_yeying");
				player.recover(player.getDamagedHp());
			} else {
				var a = player.countMark('seh_yeying'), b = player.hp;
				player.changeHp(a - b);
			}
		},
	},
	"seh_mimeng": {
		trigger: {
			player: ["changeHpBefore", "changeHpAfter"],
		},
		frequent: true,
		content: function () {
			if (event.triggername == 'changeHpBefore') {
				player.storage.seh_mimeng = player.hp;
				player.syncStorage("seh_mimeng");
			} else {
				var a = player.countMark('seh_mimeng'), b = player.hp;
				if (a > b) {
					player.draw(a - b);
				} else if (a < b) {
					player.draw(b - a);
				}
			}
		},
	},
	"seh_huanshi": {
		trigger: {
			player: "damageBefore",
		},
		frequent: true,
		filter: function (event, player) {
			return player.hp > 3 || (player.hp < 3 && event.num > 1);
		},
		content: function () {
			if (player.hp > 3) trigger.num++;
			if (player.hp < 3) trigger.num = 1;
		},
	},
	"gzhlb_leizhen": {
		trigger: {
			global: ["dieBegin", "damageBefore", "damageBegin"],
		},
		frequent: true,
		filter: function (event, player, name) {
			if (event.player.name != 'gzhlb_kuilei_lei') return false;
			if (name == 'dieBegin' || name == 'damageBegin') {
				return true;
			}
			if (name == 'damageBefore') {
				return !event.card;
			}
		},
		content: function () {
			"step 0"
			if (event.triggername == 'damageBefore') {
				trigger.cancel();
			}
			if (event.triggername == 'damageBegin') {
				trigger.num = 1;
			}
			if (event.triggername == 'dieBegin') {
				trigger.player.chooseTarget(get.prompt('gzhlb_leizhen'), "是否令一名其他角色弃置任意张牌并使用等量张牌，然后若其使用牌数小于弃置牌数，其摸两者差值张牌？", function (card, player, target) {
					return target != trigger.player;
				}).set("ai", target => get.attitude(_status.event.player, target));
			} else {
				event.finish();
			}
			"step 1"
			if (result.bool && result.targets && result.targets.length) {
				result.targets[0].chooseToDiscard('he', [1, Infinity]).set('ai', function (card) {
					return 8 - get.value(card);
				});
				event.target = result.targets[0];
			} else {
				event.finish();
			}
			"step 2"
			if (result.bool) {
				event.count = result.cards.length;
			} else {
				event.finish();
			}
			"step 3"
			if (event.count > 0) {
				event.count--;
				event.target.chooseToUse("儡阵：是否使用一张牌？（还可使用【" + (event.count + 1) + "】张牌）");
			}
			"step 4"
			if (event.count > 0 && result.bool) {
				event.goto(3);
			} else {
				if (event.count > 0) event.target.draw(event.count + 1);
			}
		},
	},
	//感谢御.sky提供的代码支持（生成傀儡并他们），致敬
	gzhlb_kuilei: {
		group: ["gzhlb_kuilei_summon", "gzhlb_kuilei_view"],
		global: ["gzhlb_kuilei_Kuilei_auto"],
		subSkill: {
			Kuilei_auto: {
				trigger: {
					player: ['playercontrol', 'chooseToUseBegin', 'chooseToRespondBegin', 'chooseToDiscardBegin', 'chooseToCompareBegin',
						'chooseButtonBegin', 'chooseCardBegin', 'chooseTargetBegin', 'chooseCardTargetBegin', 'chooseControlBegin',
						'chooseBoolBegin', 'choosePlayerCardBegin', 'discardPlayerCardBegin', 'gainPlayerCardBegin',
						'dieAfter']
				},
				firstDo: true,
				forced: true,
				priority: 999,
				forceDie: true,
				charlotte: true,
				popup: false,
				silent: true, //mode:['identity', 'guozhan', 'doudizhu', 'connect'],
				filter: function (event, player) {
					if (!_status.Kuilei_auto || !_status.Kuilei_auto.includes(player.playerid)) return false;
					if (event.autochoose && event.autochoose()) return false;
					//if (lib.filter.wuxieSwap(event)) return false;
					return true;
				},
				async content(event, trigger, player) {
					if (trigger.name == 'die') {
						const map = lib.playerOL ?? game.playerMap;
						for (const id of _status.Kuilei_auto) {
							const current = map[id];
							if (current.isAlive() && current != player) {
								game.broadcastAll((Kuilei) =>{
									if (game.me.playerid != Kuilei.playerid) return;
									let evt = _status.event.getParent("chooseToUse")
									if (!evt) return;
									evt.endButton?.close();
									delete evt.endButton;
									ui.exit?.close();
									evt.fakeforce = false;
								}, player)
								if (_status.connectMode) {
									game.gf_swapPlayerOL(player, current);
								} else {
									game.swapPlayerAuto(current);
								};
								break;
							};
						};
						return;
					}
					if (!player.isAlive()) return;
					if (_status.Kuilei_auto.includes(player.playerid) && (_status.connectMode ? (!player.isOnline2() || player != game.me) : true)) {
						const map = lib.playerOL ?? game.playerMap;
						for (const id of _status.Kuilei_auto) {
							const current = map[id];
							if (_status.connectMode) {
								if ((current.isOnline2() || current == game.me) && current != player) {
									game.gf_swapPlayerOL(current, player);
									break;
								};
							} else if (current == game.me && !_status.auto) {
								game.swapPlayerAuto(player);
							};
						};
					}
				},
			},
			view: {
				nopop:true,
				charlotte: true,
				ai: {
					viewHandcard: true,
					skillTagFilter(player, tag, arg) {
						if (player == arg) {
							return false;
						}
						if (!_status.Kuilei_auto || !_status.Kuilei_auto.length) return false;
						if (_status.Kuilei_auto.includes(player.playerid) && _status.Kuilei_auto.includes(arg.playerid)) {
							return true;
						};
						return false;
					},
				},
			},
			summon: {
				locked: true,
				forced: true,
				forceDie: true,
				priority:11,
				enable: 'phaseUse',
				usable: 1,
				filter: function () {
					var a = game.countPlayer(function (current) {
						return current.name == 'gzhlb_kuilei_lei';
					});
					return a < Math.ceil(game.countPlayer() / 2);
				},
				async content(event, trigger, player) {
					const pos = player;
					pos.clearMark("gzhlb_kuilei")
					if (!get.attitude_gzhlb_kuilei) {
						get.attitude_gzhlb_kuilei = get.attitude;
						get.attitude = function (from, to) {
							if (from && from?.getStorage("gzhlb_kuilei_source", false)) {
								from = from.getStorage("gzhlb_kuilei_source", false);
							}
							if (to && to?.getStorage("gzhlb_kuilei_source", false)) {
								to = to.getStorage("gzhlb_kuilei_source", false);
							}
							let att = get.attitude_gzhlb_kuilei(from, to);
							return att;
						};
					}
					const Kuilei = game.addPlayerOL(pos, "gzhlb_kuilei_lei", null, true);
					Kuilei.isNoPlayer_gzhlb_kuilei = true;
					Kuilei.hp = 1;
					Kuilei.maxHp = 1;
					game.broadcastAll(function (Kuilei) {
						Kuilei.node.avatar.setBackgroundImage(`../extension/鸽府包/image/character/stand/gzhlb_kuilei_lei.jpg`);
					}, Kuilei);
					Kuilei.dieAfter2 = function () { };
					Kuilei.setStorage("gzhlb_kuilei_source", player);
					Kuilei.ai.modAttitudeFrom = function (from, to, att) {
						if (_status.gzhlb_kuilei_source_att_ing) return att;
						if (from.getStorage("gzhlb_kuilei_source", false)) {
							from = from.getStorage("gzhlb_kuilei_source", false);
						}
						if (to.getStorage("gzhlb_kuilei_source", false)) {
							to = to.getStorage("gzhlb_kuilei_source", false);
						}
						_status.gzhlb_kuilei_source_att_ing = true;
						att = get.attitude(from, to);
						delete _status.gzhlb_kuilei_source_att_ing;
						return att;
					};
					Kuilei.directgain(get.cards(4));
					Kuilei.addSkill("gzhlb_kuilei_view")
					Kuilei
						.when({ global: "dieAfter" })
						.filter((evt, player2) => {
							if (evt.reserveOut) return false;
							return  evt.player == player2;
						})
						.assign({
							forceDie: true,
						})
						.step(lib.skill[event.name].dieRemove);
					game.broadcastAll(function (player, Kuilei) {
						if (!_status.Kuilei_auto) {
							_status.Kuilei_auto = [player.playerid, Kuilei.playerid];
						}
						else {
							_status.Kuilei_auto.push(Kuilei.playerid)
						}
						Kuilei._trueMe = player;
						player._trueMe = player;
					}, player, Kuilei)
					game.log(player, '召唤了', lib.translate['gzhlb_kuilei_lei']);
				},
				async dieRemove(event, trigger, player) {
					const findTargetControlPlayer = () => {
						const allPlayers = game.filterPlayer();
						const kuileiSource = allPlayers.find(p => p.hasSkill("gzhlb_kuilei") && p.isAlive());
						if (kuileiSource) return kuileiSource;
						const aliveKuilei = game.players.filter(p => p.isNoPlayer_gzhlb_kuilei && p.isAlive());
						if (aliveKuilei.length > 0) {
							return aliveKuilei[Math.floor(Math.random() * aliveKuilei.length)];
						}
						return null;
					};

					if (_status.connectMode) {
						const targetPlayer = findTargetControlPlayer();
						if (targetPlayer && game.me) {
						game.gf_swapPlayerOL(game.me, targetPlayer);
						game.log(`傀儡死亡，已切换控制权至：${targetPlayer.nickname || targetPlayer.playerid}`);
						} else {
						game.log("傀儡死亡，无可用的操控对象，判定为真死亡");
						}
					}
					game.broadcastAll(function (Kuilei) {
						if (_status.Kuilei_auto)_status.Kuilei_auto.remove(Kuilei.playerid)
					}, player)
					if (_status.roundStart == player) _status.roundStart = player.next;
					if (lib.playerOL) delete lib.playerOL[player.playerid];
					game.broadcastAll(player => {
						game.players.remove(player);
						game.dead.remove(player);
						if (player.seatNum == 1) player.nextSeat.setSeatNum(1);
						player.nextSeat.previousSeat = player.previousSeat;
						player.previousSeat.nextSeat = player.nextSeat;
						player.delete();
						player.removed = true;
						setTimeout(() => player.removeAttribute("style"), 500);
					}, player);
					game.broadcastAll(() => {
						ui.arena.setNumber(game.players.concat(game.dead).length);
						let SeatNumStart = game.players.concat(game.dead).find(current => current.seatNum == 1);
						let pos = 0,
						target = game.me.nextSeat;
						for (let x = 0; x < game.countPlayer2(null, true); x++) {
						if (target == game.me) break;
						pos++;
						target.dataset.position = pos;
						target = target.nextSeat;
						}
						if (SeatNumStart) {
						let SeatNum = 1,
							Seat = SeatNumStart;
						for (let i = 0; i < game.countPlayer2(null, true); i++) {
							SeatNum++;
							Seat = Seat.nextSeat;
							if (Seat == SeatNumStart) break;
							Seat.setSeatNum(SeatNum);
						}
						}
					});
				},
			},
		},
		nobracket: true,
		locked: true,
		charlotte: true,
		unique: true,
		forced: true,
		priority: 12452,
		unique: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return (event.name != "phase" || game.phaseNumber == 0);
		},
		async content(event, trigger, player) {
			if (!_status.gzhlb_kuilei) {
				if (!game.checkResult_gzhlb_kuilei) {
					game.checkResult_gzhlb_kuilei = game.checkResult;
					game.checkResult = function () {
						const all = game.players.concat(game.dead);
						const origin_Kuilei = all.filter(i => i.hasSkill("gzhlb_kuilei"))[0];
						if (!origin_Kuilei.origin_isAlive) {
							origin_Kuilei.origin_isAlive = origin_Kuilei.isAlive
						}
						origin_Kuilei.isAlive = function () {
							if (game.players.includes(this)) {
								return true;
							}
							return this.origin_isAlive()
						}
						const isDead = !game.players.includes(origin_Kuilei);
						const targets = game.players.filter(i => i.isNoPlayer_gzhlb_kuilei);
						const hasRemain = game.players.some(i => i.isNoPlayer_gzhlb_kuilei);
						game.players.removeArray(targets);
						game.log(isDead);
						game.log(hasRemain)
						if (isDead && hasRemain) game.players.add(origin_Kuilei);
						if (get.mode() == 'single') {
							game.checkResult_gzhlb_kuilei();
						}
						if (isDead && hasRemain) game.players.remove(origin_Kuilei);
						game.players.addArray(targets);
						origin_Kuilei.isAlive = origin_Kuilei.origin_isAlive;
					};
				}
				if (!game.checkOnlineResult_gzhlb_kuilei) {
					game.checkOnlineResult_gzhlb_kuilei = game.checkOnlineResult;
					game.checkOnlineResult = function (player) {
						const all = game.players.concat(game.dead);
						const origin_Kuilei = all.filter(i => i.hasSkill("gzhlb_kuilei"))[0];
						if (!origin_Kuilei.origin_isAlive) {
							origin_Kuilei.origin_isAlive = origin_Kuilei.isAlive
							origin_Kuilei.isAlive = function () {
								if (game.hasPlayer(i => i.isNoPlayer_gzhlb_kuilei)) return true;
								return this.origin_isAlive()
							}
						}
						const isDead = !game.players.includes(origin_Kuilei);
						const targets = game.players.filter(i => i.isNoPlayer_gzhlb_kuilei);
						const hasRemain = game.players.filter(i => i.isNoPlayer_gzhlb_kuilei);
						game.players.removeArray(targets);
						if (isDead && hasRemain) game.players.add(origin_Kuilei);
						if (get.mode() == 'single') {
							game.checkOnlineResult_gzhlb_kuilei();
						}
						if (isDead && hasRemain) game.players.remove(origin_Kuilei);
						game.players.addArray(targets);
						origin_Kuilei.isAlive = origin_Kuilei.origin_isAlive;
					};
				}
				game.broadcastAll(() => {
					_status.gzhlb_kuilei = true;
				})
			}
		},
	},
	"gf_gongxi": {
		mark: true,
		init: function (player) {
			player.storage.gf_gongxi = 0;
		},
		intro: {
			name: "共喜",
			content: function (storage, event, player) {
				event.count1 = 0;
				event.count2 = 0;
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].countMark('gf_gongxi_1')) {
						event.count1 += 4;
					}
					if (list[i].countMark('gf_gongxi')) {
						event.count2 += list[i].countMark('gf_gongxi');
					}
				}
				if (event.count2 > event.count1) {
					var b = event.count1;
				} else {
					var b = event.count2;
				}
				if (event.count1 > 0) {
					var a = event.count1;
					return '已获得牌数：(' + b + '/' + a + ')';
				}
			},
		},
		enable: "phaseUse",
		usable: 2,
		prompt: "你可以选择1~2张牌，若你选择了1张牌且本回合未选择自己，则你可以选择自己为目标；若为2张牌，你可以选择一名本回合未选择过的其他角色为目标，然后令其恢复1点体力并获得〖共喜②〗，若目标未受伤，则改为获得1点护甲并获得〖共喜②〗。",
		filter: function (event, player) {
			return player.countCards('h') > 0;
		},
		filterCard: true,
		selectCard: [1, 2],
		complexSelect: true,
		complexCard: true,
		filterTarget: function (card, player, target) {
			if (ui.selected.cards.length < 2) {
				if (player != target) return false;
				return !target.hasSkill('gf_gongxi_4');
			} else {
				if (player == target) return false;
				return !target.hasSkill('gf_gongxi_4');
			}
		},
		check: function (card) {
			return 6 - get.value(card);
		},
		content: function () {
			'step 0'
			target.addTempSkill('gf_gongxi_4');
			if (target.hp >= target.maxHp && target.hujia < 5) {
				target.changeHujia();
			} else {
				target.recover();
			}
			'step 1'
			if (target.countMark('gf_gongxi_1') < 1) {
				target.addMark('gf_gongxi_1', 1);
			}
		},
		ai: {
			order: 9,
			result: {
				target: function (player, target) {
					if (target.hp == 1) return 5;
					if (player == target && player.countCards('h') > player.hp) return 5;
					return 2;
				},
			},
			expose: 0.4,
			threaten: 1.25,
		},
		"_priority": 0,
		group: ["gf_gongxi_1", "gf_gongxi_2", "gf_gongxi_3"],
		subSkill: {
			"1": {
				intro: {
					name: "共喜",
					content: "当其他角色得到牌后，若其拥有〖共喜②〗，你摸1张牌",
				},
				init: function (player) {
					player.storage.gf_gongxi_1 = 1;
				},
				trigger: {
					global: "gainAfter",
				},
				frequent: true,
				filter: function (event, player) {
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].countMark('gf_gongxi_1')) {
							event.count += 4;
						}
						if (list[i].countMark('gf_gongxi') > 0) {
							event.count -= list[i].countMark('gf_gongxi');
						}
					}
					if (event.count <= 0 || event.player.countMark('gf_gongxi_1') < 1) return false;
					return event.getParent(2).name != 'gf_gongxi_1';
				},
				content: function () {
					event.count = 0;
					var list1 = game.filterPlayer();
					for (var i = 0; i < list1.length; i++) {
						if (list1[i].countMark('gf_gongxi_1')) {
							event.count += 4;
						}
					}
					var list2 = game.filterPlayer();
					for (var i = 0; i < list2.length; i++) {
						if (list2[i] != trigger.player && list2[i].countMark('gf_gongxi_1') > 0 &&
							event.count > player.countMark('gf_gongxi')) {
							list2[i].draw();
							player.addMark('gf_gongxi', 1);
						}
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					global: "recoverBegin",
				},
				popup: false,
				silent: true,
				forced: true,
				filter: function (event, player) {
					return event.player.countMark('gf_gongxi_1') > 0 && event.player != player;
				},
				content: function () {
					trigger.player.removeMark('gf_gongxi_1', 1);
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				trigger: {
					global: "roundStart",
				},
				forced: true,
				silent: true,
				popup: false,
				filter: function (event, player) {
					return player.countMark('gf_gongxi') > 0;
				},
				content: function () {
					player.removeMark('gf_gongxi', player.countMark('gf_gongxi'));
				},
				sub: true,
				"_priority": 0,
			},
			"4": {
				sub: true,
				"_priority": 0,
			},
		},
	},
	"gf_xiaoji": {
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		enable: "phaseUse",
		prompt: "你可以选择至多两名其他角色，然后除你选择的所有其他角色获得1点护甲，最后你获得3-x点护甲（x为你选择角色数），直到你下回合开始前或你死亡：当其他角色恢复体力时，改为摸1张牌。",
		filterTarget: function (card, player, target) {
			return player != target;
		},
		selectTarget: [0, 2],
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		content: function () {
			'step 0'
			if (player.countMark('gf_xiaoji') < 1) {
				player.addMark('gf_xiaoji', 1);
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].hujia < 5 && list[i] != player && list[i] != targets[1] && list[i] != targets[0]) {
						list[i].changeHujia();
						player.line(list[i], 'green');
					}
				}
			}
			'step 1'
			if (player.hujia + 3 - targets.length < 5) {
				player.changeHujia(3 - targets.length);
			} else {
				if (player.hujia < 5) {
					player.changeHujia(5 - player.hujia);
				}
			}
			player.awakenSkill('gf_xiaoji');
			player.addSkill('gf_xiaoji_1');
			player.addSkill('gf_xiaoji_2');
		},
		ai: {
			order: 11,
			result: {
				player: 0.5,
				target: -1,
			},
			expose: 0.4,
			threaten: 1.5,
		},
		subSkill: {
			"1": {
				mark: true,
				intro: {
					name: "销迹",
					content: "当其他角色恢复体力时，改为摸1张牌。",
				},
				trigger: {
					global: "recoverBefore",
				},
				filter: function (event, player) {
					return event.player != player;
				},
				forced: true,
				content: function () {
					trigger.cancel();
					trigger.player.draw();
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: "phaseBefore",
				},
				forced: true,
				silent: true,
				popup: false,
				content: function () {
					'step 0'
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i] != player && list[i].countMark('gf_gongxi_1')) {
							event.count++;
						}
					}
					if (event.count > 0) {
						player.chooseTarget(get.prompt2('gf_xiaoji'),
							function (card, player, target) {
								return target != player && target.countMark('gf_gongxi_1');
							}).set('ai', function (target) {
								var att = get.attitude(_status.event.player, target);
								if (att < 0) return 10;
								return 5 - att;
							});
					}
					'step 1'
					if (result.bool) {
						var target = result.targets[0];
						event.target = target;
						target.removeMark('gf_gongxi_1', 1);
					}
					player.removeSkill('gf_xiaoji_1');
					player.removeSkill('gf_xiaoji_2');
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gf_zhengjia": {
		trigger: {
			global: "recoverBefore",
		},
		usable: 1,
		forced: true,
		content: function () {
			trigger.cancel();
			if (trigger.player.hujia < 5) {
				var a = 5 - trigger.player.hujia;
				if (a > trigger.num) {
					trigger.player.changeHujia(trigger.num);
				} else {
					trigger.player.changeHujia(a);
				}
			}
		},
		group: ["gf_zhengjia_1", "gf_zhengjia_2", "gf_zhengjia_3"],
		subSkill: {
			"1": {
				mark: true,
				intro: {
					content: "〖征甲〗还可使用#次",
				},
				init: function (player) {
					player.storage.gf_zhengjia = 2;
					player.markSkill("gf_zhengjia");
					player.syncStorage("gf_zhengjia");
				},
				trigger: {
					global: "phaseDrawBegin2",
				},
				frequent: true,
				filter: function (event, player) {
					if (player.countMark('gf_zhengjia_1') < 1) return false;
					return !event.numFixed;
				},
				content: function () {
					"step 0"
					if (trigger.player == player && player.hujia < 1) {
						player.chooseControl('获得护甲', 'cancel2',
							ui.create.dialog(get.prompt('gf_zhengjia'), 'hidden')).ai = function () {
								return 0;
							}
					} else {
						event.goto(2);
					}
					"step 1"
					if (result.control == '获得护甲') {
						trigger.num -= 2;
						player.changeHujia();
					} else {
						event.finish();
					}
					"step 2"
					if (trigger.player.hujia > 0) {
						player.chooseControl('额外摸牌', '减少摸牌', 'cancel2',
							ui.create.dialog(get.prompt('gf_zhengjia'), 'hidden')).ai = function () {
								var att = get.attitude(player, trigger.player);
								event.count = 0;
								var list = game.filterPlayer();
								for (var i = 0; i < list.length; i++) {
									if (list[i] != player && list[i].hasSkill('gf_gongxi_2')) {
										event.count++;
									}
								}
								if (list > 2) {
									if (event.count > 1) {
										if (att > 0 && trigger.player.hasSkill('gf_gongxi_2')) return 0;
										if (att < 0) return 2;
									}
									if (event.count > 0) {
										if (trigger.player = player && trigger.player.hasSkill('gf_gongxi_2')) return 0;
										if (att > 0 && trigger.player.hasSkill('gf_gongxi_2')) return 0;
										if (att < 0 && player.countMark('gf_zhengjia_1') > 1) return 1;
										if (att < 0 && player.countMark('gf_zhengjia_1') < 2) return 2;
									}
									if (event.count < 1) {
										if (trigger.player = player) return 0;
										if (att > 0) return 0;
										if (att < 0 && player.countMark('gf_zhengjia_1') > 1) return 1;
										if (att < 0 && player.countMark('gf_zhengjia_1') < 2) return 2;
									}
								} else {
									if (event.count > 0) {
										if (trigger.player = player) return 0;
										if (att > 0 && trigger.player.hasSkill('gf_gongxi_2')) return 0;
										if (att > 0 && player.countMark('gf_zhengjia_1') > 1) return 0;
										if (att < 0 && player.countMark('gf_zhengjia_1') > 1) return 1;
										if (att < 0 && player.countMark('gf_zhengjia_1') < 2) return 2;
									} else {
										if (att > 0) return 0;
										if (att < 0) return 1;
									}
								}
								return 2;
							}
					}
					"step 3"
					if (result.control == '额外摸牌') {
						trigger.num++;
						player.removeMark('gf_zhengjia_1', 1);
					}
					if (result.control == '减少摸牌') {
						if (trigger.num > 0) {
							trigger.num--;
							player.removeMark('gf_zhengjia_1', 1);
						}
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					global: "roundStart",
				},
				forced: true,
				silent: true,
				popup: false,
				filter: function (event, player) {
					return player.countMark('gf_zhengjia_1') < 2;
				},
				content: function () {
					player.addMark('gf_zhengjia_1', 2 - player.countMark('gf_zhengjia_1'));
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				usable: 1,
				filterTarget: true,
				enable: "phaseUse",
				filterCard: function (card) {
					return get.type(card) == 'equip';
				},
				selectCard: function () {
					return [0, 1];
				},
				content: function () {
					"step 0"
					if (cards.length == 0) {
						player.damage('player');
					}
					"step 1"
					player.draw();
					if (target.hujia < 5) {
						target.changeHujia();
						var att = get.attitude(player, target);
						if (att < 0 && target != player && !player.storage.gf_pojia) {
							target.addSkill('gf_zhengjia_4');
						}
					}
				},
				check: function (card) {
					return 10 - get.value(card);
				},
				ai: {
					order: 3.5,
					result: {
						player: function (player, target) {
							var att = get.attitude(player, target);
							if (player.hp < 2 && player.hujia < 2) {
								if (target = player) return 5;
							}
							if (player.storage.gf_pojia) {
								if (target = player) return 1;
							} else {
								if (player.hp > target && player.hujia > 0) {
									if (att > 0 && target.hujia < 5) {
										return 2;
									} else {
										if (player) return 4;
									}
								} else {
									if (player.hp > 1 && player.hujia > 1) {
										if (att > 0) return 2;
									} else {
										if (player) return 4;
									}
								}
								if (!player.hasFriend()) {
									if (player.hp > 1 && player.hujia > 1) return 3;
									if (player.hp < 2 && player.hujia < 1) return -5;
								}
							}
						},
						target: function (player, target) {
							var att = get.attitude(player, target);
							if (player.storage.gf_pojia) {
								if (att > 0) return 2;
								if (att < 0) return 2;
							} else {
								if (!player.hasFriend()) {
									var list = game.filterPlayer();
									for (var i = 0; i < list.length; i++) {
										if (player.hujia > 1) {
											var att2 = get.attitude(player, list[i]);
											if (att2 < 0) {
												if (list[i].hujia > 4) {
													return -0.2;
												}
												if (list[i].hujia > 3) {
													return -0.2;
												}
												if (list[i].hujia > 2) {
													return -0.2;
												}
												if (list[i].hujia > 1) {
													return -0.2;
												}
												if (list[i].hujia > 0) {
													return -1.5;
												}
											}
										}
									}
									if (att < 0) return -1;
								} else {
									if (att < 0 && target.hp >= target.hujia + 1) {
										if (att < 0) return -5.2;
									}
									if (att > 0 && target.hp < 3 && target.hujia < 2) {
										if (att > 0) return 0.5;
										if (att > 0 && target.hp < 2 && target.hujia < 1) {
											return 2.5;
										}
									}
								}
							}
						},
					},
				},
				sub: true,
				"_priority": 0,
			},
			"4": {
				trigger: {
					global: "dieBefore",
				},
				forced: true,
				silent: true,
				popup: false,
				filter: function (event, player) {
					return event.player.hasSkill('gf_zhengjia');
				},
				content: function () {
					player.removeSkill('gf_zhengjia_4');
				},
				ai: {
					threaten: 0.5,
					effect: {
						target: function (card, player, target) {
							if (!target.hujia) return;
							if (get.tag(card, 'damage')) {
								if (target.hasSkillTag('filterDamage', null, {
									player: player,
									card: card,
								})) return 'zerotarget';
								if (target.hujia) return -1;
							}
						},
					},
				},
				"_priority": 0,
				sub: true,
			},
		},
		"_priority": 0,
		intro: {
			content: "",
		},
	},
	"gf_pojia": {
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		mark: true,
		forced: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		trigger: {
			player: ["gf_pojia_1Begin", "gf_pojia_2Begin"],
		},
		content: function () {
			var list = game.filterPlayer();
			player.awakenSkill('gf_pojia');
			player.addMark('gf_pojia_Mark', 1);
			for (var i = 0; i < list.length; i++) {
				if (list[i] != player && list[i].hasSkill('gf_zhengjia_4')) {
					list[i].removeSkill('gf_zhengjia_4');
				}
			}
		},
		group: ["gf_pojia_1", "gf_pojia_2"],
		subSkill: {
			"1": {
				trigger: {
					player: "damageEnd",
				},
				"prompt2": function (event, player) {
					var a = event.source.hujia;
					if (a < 1) {
						var b = 1;
					} else {
						var b = a;
					}
					return '你可以对' + get.translation(event.source) + '造成【' + (1 + Math.floor(b / 2)) + '】点伤害并废除其防具栏，然后令其流失【' + b + '】点体力';
				},
				filter: function (event, player) {
					if (!event.source || event.source == player) return false;
					return player.countMark('gf_pojia_Mark') < 1;
				},
				check: function (event, player) {
					if (event.source.hujia > 0) {
						if (event.source.hp > event.source.hujia) return false;
					} else {
						if (event.source.hp > 2) return false;
					}
					return get.attitude(player, event.source) < 0;
				},
				logTarget: "source",
				content: function () {
					var target = trigger.source;
					if (target.hujia > 0) {
						target.damage(1 + Math.floor(target.hujia / 2));
						target.disableEquip('equip2');
						target.loseHp(target.hujia);
					} else {
						target.damage();
						target.disableEquip('equip2');
						target.loseHp();
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				enable: "phaseUse",
				filter: function (event, player) {
					return player.countMark('gf_pojia_Mark') < 1;
				},
				prompt: "你可以选择一名有护甲的其他角色或除你外的伤害来源为目标，然后对该角色造成x/2+1（向下取整）点伤害并废除其防具栏，最后令其流失x点体力（x为其护甲值且至少为1）",
				check: function (event, player) {
					return get.attitude(player, event.source) <= 0 && event.source.hujia >= event.source.hp;
				},
				filterTarget: function (card, player, target) {
					return target.hujia > 0 && target != player;
				},
				selectTarget: 1,
				content: function () {
					if (target.hujia > 0) {
						target.damage(1 + Math.floor(target.hujia / 2));
						target.disableEquip('equip2');
						target.loseHp(target.hujia);
					} else {
						target.damage();
						target.disableEquip('equip2');
						target.loseHp();
					}
				},
				ai: {
					order: 7,
					result: {
						target: function (player, target) {
							var players = game.filterPlayer();
							var effect = 0;
							for (var i = 0; i < players.length; i++) {
								if (players[i].hujia >= players[i].hp && players[i] != player) {
									effect -= 1;
								}
							}
							return effect;
						},
					},
					expose: 0.4,
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gf_shanbu": {
		enable: "phaseUse",
		filter: function (event, player) {
			return player.countMark('gf_shanbu1') < 1 || player.countMark('gf_shanbu2') < 1 || player.countMark('gf_shanbu3') < 1;
		},
		chooseButton: {
			dialog: function (event, player) {
				var dialog = ui.create.dialog('善卜：选择一项', 'hidden');
				dialog.add([lib.skill.gf_shanbu.choices.slice(), 'textbutton']);
				return dialog;
			},
			filter: function (button, player) {
				var link = button.link;
				if (link == 'suit') return player.countMark('gf_shanbu1') < 1;
				if (link == 'card') return player.countMark('gf_shanbu2') < 1;
				if (link == 'hp') return player.countMark('gf_shanbu3') < 1;
			},
			check: function (button) {
				var player = _status.event.player;
				var recover = 0, draw = 0, players = game.filterPlayer();
				for (var i = 0; i < players.length; i++) {
					var a = players[i].countMark('gf_shanbu_3'),
						b = players[i].countMark('gf_shanbu_2');
					if (get.attitude(player, players[i]) > 0) {
						if (a > players[i].hp && players[i].hp < players[i].maxHp) {
							recover++;
						} else if (a < players[i].hp) {
							recover--;
						}
						if (b > players[i].countCards('h')) {
							draw++;
						} else {
							draw--;
						}
					} else if (get.attitude(player, players[i]) < 0) {
						if (a > players[i].hp && players[i].hp < players[i].maxHp) {
							recover--;
						} else if (a < players[i].hp) {
							recover++;
						}
						if (b > players[i].countCards('h')) {
							draw--;
						} else {
							draw++;
						}
					}
				}
				switch (button.link) {
					case 'suit':
						return true;
					case 'card':
						return draw > 0;
					case 'hp':
						return recover > 0;
				}
			},
			backup: function (links) {
				var next = get.copy(lib.skill['gf_shanbu_backup']);
				next.choice = links[0];
				return next;
			},
			prompt: function (links) {
				if (links[0] == 'suit') return '摸4张牌并选择一种花色记录之';
			},
		},
		ai: {
			order: 6,
			result: {
				player: 1,
			},
		},
		choices: [["suit", "摸4张牌并选择一种花色记录之"], ["card", "将所有角色的手牌数调整为与记录一致"], ["hp", "将所有角色的体力值调整为与记录一致"]],
		group: ["gf_shanbu_1", "gf_shanbu_2"],
		subSkill: {
			"1": {
				trigger: {
					global: "phaseBegin",
				},
				filter: function (event, player) {
					return player.countMark('gf_shanbu_Mark') < 1;
				},
				forced: true,
				content: function () {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						list[i].addMark('gf_shanbu_3', list[i].hp);
						list[i].addMark('gf_shanbu_2', list[i].countCards('h'));
					}
					player.addMark('gf_shanbu_Mark', 1);
					player.removeSkill('gf_shanbu_1');
					player.awakenSkill('gf_shanbu_1');
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: "phaseAfter",
				},
				forced: true,
				content: function () {
					'step 0'
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						var a = list[i].countMark('gf_shanbu_3');
						var b = list[i].countMark('gf_shanbu_2');
						if (a > list[i].hp) {
							list[i].removeMark('gf_shanbu_3', a - list[i].hp);
						}
						if (a < list[i].hp) {
							list[i].addMark('gf_shanbu_3', list[i].hp - a);
						}
						if (b < list[i].countCards('h')) {
							list[i].addMark('gf_shanbu_2', list[i].countCards('h') - b);
						}
						if (b > list[i].countCards('h')) {
							list[i].removeMark('gf_shanbu_2', b - list[i].countCards('h'));
						}
					}
					'step 1'
					if (player.countMark('gf_shanbu1') > 0) {
						player.removeMark('gf_shanbu1', 1);
					}
					if (player.countMark('gf_shanbu2') > 0) {
						player.removeMark('gf_shanbu2', 1);
					}
					if (player.countMark('gf_shanbu3') > 0) {
						player.removeMark('gf_shanbu3', 1);
					}
				},
				sub: true,
				"_priority": 0,
			},
			"4": {
				mark: true,
				marktext: "♥",
				intro: {
					name: "善卜",
					content: "技能剩余使用次数：#",
				},
				trigger: {
					global: "judge",
				},
				direct: true,
				filter: function (event, player) {
					if (player.countMark('gf_shanbu_4') < 1) return false;
					if (event.fixedResult && event.fixedResult.suit) return event.fixedResult.suit != 'heart';
					return get.suit(event.player.judging[0], event.player) != 'heart';
				},
				content: function () {
					"step 0"
					var str = '善卜：' + get.translation(trigger.player) + '的' + (trigger.judgestr || '') + '判定为' +
						get.translation(trigger.player.judging[0]) + '，可将其改为【♥】';
					player.chooseControl('heart', 'cancel2').set('prompt', str).set('ai', function () {
						var judging = _status.event.judging;
						var trigger = _status.event.getTrigger();
						var res1 = trigger.judge(judging);
						var list = lib.suit.slice(0);
						var attitude = get.attitude(player, trigger.player);
						if (attitude == 0) return 0;
						var getj = function (suit) {
							return trigger.judge({
								name: get.name(judging),
								nature: get.nature(judging),
								suit: suit,
								number: get.number(judging),
							})
						};
						list.sort(function (a, b) {
							return (getj(b) - getj(a)) * get.sgn(attitude);
						});
						if ((getj(list[3]) - res1) * attitude > 0) return list[3];
						if (player.countMark('gf_shigui') > 0) return list[3];
						return 'cancel2';
					}).set('judging', trigger.player.judging[0]);
					"step 1"
					if (result.control != 'cancel2') {
						player.removeMark('gf_shanbu_4', 1);
						player.addExpose(0.25);
						player.popup(result.control);
						game.log(player, '将判定结果改为了', '#y' + get.translation(result.control));
						if (!trigger.fixedResult) {
							trigger.fixedResult = {};
							trigger.fixedResult.suit = result.control;
							trigger.fixedResult.color = get.color({ suit: result.control });
						}
					}
				},
				ai: {
					rejudge: true,
					tag: {
						rejudge: 0.4,
					},
					expose: 0.5,
				},
				sub: true,
				"_priority": 0,
			},
			"5": {
				mark: true,
				marktext: "♦",
				intro: {
					name: "善卜",
					content: "技能剩余使用次数：#",
				},
				trigger: {
					global: "judge",
				},
				direct: true,
				filter: function (event, player) {
					if (player.countMark('gf_shanbu_5') < 1) return false;
					if (event.fixedResult && event.fixedResult.suit) return event.fixedResult.suit != 'diamond';
					return get.suit(event.player.judging[0], event.player) != 'diamond';
				},
				content: function () {
					"step 0"
					var str = '善卜：' + get.translation(trigger.player) + '的' + (trigger.judgestr || '') + '判定为' +
						get.translation(trigger.player.judging[0]) + '，可将其改为【♦】';
					player.chooseControl('diamond', 'cancel2').set('prompt', str).set('ai', function () {
						var judging = _status.event.judging;
						var trigger = _status.event.getTrigger();
						var res1 = trigger.judge(judging);
						var list = lib.suit.slice(0);
						var attitude = get.attitude(player, trigger.player);
						if (attitude == 0) return 0;
						var getj = function (suit) {
							return trigger.judge({
								name: get.name(judging),
								nature: get.nature(judging),
								suit: suit,
								number: get.number(judging),
							})
						};
						list.sort(function (a, b) {
							return (getj(b) - getj(a)) * get.sgn(attitude);
						});
						if ((getj(list[2]) - res1) * attitude > 0) return list[2];
						if (player.countMark('gf_shigui') > 0) return list[2];
						return 'cancel2';
					}).set('judging', trigger.player.judging[0]);
					"step 1"
					if (result.control != 'cancel2') {
						player.removeMark('gf_shanbu_5', 1);
						player.addExpose(0.25);
						player.popup(result.control);
						game.log(player, '将判定结果改为了', '#y' + get.translation(result.control + 2));
						if (!trigger.fixedResult) trigger.fixedResult = {};
						trigger.fixedResult.suit = result.control;
						trigger.fixedResult.color = get.color({ suit: result.control });
					}
				},
				ai: {
					rejudge: true,
					tag: {
						rejudge: 0.4,
					},
					expose: 0.5,
				},
				sub: true,
				"_priority": 0,
			},
			"6": {
				mark: true,
				marktext: "♣",
				intro: {
					name: "善卜",
					content: "技能剩余使用次数：#",
				},
				trigger: {
					global: "judge",
				},
				direct: true,
				filter: function (event, player) {
					if (player.countMark('gf_shanbu_6') < 1) return false;
					if (event.fixedResult && event.fixedResult.suit) return event.fixedResult.suit != 'club';
					return get.suit(event.player.judging[0], event.player) != 'club';
				},
				content: function () {
					"step 0"
					var str = '善卜：' + get.translation(trigger.player) + '的' + (trigger.judgestr || '') + '判定为' +
						get.translation(trigger.player.judging[0]) + '，可将其改为【♣】';
					player.chooseControl('club', 'cancel2').set('prompt', str).set('ai', function () {
						var judging = _status.event.judging;
						var trigger = _status.event.getTrigger();
						var res1 = trigger.judge(judging);
						var list = lib.suit.slice(0);
						var attitude = get.attitude(player, trigger.player);
						if (attitude == 0) return 0;
						var getj = function (suit) {
							return trigger.judge({
								name: get.name(judging),
								nature: get.nature(judging),
								suit: suit,
								number: get.number(judging),
							})
						};
						list.sort(function (a, b) {
							return (getj(b) - getj(a)) * get.sgn(attitude);
						});
						if ((getj(list[0]) - res1) * attitude > 0) return list[0];
						if (player.countMark('gf_shigui') > 0) return list[0];
						return 'cancel2';
					}).set('judging', trigger.player.judging[0]);
					"step 1"
					if (result.control != 'cancel2') {
						player.removeMark('gf_shanbu_6', 1);
						player.addExpose(0.25);
						player.popup(result.control);
						game.log(player, '将判定结果改为了', '#y' + get.translation(result.control + 2));
						if (!trigger.fixedResult) trigger.fixedResult = {};
						trigger.fixedResult.suit = result.control;
						trigger.fixedResult.color = get.color({ suit: result.control });
					}
				},
				ai: {
					rejudge: true,
					tag: {
						rejudge: 0.4,
					},
					expose: 0.5,
				},
				sub: true,
				"_priority": 0,
			},
			"7": {
				mark: true,
				marktext: "♠",
				intro: {
					name: "善卜",
					content: "技能剩余使用次数：#",
				},
				trigger: {
					global: "judge",
				},
				direct: true,
				filter: function (event, player) {
					if (player.countMark('gf_shanbu_7') < 1) return false;
					if (event.fixedResult && event.fixedResult.suit) return event.fixedResult.suit != 'spade';
					return get.suit(event.player.judging[0], event.player) != 'spade';
				},
				content: function () {
					"step 0"
					var str = '善卜：' + get.translation(trigger.player) + '的' + (trigger.judgestr || '') + '判定为' +
						get.translation(trigger.player.judging[0]) + '，可将其改为【♠】';
					player.chooseControl('spade', 'cancel2').set('prompt', str).set('ai', function () {
						var judging = _status.event.judging;
						var trigger = _status.event.getTrigger();
						var res1 = trigger.judge(judging);
						var list = lib.suit.slice(0);
						var attitude = get.attitude(player, trigger.player);
						if (attitude == 0) return 0;
						var getj = function (suit) {
							return trigger.judge({
								name: get.name(judging),
								nature: get.nature(judging),
								suit: suit,
								number: get.number(judging),
							})
						};
						list.sort(function (a, b) {
							return (getj(b) - getj(a)) * get.sgn(attitude);
						});
						if ((getj(list[1]) - res1) * attitude > 0) return list[1];
						if (player.countMark('gf_shigui') > 0) return list[1];
						return 'cancel2';
					}).set('judging', trigger.player.judging[0]);
					"step 1"
					if (result.control != 'cancel2') {
						player.removeMark('gf_shanbu_7', 1);
						player.addExpose(0.25);
						player.popup(result.control);
						game.log(player, '将判定结果改为了', '#y' + get.translation(result.control + 2));
						if (!trigger.fixedResult) trigger.fixedResult = {};
						trigger.fixedResult.suit = result.control;
						trigger.fixedResult.color = get.color({ suit: result.control });
					}
				},
				ai: {
					rejudge: true,
					tag: {
						rejudge: 0.4,
					},
					expose: 0.5,
				},
				sub: true,
				"_priority": 0,
			},
			backup: {
				content: function () {
					'step 0'
					if (player.countMark('gf_shanbu_backup') > 0) {
						player.removeMark('gf_shanbu_backup', player.countMark('gf_shanbu_backup'));
					}
					var choice = lib.skill.gf_shanbu_backup.choice;
					event.choice = choice;
					if (choice == 'suit') {
						if (player.hasSkill('gf_shanbu_4')) {
							player.removeMark('gf_shanbu_4', player.countMark('gf_shanbu_4'))
							player.removeSkill('gf_shanbu_4');
						}
						if (player.hasSkill('gf_shanbu_5')) {
							player.removeMark('gf_shanbu_5', player.countMark('gf_shanbu_5'))
							player.removeSkill('gf_shanbu_5');
						}
						if (player.hasSkill('gf_shanbu_6')) {
							player.removeMark('gf_shanbu_6', player.countMark('gf_shanbu_6'))
							player.removeSkill('gf_shanbu_6');
						}
						if (player.hasSkill('gf_shanbu_7')) {
							player.removeMark('gf_shanbu_7', player.countMark('gf_shanbu_7'))
							player.removeSkill('gf_shanbu_7');
						}
						player.addMark('gf_shanbu1', 1);
						player.draw(4);
						player.chooseControl('红桃', '方片', '梅花', '黑桃',
							ui.create.dialog(get.prompt('gf_shanbu'), 'hidden')).ai = function () {
								var list = game.filterPlayer();
								for (var i = 0; i < list.length; i++) {
									var att = get.attitude(player, list[i]);
									if (list[i].hasJudge('lebu') && att > 0) {
										return 0;
									} else {
										if (list[i].hasJudge('bingliang') && att > 0) {
											return 2;
										} else {
											if (list[i].getEquip('bagua') && att < 0) {
												return 2;
											} else {
												if (list[i].getEquip('bagua') && att > 0) {
													return 0;
												} else {
													if (list[i].hasJudge('lebu') && att < 0) {
														return 2;
													}
													if (list[i].hasJudge('bingliang') && att < 0) {
														return 0;
													}
												}
											}
										}
									}
								}
								return 0;
							}
					}
					if (choice == 'card') {
						player.addMark('gf_shanbu2', 2);
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							var a = list[i].countMark('gf_shanbu_2');
							if (a > list[i].countCards('h')) {
								list[i].draw(a - list[i].countCards('h'));
							}
							if (a < list[i].countCards('h')) {
								list[i].chooseToDiscard(list[i].countCards('h') - a, true);
							}
							player.line(list[i], 'green');
						}
						event.finish();
					}
					if (choice == 'hp') {
						player.addMark('gf_shanbu3', 3);
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							var b = list[i].countMark('gf_shanbu_3');
							if (b > list[i].hp) {
								list[i].recover(b - list[i].hp);
							}
							if (b < list[i].hp) {
								list[i].damage(list[i].hp - b, 'nosource');
							}
							player.line(list[i], 'green');
						}
						event.finish();
					}
					'step 1'
					if (result.control == '红桃') {
						player.addSkill('gf_shanbu_4');
					}
					if (result.control == '方片') {
						player.addSkill('gf_shanbu_5');
					}
					if (result.control == '梅花') {
						player.addSkill('gf_shanbu_6');
					}
					if (result.control == '黑桃') {
						player.addSkill('gf_shanbu_7');
					}
					'step 2'
					player.judge(function (card) {
						var a = (player.countMark('gf_shanbu_backup') + 1);
						if (get.suit(card) == 'heart') {
							if (!player.hasSkill('gf_shanbu_4')) {
								player.addMark('gf_shanbu_backup', 1);
								if (a < player.countCards('h')) {
									event.goto(2);
								}
								return 1;
							}
						}
						if (get.suit(card) == 'diamond') {
							if (!player.hasSkill('gf_shanbu_5')) {
								player.addMark('gf_shanbu_backup', 1);
								if (a < player.countCards('h')) {
									event.goto(2);
								}
								return 1;
							}
						}
						if (get.suit(card) == 'club') {
							if (!player.hasSkill('gf_shanbu_6')) {
								player.addMark('gf_shanbu_backup', 1);
								if (a < player.countCards('h')) {
									event.goto(2);
								}
								return 1;
							}
						}
						if (get.suit(card) == 'spade') {
							if (!player.hasSkill('gf_shanbu_7')) {
								player.addMark('gf_shanbu_backup', 1);
								if (a < player.countCards('h')) {
									event.goto(2);
								}
								return 1;
							}
						}
						return -4;
					}).judge2 = function (result) {
						return result.bool == false ? true : false;
					};
					'step 3'
					var a = player.countMark('gf_shanbu_backup');
					if (a > 0) {
						player.chooseToDiscard(a, 'h', true).set('ai', function (card) {
							return 8 - get.value(card);
						})
						if (a < 5) {
							var b = a;
						} else {
							var b = 4;
						}
					} else {
						var b = 1;
					}
					if (player.hasSkill('gf_shanbu_4')) {
						player.addMark('gf_shanbu_4', b);
					}
					if (player.hasSkill('gf_shanbu_5')) {
						player.addMark('gf_shanbu_5', b);
					}
					if (player.hasSkill('gf_shanbu_6')) {
						player.addMark('gf_shanbu_6', b);
					}
					if (player.hasSkill('gf_shanbu_7')) {
						player.addMark('gf_shanbu_7', b);
					}
					'step 4'
					if (player.countMark('gf_shanbu_backup') > 0) {
						player.removeMark('gf_shanbu_backup', player.countMark('gf_shanbu_backup'));
					}
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
		intro: {
			content: "",
		},
	},
	"gf_shigui": {
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		enable: "phaseUse",
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		content: function () {
			var cards = game.cardsGotoOrdering(get.cards(4)).cards;
			player.gain(cards).gaintag.add('gf_shigui');
			game.log(player, '获得了牌堆顶的四张牌');
			player.awakenSkill('gf_shigui');
			player.addSkill('gf_shigui_effect');
		},
		ai: {
			order: 15,
			result: {
				player: function (player) {
					if (player.countMark('gf_shanbu_4') > 0 || player.countMark('gf_shanbu_5') > 0 || player.countMark('gf_shanbu_6') > 0 || player.countMark('gf_shanbu_7') > 0) return 1;
				},
			},
		},
		sub: true,
		"_priority": 0,
		subSkill: {
			effect: {
				trigger: {
					player: ["useCardAfter", "respondAfter"],
				},
				charlotte: true,
				forced: true,
				filter: function (event, player) {
					return player.hasHistory('lose', function (evt) {
						if (evt.getParent() != event) return false;
						for (var i in evt.gaintag_map) {
							if (evt.gaintag_map[i].contains('gf_shigui')) {
								if (event.cards.some(card => {
									return get.position(card, true) == 'o' && card.cardid == i;
								})) return true;
							}
						}
						return false;
					});
				},
				content: function () {
					'step 0'
					player.addMark('gf_shigui', 1);
					player.judge(function (card) {
						if (get.suit(card) == 'heart') {
							if (player.hasSkill('gf_shanbu_4')) {
								return -3;
							} else {
								return 1;
							}
						}
						if (get.suit(card) == 'diamond') {
							if (player.hasSkill('gf_shanbu_5')) {
								return -3;
							} else {
								return 1;
							}
						}
						if (get.suit(card) == 'club') {
							if (player.hasSkill('gf_shanbu_6')) {
								return -3;
							} else {
								return 1;
							}
						}
						if (get.suit(card) == 'spade') {
							if (player.hasSkill('gf_shanbu_7')) {
								return -3;
							} else {
								return 1;
							}
						}
						return 0;
					}).judge2 = function (result) {
						return result.bool == false ? true : false;
					};
					'step 1'
					if (result.bool == false) {
						var cards = [];
						player.getHistory('lose', function (evt) {
							if (evt.getParent() != trigger) return false;
							for (var i in evt.gaintag_map) {
								if (evt.gaintag_map[i].contains('gf_shigui')) {
									var cardsx = trigger.cards.filter(card => {
										return get.position(card, true) == 'o' && card.cardid == i;
									});
									if (cardsx.length) cards.addArray(cardsx);
								}
							}
						});
						if (cards.length) {
							player.gain(cards, 'gain2').gaintag.add('gf_shigui');
						}
					}
					player.removeMark('gf_shigui', player.countMark('gf_shigui'));
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"gf_gubu": {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		filter: function (event, player) {
			return player.hujia < 1;
		},
		content: function () {
			if (player.hujia < 5) {
				var a = player.hp;
				if (a > 5) {
					player.changeHujia(5);
				} else {
					player.changeHujia(a);
				}
			}
		},
		ai: {
			threaten: 1.5,
		},
		"_priority": 0,
		group: ["gf_gubu_1", "gf_gubu_7", "gf_gubu_8"],
		subSkill: {
			"1": {
				trigger: {
					player: "phaseDrawBegin2",
				},
				frequent: true,
				filter: function (event, player) {
					if (player.hujia < 1) return false;
					return !event.numFixed;
				},
				content: function () {
					"step 0"
					trigger.num += player.hujia;
					player.chooseControl('限制用牌', '限制伤害', ui.create.dialog('<li>限制用牌：本回合出牌阶段至多使用x张牌；<li>限制伤害：你下一个准备阶段开始前，你受到x点无来源的伤害且在此期间你造成x次伤害后，若再次造成伤害，取消之（x为你的当前护甲数）', 'hidden')).ai = function () {
						return 0;
					}
					"step 1"
					if (result.control == '限制用牌') {
						player.addTempSkill('gf_gubu_2', 'phaseEnd');
						player.addTempSkill('gf_gubu_3', 'phaseEnd');
					} else {
						player.addSkill('gf_gubu_4');
						player.addSkill('gf_gubu_5');
						player.addSkill('gf_gubu_6');
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				mod: {
					cardEnabled: function (card, player) {
						if (player.countMark('gf_gubu_2') >= player.hujia && player.countMark('gf_huoran') < 1) return false;
					},
					cardUsable: function (card, player) {
						if (player.countMark('gf_gubu_2') >= player.hujia && player.countMark('gf_huoran') < 1) return false;
					},
					cardSavable: function (card, player) {
						if (player.countMark('gf_gubu_2') >= player.hujia && player.countMark('gf_huoran') < 1) return false;
					},
				},
				trigger: {
					player: "useCard1",
				},
				silentForce: true,
				onremove: function (player) {
					player.unmarkSkill('gf_gubu_2');
					delete player.storage.gf_gubu_2;
				},
				firstDo: true,
				mark: true,
				filter: function (event, player) {
					return player.countMark('gf_huoran') < 1;
				},
				init: function (player, skill) {
					player.storage[skill] = 0;
					var evt = _status.event.getParent('phaseUse');
					if (evt && evt.player == player) {
						player.getHistory('useCard', function (evtx) {
							if (evtx.getParent('phaseUse') == evt) {
								player.storage[skill]++;
							}
						});
					}
				},
				content: function () {
					player.addMark('gf_gubu_2', 1);
				},
				ai: {
					presha: true,
					pretao: true,
					nokeep: true,
				},
				"_priority": 0,
				sub: true,
			},
			"3": {
				trigger: {
					player: "gf_gubu_2After",
				},
				init: function (player, skill) {
					player.storage.gf_gubu_3 = player.hujia;
					player.syncStorage('gf_gubu_3');
					player.markSkill('gf_gubu_3');
				},
				intro: {
					name: "佑主",
					content: "你还可以使用【#】张牌",
				},
				silentForce: true,
				content: function () {
					player.storage.gf_gubu_3 = (player.hujia - player.countMark('gf_gubu_2'));
					player.syncStorage('gf_gubu_3');
					player.markSkill('gf_gubu_3');
				},
				sub: true,
				"_priority": 0,
			},
			"4": {
				trigger: {
					player: "phaseBefore",
				},
				silentForce: true,
				content: function () {
					if (player.hujia > 0 && player.countMark('gf_huoran') < 1) {
						player.damage(player.hujia, 'nosource');
					}
					player.removeMark('gf_gubu_5', player.countMark('gf_gubu_5'));
					if (player.hasSkill('gf_gubu_9')) {
						player.removeSkill('gf_gubu_9');
					}
					player.removeSkill('gf_gubu_6');
					player.removeSkill('gf_gubu_5');
					player.removeSkill('gf_gubu_4');
				},
				sub: true,
				"_priority": 0,
			},
			"5": {
				trigger: {
					source: "damageEnd",
				},
				filter: function (event, player) {
					if (player.countMark('gf_huoran')) return false;
					return event.num > 0 && player != event.player && player.countMark('gf_gubu_5') < player.hujia;
				},
				frequent: true,
				content: function () {
					player.addMark('gf_gubu_5', 1);
					if (!player.hasSkill('gf_gubu_9') && player.countMark('gf_gubu_5') >= player.hujia) {
						player.addSkill('gf_gubu_9');
					}
				},
				sub: true,
				"_priority": 0,
			},
			"6": {
				trigger: {
					player: "gf_gubu_5After",
				},
				init: function (player, skill) {
					player.storage.gf_gubu_6 = player.hujia;
					player.syncStorage('gf_gubu_6');
					player.markSkill('gf_gubu_6');
				},
				intro: {
					name: "佑主",
					content: "在你造成【#】次伤害后，若再次造成伤害，取消之",
				},
				silentForce: true,
				content: function () {
					player.storage.gf_gubu_6 = (player.hujia - player.countMark('gf_gubu_5'));
					player.syncStorage('gf_gubu_6');
					player.markSkill('gf_gubu_6');
				},
				sub: true,
				"_priority": 0,
			},
			"7": {
				trigger: {
					player: "damageBefore",
				},
				silentForce: true,
				filter: function (event, player) {
					if (player.hujia < 1) return false;
					return event.num > 0;
				},
				content: function () {
					player.addMark('gf_gubu_7', 1);
				},
				sub: true,
				"_priority": 0,
			},
			"8": {
				trigger: {
					player: "damageEnd",
				},
				frequent: true,
				filter: function (event, player) {
					if (player.hujia > 0) return false;
					return event.num > 0;
				},
				content: function () {
					'step 0'
					if (player.countMark('gf_gubu_7') > 0) {
						player.damage('nosource');
						player.removeMark('gf_gubu_7', player.countMark('gf_gubu_7'));
					}
					'step 1'
					if (player.hasSkill('gf_gubu_6')) {
						player.storage.gf_gubu_6 = (player.hujia - player.countMark('gf_gubu_5', 1));
						player.syncStorage('gf_gubu_6');
						player.markSkill('gf_gubu_6');
					}
					if (player.hasSkill('gf_gubu_3')) {
						player.storage.gf_gubu_3 = (player.hujia - player.countMark('gf_gubu_2', 1));
						player.syncStorage('gf_gubu_3');
						player.markSkill('gf_gubu_3');
					}
				},
				sub: true,
				"_priority": 0,
			},
			"9": {
				trigger: {
					source: "damageBegin2",
				},
				filter: function (event, player) {
					return event.num > 0 && player != event.player && player.countMark('gf_gubu_5') >= player.hujia && player.countMark('gf_huoran') < 1;
				},
				frequent: true,
				content: function () {
					trigger.cancel()
				},
				sub: true,
				"_priority": 0,
			},
		},
		intro: {
			content: "",
		},
	},
	"gf_huoran": {
		"_priority": 0,
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		mark: true,
		forced: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		enable: "phaseUse",
		content: function () {
			player.addMark('gf_huoran', 1);
			player.awakenSkill('gf_huoran');
			player.removeSkill('gf_gubu');
			if (player.hujia > 0) {
				player.recover(player.hujia);
			}
			player.addSkill('gf_huoran_1');
			player.addSkill('gf_huoran_2');
			player.addSkill('gf_huoran_3');
			player.removeSkill('gf_huoran');

		},
		ai: {
			order: 4,
			result: {
				player: function (player) {
					if (player.hp < 3 && player.hujia > 0) return 1;
				},
			},
		},
		subSkill: {
			"1": {
				filter: function (event, player) {
					return player.countCards('h', { suit: 'diamond' }) > 0;
				},
				enable: "chooseToUse",
				filterCard: function (card) {
					return get.suit(card) == 'diamond';
				},
				position: "h",
				viewAs: {
					name: "mgf_mh",
				},
				onuse: function (result, player) {
					if (player.hujia < 5 && !player.hasSkill('gf_huoran_4')) {
						player.changeHujia();
					}
					player.addTempSkill('gf_huoran_4')
				},
				prompt: "将一张方片手牌当【明火】使用，若本次为本回合第一次发动此技能，你获得1点护甲。",
				check: function (card) { return 6 - get.value(card) },
				ai: {
					threaten: 1.5,
					basic: {
						order: 10,
						useful: 1,
						value: 8,
					},
					result: {
						ignoreStatus: true,
						player: function (player, target) {
							if (!player.hasSkill('gf_gubu')) return 2;
							return -0.5;
						},
						target: function (player, target) {
							if (!player.hasSkill('gf_gubu')) return 2;
							return -1;
						},
					},
					tag: {
					},
					wuxie: function (target, card, player, viewer, status) {
						if (status < 0 || get.attitude(viewer, target) <= 0 || get.damageEffect(target, target, viewer) >= 0) return 0;
						if ((target.hp <= 1 || target.hp <= 3 && !target.hasSkillTag('filterDamage', null, {
							player: null,
							card: card
						})) && game.countPlayer(function (current) {
							let skills = current.getSkills();
							for (let j = 0; j < current.skills.length; j++) {
								let rejudge = get.tag(current.skills[j], 'rejudge', current);
								if (rejudge != undefined) {
									if (get.attitude(current, target) > 0) return rejudge;
									return -rejudge;
								}
							}
						}) < 0) return 1;
						return 0;
					},
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: "phaseJudgeBegin",
				},
				charlotte: true,
				filter: function (event, player) {
					return player.countCards('j');
				},
				silent: true,
				popup: false,
				forced: true,
				content: function () {
					player.removeMark('gf_huoran', player.countMark('gf_huoran'));
					player.addSkill('gf_gubu');
					player.removeSkill('gf_huoran_2');
				},
				ai: {
					effect: {
						target: function (card, player, target) {
							var player = _status.event.player, att = get.attitude(player, target);
							if (att > 0) {
								if (card.name == 'shunshou' && player.hasJudge('mgf_mh')) {
									if (!player.hasJudge('lebu')) return 'zeroplayertarget';
								}
								if (card.name == 'guohe' && player.hasJudge('mgf_mh')) {
									if (!player.hasJudge('lebu')) return 'zeroplayertarget';
								}
							}
						},
					},
				},
				sub: true,
				"_priority": 1,
			},
			"3": {
				trigger: {
					player: "damageBegin",
				},
				frequent: true,
				filter: function (event, player) {
					return event.num > 0 && event.nature && player.countCards('j');
				},
				content: function () {
					if (trigger.num >= 1) {
						trigger.num--;
					}
				},
				sub: true,
				"_priority": 0,
			},
			"4": {
				sub: true,
				"_priority": 0,
			},
		},
	},
	"gf_geshe": {
		enable: "phaseUse",
		usable: 1,
		prompt: "你可以弃置至多4张牌，然后随机摸1~4张牌。若你以此法弃置了1/2/3/4张牌，则你获得〖奇策〗/〖制衡〗/〖奇制〗/〖连营〗；若已拥有该技能，则改为失去对应的技能并刷新〖誓言〗的使用次数。",
		filter: function (event, player) {
			return player.countCards('he') > 0;
		},
		position: "he",
		selectCard: function () {
			var player = _status.event.player;
			if (player == game.me && _status.auto == false) {
				return [1, 4];
			} else {
				if (!player.hasSkill('lianying')) {
					return 4;
				} else {
					if (!player.hasSkill('qizhi')) {
						return 3;
					} else {
						if (!player.hasSkill('zhiheng')) {
							return 2;
						} else {
							return 1;
						}
					}
				}
			}
		},
		filterCard: true,
		check: function (card) {
			var player = _status.event.player;
			if (ui.selected.cards.length > 2) return true;
			if (ui.selected.cards.length < 3) return 8 - get.value(card);
		},
		complexSelect: true,
		complexCard: true,
		derivation: ["qice", "zhiheng", "qizhi", "lianying"],
		content: function () {
			'step 0'
			if (cards.length == 1) {
				player.draw();
				if (!player.hasSkill('qice')) {
					player.addSkill('qice');
					event.finish();
					game.log(player, '获得了技能', '#g〖奇策〗')
				} else {
					player.removeSkill('qice');
					player.removeSkill('gf_shiyan_3');
					game.log(player, '失去了技能', '#g〖奇策〗')
				}
			}
			if (cards.length == 2) {
				var num = [1, 2].randomGet();
				if (num == 1) player.draw(1);
				if (num == 2) player.draw(2);
				if (!player.hasSkill('zhiheng')) {
					player.addSkill('zhiheng');
					event.finish();
					game.log(player, '获得了技能', '#g〖制衡〗')
				} else {
					player.removeSkill('zhiheng');
					player.removeSkill('gf_shiyan_3');
					game.log(player, '失去了技能', '#g〖制衡〗')
				}
			}
			if (cards.length == 3) {
				var num = [1, 2, 3].randomGet();
				if (num == 1) player.draw();
				if (num == 2) player.draw(2);
				if (num == 3) player.draw(3);
				if (!player.hasSkill('qizhi')) {
					player.addSkill('qizhi');
					event.finish();
					game.log(player, '获得了技能', '#g〖奇制〗')
				} else {
					player.removeSkill('qizhi');
					player.removeSkill('gf_shiyan_3');
					game.log(player, '失去了技能', '#g〖奇制〗')
				}
			}
			if (cards.length == 4) {
				var num = [1, 2, 3, 4].randomGet();
				if (num == 1) player.draw();
				if (num == 2) player.draw(2);
				if (num == 3) player.draw(3);
				if (num == 4) player.draw(4);
				if (!player.hasSkill('lianying')) {
					player.addSkill('lianying');
					event.finish();
					game.log(player, '获得了技能', '#g〖连营〗')
				} else {
					player.removeSkill('lianying');
					player.removeSkill('gf_shiyan_3');
					game.log(player, '失去了技能', '#g〖连营〗')
				}
			}
			'step 1'
			if (player.canUse(get.autoViewAs({ name: 'mgf_mh' }, [ui.cardPile.firstChild]), player, false)) {
				player.useCard({ name: 'mgf_mh' }, player, get.cards());
			}
			if (player.hujia < 5) {
				player.changeHujia();
			}
		},
		ai: {
			order: 11,
			result: {
				player: 1,
			},
			threaten: 3,
		},
		"_priority": 0,
		intro: {
			content: "",
		},
	},
	"gf_gupeng": {
		trigger: {
			global: ["useCard", "respond"],
		},
		silent: true,
		forced: true,
		popup: false,
		filter: function (event, player) {
			if (player != _status.currentPhase) return false;
			var respondTo = event.respondTo;
			var evt = event.getParent('useCard');
			return (Array.isArray(event.respondTo) && respondTo[0] == player && evt.player == respondTo[0] && evt.card == respondTo[1] && get.type(evt.card) != 'delay' && get.type(evt.card) != 'equip') || event.card.name == 'wuxie'; //event.respondTo[0]是响应谁，event.respondTo[1]是响应哪张牌
		},
		content: function () {
			player.addMark('gf_gupeng_Mark', 1);
			if (!trigger.player.hasSkill('gf_gupeng_4')) {
				trigger.player.addTempSkill('gf_gupeng_4');
			}
		},
		group: ["gf_gupeng_1", "gf_gupeng_2", "gf_gupeng_3"],
		subSkill: {
			"1": {
				trigger: {
					player: "phaseDiscardAfter",
				},
				frequent: true,
				content: function () {
					'step 0'
					var players = game.filterPlayer();
					event.count = 3;
					for (var i = 0; i < players.length; i++) {
						if (get.attitude(player, players[i]) > 0) {
							if (players[i].hasSkill('gf_gupeng_4')) {
								event.count--;
							}
						} else {
							if (players[i].hasSkill('gf_gupeng_4')) {
								event.count++;
							}
						}
					}
					player.chooseControl('他人执行', '自己执行',
						ui.create.dialog(get.prompt('gf_gupeng'), 'hidden')).ai = function () {
							if (event.count <= 4) return 1;
							if (event.count > 4) return 0;
							return 1;
						}
					'step 1'
					if (result.control == '自己执行') {
						var next = player.phaseDraw();
						event.next.remove(next);
						trigger.next.push(next);
					}
					if (result.control == '他人执行') {
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (list[i].hasSkill('gf_gupeng_4') && list[i] != player) {
								var next = list[i].phaseDraw();
								event.next.remove(next);
								trigger.next.push(next);
							}
						}
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: ["useCardAfter"],
				},
				silent: true,
				forced: true,
				popup: false,
				filter: function (event, player) {
					if (player != _status.currentPhase || event.card.name == 'wuxie') return false;
					if (!event.targets || event.targets[0] == player || player.countMark('gf_gupeng_3') > 2) return false;
					return event.player = player;
				},
				content: function () {
					"step 0"
					if (player.countMark('gf_gupeng_Mark') > 0) {
						player.removeMark('gf_gupeng_Mark', player.countMark('gf_gupeng_Mark'));
						event.finish();
					} else {
						player.addMark('gf_gupeng_3', 1);
						player.draw(3);
					}
					"step 1"
					event.cards = result;
					"step 2"
					player.chooseCardTarget({
						filterCard: function (card) {
							return _status.event.getParent().cards.contains(card);
						},
						selectCard: 1,
						filterTarget: function (card, player, target) {
							return player != target && target.countMark('gf_gupeng') < 1;
						},
						ai1: function (card) {
							if (ui.selected.cards.length > 0) return -1;
							if (card.name == 'du') return 20;
							return (_status.event.player.countCards('h') - _status.event.player.hp);
						},
						ai2: function (target) {
							var att = get.attitude(_status.event.player, target);
							if (ui.selected.cards.length && ui.selected.cards[0].name == 'du') {
								return 1 - att;
							}
							return att - 4;
						},
						prompt: '请选择要送人的卡牌'
					});
					"step 3"
					if (result.bool) {
						player.line(result.targets, 'green');
						result.targets[0].gain(result.cards, player);
						result.targets[0].addMark('gf_gupeng', 1);
						player.$give(result.cards.length, result.targets[0]);
						for (var i = 0; i < result.cards.length; i++) {
							event.cards.remove(result.cards[i]);
						}
						if (event.cards.length - 1 > 0) event.goto(2);
					}
					"step 4"
					event.count = 2;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].countMark('gf_gupeng') > 0) {
							event.count--;
							list[i].removeMark('gf_gupeng', list[i].countMark('gf_gupeng'));
						}
					}
					if (event.count > 0) {
						player.addMark('gf_gupeng_3', event.count);
						player.removeMark('gf_gupeng_2', player.countMark('gf_gupeng_2'));
					}
				},
				sub: true,
				"_priority": 1,
			},
			"3": {
				trigger: {
					player: "phaseBefore",
				},
				charlotte: true,
				silent: true,
				forced: true,
				popup: false,
				filter: function (event, player) {
					return player.hasMark('gf_gupeng_3') || player.hasMark('gf_gupeng_Mark');
				},
				content: function () {
					if (player.countMark('gf_gupeng_3') > 0) {
						player.removeMark('gf_gupeng_3', player.countMark('gf_gupeng_3'));
					}
					if (player.countMark('gf_gupeng_Mark') > 0) {
						player.removeMark('gf_gupeng_Mark', player.countMark('gf_gupeng_Mark'));
					}
				},
				sub: true,
				"_priority": 1,
			},
			"4": {
				mark: true,
				marktext: "已响应",
				intro: {
					name: "孤朋",
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 1,
		intro: {
			content: "",
		},
	},
	"gf_mohe": {
		trigger: {
			global: "dyingBefore",
		},
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		"prompt2": function (event, player) {
			var a = event.player.maxHp, b = player.maxHp;
			if (a == b) {
				return '你可以令' + get.translation(event.player) + '恢复1点体力';
			} else {
				return '你可以对' + get.translation(event.player) + '造成1点伤害';
			}
		},
		check: function (event, player) {
			if (get.attitude(player, event.player) < 0) {
				return event.player.maxHp != player.maxHp;
			}
			if (get.attitude(player, event.player) > 0) {
				return event.player.maxHp == player.maxHp;
			}
		},
		content: function () {
			var target = trigger.player;
			if (target.maxHp == player.maxHp) {
				target.recover();
			} else {
				target.damage();
			}
			player.awakenSkill('gf_mohe');
		},
		"_priority": 0,
		group: "gf_mohe_1",
		subSkill: {
			"1": {
				enable: "phaseUse",
				usable: 1,
				filter: function (event, player) {
					return player.hujia > 0;
				},
				content: function () {
					'step 0'
					var num = player.hujia - 1;
					var map = {};
					var list = [];
					for (var i = 1; i <= player.hujia; i++) {
						var cn = get.cnNumber(i, true);
						map[cn] = i;
						list.push(cn);
					}
					event.map = map;
					player.chooseControl(list, function () {
						return get.cnNumber(_status.event.goon, true);
					}).set('ai', function () {
						if (player.hujia > 2) return get.rand(2);
						if (player.hujia > 1) return get.rand(1);
					}).set('prompt', '受到至多为当前护甲值的伤害').set('goon', num);
					'step 1'
					var num = event.map[result.control] || 1;
					player.storage.gf_mohe_1 = num;
					player.damage(num);
					player.gainMaxHp(num);
				},
				ai: {
					order: 14,
					result: {
						player: function (player) {
							if (player.maxHp < 3) return 1;
							return -0.5;
						},
					},
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"gf_yufa": {
		mod: {
			ignoredHandcard: function (card, player) {
				if (card.hasGaintag('gf_yufa')) {
					return true;
				}
			},
			cardDiscardable: function (card, player, name) {
				if (name == 'phaseDiscard' && card.hasGaintag('gf_yufa')) {
					return false;
				}
			},
			"cardEnabled2": function (card, player, name) {
				if (player.hasSkill('gf_yufa_2')) {
					if (get.itemtype(card) == 'card' && card.hasGaintag('gf_yufa')) return false;
				}
			},
		},
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		filter: function (event, player) {
			return (event.name != 'phase' || game.phaseNumber == 0);
		},
		content: function () {
			var cards = game.cardsGotoOrdering(get.cards(6)).cards;
			player.gain(cards).gaintag.add('gf_yufa');
			game.log(player, '获得了牌堆顶的十张牌');
		},
		"_priority": 0,
		group: ["gf_yufa_1", "gf_yufa_3"],
		subSkill: {
			"1": {
				trigger: {
					player: ["useCardAfter", "respondAfter"],
				},
				charlotte: true,
				forced: true,
				filter: function (event, player) {
					if (!player.isPhaseUsing() || player.hasSkill('gf_yufa_2')) return false;
					return player.hasHistory('lose', evt => {
						if (event != evt.getParent()) return false;
						for (var i in evt.gaintag_map) {
							if (evt.gaintag_map[i].contains('gf_yufa')) return true;
						}
						return false;
					});
				},
				content: function () {
					if (!player.hasSkill('gf_yufa_2')) {
						player.addTempSkill('gf_yufa_2');
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				sub: true,
				"_priority": 0,
			},
			"3": {
				trigger: {
					player: ["loseAfter"],
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				frequent: true,
				filter: function (event, player) {
					var evt = event.getl(player);
					if (!evt || !evt.hs || !evt.hs.length) return false;
					if (event.name == 'lose') {
						for (var i in event.gaintag_map) {
							if (event.gaintag_map[i].contains('gf_yufa')) return true;
						}
						return false;
					}
					return player.hasHistory('lose', evt => {
						for (var i in evt.gaintag_map) {
							if (evt.gaintag_map[i].contains('gf_yufa')) return true;
						}
						return false;
					});
				},
				content: function () {
					'step 0'
					event.count = 0;
					event.count2 = 0;
					var num = [1, 2, 3].randomGet();
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].countCards('h') > 0 && list[i] != player) {
							event.count2++;
						}
						if (!list[i].hasSkill('gf_yufa_4') && !list[i].hasJudge('shandian')) {
							event.count++;
						}
					}
					if (num == 1) {
						if (event.count2 > 0) {
							event.goto(1);
						} else {
							var numm = [4, 5].randomGet();
							if (numm == 4) {
								if (event.count > 0) {
									event.goto(6);
								} else {
									event.goto(3);
								}
							} else {
								event.goto(3);
							}
						}
					}
					if (num == 2) event.goto(3);
					if (num == 3) {
						if (event.count > 0) {
							event.goto(6);
						} else {
							var numm = [4, 5].randomGet();
							if (numm == 4) {
								if (event.count2 > 0) {
									event.goto(1);
								} else {
									event.goto(3);
								}
							} else {
								event.goto(3);
							}
						}
					}
					'step 1'
					player.chooseTarget('弃置一名其他角色至多两张手牌', true, function (card, player, target) {
						return target != player && target.countCards('h') > 0;
					}).set('ai', function (target) {
						var player = _status.event.player, att = get.attitude(player, target);
						if (att <= 0 && target.countCards('h') == 2) return 2;
						if (att <= 0 && target.countCards('h') > 1) return 1;
						if (att <= 0 && target.countCards('h') > 0) return 0.7;
						if (att > 0) return -5;
					});
					'step 2'
					if (result.bool) {
						player.discardPlayerCard(result.targets[0], [1, 2], 'h', true);
					}
					event.finish();
					'step 3'
					player.chooseTarget('令一名其他角色选择是否弃置装备区内的所有牌，或受到1点伤害', true, function (card, player, target) {
						return target != player;
					}).set('ai', function (target) {
						var player = _status.event.player, att = get.attitude(player, target);
						if (att <= 0 && target.countCards('e') > 2) return 2;
						if (att < 0 && target.countCards('e') > 1) return 1;
						if (att < 0 && target.countCards('e') > 0) return 0.7;
						if (att > 0) return -5;
					});
					'step 4'
					if (result.bool) {
						event.target = result.targets[0];
						var str = get.translation(player);
						if (event.target.countCards('e') > 0) {
							event.target.addMark('gf_yufa_Mark', 1);
							event.target.chooseControl().set('choiceList', [
								'弃置装备区的所有牌',
								'收到1点来自' + str + '的伤害',
							]);
						} else {
							event.target.damage();
							event.finish();
						}
					} else {
						event.finish();
					}
					'step 5'
					if (result.index == 0) {
						event.target.discard(event.target.getCards('e'));
					} else event.target.damage();
					event.finish();
					'step 6'
					player.chooseTarget('令任意一名角色将牌堆的一张牌视为【闪电】使用并令其在此回合结束后额外执行一个的回合', true, function (card, player, target) {
						return !target.hasSkill('gf_yufa_4') && !target.hasJudge('shandian');
					}).set('ai', function (target) {
						var player = _status.event.player, att = get.attitude(player, target);
						if (target == player && player.countCards('h') > 5) return 2;
						if (att > 1 && target.countCards('h') > 3) return 1;
						if (att > 1) return 0.7;
						if (att <= 0) return -1;
					});
					'step 7'
					if (result.bool) {
						var target = result.targets[0];
						if (target.canUse(get.autoViewAs({ name: 'shandian' }, [ui.cardPile.firstChild]), target, false)) {
							target.useCard({ name: 'shandian' }, target, get.cards());
						}
						if (!target.hasSkill('gf_yufa_4')) {
							target.addTempSkill('gf_yufa_4');
						}
						target.insertPhase();
					}
				},
				onremove: function (player) {
					player.removeGaintag('gf_yufa');
				},
				sub: true,
				"_priority": 0,
			},
			"4": {
				sub: true,
				"_priority": 0,
			},
		},
		intro: {
			content: "",
		},
	},
	"gf_weidi": {
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		mark: true,
		forced: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		trigger: {
			player: "gf_weidi_2Before",
		},
		content: function () {
		},
		derivation: ["gf_feiyang", "gf_bahu"],
		group: "gf_weidi_2",
		subSkill: {
			"1": {
				trigger: {
					player: "damageBegin3",
				},
				forced: true,
				filter: function (event, player) {
					return event.num > 0;
				},
				content: function () {
					'step 0'
					trigger.num++;
					'step 1'
					if (trigger.num > player.hp) {
						trigger.num = player.hp;
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				enable: "phaseUse",
				filter: function (event, player) {
					return player.countMark('gf_weidi_Mark') < 1;
				},
				content: function () {
					player.addMark('gf_weidi_Mark', 1);
					player.gainMaxHp();
					player.recover();
					var hs = player.getCards('h');
					if (hs.length) player.addGaintag(hs, 'gf_yufa');
					if (!player.hasSkill('feiyang')) {
						player.addSkill('gf_feiyang');
					}
					if (!player.hasSkill('bahu')) {
						player.addSkill('gf_bahu');
					}
					player.addSkill('gf_weidi_1');
					player.addSkill('gf_weidi_3');
					player.awakenSkill('gf_weidi');
				},
				ai: {
					order: 11,
					result: {
						player: 1,
					},
					threaten: 1.5,
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				trigger: {
					player: "dying",
				},
				forced: true,
				content: function () {
					if (player.hasSkill('gf_feiyang')) {
						player.removeSkill('gf_feiyang');
					}
					if (player.hasSkill('gf_bahu')) {
						player.removeSkill('gf_bahu');
					}
					player.removeSkill('gf_weidi_1');
					player.removeSkill('gf_weidi_3');
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gf_feiyang": {
		trigger: {
			player: "phaseJudgeBegin",
		},
		charlotte: true,
		direct: true,
		filter: function (event, player) {
			return player.countCards('j') && player.countCards('h') > 1;
		},
		content: function () {
			'step 0'
			player.chooseToDiscard('h', 2, '是否发动【飞扬】，弃置两张手牌并弃置自己判定区的一张牌？').set('logSkill', 'feiyang').ai = function (card) {
				if (player.countCards('j') <= 1 && (player.hasSkillTag('rejudge') || player.hasSkillTag('nodamage') || player.hasSkillTag('nothunder')) && (player.hasJudge('shandian') || player.hasJudge('fulei'))) return false;
				return 6 - get.value(card);
			};
			'step 1'
			if (result.bool) {
				player.discardPlayerCard(player, 'j', true).ai = function (card) {
					if (player.countCards('h') < 2 && (!player.hasJudge('shandian') || !player.hasJudge('fulei'))) {
						return -ai.get.value(card);
					}
					return ai.get.value(card);
				};
			}
		},
		"_priority": 0,
	},
	"gf_bahu": {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		charlotte: true,
		forced: true,
		content: function () {
			player.draw();
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == 'sha') return num + 1;
			},
		},
		"_priority": 0,
	},
	"gf_shanggu": {
		trigger: {
			player: "phaseBegin",
		},
		frequent: true,
		filter: function (event, player) {
			event.count = 0;
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (list[i].countMark('gf_shanggu_1') > 0 && list[i] != player) {
					event.count++;
				}
			}
			return event.count > 0;
		},
		content: function () {
			"step 0"
			event.count = 0;
			event.targets = game.filterPlayer(function (current) {
				return current != player && current.hasMark('gf_shanggu_1');
			}).sortBySeat();
			if (!event.targets.length) event.finish();
			"step 1"
			event.current = event.targets.shift();
			if (!event.current.countCards('h')) event.goto(3);
			else event.current.chooseCard('交给' + get.translation(player) + '两张手牌', 2, 'h', true).set('ai', function (card) {
				var evt = _status.event.getParent();
				if (get.attitude(_status.event.player, evt.player) > 0) {
					if (card.name == 'wuzhong') return 120;
					if (card.name == 'shunshou') return 110;
				}
				return 100 - get.value(card);
			});
			"step 2"
			event.current.removeMark('gf_shanggu_1', event.current.countMark('gf_shanggu_1'));
			if (result.bool && result.cards && result.cards.length) {
				event.current.give(result.cards, player);
				event.count += result.cards.length;
			}
			"step 3"
			if (event.targets.length > 0) event.goto(1);
			"step 4"
			if (event.count > 1) {
				var a = Math.ceil(event.count / 2), b = Math.ceil(a / 2);
				if (b < 1) { var c = 1; } else { var c = b; }
				player.chooseToDiscard('你需要弃置【' + a + '】张手牌', a, 'h', true).set('ai', function (card) {
					return 7 - get.value(card);
				});
				player.chooseTarget('令任意一名角色获得【' + c + '】点护甲', true, function (card, player, target) {
					return target.hujia < 5;
				}).set('ai', function (target) {
					var player = _status.event.player, att = get.attitude(player, target);
					if (att < 0) return -3;
					if (att > 0 && target.hp < 2 && target.hujia < 3 && target == player) return 2;
					if (att > 0 && target.hp < 2 && target.hujia < 3) return 1.5;
					if (att > 0 && target.hp < 3 && target.hujia < 3) return 1;
					if (att > 0 && target.hp < 4 && target.hujia < 3) return 0.5;
					if (att > 0) return 0.1;
					return 0;
				});
			}
			"step 5"
			if (result.bool) {
				var a = Math.ceil(event.count / 2), d = Math.ceil(a / 2);
				if (d < 1) { var e = 1; } else { var e = d; }
				if (result.targets[0].hujia + e <= 5) {
					result.targets[0].changeHujia(e);
				} else {
					result.targets[0].changeHujia(5 - result.targets[0].hujia);
				}
			}
		},
		global: "gf_shanggu_1",
		group: "gf_shanggu_2",
		"_priority": 0,
		subSkill: {
			"1": {
				trigger: {
					player: "phaseDiscardEnd",
				},
				filter: function (event, player) {
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].hasSkill('gf_shanggu')) {
							event.count++;
						}
					}
					return event.count > 0;
				},
				check: function (target, player) {
					var target = game.findPlayer(function (current) {
						return current.hasSkill('gf_shanggu');
					});
					if (target) {
						if (target != player) {
							return get.attitude(player, target) > 0;
						} else {
							if (target.getExpansions('gf_shanggu_3').length < 1) {
								return true;
							} else {
								return false;
							}
						}
					}
				},
				"prompt2": function (event, player) {
					var target = game.findPlayer(function (current) {
						return current.hasSkill('gf_shanggu');
					});
					return '你可以额外执行一个摸牌阶段，然后在' + get.translation(target) + '下一个回合开始时交给其【2】张牌';
				},
				content: function () {
					player.addMark('gf_shanggu_1', 1);
					var next = player.phaseDraw();
					event.next.remove(next);
					trigger.next.push(next);
				},
				ai: {
					threaten: 1.5,
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				enable: "phaseUse",
				filter: function (event, player, card) {
					return player.countCards('h') > 1;
				},
				filterTarget: function (card, player, target) {
					return target != player && target.countCards('hej') > 0
						&& target.getExpansions('gf_shanggu_3').length < 1;
				},
				selectTarget: 1,
				content: function () {
					'step 0'
					var a = Math.floor(player.countCards('h') / 2);
					if (player == game.me && _status.auto == false) {
						player.choosePlayerCard('你可以选择一名其他角色区域内的至多【' + a + '】张牌，然后你需要将【' + 2 * a + '】张手牌置于其武将牌上称为“商”，最后你获得所有选择的牌。', target, [1, a], 'hej', true);
					} else {
						player.choosePlayerCard(target, 1, 'hej', true);
					}
					'step 1'
					var card = result.cards.length * 2;
					player.chooseCard('你需要将【' + card + '】张手牌置于其武将牌上称为“商”。', card, 'h', true).set('ai', function (card) {
						return 7 - get.value(card);
					});
					player.gain(target, result.cards, 'giveAuto');
					'step 2'
					var cards = result.cards;
					target.addToExpansion(cards, 'giveAuto', player).
						gaintag.add('gf_shanggu_3');
					target.addSkill('gf_shanggu_3');
				},
				ai: {
					order: 5,
					result: {
						target: function (player, target) {
							if (player.countCards('he') > 0) return -1;
						},
					},
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				trigger: {
					player: "phaseDrawBefore",
				},
				forced: true,
				charlotte: true,
				intro: {
					content: "expansion",
					markcount: "expansion",
				},
				onremove: function (player, skill) {
					var cards = player.getExpansions(skill);
					if (cards.length) player.loseToDiscardpile(cards);
				},
				content: function () {
					'step 0'
					player.gain(player.getExpansions('gf_shanggu_3'), 'gain2');
					'step 1'
					trigger.cancel();
					player.removeSkill('gf_shanggu_3');
				},
				sub: true,
				"_priority": 0,
			},
		},
		intro: {
			content: "",
		},
	},
	"gf_bixian": {
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		trigger: {
			global: "roundStart",
		},
		filter: function (event, player) {
			return player.countCards('hej');
		},
		content: function () {
			var cards = player.getCards('hej');
			player.addToExpansion(cards, 'giveAuto', player).gaintag.add('gf_shanggu_3');
			player.addSkill('gf_shanggu_3');
			player.addSkill('gf_bixian_1');
			player.awakenSkill('gf_bixian');
		},
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		ai: {
			order: 10,
			result: {
				player: 1,
			},
			threaten: 1,
		},
		subSkill: {
			"1": {
				mod: {
					globalTo: function (event, player, from, to, distance) {
						if (player.getExpansions('gf_shanggu_3').length > 0) {
							return distance += player.getExpansions('gf_shanggu_3').length;
						}
					},
				},
				trigger: {
					player: "phaseZhunbeiBegin",
				},
				frequent: true,
				filter: function (event, player) {
					return player.getExpansions('gf_shanggu_3').length > 0;
				},
				content: function () {
					player.draw(player.getExpansions('gf_shanggu_3').length);
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gf_gefu": {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		charlotte: true,
		direct: true,
		filter: function (event) {
			return game.players.length > 1 && (event.name != 'phase' || game.phaseNumber == 0);
		},
		content: function () {
			'step 0'
			event.count1 = 0;
			event.count2 = 0;
			event.count3 = 0;
			if (get.mode() == 'identity') {
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].identity != 'zhu') {
						if (list[i].identity == 'fan') {
							event.count1++;
						}
						if (list[i].identity == 'zhong') {
							event.count2++;
						}
						if (list[i].identity == 'nei') {
							event.count3++;
						}
					}
				}
			}
			'step 1'
			if (get.mode() == 'identity') {
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].identity != 'zhu') {
						var num = [1, 2, 3].randomGet();
						if (num == 1) {
							if (event.count1 > 0) {
								event.count1--;
								list[i].identity = 'fan';
								game.fan = list[i];
								list[i].showIdentity()
							} else {
								if (event.count2 > 0) {
									event.count2--;
									list[i].identity = 'zhong';
									game.zhong = list[i];
									list[i].showIdentity()
								} else {
									event.count3--;
									list[i].identity = 'nei';
									game.nei = list[i];
									list[i].showIdentity()
								}
							}
						}
						if (num == 2) {
							if (event.count2 > 0) {
								event.count2--;
								list[i].identity = 'zhong';
								game.zhong = list[i];
								list[i].showIdentity()
							} else {
								if (event.count1 > 0) {
									event.count1--;
									list[i].identity = 'fan';
									game.fan = list[i];
									list[i].showIdentity()
								} else {
									event.count3--;
									list[i].identity = 'nei';
									game.nei = list[i];
									list[i].showIdentity()
								}
							}
						}
						if (num == 3) {
							if (event.count3 > 0) {
								event.count3--;
								list[i].identity = 'nei';
								game.nei = list[i];
								list[i].showIdentity();
								list[i].showIdentity()
							} else {
								if (event.count1 > 0) {
									event.count1--;
									list[i].identity = 'fan';
									game.fan = list[i];
									list[i].showIdentity()
								} else {
									event.count2--;
									list[i].identity = 'zhong';
									game.zhong = list[i];
									list[i].showIdentity()
								}
							}
						}
					}
				}
			}
		},
		"_priority": 0,
	},
	"gzj_zhanshi": {
		enable: "chooseToUse",
		intro: {
			content: "已记录花色：$",
			onunmark: true,
		},
		filter: function (event, player) {
			if (event.filterCard({ name: 'shan' }, player, event)) return false;
			if (event.filterCard({ name: 'wuxie' }, player, event)) return false;
			return player.countCards('h') > 0;
		},
		filterCard: function (card, player) {
			event.count = 0;
			if (_status.currentPhase != player) {
				if (get.name(card) != 'tao' && get.name(card) != 'jiu') return false;
			}
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (list[i].hp < 1) {
					if (list[i] != player) {
						event.count++;
						if (get.name(card) != 'tao') return false;
					} else {
						if (get.name(card) != 'tao' && get.name(card) != 'jiu') return false;
					}
				}
			}
			if (player.hp >= player.maxHp && event.count < 1) {
				if (get.name(card) == 'tao') return false;
			}
			if (get.type(card) == 'equip' || get.name(card) == 'wuxie' || get.name(card) == 'shan' || get.type(card) == 'delay') return false;
			if (!player.storage.gzj_zhanshi) return true;
			return !player.storage.gzj_zhanshi.contains(get.suit(card));
		},
		position: "h",
		discard: false,
		lose: false,
		delay: false,
		content: function () {
			'step 0'
			event.count = 0;
			player.showCards(cards[0]);
			player.markAuto('gzj_zhanshi', [get.suit(cards[0])]);
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (list[i].hp < 1 && list[i] != player) {
					player.useCard({ name: 'tao' }, list[i]);

				} else {
					event.count++;
				}
			}
			if (event.count > 0) {
				if (get.name(cards[0]) == 'jiu') {
					var next = game.createEvent('gzj_zhanshi_jiu');
					next.player = player;
					next.setContent(lib.skill.gzj_zhanshi_jiu.content);
				} else {
					player.addSkill('gzj_zhanshi_mod');
					var card = {
						name: get.name(cards[0], player),
						nature: get.nature(cards[0], player),
						isCard: true,
					};
					player.chooseUseTarget(card, true);
				}
			}
			'step 1'
			if (get.name(cards[0]) == 'sha') {
				var next = game.createEvent('gzj_zhanshi_mod');
				next.player = player;
				next.setContent(lib.skill.gzj_zhanshi_mod.content);
			}
			player.removeSkill('gzj_zhanshi_mod');
		},
		"_priority": 0,
		group: ["gzj_zhanshi_1", "gzj_zhanshi_2", "gzj_zhanshi_3", "gzj_zhanshi_reset"],
		subSkill: {
			"1": {
				trigger: {
					player: ["chooseToUseBegin"],
				},
				filter: function (event, player) {
					if (event.responded) return false;
					if (!event.filterCard({ name: 'shan' }, player, event)) return false;
					var hs = player.getCards('h');
					for (var j = 0; j < hs.length; j++) {
						if (!player.storage.gzj_zhanshi) {
							if (get.name(hs[j]) == 'shan') return true;
						} else {
							if (!player.storage.gzj_zhanshi.contains(get.suit(hs[j])) && get.name(hs[j]) == 'shan') return true;
						}
					}
				},
				direct: true,
				content: function () {
					"step 0"
					var goon = (get.damageEffect(player, trigger.player, player) <= 0);
					player.chooseCard('h', get.prompt('gzj_zhanshi'), function (card, player) {
						if (get.name(card) != 'shan') return false;
						if (!player.storage.gzj_zhanshi) return true;
						return !player.storage.gzj_zhanshi.contains(get.suit(card));
					}).ai = function () {
						return goon ? 1 : 0;
					}
					"step 1"
					if (result.bool) {
						player.showCards(result.cards);
						player.markAuto('gzj_zhanshi', [get.suit(result.cards)]);
						trigger.untrigger();
						trigger.responded = true;
						trigger.result = { bool: true, card: { name: 'shan' } }
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: ["chooseToUseBegin"],
				},
				filter: function (event, player) {
					if (event.responded) return false;
					if (!event.filterCard({ name: 'wuxie' }, player, event)) return false;
					var hs = player.getCards('h');
					for (var j = 0; j < hs.length; j++) {
						if (!player.storage.gzj_zhanshi) {
							if (get.name(hs[j]) == 'wuxie') return true;
						} else {
							if (!player.storage.gzj_zhanshi.contains(get.suit(hs[j])) && get.name(hs[j]) == 'wuxie') return true;
						}
					}
				},
				direct: true,
				content: function () {
					"step 0"
					var goon = (get.damageEffect(player, trigger.player, player) <= 0);
					player.chooseCard(get.prompt('gzj_zhanshi'), function (card, player, target) {
						if (get.name(card) != 'wuxie') return false;
						if (!player.storage.gzj_zhanshi) return true;
						return !player.storage.gzj_zhanshi.contains(get.suit(card));
					}).ai = function () {
						return goon ? 1 : 0;
					}
					"step 1"
					if (result.bool) {
						player.showCards(result.cards);
						player.markAuto('gzj_zhanshi', [get.suit(result.cards)]);
						trigger.untrigger();
						trigger.responded = true;
						trigger.result = { bool: true, card: { name: 'wuxie' } }
					}
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				trigger: {
					player: ["chooseToRespondBegin"],
				},
				filter: function (event, player) {
					if (event.responded) return false;
					if (!player.countCards('he')) return false;
					var hs = player.getCards('h');
					var filter = event.filterCard;
					for (var j = 0; j < hs.length; j++) {
						if (!player.storage.gzj_zhanshi) {
							if (filter({ name: 'sha' }, player, event) && player.countCards('h', { name: 'sha' })) return true;
							if (filter({ name: 'shan' }, player, event) && player.countCards('h', { name: 'shan' })) return true;
						} else {
							if (filter({ name: 'shan' }, player, event)) {
								if (!player.storage.gzj_zhanshi.contains(get.suit(hs[j]))
									&& get.name(hs[j]) == 'shan') return true;
							}
							if (filter({ name: 'sha' }, player, event)) {
								if (!player.storage.gzj_zhanshi.contains(get.suit(hs[j]))
									&& get.name(hs[j]) == 'sha') return true;
							}
						}
					}
				},
				direct: true,
				content: function () {
					"step 0"
					var list = [];
					var players = game.filterPlayer();
					var goon = (get.damageEffect(player, trigger.player, player) <= 0);
					if (trigger.filterCard({ name: 'shan' })) {
						player.chooseCard(get.prompt('gzj_zhanshi'), function (card, player, target) {
							if (get.name(card) != 'shan') return false;
							if (!player.storage.gzj_zhanshi) return true;
							return !player.storage.gzj_zhanshi.contains(get.suit(card));
						}).ai = function () {
							return goon ? 1 : 0;
						}
					}
					if (trigger.filterCard({ name: 'sha' })) {
						player.chooseCard(get.prompt('gzj_zhanshi'), function (card, player, target) {
							if (get.name(card) != 'sha') return false;
							if (!player.storage.gzj_zhanshi) return true;
							return !player.storage.gzj_zhanshi.contains(get.suit(card));
						}).ai = function () {
							return goon ? 1 : 0;
						}
					}
					"step 1"
					if (result.bool) {
						player.showCards(result.cards);
						player.markAuto('gzj_zhanshi', [get.suit(result.cards)]);
						trigger.untrigger();
						trigger.responded = true;
						trigger.result = { bool: true, card: {} };
					}
				},
				ai: {
					effect: {
						target: function (card, player, target, current) {
							var he = target.countCards('he');
							if (!he) return 1.5;
							if (he <= 1) return;
							if (get.tag(card, 'respondShan')) {
								if (game.hasPlayer(function (current) {
									return current != target && current.getEquip(2) && get.attitude(target, current) <= 0;
								})) {
									return 0.6 / he;
								}
							}
							if (get.tag(card, 'respondSha')) {
								if (game.hasPlayer(function (current) {
									return current != target && current.getEquip(2) && get.attitude(target, current) <= 0;
								})) {
									return 0.6 / he;
								}
							}
						},
					},
				},
				sub: true,
				"_priority": 0,
			},
			reset: {
				trigger: {
					global: "phaseAfter",
				},
				silent: true,
				content: function () {
					player.unmarkSkill('gzj_zhanshi');
					delete player.storage.gzj_zhanshi;
				},
				sub: true,
				silentForce: true,
				"_priority": 1,
			},
			mod: {
				mod: {
					cardUsable: function (card) {
						if (get.info(card) && get.info(card).forceUsable) return;
						return Infinity;
					},
					targetInRange: function () {
						return true;
					},
				},
				content: function () {
					player.getStat().card.sha--;
				},
				sub: true,
				"_priority": 0,
			},
			jiu: {
				content: function () {
					player.chooseUseTarget('jiu', true, false);
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"是的": {
		trigger: {
			player: ["phaseZhunbeiBegin", "phaseJieshuBegin"],
		},
		direct: true,
		content: function () {
			"step 0";
			player.chooseTarget(get.prompt2("jsrgjizhao")).set("ai", target => {
				var player = _status.event.player;
				if (player.countCards("j")) return player == target ? 10 : 0.1;
				return 6 - get.attitude(player, target);
			});
			"step 1";
			if (result.bool) {
				var target = result.targets[0];
				event.target = target;
				player.logSkill("jsrgjizhao", target);
				target.chooseToUse({
					filterCard: function (card, player, event) {
						if (get.itemtype(card) != "card" || (get.position(card) != "h" && get.position(card) != "s")) return false;
						return lib.filter.filterCard.apply(this, arguments);
					},
					prompt: "急召：使用一张手牌，否则" + get.translation(player) + "可以移动你区域里的一张牌",
					addCount: false,
					goon: target != player || !player.countCards("j"),
					ai1: function (card) {
						if (_status.event.goon) return get.order(card);
						return 0;
					},
				});
			} else {
				event.finish();
			}
			"step 2";
			if (result.bool) {
				event.finish();
				return;
			}
		},
		"_priority": 0,
	},
	"gf_douzhuan": {
		trigger: {
			player: ["phaseZhunbeiBegin", "phaseJieshuBegin"],
		},
		direct: true,
		content: function () {
			"step 0";
			player.chooseTarget(get.prompt2("gf_douzhuan")).set("ai", target => {
				var player = _status.event.player;
				if (player.countCards("j")) return player == target ? 10 : 0.1;
				return 6 - get.attitude(player, target);
			});
			"step 1";
			if (result.bool) {
				var target = result.targets[0];
				event.target = target;
			}
			"step 2";
			var targets = game.filterPlayer(current => {
				if (current == target) return false;
				var hs = target.getCards("h");
				if (hs.length) return true;
				var js = target.getCards("j");
				for (var i = 0; i < js.length; i++) {
					if (current.canAddJudge(js[i])) return true;
				}
				if (current.isMin()) return false;
				var es = target.getCards("e");
				for (var i = 0; i < es.length; i++) {
					if (current.canEquip(es[i])) return true;
				}
				return false;
			});
			if (targets.length) {
				var next = player.chooseTarget(function (card, player, target) {
					return _status.event.targets.includes(target);
				});
				next.set("from", target);
				next.set("targets", targets);
				next.set("ai", function (target) {
					var player = _status.event.player;
					var att = get.attitude(player, target);
					var sgnatt = get.sgn(att);
					var from = _status.event.from;
					var es = from.getCards("e");
					var i;
					var att2 = get.sgn(get.attitude(player, from));
					for (i = 0; i < es.length; i++) {
						if (sgnatt != 0 && att2 != 0 && sgnatt != att2 && get.sgn(get.value(es[i], from)) == -att2 && get.sgn(get.effect(target, es[i], player, target)) == sgnatt && target.canEquip(es[i])) {
							return Math.abs(att);
						}
					}
					if (
						i == es.length &&
						(!from.countCards("j", function (card) {
							return target.canAddJudge(card);
						}) ||
							att2 <= 0)
					) {
						if (from.countCards("h") > 0) return att;
						return 0;
					}
					return -att * att2;
				});
				next.set("targetprompt", "移动目标");
				next.set("prompt", "急召：是否移动" + get.translation(target) + "的一张牌？");
			} else event.finish();
			"step 3";
			if (result.bool) {
				var target2 = result.targets[0];
				event.targets = [target, target2];
				player.line2(event.targets, "green");
			} else {
				event.finish();
			}
			"step 4";
			game.delay();
			"step 5";
			if (targets.length == 2) {
				player
					.choosePlayerCard(
						"hej",
						true,
						function (button) {
							var player = _status.event.player;
							var targets0 = _status.event.targets0;
							var targets1 = _status.event.targets1;
							if (get.attitude(player, targets0) > 0 && get.attitude(player, targets1) < 0) {
								if (get.position(button.link) == "j") return 12;
								if (get.value(button.link, targets0) < 0 && get.effect(targets1, button.link, player, targets1) > 0) return 10;
								return 0;
							} else {
								if (get.position(button.link) == "j") return -10;
								if (get.position(button.link) == "h") return 10;
								return get.value(button.link) * get.effect(targets1, button.link, player, targets1);
							}
						}, targets[0]).set("targets0", targets[0]).set("targets1", targets[1]).set("filterButton", function (button) {
							var targets1 = _status.event.targets1;
							if (get.position(button.link) == "h") {
								return true;
							} else if (get.position(button.link) == "j") {
								return targets1.canAddJudge(button.link);
							} else {
								return targets1.canEquip(button.link);
							}
						});
			} else {
				event.finish();
			}
			"step 6";
			if (result.bool && result.links.length) {
				var link = result.links[0];
				if (get.position(link) == "h") event.targets[1].gain(link, event.targets[0], "giveAuto");
				else {
					event.targets[0].$give(link, event.targets[1], false);
					if (get.position(link) == "e") event.targets[1].equip(link);
					else if (link.viewAs) event.targets[1].addJudge({ name: link.viewAs }, [link]);
					else event.targets[1].addJudge(link);
				}
				game.log(event.targets[0], "的", get.position(link) == "h" ? "一张手牌" : link, "被移动给了", event.targets[1]); game.delay();
			}
		},
		ai: {
			effect: {
				"target_use": function (card, player, target, current) { if (get.type(card) == "delay" && current < 0) { if (target.countCards("j")) return; return "zerotarget"; } },
			},
		},
		"_priority": 0,
	},
	"gzj_renyi": {
		enable: "phaseUse",
		usable: 1,
		filterCard: true,
		selectCard: [1, Infinity],
		discard: false,
		lose: false,
		delay: 0,
		filter: function (event, player) {
			return player.countCards('h') > 0;
		},
		filterTarget: function (card, player, target) {
			return player != target;
		},
		check: function (card) {
			if (ui.selected.cards.length > 1) return 0;
			if (ui.selected.cards.length && ui.selected.cards[0].name == 'du') return 0;
			if (!ui.selected.cards.length && card.name == 'du') return 20;
			return 10 - get.value(card);
		},
		content: function () {
			'step 0'
			var a = cards.length, att = get.attitude(target, player);
			player.give(cards, target);
			if (player == game.me && _status.auto == false && att > 1) {
				target.chooseCard([1, a], true, '交给' + get.translation(player) + '至多' + a + '张牌', 'he').set('ai', function (card) {
					return 4 - get.value(card);
				});
			} else {
				target.chooseCard([1, a], '交给' + get.translation(player) + '至多' + a + '张牌', 'he').set('ai', function (card) {
					if (att > 1) return 4 - get.value(card);
					return -1;
				});
			}
			'step 1'
			var target = event.target;
			if (result.bool) {
				target.give(result.cards, player);
				player.gain(result.cards, target, 'giveAuto');
				if (player.isHealthy()) event._result = { index: 0 };
				else {
					player.chooseControl().set('choiceList', [
						'摸两张牌',
						'回复一点体力',
					]);
				}
			}
			else {
				event.finish();
			}
			'step 2'
			if (result.index == 1) player.recover();
			else player.draw(2);
		},
		ai: {
			order: 11,
			result: {
				target: function (player, target) {
					if (target.hasSkillTag('nogain')) return 0;
					if (ui.selected.cards.length && ui.selected.cards[0].name == 'du') {
						if (target.hasSkillTag('nodu')) return 0;
						return -10;
					}
					if (target.hasJudge('lebu')) return 0;
					var nh = target.countCards('h');
					var np = player.countCards('h');
					if (player.hp == player.maxHp || player.storage.rende < 0 || player.countCards('h') <= 1) {
						if (nh >= np - 1 && np <= player.hp && !target.hasSkill('haoshi')) return 0;
					}
					return Math.max(1, 5 - nh);
				},
			},
			effect: {
				target: function (card, player, target) {
					if (player == target && get.type(card) == 'equip') {
						if (player.countCards('e', { subtype: get.subtype(card) })) {
							var players = game.filterPlayer();
							for (var i = 0; i < players.length; i++) {
								if (players[i] != player && get.attitude(player, players[i]) > 0) {
									return 0;
								}
							}
						}
					}
				},
			},
			threaten: 0.8,
		},
		"_priority": 0,
	},
	"gzj_zhengxiong": {
		enable: "phaseUse",
		usable: 1,
		filterCard: true,
		selectCard: 1,
		check: function (card) {
			return 10 - get.value(card);
		},
		position: "he",
		log: false,
		content: function () {
			'step 0'
			player.chooseTarget(get.prompt('gzj_zhengxiong'), '选择任意一名其他角色对其使用一张虚拟杀', function (card, player, target) {
				return target.countMark('gzj_zhengxiong') < 1 && target != player;
			}).set('ai', function (target) {
				var player = _status.event.player, att = get.attitude(player, target);
				if (att > 0) return -1;
				if (att <= 0) return 2;
			});
			'step 1'
			if (result.bool) {
				var target = result.targets[0];
				player.useCard({ name: 'sha', isCard: true }, target, false);
				player.addTempSkill('gzj_zhengxiong_1', 'shaAfter');
			}
		},
		subSkill: {
			"1": {
				silentForce: true,
				trigger: {
					source: "damageBegin",
				},
				filter: function (event, player) {
					if (event.player.countMark('gzj_renyi') < 1) return false;
					return event.card && event.card.name == 'sha' && event.notLink();
				},
				content: function () {
					trigger.num += 2;
					trigger.player.addMark('gzj_zhengxiong', 1);
				},
				sub: true,
				"_priority": 0,
			},
		},
		ai: {
			yingbian: function (card, player, targets, viewer) {
				if (get.attitude(viewer, player) <= 0) return 0;
				var base = 0, hit = false;
				if (get.cardtag(card, 'yingbian_hit')) {
					hit = true;
					if (targets.filter(function (target) {
						return target.hasShan() && get.attitude(viewer, target) < 0 && get.damageEffect(target, player, viewer, get.nature(card)) > 0;
					})) base += 5;
				}
				if (get.cardtag(card, 'yingbian_all')) {
					if (game.hasPlayer(function (current) {
						return !targets.contains(current) && lib.filter.targetEnabled2(card, player, current) && get.effect(current, card, player, player) > 0;
					})) base += 5;
				}
				if (get.cardtag(card, 'yingbian_damage')) {
					if (targets.filter(function (target) {
						return get.attitude(player, target) < 0 && (hit || !target.mayHaveShan() || player.hasSkillTag('directHit_ai', true, {
							target: target,
							card: card,
						}, true)) && !target.hasSkillTag('filterDamage', null, {
							player: player,
							card: card,
							jiu: true,
						})
					})) base += 5;
				}
				return base;
			},
			canLink: function (player, target, card) {
				if (!target.isLinked() && !player.hasSkill('wutiesuolian_skill')) return false;
				if (target.mayHaveShan() && !player.hasSkillTag('directHit_ai', true, {
					target: target,
					card: card,
				}, true)) return false;
				if (player.hasSkill('jueqing') || player.hasSkill('gangzhi') || target.hasSkill('gangzhi')) return false;
				return true;
			},
			basic: {
				useful: [5, 3, 1],
				value: [5, 3, 1],
				order: 5,
			},
			order: function (item, player) {
				if (player.hasSkillTag('presha', true, null, true)) return 10;
				if (item.hasNature('linked')) {
					if (game.hasPlayer(function (current) {
						return current != player && current.isLinked() && player.canUse(item, current, null, true) && get.effect(current, item, player, player) > 0 && lib.card.sha.ai.canLink(player, current, item);
					}) && game.countPlayer(function (current) {
						return current.isLinked() && get.damageEffect(current, player, player, get.nature(item)) > 0;
					}) > 1) return 3.1;
					return 3;
				}
				return 3.05;
			},
			result: {
				target: function (player, target, card, isLink) {
					var eff = function () {
						if (!isLink && player.hasSkill('jiu')) {
							if (!target.hasSkillTag('filterDamage', null, {
								player: player,
								card: card,
								jiu: true,
							})) {
								if (get.attitude(player, target) > 0) {
									return -7;
								}
								else {
									return -4;
								}
							}
							return -0.5;
						}
						return -1.5;
					}();
					if (!isLink && target.mayHaveShan() && !player.hasSkillTag('directHit_ai', true, {
						target: target,
						card: card,
					}, true)) return eff / 1.2;
					return eff;
				},
				player: function (player, target, card) {
					if (player.hasSkillTag('directHit_ai', true, {
						target: target,
						card: card
					}, true)) return 0;
					if (get.damageEffect(target, player, target) > 0 && get.attitude(player, target) > 0) return 0;
					var hs1 = target.countCards('hs', 'sha');
					var hs2 = player.countCards('hs', 'sha');
					if (hs1 > hs2 + 1) {
						return -2;
					}
					if (player.hp == 1 && hs2 == 0 && hs1 >= 1) {
						return -2;
					}
					var hsx1 = target.countCards('hs');
					var hsx2 = player.countCards('hs');
					if (hsx1.length == 0) {
						return 0;
					}
					if (hsx1 > 3 && hs2 == 0) {
						return -2;
					}
					if (hs2 >= 3 && hsx1 <= hsx2) {
						return 0;
					}
					return -0.5;
				},
			},
			tag: {
				respond: 1,
				respondShan: 1,
				damage: function (card) {
					if (card.hasNature('poison')) return;
					return 1;
				},
				natureDamage: function (card) {
					if (card.hasNature()) return 1;
				},
				fireDamage: function (card, nature) {
					if (card.hasNature('fire')) return 1;
				},
				thunderDamage: function (card, nature) {
					if (card.hasNature('thunder')) return 1;
				},
				poisonDamage: function (card, nature) {
					if (card.hasNature('poison')) return 1;
				},
				respondSha: 2,
			},
			wuxie: function (target, card, player, viewer) {
				if (player == game.me && get.attitude(viewer, player) > 0) {
					return 0;
				}
			},
		},
		"_priority": 0,
	},
	"gf_kushui": {
		marktext: "酷",
		intro: {
			name: "酷税",
			content: "你拥有【#】枚“酷”标记",
		},
		trigger: {
			player: "useCardToPlayered",
		},
		filter: function (event, player) {
			if (event.getParent().triggeredTargets3.length > 1) return false;
			if (!['basic', 'trick'].contains(get.type(event.card))) return false;
			if (get.tag(event.card, 'damage')) {
				if (event.getParent().triggeredTargets3.length > 1) return false;
				var list = event.targets;
				for (var i = 0; i < list.length; i++) {
					if (!list[i].hasSkill('gf_kushui_1') && !list[i].hasSkill('gf_kushui_3')) {
						return true;
					}
				}
			}
			return false;
		},
		"prompt2": function (event, player) {
			return '是否记录' + get.translation(event.player) + '，在其接下来累计获得5张牌后令其选择一张手牌并弃置其余的所有手牌，然后你获得等同于其弃置牌数的“酷”标记？';
		},
		content: function () {
			"step 0"
			event.num = 0;
			"step 1"
			if (num < trigger.targets.length) {
				if (!trigger.targets[num].hasSkill('gf_kushui_1') && !trigger.targets[num].hasSkill('gf_kushui_3')) {
					trigger.targets[num].addSkill('gf_kushui_3');
				}
				event.num++;
			}
			"step 2"
			if (num < trigger.targets.length) event.goto(1);
		},
		group: ["gf_kushui_2", "gf_kushui_4"],
		subSkill: {
			"1": {
				mark: true,
				marktext: "酷税",
				intro: {
					name: "酷税",
					content: "你已累计获得了$张牌",
				},
				trigger: {
					player: "gainAfter",
				},
				forced: true,
				content: function () {
					'step 0'
					player.addMark('gf_kushui_1', trigger.cards.length);
					'step 1'
					if (player.countMark('gf_kushui_1') > 4) {
						var next = player.chooseCard(true, 'h', 1, '选择一张手牌，然后弃置其余的牌。');
						next.set('ai', function (card) {
							if (_status.event.goon) return -1;
							var num = _status.event.maxNum;
							if (ui.selected.cards.length >= num - 1) {
								var cards = player.getCards('he', function (cardx) {
									return cardx != card && !ui.selected.cards.contains(cardx);
								});
								var val = 0;
								for (var cardx of cards) val += get.value(cardx);
								if (val >= 14) return 0;
							}
							return get.value(card);
						});
					} else {
						event.finish();
					}
					'step 2'
					var cards = player.getCards('h');
					cards.removeArray(result.cards);
					if (cards.length) {
						player.discard(cards);
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (list[i].hasSkill('gf_kushui')) {
								list[i].addMark('gf_kushui', cards.length);
							}
						}
					}
					player.removeMark('gf_kushui_1', player.countMark('gf_kushui_1'));
					player.removeSkill('gf_kushui_1');
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: "phaseDrawBegin2",
				},
				frequent: true,
				filter: function (event, player) {
					return !event.numFixed;
				},
				content: function () {
					var a = player.countMark('gf_kushui');
					if (a > 1) {
						if (!player.hasSkill('gf_moli_1')) {
							trigger.num = get.rand(1, a);
						} else {
							if (a > 3) {
								trigger.num = get.rand(3, a);
							} else {
								trigger.num = 3;
							}
						}
					} else {
						if (!player.hasSkill('gf_moli_1')) {
							trigger.num = 1;
						} else {
							trigger.num = 3;
						}
					}
					if (!player.hasSkill('gf_moli_1')) {
						player.removeMark('gf_kushui', a);
					} else {
						if (a > 3) {
							player.removeMark('gf_kushui', trigger.num);
						} else {
							player.removeMark('gf_kushui', a);
						}
					}
				},
				ai: {
					threaten: 1.3,
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				mark: true,
				marktext: "酷税",
				intro: {
					name: "酷税",
					content: "你已累计获得了0张牌",
				},
				trigger: {
					player: "gainEnd",
				},
				forced: true,
				silent: true,
				popup: false,
				content: function () {
					player.removeSkill('gf_kushui_3');
					player.addSkill('gf_kushui_1');
				},
				sub: true,
				"_priority": 0,
			},
			"4": {
				enable: "phaseUse",
				usable: 1,
				filterTarget: function (card, player, target) {
					return player != target;
				},
				content: function () {
					'step 0'
					var a = target.countMark('gf_kushui_1');
					if (target.hasSkill('gf_kushui_1') || target.hasSkill('gf_kushui_3')) {
						if (a < 1) {
							var b = 1;
						} else {
							var b = a;
						}
						target.chooseCard('he', b, true, '请弃置【' + b + '】张手牌').set('ai', function (card) {
							return 8 - get.value(card);
						})
					} else {
						target.addSkill('gf_kushui_3');
						event.finish();
					}
					'step 1'
					target.removeMark('gf_kushui_1', target.countMark('gf_kushui_1'));
					if (target.hasSkill('gf_kushui_3')) {
						target.removeSkill('gf_kushui_3');
					}
					if (target.hasSkill('gf_kushui_1')) {
						target.removeSkill('gf_kushui_1');
					}
					'step 2'
					if (result.bool) {
						target.discard(result.cards);
						player.chooseButton(['选择获得一张牌', result.cards], true);
					}
					else {
						event.finish();
					}
					'step 3'
					if (result.bool) {
						var card = result.links[0];
						player.gain(card, target, 'giveAuto', 'bySelf');
					}
				},
				ai: {
					order: 9,
					result: {
						target: -1,
					},
				},
				sub: true,
				"_priority": 0,
			},
		},
		intro: {
			content: "",
		},
		"_priority": 0,
	},
	"gf_moli": {
		trigger: {
			player: "phaseBegin",
		},
		limited: true,
		mark: true,
		skillAnimation: true,
		animationColor: "wood",
		content: function () {
			player.awakenSkill('gf_moli');
			player.addTempSkill('gf_moli_1');
		},
		subSkill: {
			"1": {
				mod: {
					cardUsable: function (card, player, num) {
						var a = player.countMark('gf_kushui');
						if (a > 2) {
							if (card.name == 'sha') return num = a;
						} else {
							if (card.name == 'sha') return num = 3;
						}
					},
				},
				sub: true,
				"_priority": 0,
			},
		},
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		"_priority": 0,
	},
	"gf_boshan": {
		mod: {
			cardUsable: function (card, player) {
				if (!card.cards) return;
				for (var i of card.cards) {
					if (i.hasGaintag('gf_boshan')) return Infinity;
				}
			},
		},
		trigger: {
			player: "phaseUseBefore",
		},
		filter: function (event, player) {
			return !event.numFixed && player.isDamaged();
		},
		direct: true,
		content: function () {
			'step 0'
			var a = player.getDamagedHp();
			var b = player.countCards('h') - player.countCards('h', card => card.hasGaintag('gf_boshan'));
			if (a > b) {
				var c = b;
			} else {
				var c = a;
			}
			player.chooseCard('h', c, get.prompt('gf_boshan'), '选择【' + c + '】张牌标记为“薄衫”', function (card, player) {
				return !card.hasGaintag('gf_boshan');
			}).set('ai', function (card) {
				return get.tag(card, 'damage');
			})
			'step 1'
			if (result.bool) {
				player.addGaintag(result.cards, 'gf_boshan');
			}
		},
		"_priority": 0,
		group: ["gf_boshan_1", "gf_boshan_2", "gf_boshan_3"],
		subSkill: {
			"1": {
				trigger: {
					player: "useCard1",
				},
				frequent: true,
				filter: function (event, player) {
					if (player.hujia < 1 || get.type2(event.card) == 'equip') return false;
					return player.hasHistory('lose', evt => {
						if (event != evt.getParent()) return false;
						for (var i in evt.gaintag_map) {
							if (evt.gaintag_map[i].contains('gf_boshan')) return true;
						}
					});
				},
				content: function () {
					'step 0'
					if (player.hujia > 0) {
						player.chooseControl('确定', 'cancel2', ui.create.dialog('是否失去1点护甲并令此牌不可被其他角色响应，然后若此牌造成了伤害，你增加1点体力上限并摸2张牌？', 'hidden')).ai = function () {
							if (get.tag(trigger.card, 'damage')) return 0;
							return 1;
						}
					}
					'step 1'
					if (result.control == '确定') {
						player.changeHujia(-1);
						trigger.directHit.addArray(game.filterPlayer(function (current) {
							return current != player;
						}));
						if (player.hujia < 2) {
							player.addMark('gf_boshan1', 1);
						}
					}
					var next = game.createEvent('gf_boshan');
					next.player = player;
					next.card = trigger.card;
					event.next.remove(next);
					next.forceDie = true;
					trigger.after.push(next);
					next.setContent(function () {
						if (player.isIn() && player.getHistory('sourceDamage', function (evt) {
							return evt.getParent(2) == event.parent;
						}).length > 0) {
							player.gainMaxHp();
							player.draw(2);
						}
						if (player.countMark('gf_boshan1') > 0) {
							var next = game.createEvent('gf_boshan_2');
							next.player = player;
							next.setContent(lib.skill.gf_boshan_2.content);
							var next = game.createEvent('gf_boshan');
							next.player = player;
							next.setContent(lib.skill.gf_boshan.content);
						}
					});
				},
				contentAfter: function () {
					if (player.countMark('gf_boshan1') > 0) {
						player.removeMark('gf_boshan1', player.countMark('gf_boshan1'));
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: "phaseUseAfter",
				},
				forced: true,
				content: function () {
					'step 0'
					if (player.countMark('gf_boshan1') > 0) {
						player.removeMark('gf_boshan1', 1);
						if (player.countCards('h', card => card.hasGaintag('gf_boshan')) > 0) {
							player.chooseControl('确定', 'cancel2', ui.create.dialog('是否弃置所有“薄衫”牌，并获得等量的护甲？', 'hidden')).ai = function () {
								var a = player.countCards('h', card => card.hasGaintag('gf_boshan'));
								if (a > 5 - player.hujia) return 1;
								return 0;
							}
						} else {
							event.finish();
						}
					}
					'step 1'
					if (result.control == 'cancel2') {
						event.finish();
					} else {
						player.discard(player.getCards('h', card => card.hasGaintag('gf_boshan')));
					}
					'step 2'
					var len = 0;
					player.getHistory('lose', evt => {
						if (evt.getParent(2) == event) len += evt.cards.length;
					});
					if (len > 0) {
						if (player.hujia + len <= 5) {
							player.changeHujia(len);
						} else {
							player.changeHujia(5 - player.hujia);
						}
					}
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				trigger: {
					player: "damageEnd",
				},
				forced: true,
				filter: function (event, player) {
					return player.isMinHandcard(true);
				},
				content: function () {
					'step 0'
					player.chooseControl('仅摸两张牌', '减上限摸牌', ui.create.dialog('请选择一项：1、摸【2】张牌；2、减少1点体力上限并摸【4】张牌', 'hidden')).ai = function () {
						if (player.maxHp > 3) return 1;
						return 0;
					}
					'step 1'
					if (result.control == '仅摸两张牌') {
						player.draw(2);
					} else {
						player.loseMaxHp();
						player.draw(4);
					}
					player.loseHp();
				},
				sub: true,
				"_priority": 0,
			},
		},
		intro: {
			content: "",
		},
	},
	"gf_taisui": {
		trigger: {
			target: "useCardToTarget",
		},
		forced: true,
		filter: function (event, player) {
			if (player.hasSkill('gf_zhensha_2')) return false;
			return event.player != player && get.tag(event.card, 'damage');
		},
		content: function () {
			'step 0'
			var str1 = get.translation(player), str2 = get.translation(trigger.card);
			var target = _status.event.getParent().player, player = _status.event.player;
			if (trigger.player.countCards('he') < 2) {
				if (trigger.player.countCards('he') < 1) {
					event._result = { index: 2 }
				} else {
					trigger.player.chooseControl().set('choiceList', [
						'交给' + str1 + '【1】张牌',
						'令' + str2 + '无效',
					]).set('ai', function (event, player, card) {
						if (get.attitude(player, target) > 0 && get.tag(event.card, 'damage') && player.countCards('h') < 4 && player.hp < 3) return 1;
						return 0;
					});
					event.goto(3);
				}
			} else {
				trigger.player.chooseControl().set('choiceList', [
					'交给' + str1 + '一张牌',
					'弃置两张牌',
					'令' + str2 + '无效',
				]).set('ai', function (event, player, card) {
					if (get.attitude(player, target) > 0 && get.tag(event.card, 'damage') && player.countCards('h') < 4 && player.hp < 3) return 2;
					if (get.attitude(player, target) > 0) return 0;
					if (get.attitude(player, target) < 1 && target.countCards('he') < 2) return 1;
					if (get.attitude(player, target) < 1 && target.countCards('h') > 3) return 1;
					return 1;
				});
			}
			'step 1'
			if (result.index == 0) {
				trigger.player.chooseCard('he', true, 1, '选择交给' + get.translation(player) + '【1】张牌').set('ai', function (card) {
					return 8 - get.value(card);
				});
			}
			if (result.index == 1) {
				trigger.player.chooseToDiscard(2, 'he', true).set('ai', function (card) {
					return 8 - get.value(card);
				})
				event.finish();
			}
			if (result.index == 2) {
				trigger.targets.remove(player);
				trigger.getParent().triggeredTargets2.remove(player);
				trigger.untrigger();
				event.finish();
			}
			'step 2'
			if (result.bool && result.cards && result.cards.length) {
				trigger.player.give(result.cards, player);
			}
			event.finish();
			'step 3'
			if (result.index == 0) {
				trigger.player.chooseCard('he', true, 1, '选择交给' + get.translation(player) + '【1】张牌').set('ai', function (card) {
					return 8 - get.value(card);
				});
			}
			if (result.index == 1) {
				trigger.targets.remove(player);
				trigger.getParent().triggeredTargets2.remove(player);
				trigger.untrigger();
				event.finish();
			}
			'step 4'
			if (result.bool && result.cards && result.cards.length)
				trigger.player.give(result.cards, player);
		},
		ai: {
			effect: {
				target: function (card, player, target) {
					var num = 1;
					if (target.hasSkill('gf_zhensha_2')) {
						if (get.attitude(player, target) < 0) return [1, num * 0.1];
					} else {
						if (get.attitude(player, target) < 0) {
							if (player.countCards('he') < 2) return [1, num * 2];
							if (player.countCards('he') > 2 && target.hp < 2) return [1, num * 0.5];
							if (player.countCards('he') > 3) return [1, num * 0.5];
						}
					}
				},
			},
		},
		"_priority": 0,
		group: ["gf_taisui_1", "gf_taisui_3", "gf_taisui_4"],
		subSkill: {
			"1": {
				enable: "phaseUse",
				usable: 1,
				prompt: "你可以选择任意张牌和至多等量名攻击距离包含你且装备栏未被全部废除的其他角色，然后你弃置选择的所有牌并摸x＋1张牌（x为你弃置牌数－目标角色数），最后这些角色依次随机废除一个未被废除的装备栏，且在其装备栏均被废除时手牌上限为0。",
				check: function (card) {
					return 6 - get.value(card)
				},
				position: "he",
				selectCard: [1, Infinity],
				selectTarget: [0, Infinity],
				complexSelect: true,
				complexCard: true,
				filterCard: function (card, player) {
					return ui.selected.cards.length >= ui.selected.targets.length;
				},
				filterTarget: function (card, player, target) {
					if (!target.hasEnabledSlot()) return false;
					if (ui.selected.targets.length < ui.selected.cards.length) {
						return target != player && target.inRange(player);
					}
				},
				content: function () {
					'step 0'
					if (player.countMark('gf_taisui_1') < 1) {
						player.addMark('gf_taisui_1', 1);
						if (cards.length - targets.length > 0) {
							player.draw(cards.length - targets.length);
						}
						event.count = targets.length;
					}
					'step 1'
					var a = targets.length - event.count;
					if (event.count > 0) {
						var list = [];
						for (var i = 1; i <= 5; i++) {
							if (targets[a].isDisabled(i)) continue;
							list.add('equip' + i);
						}
						if (list.length) {
							player.line(target);
							var num = list.randomGet();
							targets[a].disableEquip(num);
							if (!targets[a].hasSkill('gf_taisui_2')) {
								targets[a].addSkill('gf_taisui_2');
							}
						}
						event.count--;
						event.goto(1);
					}
				},
				contentAfter: function () {
					player.removeMark('gf_taisui_1', player.countMark('gf_taisui_1'));
				},
				ai: {
					order: 1,
					result: {
						player: 1,
						target: -1,
					},
					threaten: 2,
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				mod: {
					maxHandcardBase: function (player, num) {
						if (!player.hasEnabledSlot()) {
							return 0;
						}
					},
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				trigger: {
					player: "gainEnd",
				},
				forced: true,
				filter: function (event, player) {
					if (player.countMark('gf_taisui_4') >= game.countPlayer() * 2) return false;
					return event.source && event.source.isIn() && event.source != player && event.cards.length >= 1;
				},
				logTarget: "source",
				content: function () {
					'step 0'
					var list = [];
					for (var i = 1; i <= 5; i++) {
						if (!trigger.source.isDisabled(i)) continue;
						list.add('equip' + i);
					}
					if (list.length) {
						player.line(trigger.source);
						var num = list.randomGet();
						trigger.source.enableEquip(num);
					}
					'step 1'
					var a = game.countPlayer() * 2 - player.countMark('gf_taisui_4');
					player.chooseControl('确定', 'cancel2',
						ui.create.dialog('是否摸两张牌并交给' + get.translation(trigger.source) + '【1】张牌？（剩余【' + a + '】次）', 'hidden')).ai = function () {
							var target = trigger.source;
							if (get.attitude(player, target) > 0) return 0;
							return 1;
						};
					"step 2"
					if (result.control == '确定') {
						player.draw(2);
						player.addMark('gf_taisui_4', 1);
						player.chooseCard('he', true, 1, '选择交给' + get.translation(trigger.source) + '一张牌').set('ai', function (card) {
							return 8 - get.value(card);
						});
					}
					'step 3'
					if (result.bool && result.cards && result.cards.length)
						player.give(result.cards, trigger.source);
				},
				sub: true,
				"_priority": 0,
			},
			"4": {
				trigger: {
					global: "roundStart",
				},
				silentForce: true,
				content: function () {
					player.removeMark('gf_taisui_4', player.countMark('gf_taisui_4'));
				},
				sub: true,
				"_priority": 0,
			},
		},
		intro: {
			content: "",
		},
	},
	"gf_zhensha": {
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		enable: "phaseUse",
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		content: function () {
			player.addTempSkill('gf_zhensha_1');
			player.addTempSkill('gf_zhensha_2', { player: 'phaseBefore' });
			player.awakenSkill('gf_zhensha');
		},
		subSkill: {
			"1": {
				trigger: {
					player: "useCardToPlayered",
				},
				forced: true,
				filter: function (event, player) {
					return event.target != player && event.target.countCards('he') > 0;
				},
				content: function () {
					'step 0'
					var str = get.translation(player);
					if (trigger.target.countCards('he') < 2) {
						event._result = { index: 0 }
					} else {
						trigger.target.chooseControl().set('choiceList', [
							'交给' + str + '一张牌',
							'弃置两张牌',
						]).set('ai', function (event, player, card) {
							var target = _status.event.getParent().player;
							var player = _status.event.player;
							if (get.attitude(player, target) > 0) return 0;
							if (get.attitude(player, target) <= 0 && target.countCards('he') < 2) return 1;
							if (get.attitude(player, target) <= 0 && target.countCards('h') > 3) return 1;
							return 1;
						});
					}
					'step 1'
					if (result.index == 0) {
						trigger.target.chooseCard('he', true, 1, '选择交给' + get.translation(player) + '【1】张牌').set('ai', function (card) {
							return 8 - get.value(card);
						});
					}
					if (result.index == 1) {
						trigger.target.chooseToDiscard(2, 'he', true).set('ai', function (card) {
							return 8 - get.value(card);
						})
						event.finish();
					}
					'step 2'
					if (result.bool && result.cards && result.cards.length) {
						trigger.target.give(result.cards, player);
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				intro: {
					name: "太岁",
					content: "失效技能：〖太岁①〗",
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gf_fenzhai": {
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		mark: true,
		forced: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		trigger: {
			player: ["gf_fenzhai_1Begin"],
		},
		content: function () {
			player.awakenSkill('gf_fenzhai');
			player.removeSkill('gf_fenzhai_1');
			player.addSkill('gf_fenzhai_2');
		},
		group: "gf_fenzhai_1",
		subSkill: {
			"1": {
				enable: "phaseUse",
				filterTarget: function (card, player, target) {
					return target.countCards('h') > 0 && !target.hasJudge('mgf_mh');
				},
				selectTarget: [1, Infinity],
				prompt: "你可以选择任意名有手牌且判定区没有【明火】的角色为目标，然后令所有目标选择一张手牌当做【明火】对自己使用，最后你获得〖焚宅②〗。",
				content: function () {
					'step 0'
					event.num = 0;
					event.targets = game.filterPlayer();
					"step 1"
					if (num < event.targets.length) {
						if (event.targets[num] = target) {
							if (event.targets[num].canUse(get.autoViewAs({ name: 'mgf_mh' }, [ui.cardPile.firstChild]), event.targets[num], false)) {
								event.targets[num].chooseCard('h', true, '请选择一张手牌当做【明火】并对自己使用。”').set('ai', function (card) {
									if (_status.event.goon) return 8 - get.value(card);
									return 0;
								})
							}
						}
					}
					"step 2"
					event.targets[num].useCard({ name: 'mgf_mh' }, event.targets[num], result.cards);
					event.num++;
					if (num < event.targets.length) event.goto(1);
					event.finish();
					"step 3"
					var card = get.discardPile(card => {
						return true;
					});
					var cards = Array.from(ui.discardPile.childNodes);
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i] == target) {
							if (list[i].canUse(get.autoViewAs({ name: 'mgf_mh' }, [ui.cardPile.firstChild]), list[i], false)) {
								list[i].chooseCard('h', true, '请选择一张手牌当做【明火】并对自己使用。”').set('ai', function (card) {
									if (_status.event.goon) return 8 - get.value(card);
									return 0;
								})
								list[i].useCard({ name: 'mgf_mh' }, list[i], card);
							}
						}
					}
				},
				ai: {
					order: 9,
					result: {
						player: 1,
					},
					expose: 0.4,
					threaten: 1.25,
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: "damageBegin",
				},
				frequent: true,
				charlotte: true,
				filter: function (event, player) {
					if (event.num < 1 || !event.nature) return false;
					return game.hasPlayer(function (current) {
						return current.countCards('j', 'mgf_mh');
					});
				},
				content: function () {
					trigger.cancel();
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	wuce: {
		trigger: {
			global: ["useSkillAfter", "logSkill"],
			player: ["changeHp"],
		},
		forced: true,
		filter: function (event, player) {
			return player.countMark('wuce') != player.getHandcardLimit();
		},
		content: function () {
			'step 0'
			var a = player.getHandcardLimit(), b = player.countMark('wuce');
			if (a > b) {
				player.addMark('wuce', a - b);
			} else {
				player.removeMark('wuce', b - a);
			}
			'step 1'
			if (player.countMark('wuce') == player.getHandcardLimit()) {
				if (player.getHandcardLimit() % 5 == 0) {
					player.draw();
				}
			}
		},
		"_priority": 0,
	},
	"gf_zhengzhuang": {
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		enable: "phaseUse",
		content: function () {
			if (player.hujia + player.hp <= 5) {
				player.changeHujia(player.hp);
			} else {
				player.changeHujia(5 - player.hp);
			}
			player.addTempSkill('gf_zhengzhuang_1');
			player.awakenSkill('gf_zhengzhuang');
		},
		ai: {
			order: 5,
			result: {
				player: 2,
			},
			expose: 0.4,
			threaten: 1.5,
		},
		subSkill: {
			"1": {
				mod: {
					targetInRange: function (card, player, target) {
						if (!card.cards) return;
						for (var i of card.cards) {
							if (i.hasGaintag('gf_boshan')) return true;
						}
					},
				},
				trigger: {
					player: "useCardAfter",
				},
				frequent: true,
				filter: function (event, player) {
					return player.countCards('h', card => card.hasGaintag('gf_boshan')) < 1;
				},
				content: function () {
					'step 0'
					var a = player.getDamagedHp();
					var b = player.countCards('h') - player.countCards('h', card => card.hasGaintag('gf_boshan'));
					if (a > b) {
						var c = b;
					} else {
						var c = a;
					}
					player.chooseCard('h', c, get.prompt('gf_zhengzhuang'), '选择【' + c + '】张牌标记为“薄衫”', function (card, player) {
						return !card.hasGaintag('gf_boshan');
					}).set('ai', function (card) {
						return 6 - get.value(card);
					})
					'step 1'
					if (result.bool) {
						player.addGaintag(result.cards, 'gf_boshan');
					}
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gf_sh": {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		enable: "chooseToUse",
		popup: false,
		silent: true,
		hiddenCard: function (player, name) {
			return !player.getStorage('gf_sh').contains(name) && lib.inpile.contains(name);
		},
		init: function (player) {
			if (!player.storage.gf_sh) player.storage.gf_sh = [];
		},
		onremove: true,
		chooseButton: {
			dialog: function (event, player) {
				var list = [];
				for (var i = 0; i < lib.inpile.length; i++) {
					var name = lib.inpile[i];
					if (player.storage.gf_sh.contains(name)) continue;
					if (name == 'sha') {
						list.push(['基本', '', 'sha']);
						list.push(['基本', '', 'sha', 'fire']);
						list.push(['基本', '', 'sha', 'thunder']);
					} else if (get.type(name) == 'trick') list.push(['锦囊', '', name]);
					else if (get.type(name) == 'basic') list.push(['基本', '', name]);
				}
				if (list.length == 0) {
					return ui.create.dialog('春雨已无牌可用');
				}
				return ui.create.dialog('春雨', [list, 'vcard']);
			},
			filter: function (button, player) {
				return _status.event.getParent().filterCard(
					{
						name: button.link[2]
					},
					player,
					_status.event.getParent()
				);
			},
			check: function (button) {
				if (_status.event.getParent().type != 'phase') return 1;
				var player = _status.event.player;
				if (['wugu', 'zhulu_card', 'yiyi', 'lulitongxin', 'lianjunshengyan', 'diaohulishan'].contains(button.link[2])) return 0;
				return player.getUseValue({
					name: button.link[2],
					nature: button.link[3]
				});
			},
			backup: function (links, player) {
				return {
					popname: true,
					viewAs: {
						name: links[0][2],
						nature: links[0][3],
						suit: 'none',
						number: null,
						isCard: true
					},
					filterCard: () => false,
					selectCard: -1,
					log: false,
				};
			},
			prompt: function (links, player) {
				return '将一张牌当做' + (get.translation(links[0][3]) || '') + get.translation(links[0][2]) + '使用';
			},
		},
		ai: {
			fireAttack: true,
			save: true,
			respondSha: true,
			respondShan: true,
			skillTagFilter: function (player) {
				if (!player.countCards('hse')) return false;
			},
			order: 4,
			basic: {
				useful: [6, 4, 3],
				value: [6, 4, 3],
			},
			result: {
				player: function (player) {
					if (_status.event.dying) return get.attitude(player, _status.event.dying);
					return 1;
				},
			},
		},
		group: ["gf_sh_1", "gf_sh_2"],
		subSkill: {
			"1": {
				trigger: {
					player: ["useCardAfter", "respondAfter"],
				},
				silentForce: true,
				filter: function (event, player) {
					return player.isPhaseUsing();
				},
				content: function () {
					if (event.skill == 'gf_sh_backup') {
						player.storage.gf_sh.remove(player.getStorage('gf_sh').contains(name));
					}
					player.storage.gf_sh.add(trigger.card.name);
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: "phaseZhunbeiBegin",
				},
				content: function () {
					var next = game.createEvent('gf_sh');
					next.player = player;
					next.setContent(lib.skill.gf_sh);
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"cy_c": {
		trigger: {
			player: ["phaseZhunbeiBegin"],
		},
		direct: true,
		content: function () {
			'step 0'
			if (!player.storage.cy_c_1) player.storage.cy_c_1 = [];
			if (!player.storage.cy_c) player.storage.cy_c = [];
			var list = { basic: [], equip: [], trick: [], delay: [] };
			for (var i = 0; i < lib.inpile.length; i++) {
				var name = lib.inpile[i];
				var info = lib.card[name];
				if (info.autoViewAs || name == 'yuansuhuimie') continue;
				//if(player.storage.hlss_fengqi_used.contains(name)) continue;
				if (lib.filter.cardEnabled({ name: name }, player)) {
					if (!list[info.type]) {
						list[info.type] = [];
					}
					list[info.type].push([get.translation(lib.card[name].type), '', name]);
				}
			}
			if (list.trick.length) {
				list.trick.sort(lib.sort.name);
				list.basic.sort(lib.sort.name);
				var dialog = ui.create.dialog('春雨', [list.basic, 'vcard'], [list.trick, 'vcard']);
				var rand1 = Math.random() < 1 / 3;
				var rand2 = Math.random() < 0.5;
				var rand3 = Math.random() < 1 / 3;
				var rand4 = Math.random() < 1 / 3;
				player.chooseButton(dialog).set('filterButton', function (button) {
					var name = button.link[2];
					if (player.storage.cy_c_1.contains(name)) return false;
					if (player.storage.cy_c.contains(name)) return false;
					return player.hasUseTarget(name);
				}).set('ai', function (button) {
					var name = button.link[2];
					var value = get.useful({ name: name });
					return value;
				});
			} else {
				event.finish();
			}
			'step 1'
			if (result.bool) {
				player.chooseUseTarget(result.links[0][2], true, false);
				if (get.type(result.links[0][2]) == 'trick') {
					player.storage.cy_c.add(result.links[0][2]);
				}
				player.storage.cy_c_1 = [];
				player.storage.cy_c_1.add(player.getStorage('cy_c_usedd').contains(name));
				player.storage.cy_c_1.add(result.links[0][2]);
			}
			player.storage.cy_c_usedd = [];
			if (player.countMark('cy_c_2') > 0) {
				player.removeMark('cy_c_2', player.countMark('cy_c_2'));
			}
		},
		ai: {
			threaten: 1.5,
		},
		group: ["cy_c_1", "cy_c_2"],
		subSkill: {
			"1": {
				trigger: {
					player: ["useCardAfter"],
				},
				silentForce: true,
				filter: function (event, player) {
					return player.isPhaseUsing();
				},
				content: function () {
					if (player.countMark('cy_c_2') < 1) {
						player.storage.cy_c_1.add(trigger.card.name);
					} else {
						player.storage.cy_c_usedd.add(trigger.card.name);
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: ["phaseAfter"],
				},
				silentForce: true,
				filter: function (event, player) {
					return player.isPhaseUsing();
				},
				content: function () {
					player.addMark('cy_c_2', 1);
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"tj_jueqing": {
		trigger: {
			player: "useCardToPlayered",
		},
		direct: true,
		filter: function (event, player) {
			if (get.name(event.card) == 'sha') return false;
			return event.isFirstTarget && event.targets.length == 1 && get.tag(event.card, 'damage') > 0;
		},
		content: function () {
			"step 0"
			if (player.hasMark('tj_jueqing1')) {
				player.removeMark('tj_jueqing1', player.countMark('tj_jueqing1'));
			}
			if (player.hasMark('tj_jueqing2')) {
				player.removeMark('tj_jueqing2', player.countMark('tj_jueqing2'));
			}
			player.judge();
			"step 1"
			event.count = result.number
			player.chooseToDiscard('你可以弃置一张牌，若点数为【' + get.translation(event.count) + '】，其减少一点体力上限；否则，对即将造成的伤害视为失去体力。', 'he').set('ai', function (card) {
				return 8 - get.value(card);
			});
			"step 2"
			if (result.bool) {
				if (get.number(result.cards[0]) == event.count) {
					player.addMark('tj_jueqing2', 1);
				} else {
					player.addMark('tj_jueqing1', 1);
				}
				player.addTempSkill('tj_jueqing_1');
			}
		},
		"_priority": 0,
		subSkill: {
			"1": {
				trigger: {
					source: "damageBefore",
				},
				filter: function (event, player) {
					return event.card && event.card.name != 'sha';
				},
				forced: true,
				silent: true,
				popup: false,
				charlotte: true,
				content: function () {
					if (player.hasMark('tj_jueqing1')) {
						trigger.cancel();
						trigger.player.loseHp(trigger.num);
						player.removeMark('tj_jueqing1', player.countMark('tj_jueqing1'));
					}
					if (player.hasMark('tj_jueqing2')) {
						trigger.cancel();
						trigger.player.loseMaxHp();
						player.removeMark('tj_jueqing2', player.countMark('tj_jueqing2'));
					}
					player.removeSkill('tj_jueqing_1');
				},
				ai: {
					jueqing: true,
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"tj_shangshi": {
		trigger: {
			player: ["loseAfter", "changeHp", "gainMaxHpAfter", "loseMaxHpAfter"],
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		frequent: true,
		filter: function (event, player) {
			if (event.getl && !event.getl(player)) return false;
			return player.countCards('h') < player.getDamagedHp();
		},
		content: function () {
			player.draw(player.getDamagedHp() - player.countCards('h'));
		},
		ai: {
			noh: true,
			skillTagFilter: function (player, tag) {
				if (tag == 'noh' && player.maxHp - player.hp < player.countCards('h')) {
					return false;
				}
			},
		},
		"_priority": 0,
		group: "tj_shangshi_1",
		subSkill: {
			"1": {
				trigger: {
					player: "dying",
				},
				frequent: true,
				filter: function (event, player) {
					return player.countMark('tj_shangshi') < 1;
				},
				content: function () {
					'step 0'
					player.addMark('tj_shangshi', 1);
					if (player.hasSkill('tj_xuanmu')) {
						player.removeSkill('tj_xuanmu');
					}
					'step 1'
					player.addSkill('tj_xuanmu');
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"tj_xuanmu": {
		trigger: {
			player: ["loseAfter", "gainMaxHpAfter", "loseMaxHpAfter"],
			global: ["changeHp", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		juexingji: true,
		forced: true,
		skillAnimation: true,
		animationColor: "metal",
		filter: function (event, player) {
			event.count = 0;
			if (player.countCards('h', { type: 'trick', }) || player.countCards('h', { type: 'delay', })) {
				event.count++
			}
			if (player.countCards('h', { type: 'basic', })) {
				event.count++
			}
			if (player.countCards('h', { type: 'equip', })) {
				event.count++
			}
			var num = game.countPlayer(function (current) {
				return current.isDamaged();
			});
			return player == _status.currentPhase && num == game.countPlayer() && event.count > 2;
		},
		content: function () {
			if (player.hasMark('tj_shangshi')) {
				player.awakenSkill('tj_xuanmu');
			}
			player.removeSkill('tj_xuanmu');
			player.chooseToDiscard(true, 3, get.prompt2('tj_xuanmu'), '请弃置三种类型不同的牌。', function (card, player) {
				if (ui.selected.cards.some(cardx => get.type(cardx, player) == 'delay') && get.type(card, player) == 'trick') return false;
				if (ui.selected.cards.some(cardx => get.type(cardx, player) == 'trick') && get.type(card, player) == 'delay') return false;
				return !ui.selected.cards.some(cardx => get.type(cardx, player) == get.type(card, player));
			}).set('ai', card => {
				if (_status.event.goon) return 7 - get.value(card);
				return 0;
			});
			player.gainMaxHp();
		},
		"_priority": 0,
	},
	"n_diwei": {
		trigger: {
			player: "dying",
		},
		frequent: true,
		zhuSkill: true,
		content: function () {
			var next = player['phaseUse']();
			event.next.remove(next);
			trigger.next.push(next);
			player.addTempSkill('n_diwei_1', { player: 'phaseUseAfter' });
		},
		"_priority": 0,
		subSkill: {
			"1": {
				trigger: {
					player: "phaseUseEnd",
				},
				forced: true,
				silent: true,
				popup: false,
				charlotte: true,
				content: function () {
					var num = 0;
					if (player.hasHistory('sourceDamage', function (evt) {
						num += evt.num;
						return num;
					})) {
						player.recover(num);
					}
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"n_yixin": {
		trigger: {
			global: "damageSource",
		},
		filter: function (event, player) {
			if (!event.card) return false;
			if (get.type(event.card) != 'trick' && get.name(event.card) != 'sha') return false;
			return get.itemtype(event.cards) == 'cards' && get.position(event.cards[0], true) == 'o';
		},
		forced: true,
		content: function () {
			'step 0'
			var a = player.countMark('n_yixin1'), b = player.countMark('n_yixin2'), c = player.countMark('n_yixin3');
			if (a + b + c < 3) {
				if (a + b + c != 1) {
					if (a > 0 && b > 0) event._result = { index: 2 };
					else if (a > 0 && c > 0) event._result = { index: 1 };
					else if (b > 0 && c > 0) event._result = { index: 0 };
					if (a + b + c < 1) {
						player.chooseControl().set('choiceList', [
							'你获得（' + get.translation(trigger.card) + '）',
							'你获得一点护甲',
							'你失去全部体力值，然后摸等量张牌',
						]).set('ai', () => {
							return 0;
						});
					}
				} else {
					if (a == 1) {
						player.chooseControl().set('choiceList', [
							'你获得一点护甲',
							'你失去全部体力值，然后摸等量张牌',
						]).set('ai', () => {
							return 0;
						});
					} else {
						if (b == 1) {
							player.chooseControl().set('choiceList', [
								'你获得（' + get.translation(trigger.card) + '）',
								'你失去全部体力值，然后摸等量张牌',
							]).set('ai', () => {
								return 0;
							});
						} else {
							player.chooseControl().set('choiceList', [
								'你获得（' + get.translation(trigger.card) + '）',
								'你获得一点护甲',
							]).set('ai', () => {
								return 0;
							});
						}
					}
				}
			}
			'step 1'
			var a = player.countMark('n_yixin1'), b = player.countMark('n_yixin2'), c = player.countMark('n_yixin3');
			if (a < 1 && result.index == 0) {
				player.addMark('n_yixin1', 1);
				player.gain(trigger.cards, 'gain2');
			}
			if (((a + b + c < 1 || c > 0 && a + b < 1) && result.index == 1) || c + b < 1 && a > 0 && result.index == 0) {
				player.addMark('n_yixin2', 1);
				player.changeHujia(1);
			}
			if (result.index == 2 || a + b > 0 && c < 1 && result.index == 1) {
				player.addMark('n_yixin3', 1);
				var a = player.hp;
				player.loseHp(a);
				player.draw(a);
			}
		},
		"_priority": 0,
		group: "n_yixin_1",
		subSkill: {
			"1": {
				trigger: {
					global: "phaseAfter",
				},
				forced: true,
				silent: true,
				popup: false,
				charlotte: true,
				filter: function (event, player) {
					var a = player.countMark('n_yixin1'), b = player.countMark('n_yixin2'), c = player.countMark('n_yixin3');
					return a + b + c > 0;
				},
				content: function () {
					var a = player.countMark('n_yixin1'), b = player.countMark('n_yixin2'), c = player.countMark('n_yixin3');
					if (a > 0) {
						player.removeMark('n_yixin1', a);
					}
					if (b > 0) {
						player.removeMark('n_yixin2', b);
					}
					if (c > 0) {
						player.removeMark('n_yixin3', c);
					}
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"cy_tongmu": {
		trigger: {
			player: "damageBegin4",
		},
		filter: function (event) {
			return event.hasNature('fire');
		},
		frequent: true,
		content: function () {
			trigger.cancel();
			player.recover();
		},
		ai: {
			nofire: true,
			effect: {
				target: function (card, player, target, current) {
					if (get.tag(card, 'fireDamage')) return 'zerotarget';
				},
			},
		},
		"_priority": 0,
		group: "cy_tongmu_1",
		subSkill: {
			"1": {
				trigger: {
					source: "damageAfter",
				},
				logTarget: "player",
				filter: function (event, player) {
					return player != event.player && event.hasNature('fire');
				},
				frequent: true,
				content: function () {
					player.damage(1, 'thunder');
					trigger.player.damage(1, 'thunder');
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"cy_tongxin": {
		enable: "chooseToUse",
		usable: 1,
		derivation: "lianying",
		filter: function (event, player) {
			if (event.type == 'wuxie') return false;
			var hs = player.getCards('h');
			if (!hs.length) return false;
			for (var i of hs) {
				if (game.checkMod(i, player, 'unchanged', 'cardEnabled2', player) === false) return false;
			}
			for (var i of lib.inpile) {
				if ((i == 'sha' || i == 'jiu') && event.filterCard({ name: i, cards: hs }, player, event)) return true;
			}
			return false;
		},
		chooseButton: {
			dialog: function (event, player) {
				var vcards = [], hs = player.getCards('h');
				for (var i of lib.inpile) {
					if ((i == 'sha' || i == 'jiu') && event.filterCard({ name: i, cards: hs }, player, event)) vcards.push(['基本', '', i]);
				}
				return ui.create.dialog('同心', [vcards, 'vcard']);
			},
			check: function (button, player) {
				if (_status.event.getParent().type != 'phase') return 1;
				return _status.event.player.getUseValue({ name: button.link[2], nature: button.link[3] });
			},
			backup: function (links, player) {
				return {
					popname: true,
					viewAs: { name: links[0][2], nature: links[0][3] },
					filterCard: true,
					selectCard: -1,
					position: 'h',
					onuse: function (result, player) {
						if (!player.hasSkill('lianying')) {
							player.addTempSkill('lianying', { player: 'phaseBefore' });
						}
					}
				}
			},
			prompt: function (links, player) {
				return '将所有手牌当做' + (get.translation(links[0][3]) || '') + get.translation(links[0][2]) + '使用或打出';
			},
		},
		hiddenCard: function (player, name) {
			return (name == 'sha' || name == 'jiu') && player.countCards('h') > 0;
		},
		ai: {
			respondSha: true,
			respondShan: true,
			skillTagFilter: function (player) {
				return player.countCards('h') > 0;
			},
			order: 0.5,
			result: {
				player: function (player) {
					if (_status.event.dying) {
						return get.attitude(player, _status.event.dying);
					}
					if (_status.event.type == 'respondShan') return 1;
					var val = 0, hs = player.getCards('h'), max = 0;
					for (var i of hs) {
						val += get.value(i, player);
						if (get.type(i, player) == 'trick') max += 5;
					}
					return val <= max ? 1 : 0;
				},
			},
		},
		"_priority": 0,
	},
	"cy_gujiang": {
		trigger: {
			player: "useCardAfter",
		},
		frequent: true,
		filter: function (event, player) {
			if (!get.tag(event.card, 'damage')) {
				return player.countMark('cy_gujiang_Mark') > 0;
			}
		},
		init: function (player) {
			player.storage.gujiang = 0;
			player.markSkill("cy_gujiang");
			player.syncStorage("cy_gujiang");
		},
		mod: {
			maxHandcard: function (player, num) {
				return num + player.countMark('cy_gujiang');
			},
		},
		content: function () {
			player.addMark("cy_gujiang", 1);
			player.removeMark("cy_gujiang_Mark", 1);
		},
		group: "cy_gujiang_Mark",
		subSkill: {
			Mark: {
				mark: true,
				intro: {
					content: "〖固江〗还可使用#次",
				},
				init: function (player) {
					player.storage.cy_gujiang_Mark = 3;
					player.markSkill("cy_gujiang_Mark");
					player.syncStorage("cy_gujiang_Mark");
				},
				trigger: {
					global: "roundStart",
				},
				forced: true,
				silent: true,
				popup: false,
				charlotte: true,
				filter: function (event, player) {
					return player.countMark('cy_gujiang_Mark') < 3;
				},
				content: function () {
					player.addMark('cy_gujiang_Mark', 3 - player.countMark('cy_gujiang_Mark'));
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"cy_cuixian": {
		trigger: {
			player: "useCard",
		},
		filter: function (event, player) {
			if (!get.tag(event.card, 'damage')) {
				return false;
			}
			return event.targets != player && event.targets.length == 1;
		},
		mod: {
			maxHandcard: function (player, num) {
				return num - player.countMark('cy_cuixian');
			},
		},
		logTarget: function (event, player) {
			return event.targets[0];
		},
		content: function () {
			player.addMark('cy_cuixian', 1);
			var target = lib.skill.cy_cuixian.logTarget(trigger, player);
			player.gainPlayerCard(target, 'hej', true);
		},
		"_priority": 0,
	},
	"cy_wuce": {
		trigger: {
			global: ["useSkillAfter", "logSkill"],
			player: ["changeHp"],
		},
		init: function (player) {
			player.storage.cy_wuce_Mark = 5;
			player.markSkill("cy_wuce_Mark");
			player.syncStorage("cy_wuce_Mark");
		},
		forced: true,
		filter: function (event, player) {
			return player.countMark('cy_wuce_Mark') != player.getHandcardLimit();
		},
		content: function () {
			'step 0'
			var a = player.getHandcardLimit(), b = player.countMark('cy_wuce_Mark');
			if (a > b) {
				player.addMark('cy_wuce_Mark', a - b);
			} else {
				player.removeMark('cy_wuce_Mark', b - a);
			}
			'step 1'
			if (player.getHandcardLimit() % 5 == 0 && player.countMark('cy_wuce_Mark') == player.getHandcardLimit()) {
				player.draw();
			}
		},
		"_priority": 0,
	},
	"gzhlb_daobi": {
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		usable: 1,
		filterTarget: function (card, player, target) {
			return player != target;
		},
		content: function () {
			var target = event.targets[0];
			target.draw(target.maxHp);
			target.addMark('gzhlb_daobi', 1);
			player.draw(player.maxHp);
			player.addTempSkill('gzhlb_daobi_self');
			player.addTempSkill('gzhlb_daobi_respond');
			if (player.canUse({ name: "juedou" }, target)) player.useCard({ name: "juedou" }, target, false);
		},
		ai: {
			order: function () {
				return get.order({ name: 'juedou' }) - 0.5;
			},
			result: {
				player: 1,
				target: -1.5,
			},
			wuxie: function (target, card, player, viewer) {
				if (player == game.me && get.attitude(viewer, player) > 0) {
					return 0;
				}
			},
			basic: {
				order: 5,
				useful: 1,
				value: 5.5,
			},
			tag: {
				respond: 2,
				respondSha: 2,
				damage: 1,
			},
		},
		"_priority": 0,
		group: "gzhlb_daobi_after",
		subSkill: {
			self: {
				trigger: {
					global: "damageBegin2",
				},
				forced: true,
				silent: true,
				popup: false,
				charlotte: true,
				content: function () {
					trigger.num += trigger.player.countCards('h', 'sha');
				},
				sub: true,
				"_priority": 0,
			},
			after: {
				trigger: {
					player: "gzhlb_daobiAfter",
				},
				forced: true,
				silent: true,
				popup: false,
				charlotte: true,
				content: function () {
					var a = player.countMark('gzhlb_daobi_respond'), b = Math.ceil(a / 2), c = player.maxHp;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].hasMark('gzhlb_daobi')) {
							var d = list[i].maxHp;
							player.line(list[i], 'green');
							list[i].removeMark('gzhlb_daobi', list[i].countMark('gzhlb_daobi'));
							if (b < d) {
								list[i].chooseToDiscard(d - b, true);
							}
							if (a % 2 == 0 && b < c) {
								player.chooseToDiscard(c - b, true);
							}
						}
					}
					player.removeMark('gzhlb_daobi_respond', a);
					player.removeSkill('gzhlb_daobi_self');
					player.removeSkill('gzhlb_daobi_respond');
				},
				sub: true,
				"_priority": 0,
			},
			respond: {
				trigger: {
					global: "respondEnd",
				},
				forced: true,
				silent: true,
				popup: false,
				content: function () {
					player.addMark('gzhlb_daobi_respond', 1);
				},
				sub: true,
				"_priority": 0,
			},
		},
	}, 
	"gzhlb_jiuji": {
		global: "gzhlb_jiuji_a",
		subSkill: {
			a: {
				enable: "phaseUse",
				usable: 1,
				prompt: "你可弃置2张牌或流失1点体力令一名其他角色摸3张牌，然后若其手牌数不大于你，你恢复1点体力并摸2张牌。",
				check: function (card) {
					return 6 - get.value(card)
				},
				position: "he",
				selectCard() {
					// 如果玩家血量小于1，返回2（必须弃置2张）
					if (_status.event.player.hp < 1 || ui.selected.cards.length == 1) {
						return 2;
					}
					return [0, 2];
				},
				filterCard:true,
				selectTarget: 1,
				filter: function (event, player) {
					return player.countCards("he") > 1 || player.hp > 0;
				},
				filterTarget: function (card, player, target) {
					return target != player;
				},
				content: function () {
					"step 0"
					if (!cards.length) {
						player.loseHp();
					}
					player.line(target);
					target.draw(3);
					"step 1"
					if (player.countCards('h') >= target.countCards('h')) {
						player.recover();
						player.draw(2);
					}
				},
				ai: {
					order: 4,
					result: {
						player: -1,
						target: 3,
					},
					expose: 0.4,
					threaten: 1,
				},
				sub: true,
			},
		},
	},
	"gzhlb_qifu": {
		enable: "phaseUse",
		trigger: {
			player: "damageEnd",
		},
		usable: 2,
		filter: function (event, player) {
			return player.countMark('gzhlb_qifu') < 2;
		},
		content: function () {
			'step 0'
			var num = [1, 2, 3].randomGet();
			if (num == 1) player.draw(1);
			if (num == 2) player.draw(2);
			if (num == 3) player.draw(3);
			player.addMark('gzhlb_qifu', 1);
			'step 1'
			var num = [1, 2, 3].randomGet();
			if (num == 1) player.chooseToDiscard('he', true);
			if (num == 2) player.chooseToDiscard('he', 2, true);
		},
		ai: {
			order: 5,
			result: {
				player: 1,
			},
			threaten: 1,
		},
		"_priority": 0,
		group: ["gzhlb_qifu_1"],
		subSkill: {
			"1": {
				trigger: {
					global: "phaseAfter",
				},
				forced: true,
				silent: true,
				popup: false,
				filter: function (event, player) {
					return player.countMark('gzhlb_qifu') > 0;
				},
				content: function () {
					player.removeMark('gzhlb_qifu', player.countMark('gzhlb_qifu'));
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"gzhlb_shenshi": {
		enable: "phaseUse",
		mark: true,
		locked: false,
		zhuanhuanji: true,
		selectCard: 1,
		marktext: "☯",
		init: function (player) {
			player.storage.gzhlb_shenshi1 = 13 - game.countPlayer();
			player.markSkill("gzhlb_shenshi1");
			player.syncStorage("gzhlb_shenshi1");
		},
		intro: {
			content: function (storage, player, skill) {
				event.count = 0;
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].hasSkill('gzhlb_shenshi')) {
						event.count += list[i].countMark('gzhlb_shenshi1');
					}
				}
				if (player.storage.gzhlb_shenshi == true) {
					var str = '出牌阶段，你可以弃置一张牌点数小于【' + event.count + '】的牌，然后弃置【' + event.count + '】张牌并摸等于此牌点数张牌';
				} else {
					var str = '出牌阶段，你可以弃置一张牌点数大于【' + event.count + '】的牌，然后摸等于此牌点数张牌并弃置【' + event.count + '】张牌';
				}
				return str;
			},
		},
		usable: 1,
		position: "he",
		filterCard: function (card, player) {
			if (player.storage.gzhlb_shenshi == true)
				return get.number(card) < player.storage.gzhlb_shenshi1;
			else
				return get.number(card) > player.storage.gzhlb_shenshi1;
		},
		filter: function (event, player) {
			return player.countCards('h');
		},
		check: function (card) {
			var val = get.value(card);
			var num = card.number;
			if (num > 10) return 15 - val;
			if (num > 8) return 10 - val;
			if (num > 2) return 5 - val;
		},
		content: function () {
			'step 0'
			var num = get.number(cards[0]);
			var a = player.storage.gzhlb_shenshi1;
			if (player.storage.gzhlb_shenshi == true) {
				if (a > 0) {
					player.chooseToDiscard('he', a, true);
				}
				player.draw(num);
			} else {
				player.draw(num);
				if (a > 0) {
					player.chooseToDiscard('he', a, true);
				}
			}
			player.storage.gzhlb_shenshi1 = num;
			'step 1'
			player.changeZhuanhuanji("gzhlb_shenshi"); 1;
		},
		ai: {
			order: 10,
			result: {
				player: 1,
			},
		},
		"_priority": 0,
	},
	"gy_douhun": {
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		usable: 3,
		content: function () {
			'step 0'
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				list[i].addTempSkill('gy_douhun_wuxie');
			}
			player.loseHp();
			player.draw();
			player.chooseCardTarget({
				prompt: get.prompt('gy_douhun'),
				filterCard: lib.filter.cardDiscardable,
				position: 'h',
				filterTarget: function (card, player, target) {
					return player != target;
				},
				ai1: function (card) {
					return 8 - get.value(card);
				},
				ai2: function (target) {
					return 6 - target.hp;
				}
			});
			"step 1"
			if (result.bool) {
				if (player.canUse(get.autoViewAs({ name: 'juedou' }, [ui.cardPile.firstChild]), result.targets[0], false)) {
					player.useCard({ name: 'juedou' }, result.targets[0], result.cards);
				}
			}
		},
		ai: {
			order: function () {
				return get.order({ name: 'juedou' }) - 0.5;
			},
			result: {
				player: 1,
				target: -1.5,
			},
			wuxie: function (target, card, player, viewer) {
				if (player == game.me && get.attitude(viewer, player) > 0) {
					return 0;
				}
			},
			basic: {
				order: 5,
				useful: 1,
				value: 5.5,
			},
			tag: {
				respond: 2,
				respondSha: 2,
				damage: 1,
			},
		},
		"_priority": 0,
		group: ["gy_douhun_self", "gy_douhun_draw", "gy_douhun_after"],
		subSkill: {
			self: {
				trigger: {
					player: "damageBefore",
				},
				forced: true,
				filter: function (event, player) {
					return event.card && event.card.name == 'juedou';
				},
				content: function () {
					player.draw();
				},
				sub: true,
				"_priority": 0,
			},
			wuxie: {
				mod: {
					wuxieJudgeEnabled: () => false,
					wuxieEnabled: () => false,
					cardEnabled: (card) => {
						if (card.name == 'wuxie') return false;
					},
				},
				sub: true,
				"_priority": 0,
			},
			after: {
				trigger: {
					player: "gy_douhunAfter",
				},
				forced: true,
				silent: true,
				popup: false,
				charlotte: true,
				content: function () {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						list[i].removeSkill('gy_douhun_wuxie');
					}
				},
				sub: true,
				"_priority": 0,
			},
			draw: {
				trigger: {
					player: "phaseDiscardAfter",
				},
				frequent: true,
				filter: function (event, player) {
					return player.hp < player.maxHp;
				},
				content: function () {
					player.draw(player.getDamagedHp());
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"gy_wudao": {
		trigger: {
			player: "damageBegin2",
		},
		mark: true,
		forced: true,
		init: function (player) {
			player.storage.gy_wudao = 0;
		},
		intro: {
			content: function (storage, player, skill) {
				event.count = 0;
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].hasSkill('gy_wudao')) {
						event.count += list[i].countMark('gy_wudao');
					}
				}
				if (event.count < 1) {
					var str = '你未记录任何伤害';
				} else {
					var str = '你已记录伤害【' + event.count + '】点';
				}
				return str;
			},
		},
		filter: function (event, player) {
			return player.countMark('gy_wudao') < 1;
		},
		content: function () {
			player.addMark('gy_wudao', trigger.num);
			trigger.cancel();
		},
		group: "gy_wudao_target",
		subSkill: {
			target: {
				trigger: {
					source: "damageBegin2",
				},
				forced: true,
				function: function (event, player) {
					return player.hasMark('gy_wudao');
				},
				content: function () {
					trigger.player.loseHp(player.countMark('gy_wudao'));
					player.removeMark('gy_wudao', player.countMark('gy_wudao'));
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gy_suyuan": {
		trigger: {
			player: "phaseEnd",
		},
		forced: true,
		filter: function (event, player) {
			return player.hasMark('gy_wudao');
		},
		content: function () {
			player.recover(player.countMark('gy_wudao'));
			player.removeMark('gy_wudao', player.countMark('gy_wudao'));
		},
		group: "gy_suyuan_add",
		subSkill: {
			add: {
				trigger: {
					player: "recoverBefore",
				},
				filter: function (event, player) {
					return player.hp < 2;
				},
				forced: true,
				content: function () {
					trigger.num++;
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gzhlb_jiuling": {
		trigger: {
			global: "gameStart",
		},
		banned: ["reacgn_fuling_tenka"],
		init: function (player) {
			player.storage.gzhlb_jiuling19 = ["gzhlb_jiuling10", "gzhlb_jiuling11", "gzhlb_jiuling12", "gzhlb_jiuling13", "gzhlb_jiuling14", "gzhlb_jiuling15", "gzhlb_jiuling16", "gzhlb_jiuling17", "gzhlb_jiuling18", "gzhlb_jiuling21", "gzhlb_jiuling22", "gzhlb_jiuling23", "gzhlb_jiuling24", "gzhlb_jiuling25", "gzhlb_jiuling26", "gzhlb_jiuling27", "gzhlb_jiuling28", "gzhlb_jiuling29"];
		},
		initList: function (player) {
			var list, skills = [];
			if (_status.connectMode) list = get.charactersOL();
			else {
				list = [];
				for (var i in lib.character) {
					if (lib.filter.characterDisabled2(i) || lib.filter.characterDisabled(i)) continue;
					list.push(i);
				}
			}
			for (var i of list) {
				for (var j of lib.character[i][3]) {
					if (j == 'gzhlb_jiuling') continue;
					var skill = lib.skill[j];
					if (!skill || skill.charlotte || skill.juexingji || skill.hiddenSkill || skill.zhuSkill || skill.dutySkill || skill.chargeSkill || lib.skill.gzhlb_jiuling.banned.contains(j)) continue;
					if (skill.ai && (skill.ai.combo || skill.ai.notemp || skill.ai.neg)) continue;
					var info = lib.translate[j + '_info'];
					if (info && info.indexOf('造成') != -1 && info.indexOf('限定') == -1) {
						if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling21")) {
							skills.add(j);
							player.storage.gzhlb_jiuling1 = skills;
						}
					}
					if (info && info.indexOf('受到') != -1 && info.indexOf('限定') == -1) {
						if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling22")) {
							skills.add(j);
							player.storage.gzhlb_jiuling2 = skills;
						}
					}
					if (info && info.indexOf('摸牌') != -1 && info.indexOf('限定') == -1) {
						if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling23")) {
							skills.add(j);
							player.storage.gzhlb_jiuling3 = skills;
						}
					}
					if (info && info.indexOf('出牌') != -1 && info.indexOf('限定') == -1) {
						if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling24")) {
							skills.add(j);
							player.storage.gzhlb_jiuling4 = skills;
						}
					}
					if (info && info.indexOf('目标') != -1 && info.indexOf('限定') == -1) {
						if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling25")) {
							skills.add(j);
							player.storage.gzhlb_jiuling5 = skills;
						}
					}
					if (info && info.indexOf('当做') != -1 && info.indexOf('限定') == -1) {
						if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling26")) {
							skills.add(j);
							player.storage.gzhlb_jiuling6 = skills;
						}
					}
					if (info && info.indexOf('锁定') != -1 && info.indexOf('限定') == -1) {
						if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling27")) {
							skills.add(j);
							player.storage.gzhlb_jiuling7 = skills;
						}
					}
					if (info && info.indexOf('限定') != -1) {
						if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling28")) {
							skills.add(j);
							player.storage.gzhlb_jiuling8 = skills;
						}
					}
					if (info && info.indexOf('标记') != -1 && info.indexOf('限定') == -1) {
						if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling29")) {
							skills.add(j);
							player.storage.gzhlb_jiuling9 = skills;
						}
					}
				}
			}
		},
		check: function (event, player) {
			return true;
		},
		forced: true,
		content: function () {
			"step 0"
			if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling21"))
				player.storage.gzhlb_jiuling19.add('gzhlb_jiuling21');
			if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling22"))
				player.storage.gzhlb_jiuling19.add('gzhlb_jiuling22');
			if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling23"))
				player.storage.gzhlb_jiuling19.add('gzhlb_jiuling23');
			if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling24"))
				player.storage.gzhlb_jiuling19.add('gzhlb_jiuling24');
			if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling25"))
				player.storage.gzhlb_jiuling19.add('gzhlb_jiuling25');
			if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling26"))
				player.storage.gzhlb_jiuling19.add('gzhlb_jiuling26');
			if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling27"))
				player.storage.gzhlb_jiuling19.add('gzhlb_jiuling27');
			if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling28"))
				player.storage.gzhlb_jiuling19.add('gzhlb_jiuling28');
			if (!player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling29"))
				player.storage.gzhlb_jiuling19.add('gzhlb_jiuling29');
			event.list = [];
			if (player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling10")) event.list.push("造成");
			if (player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling11")) event.list.push("受到");
			if (player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling12")) event.list.push("摸牌");
			if (player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling13")) event.list.push("出牌");
			if (player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling14")) event.list.push("目标");
			if (player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling15")) event.list.push("当做");
			if (player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling16")) event.list.push("锁定");
			if (player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling17")) event.list.push("限定");
			if (player.storage.gzhlb_jiuling19.contains("gzhlb_jiuling18")) event.list.push("标记");
			"step 1"
			if (event.list.length) {
				player.chooseControl(event.list).set('prompt', "你从以下关键词中选择一项（每个选项限一次），然后在给出的3个包含此关键词的技能中选择一个获得直到游戏结束");
			} else event.finish();
			"step 2"
			if (result.control) {
				event.list.remove(result.control);
				switch (result.control) {
					case "造成":
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling10');
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling21');
						if (!player.storage.gzhlb_jiuling1) lib.skill.gzhlb_jiuling.initList(player);
						var list = player.storage.gzhlb_jiuling1.randomGets(3);
						if (!list.length) {
							event.finish();
							return;
						}
						break;
					case "受到":
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling11');
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling22');
						if (!player.storage.gzhlb_jiuling2) lib.skill.gzhlb_jiuling.initList(player);
						var list = player.storage.gzhlb_jiuling2.randomGets(3);
						if (!list.length) {
							event.finish();
							return;
						}
						break;
					case "摸牌":
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling12');
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling23');
						if (!player.storage.gzhlb_jiuling3) lib.skill.gzhlb_jiuling.initList(player);
						var list = player.storage.gzhlb_jiuling3.randomGets(3);
						if (!list.length) {
							event.finish();
							return;
						}
						break;
					case "出牌":
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling13');
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling24');
						if (!player.storage.gzhlb_jiuling4) lib.skill.gzhlb_jiuling.initList(player);
						var list = player.storage.gzhlb_jiuling4.randomGets(3);
						if (!list.length) {
							event.finish();
							return;
						}
						break;
					case "目标":
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling14');
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling25');
						if (!player.storage.gzhlb_jiuling5) lib.skill.gzhlb_jiuling.initList(player);
						var list = player.storage.gzhlb_jiuling5.randomGets(3);
						if (!list.length) {
							event.finish();
							return;
						}
						break;
					case "当做":
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling15');
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling26');
						if (!player.storage.gzhlb_jiuling6) lib.skill.gzhlb_jiuling.initList(player);
						var list = player.storage.gzhlb_jiuling6.randomGets(3);
						if (!list.length) {
							event.finish();
							return;
						}
						break;
					case "锁定":
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling16');
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling27');
						if (!player.storage.gzhlb_jiuling7) lib.skill.gzhlb_jiuling.initList(player);
						var list = player.storage.gzhlb_jiuling7.randomGets(3);
						if (!list.length) {
							event.finish();
							return;
						}
						break;
					case "限定":
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling17');
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling28');
						if (!player.storage.gzhlb_jiuling8) lib.skill.gzhlb_jiuling.initList(player);
						var list = player.storage.gzhlb_jiuling8.randomGets(3);
						if (!list.length) {
							event.finish();
							return;
						}
						break;
					case "标记":
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling18');
						player.storage.gzhlb_jiuling19.remove('gzhlb_jiuling29');
						if (!player.storage.gzhlb_jiuling9) lib.skill.gzhlb_jiuling.initList(player);
						var list = player.storage.gzhlb_jiuling9.randomGets(3);
						if (!list.length) {
							event.finish();
							return;
						}
						break;
				}
				game.log(player, "选择了关键词：", result.control);
				player.update();
			}
			player.chooseControl(list).set('choiceList', list.map(function (i) {
				return '<div class="skill">【' + get.translation(lib.translate[i + '_ab'] || get.translation(i).slice(0, 2)) + '】</div><div>' + get.skillInfoTranslation(i, player) + '</div>';
			})).set('displayIndex', false).set('prompt', '九零：请选择你要获得的技能').set('ai', () => {
				var list = _status.event.controls.slice();
				return list.sort((a, b) => {
					return get.skillRank(b, 'in') - get.skillRank(a, 'in');
				})[0];
			});
			'step 3'
			player.addMark('gzhlb_jiuling20', 1);
			var a = player.countMark('gzhlb_jiuling20');
			player.addSkill(result.control);
			player.popup(result.control);
			game.log(player, '获得了', '#g【' + get.translation(result.control) + '】');
			if (player.countMark('gzhlb_jiuling20') < 3) {
				player.chooseControl('获得技能', 'cancel2', ui.create.dialog('是否重复此操作（还剩【' + (3 - a) + '】次）？<br>若取消，你将体力上限和体力调整为【' + (player.maxHp - a) + '】')).ai = function () {
					return 0;
				}
			}
			"step 4"
			if (result.control == '获得技能') {
				event.goto(0);
			} else {
				player.maxHp = player.maxHp - player.countMark('gzhlb_jiuling20');
				event.finish();
			}

		},
		ai: {
			threaten: 0.9,
		},
		"_priority": 0,
	},
	//风林
	"qbzc_biaohun": {
		unique: true,
		blacklist: {
			liubei: ["luxun"],
			luxun: ["liubei"],
			zhenji: ["simayi"],
			simayi: ["zhenji"]
		},
		init: function (player) {
			player.storage.qbzc_biaohun = {
				shown: [],
				owned: {},
				characterlist: ["liubei", "guanyu", "huanggai", "ganning", "zhangfei", "sunquan", "sunshangxiang", "xuzhu", "huatuo", "luxun", "diaochan", "simayi", "daqiao", "xiahoudun", "huangyueying", "zhenji", "zhangliao", "guojia", "lvbu", "zhugeliang", "lvmeng", "zhouyu", "yuanshu", "xunyu", "re_pangtong", "yanwen", "sp_zhugeliang", "caopi", "zhurong", "menghuo", "jiaxu", "re_lusu", "zhanghe", "dengai", "liushan", "sunce", "zhangzhang", "jiangwei", "re_zuoci", "caiwenji", "yanyan", "kuailiangkuaiyue", "wangji", "lukang", "haozhao", "guanqiujian", "re_xiahouyuan", "sp_zhangjiao", "old_zhoutai", "re_yuji", "re_weiyan"],
			}
		},
		intro: {
			content: function (storage, player) {
				var str = '';
				var slist = storage.owned;
				var list = [];
				for (var i in slist) {
					list.push(i);
				}
				if (list.length) {
					str += get.translation(list[0]);
					for (var i = 1; i < list.length; i++) {
						str += '、' + get.translation(list[i]);
					}
					var skill = player.storage.qbzc_biaohun.current2;
					if (skill) {
						str += '<p>当前技能：' + get.translation(skill);
					}
					return str;
				} else {
					return '你未拥有“风火林山”牌';
				}
			},
			mark: function (dialog, content, player) {
				var slist = content.owned;
				var list = [];
				for (var i in slist) {
					list.push(i);
				}
				if (list.length) {
					var skill = player.storage.qbzc_biaohun.current2;
					if (skill) {
						for (var i = 0; i < skill.length; i++) {
							dialog.add('<div><div class="skill">【' + get.translation(lib.translate[skill[i] + '_ab'] || get.translation(skill[i]).slice(0, 2)) + '】</div>' + '<div>' + get.skillInfoTranslation(skill[i], player) + '</div></div>');
						}
					}
					if (player == game.me) {
						dialog.addSmall([list, 'character']);
						for (var i = 0; i < dialog.buttons.length; i++) {
							if (!player.isUnderControl(true)) {
								if (!content.shown.contains(dialog.buttons[i].link)) {
									dialog.buttons[i].node.group.remove();
									dialog.buttons[i].node.hp.remove();
									dialog.buttons[i].node.intro.remove();
									dialog.buttons[i].node.name.innerHTML = '未<br>知';
									dialog.buttons[i].node.name.dataset.nature = '';
									dialog.buttons[i].style.background = '';
									dialog.buttons[i]._nointro = true;
									dialog.buttons[i].classList.add('menubg');
								}
							}
						}
					} else {
						return '还有【' + list.length + '】张“风火林山”牌';
					}
				}
			},
		},
		"hasAvatarSkill": function (player, avatarName) {
			var avatarSkills = lib.character[avatarName][3] || [];
			for (var i = 0; i < avatarSkills.length; i++) {
				var skillName = avatarSkills[i];
				var skillInfo = lib.skill[skillName];
				if (skillInfo?.hiddenSkill || skillInfo?.dutySkill) continue;
				if (player.hasSkill(skillName)) {
					return true;
				}
			}
			return false;
		},
		"addqbzc_biaohun": function (player) {
			if (!player.storage.qbzc_biaohun) return;
			if (!_status.characterlist) {
				if (_status.connectMode) var list = get.charactersOL();
				else {
					var list = [];
					for (var i in lib.character) {
						if (lib.filter.characterDisabled2(i) || lib.filter.characterDisabled(i)) continue;
						list.push(i);
					}
				}
				game.countPlayer(function (current) {
					list.remove(current.name);
					list.remove(current.name1);
					list.remove(current.name2);
					if (current.storage.qbzc_biaohun && current.storage.qbzc_biaohun.owned) {
						for (var i in current.storage.qbzc_biaohun.owned) list.removeArray(current.storage.qbzc_biaohun.owned[i]);
					}
				});
				list = ["liubei", "guanyu", "huanggai", "ganning", "zhangfei", "sunquan", "sunshangxiang", "xuzhu", "huatuo", "luxun", "diaochan", "simayi", "daqiao", "xiahoudun", "huangyueying", "zhenji", "zhangliao", "guojia", "lvbu", "zhugeliang", "lvmeng", "zhouyu", "yuanshu", "xunyu", "re_pangtong", "yanwen", "sp_zhugeliang", "caopi", "zhurong", "menghuo", "jiaxu", "re_lusu", "zhanghe", "dengai", "liushan", "sunce", "zhangzhang", "jiangwei", "re_zuoci", "caiwenji", "yanyan", "kuailiangkuaiyue", "wangji", "lukang", "haozhao", "guanqiujian", "re_xiahouyuan", "sp_zhangjiao", "old_zhoutai", "re_yuji", "re_weiyan"];
				_status.characterlist = list;
			}
			_status.characterlist = ["liubei", "guanyu", "huanggai", "ganning", "zhangfei", "sunquan", "sunshangxiang", "xuzhu", "huatuo", "luxun", "diaochan", "simayi", "daqiao", "xiahoudun", "huangyueying", "zhenji", "zhangliao", "guojia", "lvbu", "zhugeliang", "lvmeng", "zhouyu", "yuanshu", "xunyu", "re_pangtong", "yanwen", "sp_zhugeliang", "caopi", "zhurong", "menghuo", "jiaxu", "re_lusu", "zhanghe", "dengai", "liushan", "sunce", "zhangzhang", "jiangwei", "re_zuoci", "caiwenji", "yanyan", "kuailiangkuaiyue", "wangji", "lukang", "haozhao", "guanqiujian", "re_xiahouyuan", "sp_zhangjiao", "old_zhoutai", "re_yuji", "re_weiyan"];
			_status.characterlist.randomSort();
			var bool = false;
			for (var i = 0; i < _status.characterlist.length; i++) {
				var name = _status.characterlist[i];
				if (player.storage.qbzc_biaohun.owned[name] || this.hasAvatarSkill(player, name)) {
					continue;
				}
				var skills = lib.character[name][3];
				for (var j = 0; j < skills.length; j++) {
					var info = lib.skill[skills[j]];
					if (info.hiddenSkill || info.dutySkill) skills.splice(j--, 1);
				}
				player.storage.qbzc_biaohun.owned[name] = skills;
				_status.characterlist.remove(name);
				return name;
			}
		},
		"syncAvatarBySkill": function (player) {
			var avatarList = player.storage.qbzc_biaohun.characterlist;
			for (var i = 0; i < avatarList.length; i++) {
				var avatarName = avatarList[i];
				if (this.hasAvatarSkill(player, avatarName) && !player.storage.qbzc_biaohun.owned[avatarName]) {
					var skills = lib.character[avatarName][3];
					for (var j = 0; j < skills.length; j++) {
						var info = lib.skill[skills[j]];
						if (info.hiddenSkill || info.dutySkill) skills.splice(j--, 1);
					}
					player.storage.qbzc_biaohun.owned[avatarName] = skills;
				}
			}
		},
		"addqbzc_biaohuns": function (player, num) {
			var list = [];
			for (var i = 0; i < num; i++) {
				var name = lib.skill.qbzc_biaohun.addqbzc_biaohun(player);
				if (name) list.push(name);
			}
			if (list.length) {
				game.log(player, '获得了', get.cnNumber(list.length) + '张', '#g风火林山牌')
				lib.skill.qbzc_biaohun.drawCharacter(player, list);
			}
		},
		drawCharacter: function (player, list) {
			game.broadcastAll(function (player, list) {
				if (player.isUnderControl(true)) {
					var cards = [];
					for (var i = 0; i < list.length; i++) {
						var cardname = 'qbzc_biaohun_card_' + list[i];
						lib.card[cardname] = {
							fullimage: true,
							image: 'character:' + list[i]
						}
						lib.translate[cardname] = get.rawName2(list[i]);
						cards.push(game.createCard(cardname, '', ''));
					}
					player.$draw(cards, 'nobroadcast');
				}
			}, player, list);
		},
		group: ["qbzc_biaohun_1", "qbzc_biaohun_2"],
		subSkill: {
			"1": {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				audio: "ext:鸽府包/audio/skill:2",
				silentForce: true,
				filter: function (event, player) {
					return (event.name != 'phase' || game.phaseNumber == 0);
				},
				content: function () {
					var next = game.createEvent('qbzc_biaohun');
					next.player = player;
					next._trigger = trigger;
					next.triggername = 'qbzc_biaohun';
					next.setContent(lib.skill.qbzc_biaohun_2.content);
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: ["qbzc_biaohun", "damageAfter", "phaseBegin"],
				},
				audio: "ext:鸽府包/audio/skill:2",
				filter: function (event, player, name) {
					return !get.is.empty(player.storage.qbzc_biaohun.owned) && player.storage.qbzc_biaohun.characterlist.length > 0;
				},
				forced: true,
				direct: true,
				content: function () {
					'step 0'
					if (event.triggername == 'qbzc_biaohun') {
						lib.skill.qbzc_biaohun.syncAvatarBySkill(player);
						lib.skill.qbzc_biaohun.addqbzc_biaohuns(player, 55);
						player.syncStorage('qbzc_biaohun');
						player.markSkill('qbzc_biaohun');
						event.logged = true;
					}
					var list = player.storage.qbzc_biaohun.characterlist;
					var first = list.randomRemove();
					event.first = first;
					const blacklist = lib.skill.qbzc_biaohun.blacklist;
					let availableList = list.filter(name => !blacklist[first]?.includes(name));
					var others = availableList.randomGets(4);
					if (others.length == 1) event._result = { bool: true, links: others };
					else {
						if (event.triggername == 'qbzc_biaohun') {
							player.chooseButton(true, [
								'标魂：请选择结党对象',
								[[first], 'character'],
								'<div class="text center">可选标魂</div>',
								[others, 'character']
							]).set('filterButton', button => {
								return _status.event.canChoose.contains(button.link);
							}).set('canChoose', list).set('ai', button => Math.random() * 10);
						} else {
							player.chooseButton([
								'标魂：请选择结党对象',
								[[first], 'character'],
								'<div class="text center">可选标魂</div>',
								[others, 'character']
							]).set('filterButton', button => {
								return _status.event.canChoose.contains(button.link);
							}).set('canChoose', list).set('ai', button => Math.random() * 10);
						}
					}
					'step 1'
					if (result.bool && result.links) {
						if (player.hasSkill('gzbuqu')) player.removeSkill('gzbuqu');
						if (event.triggername != 'qbzc_biaohun') {
							for (var i of player.storage.qbzc_biaohun.current) {
								player.storage.qbzc_biaohun.characterlist.remove(i);
								player.removeSkill(player.storage.qbzc_biaohun.owned[i]);
								delete player.storage.qbzc_biaohun.owned[i];
								player.storage.qbzc_biaohun.current2 = [];
								player.syncStorage('qbzc_biaohun');
								player.updateMarks('qbzc_biaohun');
							}
						}
						var first = event.first;
						var map = result.links;
						map.add(first);
						var skillx = [];
						for (var i = 0; i < result.links.length; i++) {
							var name = map[i];
							var skills = lib.character[name][3];
							for (var j = 0; j < skills.length; j++) {
								var info = lib.skill[skills[j]];
								player.addSkill(skills[j]);
								skillx.add(skills[j]);
								player.flashAvatar('qbzc_biaohun', name);
							}
						}
						player.storage.qbzc_biaohun.current = map;
						player.storage.qbzc_biaohun.current2 = skillx;
						player.syncStorage('qbzc_biaohun');
						player.updateMarks('qbzc_biaohun');
						game.log(player, '选择了标魂', '#y' + get.translation(map));
					}
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"cxm_longdan": {
		enable: ["chooseToUse", "chooseToRespond"],
		filter: function (event, player) {
			for (var name of lib.inpile) {
				if (player.hasCard(lib.skill.cxm_longdan.getFilter(name, player), 'he')) {
					var club = player.hasSkill('cxm_longdan_club', null, null, false);
					var diamond = player.hasSkill('cxm_longdan_diamond', null, null, false);
					var spade = player.hasSkill('cxm_longdan_spade', null, null, false);
					var heart = player.hasSkill('cxm_longdan_heart', null, null, false);
					if (!player.getCards('he', { name: 'sha' }) && name == 'shan') return false;
					if (!player.getCards('he', { name: 'shan' }) && name == 'sha') return false;
					if ((club && name == 'jiu') || (!player.getCards('he', { suit: 'club' }) && name == 'jiu')) return false;
					if ((diamond && name == 'huogong') || (!player.getCards('he', { suit: 'diamond' }) && name == 'huogong')) return false;
					if ((spade && name == 'wuxie') || (!player.getCards('he', { suit: 'spade' }) && name == 'wuxie')) return false;
					if ((heart && name == 'tao') || (!player.getCards('he', { suit: 'heart' }) && name == 'tao')) return false;
					if (event.filterCard({ name: name }, player, event)) return true;
				}
			}
			return false;
		},
		chooseButton: {
			dialog: function (event, player) {
				var list = [];
				var club = player.hasSkill('cxm_longdan_club');
				var diamond = player.hasSkill('cxm_longdan_diamond');
				var spade = player.hasSkill('cxm_longdan_spade');
				var heart = player.hasSkill('cxm_longdan_heart');
				for (var name of lib.inpile) {
					if (get.type(name) != 'basic' && name != 'huogong' && name != 'wuxie') continue;
					if (!player.getCards('he', { name: 'sha' }) && name == 'shan') continue;
					if (!player.getCards('he', { name: 'shan' }) && name == 'sha') continue;
					if ((club && name == 'jiu') || (!player.getCards('he', { suit: 'club' }) && name == 'jiu')) continue;
					if ((diamond && name == 'huogong') || (!player.getCards('he', { suit: 'diamond' }) && name == 'huogong')) continue;
					if ((spade && name == 'wuxie') || (!player.getCards('he', { suit: 'spade' }) && name == 'wuxie')) continue;
					if ((heart && name == 'tao') || (!player.getCards('he', { suit: 'heart' }) && name == 'tao')) continue;
					if (player.hasCard(lib.skill.cxm_longdan.getFilter(name, player), 'he')) {
						if (get.type(name) == 'basic') {
							if (event.filterCard({ name: name }, player, event)) list.push(['基本', '', name]);
						} else {
							if (event.filterCard({ name: name }, player, event)) list.push(['锦囊', '', name]);
						}
					}
				}
				if (list.length < 1) {
					return ui.create.dialog('龙胆', 'hidden', '已无可转换的牌');
				} else {
					return ui.create.dialog('龙胆', [list, 'vcard'], 'hidden');
				}
			},
			check: function (button) {
				if (_status.event.getParent().type != 'phase') return 1;
				var player = _status.event.player, card = { name: button.link[2], nature: button.link[3] };
				if (card.name == 'jiu') return 0;
				return player.getUseValue(card, null, true);
			},
			backup: function (links, player) {
				return {
					viewAs: {
						name: links[0][2],
						nature: links[0][3],
					},
					audio: "ext:鸽府包/audio/skill:2",
					filterCard: lib.skill.cxm_longdan.getFilter(links[0][2], player),
					position: 'he',
					popname: true,
					check: function (card) {
						return 6 / Math.max(1, get.value(card));
					},
				}
			},
			prompt: function (links, player) {
				var club = player.hasSkill('cxm_longdan_club');
				var diamond = player.hasSkill('cxm_longdan_diamond');
				var spade = player.hasSkill('cxm_longdan_spade');
				var heart = player.hasSkill('cxm_longdan_heart');
				var card = {
					name: links[0][2],
					nature: links[0][3],
					isCard: true,
				};
				if (player.getCards('he', { name: 'shan' }) && card.name == 'shan') return '将一张【杀】当做' + get.translation(card) + '使用';
				if (player.getCards('he', { name: 'sha' }) && card.name == 'sha') return '将一张【闪】当做' + get.translation(card) + '使用';
				if (!club && card.name == 'jiu') return '将一张梅花牌当做' + get.translation(card) + '使用';
				if (!diamond && card.name == 'huogong') return '将一张方块牌当做' + get.translation(card) + '使用';
				if (!spade && card.name == 'wuxie') return '将一张黑桃牌当做' + get.translation(card) + '使用';
				if (!heart && card.name == 'tao') return '将一张红桃牌当做' + get.translation(card) + '使用';
			},
		},
		hiddenCard: function (player, name) {
			var club = player.hasSkill('cxm_longdan_club');
			var diamond = player.hasSkill('cxm_longdan_diamond');
			var spade = player.hasSkill('cxm_longdan_spade');
			var heart = player.hasSkill('cxm_longdan_heart');
			if (!player.getCards('he', { name: 'sha' }) && name == 'shan') return false;
			if (!player.getCards('he', { name: 'shan' }) && name == 'sha') return false;
			if ((club && name == 'jiu') || (!player.getCards('he', { suit: 'club' }) && name == 'jiu')) return false;
			if ((diamond && name == 'suiji') || (!player.getCards('he', { suit: 'diamond' }) && name == 'huogong')) return false;
			if ((spade && name == 'wuxie') || (!player.getCards('he', { suit: 'spade' }) && name == 'wuxie')) return false;
			if ((heart && name == 'tao') || (!player.getCards('he', { suit: 'heart' }) && name == 'tao')) return false;
			return player.hasCard(lib.skill.cxm_longdan.getFilter(name, player), 'he');
		},
		getFilter: function (name, player) {
			var club = player.hasSkill('cxm_longdan_club');
			var diamond = player.hasSkill('cxm_longdan_diamond');
			var spade = player.hasSkill('cxm_longdan_spade');
			var heart = player.hasSkill('cxm_longdan_heart');
			if (name == 'shan') return { name: 'sha' };
			if (name == 'sha') return { name: 'shan' };
			if (!diamond) {
				if (name == 'huogong') return { suit: 'diamond' };
			}
			if (!club) {
				if (name == 'jiu') return { suit: 'club' };
			}
			if (!spade) {
				if (name == 'wuxie') return { suit: 'spade' };
			}
			if (!heart) {
				if (name == 'tao') return { suit: 'heart' };
			}
		},
		ai: {
			respondSha: true,
			respondShan: true,
			skillTagFilter: function (player, tag) {
				var name;
				switch (tag) {
					case 'respondSha': name = 'shan'; break;
					case 'respondShan': name = 'sha'; break;
					case 'save': name = 'heart'; break;
					case 'save': name = 'club'; break;
				}
				if (!player.countCards('hes', { suit: name })) return false;
			},
			order: 9,
		},
		onremove: function (player) {
			player.removeSkill('cxm_longdan_club');
			player.removeSkill('cxm_longdan_diamond');
			player.removeSkill('cxm_longdan_spade');
			player.removeSkill('cxm_longdan_heart');
		},
		group: ["cxm_longdan_gai", "cxm_longdan_1"],
		subSkill: {
			"1": {
				trigger: {
					global: "phaseAfter",
				},
				frequent: true,
				content: function () {
					player.storage.cxm_longdan_gai = ["club", "diamond", "spade", "heart"];
				},
				sub: true,
				"_priority": 0,
			},
			gai: {
				init: function (player) {
					player.storage.cxm_longdan_gai = ["club", "diamond", "spade", "heart"];
				},
				trigger: {
					player: ["dying", "dyingAfter"],
				},
				audio: "ext:鸽府包/audio/skill:2",
				frequent: true,
				content: function () {
					"step 0"
					event.list = [];
					if (player.hp < 1) {
						player.draw();
					} else {
						if (player.storage.cxm_longdan_gai.contains("club")) event.list.push("♣");
						if (player.storage.cxm_longdan_gai.contains("diamond")) event.list.push("♦");
						if (player.storage.cxm_longdan_gai.contains("spade")) event.list.push("♠");
						if (player.storage.cxm_longdan_gai.contains("heart")) event.list.push("♥");
					}
					"step 1"
					if (event.list.length) {
						player.chooseControl(event.list).set('prompt', "请你记录一种未记录过的花色，〖龙胆〗无法通过花色转化已记录的花色。");
					} else event.finish();
					"step 2"
					if (result.control) {
						event.list.remove(result.control);
						switch (result.control) {
							case "♣":
								player.storage.cxm_longdan_gai.remove('club');
								player.addTempSkill('cxm_longdan_club');
								break;
							case "♦":
								player.storage.cxm_longdan_gai.remove("diamond");
								player.addTempSkill('cxm_longdan_diamond');
								break;
							case "♠":
								player.storage.cxm_longdan_gai.remove("spade");
								player.addTempSkill('cxm_longdan_spade');
								break;
							case "♥":
								player.storage.cxm_longdan_gai.remove("heart");
								player.addTempSkill('cxm_longdan_heart');
								break;
						}
						player.update();
					}
				},
				sub: true,
				"_priority": 0,
			},
			club: {
				mark: true,
				marktext: "♣",
				intro: {
					name: "龙胆",
					content: "〖龙胆〗无法转化【♣】。",
				},
				charlotte: true,
				sub: true,
				"_priority": 0,
			},
			diamond: {
				mark: true,
				marktext: "♦",
				intro: {
					name: "龙胆",
					content: "〖龙胆〗无法转化【♦】。",
				},
				charlotte: true,
				sub: true,
				"_priority": 0,
			},
			spade: {
				mark: true,
				marktext: "♠",
				intro: {
					name: "龙胆",
					content: "〖龙胆〗无法转化【♠】。",
				},
				charlotte: true,
				sub: true,
				"_priority": 0,
			},
			heart: {
				mark: true,
				marktext: "♥",
				intro: {
					name: "龙胆",
					content: "〖龙胆〗无法转化【♥】。",
				},
				charlotte: true,
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"cxm_jiuzhu": {
		mod: {
			maxHandcard: function (player, num) {
				if (player.getDamagedHp() < 1) {
					var a = 1;
				} else { var a = player.getDamagedHp(); }
				return 2 + a;
			},
		},
		trigger: {
			global: "dying",
		},
		audio: "ext:鸽府包/audio/skill:2",
		filter: function (event, player) {
			return event.player != player;
		},
		"prompt2": function (event, player) {
			return '你是否要摸 1 张牌并令' + get.translation(event.player) + '回复 1 点体力，然后你失去 1 点体力？';
		},
		check: function (event, player) {
			return get.attitude(player, event.player) > 0;
		},

		content: function () {
			player.draw();
			trigger.player.recover();
			player.loseHp();
		},
		"_priority": 0,
	},
	"cxm_chongzhen": {
		trigger: {
			player: ["useCard", "respond"],
		},
		audio: "ext:鸽府包/audio/skill:2",
		filter: function (event, player) {
			if ((event.card.name != 'sha' && event.card.name != 'shan') || (event.skill != 'cxm_longdan' && event.skill != 'cxm_longdan_backup')) return false;
			var target = lib.skill.cxm_chongzhen.logTarget(event, player);
			return target;
		},
		logTarget: function (event, player) {
			if (event.name == "respond") {
				return event.source;
			}
			if (event.card.name == 'sha') return event.targets[0];
			return event.respondTo[0];
		},
		"prompt2": "当你因发动〖龙胆〗而使用或打出【杀】或【闪】时，你可以获得对方的一张手牌，若对方无牌改为摸一张牌",
		content: function () {
			var target = lib.skill.cxm_chongzhen.logTarget(trigger, player);
			if (target.countGainableCards(player, 'he') < 1) {
				player.draw();
			} else {
				player.gainPlayerCard(target, 'he', true);
			}
		},
		group: ["cxm_chongzhen_sha"],
		subSkill: {
			sha: {
				trigger: {
					player: "cxm_jiuzhuAfter",
				},
				frequent: true,
				content: function () {
					"step 0"
					player.storage.cxm_chongzhen_add = 0;
					player.markSkill('cxm_chongzhen_add');
					if (player.getDamagedHp() < 1) {
						var a = 1;
					} else { var a = player.getDamagedHp(); }
					player.chooseToUse({ name: "sha" }, "冲阵：是否使用一张不计入次数且伤害为【" + a + "】的杀？");
					if (!player.hasSkill('cxm_chongzhen_add')) {
						player.addTempSkill('cxm_chongzhen_add');
					}
					player.storage.cxm_chongzhen_add = a;
					player.markSkill('cxm_chongzhen_add');
					'step 1'
					if (player.getDamagedHp() < 1) {
						var a = 1;
					} else { var a = player.getDamagedHp(); }
					if (result.bool) {
						player.getStat().card.sha--;
					} else {
						player.storage.cxm_chongzhen_add = 0;
						player.markSkill('cxm_chongzhen_add');
					}
				},
				sub: true,
				"_priority": 0,
			},
			add: {
				charlotte: true,
				forced: true,
				silent: true,
				popup: false,
				trigger: {
					player: "useCardBefore",
				},
				filter: function (event) {
					return event.card && event.card.name == 'sha';
				},
				content: function () {
					if (!trigger.baseDamage) trigger.baseDamage = 1;
					trigger.baseDamage = player.storage.cxm_chongzhen_add;
					player.removeSkill('cxm_chongzhen_add');
				},
				init: function (player) {
					player.storage.cxm_chongzhen_add = 0;
				},
				onremove: function (player) {
					delete player.storage.cxm_chongzhen_add;
				},
				ai: {
					damageBonus: true,
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gzhlb_liuxiang": {
		init: function (player) {
			player.storage.gzhlb_liuxiang_red = 0;
			player.storage.gzhlb_liuxiang_black = 0;
		},
		enable: "chooseToUse",
		filter: function (event, player) {
			for (var name of lib.inpile) {
				if (player.hasCard(lib.skill.gzhlb_liuxiang.getFilter(name, player), 'h')) {
					if (name == player.storage.suiji1 && (player.hasMark('gzhlb_liuxiang_red') || !player.getCards('h', { color: 'red' }))) return false;
					if (name == player.storage.suiji2 && (player.hasMark('gzhlb_liuxiang_black') || !player.getCards('h', { color: 'black' }))) return false;
					if (event.filterCard({ name: name }, player, event)) return true;
				}
			}
			return false;
		},
		chooseButton: {
			dialog: function (event, player) {
				var list = [];
				for (var name of lib.inpile) {
					if (name != player.storage.suiji1 && name != player.storage.suiji2) continue;
					if (name == player.storage.suiji1 && player.hasMark('gzhlb_liuxiang_red')) continue;
					if (name == player.storage.suiji2 && player.hasMark('gzhlb_liuxiang_black')) continue;
					if (player.hasCard(lib.skill.gzhlb_liuxiang.getFilter(name, player), 'h')) {
						if (get.type(name) == 'basic') {
							if (name == 'sha') {
								var n = player.storage.suiji1_nature;
								for (var nature of lib.inpile_nature) {
									if (n == nature) {
										if (event.filterCard({ name: name, nature: nature }, player, event)) list.push(['基本', '', name, nature])
									}
								}
								if (!n) if (event.filterCard({ name: name }, player, event)) list.push(['基本', '', name]);
							} else {
								if (event.filterCard({ name: name }, player, event)) list.push(['基本', '', name]);
							}
						} else {
							if (event.filterCard({ name: name }, player, event)) list.push(['锦囊', '', name]);
						}
					}
				}
				if (list.length < 1) {
					return ui.create.dialog('留香', 'hidden', '已无可转换的牌');
				} else {
					return ui.create.dialog('留香', [list, 'vcard'], 'hidden');
				}
			},
			check: function (button) {
				if (_status.event.getParent().type != 'phase') return 1;
				var player = _status.event.player, card = { name: button.link[2], nature: button.link[3] };
				if (card.name == 'jiu') return 0;
				return player.getUseValue(card, null, true);
			},
			backup: function (links, player) {
				return {
					viewAs: {
						name: links[0][2],
						nature: links[0][3],
					},
					filterCard: lib.skill.gzhlb_liuxiang.getFilter(links[0][2], player),
					position: 'h',
					popname: true,
					check: function (card) {
						return 6 / Math.max(1, get.value(card));
					},
					onuse(result, player) {
						const type = links[0][0];
						if (type === '锦囊') {
							player.storage.gzhlb_liuxiang_black = 1;
						} else {
							player.storage.gzhlb_liuxiang_red = 1;
						}
						player.addTempSkill("gzhlb_liuxiang_clear");
					},
				}
			},
			prompt: function (links, player) {
				var card = {
					name: links[0][2],
					nature: links[0][3],
					isCard: true,
				};
				if (player.getCards('h', { color: 'red' }) && card.name == player.storage.suiji1) return '将一张红色手牌当做' + get.translation(card) + '使用';
				if (player.getCards('h', { color: 'black' }) && card.name == player.storage.suiji2) return '将一张黑色手牌当做' + get.translation(card) + '使用';
			},
		},
		hiddenCard: function (player, name) {
			if ((name == 'wuxie' && player.storage.suiji2 != 'wuxie') || (name == 'wuxie' && !player.getCards('h', { color: 'black' }))) return false;
			if ((name == 'shan' && player.storage.suiji1 != 'shan') || (name == 'shan' && !player.getCards('h', { color: 'red' }))) return false;
			if ((name == 'tao' && player.storage.suiji1 != 'tao') || (name == 'tao' && !player.getCards('h', { color: 'red' }))) return false;
			if ((name == 'jiu' && player.storage.suiji1 != 'jiu') || (name == 'jiu' && !player.getCards('h', { color: 'red' }))) return false;
			if (!player.getCards('h', { color: 'red' }) && name == player.storage.suiji1) return false;
			if (!player.getCards('h', { color: 'black' }) && name == player.storage.suiji2) return false;
			return player.hasCard(lib.skill.gzhlb_liuxiang.getFilter(name, player), 'h');
		},
		getFilter: function (name, player) {
			if (player.storage.suiji1) {
				if (name == player.storage.suiji1) return { color: 'red' };
			}
			if (player.storage.suiji2) {
				if (name == player.storage.suiji2) return { color: 'black' };
			}
		},
		mod: {
			cardUsable: function (card) {
				var player = _status.event.player;
				if (!player.hasSkill('gzhlb_liuxiang_liu')) {
					if (!card.isCard) return Infinity;
				}
			},
		},
		ai: {
			respondSha: true,
			respondShan: true,
			skillTagFilter: function (player, tag) {
				var name;
				switch (tag) {
					case 'respondSha': name = 'red'; break;
					case 'respondShan': name = 'red'; break;
					case 'save': name = 'red'; break;
					case 'save': name = 'red'; break;
				}
				if (!player.countCards('hes', { color: name })) return false;
			},
			order: 11,
			result: {
				player: function (player) {
					if (_status.event.dying) return get.attitude(player, _status.event.dying);
					return 1;
				},
			},
		},
		group: ["gzhlb_liuxiang_suiji", "gzhlb_liuxiang_2"],
		subSkill: {
			clear: {
				onremove: function (player) {
					player.storage.gzhlb_liuxiang_red = 0;
					player.storage.gzhlb_liuxiang_black = 0;
				},
				sourceSkill: "gzhlb_liuxiang",
				sub: true,
			},
			"2": {
				trigger: {
					player: "useCardAfter",
				},
				forced: true,
				silent: true,
				popup: false,
				filter: function (event, player, name) {
					return event.skill == 'gzhlb_liuxiang_backup';
				},
				content: function () {
					player.draw(2);
				},
				sub: true,
				"_priority": 0,
			},
			liu: {
				onremove: true,
				sub: true,
				"_priority": 0,
			},
			suiji: {
				trigger: {
					player: "useCard",
				},
				silent: true,
				firstDo: true,
				filter: function (event, player, name) {
					var type = get.type(event.card);
					return (type == 'trick' || type == 'basic');
				},
				content: function () {
					if (!trigger.card.isCard || trigger.cards.length != 1) {
						if (get.type(trigger.card) == 'basic') {
							delete player.storage.suiji1;
							delete player.storage.suiji1_nature;
						} else {
							delete player.storage.suiji2;
						}
					} else {
						if (get.type(trigger.card) == 'basic') {
							player.storage.suiji1 = trigger.card.name;
							player.storage.suiji1_nature = trigger.card.nature;
						} else {
							player.storage.suiji2 = trigger.card.name;
						}
					}
				},
				sub: true,
				forced: true,
				popup: false,
				"_priority": 1,
			},
		},
		"_priority": 0,
	},
	"cxm_rende": {
		mark: true,
		init: function (player) {
			player.storage.cxm_rende = 0;
		},
		intro: {
			name: "仁德",
			content: "你拥有#枚标记",
		},
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		filterCard: true,
		selectCard: [1, Infinity],
		discard: false,
		lose: false,
		delay: false,
		filterTarget: function (card, player, target) {
			if (target.hasSkill('cxm_rende_1')) return false;
			return player != target;
		},
		check: function (card) {
			if (ui.selected.cards.length && ui.selected.cards[0].name == 'du') return 0;
			if (!ui.selected.cards.length && card.name == 'du') return 20;
			var player = get.owner(card);
			if (ui.selected.cards.length >= Math.max(2, player.countCards('h') - player.hp)) return 0;
			if (player.hp == player.maxHp || player.storage.rerende < 0 || player.countCards('h') <= 1) {
				var players = game.filterPlayer();
				for (var i = 0; i < players.length; i++) {
					if (players[i].hasSkill('haoshi') &&
						!players[i].isTurnedOver() &&
						!players[i].hasJudge('lebu') &&
						get.attitude(player, players[i]) >= 3 &&
						get.attitude(players[i], player) >= 3) {
						return 11 - get.value(card);
					}
				}
				if (player.countCards('h') > player.hp) return 10 - get.value(card);
				if (player.countCards('h') > 2) return 6 - get.value(card);
				return -1;
			}
			return 10 - get.value(card);
		},
		content: function () {
			player.give(cards, target);
			if (player.countMark('cxm_rende') < 8) {
				if (player.countMark('cxm_rende') + cards.length < 8) {
					player.addMark('cxm_rende', cards.length);
				} else {
					player.addMark('cxm_rende', 8 - player.countMark('cxm_rende'));
				}
			}
			target.addMark('cxm_guying_4', cards.length);
			target.addTempSkill('cxm_rende_1');
			target.chooseToUse('你可以使用一张牌');
		},
		ai: {
			fireAttack: true,
			order: function (skill, player) {
				if (player.hp < player.maxHp && player.storage.rerende < 2 && player.countCards('h') > 1) {
					return 10;
				}
				return 4;
			},
			result: {
				target: function (player, target) {
					if (target.hasSkillTag('nogain')) return 0;
					if (ui.selected.cards.length && ui.selected.cards[0].name == 'du') {
						if (target.hasSkillTag('nodu')) return 0;
						return -10;
					}
					if (target.hasJudge('lebu')) return 0;
					var nh = target.countCards('h');
					var np = player.countCards('h');
					if (player.hp == player.maxHp || player.storage.rerende < 0 || player.countCards('h') <= 1) {
						if (nh >= np - 1 && np <= player.hp && !target.hasSkill('haoshi')) return 0;
					}
					return Math.max(1, 5 - nh);
				},
			},
			effect: {
				target: function (card, player, target) {
					if (player == target && get.type(card) == 'equip') {
						if (player.countCards('e', { subtype: get.subtype(card) })) {
							if (game.hasPlayer(function (current) {
								return current != player && get.attitude(player, current) > 0;
							})) {
								return 0;
							}
						}
					}
				},
			},
			threaten: 0.8,
		},
		group: "cxm_rende_2",
		subSkill: {
			"1": {
				charlotte: true,
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					global: ["useCardAfter", "respondAfter"],
				},
				audio: "ext:鸽府包/audio/skill:2",
				"prompt2": function (event, player) {
					return '你是否令' + get.translation(event.player) + '摸一张牌然后你获得1枚 “仁” 标记？';
				},
				filter: function (event, player) {
					if (_status.currentPhase != event.player && !event.player.hasSkill('cxm_rende_3') && event.player.group == 'shu') {
						return get.type(event.card) == 'basic';
					}
					return false;
				},
				check: function (event, player) {
					return get.attitude(player, _status.currentPhase) > 0;
				},
				content: function () {
					trigger.player.draw();
					trigger.player.addTempSkill('cxm_rende_3');
					if (player.countMark('cxm_rende') < 8) {
						player.addMark('cxm_rende', 1);
					}
				},
				ai: {
					threaten: 0.9,
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				charlotte: true,
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"cxm_shenyi": {
		enable: ["chooseToUse", "chooseToRespond"],
		filter: function (event, player) {
			if (event.type == 'wuxie') return false;
			if (player.countMark('cxm_rende') < 1) return false;
			for (var name of lib.inpile) {
				if (get.type(name) != 'basic') continue;
				if (player.countMark('cxm_rende') < 2 && name == 'jiu') continue;
				if (player.countMark('cxm_rende') < 3 && name == 'tao') continue;
				var card = { name: name, isCard: true };
				if (event.filterCard(card, player, event)) return true;
			}
			return false;
		},
		chooseButton: {
			dialog: function (event, player) {
				var list = [];
				for (var name of lib.inpile) {
					var card = { name: name, isCard: true };
					if (event.filterCard(card, player, event)) {
						if (player.countMark('cxm_rende') > 0 && name == 'shan') list.push(['基本', '', 'shan']);
						if (player.countMark('cxm_rende') > 0 && name == 'sha') list.push(['基本', '', 'sha']);
						if (player.countMark('cxm_rende') > 1 && name == 'jiu') list.push(['基本', '', 'jiu']);
						if (player.countMark('cxm_rende') > 2 && name == 'tao') list.push(['基本', '', 'tao']);
					}
					if (player.countMark('cxm_rende') > 0 && name == 'sha') {
						for (var nature of lib.inpile_nature) {
							if (event.filterCard({ name: name, nature: nature }, player, event)) list.push(['基本', '', name, nature])
						}
					}
				}
				if (list.length < 1) {
					return ui.create.dialog('伸义', 'hidden', '已无可转换的牌');
				} else {
					return ui.create.dialog('伸义', [list, 'vcard'], 'hidden');
				}
			},
			check: function (button, player) {
				if (typeof button.link == 'string') return -1;
				if (_status.event.getParent().type != 'phase') return 1;
				return _status.event.player.getUseValue({ name: button.link[2], nature: button.link[3] });
			},
			backup: function (links, player) {
				return {
					viewAs: {
						name: links[0][2],
						nature: links[0][3],
					},
					audio: "ext:鸽府包/audio/skill:2",
					filterCard: () => false,
					selectCard: -1,
					popname: true,
				}
			},
			prompt: function (links, player) {
				var card = {
					name: links[0][2],
					nature: links[0][3],
					isCard: true,
				};
				if (player.countMark('cxm_rende') > 0 && card.name == 'sha') return '失去1枚“仁德”并将并视为使用或打出一张' + get.translation(card);
				if (player.countMark('cxm_rende') > 0 && card.name == 'shan') return '失去1枚“仁德”并将并视为使用或打出一张' + get.translation(card);
				if (player.countMark('cxm_rende') > 1 && card.name == 'jiu') return '失去1枚“仁德”并将并视为使用或打出一张' + get.translation(card);
				if (player.countMark('cxm_rende') > 2 && card.name == 'tao') return '失去1枚“仁德”并将并视为使用或打出一张' + get.translation(card);
			},
		},
		ai: {
			respondSha: true,
			respondShan: true,
			save: true,
			skillTagFilter: function (player) {
				return player.countMark('cxm_rende') > 1;
			},
			order: 8,
			result: {
				player: function (player) {
					if (_status.event.dying) {
						return get.attitude(player, _status.event.dying);
					}
					return _status.event.type == 'phase' && player.countMark('cxm_rende_1') <= 3 ? 0 : 1;
				},
			},
		},
		group: ["cxm_shenyi_1", "cxm_shenyi_3"],
		subSkill: {
			"1": {
				trigger: {
					player: ["useCard", "respond"],
				},
				charlotte: true,
				forced: true,
				silent: true,
				popup: false,
				filter: function (event, player) {
					if (event.card.name != 'sha' && event.card.name != 'shan' && event.card.name != 'tao' && event.card.name != 'jiu') return false;
					return event.skill == 'cxm_shenyi_backup';
				},
				content: function () {
					if (trigger.card.name == 'sha' || trigger.card.name == 'shan') {
						var a = 1;
					}
					if (trigger.card.name == 'jiu') {
						var a = 2;
					}
					if (trigger.card.name == 'tao') {
						var a = 3;
					} if (_status.currentPhase != player || !player.hasSkill('cxm_guying') || player.hasSkill('cxm_shenyi_2')) {
						player.removeMark('cxm_rende', a);
					} if (_status.currentPhase == player && player.hasSkill('cxm_guying') && !player.hasSkill('cxm_shenyi_2') && trigger.card.name == 'sha') {
						player.getStat().card.sha--;
					}
					if (!player.hasSkill('cxm_shenyi_2')) {
						player.addTempSkill('cxm_shenyi_2');
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				charlotte: true,
				sub: true,
				"_priority": 0,
			},
			"3": {
				trigger: {
					player: "useCardToPlayered",
				},
				audio: "ext:鸽府包/audio/skill:2",
				frequent: true,
				filter: function (event, player) {
					return player != event.target && event.card.name == 'tao';
				},
				content: function () {
					if (player.countMark('cxm_rende') < 8) {
						player.addMark('cxm_rende', 1);
					}
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"cxm_guying": {
		mod: {
			attackFrom: function (from, to, distance) {
				if (!from.getEquip(1)) return distance - 1
			},
		},
		equipSkill: true,
		trigger: {
			player: "useCardToPlayered",
		},
		logTarget: "target",
		check: function (event, player) {
			return get.attitude(player, event.target) <= 0;
		},
		filter: function (event, player) {
			if (!player.hasEmptySlot(1)) return false;
			return event.card.name == 'sha' && event.target.countCards('he');
		},
		"prompt2": function (event, player) {
			return '你是否令' + get.translation(event.target) + '弃置一张牌？';
		},
		content: function () {
			trigger.target.chooseToDiscard('he', true);
		},
		"_priority": 0,
		group: ["cxm_guying_1", "cxm_guying_4"],
		subSkill: {
			"1": {
				equipSkill: true,
				trigger: {
					source: "dying",
				},
				filter: function (event, player) {
					if (!player.hasEmptySlot(1)) return false;
					var evt = event.getParent('damage');
					return evt && evt.card && evt.card.name == 'sha' && event.player.countGainableCards(player, 'h') > 0;
				},
				check: function (event, player) {
					return get.attitude(player, event.player) < 0;
				},
				"prompt2": function (event, player) {
					return '你是否获得' + get.translation(event.target) + '一张手牌？';
				},
				content: function () {
					player.gainPlayerCard(trigger.player, 'h', true);
				},
				sub: true,
				"_priority": -25,
			},
			"4": {
				trigger: {
					player: "phaseBegin",
				},
				audio: "ext:鸽府包/audio/skill:2",
				filter: function (event, player) {
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i] != player && list[i].countMark('cxm_guying_4') < 2 && list[i].group == 'shu') {
							event.count++;
						}
					}
					return event.count < 1 && !player.hasMark('cxm_guying4');
				},
				"prompt2": function (event, player) {
					return '你是否减少一点体力上限并获得技能〖义结〗，然后选择一名蜀势力角色令其体力上限加【1】？';
				},
				content: function () {
					'step 0'
					player.loseMaxHp();
					player.addSkill('cxm_yijie');
					'step 1'
					player.chooseTarget(get.prompt('cxm_guying'), '请选择一名蜀势力角色令其增加一点体力上限并恢复一点体力', function (card, player, target) {
						return target.group == 'shu';
					}).set('ai', function (target) {
						var att = get.attitude(_status.event.player, target);
						if (att > 0) return att + 1;
						return att;
					});
					'step 2'
					var target = result.targets[0];
					target.gainMaxHp();
					target.recover();
					player.addMark('cxm_guying4', 1);
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"cxm_yijie": {
		zhuSkill: true,
		"_priority": 0,
		intro: {
			name: "义结",
		},
		trigger: {
			player: "phaseBegin",
		},
		audio: "ext:鸽府包/image/audio:3",
		"prompt2": function (event, player) {
			return '你是否令所有其他蜀势力角色依次选择是否交给你二张牌（不足全给），当有角色选择交给你牌后你选择等量手牌交给其？';
		},
		filter: function (event, player) {
			event.count = 0;
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (list[i] != player && list[i].group == 'shu') {
					event.count++;
				}
			}
			return event.count > 0;
		},
		content: function () {
			"step 0"
			event.targets = game.filterPlayer(function (current) {
				return current != player && current.group == 'shu';
			}).sortBySeat();
			if (!event.targets.length) event.finish();
			"step 1"
			event.current = event.targets.shift();
			if (!event.current.countCards('he')) {
				event.goto(4);
			} else {
				if (event.current.countCards('he') < 2) {
					event.current.chooseCard('交给' + get.translation(player) + '【1】张牌', 2, 'he').set('ai', function (card) {
						var evt = _status.event.getParent();
						if (get.attitude(_status.event.player, evt.player) > 0) {
							return 2;
						}
						return -1;
					});
				} else {
					event.current.chooseCard('交给' + get.translation(player) + '【2】张牌', 2, 'he').set('ai', function (card) {
						var evt = _status.event.getParent();
						if (get.attitude(_status.event.player, evt.player) > 0) {
							return 2;
						}
						return -1;
					});
				}
			}
			"step 2"
			if (result.bool && result.cards && result.cards.length) {
				event.current.give(result.cards, player);
				event.current.addMark('cxm_yijie', result.cards.length);
			}
			"step 3"
			if (event.targets.length > 0) {
				event.goto(1);
			} else {
				event.targets2 = game.filterPlayer(function (current) {
					return current != player && current.hasMark('cxm_yijie');
				}).sortBySeat();
				if (!event.targets2.length) event.finish();
			}
			"step 4"
			event.current2 = event.targets2.shift();
			player.chooseCard('交给' + get.translation(event.current2) + '【' + event.current2.countMark('cxm_yijie') + '】张牌', event.current2.countMark('cxm_yijie'), true, 'he');
			"step 5"
			if (result.bool && result.cards && result.cards.length) {
				player.give(result.cards, event.current2);
			}
			"step 6"
			if (event.targets2.length > 0) {
				event.goto(4);
			} else {
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].hasMark('cxm_yijie')) {
						list[i].removeMark('cxm_yijie', list[i].countMark('cxm_yijie'));
					}
				}
			}
		},
	},
	"gzhlb_yuelv": {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: false,
		filter: function (event, player) {
			return (event.name != 'phase' || game.phaseNumber == 0);
		},
		content: function () {
			player.markAuto('gzhlb_yuelv', 'heart');
			player.markAuto('gzhlb_yuelv', 'diamond');
			player.markAuto('gzhlb_yuelv', 'spade');
			player.markAuto('gzhlb_yuelv', 'club');
		},
		intro: {
			content: "已记录花色：$",
			onunmark: true,
		},
		group: ["gzhlb_yuelv_count"],
		subSkill: {
			count: {
				trigger: {
					player: ["addJudgeBefore", "useCardAfter"],
					target: "useCardToTargeted",
				},
				frequent: true,
				content: function () {
					var storage = player.getStorage('gzhlb_yuelv').slice(0);
					if (event.triggername == 'useCardAfter') {
						if (storage.contains(get.suit(trigger.card, false))) {
							player.draw();
							player.unmarkAuto('gzhlb_yuelv', [get.suit(trigger.card)]);
						} else {
							player.markAuto('gzhlb_yuelv', [get.suit(trigger.card)]);
						}
					} else if (trigger.player != player) {
						if (trigger.name == 'addJudge') {
							if (storage.contains(get.suit(trigger.card, false))) {
								trigger.cancel();
								var owner = get.owner(trigger.card);
								if (owner && owner.getCards('hej').contains(trigger.card)) owner.lose(trigger.card, ui.discardPile);
								else game.cardsDiscard(trigger.card);
								game.log(trigger.card, '进入了弃牌堆');
								player.unmarkAuto('gzhlb_yuelv', [get.suit(trigger.card)]);
							} else {
								player.markAuto('gzhlb_yuelv', [get.suit(trigger.card)]);
							}
						} else {
							if (storage.contains(get.suit(trigger.card, false))) {
								trigger.targets.remove(player);
								trigger.getParent().triggeredTargets2.remove(player);
								trigger.untrigger();
								player.unmarkAuto('gzhlb_yuelv', [get.suit(trigger.card)]);
							} else {
								player.markAuto('gzhlb_yuelv', [get.suit(trigger.card)]);
							}
						}
					}
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gzhlb_houzou": {
		trigger: {
			player: ["gainBefore", "judgeBefore"],
		},
		frequent: true,
		filter: function (event, player) {
			return !(event.source && event.source.isIn());
		},
		content: function () {
			"step 0"
			event.cards = get.cards(2);
			var content = ['牌堆顶的两张牌', event.cards, '请选择一项：<br><li>1、获得一名其他角色区域内的一张牌；<br><li>2、依次使用其中可以使用的牌'];
			game.log(player, '观看了', '#y牌堆顶的两张牌');
			player.chooseControl('选项一', '选项二', '取消').set('dialog', content).ai = function () {
				return 1;
			};
			"step 1";
			while (cards.length) {
				ui.cardPile.insertBefore(cards.pop(), ui.cardPile.firstChild);
			}
			game.updateRoundNumber();
			"step 2"
			if (result.control == '取消') {
				event.finish();
			} else {
				if (event.triggername == 'gainBefore') {
					trigger.cancel();
				}
			}
			if (result.control == '选项一') {
				event.goto(5);
			}
			event.cards = get.cards(2);
			event.discards = [];
			"step 3"
			var bool = game.hasPlayer(function (current) {
				return player.canUse(event.cards[0], current);
			});
			if (bool) {
				player.chooseUseTarget(event.cards[0], true, false);
			}
			else event.discards.push(event.cards[0]);
			event.cards.remove(event.cards[0]);
			"step 4"
			if (event.cards.length) {
				event.goto(3);
			} else {
				if (event.discards.length) {
					player.$throw(event.discards);
					game.cardsDiscard(event.discards);
				}
				event.finish();
			}
			"step 5"
			player.chooseTarget(true, get.prompt('gzhlb_houzou'), '获得一名其他角色区域内的一张牌', function (card, player, target) {
				return target.countCards('hej') > 0 && player != target;
			}, function (target) {
				if (!_status.event.aicheck) return 0;
				var att = get.attitude(_status.event.player, target);
				return 1 - att;
			});
			"step 6"
			if (result.bool) {
				player.gainMultiple(result.targets, 'hej');
			}
		},
		"_priority": 0,
	},
	"gzhlb_guojiu": {
		trigger: {
			player: ["loseAfter", "damageAfter",],
		},
		frequent: true,
		filter: function (event, player, name) {
			if (name == 'loseAfter') {
				if (event.type != 'discard') return false;
				for (var i = 0; i < event.cards2.length; i++) {
					if (get.position(event.cards2[i], true) == 'd') {
						return true;
					}
				}
				return false;
			} else {
				return !event.card;
			}
		},
		content: function () {
			player.draw()
		},
	},
	"gzhlb_xuming": {
		unique: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		filter: function (event, player) {
			return (event.name != 'phase' || game.phaseNumber == 0);
		},
		content: function () {
			player.addToExpansion(get.cards(4), 'draw').gaintag.add('gzhlb_xuming');
		},
		intro: {
			markcount: "expansion",
			mark: function (dialog, content, player) {
				var content = player.getExpansions('gzhlb_xuming');
				if (content && content.length) {
					if (player == game.me || player.isUnderControl()) {
						dialog.addAuto(content);
					}
					else {
						return '共有' + get.cnNumber(content.length) + '张续命';
					}
				}
			},
			content: function (content, player) {
				var content = player.getExpansions('gzhlb_xuming');
				if (content && content.length) {
					if (player == game.me || player.isUnderControl()) {
						return get.translation(content);
					}
					return '共有' + get.cnNumber(content.length) + '张续命';
				}
			},
		},
		group: ["gzhlb_xuming_1", "gzhlb_xuming_2"],
		subSkill: {
			"1": {
				trigger: {
					target: "useCardToTargeted",
					player: "phaseZhunbeiBegin",
				},
				frequent: true,
				audio: "ext:鸽府包/audio/skill:4",
				content: function () {
					'step 0'
					if (trigger.player != player) {
						var str1 = get.translation(player);
						var target = _status.event.getParent().player, player = _status.event.player;
						trigger.player.chooseControl().set('choiceList', [
							'令' + str1 + '的〖续命〗本次失效且本回合不可再对其使用牌',
							'令' + str1 + '的〖续命〗生效',
						]).set('ai', function (event, player, card) {
							if (get.attitude(player, target) > 0) return 1;
							else { return 0; }
						});
					} else {
						player.chooseCardButton(true, '请你选择一张“续命”牌并获得', player.getExpansions('gzhlb_xuming'));
					}
					'step 1'
					if (result.index == 1) {
						player.chooseCardButton(true, '请你选择一张“续命”牌并获得', player.getExpansions('gzhlb_xuming'));
					}
					if (result.index == 0) {
						trigger.player.addTempSkill('gzhlb_xuming_x');
						event.finish();
					}
					'step 2'
					if (result.bool) {
						player.gain(result.links[0], 'give', player, 'bySelf');
					}
					'step 3'
					var cards = player.getExpansions('gzhlb_xuming');
					if (!cards.length) {
						player.addToExpansion(get.cards(4), 'draw').gaintag.add('gzhlb_xuming');
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: "dying",
				},
				audio: "ext:鸽府包/audio/skill:2",
				forced: true,
				content: function () {
					'step 0'
					var next = player.judge(function (card) {
						for (var i = 0; i < player.getExpansions("gzhlb_xuming").length; i++) {
							if (get.suit(card) == get.suit(player.getExpansions("gzhlb_xuming")[i])) {
								return 2;
							}
						}
						return -1;
					});
					next.judge2 = function (result) {
						return result.bool;
					};
					'step 1'
					if (result.bool) {
						player.recover(1 - player.hp);
					} else {
						player.die();
					}
					var cards = player.getExpansions("gzhlb_xuming");
					if (cards.length) player.loseToDiscardpile(cards);
					'step 2'
					player.addToExpansion(get.cards(4), 'draw').gaintag.add('gzhlb_xuming');
				},
				sub: true,
				"_priority": 0,
			},
			x: {
				mod: {
					playerEnabled(card, player, target) {
						if (target.hasSkill('gzhlb_xuming')) return false;
					},
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gzhlb_suiming": {
		trigger: {
			player: ["useCard", "respond"],
		},
		init: function (player) {
			player.storage.gzhlb_suiming = [];
			player.storage.gzhlb_suiming_1 = 2;
		},
		frequent: true,
		intro: {
			markcount: "expansion",
			mark: function (dialog, content, player) {
				var content = player.getExpansions('gzhlb_suiming');
				if (content && content.length) {
					if (player == game.me || player.isUnderControl()) {
						dialog.addAuto(content);
					}
					else {
						return '共有' + get.cnNumber(content.length) + '张随命';
					}
				}
			},
			content: function (content, player) {
				var content = player.getExpansions('gzhlb_suiming');
				if (content && content.length) {
					if (player == game.me || player.isUnderControl()) {
						return get.translation(content);
					}
					return '共有' + get.cnNumber(content.length) + '张随命';
				}
			},
		},
		content: function () {
			"step 0"
			var card = get.cards()[0];
			event.card = card;
			game.cardsGotoOrdering(card);
			player.showCards(card, get.translation(player) + '发动了〖随命〗');
			"step 1"
			var suit = get.suit(card);
			if (player.storage.gzhlb_suiming && player.storage.gzhlb_suiming.contains(suit)) {
				var a = player.storage.gzhlb_suiming.length;
				var num = [1, 2, 3].randomGet();
				if (num == 1) {
					if (player.hp >= player.maxHp) {
						var num = [2, 3].randomGet();
					} else {
						player.recover(a);
					}
				}
				if (num == 2) player.draw(a);
				if (num == 3) {
					player.chooseTarget(true, get.prompt('gzhlb_suiming'), "请选择一名其他角色并对其造成【" + a + "】点伤害", function (card, player, target) {
						return target != player;
					}).set('ai', function (target) {
						var player = _status.event.player;
						return get.damageEffect(target, player, player);
					});
				}

			} else {
				player.addToExpansion(card, 'gain2').gaintag.add('gzhlb_suiming');
				player.markAuto('gzhlb_suiming', [get.suit(card)]);
				event.finish();
			}
			"step 2"
			if (result.bool && result.targets && result.targets.length) {
				result.targets[0].damage(player.getExpansions("gzhlb_suiming").length);
			}
			"step 3"
			var num = Math.floor(Math.random() * player.countMark("gzhlb_suiming_1")) + 1;
			if (num == 1) {
				if (player.countMark("gzhlb_suiming_1") > 3) {
					player.say(["我就是幸运之神！"].randomGet());
				}
				if (player.countMark("gzhlb_suiming_1") == 3) {
					player.say(["这还不是我的上限！"].randomGet());
				}
				if (player.countMark("gzhlb_suiming_1") == 2) {
					player.say(["再来一次！"].randomGet());
				}
				if (player.countMark("gzhlb_suiming_1") == 1) {
					player.say(["该时来运转了！"].randomGet());
				}
				game.log(player, get.translation(player) + '【1/' + player.countMark("gzhlb_suiming_1") + '】概率重新发动了〖随命〗')
				player.addMark('gzhlb_suiming_1', 1);
				event.goto(1);
			} else {
				player.removeMark('gzhlb_suiming_1', 1);
			}
			"step 4"
			player.storage.gzhlb_suiming = [];
			player.loseToDiscardpile(player.getExpansions("gzhlb_suiming"));
		},
		"_priority": 0,
	},
	"gzhlb_guibian": {
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		filterTarget: function (card, player, target) {
			return player.canCompare(target);
		},
		usable: 3,
		selectTarget: function () {
			var player = _status.event.player;
			return [1, player.hp];
		},
		check: function (card) {
			var val = get.value(card);
			var num = card.number;
			if (num > 10) return 15 - val;
			if (num > 8) return 10 - val;
			if (num > 2) return 5 - val;
		},
		selectCard: 1,
		filterCard: true,
		discard: false,
		lose: false,
		delay: 0,
		filter: function (event, player) {
			return player.countCards('h') > 0 && player.countMark('gzhlb_guibian_1') < 3;
		},
		prompt: function () {
			var player = _status.event.player;
			return "请选择一张手牌并与至多【" + player.hp + "】名其他角色同时拼点";
		},
		multitarget: true,
		multiline: true,
		content: function () {
			player.addGaintag(cards, 'gzhlb_guibian');
			player.chooseToCompare(targets).callback = lib.skill.gzhlb_guibian.callback;
			player.addMark('gzhlb_guibian_1', 1);
		},
		callback: function () {
			'step 0'
			if (event.num1 > event.num2) {
				game.delay();
				target.addMark('gzhlb_guibian_2', 1);
			} else {
				player.addMark('gzhlb_guibian_1', 1);
			}
		},
		ai: {
			order: 9,
			result: {
				target: -1,
			},
		},
		"_priority": 0,
		group: ["gzhlb_guibian_1", "gzhlb_guibian_2", "gzhlb_guibian_3"],
		subSkill: {
			"1": {
				trigger: {
					player: "chooseToCompareBegin",
				},
				silentForce: true,
				content: function () {
					if (!trigger.fixedResult) trigger.fixedResult = {};
					var hs = player.getCards('h', function (card) {
						return card.hasGaintag('gzhlb_guibian');
					});
					if (hs.length) trigger.fixedResult[player.playerid] = hs.randomGet();
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				marktext: "诡",
				intro: {
					name: "诡辩",
					content: function (storage, event, player) {
						var str = [];
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (list[i].hasSkill('gzhlb_guibian')) {
								str += '【' + get.translation(list[i]) + '】';
							}
						}
						return '你无法响应' + str + '使用的牌';
					},
				},
				trigger: {
					player: ["useCardToPlayered", "useCard"],
				},
				forced: true,
				filter: function (event, player) {
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].hasMark('gzhlb_guibian_2')) {
							event.count++;
						}
					}
					return event.card && event.count > 0;
				},
				content: function () {
					if (event.triggername == 'useCard') {
						trigger.directHit.addArray(game.filterPlayer(function (current) {
							return current != player && current.hasMark('gzhlb_guibian_2');
						}));
					}
					if (event.triggername == 'useCardToPlayered' && trigger.target.hasMark('gzhlb_guibian_2')) {
						trigger.target.removeMark('gzhlb_guibian_2', 1);
						player.draw();
					}
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				trigger: {
					player: "phaseEnd",
				},
				filter: function (event, player) {
					return player.hasMark('gzhlb_guibian_1');
				},
				silentForce: true,
				content: function () {
					player.removeMark('gzhlb_guibian_1', player.countMark('gzhlb_guibian_1'));
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	"gzhlb_shiya": {
		trigger: {
			player: "damageBegin4",
		},
		audio: "ext:鸽府包/audio/skill:2",
		zhuanhuanji: true,
		marktext: "☯",
		init: function (player) {
			player.storage.gzhlb_shiya = true;
		},
		"prompt2": function (event, player, storage, skill) {
			var player = _status.event.player;
			var source = _status.event.source;
			var list = game.filterPlayer();
			event.count = 0;
			if (player.storage.gzhlb_shiya == true) {
				if (event.source) {
					for (var i = 0; i < list.length; i++) {
						if (list[i] == event.source && list[i].hasMark('gzhlb_guibian_2')) {
							event.count += list[i].countMark('gzhlb_guibian_2');
						}
					}
					var a = event.count;
					if (a > 0) {
						if (a >= event.num) {
							var b = event.num;
						} else {
							var b = a;
						}
						return '你是否令【' + get.translation(event.source) + '】对你造成的【' + event.num + '】点伤害改为【' + (event.num - b) + '】，然后令其失去【' + b + '】枚“诡”标记并获得牌堆顶的【' + b + '】张牌？';
					} else {
						return '你是否令【' + get.translation(event.source) + '】对你造成的【' + event.num + '】点伤害改为【' + (event.num - 1) + '】，然后令其获得牌堆顶的【1】张牌？';
					}
				} else {
					return '你是否令即将受到的【' + event.num + '】点伤害改为【' + (event.num - 1) + '】？';
				}
			} else {
				for (var i = 0; i < list.length; i++) {
					if (list[i].hasMark('gzhlb_guibian_2')) {
						event.count++;
					}
				}
				if (event.count < 1) event.count++;
				return '你是否获得牌堆顶的【' + event.count + '】张牌？';
			}
		},
		intro: {
			content: function (storage, player, skill) {
				if (!player.storage.gzhlb_shiya == true) return '在你受到其他角色造成的伤害前，你可以令此次伤害减x，然后令伤害来源失去x枚“诡”标记并获得牌堆顶的x张牌（x为其当前拥有的“诡”标记数且至少为1）';
				if (!player.storage.gzhlb_shiya) return '在你受到其他角色造成的伤害前，你获得牌堆顶的y张牌（y为全场拥有“诡”标记的角色数且至少为1）。因此技能获得的牌本回合不可使用、打出、弃置';
			},
		},
		content: function () {
			if (player.storage.gzhlb_shiya == true) {
				if (trigger.source) {
					event.count = 0;
					var a = trigger.source.countMark('gzhlb_guibian_2');
					if (a > 0) {
						if (a >= trigger.num) {
							event.count += trigger.num;
						} else {
							event.count += a;
						}
						trigger.source.removeMark('gzhlb_guibian_2', event.count);
					} else { event.count++; }
					trigger.num -= event.count;
					trigger.source.addTempSkill('gzhlb_shiya_1');
					var cards = game.cardsGotoOrdering(get.cards(event.count)).cards;
					trigger.source.gain(cards).gaintag.add('gzhlb_shiya');
					game.log(trigger.source, '获得了牌堆顶的【' + cards.length + '】张牌');
				} else {
					trigger.num--;
				}
			} else {
				event.count = 0;
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].hasMark('gzhlb_guibian_2')) {
						event.count++;
					}
				}
				if (event.count < 1) {
					event.count++;
				}
				player.addTempSkill('gzhlb_shiya_1');
				var cards = game.cardsGotoOrdering(get.cards(event.count)).cards;
				player.gain(cards).gaintag.add('gzhlb_shiya');
				game.log(player, '获得了牌堆顶的【' + cards.length + '】张牌');
			}
			player.changeZhuanhuanji('gzhlb_shiya');
		},
		group: ["gzhlb_shiya_2"],
		subSkill: {
			"1": {
				intro: {
					content: "不能使用、打出或弃置“诡辩”牌",
				},
				mod: {
					cardDiscardable: function (card, player) {
						if (card.hasGaintag('gzhlb_shiya')) return false;
					},
					"cardEnabled2": function (card, player) {
						if (get.itemtype(card) == 'card' && card.hasGaintag('gzhlb_shiya')) return false;
					},
				},
				onremove: function (player) {
					player.removeGaintag('gzhlb_shiya');
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: "compare",
					target: "compare",
				},
				forced: true,
				content: function () {
					'step 0'
					var a = player.countMark('gzhlb_shiya_2');
					if (trigger.num1 + a <= 13) {
						var b = a;
					} else {
						var b = 13 - trigger.num1;
					}
					if (player == trigger.target || !trigger.iwhile) {
						if (player == trigger.player) {
							trigger.num1 = Math.min(13, trigger.num1 + b);
						} else {
							trigger.num2 = Math.min(13, trigger.num1 + b);
						}
						game.log(player, '的拼点牌点数+' + b);
						player.addMark('gzhlb_shiya_2', 1);
					}
					game.delayx();
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gzhlb_tanyu": {
		trigger: {
			player: ["phaseUseBefore", "damageEnd"],
		},
		frequent: true,
		"prompt2": function (event, player) {
			var a = _status.event.player.maxHp;
			return '你是否从【1~' + a + '】中选择一个数字，然后你随机触发以下一项：1、摸等同于你所选择数字张牌；2、弃置等同于你所选择数字张牌？';
		},
		content: function () {
			'step 0'
			var num = [1, 2, 3, 4, 5, 6, 7, 8, 9].randomGet();
			if (num > player.maxHp) num = player.maxHp;
			var map = {};
			var list = [];
			for (var i = 1; i <= player.maxHp; i++) {
				var cn = get.cnNumber(i, true);
				map[cn] = i;
				list.push(cn);
			}
			var a = player.maxHp;
			event.map = map;
			player.chooseControl(list, function () {
				return get.cnNumber(_status.event.goon, true);
			}).set('prompt', '你可以从【1~' + a + '】中选择一个数字，然后你随机触发以下一项：1、摸等同于你所选择数字张牌；2、弃置等同于你所选择数字张牌。').set('goon', num);
			'step 1'
			var c = event.map[result.control] || 1;
			var b = [1, 2].randomGet();
			if (b == 1) {
				player.draw(c);
				if (c >= player.hp) {
					player.loseMaxHp();
					event.finish();
				}
			}
			if (b == 2) {
				player.chooseToDiscard(c, 'he', true);
				if (c >= player.countCards('he')) {
					player.loseMaxHp();
					event.finish();
				}
			}

			'step 2'
			player.chooseControl('恢复体力', '摸两张牌', ui.create.dialog(get.prompt('gzhlb_tanyu'))).set('prompt', '请选择一项：1、恢复一点体力；2、摸两张牌。每项有1/2概率不触发，若未触发，你对场上随机一名角色造成一点伤害。').ai = function () {
				if (player.hp < 3) return 0;
				return 1;
			}
			'step 3'
			var d = [1, 2].randomGet();
			if (result.control == '恢复体力') {
				if (d == 1) player.recover();
			}
			if (result.control == '摸两张牌') {
				if (d == 1) player.draw(2);
			}
			if (d == 2) {
				var list = game.players.slice(0);
				if (list.length) {
					var target = list.randomGet();
					player.line(target);
					target.damage();
				}
			}
		},
		ai: {
			result: {
				player: 1,
			},
		},
		"_priority": 0,
	},
	"gzhlb_minglian": {
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		mark: true,
		intro: {
			content: "limited",
		},
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		prompt: "你可选择一名其他角色，你与其将体力上限调整为双方体力之和，任意一方（受到伤害/恢复体力）后，另一方（恢复等量体力/受到等量无来源伤害）",
		filter: function (event, player) {
			return !player.hasMark('gzhlb_minglian_1');
		},
		filterTarget: function (card, player, target) {
			return player != target;
		},
		content: function () {
			var a = player.hp + target.hp;
			if (target.maxHp < a) {
				target.gainMaxHp(a - target.maxHp);
			} else {
				if (target.maxHp > a) {
					target.loseMaxHp(target.maxHp - a);
				}
			}
			if (player.maxHp < a) {
				player.gainMaxHp(a - player.maxHp);
			} else {
				if (player.maxHp > a) {
					player.loseMaxHp(player.maxHp - a);
				}
			}
			player.awakenSkill('gzhlb_minglian');
			player.markAuto("gzhlb_minglian_1", [target]);
			target.markAuto("gzhlb_minglian_2", [player]);
			player.addSkill('gzhlb_minglian_1');
			target.addSkill('gzhlb_minglian_2');
		},
		subSkill: {
			"1": {
				mark: true,
				intro: {
					name: "命链",
					content: "已被“命链”绑定",
				},
				trigger: {
					player: ["changeHpAfter", "dyingBefore"],
				},
				audio: "ext:鸽府包/audio/skill:2",
				forced: true,
				filter: function (event, player, name) {
					return event.getParent().name != 'gzhlb_minglian_2';
				},
				content: function () {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						var e = list[i].maxHp, f = player.maxHp, c = player.hp, d = list[i].hp;
						if (player.storage.gzhlb_minglian_1.includes(list[i])) {
							if ((c + d) < (e + f) / 2) {
								list[i].recover((e + f) / 2 - c - d);
							} else {
								if ((c + d) > (e + f) / 2) {
									list[i].damage(c + d - (e + f) / 2);
								}
							}
						}
					}
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				mark: true,
				intro: {
					name: "命链",
					content: "已被“命链”绑定",
				},
				trigger: {
					player: ["changeHpAfter", "dyingBefore"],
				},
				audio: "ext:鸽府包/audio/skill:2",
				forced: true,
				filter: function (event, player, name) {
					return event.getParent().name != 'gzhlb_minglian_1'
				},
				content: function () {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						var e = list[i].maxHp, f = player.maxHp, c = player.hp, d = list[i].hp;
						if (player.storage.gzhlb_minglian_2.includes(list[i])) {
							if ((c + d) < (e + f) / 2) {
								list[i].recover((e + f) / 2 - c - d);
							} else {
								if ((c + d) > (e + f) / 2) {
									list[i].damage(c + d - (e + f) / 2);
								}
							}
						}
					}
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gzhlb_kuangfei": {
		trigger: {
			player: "useCardEnd",
		},
		frequent: true,
		audio: "ext:鸽府包/audio/skill:2",
		content: function () {
			'step 0'
			event.count = player.hp;
			player.addMark('gf_shigui', 1);
			player.judge(function (card) {
				if (player == _status.currentPhase) {
					if (get.color(card) == 'black') {
						return -2;
					}
				} else {
					if (get.color(card) == 'red') {
						return -1;
					}
				}
				return 1;
			}).judge2 = function (result) {
				return result.bool == false ? true : false;
			};
			'step 1'
			if (result.bool == false) {
				if (player == _status.currentPhase) {
					player.damage();
				} else {
					player.recover();
				}
			}
			'step 2'
			if (player.hp == event.count) player.draw();
		},
	},
	"gzhlb_fenglou": {
		mod: {
			targetEnabled: function (card, player, target, now) {
				var number = get.number(card);
				if (number <= target.countMark('gzhlb_fenglou')) {
					if (!(target.hasZhuSkill('gzhlb_xiaozao') && target.identity == 'zhu' && player.group == 'qun' && target.hp < 1)) {
						return false;
					}
				}
			},
		},
		mark: true,
		intro: {
			name: "封楼",
			mark: function (dialog, storage, player) {
				var cards = player.getExpansions('gzhlb_fenglou');
				if (cards.length > 0) {
					dialog.addAuto(cards);
				} else {
					return '没有“封楼”牌';
				}
			},
		},
		trigger: {
			global: "roundStart",
		},
		audio: "ext:鸽府包/audio/skill:2",
		frequent: true,
		content: function () {
			'step 0'
			if (5 - game.roundNumber > 0) {
				player.chooseButton(true, ['封楼：选择一张牌并置于武将牌上称为“封”', [get.cards(5 - game.roundNumber), 'vcard']]).set('ai', function (button) {
					return button.link;
				});
			}
			'step 1'
			var cardsd = player.getExpansions('gzhlb_fenglou');
			if (cardsd.length) {
				player.storage.gzhlb_fenglou = 0;
				player.gain(cardsd, 'draw');
			}
			if (result.bool && result.links && result.links.length) {
				player.storage.gzhlb_fenglou = result.links[0].number;
				player.addToExpansion(result.links[0], player, 'give').gaintag.add('gzhlb_fenglou');
			}
			player.syncStorage("gzhlb_fenglou");
		},
		ai: {
			result: {
				player: 1,
			},
		},
		"_priority": 0,
	},
	"gzhlb_zigong": {
		mod: {
			cardUsable: function (card, player) {
				if (!card.cards) return;
				for (var i of card.cards) {
					if (i.hasGaintag('gzhlb_zigong')) return Infinity;
				}
			},
		},
		trigger: {
			player: "useCardBegin",
		},
		audio: "ext:鸽府包/audio/skill:2",
		frequent: true,
		filter: function (event, player) {
			if (player.getStat('damage') || player.getExpansions('gzhlb_fenglou').length < 1) return false;
			return get.number(event.card) >= player.countMark('gzhlb_fenglou');
		},
		content: function () {
			var cards = game.cardsGotoOrdering(get.cards()).cards;
			player.gain(cards).gaintag.add('gzhlb_zigong');
			game.log(player, '获得了牌堆顶的【1】张牌');
		},
		"_priority": 0,
	},
	"gzhlb_xiaozao": {
		unique: true,
		zhuSkill: true,
		locked: true,
		"_priority": 0,
	},
	"gzhlb_linmo": {
		enable: "chooseToUse",
		filter: function (event, player) {
			for (var i of lib.inpile) {
				if (i == 'wuxie' || i == 'shan' || !player.countCards('hse')) return false;
				var type = get.type(i);
				if ((type == 'delay' || type == 'basic' || type == 'trick') && lib.filter.filterCard({
					name: i
				}, player, event)) return true;
			}
			return false;
		},
		hiddenCard: function (player, name) {
			if (name == 'wuxie' || name == 'shan' || !player.countCards('hse')) return false;
			return (!player.getStorage('gzhlb_linmo_lm')
				.contains(name) && player.countCards('hes') > 0 && lib.inpile.contains(name));
		},
		init: function (player) {
			if (!player.storage.gzhlb_linmo_lm) player.storage.gzhlb_linmo_lm = [];
		},
		onremove: true,
		chooseButton: {
			dialog: function (event, player) {
				var list = [];
				for (var i = 0; i < lib.inpile.length; i++) {
					var name = lib.inpile[i];
					if (player.storage.gzhlb_linmo_lm && !player.storage.gzhlb_linmo_lm.contains(name)) continue;
					if (name == 'sha') {
						if (event.filterCard({
							name: name
						}, player, event)) list.push(['基本', '', 'sha']);
						for (var j of lib.inpile_nature) {
							if (event.filterCard({
								name: name,
								nature: j
							}, player, event)) list.push(['基本', '', 'sha', j]);
						}
					} else if (get.type(name) == 'trick' && event.filterCard({
						name: name
					}, player, event)) list.push(['锦囊', '', name]);
					else if (get.type(name) == 'delay' && event.filterCard({
						name: name
					}, player, event)) list.push(['延时锦囊', '', name]);
					else if (get.type(name) == 'basic' && event.filterCard({
						name: name
					}, player, event)) list.push(['基本', '', name]);
				}
				if (list.length == 0) {
					return ui.create.dialog('临摹已无可用牌');
				}
				return ui.create.dialog('临摹', [list, 'vcard']);
			},
			filter: function (button, player) {
				return _status.event.getParent()
					.filterCard({
						name: button.link[2]
					}, player, _status.event.getParent());
			},
			check: function (button) {
				var player = _status.event.player;
				if (player.countCards('hs', button.link[2]) > 0) return 0;
				if (button.link[2] == 'wugu') return 0;
				var effect = player.getUseValue(button.link[2]);
				if (effect > 0) return effect;
				return 0;
			},
			backup: function (links, player) {
				return {
					filterCard: true,
					audio: "ext:鸽府包/audio/skill:2",
					selectCard: 1,
					popname: true,
					check: function (card) {
						return 6 - get.value(card);
					},
					position: 'hes',
					viewAs: {
						name: links[0][2],
						nature: links[0][3]
					},
					precontent: function () {
						player.addSkill('gzhlb_linmo_areomve');
					},
				}
			},
			prompt: function (links, player) {
				return '将一张牌当做' + (get.translation(links[0][3]) || '') + get.translation(links[0][2]) + '使用';
			},
		},
		ai: {
			skillTagFilter: function (player) {
				if (!player.countCards('hes')) return false;
			},
			order: 4,
			result: {
				player: function (player) {
					var allshown = true,
						players = game.filterPlayer();
					for (var i = 0; i < players.length; i++) {
						if (players[i].ai.shown == 0) {
							allshown = false;
						}
						if (players[i] != player && players[i].countCards('h') && get.attitude(player, players[i]) > 0) {
							return 1;
						}
					}
					if (allshown) return 1;
					return 0;
				},
			},
			threaten: 1.9,
		},
		group: "gzhlb_linmo_lm",
		subSkill: {
			areomve: {
				trigger: {
					player: "useCardEnd",
				},
				mark: true,
				silentForce: true,
				content: function () {
					player.removeSkill('gzhlb_linmo_areomve');
					player.unmarkAuto('gzhlb_linmo_lm', [trigger.card.name]);
					game.log(player, '从临摹记录中移除了', '#y' + get.translation(trigger.card.name));
					player.draw();
				},
				sub: true,
				"_priority": 0,
			},
			lm: {
				trigger: {
					target: "useCardToTarget",
					player: "addJudgeBefore",
				},
				forced: true,
				locked: false,
				filter: function (event, player) {
					if (event.name == 'useCardToTarget' && get.type(event.card, null, false) != 'trick' && get.type(event.card, null, false) != 'basic') return false;
					return !player.getStorage('gzhlb_linmo_lm').contains(event.card.name);
				},
				content: function () {
					player.markAuto('gzhlb_linmo_lm', [trigger.card.name]);
				},
				onremove: true,
				intro: {
					content: "已记录牌名：$",
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gzhlb_geshi": {
		trigger: {
			player: "useCardAfter",
		},
		audio: "ext:鸽府包/audio/skill:2",
		frequent: true,
		filter: function (event, player) {
			if (player.hasMark('gzhlb_geshi_after')) return false;
			return get.type(event.card) != 'basic';
		},
		content: function () {
			"step 0"
			player.chooseTarget(get.prompt('gzhlb_geshi'), "是否选择一名“鸽”标记数小于3的角色并令其获得或失去1枚该标记？（拥有“鸽”的角色手牌上限减2且在回合结束后摸3减其拥有的“鸽”标记数张牌）", function (card, player, target) {
				return target.countMark('gzhlb_geshi_1') < 3;
			}).set('ai', function (target) {
				var player = _status.event.player, att = get.attitude(player, target);
				if (player.countMark('gzhlb_geshi_1') < 1) return 3.5;
				if (player.countMark('gzhlb_geshi_1') > 1) return 3;
				if (att > 0 && target.countMark('gzhlb_geshi_1') > 1) return 2.5;
				if (att <= 0 && target.countMark('gzhlb_geshi_1') == 1) return 2;
				if (att <= 0 && target.countMark('gzhlb_geshi_1') == 2) return 1.5;
				if (att <= 0 && target.countMark('gzhlb_geshi_1') < 1) return 1;
				if (att > 0 && target.countMark('gzhlb_geshi_1') < 1 && target.hp > 2) return 0.5;
				return 0;
			});
			"step 1"
			if (result.bool) {
				var target = result.targets[0];
				event.target = target;
				if (target.hasMark('gzhlb_geshi_1')) {
					player.chooseControl('获得标记', '失去标记', 'cancel2', ui.create.dialog('令【' + get.translation(target) + '】获得还是失去【1】枚“鸽”标记？')).ai = function () {
						var player = _status.event.player, att = get.attitude(player, target);
						if (target == player && player.countMark('gzhlb_geshi_1') > 1) return 1;
						if (target == player && player.countMark('gzhlb_geshi_1') < 1) return 0;
						if (att > 0 && target.countMark('gzhlb_geshi_1') > 1) return 1;
						if (att > 0 && target.countMark('gzhlb_geshi_1') < 1) return 0;
						if (att <= 0) return 0;
						return 1;
					}
				} else {
					target.addMark('gzhlb_geshi_1', 1);
					if (!target.hasSkill('gzhlb_geshi_1')) target.addSkill('gzhlb_geshi_1');
				}
			}
			"step 2"
			player.addSkill('gzhlb_geshi_after');
			if (result.control == '获得标记') {
				target.addMark('gzhlb_geshi_1', 1);
				if (!target.hasSkill('gzhlb_geshi_1')) target.addSkill('gzhlb_geshi_1');
			}
			if (result.control == '失去标记') {
				target.removeMark('gzhlb_geshi_1', 1);
				if (!target.hasMark('gzhlb_geshi_1')) {
					if (target.hasSkill('gzhlb_geshi_1')) target.removeSkill('gzhlb_geshi_1');
				}
			}
		},
		subSkill: {
			after: {
				trigger: {
					player: "phaseAfter",
				},
				forced: true,
				charlotte: true,
				content: function () {
					player.removeSkill('gzhlb_geshi_after');
					player.addMark('gzhlb_geshi_after', 1);
				},
				sub: true,
				"_priority": 0,
			},
			"1": {
				marktext: "鸽",
				intro: {
					name: "鸽市",
					content: "你的手牌上限减2，弃牌阶段结束后，摸3减你拥有“鸽”标记数张牌",
				},
				forced: true,
				charlotte: true,
				mod: {
					maxHandcard: function (player, num) {
						if (player.hasMark('gzhlb_geshi_1')) {
							return num - 2;
						}
					},
				},
				trigger: {
					player: "phaseDiscardEnd",
				},
				filter: function (event, player) {
					return 3 - event.player.countMark('gzhlb_geshi_1') > 0;
				},
				content: function () {
					"step 0"
					trigger.player.draw(3 - trigger.player.countMark('gzhlb_geshi_1'));
					player.chooseTarget(get.prompt('gzhlb_geshi'), "是否将1枚“鸽”标记转移给选择一名“鸽”标记数小于3的其他角色？", function (card, player, target) {
						return target != player && target.countMark('gzhlb_geshi_1') < 3;
					}).set('ai', function (target) {
						var player = _status.event.player, att = get.attitude(player, target);
						if (att > 0 && target.countMark('gzhlb_geshi_1') > 1) return 2.5;
						if (att <= 0 && target.countMark('gzhlb_geshi_1') == 1) return 2;
						if (att <= 0 && target.countMark('gzhlb_geshi_1') == 2) return 1.5;
						if (att <= 0 && target.countMark('gzhlb_geshi_1') < 1) return 1;
						if (att > 0 && target.countMark('gzhlb_geshi_1') < 1 && target.hp > 2) return 0.5;
						return 0;
					});
					"step 1"
					if (result.bool) {
						player.removeMark('gzhlb_geshi_1', 1);
						if (!player.hasMark('gzhlb_geshi_1')) {
							if (player.hasSkill('gzhlb_geshi_1')) player.removeSkill('gzhlb_geshi_1');
						}
						var target = result.targets[0];
						target.addMark('gzhlb_geshi_1', 1);
						if (!target.hasSkill('gzhlb_geshi_1')) target.addSkill('gzhlb_geshi_1');
					}
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gzhlb_gezi": {
		init: function (player, skill) {
			player.storage[skill] = false;
		},
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		enable: "phaseUse",
		audio: "ext:鸽府包/audio/skill:2",
		intro: {
			content: "limited",
		},
		prompt: "你可以选择一名角色并将“鸽子”覆盖到该角色的武将牌上（鸽子：1/1/1，回合结束时选择一项：1、受到1点伤害；2、摸两张牌）。",
		selectTarget: 1,
		filterTarget: true,
		content: function () {
			target.gfMianJu({ name: "gzhlb_bg", hp: 1, maxHp: 1, hujia: 1, skills: lib.character.gzhlb_bg[3] });
			player.awakenSkill('gzhlb_gezi');
		},
		ai: {
			order: 11,
			result: {
				player: 0.5,
				target: -1,
			},
			threaten: 1.5,
		},
		"_priority": 0,
	},
	"gzhlb_baige": {
		trigger: {
			player: "phaseEnd",
		},
		forced: true,
		content: function () {
			"step 0"
			player.chooseControl('摸两张牌', '受到伤害', ui.create.dialog('请选择你摸你摸两张牌还是受到【1】点伤害？')).ai = function () {
				return 1;
			}
			"step 1"
			if (result.control == '摸两张牌') {
				player.draw(2);
			} else {
				player.damage();
			}
		},
		"_priority": 0,
	},
	"gzhlb_shengtao": {
		trigger: {
			player: "useCardToPlayered",
		},
		frequent: true,
		filter(event, player) {
			return event.card.name == "sha";
		},
		content() {
			"step 0";
			var dialog = [get.prompt("gzhlb_shengtao")];
			list = lib.inpile.filter(function (i) {
				return !player.getStorage("gzhlb_shengtao").includes(i) && get.tag({ name: i }, "damage");
			});
			if (list.length) {
				dialog.push('<div class="text center">未记录</div>');
				dialog.push([list, "vcard"]);
			}
			player.chooseButton(dialog).set("ai", function (button) {
				var player = _status.event.player,
					name = button.link[2];
				return -get.effect(player, { name: name }, player, player);
			});
			"step 1";
			if (result.bool) {
				var name = result.links[0][2];
				event.name = result.links[0][2];
				trigger.target.chooseToUse({ name: name }, "声讨：是否使用一张【" + get.translation(name) + "】？若未使用，其视为对你使用【" + get.translation(name) + "】且此" + get.translation(trigger.card) + "不可被响应");
				player.markAuto("gzhlb_shengtao", [name]);
				player.addTempSkill("gzhlb_shengtao_clear");
				game.log(player, "声讨记录了", "#y" + get.translation(name));
				game.delayx();
			} else {
				event.finish();
			}
			"step 2"
			if (!result.bool) {
				player.useCard({ name: [event.name], isCard: true }, trigger.target);
				trigger.directHit.add(trigger.target);
			}
		},
		ai: {
			"unequip_ai": true,
			"directHit_ai": true,
			skillTagFilter(player, tag, arg) {
				if (get.attitude(player, arg.target) > 0 || !player.isPhaseUsing()) {
					return false;
				}
				if (tag == "directHit_ai") {
					return arg.target.hp >= Math.max(1, arg.target.countCards("h") - 1);
				}
				if (arg && arg.name == "sha" && arg.target.getEquip(2)) {
					return true;
				}
				return false;
			},
		},
		subSkill: {
			clear: {
				onremove: function (player) {
					player.unmarkSkill("gzhlb_shengtao");
					delete player.storage.gzhlb_shengtao;
				},
				sourceSkill: "gzhlb_shengtao",
				sub: true,
			},
		},
		"_priority": 0,
	},
	"gzhlb_shitan": {
		enable: "phaseUse",
		usable: 1,
		prompt: "你可以选择任意一名角色的一张手牌，然后其展示与此牌类别相同的所有牌，你本回合使用前的x张牌后，摸一张牌（x为本次展示牌的数量）。",
		selectTarget: 1,
		filterTarget: function (card, player, target) {
			return target.countCards('h') > 0
		},
		content: function () {
			'step 0'
			player.choosePlayerCard('你可以选择【' + get.translation(target) + '】的一张手牌，然后其展示与此牌类别相同的所有牌，你本回合使用的前x张牌后，摸一张牌（x为本次展示牌的数量）。', target, 1, true);
			'step 1'
			var list = [];
			var cards = target.getCards("h");
			for (var j = 0; j < cards.length; j++) {
				if (get.type(cards[j], "trick") == get.type(result.cards[0], "trick")) list.push(cards[j]);
			}
			player.showCards(list);
			player.addTempSkill('gzhlb_shitan_draw');
			player.addMark('gzhlb_shitan_draw', list.length);
		},
		ai: {
			order: 11,
			result: {
				player: 0.5,
				target: -1,
			},
			threaten: 1.5,
		},
		subSkill: {
			draw: {
				trigger: {
					player: "useCardAfter",
				},
				silentForce: true,
				locked: false,
				filter: function (event, player) {
					return player.hasMark('gzhlb_shitan_draw');
				},
				content: function () {
					player.draw();
					player.removeMark('gzhlb_shitan_draw', 1);
				},
				onremove: function (player) {
					player.unmarkSkill("gzhlb_shitan_draw");
					delete player.storage.gzhlb_shitan_draw;
				},
				sub: true,
			},
		},
	},
	"gzhlb_youli": {
		intro: {
			markcount: "expansion",
			mark: function (dialog, content, player) {
				var content = player.getExpansions('gzhlb_youli');
				if (content && content.length) {
					if (player != game.me) {
						dialog.addAuto(content);
					}
					else {
						return '共有' + get.cnNumber(content.length) + '张游历';
					}
				}
			},
			content: function (content, player) {
				var content = player.getExpansions('gzhlb_youli');
				if (content && content.length) {
					if (player != game.me) {
						return get.translation(content);
					}
					return '共有' + get.cnNumber(content.length) + '张游历';
				}
			},
		},
		enable: "phaseUse",
		prompt: "你可以将一张手牌置于任意角色武将牌上称为“游历”（其不可见）",
		filter: function (event, player) {
			return player.countCards('he') > 0;
		},
		selectCard: [1, Infinity],
		filterCard: true,
		filterTarget: true,
		check: function (card) {
			return 6 - get.value(card)
		},
		position: "h",
		discard: false,
		lose: false,
		delay: false,
		content: function () {
			target.addToExpansion(cards, player, 'give').gaintag.add('gzhlb_youli');
			for (var i = 0; i < cards.length; i++) {
				if (!target.storage.gzhlb_youli) target.storage.gzhlb_youli = [[], []];
				target.storage.gzhlb_youli[0].push(cards[i]);
				target.storage.gzhlb_youli[1].push(player);
			}
			game.delayx();
		},
		ai: {
			order: 9,
			result: {
				target: function (player, target) {
					return -1;
				},
			},
		},
		group: ["gzhlb_youli_use"],
		subSkill: {
			use: {
				trigger: {
					global: "useCard",
				},
				forced: true,
				charlotte: true,
				filter: function (event, player) {
					event.count = 0;
					for (var i = 0; i < event.player.getExpansions("gzhlb_youli").length; i++) {
						if (get.suit(event.card) == get.suit(event.player.getExpansions("gzhlb_youli")[i])) {
							event.count++;
						}
					}
					return event.count > 0;
				},
				content: function () {
					"step 0"
					var target = trigger.player;
					if (!target.hasSkill('gzhlb_youli_can') && player == target) target.addTempSkill('gzhlb_youli_can');
					var list = target.storage.gzhlb_youli, card = list[0].shift();
					if (target.getExpansions('gzhlb_youli').contains(card)) {
						if (player.canUse(card, target, false)) player.useCard(card, target, false);
						else target.loseToDiscardpile(card);
					}
					"step 1"
					var list = trigger.player.storage.gzhlb_youli;
					if (!player.hasHistory('useCard', evt => {
						return evt.getParent() == event && player.hasHistory('sourceDamage', evtx => evt.card == evtx.card);
					})) {
						player.draw();
					}
					if (list[0].length) event.goto(0);
					else {
						if (trigger.player.hasSkill('gzhlb_youli_can')) trigger.player.removeSkill('gzhlb_youli_can');
					}
				},
				sub: true,
				"_priority": 0,
			},
			can: {
				mod: {
					targetInRange: function (card, player, target) {
						if (player == target) return true;
					},
					targetEnabled: function (card, player) {
						return true;
					},
					cardEnabled: function (card, player, target) {
						if (player == target) return true;
					},
					playerEnabled: function (card, player, target) {
						if (target != player) return false;
					},
				},
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"gzhlb_jiuding": {
		enable: "phaseUse",
		filter: function (event, player, name) {
			return !player.hasSkill('gzhlb_jiuding_j');
		},
		chooseButton: {
			dialog: function (event, player) {
				var a = 0, e = 0, f = 0;
				event.count1 = 0; event.count2 = 0; event.count3 = 0; event.count4 = 0; event.count5 = 0; event.count6 = 0; event.count7 = 0; event.count8 = 0; event.count9 = 0; event.count10 = 0;
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].hasMark('gzhlb_jiudingYi')) event.count1++;
					if (list[i].hasMark('gzhlb_jiudingEr')) event.count2++;
					if (list[i].hasMark('gzhlb_jiudingSan')) event.count3++;
					if (list[i].hasMark('gzhlb_jiudingSi')) event.count4++;
					if (list[i].hasMark('gzhlb_jiudingWu')) event.count5++;
					if (list[i].hasMark('gzhlb_jiudingLiu')) event.count6++;
					if (list[i].hasMark('gzhlb_jiudingQi')) event.count7++;
					if (list[i].hasMark('gzhlb_jiudingBa')) event.count8++;
					if (list[i].hasMark('gzhlb_jiudingJiu')) event.count9++;
					if (list[i].hasMark('gzhlb_jiudingShi')) event.count10++;
				}
				for (var i = 0; i < list.length; i++) {
					if (get.attitude(player, list[i]) < 0) {
						if (!list[i].hasMark('gzhlb_jiudingShi') && !list[i].hasMark('gzhlb_jiudingWu') && list[i].hp != list[i].maxHp && list[i] != player && event.count5 > 0) {
							a++;
						}
						if (list[i].maxHp < 2 && !list[i].hasMark('gzhlb_jiudingJiu') && !list[i].hasMark('gzhlb_jiudingShi') && event.count9 > 0) {
							e++;
						}
						if (list[i] != player && list[i].hasMark('gzhlb_jiudingShi')) {
							f++;
						}
					}
				}
				var dialog = ui.create.dialog(`<font color='#FFFF99'>九钉：请选择一项</font>`, 'hidden');
				if (event.count1 > 0) {
					if (player == game.me && _status.auto == false) {
						dialog.add([lib.skill.gzhlb_jiuding.choicesa.slice(), 'textbutton']);
					} else {
						if (a < 1 && e < 1) {
							if (player.hasFriend() || (player.hasMark('gzhlb_jiudingYi') && !player.hasFriend() && f > 0) || (!player.hasMark('gzhlb_jiudingYi') && player.countCards('h') < 6)) dialog.add([lib.skill.gzhlb_jiuding.choicesa.slice(), 'textbutton']);
						}
					}
				} else {
					dialog.add([lib.skill.gzhlb_jiuding.choicesb.slice(), 'textbutton']);
				}
				if (event.count2 > 0) {
					if (player == game.me && _status.auto == false) {
						dialog.add([lib.skill.gzhlb_jiuding.choicesc.slice(), 'textbutton']);
					} else {
						if (a < 1 && e < 1 && !player.hasMark('gzhlb_jiuding_hand') && player.hasMark('gzhlb_jiuding_sha') && player.countCards('h') > 3) {
							if (player.hasFriend() || (player.hasMark('gzhlb_jiudingEr') && !player.hasFriend() && f > 0) || (!player.hasMark('gzhlb_jiudingEr') && player.hp > 1)) dialog.add([lib.skill.gzhlb_jiuding.choicesc.slice(), 'textbutton']);
						}
					}
				} else {
					dialog.add([lib.skill.gzhlb_jiuding.choicesd.slice(), 'textbutton']);
				}
				if (event.count3 > 0) {
					if (player == game.me && _status.auto == false) {
						dialog.add([lib.skill.gzhlb_jiuding.choicese.slice(), 'textbutton']);
					} else {
						if (a < 1 && e < 1 && !player.hasMark('gzhlb_jiuding_sha') && player.countCards('h') > 3) {
							if (player.hasFriend() || (player.hasMark('gzhlb_jiudingSan') && !player.hasFriend() && f > 0) || (!player.hasMark('gzhlb_jiudingSan') && player.countMark('gzhlb_jiuding_sha') < 1)) dialog.add([lib.skill.gzhlb_jiuding.choicese.slice(), 'textbutton']);
						}
					}
				} else {
					dialog.add([lib.skill.gzhlb_jiuding.choicesf.slice(), 'textbutton']);
				}
				if (event.count4 > 0) {
					if (player == game.me && _status.auto == false) {
						dialog.add([lib.skill.gzhlb_jiuding.choicesg.slice(), 'textbutton']);
					} else {
						if (a < 1 && e < 1) {
							if (player.hasFriend() || (player.hasMark('gzhlb_jiudingSi') && !player.hasFriend() && f > 0) || (!player.hasMark('gzhlb_jiudingSi') && player.countCards('h') > 5)) dialog.add([lib.skill.gzhlb_jiuding.choicesg.slice(), 'textbutton']);
						}
					}
				} else {
					dialog.add([lib.skill.gzhlb_jiuding.choicesh.slice(), 'textbutton']);
				}
				if (event.count5 > 0) {
					if (player == game.me && _status.auto == false) {
						dialog.add([lib.skill.gzhlb_jiuding.choicesi.slice(), 'textbutton']);
					} else {
						if (a > 0) dialog.add([lib.skill.gzhlb_jiuding.choicesi.slice(), 'textbutton']);
					}
				} else {
					dialog.add([lib.skill.gzhlb_jiuding.choicesj.slice(), 'textbutton']);
				}
				if (event.count6 > 0) {
					if (player == game.me && _status.auto == false) {
						dialog.add([lib.skill.gzhlb_jiuding.choicesk.slice(), 'textbutton']);
					} else {
						if (a < 1 && e < 1) dialog.add([lib.skill.gzhlb_jiuding.choicesk.slice(), 'textbutton']);
					}
				} else {
					dialog.add([lib.skill.gzhlb_jiuding.choicesl.slice(), 'textbutton']);
				}
				if (event.count7 > 0) {
					if (player == game.me && _status.auto == false) {
						dialog.add([lib.skill.gzhlb_jiuding.choicesm.slice(), 'textbutton']);
					} else {
						if (a < 1 && e < 1) dialog.add([lib.skill.gzhlb_jiuding.choicesm.slice(), 'textbutton']);
					}
				} else {
					dialog.add([lib.skill.gzhlb_jiuding.choicesn.slice(), 'textbutton']);
				}
				if (event.count8 > 0) {
					if (player == game.me && _status.auto == false) {
						dialog.add([lib.skill.gzhlb_jiuding.choiceso.slice(), 'textbutton']);
					} else {
						if (a < 1 && e < 1) dialog.add([lib.skill.gzhlb_jiuding.choiceso.slice(), 'textbutton']);
					}
				} else {
					dialog.add([lib.skill.gzhlb_jiuding.choicesp.slice(), 'textbutton']);
				}
				if (event.count9 > 0) {
					if (player == game.me && _status.auto == false) {
						dialog.add([lib.skill.gzhlb_jiuding.choicesu.slice(), 'textbutton']);
					} else {
						if (e > 0) dialog.add([lib.skill.gzhlb_jiuding.choicesu.slice(), 'textbutton']);
					}
				} else {
					dialog.add([lib.skill.gzhlb_jiuding.choicesv.slice(), 'textbutton']);
				}
				if (event.count10 > 0)
					dialog.add([lib.skill.gzhlb_jiuding.choicesw.slice(), 'textbutton']);
				return dialog;
			},
			filter: function (button, event, player) {
				event.count1 = 0; event.count2 = 0; event.count3 = 0; event.count4 = 0; event.count5 = 0; event.count6 = 0; event.count7 = 0; event.count8 = 0; event.count9 = 0; event.count10 = 0;
				var link = button.link;
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].hasMark('gzhlb_jiudingYi')) event.count1++;
					if (list[i].hasMark('gzhlb_jiudingEr')) event.count2++;
					if (list[i].hasMark('gzhlb_jiudingSan')) event.count3++;
					if (list[i].hasMark('gzhlb_jiudingSi')) event.count4++;
					if (list[i].hasMark('gzhlb_jiudingWu')) event.count5++;
					if (list[i].hasMark('gzhlb_jiudingLiu')) event.count6++;
					if (list[i].hasMark('gzhlb_jiudingQi')) event.count7++;
					if (list[i].hasMark('gzhlb_jiudingBa')) event.count8++;
					if (list[i].hasMark('gzhlb_jiudingJiu')) event.count9++;
					if (list[i].hasMark('gzhlb_jiudingShi')) event.count10++;
				}
				if (link == 'Yi') return event.count1 > 0;
				if (link == 'Er') return event.count2 > 0;
				if (link == 'San') return event.count3 > 0;
				if (link == 'Si') return event.count4 > 0;
				if (link == 'Wu') return event.count5 > 0;
				if (link == 'Liu') return event.count6 > 0;
				if (link == 'Qi') return event.count7 > 0;
				if (link == 'Ba') return event.count8 > 0;
				if (link == 'Jiu') return event.count9 > 0;
				if (link == 'Shi') return event.count10 > 0;
			},
			check: function (button) {
				var player = _status.event.player;
				var b = 1, c = 1, d = 1, f = 1;
				switch (button.link) {
					case 'Jiu':
						return true;
					case 'Wu':
						return true;
					case 'San':
						return true;
					case 'Er':
						return true;
					case 'Yi':
						return true;
					case 'Si':
						return true;
					case 'Ba':
						return d > 0;
					case 'Qi':
						return c > 0;
					case 'Liu':
						return b > 0;
				}
			},
			backup: function (links) {
				var next = get.copy(lib.skill['gzhlb_jiuding_backup']);
				next.choice = links[0];
				return next;
			},
		},
		ai: {
			order: 8,
			result: {
				player: 1,
			},
		},
		choicesa: [["Yi", "<font color='#FFFF99'>钉一：摸两张牌</font>"]],
		choicesb: [["Yi", "<font color='#AAAAAA'>钉一：摸两张牌</font>"]],
		choicesc: [["Er", "<font color='#FFFF99'>钉二：手牌上限+1</font>"]],
		choicesd: [["Er", "<font color='#AAAAAA'>钉二：手牌上限+1</font>"]],
		choicese: [["San", "<font color='#FFFF99'>钉三：出杀次数+1</font>"]],
		choicesf: [["San", "<font color='#AAAAAA'>钉三：出杀次数+1</font>"]],
		choicesg: [["Si", "<font color='#FFFF99'>钉四：摸四张牌并弃置四张牌</font>"]],
		choicesh: [["Si", "<font color='#AAAAAA'>钉四：摸四张牌并弃置四张牌</font>"]],
		choicesi: [["Wu", "<font color='#FFFF99'>钉五：将体力上限调整为当前体力值</font>"]],
		choicesj: [["Wu", "<font color='#AAAAAA'>钉五：将体力上限调整为当前体力值</font>"]],
		choicesk: [["Liu", "<font color='#FFFF99'>钉六：弃两张牌</font>"]],
		choicesl: [["Liu", "<font color='#AAAAAA'>钉六：弃两张牌</font>"]],
		choicesm: [["Qi", "<font color='#FFFF99'>钉七：手牌上限-1</font>"]],
		choicesn: [["Qi", "<font color='#AAAAAA'>钉七：手牌上限-1</font>"]],
		choiceso: [["Ba", "<font color='#FFFF99'>钉八：移除一点护甲</font>"]],
		choicesp: [["Ba", "<font color='#AAAAAA'>钉八：移除一点护甲</font>"]],
		choicesu: [["Jiu", "<font color='#FFFF99'>钉九：受到一点无来源伤害并恢复一点体力</font>"]],
		choicesv: [["Jiu", "<font color='#AAAAAA'>钉九：受到一点无来源伤害并恢复一点体力</font>"]],
		choicesw: [["Shi", "<font color='#FFFF99'>钉十：无法获得钉一~九的效果</font>"]],
		"_priority": 0,
		group: ["gzhlb_jiuding_sui", "gzhlb_jiuding_1"],
		subSkill: {
			"1": {
				trigger: {
					global: "phaseAfter",
					player: "damageBefore",
				},
				"prompt2": function (event, player) {
					return '你是否立即获得一个额外的出牌阶段？';
				},
				filter: function (event, player, name) {
					if (name == 'phaseAfter') {
						return !_status.currentPhase.getStat('damage');
					} else {
						if (_status.currentPhase && _status.currentPhase.isAlive()) {
							return !_status.currentPhase.getStat('damage');
						} else {
							return true;
						}
					}
				},
				content: function () {
					var target = _status.currentPhase;
					if (target && target.isAlive()) {
						if (!target.getStat('damage')) {
							var next = player.phaseUse();
							event.next.remove(next);
							trigger.next.push(next);
						}
					} else {
						var next = player.phaseUse();
						event.next.remove(next);
						trigger.next.push(next);
					}
				},
				ai: {
					result: {
						player: 2,
					},
				},
				sub: true,
				"_priority": 0,
			},
			mark: {
				mark: true,
				intro: {
					name: "九钉",
					content: function (storage, player) {
						var str = [], list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (list[i].hasMark('gzhlb_jiudingYi') && list[i] == player) str += '<br>【钉一】：摸两张牌';
							if (list[i].hasMark('gzhlb_jiudingEr') && list[i] == player) str += '<br>【钉二】：手牌上限+1';
							if (list[i].hasMark('gzhlb_jiudingSan') && list[i] == player) str += '<br>【钉三】：出杀次数+1';
							if (list[i].hasMark('gzhlb_jiudingSi') && list[i] == player) str += '<br>【钉四】：摸四张牌并弃置四张牌';
							if (list[i].hasMark('gzhlb_jiudingWu') && list[i] == player) str += '<br>【钉五】：将体力上限调整为当前体力值';
							if (list[i].hasMark('gzhlb_jiudingLiu') && list[i] == player) str += '<br>【钉六】：弃两张牌';
							if (list[i].hasMark('gzhlb_jiudingQi') && list[i] == player) str += '<br>【钉七】：手牌上限-1';
							if (list[i].hasMark('gzhlb_jiudingBa') && list[i] == player) str += '<br>【钉八】：移除一点护甲';
							if (list[i].hasMark('gzhlb_jiudingJiu') && list[i] == player) str += '<br>【钉九】：受到一点无来源伤害并恢复一点体力';
							if (list[i].hasMark('gzhlb_jiudingShi') && list[i] == player) str += '<br>【钉十】：无法获得钉一~九的效果';
						}
						if (str.length) {
							return '已拥有的钉标记：' + str;
						} else {
							return '未拥有钉标记';
						}
					},
				},
				sub: true,
				"_priority": 0,
			},
			backup: {
				content: function () {
					'step 0'
					var list = [];
					var list2 = [];
					var choice = lib.skill.gzhlb_jiuding_backup.choice;
					event.choice = choice;
					if (choice == 'Yi') {
						list = '摸两张牌';
						list2 = '钉一';
					}
					if (choice == 'Er') {
						list = '手牌上限+1';
						list2 = '钉二';
					}
					if (choice == 'San') {
						list = '出杀次数+1';
						list2 = '钉三';
					}
					if (choice == 'Si') {
						list = '摸四张牌并弃置四张牌';
						list2 = '钉四';
					}
					if (choice == 'Wu') {
						list = '将体力上限调整为当前体力值';
						list2 = '钉五';
					}
					if (choice == 'Liu') {
						list = '弃两张牌';
						list2 = '钉六';
					}
					if (choice == 'Qi') {
						list = '手牌上限-1';
						list2 = '钉七';
					}
					if (choice == 'Ba') {
						list = '移除一点护甲';
						list2 = '钉八';
					}
					if (choice == 'Jiu') {
						list = '受到一点无来源伤害并恢复一点体力';
						list2 = '钉九';
					}
					if (choice == 'Shi') {
						list = '无法获得钉一~九的效果';
						list2 = '钉十';
					}
					player.chooseTarget(get.prompt('gzhlb_jiuding'), '你可以选择一名未拥有【' + list2 + '】（' + list + '）标记的角色为目标，然后将场上拥有此标记的角色的标记转移给目标', function (card, player, target) {
						if (choice == 'Yi') return !target.hasMark('gzhlb_jiudingYi');
						if (choice == 'Er') return !target.hasMark('gzhlb_jiudingEr');
						if (choice == 'San') return !target.hasMark('gzhlb_jiudingSan');
						if (choice == 'Si') return !target.hasMark('gzhlb_jiudingSi');
						if (choice == 'Wu') return !target.hasMark('gzhlb_jiudingWu');
						if (choice == 'Liu') return !target.hasMark('gzhlb_jiudingLiu');
						if (choice == 'Qi') return !target.hasMark('gzhlb_jiudingQi');
						if (choice == 'Ba') return !target.hasMark('gzhlb_jiudingBa');
						if (choice == 'Jiu') return !target.hasMark('gzhlb_jiudingJiu');
						if (choice == 'Shi') return !target.hasMark('gzhlb_jiudingShi');
					}).set('ai', function (target) {
						var player = _status.event.player, att = get.attitude(player, target);
						if (choice == 'Yi' || choice == 'Er' || choice == 'San' || choice == 'Si') {
							if (att > 0 && target.countCards('h') > 3) return 2;
							if (target == player) return 1;
							if (att < 0 && target.hasMark('gzhlb_jiudingShi')) return 0.5;
							if (att < 0 && !target.hasMark('gzhlb_jiudingShi')) return -2;
						}
						if (choice == 'Jiu') {
							if (att < 0 && target.hp < 2 && !target.hasMark('gzhlb_jiudingShi')) return 2;
							if (target == player && player.hp > 1) return 1;
							return -0.5;
						}
						if (choice == 'Wu') {
							if (att < 0 && target.hp != target.maxHp && !target.hasMark('gzhlb_jiudingShi')) return 2;
							if (att > 0 && target.hp == target.maxHp) return 1;
							if (att > 0) return -1;
						}
						if (choice == 'Ba') {
							if (att < 0 && target.hujia && !target.hasMark('gzhlb_jiudingShi')) return 2;
							if (att > 0 && !target.hujia) return 1;
							if (att > 0 && target.hujia) return -1;
						}
						if (choice == 'Liu') {
							if (att < 0 && target.countCards('he') == 2 && !target.hasMark('gzhlb_jiudingShi')) return 2;
							if (att < 0 && target.countCards('he') > 2 && !target.hasMark('gzhlb_jiudingShi')) return 1.5;
							if (att < 0 && !target.hasMark('gzhlb_jiudingShi')) return 1;
							if (att < 0) return 0.5;
						}
					});
					'step 1'
					if (result.bool && result.targets && result.targets.length) {
						player.addTempSkill('gzhlb_jiuding_j', { player: 'phaseUseBefore' });
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (event.choice == 'Yi' && list[i].countMark('gzhlb_jiudingYi')) {
								list[i].removeMark('gzhlb_jiudingYi', 1);
							}
							if (event.choice == 'Er' && list[i].countMark('gzhlb_jiudingEr')) {
								list[i].removeMark('gzhlb_jiudingEr', 1);
							}
							if (event.choice == 'San' && list[i].countMark('gzhlb_jiudingSan')) {
								list[i].removeMark('gzhlb_jiudingSan', 1);
							}
							if (event.choice == 'Si' && list[i].countMark('gzhlb_jiudingSi')) {
								list[i].removeMark('gzhlb_jiudingSi', 1);
							}
							if (event.choice == 'Wu' && list[i].countMark('gzhlb_jiudingWu')) {
								list[i].removeMark('gzhlb_jiudingWu', 1);
							}
							if (event.choice == 'Liu' && list[i].countMark('gzhlb_jiudingLiu')) {
								list[i].removeMark('gzhlb_jiudingLiu', 1);
							}
							if (event.choice == 'Qi' && list[i].countMark('gzhlb_jiudingQi')) {
								list[i].removeMark('gzhlb_jiudingQi', 1);
							}
							if (event.choice == 'Ba' && list[i].countMark('gzhlb_jiudingBa')) {
								list[i].removeMark('gzhlb_jiudingBa', 1);
							}
							if (event.choice == 'Jiu' && list[i].countMark('gzhlb_jiudingJiu')) {
								list[i].removeMark('gzhlb_jiudingJiu', 1);
							}
							if (event.choice == 'Shi' && list[i].countMark('gzhlb_jiudingShi')) {
								list[i].removeMark('gzhlb_jiudingShi', 1);
							}
						}
						if (event.choice == 'Yi') {
							result.targets[0].addMark('gzhlb_jiudingYi', 1);
							if (!result.targets[0].hasMark('gzhlb_jiudingShi')) {
								result.targets[0].draw(2);
							}
						}
						if (event.choice == 'Er') {
							result.targets[0].addMark('gzhlb_jiudingEr', 1);
							if (!result.targets[0].hasMark('gzhlb_jiudingShi')) {
								if (!result.targets[0].hasSkill('gzhlb_jiuding_hand')) {
									result.targets[0].addSkill('gzhlb_jiuding_hand');
								}
								result.targets[0].addMark('gzhlb_jiuding_hand', 1);
							}
						}
						if (event.choice == 'San') {
							result.targets[0].addMark('gzhlb_jiudingSan', 1);
							if (!result.targets[0].hasMark('gzhlb_jiudingShi')) {
								result.targets[0].addSkill('gzhlb_jiuding_sha');
								result.targets[0].addMark('gzhlb_jiuding_sha', 1);
							}
						}
						if (event.choice == 'Si') {
							result.targets[0].addMark('gzhlb_jiudingSi', 1);
							if (!result.targets[0].hasMark('gzhlb_jiudingShi')) {
								result.targets[0].draw(4);
								result.targets[0].chooseToDiscard(4, 'he', true).set('ai', function (card) {
									return 8 - get.value(card);
								})
							}
						}
						if (event.choice == 'Wu') {
							result.targets[0].addMark('gzhlb_jiudingWu', 1);
							if (!result.targets[0].hasMark('gzhlb_jiudingShi')) {
								if (result.targets[0].hp != result.targets[0].maxHp) {
									result.targets[0].loseMaxHp(result.targets[0].maxHp - result.targets[0].hp);
								}
							}
						}
						if (event.choice == 'Liu') {
							result.targets[0].addMark('gzhlb_jiudingLiu', 1);
							if (!result.targets[0].hasMark('gzhlb_jiudingShi')) {
								if (result.targets[0].countCards('he') > 0) {
									result.targets[0].chooseToDiscard(2, 'he', true).set('ai', function (card) {
										return 8 - get.value(card);
									})
								}
							}
						}
						if (event.choice == 'Qi') {
							result.targets[0].addMark('gzhlb_jiudingQi', 1);
							if (!result.targets[0].hasMark('gzhlb_jiudingShi')) {
								if (!result.targets[0].hasSkill('gzhlb_jiuding_hand')) {
									result.targets[0].addSkill('gzhlb_jiuding_hand');
								}
								result.targets[0].addMark('gzhlb_jiuding_handr', 1);
							}
						}
						if (event.choice == 'Ba') {
							result.targets[0].addMark('gzhlb_jiudingBa', 1);
							if (!result.targets[0].hasMark('gzhlb_jiudingShi')) {
								if (result.targets[0].hujia > 0) {
									result.targets[0].changeHujia(-1);
								}
							}
						}
						if (event.choice == 'Jiu') {
							result.targets[0].addMark('gzhlb_jiudingJiu', 1);
							if (!result.targets[0].hasMark('gzhlb_jiudingShi')) {
								result.targets[0].damage('nosource');
								result.targets[0].recover();
							}
						}
						if (event.choice == 'Shi') {
							result.targets[0].addMark('gzhlb_jiudingShi', 1);
						}
						player.line(result.targets[0], 'green');
					}
				},
				sub: true,
				"_priority": 0,
			},
			sui: {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter: function (event) {
					return game.players.length > 1 && (event.name != 'phase' || game.phaseNumber == 0);
				},
				forced: true,
				content: function () {
					'step 0'
					var list1 = game.filterPlayer();
					for (var i = 0; i < list1.length; i++) {
						if (list1[i].addSkill('gzhlb_jiuding_mark'));
					}
					var list = game.players.slice(0);
					if (list.length) {
						var target = list.randomGet();
						target.addMark('gzhlb_jiudingYi', 1);
						target.draw(2);
						player.line(target);
					}
					'step 1'
					var list = game.players.slice(0);
					if (list.length) {
						var target = list.randomGet();
						target.addMark('gzhlb_jiudingEr', 1);
						if (!target.hasSkill('gzhlb_jiuding_hand')) {
							target.addSkill('gzhlb_jiuding_hand');
						}
						target.addMark('gzhlb_jiuding_hand', 1);
						player.line(target);
					}
					'step 2'
					var list = game.players.slice(0);
					if (list.length) {
						var target = list.randomGet();
						target.addMark('gzhlb_jiudingSan', 1);
						if (!target.hasSkill('gzhlb_jiuding_sha')) {
							target.addSkill('gzhlb_jiuding_sha');
						}
						target.addMark('gzhlb_jiuding_sha', 1);
						player.line(target);
					}
					'step 3'
					var list = game.players.slice(0);
					if (list.length) {
						var target = list.randomGet();
						target.addMark('gzhlb_jiudingSi', 1);
						target.draw(4);
						target.chooseToDiscard(4, 'he', true).set('ai', function (card) {
							return 8 - get.value(card);
						})
						player.line(target);
					}
					'step 4'
					var list = game.players.slice(0);
					if (list.length) {
						var target = list.randomGet();
						target.addMark('gzhlb_jiudingWu', 1);
						if (target.hp != target.maxHp) {
							target.loseMaxHp(target.maxHp - target.hp);
						}
						player.line(target);
					}
					'step 5'
					var list = game.players.slice(0);
					if (list.length) {
						var target = list.randomGet();
						target.addMark('gzhlb_jiudingLiu', 1);
						if (target.countCards('he') > 0) {
							target.chooseToDiscard(2, 'he', true).set('ai', function (card) {
								return 8 - get.value(card);
							})
						}
						player.line(target);
					}
					'step 6'
					var list = game.players.slice(0);
					if (list.length) {
						var target = list.randomGet();
						target.addMark('gzhlb_jiudingQi', 1);
						if (!target.hasSkill('gzhlb_jiuding_hand')) {
							target.addSkill('gzhlb_jiuding_hand');
						}
						target.addMark('gzhlb_jiuding_handr', 1);
						player.line(target);
					}
					'step 7'
					var list = game.players.slice(0);
					if (list.length) {
						var target = list.randomGet();
						target.addMark('gzhlb_jiudingBa', 1);
						if (target.hujia > 0) {
							target.changeHujia(-1);
						}
						player.line(target);
					}
					'step 8'
					var list = game.players.slice(0);
					if (list.length) {
						var target = list.randomGet();
						target.addMark('gzhlb_jiudingJiu', 1);
						target.damage('nosource');
						target.recover();
						player.line(target);
					}
				},
				sub: true,
				"_priority": 0,
			},
			sha: {
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == 'sha') return num + player.countMark('gzhlb_jiuding_sha');
					},
				},
				sub: true,
				"_priority": 0,
			},
			hand: {
				mod: {
					maxHandcard: function (player, num) {
						return num + player.countMark('gzhlb_jiuding_hand') - player.countMark('gzhlb_jiuding_handr');
					},
				},
				sub: true,
				"_priority": 0,
			},
			j: {
				sub: true,
				"_priority": 0,
			},
		},
	},
	"gzhlb_dingshi": {
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		enable: "phaseUse",
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		content: function () {
			'step 0'
			player.awakenSkill('gzhlb_dingshi');
			player.chooseControl('加入钉十', '分配九钉',
				ui.create.dialog(get.prompt('gzhlb_dingshi'), 'hidden')).ai = function () {
					if (player.hasFriend()) {
						return 1;
					} else {
						return 0;
					}
				}
			'step 1'
			if (result.control == '分配九钉') {
				event.count = 0;
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (list[i].countMark('gzhlb_jiudingYi')) {
						list[i].removeMark('gzhlb_jiudingYi', 1);
					}
					if (list[i].countMark('gzhlb_jiudingEr')) {
						list[i].removeMark('gzhlb_jiudingEr', 1);
					}
					if (list[i].countMark('gzhlb_jiudingSan')) {
						list[i].removeMark('gzhlb_jiudingSan', 1);
					}
					if (list[i].countMark('gzhlb_jiudingSi')) {
						list[i].removeMark('gzhlb_jiudingSi', 1);
					}
					if (list[i].countMark('gzhlb_jiudingWu')) {
						list[i].removeMark('gzhlb_jiudingWu', 1);
					}
					if (list[i].countMark('gzhlb_jiudingLiu')) {
						list[i].removeMark('gzhlb_jiudingLiu', 1);
					}
					if (list[i].countMark('gzhlb_jiudingQi')) {
						list[i].removeMark('gzhlb_jiudingQi', 1);
					}
					if (list[i].countMark('gzhlb_jiudingBa')) {
						list[i].removeMark('gzhlb_jiudingBa', 1);
					}
					if (list[i].countMark('gzhlb_jiudingJiu')) {
						list[i].removeMark('gzhlb_jiudingJiu', 1);
					}
					if (list[i].countMark('gzhlb_jiudingShi')) {
						list[i].removeMark('gzhlb_jiudingShi', 1);
					}
				}
			} else {
				event.goto(4);
			}
			'step 2'
			var list = [];
			var list2 = [];
			if (event.count == 0) {
				list = '摸两张牌';
				list2 = '钉一';
			}
			if (event.count == 1) {
				list = '手牌上限+1';
				list2 = '钉二';
			}
			if (event.count == 2) {
				list = '出杀次数+1';
				list2 = '钉三';
			}
			if (event.count == 3) {
				list = '摸四张牌并弃置四张牌';
				list2 = '钉四';
			}
			if (event.count == 4) {
				list = '将体力上限调整为当前体力值';
				list2 = '钉五';
			}
			if (event.count == 5) {
				list = '弃两张牌';
				list2 = '钉六';
			}
			if (event.count == 6) {
				list = '手牌上限-1';
				list2 = '钉七';
			}
			if (event.count == 7) {
				list = '移除一点护甲';
				list2 = '钉八';
			}
			if (event.count == 8) {
				list = '受到一点无来源伤害并恢复一点体力';
				list2 = '钉九';
			}
			if (event.count < 9) {
				player.chooseTarget(get.prompt('gzhlb_dingshi'), '你可以选择一名未拥有【' + list2 + '】（' + list + '）标记的角色为目标，然后将场上拥有此标记的角色的标记转移给目标', function (card, player, target) {
					if (event.count == 0) return !target.hasMark('gzhlb_jiudingYi');
					if (event.count == 1) return !target.hasMark('gzhlb_jiudingEr');
					if (event.count == 2) return !target.hasMark('gzhlb_jiudingSan');
					if (event.count == 3) return !target.hasMark('gzhlb_jiudingSi');
					if (event.count == 4) return !target.hasMark('gzhlb_jiudingWu');
					if (event.count == 5) return !target.hasMark('gzhlb_jiudingLiu');
					if (event.count == 6) return !target.hasMark('gzhlb_jiudingQi');
					if (event.count == 7) return !target.hasMark('gzhlb_jiudingBa');
					if (event.count == 8) return !target.hasMark('gzhlb_jiudingjiu');
				}).set('ai', function (target) {
					var player = _status.event.player, att = get.attitude(player, target);
					if (event.count == 0 || event.count == 1 || event.count == 2 || event.count == 3) {
						if (att > 0 && target.countCards('h') > 3) return 4;
						if (target == player) return 3;
						if (att < 0) return -2;
					}
					if (event.count == 4) {
						if (att < 0 && target.hp != target.maxHp) return 2;
						if (att > 0 && target.hp == target.maxHp) return 1;
						if (att > 0 && target.hp != target.maxHp) return -1;
					}
					if (event.count == 5) {
						if (att < 0 && target.countCards('he') == 2) return 2;
						if (att < 0 && target.countCards('he') > 2) return 1.5;
						if (att < 0) return 1;
						if (att > 0) return -1;
					}
					if (event.count == 6) {
						if (att < 0 && target.hp < 2) return 2;
						if (att < 0) return 1;
						if (att > 0) return -1;
					}
					if (event.count == 7) {
						if (att < 0 && target.hujia) return 2;
						if (att > 0 && !target.hujia) return 1;
						if (att > 0 && target.hujia) return -1;
					}
					if (event.count == 8) {
						if (att < 0 && target.hp < 2) return 3;
						if (target == player && player.hp > 1) return 2;
						if (att > 0 && target.hp > 1) return 1;
					}
				});
			}
			'step 3'
			if (result.bool && result.targets && result.targets.length && event.count < 9) {
				if (event.count == 0) {
					result.targets[0].addMark('gzhlb_jiudingYi', 1);
					result.targets[0].draw(2);
				}
				if (event.count == 1) {
					result.targets[0].addMark('gzhlb_jiudingEr', 1);
					if (!result.targets[0].hasSkill('gzhlb_jiuding_hand')) {
						result.targets[0].addSkill('gzhlb_jiuding_hand');
					}
					result.targets[0].addMark('gzhlb_jiuding_hand', 1);
				}
				if (event.count == 2) {
					result.targets[0].addMark('gzhlb_jiudingSan', 1);
					result.targets[0].addSkill('gzhlb_jiuding_sha');
					result.targets[0].addMark('gzhlb_jiuding_sha', 1);
				}
				if (event.count == 3) {
					result.targets[0].addMark('gzhlb_jiudingSi', 1);
					result.targets[0].draw(4);
					result.targets[0].chooseToDiscard(4, 'he', true).set('ai', function (card) {
						return 8 - get.value(card);
					})
				}
				if (event.count == 4) {
					result.targets[0].addMark('gzhlb_jiudingWu', 1);
					if (result.targets[0].hp != result.targets[0].maxHp) {
						result.targets[0].loseMaxHp(result.targets[0].maxHp - result.targets[0].hp);
					}
				}
				if (event.count == 5) {
					result.targets[0].addMark('gzhlb_jiudingLiu', 1);
					if (result.targets[0].countCards('he') > 0) {
						result.targets[0].chooseToDiscard(2, 'he', true).set('ai', function (card) {
							return 8 - get.value(card);
						})
					}
				}
				if (event.count == 6) {
					result.targets[0].addMark('gzhlb_jiudingQi', 1);
					if (!result.targets[0].hasSkill('gzhlb_jiuding_hand')) {
						result.targets[0].addSkill('gzhlb_jiuding_hand');
					}
					result.targets[0].addMark('gzhlb_jiuding_handr', 1);
				}
				if (event.count == 7) {
					result.targets[0].addMark('gzhlb_jiudingBa', 1);
					if (result.targets[0].hujia > 0) {
						result.targets[0].changeHujia(-1);
					}
				}
				if (event.count == 8) {
					result.targets[0].addMark('gzhlb_jiudingJiu', 1);
					result.targets[0].damage('nosource');
					result.targets[0].recover();

				}
				event.goto(2);
				player.line(result.targets[0], 'green');
			} if (event.count < 9) {
				event.goto(2);
			}
			event.count++;
			if (event.count > 8) {
				event.finish();
			}
			'step 4'
			player.chooseTarget(true, get.prompt('gzhlb_jiuding'), '请选择一名角色获得【钉十】（无法获得钉一~九的效果）标记').set('ai', function (target) {
				var player = _status.event.player;
				return target != player;
			});
			'step 5'
			if (result.bool && result.targets && result.targets.length) {
				result.targets[0].addMark('gzhlb_jiudingShi', 1);
			}
		},
		ai: {
			order: 5,
			result: {
				player: 1,
			},
		},
		"_priority": 0,
	},
	lanzheng: {
		audio: "ext:杂包/audio:2",
		trigger: {
			player: ["useCard", "respond"],
		},
		forced: true,
		filter: function (event, player) {
			var num = player.getAllHistory("useCard").length + player.getAllHistory("respond").length;
			return num % 2 == 0;
		},
		content: function () {
			player.draw();
		},
		"_priority": 0,
	},
	erhao: {
		skillAnimation: true,
		animationColor: "wood",
		juexingji: true,
		derivation: ["reyingzi", "gzyinghun"],
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		filter(event, player) {
			return player.hp >= 1;
		},
		forced: true,
		async content(event, trigger, player) {
			player.awakenSkill("erhao");
			await player.gainMaxHp();
			await player.addSkills(["reyingzi", "gzyinghun"]);
		},
		"_priority": 0,
	},
	eryi: {
		shaRelated: true,
		preHidden: true,
		usable: 1,
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		filter: function (event, player) {
			if (event.card.name != 'juedou' && event.card.name != 'sha') return false;
			return player == event.target || event.getParent().triggeredTargets3.length == 1;
		},
		logTarget: function (event, player) {
			if (event.card.name == 'sha') return event.targets[0];
			if (event.card.name == 'juedou') return event.targets[0];;
		},
		content: function () {
			var target = lib.skill.eryi.logTarget(trigger, player);
			if (player == trigger.player) {
				player.discardPlayerCard(target, 'he', 1);
			} else {
				player.discardPlayerCard(trigger.player, 'he', 1);
			}
		},
		frequent: true,
		group: ["eryi_roundcount"],
		"_priority": 0,
	},
	sanhao: {
		audio: "ext:杂包/audio:2",
		trigger: {
			player: ["damageEnd", "phaseEnd"],
		},
		usable: 1,
		forced: true,
		charlotte: true,
		sourceSkill: "sanhao",
		content: function () {
			"step 0";
			player.judge();
			"step 1";
			switch (result.color) {
				case "red":
					player.draw();
					if (player.hujia < 5) {
						player.changeHujia();
					}
					break;
				case "black":
					player.chooseTarget(get.prompt("sanhao"), function (card, player, target) {
						return player != target;
					});
					break;
				default:
					break;
			}
			"step 2";
			if (result.bool) {
				var
					target = result.targets[0];
				player.discardPlayerCard(target, 'hej', 1);
				target.damage();
			}
		},
		"_priority": 0,
	},
	erer: {
		shaRelated: true,
		preHidden: true,
		trigger: {
			player: "useCardToPlayered",
			target: "useCardToTargeted",
		},
		filter: function (event, player) {
			if (event.card.name != 'juedou' && event.card.name != 'sha') return false;
			return player == event.target || event.getParent().triggeredTargets3.length == 1;
		},
		logTarget: function (event, player) {
			if (event.card.name == 'sha') return event.targets[0];
			if (event.card.name == 'juedou') return event.targets[0];;
		},
		content: function () {
			var target = lib.skill.eryi.logTarget(trigger, player);
			if (player == trigger.player) {
				player.discardPlayerCard(target, 'he', 1);
			} else {
				player.discardPlayerCard(trigger.player, 'he', 1);
			}
		},
		frequent: true,
		group: ["eryi_roundcount"],
		"_priority": 0,
	},
	sihao: {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		content: function () {
			"step 0";
			player.chooseTarget(get.prompt('sihao'), function (card, player, target) {
				return true;
			})
			"step 1";
			if (result.bool) {
				var target = result.targets[0];
				target.damage();
				player.loseMaxHp();
			}
		},
	},
	sanyi: {
		trigger: {
			player: "damageEnd",
		},
		forced: true,
		async content(event, trigger, player) {
			await player.draw(2);
			const { source } = trigger;
			if (source?.isIn() && player.countGainableCards(source, "he")) {
				await source.gainPlayerCard(player, "he", true);
			}
		},
		"_priority": 0,
	},
	saner: {
		trigger: {
			player: "damageEnd",
		},
		forced: true,
		audio: "ext:杂包:2",
		audioname: ["xin_jushou"],
		check(event, player) {
			return player.getHistory("damage").indexOf(event) == 0;
		},
		content() {
			if (player.getHistory("damage").indexOf(trigger) > 0) {
				player.loseHp();
			}
		},
		"_priority": 0,
	},
	wuhao: {
		trigger: {
			source: "damageBegin",
		},
		forced: true,
		content: function () {
			trigger.num++;
		},
		"_priority": 0,
	},
	awuyi: {
		trigger: {
			global: "useCardBegin",
		},
		frequent: true,
		filter: function (event, player) {
			if (get.tag(event.card, 'damage')) {
				return true;
			}
		},
		content: function () {
			player.draw();
		},
		"_priority": 0,
	},
	gzlj_qianjin: {
		enable: "phaseUse",
		usable: 1,
		filter: function (event, player) {
			return player.countCards("h") >= 2
		},
		filterCard: true,
		discard: false,
		lose: false,
		delay: false,
		selectCard: 2,
		check: function (card) {
			return 6 - get.value(card);
		},
		content: function () {
			player.discard(cards);
			player.addTempSkill("gzlj_qianjin_draw");
		},
		ai: {
			order: 5,
			result: {
				player: 1,
			},
			threaten: 1.5,
		},
		"_priority": 0,
		subSkill: {
			draw: {
				init: function (player, skill) {
					player.storage.gzlj_qianjin_draw = 0;
				},
				intro: {
					name: "千金",
					content: "回合结束后你摸两张牌",
				},
				mark: true,
				charlotte: true,
				trigger: {
					player: "phaseEnd",
				},
				forced: true,
				content() {
					player.draw(2);
				},
				sub: true,
				"_priority": 0,
			},
		},
	},
	gzlj_xingshang: {
		trigger: {
			player: "drawEnd",
		},
		force: false,
		frequent: true,
		filter: function (event, player) {
			return event.num >= 2;
		},
		content: function () {
			player.draw();
		},
		"_priority": 0,
	},
	"gf_gehun": {
		unique: true,
		init: function (player) {
			player.storage.gf_gehun = {
				shown: [],
				owned: {},
				characterlist: ["gf_gx", "gf_zj", "gf_sb", "gf_gb", "gf_s", "gf_gp", "gf_yf", "gf_sg", "gf_ks", "gf_bs", "gf_ts"],
			}
		},
		intro: {
			content: function (storage, player) {
				var str = '';
				var slist = storage.owned;
				var list = [];
				for (var i in slist) {
					list.push(i);
				}
				if (list.length) {
					str += get.translation(list[0]);
					for (var i = 1; i < list.length; i++) {
						str += '、' + get.translation(list[i]);
					}
					var skill = player.storage.gf_gehun.current2;
					if (skill) {
						str += '<p>当前技能：' + get.translation(skill);
					}
					return str;
				} else {
					return '你未拥有“鸽府魂”';
				}
			},
			mark: function (dialog, content, player) {
				var slist = content.owned;
				var list = [];
				for (var i in slist) {
					list.push(i);
				}
				if (list.length) {
					dialog.addSmall([list, 'character']);
					for (var i = 0; i < dialog.buttons.length; i++) {
						if (!player.isUnderControl(true)) {
							if (!content.shown.contains(dialog.buttons[i].link)) {
								dialog.buttons[i].node.group.remove();
								dialog.buttons[i].node.hp.remove();
								dialog.buttons[i].node.intro.remove();
								dialog.buttons[i].node.name.innerHTML = '未<br>知';
								dialog.buttons[i].node.name.dataset.nature = '';
								dialog.buttons[i].style.background = '';
								dialog.buttons[i]._nointro = true;
								dialog.buttons[i].classList.add('menubg');
							}
						}
					}
					var skill = player.storage.gf_gehun.current2;
					if (skill) {
						for (var i = 0; i < skill.length; i++) {
							dialog.add('<div><div class="skill">【' + get.translation(lib.translate[skill[i] + '_ab'] || get.translation(skill[i]).slice(0, 2)) + '】</div>' + '<div>' + get.skillInfoTranslation(skill[i], player) + '</div></div>');
						}
					}
				}
			},
		},
		"addgf_gehun": function (player) {
			if (!player.storage.gf_gehun) return;
			if (!_status.characterlist) {
				if (_status.connectMode) var list = get.charactersOL();
				else {
					var list = [];
					for (var i in lib.character) {
						if (lib.filter.characterDisabled2(i) || lib.filter.characterDisabled(i)) continue;
						list.push(i);
					}
				}
				game.countPlayer(function (current) {
					list.remove(current.name);
					list.remove(current.name1);
					list.remove(current.name2);
					if (current.storage.gf_gehun && current.storage.gf_gehun.owned) {
						for (var i in current.storage.gf_gehun.owned) list.removeArray(current.storage.gf_gehun.owned[i]);
					}
				});
				list = ["gf_gx", "gf_zj", "gf_sb", "gf_gb", "gf_s", "gf_gp", "gf_yf", "gf_sg", "gf_ks", "gf_bs", "gf_ts"];
				_status.characterlist = list;
			}
			_status.characterlist = ["gf_gx", "gf_zj", "gf_sb", "gf_gb", "gf_s", "gf_gp", "gf_yf", "gf_sg", "gf_ks", "gf_bs", "gf_ts"];
			_status.characterlist.randomSort();
			var bool = false;
			for (var i = 0; i < _status.characterlist.length; i++) {
				var name = _status.characterlist[i];
				if (player.storage.gf_gehun.owned[name]) continue;
				var skills = lib.character[name][3];
				for (var j = 0; j < skills.length; j++) {
					var info = lib.skill[skills[j]];
					if (info.charlotte || (info.unique && !info.gainable) || info.juexingji || info.limited || info.zhuSkill || info.hiddenSkill || info.dutySkill) skills.splice(j--, 1);
				}
				player.storage.gf_gehun.owned[name] = skills;
				_status.characterlist.remove(name);
				return name;
			}
		},
		"addgf_gehuns": function (player, num) {
			var list = [];
			for (var i = 0; i < num; i++) {
				var name = lib.skill.gf_gehun.addgf_gehun(player);
				if (name) list.push(name);
			}
			if (list.length) {
				game.log(player, '获得了', get.cnNumber(list.length) + '张', '#g鸽府魂')
				lib.skill.gf_gehun.drawCharacter(player, list);
			}
		},
		drawCharacter: function (player, list) {
			game.broadcastAll(function (player, list) {
				if (player.isUnderControl(true)) {
					var cards = [];
					for (var i = 0; i < list.length; i++) {
						var cardname = 'gf_gehun_card_' + list[i];
						lib.card[cardname] = {
							fullimage: true,
							image: 'character:' + list[i]
						}
						lib.translate[cardname] = get.rawName2(list[i]);
						cards.push(game.createCard(cardname, '', ''));
					}
					player.$draw(cards, 'nobroadcast');
				}
			}, player, list);
		},
		group: ["gf_gehun_1", "gf_gehun_2", "gf_gehun_3", "gf_gehun_4"],
		subSkill: {
			"1": {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				silentForce: true,
				filter: function (event, player) {
					return (event.name != 'phase' || game.phaseNumber == 0);
				},
				content: function () {
					var next = game.createEvent('gf_gehun');
					next.player = player;
					next._trigger = trigger;
					next.triggername = 'gf_gehun';
					next.setContent(lib.skill.gf_gehun_2.content);
				},
				sub: true,
				"_priority": 0,
			},
			"2": {
				trigger: {
					player: ["gf_gehun", "gf_gehun_3After"],
				},
				filter: function (event, player, name) {
					return player.storage.gf_gehun.characterlist.length > 0;
				},
				forced: true,
				direct: true,
				content: function () {
					'step 0'
					if (event.triggername == 'gf_gehun') {
						lib.skill.gf_gehun.addgf_gehuns(player, 11);
						player.syncStorage('gf_gehun');
						player.markSkill('gf_gehun');
						event.logged = true;
					}
					var list = player.storage.gf_gehun.characterlist;
					var cards = list.randomGets(3);
					var next = player.chooseButton([
						'鸽魂：请选择一鸽府魂并亮出',
						'<div class="text center">若选择选将界面拥有护甲的武将，则你获得一点护甲；若没有，摸等于该武将体力值张牌</div>',
						[cards, 'character'],
					], true);
					next.set('ai', function (button) {
						return cards.randomGet();
					});
					'step 1'
					if (result.bool && result.links) {
						var map = result.links;
						var skillx = [];
						for (var i = 0; i < result.links.length; i++) {
							var name = map[i];
							var skills = lib.character[name][3];
							for (var j = 0; j < skills.length; j++) {
								var info = lib.skill[skills[j]];
								if (info.limited) continue;
								player.addSkill(skills[j]);
								skillx.add(skills[j]);
								var info = lib.translate[skills[j]];
								if (info && info.indexOf('共喜') != -1) {
									player.maxHp = 3;
									player.draw(3);
									game.log(player, '将体力上限变为了', '#y' + '3点');
								}
								if (info && info.indexOf('征甲') != -1) {
									player.maxHp = 3;
									player.changeHujia();
									game.log(player, '将体力上限变为了', '#y' + '3点');
								}
								if (info && info.indexOf('善卜') != -1) {
									player.maxHp = 3;
									player.draw(3);
									game.log(player, '将体力上限变为了', '#y' + '3点');
								}
								if (info && info.indexOf('固步') != -1) {
									player.maxHp = 4;
									player.changeHujia();
									game.log(player, '将体力上限变为了', '#y' + '4点');
								}
								if (info && info.indexOf('割舍') != -1) {
									player.maxHp = 3;
									player.draw(3);
									game.log(player, '将体力上限变为了', '#y' + '3点');
								}
								if (info && info.indexOf('孤朋') != -1) {
									player.maxHp = 1;
									player.changeHujia();
									game.log(player, '将体力上限变为了', '#y' + '1点');
								}
								if (info && info.indexOf('驭法') != -1) {
									player.maxHp = 3;
									player.draw(2);
									game.log(player, '将体力上限变为了', '#y' + '3点');
								}
								if (info && info.indexOf('商贾') != -1) {
									player.maxHp = 3;
									player.draw(3);
									game.log(player, '将体力上限变为了', '#y' + '3点');
								}
								if (info && info.indexOf('酷税') != -1) {
									player.maxHp = 4;
									player.draw(4);
									game.log(player, '将体力上限变为了', '#y' + '4点');
								}
								if (info && info.indexOf('薄衫') != -1) {
									player.maxHp = 4;
									player.changeHujia();
									game.log(player, '将体力上限变为了', '#y' + '4点');
								}
								if (info && info.indexOf('太岁') != -1) {
									player.maxHp = 3;
									player.draw(3);
									game.log(player, '将体力上限变为了', '#y' + '3点');
								}
								player.flashAvatar('gf_gehun', name);
							}
						}
						var a = player.countMark('gf_gehun_4');
						if (a > 0) { var b = a; } else { var b = 1; }
						player.hp = b;
						game.log(player, '将体力变为了', '#y' + b + '点');
						player.storage.gf_gehun.current = map;
						player.storage.gf_gehun.current2 = skillx;
						//player.storage.gf_gehun.shown.addArray(map);
						player.syncStorage('gf_gehun');
						player.updateMarks('gf_gehun');
					}
				},
				sub: true,
				"_priority": 0,
			},
			"3": {
				trigger: {
					player: "dieBegin",
				},
				enable: "phaseUse",
				forced: true,
				filter: function (event, player, name) {
					if (!player.hasSkill('gf_gehun')) return false;
					if (player.storage.gf_gehun.characterlist.length > 0) {
						if (name != 'dieBegin') {
							return !player.hasSkill('gf_gehun_5');
						} else {
							return player.hasMark('gf_gehun_4');
						}
					}
				},
				content: function () {
					if (event.triggername == 'dieBegin') {
						trigger.cancel();
						player.discard(player.getCards('h'));
						player.removeMark('gf_gehun_4', 1);
					} else {
						player.addTempSkill('gf_gehun_5', { player: 'phaseUseAfter' });
					}
					for (var i of player.storage.gf_gehun.current) {
						player.storage.gf_gehun.characterlist.remove(i);
						player.removeSkill(player.storage.gf_gehun.owned[i]);
						delete player.storage.gf_gehun.owned[i];
						player.storage.gf_gehun.current2 = [];
						player.syncStorage('gf_gehun');
						player.updateMarks('gf_gehun');
					}
				},
				sub: true,
				"_priority": 0,
			},
			"4": {
				trigger: {
					player: "gf_gehun_1After",
					global: "dying",
				},
				init: function (player) {
					player.storage.gf_gehun_4 = 2;
				},
				marktext: "鸽",
				intro: {
					content: "mark",
				},
				frequent: true,
				content: function () {
					lib.skill.gf_gehun.addgf_gehuns(player, 1);
					if (trigger.source == player && event.triggername == 'dying' && player.countMark('gf_gehun_4') < 3) {
						player.addMark('gf_gehun_4', 1);
					}
				},
				sub: true,
				"_priority": 0,
			},
			"5": {
				sub: true,
				"_priority": 0,
			},
		},
		"_priority": 0,
	},
	"seh_yuanchu": {
		trigger: {
			player: "phaseBegin",
			global: "gameStart",
		},
		persevereSkill: true,
		marktext: "衰亡种子",
		intro: {
			name: "衰亡",
			content: "mark",
		},
		frequent: true,
		/*"prompt2": function (event, player) {
			return '你是否要变更你的势力？';
		},*/
		content: function () {
			'step 0'
			var num = game.countGroup();
			player.storage.seh_yuanchuu = [];
			player.markAuto("seh_yuanchuu", ["wei", "shu", "wu", "qun", "jin"]);
			var targets = game.filterPlayer();
			for (var i = 0; i < targets.length; i++) {
				player.markAuto("seh_yuanchuu", [targets[i].group]);
			}
			player.markAuto("seh_yuanchuu", ["cancel"]);
			player.chooseControl(player.storage.seh_yuanchuu).set('prompt', '请选择你要变更的势力').set('ai', () => _status.event.controls.randomGet());
			'step 1'
			if (result.control != "cancel") {
				player.popup(get.translation(result.control + '2'));
				player.changeGroup(result.control);
			}
			'step 2'
			player.draw(game.countGroup());
		},
		group: ["seh_yuanchu_a", "seh_yuanchu_mark", "seh_yuanchu_gain", "seh_yuanchu_lose"],
		subSkill: {
			mark: {
				trigger: {
					global: "damageSource",
				},
				persevereSkill: true,
				forced: true,
				filter: function (event, player) {
					if (player != _status.currentPhase && event.source == player) return false;
					return event.source && event.source.group == player.group;
				},
				content: function () {
					if (player.countMark('seh_yuanchu') < 3) {
						player.addMark('seh_yuanchu', 1);
					}
					player.draw();
				},
				sub: true,
				"_priority": 0,
			},
			gain: {
				trigger: {
					player: "gainAfter",
				},
				persevereSkill: true,
				forced: true,
				filter: function (event, player) {
					return event.parent.parent.name != "phaseDraw" && player != _status.currentPhase && player.countCards('h') > player.hp;
				},
				content: function () {
					player.chooseToUse('是否使用一张牌？');
				},
				sub: true,
			},
			lose: {
				trigger: {
					player: "loseBegin",
				},
				persevereSkill: true,
				"prompt2": function (event, player) {
					var player = _status.event.player;
					return '你是否将本次弃置牌改为移除一枚“衰亡种子”并摸一张牌？';
				},
				filter: function (event, player) {
					if (event.type != 'discard') return false;
					return _status.currentPhase.group == player.group && player.countMark('seh_yuanchu') > 0;
				},
				content: function () {
					trigger.cancel();
					player.removeMark('seh_yuanchu', 1);
					player.draw();
				},
				sub: true,
			},
			a:{
				mod: {
					targetInRange(card, player, target) {
						const color = get.color(card);
						if (card.name == "sha" && get.distance(target, player) <= player.countMark('seh_yuanchu') ) {
							return true;
						}
					},
				},
				trigger: {
					player: ['damageBegin3', "loseHpBegin"],
				},
				persevereSkill: true,
				forced: true,
				lastDo: true,
				filter(event, player) {
					return !event.card && player.countMark('seh_yuanchu') > 0;
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				sub:true,
			},
		},
		"_priority": 0,
	},
	"seh_shenhai": {
		enable: ["chooseToRespond", "chooseToUse"],
		persevereSkill: true,
		forced: true,
		filterCard(card, player) {
			return get.color(card) == "black";
		},
		position: "he",
		viewAs: {
			name: "sha",
		},
		viewAsFilter(player) {
			if (!player.countCards("he", { color: "black" })) {
				return false;
			}
		},
		prompt: "将一张黑色牌当杀使用或打出",
		check(card) {
			return 4.5 - get.value(card);
		},
		onuse(result, player) {
			player.logSkill("seh_shenhai", player);
			player.addMark('seh_shenhai_a', 1);
		},
		group: ["seh_shenhai_a", "seh_shenhai_b", "seh_shenhai_g", "seh_shenhai_h", "seh_shenhai_i", "seh_shenhai_j", "seh_shenhai_k"],
		subSkill: {
			a: {
				trigger: {
					player: "useCardToPlayer",
				},
				persevereSkill: true,
				forced: true,
				filter: function (event, player) {
					return event.card.name == 'sha' && player.countMark('seh_yuanchu') > 0;
				},
				content: function () {
					'step 0'
					var a = player.countMark('seh_yuanchu');
					if (trigger.target.countMark('seh_shenhai_d') + a > 9) {
						var c = 9 - trigger.target.countMark('seh_shenhai_d');
					} else {
						var c = player.countMark('seh_yuanchu');
					}
					if (!trigger.target.hasSkill('seh_shenhai_d')) trigger.target.addSkill('seh_shenhai_d');
					if (trigger.target.countMark('seh_shenhai_d') < 9) trigger.target.addMark('seh_shenhai_d', c);
					if (a > 2) trigger.target.addMark('seh_shenhai_e', 1);
					'step 1'
					if (trigger.target.countMark('seh_shenhai_e') > 2) player.addTempSkill('seh_shenhai_f', 'shaAfter');
				},
				sub: true,
				"_priority": 0,
			},
			b: {
				trigger: {
					player: "useCardToPlayered",
				},
				persevereSkill: true,
				forced: true,
				charlotte: true,
				popup: false,
				silent: true,
				sourceSkill: "seh_shenhai",
				filter(event, player) {
					return event.card.name == 'sha';
				},
				content: function () {
					'step 0'
					if (player.hasMark('seh_shenhai_a')) {
						trigger.target.addTempSkill('qinggang2');
						trigger.target.storage.qinggang2?.add(trigger.card);
						trigger.target.markSkill('qinggang2');
						if(player != _status.currentPhase){
							if(trigger.target.getEquip(1)) {
								if(trigger.target.hasSkill('seh_shenhai_l')) trigger.target.removeSkill('seh_shenhai_l');
								trigger.target.addTempSkill('seh_shenhai_l');
							}
							trigger.target.addTempSkill('seh_shenhai_m');
						}
						player.removeMark("seh_shenhai_a", player.countMark('seh_shenhai_a'));
					}
					'step 1'
					if (trigger.target.getHandcardLimit() < trigger.target.countCards("h")) {
						trigger.target.chooseToDiscard(trigger.target.countCards("h") - trigger.target.getHandcardLimit(), true);
					}
				},
				sub: true,
				"_priority": 0,
			},
			/*c: {
				trigger: {
					player: ["loseHpBefore", "damageBefore"],
				},
				persevereSkill: true,
				forced: true,
				content: function () {
					trigger.cancel();
				},
				sub: true,
			},*/
			d: {
				marktext: "衰亡",
				intro: {
					name: "衰亡",
					content: "mark",
				},
				mod: {
					maxHandcard: function (player, num) {
						var a = Math.floor(player.countMark('seh_shenhai_d') / 3);
						return num - a;
					},
				},
				trigger: {
					global: "phaseAfter",
				},
				content: function () {
					player.removeMark("seh_shenhai_d", 1);
				},
				persevereSkill: true,
				forced: true,
				sub: true,
			},
			e: {
				marktext: "凋亡",
				intro: {
					name: "凋亡",
					content: "mark",
				},
				sub: true,
			},
			f: {
				trigger: {
					source: "damageBegin1",
				},
				persevereSkill: true,
				forced: true,
				filter: function (event, name) {
					return event.card && event.card.name == 'sha' && event.notLink();
				},
				content: function () {
					trigger.num++;
				},
				sub: true,
				"_priority": 0,
				sub: true,
			},
			g: {
				trigger: {
					global: "recoverBefore",
				},
				persevereSkill: true,
				forced: true,
				filter: function (event, player) {
					return event.player.hasMark('seh_shenhai_e');
				},
				content: function () {
					trigger.cancel();
					trigger.player.removeMark('seh_shenhai_e', 1);
				},
				sub: true,
			},
			h: {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				audio: "ext:鸽府包/audio/skill:1",
				forced: true,
				filter: function (event, player) {
					return (event.name != 'phase' || game.phaseNumber == 0);
				},
				content: function () { },
				sub: true,
				parentskill: "seh_shenhai",
				sourceSkill: "seh_shenhai",
			},
			i: {
				trigger: {
					player: "dieBefore",
				},
				audio: "ext:鸽府包/audio/skill:1",
				forced: true,
				content: function () { },
				sub: true,
				parentskill: "seh_shenhai",
				sourceSkill: "seh_shenhai",
			},
			j: {
				trigger: {
					source: "dieAfter",
				},
				audio: "ext:鸽府包/audio/skill:2",
				forced: true,
				content: function () { },
				sub: true,
				parentskill: "seh_shenhai",
				sourceSkill: "seh_shenhai",
			},
			k: {
				trigger: {
					player: "useCard",
				},
				forced: true,
				filter(event, player) {
					return event.card.name == "sha";
				},
				audio: "ext:鸽府包/audio/skill:1",
				content: function () { },
				sub: true,
				parentskill: "seh_shenhai",
				sourceSkill: "seh_shenhai",
			},
			l:{
				init(player, skill) {
					var list = [];
					var cards = player.getCards("e");
					for (var j = 0; j < cards.length; j++) {
						if(get.subtype(cards[j], false) == "equip1"){
							list.push(cards[j].name);
						}
					}
					player.disableSkill(skill, list + '_skill');
				},
				onremove(player, skill) {
					player.enableSkill(skill);
				},	
				marktext: "骸",
				sub: true,
				charlotte: true,
				mark: true,
				intro: {
					content: function (storage, player, skill) {
						var list = [];
						for (var i in player.disabledSkills) {
							if (player.disabledSkills[i].includes(skill)) {
								list.push(i);
							}
						}
						if (list.length) {
							var str = "失效武器技能：";
							for (var i = 0; i < list.length; i++) {
								if (lib.translate[list[i]]) {
									str += get.translation(list[i]) + "、";
								}
							}
							return str.slice(0, str.length - 1);
						}else{
							return "无失效武器技能";
						}
					},
				},
				"_priority": 0,
				arentskill: "seh_shenhai",
				sourceSkill: "seh_shenhai",
			},
			m:{
				trigger: {
					player: "useCardAfter",
				},
				popup: false,
				silent: true,
				forced: true,
				filter(event, player) {
					return get.subtype(event.card, false) == "equip1";
				},
				content() {
					if(player.hasSkill('seh_shenhai_l')) player.removeSkill('seh_shenhai_l');
					player.addTempSkill('seh_shenhai_l');
				},
				sub: true,
			},
		},
		"_priority": 0,
	},
	"seh_xinzhiqi": {
		nobracket: true,
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		persevereSkill: true,
		forced: true,
		locked: false,
		filter: function (event, player) {
			return (event.name != 'phase' || game.phaseNumber == 0);
		},
		content: function () {
			'step 0'
			player.addMark('seh_xinzhiqi_hsfx', 1);
			player.addSkill('seh_xinzhiqi_hsfx');
			player.judge(function (card) {
				if (get.color(card) == 'black') {
					return -2;
				}
				return 1;
			}).judge2 = function (result) {
				return result.bool == false ? true : false;
			};
			'step 1'
			if (result.bool == false) {
				player.chooseTarget(get.prompt('seh_xinzhiqi'), "你可将一名其他角色<a class='gefu_text' onclick='javescript:window.gefu_text(\"驱逐：<br>被驱逐者将会被移除游戏，此状态解除时其流失一点体力。\")'><font color='#00FFFF'><u>驱逐</u></font></a>直到你的下个回合开始或你死亡时", function (card, player, target) {
					return target != player;
				}).set('ai', function (target) {
					var player = _status.event.player;
					return get.attitude(player, target) < 0;
				});
			} else {
				event.finish();
			}
			"step 2";
			if (result.bool) {
				var target = result.targets[0];
				player.markAuto("seh_xinzhiqi_t", [target]);
				game.broadcastAll(function (target) {
					target.out('seh_xinzhiqi');
				}, target);
			}
		},
		ai: {
			threaten: 1.5,
		},
		group: ["seh_xinzhiqi_clear", "seh_xinzhiqi_discard"],
		subSkill: {
			discard:{
				trigger: {
					player: "phaseBegin",
				},
				firstDo: true,
				frequent: true,
				filter: function (event, player) {
					return player.countCards("j") > 0;
				},
				content: function () {
					"step 0"
					player.chooseTarget(get.prompt('seh_xinzhiqi'), "你可令一名角色随机弃置其手牌中拥有的一种花色的所有牌。", function (card, player, target) {
						return target.countCards("h") > 0;
					}).set('ai', function (target) {
						var player = _status.event.player;
						return get.attitude(player, target) < 0;
					});
					"step 1"
					if (result.bool) {
						var target = result.targets[0];
						var cards = target.getCards("h");
						var list = [], list2 = [];
						for (var i = 0; i < cards.length; i++) {
							if(!list.includes(get.suit(cards[i]))) list.push(get.suit(cards[i]));
						}
						if (list.length > 0) {
							var random = Math.floor(Math.random() * list.length);
							randomSuit = list[random];
						}
						var cardsd = target.getCards("h", function (card) {
							return get.suit(card) == randomSuit;
						});
						if (cardsd.length) {
							target.discard(cardsd);
						}
					}
				},
				sub: true,
			},
			hsrh: {
				mod: {
					targetInRange: function (card, player) {
						return true;
					},
				},
				trigger: {
					player: ["loseBefore", "damageBegin", "loseHpBegin", "phaseEnd", "phaseDiscardBefore"],
				},
				filter: function (event, player, name) {
					if (name == 'damageBegin') {
						return (!event.source || event.source.isDead());
					} else {
						if (name == 'loseBefore') {
							return (event.type == 'discard');
						} else {
							return true;
						}
					}
				},
				persevereSkill: true,
				forced: true,
				content: function () {
					'step 0'
					if (event.triggername == 'damageBegin' && (!trigger.source || trigger.source.isDead())) {
						trigger.cancel();
						event.finish();
					}
					if (event.triggername == 'damageBegin' && (!trigger.source || trigger.source.isDead())) {
						trigger.cancel();
						event.finish();
					}
					if (event.triggername != 'damageBegin' && event.triggername != 'phaseEnd') {
						trigger.cancel();
						event.finish();
					}
					if (event.triggername == 'phaseEnd') {
						player.gflib_changeMp(10, 'seh_xinzhiqiM');
						const allTargets = game.filterPlayer();
						const targets = allTargets.filter(p => p !== player);
						let target = null; 
						let card = 0;
						if (targets.length > 0) {
							target = targets[0]; 
							card = target.countCards("h");
							for (let i = 1; i < targets.length; i++) {
								const targetNum = targets[i];
								const cardNum = targetNum.countCards("h");
								if (cardNum > card) {
									card = cardNum;
									target = targetNum;
								}
							}
						}
						event.cardsd = card;
						if (player.countCards('h') <= Math.max(8, event.cardsd)) {
							event.finish();
						}
					}
					'step 1'
					if (event.triggername == 'phaseEnd') {
						var next = player.chooseCard(true, 'h', Math.max(8, event.cardsd), '选择【' + Math.max(8, event.cardsd) + '】张手牌，然后将其余手牌置入牌堆底。');
						next.set('ai', function (card) {
							if (_status.event.goon) return -1;
							var num = _status.event.maxNum;
							if (ui.selected.cards.length >= num - 1) {
								var cards = player.getCards('he', function (cardx) {
									return cardx != card && !ui.selected.cards.contains(cardx);
								});
								var val = 0;
								for (var cardx of cards) val += get.value(cardx);
								if (val >= 14) return 0;
							}
							return get.value(card);
						});
					}
					'step 2'
					var a = player.countCards('h') - 5;
					var cards = player.getCards('h');
					cards.removeArray(result.cards);
					if (a > 0) {
						player.gflib_changeMp(a * 5, 'seh_xinzhiqiM');
						player.loseToDiscardpile(cards, ui.cardPile);
					} else {
						event.finish();
					}
					game.log(player, '将' + a + '张牌置于了牌堆底');
				},
				sub: true,
			},
			hsfx: {
				mod: {
					attackFrom: function (from, to, current) {
						var player = _status.event.player;
						if (player.gflib_getMp('seh_xinzhiqiM') >= 60) {
							return current - 4;
						}
						if (player.gflib_getMp('seh_xinzhiqiM') >= 40) {
							return current - 3;
						}
						if (player.gflib_getMp('seh_xinzhiqiM') >= 20) {
							return current - 2;
						}
					},
				},
				trigger: {
					player: ["damageBegin3", "loseHpBegin", "phaseDiscardBefore"],
				},
				filter: function (event, player) {
					return player.hasMark('seh_xinzhiqi_hsfx');
				},
				persevereSkill: true,
				forced: true,
				content: function () {
					'step 0'
					if (event.triggername == 'phaseDiscardBefore') {
						if(player.countCards("h") <= 8){
							trigger.cancel();
						}
						event.finish();
					} else {
						var a = trigger.num / 2;
						trigger.num -= a;
						if (trigger.num < 0.1) trigger.num = 0.1;
					}
					'step 1'
					if (event.triggername != 'loseHpBegin') {
						var b = trigger.num * 50;
						player.gflib_changeMp(b, 'seh_xinzhiqiM');
					}
					'step 2'
					if (player.gflib_getMp('seh_xinzhiqiM') >= 100) {
						player.removeMark('seh_xinzhiqi_hsfx', player.countMark('seh_xinzhiqi_hsfx'));
						player.addSkill('seh_xinzhiqi_hsrh');
						player.removeSkill('seh_xinzhiqi_hsfx');
						player.chooseTarget(get.prompt('seh_xinzhiqi'), "你可将一名其他角色<a class='gefu_text' onclick='javescript:window.gefu_text(\"驱逐：<br>被驱逐者将会被移除游戏，此状态解除时其流失一点体力。\")'><font color='#00FFFF'><u>驱逐</u></font></a>直到你的下个回合开始或你死亡时或你失去此技能", function (card, player, target) {
							return target != player;
						}).set('ai', function (target) {
							var player = _status.event.player;
							return get.attitude(player, target) < 0;
						});
						game.broadcastAll(function (player) {
							player.node.avatar.setBackgroundImage(`../extension/鸽府包/image/character/stand/seh_saier_hytz.jpg`);
						}, player);
					} else {
						event.finish();
					}
					"step 3";
					if (result.bool) {
						var target = result.targets[0];
						player.markAuto("seh_xinzhiqi_t", [target]);
						game.broadcastAll(function (target) {
							target.out('seh_xinzhiqi');
						}, target);
					}
				},
				sub: true,
			},
			clear: {
				trigger: {
					player: ["phaseBegin", "dieBegin"],
				},
				firstDo: true,
				persevereSkill: true,
				forced: true,
				content: function () {
					'step 0'
					if(player.storage.seh_xinzhiqi_t){
						var list = game.filterPlayer();
						for (var i = 0; i < game.players.length; i++) {
							var pl = game.players[i];
							game.broadcastAll(function (pl) {
								pl.in('seh_xinzhiqi');
							}, pl);
						}
					}
					'step 1'
					if(player.storage.seh_xinzhiqi_t){
						var list = game.filterPlayer();
							for (var i = 0; i < list.length; i++) {
								if (player.getStorage("seh_xinzhiqi_t").includes(list[i])) list[i].loseHp();
							}
						delete player.storage.seh_xinzhiqi_t;
					}
					if (event.triggername == 'dieBegin') {
						player.chooseTarget(get.prompt('seh_xinzhiqi'), "你可令一名其他角色获得三枚“辛神烙印”", function (card, player, target) {
							return target != player;
						}).set('ai', function (target) {
							var player = _status.event.player;
							return get.attitude(player, target) > 0;
						});
					} else {
						event.finish();
					}
					'step 2'
					if (result.bool) {
						var target = result.targets[0];
						target.addMark('seh_xinzhiqi_yin', 3);
						target.addSkill('seh_xinzhiqi_yin');
					}
				},
				sub: true,
			},
			yin: {
				marktext: "辛神烙印",
				intro: {
					content: "①你免疫弃牌效果并跳过弃牌阶段。<br>②你使用牌无视距离限制。<br>③每回合限一次，你使用“杀”造成伤害时，此伤害翻倍。<br>④你的回合结束时，你移除一枚“辛神烙印”。",
				},
				mod: {
					targetInRange: function (card, player) {
						return true;
					},
				},
				trigger: {
					player: ["loseBefore", "phaseDiscardBefore", "phaseEnd"],
					source: "damageBegin",
				},
				filter: function (event, player, name) {
					if (name == 'damageBegin') {
						return event.card && event.card.name == "sha" && event.notLink();
					} else {
						return true;
					}
				},
				persevereSkill: true,
				forced: true,
				content: function () {
					if (event.triggername == 'loseBefore' || event.triggername == 'phaseDiscardBefore') {
						trigger.cancel();
					}
					if (event.triggername == 'phaseEnd') {
						player.removeMark('seh_xinzhiqi_yin', 1);
					}
					if (event.triggername == 'damageBegin') {	
						trigger.num += trigger.num;
						player.addTempSkill("seh_xinzhiqi_yina");
					}
				},
				/*marktext: "辛神烙印",
				intro: {
					content: "①当你体力流失时，你可改为移除一枚“辛神烙印”<br>②当你造成伤害时，你可移除一枚“辛神烙印”令此伤害翻倍。",
				},
				trigger: {
					player: "loseHpBegin",
					source: "damageBegin",
				},
				filter: function (event, player) {
					return player.hasMark('seh_xinzhiqi_yin');
				},
				"prompt2": function (event, player, name) {
					var player = _status.event.player;
					if (name == 'loseHpBegin') {
						return '你是否移除一枚“辛神烙印”并取消本次流失的【' + event.num + '】点体力？';
					} else {
						if (event.player) {
							return '你是否移除一枚“辛神烙印”并令对【' + get.translation(event.player) + '】造成的伤害翻倍？';
						}
					}
				},
				content() {
					player.removeMark('seh_xinzhiqi_yin', 1);
					if (event.triggername == 'loseHpBegin') {
						trigger.cancel();
					} else {
						trigger.num++;
					}
				},*/
				sub: true,
			},
			yina:{
				sub: true,
			}
		},
	},
	"seh_duoyi": {
		enable: ["chooseToUse", "chooseToRespond"],
		usable: 1,
		filter(event, player) {
			return get.inpileVCardList(info => {
				const name = info[2], type = get.type(name), infox = get.info({ name: name });
				return type == "basic";
			}).some(card => event.filterCard({ name: card[2], nature: card[3], storage: { seh_duoyi: true } }, player, event));
		},
		chooseButton: {
			dialog(event, player) {
				const list = get.inpileVCardList(info => {
					const name = info[2], type = get.type(name), infox = get.info({ name: name });
					return type == "basic";
				}).filter(card => event.filterCard({ name: card[2], nature: card[3], storage: { seh_duoyi: true } }, player, event));
				const dialog = ui.create.dialog("堕翼", [list, "vcard"]);
				dialog.direct = true;
				return dialog;
			},
			backup(links, player) {
				return {
					filterCard: () => false,
					selectCard: -1,
					viewAs: {
						name: links[0][2],
						nature: links[0][3],
					},
					precontent() {
						player.damage("nosource", "nocard");
					},
				};
			},
			prompt(links, player) {
				return "视为使用一张" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]);
			},
		},
		hiddenCard(player, name) {
			if (!lib.inpile.includes(name) || name == 'wuxie') return false;
			var type = get.type(name);
			return type == "basic";
		},
		ai: {
			fireAttack: true,
			respondSha: true,
			respondShan: true,
			order: 5,
			result: {
				player(player) {
					if (_status.event.dying) return get.attitude(player, _status.event.dying);
					return 1;
				},
			},
		},
		group: "seh_duoyi_a",
		subSkill: {
			a: {
				trigger: {
					player: "recoverBegin",
					source: "damageBegin",
				},
				filter: function (event, player) {
					if (player.hasMark('seh_xinzhiqi_hsfx')) return false;
					return player.gflib_getMp('seh_xinzhiqiM') >= 25;
				},
				"prompt2": function (event, player, name) {
					var player = _status.event.player;
					if (name == 'damageBegin') {
						return '你是否消耗25%“荒神能量”令【' + event.num + '】点伤害翻倍，然后你摸一张牌(若伤害大于2改为摸2张牌）？';
					} else {
						return '你是否消耗25%“荒神能量”摸两张牌，然后你于你的下个出牌阶段开始前受到的伤害降低50%？';
					}
				},
				content() {
					player.gflib_changeMp(-25, 'seh_xinzhiqiM');
					if (event.triggername == 'damageBegin') {
						trigger.num *= 2;
						if (trigger.num > 2) {
							player.draw(2);
						} else {
							player.draw();
						}
					} else {
						player.draw(2);
						player.addTempSkill("seh_duoyi_b", { player: "phaseUseBefore" });
					}
				},
				sub: true,
				parentskill: "seh_duoyi",
				"_priority": 0,
				sourceSkill: "seh_duoyi",
			},
			b: {
				trigger: {
					player: "damageBegin3",
				},
				persevereSkill: true,
				forced: true,
				content: function () {
					var a = trigger.num / 2;
					trigger.num -= a;
					if (trigger.num < 0.1) trigger.num = 0.1;
				},
				sub: true,
			},
		},
		"_priority": 0,
	},
	"cxm_saier": {
		persevereSkill: true,
		init: function (player) {
			player.storage.cxm_saier_fx_1 = 2;
			player.storage.cxm_saier_cancel = 5;
			player.storage.cxm_saier = {
				shown: [],
				owned: {},
				cs: [],
				chsh: [],
				choshe: [],
				xcards: [],
				ycards: [],
				sxYF: [],
				canxue: [],
				canxuecun: [],
				xuanjb: [],
				dang: [],
				characterlist: ["seh_saier_ly", "seh_saier_gy", "seh_saier_hytz", "seh_saier_cszy", "seh_saier_dtzf", "seh_saier_mmr", "seh_saier_fes", "seh_saier_msdk", "seh_saier_tqdj", "seh_saier_aoly", "seh_saier_yxlz", "seh_saier_dd"],
			}
		},
		intro: {
			content: function (storage, player) {
				var str = '';
				var slist = storage.owned;
				var list = [];
				for (var i in slist) {
					list.push(i);
				}
				if (list.length) {
					str += get.translation(list[0]);
					for (var i = 1; i < list.length; i++) {
						str += '、' + get.translation(list[i]);
					}
					var skill = player.storage.cxm_saier.current2;
					if (skill) {
						str += '<p>当前技能：' + get.translation(skill);
					}
					return str;
				} else {
					return '你未拥有“精灵”';
				}
			},
			mark: function (dialog, content, player) {
				var slist = content.owned;
				var list2 = player.storage.cxm_saier.characterlist;
				var list = [];
				for (var i in slist) {
					list.push(i);
				}
				if (list2.length) {
					dialog.addSmall([list2, 'character']);
				}
				if (list.length) {
					var skill = player.storage.cxm_saier.current2;
					if (skill) {
						for (var i = 0; i < skill.length; i++) {
							dialog.add('<div><div class="skill">【' + get.translation(lib.translate[skill[i] + '_ab'] || get.translation(skill[i]).slice(0, 2)) + '】</div>' + '<div>' + get.skillInfoTranslation(skill[i], player) + '</div></div>');
						}
					}
				}
			},
		},
		"addcxm_saier": function (player) {
			if (!player.storage.cxm_saier) return;
			if (!_status.characterlist) {
				if (_status.connectMode) var list = get.charactersOL();
				else {
					var list = [];
					for (var i in lib.character) {
						if (lib.filter.characterDisabled2(i) || lib.filter.characterDisabled(i)) continue;
						list.push(i);
					}
				}
				game.countPlayer(function (current) {
					list.remove(current.name);
					list.remove(current.name1);
					list.remove(current.name2);
					if (current.storage.cxm_saier && current.storage.cxm_saier.owned) {
						for (var i in current.storage.cxm_saier.owned) list.removeArray(current.storage.cxm_saier.owned[i]);
					}
				});
				list = ["seh_saier_ly", "seh_saier_gy", "seh_saier_hytz", "seh_saier_cszy", "seh_saier_dtzf", "seh_saier_mmr", "seh_saier_fes", "seh_saier_msdk", "seh_saier_tqdj", "seh_saier_aoly", "seh_saier_yxlz", "seh_saier_dd"];
				_status.characterlist = list;
			}
			_status.characterlist = ["seh_saier_ly", "seh_saier_gy", "seh_saier_hytz", "seh_saier_cszy", "seh_saier_dtzf", "seh_saier_mmr", "seh_saier_fes", "seh_saier_msdk", "seh_saier_tqdj", "seh_saier_aoly", "seh_saier_yxlz", "seh_saier_dd"];
			_status.characterlist.randomSort();
			var bool = false;
			for (var i = 0; i < _status.characterlist.length; i++) {
				var name = _status.characterlist[i];
				if (player.storage.cxm_saier.owned[name]) continue;
				var skills = lib.character[name][3];
				for (var j = 0; j < skills.length; j++) {
					var info = lib.skill[skills[j]];
					if (info.charlotte || (info.unique && !info.gainable) || info.juexingji || info.zhuSkill || info.hiddenSkill || info.dutySkill) skills.splice(j--, 1);
				}
				player.storage.cxm_saier.owned[name] = skills;
				_status.characterlist.remove(name);
				return name;
			}
		},
		"addcxm_saiers": function (player, num) {
			var list = [];
			for (var i = 0; i < num; i++) {
				var name = lib.skill.cxm_saier.addcxm_saier(player);
				if (name) list.push(name);
			}
			if (list.length) {
				game.log(player, '获得了', get.cnNumber(list.length) + '张', '#g精灵牌')
				lib.skill.cxm_saier.drawCharacter(player, list);
			}
		},
		drawCharacter: function (player, list) {
			game.broadcastAll(function (player, list) {
				if (player.isUnderControl(true)) {
					var cards = [];
					for (var i = 0; i < list.length; i++) {
						var cardname = 'cxm_saier_card_' + list[i];
						lib.card[cardname] = {
							fullimage: true,
							image: 'character:' + list[i]
						}
						lib.translate[cardname] = get.rawName2(list[i]);
						cards.push(game.createCard(cardname, '', ''));
					}
					player.$draw(cards, 'nobroadcast');
				}
			}, player, list);
		},
		group: ["cxm_saier_1", "cxm_saier_2", "cxm_saier_3"],
		subSkill: {
			"1": {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				silentForce: true,
				filter: function (event, player) {
					return (event.name != 'phase' || game.phaseNumber == 0);
				},
				content: function () {
					var next = game.createEvent('cxm_saier');
					next.player = player;
					next._trigger = trigger;
					next.triggername = 'cxm_saier';
					next.setContent(lib.skill.cxm_saier_2.content);
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier",
				sourceSkill: "cxm_saier",
			},
			"2": {
				trigger: {
					player: ["cxm_saier", "cxm_saier_3After"],
				},
				filter: function (event, player, name) {
					return !get.is.empty(player.storage.cxm_saier.owned) && player.storage.cxm_saier.characterlist.length > 0;
				},
				forced: true,
				direct: true,
				content: function () {
					'step 0'
					if (player.hasMark('cxm_saier_huan')) {
						player.removeMark('cxm_saier_huan', player.countMark('cxm_saier_huan'));
						event.finish();
					}
					if (event.triggername == 'cxm_saier') {
						lib.skill.cxm_saier.addcxm_saiers(player, 11);
						player.syncStorage('cxm_saier');
						player.markSkill('cxm_saier');
						event.logged = true;
						var cards = player.storage.cxm_saier.characterlist;
						var next = player.chooseButton(['塞尔：请选择六张精灵牌', [cards, "character"]], 6, true);
						next.set('ai', function (button) {
							return cards.randomGet();
						});
					}
					'step 1'
					event.count3 = 0;
					if (event.triggername == 'cxm_saier') {
						var map = result.links;
						for (var i = 0; i < result.links.length; i++) {
							var name = map[i];
							var skills = lib.character[name][3];
							for (var w = 0; w < skills.length; w++) {
								var info = lib.translate[skills[w]];
								if (info && info.indexOf('聚宝') != -1) {
									player.storage.cxm_saier.xuanjb.add(w);
								}
							}
						}
						player.storage.cxm_saier.characterlist = map;
						//player.storage.cxm_saier.shown.addArray(map);
						player.syncStorage('cxm_saier');
						player.updateMarks('cxm_saier');
					}
					if (player.storage.cxm_saier.current) {
						player.storage.cxm_saier.canxuecun = player.storage.cxm_saier.canxue;
						for (var i of player.storage.cxm_saier.current) {
							var skills = lib.character[i][3];
							for (var j = 0; j < skills.length; j++) {
								var info = lib.translate[skills[j]];
								if (info && info.indexOf('雷翼') != -1) {
									var a = player.countMark('cxm_saier_ly');
									if (a > 0) {
										player.storage.cxm_saier_ly = player.hp;
										if (player.hp < 2) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
								if (info && info.indexOf('武道') != -1) {
									if (player.countMark('cxm_saier_wd') > 0) {
										player.storage.cxm_saier_wd = player.hp;
										if (player.hp < 3) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
								if (info && info.indexOf('荒契') != -1)
									if (player.countMark('cxm_saier_hq') > 0) {
										{
											player.storage.cxm_saier_hq = player.hp;
											if (player.hp < 2) {
												player.storage.cxm_saier.canxue.add(i);
											} else {
												event.count3++;
											}
										}
									}
								if (info && info.indexOf('重生') != -1) {
									if (player.countMark('cxm_saier_cs') > 0) {
										player.storage.cxm_saier_cs = player.hp;
										if (player.hp < 2) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
								if (info && info.indexOf('芳馨') != -1) {
									if (player.countMark('cxm_saier_fx_1') > 1) {
										player.removeMark('cxm_saier_fx_1', 2);
										player.addMark('cxm_saier_fx_1huifu');
									}
									if (player.countMark('cxm_saier_fx') > 0) {
										player.storage.cxm_saier_fx = player.hp;
										if (player.hp < 3) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
								if (info && info.indexOf('擎空') != -1) {
									if (player.countMark('cxm_saier_qk') > 0) {
										player.storage.cxm_saier_qk = player.hp;
										if (player.hp < 2) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
								if (info && info.indexOf('神觉') != -1) {
									if (player.countMark('cxm_saier_sj') > 0) {
										player.storage.cxm_saier_sj = player.hp;
										if (player.hp < 2) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
								if (info && info.indexOf('轮回') != -1) {
									if (player.countMark('cxm_saier_lh') > 0) {
										player.storage.cxm_saier_lh = player.hp;
										player.storage.cxm_saier_lhmaxHp = player.maxHp;
										if (player.hp < player.storage.cxm_saier_lhmaxHp) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
								if (info && info.indexOf('侍君') != -1) {
									if (player.hujia > 0) {
										player.changeHujia(-player.hujia);
										player.addMark('cxm_saier_shijhujia', player.hujia);
									}
									if (player.countMark('cxm_saier_shij') > 0) {
										player.storage.cxm_saier_shij = player.hp;
										if (player.hp < 2) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
								if (info && info.indexOf('聚宝') != -1) {
									if (player.countMark('cxm_saier_jb') > 0) {
										player.storage.cxm_saier_jb = player.hp;
										if (player.hp < 2) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
								if (info && info.indexOf('梦逝') != -1) {
									if (player.countMark('cxm_saier_ms') > 0) {
										player.storage.cxm_saier_ms = player.hp;
										if (player.hp < 2) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
								if (info && info.indexOf('帝战') != -1) {
									if (player.countMark('cxm_saier_dz') > 0) {
										player.storage.cxm_saier_dz = player.hp;
										if (player.hp < 2) {
											player.storage.cxm_saier.canxue.add(i);
										} else {
											event.count3++;
										}
									}
								}
							}
							if (event.count3 > 0) {
								player.storage.cxm_saier.canxue = [];
								for (var k of player.storage.cxm_saier.canxuecun) {
									if (k != i) player.storage.cxm_saier.canxue.add(k);
								}
								player.storage.cxm_saier.canxuecun = [];
							}
							player.storage.cxm_saier.dang = i;
							player.removeSkill(player.storage.cxm_saier.owned[i]);
							if (player.hasSkill('cxm_saier_ly')) player.removeSkill('cxm_saier_ly');
							if (player.hasSkill('cxm_saier_wd')) player.removeSkill('cxm_saier_wd');
							if (player.hasSkill('cxm_saier_hq')) player.removeSkill('cxm_saier_hq');
							if (player.hasSkill('cxm_saier_cs')) player.removeSkill('cxm_saier_cs');
							if (player.hasSkill('cxm_saier_fx')) player.removeSkill('cxm_saier_fx');
							if (player.hasSkill('cxm_saier_sj')) player.removeSkill('cxm_saier_sj');
							if (player.hasSkill('cxm_saier_qk')) player.removeSkill('cxm_saier_qk');
							if (player.hasSkill('cxm_saier_lh')) player.removeSkill('cxm_saier_lh');
							if (player.hasSkill('cxm_saier_shij')) player.removeSkill('cxm_saier_shij');
							if (player.hasSkill('cxm_saier_jb')) player.removeSkill('cxm_saier_jb');
							if (player.hasSkill('cxm_saier_ms')) player.removeSkill('cxm_saier_ms');
							if (player.hasSkill('cxm_saier_dz')) player.removeSkill('cxm_saier_dz');
							if (player.hasSkill('cxm_saier_cs_4')) player.removeSkill('cxm_saier_cs_4');
							delete player.storage.cxm_saier.owned[i];
							player.storage.cxm_saier.current2 = [];
							player.storage.cxm_saier.ycards = [];
							player.storage.cxm_saier.xcards = [];
							player.syncStorage('cxm_saier');
							player.updateMarks('cxm_saier');
						}
						if (event.triggername != 'cxm_saier') {
							player.discard(player.getCards('hej'));
						}
					}
					'step 2'
					var cards6 = player.storage.cxm_saier.choshe;
					var cards2 = player.storage.cxm_saier.current;
					var cards3 = player.storage.cxm_saier.canxue;
					if (player.storage.cxm_saier.dang == cards6) var cards5 = player.storage.cxm_saier.choshe;
					if (cards3.length > 0) {
						for (var k of player.storage.cxm_saier.characterlist) {
							if (player.storage.cxm_saier.dang.length > 0) {
								if (player.storage.cxm_saier.chsh != k && cards2 != k && cards5 != k) {
									player.storage.cxm_saier.xcards.add(k);
									for (var l of player.storage.cxm_saier.canxue) {
										if (l == k) {
											player.storage.cxm_saier.ycards.add(k);
											player.storage.cxm_saier.xcards.remove(k);
										}
									}
								}
							} else {
								if (player.storage.cxm_saier.chsh != k && cards2 != k) {
									player.storage.cxm_saier.xcards.add(k);
									for (var l of player.storage.cxm_saier.canxue) {
										if (l == k) {
											player.storage.cxm_saier.ycards.add(k);
											player.storage.cxm_saier.xcards.remove(k);
										}
									}
								}
							}
						}
					} else {
						for (var k of player.storage.cxm_saier.characterlist) {
							if (player.storage.cxm_saier.dang.length > 0) {
								if (player.storage.cxm_saier.chsh != k && cards2 != k && cards5 != k) {
									player.storage.cxm_saier.xcards.add(k);
									if (cards5 == cards2) player.storage.cxm_saier.xcards.remove(k);
								}
							} else {
								if (player.storage.cxm_saier.chsh != k && cards2 != k) {
									player.storage.cxm_saier.xcards.add(k);
								}
							}
						}
					}
					var cards1 = player.storage.cxm_saier.xcards;
					var cards4 = player.storage.cxm_saier.ycards;
					event.count = 6 - cards1.length - cards4.length;
					if (cards1.length > 0) {
						if (player.storage.cxm_saier.current) {
							if (cards4.length > 0) {
								var next = player.chooseButton([
									'塞尔：<div class="text center">请选择一只精灵并上场（未受伤）</div>',
									[cards1, 'character'],
									'<div class="text center">（已受伤）</div>',
									[cards4, 'character'],
									'当前上场精灵',
									[[cards2], 'character'],
								], true).set("filterButton", button => {
									return _status.event.canChoose1.includes(button.link) || _status.event.canChoose2.includes(button.link)
								}).set("canChoose1", cards1).set("canChoose2", cards4);
								next.set('ai', function (button) {
									return cards1.randomGet();
									return cards4.randomGet();
								});
							} else {
								var next = player.chooseButton([
									'塞尔：<div class="text center">请选择一只精灵并上场（未受伤）</div>',
									[cards1, 'character'],
									'当前上场精灵',
									[[cards2], 'character'],
								], true).set("filterButton", button => {
									return _status.event.canChoose.includes(button.link);
								}).set("canChoose", cards1);
								next.set('ai', function (button) {
									return cards1.randomGet();
								});
							}
						} else {
							var next = player.chooseButton([
								'塞尔：<div class="text center">请选择一只精灵并上场</div>',
								[cards1, 'character'],
							], true);
							next.set('ai', function (button) {
								return cards1.randomGet();
							});
						}
					} else {
						if (cards4.length > 0) {
							var next = player.chooseButton([
								'塞尔：<div class="text center">请选择一只精灵并上场（已受伤）</div>',
								[cards4, 'character'],
								'当前上场精灵',
								[[cards2], 'character'],
							], true).set("filterButton", button => {
								return _status.event.canChoose.includes(button.link);
							}).set("canChoose", cards4);
							next.set('ai', function (button) {
								return cards4.randomGet();
							});
						}
					}
					'step 3'
					player.storage.cxm_saier.dang = [];
					if (result.bool && result.links) {
						if (event.triggername != 'cxm_saier') {
							if (player.countMark('cxm_saier_shijhujia') > 0) {
								player.draw(player.countMark('cxm_saier_shijhujia'));
								player.removeMark('cxm_saier_shijhujia', player.countMark('cxm_saier_shijhujia'));
							}
							player.draw(4);
						}
						var map = result.links;
						var skillx = [];
						for (var i = 0; i < result.links.length; i++) {
							var name = map[i];
							var skills = lib.character[name][3];
							for (var j = 0; j < skills.length; j++) {
								player.addSkill(skills[j]);
								skillx.add(skills[j]);
								var info = lib.translate[skills[j]];
								if (info && info.indexOf('雷翼') != -1) {
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_ly.jpg');
									player.say(["感受圣灵与雷霆之力吧！", "魔君！你的野心不会得逞的！"].randomGet());
									player.maxHp = 2;
									if (player.countMark('cxm_saier_ly') < 1) {
										player.storage.cxm_saier_ly = 2;
									}
									var a = player.countMark('cxm_saier_ly');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '2点');
									game.log(player, '将体力变为了', '#y' + a + '点');
								}
								if (info && info.indexOf('武道') != -1) {
									player.maxHp = 3;
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_gy.jpg');
									player.say(["怎么，变帅了么?", "这只是开始！"].randomGet());
									if (player.countMark('cxm_saier_wd') < 1) {
										player.storage.cxm_saier_wd = 3;
									}
									var a = player.countMark('cxm_saier_wd');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '3点');
									game.log(player, '将体力变为了', '#y' + a + '点');
								}
								if (info && info.indexOf('荒契') != -1) {
									player.maxHp = 2;
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_hytz.jpg');
									player.say(["看起来，你不像是本宇宙的精灵...", "你说你想追求力量，也许我可以帮你...", "呵，他们只是一帮带着伪善面具的精灵..."].randomGet());
									if (player.countMark('cxm_saier_hq') < 1) {
										player.storage.cxm_saier_hq = 2;
										player.addMark('cxm_saier_hqcz', 1);
									}
									var a = player.countMark('cxm_saier_hq');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '2点');
									game.log(player, '将体力变为了', '#y' + a + '点');
								}
								if (info && info.indexOf('重生') != -1) {
									player.maxHp = 2;
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_cszy.jpg');
									player.say(["其实本意是来救人。", "我打算加入圣殿！"].randomGet());
									if (player.countMark('cxm_saier_cs') < 1) {
										player.storage.cxm_saier_cs = 2;
									}
									if (player.countMark('cxm_saier_cs_2') > 5) player.addSkill('cxm_saier_cs_4');
									var a = player.countMark('cxm_saier_cs');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '2点');
									game.log(player, '将体力变为了', '#y' + a + '点');
								}
								if (info && info.indexOf('芳馨') != -1) {
									player.maxHp = 3;
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_mmr.jpg');
									player.say(["事态的严重，似乎超过我的想象的", "他对我们的帮助，也非常之大！"].randomGet());
									if (player.countMark('cxm_saier_fx') < 1) {
										player.storage.cxm_saier_fx = 3;
									}
									var a = player.countMark('cxm_saier_fx');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '3点');
									game.log(player, '将体力变为了', '#y' + a + '点');
									if (player.hasMark('cxm_saier_fx_1')) {
										var next = game.createEvent('cxm_saier_fx_4');
										next.player = player;
										next.setContent(lib.skill.cxm_saier_fx_4.content);
									}
								}
								if (info && info.indexOf('擎空') != -1) {
									player.maxHp = 2;
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_fes.jpg');
									player.say(["黑暗只是短暂的一瞬，光明才是永恒的存在！", "速度就是力量！", "我只问一遍，海盗。我已经问过了，你没有回答上来。现在来不及后悔了！"].randomGet());
									if (player.countMark('cxm_saier_bl') < 1) {
										player.storage.cxm_saier_qk = 2;
									}
									var a = player.countMark('cxm_saier_qk');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '2点');
									game.log(player, '将体力变为了', '#y' + a + '点');
									if (player == _status.currentPhase) {
										var next = game.createEvent('cxm_saier_qk');
										next.player = player;
										next.setContent(lib.skill.cxm_saier_qk.content);
									}

								}
								if (info && info.indexOf('神觉') != -1) {
									player.maxHp = 2;
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_msdk.jpg');
									player.say(["在神的视角下，这些牺牲，这场闹剧所通往的理想究竟是什么模样?", "请等一下，让我们来谈谈吧..."].randomGet());
									if (player.countMark('cxm_saier_sj') < 1) {
										player.storage.cxm_saier_sj = 2;
									}
									var a = player.countMark('cxm_saier_sj');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '2点');
									game.log(player, '将体力变为了', '#y' + a + '点');
									if (player == _status.currentPhase) {
										player.storage.cxm_saier.current = map;
										player.storage.cxm_saier.current2 = skillx;
										player.syncStorage('cxm_saier');
										player.updateMarks('cxm_saier');
										var next = game.createEvent('cxm_saier_sj');
										next.player = player;
										next.setContent(lib.skill.cxm_saier_sj.content);
									} else {
										var next = game.createEvent('cxm_saier_sj_1');
										next.player = player;
										next.setContent(lib.skill.cxm_saier_sj_1.content);
									}
								}
								if (info && info.indexOf('轮回') != -1) {
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_tqdj.jpg');
									player.say(["也许自我的平衡就是在不断的创造与毁灭", "下面我要做的，就是惩罚那些打破平衡的家伙", "如果我倾向黑暗，那光明就要湮灭；如果我倾向光明，那黑暗就要燃烧！"].randomGet());
									if (player.countMark('cxm_saier_lh') < 1) {
										player.storage.cxm_saier_lhmaxHp = 2;
										player.storage.cxm_saier_lh = 2;
										player.addMark('cxm_saier_lhchu', 1);
										var next = game.createEvent('cxm_saier_lh');
										next.player = player;
										next.setContent(lib.skill.cxm_saier_lh.content);
									}
									var a = player.countMark('cxm_saier_lh');
									if (event.count < 1) {
										var b = 1
									} else if (event.count > 4) {
										var b = 4;
									}
									if (event.count > 0 && event.count < 5) {
										var b = event.count;
									}
									player.hp = a;
									player.maxHp = b + 1
									if (player.storage.cxm_saier_lhmaxHp != (b + 1) || player.countMark('cxm_saier_lhchu') == 1) {
										player.recover(b - a + 1);
										if (player.countMark('cxm_saier_lhchu') == 1) player.addMark('cxm_saier_lhchu', 1);
									}
									game.log(player, '将体力上限变为了', '#y' + (b + 1) + '点');
									game.log(player, '将体力变为了', '#y' + a + '点');
									game.log(player, '将恢复了', '#y' + (b - a + 1) + '点体力');
								}
								if (info && info.indexOf('侍君') != -1) {
									player.maxHp = 2;
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_aoly.jpg');
									player.say(["或许于事无补，但我奉命守护你...", "或许助力不大，但我奉命守护你...", "或许我并非最强大的，但我奉命守护你..."].randomGet());
									if (player.countMark('cxm_saier_shij') < 1) {
										player.storage.cxm_saier_shij = 2;
									}
									var a = player.countMark('cxm_saier_shij');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '2点');
									game.log(player, '将体力变为了', '#y' + a + '点');
									if (player == _status.currentPhase) {
										player.addTempSkill('cxm_saier_shij_4', { player: 'phaseDrawAfter' });
									} else {
										if (player.hujia < 5) {
											if (player.hujia < 4) {
												player.changeHujia(2);
											} else {
												player.changeHujia(1);
											}
										}
									}
								}
								if (info && info.indexOf('聚宝') != -1) {
									player.maxHp = 2;
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_yxlz.jpg');
									player.say(["吓尿了吧，孩子~！", "我们大象玩家玩的就是超标！", "别让我在巅峰看到你，不然我的九层聚你是知道的！"].randomGet());
									if (player.countMark('cxm_saier_jb') < 1) {
										player.storage.cxm_saier_jb = 2;
									}
									var a = player.countMark('cxm_saier_jb');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '2点');
									game.log(player, '将体力变为了', '#y' + a + '点');
									if (player == _status.currentPhase) {
										player.storage.cxm_saier.current = map;
										player.storage.cxm_saier.current2 = skillx;
										player.syncStorage('cxm_saier');
										player.updateMarks('cxm_saier');
										var next = game.createEvent('cxm_saier_jb');
										next.player = player;
										next.setContent(lib.skill.cxm_saier_jb.content);
									}
								}
								if (info && info.indexOf('梦逝') != -1) {
									player.maxHp = 2;
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_dd.jpg');
									player.say(["我是欢快的蒂朵~"].randomGet());
									if (player.countMark('cxm_saier_ms') < 1) {
										player.storage.cxm_saier_ms = 2;
									}
									var a = player.countMark('cxm_saier_ms');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '2点');
									game.log(player, '将体力变为了', '#y' + a + '点');
									player.addMark('cxm_saier_msxuan', 1);
								}
								if (info && info.indexOf('帝战') != -1) {
									player.maxHp = 2;
									player.node.avatar.setBackgroundImage('extension/鸽府包/image/character/stand/seh_saier_dtzf.jpg');
									player.say(["做人如习武，习武即做人！"].randomGet());
									if (player.countMark('cxm_saier_dz') < 1) {
										player.storage.cxm_saier_dz = 2;
									}
									var a = player.countMark('cxm_saier_dz');
									player.hp = a;
									game.log(player, '将体力上限变为了', '#y' + '2点');
									game.log(player, '将体力变为了', '#y' + a + '点');
									if (player.countMark('cxm_saier_dz') > 1) {
										var next = game.createEvent('cxm_saier_dz_1');
										next.player = player;
										next.setContent(lib.skill.cxm_saier_dz_1.content);
									}
								}
							}
						}
						if (event.triggername != 'cxm_saier') {
							if (player.hasMark('cxm_saier_mssha')) {
								var next = game.createEvent('cxm_saier_ms_2');
								next.player = player;
								next.setContent(lib.skill.cxm_saier_ms_2.content);
								player.removeMark('cxm_saier_mssha', player.countMark('cxm_saier_mssha'));
							}
						}
						player.storage.cxm_saier.current = map;
						player.storage.cxm_saier.current2 = skillx;
						//player.storage.cxm_saier.shown.addArray(map);
						player.syncStorage('cxm_saier');
						player.updateMarks('cxm_saier');
					}
					'step 4'
					if (!player.hasMark('cxm_saier_fxhujia') && !player.hasMark('cxm_saier_msxuan') && !player.hasMark('cxm_saier_fx_1huifu')) event.finish();
					if (player.countMark('cxm_saier_fx_1huifu') || player.countMark('cxm_saier_fxhujia')) {
						if (player.countMark('cxm_saier_fx_1huifu')) player.removeMark('cxm_saier_fx_1huifu', 1);
						player.chooseControl('恢复体力', '获得护甲', ui.create.dialog(get.prompt("cxm_saier_fx"), '是否恢复一点体力？或者获得两点护甲。', 'hidden').ai = function () {
							return 1;
						});
					}
					'step 5'
					var g = player.countMark('cxm_saier_fxhujia');
					if (result.control == '恢复体力') {
						if (g > 2) {
							player.recover(2);
						} else {
							player.recover();
						}
						if (g) player.removeMark('cxm_saier_fxhujia', g);
					}
					if (result.control == '获得护甲') {
						if (player.hujia < 5) {
							if (player.hujia < 4) {
								if (player.hujia < 3 && g > 2) {
									player.changeHujia(3);
								} else {
									player.changeHujia(2);
								}
							} else {
								player.changeHujia();
							}
						}
						if (g) player.removeMark('cxm_saier_fxhujia', g);
					}
					if (player.hasMark('cxm_saier_msxuan')) {
						player.removeMark('cxm_saier_msxuan', player.countMark('cxm_saier_msxuan'));
						player.chooseBool(get.prompt2('cxm_saier_ms'), '是否立即死亡？然后下一只上场的“精灵”封印所有其他角色的技能直到你使用【杀】结束后，然后立即视为对一名该目标使用一张不可响应的【杀】');
					}
					'step 6'
					if (result.bool) {
						player.addMark('cxm_saier_mssha', 1);
						player.die();
					}
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier",
				sourceSkill: "cxm_saier",
			},
			"3": {
				trigger: {
					player: "dieBegin",
					global: ["phaseBegin", "phaseAfter"],
				},
				forced: true,
				filter: function (event, player, name) {
					if (!player.hasSkill('cxm_saier') || player.hasMark('cxm_saier_SiWang')) return false;
					return player.storage.cxm_saier.characterlist.length > 0
				},
				content: function () {
					'step 0'
					if (event.triggername == 'phaseAfter') {
						if (!player.hasSkill('cxm_saier_jb') && player.countMark('cxm_saier_jb_1') < 9 && player.storage.cxm_saier.xuanjb.length > 0) {
							player.addMark('cxm_saier_jb_1', 1);
						}
						if (player.hasMark('cxm_saier_4')) {
							player.addMark('cxm_saier_huan', 1);
							player.draw(2);
							var next = player.phaseUse();
							event.next.remove(next);
							trigger.next.push(next);
							player.removeMark('cxm_saier_4', player.countMark('cxm_saier_4'));
							event.finish();
						}
					}
					if (event.triggername == 'dieBegin') {
						if (player.hasMark('cxm_saier_huan')) player.removeMark('cxm_saier_huan', player.countMark('cxm_saier_huan'));
						if (player.hasMark('cxm_saier_cancel')) {
							trigger.cancel();
							player.removeMark('cxm_saier_cancel', 1)
						}
						event.count = 0;
						for (var i of player.storage.cxm_saier.current) {
							player.storage.cxm_saier.cs.add(i);
							player.storage.cxm_saier.characterlist.remove(i);
							delete player.storage.cxm_saier.owned[i];
						}
						if (event.triggername != 'cxm_saier') {
							player.discard(player.getCards('hej'));
						}
						if (player.hasSkill('cxm_saier_ly')) {
							if (player.countMark('cxm_saier_csDie') == 1) event.count++;
							player.removeSkill('cxm_saier_ly');
						}
						if (player.hasSkill('cxm_saier_wd')) {
							if (player.countMark('cxm_saier_csDie') == 2) event.count++;
							player.removeSkill('cxm_saier_wd');
						}
						if (player.hasSkill('cxm_saier_hq')) {
							if (player.countMark('cxm_saier_csDie') == 3) event.count++;
							player.removeSkill('cxm_saier_hq');
						}
						if (player.hasSkill('cxm_saier_cs')) {
							if (player.countMark('cxm_saier_csDie') == 4) event.count++;
							player.removeSkill('cxm_saier_cs');
						}
						if (player.hasSkill('cxm_saier_fx')) {
							if (player.countMark('cxm_saier_csDie') == 5) event.count++;
							player.removeSkill('cxm_saier_fx');
						}
						if (player.hasSkill('cxm_saier_sj')) {
							if (player.countMark('cxm_saier_csDie') == 6) event.count++;
							player.removeSkill('cxm_saier_sj');
						}
						if (player.hasSkill('cxm_saier_qk')) {
							if (player.countMark('cxm_saier_csDie') == 7) event.count++;
							player.removeSkill('cxm_saier_qk');
						}
						if (player.hasSkill('cxm_saier_lh')) {
							if (player.countMark('cxm_saier_csDie') == 8) event.count++;
							player.removeSkill('cxm_saier_lh');
						}
						if (player.hasSkill('cxm_saier_shij')) {
							if (player.countMark('cxm_saier_csDie') == 9) event.count++;
							player.removeSkill('cxm_saier_shij');
						}
						if (player.hasSkill('cxm_saier_jb')) {
							if (player.countMark('cxm_saier_csDie') == 10) event.count++;
							player.removeSkill('cxm_saier_jb');
						}
						if (player.hasSkill('cxm_saier_ms')) {
							if (player.countMark('cxm_saier_csDie') == 11) event.count++;
							player.removeSkill('cxm_saier_ms');
						}
						if (player.hasSkill('cxm_saier_dz')) {
							if (player.countMark('cxm_saier_csDie') == 12) event.count++;
							player.removeSkill('cxm_saier_dz');
						}
						if (player.hasSkill('cxm_saier_cs_4')) player.removeSkill('cxm_saier_cs_4');
						if (event.count > 0) {
							for (var k of player.storage.cxm_saier.choshe) {
								player.storage.cxm_saier.chsh = k;
							}
						}
						player.syncStorage('cxm_saier');
						player.updateMarks('cxm_saier');
						player.addMark('cxm_saier_4', 1);
						event.finish();
					} else if (!player.hasMark('cxm_saier_huan')) {
						if (event.triggername == 'phaseBegin') {
							if (player.hasMark('cxm_saier_cancel')) {
								player.chooseBool(get.prompt2('cxm_saier'), '是否更换上场的精灵？');
							}
							player.syncStorage('cxm_saier');
							player.updateMarks('cxm_saier');
						}
					}
					'step 1'
					if (result.bool) {
						if (trigger.player == player) {
							player.addTempSkill('cxm_saier_4', { player: 'phaseDrawAfter' });
							player.skip('phaseUse');
							player.skip('phaseDiscard');
						}
					} else {
						player.addMark('cxm_saier_huan', 1);
					}
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier",
				sourceSkill: "cxm_saier",
			},
			"4": {
				trigger: {
					player: "phaseDrawBefore",
				},
				forced: true,
				content: function () {
					trigger.num--;
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier",
				sourceSkill: "cxm_saier",
			},
		},
		"_priority": 0,
	},
	"cxm_saier_ly": {
		mod: {
			maxHandcard: function (player, num) {
				return num = player.hp * 2;
			},
		},
		trigger: {
			player: ["useCard", "respond"],
		},
		frequent: true,
		content: function () {
			"step 0"
			event.count = 0;
			player.chooseTarget(get.prompt('cxm_saier_ly'), "是否选择一名其他角色并与其各弃置一张牌，其中每有一张♣️牌你对其造成1点雷电属性伤害？", function (card, player, target) {
				return target != player;
			}).set('ai', function (target) {
				var player = _status.event.player;
				return get.damageEffect(target, player, player);
			});
			"step 1"
			if (result.bool && result.targets && result.targets.length) {
				player.chooseToDiscard('he', true).set('ai', function (card) {
					return get.suit(card) == 'club';
				});
				event.target = result.targets[0];
			} else {
				event.finish();
			}
			"step 2"
			if (result.bool && result.cards && result.cards.length) {
				var card = result.cards[0];
				if (get.suit(card, player) == 'club') event.count++;
			}
			target.chooseToDiscard('he', true).set('ai', function (card) {
				return get.suit(card) != 'club';
			});
			"step 3"
			if (event.count > 0) target.damage('thunder');
			if (result.bool && result.cards && result.cards.length) {
				var card = result.cards[0];
				if (get.suit(card, target) == 'club') target.damage('thunder');
			}
		},
		"_priority": 0,
		intro: {
			content: "",
		},
	},
	"cxm_saier_wd": {
		shaRelated: true,
		trigger: {
			target: "useCardToTargeted",
		},
		frequent: true,
		filter: function (event, player) {
			return event.card.name == 'sha' && event.player.countCards('e') > 0;
		},
		content: function () {
			player.discardPlayerCard(trigger.player, 'e', get.prompt('cxm_saier_wd'), '请弃置' + get.translation(trigger.player) + '的一张装备牌', true).set('ai', function (button) {
				if (!_status.event.att) return 0;
				return 1;
			}).set('att', get.attitude(player, trigger.player) <= 0);
		},
		ai: {
			target: -1,
		},
		group: ["cxm_saier_wd_1", "cxm_saier_wd_2"],
		subSkill: {
			"1": {
				trigger: {
					player: ["damageEnd", "dyingBegin"],
					global: "dieBefore",
				},
				frequent: true,
				filter: function (event, player) {
					return event.source;
				},
				logTarget: "source",
				content: function () {
					"step 0"
					if (player.countMark('cxm_saier_wd_1')) {
						player.removeMark('cxm_saier_wd_1', player.countMark('cxm_saier_wd_1'));
						event.finish();
					} else {
						trigger.source.judge(function (card) {
							if (get.color(card) == 'black') return -2;
							return 1;
						}).judge2 = function (result) {
							return result.bool == false ? true : false;
						};
					}
					"step 1"
					if (event.triggername == 'dyingBegin') {
						player.addMark('cxm_saier_wd_1', 1);
					}
					if (event.triggername == 'dieBefore') {
						if (player.hasMark('cxm_saier_wd_1', 1)) player.removeMark('cxm_saier_wd_1', player.countMark('cxm_saier_wd_1'));
					}
					"step 2"
					trigger.source.addMark('cxm_saier_wd_2', 1);
					if (result.bool == false) {
						trigger.source.loseHp();
						event.goto(4);
					} else {
						player.discardPlayerCard(trigger.source, 'h', get.prompt('cxm_saier_wd'), '请弃置' + get.translation(trigger.player) + '的一张手牌', true).set('ai', function (button) {
							if (!_status.event.att) return 0;
							return 1;
						}).set('att', get.attitude(player, trigger.source) <= 0);
					}
					"step 3"
					if (trigger.source.countCards('h') < 1) {
						trigger.source.loseHp();
					}
					"step 4"
					trigger.source.removeMark('cxm_saier_wd_2', trigger.source.countMark('cxm_saier_wd_2'));
				},
				ai: {
					"maixie_defend": true,
					effect: {
						target: function (card, player, target) {
							if (player.hasSkillTag('jueqing', false, target)) return [1, -1];
							return 0.8;
							// if(get.tag(card,'damage')&&get.damageEffect(target,player,player)>0) return [1,0,0,-1.5];
						},
					},
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_wd",
				sourceSkill: "cxm_saier_wd",
			},
			"2": {
				trigger: {
					global: "dying",
				},
				filter: function (event, player) {
					return event.player.hasMark('cxm_saier_wd_2') && player.hp < 1;
				},
				forced: true,
				content: function () {
					player.recover(1 - player.hp);
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_wd",
				sourceSkill: "cxm_saier_wd",
			},
		},
		intro: {
			content: "",
		},
	},
	"cxm_saier_hq": {
		trigger: {
			player: "dying",
		},
		filter: function (event, player) {
			return player.hasMark('cxm_saier_hqcz');
		},
		frequent: true,
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => player.storage[skill] = false,
		content: function () {
			'step 0'
			player.removeMark('cxm_saier_hqcz', player.countMark('cxm_saier_hqcz'));
			player.recover(1 - player.hp);
			player.chooseTarget(true, get.prompt('cxm_saier_hq'), "请选择一名其他角色并令其翻面", function (card, player, target) {
				return target != player;
			}).set('ai', function (target) {
				var player = _status.event.player;
				return get.attitude(player, target) < 0;
			});
			"step 1"
			event.count = 3;
			if (result.bool && result.targets && result.targets.length) {
				result.targets[0].turnOver();
			}
			var a = player.getCards('hj').length;
			if (a > 4) { var b = a; } else { var b = 4; }
			player.discard(player.getCards('hj'));
			player.draw(b);
			player.addTempSkill('cxm_saier_hq_2');
			'step 2'
			if (event.count > 0) {
				if (event.count == 1) {
					player.addTempSkill('cxm_saier_hq_3', 'useCardAfter');
				}
				player.addTempSkill('cxm_saier_hq_1', 'useCardAfter');
				player.chooseToUse('你还可以使用【' + event.count + '】张牌');
				event.count--;
			} else {
				if (player.hasSkill('cxm_saier_hq_2')) player.removeSkill('cxm_saier_hq_2');
				if (player.hasSkill('cxm_saier_hq_3')) player.removeSkill('cxm_saier_hq_3');
				event.finish();
			}
			'step 3'
			if (result.bool) {
				event.goto(2);
			} else {
				if (player.hasSkill('cxm_saier_hq_1')) player.removeSkill('cxm_saier_hq_1');
				if (player.hasSkill('cxm_saier_hq_2')) player.removeSkill('cxm_saier_hq_2');
				if (player.hasSkill('cxm_saier_hq_3')) player.removeSkill('cxm_saier_hq_3');
			}

		},
		subSkill: {
			"1": {
				mod: {
					targetInRange: function (player, target, now) {
						return true;
					},
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_hq",
				sourceSkill: "cxm_saier_hq",
			},
			"2": {
				trigger: {
					source: "damageBegin2",
				},
				forced: true,
				content: function () {
					trigger.num++;
					player.removeSkill('cxm_saier_hq_2');
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_hq",
				sourceSkill: "cxm_saier_hq",
			},
			"3": {
				trigger: {
					player: "useCardToPlayered",
				},
				logTarget: "target",
				forced: true,
				content: function () {
					"step 0"
					player.judge(function (card) {
						if (get.color(card) == "black") {
							return 1;
						}
						return 0;
					});
					"step 1";
					switch (result.color) {
						case "black":
							trigger.directHit.add(trigger.target);
							break;

						default:
							break;
					}
				},
				sub: true,
				parentskill: "cxm_saier_hq",
				"_priority": 0,
				sourceSkill: "cxm_saier_hq",
			},
			"4": {
				mark: true,
				sub: true,
				parentskill: "cxm_saier_hq",
				"_priority": 0,
				sourceSkill: "cxm_saier_hq",
			},
		},
		"_priority": 0,
	},
	"cxm_saier_cs": {
		trigger: {
			player: "dieBefore",
		},
		forced: true,
		filter: function (event, player, name) {
			if (!player.hasSkill('cxm_saier')) return false;
			return player.storage.cxm_saier.cs.length > 0;
		},
		content: function () {
			'step 0'
			var cards = player.storage.cxm_saier.cs;
			var next = player.chooseButton([
				'塞尔：请选择一只已死亡精灵并复活',
				[cards, 'character'],
			], true);
			next.set('ai', function (button) {
				return cards.randomGet();
			});
			'step 1'
			var map = result.links;
			player.storage.cxm_saier.canxuecun = player.storage.cxm_saier.canxue;
			for (var i = 0; i < result.links.length; i++) {
				var name = map[i];
				var skills = lib.character[name][3];
				for (var j = 0; j < skills.length; j++) {
					var info = lib.translate[skills[j]];
					if (info && info.indexOf('雷翼') != -1) {
						if (player.hasMark('cxm_saier_ly')) {
							player.removeMark('cxm_saier_ly', player.countMark('cxm_saier_ly'));
						}
						player.addMark('cxm_saier_cs1', 1);
						player.addMark('cxm_saier_csDie', 1);
					}
					if (info && info.indexOf('武道') != -1) {
						if (player.hasMark('cxm_saier_wd')) {
							player.removeMark('cxm_saier_wd', player.countMark('cxm_saier_wd'));
						}
						player.addMark('cxm_saier_cs1', 2);
						player.addMark('cxm_saier_csDie', 2);
					}
					if (info && info.indexOf('荒契') != -1) {
						if (player.hasMark('cxm_saier_hq')) {
							player.removeMark('cxm_saier_hq', player.countMark('cxm_saier_hq'));
						}
						if (!player.hasMark('cxm_saier_hqcz')) {
							player.addMark('cxm_saier_hqcz', 1);
						}
						player.addMark('cxm_saier_hqcz', 1);
						player.addMark('cxm_saier_cs1', 3);
						player.addMark('cxm_saier_csDie', 3);
					}
					if (info && info.indexOf('重生') != -1) {
						if (player.hasMark('cxm_saier_cs')) {
							player.removeMark('cxm_saier_cs', player.countMark('cxm_saier_cs'));
						}
						player.addMark('cxm_saier_cs1', 4);
						player.addMark('cxm_saier_csDie', 4);
					}
					if (info && info.indexOf('芳馨') != -1) {
						if (player.hasMark('cxm_saier_fq')) {
							player.removeMark('cxm_saier_fq', player.countMark('cxm_saier_fq'));
						}
						player.addMark('cxm_saier_cs1', 5);
						player.addMark('cxm_saier_csDie', 5);
					}
					if (info && info.indexOf('擎空') != -1) {
						if (player.hasMark('cxm_saier_qk')) {
							player.removeMark('cxm_saier_qk', player.countMark('cxm_saier_qk'));
						}
						player.addMark('cxm_saier_cs1', 6);
						player.addMark('cxm_saier_csDie', 6);
					}
					if (info && info.indexOf('神觉') != -1) {
						if (player.hasMark('cxm_saier_sj')) {
							player.removeMark('cxm_saier_sj', player.countMark('cxm_saier_sj'));
						}
						player.addMark('cxm_saier_cs1', 7);
						player.addMark('cxm_saier_csDie', 7);
					}
					if (info && info.indexOf('轮回') != -1) {
						if (player.hasMark('cxm_saier_lh')) {
							player.removeMark('cxm_saier_lh', player.countMark('cxm_saier_lh'));
						}
						player.addMark('cxm_saier_cs1', 8);
						player.addMark('cxm_saier_csDie', 8);
					}
					if (info && info.indexOf('侍君') != -1) {
						if (player.hasMark('cxm_saier_shij')) {
							player.removeMark('cxm_saier_shij', player.countMark('cxm_saier_shij'));
						}
						player.addMark('cxm_saier_cs1', 9);
						player.addMark('cxm_saier_csDie', 9);
					}
					if (info && info.indexOf('聚宝') != -1) {
						if (player.hasMark('cxm_saier_jb')) {
							player.removeMark('cxm_saier_jb', player.countMark('cxm_saier_jb'));
						}
						player.addMark('cxm_saier_cs1', 10);
						player.addMark('cxm_saier_csDie', 10);
					}
					if (info && info.indexOf('梦逝') != -1) {
						if (player.hasMark('cxm_saier_ms')) {
							player.removeMark('cxm_saier_ms', player.countMark('cxm_saier_ms'));
						}
						player.addMark('cxm_saier_cs1', 11);
						player.addMark('cxm_saier_csDie', 11);
					}
					if (info && info.indexOf('帝战') != -1) {
						if (player.hasMark('cxm_saier_dz')) {
							player.removeMark('cxm_saier_dz', player.countMark('cxm_saier_dz'));
						}
						player.addMark('cxm_saier_cs1', 12);
						player.addMark('cxm_saier_csDie', 12);
					}
					player.flashAvatar('cxm_saier', name);
				}
			}
			player.addMark('cxm_saier_cancel', 1);
			player.storage.cxm_saier.canxue = [];
			for (var k of player.storage.cxm_saier.canxuecun) {
				if (k != map) player.storage.cxm_saier.canxue.add(k);
			}
			player.storage.cxm_saier.canxuecun = [];
			player.storage.cxm_saier.choshe = map;
			player.storage.cxm_saier.characterlist.add(map);
			player.syncStorage('cxm_saier');
			player.updateMarks('cxm_saier');
		},
		group: ["cxm_saier_cs_1", "cxm_saier_cs_2", "cxm_saier_cs_3"],
		subSkill: {
			"1": {
				trigger: {
					player: "useCardToPlayered",
					source: "damageBegin1",
				},
				filter: function (event, name) {
					if (name == 'damageBegin1') {
						return event.card && event.card.name == 'sha' && event.notLink();
					} else {
						return true;
					}
				},
				forced: true,
				content: function () {
					if (event.triggername == 'damageBegin1') {
						if (player.countMark('cxm_saier_cs_2') > 5) {
							trigger.num++;
						}
						var a = player.countMark('cxm_saier_cs_2');
						if (a > 3) { var b = 3; } else { var b = a; }
						if (b > 0) player.removeMark('cxm_saier_cs_2', b);
						if (player.hasSkill('cxm_saier_cs_4')) player.removeSkill('cxm_saier_cs_4');
						if (player.hujia < 1) {
							player.changeHujia();
						}
					} else {
						if (player.countMark('cxm_saier_cs_2') > 3) {
							trigger.target.addTempSkill('qinggang2');
							trigger.target.storage.qinggang2?.add(trigger.card);
						}
					}
				},
				ai: {
					target: -1,
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_cs",
				sourceSkill: "cxm_saier_cs",
			},
			"2": {
				trigger: {
					player: "useCardAfter",
				},
				marktext: "神耀",
				intro: {
					content: "你拥有#枚“神耀”标记",
				},
				mark: true,
				forced: true,
				content: function () {
					if (!player.hasSkill('cxm_saier_cs_4') && player.countMark('cxm_saier_cs_2') < 6) {
						player.addMark('cxm_saier_cs_2', 1);
					}
					if (player.countMark('cxm_saier_cs_2') > 5) {
						player.addSkill('cxm_saier_cs_4');
					}
				},
				sub: true,
				parentskill: "cxm_saier_cs",
				"_priority": 0,
				sourceSkill: "cxm_saier_cs",
			},
			"3": {
				trigger: {
					player: "loseHpBefore",
				},
				forced: true,
				content: function () {
					if (player.countMark('cxm_saier_cs_2') > 1) {
						trigger.cancel();
						player.draw();
					}
				},
				sub: true,
				parentskill: "cxm_saier_cs",
				"_priority": 0,
				sourceSkill: "cxm_saier_cs",
			},
			"4": {
				mod: {
					targetInRange: function (card, player, target) {
						if (get.name(card) == "sha") {
							return true;
						}
					},
				},
				sub: true,
				parentskill: "cxm_saier_cs",
				"_priority": 0,
				sourceSkill: "cxm_saier_cs",
			},
		},
		intro: {
			content: "",
		},
		"_priority": 0,
	},
	"cxm_saier_fx": {
		trigger: {
			player: "damageBegin",
		},
		persevereSkill: true,
		frequent: true,
		filter: function (event, player) {
			return event.num > 1;
		},
		content: function () {
			trigger.num = 1;
		},
		group: ["cxm_saier_fx_1", "cxm_saier_fx_2", "cxm_saier_fx_3"],
		subSkill: {
			"1": {
				trigger: {
					player: "dieBefore",
					global: "phaseEnd",
				},
				filter: function (event, player) {
					return player.countMark('cxm_saier_fx_1') < 4;
				},
				init: function (player) {
					player.syncStorage('cxm_saier_fx_1');
					player.updateMarks('cxm_saier_fx_1');
				},
				marktext: "灵茉",
				intro: {
					content: "你拥有#枚“灵茉”标记",
				},
				mark: true,
				frequent: true,
				content: function () {
					var a = player.countMark('cxm_saier_fx_1');
					if (event.triggername == 'phaseEnd') {
						if (_status.currentPhase == player) {
							if (!player.getStat("damage")) {
								if (a < 3) {
									if (a < 2) {
										player.addMark('cxm_saier_fx_1', 2);
									} else {
										player.addMark('cxm_saier_fx_1', 1);
									}
								}
							}
						} else {
							if (player.countMark('cxm_saier_fx_2')) {
								player.removeMark('cxm_saier_fx_2', player.countMark('cxm_saier_fx_2'));
							} else {
								if (!trigger.player.getStat("damage")) {
									if (a < 3) {
										player.addMark('cxm_saier_fx_1', 1);
									}
								}
							}
						}
					} else {
						if (a > 0) {
							player.addMark('cxm_saier_fxhujia', a);
							player.removeMark('cxm_saier_fx_1', a);
						}
					}
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_fx",
				sourceSkill: "cxm_saier_fx",
			},
			"2": {
				trigger: {
					player: "damageEnd",
				},
				persevereSkill: true,
				forced: true,
				filter: function (event, player) {
					return event.num > 0 && _status.currentPhase != player;
				},
				content: function () {
					player.addMark('cxm_saier_fx_2', 1);
				},
				sub: true,
				parentskill: "cxm_saier_fx",
				"_priority": 0,
				sourceSkill: "cxm_saier_fx",
			},
			"3": {
				enable: "phaseUse",
				filter: function (event, player) {
					return player.countMark('cxm_saier_fx_1');
				},
				prompt: "是否失去1枚“灵茉”标记，然后令一名其他角色获得1点护甲并流失1点体力？",
				logTarget: "target",
				filterTarget(card, player, target) {
					return target != player;
				},
				selectTarget: 1,
				content: function () {
					target.changeHujia();
					target.loseHp();
					player.removeMark('cxm_saier_fx_1', 1);
				},
				sub: true,
				parentskill: "cxm_saier_fx",
				"_priority": 0,
				sourceSkill: "cxm_saier_fx",
			},
			"4": {
				content: function () {
					"step 0"
					player.chooseBool(get.prompt2('cxm_saier_fx'), '是否失去1枚“灵茉”标记，然后令一名其他角色获得1点护甲并流失1点体力？');
					'step 1'
					if (result.bool) {
						player.removeMark('cxm_saier_fx_1', 1);
					} else {
						event.finish();
					}
					"step 2";
					player.chooseTarget(1, true, get.prompt('cxm_saier_fx'), '请选择一名其他角色，然后令其获得1点护甲并流失1点体力。', function (card, player, target) {
						return target != player;
					}).set('ai', function (target) {
						var player = _status.event.player;
						return get.attitude(player, target) < 0;
					});
					"step 3"
					if (result.bool && result.targets && result.targets.length) {
						result.targets[0].changeHujia();
						result.targets[0].loseHp();
					}
				},
				ai: {
					order: 5,
					result: {
						target: -2,
					},
					threaten: 1.5,
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_fx",
				sourceSkill: "cxm_saier_fx",
			},
		},
		intro: {
			content: "",
		},
		"_priority": 0,
	},
	"cxm_saier_sj": {
		content: function () {
			"step 0"
			var list = [];
			for (var i = 0; i < lib.inpile.length; i++) {
				var name = lib.inpile[i];
				var type = get.type(name);
				if (type == 'trick' || type == 'basic') {
					if (lib.filter.cardEnabled({ name: name }, player)) {
						list.push([get.translation(type), '', name]);
					}
				}
			}
			var dialog = ui.create.dialog('神觉', [list, 'vcard']);
			var taoyuan = 0, nanman = 0;
			var players = game.filterPlayer();
			for (var i = 0; i < players.length; i++) {
				var eff1 = get.effect(players[i], { name: 'taoyuan' }, player, player);
				var eff2 = get.effect(players[i], { name: 'nanman' }, player, player);
				if (eff1 > 0) {
					taoyuan++;
				}
				else if (eff1 < 0) {
					taoyuan--;
				}
				if (eff2 > 0) {
					nanman++;
				}
				else if (eff2 < 0) {
					nanman--;
				}
			}
			player.chooseButton(dialog).ai = function (button) {
				var name = button.link[2];
				if (Math.max(taoyuan, nanman) > 1) {
					if (taoyuan > nanman) return name == 'taoyuan' ? 1 : 0;
					return name == 'nanman' ? 1 : 0;
				}
				if (player.countCards('h') < player.hp && player.hp >= 2) {
					return name == 'wuzhong' ? 1 : 0;
				}
				if (player.hp < player.maxHp && player.hp < 3) {
					return name == 'tao' ? 1 : 0;
				}
				return name == 'zengbin' ? 1 : 0;
			}
			'step 1'
			if (result.bool) {
				player.chooseUseTarget(true, result.links[0][2]);
			}
		},
		ai: {
			threaten: 1.5,
		},
		group: ["cxm_saier_sj_3", "cxm_saier_sj_4"],
		subSkill: {
			"1": {
				content: function () {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						list[i].addTempSkill('cxm_saier_sj_2');
						list[i].markAuto('cxm_saier_sj_2', 'trick');
					}
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_sj",
				sourceSkill: "cxm_saier_sj",
			},
			"2": {
				charlotte: true,
				onremove: true,
				mark: true,
				marktext: "禁",
				intro: {
					markcount: () => 0,
					content: "不能使用$牌",
				},
				mod: {
					cardEnabled: function (card, player) {
						if (player.getStorage('cxm_saier_sj_2').includes(get.type2(card))) return false;
					},
					cardSavable: function (card, player) {
						if (player.getStorage('cxm_saier_sj_2').includes(get.type2(card))) return false;
					},
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_sj",
				sourceSkill: "cxm_saier_sj",
			},
			"3": {
				trigger: {
					player: "useCard",
				},
				frequent: true,
				filter(event, player) {
					return get.type(event.card) == "trick";
				},
				marktext: "蚩庸之锁",
				intro: {
					content: "你拥有#枚“蚩庸之锁”标记",
				},
				content: function () {
					"step 0"
					event.count = 0;
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].countMark('cxm_saier_sj_3')) {
							event.count += list[i].countMark('cxm_saier_sj_3');
						}
					}
					if (event.count > 2) {
						player.chooseTarget(get.prompt('cxm_saier_sj'), "你是否移动1枚“蚩庸之锁”标记？", function (card, player, target) {
							return target != player && target.hasMark("cxm_saier_sj_3");
						}).set('ai', function (target) {
							var player = _status.event.player;
							return get.attitude(player, target) < 0;
						});
					} else {
						player.chooseTarget(get.prompt('cxm_saier_sj'), "你是否选择一名其他角色并令其获得1枚“蚩庸之锁”标记？", function (card, player, target) {
							return target != player;
						}).set('ai', function (target) {
							var player = _status.event.player;
							return get.attitude(player, target) < 0;
						});
					}
					"step 1"
					if (result.bool && result.targets && result.targets.length) {
						if (event.count < 3) {
							result.targets[0].addMark('cxm_saier_sj_3', 1);
							event.finish();
						} else {
							result.targets[0].removeMark('cxm_saier_sj_3', 1);
						}
					} else {
						event.finish();
					}
					"step 2"
					player.chooseTarget(true, get.prompt('cxm_saier_sj'), "请选择一名其他角色并令其获得1枚“蚩庸之锁”标记？", function (card, player, target) {
						return target != player;
					}).set('ai', function (target) {
						var player = _status.event.player;
						return get.attitude(player, target) < 0;
					});
					"step 3"
					result.targets[0].addMark('cxm_saier_sj_3', 1);
				},
				ai: {
					threaten: 1.4,
					noautowuxie: true,
				},
				sub: true,
				parentskill: "cxm_saier_sj",
				"_priority": 0,
				sourceSkill: "cxm_saier_sj",
			},
			"4": {
				trigger: {
					global: "useCard",
				},
				frequent: true,
				filter(event, player) {
					return event.player.countMark('cxm_saier_sj_3') && event.player != player;
				},
				content: function () {
					"step 0"
					if (get.type(trigger.card) == "trick" || get.type(trigger.card) == "delay") {
						trigger.player.removeMark('cxm_saier_sj_3', 1);
						trigger.targets.length = 0;
						trigger.all_excluded = true;
						game.log(trigger.card, '被无效了');
						event.finish();
					} else {
						if (trigger.player.countMark('cxm_saier_sj_3') < 3) {
							trigger.player.judge(function (card) {
								if (get.color(card) == 'black') return -1;
								return 1;
							}).judge2 = function (result) {
								return result.bool == false ? true : false;
							};
						} else {
							trigger.targets.length = 0;
							trigger.all_excluded = true;
							game.log(trigger.card, '被无效了');
							trigger.player.removeMark('cxm_saier_sj_3', 1);
							event.finish();
						}

					}
					"step 1"
					if (result.bool == false) {
						trigger.targets.length = 0;
						trigger.all_excluded = true;
						game.log(trigger.card, '被无效了');
						trigger.player.removeMark('cxm_saier_sj_3', 1);
					}
				},
				ai: {
					threaten: 1.4,
					noautowuxie: true,
				},
				sub: true,
				parentskill: "cxm_saier_sj",
				"_priority": 0,
				sourceSkill: "cxm_saier_sj",
			},
		},
		intro: {
			content: "",
		},
		"_priority": 0,
	},
	"cxm_saier_yf": {
		trigger: {
			source: "damageBegin2",
		},
		frequent: true,
		content: function () {
			trigger.player.loseHp();
			player.storage.cxm_saier.sxYF = 0;
			player.syncStorage('cxm_saier');
			player.markSkill('cxm_saier');
			player.removeSkill('cxm_saier_yf');
		},
		intro: {
			content: "",
		},
		"_priority": 0,
	},
	"cxm_saier_jb": {
		content: function () {
			'step 0'
			if (player.countMark('cxm_saier_jb_1') > 2) {
				player.addTempSkill('cxm_saier_jb_2', 'shaAfter');
				if (player.countMark('cxm_saier_jb_1') > 5) {
					player.addTempSkill('cxm_saier_jb_1', 'shaAfter');
				}
			}
			if (player.countCards('he')) {
				player.chooseCardTarget({
					prompt: get.prompt('cxm_saier_jb') + '你可选择一名角色然后将一张牌当【杀】对其使用',
					filterCard: lib.filter.cardDiscardable,
					position: 'he',
					filterTarget: function (card, player, target) {
						return player != target;
					},
					ai1: function (card) {
						return 8 - get.value(card);
					},
					ai2: function (target) {
						return 6 - target.hp;
					}
				});
			}
			"step 1"
			if (result.bool) {
				if (player.canUse(get.autoViewAs({ name: 'sha' }, [ui.cardPile.firstChild]), result.targets[0], false)) {
					player.useCard({ name: 'sha' }, result.targets[0], result.cards);
				}
			}
			if (player.hasSkill('cxm_saier_jb_1')) player.removeSkill('cxm_saier_jb_1');
			if (player.hasSkill('cxm_saier_jb_2')) player.removeSkill('cxm_saier_jb_2');
		},
		group: "cxm_saier_jb_3",
		subSkill: {
			"1": {
				marktext: "聚",
				intro: {
					content: "mark",
				},
				trigger: {
					source: "damageBegin2",
				},
				filter: function (event, player) {
					return event.num > 0 && player.countMark('cxm_saier_jb_1') > 2;
				},
				frequent: true,
				content: function () {
					trigger.num++;
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_jb",
				sourceSkill: "cxm_saier_jb",
			},
			"2": {
				mod: {
					targetInRange: function (card, player, target, now) {
						if (card.name == 'sha') return true;
					},
				},
				trigger: {
					player: "useCardToPlayered",
				},
				frequent: true,
				filter: function (event, player) {
					return event.target && player.countMark('cxm_saier_jb_1') > 5;
				},
				logTarget: "target",
				content: function () {
					trigger.directHit.add(trigger.target);
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_jb",
				sourceSkill: "cxm_saier_jb",
			},
			"3": {
				trigger: {
					source: "damageEnd",
				},
				forced: true,
				filter(event, player) {
					return player.countMark('cxm_saier_jb_1') > 0 && event.card.name == "sha";
				},
				content: function () {
					var a = player.countMark('cxm_saier_jb_1');
					if (a < 3) { var b = a; } else { var b = 3; }
					player.removeMark('cxm_saier_jb_1', b);
				},
				sub: true,
				parentskill: "cxm_saier_jb",
				"_priority": 0,
				sourceSkill: "cxm_saier_jb",
			},
		},
		intro: {
			content: "",
		},
		"_priority": 0,
	},
	"cxm_saier_ms": {
		enable: "phaseUse",
		content: function () {
			player.addMark('cxm_saier_mssha', 1);
			player.die();
		},
		group: "cxm_saier_ms_3",
		subSkill: {
			"1": {
				trigger: {
					player: "useCardToPlayered",
				},
				enable: "phaseUse",
				frequent: true,
				filter: function (event, card, player) {
					return event.card.name == 'sha' && event.target;
				},
				logTarget: "target",
				content: function () {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						var a = list[i].countMark('cxm_saier_sx_1');
						if (a) {
							list[i].removeMark('cxm_saier_sx_1', a);
							event.count += a;
						}
					}
					trigger.directHit.add(trigger.target);
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_ms",
				sourceSkill: "cxm_saier_ms",
			},
			"2": {
				content: function () {
					'step 0'
					player.addTempSkill('cxm_saier_ms_1', 'shaAfter');
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i] != player) {
							list[i].addTempSkill('baiban');
						}
					}
					'step 1'
					player.chooseUseTarget(true, get.prompt('cxm_saier_ms'), { name: 'sha' }, '请选择任意一名其他角色并封印所有其他角色的技能直到你使用【杀】结束后，然后立即视为对一名该目标使用一张不可响应的【杀】', false);
					'step 2'
					if (player.hasSkill('cxm_saier_ms_1')) player.removeSkill('cxm_saier_ms_1');
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						if (list[i].hasSkill('baiban')) {
							list[i].removeSkill('baiban');
						}
					}
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_ms",
				sourceSkill: "cxm_saier_ms",
			},
			"3": {
				trigger: {
					player: "loseAfter",
					global: "loseAsyncAfter",
				},
				frequent: true,
				filter: function (event, player) {
					if (event.type != 'discard') return false;
					var evt = event.getl(player);
					return evt.cards2.filterInD('d').length > 0;
				},
				content: function () {
					if (player.hujia < 1) {
						player.changeHujia();
					}
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_ms",
				sourceSkill: "cxm_saier_ms",
			},
		},
		intro: {
			content: "",
		},
		"_priority": 0,
	},
	"cxm_saier_dz": {
		persevereSkill: true,
		forced: true,
		trigger: {
			player: "dieBefore",
		},
		content: function () {
			var target = _status.currentPhase;
			if (_status.currentPhase && _status.currentPhase.isAlive()) {
				if (target.countCards('e')) target.discard(target.getCards('e'));
				if (target.countCards('h')) target.chooseToDiscard(2, true);
				var evt = _status.event;
				for (var i = 0; i < 10; i++) {
					if (evt && evt.getParent) evt = evt.getParent();
					if (evt.name == 'phaseUse') {
						evt.skipped = true;
						break;
					};
				};
			}
		},
		ai: {
			threaten: function (player, target) {
				if (target.hp == 1) return 0.2;
				return 1.5;
			},
			effect: {
				target: function (card, player, target, current) {
					if (!target.hasFriend()) return;
					if (target.hp <= 1 && get.tag(card, 'damage')) return [1, 0, -1, -2.5];
				},
			},
		},
		group: "cxm_saier_dz_1",
		subSkill: {
			"1": {
				content: function () {
					"step 0"
					player.chooseBool(get.prompt2('cxm_saier_dz'), '是否流失一点体力，然后选择至多两名角色并依次弃置目标x张牌(x为3减你选择的角色数)？');
					'step 1'
					if (result.bool) {
						player.loseHp();
					} else {
						event.finish();
					}
					"step 2";
					player.chooseTarget([1, 2], true, get.prompt('cxm_saier_dz'), '请选择至多两名角色并依次弃置目标x张牌(x为3减你选择的角色数)。', function (card, player, target) {
						return target.countCards('he') > 0;
					}).set('ai', function (target) {
						var player = _status.event.player;
						return get.attitude(player, target) < 0;
					});
					"step 3"
					if (result.bool && result.targets && result.targets.length) {
						event.count = result.targets.length;
						event.targets = result.targets;
					} else {
						event.finish();
					}
					"step 4"
					if (event.count > 0) {
						player.discardPlayerCard(3 - event.count, event.targets[0], true, 'he');
						event.count--;
					}
					"step 5"
					if (event.count > 0) {
						player.discardPlayerCard(2 - event.count, event.targets[1], true, 'he');
					}
				},
				ai: {
					order: 5,
					result: {
						target: -2,
					},
					threaten: 1.5,
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_dz",
				sourceSkill: "cxm_saier_dz",
			},
		},
		intro: {
			content: "",
		},
		"_priority": 0,
	},
	"cxm_saier_hl": {
		trigger: {
			player: ["loseHpBefore", "damageBefore"],
		},
		forced: true,
		filter: function (event, player) {
			return !player.hasMark('cxm_saier_bl_hong');
		},
		content: function () {
			trigger.cancel();
			player.draw();
			player.addMark('cxm_saier_bl_hong', 1);
			player.removeSkill('cxm_saier_bl_hong');
		},
		"_priority": 0,
		intro: {
			content: "",
		},
	},
	"cxm_saier_hll": {
		trigger: {
			player: "phaseBegin",
		},
		filter: function (event, player) {
			return player.countCards('j') && !player.hasMark('cxm_saier_bl_huang');
		},
		forced: true,
		content: function () {
			player.moveCard(true, player.getCards('j')).set('noequip', true);
			player.addMark('cxm_saier_bl_huang', 1);
			player.removeSkill('cxm_saier_bl_huang');
		},
		"_priority": 0,
		intro: {
			content: "",
		},
	},
	"cxm_saier_ll": {
		trigger: {
			player: ["loseBefore", "loseAsyncBefore"],
		},
		forced: true,
		filter: function (event, player) {
			if (event.type != 'discard' || event.getlx === false) return false;
			return !player.hasMark('cxm_saier_bl_lan');
		},
		content: function () {
			"step 0"
			event.count = 0;
			trigger.cancel();
			player.addMark('cxm_saier_bl_lan', 1);
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (list[i] != player && list[i].countCards('he')) {
					event.count++;
				}
			}
			if (event.count > 0) {
				player.chooseTarget(true, get.prompt('cxm_saier_ll'), "请选择一名其他角色并弃置其一张牌", function (card, player, target) {
					return target != player && target.countCards('he');
				}).set('ai', function (target) {
					var player = _status.event.player;
					return get.attitude(player, target) < 0;
				});
			} else {
				player.removeSkill('cxm_saier_bl_lan');
				event.finish();
			}
			"step 1"
			if (result.bool && result.targets && result.targets.length) {
				player.discardPlayerCard(result.targets[0], get.prompt('cxm_saier_ll', result.targets[0]), true).set('ai', function (button) {
					if (!_status.event.att) return 0;
					return 1;
				}).set('att', get.attitude(player, trigger.target) <= 0);
			}
			player.removeSkill('cxm_saier_bl_lan');
		},
		"_priority": 0,
		intro: {
			content: "",
		},
	},
	"cxm_saier_lh": {
		content: function () {
			event.count = 0;
			player.storage.cxm_saier.canxuecun = player.storage.cxm_saier.canxue;
			for (var i of player.storage.cxm_saier.canxue) {
				var skills = lib.character[i][3];
				for (var j = 0; j < skills.length; j++) {
					var info = lib.translate[skills[j]];
					if (info && info.indexOf('雷翼') != -1) {
						if (player.countMark('cxm_saier_ly') == 1) {
							player.storage.cxm_saier_ly = 2;
							event.count++;
						}
					}
					if (info && info.indexOf('武道') != -1) {
						if (player.countMark('cxm_saier_wd') > 0) {
							player.addMark('cxm_saier_wd', 1);
							if (player.countMark('cxm_saier_wd') == 3) {
								event.count++;
							}
						}
					}
					if (info && info.indexOf('荒契') != -1) {
						if (player.countMark('cxm_saier_hq') == 1) {
							player.storage.cxm_saier_hq = 2;
							event.count++;
						}
					}
					if (info && info.indexOf('重生') != -1) {
						if (player.countMark('cxm_saier_cs') == 1) {
							player.storage.cxm_saier_cs = 2;
							event.count++;
						}
					}
					if (info && info.indexOf('芳馨') != -1) {
						if (player.countMark('cxm_saier_fx') > 0) {
							player.addMark('cxm_saier_fx', 1);
							if (player.countMark('cxm_saier_fx') == 3) {
								event.count++;
							}
						}
					}
					if (info && info.indexOf('擎空') != -1) {
						if (player.countMark('cxm_saier_qk') == 1) {
							player.storage.cxm_saier_qk = 2;
							event.count++;
						}
					}
					if (info && info.indexOf('神觉') != -1) {
						if (player.countMark('cxm_saier_sj') == 1) {
							player.storage.cxm_saier_sj = 2;
							event.count++;
						}
					}
					if (info && info.indexOf('侍君') != -1) {
						if (player.countMark('cxm_saier_shij') == 1) {
							player.storage.cxm_saier_shij = 2;
							event.count++;
						}
					}
					if (info && info.indexOf('聚宝') != -1) {
						if (player.countMark('cxm_saier_jb') == 1) {
							player.storage.cxm_saier_jb = 2;
							event.count++;
						}
					}
					if (info && info.indexOf('梦逝') != -1) {
						if (player.countMark('cxm_saier_ms') == 1) {
							player.storage.cxm_saier_ms = 2;
							event.count++;
						}
					}
					if (info && info.indexOf('帝战') != -1) {
						if (player.countMark('cxm_saier_dz') == 1) {
							player.storage.cxm_saier_dz = 2;
							event.count++;
						}
					}
					if (event.count > 0) {
						player.storage.cxm_saier.canxue = [];
						for (var k of player.storage.cxm_saier.canxuecun) {
							if (k != i) player.storage.cxm_saier.canxue.add(k);
						}
						player.storage.cxm_saier.canxuecun = [];
					}
					player.syncStorage('cxm_saier');
					player.updateMarks('cxm_saier');
				}
			}
		},
		group: ["cxm_saier_lh_1", "cxm_saier_lh_2", "cxm_saier_lh_3"],
		subSkill: {
			"1": {
				trigger: {
					source: "damageEnd",
				},
				filter: function (event, player) {
					return event.card && event.card.name == 'sha';
				},
				frequent: true,
				content: function () {
					'step 0'
					var cards2 = player.storage.cxm_saier.current;
					if (player.storage.cxm_saier.canxue) {
						player.storage.cxm_saier.canxuecun = player.storage.cxm_saier.canxue;
						player.storage.cxm_saier.ycards = [];
						for (var k of player.storage.cxm_saier.canxuecun) {
							if (k != cards2) {
								player.storage.cxm_saier.ycards.add(k);
							}
						}
						var cards = player.storage.cxm_saier.ycards;
						if (player.storage.cxm_saier.ycards.length > 0 && player.countMark('cxm_saier_cancel') > 0) {
							var next = player.chooseButton([
								'塞尔：请选择一只场下已受伤“精灵”并令其恢复一点体力',
								[cards, 'character'],
							], true);
							next.set('ai', function (button) {
								return cards.randomGet();
							});
						} else {
							if (player.countMark('cxm_saier_cancel') < 1) {
								player.draw();
								player.recover();
							}
							event.finish();
						}
					} else {
						if (player.countMark('cxm_saier_cancel') < 1) {
							player.draw();
							player.recover();
						}
						event.finish();
					}
					'step 1'
					var map = result.links;
					player.storage.cxm_saier.canxuecun = player.storage.cxm_saier.canxue;
					event.count2 = 0;
					for (var i = 0; i < result.links.length; i++) {
						var name = map[i];
						var skills = lib.character[name][3];
						for (var j = 0; j < skills.length; j++) {
							var info = lib.translate[skills[j]];
							if (info && info.indexOf('雷翼') != -1) {
								if (player.countMark('cxm_saier_ly') == 1) {
									player.storage.cxm_saier_ly = 2;
									event.count2++;
								}
							}
							if (info && info.indexOf('武道') != -1) {
								if (player.countMark('cxm_saier_wd') > 0) {
									player.addMark('cxm_saier_wd', 1);
									if (player.countMark('cxm_saier_wd') == 3) {
										event.count2++;
									}
								}
							}
							if (info && info.indexOf('荒契') != -1) {
								if (player.countMark('cxm_saier_hq') == 1) {
									player.storage.cxm_saier_hq = 2;
									event.count2++;
								}
							}
							if (info && info.indexOf('重生') != -1) {
								if (player.countMark('cxm_saier_cs') == 1) {
									player.storage.cxm_saier_cs = 2;
									event.count2++;
								}
							}
							if (info && info.indexOf('芳馨') != -1) {
								if (player.countMark('cxm_saier_fx') > 0) {
									player.addMark('cxm_saier_fx', 1);
									if (player.countMark('cxm_saier_fx') == 3) {
										event.count2++;
									}
								}
							}
							if (info && info.indexOf('白鳞') != -1) {
								if (player.countMark('cxm_saier_bl') == 1) {
									player.storage.cxm_saier_bl = 2;
									event.count2++;
								}
							}
							if (info && info.indexOf('神觉') != -1) {
								if (player.countMark('cxm_saier_sj') == 1) {
									player.storage.cxm_saier_sj = 2;
									event.count2++;
								}
							}
							if (info && info.indexOf('侍君') != -1) {
								if (player.countMark('cxm_saier_shij') == 1) {
									player.storage.cxm_saier_shij = 2;
									event.count2++;
								}
							}
							if (info && info.indexOf('聚宝') != -1) {
								if (player.countMark('cxm_saier_jb') == 1) {
									player.storage.cxm_saier_jb = 2;
									event.count2++;
								}
							}
							if (info && info.indexOf('梦逝') != -1) {
								if (player.countMark('cxm_saier_ms') == 1) {
									player.storage.cxm_saier_ms = 2;
									event.count2++;
								}
							}
							if (info && info.indexOf('帝战') != -1) {
								if (player.countMark('cxm_saier_dz') == 1) {
									player.storage.cxm_saier_dz = 2;
									event.count2++;
								}
							}
							player.flashAvatar('cxm_saier', name);
						}
					}
					if (event.count2 > 0) {
						player.storage.cxm_saier.ycards = [];
						player.storage.cxm_saier.canxue = [];
						for (var k of player.storage.cxm_saier.canxuecun) {
							if (k != map) {
								player.storage.cxm_saier.canxue.add(k);
								player.storage.cxm_saier.ycards.add(k);
							}
						}
					}
					player.storage.cxm_saier.canxuecun = [];
					player.syncStorage('cxm_saier');
					player.updateMarks('cxm_saier');
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_lh",
				sourceSkill: "cxm_saier_lh",
			},
			"2": {
				trigger: {
					player: "useCardAfter",
				},
				filter(event, player) {
					return (
						event.card.name == "sha" &&
						!event.player.hasHistory("sourceDamage", function (evt) {
							return evt.card == event.card;
						})
					);
				},
				logTarget: "player",
				frequent: true,
				content: function () {
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						var a = list[i].countMark('cxm_saier_lh_3');
						if (a) {
							player.discardPlayerCard(1, list[i], true, 'he');
						}
					}
					if (player.countMark('cxm_saier_cancel') < 1) {
						player.getStat().card.sha--;
					}
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_lh",
				sourceSkill: "cxm_saier_lh",
			},
			"3": {
				trigger: {
					player: "useCardToPlayered",
				},
				silentForce: true,
				filter: function (event, player, card) {
					return event.card.name == 'sha' && event.target;
				},
				logTarget: "target",
				content: function () {
					'step 0'
					var list = game.filterPlayer();
					for (var i = 0; i < list.length; i++) {
						var a = list[i].countMark('cxm_saier_lh_3');
						if (a) {
							list[i].removeMark('cxm_saier_lh_3', a);
						}
					}
					'step 1'
					trigger.target.addMark('cxm_saier_lh_3');
				},
				sub: true,
				parentskill: "cxm_saier_lh",
				sourceSkill: "cxm_saier_lh",
				"_priority": 0,
			},
		},
		intro: {
			content: "",
		},
		"_priority": 0,
	},
	"cxm_saier_qk": {
		trigger: {
			player: "phaseBegin",
		},
		frequent: true,
		content: function () {
			'step 0'
			player.addTempSkill('cxm_saier_qk_1', 'shaAfter');
			player.chooseUseTarget(true, get.prompt('cxm_saier_qk_1'), { name: 'sha' }, '你视为使用一张【杀】此【杀】无距离限制且造成伤害后你需弃置一张牌。', false);
			'step 1'
			if (player.hasSkill('cxm_saier_qk_1')) player.removeSkill('cxm_saier_qk_1');
		},
		group: ["cxm_saier_qk_2", "cxm_saier_qk_add"],
		subSkill: {
			"1": {
				mod: {
					targetInRange: function (card, player, target, now) {
						if (card.name == 'sha') return true;
					},
				},
				trigger: {
					source: "damageEnd",
				},
				filter: function (event, player) {
					return event.num > 0;
				},
				forced: true,
				content: function () {
					player.chooseToDiscard(1, true);
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_qk",
				sourceSkill: "cxm_saier_qk",
			},
			"2": {
				trigger: {
					player: "useCardToPlayered",
				},
				frequent: true,
				filter: function (event, player, card) {
					return event.card.name == 'sha' && event.target && player.canCompare(event.target, true);
				},
				logTarget: "target",
				content: function () {
					"step 0";
					if (Math.floor((5 - player.countMark('cxm_saier_cancel')) / 2) > 0) {
						trigger.target.addMark('cxm_saier_qk_remove', 1);
					}
					if (player.canCompare(trigger.target)) {
						player.chooseToCompare(trigger.target);
					} else {
						event.finish();
					}
					"step 1";
					if (result.bool) {
						player.countMark('cxm_saier_qk_remove')
						player.addTempSkill('cxm_saier_qk_3', 'phaseAfter');
						player.skip('phaseDiscard');
						player.removeMark('cxm_saier_4', player.countMark('cxm_saier_4'));
						event.finish();
						trigger.target.addTempSkill('cxm_saier_qk_ban');
					} else {
						trigger.target.chooseToDiscard("he", "是否弃置一张牌，视为对" + get.translation(player) + "使用一张【杀】？").set("ai", function (card) {
							if (_status.event.goon) {
								return 8 - get.value(card);
							}
							return 1;
						});
					}
					trigger.target.removeMark('cxm_saier_qk_remove', trigger.target.countMark('cxm_saier_qk_remove'));
					"step 2";
					if (result.bool) {
						if (trigger.target.canUse("sha", player, false)) {
							trigger.target.useCard({ name: "sha", isCard: true }, player, false);
							player.addTempSkill('cxm_saier_qk_4');
						} else {
							event.finish();
						}
					} else {
						event.finish();
					}
					"step 3"
					if (player.countMark('cxm_saier_qk_4')) {
						player.removeMark('cxm_saier_qk_4', player.countMark('cxm_saier_qk_4'));
						trigger.targets.remove(trigger.target);
						trigger.getParent().triggeredTargets2.remove(trigger.target);
						trigger.untrigger();
					}
					if (player.hasSkill('cxm_saier_qk_4')) player.removeSkill('cxm_saier_qk_4');
				},
				ai: {
					order: 9,
					result: {
						target(player, target) {
							if (
								player.countCards("hs", function (card) {
									return get.tag(card, "damage") > 0 && player.canUse(card, target, null, true) && get.effect(target, card, player, player) > 0 && player.hasValueTarget(card, null, true);
								}) > 0
							) {
								return -3;
							}
							return -1;
						},
					},
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_qk",
				sourceSkill: "cxm_saier_qk",
			},
			"3": {
				trigger: {
					global: ["phaseEnd", "useCardAfter"],
				},
				forced: true,
				content: function () {
					if (event.triggername == 'phaseEnd') {
						player.draw();
						player.addMark('cxm_saier_huan', 1);
						var next = player.phaseUse();
						event.next.remove(next);
						trigger.next.push(next);
					} else {
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							if (list[i].hasSkill('cxm_saier_qk_ban')) {
								list[i].removeSkill('cxm_saier_qk_ban');
							}
						}
					}
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_qk",
				sourceSkill: "cxm_saier_qk",
			},
			"4": {
				trigger: {
					player: "dyingBegin",
				},
				forced: true,
				content: function () {
					player.addMark('cxm_saier_qk_4', 1);
				},
				sub: true,
				parentskill: "cxm_saier_qk",
				"_priority": 0,
				sourceSkill: "cxm_saier_qk",
			},
			add: {
				trigger: {
					player: "compare",
				},
				silentForce: true,
				filter(event, player) {
					return event.getParent().name == "cxm_saier_qk_2" && event.num1 < 13 && player.countMark('cxm_saier_cancel') < 5;
				},
				content() {
					var num = 5 - player.countMark('cxm_saier_cancel');
					game.log(player, "的拼点牌点数+", num);
					trigger.num1 = Math.min(13, trigger.num1 + num);
					if (Math.floor((5 - player.countMark('cxm_saier_cancel')) / 2) > 0) {
						var list = game.filterPlayer();
						for (var i = 0; i < list.length; i++) {
							var a = Math.floor((5 - player.countMark('cxm_saier_cancel')) / 2);
							if (list[i].hasMark('cxm_saier_qk_remove')) {
								game.log(list[i], "的拼点牌点数-", a);
							}
						}
						trigger.num2 = Math.max(1, trigger.num2 - a);
					}
				},
				sub: true,
				parentskill: "cxm_saier_qk",
				"_priority": 0,
				sourceSkill: "cxm_saier_qk",
			},
			ban: {
				mod: {
					cardEnabled(card, player) {
						return false;
					},
					cardUsable(card, player) {
						return false;
					},
					cardSavable(card, player) {
						return false;
					},
				},
				sub: true,
				parentskill: "cxm_saier_qk",
				"_priority": 0,
				sourceSkill: "cxm_saier_qk",
			},
		},
		intro: {
			content: "",
		},
	},
	"cxm_saier_shij": {
		group: ["cxm_saier_shij_1", "cxm_saier_shij_3"],
		subSkill: {
			"1": {
				trigger: {
					player: "useCardToPlayered",
				},
				filter(event, player) {
					return event.card.name == "sha";
				},
				frequent: true,
				logTarget: "target",
				content: function () {
					player.addTempSkill('cxm_saier_shij_2', 'shaAfter');
					if (player.countCards('h') <= trigger.target.countCards('h')) {
						player.discardPlayerCard(1, trigger.target, true, 'he');
					}
					if (player.countCards('e') <= trigger.target.countCards('e')) {
						player.discardPlayerCard(1, trigger.target, true, 'he');
					}
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_shij",
				sourceSkill: "cxm_saier_shij",
			},
			"2": {
				trigger: {
					source: "damageBegin2",
				},
				filter: function (event, player) {
					return event.num > 0;
				},
				forced: true,
				content: function () {
					if (player.hp <= trigger.player.hp) {
						trigger.num++;
					}
					player.addMark('cxm_saier_shij_2shang', 1);
				},
				sub: true,
				"_priority": 0,
				parentskill: "cxm_saier_shij",
				sourceSkill: "cxm_saier_shij",
			},
			"3": {
				trigger: {
					source: "shaAfter",
				},
				silentForce: true,
				content: function () {
					if (player.hasMark('cxm_saier_shij_2shang')) {
						player.removeMark('cxm_saier_shij_2shang', player.countMark('cxm_saier_shij_2shang'));

					} else {
						if (player.hujia < 5) {
							if (player.hujia < 4) {
								player.changeHujia(2);
							} else {
								player.changeHujia();
							}
						}
					}
				},
				sub: true,
				parentskill: "cxm_saier_shij",
				"_priority": 0,
				sourceSkill: "cxm_saier_shij",
			},
			"4": {
				trigger: {
					player: "phaseDrawEnd",
				},
				frequent: true,
				content: function () {
					player.draw(2);
					player.addMark('cxm_saier_huan', 1);
					player.removeSkill('cxm_saier_shij_4');
					var next = player.phaseUse();
					event.next.remove(next);
					trigger.next.push(next);
				},
				sub: true,
				parentskill: "cxm_saier_shij",
				"_priority": 0,
				sourceSkill: "cxm_saier_shij",
			},
		},
		intro: {
			content: "",
		},
		"_priority": 0,
	},
};
export const skill=block;
