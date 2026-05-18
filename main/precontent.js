import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import {character} from '../character/index.js';
import {skill} from '../character/skill.js';
import {translate} from '../character/translate.js';
import {} from '../extension/CreateCharacterSkill/createCharacterSkill.js';
import {} from '../extension/Plot/plot.js';
import {} from '../extension/Bgm/bgm.js';
import {} from '../extension/Leaderboard/Leaderboard.js';
import {} from '../extension/Wish/Wish.js';
export async function precontent(config,pack){
	lib.namePrefix.set('A级', {
		showName: 'A',
		color: '#FFFFFF',
		nature: 'icemm',
	});
	lib.namePrefix.set('S级', {
		showName: 'S',
		color: '#1E90FF',
		nature: 'icemm',
	});
	lib.namePrefix.set('SS级', {
		showName: 'SS',
		color: '#BA55D3',
		nature: 'firemm',
	});
	lib.namePrefix.set('SSS级', {
		showName: 'SSS',
		color: '#FF0000',
		textGradient: true,
		nature: 'firemm',
	});
	lib.namePrefix.set('荼家将', {
		showName: '荼',
		color: '#CD5C5C',
		nature: 'firemm',
	});
	lib.namePrefix.set('鸽府', {
		showName: '鸽',
		color: '#FFD700',
		nature: 'icemm',
	});
	lib.namePrefix.set('无职转生', {
		showName: '无',
		color: '#C19A6B',
		nature: 'icemm',
	});
	lib.namePrefix.set('大明王朝', {
		showName: '明',
		color: '#910000',
		textGradient: true,
		nature: 'icemm'
	});
	lib.namePrefix.set('汝家将', {
		showName: '汝',
		color: '#00FF00',
		nature: 'icemm',
	});
	lib.namePrefix.set('欢乐鸽', {
		showName: '乐',
		color: '#1E90FF',
		nature: 'firemm',
	});
	lib.namePrefix.set('鸽杂谈', {
		showName: '杂',
		color: '#A52A2A',
		nature: 'firemm',
	});
	lib.namePrefix.set('赛尔号', {
		showName: '赛',
		color: '#BA55D3',
		nature: 'firemm',
	});
	lib.namePrefix.set('奥奇传说', {
		showName: '奥',
		color: '#BA55D3',
		nature: 'firemm',
	});
	lib.namePrefix.set('公主连结', {
		showName: '公',
		color: '#BA55D3',
		nature: 'firemm',
	});
	lib.namePrefix.set('实验体', {
		showName: '验',
		color: '#F0FFF0',
		nature: 'firemm',
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
			color: '#CD5C5C',
			nature: 'firemm',
		});
		lib.namePrefix.set('鸽府', {
			showName: '鸽',
			color: '#FFD700',
			nature: 'icemm',
		});
		lib.namePrefix.set('无职转生', {
			showName: '无',
			color: '#C19A6B',
			nature: 'icemm',
		});
		lib.namePrefix.set('大明王朝', {
			showName: '明',
			color: '#910000',
			textGradient: true,
			nature: 'icemm'
		});
		lib.namePrefix.set('汝家将', {
			showName: '汝',
			color: '#00FF00',
			nature: 'icemm',
		});
		lib.namePrefix.set('欢乐鸽', {
			showName: '乐',
			color: '#1E90FF',
			nature: 'firemm',
		});
		lib.namePrefix.set('鸽家常', {
			showName: '常',
			color: '#A52A2A',
			nature: 'firemm', 
		});
		lib.namePrefix.set('赛尔号', {
			showName: '赛',
			color: '#BA55D3',
			nature: 'firemm',
		});
		lib.namePrefix.set('奥奇传说', {
			showName: '奥',
			color: '#BA55D3',
			nature: 'firemm',
		});
		lib.namePrefix.set('公主连结', {
			showName: '公',
			color: '#BA55D3',
			nature: 'firemm',
		});
		lib.namePrefix.set('实验体', {
			showName: '验',
			color: '#F0FFF0',
			nature: 'firemm',
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
