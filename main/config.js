import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import update from '../main/update.js';
import {setZgtzSpineEnabled} from '../extension/SpinePlayer/gugeSpine.js';

//奇妙小功能面板样式
const gfbQmxgnCss = `
.gfb_qmxgn {
	border-radius: 7px;
	background: rgba(128, 128, 128, 0.2);
	box-shadow: 0 0 0 1px rgba(150, 150, 150, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06);
	padding: 3px 3px 5px 3px;
	animation: gfb_qmxgn_in 0.18s ease;
}
@keyframes gfb_qmxgn_in {
	from { opacity: 0; transform: translateY(-4px); }
	to { opacity: 1; transform: none; }
}
.gfb_qmxgn_cap {
	font-size: 12px;
	opacity: 0.45;
	letter-spacing: 1px;
	padding: 5px 0 2px 8px;
}
.gfb_qmxgn_row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 3px 8px;
	border-radius: 4px;
	transition: background 0.15s;
}
.gfb_qmxgn_row:hover {
	background: rgba(128, 128, 128, 0.28);
}
.gfb_qmxgn_label {
	flex: 1 1 auto;
	min-width: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.gfb_qmxgn_sw {
	flex: 0 0 auto;
	width: 40px;
	height: 20px;
	border-radius: 10px;
	background: rgba(128, 128, 128, 0.45);
	box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25);
	transition: background 0.2s;
	cursor: pointer;
}
.gfb_qmxgn_sw > div {
	position: absolute;
	top: 2px;
	left: 2px;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: #ffffff;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
	transition: left 0.2s;
}
.gfb_qmxgn_sw.on {
	background: #0085ff;
}
.gfb_qmxgn_sw.on > div {
	left: 22px;
}
.gfb_qmxgn_act {
	flex: 0 0 auto;
	font-size: 12px;
	line-height: 18px;
	padding: 0 9px;
	border-radius: 9px;
	color: #6cc0ff;
	background: rgba(0, 133, 255, 0.22);
	box-shadow: 0 0 0 1px rgba(90, 180, 255, 0.65);
	cursor: pointer;
	transition: all 0.15s;
}
.gfb_qmxgn_act:hover {
	color: #ffffff;
	background: rgba(0, 133, 255, 0.45);
}
`;

//面板样式只注入一次
const gfbQmxgnStyle = function () {
	if (document.getElementById('gfb_qmxgn_style')) return;
	const style = document.createElement('style');
	style.id = 'gfb_qmxgn_style';
	style.textContent = gfbQmxgnCss;
	document.head.appendChild(style);
};

//收纳进奇妙小功能的选项，clear为按钮其余为开关
const gfbQmxgnOption = {
	gfb_gghm: {
		name: `骨骼动画`,
		intro: `关闭后不再加载骨骼立绘与骨骼特效，恢复原版皮肤立绘，与游戏内按钮同步，点击立即生效`,
		init: true,
		defaultOn: true,
		onclick: function (bool) {
			setZgtzSpineEnabled(bool);
		},
	},
	gfb_zxgx: {
		name: `自动检测更新`,
		intro: `启动游戏时自动检查更新（需联网）`,
		init: false,
		onclick: function (bool) {
			if(bool != lib.config.extension_鸽府包_gfb_zxgx){
				game.saveConfig('extension_鸽府包_gfb_zxgx', bool);
			};
		},
	},
	gfb_ltcd: {
		name: `自动关闭聊天框`,
		intro: "已修复了电脑联机聊天输入中文关闭聊天框的问题，开启此功能后发送完消息自动关闭聊天框（注：电脑端聊天不要点输入框，想打什么直接打）",
		init: false,
		onclick: function (bool) {
			if(bool != lib.config.extension_鸽府包_gfb_ltcd){
				game.saveConfig('extension_鸽府包_gfb_ltcd', bool);
			};
		},
	},
	gfb_hdcd: {
		name: `自动关闭互动表情`,
		intro: "开启此功能后砸蛋、送花后会自动关闭页面，和原版一样",
		init: false,
		onclick: function (bool) {
			if(bool != lib.config.extension_鸽府包_gfb_hdcd){
				game.saveConfig('extension_鸽府包_gfb_hdcd', bool);
			};
		},
	},
	gfb_fzysq: {
		name: `房主有神器`,
		intro: "联机房主专用，开启后菜单栏出现【房主有神器】按钮，点击可强制打断当前流程并使游戏继续运行，用于处理卡死游戏或烧条等情节（房主与白名单昵称 Mimi 会加载此按钮，单机不显示，默认关闭）",
		init: false,
		onclick: function (bool) {
			if(bool != lib.config.extension_鸽府包_gfb_fzysq){
				game.saveConfig('extension_鸽府包_gfb_fzysq', bool);
			};
			if(lib.gf_shenqiRefresh)lib.gf_shenqiRefresh();
		},
	},
	gfb_consoleClear: {
		name: `清日志`,
		intro: "开启后游戏开始前将不再清空历史日志（加载扩展时会产出各种乱七八糟的日志）",
		init: false,
		onclick: function (bool) {
			if(bool != lib.config.extension_鸽府包_gfb_consoleClear){
				game.saveConfig('extension_鸽府包_gfb_consoleClear', bool);
			};
		},
	},
	gfb_logBan: {
		name: `禁log日志`,
		intro: "开启后会禁用console.log形式的日志提示",
		init: false,
		onclick: function (bool) {
			if(bool != lib.config.extension_鸽府包_gfb_logBan){
				game.saveConfig('extension_鸽府包_gfb_logBan', bool);
			};
			if(confirm('您是否要重启游戏以应用禁console.log形式的日志提示设置？')){
				game.reload();
			};
		},
	},
};

