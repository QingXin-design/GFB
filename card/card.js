import { lib, game, ui, get, ai, _status } from '../../../noname.js';
export const card = {
	translate: {
		//卡牌翻译
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
	},
    card: {
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
	},
	/** @type { importCharacterConfig['skill'] } */
	skill: {
		//skill
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
				return player.gflib_getMp('wzzs_MoLi') >= 15;
			},
			"prompt2": function (event, player) {
				return '你是否将本次对【' + get.translation(event.player) + '】造成的伤害改为从【1~' + event.player.hp + '】中随机点？';
			},
			content() {
				player.gflib_changeMp(-15, 'wzzs_MoLi');
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
