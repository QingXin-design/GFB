import {lib,game,ui,get,ai,_status} from '../../../../noname.js';
import { gflib } from '../../main/gflib.js';

// 框架取自《点绛唇》，我主要针对联机胜率统计、搜索卡死、胜率默认排行等方面做了一些修改 OwO
gflib(lib, game, ui, get, ai, _status, '鸽府包');
lib.init.css(lib.assetURL + 'extension/鸽府包/extension/Leaderboard', 'Leaderboard');
if (!window.SyncModule && gflib?.SyncModule) {
    window.SyncModule = gflib.SyncModule;
}
window.SyncModule.init();
lib.onover.push(function(bool) {
    const addToWinner = character => {
        winner.push(character.name1);
        if (character.name2) winner.push(character.name2);
    };
    const processCharacters = characters => {
        characters.forEach(character => addToWinner(character));
    };
    // 初始化玩家总战绩
    if (!lib.config.extension_鸽府包_winner_player) {
        game.saveConfig('extension_鸽府包_winner_player', { changci: 0, shengchang: 0, pingju: 0 });
    }
    // 确保总战绩字段不为null
    lib.config.extension_鸽府包_winner_player.changci = Number(lib.config.extension_鸽府包_winner_player.changci) || 0;
    lib.config.extension_鸽府包_winner_player.shengchang = Number(lib.config.extension_鸽府包_winner_player.shengchang) || 0;
    lib.config.extension_鸽府包_winner_player.pingju = Number(lib.config.extension_鸽府包_winner_player.pingju) || 0;
    // 初始化连胜数据
    if (!lib.config.extension_鸽府包_qysy) {
        game.saveConfig('extension_鸽府包_qysy', { win: 0, lose: 0 });
    }
    const playerHeroMap = {};
    const currentUid = window.SyncModule.utils.getNickname();
    game.filterPlayer2(player => {
        const playerUid = _status.connectMode ? (player.nickname || currentUid) : 'local_player';
        playerHeroMap[playerUid] = get.nameList(player);
    });
    // 胜负判定
    const winner = [];
    const zhu = game.zhu;
    if (zhu) {
        if (zhu.isAlive()) {
            addToWinner(zhu);
            processCharacters(zhu.getFriends(null, true));
        } else {
            const nei = game.filterPlayer2(p => !p.getFriends(null, true).length);
            const hasOther = game.filterPlayer(p => !nei.includes(p) && p !== zhu).length;
            if (nei.length) {
                if (!hasOther) {
                    processCharacters(nei.filter(p => p.isAlive()));
                } else {
                    processCharacters(zhu.getEnemies(null, true).filter(p => !nei.includes(p)));
                }
            } else {
                processCharacters(zhu.getEnemies(null, true));
            }
        }
    } else {
        if (bool === true) {
            addToWinner(game.me);
            processCharacters(game.me.getFriends(null, true));
        } else if (bool === false) {
            const alive = game.filterPlayer();
            const target = alive.length === 1 ? alive[0] : alive[0].getEnemies(null, false).length ? game.me : alive[0];
            addToWinner(target);
            processCharacters(target.getFriends(null, true));
        }
    }
    // 单机通过game.me判断，不依赖UID
    let isMyWin = false;
    let isPingju = bool !== true && bool !== false;
    if (!_status.connectMode) {
        const myHeroes = get.nameList(game.me) || [];
        isMyWin = myHeroes.some(hero => winner.includes(hero));
    } else {
        const myHeroes = playerHeroMap[currentUid] || [];
        isMyWin = myHeroes.some(hero => winner.includes(hero));
    }
    lib.config.extension_鸽府包_winner_player.changci = (lib.config.extension_鸽府包_winner_player.changci || 0) + 1;
    if (isMyWin) {
        lib.config.extension_鸽府包_winner_player.shengchang = (lib.config.extension_鸽府包_winner_player.shengchang || 0) + 1;
    } else if (isPingju) {
        lib.config.extension_鸽府包_winner_player.pingju = (lib.config.extension_鸽府包_winner_player.pingju || 0) + 1;
    }
    game.saveConfig('extension_鸽府包_winner_player', lib.config.extension_鸽府包_winner_player);
    const modeType = _status.connectMode ? 'connect' : (lib.config.all.mode.find(mode => lib.configOL[mode + '_mode'] || (mode !== 'connect' && lib.config.mode === mode) ) || 'single');
    if (!lib.config.extension_鸽府包_winner) {
        lib.config.extension_鸽府包_winner = {};
    }
    if (!lib.config.extension_鸽府包_winner[modeType]) {
        lib.config.extension_鸽府包_winner[modeType] = {};
    }
    // 所有武将战绩
    game.filterPlayer2(player => {
        const isMe = player === game.me;
        const playerHeroes = get.nameList(player);
        playerHeroes.forEach(hero => {
            if (!lib.config.extension_鸽府包_winner[modeType][hero]) {
                lib.config.extension_鸽府包_winner[modeType][hero] = {
                    changci: 0, shengchang: 0, pingju: 0,
                    mechangci: 0, meshengchang: 0, mepingju: 0
                };
            }
            const heroData = lib.config.extension_鸽府包_winner[modeType][hero];
            heroData.changci = Number(heroData.changci) || 0;
            heroData.shengchang = Number(heroData.shengchang) || 0;
            heroData.pingju = Number(heroData.pingju) || 0;
            heroData.mechangci = Number(heroData.mechangci) || 0;
            heroData.meshengchang = Number(heroData.meshengchang) || 0;
            heroData.mepingju = Number(heroData.mepingju) || 0;
            heroData.changci = heroData.changci + 1;
            if (winner.includes(hero)) {
                heroData.shengchang = heroData.shengchang + 1;
            } else if (isPingju) {
                heroData.pingju = heroData.pingju + 1;
            }
            if (isMe) {
                heroData.mechangci += 1;
                if (isMyWin) {
                    heroData.meshengchang += 1;
                } else if (isPingju) {
                    heroData.mepingju += 1;
                }

                // 连胜/连败逻辑（联机可同步）
                const qysy = lib.config.extension_鸽府包_qysy;
                if (isMyWin) {
                    qysy.win = Math.min(qysy.win + 1, 2);
                    qysy.lose = 0;
                } else if (isPingju) {
                    qysy.win = 0;
                    qysy.lose = 0;
                } else {
                    qysy.lose = Math.min(qysy.lose + 1, 2);
                    qysy.win = 0;
                }
                game.saveConfig('extension_鸽府包_qysy', qysy);
            }
        });
    });
    game.saveConfig('extension_鸽府包_winner', lib.config.extension_鸽府包_winner);
    if (_status.connectMode) {
        const isHost = !!game?.isHost || game?.hostId === currentUid || currentUid.includes('host');
        const globalSyncData = {
            isHost, hostUid: currentUid, winnerList: winner, playerHeroMap,
            selfData: {
                playerUid: currentUid,
                playerData: lib.config.extension_鸽府包_winner_player,
                connectWinnerData: lib.config.extension_鸽府包_winner.connect || {},
                qysyData: lib.config.extension_鸽府包_qysy || { win:0, lose:0 }
            }
        };
        game.broadcastAll(function(data) {
            window.clskDataMap = window.clskDataMap || Object.create(null);
            const localUid = window.SyncModule.utils.getNickname();
            if (!data.isHost && localUid !== data.hostUid) {
                const localHeroes = data.playerHeroMap[localUid] || [];
                const localIsWin = localHeroes.some(hero => data.winnerList.includes(hero));
                const localIsPingju = data.winnerList.length === 0;
                lib.config.extension_鸽府包_winner_player.changci = (lib.config.extension_鸽府包_winner_player.changci || 0) + 1;
                if (localIsWin) {
                    lib.config.extension_鸽府包_winner_player.shengchang = (lib.config.extension_鸽府包_winner_player.shengchang || 0) + 1;
                }
                game.saveConfig('extension_鸽府包_winner_player', lib.config.extension_鸽府包_winner_player);
                const localModeType = 'connect';
                if (!lib.config.extension_鸽府包_winner[localModeType]) {
                    lib.config.extension_鸽府包_winner[localModeType] = {};
                }
                for (const uid in data.playerHeroMap) {
                    data.playerHeroMap[uid].forEach(hero => {
                        if (!lib.config.extension_鸽府包_winner[localModeType][hero]) {
                            lib.config.extension_鸽府包_winner[localModeType][hero] = {
                                changci:0, shengchang:0, pingju:0, mechangci:0, meshengchang:0, mepingju:0
                            };
                        }
                        const hd = lib.config.extension_鸽府包_winner[localModeType][hero];
                        hd.changci = Number(hd.changci) || 0;
                        hd.shengchang = Number(hd.shengchang) || 0;
                        hd.mechangci = Number(hd.mechangci) || 0;
                        hd.meshengchang = Number(hd.meshengchang) || 0;
                        hd.changci += 1;
                        if (data.winnerList.includes(hero)) hd.shengchang += 1;
                        if (uid === localUid) {
                            hd.mechangci += 1;
                            if (localIsWin) hd.meshengchang += 1;
                            if (localIsPingju) hd.mepingju += 1;
                        }
                    });
                }
                game.saveConfig('extension_鸽府包_winner', lib.config.extension_鸽府包_winner);
                // 连胜统计
                const localQysy = lib.config.extension_鸽府包_qysy || { win:0, lose:0 };
                if (localIsWin) {
                    localQysy.win = localQysy.win + 1
                    //localQysy.win = Math.min(localQysy.win + 1, 2);
                    localQysy.lose = 0;
                } else if (localIsPingju) {
                    localQysy.win = 0;
                    localQysy.lose = 0;
                } else {
                    localQysy.lose = localQysy.lose + 1
                    //localQysy.lose = Math.min(localQysy.lose + 1, 2);
                    localQysy.win = 0;
                }
                lib.config.extension_鸽府包_qysy = localQysy;
                game.saveConfig('extension_鸽府包_qysy', localQysy);
            }
            const syncUid = data.selfData.playerUid;
            window.clskDataMap[syncUid] = window.clskDataMap[syncUid] || {};
            window.clskDataMap[syncUid].winnerPlayer = data.selfData.playerData;
            window.clskDataMap[syncUid].winnerConnect = data.selfData.connectWinnerData;
            window.clskDataMap[syncUid].qysy = data.selfData.qysyData;

            if (syncUid === localUid) {
                lib.config.extension_鸽府包_winner_player = data.selfData.playerData;
                lib.config.extension_鸽府包_winner.connect = data.selfData.connectWinnerData;
                lib.config.extension_鸽府包_qysy = data.selfData.qysyData;
                game.saveConfig('extension_鸽府包_winner_player', data.selfData.playerData);
                game.saveConfig('extension_鸽府包_winner', lib.config.extension_鸽府包_winner);
                game.saveConfig('extension_鸽府包_qysy', data.selfData.qysyData);
            }
        }, globalSyncData);
    } else {
        game.saveConfig('extension_鸽府包_winner_player', lib.config.extension_鸽府包_winner_player);
        game.saveConfig('extension_鸽府包_winner', lib.config.extension_鸽府包_winner);
        game.saveConfig('extension_鸽府包_qysy', lib.config.extension_鸽府包_qysy);
    }
});

