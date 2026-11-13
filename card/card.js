import { lib, game, ui, get, ai, _status } from '../../../noname.js';

export const card = {
	translate: {
		//卡牌翻译
		"wzzs_ys": "义手",
		"wzzs_ys_skill": "义手",
		"wzzs_ys_info": "出牌阶段限一次，你可重铸一张【杀】，然后刷新除此技能外的技能使用次数。",
		"wzzs_mdk": "魔导铠",
		"wzzs_mdk_skill": "魔导铠",
		"wzzs_mdk_info": "攻击距离为全场角色数，①你受到有花色牌造成的伤害前，可重铸一张与此牌花色相同的牌并令此伤害减1。②你使用【杀】时，你可弃置手牌所有【杀】，然后令此【杀】结算等量次且在本次结算前取消对方获得的牌。③你每累计受到两次伤害，恢复一点体力。④当此牌被弃置前，你可失去2点魔力并取消之。",
		"wzzs_zzyzmdj": "诅咒抑制魔导具",
		"wzzs_zzyzmdj_skill": "诅咒抑制魔导具",
		"wzzs_zzyzmdj_info": "每回合限一次，当你流失体力或受到非卡牌伤害时，你可取消之并与当前回合角色各摸一张牌。",
		"wzzs_zzyztk": "诅咒抑制头盔",
		"wzzs_zzyztk_skill": "诅咒抑制头盔",
		"wzzs_zzyztk_info": "每回合限一次，当你成为虚拟牌或转化牌的目标时，你可取消之并与当前回合角色各摸一张牌。",
		"mgf_mh": "明火",
		"mgf_mh_info": "出牌阶段，对攻击范围内的角色使用。若判定结果为红色，则目标角色受到1点火焰伤害并将此牌移动到下家的判定区里，若其已拥有此牌，则改为对该角色造成1点火焰伤害。",
		"wzzs_qlm": "前龙门",
		"wzzs_qlm_skill": "前龙门",
		"wzzs_qlm_info": "每回合各限一次，其他角色恢复体力时或获得牌时，若其在你攻击范围内，你可取消之。",
		"wzzs_hlm": "后龙门",
		"wzzs_hlm_skill": "后龙门",
		"wzzs_hlm_info": "每回合各限一次，当有角色<恢复体力/获得牌>被取消时，你<恢复1点体力/摸两张牌>",
		"wzzs_sdkas": "神刀卡奥斯",
		"wzzs_sdkas_skill": "神刀卡奥斯",
		"wzzs_sdkas_info": "当你造成伤害时，你可消耗15点魔力将本次伤害改为从1～受伤角色体力值中随机点。当此牌进入弃牌堆时，你可重铸所有手牌并获得之",
		"gzhlb_yy": "羽翼",
		"gzhlb_yy_skill": "羽翼",
		"gzhlb_yy_info": "你的【杀】可以对自己使用。当你受到自己造成的伤害后，你本回合使用【杀】次数和攻击距离加x（x为已损失体力值且至多为5），然后你弃置此装备。",
		"Mimi_quantao": "拳击手套",
		"Mimi_quantao_info": "当你使用【杀】对目标角色造成伤害时，你可以弃置两张手牌，令此伤害+1。",
		"Mimi_quantao_skill": "拳击手套",
		"Mimi_tanhuang3": "螺旋弹簧一号",
		"Mimi_tanhuang3_info": "当你一次性失去至少两张牌后，你摸一张牌。",
		"Mimi_tanhuang3_skill": "螺旋弹簧",
		"Mimi_tanhuang4": "螺旋弹簧二号",
		"Mimi_tanhuang4_info": "当你一次性失去正好两张牌后，你获得一张火【杀】。",
		"Mimi_tanhuang4_skill": "螺旋弹簧",
		"Mimi_zhixiang": "空纸箱",
		"Mimi_zhixiang_info": "你免疫非卡牌伤害。",
		"Mimi_zhixiang_skill": "空纸箱",
		"Mimi_jiaodai": "万能胶带",
		"Mimi_jiaodai_info": "当你仅摸一张牌时，你可以对自己造成1点伤害，视为使用一张【铁索连环】且处于横置状态的角色不可响应你使用的牌。",
		"Mimi_jiaodai_skill": "万能胶带",
		"Mimi_xumou": "蓄谋",
		"Mimi_xumou_info": "菜篮置于判定区的牌，判定阶段自动跳过。",
		"gzt_mwjy": "美味佳肴",
		"gzt_mwjy_info": "出牌阶段，对一名角色使用。若判定结果为红色，其恢复一点体力；为梅花，其摸一张牌。",
		"gzt_zsq": "注射器",
		"gzt_zsq_info": "出牌阶段，对攻击范围内的一名其他角色使用。其须使用一张【闪】，否则将一张【毒】置入弃牌堆或流失一点体力。",
		"gzt_thsy": "烫手山芋",
		"gzt_thsy_active": "已激活",
		"gzt_thsy_info": "出牌阶段，若此牌未激活，你可对攻击范围内的一名其他角色使用并随机激活2~5中的一个数字，然后其获得此牌。已激活的此牌不可使用、打出或弃置。持有者回合结束时，激活数字减1，若减至0，其受到2点火焰伤害并将此牌置入弃牌堆，否则，其可将此牌交给与其距离为1的其他角色。",
		"seh_shengguang": "圣光十字剑",
		"seh_shengguang_info": "①当你使用【杀】指定一名目标后，你可令其装备栏内的装备技能失效直到此【杀】结算后。<br>②你视为拥有〖伤害〗且你使用的【杀】视为造成神圣伤害。<br>③当你使用的【杀】被响应时，你可令此【杀】依然对其造成伤害，若如此做此牌结算后①②③效果失效直到回合结束。<br>④当此装备离开“圣光灵神”的装备栏时，此牌销毁。",
		"seh_shengguang_skill_ban": "封",
	},
    card: {
		"seh_shengguang": {
			image: "ext:鸽府包/card/image/seh_shengguang.jpg",
			fullskin: true,
			type: "equip",
			subtype: "equip1",
			distance: {
				attackFrom: -2,
			},
			skills: ["seh_shengguang_skill"],
			async onEquip(event, trigger, player) {
				if (!player.hasSkill("gf_damage")) {
					player.addSkill("gf_damage");
					player.storage.seh_sg_holy = true;
				}
			},
			async onLose(event, trigger, player) {
				if (player.storage.seh_sg_holy) {
					player.removeSkill("gf_damage");
					delete player.storage.seh_sg_holy;
				}
			},
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 5,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"wzzs_ys": {
			image: "ext:鸽府包/card/image/wzzs_ys.jpg",
			fullskin: true,
			type: "equip",
			subtype: "equip1",
			distance: {
				attackFrom: -1,
			},
			skills: ["wzzs_ys_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 5,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"wzzs_mdk": {
			image: "ext:鸽府包/card/image/wzzs_mdk.jpg",
			fullskin: true,
			type: "equip",
			subtype: "equip1",
			subtypes: ["equip1", "equip2", "equip3", "equip4", "equip5", "equip6"],
			distance: {
				attackRange(card, player) {
					return game.countPlayer((current) => current.isAlive()) || 1;
				},
			},
			skills: ["wzzs_mdk_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 5,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"wzzs_zzyzmdj": {
			image: "ext:鸽府包/card/image/wzzs_zzyzmdj.jpg",
			fullskin: true,
			type: "equip",
			subtype: "equip5",
			skills: ["wzzs_zzyzmdj_skill"],
			ai: {
				basic: {
					equipValue: 4,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"wzzs_zzyztk": {
			image: "ext:鸽府包/card/image/wzzs_zzyztk.jpg",
			fullskin: true,
			type: "equip",
			subtype: "equip2",
			skills: ["wzzs_zzyztk_skill"],
			ai: {
				basic: {
					equipValue: 4,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"wzzs_qlm": {
			image: "ext:鸽府包/card/image/wzzs_qlm.png",
			fullskin: true,
			type: "equip",
			subtype: "equip3",
			skills: ["wzzs_qlm_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 5,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"wzzs_hlm": {
			image: "ext:鸽府包/card/image/wzzs_hlm.png",
			fullskin: true,
			type: "equip",
			subtype: "equip4",
			skills: ["wzzs_hlm_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 5,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"wzzs_sdkas": {
			image: "ext:鸽府包/card/image/wzzs_sdkas.png",
			fullskin: true,
			type: "equip",
			subtype: "equip1",
			distance: {
				attackFrom: -Infinity,
			},
			fullskin: true,
			skills: ["wzzs_sdkas_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 5,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"gzhlb_yy": {
			image: "ext:鸽府包/card/image/gzhlb_yy.png",
			fullskin: true,
			type: "equip",
			subtype: "equip5",
			skills: ["gzhlb_yy_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 5,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"Mimi_quantao": {
			image: "ext:鸽府包/card/image/Mimi_quantao.jpg",
			fullskin: true,
			type: "equip",
			subtype: "equip1",
			distance: {
				attackFrom: -1,
			},
			skills: ["Mimi_quantao_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 5,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"Mimi_tanhuang3": {
			image: "ext:鸽府包/card/image/Mimi_tanhuang.jpg",
			fullskin: true,
			type: "equip",
			subtype: "equip3",
			skills: ["Mimi_tanhuang3_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 4,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"Mimi_tanhuang4": {
			image: "ext:鸽府包/card/image/Mimi_tanhuang.jpg",
			fullskin: true,
			type: "equip",
			subtype: "equip4",
			skills: ["Mimi_tanhuang4_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 4,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"Mimi_zhixiang": {
			image: "ext:鸽府包/card/image/Mimi_zhixiang.jpg",
			fullskin: true,
			type: "equip",
			subtype: "equip2",
			skills: ["Mimi_zhixiang_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 5,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"Mimi_jiaodai": {
			image: "ext:鸽府包/card/image/Mimi_jiaodai.jpg",
			fullskin: true,
			type: "equip",
			subtype: "equip5",
			skills: ["Mimi_jiaodai_skill"],
			ai: {
				order() {
					return get.order({ name: "sha" }) - 0.1;
				},
				basic: {
					equipValue: 5,
				},
				tag: {
					valueswap: 1,
				},
			},
		},
		"Mimi_xumou": {
			image: "ext:鸽府包/card/image/Mimi_xumou.jpg",
			fullskin: true,
			type: "delay",
			noEffect: true,
			allowDuplicate: true,
		},
		"gzt_mwjy": {
			image: "ext:鸽府包/card/image/gzt_mwjy.jpg",
			fullskin: true,
			type: "delay",
			filterTarget(card, player, target) {
				return lib.filter.judge(card, player, target);
			},
			judge(card) {
				if (get.suit(card) === "spade") {
					return -1;
				}
				return 1;
			},
			judge2(result) {
				return result.suit !== "spade";
			},
			async effect(event, trigger, player, result) {
				if (result.color === "red") {
					game.log(player, "的【美味佳肴】判定为红色，恢复了一点体力");
					await player.recover();
				} else if (result.suit === "club") {
					game.log(player, "的【美味佳肴】判定为梅花，摸了一张牌");
					await player.draw();
				}
			},
		},
		"gzt_zsq": {
			image: "ext:鸽府包/card/image/gzt_zsq.png",
			fullskin: true,
			type: "basic",
			enable: true,
			filterTarget(card, player, target) {
				return target != player && player.inRange(target);
			},
			async content(event, trigger, player) {
				const target = event.target;
				const next = target.chooseToUse();
				next.set("filterCard", (card, player2) => get.name(card) === "shan" && lib.filter.cardRespondable(card, player2));
				next.set("prompt", "注射器：请使用一张【闪】，否则须将一张【毒】置入弃牌堆或流失1点体力");
				next.set("ai", (card) => 2);
				const result = await next.forResult();
				if (result.bool) return;
				if (target.countCards("h", card => card.name === "du")) {
					const result2 = await target.chooseCard()
					.set("position", "h")
					.set("filterCard", card => card.name === "du")
					.set("selectCard", 1)
					.set("prompt", "注射器：请选择一张【毒】并置入弃牌堆，否则流失1点体力")
					.set("ai", card => 6 - get.value(card))
					.forResult();
					if (result2.bool && result2.cards && result2.cards.length) {
						const ids = result2.cards.map(card => card.cardid || card.id);
						game.broadcast(function (idList, srcId) {
							var list = idList || [];
							for (var i = 0; i < list.length; i++) {
								var c = lib.cardOL && lib.cardOL[list[i]];
								if (!c) continue;
								var pos = get.position(c);
								if (pos == "d" || pos == "out") continue;
								c.discard();
							}
							ui.updatehl();
							var src = game.players.filter(function (x) { return x && x.playerid == srcId; })[0];
							if (src && src.update) src.update();
						}, ids, target.playerid);
						await game.cardsDiscard(result2.cards);
						ui.updatehl();
						target.update();
						return;
					}
				}
				await target.loseHp();
			},
			ai: {
				basic: {
					useful: 4,
					value: 4,
				},
				order: 4,
				result: {
					target(player, target) {
						if (target.countCards("h", "shan")) return -0.5;
						if (target.countCards("h", card => card.name === "du")) return -0.8;
						return -1.5;
					},
				},
				tag: {
					respond: 1,
					loseHp: 0.5,
				},
			},
		},
		"gzt_thsy": {
			image: "ext:鸽府包/card/image/gzt_thsy.jpg",
			fullskin: true,
			type: "trick",
			enable: true,
			selectTarget: 1,
			filterTarget(card, player, target) {
				return target != player && player.inRange(target);
			},
			init() {
				if (!lib.skill.global.includes("gzt_thsy_skill")) game.addGlobalSkill("gzt_thsy_skill");
			},
			async content(event, trigger, player) {
				const card = event.cards && event.cards.length ? event.cards[0] : event.card;
				const num = get.rand(2, 5);
				lib.skill.gzt_thsy_skill.setNum(card, num);
				const next = event.target.gain(card, "gain2");
				next.gaintag.add("gzt_thsy_active");
				await next;
				game.log(player, "的", card, "被激活并交给了", event.target);
				lib.skill.gzt_thsy_skill.sync(event.target);
			},
			ai: {
				order: 6,
				basic: {
					useful: 3,
					value: 3,
				},
				result: {
					target(player, target) {
						return -1;
					},
				},
			},
		},
	},
	/** @type { importCharacterConfig['skill'] } */
	skill: {
		//skill
		"seh_shengguang_skill": {
			equipSkill: true,
			group: ["seh_shengguang_skill_seal", "seh_shengguang_skill_restore", "seh_shengguang_skill_holy", "seh_shengguang_skill_hit", "seh_shengguang_skill_gone", "seh_shengguang_skill_reset"],
			subSkill: {
				seal: {
					trigger: {
						player: "useCardToTarget",
					},
					logTarget: "target",
					prompt(event, player) {
						const target = event.target;
						if (!target) return "圣光十字剑：是否令其装备技能失效直到此【杀】结算后？";
						return "圣光十字剑：是否令" + get.translation(target) + "的装备技能失效直到此【杀】结算后？";
					},
					filter(event, player) {
						if (player.storage.seh_sg_off) return false;
						if (!event.card || event.card.name != "sha") return false;
						const target = event.target;
						if (!target || target.isDead()) return false;
						if (target.hasSkill("seh_shengguang_skill_ban")) return false;
						return target.getSkills().some(function (skill) {
							const info = get.info(skill);
							return info && info.equipSkill;
						});
					},
					async content(event, trigger, player) {
						const target = trigger.target;
						const skills = target.getSkills().filter(function (skill) {
							const info = get.info(skill);
							return info && info.equipSkill;
						});
						if (!skills.length) return;
						target.disableSkill("seh_shengguang_skill_ban", skills);
						target.storage.seh_shengguang_skill_ban = skills.slice();
						target.addSkill("seh_shengguang_skill_ban");
						target.markSkill("seh_shengguang_skill_ban");
					},
					sub: true,
				},
				ban: {
					charlotte: true,
					mark: true,
					marktext: "封",
					trigger: {
						global: "useCardAfter",
					},
					silentForce: true,
					filter(event) {
						return !!(event.card && event.card.name == "sha");
					},
					intro: {
						content(storage) {
							if (!storage || !storage.length) return "装备技能失效";
							return (
								"装备技能失效：" +
								storage
									.map(function (skill) {
										return "〖" + get.translation(skill) + "〗";
									})
									.join("、")
							);
						},
					},
					init(player, skill) {
						player.addTip(skill, "装备技能失效");
					},
					async content(event, trigger, player) {
						player.removeSkill("seh_shengguang_skill_ban");
					},
					onremove(player, skill) {
						player.enableSkill(skill);
						for (const name of player.storage[skill] || []) {
							if (player.hasSkill(name)) player.markSkill(name);
						}
						player.removeTip(skill);
						delete player.storage[skill];
					},
					sub: true,
				},
				restore: {
					trigger: {
						player: "useCardAfter",
					},
					silentForce: true,
					content(event, trigger, player) {
						lib.skill.seh_shengguang_skill_restore.release();
					},
					release() {
						for (const other of game.filterPlayer()) {
							if (!other.hasSkill("seh_shengguang_skill_ban")) continue;
							other.removeSkill("seh_shengguang_skill_ban");
						}
					},
					sub: true,
				},
				holy: {
					trigger: {
						source: "damageBegin1",
					},
					silentForce: true,
					filter(event, player) {
						if (player.storage.seh_sg_off) return false;
						if (!event.card || event.card.name != "sha") return false;
						return event.player != player && event.num > 0;
					},
					async content(event, trigger, player) {
						const target = trigger.player;
						const num = trigger.num;
						target.gf_immuneDamage(trigger);
						if (!target.isAlive() || num <= 0) return;
						game.log(player, "对", target, "造成了", "#y" + num, "点", "#y神圣伤害");
						target.$damage(player);
						target.$damagepop(-num, "soil");
						game.broadcastAll(function (dmg) {
							if (lib.config.background_audio) game.playAudio("effect/damage" + (dmg > 1 ? "2" : "") + ".mp3");
						}, num);
						const next = target.changeHp(-num, false, false);
						next._triggered = null;
						await next;
						if (target.hp <= 0 && target.isAlive() && !target.isDying() && !target.nodying) {
							await game.delayx();
							target._dyinged = true;
							const dyingEvent = target.dying(trigger);
							if (dyingEvent) await dyingEvent;
						}
					},
					sub: true,
				},
				hit: {
					trigger: {
						player: "shaMiss",
					},
					prompt: "圣光十字剑：是否令此【杀】依然造成伤害？",
					filter(event, player) {
						if (player.storage.seh_sg_off) return false;
						if (!event.card || event.card.name != "sha") return false;
						return event.target && event.target.isIn();
					},
					async content(event, trigger, player) {
						player.storage.seh_sg_off = true;
						trigger.untrigger();
						trigger.trigger("shaHit");
						trigger._result.bool = false;
						trigger._result.result = null;
					},
					sub: true,
				},
				reset: {
					trigger: {
						player: "phaseAfter",
					},
					silentForce: true,
					content(event, trigger, player) {
						delete player.storage.seh_sg_off;
						lib.skill.seh_shengguang_skill_restore.release();
					},
					sub: true,
				},
				gone: {
					trigger: {
						player: ["loseAfter", "loseAsyncAfter", "useCard", "respond"],
						global: ["equipAfter", "addJudgeAfter", "gainAfter", "addToExpansionAfter"],
					},
					silentForce: true,
					getGoneCards(event, player, name) {
						const cards = [];
						const push = function (target) {
							if (target && target.name == "seh_shengguang" && !cards.includes(target)) cards.push(target);
						};
						if (name == "useCard" || name == "respond") {
							for (const evt of player.getHistory("lose")) {
								if (evt.relatedEvent != event && evt.getParent() != event) continue;
								(evt.es || []).forEach(function (card) {
									const VEquip = evt.vcard_map && evt.vcard_map.get(card);
									push(VEquip || card);
								});
							}
							return cards;
						}
						const evt = event.getl(player);
						if (evt && evt.es) {
							evt.es.forEach(function (card) {
								const VEquip = evt.vcard_map && evt.vcard_map.get(card);
								push(VEquip || card);
							});
						}
						return cards;
					},
					filter(event, player, name) {
						return lib.skill.seh_shengguang_skill_gone.getGoneCards(event, player, name).length > 0;
					},
					getIndex(event, player, name) {
						return lib.skill.seh_shengguang_skill_gone.getGoneCards(event, player, name);
					},
					async content(event, trigger, player) {
						const card = event.indexedData;
						if (!card) return;
						await game.cardsGotoSpecial([card]);
						game.log(player, "销毁了", card);
					},
					sub: true,
				},
			},
		},
		"wzzs_ys_skill": {
			equipSkill: true,
			enable: "phaseUse",
			usable: 1,
			selectCard: 1,
			position: "he",
			prompt: "义手：是否重铸一张【杀】，然后刷新除此技能外的技能使用次数（可刷新限定技或出牌阶段限一次的技能）？",
			filterCard(card) {
				return get.name(card) == "sha";
			},
			filter(event, player) {
				return player.countCards("he", { name: "sha" }) > 0;
			},
			async content(event, trigger, player) {
				await player.recast(event.cards);
				player.refreshSkill(player.getSkills().filter((skill) => skill != "wzzs_ys_skill"));
			},
		},
		"wzzs_mdk_skill": {
			equipSkill: true,
			trigger: {
				player: ["damageBegin4", "useCard", "useCardAfter", "damageEnd"],
			},
			forced: true,
			filter(event, player, name) {
				if (name == "damageBegin4") return lib.suit.includes(get.suit(event.card));
				if (name == "useCard") return get.name(event.card) == "sha";
				if (name == "useCardAfter") return get.name(event.card) == "sha" && Array.isArray(player.storage.wzzs_mdk_block);
				return true;
			},
			async content(event, trigger, player) {
				const name = event.triggername;
				if (name == "damageBegin4") {
					if (trigger.num <= 0) return;
					const suit = get.suit(trigger.card);
					if (!player.countCards("he", (card) => get.suit(card) == suit)) return;
					const result = await player
						.chooseCard()
						.set("position", "he")
						.set("filterCard", (card) => get.suit(card) == suit)
						.set("selectCard", 1)
						.set("prompt", "魔导铠：是否重铸一张" + get.translation(suit) + "牌，令此伤害减1？")
						.set("ai", (card) => 6 - get.value(card))
						.forResult();
					if (!result.bool || !result.cards?.length) return;
					await player.recast(result.cards);
					trigger.num = Math.max(0, trigger.num - 1);
					return;
				}
				if (name == "useCard") {
					const shas = player.getCards("h").filter((card) => get.name(card) == "sha");
					if (shas.length) {
						const result = await player.chooseBool("魔导铠：是否弃置手牌所有【杀】并令此【杀】额外结算" + shas.length + "次？").forResult();
						if (result.bool) {
							await player.discard(shas);
							if (typeof trigger.effectCount != "number") trigger.effectCount = 1;
							trigger.effectCount += shas.length;
							game.log(player, "令", trigger.card, "额外结算", shas.length, "次");
						}
					}
					player.storage.wzzs_mdk_block = (trigger.targets || []).slice();
					return;
				}
				if (name == "useCardAfter") {
					delete player.storage.wzzs_mdk_block;
					return;
				}
				player.storage.wzzs_mdk_count = (player.storage.wzzs_mdk_count || 0) + 1;
				if (player.storage.wzzs_mdk_count >= 2) {
					player.storage.wzzs_mdk_count = 0;
					await player.recover();
				}
			},
			group: ["wzzs_mdk_skill_block", "wzzs_mdk_skill_guard"],
			subSkill: {
				block: {
					trigger: {
						global: "gainBefore",
					},
					forced: true,
					filter(event, player) {
						const list = player.storage.wzzs_mdk_block;
						return Array.isArray(list) && list.includes(event.player);
					},
					content(event, trigger, player) {
						trigger.cancel();
					},
					sub: true,
				},
				guard: {
					trigger: {
						player: "discardBefore",
					},
					forced: true,
					filter(event, player) {
						return player.gfmgGet("moli") >= 2 && event.cards?.some((card) => get.name(card) == "wzzs_mdk");
					},
					async content(event, trigger, player) {
						const result = await player.chooseBool("魔导铠：是否失去2点魔力以取消弃置【魔导铠】？").forResult();
						if (!result.bool) return;
						player.gfmgChange(-2, "moli");
						trigger.cards = trigger.cards.filter((card) => get.name(card) != "wzzs_mdk");
						if (!trigger.cards.length) trigger.cancel();
					},
					sub: true,
				},
			},
		},
		"wzzs_zzyzmdj_skill": {
			equipSkill: true,
			trigger: {
				player: ["loseHpBegin", "damageBegin"],
			},
			usable: 1,
			"prompt2": function (event, player, name) {
				const current = _status.currentPhase;
				if (name == "damageBefore") return "是否取消受到的伤害并与【" + get.translation(current) + "】各摸一张牌？";
				return "是否取消流失体力并与【" + get.translation(current) + "】各摸一张牌？";
			},
			filter(event, player, name) {
				if (name == "damageBegin") {
					return !event.card;
				} else {
					return true;
				}
			},
			async content(event, trigger, player) {
				trigger.cancel();
				await player.draw();
				const current = _status.currentPhase;
				if (current && current != player && current.isAlive()) await current.draw();
			},
		},
		"wzzs_zzyztk_skill": {
			equipSkill: true,
			trigger: {
				target: "useCardToBegin",
			},
			usable: 1,
			"prompt2": function (event, player) {
				const current = _status.currentPhase;
				return "是否取消成为" + get.translation(event.card) + "的目标并与【" + get.translation(current) + "】各摸一张牌？";
			},
			filter(event, player) {
				return get.is.convertedCard(event.card) || get.is.virtualCard(event.card);
			},
			async content(event, trigger, player) {
				trigger.cancel();
				await player.draw();
				const current = _status.currentPhase;
				if (current && current != player && current.isAlive()) await current.draw();
			},
		},
		"gzt_thsy_skill": {
			num(card) {
				if (!card) return 0;
				const list = card.cards && card.cards.length ? card.cards : [card];
				for (const c of list) {
					if (!c || !c.gaintag || !c.gaintag.includes("gzt_thsy_active")) continue;
					return (c.storage && c.storage.gzt_thsy_num) || 0;
				}
				return 0;
			},
			setNum(card, num) {
				if (!card) return;
				game.broadcastAll(
					(card, num) => {
						if (num) card.storage.gzt_thsy_num = num;
						else delete card.storage.gzt_thsy_num;
					},
					card,
					num
				);
			},
			sync(player) {
				if (!player) return;
				const has = player.getCards("h").some((card) => lib.skill.gzt_thsy_skill.num(card) > 0);
				player.setMark("gzt_thsy_mark", has ? 1 : 0, false);
			},
			trigger: {
				global: ["phaseEnd", "gainAfter", "loseAfter"],
			},
			charlotte: true,
			silent: true,
			fixed: true,
			forced: true,
			popup: false,
			filter(event, player, name) {
				if (event.player != player) return false;
				if (name == "phaseEnd") {
					return player.getCards("h").some((card) => lib.skill.gzt_thsy_skill.num(card) > 0);
				}
				return event.cards && event.cards.some((card) => card.name == "gzt_thsy");
			},
			async content(event, trigger, player) {
				if (event.triggername != "phaseEnd") {
					for (const card of trigger.cards) {
						if (card.name == "gzt_thsy" && get.position(card) == "d") {
							lib.skill.gzt_thsy_skill.setNum(card, 0);
							player.removeGaintag("gzt_thsy_active", [card]);
						}
					}
					lib.skill.gzt_thsy_skill.sync(player);
					return;
				}
				const cards = player.getCards("h").filter((card) => lib.skill.gzt_thsy_skill.num(card) > 0);
				for (const card of cards) {
					let num = lib.skill.gzt_thsy_skill.num(card) - 1;
					if (num <= 0) {
						lib.skill.gzt_thsy_skill.setNum(card, 0);
						player.removeGaintag("gzt_thsy_active", [card]);
						game.log(player, "的", card, "倒计时归零");
						await player.damage({ num: 2, nature: "fire" });
						await player.lose([card], ui.discardPile);
						continue;
					}
					lib.skill.gzt_thsy_skill.setNum(card, num);
					const result = await player.chooseTarget("烫手山芋：选择一名其他角色", (card2, player2, target) => target != player2 && get.distance(player2, target) <= 1).set("ai", (target) => -get.attitude(player, target)).forResult();
					if (!result.bool || !result.targets || !result.targets.length) continue;
					const target = result.targets[0];
					const next = target.gain(card, "gain2");
					next.gaintag.add("gzt_thsy_active");
					await next;
				}
				lib.skill.gzt_thsy_skill.sync(player);
			},
			mod: {
				cardEnabled2(card, player) {
					if (lib.skill.gzt_thsy_skill.num(card) > 0) return false;
				},
				cardDiscardable(card, player) {
					if (lib.skill.gzt_thsy_skill.num(card) > 0) return false;
				},
			},
		},
		"mgf_mh_skill": {
		},
		"wzzs_qlm_skill": {
			equipSkill: true,
			trigger: {
				global: ["recoverBegin", "gainBegin"],
			},
			audio: "ext:鸽府包/audio/skill:2",
			"prompt2": function (event, playe, name) {
				if (name == 'recoverBegin') {
					return '你是否将【' + get.translation(event.player) + '】即将恢复的【' + event.num + '】点体力取消之？';
				} else {
					return '你是否将【' + get.translation(event.player) + '】即将获得的【' + event.cards.length + '】张牌取消之？';
				}
			},
			filter(event, player, name) {
				if (name == 'recoverBegin') {
					if (player.hasSkill("wzzs_qlm_skill_a")) return false;
				} else {
					if (player.hasSkill("wzzs_qlm_skill_b")) return false;
				}
				return event.player != player && player.inRange(event.player);
			},
			content: function () {
				trigger.cancel();
				if (event.triggername == 'recoverBegin') {
					player.addTempSkill("wzzs_qlm_skill_a");
				} else {
					player.addTempSkill("wzzs_qlm_skill_b");
				}
			},
			subSkill: {
				a: { sub: true, },
				b: { sub: true, },
			},
		},
		"wzzs_hlm_skill": {
			equipSkill: true,
			trigger: {
				global: ["recoverCancelled","gainCancelled"],
			},
			frequent: true,
			filter(event, player, name) {
				if (name == 'recoverCancelled') {
					if (player.hasSkill("wzzs_hlm_skill_a")) return false;
				} else {
					if (player.hasSkill("wzzs_hlm_skill_b")) return false;
				}
				return true;
			},
			content() {
				if (event.triggername == 'recoverCancelled') {
					player.addTempSkill("wzzs_hlm_skill_a");
					player.recover();
				} else {
					player.addTempSkill("wzzs_hlm_skill_b");
					player.draw(2);
				}
			},
			subSkill: {
				a: { sub: true, },
				b: { sub: true, },
			},
		},
		"wzzs_sdkas_skill": {
			equipSkill: true,
			trigger: {
				source: "damageBegin1",
			},
			filter: function (event, player) {
				return player.gfmgGet('moli') >= 15;
			},
			"prompt2": function (event, player) {
				return '你是否将本次对【' + get.translation(event.player) + '】造成的伤害改为从【1~' + event.player.hp + '】中随机点？';
			},
			content() {
				player.gfmgChange(-15, 'moli');
				trigger.num = Math.floor(Math.random() * trigger.player.hp) + 1;
			},
		},
		"gzhlb_yy_skill": {
			equipSkill: true,
			mod: {
				targetInRange: function (card, player, target) {
					if (player == target && card.name == "sha") return true;
				},
				targetEnabled: function (card, player) {
					if (card.name == "sha") {
						return true;
					}
				},
				cardEnabled: function (card, player, target) {
					if (player == target && card.name == "sha") return true;
				},
			},
			trigger: {
				player: "damageEnd",
			},
			filter: function (event, player) {
				return event.source == player;
			},
			forced:true,
			content() {
				if (player.getDamagedHp() > 5) { var a = 5; } else { var a = player.getDamagedHp(); }
				player.addMark("gzhlb_yy_skill_a", a);
				player.addTempSkill("gzhlb_yy_skill_a");
				var card = player.getEquips("gzhlb_yy");
				if (card.length) {
					player.discard(card);
				}
			},
			subSkill: {
				a: {
					equipSkill: true,
					mod: {
						attackFrom(from, to, distance) {
							return distance - from.countMark("gzhlb_yy_skill_a");
						},
						cardUsable(card, player, num) {
							if (card.name == "sha") {
								return num + player.countMark("gzhlb_yy_skill_a");
							}
						},
					},
					onremove: function (player) {
						player.unmarkSkill("gzhlb_yy_skill_a");
						delete player.storage.gzhlb_yy_skill_a;
					},
					sub:true,
				},
			},
		},
		"Mimi_quantao_skill": {
			equipSkill: true,
			trigger: {
				source: "damageBegin1",
			},
			frequent: true,
			filter(event, player) {
				return event.card && event.card.name == "sha" && player.countCards("h") >= 2;
			},
			async content(event, trigger, player) {
				const next = player.chooseToDiscard(2, "h", "拳击手套：是否弃置两张手牌令此伤害+1？");
				next.set("ai", function (card) {
					return 6 - get.value(card);
				});
			const result = await next.forResult();
			if (result.bool) {
				player.logSkill("Mimi_quantao_skill");
				trigger.num++;
				game.log(player, "弃置了两张手牌，令", trigger.player, "受到的伤害+1");
			}
		},
	},
	"Mimi_tanhuang3_skill": {
		equipSkill: true,
		trigger: {
			player: "loseAfter",
		},
		firstDo: true,
		frequent: true,
		filter(event, player) {
			return event.cards && event.cards.length >= 2;
		},
		async content(event, trigger, player) {
			await player.draw();
		},
	},
	"Mimi_tanhuang4_skill": {
		equipSkill: true,
		trigger: {
			player: "loseAfter",
		},
		frequent: true,
		filter(event, player) {
			return event.cards && event.cards.length == 2;
		},
		async content(event, trigger, player) {
			const card = get.cardPile2(card => {
                return card.name == "sha" && card.nature == "fire";
            });
			if (card) {
				await player.gain(card, "gain2");
			} else {
				const card2 = get.discardPile(card => {
					return card.name == "sha" && card.nature == "fire";
				});
				if (card2) {
					await player.gain(card2, "gain2");
				}
			}
		},
	},
	"Mimi_zhixiang_skill": {
		equipSkill: true,
		trigger: {
			player: "damageBegin4",
		},
		frequent: true,
		filter(event, player) {
			return !event.card;
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
	},
	"Mimi_jiaodai_skill": {
		equipSkill: true,
		trigger: {
			player: "useCard",
		},
		frequent: true,
		filter(event, player) {
			return game.hasPlayer(function (t) {
				return t != player && t.isLinked();
			});
		},
		async content(event, trigger, player) {
			trigger.directHit.addArray(game.filterPlayer(function (t) {
				return t != player && t.isLinked();
			}));
			game.log(player, "令处于横置状态的角色不能响应", trigger.card);
		},
		group: "Mimi_jiaodai_skill_a",
		subSkill: {
			a: {
				trigger: {
					player: "drawBegin",
				},
				frequent: true,
				filter(event, player) {
					return event.num == 1;
				},
				async content(event, trigger, player) {
					const result = await player.chooseBool("万能胶带：是否对自己造成1点伤害并视为使用一张【铁索】？").forResult();
					if (result.bool) {
						await player.damage(1, player);
						const tiesuo = get.autoViewAs({ name: "tiesuo" }, []);
						await player.chooseUseTarget(tiesuo, true);
					}
				},
				sub: true,
			},
		},
	},
	},
}