//面板分组
const gfbQmxgnGroup = [
	{
		cap: `功能开关`,
		list: ['gfb_gghm','gfb_zxgx','gfb_ltcd','gfb_hdcd','gfb_fzysq','gfb_consoleClear','gfb_logBan'],
	},
];

//渲染面板
const gfbQmxgnPanel = function () {
	const panel = ui.create.div('.gfb_qmxgn');
	for (const group of gfbQmxgnGroup) {
		ui.create.div('.gfb_qmxgn_cap', group.cap, panel);
		for (const key of group.list) {
			const option = gfbQmxgnOption[key];
			if (!option) continue;
			const row = ui.create.div('.gfb_qmxgn_row', '', panel);
			ui.create.div('.gfb_qmxgn_label', String(option.name).replace(/<[^>]*>/g, ''), row);
			if (option.clear) {
				const act = ui.create.div('.gfb_qmxgn_act', option.act || '执行', row);
				act.listen(function () {
					if (option.onclick) option.onclick.call(this);
				});
			} else {
				const name = 'extension_鸽府包_' + key;
				const sw = ui.create.div('.gfb_qmxgn_sw', '<div></div>', row);
				const on = lib.config[name] === undefined ? option.defaultOn : lib.config[name];
				if (on) sw.classList.add('on');
				sw.listen(function () {
					const bool = !this.classList.contains('on');
					this.classList.toggle('on', bool);
					if (option.onclick) option.onclick.call(this, bool);
					else game.saveConfig(name, bool);
				});
			}
			if (option.intro) {
				lib.setIntro(row, function (uiintro) {
					uiintro.style.width = '170px';
					uiintro._place_text = uiintro.add('<div class="text" style="display:inline">' + option.intro + '</div>');
				});
			}
		}
	}
	return panel;
};

