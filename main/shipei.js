import { lib, game, ui, get, ai, _status } from '../../../noname.js';

export function initShipei(lib, game, ui, get, ai, _status, datasrc) {
    lib.element.player.gfYongchangTime = function (num) {
        var player = this;
        const storageKey = 'gfYongchangTime_value';
        let current = 0;
        if (player.storage[storageKey]) {
            if (typeof player.storage[storageKey] === 'number') {
                current = player.storage[storageKey];
            } else {
                current = player.storage[storageKey].gflib_tongling || 0;
            }
        }
        if (num === 'reset') { num = -current; }
        if (num === undefined) { return current; }
        let newVal = Math.max(current + num, 0);
        if (typeof player.storage[storageKey] === 'number') {
            player.storage[storageKey] = newVal;
        } else {
            if (!player.storage[storageKey]) {
                player.storage[storageKey] = {};
            }
            player.storage[storageKey].gflib_tongling = newVal;
        }
        player.syncStorage(storageKey);
        game.broadcast(function (targetPlayer, sourcePlayer, newVal, max, storageKey) {
            if (targetPlayer.id !== sourcePlayer.id) return;
            if (typeof targetPlayer.storage[storageKey] === 'number') {
                targetPlayer.storage[storageKey] = newVal;
            } else {
                if (!targetPlayer.storage[storageKey]) {
                    targetPlayer.storage[storageKey] = {};
                }
                targetPlayer.storage[storageKey].gflib_tongling = newVal;
            }
        }, this, this, newVal, Infinity);
        return { oldTongling: current, newTongling: newVal, changed: current !== newVal };
    };
    //非常非常非常非常感谢源·天将士允许我搬运，致敬，我在此基础上做了一些修改。
    get.gflib_typeMp = function(player, type) {
        if (type) {
            return player.node?.gflib_mp?.type === type;
        }
        return player.node?.gflib_mp?.type || 'gflib_magic';
    };
    lib.element.player.gflib_isMaxMp = function(equal, type) {
        for (var current of game.players) {
            if (current.isOut() || current === this) continue;
            if (equal) {
                if (current.gflib_getMp(type) >= this.gflib_getMp(type)) return false;
            } else {
                if (current.gflib_getMp(type) > this.gflib_getMp(type)) return false;
            }
        }
        return true;
    };
    lib.element.player.gflib_isMinMp = function(equal, type) {
        for (var current of game.players) {
            if (current.isOut() || current === this) continue;
            if (equal) {
                if (current.gflib_getMaxMp(type) >= this.gflib_getMaxMp(type)) return false;
            } else {
                if (current.gflib_getMaxMp(type) > this.gflib_getMaxMp(type)) return false;
            }
        }
        return true;
    };
    lib.element.player.gflib_getMp = function(type) {
        if (type) {
            if (get.gflib_typeMp(this, type)) return this.gflib_mp || 0;
            if (this.storage[type]) {
                return typeof this.storage[type] === 'number' 
                    ? this.storage[type] 
                    : (this.storage[type]?.gflib_mp || 0);
            }
            return 0;
        }
        return this.gflib_mp || 0;
    };
    lib.element.player.gflib_getMaxMp = function(type) {
        if (type) {
            if (get.gflib_typeMp(this, type)) return this.gflib_maxMp || 0;
            if (this.storage[type]) {
                return typeof this.storage[type] === 'number' 
                    ? Infinity 
                    : (this.storage[type]?.gflib_maxMp || 0);
            }
            return 0;
        }
        return this.gflib_maxMp || 0;
    };

    lib.element.player.gflib_initMp = function() {
        var player = this;
        if (player.node.gflib_mpContainer) return player.node.gflib_mpContainer;
        const mpContainer = ui.create.div('.gflib_mp', player);
        Object.assign(mpContainer.style, {
            display: 'block',
            position: 'absolute',
            left: '0',
            top: 'auto',
            bottom: '15px',
            width: '100%',
            zIndex: '88',
            pointerEvents: 'none'
        });
        player.node.gflib_mpContainer = mpContainer;
        player.node.gflib_mp = mpContainer;
        const mpBarBase = ui.create.div('', mpContainer);
        Object.assign(mpBarBase.style, {
            position: 'absolute',
            top: 'auto !important',
            height: '8px',
            borderRadius: '8px',
            width: '100px',
            right: 'auto',
            left: 'calc(50% - 50px)',
            boxShadow: '0 0 4px #FFFF00',
            backgroundColor: 'rgb(100, 0, 0)',
            overflow: 'hidden'
        });
        player.node.gflib_mpBarBase = mpBarBase;
        const mpBarFill = ui.create.div('', mpBarBase);
        Object.assign(mpBarFill.style, {
            position: 'absolute',
            top: 'auto !important',
            height: '8px',
            borderRadius: '8px',
            width: '0%',
            left: '0',
            float: 'left',
            transition: 'width 0.3s linear'
        });
        player.node.gflib_mpBarFill = mpBarFill;
        const mpText = document.createElement('span');
        Object.assign(mpText.style, {
            fontSize: '8px',
            width: '100%',
            left: '0',
            top: '0',
            display: 'inline-block',
            position: 'absolute',
            textAlign: 'center',
            color: '#FFFFFF',
            textShadow: '0 1px 1px rgba(0,0,0,0.8)',
            pointerEvents: 'none'
        });
        mpBarBase.appendChild(mpText);
        player.node.gflib_mpText = mpText;
        player.gflib_mp = 0;
        player.gflib_maxMp = 0;
        player.node.gflib_mp.type = 'gflib_magic';
        const charInfo = lib.character[player.name1];
        if (charInfo?.[4]) {
            for (var config of charInfo[4]) {
                if (config.indexOf('gflib_mp:') === 0) {
                    const [initMp, maxMp] = config.slice(6).split('/').map(Number);
                    player.gflib_mp = initMp;
                    player.gflib_maxMp = maxMp || initMp;
                    break;
                }
            }
        } else if (typeof charInfo?.gflib_mp === 'string') {
            const [initMp, maxMp] = charInfo.gflib_mp.split('/').map(Number);
            player.gflib_mp = initMp;
            player.gflib_maxMp = maxMp || initMp;
        }
        let customConfig;
        for (var func of (lib.gflib_custom?.mp || [])) {
            customConfig = func(player);
            if (customConfig) {
                player.gflib_mp = customConfig.gflib_mp || player.gflib_mp;
                player.gflib_maxMp = customConfig.gflib_maxMp || player.gflib_maxMp;
                player.node.gflib_mp.type = customConfig.type || 'gflib_magic';
                if (customConfig.color) {
                    mpBarFill.style.background = customConfig.color;
                }
            }
        }
        player.gflib_updateMpUI();
        return mpContainer;
    };
    lib.element.player.inits.add(function(player) {
        setTimeout(() => {
            if (!player.classList.contains('player')) {
                player.classList.add('player');
            }
            player.gflib_initMp();
        }, 100);
    });
    lib.element.player.gflib_replaceMp = function(config, type) {
        var player = this;
        const currentType = get.gflib_typeMp(this);
        const mpBarFill = player.node.gflib_mpBarFill;

        if (currentType && !this.storage[currentType]) {
            this.storage[currentType] = {
                gflib_mp: this.gflib_mp,
                gflib_maxMp: this.gflib_maxMp,
                fillColor: mpBarFill.style.background
            };
            this.syncStorage(currentType);
        }
        if (typeof config === 'number') {
            this.gflib_mp = config;
            this.gflib_maxMp = Infinity;
        } else if (typeof config === 'object') {
            this.gflib_mp = config.gflib_mp || 0;
            this.gflib_maxMp = config.gflib_maxMp || Infinity;
        }
        this.node.gflib_mp.type = type || config?.type || 'gflib_magic';
        this.gflib_updateMpUI();
        return this;
    };
    lib.element.player.gflib_updateMpUI = function() {
        var player = this;
        if (!player.node.gflib_mpContainer) return;

        const { gflib_mp, gflib_maxMp } = player;
        const mpBarFill = player.node.gflib_mpBarFill;
        const mpText = player.node.gflib_mpText;
        const mpContainer = player.node.gflib_mpContainer;
        let mpPercent;
        if (gflib_maxMp === 0) {
            mpPercent = gflib_mp > 0 ? 100 : 0;
        } else if (gflib_maxMp === Infinity) {
            mpPercent = gflib_mp === Infinity ? 100 : Math.min((gflib_mp / 10) * 100, 100);
        } else {
            mpPercent = Math.min((gflib_mp / gflib_maxMp) * 100, 100);
        }
        mpBarFill.style.width = `${mpPercent}%`;
        const mpDisplay = gflib_mp === Infinity ? '∞' : gflib_mp;
        const maxMpDisplay = gflib_maxMp === Infinity ? '∞' : gflib_maxMp;
        mpText.textContent = `${mpDisplay}/${maxMpDisplay}`;
        mpContainer.classList.remove('max-mp', 'min-mp');
        if (player.gflib_isMaxMp(false)) {
            Object.assign(mpText.style, {
                color: '#FFEB3B',
                textShadow: '0 0 3px #FFEB3B'
            });
        } else if (player.gflib_isMinMp(false)) {
            Object.assign(mpText.style, {
                color: '#81D4FA',
                textShadow: '0 0 3px #81D4FA'
            });
        } else {
            Object.assign(mpText.style, {
                color: '#FFFFFF',
                textShadow: '0 1px 1px rgba(0,0,0,0.8)'
            });
        }
        if (gflib_maxMp === 0 && gflib_mp === 0) {
            mpContainer.style.display = 'none';
        } else {
            mpContainer.style.display = 'block';
        }
    };
	lib.element.player.gflib_changeMp = function (num, type) {
		var player = this;
		const targetType = type || get.gflib_typeMp(this);
		let currentMp = player.gflib_getMp(targetType);
		let maxMp = player.gflib_getMaxMp(targetType);
		let newMp = Math.max(currentMp + num, 0);
		newMp = Math.min(newMp, maxMp);
		if (targetType && get.gflib_typeMp(this, targetType)) {
			player.gflib_mp = newMp;
		} else if (player.storage[targetType]) {
			if (typeof player.storage[targetType] === 'number') {
				player.storage[targetType] = newMp;
			} else {
				player.storage[targetType].gflib_mp = newMp;
			}
			player.syncStorage(targetType);
		}
		game.broadcast(function (targetPlayer, sourcePlayer, newMp, maxMp, targetType) {
			if (targetPlayer.id !== sourcePlayer.id) return;
			if (targetType && get.gflib_typeMp(targetPlayer, targetType)) {
				targetPlayer.gflib_mp = newMp;
			} else if (targetPlayer.storage[targetType]) {
				if (typeof targetPlayer.storage[targetType] === 'number') {
					targetPlayer.storage[targetType] = newMp;
				} else {
					targetPlayer.storage[targetType].gflib_mp = newMp;
				}
			}
			targetPlayer.gflib_updateMpUI();
		}, this, this, newMp, maxMp, targetType);
		setTimeout(() => player.gflib_updateMpUI(), 50);
		return { oldMp: currentMp, newMp: newMp, changed: currentMp !== newMp };
	};
    lib.element.player.gflib_update = function() {
        game.broadcast(function(player, mp, maxMp, type) {
            if (!player.node.gflib_mpContainer) player.gflib_initMp();
            player.gflib_mp = mp;
            player.gflib_maxMp = maxMp;
            player.node.gflib_mp.type = type;
            player.gflib_updateMpUI();
        }, this, this.gflib_mp, this.gflib_maxMp, this.node.gflib_mp.type);
        this.gflib_updateMpUI();
	};
	lib.element.player.gflib_updateMpUI = function () {
		var player = this;
		if (!player.node.gflib_mpContainer) return;
		const { gflib_mp, gflib_maxMp } = player;
		const mpBarFill = player.node.gflib_mpBarFill;
		const mpBarBase = player.node.gflib_mpBarBase;
		const mpText = player.node.gflib_mpText;
		const mpContainer = player.node.gflib_mpContainer;
		let mpPercent;
		if (gflib_maxMp === 0) {
			mpPercent = gflib_mp > 0 ? 100 : 0;
		} else if (gflib_maxMp === Infinity) {
			mpPercent = gflib_mp === Infinity ? 100 : Math.min((gflib_mp / 10) * 100, 120);
		} else {
			mpPercent = Math.min((gflib_mp / gflib_maxMp) * 100, 100);
		}
		mpBarFill.style.width = `${mpPercent}%`;
		const mpDisplay = gflib_mp === Infinity ? '∞' : gflib_mp;
		const maxMpDisplay = gflib_maxMp === Infinity ? '∞' : gflib_maxMp;
		mpText.textContent = `${mpDisplay}/${maxMpDisplay}`;
		const isMax = gflib_maxMp !== 0 && gflib_maxMp !== Infinity && gflib_mp === gflib_maxMp;
		if (isMax) {
			mpBarBase.style.boxShadow = '0 0 8px 2px rgba(255, 255, 0, 0.8), 0 0 12px 4px rgba(255, 215, 0, 0.5)';
			mpBarBase.style.animation = 'glowPulse 1.5s infinite alternate';
			const styleSheet = document.styleSheets[0];
			for (let i = 0; i < styleSheet.cssRules.length; i++) {
				if (styleSheet.cssRules[i].name === 'glowPulse') {
					styleSheet.deleteRule(i);
					break;
				}
			}
			styleSheet.insertRule(`
            @keyframes glowPulse {
                from { box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.8), 0 0 12px 4px rgba(255, 215, 0, 0.5); }
                to { box-shadow: 0 0 12px 4px rgba(255, 255, 0, 1), 0 0 16px 6px rgba(255, 215, 0, 0.7); }
            }
        `, styleSheet.cssRules.length);
		} else {
			mpBarBase.style.boxShadow = '0 0 4px #FFFF00';
			mpBarBase.style.animation = 'none';
		}
		mpContainer.classList.remove('max-mp', 'min-mp');
		if (player.gflib_isMaxMp(false)) {
			Object.assign(mpText.style, {
				color: '#FFEB3B',
				textShadow: '0 0 3px #FFEB3B'
			});
		} else if (player.gflib_isMinMp(false)) {
			Object.assign(mpText.style, {
				color: '#81D4FA',
				textShadow: '0 0 3px #81D4FA'
			});
		} else {
			Object.assign(mpText.style, {
				color: '#FFFFFF',
				textShadow: '0 1px 1px rgba(0,0,0,0.8)'
			});
		}
		if (gflib_maxMp === 0 && gflib_mp === 0) {
			mpContainer.style.display = 'none';
		} else {
			mpContainer.style.display = 'block';
		}
	};
    lib.skill.gflib_changePhase = {
        trigger: { player: "phaseBeforeStart" },
        priority: 75,
        firstDo: true,
        forced: true,
        silent: true,
        filter: function(event, player) {
            const standardPhases = ['phaseZhunbei', 'phaseJudge', 'phaseDraw', 'phaseUse', 'phaseDiscard', 'phaseJieshu'];
            if (event.phaseList.length !== standardPhases.length) return false;
            return standardPhases.every(phase => event.phaseList.includes(phase));
        },
        content: function() {
            trigger.phaseList = lib.phaseName.slice(0);
            game.players.forEach(player => {
                if (player.gflib_updateMpUI) player.gflib_updateMpUI();
            });
        }
    };
    game.addGlobalSkill('gflib_changePhase');
    const createShipeiBackground = () => {
        const shipeiBg = ui.create.div('.gflib_shipei', ui.window);
        Object.assign(shipeiBg.style, {
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundSize: '100% 100%',
            backgroundColor: '#000000',
            zIndex: '-1',
            position: 'fixed'
        });
        shipeiBg.style.display = 'none';
        window.gshipeiBackground = shipeiBg;
    };
    get.gflib_typeTongling = function(player, type) {
        if (type) {
            return player.node?.gflib_tongling?.type === type;
        }
        return player.node?.gflib_tongling?.type || 'gflib_tongling';
    };
    lib.element.player.gflib_isMaxTongling = function(equal) {
        for (var current of game.players) {
            if (current.isOut() || current === this) continue;
            if (equal) {
                if (current.gflib_getTongling() >= this.gflib_getTongling()) return false;
            } else {
                if (current.gflib_getTongling() > this.gflib_getTongling()) return false;
            }
        }
        return true;
    };
    lib.element.player.gflib_isMinTongling = function(equal) {
        for (var current of game.players) {
            if (current.isOut() || current === this) continue;
            if (equal) {
                if (current.gflib_getMaxTongling() >= this.gflib_getMaxTongling()) return false;
            } else {
                if (current.gflib_getMaxTongling() > this.gflib_getMaxTongling()) return false;
            }
        }
        return true;
    };
    lib.element.player.gflib_getTongling = function(type) {
        if (type) {
            if (get.gflib_typeTongling(this, type)) return this.gflib_tongling || 0;
            if (this.storage[type]) {
                return typeof this.storage[type] === 'number' 
                    ? this.storage[type] 
                    : (this.storage[type]?.gflib_tongling || 0);
            }
            return 0;
        }
        return this.gflib_tongling || 0;
    };
    lib.element.player.gflib_getMaxTongling = function(type) {
        if (type) {
            if (get.gflib_typeTongling(this, type)) return this.gflib_maxTongling || 0;
            if (this.storage[type]) {
                return typeof this.storage[type] === 'number' 
                    ? Infinity 
                    : (this.storage[type]?.gflib_maxTongling || 0);
            }
            return 0;
        }
        return this.gflib_maxTongling || 0;
    };
    lib.element.player.gflib_initTongling = function() {
        var player = this;
        if (player.node.gflib_tonglingContainer) return player.node.gflib_tonglingContainer;
        const tonglingContainer = ui.create.div('.gflib_tongling', player);
        Object.assign(tonglingContainer.style, {
            display: 'block',
            position: 'absolute',
            left: '0',
            top: 'auto',
            bottom: '5px',
            width: '100%',
            zIndex: '89',
            pointerEvents: 'none',
            textAlign: 'center'
        });
        player.node.gflib_tonglingContainer = tonglingContainer;
        player.node.gflib_tongling = tonglingContainer;
        player.node.gflib_tongling.type = 'gflib_tongling';
        const charInfo = lib.character[player.name1];
        if (charInfo?.[4]) {
            for (var config of charInfo[4]) {
                if (config.indexOf('gflib_tongling:') === 0) {
                    const [initTongling, maxTongling] = config.slice(12).split('/').map(Number);
                    player.gflib_tongling = initTongling;
                    player.gflib_maxTongling = maxTongling || initTongling;
                    break;
                }
            }
        }
        let customConfig;
        for (var func of (lib.gflib_custom?.tongling || [])) {
            customConfig = func(player);
            if (customConfig) {
                player.gflib_tongling = customConfig.gflib_tongling || player.gflib_tongling;
                player.gflib_maxTongling = customConfig.gflib_maxTongling || player.gflib_maxTongling;
                player.node.gflib_tongling.type = customConfig.type || 'gflib_tongling';
            }
        }
        player.gflib_updateTonglingUI();
        return tonglingContainer;
    };
    lib.element.player.gflib_updateTonglingUI = function() {
        var player = this;
        if (!player.node.gflib_tonglingContainer) return;
        const { gflib_tongling: current, gflib_maxTongling: max } = player;
        const container = player.node.gflib_tonglingContainer;
        container.innerHTML = '';
        const isFull = max !== 0 && max !== Infinity && current === max;
        if (max === 0 && current === max) {
            container.style.display = 'none';
            return;
        }
        Object.assign(container.style, {
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            position: 'absolute',
            left: '-4px', 
            right: '0',
            bottom: '5px',
            width: '100%',
            zIndex: '89',
            pointerEvents: 'none',
            padding: '0 5px',
            flexWrap: 'nowrap'
        });
        const renderMax = max === Infinity ? 10 : Math.max(max, 1);
        const renderCurrent = Math.min(Math.max(current, 0), renderMax);
        const offsetStep = 1;
        if (isFull) {
            const styleSheet = document.styleSheets[0];
            for (let i = 0; i < styleSheet.cssRules.length; i++) {
                if (styleSheet.cssRules[i].name === 'wideRedFireUp') {
                    styleSheet.deleteRule(i);
                    break;
                }
            }
            styleSheet.insertRule(`
                @keyframes wideRedFireUp {
                    0% { 
                        box-shadow: 0 0 1px 1px #ff2d00,
                                    0 1px 4px 3px rgba(220, 20, 60, 0.7),
                                    0 2px 5px 4px rgba(180, 0, 0, 0.5);
                        filter: brightness(1);
                    }
                    50% { 
                        box-shadow: 0 -4px 6px 2px #ff4500,
                                    0 -2px 8px 3px rgba(220, 20, 60, 0.9),
                                    0 0 5px 3px rgba(180, 0, 0, 0.6);
                        filter: brightness(1.2);
                    }
                    100% { 
                        box-shadow: 0 0 2px 2px #ff2d00, 
                                    0 1px 4px 3px rgba(220, 20, 60, 0.7),
                                    0 2px 5px 4px rgba(180, 0, 0, 0.5);
                        filter: brightness(1);
                    }
                }
            `, styleSheet.cssRules.length);
        }
        for (let i = 0; i < renderMax; i++) {
            const dot = ui.create.div('.gflib_tongling_dot', container);
            const isActive = i < renderCurrent;
            const baseStyles = {
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                margin: '0',
                transition: 'all 0.3s linear',
                position: 'relative',
                opacity: isActive ? '1' : '0.8',
                transform: `translateX(${i % 2 === 0 ? -offsetStep : offsetStep}px)`,
                zIndex: '2'
            };
            if (isFull && isActive) {
                Object.assign(dot.style, baseStyles, {
                    backgroundColor: '#fcf808',
                    animation: `wideRedFireUp 1.5s infinite alternate ${i * 0.1}s`,
                    boxShadow: '0 0 2px 2px #ff2d00, 0 1px 4px 3px rgba(220, 20, 60, 0.7), 0 2px 5px 4px rgba(180, 0, 0, 0.5)'
                });
                dot.classList.add('gflib_wide_red_fire_dot');
                const styleSheet = document.styleSheets[0];
                let hasFirePseudo = false;
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    if (styleSheet.cssRules[j].selectorText === '.gflib_wide_red_fire_dot::after') {
                        hasFirePseudo = true;
                        break;
                    }
                }
                if (!hasFirePseudo) {
                    styleSheet.insertRule(`
                        .gflib_wide_red_fire_dot::after {
                            content: '';
                            position: absolute;
                            top: -5px;
                            left: -2px;
                            right: -2px;
                            bottom: 1px;   
                            border-radius: 50% 50% 30% 30%;
                            background: transparent;
                            box-shadow: 0 -3px 6px 3px #ff4500, 0 -1px 8px 4px rgba(255, 0, 0, 0.8);
                            z-index: 1;
                            animation: wideRedFireUp 2s infinite alternate ${i * 0.1 + 0.05}s;
                            opacity: 0.8;
                        }
                    `, styleSheet.cssRules.length);
                }
            } else if (!isActive) {
                Object.assign(dot.style, baseStyles, {
                    backgroundColor: '#320101',
                    boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                    animation: 'none',
                    filter: 'none'
                });
                dot.classList.remove('gflib_wide_red_fire_dot');
            } else {
                Object.assign(dot.style, baseStyles, {
                    backgroundColor: '#fcf808',
                    boxShadow: '0 0 4px #ffe607, 0 0 6px rgba(0, 0, 0, 0.5)',
                    animation: 'none',
                    filter: 'none'
                });
                dot.classList.remove('gflib_wide_red_fire_dot');
            }
        }
        container.style.boxShadow = 'none';
    };
    lib.element.player.gflib_changeTongling = function (num, type) {
        var player = this;
        const targetType = type || get.gflib_typeTongling(this);
        let current = player.gflib_getTongling(targetType);
        let max = player.gflib_getMaxTongling(targetType);
        let newVal = Math.max(current + num, 0);
        if (max !== Infinity) newVal = Math.min(newVal, max);
        if (targetType && get.gflib_typeTongling(this, targetType)) {
            player.gflib_tongling = newVal;
        } else if (player.storage[targetType]) {
            if (typeof player.storage[targetType] === 'number') {
                player.storage[targetType] = newVal;
            } else {
                player.storage[targetType].gflib_tongling = newVal;
            }
            player.syncStorage(targetType);
        }
        game.broadcast(function (targetPlayer, sourcePlayer, newVal, max, targetType) {
            if (targetPlayer.id !== sourcePlayer.id) return;
            if (targetType && get.gflib_typeTongling(targetPlayer, targetType)) {
                targetPlayer.gflib_tongling = newVal;
            } else if (targetPlayer.storage[targetType]) {
                if (typeof targetPlayer.storage[targetType] === 'number') {
                    targetPlayer.storage[targetType] = newVal;
                } else {
                    targetPlayer.storage[targetType].gflib_tongling = newVal;
                }
            }
            targetPlayer.gflib_updateTonglingUI();
        }, this, this, newVal, max, targetType);
        setTimeout(() => player.gflib_updateTonglingUI(), 50);
        return { oldTongling: current, newTongling: newVal, changed: current !== newVal };
    };
    lib.element.player.gflib_replaceTongling = function(config, type) {
        const currentType = get.gflib_typeTongling(this);
        if (currentType && !this.storage[currentType]) {
            this.storage[currentType] = {
                gflib_tongling: this.gflib_tongling,
                gflib_maxTongling: this.gflib_maxTongling
            };
            this.syncStorage(currentType);
        }
        if (typeof config === 'number') {
            this.gflib_tongling = config;
            this.gflib_maxTongling = Infinity;
        } else if (typeof config === 'object') {
            this.gflib_tongling = config.gflib_tongling || 0;
            this.gflib_maxTongling = config.gflib_maxTongling || Infinity;
        }
        this.node.gflib_tongling.type = type || config?.type || 'gflib_tongling';
        this.gflib_updateTonglingUI();
        return this;
    };
    lib.element.player.gflib_updateTongling = function() {
        game.broadcast(function(player, tongling, maxTongling, type) {
            if (!player.node.gflib_tonglingContainer) player.gflib_initTongling();
            player.gflib_tongling = tongling;
            player.gflib_maxTongling = maxTongling;
            player.node.gflib_tongling.type = type;
            player.gflib_updateTonglingUI();
        }, this, this.gflib_tongling, this.gflib_maxTongling, this.node.gflib_tongling.type);
        this.gflib_updateTonglingUI();
    };
    lib.element.player.inits.add(function(player) {
        setTimeout(() => {
            player.gflib_initTongling();
        }, 5);
    });
    lib.skill.gflib_changePhase.content = function() {
        trigger.phaseList = lib.phaseName.slice(0);
        game.players.forEach(player => {
            if (player.gflib_updateMpUI) player.gflib_updateMpUI();
            if (player.gflib_updateTonglingUI) player.gflib_updateTonglingUI();
        });
    };
    // 冻结frozen
    get.gflib_typeFrozen = function(player, type) {
        if (type) {
            return player.node?.gflib_frozen?.type === type;
        }
        return player.node?.gflib_frozen?.type || 'gflib_frozen';
    };

    lib.element.player.gflib_isMaxFrozen = function(equal) {
        for (var current of game.players) {
            if (current.isOut() || current === this) continue;
            if (equal) {
                if (current.gflib_getFrozen() >= this.gflib_getFrozen()) return false;
            } else {
                if (current.gflib_getFrozen() > this.gflib_getFrozen()) return false;
            }
        }
        return true;
    };

    lib.element.player.gflib_isMinFrozen = function(equal) {
        for (var current of game.players) {
            if (current.isOut() || current === this) continue;
            if (equal) {
                if (current.gflib_getMaxFrozen() >= this.gflib_getMaxFrozen()) return false;
            } else {
                if (current.gflib_getMaxFrozen() > this.gflib_getMaxFrozen()) return false;
            }
        }
        return true;
    };

    lib.element.player.gflib_getFrozen = function(type) {
        if (type && this.storage[type] && !(this.gflib_frozen || 0)) {
            return typeof this.storage[type] === 'number'
                ? this.storage[type]
                : (this.storage[type]?.gflib_frozen || 0);
        }
        return this.gflib_frozen || 0;
    };

    lib.element.player.gflib_getMaxFrozen = function(type) {
        return this.gflib_maxFrozen || this.hp * 2 || 0;
    };

    lib.element.player.gflib_initFrozen = function() {
        var player = this;
        if (player.node.gflib_frozenContainer) return player.node.gflib_frozenContainer;
        const frozenContainer = ui.create.div('.gflib_frozen', player);
        Object.assign(frozenContainer.style, {
            display: 'block',
            position: 'absolute',
            left: '0',
            top: 'auto',
            bottom: '5px',
            width: '100%',
            zIndex: '90',
            pointerEvents: 'none',
            textAlign: 'center'
        });
        player.node.gflib_frozenContainer = frozenContainer;
        player.node.gflib_frozen = frozenContainer;
        player.node.gflib_frozen.type = 'gflib_frozen';
        const charInfo = lib.character[player.name1];
        if (charInfo?.[4]) {
            for (var config of charInfo[4]) {
                if (config.indexOf('gflib_frozen:') === 0) {
                    const [initFrozen, maxFrozen] = config.slice(13).split('/').map(Number);
                    player.gflib_frozen = initFrozen;
                    player.gflib_maxFrozen = maxFrozen || initFrozen;
                    break;
                }
            }
        }
        let customConfig;
        for (var func of (lib.gflib_custom?.frozen || [])) {
            customConfig = func(player);
            if (customConfig) {
                player.gflib_frozen = customConfig.gflib_frozen || player.gflib_frozen;
                player.gflib_maxFrozen = customConfig.gflib_maxFrozen || player.gflib_maxFrozen;
                player.node.gflib_frozen.type = customConfig.type || 'gflib_frozen';
            }
        }
        player.gflib_updateFrozenUI();
        return frozenContainer;
    };

    lib.element.player.gflib_updateFrozenUI = function() {
        const player = this;
        const container = player.node.gflib_frozenContainer;
        if (!container) return;
        const current = player.gflib_frozen || 0;
        if (current === 0) {
            container.style.display = 'none';
            return;
        }
        const max = player.gflib_getMaxFrozen();
        const renderCurrent = Math.min(Math.max(current, 0), max);
        const isLargeHp = player.maxHp > 5;
        Object.assign(container.style, isLargeHp ? {
            display: 'inline-block',
            position: 'absolute',
            left: 'calc(50% + 25px)',
            bottom: '18px',
            width: '12px',
            height: '12px',
            zIndex: 90,
            pointerEvents: 'none'
        } : {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            position: 'absolute', left: 'calc(50% + 36px)', bottom: '18px',
            width: '12px', height: 'auto', zIndex: 90, pointerEvents: 'none',
            gap: '6px', padding: 0, flexWrap: 'nowrap'
        });
        container.innerHTML = '';
        if (isLargeHp) {
            const img = document.createElement('img');
            img.className = 'gflib_frozen_img';
            img.src = `${lib.assetURL}extension/鸽府包/image/hp/frozenGlass2.png`;
            Object.assign(img.style, {
                width: '12px', height: '12px', objectFit: 'contain',
                transition: '0.3s linear', opacity: 1, transform: 'scale(1.3)',
                right: '-11px',
                position: 'relative', zIndex: 99998
            });
            const numText = document.createElement('div');
            numText.innerText = renderCurrent;
            Object.assign(numText.style, {
                color: '#00ffff', fontSize: '14px', fontWeight: 900,
                textShadow: '0 0 2px #000, 0 0 4px #000, 1px 1px 2px #000',
                lineHeight: '12px',
                position: 'absolute',
                right: '6px',
                top: '1px',
                textAlign: 'right',
                whiteSpace: 'nowrap',
                zIndex: 99999,
                pointerEvents: 'none'
            });
            container.append(img, numText);
        } else {
            const num2 = Math.floor(renderCurrent / 2);
            const num1 = renderCurrent % 2;
            const createIcon = (src) => {
                const img = document.createElement('img');
                img.className = 'gflib_frozen_img';
                img.src = src;
                Object.assign(img.style, {
                    width: '10px', height: '10px', objectFit: 'contain',
                    transition: '0.3s linear', opacity: 1, transform: 'scale(1.3)'
                });
                return img;
            };
            if (num1) container.appendChild(createIcon(`${lib.assetURL}extension/鸽府包/image/hp/frozenGlass1.png`));
            for (let i = 0; i < num2; i++) {
                container.appendChild(createIcon(`${lib.assetURL}extension/鸽府包/image/hp/frozenGlass2.png`));
            }
        }
    };

    lib.element.player.gflib_changeFrozen = function (num, type) {
        var player = this;
        const targetType = type || get.gflib_typeFrozen(this);
        let current = player.gflib_getFrozen(targetType);
        let max = player.gflib_getMaxFrozen(targetType);
        let newVal = Math.min(Math.max(current + num, 0), max);
        player.gflib_frozen = newVal;
        if (targetType && player.storage[targetType]) {
            if (typeof player.storage[targetType] === 'number') {
                player.storage[targetType] = newVal;
            } else {
                player.storage[targetType].gflib_frozen = newVal;
            }
            player.syncStorage(targetType);
        }

        game.broadcast(function (targetPlayer, sourcePlayer, newVal, max, targetType) {
            if (targetPlayer.id !== sourcePlayer.id) return;
            targetPlayer.gflib_frozen = newVal;
            if (targetType && targetPlayer.storage[targetType]) {
                if (typeof targetPlayer.storage[targetType] === 'number') {
                    targetPlayer.storage[targetType] = newVal;
                } else {
                    targetPlayer.storage[targetType].gflib_frozen = newVal;
                }
            }
            if (targetPlayer.gflib_updateFrozenUI) targetPlayer.gflib_updateFrozenUI();
        }, this, this, newVal, max, targetType);

        if (player.gflib_updateFrozenUI) setTimeout(() => player.gflib_updateFrozenUI(), 50);
        if (newVal > 0 && newVal >= max && player.isAlive() && !player.isOut()) {
            player.dyingFrozen("冻结", true);
        }
        return { oldFrozen: current, newFrozen: newVal, changed: current !== newVal };
    };

    lib.element.player.gflib_replaceFrozen = function(config, type) {
        const currentType = get.gflib_typeFrozen(this);
        if (currentType && !this.storage[currentType]) {
            this.storage[currentType] = {
                gflib_frozen: this.gflib_frozen,
                gflib_maxFrozen: this.gflib_maxFrozen
            };
            this.syncStorage(currentType);
        }

        if (typeof config === 'number') {
            this.gflib_frozen = config;
            this.gflib_maxFrozen = Infinity;
        } else if (typeof config === 'object') {
            this.gflib_frozen = config.gflib_frozen || 0;
            this.gflib_maxFrozen = config.gflib_maxFrozen || Infinity;
        }

        if (this.node && this.node.gflib_frozen) {
            this.node.gflib_frozen.type = type || config?.type || 'gflib_frozen';
        }
        if (this.gflib_updateFrozenUI) this.gflib_updateFrozenUI();
        return this;
    };

    lib.element.player.gflib_updateFrozen = function() {
        game.broadcast(function(player, frozen, maxFrozen, type) {
            if (!player.node.gflib_frozenContainer) player.gflib_initFrozen();
            player.gflib_frozen = frozen;
            player.gflib_maxFrozen = maxFrozen;
            if (player.node && player.node.gflib_frozen) {
                player.node.gflib_frozen.type = type;
            }
            player.gflib_updateFrozenUI();
        }, this, this.gflib_frozen, this.gflib_maxFrozen, this.node?.gflib_frozen?.type || 'gflib_frozen');
        this.gflib_updateFrozenUI();
    };

    // 自动初始化
    lib.element.player.inits.add(function(player) {
        setTimeout(() => {
            player.gflib_initFrozen();
        }, 5);
    });

    // 阶段自动刷新UI
    lib.skill.gflib_changePhase.content = function() {
        trigger.phaseList = lib.phaseName.slice(0);
        game.players.forEach(player => {
            if (player.gflib_updateMpUI) player.gflib_updateMpUI();
            if (player.gflib_updateTonglingUI) player.gflib_updateTonglingUI();
            if (player.gflib_updateFrozenUI) player.gflib_updateFrozenUI();
        });
        if (lib.gflib_refreshCenterImages) lib.gflib_refreshCenterImages();
    };

    lib.skill.gflib_frozenSkill = {
        trigger: {
            player: ["damageBegin", "changeHpAfter", "loseMaxHpAfter", "logSkill"],
        },
        priority: 75,
        firstDo: true,
        forced: true,
        silent: true,
        filter: function(event, player, name) {
            if (name == 'damageBegin') {
                return event.player.gflib_getFrozen() > 0 && event.hasNature('fire');
            } else {
                return event.player.gflib_getFrozen() > 0;
            }
        },
        content: function() {
            if (event.triggername == 'damageBegin') {
                player.gflib_changeFrozen(-4);
            } else {
                game.players.forEach(player => {
                    if (player.gflib_updateFrozenUI) player.gflib_updateFrozenUI();
                });
                player.gflib_changeFrozen(0);
            }
        }
    };
    game.addGlobalSkill('gflib_frozenSkill');

    // 留置牌
    if (!_status.gflib_liuzhiArea) _status.gflib_liuzhiArea = [];
    if (!_status.gflib_liuzhiSrc) _status.gflib_liuzhiSrc = {};
    if (typeof _status.gflib_liuzhiOn !== "boolean") _status.gflib_liuzhiOn = false;
    if (typeof _status.gflib_liuzhiPanelOn !== "boolean") _status.gflib_liuzhiPanelOn = false;
    game.gflib_liuzhiFindReal = function (entry) {
        if (!entry) return null;
        const r = entry.real;
        let valid = false;
        try { valid = !!(r && (r.node || get.position(r) != null)); } catch (e) { valid = !!(r && r.node); }
        if (valid) return r;
        const cid = entry.cardid;
        if (!cid) return null;
        const search = function (list) {
            if (!list || !list.length) return null;
            for (const c of list) { if (c && c.cardid === cid) return c; }
            return null;
        };
        let found = null;
        if (ui.discardPile && ui.discardPile.childNodes) found = search(ui.discardPile.childNodes);
        if (found) return found;
        if (ui.cardPile && ui.cardPile.childNodes) found = search(ui.cardPile.childNodes);
        if (found) return found;
        if (game.cards && game.cards.length) { found = search(game.cards); if (found) return found; }
        for (const p of game.players) {
            if (!p || typeof p.isAlive !== "function" || !p.isAlive()) continue;
            found = search(p.getCards("h")); if (found) return found;
            found = search(p.getCards("e")); if (found) return found;
            found = search(p.getCards("j")); if (found) return found;
            found = search(p.getExpansions ? p.getExpansions() : []); if (found) return found;
        }
        return null;
    };
    game.gflib_liuzhiEntryOf = function (card) {
        if (!card) return null;
        const arr = _status.gflib_liuzhiArea || [];
        for (const e of arr) {
            if (!e) continue;
            if (e.real === card) return e;
            if (card.cardid && e.cardid === card.cardid) return e;
            if (card.gflib_liuzhiRefCardid && e.cardid === card.gflib_liuzhiRefCardid) return e;
        }
        if (card.__gflib_liuzhi) return card.__gflib_liuzhi;
        return null;
    };
    game.gflib_liuzhiRender = function () {
        const panel = ui.gflib_liuzhiPanel;
        if (!panel) return;
        if (!_status.gflib_liuzhiPanelOn) { panel.style.display = "none"; return; }
        const list = _status.gflib_liuzhiArea || [];
        panel.innerHTML = "";
        if (!list.length) { panel.style.display = "none"; return; }
        panel.style.display = "flex";
        for (const entry of list) {
            let n = null;
            try {
                if (entry.info) n = ui.create.card(null, "noclick", true).init([entry.info.suit, entry.info.number, entry.info.name, entry.info.nature]);
                else if (entry.real) n = entry.real.copy(false);
            } catch (e) { }
            if (!n) continue;
            if (game.gflib_renderDualSuit && entry.info) {
                const extra = [];
                if (entry.info.gaintags) {
                    for (const g of entry.info.gaintags) {
                        if (typeof g === "string" && g.indexOf("gflib_dh_") === 0) extra.push(g.slice(8));
                    }
                }
                if (entry.cardid && _status.gflib_dualSuitMap && _status.gflib_dualSuitMap[entry.cardid]) {
                    for (const s of _status.gflib_dualSuitMap[entry.cardid]) extra.push(s);
                }
                if (extra.length) game.gflib_renderDualSuit(n, [entry.info.suit].concat(extra));
            }
            n.style.zoom = "0.5";
            n.style.pointerEvents = "auto";
            panel.appendChild(n);
        }
    };
    game.gflib_liuzhiShowPanel = function () {
        _status.gflib_liuzhiPanelOn = true;
        if (!ui.gflib_liuzhiPanel) {
            const panel = ui.create.div(".gflib_liuzhi_wrap", ui.window);
            Object.assign(panel.style, {
                position: "fixed",
                left: "50%",
                top: "7%",
                transform: "translateX(-50%)",
                zIndex: "90",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: "4px",
                padding: "6px 10px",
                background: "rgba(0,0,0,0.38)",
                borderRadius: "8px",
                pointerEvents: "auto",
                maxWidth: "62%"
            });
            ui.gflib_liuzhiPanel = panel;
        }
        game.gflib_liuzhiRender();
        game.gflib_liuzhiSync();
    };
    game.gflib_liuzhiHidePanel = function () {
        _status.gflib_liuzhiPanelOn = false;
        if (ui.gflib_liuzhiPanel) {
            if (ui.gflib_liuzhiPanel.parentNode) ui.gflib_liuzhiPanel.parentNode.removeChild(ui.gflib_liuzhiPanel);
            ui.gflib_liuzhiPanel = null;
        }
        game.gflib_liuzhiSync();
    };
    game.gflib_liuzhiSync = function () {
        var area = (_status.gflib_liuzhiArea || []).map(function (e) {
            return {
                info: e.info || null,
                cardid: e.cardid || null,
                srcid: e.srcid || null,
                destroyed: !!e.destroyed
            };
        });
        var fun = function (areaData, panelOn, on, owner) {
            _status.gflib_liuzhiArea = (areaData || []).map(function (d) {
                return { info: d.info, cardid: d.cardid, srcid: d.srcid, destroyed: d.destroyed, src: null };
            });
            _status.gflib_liuzhiSrc = {};
            for (var k = 0; k < _status.gflib_liuzhiArea.length; k++) {
                var e2 = _status.gflib_liuzhiArea[k];
                if (e2.cardid && e2.srcid) _status.gflib_liuzhiSrc[e2.cardid] = e2.srcid;
            }
            _status.gflib_liuzhiPanelOn = panelOn;
            _status.gflib_liuzhiOn = on;
            _status.gflib_liuzhiOwner = owner;
            if (panelOn) game.gflib_liuzhiShowPanel();
            else game.gflib_liuzhiHidePanel();
            game.gflib_liuzhiRender();
        };
        game.broadcast(fun, area, _status.gflib_liuzhiPanelOn, _status.gflib_liuzhiOn, _status.gflib_liuzhiOwner);
    };
    game.updateGflibLiuzhi = function () {
        game.gflib_liuzhiRender();
        game.gflib_liuzhiSync();
    };
    lib.element.player.gflib_liuzhiEnable = function () {
        const player = this;
        _status.gflib_liuzhiOn = true;
        _status.gflib_liuzhiOwner = player.playerid;
        game.gflib_liuzhiShowPanel();
        return player;
    };
    lib.element.player.gflib_liuzhiDisable = function () {
        const player = this;
        _status.gflib_liuzhiOn = false;
        if (_status.gflib_liuzhiOwner === player.playerid) _status.gflib_liuzhiOwner = null;
        game.gflib_liuzhiHidePanel();
        return player;
    };
    game.gflib_liuzhiIsOn = function () {
        return _status.gflib_liuzhiOn === true;
    };
    game.gflib_liuzhiOwnerPlayer = function () {
        const id = _status.gflib_liuzhiOwner;
        if (!id) return null;
        return game.players.find(function (p) { return p && p.playerid === id; }) || null;
    };
    game.gflib_liuzhiGet = function () {
        const arr = _status.gflib_liuzhiArea || [];
        const out = [];
        for (const e of arr) {
            let r = game.gflib_liuzhiFindReal(e);
            if (!r && e.info) {
                if (e.shadow && !e.shadow.parentNode) {
                    r = e.shadow;
                } else {
                    r = game.gflib_liuzhiRecreate(e);
                    if (r) {
                        r.__gflib_liuzhi = e;
                        if (e.cardid) r.gflib_liuzhiRefCardid = e.cardid;
                        e.shadow = r;
                    }
                }
            }
            if (r) out.push(r);
        }
        return out;
    };
    lib.element.player.gflib_liuzhiGet = function () {
        return game.gflib_liuzhiGet();
    };
    game.gflib_liuzhiSrcOf = function (card) {
        if (!card || !_status.gflib_liuzhiSrc) return null;
        if (card.cardid && _status.gflib_liuzhiSrc[card.cardid]) return _status.gflib_liuzhiSrc[card.cardid];
        if (card.gflib_liuzhiRefCardid) return _status.gflib_liuzhiSrc[card.gflib_liuzhiRefCardid] || null;
        return null;
    };
    game.gflib_liuzhiDestroyReal = function (entry) {
        if (!entry || entry.destroyed) return;
        const c = entry.real;
        if (c) {
            try { if (c.__gflib_liuzhi) delete c.__gflib_liuzhi; } catch (e) { }
            try { if (c.gflib_liuzhiPlaceholder) delete c.gflib_liuzhiPlaceholder; } catch (e) { }
            try { if (c.parentNode) c.parentNode.removeChild(c); } catch (e) { }
            try { c.remove(); } catch (e) { }
        }
        entry.real = null;
        entry.destroyed = true;
    };
    game.gflib_liuzhiRecreate = function (entry) {
        if (!entry || !entry.info) return null;
        const info = entry.info;
        let nc = null;
        try { nc = game.createCard2(info.name, info.suit, info.number, info.nature); } catch (e) { nc = null; }
        if (!nc) return null;
        if (info.gaintags && info.gaintags.length) {
            for (const t of info.gaintags) { try { nc.addGaintag(t); } catch (e) { } }
        }
        try {
            let dsuits = null;
            if (entry.cardid && _status.gflib_dualSuitMap && _status.gflib_dualSuitMap[entry.cardid]) dsuits = _status.gflib_dualSuitMap[entry.cardid];
            if (dsuits && dsuits.length >= 2) nc.gflib_suits = dsuits.slice();
        } catch (e) { }
        return nc;
    };
    game.gflib_liuzhiCheckDestroy = function (entry, tries) {
        if (!entry || entry.destroyed) return;
        if (_status.gflib_liuzhiArea.indexOf(entry) < 0) return;
        const c = entry.real;
        if (!c) return;
        let pos = null;
        try { pos = get.position(c); } catch (e) { pos = null; }
        if (pos === "d" || pos === "out") {
            game.gflib_liuzhiDestroyReal(entry);
            game.updateGflibLiuzhi();
            return;
        }
        if ((tries || 0) < 4) {
            try { game.delay(0.3).then(function () { game.gflib_liuzhiCheckDestroy(entry, (tries || 0) + 1); }); } catch (e) { }
        }
    };
    game.gflib_liuzhiGain = async function (target, cards) {
        if (!target || !cards || !cards.length) return [];
        const arr = _status.gflib_liuzhiArea || [];
        const owners = [];
        const gained = [];
        for (const c of cards) {
            const entry = game.gflib_liuzhiEntryOf(c);
            if (!entry) continue;
            const i = arr.indexOf(entry);
            if (i >= 0) arr.splice(i, 1);
            let real = game.gflib_liuzhiFindReal(entry);
            if (!real) real = game.gflib_liuzhiRecreate(entry);
            if (!real) continue;
            let pos = null;
            try { pos = get.position(real); } catch (e) { pos = null; }
            if (pos === "e") {
                try { if (real.player && real.player.unequip) real.player.unequip(real); } catch (e) { }
            }
            let own = null;
            try { own = get.owner(real); } catch (e) { own = null; }
            if (!own && entry.cardid && _status.gflib_liuzhiSrc[entry.cardid]) {
                const pid = _status.gflib_liuzhiSrc[entry.cardid];
                own = game.players.find(function (p) { return p && p.playerid === pid; }) || null;
            }
            if (own && own !== target && owners.indexOf(own) < 0) owners.push(own);
            if (real.__gflib_liuzhi) delete real.__gflib_liuzhi;
            if (real.gflib_liuzhiPlaceholder) delete real.gflib_liuzhiPlaceholder;
            if (entry.cardid) delete _status.gflib_liuzhiSrc[entry.cardid];
            try { await target.gain(real); } catch (e) { }
            try {
                let dsuits = game.gflib_getDualSuits(real);
                if ((!dsuits || dsuits.length < 2) && entry.cardid && _status.gflib_dualSuitMap && _status.gflib_dualSuitMap[entry.cardid]) {
                    dsuits = _status.gflib_dualSuitMap[entry.cardid];
                }
                if (dsuits && dsuits.length >= 2) {
                    real.gflib_suits = dsuits.slice();
                    game.gflib_syncDualSuit(real.cardid, dsuits.slice());
                    game.gflib_renderDualSuit(real, dsuits.slice());
                }
            } catch (e) { }
            gained.push(real);
        }
        if (target && target.update) target.update();
        for (const o of owners) { if (o && o.update) o.update(); }
        game.updateGflibLiuzhi();
        return gained;
    };
    // 与留置区的牌交换牌
    game.gflib_liuzhiSwap = async function (target, cards) {
        const list = (cards || []).slice();
        if (!target) return [];
        const oldCards = game.gflib_liuzhiGet().slice();
        const isHost = !game.online;
        for (const c of list) {
            if (!c) continue;
            if (isHost) {
                try {
                    const pos = get.position(c);
                    if (pos !== "d" && pos !== "out") {
                        game.gflib_toDiscardPile(c);
                        try { game.gflib_liuzhiSyncDiscard(c.cardid); } catch (e2) { }
                    }
                } catch (e) { }
            }
            const entry = {
                real: c,
                cardid: c.cardid || null,
                src: target,
                srcid: target.playerid,
                destroyed: false,
                info: { suit: get.suit(c), number: get.number(c), name: c.name, nature: c.nature || null, gaintags: c.gaintag ? c.gaintag.slice() : [] }
            };
            try { c.gflib_liuzhiPlaceholder = true; } catch (e) { }
            c.__gflib_liuzhi = entry;
            if (entry.cardid) _status.gflib_liuzhiSrc[entry.cardid] = target.playerid;
            _status.gflib_liuzhiArea.push(entry);
        }
        game.updateGflibLiuzhi();
        return await game.gflib_liuzhiGain(target, oldCards);
    };
    game.gflib_liuzhiOnRemove = async function (removed) {
        if (!removed || !removed.length) return;
        const info = lib.skill.gzt_szys_ly;
        if (!info || typeof info.gzt_szys_lyOnRemove !== "function") return;
        for (const p of game.players) {
            try { await info.gzt_szys_lyOnRemove(p, removed); } catch (e) { }
        }
    };
    game.gflib_liuzhiDiscardSrcHand = function (srcid, sc) {
        if (!srcid || sc == null) return;
        const src = game.players.find(function (p) { return p && p.playerid === srcid; }) || null;
        if (!src || typeof src.isAlive !== "function" || !src.isAlive()) return;
        const hs = (src.getCards("h") || []).filter(function (x) { return get.suit(x) === sc; });
        if (!hs.length) return;
        try { game.cardsDiscard(hs, src); } catch (e) { }
        ui.updatehl();
        src.update();
    };
    game.gflib_toDiscardPile = function (c) {
        if (!c) return;
        var pos = null;
        try { pos = get.position(c); } catch (e) { }
        if (pos === "d" || pos === "out") return;
        if (pos === "e") {
            try { if (c.player && c.player.unequip) c.player.unequip(c); } catch (e) { }
        }
        var owner = null;
        try { owner = get.owner(c); } catch (e) { }
        if (owner && typeof owner.lose === "function") {
            try { owner.lose([c], ui.discardPile); return; } catch (e) { }
        }
        try { game.cardsDiscard([c]); } catch (e) { }
    };
    game.gflib_liuzhiSyncDiscard = function (cardid) {
        if (!cardid) return;
        var fun = function (id) {
            var c = lib.cardOL && lib.cardOL[id];
            if (c && game.gflib_toDiscardPile) game.gflib_toDiscardPile(c);
        };
        try { if (typeof game.broadcast === "function") game.broadcast(fun, cardid); } catch (e) { }
    };
    game.gflib_liuzhiDiscard = async function (cards) {
        if (!cards || !cards.length) return [];
        const arr = _status.gflib_liuzhiArea || [];
        const removed = [];
        const discarded = [];
        const isHost = !game.online;
        for (const c of cards) {
            const entry = game.gflib_liuzhiEntryOf(c);
            if (!entry) continue;
            const real = game.gflib_liuzhiFindReal(entry);
            const srcid = entry.srcid || (real && _status.gflib_liuzhiSrc[real.cardid]) || null;
            const i = arr.indexOf(entry);
            if (i >= 0) arr.splice(i, 1);
            if (real && real.__gflib_liuzhi) delete real.__gflib_liuzhi;
            if (real && real.gflib_liuzhiPlaceholder) delete real.gflib_liuzhiPlaceholder;
            if (real && real.cardid) delete _status.gflib_liuzhiSrc[real.cardid];
            if (entry.destroyed) {
                if (c && c.__gflib_liuzhi) delete c.__gflib_liuzhi;
                if (c && c.gflib_liuzhiPlaceholder) delete c.gflib_liuzhiPlaceholder;
                if (c) { try { c.remove(); } catch (e) { } }
                if (entry.shadow) { try { entry.shadow.remove(); } catch (e) { } }
                delete entry.shadow;
            }
            removed.push({ card: real || c, srcid: srcid });
            if (isHost && real) {
                let pos = null;
                try { pos = get.position(real); } catch (e) { }
                if (pos !== "d" && pos !== "out") {
                    try { game.gflib_toDiscardPile(real); } catch (e) { }
                    try { game.gflib_liuzhiSyncDiscard(real.cardid); } catch (e) { }
                }
                discarded.push(real);
            }
        }
        game.updateGflibLiuzhi();
        await game.gflib_liuzhiOnRemove(removed);
        return discarded;
    };
    game.gflib_liuzhiClear = async function () {
        const arr = (_status.gflib_liuzhiArea || []).slice();
        const isHost = !game.online;
        for (const e of arr) {
            if (isHost && e.real) {
                try {
                    const pos = get.position(e.real);
                    if (pos !== "d" && pos !== "out") {
                        game.gflib_toDiscardPile(e.real);
                        try { game.gflib_liuzhiSyncDiscard(e.real.cardid); } catch (e3) { }
                    }
                } catch (e2) { }
            }
            if (e.real && e.real.__gflib_liuzhi) delete e.real.__gflib_liuzhi;
            if (e.real && e.real.gflib_liuzhiPlaceholder) delete e.real.gflib_liuzhiPlaceholder;
            if (e.cardid) delete _status.gflib_liuzhiSrc[e.cardid];
            if (e.destroyed && e.shadow) { try { e.shadow.remove(); } catch (e2) { } }
        }
        _status.gflib_liuzhiArea = [];
        _status.gflib_liuzhiSrc = {};
        game.updateGflibLiuzhi();
    };
    lib.skill.gflib_liuzhiCollect = {
        trigger: {
            global: ["useCardAfter", "equipAfter"]
        },
        silentForce: true,
        filter(event, player) {
            if (!_status.gflib_liuzhiOn) return false;
            if (!event.cards || !event.cards.length) return false;
            const area = _status.gflib_liuzhiArea || [];
            return event.cards.some(function (c) {
                if (!c || c.gflib_liuzhiPlaceholder || c.__gflib_liuzhi || c.willBeDestroyed()) return false;
                if (c.cardid && area.some(function (e) { return e.cardid === c.cardid; })) return false;
                return true;
            });
        },
        async content(event, trigger, player) {
            const cards = (trigger.cards || event.cards || (trigger.card ? [trigger.card] : (event.card ? [event.card] : []))).slice();
            if (!cards.length) return;
            const srcPlayer = trigger.player || event.player;
            const pid = srcPlayer ? srcPlayer.playerid : null;
            const added = [];
            for (const c of cards) {
                if (!c || c.gflib_liuzhiPlaceholder || c.__gflib_liuzhi || c.willBeDestroyed()) continue;
                if (c.cardid && _status.gflib_liuzhiArea.some(function (e) { return e.cardid === c.cardid; })) continue;
                c.gflib_liuzhiPlaceholder = true;
                const entry = {
                    real: c,
                    cardid: c.cardid,
                    src: srcPlayer || null,
                    srcid: pid,
                    destroyed: false,
                    pos: (function () { try { return get.position(c); } catch (e) { return null; } })(),
                    info: { suit: get.suit(c), number: get.number(c), name: c.name, nature: c.nature || null, gaintags: (c.gaintag ? c.gaintag.slice() : []) }
                };
                c.__gflib_liuzhi = entry;
                if (pid && c.cardid) _status.gflib_liuzhiSrc[c.cardid] = pid;
                _status.gflib_liuzhiArea.push(entry);
                added.push(entry);
            }
            game.updateGflibLiuzhi();
            for (const entry of added) {
                try { game.gflib_liuzhiCheckDestroy(entry, 0); } catch (e) { }
            }
        }
    };
    game.addGlobalSkill("gflib_liuzhiCollect");
    lib.skill.gflib_liuzhiDiscardDetect = {
        trigger: {
            global: ["discardAfter", "loseToDiscardpileAfter", "loseAsyncAfter"]
        },
        silentForce: true,
        async content(event, trigger, player) {
            const list = (trigger.cards || event.cards || []).slice();
            for (const card of list) {
                if (!card) continue;
                const subs = card.cards ? card.cards.slice() : [card];
                for (const c of subs) {
                    if (!c || !c.__gflib_liuzhi) continue;
                    const entry = c.__gflib_liuzhi;
                    if (_status.gflib_liuzhiArea.indexOf(entry) < 0) continue;
                    let pos = null;
                    try { pos = get.position(c); } catch (e) { }
                    if (pos === "d" || pos === "out") {
                        game.gflib_liuzhiDestroyReal(entry);
                        game.updateGflibLiuzhi();
                    }
                }
            }
        }
    };
    game.addGlobalSkill("gflib_liuzhiDiscardDetect");
    lib.skill.gflib_liuzhiAutoShow = {
        trigger: {
            global: "phaseBegin"
        },
        silentForce: true,
        content() {
            const p = _status.currentPhase;
            if (!p || typeof p.hasSkill !== "function") return;
            if (!p.hasSkill("gzt_jiezheng")) return;
            _status.gflib_liuzhiOn = true;
            _status.gflib_liuzhiOwner = p.playerid;
            game.gflib_liuzhiShowPanel();
        }
    };
    game.addGlobalSkill("gflib_liuzhiAutoShow");
    lib.skill.gflib_liuzhiAutoHide = {
        trigger: {
            global: "phaseEnd"
        },
        silentForce: true,
        content() {
            _status.gflib_liuzhiOn = false;
            _status.gflib_liuzhiOwner = null;
            game.gflib_liuzhiHidePanel();
        }
    };
    game.addGlobalSkill("gflib_liuzhiAutoHide");
    
    // 多色火攻
    function gflib_getDualSuits(card) {
        if (!card) return null;
        const arr = [];
        const push = function (s) { if (s && arr.indexOf(s) < 0) arr.push(s); };
        const check = function (c) {
            if (!c) return;
            if (c.gflib_suits && c.gflib_suits.length) {
                for (const s of c.gflib_suits) push(s);
            }
            if (c.gaintag) {
                for (const g of c.gaintag) {
                    if (typeof g === "string" && g.indexOf("gflib_dh_") === 0) push(g.slice(8));
                }
            }
            if (c.cardid && _status.gflib_dualSuitMap && _status.gflib_dualSuitMap[c.cardid]) {
                for (const s of _status.gflib_dualSuitMap[c.cardid]) push(s);
            }
        };
        if (card.cards && card.cards.length) {
            for (const c of card.cards) check(c);
        } else {
            check(card);
        }
        return arr.length ? arr : null;
    }
    get.gflibCardSuits = function (card) {
        const suits = gflib_getDualSuits(card);
        if (suits && suits.length) return suits;
        const s = get.suit(card, false);
        return s ? [s] : [];
    };
    game.gflib_syncDualSuit = function (cardid, suits) {
        if (!cardid || !suits || suits.length < 2) return;
        var fun = function (id, list) {
            if (!_status.gflib_dualSuitMap) _status.gflib_dualSuitMap = {};
            _status.gflib_dualSuitMap[id] = list;
            try {
                if (game.gflib_ensureDualSuitRender) game.gflib_ensureDualSuitRender();
                var c = lib.cardOL && lib.cardOL[id];
                if (c && game.gflib_renderDualSuit) game.gflib_renderDualSuit(c, list);
            } catch (e) {}
        };
        fun(cardid, suits);
        try { if (typeof game.broadcast === "function") game.broadcast(fun, cardid, suits); } catch (e) {}
    };
    game.gflib_suitColorMap = {
        heart: "#a82424",
        diamond: "#a82424",
        spade: "#333333",
        club: "#333333",
        none: "#777777"
    };
    game.gflib_suitColor = function (suit) {
        return game.gflib_suitColorMap[suit] || game.gflib_suitColorMap.none;
    };
    game.gflib_renderDualSuit = function (el, suits) {
        if (!el || !el.node || !el.node.info) return;
        if (!suits) suits = gflib_getDualSuits(el);
        if (!suits || suits.length < 2) return;
        let html = el.node.info.innerHTML;
        if (html.indexOf("gflib_ds") >= 0) return;
        let changed = false;
        for (const s of suits) {
            if (s === el.suit) continue;
            html = '<span class="gflib_ds" data-suit="' + s + '" style="color:' + game.gflib_suitColor(s) + '">' + get.translation(s) + "</span>" + html;
            changed = true;
        }
        if (changed) el.node.info.innerHTML = html;
    };
    function gflib_ensureDualSuitRender() {
        if (game.gflib_renderPatched) return;
        const ctor = lib.element.Card || lib.element.card;
        const proto = ctor && ctor.prototype;
        if (!proto || typeof proto.$init !== "function") return;
        const _init = proto.$init;
        proto.$init = function (card) {
            const r = _init.call(this, card);
            try { game.gflib_renderDualSuit(this); } catch (e) {}
            return r;
        };
        game.gflib_renderPatched = true;
    }
    game.gflib_getDualSuits = gflib_getDualSuits;
    game.gflib_ensureDualSuitRender = gflib_ensureDualSuitRender;
    gflib_ensureDualSuitRender();
    if (typeof game.on === "function") game.on("gameStart", gflib_ensureDualSuitRender);
    lib.skill.gflib_dualsuit_show = {
        trigger: {
            global: ["gainAfter", "gameStart"]
        },
        silentForce: true,
        content(event, trigger, player) {
            game.broadcastAll(function (cards) {
                if (game.gflib_ensureDualSuitRender) game.gflib_ensureDualSuitRender();
                if (!cards) return;
                for (const c of cards) {
                    if (c && game.gflib_renderDualSuit) game.gflib_renderDualSuit(c);
                }
            }, (trigger && trigger.cards) ? trigger.cards.slice() : []);
        },
    };
    game.addGlobalSkill("gflib_dualsuit_show");
    const gflib_suitMods = ["cardUsable", "cardUsableTarget", "cardEnabled", "cardEnabled2", "targetEnabled", "targetInRange"];
    function gflib_suitScore(r) {
        if (typeof r === "number") return r;
        if (r === true) return 2;
        if (r === false) return 0;
        return 1;
    }
    var gflib_checkModBusy = false;
    function gflib_wrapCheckMod() {
        if (!game || typeof game.checkMod !== "function") return;
        if (game.checkMod.__gflibDual) return;
        const _checkMod = game.checkMod;
        game.checkMod = function () {
            const args = Array.from(arguments);
            const name = args[args.length - 2];
            if (gflib_suitMods.indexOf(name) < 0) return _checkMod.apply(this, args);
            if (gflib_checkModBusy) return _checkMod.apply(this, args);
            const card = args[0];
            const suits = gflib_getDualSuits(card);
            if (!suits || suits.length < 2) return _checkMod.apply(this, args);
            const orig = card.suit;
            let best, bestScore = -Infinity;
            gflib_checkModBusy = true;
            try {
                for (const s of suits) {
                    card.suit = s;
                    const r = _checkMod.apply(this, args);
                    const sc = gflib_suitScore(r);
                    if (sc > bestScore) {
                        bestScore = sc;
                        best = r;
                    }
                }
            } finally {
                card.suit = orig;
                gflib_checkModBusy = false;
            }
            return best;
        };
        game.checkMod.__gflibDual = true;
    }
    gflib_wrapCheckMod();
    if (typeof game.on === "function") game.on("gameStart", gflib_wrapCheckMod);
    // 判定时多色牌视为多种花色依次走
    function gflib_wrapJudge() {
        if (!get || typeof get.judge !== "function") return;
        if (get.judge.__gflibDual) return;
        const _judge = get.judge;
        get.judge = function () {
            const baseFn = _judge.apply(this, arguments);
            if (typeof baseFn !== "function") return baseFn;
            return function (result) {
                const jcard = (result && result.card) ? result.card : arguments[0];
                const suits = gflib_getDualSuits(jcard);
                if (!suits || suits.length < 2) return baseFn(result);
                let bestVal = null, bestSuit = null;
                for (const s of suits) {
                    const color = (s === "heart" || s === "diamond") ? "red" : "black";
                    const r = Object.assign({}, result, { suit: s, color: color });
                    let v;
                    try { v = baseFn(r); } catch (e) { v = null; }
                    const sc = (typeof v === "number") ? v : 0;
                    if (bestVal === null || sc > bestVal) { bestVal = sc; bestSuit = s; }
                }
                if (result && bestSuit) {
                    result.suit = bestSuit;
                    result.color = (bestSuit === "heart" || bestSuit === "diamond") ? "red" : "black";
                }
                return bestVal;
            };
        };
        get.judge.__gflibDual = true;
    }
    gflib_wrapJudge();
    if (typeof game.on === "function") game.on("gameStart", gflib_wrapJudge);
    // 多判定适配按花色分支依次执行所有命中线路
    game.gflib_judgeBranch = async function (card, branches) {
        if (!card || !branches) return;
        const suits = get.gflibCardSuits(card);
        if (!suits || !suits.length) return;
        const run = {};
        for (const s of suits) {
            if (branches[s] && !run[s]) {
                run[s] = true;
                await branches[s](s);
                continue;
            }
            const color = (s === "heart" || s === "diamond") ? "red" : "black";
            if (branches[color] && !run[color]) {
                run[color] = true;
                await branches[color](s);
                continue;
            }
            if (branches["default"] && !run["default"]) {
                run["default"] = true;
                await branches["default"](s);
            }
        }
    };
    lib.skill.gflib_huogong_dual = {
        trigger: {
            player: "huogongBegin",
        },
        silentForce: true,
        async content(event, trigger, player) {
            trigger.set("filterDiscard", function (card) {
                let shown = null;
                let shownSuits = null;
                try {
                    const hg = get.event().getParent("huogong", true);
                    const cards2 = hg && hg.cards2;
                    const shownCard = cards2 && cards2[0] ? cards2[0] : null;
                    shown = shownCard ? get.suit(shownCard) : null;
                    shownSuits = shownCard ? game.gflib_getDualSuits(shownCard) : null;
                } catch (e) { shown = null; shownSuits = null; }
                if (shownSuits && shownSuits.length >= 2) {
                    const cardSuits = game.gflib_getDualSuits(card) || [get.suit(card)];
                    for (const s of cardSuits) {
                        if (shownSuits.indexOf(s) >= 0) return true;
                    }
                }
                const suits = game.gflib_getDualSuits(card);
                if (shown && suits && suits.indexOf(shown) >= 0) return true;
                return get.suit(card) === shown;
            });
        },
    };
    game.addGlobalSkill("gflib_huogong_dual");
    
    // 武将牌中心图片count由主机传入客机不再自己数标记
    lib.element.player.gflib_addCenterImage = function (name, width, height, count) {
        var player = this;
        if (!player.node || !name) return;
        if (typeof count != 'number') count = player.countMark ? player.countMark(name) : 0;
        if (count <= 0) {
            if (player.node.gflib_centerImages && player.node.gflib_centerImages[name]) {
                player.node.gflib_centerImages[name].delete();
                delete player.node.gflib_centerImages[name];
            }
            return;
        }
        if (!player.node.gflib_centerImages) player.node.gflib_centerImages = {};
        var wrap = player.node.gflib_centerImagesWrap;
        if (!wrap) {
            wrap = ui.create.div('.gflib_centerImageWrap', player);
            Object.assign(wrap.style, {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70px',
                height: '70px',
                zIndex: '95',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            });
            player.node.gflib_centerImagesWrap = wrap;
        }
        if (player.node.gflib_centerImages[name]) {
            player.node.gflib_centerImages[name].delete();
        }
        var src = get.gflib_hpImg(name + '.png');
        var img = ui.create.div('.gflib_centerImage', wrap);
        img.style.backgroundImage = 'url(' + src + ')';
        Object.assign(img.style, {
            width: (width || 64) + 'px',
            height: (height || 64) + 'px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
        });
        player.node.gflib_centerImages[name] = img;
        return img;
    };

    lib.element.player.gflib_removeCenterImage = function (name) {
        var player = this;
        if (!player.node || !player.node.gflib_centerImages) return;
        if (player.node.gflib_centerImages[name]) {
            player.node.gflib_centerImages[name].delete();
            delete player.node.gflib_centerImages[name];
        }
    };

    // 中心图片同步主机与全部客机都执行
    lib.gflib_syncCenterImage = function (player, name, width, height) {
        if (!player || !name) return;
        var count = player.countMark ? player.countMark(name) : 0;
        var fun = function (p, n, w, h, c) {
            if (p && p.gflib_addCenterImage) p.gflib_addCenterImage(n, w, h, c);
        };
        if (game.online) {
            fun(player, name, width, height, count);
            return;
        }
        game.broadcastAll(fun, player, name, width, height, count);
    };

    lib.gflib_addCenterImage = function (player, name, width, height) {
        lib.gflib_syncCenterImage(player, name, width, height);
    };

    lib.gflib_removeCenterImage = function (player, name) {
        if (!player || !name) return;
        var fun = function (p, n) {
            if (p && p.gflib_removeCenterImage) p.gflib_removeCenterImage(n);
        };
        if (game.online) {
            fun(player, name);
            return;
        }
        game.broadcastAll(fun, player, name);
    };

    // 全量重刷中心图片给客机断线重连或后进入时兜底
    lib.gflib_refreshCenterImages = function () {
        var names = Object.keys(lib.gflib_centerImageMarks || {});
        if (!names.length) return;
        var fun = function (list) {
            var all = game.players.concat(game.dead || []);
            for (var i = 0; i < all.length; i++) {
                var p = all[i];
                if (!p || !p.gflib_addCenterImage) continue;
                for (var j = 0; j < list.length; j++) p.gflib_addCenterImage(list[j]);
            }
        };
        if (game.online) {
            fun(names);
            return;
        }
        game.broadcastAll(fun, names);
    };

    // 取hp素材目录图片
    get.gflib_hpImg = function (name) {
        return lib.assetURL + 'extension/鸽府包/image/hp/' + name;
    };

    // 需要中心图片的标记名登记有对应 image/hp/同名png
    lib.gflib_centerImageMarks = {
        gzhlb_zhuiji_mark: true
    };

    // 随标记增删自动同步中心图片监听 addMark/removeMark 事件
    lib.skill.gflib_centerImageSync = {
        trigger: {
            player: ["addMark", "removeMark"]
        },
        silentForce: true,
        firstDo: true,
        priority: 1000,
        filter: function (event, player) {
            return event.markName && lib.gflib_centerImageMarks[event.markName];
        },
        content: function (event, trigger, player) {
            if (player) lib.gflib_syncCenterImage(player, trigger.markName);
        }
    };
    game.addGlobalSkill('gflib_centerImageSync');

    // 分牌对话框自适应高度
    lib.gflib_fitDialogHeight = function (dialog) {
        var apply = function () {
            try {
                var win = ui.window || document.body;
                var winH = win.offsetHeight || 0;
                var need = dialog.content.scrollHeight || 0;
                if (!winH || !need) return;
                var maxH = winH - 80;
                var finalH = Math.min(need + 20, maxH);
                if (finalH < 120) return;
                var maxBottom = winH * 0.76;
                var top = (winH - finalH) / 2;
                if (top + finalH > maxBottom) top = maxBottom - finalH;
                if (top < 40) top = 40;
                dialog.classList.remove('fullheight');
                dialog.style.setProperty('height', finalH + 'px', 'important');
                dialog.style.setProperty('top', top + 'px', 'important');
            } catch (e) {
                dialog.classList.add('fullheight');
            }
        };
        if (typeof requestAnimationFrame == 'function') requestAnimationFrame(apply);
        else setTimeout(apply, 30);
    };

    // 分牌对话框把第start个区域起并排成一行主客机通用
    lib.gflib_moveRowLayout = function (event, config) {
        if (!event) return;
        var opt = config && typeof config == 'object' ? config : {};
        var start = typeof opt.start == 'number' ? opt.start : 1;
        var minHeight = typeof opt.minHeight == 'number' ? opt.minHeight : 106;
        var tries = 0;
        var restyle = function (node, isArea) {
            if (!node || !node.style) return;
            var pointer = node.classList && node.classList.contains('pointerdiv');
            Object.assign(node.style, {
                position: 'relative',
                marginTop: '8px',
                marginBottom: '8px',
                marginLeft: '4px',
                marginRight: '4px',
                boxSizing: 'border-box'
            });
            if (!pointer) node.style.width = 'calc(100% - 8px)';
            if (isArea) node.style.minHeight = minHeight + 'px';
        };
        var run = function () {
            if (event.finished) return;
            var dialog = event.dialog;
            if (!dialog || !dialog.content) {
                if (tries++ < 300) setTimeout(run, 20);
                return;
            }
            if (dialog._gflib_moveRow) return;
            var areas = Array.from(dialog.content.childNodes).filter(function (node) {
                return node.classList && node.classList.contains('guanxing');
            });
            var expect = event.list && event.list.length ? event.list.length : 0;
            // 区域还没建完就继续等原来这里直接返回导致手机端永远排不了版
            if (areas.length <= start || (expect && areas.length < expect)) {
                if (tries++ < 300) setTimeout(run, 20);
                return;
            }
            dialog._gflib_moveRow = true;
            var tip = dialog.content.lastChild;
            var row = ui.create.div('.gflib_moveRow', dialog.content);
            Object.assign(row.style, {
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                boxSizing: 'border-box',
                marginTop: '0',
                marginBottom: '0'
            });
            if (tip) dialog.content.insertBefore(row, tip);
            for (var i = start; i < areas.length; i++) {
                var col = ui.create.div('.gflib_moveCol', row);
                Object.assign(col.style, {
                    flex: '1 1 0',
                    minWidth: '0',
                    boxSizing: 'border-box',
                    position: 'relative',
                    margin: '0'
                });
                var before = [];
                var node = areas[i].previousSibling;
                while (node && !(node.classList && node.classList.contains('guanxing'))) {
                    before.unshift(node);
                    node = node.previousSibling;
                }
                for (var j = 0; j < before.length; j++) {
                    col.appendChild(before[j]);
                    restyle(before[j], false);
                }
                col.appendChild(areas[i]);
                restyle(areas[i], true);
            }
            lib.gflib_fitDialogHeight(dialog);
        };
        run();
    };

    // 接管chooseToMove让客机也能收到行布局指令
    if (!lib.gflib_chooseToMoveHooked && lib.element.content && lib.element.content.chooseToMove) {
        lib.gflib_chooseToMoveHooked = true;
        var gflib_rawChooseToMove = lib.element.content.chooseToMove;
        lib.element.content.chooseToMove = async function (event, trigger, player) {
            try {
                if (event && event.gflib_moveRow && event.isMine && event.isMine()) {
                    lib.gflib_moveRowLayout(event, event.gflib_moveRow);
                }
            } catch (e) {
                console.log('gflib_moveRow', e);
            }
            return await gflib_rawChooseToMove.apply(this, arguments);
        };
    }

    // 瞬发技框架
    lib.gfShunfa = {
        reqKey(skillname) {
            return "gf_shunfa_req_" + skillname;
        },
        lockKey(skillname) {
            return "gf_shunfa_lock_" + skillname;
        },
        // 是否已锁
        locked(player, skillname) {
            return player.countMark(this.lockKey(skillname)) > 0;
        },
        // 累积一次点击请求
        addReq(player, skillname) {
            var k = this.reqKey(skillname);
            if (!player.storage[k]) player.storage[k] = 0;
            player.storage[k]++;
        },
        // 上锁用完不可再点
        lock(player, skillname) {
            this.setData(player, this.lockKey(skillname), 1);
        },
        // 解锁
        unlock(player, skillname) {
            this.setData(player, this.lockKey(skillname), 0);
        },
        // 刷新按钮显示
        refresh(player) {
            if (player.node && player.node.gf_shunfaUpdate) player.node.gf_shunfaUpdate();
        },
        // 同步瞬发技数据并广播刷新各客户端按钮
        setData(player, key, value) {
            var isOnline = game.online || game.onlineroom;
            if (isOnline && !lib.node) return;
            player.storage[key] = value;
            if (isOnline) {
                game.broadcastAll(function (playerid, k, v) {
                    var p = lib.playerOL[playerid];
                    if (!p) return;
                    p.storage[k] = v;
                    if (p.node && p.node.gf_shunfaUpdate) p.node.gf_shunfaUpdate();
                }, player.playerid, key, value);
            }
            this.refresh(player);
        },
        // 全场播放点击动画支持传玩家或playerid
        playVideo(pos, target) {
            var targetPlayer = (target && target.node) ? target : null;
            // 单机没有lib.playerOL时回退用game.players查找
            if (!targetPlayer && lib.playerOL) targetPlayer = lib.playerOL[target];
            if (!targetPlayer && game.players) {
                targetPlayer = game.players.find(function (p) {
                    return p.playerid == target;
                });
            }
            if (!targetPlayer || !targetPlayer.node) return;
            if (targetPlayer.node.gf_shunfaVideo) return;
            // 播放期间隐藏按钮与文字避免与视频重叠
            var btnNode = targetPlayer.node.gf_shunfaBtn;
            var textNode = targetPlayer.node.gf_shunfaText;
            var played = false;
            var hideBtn = function () {
                if (btnNode) btnNode.style.visibility = "hidden";
                if (textNode) textNode.style.visibility = "hidden";
            };
            var restoreBtn = function () {
                if (btnNode) btnNode.style.visibility = "";
                if (textNode) textNode.style.visibility = "";
            };
            var videoBox = ui.create.div(".gf_shunfa_video_box", targetPlayer);
            targetPlayer.node.gf_shunfaVideo = videoBox;
            Object.assign(videoBox.style, {
                position: "absolute",
                width: pos.width,
                height: pos.height,
                top: pos.top,
                left: pos.left,
                zIndex: "100001",
                pointerEvents: "none",
                opacity: "0"
            });
            var video = document.createElement("video");
            video.src = lib.assetURL + "extension/鸽府包/image/animation/button.mp4";
            video.style.width = "100%";
            video.style.height = "100%";
            video.style.objectFit = "cover";
            video.muted = true;
            video.loop = false;
            video.preload = "auto";
            video.addEventListener("canplaythrough", function () {
                played = true;
                hideBtn();
                videoBox.style.opacity = "1";
                video.play().catch(function () {});
            });
            video.onended = function () {
                try {
                    if (targetPlayer.node && targetPlayer.node.gf_shunfaVideo) {
                        targetPlayer.node.gf_shunfaVideo.delete();
                        delete targetPlayer.node.gf_shunfaVideo;
                    }
                } catch (e) {}
                restoreBtn();
            };
            // 视频未就绪时兜底恢复按钮避免一直隐藏
            setTimeout(function () {
                if (!played) restoreBtn();
            }, 4000);
            videoBox.appendChild(video);
        },
        // 把执行排进事件队列等当前结算结束后再跑即时型技能跳过排队
        schedule(player, skillname) {
            var sk = lib.skill[skillname];
            if (sk && sk.gfShunfaInstant) {
                this.run(player, skillname);
                return;
            }
            try {
                var evt = game.createEvent("gf_shunfa_exec", false);
                evt.player = player;
                evt.skillname = skillname;
                evt.setContent(async function (event, trigger, pl) {
                    await lib.gfShunfa.run(pl, skillname);
                });
            } catch (e) {
                lib.gfShunfa.run(player, skillname);
            }
        },
        // 执行一次瞬发技内容并把请求归零
        async run(player, skillname) {
            var skill = lib.skill[skillname];
            if (!player || !skill) return;
            var rk = this.reqKey(skillname);
            if (!(player.countMark(rk) > 0)) return;
            player.storage[rk] = 0;
            if (this.locked(player, skillname)) return;
            // 发动第一步立即上锁关闭按钮防止执行期间重复发动
            this.lock(player, skillname);
            try {
                if (skill.gfShunfaAction) await skill.gfShunfaAction(player);
            } finally {
                if (skill.gfShunfaLockOnUse === false) this.unlock(player, skillname);
                else this.refresh(player);
            }
        },
    };
    // 房主接收客机点击请求登记并排队
    lib.message.server.gf_shunfa_click = function (playerid, skillname) {
        var p = lib.playerOL[playerid];
        var sk = lib.skill[skillname];
        if (!p || !sk || !sk.GFshunfaSkill) return;
        if (lib.gfShunfa.locked(p, skillname)) return;
        if (sk.gfShunfaFilter && !sk.gfShunfaFilter(p)) return;
        lib.gfShunfa.addReq(p, skillname);
        lib.gfShunfa.schedule(p, skillname);
    };
    // 房主接收客机动画请求广播全场传playerid避免对象序列化后取不到节点
    lib.message.server.gf_shunfa_play = function (pos, playerid) {
        if (!lib.playerOL[playerid]) return;
        game.broadcastAll(lib.gfShunfa.playVideo, pos, playerid);
    };
    // 客机接收房主广播的点击动画
    lib.message.client.gf_shunfa_play = function (pos, playerid) {
        lib.gfShunfa.playVideo(pos, playerid);
    };
    // 瞬发技按钮配置
    lib.element.player.gf_initShunfa = function (skillname) {
        let player = this;
        if (!skillname || typeof skillname !== "string" || !lib.skill[skillname]) {
            return;
        }
        if (player.node.gf_shunfaBtn) player.node.gf_shunfaBtn.delete();
        if (player.node.gf_shunfaText) player.node.gf_shunfaText.delete();
        let text = ui.create.div(".gf_shunfa_text", player);
        player.node.gf_shunfaText = text;
        text.innerText = get.translation(skillname) || "瞬";
        Object.assign(text.style, {
            position: "absolute",
            top: "34px",
            left: "2px",
            width: "30px",
            fontSize: "12px",
            color: "#fff",
            fontWeight: "bold",
            textAlign: "center",
            textShadow: "1px 1px 2px #000",
            zIndex: "100000",
            pointerEvents: "none"
        });
        // 主按钮
        let button = ui.create.div(".gf_shunfa_btn", player);
        player.node.gf_shunfaBtn = button;
        button.style.backgroundImage = `url(${lib.assetURL}extension/鸽府包/image/hp/button.jpg)`;
        button.style.backgroundSize = "cover";
        button.style.backgroundRepeat = "no-repeat";
        button.style.backgroundPosition = "center";
        button.style.position = "absolute";
        button.style.width = "30px";
        button.style.height = "30px";
        const placeBtn = () => {
            try {
                const el = (player.marks && player.marks.ghujia) || (player.node && player.node.marks);
                if (el && el.getBoundingClientRect) {
                    const pRect = player.getBoundingClientRect();
                    const r = el.getBoundingClientRect();
                    button.style.left = (r.left - pRect.left) + "px";
                    button.style.top = (r.top - pRect.top - 50) + "px";
                }
            } catch (e) {}
        };
        placeBtn();
        button.style.zIndex = "99999";
        button.style.pointerEvents = "auto";
        button.innerHTML = "";
        const syncTextPos = () => {
            text.style.left = button.style.left;
            text.style.top = `${parseFloat(button.style.top) + 32}px`;
            text.style.width = button.style.width;
        };
        syncTextPos();
        // 刷新按钮显示每技能独立锁与可点条件
        function updateBtn() {
            const skill = lib.skill[skillname];
            if (!skill) return;
            const locked = lib.gfShunfa.locked(player, skillname);
            const canClick = !locked && (!skill.gfShunfaFilter || skill.gfShunfaFilter(player));
            if (!canClick) {
                button.style.filter = "grayscale(1) brightness(0.55)";
                button.style.opacity = "0.45";
                button.style.pointerEvents = "none";
            } else {
                button.style.filter = "";
                button.style.opacity = "1";
                button.style.pointerEvents = "auto";
            }
        }
        player.node.gf_shunfaUpdate = updateBtn;
        updateBtn();
        // 动画与联机消息由框架统一处理
        let isDragging = false;
        let startX, startY, origLeft, origTop;
        const MOVE_THRESHOLD = 5;
        const onDown = (e) => {
            e.preventDefault();
            const p = e.touches ? e.touches[0] : e;
            startX = p.clientX;
            startY = p.clientY;
            origLeft = parseFloat(button.style.left);
            origTop = parseFloat(button.style.top);
            isDragging = false;
        };
        const onMove = (e) => {
            if (startX === undefined) return;
            const p = e.touches ? e.touches[0] : e;
            const dx = p.clientX - startX;
            const dy = p.clientY - startY;
            button.style.left = origLeft + dx + "px";
            button.style.top = origTop + dy + "px";
            syncTextPos();
            if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
                isDragging = true;
            }
        };
        const onUp = (e) => {
            if (startX === undefined) return;
            if (!isDragging) {
                doClickAction();
            }
            startX = startY = undefined;
        };
        // 点击只累积请求全场播放动画等当前结算结束后再由框架执行
        function doClickAction() {
            const skill = lib.skill[skillname];
            if (!skill) return;
            if (lib.gfShunfa.locked(player, skillname)) return;
            if (skill.gfShunfaFilter && !skill.gfShunfaFilter(player)) return;
            if (!player.isUnderControl(true)) return;
            const pos = {
                top: button.style.top,
                left: button.style.left,
                width: button.style.width,
                height: button.style.height
            };
            // 全场播放点击动画
            lib.gfShunfa.playVideo(pos, player.playerid);
            if (game.online) {
                game.send("gf_shunfa_play", pos, player.playerid);
                game.send("gf_shunfa_click", player.playerid, skillname);
            } else {
                game.broadcastAll(lib.gfShunfa.playVideo, pos, player.playerid);
            }
            // 房主与单机本机登记并排队客机等房主回填
            if (!game.online || lib.node) {
                lib.gfShunfa.addReq(player, skillname);
                lib.gfShunfa.schedule(player, skillname);
            }
        }
        button.addEventListener("mousedown", onDown);
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        button.addEventListener("touchstart", onDown, { passive: false });
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onUp);
        if (lib.node && lib.node.clients && lib.node.clients.length) {
            const _pid = player.playerid;
            const _sk = skillname;
            try {
                game.broadcast(function (pid, sk) {
                    var p = lib.playerOL[pid];
                    if (p && p.node && p.gf_initShunfa && !p.node.gf_shunfaBtn) p.gf_initShunfa(sk);
                }, _pid, _sk);
            } catch (e) {}
        }
    };
    lib.skill.gf_shunfaCD = {
        trigger: {
            player: ["logSkill", "useCardAfter", "gainCard", "respond", "changeHpAfter"],
        },
        priority: 75,
        firstDo: true,
        forced: true,
        silent: true,
        async content(event, trigger, player) {
            if (!game.hasPlayer(function (current) {
                return current.node && current.node.gf_shunfaUpdate;
            })) return;
            var list = game.filterPlayer();
            for (var i = 0; i < list.length; i++) {
                if (list[i].node && list[i].node.gf_shunfaUpdate) {
                    list[i].node.gf_shunfaUpdate();
                }
            }
        }
    };
    game.addGlobalSkill('gf_shunfaCD');
    game.addGlobalSkill('gzt_chushi_sync');
    // 初识历史同步
    if (lib.skill && lib.skill.global && !lib.skill.global.includes('gzt_chushi_sync') && typeof game.addGlobalSkill === 'function') {
        game.addGlobalSkill('gzt_chushi_sync');
    }
    // 余响技配置
    lib.element.player.gf_initYuxiang = function () {
        let player = this;
        if (!player.storage.GFyuxiang) player.storage.GFyuxiang = 0;
        if (!player.hasSkill("GF_yuxiang")) {
            player.addSkill("GF_yuxiang");
        }
    };
    lib.skill.GF_yuxiang = {
        enable: "phaseUse",
        usable: 1,
        GFyuxiangSkill: true,
        filter: function (event, player) {
            for (var j of player.skills) {
                if (j == "GF_yuxiang") continue;
                if (lib.skill[j]?.GFyuxiangSkill) return true;
            }
            return false;
        },
        async content(event, trigger, player) {
            const skills = [];
            for (var j of player.skills) {
                if (j == "GF_yuxiang") continue;
                const skill = lib.skill[j];
                if (skill && skill.GFyuxiangSkill) skills.push(j);
            }
            if (skills.length === 0) return;
            const result = await player
                .chooseControl(skills)
                .set('choiceList', skills.map(function (i) {
                    return '<div class="skill">【' + get.translation(lib.translate[i + '_ab'] || get.translation(i).slice(0, 2)) + '】</div><div>' + get.skillInfoTranslation(i, player) + '</div>';
                }))
                .set('displayIndex', false)
                .set('prompt', '余响：请选择你要失去的技能')
                .set('ai', () => {
                    var list = _status.event.controls.slice();
                    return list.sort((a, b) => {
                        return get.skillRank(b, 'in') - get.skillRank(a, 'in');
                    })[0];
                })
                .forResult();
            if (result?.control) {
                const s = lib.skill[result.control];
                delete s.forced;
                delete s.charlotte;
                delete s.fixed;
                delete s.superCharlotte;
                delete s.persevereSkill;
                await player.removeSkills(result.control);
                await player.draw(3);
            }
        }
    };

    // 律道技
    (function () {
        const PlayerProto = lib.element.Player.prototype;
        const _removeSkill = PlayerProto.removeSkill;
        PlayerProto.removeSkill = function (skill) {
            if (typeof skill === "string" && lib.skill[skill] && lib.skill[skill].lvdao) return skill;
            return _removeSkill.apply(this, arguments);
        };
        const _removeSkillTrigger = PlayerProto.removeSkillTrigger;
        PlayerProto.removeSkillTrigger = function (skills, triggeronly) {
            if (typeof skills === "string") {
                if (lib.skill[skills] && lib.skill[skills].lvdao) return this;
            } else if (Array.isArray(skills)) {
                const keep = skills.filter(function (s) { return !(lib.skill[s] && lib.skill[s].lvdao); });
                if (!keep.length) return this;
                skills = keep;
            }
            return _removeSkillTrigger.apply(this, arguments);
        };
        const _disableSkill = PlayerProto.disableSkill;
        PlayerProto.disableSkill = function (skill, skills) {
            if (Array.isArray(skill)) {
                const keep = skill.filter(function (s) { return !(lib.skill[s] && lib.skill[s].lvdao); });
                if (!keep.length) return this;
                return _disableSkill.call(this, keep, skills);
            }
            if (typeof skill === "string" && lib.skill[skill] && lib.skill[skill].lvdao) return this;
            return _disableSkill.apply(this, arguments);
        };
        const _filterSkills = game.filterSkills;
        game.filterSkills = function (skills, player, exclude) {
            const out = _filterSkills.apply(this, arguments);
            if (player && player.skills) {
                const pool = Array.from(player.skills);
                for (const k in player.tempSkills) pool.push(k);
                pool.push.apply(pool, player.invisibleSkills);
                pool.push.apply(pool, player.hiddenSkills);
                for (const k in player.additionalSkills) {
                    const a = player.additionalSkills[k];
                    if (Array.isArray(a)) pool.push.apply(pool, a);
                    else if (a) pool.push(a);
                }
                for (let i = 0; i < pool.length; i++) {
                    const s = pool[i];
                    if (lib.skill[s] && lib.skill[s].lvdao && out.indexOf(s) < 0) out.push(s);
                }
            }
            return out;
        };
        const _checkMod = game.checkMod;
        game.checkMod = function () {
            const args = Array.prototype.slice.call(arguments);
            const result = _checkMod.apply(this, args);
            if (result === true && typeof args[1] === "string" && lib.skill[args[1]] && lib.skill[args[1]].lvdao) return "unchanged";
            return result;
        };
        const _filterTrigger = lib.filter.filterTrigger;
        lib.filter.filterTrigger = function (event, player, triggerName, skill, indexedData) {
            if (lib.skill[skill] && lib.skill[skill].lvdao && player && player._hookTrigger) {
                const saved = player._hookTrigger;
                player._hookTrigger = saved.filter(function (i) {
                    return !(lib.skill[i] && lib.skill[i].hookTrigger && lib.skill[i].hookTrigger.block);
                });
                try {
                    return _filterTrigger.apply(this, arguments);
                } finally {
                    player._hookTrigger = saved;
                }
            }
            return _filterTrigger.apply(this, arguments);
        };
        const _tempBanSkill = PlayerProto.tempBanSkill;
        PlayerProto.tempBanSkill = function (skill, expire, log) {
            if (typeof skill === "string") {
                if (lib.skill[skill] && lib.skill[skill].lvdao) return skill;
            } else if (Array.isArray(skill)) {
                const keep = skill.filter(function (s) { return !(lib.skill[s] && lib.skill[s].lvdao); });
                if (!keep.length) return skill;
                return _tempBanSkill.call(this, keep, expire, log);
            }
            return _tempBanSkill.apply(this, arguments);
        };
    })();

    // 开局隐匿角色注册表
    lib.gflib_startHidden = ["gzt_jh", "gzt_ht", "gzt_rl", "gzt_nlj"];
    lib.element.player.gf_applyStartHidden = function () {
        const name1 = this.name1 || this.name;
        const name2 = this.name2;
        if (lib.gflib_startHidden.includes(name1) || (name2 && lib.gflib_startHidden.includes(name2))) {
            this.gf_hideCharacter(0, false);
        }
    };
    if (!lib.skill.gf_startHidden) {
        lib.skill.gf_startHidden = {
            trigger: { global: "gameStart" },
            forced: true,
            silent: true,
            content: function (event, trigger, player) {
                if (game.online) return;
                game.players.forEach(function (p) {
                    if (p.gf_applyStartHidden) p.gf_applyStartHidden();
                });
            }
        };
    }
    if (!lib.skill.global.includes("gf_startHidden")) game.addGlobalSkill("gf_startHidden");
    if (!lib.skill.global.includes("gf_changecharacter_before")) game.addGlobalSkill("gf_changecharacter_before");
    if (!lib.skill.global.includes("gf_changecharacter_after")) game.addGlobalSkill("gf_changecharacter_after");

    // 寿元进度条
    if (!lib._gflib_syncTimer) {
        lib._gflib_syncTimer = setInterval(function () {
            try {
                if (!game || !game.players) return;
                if (!lib.gflib_qiBars) lib.gflib_qiBars = {};
                var all = game.players.concat(game.dead || []);
                for (var i = 0; i < all.length; i++) {
                    var p = all[i];
                    if (!p) continue;
                    if ((p.storage && p.storage.gzr_shouyuanCleared) || (p.isDead && p.isDead())) {
                        if (lib.gflib_qiBars[p.playerid] && lib.gflib_removeQiBarDom) lib.gflib_removeQiBarDom(p.playerid);
                        continue;
                    }
                    if (p.storage && typeof p.storage.gzr_shouyuan === "number" && isFinite(p.storage.gzr_shouyuan)) {
                        if (!lib.gflib_qiBars[p.playerid]) {
                            try { lib.gflib_initQiBar(p, p.storage.gzr_shouyuan, p.storage.gzr_shouyuanMax); } catch (e2) {}
                        }
                        if (lib.gflib_qiBars[p.playerid]) {
                            lib.gflib_qiBars[p.playerid].value = p.storage.gzr_shouyuan;
                            if (typeof p.storage.gzr_shouyuanMax === "number" && isFinite(p.storage.gzr_shouyuanMax) && p.storage.gzr_shouyuanMax > 0) {
                                lib.gflib_qiBars[p.playerid].max = p.storage.gzr_shouyuanMax;
                            }
                            lib.gflib_updateQiBarUI(p);
                        }
                    }
                    if (p.storage && p.storage.gzr_hpHidden && p.node) {
                        if (p.node.hp) p.node.hp.style.display = 'none';
                        if (p.node.hpbg) p.node.hpbg.style.display = 'none';
                        if (p.node.hptext) p.node.hptext.style.display = 'none';
                    }
                }
                if (lib.gflib_sweepQiBars) lib.gflib_sweepQiBars();
            } catch (e) {}
        }, 200);
    }
    lib.gflib_qiBars = {};
    lib.gflib_normalizeQiArgs = function(init, max) {
        var i = Number(init);
        var m = Number(max);
        if (!isFinite(m) || m <= 0) m = (isFinite(i) && i > 0) ? i : 1;
        if (!isFinite(i)) i = m;
        i = Math.max(Math.min(i, m), 0);
        return { init: i, max: m };
    };
    lib.gflib_getQiBarOwner = function(pid) {
        if (pid && pid.playerid !== undefined) return pid;
        var list = (game.players || []).concat(game.dead || []);
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].playerid === pid) return list[i];
        }
        return null;
    };
    lib.gflib_getQiBarName = function(player, title) {
        if (typeof title === 'string' && title) return title;
        if (!player) return '寿元';
        var key = player.name1 || player.name || player.name2;
        var str = '';
        try { str = key ? get.translation(key) : ''; } catch (e) {}
        if (!str || str === 'undefined') str = key || '';
        return str || '寿元';
    };
    lib.gflib_getQiBarContainer = function() {
        if (lib.gflib_qiBarContainer) return lib.gflib_qiBarContainer;
        var win = ui.window || document.body;
        var outer = document.createElement('div');
        outer.id = 'gflib_qiBarContainer';
        Object.assign(outer.style, {
            position: 'absolute',
            top: '12px',
            left: '0',
            width: '100%',
            height: '34px',
            zIndex: '9999',
            pointerEvents: 'none'
        });
        var stage = document.createElement('div');
        stage.id = 'gflib_qiBarStage';
        var sw = 240;
        var ww = win.clientWidth || win.offsetWidth || window.innerWidth || 1200;
        var sl = Math.max(0, Math.floor((ww - sw) / 2));
        Object.assign(stage.style, {
            position: 'absolute',
            top: '0',
            left: sl + 'px',
            width: sw + 'px',
            height: '100%'
        });
        outer.appendChild(stage);
        win.appendChild(outer);
        lib.gflib_qiBarContainer = outer;
        lib.gflib_qiBarStage = stage;
        try { window.addEventListener('resize', function () {
            if (!lib.gflib_qiBarStage) return;
            var win2 = ui.window || document.body;
            var ww2 = win2.clientWidth || win2.offsetWidth || window.innerWidth || 1200;
            lib.gflib_qiBarStage.style.left = Math.max(0, Math.floor((ww2 - 240) / 2)) + 'px';
        }); } catch (e) {}
        return outer;
    };
    // 总宽恒定240px
    lib.gflib_qiBarGap = 8;
    lib.gflib_relayoutQiBars = function() {
        if (!lib.gflib_qiBars) return;
        var keys = Object.keys(lib.gflib_qiBars);
        var n = keys.length;
        if (n === 0) return;
        if (lib.gflib_qiBarStage) {
            var win = ui.window || document.body;
            var ww = win.clientWidth || win.offsetWidth || window.innerWidth || 1200;
            lib.gflib_qiBarStage.style.left = Math.max(0, Math.floor((ww - 240) / 2)) + 'px';
        }
        var gap = lib.gflib_qiBarGap;
        var w = (240 - gap * (n - 1)) / n;
        if (!isFinite(w) || w <= 0) w = 40;
        for (var i = 0; i < keys.length; i++) {
            var b = lib.gflib_qiBars[keys[i]];
            if (!b) continue;
            if (b.wrap) {
                b.wrap.style.position = 'absolute';
                b.wrap.style.top = '0';
                b.wrap.style.left = (i * (w + gap)) + 'px';
                b.wrap.style.width = w + 'px';
            }
            if (b.label) {
                b.label.style.width = '100%';
                b.label.style.minWidth = '0';
                b.label.style.display = 'block';
                b.label.style.textAlign = 'center';
                b.label.style.overflow = 'hidden';
                b.label.style.textOverflow = 'ellipsis';
                b.label.style.letterSpacing = n > 2 ? '0px' : '2px';
                b.label.style.fontSize = n > 2 ? '10px' : '11px';
            }
        }
    };
    // 初始化进度条 (调用者, 初始值, 上限, 绑定角色, 自定义名字)
    lib.gflib_initQiBar = function(player, init, max, owner, title) {
        var bind = owner || player;
        if (!bind) return null;
        if (!lib.gflib_qiBars) lib.gflib_qiBars = {};
        var pid = bind.playerid;
        var args = lib.gflib_normalizeQiArgs(init, max);
        if (bind.storage) delete bind.storage.gzr_shouyuanCleared;
        if (lib.gflib_qiBars[pid]) {
            var exist = lib.gflib_qiBars[pid];
            exist.max = args.max;
            exist.value = args.init;
            exist.owner = pid;
            if (exist.label) exist.label.textContent = lib.gflib_getQiBarName(bind, title);
            lib.gflib_updateQiBarUI(bind);
            lib.gflib_syncQiStorage(bind, args.init, args.max);
            return exist;
        }
        var container = lib.gflib_getQiBarContainer();
        var label = document.createElement('span');
        label.className = 'gflib_qiLabel';
        Object.assign(label.style, {
            fontSize: '11px',
            color: '#d4a017',
            fontWeight: 'bold',
            textShadow: '0 0 3px #000, 0 0 6px #4a2800, 1px 1px 2px #000',
            whiteSpace: 'nowrap',
            letterSpacing: '2px',
            width: '100%',
            minWidth: '0',
            display: 'block',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        });
        label.textContent = lib.gflib_getQiBarName(bind, title);
        var wrap = document.createElement('div');
        Object.assign(wrap.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            display: 'block',
            textAlign: 'center',
            overflow: 'hidden'
        });
        wrap.appendChild(label);
        var barBase = document.createElement('div');
        barBase.className = 'gflib_qiBarBase';
        Object.assign(barBase.style, {
            boxSizing: 'border-box',
            width: '100%',
            height: '14px',
            borderRadius: '7px',
            backgroundColor: 'rgba(40, 20, 0, 0.85)',
            border: '1.5px solid #8B6914',
            boxShadow: '0 0 8px rgba(212, 160, 23, 0.5), inset 0 0 4px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            position: 'relative'
        });
        var barFill = document.createElement('div');
        barFill.className = 'gflib_qiBarFill';
        Object.assign(barFill.style, {
            boxSizing: 'border-box',
            position: 'absolute',
            left: '0',
            top: '0',
            height: '100%',
            width: '0%',
            borderRadius: '6px',
            background: 'linear-gradient(90deg, #6b3000, #d4a017, #ffda61, #d4a017, #6b3000)',
            backgroundSize: '200% 100%',
            transition: 'width 0.35s ease-out',
            boxShadow: 'inset 0 0 6px rgba(255,220,100,0.4)'
        });
        var textSpan = document.createElement('span');
        textSpan.className = 'gflib_qiText';
        Object.assign(textSpan.style, {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10px',
            color: '#FFF8DC',
            fontWeight: '900',
            textShadow: '0 0 3px #000, 0 0 5px rgba(0,0,0,0.9)',
            whiteSpace: 'nowrap',
            zIndex: '2',
            pointerEvents: 'none'
        });
        textSpan.textContent = args.init + '/' + args.max;
        barBase.appendChild(barFill);
        barBase.appendChild(textSpan);
        wrap.appendChild(barBase);
        var barStage = lib.gflib_qiBarStage || lib.gflib_getQiBarContainer();
        barStage.appendChild(wrap);
        lib.gflib_qiBars[pid] = { wrap: wrap, label: label, fill: barFill, text: textSpan, max: args.max, value: args.init, owner: pid };
        lib.gflib_updateQiBarUI(bind);
        lib.gflib_relayoutQiBars();
        lib.gflib_syncQiStorage(bind, args.init, args.max);
        return lib.gflib_qiBars[pid];
    };
    // 只有主机写storage并广播
    lib.gflib_syncQiStorage = function(player, value, max) {
        if (!player || !player.storage) return;
        if (game.online) return;
        player.storage.gzr_shouyuan = value;
        player.storage.gzr_shouyuanMax = max;
        if (game.broadcast) {
            game.broadcast(function(pid, val, mx) {
                var p = (game.players || []).concat(game.dead || []).find(function (x) { return x && x.playerid === pid; });
                if (p && p.storage) {
                    p.storage.gzr_shouyuan = val;
                    p.storage.gzr_shouyuanMax = mx;
                    delete p.storage.gzr_shouyuanCleared;
                }
            }, player.playerid, value, max);
        }
    };
    // 传角色或playerid都行
    lib.gflib_updateQiBarUI = function(player) {
        if (!player) return;
        var pid = (player.playerid !== undefined) ? player.playerid : player;
        var bar = lib.gflib_qiBars[pid];
        if (!bar) return;
        var current = bar.value || 0;
        var max = bar.max || 1;
        var percent = max > 0 ? Math.min((current / max) * 100, 100) : 0;
        bar.fill.style.width = percent + '%';
        bar.text.textContent = current + '/' + max;
        bar.wrap.style.display = 'block';
    };
    // 只摘DOM不动storage给广播与兜底定时器复用
    lib.gflib_removeQiBarDom = function(pid) {
        if (!lib.gflib_qiBars) return false;
        if (pid && pid.playerid !== undefined) pid = pid.playerid;
        var bar = lib.gflib_qiBars[pid];
        if (!bar) return false;
        try { if (bar.wrap && bar.wrap.parentNode) bar.wrap.parentNode.removeChild(bar.wrap); } catch (e) {}
        delete lib.gflib_qiBars[pid];
        lib.gflib_relayoutQiBars();
        return true;
    };
    // 清除进度条
    lib.gflib_clearQiBar = function(player) {
        if (!player) return false;
        var pid = (player.playerid !== undefined) ? player.playerid : player;
        var removed = lib.gflib_removeQiBarDom(pid);
        var target = lib.gflib_getQiBarOwner(player);
        if (target && target.storage) {
            target.storage.gzr_shouyuanCleared = true;
            delete target.storage.gzr_shouyuan;
            delete target.storage.gzr_shouyuanMax;
        }
        if (game.broadcast && !game.online) {
            game.broadcast(function(pid) {
                var p = (game.players || []).concat(game.dead || []).find(function (x) { return x && x.playerid === pid; });
                if (p && p.storage) {
                    p.storage.gzr_shouyuanCleared = true;
                    delete p.storage.gzr_shouyuan;
                    delete p.storage.gzr_shouyuanMax;
                }
            }, pid);
        }
        return removed;
    };
    // 清全部条
    lib.gflib_clearAllQiBars = function() {
        var pids = Object.keys(lib.gflib_qiBars || {});
        for (var i = 0; i < pids.length; i++) {
            lib.gflib_clearQiBar(lib.gflib_getQiBarOwner(pids[i]) || pids[i]);
        }
    };
    // 兜底扫描
    lib.gflib_sweepQiBars = function() {
        if (!lib.gflib_qiBars) return;
        var pids = Object.keys(lib.gflib_qiBars);
        for (var i = 0; i < pids.length; i++) {
            var pid = pids[i];
            var owner = lib.gflib_getQiBarOwner(pid);
            if (!owner) { lib.gflib_removeQiBarDom(pid); continue; }
            if (owner.isDead && owner.isDead()) { lib.gflib_removeQiBarDom(pid); continue; }
            if (owner.storage && owner.storage.gzr_shouyuanCleared) lib.gflib_removeQiBarDom(pid);
        }
    };
    lib.gflib_getQiMax = function(player) {
        if (!player) return 50;
        var bar = lib.gflib_qiBars ? lib.gflib_qiBars[player.playerid] : null;
        if (bar && isFinite(bar.max) && bar.max > 0) return bar.max;
        if (player.storage && isFinite(player.storage.gzr_shouyuanMax) && player.storage.gzr_shouyuanMax > 0) return player.storage.gzr_shouyuanMax;
        return 50;
    };
    lib.gflib_changeQi = function(player, num) {
        num = Number(num);
        if (!isFinite(num)) num = 0;
        if (!lib.gflib_qiBars) lib.gflib_qiBars = {};
        if (player.storage && player.storage.gzr_shouyuanCleared) return 0;
        var cur;
        if (player.storage && typeof player.storage.gzr_shouyuan === "number" && isFinite(player.storage.gzr_shouyuan)) {
            cur = player.storage.gzr_shouyuan;
        } else {
            var b0 = lib.gflib_qiBars[player.playerid];
            cur = b0 ? (isFinite(b0.value) ? b0.value : (isFinite(b0.max) ? b0.max : 50)) : 50;
        }
        var max = lib.gflib_getQiMax(player);
        var newVal = Math.max(Math.min(cur + num, max), 0);
        if (player.storage) player.storage.gzr_shouyuan = newVal;
        if (!lib.gflib_qiBars[player.playerid]) lib.gflib_initQiBar(player, newVal, max);
        if (lib.gflib_qiBars[player.playerid]) {
            lib.gflib_qiBars[player.playerid].value = newVal;
            lib.gflib_qiBars[player.playerid].max = max;
            lib.gflib_updateQiBarUI(player);
        }
        if (game.broadcast && !game.online) {
            game.broadcast(function(pid, val, mx) {
                var p = (game.players || []).concat(game.dead || []).find(function (x) { return x && x.playerid === pid; });
                if (p && p.storage) {
                    p.storage.gzr_shouyuan = val;
                    p.storage.gzr_shouyuanMax = mx;
                }
            }, player.playerid, newVal, max);
        }
        return newVal;
    };
    lib.gflib_setQi = function(player, val) {
        val = Number(val);
        if (!isFinite(val)) val = 0;
        if (!lib.gflib_qiBars) lib.gflib_qiBars = {};
        if (player.storage && player.storage.gzr_shouyuanCleared) return 0;
        var bar = lib.gflib_qiBars[player.playerid];
        var max = (bar && isFinite(bar.max) && bar.max > 0) ? bar.max : ((player.storage && isFinite(player.storage.gzr_shouyuanMax) && player.storage.gzr_shouyuanMax > 0) ? player.storage.gzr_shouyuanMax : Math.max(val, 1));
        var newVal = Math.max(Math.min(val, max), 0);
        if (player.storage) player.storage.gzr_shouyuan = newVal;
        if (!lib.gflib_qiBars[player.playerid]) lib.gflib_initQiBar(player, newVal, max);
        if (lib.gflib_qiBars[player.playerid]) {
            lib.gflib_qiBars[player.playerid].value = newVal;
            lib.gflib_qiBars[player.playerid].max = max;
            lib.gflib_updateQiBarUI(player);
        }
        if (game.broadcast && !game.online) {
            game.broadcast(function(pid, val, mx) {
                var p = (game.players || []).concat(game.dead || []).find(function (x) { return x && x.playerid === pid; });
                if (p && p.storage) {
                    p.storage.gzr_shouyuan = val;
                    p.storage.gzr_shouyuanMax = mx;
                }
            }, player.playerid, newVal, max);
        }
        return newVal;
    };
    // (初始值, 上限, 绑定角色, 自定义名字) 只传一个数就当上限，初始值等于上限
    lib.element.player.gflib_initQiBar = function(init, max, owner, title) {
        return lib.gflib_initQiBar(this, init, max, owner, title);
    };
    // 清除进度条
    lib.element.player.gflib_clearQiBar = function(target) {
        return lib.gflib_clearQiBar(target || this);
    };
    lib.element.player.gflib_hasQiBar = function(target) {
        var p = target || this;
        if (!lib.gflib_qiBars) return false;
        if (lib.gflib_qiBars[p.playerid]) return true;
        return !!(p.storage && !p.storage.gzr_shouyuanCleared && typeof p.storage.gzr_shouyuan === "number");
    };
    lib.element.player.gflib_getQiMax = function() {
        return lib.gflib_getQiMax(this);
    };
    lib.element.player.gflib_changeQi = function(num) {
        return lib.gflib_changeQi(this, num);
    };
    lib.element.player.gflib_setQi = function(val) {
        return lib.gflib_setQi(this, val);
    };
    lib.element.player.gflib_getQi = function() {
        var v = this.storage ? this.storage.gzr_shouyuan : undefined;
        if (typeof v !== "number" || !isFinite(v)) {
            var b = lib.gflib_qiBars[this.playerid];
            v = b ? b.value : 0;
        }
        return isFinite(v) ? v : 0;
    };

    // 进度条阵亡检测
    lib.skill.gflib_qiBarDieCheck = {
        trigger: {
            player: ["dieBegin", "dieFrozenBegin"],
        },
        priority: 80,
        firstDo: true,
        forced: true,
        silent: true,
        filter: function(event, player, name) {
            if (!player) return false;
            if (player.storage && player.storage.gzr_shouyuanCleared) return false;
            if (player.storage && typeof player.storage.gzr_shouyuan === "number") return true;
            return !!(lib.gflib_qiBars && lib.gflib_qiBars[player.playerid]);
        },
        content: function() {
            lib.gflib_clearQiBar(player);
            if (lib.gflib_sweepQiBars) lib.gflib_sweepQiBars();
        }
    };
    if (!lib.skill.global.includes('gflib_qiBarDieCheck')) game.addGlobalSkill('gflib_qiBarDieCheck');

    // 无血条处理
    lib.element.player.gflib_hideHpBar = function() {
        var player = this;
        player._gflib_hpHidden = true;
        if (player.storage) player.storage.gzr_hpHidden = true;
        if (game.broadcast && !game.online) {
            game.broadcast(function(pid, flag) {
                var p = (game.players || []).find(function (x) { return x && x.playerid === pid; });
                if (p && p.storage) p.storage.gzr_hpHidden = flag;
            }, player.playerid, true);
        }
        if (player.node) {
            if (player.node.hp) player.node.hp.style.display = 'none';
            if (player.node.hpbg) player.node.hpbg.style.display = 'none';
            if (player.node.hptext) player.node.hptext.style.display = 'none';
        }
    };
    lib.element.player.gflib_showHpBar = function() {
        var player = this;
        player._gflib_hpHidden = false;
        if (player.storage) player.storage.gzr_hpHidden = false;
        if (game.broadcast && !game.online) {
            game.broadcast(function(pid, flag) {
                var p = (game.players || []).find(function (x) { return x && x.playerid === pid; });
                if (p && p.storage) p.storage.gzr_hpHidden = flag;
            }, player.playerid, false);
        }
        if (player.node) {
            if (player.node.hp) player.node.hp.style.display = '';
            if (player.node.hpbg) player.node.hpbg.style.display = '';
            if (player.node.hptext) player.node.hptext.style.display = '';
        }
    };
}
