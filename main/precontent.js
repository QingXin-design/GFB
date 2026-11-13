import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import {character} from '../character/index.js';
import {skill} from '../character/skill.js';
import {installZgtzHook, installAvatarHook, preloadDecadeAvatar, isZgtzSpineEnabled} from '../extension/SpinePlayer/gugeSpine.js';
import {translate} from '../character/translate.js';
import {} from '../extension/CreateCharacterSkill/createCharacterSkill.js';
import {} from '../extension/Plot/plot.js';
import {} from '../extension/Bgm/bgm.js';
import {} from '../extension/Leaderboard/Leaderboard.js';
import {} from '../extension/Wish/Wish.js';
lib.gfPrefix = (text, c1, c2, c3, c4) => `<span style="font-weight:400;text-shadow:none;color:${c3};background:linear-gradient(180deg,${c1} 0%,${c2} 18%,${c3} 40%,${c4} 58%,#000000 80%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;-webkit-text-stroke:0.4px ${c1}8C">${text}</span>`;
export async function precontent(config,pack){
	if(isZgtzSpineEnabled()){
		installZgtzHook();
		installAvatarHook();
		preloadDecadeAvatar();
	}
	lib.namePrefix.set('A级', {
		showName: 'A',
		getSpan: () => lib.gfPrefix('A', '#FFFFFF', '#E9ECF0', '#B9BFC7', '#5A6068'),
	});
	lib.namePrefix.set('S级', {
		showName: 'S',
		getSpan: () => lib.gfPrefix('S', '#9CD0FF', '#3AA0FF', '#1E90FF', '#0B3D78'),
	});
	lib.namePrefix.set('SS级', {
		showName: 'SS',
		getSpan: () => lib.gfPrefix('SS', '#E7B6F5', '#C86EE0', '#A03FC0', '#4A0F63'),
	});
	lib.namePrefix.set('SSS级', {
		showName: 'SSS',
		getSpan: () => lib.gfPrefix('SSS', '#FF8A8A', '#FF2626', '#D40000', '#5E0000'),
	});
	lib.namePrefix.set('荼家将', {
		showName: '荼',
		getSpan: () => lib.gfPrefix('荼', '#F0A8A8', '#D97070', '#B84A4A', '#4E1414'),
	});
	lib.namePrefix.set('鸽府', {
		showName: '鴿',
		getSpan: () => lib.gfPrefix('鴿', '#FFF3B0', '#FFD700', '#D9A400', '#6B4E00'),
	});
	lib.namePrefix.set('无职转生', {
		showName: '無',
		getSpan: () => lib.gfPrefix('無', '#EBD3B6', '#C19A6B', '#8F6B3D', '#3A2410'),
	});
	lib.namePrefix.set('大明王朝', {
		showName: '明',
		getSpan: () => lib.gfPrefix('明', '#E06A6A', '#C02020', '#910000', '#3A0000'),
	});
	lib.namePrefix.set('朋家将', {
		showName: '朋',
		getSpan: () => lib.gfPrefix('朋', '#7CFF7C', '#17E017', '#00A300', '#004A00'),
	});
	lib.namePrefix.set('欢乐鸽', {
		showName: '樂',
		getSpan: () => lib.gfPrefix('樂', '#8FE9FF', '#00C8FF', '#0090C8', '#00384F'),
	});
	lib.namePrefix.set('鸽杂谈', {
		showName: '雜',
		getSpan: () => lib.gfPrefix('雜', '#FF7A7A', '#FF1F1F', '#C00000', '#5A0000'),
	});
	lib.namePrefix.set('赛尔号', {
		showName: '賽',
		getSpan: () => lib.gfPrefix('賽', '#F0A6E0', '#D24FB0', '#A02880', '#45063A'),
	});
	lib.namePrefix.set('奥奇传说', {
		showName: '奧',
		getSpan: () => lib.gfPrefix('奧', '#C4BAFF', '#7B68EE', '#4A38C0', '#1A0F5C'),
	});
	lib.namePrefix.set('公主连结', {
		showName: '公',
		getSpan: () => lib.gfPrefix('公', '#FFC2DE', '#FF7BB8', '#D64A8E', '#5E0F38'),
	});
	lib.namePrefix.set('实验体', {
		showName: '驗',
		getSpan: () => lib.gfPrefix('驗', '#FFFFFF', '#DFF5E4', '#A8D8B9', '#476B55'),
	});
	lib.namePrefix.set('颠', {
		showName: '顛',
		getSpan: () => lib.gfPrefix('顛', '#FFD08A', '#FF8A2B', '#D96000', '#4E2200'),
	});
	lib.namePrefix.set('蛊真人', {
		showName: '蠱',
		getSpan: () => lib.gfPrefix('蠱', '#A96BE0', '#6A1FB0', '#4B0082', '#1E0033'),
	});
	lib.namePrefix.set('禛感天祚', {
		showName: '禛',
		getSpan: () => lib.gfPrefix('禛', '#FFEFAF', '#FFB800', '#D0481C', '#7A0C12'),
	});
	lib.namePrefix.set('祝你长寿', {
		showName: '祝',
		getSpan: () => `<span style="font-weight:400;text-shadow:none;color:#D8433C;background:linear-gradient(180deg,#D8F8C0 0%,#49C96A 32%,#E8564A 72%,#8E1D18 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">祝</span>`,
	});
    //单向联机
    if(skill)character.skill=skill;
    if(translate){
        for(let key in translate)if(!character.translate[key])character.translate[key]=translate[key];
    };
    delete character.name;
    game.addCharacterPack(character);
    lib.translate.鸽府包_character_config='鸽府包';
    lib.config.鸽府包_characters_enable=true;
    lib.arenaReady.push(function(){
        lib.connectCharacterPack.add('鸽府包');
    });
    if(!_status.postReconnect.gfb_pack) _status.postReconnect.gfb_pack=[function(pack,image){
        lib.translate.鸽府包_character_config='鸽府包';
        lib.characterPack['鸽府包']=pack;
        lib.config.extension_鸽府包_characters_enable=true;
        lib.connectCharacterPack.add('鸽府包');
        lib.config.characters.add('鸽府包');
    },lib.characterPack['鸽府包']];

    if(!_status.postReconnect.gfb_translate) _status.postReconnect.gfb_translate=[function(translates){
        lib.translate.鸽府包_character_config='鸽府包';
        for(let key in translates)lib.translate[key]=translates[key];
    },character.translate];
    if(!_status.postReconnect.gfb_pack_namePrefix) _status.postReconnect.gfb_pack_namePrefix=[function(){
		lib.namePrefix.set('荼家将', {
			showName: '荼',
			getSpan: () => lib.gfPrefix('荼', '#F0A8A8', '#D97070', '#B84A4A', '#4E1414'),
		});
		lib.namePrefix.set('鸽府', {
			showName: '鴿',
			getSpan: () => lib.gfPrefix('鴿', '#FFF3B0', '#FFD700', '#D9A400', '#6B4E00'),
		});
		lib.namePrefix.set('无职转生', {
			showName: '無',
			getSpan: () => lib.gfPrefix('無', '#EBD3B6', '#C19A6B', '#8F6B3D', '#3A2410'),
		});
		lib.namePrefix.set('大明王朝', {
			showName: '明',
			getSpan: () => lib.gfPrefix('明', '#E06A6A', '#C02020', '#910000', '#3A0000'),
		});
		lib.namePrefix.set('朋家将', {
			showName: '朋',
			getSpan: () => lib.gfPrefix('朋', '#7CFF7C', '#17E017', '#00A300', '#004A00'),
		});
		lib.namePrefix.set('欢乐鸽', {
			showName: '樂',
			getSpan: () => lib.gfPrefix('樂', '#8FE9FF', '#00C8FF', '#0090C8', '#00384F'),
		});
		lib.namePrefix.set('鸽杂谈', {
			showName: '雜',
			getSpan: () => lib.gfPrefix('雜', '#FF7A7A', '#FF1F1F', '#C00000', '#5A0000'),
		});
		lib.namePrefix.set('赛尔号', {
			showName: '賽',
			getSpan: () => lib.gfPrefix('賽', '#F0A6E0', '#D24FB0', '#A02880', '#45063A'),
		});
		lib.namePrefix.set('奥奇传说', {
			showName: '奧',
			getSpan: () => lib.gfPrefix('奧', '#C4BAFF', '#7B68EE', '#4A38C0', '#1A0F5C'),
		});
		lib.namePrefix.set('公主连结', {
			showName: '公',
			getSpan: () => lib.gfPrefix('公', '#FFC2DE', '#FF7BB8', '#D64A8E', '#5E0F38'),
		});
		lib.namePrefix.set('实验体', {
			showName: '驗',
			getSpan: () => lib.gfPrefix('驗', '#FFFFFF', '#DFF5E4', '#A8D8B9', '#476B55'),
		});
		lib.namePrefix.set('颠', {
			showName: '顛',
			getSpan: () => lib.gfPrefix('顛', '#FFD08A', '#FF8A2B', '#D96000', '#4E2200'),
		});
		lib.namePrefix.set('蛊真人', {
			showName: '蠱',
			getSpan: () => lib.gfPrefix('蠱', '#A96BE0', '#6A1FB0', '#4B0082', '#1E0033'),
		});
		lib.namePrefix.set('禛', {
			showName: '禛',
			getSpan: () => lib.gfPrefix('禛', '#FFEFAF', '#FFB800', '#D0481C', '#7A0C12'),
		});
		lib.namePrefix.set('祝你长寿', {
			showName: '壽',
			getSpan: () => `<span style="font-weight:400;text-shadow:none;color:#D8433C;background:linear-gradient(180deg,#D8F8C0 0%,#49C96A 32%,#E8564A 72%,#8E1D18 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">壽</span>`,
		});
    },[]];
    lib.element.content.waitForPlayer=function(){
        'step 0'
        ui.auto.hide();
        ui.pause.hide();
        game.createServer();
        if(!lib.translate.zhu){
            lib.translate.zhu='主';
        };
        if(event.func){
            event.func();
        };
        if(!lib.configOL.number){
            lib.configOL.number=parseInt(lib.configOL.player_number);
        };
        if(game.onlineroom){
            game.send('server','config',lib.configOL);
        };
        ui.create.connectPlayers(game.ip);
        if(!window.isNonameServer){
            var me=game.connectPlayers[0];
            me.setIdentity('zhu');
            me.initOL(get.connectNickname(),lib.config.connect_avatar);
            me.playerid='1';
            game.onlinezhu='1';
        };
        _status.waitingForPlayer=true;
        if(window.isNonameServer){
            document.querySelector('#server_status').innerHTML='等待中';
        };
        game.pause();
        'step 1'
        _status.waitingForPlayer=false;
        lib.configOL.gameStarted=true;
        if(window.isNonameServer){
            document.querySelector('#server_status').innerHTML='游戏中';
        };
        if(game.onlineroom){
            game.send('server','config',lib.configOL);
        };
        for(var i=0;i<game.connectPlayers.length;i++){
            game.connectPlayers[i].delete();
        };
        delete game.connectPlayers;
        if(ui.roomInfo){
            ui.roomInfo.remove();
            delete ui.roomInfo;
        };
        if(ui.exitroom){
            ui.exitroom.remove();
            delete ui.exitroom;
        };
        game.broadcast(function(postReconnect,pack){
            postReconnect=get.parsedResult(postReconnect);
            for(var i in postReconnect){
                if(Array.isArray(postReconnect[i])){
                    postReconnect[i].shift().apply(this,postReconnect[i]);
                };
            };
        },_status.postReconnect);
        game.broadcast('gameStart');
        game.delay(2);
        ui.auto.show();
        ui.pause.show();
        if(lib.config.show_cardpile){
            ui.cardPileButton.style.display='';
        };
    };
}