export const config = {
	'outcrop':{
	    name:'露头样式',
	    init:'stand',
	    intro:'选择武将原画是否露头',
	    item:{
	        stand:'标准原画',
	        loutou:'露头原画',
	    },
	    onclick:function(bool){
	        if(bool!=lib.config.extension_鸽府包_outcrop){
    	        game.saveConfig('extension_鸽府包_outcrop',bool);
    	        if(confirm('您是否要重启游戏以应用露头样式？'))game.reload();
	        };
	    },
	},
	info_introduce: {
		name: `<span color='#222222'>扩展介绍</span><font color='#ADFF2F'> ==>点击展开＜==</font></span>`,
		clear: true,
		onclick: function () {
			if (this.help === undefined) {
				var log = [`·本扩展为武将扩展，主要目的是方便鸽子精及其伙伴们联机使用`,
					`·扩展中的武将并非一人设计，是大家一起努力的结果！！！`,
				];
				var more = ui.create.div('.help', '<div style="border:2px solid gray"><P align=left>' + log.join('<br>') + '</P></div>');
				this.parentNode.insertBefore(more, this.nextSibling);
				this.help = more;
				this.innerHTML = `<span color="black">扩展介绍</span><font color='#ADFF2F'> （点击收起）</font></span>`;
			} else {
				this.parentNode.removeChild(this.help);
				delete this.help;
				this.innerHTML = `<span color="black">扩展介绍</span><font color='#ADFF2F'> ==>点击展开＜==</font></span>`;
			};
		},
	},
	/*info_update: {
		name: `<span>武将分类</span><font color='#ADFF2F'>==>点击展开＜==</font></span>`,
		clear: true,
		//frequent: false,
		onclick: function () {
			if (this.help === undefined) {
				var log = [
					`<span class=thundertext>===鸽府===</span>`,
					`·<font color='#FFD700'>鸽魂</font>：`,
					`·可以获得“鸽府”任意武将的非限定技技能，并且可以复活 `,
					`·<font color='#FFD700'>鸽判官</font>：`,
					`·拥有极其强大的防御力 `,
					`·<font color='#FFD700'>鸽共喜</font>：`,
					`·拥有不错的恢复能力，并且队友越多摸的牌也越多 `,
					`·<font color='#FFD700'>鸽善卜</font>：`,
					`·拥有直接改判能力，并且可以将场上的状况回溯到他的上个回合结束时`,
					`·<font color='#FFD700'>鸽固步</font>：`,
					`·虽然摸牌量很大，但是出牌受限`,
					`·<font color='#FFD700'>鸽舍</font>：`,
					`·第一个回合负压制，但是在第二个回合就拥有了不错的爆发力`,
					`·<font color='#FFD700'>鸽孤朋</font>：`,
					`·可以同过出牌给牌摸大量的牌`,
					`·<font color='#FFD700'>鸽驭法</font>：`,
					`·进入游戏可以摸6张带标记的牌，失去这些带标记可以触发强大的效果，但是这些牌一旦用光就只能开限定技补充，否则就白板了`,
					`·<font color='#FFD700'>鸽商贾</font>：`,
					`·给队友大闭月的能力，并且可以控制他人摸牌阶段摸的牌`,
					`·<font color='#FFD700'>鸽酷税</font>：`,
					`·限制别人摸牌，本身是个摸牌负`,
					`·<font color='#FFD700'>鸽薄衫</font>：`,
					`·技能很绕，读懂的话可以瞬间起爆打出大量的输出`,
					`·<font color='#FFD700'>鸽太岁</font>：`,
					`·对他用牌需要付出一定代价，开限定技起爆后直到下个回合将失去防御力`,
					`·<font color='#FFD700'>【鸽府】</font>：`,
					`·测试用的`,

					`<span class=thundertext>===无职转生===</span>`,
					`·<font color='#C19A6B'>保罗</font>`,
					`·<font color='#C19A6B'>札诺巴</font>`,
					`·<font color='#C19A6B'>奥尔斯帝德</font>`,

					`<span class=thundertext>===荼家将===</span>`,
					`·<font color='#CD5C5C'>荼赵云</font>`,
					`·<font color='#CD5C5C'>荼刘备</font>`,
					`·<font color='#CD5C5C'>荼徽</font>`,
					`·<font color='#CD5C5C'>荼吕玲绮</font>`,
					`·<font color='#CD5C5C'>荼雲</font>`,
					`·<font color='#CD5C5C'>荼乞安</font>`,
					`·<font color='#CD5C5C'>荼董卓</font>`,

				`<span class=thundertext>===朋家将===</span>`,
				`·<font color='#00FF00'>朋张春华</font>`,
				`·<font color='#00FF00'>朋孙茹</font>`,
				`·<font color='#00FF00'>朋吕蒙</font>`,
					
					`<span class=thundertext>===欢乐鸽===</span>`,
					`·<font color='#1E90FF'>凤乐殴</font>`,
					`·<font color='#1E90FF'>鸽子精</font>`,
					`·<font color='#1E90FF'>风林左慈</font>`,
					`·<font color='#1E90FF'>莘式</font>`,
					`·<font color='#1E90FF'>久玲</font>`,
					`·<font color='#1E90FF'>刘相</font>`,
					`·<font color='#1E90FF'>许鸣</font>`,
					`·<font color='#1E90FF'>睢鸣</font>`,
					`·<font color='#1E90FF'>珪卞</font>`,
					`·<font color='#1E90FF'>鸽子精●智</font>`,
					`·<font color='#1E90FF'>尤里</font>`,
					`·<font color='#1E90FF'>明恋</font>`,
					`·<font color='#1E90FF'>奎磊</font>`,
					`·<font color='#1E90FF'>伊薇</font>`,
					`·<font color='#1E90FF'>华诗</font>`,

					`<span class=thundertext>===家常鸽===</span>`,
					`·<font color='#A52A2A'>启富</font>`,
					`·<font color='#A52A2A'>盗碧</font>`,
					`·<font color='#A52A2A'>岳榈</font>`,
					`·<font color='#A52A2A'>侯奏</font>`,
					`·<font color='#A52A2A'>掣桧</font>`,
					`·<font color='#A52A2A'>孺模</font>`,

					`<span class=thundertext>==='赛尔号&奥奇传说===</span>`,
					`·<font color='#BA55D3'>小赛尔</font>`,
					`·<font color='#BA55D3'>盖亚</font>`,
					`·<font color='#BA55D3'>凡尔维斯</font>`,

					`<span class=thundertext>===公主连结===</span>`,
					`·<font color='#FFC0CB'>秋乃</font>`,

					`<span class=thundertext>===实验体===</span>`,
					`·<font color='#F0FFF0'>编号武将：仅为实验使用</font>`,

					`<span class=thundertext>===鸽杂谈·孤悟===</span>`,
					`·<font color='#FFD700'>嘉豪</font>`,

				];
				var more = ui.create.div('.help', '<div style="border:2px solid gray"><P align=left>' + log.join('<br>') + '</P></div>');
				this.parentNode.insertBefore(more, this.nextSibling);
				this.help = more;
				this.innerHTML = `<span>武将分类</span><font color='#ADFF2F'> （点击收起）</font></span>`;
			} else {
				this.parentNode.removeChild(this.help);
				delete this.help;
				this.innerHTML = `<span>武将分类</span><font color='#ADFF2F'> ==>点击展开＜==</font></span>`;
			};
		},
	},*/
	info_water: {
		name: `<span>更多属性</span><font color='#ffff00' style='text-decoration:underline;'>展示详情</font></span>`,
		clear: true,
		onclick: function () {
			if (this.help === undefined) {
				var log = [
					`<font color='#5398ff'>===水属性===</font>`,
					`·<font color='#5398ff'>①浸湿</font>：受到水属性伤害时，随机1至其手牌数张手牌被标记为“浸湿”直至本回合结束，“浸湿”牌不可使用或打出`,
					`·<font color='#5398ff'>②销毁</font>：受到冰属性伤害时，销毁手牌中所有“浸湿”牌`,
					`<font color='#73d165'>===风属性===</font>`,
					`·<font color='#73d165'>①吹散</font>：受到风属性伤害时，其随机获得其装备栏的装备并标记为“狂风”直至本回合结束，拥有“狂风”牌的角色受到火焰伤害加1`,
					`·<font color='#73d165'>②乱流</font>：受到风属性伤害时，清除手牌中所有“浸湿”牌标记`,
				];
				var more = ui.create.div('.help', '<div style="border:2px solid gray"><P align=left>' + log.join('<br>') + '</P></div>');
				this.parentNode.insertBefore(more, this.nextSibling);
				this.help = more;
				this.innerHTML = `<span>更多属性</span><font color='#ffff00'>（点击收起）</font></span>`;
			} else {
				this.parentNode.removeChild(this.help);
				delete this.help;
				this.innerHTML = `<span>更多属性</span><font color='#ffff00' style='text-decoration:underline;'>展示详情</font></span>`;
			};
		},
	},
	gfb_slb: {
		name: `<span style='text-decoration:underline;'>胜率排行榜</span>`,
		intro: `查看联机对局的胜率排行榜`,
		clear: true,
		onclick: function () {
			game.gfb_slb();
		},
	},
	gfb_ljqy: {
		name: `<span style='text-decoration:underline;'>联机祈愿</span>`,
		intro: `打开联机祈愿面板`,
		clear: true,
		onclick: function () {
			game.gfb_ljqy();
		},
	},
	gfb_qmxgn: {
		name: `<span>奇妙小功能</span><span style='opacity:0.5;font-size:12px;margin-left:6px'>▸ 展开</span>`,
		clear: true,
		onclick: function (bool) {
			this.innerHTML = bool
				? `<span>奇妙小功能</span><span style='opacity:0.5;font-size:12px;margin-left:6px'>▾ 收起</span>`
				: `<span>奇妙小功能</span><span style='opacity:0.5;font-size:12px;margin-left:6px'>▸ 展开</span>`;
			if (bool) {
				gfbQmxgnStyle();
				this.gfb_qmxgn_panel = gfbQmxgnPanel();
				this.parentNode.insertBefore(this.gfb_qmxgn_panel, this.nextSibling);
			} else if (this.gfb_qmxgn_panel) {
				this.gfb_qmxgn_panel.remove();
				delete this.gfb_qmxgn_panel;
			};
		},
	},
	check_update: {
		name: `<button style='padding:5px 10px; font-size:14px;'>检测更新</button>`,
		intro: `从远程仓库拉取鸽府包最新版本`,
		clear: true,
		onclick: async function () {
			let btn = this;
			btn.innerHTML = `<button style='padding:5px 10px; font-size:14px;'>正在检测更新...</button>`;
			try {
				await update(true);
				btn.innerHTML = `<button style='padding:5px 10px; font-size:14px;'>更新完成</button>`;
			} catch {
				btn.innerHTML = `<button style='padding:5px 10px; font-size:14px;'>更新失败</button>`;
			}
			setTimeout(() => {
				btn.innerHTML = `<button style='padding:5px 10px; font-size:14px;'>检查更新</button>`;
			}, 2000);
		},
	},
	gfb_yjhj: {
		name: `<font color='#ADFF2F'>阳间环境</font></span>`,
		intro: "只保留鸽府包内比较阳间的武将（类似于手杀环境）",
		init: false,
		onclick: function(bool) {
			if(bool != lib.config.extension_鸽府包_gfb_yjhj){
				game.saveConfig('extension_鸽府包_gfb_yjhj', bool);
				if(confirm('您是否要重启游戏以应用阳间环境的设置？')){
					game.reload();
				}
			};
		},
	},
	gfb_tlfb: {
		name: `<font color='#ADFF2F'>包内武将体力翻倍</font></span>`,
		intro: "鸽府包里的所有武将体力翻倍（默认关闭）",
		init: false,
		onclick: function(bool) {
			if(bool != lib.config.extension_鸽府包_gfb_tlfb){
				game.saveConfig('extension_鸽府包_gfb_tlfb', bool);
				if(confirm('您是否要重启游戏以应用体力翻倍设置？')){
					game.reload();
				}
			};
		},
	},
	gfb_sjpz: {
		name: `<font color='#ADFF2F'>包内武将拼装技能</font></span>`,
		intro: "鸽府包里的所有武将随机拼装并获得一个技能（默认关闭）<br><font color='#ADFF2F'>魏</font></span>：触发器增加“任意角色判定牌生效后”。<br><font color='#ADFF2F'>蜀</font></span>：技能无条件限制，且在发动后额外摸一张牌。<br><font color='#ADFF2F'>吴</font></span>：新增出牌阶段可发动，且出牌阶段和触发器发动每回合各限一次。<br><font color='#ADFF2F'>群</font></span>：额外在mod池获得一个技能（仅群有mod池）。<br><font color='#ADFF2F'>其他</font></span>：在“魏蜀吴群”中随机。",
		init: false,
		onclick: function(bool) {
			if(bool != lib.config.extension_鸽府包_gfb_sjpz){
				game.saveConfig('extension_鸽府包_gfb_sjpz', bool);
				if(confirm('您是否要重启游戏以应用随机获得技能设置？')){
					game.reload();
				}
			};
		},
	},
}
