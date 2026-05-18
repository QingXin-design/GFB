import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import update from '../main/update.js';
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
				var more = ui.create.div('.help', '<div style="border:2px solid gray"><P align=left>' + log.join('<br>') + '</P>');
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
	info_update: {
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

					`<span class=thundertext>===汝家将===</span>`,
					`·<font color='#00FF00'>汝张春华</font>`,
					`·<font color='#00FF00'>汝孙茹</font>`,
					`·<font color='#00FF00'>汝吕蒙</font>`,
					
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

				];
				var more = ui.create.div('.help', '<div style="border:2px solid gray"><P align=left>' + log.join('<br>') + '</P>');
				this.parentNode.insertBefore(more, this.nextSibling);
				this.help = more;
				this.innerHTML = `<span>武将分类</span><font color='#ADFF2F'> （点击收起）</font></span>`;
			} else {
				this.parentNode.removeChild(this.help);
				delete this.help;
				this.innerHTML = `<span>武将分类</span><font color='#ADFF2F'> ==>点击展开＜==</font></span>`;
			};
		},
	},
    gfb_slb:{
        name:`<span style='text-decoration:underline;'>胜率排行榜</span>`,
    	clear:true,
    	onclick:function(){
    		game.gfb_slb();
    	}
    },
	check_update: {
		name: `<button style='padding:5px 10px; font-size:14px;'>检测更新</button>`,
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
		}
	},
	gfb_zxgx: {
          name: `<font color="#ADFF2F">自动检测更新`,
          init: false,
          intro: "启动游戏时自动检查更新（需联网）",
		  onclick: function(bool) {
			if(bool != lib.config.extension_鸽府包_gfb_zxgx){
				game.saveConfig('extension_鸽府包_gfb_zxgx', bool);
			};
		}
    },
	gfb_ltcd: {
		name: `<font color='#ADFF2F'>自动关闭聊天框</font></span>`,
		intro: "已修复了电脑联机聊天输入中文关闭聊天框的问题，开启此功能后发送完消息自动关闭聊天框（注：电脑端聊天不要点输入框，想打什么直接打）",
		init: false,
		onclick: function(bool) {
			if(bool != lib.config.extension_鸽府包_gfb_ltcd){
				game.saveConfig('extension_鸽府包_gfb_ltcd', bool);
			};
		},
	},
	gfb_hdcd: {
		name: `<font color='#ADFF2F'>自动关闭互动表情</font></span>`,
		intro: "开启此功能后砸蛋、送花后会自动关闭页面，和原版一样",
		init: false,
		onclick: function(bool) {
			if(bool != lib.config.extension_鸽府包_gfb_hdcd){
				game.saveConfig('extension_鸽府包_gfb_hdcd', bool);
			};
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
	gfb_consoleClear: {
		name: `<font color='#ADFF2F'>清日志</font></span>`,
		intro: "开启后游戏开始前将不再清空历史日志（加载扩展时会产出各种乱七八糟的日志）",
		init: false,
		onclick: function(bool) {
			if(bool != lib.config.extension_鸽府包_gfb_consoleClear){
				game.saveConfig('extension_鸽府包_gfb_consoleClear', bool);
			};
		},
	},
	gfb_logBan: {
		name: `<font color='#ADFF2F'>禁log日志</font></span>`,
		intro: "开启后会禁用console.log形式的日志提示",
		init: false,
		onclick: function(bool) {
			if(bool != lib.config.extension_鸽府包_gfb_logBan){
				game.saveConfig('extension_鸽府包_gfb_logBan', bool);
				if(confirm('您是否要重启游戏以应用禁console.log形式的日志提示设置？')){
					game.reload();
				}
			};
		},
	},
	gfb_ljqy: {
		name:`<span style='text-decoration:underline;'>联机祈愿</span>`,
    	clear:true,
    	onclick:function(){
    		game.gfb_ljqy();
    	}
	},
}
