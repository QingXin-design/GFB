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
	},
}
