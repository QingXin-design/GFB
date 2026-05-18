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
        if (type) {
            if (get.gflib_typeFrozen(this, type)) return this.gflib_frozen || 0;
            if (this.storage[type]) {
                return typeof this.storage[type] === 'number' 
                    ? this.storage[type] 
                    : (this.storage[type]?.gflib_frozen || 0);
            }
            return 0;
        }
        return this.gflib_frozen || 0;
    };

    lib.element.player.gflib_getMaxFrozen = function(type) {
        return this.hp * 2 || 0;
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
                    const [initFrozen, maxFrozen] = config.slice(12).split('/').map(Number);
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
        const max = player.hp * 2;
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
        let max = player.hp * 2;
        let newVal = Math.min(Math.max(current + num, 0), max);
        if (max !== Infinity) newVal = Math.min(newVal, max);
        if (targetType && get.gflib_typeFrozen(this, targetType)) {
            player.gflib_frozen = newVal;
        } else if (player.storage[targetType]) {
            if (typeof player.storage[targetType] === 'number') {
                player.storage[targetType] = newVal;
            } else {
                player.storage[targetType].gflib_frozen = newVal;
            }
            player.syncStorage(targetType);
        }

        game.broadcast(function (targetPlayer, sourcePlayer, newVal, max, targetType) {
            if (targetPlayer.id !== sourcePlayer.id) return;
            if (targetType && get.gflib_typeFrozen(targetPlayer, targetType)) {
                targetPlayer.gflib_frozen = newVal;
            } else if (targetPlayer.storage[targetType]) {
                if (typeof targetPlayer.storage[targetType] === 'number') {
                    targetPlayer.storage[targetType] = newVal;
                } else {
                    targetPlayer.storage[targetType].gflib_frozen = newVal;
                }
            }
            targetPlayer.gflib_updateFrozenUI();
        }, this, this, newVal, max, targetType);

        setTimeout(() => player.gflib_updateFrozenUI(), 50);
        if (newVal > 0 && newVal >= player.hp * 2 && player.isAlive() && !player.isOut()) {
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

        this.node.gflib_frozen.type = type || config?.type || 'gflib_frozen';
        this.gflib_updateFrozenUI();
        return this;
    };

    lib.element.player.gflib_updateFrozen = function() {
        game.broadcast(function(player, frozen, maxFrozen, type) {
            if (!player.node.gflib_frozenContainer) player.gflib_initFrozen();
            player.gflib_frozen = frozen;
            player.gflib_maxFrozen = maxFrozen;
            player.node.gflib_frozen.type = type;
            player.gflib_updateFrozenUI();
        }, this, this.gflib_frozen, this.gflib_maxFrozen, this.node.gflib_frozen.type);
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
}