game.winInit=function(){
    let allPackList = lib.config.all.characters.slice(0);
    allPackList.addArray(Object.keys(lib.characterPack));
    game.saveConfig('extension_鸽府包_winner',{});
    game.saveConfig('extension_鸽府包_winner_player',{changci:0,shengchang:0, pingju:0});
    game.saveConfig('extension_鸽府包_qysy', { win:0, lose:0 });
    const allModes = [...lib.config.all.mode, 'single'];
    for (let mode of allModes) {
        lib.config['extension_鸽府包_winner'][mode]={};
        for(let name of allPackList){
            for(let character in lib.characterPack[name]){
                lib.config['extension_鸽府包_winner'][mode][character] = {
                    changci: 0,
                    shengchang: 0,
                    pingju: 0,
                    mechangci: 0,
                    meshengchang: 0,
                    mepingju: 0
                };
            };
        };
    };
    lib.config.extension_鸽府包_winner = lib.config.extension_鸽府包_winner || {};
    game.saveConfig('extension_鸽府包_winner',lib.config['extension_鸽府包_winner']);
};

game.gfb_slb=function(){
    function debounce(func, delay = 200) {
        let timer = null;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    }
    const modeType = _status.connectMode ? 'connect': (lib.config.all.mode.find(mode => lib.configOL[mode+'_mode'] || mode!='connect'&&lib.config.mode === mode) || 'single');
    _status.sortOrder=false;
    _status.sortBy='总场次';
    _status.zhanjiMode=modeType;
    _status.showPlayerStats=false;
    if(!lib.config.extension_鸽府包_winner_player){
        game.saveConfig('extension_鸽府包_winner_player',{changci:0,shengchang:0, pingju:0});
    }
    if(!lib.config.extension_鸽府包_qysy){
        game.saveConfig('extension_鸽府包_qysy', { win:0, lose:0 });
    }
    lib.config.extension_鸽府包_winner_player.changci = Number(lib.config.extension_鸽府包_winner_player.changci) || 0;
    lib.config.extension_鸽府包_winner_player.shengchang = Number(lib.config.extension_鸽府包_winner_player.shengchang) || 0;
    lib.config.extension_鸽府包_winner_player.pingju = Number(lib.config.extension_鸽府包_winner_player.pingju) || 0;
    game.pause2();
    const LeaderboardBg = ui.create.div(document.body, '.LeaderboardBg');
    const LeaderboardBgHide=ui.create.div('.LeaderboardBgHide',LeaderboardBg);
    ui.create.div('.close',LeaderboardBgHide,function(){
        LeaderboardBg.delete();
        game.resume2();
    });
    const leftBg=ui.create.div('.leftBg',LeaderboardBgHide);
    const rightBg=ui.create.div('.rightBg',LeaderboardBgHide);
    const myUid = window.SyncModule.utils.getNickname();
    const mapPlayerData = window.clskDataMap?.[myUid]?.winnerPlayer || {};
    const myQysy = window.clskDataMap?.[myUid]?.qysy || lib.config.extension_鸽府包_qysy || { win:0, lose:0 };
    const myWinnerData = {
        changci: Number(mapPlayerData.changci) || lib.config.extension_鸽府包_winner_player.changci || 0,
        shengchang: Number(mapPlayerData.shengchang) || lib.config.extension_鸽府包_winner_player.shengchang || 0,
        pingju: Number(mapPlayerData.pingju) || lib.config.extension_鸽府包_winner_player.pingju || 0
    };
    let lianStr = '';
    if(myQysy.win > 0) lianStr = `【${myQysy.win}连胜】`;
    else if(myQysy.lose > 0) lianStr = `【${myQysy.lose}连败】`;
    const headText = _status.connectMode ? `联机（${myUid}）${lianStr}` : `单机 ${lianStr}`;
    const head=ui.create.div('.modeText', headText, LeaderboardBgHide);
    const playHead=ui.create.div('.playHead',
        _status.connectMode ? `玩家[${myUid}]总场次：${myWinnerData.changci}  总胜场：${myWinnerData.shengchang}` : `总场次：${myWinnerData.changci}  总胜场：${myWinnerData.shengchang}`,
        LeaderboardBgHide
    );
    let showOtherPlayers = false;
    const otherPlayerBtn = _status.connectMode ? ui.create.div('.playerStatsBtn', '查看其他玩家', LeaderboardBgHide, function() {
        showOtherPlayers = !showOtherPlayers;
        this.classList.toggle('active', showOtherPlayers);
        createCharacter(_status.zhanjiMode, _status.sortBy, _status.sortOrder);
    }) : null;
    const playerStatsBtn = ui.create.div('.playerStatsBtn', '仅查看自己',LeaderboardBgHide, function() {
        _status.showPlayerStats = !_status.showPlayerStats;
        this.classList.toggle('active', _status.showPlayerStats);
        createCharacter(_status.zhanjiMode, _status.sortBy, _status.sortOrder);
    });
    playerStatsBtn.classList.toggle('active', _status.showPlayerStats);
    let shuru = null;
    let debouncedCreateCharacter;
    const sousuo = ui.create.div('.sousuo', LeaderboardBgHide, function(event) {
        event.stopPropagation();
        event.preventDefault();
        if (!shuru) {
            shuru = document.createElement('input');
            shuru.type = 'text';
            shuru.className = 'sousuoInput';
            shuru.placeholder = '输入武将名搜索';
            shuru.style.position = 'absolute';
            shuru.style.zIndex = 9999;
            shuru.style.padding = '5px';
            shuru.style.border = '1px solid #ccc';
            ui.window.appendChild(shuru);
            shuru.addEventListener('input', function() {
                const inputValue = shuru.value.trim();
                if (inputValue) {
                    debouncedCreateCharacter(_status.zhanjiMode, _status.sortBy, _status.sortOrder, inputValue);
                } else {
                    debouncedCreateCharacter(_status.zhanjiMode, _status.sortBy, _status.sortOrder);
                }
            });
            const closeInput = function(e) {
                if (shuru.style.display === 'block' && !shuru.contains(e.target) && e.target !== sousuo) {
                    shuru.style.display = 'none';
                    document.removeEventListener('mousedown', closeInput);
                }
            };
            document.addEventListener('mousedown', closeInput);
        }
        shuru.style.display = 'block';
        setTimeout(() => shuru.focus(), 50);
    });
    document.addEventListener('keydown', function(event) {
        if (shuru && shuru.style.display === 'block' && event.key === 'Enter') {
            let inputValue = shuru.value.trim();
            if (inputValue) debouncedCreateCharacter(_status.zhanjiMode,_status.sortBy,_status.sortOrder,inputValue);
            shuru.value = '';
            shuru.style.display = 'none';
        };
    });
    ui.create.div('.dataLbtn',LeaderboardBgHide,function(){
        const dataBg = ui.create.div(document.body, '.dataBg',function(){
            dataBg.delete();
        });
        const dataImage = ui.create.div('.dataImage', dataBg);
        const dataLbtns = ui.create.div('.dataLbtns', dataImage);
        const daoru=ui.create.div('.lbtn',dataLbtns,function(){
            const url = 'extension/鸽府包/extension/Leaderboard/rank';
            const dataBg = ui.create.div(document.body, '.dataBg', function(event) {
                if (event.target === dataBg) dataBg.delete();
            });
            const dataChooseBg = ui.create.div('.dataChooseBg', dataBg);
            ui.create.div('.text', '选择你要导入的数据', dataChooseBg);
            const removedataBg = ui.create.div('.dataBigBg', dataChooseBg);
            let num = 1;
            game.getFileList(url, function(folders, rank) {
                if (!rank.length) {
                    alert('extension/鸽府包/extension/Leaderboard/rank/  路径下无文件');
                    dataBg.delete();
                    return;
                };
                for (let name of rank) {
                    const fileName = name.split('.')[0];
                    const node = ui.create.div('.dataBtn', removedataBg, function(event) {
                        if (confirm('是否导入：' + fileName + '  的数据？')) game.readFileAsText('extension/鸽府包/extension/Leaderboard/rank/' + name, function(data) {
                            let obj;
                            try {
                                obj = JSON.parse(data);
                            } catch(e) {
                                console.error("解析错误：",e);
                                alert('文件格式错误，无法解析JSON');
                                return;
                            }
                            if (obj && obj.data && typeof obj.data === 'object'&&obj.player_winner && typeof obj.player_winner === 'object') {
                                const playerData = {
                                    changci: Number(obj.player_winner.changci) || 0,
                                    shengchang: Number(obj.player_winner.shengchang) || 0,
                                    pingju: Number(obj.player_winner.pingju) || 0
                                };
                                game.saveConfig('extension_鸽府包_winner',obj.data);
                                game.saveConfig('extension_鸽府包_winner_player',playerData);
                                if(obj.qysy){
                                    game.saveConfig('extension_鸽府包_qysy', obj.qysy);
                                }
                                createCharacter(_status.zhanjiMode,_status.sortBy,_status.sortOrder);
                                alert('导入成功！');
                            } else {
                                alert('读取失败，文件格式必须是包含data及player_winner对象属性的对象');
                            }
                        });
                    });
                    ui.create.div('.text', fileName, node);
                };
            }, function() {
                if (num == 1) alert('请检查文件夹extension/鸽府包/extension/Leaderboard/rank是否存在');
                num++;
                dataBg.delete();
            });
        });
        ui.create.div('.text','导入数据',daoru);
        const mergeBtn = ui.create.div('.lbtn', dataLbtns, function() {
            const url = 'extension/鸽府包/extension/Leaderboard/rank';
            const dataBg = ui.create.div(document.body, '.dataBg', function(event) {
                if (event.target === dataBg) dataBg.delete();
            });
            const dataChooseBg = ui.create.div('.dataChooseBg', dataBg);
            ui.create.div('.text', '选择要合并的数据文件', dataChooseBg);
            const removedataBg = ui.create.div('.dataBigBg', dataChooseBg);
            let num = 1;
            game.getFileList(url, function(folders, rank) {
                if (!rank.length) {
                    alert('extension/鸽府包/extension/Leaderboard/rank路径下无文件');
                    dataBg.delete();
                    return;
                };
                for (let name of rank) {
                    const fileName = name.split('.')[0];
                    const node = ui.create.div('.dataBtn', removedataBg, function(event) {
                        if (confirm('是否合并：' + fileName + ' 的数据？')) game.readFileAsText('extension/鸽府包/extension/Leaderboard/rank/' + name, function(data) {
                            let obj;
                            try {
                                obj = JSON.parse(data);
                            } catch(e) {
                                console.error("解析错误：",e);
                                alert('文件格式错误，无法解析JSON');
                                return;
                            }
                            if (obj && obj.data && typeof obj.data === 'object' && obj.player_winner && typeof obj.player_winner === 'object') {
                                lib.config.extension_鸽府包_winner_player.changci += Number(obj.player_winner.changci) || 0;
                                lib.config.extension_鸽府包_winner_player.shengchang += Number(obj.player_winner.shengchang) || 0;
                                lib.config.extension_鸽府包_winner_player.pingju += Number(obj.player_winner.pingju) || 0;
                                if(obj.qysy){
                                    lib.config.extension_鸽府包_qysy.win += obj.qysy.win || 0;
                                    lib.config.extension_鸽府包_qysy.lose += obj.qysy.lose || 0;
                                    game.saveConfig('extension_鸽府包_qysy', lib.config.extension_鸽府包_qysy);
                                }
                                for (let mode in obj.data) {
                                    if (!lib.config.extension_鸽府包_winner[mode]) {
                                        lib.config.extension_鸽府包_winner[mode] = {};
                                    }
                                    for (let char in obj.data[mode]) {
                                        if (!lib.config.extension_鸽府包_winner[mode][char]) {
                                            lib.config.extension_鸽府包_winner[mode][char] = {
                                                changci: 0, shengchang: 0, pingju: 0, mechangci: 0, meshengchang: 0, mepingju: 0
                                            };
                                        }
                                        const target = lib.config.extension_鸽府包_winner[mode][char];
                                        const source = obj.data[mode][char];
                                        target.changci += Number(source.changci) || 0;
                                        target.shengchang += Number(source.shengchang) || 0;
                                        target.pingju += Number(source.pingju) || 0;
                                        target.mechangci += Number(source.mechangci) || 0;
                                        target.meshengchang += Number(source.meshengchang) || 0;
                                        target.mepingju += Number(source.mepingju) || 0;
                                    }
                                }
                                game.saveConfig('extension_鸽府包_winner_player', lib.config.extension_鸽府包_winner_player);
                                game.saveConfig('extension_鸽府包_winner', lib.config.extension_鸽府包_winner);
                                createCharacter(_status.zhanjiMode,_status.sortBy,_status.sortOrder);
                                alert('合并成功！');
                            } else {
                                alert('文件格式必须包含data及player_winner对象');
                            }
                        });
                    });
                    ui.create.div('.text', fileName, node);
                };
            }, function() {
                if (num == 1) alert('请检查文件夹extension/鸽府包/extension/Leaderboard/rank是否存在');
                num++;
                dataBg.delete();
            });
        });
        ui.create.div('.text','合并数据',mergeBtn);
        const daochu = ui.create.div('.lbtn', dataLbtns, function () {
            const url = 'extension/鸽府包/extension/Leaderboard/rank';
            if (confirm('是否导出战绩数据至路径：' + url + '/')) {
                const now = new Date();
                const timestamp = [
                    now.getFullYear(),
                    String(now.getMonth() + 1).padStart(2, '0'),
                    String(now.getDate()).padStart(2, '0'),
                ].join('') + '_' + [
                    String(now.getHours()).padStart(2, '0'),
                    String(now.getMinutes()).padStart(2, '0'),
                    String(now.getSeconds()).padStart(2, '0')
                ].join('');
                const nickname = _status.connectMode ? (myUid || '联机玩家') : '单机玩家';
                const safeNickname = nickname.replace(/[\\/:*?"<>|]/g, '');
                const filename = `${safeNickname}_战绩数据_${timestamp}.json`;
                const exportData = {
                    player: nickname,
                    timestamp: now.toISOString(),
                    player_winner: lib.config.extension_鸽府包_winner_player,
                    qysy: lib.config.extension_鸽府包_qysy,
                    data: lib.config['extension_鸽府包_winner']
                };
                let num = 1;
                game.writeFile(JSON.stringify(exportData, null, 4), url, filename, () => {
                    if (num === 1) alert(`已保存至：${url}/${filename}`);
                    num++;
                });
            }
        });
        ui.create.div('.text', '导出数据', daochu);
        const shanchu=ui.create.div('.lbtn',dataLbtns,function(){
            if (confirm('是否清空所有战绩数据？（建议先导出备份）')){
                game.saveConfig('extension_鸽府包_winner',{});
                game.saveConfig('extension_鸽府包_qysy', { win:0, lose:0 });
                game.winInit();
                createCharacter(_status.zhanjiMode,_status.sortBy,_status.sortOrder);
                alert('数据已清空！');
            };
        });
        ui.create.div('.text','清空数据',shanchu);
    });
    const rightTop=ui.create.div('.rightTop',LeaderboardBgHide);
    const wjTop=ui.create.div('.wjTop','武将',rightTop);
    const textBg=ui.create.div('.textBg',rightTop)
    for (let name of ['总场次', '胜场', '胜率', '败场', '平局']) {
        const div = ui.create.div('.text', textBg);
        const textSpan = document.createElement('span');
        textSpan.textContent = name;
        const arrow = document.createElement('span');
        arrow.className = 'sort-arrow';
        arrow.innerHTML = '▼';
        div.append(textSpan, arrow);
        if (name === _status.sortBy) {
            arrow.classList.toggle('active', _status.sortOrder);
        }
        div.onclick = () => {
            const isSameField = name === _status.sortBy;
            _status.sortBy = name;
            _status.sortOrder = isSameField ? !_status.sortOrder : false;
            document.querySelectorAll('.sort-arrow').forEach(arr => arr.classList.remove('active'));
            arrow.classList.toggle('active', _status.sortOrder);
            createCharacter(_status.zhanjiMode, name, _status.sortOrder,_status.winnerNames);
        };
    }

    function createCharacter(mode, sortBy = '总场次', sortOrder, name) {
        _status.zhanjiMode=mode;
        _status.sortBy=sortBy;
        _status.sortOrder=sortOrder;
        if(name)_status.winnerNames=name;
        else delete _status.winnerNames;
        rightBg.innerHTML = '';
        const myQysy = window.clskDataMap?.[myUid]?.qysy || lib.config.extension_鸽府包_qysy || { win:0, lose:0 };
        let lianStr = '';
        if(myQysy.win > 0) lianStr = `【${myQysy.win}连胜】`;
        else if(myQysy.lose > 0) lianStr = `【${myQysy.lose}连败】`;
        head.innerHTML = _status.connectMode ? `联机（${myUid}）${lianStr}` : `单机 ${lianStr}`;
        playHead.innerHTML = `总场次：${myWinnerData.changci}  总胜场：${myWinnerData.shengchang}`;
        const charactersData = [];
        const targetModeData = lib.config.extension_鸽府包_winner[mode] || {};
        // const MAX_RENDER = 100;
        // let renderCount = 0;
        if (_status.connectMode && showOtherPlayers) {
            for (let uid in window.clskDataMap) {
                // if (renderCount >= MAX_RENDER) break;
                const playerWinnerData = window.clskDataMap[uid]?.winnerConnect || {};
                const userQysy = window.clskDataMap[uid]?.qysy || { win:0, lose:0 };
                for (let character in playerWinnerData) {
                    // if (renderCount >= MAX_RENDER) break;
                    const data = playerWinnerData[character];
                    if (!data) continue;
                    const changci = _status.showPlayerStats ? (Number(data.mechangci) || 0) : (Number(data.changci) || 0);
                    const shengchang = _status.showPlayerStats ? (Number(data.meshengchang) || 0) : (Number(data.shengchang) || 0);
                    const pingju = _status.showPlayerStats ? (Number(data.mepingju) || 0) : (Number(data.pingju) || 0);
                    const shenglv = changci === 0 ? 0 : ((shengchang / changci) * 100);
                    const baichang = changci - shengchang - pingju || 0;
                    let lianTag = '';
                    if(userQysy.win>0)lianTag=`【${userQysy.win}连胜】`;
                    else if(userQysy.lose>0)lianTag=`【${userQysy.lose}连败】`;
                    if(name){
                        if ((lib.translate[character]&&lib.translate[character].includes(name))||character.includes(name)){
                            if (!_status.showPlayerStats || (_status.showPlayerStats && changci > 0)) {
                                charactersData.push({
                                    character: `${uid}-${character}${lianTag}`,
                                    changci, shengchang, shenglv, baichang, pingju
                                });
                                // renderCount++;
                            }
                        }
                        continue;
                    }
                    if ((_status.showPlayerStats && changci > 0) || (!_status.showPlayerStats && changci > 0)) {
                        charactersData.push({
                            character: `${uid}-${character}${lianTag}`,
                            changci, shengchang, shenglv, baichang, pingju
                        });
                        // renderCount++;
                    }
                }
            }
        } else {
            for (let character in targetModeData) {
                // if (renderCount >= MAX_RENDER) break;
                const data = targetModeData[character];
                const changci = _status.showPlayerStats ? (Number(data.mechangci) || 0) : (Number(data.changci) || 0);
                const shengchang = _status.showPlayerStats ? (Number(data.meshengchang) || 0) : (Number(data.shengchang) || 0);
                const pingju = _status.showPlayerStats ? (Number(data.mepingju) || 0) : (Number(data.pingju) || 0);
                const shenglv = changci === 0 ? 0 : ((shengchang / changci) * 100);
                const baichang = changci - shengchang - pingju || 0;
                if(name){
                    if ((lib.translate[character]&&lib.translate[character].includes(name))||character.includes(name)){
                        if (!_status.showPlayerStats || (_status.showPlayerStats && changci > 0)) {
                            charactersData.push({character, changci, shengchang, shenglv, baichang, pingju});
                            // renderCount++;
                        }
                    }
                    continue;
                }
                if ((_status.showPlayerStats && changci > 0) || (!_status.showPlayerStats && changci > 0)) {
                    charactersData.push({character, changci, shengchang, shenglv, baichang, pingju});
                    // renderCount++;
                }
            };
        }
        const sortMapping = {'胜率':'shenglv','胜场':'shengchang','总场次':'changci','平局':'pingju','败':'baichang'};
        if (!sortMapping[sortBy]) return;
        const sortKey = sortMapping[sortBy];
        const sortFunction = (a, b) => {
            let valueA = a[sortKey], valueB = b[sortKey];
            if (sortKey === 'shenglv') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            } else {
                valueA = Number(valueA) || 0;
                valueB = Number(valueB) || 0;
            }
            if (valueA !== valueB) {
                return sortOrder ? (valueA - valueB) : (valueB - valueA);
            }
            const changciA = Number(a.changci) || 0;
            const changciB = Number(b.changci) || 0;
            if (changciB !== changciA) {
                return changciB - changciA;
            }
            const shenglvA = parseFloat(a.shenglv) || 0;
            const shenglvB = parseFloat(b.shenglv) || 0;
            if (shenglvB !== shenglvA) {
                return shenglvB - shenglvA;
            }
            return 0;
        };
        charactersData.sort(sortFunction);
        charactersData.forEach((data) => {
            const characterBg = ui.create.div('.characterBg', rightBg,function(){
                let charName = data.character;
                if (charName.includes('-')) {
                    charName = charName.split('-')[1];
                }
                charName = charName.replace(/【.*?】/g, '');
                game.createCharacterSkill(charName);
            });
            const characterHead = ui.create.div('.characterHead', characterBg);
            const characterImage = ui.create.div('.characterImage', characterHead);
            let charKey = data.character;
            if (charKey.includes('-')) {
                charKey = charKey.split('-')[1];
            }
            charKey = charKey.replace(/【.*?】/g, '');
            characterImage.dataset.char = charKey;
            characterImage.style.minHeight = '80px';
            characterImage.style.width = '80px';
            characterImage.style.backgroundSize = 'cover';
            characterImage.style.backgroundPosition = 'center';
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.setBackground(entry.target.dataset.char, 'character');
                        observer.unobserve(entry.target);
                    }
                });
            }, {rootMargin: '200px'});
            observer.observe(characterImage);
            let displayName = data.character;
            if (displayName.includes('-')) {
                const [uid, char] = displayName.split('-');
                const realChar = char.replace(/【.*?】/g, '');
                const lianTag = char.match(/【.*?】/) || '';
                displayName = `[${uid}] ${lib.translate[realChar + '_prefix'] ? `${get.prefixSpan(get.translation(realChar + '_prefix'), realChar)}${get.rawName(realChar)}` : get.translation(realChar)}${lianTag}`;
            } else {
                displayName = lib.translate[data.character + '_prefix'] ? `${get.prefixSpan(get.translation(data.character + '_prefix'), data.character)}${get.rawName(data.character)}` : get.translation(data.character);
            }
            ui.create.div('.characterName', displayName, characterHead);
            const xinxiBg = ui.create.div('.xinxiBg', characterBg);
            const texts = [
                data.changci + '场',
                data.shengchang + '场',
                data.shenglv.toFixed(2) + '%',
                data.baichang + '场',
                data.pingju + '场'
            ];
            texts.forEach((text) => {
                ui.create.div('.xinxiText', text, xinxiBg);
            });
        });
        rightBg.scrollTo({ top: 0, behavior: 'smooth' });
    }
    debouncedCreateCharacter = debounce(createCharacter);
    const modeButtons = [];
    const displayModes = _status.connectMode ? lib.config.all.mode : lib.config.all.mode.filter(mode => mode !== 'connect');
    for (let mode of displayModes) {
        const btnText = mode === 'connect' ? '联机' : lib.translate[mode] || mode;
        const node = ui.create.div('.modeLbtn', btnText, leftBg, function () {
            modeButtons.forEach(button => button.classList.remove('active'));
            this.classList.add('active');
            createCharacter(mode,_status.sortBy,_status.sortOrder);
        });
        if(mode==_status.zhanjiMode)node.classList.add('active');
        modeButtons.push(node);
    };
    createCharacter(_status.zhanjiMode,_status.sortBy,_status.sortOrder);
};

lib.arenaReady.push(function() {
    ui.create.system('战绩', () => {
        game.gfb_slb();
    });
    if(!lib.config['extension_鸽府包_winner'])game.winInit();
});

export default {
    winInit: game.winInit,
    gfb_slb: game.gfb_slb
};
