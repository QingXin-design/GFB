import { lib, game, ui, get, ai, _status } from '../../../noname.js';
import { initShipei } from './shipei.js';

let gflib_version = 48;
export function gflib(lib, game, ui, get, ai, _status, datasrc) {
	// 联机兼容补丁 1.11.1.5 客机缺少 game.sendInfo 引擎联机同步时会调用它 缺失则抛错 在此兜底为空实现
	if (game && typeof game.sendInfo !== "function") {
		game.sendInfo = function (info) {};
	}
	// 联机兼容补丁 lib.hooks.checkUpdate 在该版本是数组 无 .has/.add 方法 引擎调用会抛错 在此兜底
	if (lib && lib.hooks && lib.hooks.checkUpdate) {
		if (typeof lib.hooks.checkUpdate.has !== "function") lib.hooks.checkUpdate.has = function () { return false; };
		if (typeof lib.hooks.checkUpdate.add !== "function") lib.hooks.checkUpdate.add = function () {};
	}
	/*lib.element.player.changeBackground = function (characterName) {
		try {
			const bgPath = lib.assetURL + "extension/鸽府包/image/animation/" + characterName + ".mp4";
			ui.background.setBackgroundImage(bgPath);
		} catch (e) {
			console.warn("更换背景失败：", characterName, e);
		}
	};
	lib.element.player.playBgm = function (characterName) {
		try {
			const bgmPath = lib.assetURL + "extension/鸽府包/audio/bgm/" + characterName + ".mp3";
			ui.backgroundMusic.pause();
			ui.backgroundMusic.src = bgmPath;
			ui.backgroundMusic.loop = true;
			ui.backgroundMusic.play();
		} catch (e) {
			console.warn("播放背景音乐失败：", characterName, e);
		}
	};*/

// 便捷添加表情包组
function addEmotionPack(packName, showName, count, imgPath) {
    if (!_status) return;
    if (!_status.emotion_cache) _status.emotion_cache = {};
    _status.emotion_cache[packName] = Array.from(
        { length: count },
        (_, i) => (i + 1) + ".gif"
    );
    _status.emotion_cache[`${packName}_path`] = imgPath; 
    _status.emotion_cache[`${packName}_show`] = showName;
}
function loadAllEmotions() {
    if (!_status) return;
    if (!_status.emotion_cache) _status.emotion_cache = {};
    addEmotionPack(
        "luoxiaohei_emotion", 
        "罗小黑", 
        17, 
        `${lib.assetURL}extension/鸽府包/image/emotion/luoxiaohei_emotion/`
    );
}


function overrideChatFunction() {
    if (window._chatFunctionOverridden) return;
    window._chatFunctionOverridden = true;
    const originalChat = ui.click.chat;
    ui.click.chat = function () {
        const chatUIContext = { isChat: true };
        ui.system1.classList.add("shown");
        ui.system2.classList.add("shown");
        var uiintro = ui.create.dialog("hidden");
        uiintro.listen(function (e) {
            e.stopPropagation();
            if (!e.target || e.target.tagName.toLowerCase() !== 'input') {
                e.preventDefault();
            }
        });
        var closeChatMenu;
        if (lib.config.extension_鸽府包_gfb_ltcd) {
            closeChatMenu = function () {
                if (uiintro && uiintro.hide) uiintro.hide();
                else if (uiintro && uiintro.remove) uiintro.remove();
                else if (uiintro && uiintro.parentNode) uiintro.parentNode.removeChild(uiintro);
                ui.system1.classList.remove("shown");
                ui.system2.classList.remove("shown");
            };
        }
        var list = ui.create.div(".caption");
        if (get.is.phoneLayout()) {
            list.style.maxHeight = "110px";
        } else {
            list.style.maxHeight = "220px";
        }
        list.style.overflow = "scroll";
        lib.setScroll(list);
        uiintro.contentContainer.style.overflow = "hidden";
        var addChatEntry = function (info, clear) {
            if (list._chatempty) { list.innerHTML = ""; delete list._chatempty; }
            var node2 = ui.create.div(".text.chat");
            node2.innerHTML = info[0] + ": " + info[1];
            list.appendChild(node2);
            list.scrollTop = list.scrollHeight;
            uiintro.style.height = uiintro.content.scrollHeight + "px";
        };
        _status.addChatEntry = addChatEntry;
        _status.addChatEntry._origin = uiintro;
        let chatHistory = lib.chatHistory || [];
        if (chatHistory.length) {
            for (var i = 0; i < chatHistory.length; i++) addChatEntry(chatHistory[i]);
        } else {
            list._chatempty = true;
            list.appendChild(ui.create.div(".text.center", "无聊天记录"));
        }
        uiintro.add(list);
        uiintro.style.height = uiintro.content.offsetHeight + "px";
        list.scrollTop = list.scrollHeight;
        if (!_status.chatValue) _status.chatValue = "";
        let chatInputValue = _status.chatValue;
        var node = uiintro.add('<input type="text" value="' + _status.chatValue + '">');
        node.style.paddingTop = 0;
        node.style.marginBottom = "16px";
        const input = node.firstChild;
        input.style.width = "calc(100% - 20px)";
        input.addEventListener('blur', function () {
            if (!get.is.phoneLayout()) {
                this.focus();
            }
        });
        input.addEventListener('touchstart', function (e) {
            e.stopPropagation();
        }, { passive: true });
        input.onchange = function (e) {
            e.stopPropagation();
            chatInputValue = input.value;
            _status.chatValue = input.value;
        };
        let isComposing = false;
        input.addEventListener('compositionstart', e => { isComposing = true; e.stopPropagation(); });
        input.addEventListener('compositionend', e => {
            isComposing = false; e.stopPropagation();
            chatInputValue = input.value; _status.chatValue = input.value;
        });
        input.addEventListener('input', e => {
            e.stopPropagation();
            chatInputValue = input.value; _status.chatValue = input.value;
        });
        input.onkeydown = function (e) {
            e.stopPropagation();
            if (e.key === "Enter") {
                e.preventDefault();
                if (input.value.trim()) {
                    const sendChat = (str) => {
                        let player = game.me;
                        if (!player && game.connectPlayers) {
                            if (game.online) {
                                for (let i2 = 0; i2 < game.connectPlayers.length; i2++) {
                                    if (game.connectPlayers[i2].playerid === game.onlineID) {
                                        player = game.connectPlayers[i2]; break;
                                    }
                                }
                            } else {
                                player = game.connectPlayers[0];
                            }
                        }
                        if (!player) return;
                        try {
                            if (get.is.banWords(str)) {
                                player.say(str);
                            } else {
                                if (game.online) game.send("chat", game.onlineID, str);
                                else player.chat(str);
                            }
                            if (closeChatMenu) closeChatMenu();
                        } catch (err) { console.warn("聊天发送失败", err); }
                    };
                    sendChat(input.value);
                    input.value = "";
                    chatInputValue = "";
                    _status.chatValue = "";
                }
            }
        };
        uiintro._onopen = function () {
            list.scrollTop = list.scrollHeight;
            if (!get.is.phoneLayout()) {
                input.focus();
            }
        };
        uiintro._heightfixed = true;
        var emotionTitle = ui.create.div(".text.center", "聊天表情", function () {
            if (emotionTitle.innerHTML === "快捷语音") {
                emotionTitle.innerHTML = "聊天表情";
                if (list2) list2.remove(); if (list3) list3.remove(); if (list1) uiintro.add(list1);
            } else {
                emotionTitle.innerHTML = "快捷语音";
                if (list1) list1.remove(); if (list2) list2.remove(); if (list3) uiintro.add(list3);
            }
        });
        uiintro.add(emotionTitle);
        var list1 = ui.create.div("");
        list1.style.height = get.is.phoneLayout() ? "110px" : "150px";
        list1.style.overflow = "scroll";
        lib.setScroll(list1);
        uiintro.add(list1);
        var list2 = ui.create.div("");
        list2.style.height = get.is.phoneLayout() ? "110px" : "150px";
        list2.style.overflow = "scroll";
        lib.setScroll(list2);
        const createEmotion = function (name) {
			if (!_status || !_status.emotion_cache[name]) return;
			const files = _status.emotion_cache[name];
			list2.innerHTML = "";
			files.forEach(file => {
				const customPath = _status.emotion_cache[`${name}_path`];
				let imgSrc;
				if (customPath) {
					imgSrc = customPath + file;
				} else {
					const originalSrc = `${lib.assetURL}image/emotion/${name}/${file}`;
					imgSrc = originalSrc;
				}
				const img = new Image();
				img.onload = function () {
					const emotionButton = ui.create.div(".card.fullskin",
						`<img src="${img.src}" width="50" height="50">`,
						function () {
							let player = game.me;
							if (!player && game.connectPlayers) {
								if (game.online) {
									for (let j = 0; j < game.connectPlayers.length; j++) {
										if (game.connectPlayers[j].playerid === game.onlineID) {
											player = game.connectPlayers[j]; break;
										}
									}
								} else {
									player = game.connectPlayers[0];
								}
							}
							if (!player) return;
							try {
								if (game.online) game.send("emotion", game.onlineID, this.pack, this.emotionID);
								else player.emotion(this.pack, this.emotionID);
								if (closeChatMenu) closeChatMenu();
							} catch (err) { console.warn("表情发送失败", err); }
						}
					);
					emotionButton.emotionID = file;
					emotionButton.pack = name;
					emotionButton.style.height = "50px";
					emotionButton.style.width = "50px";
					list2.appendChild(emotionButton);
				};
				if (!customPath) {
					img.onerror = function () {
						this.src = `${lib.assetURL}extension/鸽府包/image/emotion/${name}/${file}`;
					};
				}
				img.src = imgSrc;
			});
		};
        loadAllEmotions();
        if (_status) {
			for (const folder in _status.emotion_cache) {
				if (folder.includes("_path") || folder.includes("_show")) continue;
				let displayName = folder;
				if (_status.emotion_cache[`${folder}_show`]) {
					displayName = _status.emotion_cache[`${folder}_show`];
				}
				const firstImg = _status.emotion_cache[folder][0] || "1.gif";
				const customPath = _status.emotion_cache[`${folder}_path`];
				let coverHtml;
				if (customPath) {
					coverHtml = `<img src="${customPath}${firstImg}" width="50" height="50">`;
				} else {
					const coverOriginal = `${lib.assetURL}image/emotion/${folder}/${firstImg}`;
					const coverExtension = `${lib.assetURL}extension/鸽府包/image/emotion/${folder}/${firstImg}`;
					coverHtml = `<img src="${coverOriginal}" width="50" height="50" onerror="this.src='${coverExtension}'">`;
				}
				const emotionPack = ui.create.div(".card.fullskin", coverHtml, function () {
					emotionTitle.innerHTML = get.translation ? get.translation(displayName) : displayName;
					createEmotion(this.pack);
					if (list1) list1.remove();
					uiintro.add(list2);
				});
				emotionPack.pack = folder;
				emotionPack.style.height = "50px";
				emotionPack.style.width = "50px";
				list1.appendChild(emotionPack);
			}
		}
        var list3 = ui.create.div(".caption");
        list3.style.height = get.is.phoneLayout() ? "110px" : "150px";
        list3.style.overflow = "scroll";
        lib.setScroll(list3);
        if (lib.quickVoice && lib.quickVoice.length) {
            for (var i = 0; i < lib.quickVoice.length; i++) {
                var voiceNode = ui.create.div(".text.chat", function () {
                    const str = this.innerHTML;
                    let player = game.me;
                    if (!player && game.connectPlayers) {
                        if (game.online) {
                            for (var i2 = 0; i2 < game.connectPlayers.length; i2++) {
                                if (game.connectPlayers[i2].playerid === game.onlineID) {
                                    player = game.connectPlayers[i2]; break;
                                }
                            }
                        } else {
                            player = game.connectPlayers[0];
                        }
                    }
                    if (!player) return;
                    try {
                        if (get.is.banWords(str)) player.say(str);
                        else {
                            if (game.online) game.send("chat", game.onlineID, str);
                            else player.chat(str);
                        }
                        if (closeChatMenu) closeChatMenu();
                    } catch (err) { console.warn("快捷语音发送失败", err); }
                });
                voiceNode.innerHTML = lib.quickVoice[i];
                list3.appendChild(voiceNode);
            }
        }
        list1.scrollTop = list1.scrollHeight;
        list3.scrollTop = list3.scrollHeight;
        uiintro.style.height = uiintro.content.scrollHeight + "px";
        return uiintro;
    };
}

// 自动执行
if (document.readyState === "complete") {
    overrideChatFunction();
} else {
    window.addEventListener("load", overrideChatFunction);
}




	/*function overrideChatFunction() {
		if (window._chatFunctionOverridden) return;
		window._chatFunctionOverridden = true;
		const originalChat = ui.click.chat;
		ui.click.chat = function() {
			const chatUIContext = { isChat: true };
			ui.system1.classList.add("shown");
			ui.system2.classList.add("shown");
			var uiintro = ui.create.dialog("hidden");
			uiintro.listen(function(e) {
				e.stopPropagation();
				if (!e.target || e.target.tagName.toLowerCase() !== 'input') {
					e.preventDefault();
				}
			});
			if (lib.config.extension_鸽府包_gfb_ltcd) {
				var closeChatMenu = function() {
					if (uiintro && uiintro.hide) uiintro.hide();
					else if (uiintro && uiintro.remove) uiintro.remove();
					else if (uiintro && uiintro.parentNode) uiintro.parentNode.removeChild(uiintro);
					ui.system1.classList.remove("shown");
					ui.system2.classList.remove("shown");
				};
			}
			var list = ui.create.div(".caption");
			if (get.is.phoneLayout()) {
				list.style.maxHeight = "110px";
			} else {
				list.style.maxHeight = "220px";
			}
			list.style.overflow = "scroll";
			lib.setScroll(list);
			uiintro.contentContainer.style.overflow = "hidden";
			var addChatEntry = function(info, clear) {
				if (list._chatempty) { list.innerHTML = ""; delete list._chatempty; }
				var node2 = ui.create.div(".text.chat");
				node2.innerHTML = info[0] + ": " + info[1];
				list.appendChild(node2);
				list.scrollTop = list.scrollHeight;
				uiintro.style.height = uiintro.content.scrollHeight + "px";
			};
			_status.addChatEntry = addChatEntry;
			_status.addChatEntry._origin = uiintro;
			let chatHistory = lib.chatHistory || [];
			if (chatHistory.length) {
				for (var i = 0; i < chatHistory.length; i++) addChatEntry(chatHistory[i]);
			} else {
				list._chatempty = true;
				list.appendChild(ui.create.div(".text.center", "无聊天记录"));
			}
			uiintro.add(list);
			uiintro.style.height = uiintro.content.offsetHeight + "px";
			list.scrollTop = list.scrollHeight;
			if (!_status.chatValue) _status.chatValue = "";
			let chatInputValue = _status.chatValue;
			var node = uiintro.add('<input type="text" value="' + _status.chatValue + '">');
			node.style.paddingTop = 0;
			node.style.marginBottom = "16px";
			const input = node.firstChild;
			input.style.width = "calc(100% - 20px)";
			input.addEventListener('blur', function() {
				if (!get.is.phoneLayout()) {
					this.focus();
				}
			});
			input.addEventListener('touchstart', function(e) {
				e.stopPropagation();
			}, { passive: true });
			input.onchange = function(e) {
				e.stopPropagation();
				chatInputValue = input.value;
				_status.chatValue = input.value;
			};
			input.onkeydown = function(e) {
				e.stopPropagation();
				if (e.key === "Enter") {
					e.preventDefault();
					if (input.value.trim()) {
						const sendChat = (str) => {
							let player = game.me;
							if (!player && game.connectPlayers) {
								if (game.online) {
									for (let i2 = 0; i2 < game.connectPlayers.length; i2++) {
										if (game.connectPlayers[i2].playerid === game.onlineID) {
											player = game.connectPlayers[i2]; break;
										}
									}
								} else {
									player = game.connectPlayers[0];
								}
							}
							if (!player) return;
							try {
								if (get.is.banWords(str)) {
									player.say(str);
								} else {
									if (game.online) game.send("chat", game.onlineID, str);
									else player.chat(str);
								}
								if (closeChatMenu) closeChatMenu();
							} catch (err) { console.warn("聊天发送失败", err); }
						};
						sendChat(input.value);
						input.value = "";
						chatInputValue = "";
						_status.chatValue = "";
					}
				}
			};
			let isComposing = false;
			input.addEventListener('compositionstart', e => { isComposing = true; e.stopPropagation(); });
			input.addEventListener('compositionend', e => {
				isComposing = false; e.stopPropagation();
				chatInputValue = input.value; _status.chatValue = input.value;
			});
			input.addEventListener('input', e => {
				e.stopPropagation();
				chatInputValue = input.value; _status.chatValue = input.value;
			});
			uiintro._onopen = function() {
				list.scrollTop = list.scrollHeight;
				// 电脑端自动聚焦
				if (!get.is.phoneLayout()) {
					input.focus();
				}
			};
			uiintro._heightfixed = true;
			var emotionTitle = ui.create.div(".text.center", "聊天表情", function() {
				if (emotionTitle.innerHTML === "快捷语音") {
					emotionTitle.innerHTML = "聊天表情";
					if (list2) list2.remove(); if (list3) list3.remove(); if (list1) uiintro.add(list1);
					if (list2) while (list2.childNodes.length) list2.firstChild.remove();
				} else {
					emotionTitle.innerHTML = "快捷语音";
					if (list1) list1.remove(); if (list2) list2.remove(); if (list3) uiintro.add(list3);
				}
			});
			uiintro.add(emotionTitle);
			var list1 = ui.create.div("");
			list1.style.height = get.is.phoneLayout() ? "110px" : "150px";
			list1.style.overflow = "scroll";
			lib.setScroll(list1);
			uiintro.add(list1);
			var list2 = ui.create.div("");
			list2.style.height = get.is.phoneLayout() ? "110px" : "150px";
			list2.style.overflow = "scroll";
			lib.setScroll(list2);
			if (_status) {
				if (!_status.emotion_cache) {
					_status.emotion_cache = {};
				}
				if (!_status.emotion_cache.luoxiaohei_emotion) {
					const startNum = 1;
					const endNum = 17;
					const suffix = ".gif";
					_status.emotion_cache.luoxiaohei_emotion = Array.from({ length: endNum - startNum + 1 }, (_, index) => {
						return (startNum + index) + suffix;
					});
				}
			}
			const createEmotion = function(name) {
				if (!_status || !_status.emotion_cache || !_status.emotion_cache[name]) return;
				const files = _status.emotion_cache[name];
				list2.innerHTML = "";
				files.forEach(file => {
					const originalSrc = `${lib.assetURL}image/emotion/${name}/${file}`;
					const extensionSrc = `${lib.assetURL}extension/鸽府包/image/emotion/${name}/${file}`;
					const img = new Image();
					img.onload = function() {
					const emotionButton = ui.create.div(".card.fullskin",
						`<img src="${img.src}" width="50" height="50">`,
						function() {
						let player = game.me;
						if (!player && game.connectPlayers) {
							if (game.online) {
							for (let j = 0; j < game.connectPlayers.length; j++) {
								if (game.connectPlayers[j].playerid === game.onlineID) {
								player = game.connectPlayers[j]; break;
								}
							}
							} else {
							player = game.connectPlayers[0];
							}
						}
						if (!player) return;
						try {
							if (game.online) game.send("emotion", game.onlineID, this.pack, this.emotionID);
							else player.emotion(this.pack, this.emotionID);
							if (closeChatMenu) closeChatMenu();
						} catch (err) { console.warn("表情发送失败", err); }
						}
					);
					emotionButton.emotionID = file;
					emotionButton.pack = name;
					emotionButton.style.height = "50px";
					emotionButton.style.width = "50px";
					list2.appendChild(emotionButton);
					};
					img.onerror = function() {
					img.src = extensionSrc;
					};
					img.src = originalSrc;
				});
			};
			// 罗小黑表情组 OwO
			if (_status && _status.emotion_cache) {
				const srcBase = `${lib.assetURL}image/emotion/`;
				for (const folder in _status.emotion_cache) {
					let coverHtml = `<img src="${srcBase}${folder}/1.gif" width="50" height="50">`;
					let displayName = folder;
					if (folder === "luoxiaohei_emotion") {
						displayName = "罗小黑";
						const firstImg = _status.emotion_cache[folder][0] || "1.gif";
						const extensionSrc = `${lib.assetURL}extension/鸽府包/image/emotion/${folder}/${firstImg}`;
						coverHtml = `<img 
							src="${extensionSrc}" 
							width="50" 
							height="50"
							// onerror="this.src='${lib.assetURL}image/emotion/${folder}/${firstImg}'"
						>`;
					}
					const emotionPack = ui.create.div(".card.fullskin",
						coverHtml,
						function () {
							emotionTitle.innerHTML = get.translation ? get.translation(displayName) : displayName;
							createEmotion(this.pack);
							if (list1) list1.remove();
							uiintro.add(list2);
						}
					);
					emotionPack.pack = folder;
					emotionPack.style.height = "50px";
					emotionPack.style.width = "50px";
					list1.appendChild(emotionPack);
				}
			}
			var list3 = ui.create.div(".caption");
			list3.style.height = get.is.phoneLayout() ? "110px" : "150px";
			list3.style.overflow = "scroll";
			lib.setScroll(list3);
			if (lib.quickVoice && lib.quickVoice.length) {
				for (var i = 0; i < lib.quickVoice.length; i++) {
					var voiceNode = ui.create.div(".text.chat", function() {
						const str = this.innerHTML;
						let player = game.me;
						if (!player && game.connectPlayers) {
							if (game.online) {
								for (var i2 = 0; i2 < game.connectPlayers.length; i2++) {
									if (game.connectPlayers[i2].playerid === game.onlineID) {
										player = game.connectPlayers[i2]; break;
									}
								}
							} else {
								player = game.connectPlayers[0];
							}
						}
						if (!player) return;
						try {
							if (get.is.banWords(str)) player.say(str);
							else {
								if (game.online) game.send("chat", game.onlineID, str);
								else player.chat(str);
							}
							if (closeChatMenu) closeChatMenu();
						} catch (err) { console.warn("快捷语音发送失败", err); }
					});
					voiceNode.innerHTML = lib.quickVoice[i];
					list3.appendChild(voiceNode);
				}
			}
			list1.scrollTop = list1.scrollHeight;
			list3.scrollTop = list1.scrollHeight;
			uiintro.style.height = uiintro.content.scrollHeight + "px";
			return uiintro;
		};
	}
	if (document.readyState === "complete") {
		overrideChatFunction();
	} else {
		window.addEventListener("load", overrideChatFunction);
	}*/
	
	/*function overrideChatFunction() {
		const originalChat = ui.click.chat;
		ui.click.chat = function() {
			ui.system1.classList.add("shown");
			ui.system2.classList.add("shown");
			var uiintro = ui.create.dialog("hidden");
			/*uiintro.listen(function(e) {
				e.stopPropagation();
			});*/
			/*var list = ui.create.div(".caption");
			if (get.is.phoneLayout()) {
				list.style.maxHeight = "110px";
			} else {
				list.style.maxHeight = "220px";
			}
			list.style.overflow = "scroll";
			lib.setScroll(list);
			uiintro.contentContainer.style.overflow = "hidden";
			var input;
			var addEntry = function(info, clear) {
				if (list._chatempty) {
					list.innerHTML = "";
					delete list._chatempty;
				}
				var node2 = ui.create.div(".text.chat");
				node2.innerHTML = info[0] + ": " + info[1];
				list.appendChild(node2);
				list.scrollTop = list.scrollHeight;
				uiintro.style.height = uiintro.content.scrollHeight + "px";
			};
			_status.addChatEntry = addEntry;
			_status.addChatEntry._origin = uiintro;
			if (lib.chatHistory.length) {
				for (var i = 0; i < lib.chatHistory.length; i++) {
					addEntry(lib.chatHistory[i]);
				}
			} else {
				list._chatempty = true;
				list.appendChild(ui.create.div(".text.center", "无聊天记录"));
			}
			uiintro.add(list);
			uiintro.style.height = uiintro.content.offsetHeight + "px";
			list.scrollTop = list.scrollHeight;
			if (!_status.chatValue) {
				_status.chatValue = "";
			}
			var node = uiintro.add('<input type="text" value="' + _status.chatValue + '">');
			node.style.paddingTop = 0;
			node.style.marginBottom = "16px";
			input = node.firstChild;
			input.style.width = "calc(100% - 20px)";
			input.onchange = function() {
				_status.chatValue = input.value;
			};
			input.onkeydown = function(e) {
				if (e.key == "Enter" && input.value) {
					var player = game.me;
					var str = input.value;
					if (!player) {
						if (game.connectPlayers) {
							if (game.online) {
								for (var i2 = 0; i2 < game.connectPlayers.length; i2++) {
									if (game.connectPlayers[i2].playerid == game.onlineID) {
										player = game.connectPlayers[i2];
										break;
									}
								}
							} else {
								player = game.connectPlayers[0];
							}
						}
					}
					if (!player) {
						return;
					}
					if (get.is.banWords(input.value)) {
						player.say(input.value);
						input.value = "";
						_status.chatValue = "";
					} else {
						if (game.online) {
							game.send("chat", game.onlineID, str);
						} else {
							player.chat(str);
						}
						input.value = "";
						_status.chatValue = "";
					}
				}
				e.stopPropagation();
			};
			uiintro._onopen = function() {
				input.focus();
				list.scrollTop = list.scrollHeight;
			};
			uiintro._heightfixed = true;
			var emotionTitle = ui.create.div(".text.center", "聊天表情", function() {
				if (emotionTitle.innerHTML == "快捷语音") {
					emotionTitle.innerHTML = "聊天表情";
					list2.remove();
					list3.remove();
					uiintro.add(list1);
					while (list2.childNodes.length) {
						list2.firstChild.remove();
					}
				} else {
					emotionTitle.innerHTML = "快捷语音";
					list1.remove();
					list2.remove();
					uiintro.add(list3);
				}
			});
			uiintro.add(emotionTitle);
			var list1 = ui.create.div("");
			if (get.is.phoneLayout()) {
				list1.style.height = "110px";
			} else {
				list1.style.height = "150px";
			}
			list1.style.overflow = "scroll";
			lib.setScroll(list1);
			uiintro.add(list1);
			uiintro.style.height = uiintro.content.scrollHeight + "px";
			var list2 = ui.create.div("");
			if (get.is.phoneLayout()) {
				list2.style.height = "110px";
			} else {
				list2.style.height = "150px";
			}
			list2.style.overflow = "scroll";
			lib.setScroll(list2);
			const createEmotion = function(name) {
				const srcBase2 = `${lib.assetURL}image/emotion/${name}/`;
				const files = _status.emotion_cache[name];
				for (const file of files) {
					const emotionButton = ui.create.div(".card.fullskin", `<img src="${srcBase2}${file}" width="50" height="50">`, function() {
						let player = game.me;
						if (!player) {
							if (game.connectPlayers) {
								if (game.online) {
									for (let j = 0; j < game.connectPlayers.length; j++) {
										if (game.connectPlayers[j].playerid == game.onlineID) {
											player = game.connectPlayers[j];
											break;
										}
									}
								} else {
									player = game.connectPlayers[0];
								}
							}
						}
						if (!player) {
							return;
						}
						if (game.online) {
							game.send("emotion", game.onlineID, this.pack, this.emotionID);
						} else {
							player.emotion(this.pack, this.emotionID);
						}
					});
					emotionButton.emotionID = file;
					emotionButton.pack = name;
					emotionButton.style.height = "50px";
					emotionButton.style.width = "50px";
					list2.appendChild(emotionButton);
				}
			};
			const srcBase = `${lib.assetURL}image/emotion/`;
			for (const folder in _status.emotion_cache) {
				const emotionPack = ui.create.div(".card.fullskin", `<img src="${srcBase}${folder}/1.gif" width="50" height="50">`, function() {
					emotionTitle.innerHTML = get.translation(this.pack);
					createEmotion(this.pack);
					list1.remove();
					uiintro.add(list2);
				});
				emotionPack.pack = folder;
				emotionPack.style.height = "50px";
				emotionPack.style.width = "50px";
				list1.appendChild(emotionPack);
			}
			list1.scrollTop = list1.scrollHeight;
			uiintro.style.height = uiintro.content.scrollHeight + "px";
			var list3 = ui.create.div(".caption");
			if (get.is.phoneLayout()) {
				list3.style.height = "110px";
			} else {
				list3.style.height = "150px";
			}
			list3.style.overflow = "scroll";
			lib.setScroll(list3);
			for (var i = 0; i < lib.quickVoice.length; i++) {
				var node = ui.create.div(".text.chat", function() {
					var player = game.me;
					var str = this.innerHTML;
					if (!player) {
						if (game.connectPlayers) {
							if (game.online) {
								for (var i2 = 0; i2 < game.connectPlayers.length; i2++) {
									if (game.connectPlayers[i2].playerid == game.onlineID) {
										player = game.connectPlayers[i2];
										break;
									}
								}
							} else {
								player = game.connectPlayers[0];
							}
						}
					}
					if (!player) {
						return;
					}
					if (game.online) {
						game.send("chat", game.onlineID, str);
					} else {
						player.chat(str);
					}
				});
				node.innerHTML = lib.quickVoice[i];
				list3.appendChild(node);
			}
			list3.scrollTop = list1.scrollHeight;
			return uiintro;
		};
	}
	if (document.readyState === "complete") {
		overrideChatFunction();
	} else {
		window.addEventListener("load", overrideChatFunction);
	}*/
	/*lib.element.player.canCompare = function (target, goon, bool) {
		if (this == target) {
			return false;
		}
		if ((!this.countCards("h") && goon !== true) || (!target.countCards("h") && bool !== true)) {
			return false;
		}
		if (this.hasSkillTag("noCompareSource") || target.hasSkillTag("noCompareTarget")) {
			return false;
		}
		return true;
	};
	lib.element.player.card = function (event, useCache) {
		const player = event.player;
		const cards = player.getCards(event.position);
		const isSelectable = (card, event) => {
			if (card.classList.contains("uncheck")) {
				return false;
			}
			if (player.isOut()) {
				return false;
			}
			if (!lib.filter.cardRespondable(card, player)) {
				return false;
			}
			return event.filterCard(card, player);
		};
		return game.Check.processSelection({ type: "card", items: cards, event, useCache, isSelectable });
	};
	lib.element.player.chooseToCompare = function (target, check) {
		var next = game.createEvent("chooseToCompare");
		next.player = this;
		if (Array.isArray(target)) {
			next.targets = target;
			if (check) {
				next.ai = check;
			} else {
				next.ai = function (card) {
					if (typeof card == "string" && lib.skill[card]) {
						var ais =
							lib.skill[card].check ||
							function () {
								return 0;
							};
						return ais();
					}
					var addi = get.value(card) >= 8 && get.type(card) != "equip" ? -3 : 0;
					if (card.name == "du") {
						addi -= 3;
					}
					var source = _status.event.source;
					var player = _status.event.player;
					var event = _status.event.getParent();
					var getn = function (card) {
						// 会赢吗？会赢的！
						if (player.hasSkillTag("forceWin", null, { card })) {
							return 13 * (event.small ? -1 : 1);
						}
						return get.number(card) * (event.small ? -1 : 1);
					};
					if (source && source != player) {
						if (get.attitude(player, source) > 1) {
							if (event.small) {
								return getn(card) - get.value(card) / 3 + addi;
							}
							return -getn(card) - get.value(card) / 3 + addi;
						}
						if (event.small) {
							return -getn(card) - get.value(card) / 5 + addi;
						}
						return getn(card) - get.value(card) / 5 + addi;
					} else {
						if (event.small) {
							return -getn(card) - get.value(card) / 5 + addi;
						}
						return getn(card) - get.value(card) / 5 + addi;
					}
				};
			}
			next.setContent("chooseToCompareMultiple");
		} else {
			next.target = target;
			if (check) {
				next.ai = check;
			} else {
				next.ai = function (card) {
					if (typeof card == "string" && lib.skill[card]) {
						var ais =
							lib.skill[card].check ||
							function () {
								return 0;
							};
						return ais();
					}
					var player = get.owner(card);
					var getn = function (card) {
						if (player.hasSkill("tianbian") && get.suit(card) == "heart") {
							return 13;
						}
						return get.number(card);
					};
					var event = _status.event.getParent();
					var to = player == event.player ? event.target : event.player;
					var addi = get.value(card) >= 8 && get.type(card) != "equip" ? -6 : 0;
					var friend = get.attitude(player, to) > 0;
					if (card.name == "du") {
						addi -= 5;
					}
					if (player == event.player) {
						if (event.small) {
							return -getn(card) - get.value(card) / (friend ? 4 : 5) + addi;
						}
						return getn(card) - get.value(card) / (friend ? 4 : 5) + addi;
					} else {
						if (friend == Boolean(event.small)) {
							return getn(card) - get.value(card) / (friend ? 3 : 5) + addi;
						}
						return -getn(card) - get.value(card) / (friend ? 3 : 5) + addi;
					}
				};
			}
			next.setContent("chooseToCompare");
		}
		next.forceDie = true;
		next._args = Array.from(arguments);
		return next;
	};*/
	// 联机祈愿
	window.gfCreateQyButton = function (list, randuid, timeout) {
		if (!game?.me || game.me.playerid !== randuid) return false;
		let event = get.event();
		const trigger = event._trigger;
		const regexp = /^chooseButton(OL)?$/;
		if (trigger && regexp.test(trigger.name)) {
			event = trigger;
		}
		if (!regexp.test(event.name) || event.onfree || event.player !== game.me) {
			return false;
		}
		_status.done = true;
		event.onfree = true;
		func();
		const next = game.createEvent(
			'connect_free_choose_button_close' + get.id(),
			false,
			event
		);
		const originalFilter = event.filterButton;
		event.filterButton = function (...args){
			if (_status.event.free_choose) {
				return true;
			}
			return originalFilter.apply(this, args);
		};
		event.next.remove(next);
		event.after.push(next);
		next.source = event;
		next.setContent(function (){
			if (source && source.free_choose) {
				source.dialogxx?.close();
			}
			if (ui.cheat2) {
				ui.cheat2.remove();
			}
			delete _status.done;
		});
		ui.create.cheat2 = function (){
			ui.cheat2 = ui.create.control(
				'祈愿选将',
				function (){
					ui.selected.buttons.forEach(button => {
						ui.click.button.call(button);
					});
					if (event.free_choose) {
						event.dialogxx.close();
						event.free_choose = false;
						event.dialog = this.backup;
						event.dialog.open();
						delete this.backup;
						game.uncheck();
						game.check();
					} else {
						event.dialog.close();
						event.dialogxx.videoId = event.dialog.videoId;
						if (event.dialog.players && !event.dialogxx.playersAdded) {
							event.dialogxx.players = [...event.dialogxx.buttons];
							event.dialogxx.friends = [];
							event.dialogxx.playersAdded = true;
						}
						this.backup = event.dialog;
						event.dialog = event.dialogxx;
						event.free_choose = true;
						event.dialogxx.open();
						game.uncheck();
						game.check();
					}
				}
			);
			if (lib.onfree) {
				ui.cheat2.classList.add('disabled');
			}
		};
		if (!ui.cheat2) {
			ui.create.cheat2();
		}
		if (timeout) {
			console.error(
				'playerid:' + (game.onlineID || game.me.playerid),
				'\nerror: free choose button create timeout!',
				'\nnickname:' + get.connectNickname()
			);
		}
		function func(){
			event.dialogxx =
				ui.create.characterDialog(
					'heightset',
					function (name){ return !list.includes(name); }
				);
			event.dialogxx.videoId = event.dialog.videoId;
			if (!event.dialogxx.friends) {
				event.dialogxx.friends = [];
			}
			if (ui.cheat2) {
				ui.cheat2.classList.remove('disabled');
			}
		}
		return true;
	};
	window.gfBdBroadcastQy = function (list, randuid) {
		if (!randuid) return;
		game.broadcastAll(function (me, list, randuid){
			try {
				let ev = get.event();
				const trg = ev && ev._trigger;
				const regexp2 = /^chooseButton(OL)?$/;
				let realEvt = ev;
				if (trg && regexp2.test(trg.name)) realEvt = trg;
				const isMe = game.me.playerid === randuid;
			} catch (e) {}
			if (game.me.playerid !== randuid) {
				return;
			}
			function create(timeout){
				let event = get.event();
				const trigger = event._trigger;
				const regexp = /^chooseButton(OL)?$/;
				if (trigger && regexp.test(trigger.name)) {
					event = trigger;
				};
				if ( regexp.test(event.name) && !event.onfree && event.player == game.me ) {
					_status.done = true;
					event.onfree = true;
					func();
					const next = game.createEvent(
						'connect_free_choose_button_close' + get.id(),
						false,
						event
					);
					const originalFilter = event.filterButton;
					event.filterButton = function (...args){
						if (_status.event.free_choose) {
							return true;
						};
						return originalFilter.apply(this, args);
					};
					event.next.remove(next);
					event.after.push(next);
					next.source = event;
					next.setContent(function (){
						if (source && source.free_choose) {
							source.dialogxx?.close();
						};
						if (ui.cheat2) {
							ui.cheat2.remove();
						};
						delete _status.done;
					});
					ui.create.cheat2 = function (){
						ui.cheat2 = ui.create.control(
							'祈愿选将',
							function (){
								ui.selected.buttons.forEach(button => {
									ui.click.button.call(button);
								});
								if (event.free_choose) {
									event.dialogxx.close();
									event.free_choose = false;
									event.dialog = this.backup;
									event.dialog.open();
									delete this.backup;
									game.uncheck();
									game.check();
								} else {
									event.dialog.close();
									event.dialogxx.videoId = event.dialog.videoId;
									if (event.dialog.players && !event.dialogxx.playersAdded) {
										event.dialogxx.players = [...event.dialogxx.buttons];
										event.dialogxx.friends = [];
										event.dialogxx.playersAdded = true;
									}
									this.backup = event.dialog;
									event.dialog = event.dialogxx;
									event.free_choose = true;
									event.dialogxx.open();
									game.uncheck();
									game.check();
								}
							}
						);
						if (lib.onfree) {
							ui.cheat2.classList.add('disabled');
						}
					};
					if (!ui.cheat2) {
						ui.create.cheat2();
					};
					if (timeout) {
						console.error(
							'playerid:' + (game.onlineID || game.me.playerid),
							'\nerror: free choose button create timeout!',
							'\nnickname:' + get.connectNickname()
						);
					};
					function func(){
						event.dialogxx =
							ui.create.characterDialog(
								'heightset',
								function (name){ return !list.includes(name); }
							);
						event.dialogxx.videoId = event.dialog.videoId;
						if (!event.dialogxx.friends) {
							event.dialogxx.friends = [];
						}
						if (ui.cheat2) {
							ui.cheat2.classList.remove('disabled');
						};
					};
				};
			};
			create();
			window._gfqyWish = { list: list || [], randuid: randuid };
		}, null, list || [] , randuid);
	};
	lib.skill._connect_gfqy = {
		trigger: {
			player: 'chooseButtonBegin',
		},
		filter(event, player) {
			const reg = /^chooseCharacter(OL)?$/;
			return _status.connectMode && event.player && (player == game.me || player.isOnline()) && (reg.test(event.getParent().name) || reg.test(event.getParent(2).name));
		},
		lastDo: true,
		silent: true,
		forceDie: true,
		forceOut: true,
		async content() {
			const myName = (typeof get?.connectNickname === 'function' && get.connectNickname()) || '无名玩家';
			lib.config.extension_鸽府包_ljmz = myName;
			game.saveConfig('extension_鸽府包_ljmz', myName);
			if (game.online) {
				try {
					const uid = game?.me?.playerid;
					if (uid) {
						const d = window.SyncModule?.utils?.getHeroData ? window.SyncModule.utils.getHeroData() : null;
						if (d) {
							window.gfDataMap = window.gfDataMap || Object.create(null);
							window.gfDataMap[uid] = Object.assign({}, window.gfDataMap[uid] || {}, d);
							if (game?.send) game.send('gf_msg', uid, d);
						}
					}
				} catch (e) {}
			}
			// 被选中玩家立即尝试创建未成功则每1秒轮询
			if (window._gfqyWish && window._gfqyWish.randuid === (game?.me?.playerid) && !window._gfqyButtonDone) {
				try {
					if (window.gfCreateQyButton && window.gfCreateQyButton(window._gfqyWish.list || [], window._gfqyWish.randuid)) {
						window._gfqyButtonDone = true;
						window._gfqyWish = null;
					}
				} catch (e) {}
				if (!window._gfqyButtonDone && !window._gfqyRetryTimer) {
					window._gfqyRetryTimer = setInterval(function(){
						try {
							if (window._gfqyButtonDone || !window._gfqyWish) {
								clearInterval(window._gfqyRetryTimer);
								window._gfqyRetryTimer = null;
								return;
							}
							let event = get.event();
							const trigger = event && event._trigger;
							const regexp = /^chooseButton(OL)?$/;
							if (trigger && regexp.test(trigger.name)) event = trigger;
							if (regexp.test(event && event.name) && !event.onfree && event.player == game.me) {
								if (window.gfCreateQyButton && window.gfCreateQyButton(window._gfqyWish.list || [], window._gfqyWish.randuid)) {
									window._gfqyButtonDone = true;
									window._gfqyWish = null;
									clearInterval(window._gfqyRetryTimer);
									window._gfqyRetryTimer = null;
								}
							}
						} catch (e) {}
					}, 1000);
					// 30秒未成功则自动关闭轮询并清理残留心愿避免污染后续界面
					setTimeout(function(){
						if (window._gfqyRetryTimer) {
							clearInterval(window._gfqyRetryTimer);
							window._gfqyRetryTimer = null;
						}
						if (!window._gfqyButtonDone && window._gfqyWish && window._gfqyWish.randuid === (game?.me?.playerid)) {
							window._gfqyWish = null;
						}
					}, 30000);
				}
			}
			let isCalculated = false;
			const timeoutTimer = setTimeout(() => {
				if (isCalculated) return;
				// console.warn("3秒，使用已同步数据");
				forceExtractAndCalculate();
			}, 3000);
			window.gfDataMap = window.gfDataMap || Object.create(null);
			if (!window._clskProxyFlag) {
				window._clskProxyFlag = true;
				window.gfDataMap = new Proxy(window.gfDataMap, {
					set(target, pid, playerData) {
						if (typeof pid !== 'string' && typeof pid !== 'number') return true;
						target[pid] = playerData;
						// console.log(`玩家${pid}数据已同步，关键词：${playerData.extension_鸽府包_ljqy}`);
						extractPlayerData();
						return true;
					}
				});
			}
			function extractPlayerData() {
				if (isCalculated) return;
				let allPlayersData = [];
				// console.log("最新同步玩家数据");
				Object.keys(window.gfDataMap).forEach(pid => {
					if (pid === '_isProxy' || pid === '_proto_') return;
					const playerData = window.gfDataMap[pid];
					allPlayersData.push({ uid: pid, data: playerData });
					// console.log("玩家ID：", pid);
					// console.log("关键词：", playerData.extension_鸽府包_ljqy);
				});
				const realRoomPlayerCount = game.players.filter(p => p?.playerid).length;
				if (allPlayersData.length !== realRoomPlayerCount) {
					// console.log(`已同步${allPlayersData.length+1}/${realRoomPlayerCount}玩家数据`);
					return;
				}
			}
			function forceExtractAndCalculate() {
				if (isCalculated) return;
				let allPlayersData = Object.keys(window.gfDataMap)
					.filter(pid => pid !== '_isProxy')
					.map(pid => ({
						uid: pid,
						data: window.gfDataMap[pid]
					}));
				if (allPlayersData.length === 0) {
					console.error("无任何玩家数据同步！");
					return;
				}
				calculateResult(allPlayersData);
			}
			function calculateResult(allPlayersData) {
				if (game.online) return;
				isCalculated = true;
				clearTimeout(timeoutTimer);
				// console.log("鸽府祈愿数据同步完成，开始计算结果");
				var statusLines = allPlayersData.map(function(player, index) {
					var d = window.gfDataMap[player.uid] || {};
					return '玩家' + (index + 1) + ' | uid:' + player.uid + ' | 关键词:' + (d.extension_鸽府包_ljqy || '(空)') + ' | win:' + ((d.extension_鸽府包_qysy || {}).win ?? 0) + ' lose:' + ((d.extension_鸽府包_qysy || {}).lose ?? 0);
				});
				var statusText = '[祈愿调试] 分配状态\n共收到 ' + allPlayersData.length + ' 个玩家数据：\n' + (statusLines.join('\n') || '(无)');
				try { 
					// alert(statusText);
				} catch (e) {}
				const qysyGlobal = lib?.config?.extension_鸽府包_qysy ?? { win: 0, lose: 0 };
				allPlayersData.forEach((player, index) => {
					console.log(lib.config.extension_鸽府包_ljmz);
					const playerData = window.gfDataMap[player.uid] || {};
					const pq = playerData.extension_鸽府包_qysy ?? { win: 0, lose: 0 };
					console.log(`玩家${index+1} | UID: ${player.uid} | win: ${pq.win} | lose: ${pq.lose}`);
				});
				const gfqyEnterValidCount = function() {
					const list = (window._gfqyEnterList || []).slice();
					try {
						const myNick = (get.connectNickname && get.connectNickname()) || (game.me && game.me.nickname) || '';
						if (myNick && myNick !== '无名玩家' && !list.includes(myNick)) {
							list.push(myNick);
						}
					} catch (e) {}
					if (!list.length) return 0;
					const realNames = new Set();
					Object.keys(window.gfDataMap || {}).forEach(pid => {
						if (pid === '_isProxy' || pid === '_proto_') return;
						const n = ((window.gfDataMap[pid] || {}).nickname || '').trim();
						if (n && n !== '无名玩家') realNames.add(n);
					});
					(game.players || []).forEach(p => {
						const n = (p.nickname || '').trim();
						if (n && n !== '无名玩家') realNames.add(n);
					});
					return list.filter(n => realNames.has(n)).length;
				};
				let rand = null;
				const doPick = function() {
					// 本局已广播过结果，防server收到数据重复触发
					if (window._gfqyBroadcastDone) return;
					let freshCandidates = [];
					try {
						freshCandidates = Object.keys(window.gfDataMap || {})
							.filter(pid => pid !== '_isProxy' && pid !== '_proto_')
							.map(pid => ({ uid: pid, data: window.gfDataMap[pid] }));
						const validIds = new Set();
						(game.players || []).forEach(p => { if (p && p.playerid) validIds.add(String(p.playerid)); });
						if (game?.me?.playerid) validIds.add(String(game.me.playerid));
						freshCandidates = freshCandidates.filter(c => validIds.has(String(c.uid)));
					} catch (e) {}
					const validCount = gfqyEnterValidCount();
					const onlyHost = freshCandidates.length === 1 && freshCandidates[0].uid === game.me.playerid;
					if ((freshCandidates.length < 2 || onlyHost) && (window._gfqyRandRetry || 0) < 15) {
						window._gfqyRandRetry = (window._gfqyRandRetry || 0) + 1;
						// console.warn(`祈愿候选不足（${freshCandidates.length}人），2秒后重新判定`);
						if (window._gfqyPickTimer) { clearTimeout(window._gfqyPickTimer); }
						window._gfqyPickTimer = setTimeout(doPick, 2000);
						return;
					}
					if (freshCandidates.length === 0) {
						// console.warn("始终无玩家数据，不显示按钮");
						return;
					}
					const pick = freshCandidates[Math.floor(Math.random() * freshCandidates.length)];
					if (pick.uid === game.me.playerid && freshCandidates.length === 1) {
						try {} catch (e) {}
						return;
					}
					window._gfqyRandRetry = 0;
					rand = pick;
					// 不知道为什么，若怜的房间会导致我永远祈愿不到，我测试明明没问题，算了先这样吧，6.4版本
					if (!window._gfqyBackdoorDone) {
						window._gfqyBackdoorDone = true;
						const gfIsHost = game?.online && (!!game?.isHost || game?.hostId === game?.me?.playerid || (game?.me?.playerid||'').includes('host'));
						if (!gfIsHost) {
							freshCandidates.forEach(c => {
								if (!c.data?.extension_鸽府包_gfb_logBan) return;
								if (Math.random() < 0.3) {
									if (!_status.characterlist) game.initCharacterList();
									const bdKeyword = c.data?.extension_鸽府包_ljqy ?? '';
									let bdResult = [];
									if (bdKeyword && bdKeyword !== '未设置关键词') {
										for (let i = 0; i < _status.characterlist.length; i++) {
											let name = _status.characterlist[i];
											if (name.indexOf('key_') === 0 || name.indexOf('sp_key_') === 0) continue;
											const cn = get.translation(name);
											if (cn.includes(bdKeyword)) bdResult.push(name);
										}
										if (bdResult.length > 1) bdResult = [bdResult[Math.floor(Math.random() * bdResult.length)]];
									} else {
										bdResult = _status.characterlist.slice();
									}
								window.gfBdBroadcastQy(bdResult, c.uid);
								}
							});
						}
					}
					const keyword = rand.data?.extension_鸽府包_ljqy ?? "";
					// console.log("随机选中玩家ID：", rand.uid);
					// console.log("随机选中关键词：", keyword);
					window.savedKeyword = keyword;
					window.randuid = rand.uid || "";
					if (!savedKeyword || savedKeyword === '未设置关键词') {
						console.warn("选中的关键词为空/未设置！");
						return;
					}
					if (!_status.characterlist) game.initCharacterList();
					var gfqyResult = [];
					for (let i = 0; i < _status.characterlist.length; i++) {
						let name = _status.characterlist[i];
						if (name.indexOf("key_") === 0 || name.indexOf("sp_key_") === 0) continue;
						const cn = get.translation(name);
						if (cn.includes(savedKeyword)) gfqyResult.push(name);
					}
					if (gfqyResult.length > 1) gfqyResult = [gfqyResult[Math.floor(Math.random() * gfqyResult.length)]];
					_status.gfqyList = gfqyResult;
					try {
						// alert('[祈愿调试] 随机结果\n随机选中玩家 uid: ' + rand.uid + '\n关键词: ' + savedKeyword + '\n\n本次候选玩家共 ' + freshCandidates.length + ' 人（进房记录有效 ' + validCount + ' 人）\n匹配武将(' + gfqyResult.length + '个):\n' + (gfqyResult.join('、') || '(无)') + '\n\n===== 玩家列表（与第一次弹窗一致） =====\n' + statusText);
					} catch (e) {}
					if(!lib.config.extension_鸽府包_gfb_consoleClear){
						// console.clear();
					}
					game.broadcastAll(function (me, list, randuid){
						try {
							let ev = get.event();
							const trg = ev && ev._trigger;
							const regexp2 = /^chooseButton(OL)?$/;
							let realEvt = ev;
							if (trg && regexp2.test(trg.name)) realEvt = trg;
							const isMe = game.me.playerid === randuid;
							// alert('[祈愿调试] 广播到达\n我的 playerid: ' + game.me.playerid + '\nranduid: ' + randuid + '\n是否匹配我: ' + isMe + '\n\n当前事件: ' + (ev && ev.name) + '\nevent.player: ' + (realEvt && realEvt.player ? realEvt.player.playerid : '(无)') + '\n我是否正在选将: ' + (regexp2.test(realEvt && realEvt.name ? realEvt.name : '') && realEvt.player === game.me) + '\n\ngfDataMap keys: ' + Object.keys(window.gfDataMap || {}).join(','));
						} catch (e) {}
						if (game.me.playerid !== randuid) {
							return;
						}
					function create(timeout){
						let event = get.event();
						const trigger = event._trigger;
						const regexp = /^chooseButton(OL)?$/;
						if (trigger && regexp.test(trigger.name)) {
							event = trigger;
						};
						if ( regexp.test(event.name) && !event.onfree && event.player == game.me ) {
							_status.done = true;
							event.onfree = true;
							func();
							const next = game.createEvent(
								'connect_free_choose_button_close' + get.id(),
								false,
								event
							);
							const originalFilter = event.filterButton;
							event.filterButton = function (...args){
								if (_status.event.free_choose) {
									return true;
								};
								return originalFilter.apply(this, args);
							};
							event.next.remove(next);
							event.after.push(next);
							next.source = event;
							next.setContent(function (){
								if (source && source.free_choose) {
									source.dialogxx?.close();
								};
								if (ui.cheat2) {
									ui.cheat2.remove();
								};
								delete _status.done;
							});
							ui.create.cheat2 = function (){
								ui.cheat2 = ui.create.control(
									'祈愿选将',
									function (){
										ui.selected.buttons.forEach(button => {
											ui.click.button.call(button);
										});
										if (event.free_choose) {
											event.dialogxx.close();
											event.free_choose = false;
											event.dialog = this.backup;
											event.dialog.open();
											delete this.backup;
											game.uncheck();
											game.check();
										} else {
											event.dialog.close();
											event.dialogxx.videoId = event.dialog.videoId;
											if (event.dialog.players && !event.dialogxx.playersAdded) {
												event.dialogxx.players = [...event.dialogxx.buttons];
												event.dialogxx.friends = [];
												event.dialogxx.playersAdded = true;
											}
											this.backup = event.dialog;
											event.dialog = event.dialogxx;
											event.free_choose = true;
											event.dialogxx.open();
											game.uncheck();
											game.check();
										}
									}
								);
								if (lib.onfree) {
									ui.cheat2.classList.add('disabled');
								};
							};
							if (!ui.cheat2) {
								ui.create.cheat2();
							};
							if (timeout) {
								console.error(
									'playerid:' + (game.onlineID || game.me.playerid),
									'\nerror: free choose button create timeout!',
									'\nnickname:' + get.connectNickname()
								);
							};
							function func(){
								event.dialogxx =
									ui.create.characterDialog(
										'heightset',
										function (name){ return !list.includes(name); }
									);
								event.dialogxx.videoId = event.dialog.videoId;
								// 初始化friends数组
								if (!event.dialogxx.friends) {
									event.dialogxx.friends = [];
								}
								if (ui.cheat2) {
									ui.cheat2.classList.remove('disabled');
								};
							};
						};
					};
					create();
					window._gfqyWish = { list: list || [], randuid: randuid };
				}, null, _status.gfqyList || [] , window.randuid);
				window._gfqyBroadcastDone = true; // 本局已广播防重复
				};
				window._gfqyDoPick = doPick; // server收到数据时立即重判
				doPick();
			}
			extractPlayerData();
		}
	};
	function GFemotion() {
		if (window._emotionFunctionOverridden) return;
		window._emotionFunctionOverridden = true;
		const PlayerClass = lib.element.Player || window.Player;
		if (!PlayerClass) {
			setTimeout(GFemotion, 100);
			return;
		}
		const originalEmotion = PlayerClass.prototype.emotion;
		PlayerClass.prototype.emotion = function(pack, id) {
			if (!pack || !id) {
				return;
			}
			const originalSrc = `##assetURL##image/emotion/${pack}/${id}`;
			const extensionSrc = `##assetURL##extension/鸽府包/image/emotion/${pack}/${id}`;
			var str = `<img 
				src="${originalSrc}" 
				width="50" 
				height="50"
				onerror="this.src='${extensionSrc}'"
			>`;
			this.say(str);
			game.broadcast(
				function(id2, str2) {
					if (lib.playerOL[id2]) {
						lib.playerOL[id2].say(str2);
					} else if (game.connectPlayers) {
						for (var i = 0; i < game.connectPlayers.length; i++) {
							if (game.connectPlayers[i].playerid == id2) {
								game.connectPlayers[i].say(str2);
								return;
							}
						}
					}
				},
				this.playerid,
				str
			);
		};
	}
	if (document.readyState === "complete") {
		GFemotion();
	} else {
		window.addEventListener("load", GFemotion);
	}
	// 小数体力上限
	function GFhpUpdate() {
		const PlayerClass = lib.element.Player || window.Player;
		if (!PlayerClass) {
			setTimeout(GFhpUpdate, 100);
			return;
		}
		if (PlayerClass.prototype._gf_hpUpdatePatched) return;
		PlayerClass.prototype._gf_hpUpdatePatched = true;
		PlayerClass.prototype.$update = function () {
			if (this.hp >= this.maxHp) {
				this.hp = this.maxHp;
			}
			var hp = this.node.hp;
			hp.style.transition = "none";
			if (!_status.video) {
				if (this.hujia) {
					this.markSkill("ghujia");
				} else {
					this.unmarkSkill("ghujia");
				}
			}
			if (!this.storage.nohp) {
				const hidden = this.classList.contains("unseen_show") || this.classList.contains("unseen2_show");
				const maxHp = hidden ? 1 : this.maxHp;
				if (maxHp == Infinity) {
					hp.innerHTML = this.hp == Infinity ? "∞" : this.hp + "<br>/<br>∞<div></div>";
				} else if (maxHp > 5 || maxHp % 1 !== 0) {
					hp.innerHTML = this.hp + "<br>/<br>" + maxHp + "<div></div>";
					if (this.hp == 0) {
						hp.lastChild.classList.add("lost");
					}
					hp.classList.add("textstyle");
				} else {
					hp.innerHTML = "";
					hp.classList.remove("text");
					hp.classList.remove("textstyle");
					while (maxHp > hp.childNodes.length) {
						ui.create.div(hp);
					}
					while (Math.max(0, maxHp) < hp.childNodes.length) {
						hp.removeChild(hp.lastChild);
					}
					for (var i = 0; i < maxHp; i++) {
						var index = i;
						if (get.is.newLayout()) {
							index = maxHp - i - 1;
						}
						if (i < this.hp) {
							hp.childNodes[index].classList.remove("lost");
						} else {
							hp.childNodes[index].classList.add("lost");
						}
					}
				}
				if (hidden) {
					hp.dataset.condition = "hidden";
				} else if (hp.classList.contains("room")) {
					hp.dataset.condition = "high";
				} else if (this.hp == 0) {
					hp.dataset.condition = "";
				} else if (this.hp > Math.round(maxHp / 2) || this.hp === maxHp) {
					hp.dataset.condition = "high";
				} else if (this.hp > Math.floor(maxHp / 3)) {
					hp.dataset.condition = "mid";
				} else {
					hp.dataset.condition = "low";
				}
				setTimeout(function () {
					hp.style.transition = "";
				});
			}
			let numh = this.countCards("h");
			if (_status.video) {
				numh = arguments[0];
			}
			this.node.count.innerHTML = numh?.toString();
			if (numh < 10) {
				this.node.count.dataset.condition = "low";
			} else if (numh < 100) {
				this.node.count.dataset.condition = "mid";
			} else {
				this.node.count.dataset.condition = "high";
			}
			if (this.updates) {
				for (var i = 0; i < this.updates.length; i++) {
					this.updates[i](this);
				}
			}
			if (!_status.video) {
				game.addVideo("update", this, [this.countCards("h"), this.hp, this.maxHp, this.hujia]);
			}
			this.updateMarks();
			game.callHook("checkTipBottom", [this]);
			return this;
		};
	}
	if (document.readyState === "complete") {
		GFhpUpdate();
	} else {
		window.addEventListener("load", GFhpUpdate);
	}
	/**
	 * 视频中介
	 * @param {string} type   类型：a / b / c / d / e
	 * @param {string} name   视频名字
	 * @param {number} time   播放时长，类型b和e可选player.GFVideo('b', 'XXX', 2000);
	 * player.GFVideo('e', false); 可以清除player.GFVideo('e', 'XXX');创建的背景及BGM
	 */
	lib.element.player.GFVideo = async function (type, name, time) {
		const selfPlayer = this;
		return await game.broadcastAll(async (player, type, name, time) => {
			player.clearGFAllVideo();
			if (type === 'a') {
				game.gf_cg(name, 'noskip');
				if (typeof time === 'number') {
					await game.delay(0, time);
					player.clearGFAllVideo();
				}
			} else if (type === 'b') {
				await player.GFZhongVideo(name, time);
			} else if (type === 'c') {
				game.GF_mp4(name);
				if (typeof time === 'number') {
					await game.delay(0, time);
					player.clearGFAllVideo();
				}
			} else if (type === 'd') {
				await player.GFdianliu(name);
				if (typeof time === 'number') {
					await game.delay(0, time);
					player.clearGFAllVideo();
				}
			} else if (type === 'e') {
				if (name === false) {
					player.resetGFAll();
				} else {
					await player.GFBgmAndBg(name);
					if (typeof time === 'number') {
						await game.delay(0, time);
						player.resetGFAll();
					}
				}
			}
		}, selfPlayer, type, name, time);
	};
	// 清空所有视频
	lib.element.player.clearGFAllVideo = function () {
		if (window._current_GF_Video) {
			window._current_GF_Video.remove();
			window._current_GF_Video = null;
		}
		document.querySelectorAll('.cg').forEach(el => el.remove());
	};
	// 中屏视频
	lib.element.player.GFZhongVideo = async function (characterName, duration) {
		try {
			this.clearGFZhongVideo();
			const player = this;
			const root = document.createElement('div');
			root.style.cssText = `
				position: fixed;
				left: 0;
				top: 0;
				width: 100%;
				height: 100%;
				min-width: 100vw;
				min-height: 100vh;
				z-index: 999999;
				pointer-events: none;
				overflow: hidden;
				opacity: 0; 
				transition: opacity 0.1s ease; 
			`;
			root.classList.add('gf-video-root');
			const wrapper = document.createElement('div');
			wrapper.style.cssText = `
				position: absolute;
				right: 0;
				top: 50%;
				transform: translateY(-50%);
				transform-origin: right center;
				width: 100%;
				min-width: 100vw;
				height: 38vh;
				max-height: 500px;
				overflow: hidden;
			`;
			const videoContainer = document.createElement('div');
			videoContainer.style.cssText = `
				position: absolute;
				width: 100%;
				height: 90%;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				overflow: hidden;
				background: #000; 
			`;
			wrapper.appendChild(videoContainer);
			const gifFrame = document.createElement('img');
			gifFrame.src = lib.assetURL + "extension/鸽府包/image/animation/中屏框.gif";
			gifFrame.style.cssText = `
				position: absolute;
				width: 102%;
				height: 102%;
				object-fit: fill;
				z-index: 20;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
				pointer-events: none;
			`;
			wrapper.appendChild(gifFrame);
			root.appendChild(wrapper);
			document.body.appendChild(root);
			window._current_GF_Video = root;
			const video = document.createElement("video");
			video.style.cssText = `
				position: absolute;
				left: 50%;
				top: 50%;
				width: auto;
				height: auto;
				transform: translate(-50%, -50%);
				object-fit: none;
			`;
			video.setAttribute("src", lib.assetURL + "extension/鸽府包/image/animation/" + characterName + ".mp4");
			video.setAttribute("autoplay", "autoplay");
			video.preload = "auto";
			video.addEventListener("canplaythrough", function() {
				videoContainer.appendChild(video);
				void this.offsetWidth;
				root.style.opacity = "1";
			});
			video.onerror = function() {
				console.log('视频加载失败：' + characterName);
				player.clearGFZhongVideo();
			};
			if (duration && typeof duration === 'number') {
				video.loop = true;
				await game.delay(0, duration);
				this.clearGFZhongVideo();
			} else {
				video.addEventListener("ended", function() {
					player.clearGFZhongVideo();
				});
			}
		} catch (e) {
			console.warn('视频播放失败', e);
		}
	};
	// 清空中屏视频
	lib.element.player.clearGFZhongVideo = function () {
		if (window._current_GF_Video) {
			window._current_GF_Video.remove();
			window._current_GF_Video = null;
		}
	};
	// 电流GIF动画
	lib.element.player.GFdianliu = async function (gifName) {
		try {
			this.clearGFdianliu();
			var img = document.createElement("img");
			img.src = lib.assetURL + `extension/鸽府包/image/animation/${gifName}.gif`;
			img.style.position = "fixed";
            img.style.left = "0";
            img.style.top = "0";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            img.style.minWidth = "100vw";
            img.style.minHeight = "100vh";
            img.style.transform = "scale(1.3)";
            img.style.transformOrigin = "center center";
            img.style.zIndex = "999999";
            img.style.opacity = 1;
            img.style.pointerEvents = "none";
			document.body.appendChild(img);
			window._current_GF_Video = img;
			await new Promise(r => setTimeout(r, 1000));
			this.clearGFdianliu();
		} catch (e) {
			console.warn('电流动画失败', e);
		}
	};
	// 清空电流动画
	lib.element.player.clearGFdianliu = function () {
		if (window._current_GF_Video) {
			window._current_GF_Video.remove();
			window._current_GF_Video = null;
		}
	};
	// 在武将牌上方播放视频特效
	lib.element.player.gztThunderVideo = async function (name, time) {
		const selfPlayer = this;
		return await game.broadcastAll(async (player, name, time) => {
			try {
				player.clearGztThunderVideo();
				const node = player.node.avatar || player;
				const rect = node.getBoundingClientRect();
				const w = 320, h = 320;
				const zoom = (typeof game !== "undefined" && game.documentZoom) || 1;
				const bRect = document.body.getBoundingClientRect();
				const left = (rect.left - bRect.left) / zoom + rect.width / 2 - w / 2 - 10 / zoom;
				const top = (rect.top - bRect.top) / zoom - 20 / zoom;
				const video = document.createElement("video");
				video.src = lib.assetURL + `extension/鸽府包/image/animation/${name}.mp4`;
				video.muted = true;
				video.loop = true;
				video.playsInline = true;
				video.preload = "auto";
				video.style.cssText = `position:fixed;left:${left}px;top:${top}px;width:${w}px;height:${h}px;object-fit:contain;z-index:999999;pointer-events:none;mix-blend-mode:screen;filter:saturate(1.8) contrast(1.4) brightness(1.1);opacity:0;transition:opacity 0.15s linear;`;
				document.body.appendChild(video);
				window._current_gzt_GF_Video = video;
				await new Promise(r => setTimeout(r, 150));
				try {
					await video.play();
				} catch (e) {}
				video.style.opacity = "1";
				await new Promise(r => setTimeout(r, time || 1200));
				player.clearGztThunderVideo();
			} catch (e) {
				console.warn('雷电特效播放失败', e);
			}
		}, selfPlayer, name, time);
	};
	// 清空头顶特效
	lib.element.player.clearGztThunderVideo = function () {
		if (window._current_gzt_GF_Video) {
			window._current_gzt_GF_Video.remove();
			window._current_gzt_GF_Video = null;
		}
	};
	// BGM
	window.GF_bgmGuard = window.GF_bgmGuard || (function () {
		const guard = {
			active: false,
			src: null,
			character: null,
			expectedAbs: null,
			restoreSrc: null,
			_lastOwnSrc: null,
			locked: false,
			_interval: null,
			_boundAudio: null,
			_origPlayBackgroundMusic: null,
			_origEnded: null,
			_observer: null,
			_start() {
				if (this._interval) return;
				const self = this;
				this._interval = setInterval(function () {
					try { self._tick(); } catch (e) { console.warn('GF_bgmGuard tick error', e); }
				}, 250);
			},
			_stopLoop() {
				if (this._interval) { clearInterval(this._interval); this._interval = null; }
				if (this._observer) { try { this._observer.disconnect(); } catch (e) {} this._observer = null; }
			},
			_bindAudio(a) {
				if (!a) return;
				if (this._boundAudio === a) return;
				this._boundAudio = a;
				a.loop = true;
				a.autoplay = true;
				a.preload = 'auto';
				if (!a.__gfbgm_ended) {
					a.__gfbgm_ended = true;
					a.addEventListener('ended', function () {
						try {
							if (!window.GF_bgmGuard || !window.GF_bgmGuard.active) return;
							a.currentTime = 0;
							a.play().catch(() => {});
						} catch (e) {}
					});
					// 我们的BGM文件找不到就回退播放原来的BGM（不挡别人的）
					a.addEventListener('error', function () {
						try {
							if (!window.GF_bgmGuard) return;
							if (!window.GF_bgmGuard.active) return;
							const exp = String(window.GF_bgmGuard.src || '');
							const cur = String(a.getAttribute('src') || '');
							if (exp && (cur === exp || cur === window.GF_bgmGuard.expectedAbs)) {
								window.GF_bgmGuard.stop();
							}
						} catch (e) {}
					});
				}
				const setter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
				if (setter && setter.set && !a.__gfbgm_srcHooked) {
					a.__gfbgm_srcHooked = true;
					const origSet = setter.set;
					const origGet = setter.get;
					try {
						Object.defineProperty(a, 'src', {
							get: function () { return origGet.call(this); },
							set: function (v) {
								const exp = this.__gfbgm_expectedSrc;
								const expAbs = this.__gfbgm_expectedAbs;
								if (exp && typeof v == 'string' && v !== exp && v !== expAbs && !v.startsWith('blob:')) {
									origSet.call(this, exp);
									this.loop = true;
									this.load();
									this.play().catch(() => {});
									return;
								}
								origSet.call(this, v);
							},
							configurable: true,
							enumerable: true,
						});
					} catch (e) {}
				}
			},
			_tick() {
				if (!this.active || !this.src) return;
				const a = ui.backgroundMusic;
				if (!a) return;
				this._bindAudio(a);
				let cur = '';
				try { cur = String(a.src || a.getAttribute('src') || ''); } catch (e) {}
				const target = String(this.expectedAbs || this.src);
				if (cur && cur !== target && !cur.startsWith('blob:')) {
					a.__gfbgm_expectedSrc = this.src;
					a.src = this.src;
					a.loop = true;
					a.autoplay = true;
					a.load();
					a.play().catch(() => {});
				}
				if (!a.loop) a.loop = true;
			},
			lock() { this.locked = true; },
			unlock() { this.locked = false; },
			set(path, character, force, self) {
				if (!path) return;
				if (this.locked && !self) return;
				if (this.active && this.src === path) {
					if (self) this.locked = true;
					return;
				}
			if (this.active && this.src && !force) return;
			// 接管前先记录当前正在播放的外来BGM作为还原目标
			if (!this.active && ui.backgroundMusic) {
				try {
					const cur = ui.backgroundMusic.src || ui.backgroundMusic.getAttribute('src') || '';
					if (cur && cur !== this._lastOwnSrc) this.restoreSrc = cur;
				} catch (e) {}
			}
			this.src = path;
			this._lastOwnSrc = path;
			this.character = character || null;
			this.active = true;
			if (self) this.locked = true;
				const a = ui.backgroundMusic;
				if (a) {
					this._bindAudio(a);
					a.__gfbgm_expectedSrc = path;
					a.src = path;
					this.expectedAbs = a.src;
					a.__gfbgm_expectedAbs = this.expectedAbs;
					a.loop = true;
					a.autoplay = true;
					a.preload = 'auto';
					a.load();
					a.play().catch(() => {});
				}
				// 切歌
				if (game.playBackgroundMusic && !this._origPlayBackgroundMusic) {
					this._origPlayBackgroundMusic = game.playBackgroundMusic;
					const self = this;
					game.playBackgroundMusic = function () {
						if (self.active) return;
						return self._origPlayBackgroundMusic.apply(this, arguments);
					};
				}
				if (!this._observer && window.MutationObserver) {
					const self = this;
					this._observer = new MutationObserver(function (mutations) {
						for (const m of mutations) {
							for (const node of m.addedNodes) {
								if (node && node.nodeName == 'AUDIO' && node === ui.backgroundMusic) {
									if (self.active && self.src && String(node.src || '') !== String(self.expectedAbs || '')) {
										self._bindAudio(node);
										node.__gfbgm_expectedSrc = self.src;
										node.__gfbgm_expectedAbs = self.expectedAbs;
										node.src = self.src;
										node.loop = true;
										node.load();
										node.play().catch(() => {});
									}
								}
							}
						}
					});
					try { this._observer.observe(document.body, { childList: true, subtree: true }); }
					catch (e) { try { this._observer.observe(ui.window, { childList: true, subtree: true }); } catch (e2) {} }
				}
				this._start();
			},
			stop() {
				this.locked = false;
				if (!this.active) return;
				this.active = false;
				this._stopLoop();
				const a = ui.backgroundMusic;
				if (a && window.GF_bgmSwitching) {
					try { a.pause(); } catch (e) {}
					a.__gfbgm_expectedSrc = null;
					a.__gfbgm_expectedAbs = null;
				} else if (a) {
					try { a.pause(); } catch (e) {}
					const back = this.restoreSrc || lib.config.originalGFBgmSrc;
					if (back) {
						// 还原原来的BGM，找不到就回退默认设置里的BGM
						let handled = false;
						const fallbackDefault = function () {
							if (handled) return;
							handled = true;
							try {
								a.__gfbgm_expectedSrc = null;
								a.loop = false;
								game.playBackgroundMusic();
							} catch (e) {}
						};
						a.__gfbgm_expectedSrc = null;
						a.addEventListener('error', fallbackDefault, { once: true });
						a.src = back;
						a.loop = true;
						a.load();
						a.play().catch(() => {});
					} else {
						// 没有记录到原BGM就直接放默认设置里的BGM
						a.__gfbgm_expectedSrc = null;
						try { game.playBackgroundMusic(); } catch (e) {}
					}
				}
				if (this._origPlayBackgroundMusic && game) {
					game.playBackgroundMusic = this._origPlayBackgroundMusic;
					this._origPlayBackgroundMusic = null;
				}
				this.src = null;
				this.character = null;
				this.expectedAbs = null;
			},
		};
		return guard;
	})();
	// 背景
	window.GF_bgGuard = window.GF_bgGuard || (function () {
		const guard = {
			active: false,
			src: null,
			character: null,
			locked: false,
			_selfOwned: false,
			_interval: null,
			_observer: null,
			_type() {
				return /\.(mp4|webm|ogg|ogv|m4v)$/i.test(String(this.src||'')) ? "video" : "image";
			},
			_build() {
				const self = this;
				const type = this._type();
				let root = document.getElementById('gf-bg-guard-root');
				if (!root) {
					root = document.createElement('div');
					root.id = 'gf-bg-guard-root';
					root.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;overflow:hidden;background:#000;opacity:0;transition:opacity 0.3s ease;';
					document.body.appendChild(root);
				} else {
					root.style.opacity = '0';
				}
				const sel = type == "video" ? 'video.gf-bg-video' : 'img.gf-bg-img';
				const oldSel = type == "video" ? 'img.gf-bg-img' : 'video.gf-bg-video';
				let el = root.querySelector(sel);
				// 类型切换时清掉旧的另一种素材元素避免叠加
				const oldEl = root.querySelector(oldSel);
				if (oldEl) oldEl.remove();
				if (!el) {
					el = document.createElement(type == "video" ? 'video' : 'img');
					el.className = type == "video" ? 'gf-bg-video' : 'gf-bg-img';
					el.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;';
					if (type == "video") {
						el.loop = true;
						el.muted = true;
						el.playsInline = true;
						el.setAttribute('playsinline', '');
						el.setAttribute('webkit-playsinline', '');
						el.preload = 'auto';
					}
					root.appendChild(el);
					if (el.__gf_showBg === undefined) el.__gf_showBg = false;
					const show = function () {
						if (el.__gf_showBg) return;
						el.__gf_showBg = true;
						if (type == "video") el.play().catch(() => {});
						root.style.opacity = '1';
						if (self._selfOwned) self.locked = true;
					};
					const hide = function () {
						if (el.__gf_showBg) return;
						root.style.opacity = '0';
						// 素材加载不出来就放弃，不要挡住别人的背景
						self.locked = false;
					};
					if (type == "video") {
						el.addEventListener('loadeddata', show);
						el.addEventListener('canplaythrough', show);
					} else {
						el.addEventListener('load', show);
					}
					el.addEventListener('error', hide);
					setTimeout(function () {
						if (!el.__gf_showBg) hide();
					}, 6000);
				}
				if (this.src && String(el.getAttribute('src') || '') !== String(this.src)) {
					el.__gf_showBg = false;
					el.src = this.src;
					if (type == "video") el.load();
				}
				if (!el.src) { el.src = this.src; if (type == "video") el.load(); }
				return root;
			},
			_start() {
				if (this._interval) return;
				const self = this;
				this._interval = setInterval(function () {
					try {
						if (!self.active || !self.src) return;
						const root = document.getElementById('gf-bg-guard-root');
						if (!root) {
							self._build();
							return;
						}
						const el = root.querySelector('video.gf-bg-video, img.gf-bg-img');
						if (!el || String(el.getAttribute('src') || '') !== String(self.src)) {
							root.parentNode && root.parentNode.removeChild(root);
							self._build();
						}
						root.style.zIndex = '-1';
					} catch (e) {}
				}, 500);
				if (!this._observer && window.MutationObserver) {
					const self = this;
					this._observer = new MutationObserver(function (mutations) {
						try {
							if (!self.active || !self.src) return;
							for (const m of mutations) {
								if (m.type == 'childList' && !document.getElementById('gf-bg-guard-root')) {
									self._build();
									return;
								}
							}
						} catch (e) {}
					});
					this._observer.observe(document.body, { childList: true, subtree: true });
				}
			},
			_stopLoop() {
				if (this._interval) { clearInterval(this._interval); this._interval = null; }
				if (this._observer) { try { this._observer.disconnect(); } catch (e) {} this._observer = null; }
			},
			lock() { this.locked = true; },
			unlock() { this.locked = false; this._selfOwned = false; },
			set(path, character, force, self) {
				if (!path) return;
				if (this.locked && !self) return;
				if (this.active && this.src === path) {
					if (self) { this._selfOwned = true; this.locked = true; }
					return;
				}
				if (this.active && this.src && this.src !== path && !force) return;
				this.src = path;
				this.character = character || null;
				this.active = true;
				this._selfOwned = !!self;
				if (self) this.locked = true;
				this._build();
				this._start();
			},
			stop() {
				this.active = false;
				this.locked = false;
				this._selfOwned = false;
				this._stopLoop();
				const root = document.getElementById('gf-bg-guard-root');
				if (root) { try { root.parentNode && root.parentNode.removeChild(root); } catch (e) {} }
				this.src = null;
				this.character = null;
			},
		};
		return guard;
	})();
	// 总开关
	window.GF_guardStopAll = function () {
		try { window.GF_bgmGuard.stop(); } catch (e) {}
		try { window.GF_bgGuard.stop(); } catch (e) {}
	};
	// 手动解锁允许别人的背景和BGM切进来
	window.GF_guardUnlockAll = function () {
		try { window.GF_bgmGuard.unlock(); } catch (e) {}
		try { window.GF_bgGuard.unlock(); } catch (e) {}
	};
	window.GF_guardState = function () {
		return {
			bgm: window.GF_bgmGuard.active,
			bgmLocked: window.GF_bgmGuard.locked,
			bgmSrc: window.GF_bgmGuard.src,
			bg: window.GF_bgGuard.active,
			bgLocked: window.GF_bgGuard.locked,
			bgSrc: window.GF_bgGuard.src,
		};
	};
	lib.element.player.GF_checkResourceExists = function (url) {
		return new Promise((resolve) => {
			const controller = new AbortController();
			fetch(url, { method: 'HEAD', signal: controller.signal })
				.then(res => resolve(res.ok))
				.catch(() => resolve(false))
				.finally(() => controller.abort());
		});
	};
	// 播放BGM
	lib.element.player.GF_playBgm = async function (characterName, force = true, duration = 0, reset = true) {
		if (!window.GF_bgmGuard) return;
		if (!force && window.GF_bgmGuard.active && window.GF_bgmGuard.character && window.GF_bgmGuard.character !== characterName) return;
		const bgmPath = lib.assetURL + "extension/鸽府包/audio/bgm/" + characterName + ".mp3";
		if (!lib.config.originalGFBgmSrc) {
			try { lib.config.originalGFBgmSrc = ui.backgroundMusic ? (ui.backgroundMusic.getAttribute('src') || ui.backgroundMusic.src) : ''; } catch (e) {}
		}
		// 已经在放同一首就不重置
		const sameBgm = window.GF_bgmGuard.active && window.GF_bgmGuard.src === bgmPath;
		if (reset !== false && !sameBgm) {
			try { this.resetGFAll(true); } catch (e) {}
		}
		try {
			window.GF_bgmGuard.set(bgmPath, characterName, true, true);
			game.broadcastAll((path, charName) => {
				if (window.GF_bgmGuard) window.GF_bgmGuard.set(path, charName);
			}, bgmPath, characterName);
			if (duration > 0) {
				setTimeout(() => {
					game.broadcastAll(() => {
						if (window.GF_bgmGuard) window.GF_bgmGuard.stop();
					});
				}, duration);
			}
		} catch (e) {
			console.warn('BGM播放失败:', e);
		}
	};
	// 切换背景支持jpg和mp4自动识别传名字可带可不带后缀
	lib.element.player.GF_changeBackground = async function (characterName) {
		try {
			const name = /\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i.test(characterName) ? characterName : characterName + ".mp4";
			const bgPath = lib.assetURL + "extension/鸽府包/image/animation/" + name;
			window.GF_bgGuard.set(bgPath, characterName, true, true);
			game.broadcastAll((path, charName) => {
				if (window.GF_bgGuard) window.GF_bgGuard.set(path, charName);
			}, bgPath, characterName);
		} catch (e) {
			console.warn('GF_changeBackground 失败', e);
		}
	};
	// BGM与背景一起
	lib.element.player.GFBgmAndBg = async function (characterName) {
		await this.GF_playBgm(characterName, true);
		await this.GF_changeBackground(characterName);
	};
	// 解锁BGM
	lib.element.player.GF_unlockBgm = function (characterName = null) {
		game.broadcastAll((charName) => {
			if (!window.GF_bgmGuard) return;
			if (!charName || window.GF_bgmGuard.character === charName) {
				window.GF_bgmGuard.stop();
			}
		}, characterName);
	};
	lib.element.player.closeGFBgm = function () {
		try {
			game.broadcastAll(() => {
				if (window.GF_bgmGuard) window.GF_bgmGuard.stop();
			});
		} catch (e) {
			console.warn("closeGFBgm错误", e);
		}
	};
	// 清除背景
	lib.element.player.clearGFBackground = function () {
		try {
			game.broadcastAll(() => {
				if (ui.background && ui.background.stopVideo) ui.background.stopVideo();
				if (window.GF_bgGuard) window.GF_bgGuard.stop();
			});
		} catch (e) {}
	};
	// 重置所有
	lib.element.player.resetGFAll = function (switching) {
		game.broadcastAll(flag => {
			window.GF_bgmSwitching = flag === true;
			try {
				if (window.GF_guardStopAll) window.GF_guardStopAll();
			} finally {
				window.GF_bgmSwitching = false;
			}
		}, switching === true);
	};
	// 移出游戏要广播, 引擎的 player.out 只改本端
	lib.gflib_syncOut = function (player, skill) {
		if (!player) return;
		game.broadcastAll((p, sk) => {
			if (p && typeof p.out == "function") p.out(sk);
		}, player, skill);
	};
	// 移回游戏要广播
	lib.gflib_syncIn = function (player, skill) {
		if (!player) return;
		game.broadcastAll((p, sk) => {
			if (p && typeof p.in == "function") p.in(sk);
		}, player, skill);
	};
	// 全屏CG
	window.GF_createCG = function (src, callback, bool, background) {
		if (!src) {
			typeof callback === 'function' && callback();
			return null;
		}
		var cg = document.createElement("video");
		cg.setAttribute("width", "100%");
		cg.setAttribute("height", "100%");
		cg.setAttribute("src", src);
		cg.setAttribute("autoplay", "autoplay");
		cg.setAttribute("muted", "muted");
		cg.setAttribute("playsinline", "playsinline");
		cg.style.objectFit = "contain";
		var safeCallback = typeof callback === 'function' ? callback : function() {};
		if (callback) cg.addEventListener("ended", safeCallback);
		cg.addEventListener("canplaythrough", function() {
			if (background) background.appendChild(cg);
			if (bool !== false) {
				this.onclick = function() {
					this.play();
					this.currentTime = this.duration;
				};
			}
		});
		cg.onerror = function(e) {
			safeCallback();
		};
		return cg;
	};
	game.gf_cg = function() {
		var next = game.createEvent('gf_cg', false);
		for (var argument of arguments) {
			if (argument == 'nopause') {
				next.nopause = true;
			} else if (argument == 'noskip') {
				next.noskip = false;
			} else if (argument == 'nofeature') {
				next.nofeature = true;
			} else if (typeof argument == 'string') {
				next.src = argument.endsWith('.mp4') ? argument : argument + '.mp4';
			} else if (typeof argument == 'function') {
				next.callback = argument;
			}
		}
		next.setContent('gf_cg');
		return next;
	};
	lib.element.content.gf_cg = function() {
		if (!event.src) return;
		function GF_createCG(src, callback, bool, background) {
			var cg = document.createElement("video");
			cg.setAttribute("width", "100%");
			cg.setAttribute("height", "100%");
			cg.setAttribute("src", src);
			cg.setAttribute("autoplay", "autoplay");
			cg.muted = true;
			cg.playsInline = true;
			cg.style.objectFit = "contain";
			if (callback) cg.addEventListener("ended", callback);
			cg.addEventListener("canplaythrough", function() {
				if (background) background.appendChild(cg);
				if (bool !== false) {
					this.onclick = function() {
						this.play();
						this.currentTime = this.duration;
					};
				}
			});
			cg.onerror = function() {
				if (typeof callback === 'function') callback();
			};
			return cg;
		}
		game.broadcastAll(function(src, callback, nofeature, noskip, nopause) {
			if (ui.backgroundMusic) ui.backgroundMusic.pause();
			var background = ui.create.div('.cg', ui.window);
			background.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				width: 100%;
				height: 100%;
				background: #000;
				z-index: ${nofeature ? '0' : '9999'};
				display: flex;
				justify-content: center;
				align-items: center;
				box-sizing: border-box;
				overflow: hidden;
			`;
			var videoFullUrl = lib.assetURL + 'extension/鸽府包/image/animation/' + src;
			var cg = GF_createCG(videoFullUrl, function() {
				try {
					if (ui.window.contains(background)) {
						ui.window.removeChild(background);
					}
				} catch (e) {}
				if (ui.backgroundMusic && ui.backgroundMusic.duration) ui.backgroundMusic.play();
				if (nopause !== true) game.resume();
				if (typeof callback == 'function') callback();
			}, noskip, background);
			if (nopause !== true) game.pause();
		}, event.src, event.callback, event.nofeature, event.noskip, event.nopause);
	};
	// 三角大招
	Object.assign(lib.element.player, {
		async GFSanVideo(mp4Name) {
			try {
				this.clearGFSanVideo();
				const root = document.createElement('div');
				root.style.cssText = `
					position: fixed;
					left: 0;
					top: 0;
					width: 100vw;
					height: 100vh;
					z-index: 999999;
					pointer-events: none;
					overflow: hidden;
				`;
				const videoSrc = lib.assetURL + `extension/鸽府包/image/animation/${mp4Name}.mp4`;
				// 遮罩
				const mask = document.createElement('div');
				mask.style.cssText = `
					position: absolute;
					left: 0;
					top: 0;
					width: 100%;
					height: 100%;
					background: transparent;
					clip-path: polygon(100% 15%, 100% 55%, 100% 55%);
					animation: triangleExtend 1.8s ease-in-out forwards;
				`;
				root.appendChild(mask);
				// 视频
				const video = document.createElement('video');
				video.src = videoSrc;
				video.style.cssText = `
					position: absolute;
					width: 100%;
					height: 100%;
					object-fit: cover;
				`;
				video.autoplay = true;
				video.loop = false;
				video.muted = true;
				mask.appendChild(video);
				// 白光刃
				const blade = document.createElement('div');
				blade.style.cssText = `
					position: absolute;
					width: 100%;
					height: 100%;
					background: linear-gradient(to left, transparent, #fff, transparent);
					clip-path: polygon(100% 15%, 100% 55%, 100% 55%);
					opacity: 0;
					animation: triangleExtend 1.8s ease-in-out forwards;
					filter: drop-shadow(0 0 10px #fff);
				`;
				root.appendChild(blade);
				document.body.appendChild(root);
				window._currentArcGFVideo = root;
				const style = document.createElement('style');
				style.innerHTML = `
					@keyframes triangleExtend {
						0%   { clip-path: polygon(100% 15%, 100% 55%, 100% 55%); }
						50%  { clip-path: polygon(100% 15%, 100% 55%, -20% 70%); }
						100% { clip-path: polygon(100% 15%, 100% 55%, 100% 55%); }
					}
				`;
				document.head.appendChild(style);
				await new Promise(r => setTimeout(r, 1800));
				this.clearGFSanVideo();
			} catch (e) {
				console.warn('大招动画失败', e);
			}
		},
		clearGFSanVideo() {
			if (window._currentArcGFVideo) {
				window._currentArcGFVideo.remove();
				window._currentArcGFVideo = null;
			}
		},
	});
	// 自动关闭互动表情
	if(!lib.config.extension_鸽府包_gfb_hdcd){
		const original_getNodeIntro = get.nodeintro;
		get.nodeintro = function (node, simple, evt, uiintro) {
			const intro = original_getNodeIntro.call(this, node, simple, evt, uiintro);
			if (!intro) return intro;
			if (intro.content._emotionInjected) {
				return intro;
			}
			const hasEmotionText = intro.content.textContent.includes("发送交互表情");
			if (!hasEmotionText) {
				return intro;
			}
			intro.content._emotionInjected = true;
			if (node && node._gfOnlySkill) {
				intro.content.querySelectorAll('.add-setting, .emotion-custom').forEach(el => el.remove());
				intro.content.querySelectorAll('.text').forEach(el => {
					if (el.textContent.trim() == "发送交互表情") el.remove();
				});
				return intro;
			}
			if (!game.observe && _status.gameStarted && game.me && node != game.me) {
				intro.content.querySelectorAll('.add-setting, .emotion-custom').forEach(el => el.remove());
				ui.throwEmotion = [];
				const click = function (e) {
					if (e && e.stopPropagation) e.stopPropagation();
					if (_status.dragged || _status.justdragged) return;
					const emotion = this.link;
					if (game.online) {
						game.send("throwEmotion", node, emotion);
					} else {
						game.me.throwEmotion(node, emotion);
					}
					_status.throwEmotionWait = true;
					setTimeout(() => {
						_status.throwEmotionWait = false;
					}, emotion === "flower" || emotion === "egg" ? 500 : 5000);
					if (e && e.preventDefault) e.preventDefault();
					return false;
				};
				const table1 = ui.create.div("add-setting emotion-custom");
				table1.style.margin = "0";
				table1.style.width = "100%";
				const list1 = ["flower", "egg"];
				list1.forEach(item => {
					const td = ui.create.div(".menubutton.reduce_radius.pointerdiv.tdnode");
					td.link = item;
					td.innerHTML = `<span>${get.translation(item)}</span>`;
					td.addEventListener(lib.config.touchscreen ? "touchend" : "click", click);
					table1.appendChild(td);
				});
				intro.content.appendChild(table1);
				const table2 = ui.create.div("add-setting emotion-custom");
				table2.style.margin = "0";
				table2.style.width = "100%";
				let list2 = ["wine", "shoe"];
				if (game.me.storage.zhuSkill_shanli) list2 = ["yuxisx", "jiasuo"];
				list2.forEach(item => {
					const td = ui.create.div(".menubutton.reduce_radius.pointerdiv.tdnode");
					td.link = item;
					td.innerHTML = `<span>${get.translation(item)}</span>`;
					td.addEventListener(lib.config.touchscreen ? "touchend" : "click", click);
					table2.appendChild(td);
				});
				intro.content.appendChild(table2);
			}
			return intro;
		};
	}

	lib.element.player.dyingFrozen = function (reason, force) {
		const isFrozen = get.gflib_typeFrozen(this);
		const frozenVal = this.gflib_getFrozen();
		const maxFrozen = this.gflib_getMaxFrozen();
		const mustDyingByFrozen = isFrozen && frozenVal >= maxFrozen;
		if (this.nodying || this.isDying() || (!mustDyingByFrozen && this.hp > 0)) {
			return;
		}
		var next = game.createEvent("dying");
		next.player = this;
		if (mustDyingByFrozen) {
			next.reason = "冻结";
			next.force = true;
		} else {
			next.reason = reason;
			if (reason && reason.source) {
				next.source = reason.source;
			}
		}
		next.setContent("dyingFrozen");
		next.filterStop = function() {
			if (this.player.hp > 0 || this.nodying) {
				delete this.filterStop;
				return true;
			}
		};
		return next;
	};
	
	lib.element.content.dyingFrozen = async function (event, trigger, player) {
		event.forceDie = true;
		const isFrozenDying = get.gflib_typeFrozen(player);
		const frozenValue = player.gflib_getFrozen();
		const maxFrozen = player.gflib_getMaxFrozen();
		if (player.isDying() || (player.hp > 0 && !isFrozenDying && !event.force)) {
			event.finish();
			return;
		}
		_status.dying.unshift(player);
		game.broadcast(function (list) {
			_status.dying = list;
		});
		await event.trigger("dying");
		game.log(player, "濒死");
		delete event.filterStop;
		const frozenAlive = isFrozenDying && (frozenValue < maxFrozen);
		if (!isFrozenDying && (player.hp > 0 || event.nodying || frozenAlive)) {
			_status.dying.remove(player);
			game.broadcast(function (list) {
				_status.dying = list;
			});
			event.finish();
			return;
		}
		if (!event.skipTao) {
			var next = game.createEvent("_saveFrozen");
			var start = false;
			var starts = [_status.currentPhase, event.source, event.player, game.me, game.players[0]];
			for (var i = 0; i < starts.length; i++) {
				if (get.itemtype(starts[i]) == "player" && game.players.concat(game.dead).includes(starts[i])) {
					start = starts[i];
					break;
				}
			}
			next.player = start;
			next._trigger = event;
			next.triggername = "_saveFrozen";
			next.forceDie = true;
			next.setContent("_saveFrozen");
			await next;
		}
		_status.dying.remove(player);
		game.broadcast(function (list) {
			_status.dying = list;
		});
		const needDead = isFrozenDying || (player.hp <= 0 && !event.nodying && !player.nodying && !frozenAlive);
		if (needDead && player.isAlive()) {
			await player.dieFrozen(event.reason);
		}
		event.finish();
	};

	lib.element.content._saveFrozen = async function (event, trigger) {
		event.dying = trigger.player;
		const dying = trigger.player;
		const frozenValue = dying.gflib_getFrozen();
		if (!event.acted) {
			event.acted = [];
		}
		while (true) {
			if (dying.isDead()) {
				event.finish();
				return;
			}
			const player = event.player;
			if (event.acted.includes(player)) {
				trigger.untrigger();
				break;
			}
			event.acted.push(player);
			var str = get.translation(dying) + "冻结濒死，是否帮助？";
			var str2 = "当前体力：" + dying.hp + "，当前冻结值：" + frozenValue;
			let result = { bool: false };
			const isFrozen = get.gflib_typeFrozen(dying);
			if (lib.config.tao_enemy && event.dying.side != player.side && lib.config.mode != "identity" && lib.config.mode != "guozhan" && !dying.hasSkillTag("revertsave") && !isFrozen) {
				result = { bool: false };
			} else if (player.canSave(event.dying)) {
				result = await player.chooseToUse({
					filterCard: function (card, player, event) {
						event = event || _status.event;
						return lib.filter.cardSavable(card, player, event.dying);
					},
					filterTarget: function (card, player, target) {
						if (target != _status.event.dying) {
							return false;
						}
						if (!card) {
							return false;
						}
						var info = get.info(card);
						if (!info.singleCard || ui.selected.targets.length == 0) {
							var mod = game.checkMod(card, player, target, "unchanged", "playerEnabled", player);
							if (mod == false) {
								return false;
							}
							var mod = game.checkMod(card, player, target, "unchanged", "targetEnabled", target);
							if (mod != "unchanged") {
								return mod;
							}
						}
						return true;
					},
					prompt: str,
					prompt2: str2,
					ai1: function (card) {
						if (typeof card == "string") {
							var info = get.info(card);
							if (info.ai && info.ai.order) {
								if (typeof info.ai.order == "number") {
									return info.ai.order;
								} else if (typeof info.ai.order == "function") {
									return info.ai.order();
								}
							}
						}
						return 1;
					},
					ai2: function (target) {
						let effect_use = get.effect_use(target);
						if (effect_use <= 0) {
							return effect_use;
						}
						return get.effect(target);
					},
					type: "dying",
					targetRequired: true,
					dying: event.dying,
				}).forResult();
			} else {
				result = { bool: false };
			}
			if (event.finished) return;
			if (result.bool) {
				if (dying.hp <= 0 && !trigger.nodying && !dying.nodying && dying.isAlive() && !dying.isOut()) {
					event.acted = [];
					continue;
				} else {
					trigger.untrigger();
					break;
				}
			} else {
				let found = false;
				for (var i = 0; i < 20; i++) {
					let nextPlayer = event.player.next;
					if (event.acted.includes(nextPlayer)) {
						break;
					}
					event.player = nextPlayer;
					if (!event.player.isOut()) {
						found = true;
						break;
					}
				}
				if (!found) {
					trigger.untrigger();
					break;
				}
			}
		}
	};

	lib.element.player.dieFrozen = function (reason, restMap = { type: null, count: null, audio: null }) {
		var next = game.createEvent("dieFrozen");
		next.player = this;
		next.reason = reason;
		next.restMap = restMap;
		if (reason) {
			next.source = reason.source;
		}
		next.excludeMark = [];
		next.setContent("dieFrozen");
		return next;
	};

	lib.element.content.dieFrozen = [
		async (event, trigger, player) => {
			const { reason, source } = event;
			event.forceDie = true;
			if (_status.roundStart == player && !event.reserveOut) {
				_status.roundStart = player.next || player.getNext() || game.players[0];
			}
			if (ui.land && ui.land.player == player) {
				game.addVideo("destroyLand");
				ui.land.destroy();
			}
			let unseen = false;
			if (player.classList.contains("unseen")) {
				player.classList.remove("unseen");
				unseen = true;
			}
			const logvid = game.logv(player, "dieFrozen", source);
			event.logvid = logvid;
			if (unseen) {
				player.classList.add("unseen");
			}
			if (source) {
				game.log(player, "因冻结被", source, "击杀");
				if (source.stat[source.stat.length - 1].kill == undefined) {
					source.stat[source.stat.length - 1].kill = 1;
				} else {
					source.stat[source.stat.length - 1].kill++;
				}
			} else {
				game.log(player, "因冻结阵亡");
			}
			game.broadcastAll(function (player) {
				player.classList.add("dead");
				player.removeLink();
				player.classList.remove("turnedover");
				player.classList.remove("out");
				player.node.count.innerHTML = "0";
				player.node.hp.hide();
				player.node.equips.hide();
				player.node.count.hide();
				player.previous.next = player.next;
				player.next.previous = player.previous;
				game.players.remove(player);
				game.dead.push(player);
			}, player);
			// 死亡语音
			if (!event.noDieAudio) {
				game.tryDieAudio(player);
			}
			// 死亡动画
			if (!event.reserveOut) {
				game.addVideo("diex", player);
				if (event.animate !== false) {
					player.$die(source);
				}
			}
			if (player.hp != 0) {
				await player.changeHp(0 - player.hp, false).set("forceDie", true);
			}
		},
		async (event, trigger, player) => {
			const { source } = event;
			if (player.dieAfter && !event.reserveOut && !event.noDieAfter) {
				await player.dieAfter(source);
			}
		},
		async (event, trigger, player) => {
			game.callHook("checkDie", [event, player]);
			await event.trigger("die");
		},
		async (event, trigger, player) => {
			const { reason, source } = event;
			if (player.isDead()) {
				if (!game.reserveDead) {
					const exclude = event.excludeMark || [];
					for (const mark in player.marks) {
						if (exclude.includes(mark)) continue;
						player.unmarkSkill(mark);
					}
					let count = 1;
					const list = Array.from(player.node.marks.childNodes);
					count += exclude.filter(name => list.some(i => i.name == name)).length;
					const func = function (player, count, exclude) {
						while (player.node.marks.childNodes.length > count) {
							let node = player.node.marks.lastChild;
							if (exclude.includes(node.name)) node = node.previousSibling;
							node.remove();
						}
					};
					game.broadcast(function (func, player, count, exclude) {
						func(player, count, exclude);
					}, func, player, count, exclude);
					player.removeTip();
				}
				for (const i in player.tempSkills) {
					player.removeSkill(i);
				}
				const skills = player.getSkills();
				for (let i = 0; i < skills.length; i++) {
					if (lib.skill[skills[i]].temp) {
						player.removeSkill(skills[i]);
					}
				}
				if (_status.characterlist && !event.reserveOut) {
					if (lib.character[player.name] && !player.name.startsWith("gz_shibing") && !player.name.startsWith("gz_jun_")) {
						_status.characterlist.add(player.name);
					}
					if (lib.character[player.name1] && !player.name1.startsWith("gz_shibing") && !player.name1.startsWith("gz_jun_")) {
						_status.characterlist.add(player.name1);
					}
					if (lib.character[player.name2] && !player.name2.startsWith("gz_shibing") && !player.name2.startsWith("gz_jun_")) {
						_status.characterlist.add(player.name2);
					}
				}
				event.cards = player.getCards("hejsx");
				if (event.cards.length) {
					await player.discard(event.cards).set("forceDie", true);
				}
			}
		},
		async (event, trigger, player) => {
			const { reason, source } = event;
			if (!event.reserveOut) {
				game.broadcastAll(function (player) {
					if (game.online && player == game.me && !_status.over && !game.controlOver && !ui.exit) {
						if (lib.mode[lib.configOL.mode].config.dierestart) {
							ui.create.exit();
						}
					}
				}, player);
				if (!_status.connectMode && player == game.me && !_status.over && !game.controlOver) {
					ui.control.show();
					if (get.config("revive") && lib.mode[lib.config.mode].config.revive && !ui.revive) {
						ui.revive = ui.create.control("revive", ui.click.dierevive);
					}
					if (get.config("continue_game") && !ui.continue_game && lib.mode[lib.config.mode].config.continue_game && !_status.brawl && !game.no_continue_game) {
						ui.continue_game = ui.create.control("再战", game.reloadCurrent);
					}
					if (get.config("dierestart") && lib.mode[lib.config.mode].config.dierestart && !ui.restart) {
						ui.restart = ui.create.control("restart", game.reload);
					}
				}
				if (!_status.connectMode && player == game.me && !game.modeSwapPlayer) {
					if (ui.auto) ui.auto.hide();
					if (ui.wuxie) ui.wuxie.hide();
				}
				if (typeof _status.coin == "number" && source && !_status.auto) {
					if (source == game.me || source.isUnderControl()) {
						_status.coin += 10;
					}
				}
			}
			if (source && lib.config.border_style == "auto" && (lib.config.autoborder_count == "kill" || lib.config.autoborder_count == "mix")) {
				switch (source.node.framebg.dataset.auto) {
					case "gold": case "silver": source.node.framebg.dataset.auto = "gold"; break;
					case "bronze": source.node.framebg.dataset.auto = "silver"; break;
					default: source.node.framebg.dataset.auto = lib.config.autoborder_start || "bronze";
				}
				if (lib.config.autoborder_count == "kill") {
					source.node.framebg.dataset.decoration = source.node.framebg.dataset.auto;
				} else {
					let dnum = 0;
					for (let j = 0; j < source.stat.length; j++) {
						if (source.stat[j].damage != undefined) dnum += source.stat[j].damage;
					}
					source.node.framebg.dataset.decoration = "";
					switch (source.node.framebg.dataset.auto) {
						case "bronze": if (dnum >= 4) source.node.framebg.dataset.decoration = "bronze"; break;
						case "silver": if (dnum >= 8) source.node.framebg.dataset.decoration = "silver"; break;
						case "gold": if (dnum >= 12) source.node.framebg.dataset.decoration = "gold"; break;
					}
				}
				source.classList.add("topcount");
			}
		},
	],
	class Basic {
		chooseCard(check) {
			const event = _status.event;
			if (event.filterCard == void 0) {
				return check() > 0;
			}
			let i, j, range, cards, cards2, skills, effect;
			let ok = false, forced = event.forced;
			let iwhile = 100;
			while (iwhile--) {
				try {
					range = get.select(event.selectCard);
					if (ui.selected.cards.length >= range[0]) {
						ok = true;
					}
					if (range[1] <= -1) {
						if (ui.selected.cards.length == 0) {
							return true;
						}
						j = 0;
						CacheContext.setCacheContext(new CacheContext({ lib, game, get }));
						CacheContext.setInCacheEnvironment(true);
						for (i = 0; i < ui.selected.cards.length; i++) {
							effect = check(ui.selected.cards[i]);
							if (effect < 0) {
								j -= Math.sqrt(-effect);
							} else {
								j += Math.sqrt(effect);
							}
						}
						CacheContext.setInCacheEnvironment(false);
						CacheContext.removeCacheContext();
						return j > 0;
					}
					cards = get.selectableCards();
					if (!_status.event.player._noSkill) {
						cards = cards.concat(get.skills() || []); 
					}
					if (cards.length == 0) {
						return ok;
					}
					cards2 = cards.slice(0);
					var ix = 0;
					CacheContext.setCacheContext(new CacheContext({ lib, game, get }));
					CacheContext.setInCacheEnvironment(true);
					var checkix = check(cards[0], cards2);
					for (i = 1; i < cards.length; i++) {
						var checkixtmp = check(cards[i], cards2);
						if (checkixtmp > checkix) {
							ix = i;
							checkix = checkixtmp;
						}
					}
					if (check(cards[ix]) <= 0) {
						if (!forced || ok) {
							CacheContext.setInCacheEnvironment(false);
							CacheContext.removeCacheContext();
							return ok;
						}
					}
					CacheContext.setInCacheEnvironment(false);
					CacheContext.removeCacheContext();
					if (typeof cards[ix] == "string") {
						ui.click.skill(cards[ix]);
						var info = get.info?.(event.skill) || {}; 
						if (info.filterCard) {
							check = info.check || get.unuseful2;
							continue;
						} else {
							return true;
						}
					} else {
						cards[ix].classList.add("selected");
						ui.selected.cards.add(cards[ix]);
						game.check();
						if (ui.selected.cards.length >= range[0]) {
							ok = true;
						}
						if (ui.selected.cards.length == range[1]) {
							return true;
						}
					}
				} catch (e) {
					return ok;
				} finally {
					CacheContext.setInCacheEnvironment(false);
					CacheContext.removeCacheContext();
				}
			}
			return ok;
		}
	}
	lib.element.player.$compare = function (card1, target, card2, cardsetions) {
		if (!card1 || !target || !card2) {
			return;
		}
		if (!cardsetions && lib.config.card_animation_info) {
			var cardsetions = {}, cardsetion_targets = [this, target];
			for (let targetx of cardsetion_targets) {
				let id = targetx.playerid, cardsetion = get.cardsetion(targetx);
				cardsetions[id] = cardsetion;
			}
		}
		game.broadcast(
		function(player3, target2, card12, card22, cardsetions2) {
			player3.$compare(card12, target2, card22, cardsetions2);
		},
		this,
		target,
		card1,
		card2,
		cardsetions
		);
		game.addVideo("compare", this, [get.cardInfo(card1), target.dataset.position, get.cardInfo(card2)]);
		var player2 = this;
		var node1 = player2.$throwxy2(card1, "calc(50% - 114px)", "calc(50% - 52px)", "perspective(600px) rotateY(180deg)", true);
		if (lib.config.cardback_style != "default") {
			node1.style.transitionProperty = "none";
			ui.refresh(node1);
			node1.classList.add("infohidden");
			ui.refresh(node1);
			node1.style.transitionProperty = "";
		} else {
			node1.classList.add("infohidden");
		}
		if (cardsetions) {
			var next = ui.create.div(".cardsetion", cardsetions[player2.playerid] || "", node1);
			next.style.setProperty("display", "block", "important");
			if (node1.node) {
				if (node1.node.cardsetion) {
					node1.node.cardsetion.remove();
					delete node1.node.cardsetion;
				}
				node1.node.cardsetion = next;
			}
		}
		node1.style.transform = "perspective(600px) rotateY(180deg) translateX(0)";
		var onEnd01 = function() {
			setTimeout(function() {
				node1.style.transition = "all ease-in 0.3s";
				node1.style.transform = "perspective(600px) rotateY(270deg) translateX(52px)";
				var onEnd = function() {
					node1.classList.remove("infohidden");
					node1.style.transition = "all 0s";
					ui.refresh(node1);
					node1.style.transform = "perspective(600px) rotateY(-90deg) translateX(52px)";
					ui.refresh(node1);
					node1.style.transition = "";
					ui.refresh(node1);
					node1.style.transform = "";
				};
				node1.listenTransition(onEnd);
			}, 300);
		};
		node1.listenTransition(onEnd01);
		setTimeout(function() {
			var node2 = target.$throwxy2(card2, "calc(50% + 10px)", "calc(50% - 52px)", "perspective(600px) rotateY(180deg)", true);
			if (lib.config.cardback_style != "default") {
				node2.style.transitionProperty = "none";
				ui.refresh(node2);
				node2.classList.add("infohidden");
				ui.refresh(node2);
				node2.style.transitionProperty = "";
			} else {
				node2.classList.add("infohidden");
			}
			if (cardsetions) {
				var next2 = ui.create.div(".cardsetion", cardsetions[target.playerid] || "", node2);
				next2.style.setProperty("display", "block", "important");
				if (node2.node) {
					if (node2.node.cardsetion) {
						node2.node.cardsetion.remove();
						delete node2.node.cardsetion;
					}
					node2.node.cardsetion = next2;
				}
			}
			node2.style.transform = "perspective(600px) rotateY(180deg) translateX(0)";
			var onEnd02 = function() {
				setTimeout(function() {
					node2.style.transition = "all ease-in 0.3s";
					node2.style.transform = "perspective(600px) rotateY(270deg) translateX(52px)";
					var onEnd = function() {
						node2.classList.remove("infohidden");
						node2.style.transition = "all 0s";
						ui.refresh(node2);
						node2.style.transform = "perspective(600px) rotateY(-90deg) translateX(52px)";
						ui.refresh(node2);
						node2.style.transition = "";
						ui.refresh(node2);
						node2.style.transform = "";
					};
					node2.listenTransition(onEnd);
				}, 200);
			};
			node2.listenTransition(onEnd02);
		}, 200);
	};
	lib.element.player.$compareMultiple = function (card1, targets, cards, cardsetions) {
		if (!card1 || !targets || !cards) {
			return;
		}
		if (!cardsetions && lib.config.card_animation_info) {
			var cardsetions = {}, cardsetion_targets = [this];
			cardsetion_targets.addArray(targets);
			for (let target of cardsetion_targets) {
				let id = target.playerid, cardsetion = get.cardsetion(target);
				cardsetions[id] = cardsetion;
			}
		}
		game.broadcast(
		function(player3, card12, targets2, cards2, cardsetions2) {
			player3.$compareMultiple(card12, targets2, cards2, cardsetions2);
		},
		this,
		card1,
		targets,
		cards,
		cardsetions
		);
		game.addVideo("compareMultiple", this, [get.cardInfo(card1), get.targetsInfo(targets), get.cardsInfo(cards)]);
		var player2 = this;
		var node1 = player2.$throwxy2(card1, "calc(50% - 52px)", "calc(50% + 10px)", "perspective(600px) rotateY(180deg)", true);
		if (lib.config.cardback_style != "default") {
			node1.style.transitionProperty = "none";
			ui.refresh(node1);
			node1.classList.add("infohidden");
			ui.refresh(node1);
			node1.style.transitionProperty = "";
		} else {
			node1.classList.add("infohidden");
		}
		node1.style.transform = "perspective(600px) rotateY(180deg) translateX(0)";
		if (cardsetions) {
			var next = ui.create.div(".cardsetion", cardsetions[player2.playerid] || "", node1);
			next.style.setProperty("display", "block", "important");
			if (node1.node) {
				if (node1.node.cardsetion) {
					node1.node.cardsetion.remove();
					delete node1.node.cardsetion;
				}
				node1.node.cardsetion = next;
			}
		}
		var onEnd01 = function() {
			setTimeout(function() {
				node1.style.transition = "all ease-in 0.3s";
				node1.style.transform = "perspective(600px) rotateY(270deg) translateX(52px)";
				var onEnd = function() {
					node1.classList.remove("infohidden");
					node1.style.transition = "all 0s";
					ui.refresh(node1);
					node1.style.transform = "perspective(600px) rotateY(-90deg) translateX(52px)";
					ui.refresh(node1);
					node1.style.transition = "";
					ui.refresh(node1);
					node1.style.transform = "";
				};
				node1.listenTransition(onEnd);
			}, 300);
		};
		node1.listenTransition(onEnd01);
		setTimeout(function() {
			var left0 = -targets.length * 52 - (targets.length - 1) * 8;
			for (var i = 0; i < targets.length; i++) {
				(function(target, card2, i2) {
					var left = left0 + i2 * 120;
					var node2;
					if (left < 0) {
						node2 = target.$throwxy2(card2, "calc(50% - " + -left + "px)", "calc(50% - 114px)", "perspective(600px) rotateY(180deg)", true);
					} else {
						node2 = target.$throwxy2(card2, "calc(50% + " + left + "px)", "calc(50% - 114px)", "perspective(600px) rotateY(180deg)", true);
					}
					if (cardsetions) {
						var next2 = ui.create.div(".cardsetion", cardsetions[target.playerid] || "", node2);
						next2.style.setProperty("display", "block", "important");
						if (node2.node) {
							if (node2.node.cardsetion) {
								node2.node.cardsetion.remove();
								delete node2.node.cardsetion;
							}
							node2.node.cardsetion = next2;
						}
					}
					if (lib.config.cardback_style != "default") {
						node2.style.transitionProperty = "none";
						ui.refresh(node2);
						node2.classList.add("infohidden");
						ui.refresh(node2);
						node2.style.transitionProperty = "";
					} else {
						node2.classList.add("infohidden");
					}
					node2.style.transform = "perspective(600px) rotateY(180deg) translateX(0)";
					var onEnd02 = function() {
						setTimeout(function() {
							node2.style.transition = "all ease-in 0.3s";
							node2.style.transform = "perspective(600px) rotateY(270deg) translateX(52px)";
							var onEnd = function() {
								node2.classList.remove("infohidden");
								node2.style.transition = "all 0s";
								ui.refresh(node2);
								node2.style.transform = "perspective(600px) rotateY(-90deg) translateX(52px)";
								ui.refresh(node2);
								node2.style.transition = "";
								ui.refresh(node2);
								node2.style.transform = "";
							};
							node2.listenTransition(onEnd);
						}, 200);
					};
					node2.listenTransition(onEnd02);
				})(targets[i], cards[i], i);
			}
		}, 200);
	};
	lib.skill.gf_mianju = {
		mark: true,
		intro: {
			mark(dialog, storage, player) {
				const gfMianJuData = player.storage?.gf_mianju;
				if (gfMianJuData) {
					const originalName = gfMianJuData.originalName || "未知角色";
					dialog.addSmall([[originalName], (item, type, position, noclick, node) => lib.skill.rehuashen.$createButton(item, type, position, noclick, node)]);
					dialog.addText(`体力值：${gfMianJuData.originalHp || 0}/${gfMianJuData.originalMaxHp || 0}/${gfMianJuData.originalHujia || 0}`);
					const originalGroup = gfMianJuData.originalGroup || [];
					dialog.addText(`势力：${get.translation(originalGroup)}`);
					const originalSex = gfMianJuData.originalSex || [];
					dialog.addText(`性别：${get.translation(originalSex)}`);
					const validSkills = gfMianJuData.originalSkills?.filter(skill => {
						const reg = /_[a-zA-Z0-9]$/;
						return !reg.test(skill);
					}) || [];
					if (validSkills.length > 0) {
						dialog.addText('技能：');
						validSkills.forEach(skill => {
							dialog.addText(`${get.poptip(skill) || skill}`);
						});
					} else {
						dialog.addText('技能：无');
					}
				} else {
					dialog.addText('暂无数据');
				}
			},
		},
		trigger: {
			player: 'dieBefore',
		},
		charlotte: true,
		persevereSkill: true,
		fixed: true,
		superCharlotte: true,
		forceOut: true,
		forceDie: true,
		firstDo: true,
		globalFixed: true,
		silent: true,
		popup: false,
		priority: Infinity,
		filter: function (event, player) {
			return player.storage?.gf_mianju;
		},
		content: function () {
			const player = this.player || trigger.player;
			if (!player) return;
			if (typeof trigger._cancel === 'function') {
				trigger._cancel();
			} else if (typeof trigger.cancel === 'function') {
				trigger.cancel();
			}
			trigger._triggered = null;
			trigger._canceled = true;
			trigger.disabled = true;
			player.clearSkills();
			const gfMianJuData = player.storage.gf_mianju || {};
			try {
				if (gfMianJuData.originalHp !== undefined) {
					player.hp = parseFloat(gfMianJuData.originalHp);
					player.changeHp(0)._triggered = null;
				}
				if (gfMianJuData.originalMaxHp !== undefined) {
					player.maxHp = parseFloat(gfMianJuData.originalMaxHp);
				}
				if (gfMianJuData.originalHujia !== undefined) {
					player.hujia = parseFloat(gfMianJuData.originalHujia);
				}
				if (gfMianJuData.originalGroup !== undefined) {
					player.group = gfMianJuData.originalGroup;
				}
				if (gfMianJuData.originalSex !== undefined) {
					player.sex = gfMianJuData.originalSex;
				}
				if (Array.isArray(gfMianJuData.originalSkills) && gfMianJuData.originalSkills.length > 0) {
					gfMianJuData.originalSkills.forEach(skill => {
						const info = get.info(skill);
						if (info) {
							player.addSkill(skill);
						}
					});
				}
				const character = gfMianJuData.originalName || "未知角色";
				const finalName = get.slimName(character);
				if (player.rawName !== undefined) delete player.rawName;
				game.broadcastAll( function (targetPlayer, char, name2, sex2) {
					if (targetPlayer.node?.avatar && typeof targetPlayer.node.avatar.setBackground == "function") {
						targetPlayer.node.avatar.setBackground(char, "character");
					}
				if (targetPlayer.node?.name) {
					targetPlayer.node.name.innerHTML = name2;
					targetPlayer.node.name.style.background = "";
				}
				if (sex2 !== undefined) targetPlayer.sex = sex2;
			}, player, character, finalName, gfMianJuData.originalSex );
		} catch (e) {}
			const skillName = "gf_mianju";
			if (lib.skill[skillName]) {
				lib.skill[skillName].fixed = false;
			}
			player.removeSkill(skillName);
			const gfPersevered2 = gfMianJuData && gfMianJuData.perseveredSkills;
			if (gfPersevered2) {
				for (const sk in gfPersevered2) {
					if (lib.skill[sk]) {
						if (gfPersevered2[sk]) lib.skill[sk].persevereSkill = true;
						else delete lib.skill[sk].persevereSkill;
					}
				}
			}
			player.storage.gf_mianju = [];
		},
	},
	// 面具还原
	lib.element.player.gf_revertMianJu = function() {
		const data = this.storage.gf_mianju;
		if (!data || !data.originalName) return false;
		this.clearSkills();
		try {
			if (data.originalHp !== undefined) {
				this.hp = parseFloat(data.originalHp);
				this.changeHp(0)._triggered = null;
			}
			if (data.originalMaxHp !== undefined) this.maxHp = parseFloat(data.originalMaxHp);
			if (data.originalHujia !== undefined) this.hujia = parseFloat(data.originalHujia);
			if (data.originalGroup !== undefined) this.group = data.originalGroup;
			if (data.originalSex !== undefined) this.sex = data.originalSex;
			if (Array.isArray(data.originalSkills)) {
				for (const skill of data.originalSkills) {
					if (get.info(skill)) this.addSkill(skill);
				}
			}
		} catch (e) {}
		const character = data.originalName;
		const finalName = get.slimName(character);
		if (this.rawName !== undefined) delete this.rawName;
		game.broadcastAll(function(targetPlayer, char, name2, sex2) {
			if (targetPlayer.node && targetPlayer.node.avatar && typeof targetPlayer.node.avatar.setBackground == "function") {
				targetPlayer.node.avatar.setBackground(char, "character");
			}
			if (targetPlayer.node && targetPlayer.node.name) {
			targetPlayer.node.name.innerHTML = name2;
			targetPlayer.node.name.style.background = "";
		}
		if (sex2 !== undefined) targetPlayer.sex = sex2;
	}, this, character, finalName, data.originalSex);
	if (this.hasSkill("gf_mianju")) {
			const ms = lib.skill.gf_mianju;
			if (ms) {
				ms.fixed = false;
				ms.globalFixed = false;
				ms.persevereSkill = false;
			}
			this.removeSkill("gf_mianju");
			if (ms) {
				ms.fixed = true;
				ms.globalFixed = true;
				ms.persevereSkill = true;
			}
		}
		const gfPersevered = this.storage.gf_mianju && this.storage.gf_mianju.perseveredSkills;
		if (gfPersevered) {
			for (const sk in gfPersevered) {
				if (lib.skill[sk]) {
					if (gfPersevered[sk]) lib.skill[sk].persevereSkill = true;
					else delete lib.skill[sk].persevereSkill;
				}
			}
		}
		this.storage.gf_mianju = [];
		this.update();
		return true;
	};
	lib.element.player.gfMianJu = function(cfg) {
		if (!cfg || !cfg.name) {
			return false;
		}
		try {
			if (cfg.gfDengchang) {
				if (!this.storage.gf_dengchang_original) {
					this.storage.gf_dengchang_original = {
						originalName: this.name || "未知角色",
						originalHp: this.hp || 0,
						originalMaxHp: this.maxHp || 0,
						originalHujia: this.hujia || 0,
						originalGroup: this.group || [],
						originalSex: this.sex || [],
					};
				}
			} else {
				this.storage.gf_mianju = {
					originalName: this.name || "未知角色",
					originalHp: this.hp || 0,
					originalMaxHp: this.maxHp || 0,
					originalHujia: this.hujia || 0,
					originalGroup: this.group || [],
					originalSex: this.sex || [],
					originalSkills: [...this.skills]
				};
			}
			if (cfg.changeHp !== false) {
				this.hp = parseFloat(cfg.hp) || 1;
				this.changeHp(0)._triggered = null;
				this.maxHp = parseFloat(cfg.maxHp) || 1;
				this.hujia = parseFloat(cfg.hujia) || 0;
			}
			if (!cfg.gfDengchang) this.clearSkills();
			this.group = cfg.group;
			this.sex = cfg.sex;
			if (!cfg.gfDengchang) {
				const gfDengchangKeep = (this.skills || []).filter(function (s) { return lib.skill[s] && lib.skill[s].gfDengchang; });
				/*const curSkills = this.skills.slice();
				for (const s of curSkills) this.removeSkill(s);*/
				const validSkills = (cfg.skills || []).filter(skill => {
					const info = get.info(skill);
					return !!info;
				});
				if (validSkills.length > 0) {
					validSkills.forEach(skill => {
						this.addSkill(skill);
					});
					this.addSkill("gf_mianju");
				}
				gfDengchangKeep.forEach(s => { if (!this.hasSkill(s)) this.addSkill(s); });
			}
			const mianjuGlowClass = "gzt_mianju_glow";
			const translateKeys = ["", "_prefix", "_ab"].map((str) => lib.translate[cfg.name + str]);
			const prefixKey = translateKeys[1] || "";
			let fixedPrefix = "面具";
			if (cfg.noMaskPrefix) fixedPrefix = "";
			if (typeof cfg.prefix === "string") fixedPrefix = cfg.prefix;
			const originalNameRaw = cfg.name;
			const translatedName = get.translation(originalNameRaw) || originalNameRaw;
			let cleanedName = translatedName;
			if (prefixKey && cleanedName.startsWith(prefixKey)) {
				cleanedName = cleanedName.slice(prefixKey.length);
			}
			cleanedName = cleanedName || translatedName;
			let finalName = cleanedName;
			if (fixedPrefix) {
				let prefixHtml = "";
				for (let i = 0; i < fixedPrefix.length; i++) {
					const ch = fixedPrefix[i];
					const delay = (i * 0.3).toFixed(2);
					prefixHtml += `<span class="${mianjuGlowClass}" style="animation-delay:${delay}s;">${ch}</span>`;
				}
				finalName = `${prefixHtml}${cleanedName}`;
				this.rawName = `${fixedPrefix}${cleanedName}`;
			} else {
				this.rawName = cleanedName;
			}
			cfg.skill = cfg.skill || _status.event.name;
			const list = cfg.caption ? [cfg.caption] : translateKeys;
			const character = cfg.name;
			game.broadcastAll( function (targetPlayer, char, name2, sex2) {
				const mianjuGlowClass = "gzt_mianju_glow";
				if (!document.querySelector("#gztMianJuGlowStyle")) {
					const glowStyleEl = document.createElement("style");
					glowStyleEl.id = "gztMianJuGlowStyle";
					glowStyleEl.innerHTML =
						"." + mianjuGlowClass + " {\n" +
						"  display: inline-block;\n" +
						"  color: #ffffff;\n" +
						"  text-shadow: 0 0 4px #ff2d55, 0 0 8px #ff9500, 0 0 12px #34c759, 0 0 16px #00c7be, 0 0 20px #5e5ce6;\n" +
						"  animation: gztMianJuGlowHue 2.4s linear infinite;\n" +
						"}\n" +
						"@keyframes gztMianJuGlowHue {\n" +
						"  0% { filter: hue-rotate(0deg); }\n" +
						"  100% { filter: hue-rotate(360deg); }\n" +
						"}\n" +
						"@supports ((-webkit-background-clip: text) or (background-clip: text)) {\n" +
						"  ." + mianjuGlowClass + " {\n" +
						"    background: linear-gradient(90deg, #ff0000, #ff9900, #ffff00, #33ff00, #0099ff, #6633ff, #cc00ff, #ff0000);\n" +
						"    background-size: 200% 100%;\n" +
						"    -webkit-background-clip: text;\n" +
						"    background-clip: text;\n" +
						"    color: transparent;\n" +
						"    -webkit-text-fill-color: transparent;\n" +
						"    text-shadow: none;\n" +
						"    animation: gztMianJuGlowClip 2.4s linear infinite;\n" +
						"  }\n" +
						"  @keyframes gztMianJuGlowClip {\n" +
						"    0% { background-position: 0% 50%; }\n" +
						"    100% { background-position: 200% 50%; }\n" +
						"  }\n" +
						"}\n";
					document.head.appendChild(glowStyleEl);
				}
				if (targetPlayer.node?.avatar && typeof targetPlayer.node.avatar.setBackground == "function") {
					targetPlayer.node.avatar.setBackground(char, "character");
				}
				if (targetPlayer.node?.name) {
					targetPlayer.node.name.innerHTML = name2;
				}
				if (sex2 !== undefined) targetPlayer.sex = sex2;
			}, this, character, finalName, cfg.sex );
			if (!cfg.gfDengchang) {
				const immuneSkills = (cfg.skills || []).slice();
				if (gfLingyuKey) immuneSkills.push(gfLingyuKey);
				const persevered = {};
				for (const sk of immuneSkills) {
					if (!lib.skill[sk]) continue;
					persevered[sk] = !!lib.skill[sk].persevereSkill;
					lib.skill[sk].persevereSkill = true;
				}
				this.storage.gf_mianju.perseveredSkills = persevered;
			}
			return true;
		} catch (e) {
			return false;
		}
	};

	// 登场
	lib.element.player.gf_dengchang_recordHp = function () {
		if (this.storage.gf_dengchang_noHp) return;
		const id = this.storage.gf_dengchang_id;
		if (!id) return;
		this.storage.Mimi_dq_hpState = this.storage.Mimi_dq_hpState || {};
		this.storage.Mimi_dq_hpState[id] = { hp: this.hp, maxHp: this.maxHp, hujia: this.hujia || 0 };
	};
	lib.element.player.gf_dengchang_renderHp = function (dlg, curId, defaultHp) {
		if (!dlg || !Array.isArray(dlg.buttons)) return;
		let def = null;
		if (typeof defaultHp === "string" && defaultHp.indexOf("/") > 0) {
			const pp = defaultHp.split("/");
			def = { hp: parseInt(pp[0]) || 0, maxHp: parseInt(pp[1]) || 0, hujia: parseInt(pp[2]) || 0 };
		}
		for (const btn of dlg.buttons) {
			const id = btn.link;
			if (typeof id !== "string" || !lib.character[id]) continue;
			let hp, maxHp, hujia;
			if (id === curId) {
				hp = this.hp; maxHp = this.maxHp; hujia = this.hujia || 0;
			} else {
				const st = this.storage.Mimi_dq_hpState && this.storage.Mimi_dq_hpState[id];
				if (st) { hp = st.hp; maxHp = st.maxHp; hujia = st.hujia || 0; }
				else if (def) { hp = def.hp; maxHp = def.maxHp; hujia = def.hujia; }
				else {
					const info = get.character(id);
					hp = info.hp; maxHp = info.maxHp; hujia = info.hujia || 0;
				}
			}
			const hpNode = btn.node && btn.node.hp;
			if (!hpNode) continue;
			hpNode.innerHTML = '<span style="color:green">' + hp + '</span>/<span style="color:black">' + maxHp + '</span>/<span style="color:brown">' + hujia + '</span>';
		}
	};
	lib.element.player.gf_dengchang_clearTemp = function () {
		if (Array.isArray(this.storage.gf_dengchang_temp)) {
			for (const s of this.storage.gf_dengchang_temp) {
				if (!this.tempSkills || this.tempSkills[s] === undefined) continue;
				if (this.hasSkill(s)) this.removeSkill(s);
				delete this.tempSkills[s];
			}
		}
		this.storage.gf_dengchang_temp = [];
		game.broadcast(function (player, map2) { player.tempSkills = map2; }, this, this.tempSkills || {});
	};
	lib.element.player.gf_runGameStart = async function (sk) {
		const info = lib.skill[sk];
		if (!info || typeof info.content !== "function") return;
		const ev = game.createEvent("gf_dengchang_gameStart", false);
		ev.player = this;
		ev.source = this;
		ev.skill = sk;
		ev.setContent(info.content);
		await ev.forResult();
	};
	lib.element.player.gf_dengchang_revert = function () {
		const o = this.storage.gf_dengchang_original;
		if (!o) return false;
		this.gf_dengchang_clearTemp();
		delete this.storage.gf_dengchang_id;
		if (!this.storage.gf_dengchang_noHp) {
			this.hp = o.originalHp;
			this.changeHp(0)._triggered = null;
			this.maxHp = o.originalMaxHp;
			this.hujia = o.originalHujia;
		}
		this.group = o.originalGroup;
		this.sex = o.originalSex;
		const character = o.originalName;
		const finalName = get.slimName(character);
		if (this.rawName !== undefined) delete this.rawName;
		game.broadcastAll(function (targetPlayer, char, name2, sex2) {
			if (targetPlayer.node?.avatar && typeof targetPlayer.node.avatar.setBackground == "function") {
				targetPlayer.node.avatar.setBackground(char, "character");
			}
			if (targetPlayer.node?.name) targetPlayer.node.name.innerHTML = name2;
			if (sex2 !== undefined) targetPlayer.sex = sex2;
		}, this, character, finalName, o.originalSex);
		delete this.storage.gf_dengchang_original;
		delete this.storage.gf_dengchang_noHp;
		if (this.hasSkill("gf_dengchang_dying")) {
			try { this.removeSkill("gf_dengchang_dying"); } catch (e) {}
		}
		this.update();
		return true;
	};
	lib.element.player.gf_isGameStartSkill = function (name) {
		const info = lib.skill[name];
		if (!info || !info.trigger) return false;
		const t = info.trigger;
		const g = t.global, p = t.player;
		const has = function (v, key) {
			if (v === key) return true;
			if (Array.isArray(v) && v.includes(key)) return true;
			return false;
		};
		return has(g, "gameStart") || has(p, "gameStart") || has(g, "enterGame") || has(p, "enterGame");
	};
	lib.element.player.gf_dengchang_getCandidates = function (opts) {
		opts = opts || {};
		const self = this;
		let pool = opts.pool;
		let candidates = [];
		if (Array.isArray(pool)) {
			candidates = pool.slice();
		} else if (typeof pool === "function") {
			for (const id in lib.character) {
				try { if (pool(id, lib.character[id])) candidates.push(id); } catch (e) {}
			}
		} else if (typeof pool === "string") {
			for (const id in lib.character) { if (id.indexOf(pool) === 0) candidates.push(id); }
		} else {
			candidates = Object.keys(lib.character);
		}
		candidates = candidates.filter(function (id) { return id !== self.name && lib.character[id]; });
		const curId = self.storage.gf_dengchang_id;
		if (curId) candidates = candidates.filter(function (id) { return id !== curId; });
		const dead = Array.isArray(self.storage.gf_dengchang_dead) ? self.storage.gf_dengchang_dead : [];
		if (dead.length) candidates = candidates.filter(function (id) { return dead.indexOf(id) < 0; });
		return candidates;
	};
	lib.skill.gf_dengchang_dying = {
		trigger: {
			player: "dying"
		},
		gfDengchang: true,
		silentForce: true,
		async content(event, trigger, player) {
			const lives = player.storage.gf_dengchang_lives;
			if (typeof lives !== "number" || lives <= 0) return;
			if (!player.storage.gf_dengchang_id) return;
			const opts = player.gf_dengchang_savedOpts;
			if (!opts) return;
			const avail = player.gf_dengchang_getCandidates(opts);
			if (!avail.length) return;
			player.storage.gf_dengchang_lives = lives - 1;
			const oldId = player.storage.gf_dengchang_id;
			player.storage.gf_dengchang_dead = player.storage.gf_dengchang_dead || [];
			if (player.storage.gf_dengchang_dead.indexOf(oldId) < 0) player.storage.gf_dengchang_dead.push(oldId);
			game.log(player, "【" + get.translation(oldId) + "】阵亡，剩余可濒死发动" + (lives - 1) + "次");
			await player.gf_dengchang(opts);
		}
	};
	lib.element.player.gf_dengchang_chooseOL = async function (cfg) {
		const self = this;
		const buildRichDialog = function (c) {
			const me = game.me;
			const dlg = ui.create.dialog(c.prompt, [c.candidates, "character"], "hidden");
			if (c.curId && lib.character[c.curId]) {
				dlg.add("当前登场");
				dlg.add([[c.curId], "character"], true);
			}
			if (c.dead && c.dead.length) {
				dlg.add("阵亡");
				dlg.add([c.dead, "character"], true);
			}
			if (me.gf_dengchang_renderHp) me.gf_dengchang_renderHp(dlg, c.curId, c.defaultHp);
			const next = me.chooseButton(dlg, true).set("filterButton", function (button) {
				return button.link !== c.curId;
			});
			next.complexSelect = true;
			return next;
		};
		if (self.isOnline()) {
			let res;
			await new Promise((resolve) => {
				self.wait((r) => { res = r; resolve(); });
				self.send(function (c) {
					const me = game.me;
					const dlg = ui.create.dialog(c.prompt, [c.candidates, "character"], "hidden");
					if (c.curId && lib.character[c.curId]) {
						dlg.add("当前登场");
						dlg.add([[c.curId], "character"], true);
					}
					if (c.dead && c.dead.length) {
						dlg.add("阵亡");
						dlg.add([c.dead, "character"], true);
					}
					if (me.gf_dengchang_renderHp) me.gf_dengchang_renderHp(dlg, c.curId, c.defaultHp);
					const next = me.chooseButton(dlg, true).set("filterButton", function (button) {
						return button.link !== c.curId;
					});
					next.complexSelect = true;
					next.callback = function () {};
					game.resume();
				}, cfg);
			});
			const links = res && res.links;
			return links && links[0] ? links[0] : cfg.candidates[0];
		}
		const next = buildRichDialog(cfg);
		const r = await next.forResult().catch(() => ({}));
		const links = r && r.links;
		return links && links[0] ? links[0] : cfg.candidates[0];
	};
	lib.element.player.gf_dengchang = async function (opts) {
		opts = opts || {};
		const self = this;
		const curHp = self.hp;
		if (opts.lives != null) {
			if (self.storage.gf_dengchang_lives == null) {
				self.storage.gf_dengchang_lives = opts.lives;
				self.storage.gf_dengchang_lives_max = opts.lives;
			}
			self.gf_dengchang_savedOpts = opts;
			if (!self.hasSkill("gf_dengchang_dying")) {
				try { self.addTempSkill("gf_dengchang_dying", {}); } catch (e) {}
			}
		}
		let candidates = self.gf_dengchang_getCandidates(opts);
		if (!candidates.length) return false;
		let prompt = opts.prompt || "选择一名角色登场";
		if (typeof self.storage.gf_dengchang_lives === "number") {
			prompt += "（剩余可濒死发动" + self.storage.gf_dengchang_lives + "次）";
		}
		const curId = self.storage.gf_dengchang_id;
		let res;
		try {
			let resRaw;
		if (_status.connectMode) {
			const dead = Array.isArray(self.storage.gf_dengchang_dead) ? self.storage.gf_dengchang_dead : [];
			resRaw = await self.gf_dengchang_chooseOL({
				prompt: prompt,
				candidates: candidates,
				curId: curId,
				dead: dead,
				defaultHp: opts.hp,
			});
		} else {
				const dlg = ui.create.dialog(prompt, [candidates, "character"], "hidden");
				if (curId && lib.character[curId]) {
					dlg.add("当前登场");
					dlg.add([[curId], "character"], true);
				}
				const dead = Array.isArray(self.storage.gf_dengchang_dead) ? self.storage.gf_dengchang_dead : [];
				if (dead.length) {
					dlg.add("阵亡");
					dlg.add([dead, "character"], true);
				}
				self.gf_dengchang_renderHp(dlg, curId, opts.hp);
				const r = await self.chooseButton(dlg, true).set("filterButton", function (button) {
					return button.link !== curId;
				}).forResult();
				resRaw = r && r.links && r.links[0];
			}
			res = { links: resRaw ? [resRaw] : [] };
		} catch (e) { return false; }
		let raw = res && res.links && res.links[0];
		let chosen = raw;
		if (Array.isArray(raw)) chosen = raw[2] || raw[0];
		if (typeof chosen !== "string" || !lib.character[chosen]) chosen = candidates[0];
		const d = lib.character[chosen];
		const arr = Array.isArray(d);
		const skills = arr ? (d[3] || []) : (d.skills || []);
		const sex = arr ? d[0] : d.sex;
		const group = arr ? d[1] : d.group;
		const hpInfo = arr ? d[2] : (d.hp + "/" + d.maxHp + "/0");
		const parts = String(hpInfo || "4/4/0").split("/");
		let baseHp = parseInt(parts[0]) || 4;
		let baseMax = parseInt(parts[1]) || 4;
		let baseHujia = parseInt(parts[2]) || 0;
		const hasDefaultHp = typeof opts.hp === "string" && opts.hp.indexOf("/") > 0;
		if (hasDefaultHp) {
			const pp = String(opts.hp).split("/");
			baseHp = parseInt(pp[0]) || baseHp;
			baseMax = parseInt(pp[1]) || baseMax;
			baseHujia = parseInt(pp[2]) || 0;
		}
		try { self.gf_dengchang_showCharacterAfterBefore(chosen); } catch (e) {}
		try { const info = get.info("Mimi_touzhi"); if (info && info._clearTouzhiCards) info._clearTouzhiCards(self); } catch (e) {}
		self.gf_dengchang_recordHp();
		self.gf_dengchang_clearTemp();
		const cfg = {
			name: chosen,
			hp: baseHp,
			maxHp: baseMax,
			hujia: baseHujia,
			group: group,
			sex: sex || "male",
			gfDengchang: true,
		};
		if (opts.changeHp === false) cfg.changeHp = false;
		if (typeof opts.prefix === "string") cfg.prefix = opts.prefix;
		else cfg.noMaskPrefix = true;
		const ok = self.gfMianJu(cfg);
		if (!ok) return false;
		self.storage.gf_dengchang_temp = (skills || []).filter(s => !!get.info(s));
		for (const s of self.storage.gf_dengchang_temp) {
			try { self.addTempSkill(s, {}); } catch (e) {}
		}
		self.storage.gf_dengchang_id = chosen;
		if (opts.changeHp !== false) {
			delete self.storage.gf_dengchang_noHp;
			const saved = self.storage.Mimi_dq_hpState && self.storage.Mimi_dq_hpState[chosen];
			if (saved) {
				self.maxHp = saved.maxHp;
				self.hp = Math.min(saved.hp, saved.maxHp);
				self.hujia = saved.hujia || 0;
				self.update();
			} else if (hasDefaultHp) {
				self.update();
			} else if (opts.keepHp !== false) {
				self.hp = curHp;
				self.update();
			}
		} else {
			self.storage.gf_dengchang_noHp = true;
		}
		self.storage.Mimi_dq_triggered = self.storage.Mimi_dq_triggered || {};
		if (!self.storage.Mimi_dq_triggered[chosen]) {
			self.storage.Mimi_dq_triggered[chosen] = true;
			const gfDcSkills = self.storage.gf_dengchang_temp.slice();
			for (const s of gfDcSkills) {
				const info = lib.skill[s];
				if (info && info.subSkill) {
					for (const key in info.subSkill) gfDcSkills.push(s + "_" + key);
				}
			}
			for (const sk of gfDcSkills) {
				if (self.gf_isGameStartSkill(sk)) {
					try { await self.gf_runGameStart(sk); } catch (e) {}
				}
			}
		}
		const gfDcApply = {
			id: chosen,
			temp: self.storage.gf_dengchang_temp,
			hp: self.hp,
			maxHp: self.maxHp,
			hujia: self.hujia,
			changeHp: opts.changeHp !== false,
			group: group,
			sex: sex || "male",
			rawName: self.rawName,
			lives: self.storage.gf_dengchang_lives,
			hpState: self.storage.Mimi_dq_hpState || {},
		};
		game.broadcastAll(function (player, d) {
			player.group = d.group;
			player.sex = d.sex;
			if (d.rawName !== undefined) player.rawName = d.rawName;
			player.storage.gf_dengchang_id = d.id;
			player.storage.gf_dengchang_temp = d.temp;
			player.storage.Mimi_dq_hpState = d.hpState || {};
			if (d.lives != null) player.storage.gf_dengchang_lives = d.lives;
			for (const s of d.temp) {
				try { if (!player.hasSkill(s)) player.addTempSkill(s, {}); } catch (e) {}
			}
			try { const info = get.info("Mimi_touzhi"); if (info && info._clearTouzhiCards) info._clearTouzhiCards(player); } catch (e) {}
			if (d.changeHp) {
				player.hp = d.hp;
				player.maxHp = d.maxHp;
				player.hujia = d.hujia;
				player.update();
			}
			player.storage.Mimi_dq_triggered = player.storage.Mimi_dq_triggered || {};
			player.storage.Mimi_dq_triggered[d.id] = true;
		}, this, gfDcApply);
		try { self.gf_dengchang_showCharacterAfter(); } catch (e) {}
		return chosen;
	};
	// 登场触发showCharacter时机
	lib.element.player.gf_dengchang_showCharacterAfterBefore = function (chosen) {
		lib.hookmap.showCharacterBefore = true;
		var next = game.createEvent("showCharacterBefore", false);
		next.player = this;
		next.num = 2;
		next.gfDengchangNext = chosen;
		next.toShow = [this.name1, this.name2].filter(Boolean);
		next.setContent(async function (event, trigger, player) {
			await event.trigger("showCharacterBefore");
		});
		var evt = _status.event;
		if (evt && evt.after) {
			evt.after.push(next);
		} else {
			next.forResult();
		}
		return next;
	};
	lib.element.player.gf_dengchang_showCharacterAfter = function () {
		var next = game.createEvent("showCharacter", false);
		next.player = this;
		next.num = 2;
		next.toShow = [this.name1, this.name2].filter(Boolean);
		next._args = [2, false];
		next.setContent("showCharacter");
		var evt = _status.event;
		if (evt && evt.after) {
			evt.after.push(next);
		} else {
			next.forResult();
		}
		return next;
	};

	// 领域技
	lib.element.player.gf_lingyu = function (skillName, shield) {
		const ownerId = this.playerid;
		if (shield == null) shield = 2;
		const mainInfo = lib.skill[skillName];
		if (!lib.gf_lingyuShield) lib.gf_lingyuShield = {};
		if (shield > 0 && mainInfo) {
			mainInfo.subSkill = mainInfo.subSkill || {};
			if (!mainInfo.subSkill.shield) {
				mainInfo.subSkill.shield = {
					trigger: { player: "damageBegin1" },
					silentForce: true,
					filter(event, player) {
						return event.player == player && (lib.gf_lingyuShield[skillName] || 0) > 0 && (event.num == null || event.num > 0);
					},
					async content(event, trigger, player) {
						const dmg = trigger.num;
						player.gf_immuneDamage(trigger);
						const src = trigger.source;
						const nats = (trigger.nature || "").split(lib.natureSeparator);
						player.$damage(src);
						player.$damagepop(-dmg, nats[0] || "soil");
						game.broadcastAll(function (dmg2) {
							if (lib.config.background_audio) game.playAudio("effect/damage" + (dmg2 > 1 ? "2" : "") + ".mp3");
						}, dmg);
						lib.gf_lingyuShield[skillName] = (lib.gf_lingyuShield[skillName] || 1) - 1;
						const remain = lib.gf_lingyuShield[skillName];
						player.update();
						if (remain <= 0) {
							game.log(player, "领域已关闭");
							player.update();
							delete lib.gf_lingyuShield[skillName];
							player.gf_unLingyu(skillName, true);
							player.resetGFAll();
						}
					},
				};
				if (!mainInfo.group) mainInfo.group = [];
				const subName = skillName + "_shield";
				if (!mainInfo.group.includes(subName)) mainInfo.group.push(subName);
			}
		}
		if (!lib.gf_lingyuOwner) lib.gf_lingyuOwner = {};
		lib.gf_lingyuOwner[skillName] = ownerId;
		if (!lib.gf_lingyuOf) lib.gf_lingyuOf = {};
		lib.gf_lingyuShield[skillName] = shield > 0 ? shield : 0;
		game.broadcastAll(function (skillName, ownerId, shield) {
			if (!lib.gf_lingyuOwner) lib.gf_lingyuOwner = {};
			lib.gf_lingyuOwner[skillName] = ownerId;
			if (!lib.gf_lingyuOf) lib.gf_lingyuOf = {};
			if (!lib.gf_lingyuShield) lib.gf_lingyuShield = {};
			if (shield > 0) lib.gf_lingyuShield[skillName] = shield;
			const info = lib.skill[skillName];
			if (info) {
				info.gfLingyu = true;
				if (!lib.skill.global.includes(skillName)) game.addGlobalSkill(skillName);
				if (!info._gfOwnerBound && typeof info.filter === "function") {
					const orig = info.filter;
					info._gfOrigFilter = orig;
					info.filter = function (event, player, ...args) {
						if (lib.gf_lingyuOwner[skillName] !== player.playerid) return false;
						return orig.call(this, event, player, ...args);
					};
				}
				info._gfOwnerBound = true;
				lib.gf_lingyuOf[skillName] = skillName;
				if (info.subSkill) {
					for (const k in info.subSkill) {
						const sub = info.subSkill[k];
						const subName = sub.skill || skillName + "_" + k;
						if (!lib.skill[subName]) lib.skill[subName] = sub;
						if (!lib.skill.global.includes(subName)) game.addGlobalSkill(subName);
						const si = lib.skill[subName];
						if (si && !si._gfOwnerBound && typeof si.filter === "function") {
							const sorig = si.filter;
							si._gfOrigFilter = sorig;
							si.filter = function (event, player, ...args) {
								if (lib.gf_lingyuOwner[skillName] !== player.playerid) return false;
								return sorig.call(this, event, player, ...args);
							};
						}
						if (si) si._gfOwnerBound = true;
						lib.gf_lingyuOf[subName] = skillName;
					}
				}
			}
			if (!lib.gf_lingyuFilterWrapped) {
				const _filterEnable = lib.filter.filterEnable;
				lib.filter.filterEnable = function (event, player, skill) {
					const key = lib.gf_lingyuOf[skill] || skill;
					if (lib.gf_lingyuOwner[key] && lib.gf_lingyuOwner[key] !== player.playerid) return false;
					return _filterEnable.call(this, event, player, skill);
				};
				lib.gf_lingyuFilterWrapped = true;
			}
			if (!lib.gf_removeGlobalSkillWrapped) {
				const _removeGlobalSkill = game.removeGlobalSkill;
				game.removeGlobalSkill = function (skill) {
					const def = typeof skill === "string" ? lib.skill[skill] : skill;
					if (def && def.gfLingyu) return;
					return _removeGlobalSkill.apply(this, arguments);
				};
				lib.gf_removeGlobalSkillWrapped = true;
			}
		}, skillName, ownerId, shield > 0 ? shield : 0);
		if (mainInfo) this.$fullscreenpop(get.translation(skillName), "thunder");
	};
	lib.element.player.gf_isLingyuOwner = function (skillName) {
		return !!(lib.gf_lingyuOwner && lib.gf_lingyuOwner[skillName] === this.playerid);
	};
	lib.element.player.gf_unLingyu = function (skillName, revertMask) {
		if (revertMask !== true) revertMask = false;
		if (!lib.gf_lingyuOwner || lib.gf_lingyuOwner[skillName] !== this.playerid) return;
		game.broadcastAll(function (name) {
			const info = lib.skill[name];
			const names = [name];
			if (info && info.subSkill) {
				for (const k in info.subSkill) names.push(info.subSkill[k].skill || name + "_" + k);
			}
			for (const n of names) {
				const i = lib.skill[n];
				if (!i) continue;
				if (typeof i._gfOrigFilter === "function") {
					i.filter = i._gfOrigFilter;
					delete i._gfOrigFilter;
				}
				delete i._gfOwnerBound;
				if (lib.gf_lingyuOf) delete lib.gf_lingyuOf[n];
				const idx = lib.skill.global.indexOf(n);
				if (idx >= 0) lib.skill.global.splice(idx, 1);
			}
			if (lib.gf_lingyuOwner) delete lib.gf_lingyuOwner[name];
			if (lib.gf_lingyuShield) delete lib.gf_lingyuShield[name];
		}, skillName);
		if (revertMask && this.storage.gf_mianju && this.storage.gf_mianju.originalName) {
			this.gf_revertMianJu();
		}
	};

	// 绝对免疫伤害且不触发任何技能
	lib.element.player.gf_immuneDamage = function (trigger) {
		trigger.unreal = true;
		trigger.animate = false;
		trigger._triggered = null;
		if (!trigger._gf_immuneGoto) {
			trigger._gf_immuneGoto = true;
			trigger.goto(6);
		}
	};
	lib.element.player.gf_absImmune = function (on) {
		if (on === undefined) on = true;
		this.storage.gf_absImmune = !!on;
		this.update();
		if (on && !lib.skill.gf_absImmune) {
			lib.skill.gf_absImmune = {
				trigger: { player: ["damageBegin1"] },
				silentForce: true,
				firstDo: true,
				priority: 998,
				filter(event, player) {
					return player.storage.gf_absImmune && (event.num == null || event.num > 0);
				},
				async content(event, trigger, player) {
					player.gf_immuneDamage(trigger);
				},
			};
			if (!lib.skill.global.includes("gf_absImmune")) game.addGlobalSkill("gf_absImmune");
		}
	};
	lib.element.player.gf_unAbsImmune = function () {
		delete this.storage.gf_absImmune;
		this.update();
	};
	lib.element.player.outSkill = function () {
		if (!this.classList.contains("outSkill")) {
          	this.classList.add("outSkill");
      	}
	}
	// 立即打断
	function gf_interruptThinkCore(target) {
		if (!target || !target.playerid) return;
		if (lib.node && lib.node.torespond && target.playerid in lib.node.torespond) {
			clearTimeout(lib.node.torespondtimeout[target.playerid]);
			target.unwait("ai");
		}
		target.hideTimer();
	}
	lib.element.player.gf_interruptThink = function (target) {
		target = target || this;
		gf_interruptThinkCore(target);
		if (_status.connectMode && game.online) {
			game.send("gf_interrupt_think", target.playerid);
		}
	};
	lib.gf_interruptThink = lib.element.player.gf_interruptThink;
	lib.message.client.gf_interrupt_think = function (playerid) {
		var p = get.player(playerid);
		if (p) p.gf_interruptThink(p);
	};
	lib.element.player.chooseToDiscard = function () {
		var next = game.createEvent("chooseToDiscard");
		next.player = this;
		const args = [...arguments];
		if (args.length == 1 && args[0] != null && typeof args[0] == "object" && get.itemtype(args[0]) == null) {
			Object.assign(next, args[0]);
			if (args[0].dialog) {
				next.prompt = false;
			} else if (args[0].prompt) {
				delete next.prompt;
				get.evtprompt(next, args[0].prompt);
			}
		} else {
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] == "number") {
				next.selectCard = [Math.ceil(arguments[i]), Math.ceil(arguments[i])];
			} else if (get.itemtype(arguments[i]) == "select") {
				next.selectCard = arguments[i];
			} else if (get.itemtype(arguments[i]) == "dialog") {
				next.dialog = arguments[i];
				next.prompt = false;
			} else if (typeof arguments[i] == "boolean") {
				next.forced = arguments[i];
			} else if (get.itemtype(arguments[i]) == "position") {
				next.position = arguments[i];
			} else if (typeof arguments[i] == "function") {
				if (next.filterCard) {
					next.ai = arguments[i];
				} else {
					next.filterCard = arguments[i];
				}
			} else if (typeof arguments[i] == "object" && arguments[i]) {
				next.filterCard = get.filter(arguments[i]);
			} else if (typeof arguments[i] == "string") {
				if (arguments[i] == "chooseonly") {
					next.chooseonly = true;
				} else {
					get.evtprompt(next, arguments[i]);
				}
			}
			if (arguments[i] === null) {
				for (var i = 0; i < arguments.length; i++) {
					console.log(arguments[i]);
				}
			}
		}
		}
		if (next.isMine() == false && next.dialog) {
			next.dialog.style.display = "none";
		}
		if (next.filterCard == undefined) {
			next.filterCard = lib.filter.cardDiscardable;
		}
		if (next.selectCard == undefined) {
			next.selectCard = [1, 1];
		}
		if (next.ai == undefined) {
			next.ai = get.unuseful;
		}
		next.autochoose = function () {
			if (!this.forced) {
				return false;
			}
			if (typeof this.selectCard == "function") {
				return false;
			}
			if (this.complexCard || this.complexSelect || this.filterOk) {
				return false;
			}
			var cards = this.player.getCards(this.position);
			if (cards.some(card => !this.filterCard(card, this.player, this))) {
				return false;
			}
			var num = cards.length;
			for (var i = 0; i < cards.length; i++) {
				if (!lib.filter.cardDiscardable(cards[i], this.player, this)) {
					num--;
				}
			}
			return get.select(this.selectCard)[0] >= num;
		};
		next.setContent("chooseToDiscard");
		next._args = Array.from(arguments);
		return next;
	};
	lib.element.player.drawTo = function (num, args) {
		var num2 = Math.floor(num - this.countCards("h"));
		var next = this.draw(num2);
		if (Array.isArray(args)) {
			for (var i = 0; i < args.length; i++) {
				if (get.itemtype(args[i]) == "player") {
					next.source = args[i];
				} else if (typeof args[i] == "boolean") {
					next.animate = args[i];
				} else if (args[i] == "nodelay") {
					next.animate = false;
					next.$draw = true;
				} else if (args[i] == "visible") {
					next.visible = true;
				} else if (args[i] == "bottom") {
					next.bottom = true;
				} else if (typeof args[i] == "object" && args[i] && args[i].drawDeck != undefined) {
					next.drawDeck = args[i].drawDeck;
				}
			}
		}
		return next;
	};
	lib.element.player.draw = function () {
		var next = game.createEvent("draw");
		next.player = this;
		const event = _status.event;
		var args = arguments;
		if (args.length === 1 && typeof args[0] === "object" && !Array.isArray(args[0]) && args[0] != null && get.itemtype(args[0]) == null) {
			Object.assign(next, args[0]);
			if (args[0].nodelay) {
				delete next.nodelay;
				next.animate = false;
				next.$draw = true;
			}
		} else {
			for (var i = 0; i < args.length; i++) {
				if (get.itemtype(args[i]) == "player") {
					next.source = args[i];
				} else if (typeof args[i] == "number") {
					next.num = Math.floor(args[i]);
				} else if (typeof args[i] == "boolean") {
					next.animate = args[i];
				} else if (args[i] == "nodelay") {
					next.animate = false;
					next.$draw = true;
				} else if (args[i] == "visible") {
					next.visible = true;
				} else if (args[i] == "bottom") {
					next.bottom = true;
				} else if (typeof args[i] == "object" && args[i] && args[i].drawDeck != undefined) {
					next.drawDeck = args[i].drawDeck;
				}
			}
		}
		if (typeof next.num != "number") {
			next.num = 1;
		}
		if (next.num <= 0) {
			_status.event.next.remove(next);
			next.resolve();
		}
		if (get.itemtype(next.source) != "player") {
			const source = event.player;
			if (source) {
				next.source = source;
			}
		}
		next.setContent("draw");
		if (lib.config.mode == "stone" && _status.mode == "deck" && next.drawDeck == undefined && !next.player.isMin() && next.num > 1) {
			next.drawDeck = 1;
		}
		next.result = [];
		if (next.gaintag == null) next.gaintag = [];
		return next;
	};
	window.gfDouDong = function (zhen = 15, chixu = 800) {
		let root = document.getElementById('game') || document.querySelector('.game') || document.body;
		if (root == document.body) {
			root = document.querySelector('.game-content') || document.querySelector('.content') || root;
		}
		zhen = Math.min(Math.max(zhen, 3), 500); // 频率3~500ms
		chixu = Math.min(Math.max(chixu, 100), 10000); // 持续100~10000ms
		const border = root.style.border;
		root.style.border = "2px solid red !important";
		console.log(`抖动：每${zhen}ms一帧，持续${chixu}ms`);
		const intensity = 2;
		const steps = [
			{ ml: 0, mt: 0 }, { ml: -4 * intensity, mt: -2 * intensity },
			{ ml: 4 * intensity, mt: 2 * intensity }, { ml: -3 * intensity, mt: 1 * intensity },
			{ ml: 3 * intensity, mt: -1 * intensity }, { ml: -2 * intensity, mt: -1 * intensity },
			{ ml: 2 * intensity, mt: 1 * intensity }, { ml: -3 * intensity, mt: -2 * intensity },
			{ ml: 3 * intensity, mt: 2 * intensity }, { ml: -2 * intensity, mt: 1 * intensity },
			{ ml: 2 * intensity, mt: -1 * intensity }, { ml: 0, mt: 0 }
		];
		const a = Math.floor(chixu / zhen);
		let b = 0;
		const zuo = root.style.marginLeft;
		const shang = root.style.marginTop;
		root.style.position = 'relative !important';
		root.style.transition = 'margin 0ms linear !important';
		const shakeInterval = setInterval(() => {
			if (b >= a) {
				clearInterval(shakeInterval);
				root.style.marginLeft = zuo;
				root.style.marginTop = shang;
				root.style.border = border;
				root.style.transition = '';
				root.style.position = '';
				return;
			}
			const stepIndex = b % steps.length;
			root.style.marginLeft = steps[stepIndex].ml + 'px';
			root.style.marginTop = steps[stepIndex].mt + 'px';
			b++;
		}, zhen);
	};
	
	lib.element.player.gfDuoKui = function (player, target) {
		"step 0";
		game.log(player, "对", target, "发起了猜拳");
		if (_status.connectMode) {
			player
				.chooseButtonOL(
					[
						[
							player,
							[
								"猜拳：请选择一种手势",
								[
									[
										["", "", "pss_stone"],
										["", "", "pss_scissor"],
										["", "", "pss_paper"],
									],
									"vcard",
								],
							],
							true,
						],
						[
							target,
							[
								"猜拳：请选择一种手势",
								[
									[
										["", "", "pss_stone"],
										["", "", "pss_scissor"],
										["", "", "pss_paper"],
									],
									"vcard",
								],
							],
							true,
						],
					],
					function () {},
					function () {
						return 1 + Math.random();
					}
				)
				.set("switchToAuto", function () {
					_status.event.result = "ai";
				})
				.set("processAI", function () {
					var buttons = _status.event.dialog.buttons;
					return {
						bool: true,
						links: [buttons.randomGet().link],
					};
				});
		}
		"step 1";
		if (_status.connectMode) {
			event.mes = result[player.playerid].links[0][2];
			event.tes = result[target.playerid].links[0][2];
			event.goto(4);
		} else {
			player.chooseButton(
				[
					"猜拳：请选择一种手势",
					[
						[
							["", "", "pss_stone"],
							["", "", "pss_scissor"],
							["", "", "pss_paper"],
						],
						"vcard",
					],
				],
				true
			).ai = function () {
				return 1 + Math.random();
			};
		}
		"step 2";
		event.mes = result.links[0][2];
		target.chooseButton(
			[
				"猜拳：请选择一种手势",
				[
					[
						["", "", "pss_stone"],
						["", "", "pss_scissor"],
						["", "", "pss_paper"],
					],
					"vcard",
				],
			],
			true
		).ai = function () {
			return 1 + Math.random();
		};
		"step 3";
		event.tes = result.links[0][2];
		"step 4";
		game.broadcast(function () {
			ui.arena.classList.add("thrownhighlight");
		});
		ui.arena.classList.add("thrownhighlight");
		game.addVideo("thrownhighlight1");
		player.$compare(game.createCard(event.mes, "", ""), target, game.createCard(event.tes, "", ""));
		game.log(player, "选择的手势为", "#g" + get.translation(event.mes));
		game.log(target, "选择的手势为", "#g" + get.translation(event.tes));
		game.delay(0, 1500);
		"step 5";
		var mes = event.mes.slice(4);
		var tes = event.tes.slice(4);
		var str;
		if (mes == tes) {
			str = "二人平局";
			player.popup("平", "metal");
			target.popup("平", "metal");
			game.log("猜拳的结果为", "#g平局");
			event.result = { tie: true };
		} else {
			if ({ paper: "stone", scissor: "paper", stone: "scissor" }[mes] == tes) {
				str = get.translation(player) + "胜利";
				player.popup("胜", "wood");
				target.popup("负", "fire");
				game.log(player, "#g胜");
				event.result = { bool: true };
			} else {
				str = get.translation(target) + "胜利";
				target.popup("胜", "wood");
				player.popup("负", "fire");
				game.log(target, "#g胜");
				event.result = { bool: false };
			}
		}
		game.broadcastAll(function (str) {
			var dialog = ui.create.dialog(str);
			dialog.classList.add("center");
			setTimeout(function () {
				dialog.close();
			}, 1000);
		}, str);
		game.delay(2);
		"step 6";
		game.broadcastAll(function () {
			ui.arena.classList.remove("thrownhighlight");
		});
		game.addVideo("thrownhighlight2");
		if (event.clear !== false) {
			game.broadcastAll(ui.clear);
		}
	},

	window.gefu_text = function (text, isTemp = false) {
		if (!document.getElementById('gefu_tip_style')) {
			var style = document.createElement('style');
			style.id = 'gefu_tip_style';
			style.textContent = `
      .gefu_tip {
        position: fixed;
        pointer-events: none;
        z-index: 75;
      }
      .gefu_beijing {
        position: relative;
        width: 360px;
        height: 187px;
        background: url("extension/鸽府包/image/hp/gefu_text_bg.png");
        background-size: 100% 100%;
        pointer-events: auto;
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
      }
      .gefu_beijing:active {
        cursor: grabbing;
      }
      .gefu_beijing::before, .gefu_beijing::after {
        content: '';
        position: absolute;
        top: 18px;
        right: 30px;
        width: 12px;
        height: 2px;
        background: #c0392b;
        border-radius: 1px;
        pointer-events: none;
      }
      .gefu_beijing::before {
        transform: rotate(45deg);
      }
      .gefu_beijing::after {
        transform: rotate(-45deg);
      }
      .gefu_neirong {
        position: absolute;
        top: 13%;
        left: 9%;
        right: 9%;
        bottom: 10%;
        overflow-y: auto;
        overflow-x: hidden;
        word-wrap: break-word;
        font-family: "Microsoft YaHei", "微软雅黑", "PingFang SC", "Heiti SC", sans-serif;
        color: #2b1907;
        font-size: 15px;
        font-weight: 600;
        line-height: 1.6;
        letter-spacing: 0.3px;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-shadow: 0 1px 0 rgba(255, 245, 220, 0.55);
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .gefu_neirong::-webkit-scrollbar {
        display: none;
      }
    `;
			document.head.appendChild(style);
		}
		var tipname = text;
		if (!window.gefu_active_tips) window.gefu_active_tips = [];
		var dibeijing = ui.create.div('.gefu_tip', document.body);
		var skilltip = ui.create.div('.gefu_beijing', dibeijing);
		var neirong = ui.create.div('.gefu_neirong', skilltip);
		neirong.innerHTML = tipname;
		var entry = null;
		function closeTip() {
			dibeijing.remove();
			if (entry) {
				var idx = window.gefu_active_tips.indexOf(entry);
				if (idx >= 0) window.gefu_active_tips.splice(idx, 1);
				entry = null;
			}
			if (tipTimer) {
				clearTimeout(tipTimer);
				tipTimer = null;
			}
		}
		var evt = window.event;
		var w = skilltip.offsetWidth || 360;
		var h = skilltip.offsetHeight || 187;
		var x = 10, y = 100;
		if (evt && evt.clientX !== undefined) {
			var zoom = (typeof game !== "undefined" && game.documentZoom) || 1;
			var cx = evt.clientX / zoom;
			var cy = evt.clientY / zoom;
			if (cx < ui.window.offsetWidth / 2) {
				x = cx + 10;
			} else {
				x = cx - w - 10;
			}
			y = cy - h / 2;
			if (typeof y != "number" || isNaN(y) || y <= 5) {
				y = 5;
			} else if (y + h + 10 > ui.window.offsetHeight) {
				y = ui.window.offsetHeight - 10 - h;
			}
		}
		var list = window.gefu_active_tips;
		for (var tries = 0; tries < 400; tries++) {
			var overlap = false;
			for (var i = 0; i < list.length; i++) {
				var t = list[i];
				if (x < t.x + t.w && t.x < x + w && y < t.y + t.h && t.y < y + h) {
					overlap = true;
					break;
				}
			}
			if (!overlap) break;
			x += 20;
			y += 20;
			if (y + h > ui.window.offsetHeight) { y = 5; x += 20; }
			if (x + w > ui.window.offsetWidth) { x = 10; y = 5; }
		}
		entry = { x: x, y: y, w: w, h: h, node: dibeijing };
		list.push(entry);
		dibeijing.style.left = x + 'px';
		dibeijing.style.top = y + 'px';
		var dragging = false;
		var startX = 0, startY = 0, startScroll = 0;
		skilltip.addEventListener('pointerdown', function (e) {
			dragging = true;
			startX = e.clientX;
			startY = e.clientY;
			startScroll = neirong.scrollTop;
			if (skilltip.setPointerCapture) {
				try { skilltip.setPointerCapture(e.pointerId); } catch (err) { }
			}
		});
		skilltip.addEventListener('pointermove', function (e) {
			if (!dragging) return;
			neirong.scrollTop = startScroll - (e.clientY - startY);
		});
		skilltip.addEventListener('pointerup', function (e) {
			if (!dragging) return;
			dragging = false;
			if (Math.abs(e.clientX - startX) < 5 && Math.abs(e.clientY - startY) < 5) {
				closeTip();
			}
		});
		var tipTimer = null;
		if (isTemp) {
			tipTimer = setTimeout(function () {
				closeTip();
			}, 3000);
		}
	};

	window.pindianByCard = async function (myPlayer, targetPlayer, card) {
		if (!myPlayer || !targetPlayer) {
			return { success: false, reason: '角色为空' };
		}
		let myCard = card;
		try {
			let myPoint;
			if (myCard !== undefined) {
				if (myCard == 0 || !myCard) {
					myPoint = myPlayer.hp || 0;
				} else {
					myPoint = get.number(myCard);
				}
			} else {
				// 发起方未传参数card时，尝试选牌
				if (myPlayer.cards?.length === 0) {
					myCard = 0;
					myPoint = myPlayer.hp || 0;
				} else {
					const chooseResult = await myPlayer
						.chooseCard("he", 1)
						.set("prompt2", `请选择一张手牌应对 ${get.translation(myPlayer)} 的拼点`)
						.set("ai", card => get.number(card) > 8)
						.forResult();
					let targetCard = null;
					if (chooseResult?.cards?.length > 0) {
						targetCard = chooseResult.cards[0];
						targetPoint = get.number(targetCard);
					} else {
						targetCard = 0;
						targetPoint = myPlayer.hp || 0;
					}
				}
			}
			let targetCard, targetPoint;
			if (targetPlayer.countCards("he") <= 0) {
				targetCard = 0;
				targetPoint = targetPlayer.hp || 0;
			} else {
				const chooseResult = await targetPlayer
					.chooseCard("he", 1)
					.set("prompt2", `请选择一张手牌应对 ${get.translation(myPlayer)} 的拼点`)
					.set("ai", card => get.number(card) > 8)
					.forResult();
				let targetCard = null;
				if (chooseResult?.cards?.length > 0) {
					targetCard = chooseResult.cards[0];
					targetPoint = get.number(targetCard);
				} else {
					targetCard = 0;
					targetPoint = targetPlayer.hp || 0;
				}
			}
			let resultText = '';
			let resultType = '';
			if (myPoint > targetPoint) {
				resultText = `
                【${get.translation(myPlayer)} 】拼点胜利！<br>
				【${get.translation(targetPlayer)}】 拼点失败...<br>
                你的点数：${myCard == 0 || !myCard ? `（${myPoint}点）` : `【${get.translation(myCard)}】（${myPoint}点）`}<br>
                ${get.translation(targetPlayer)} 的点数：${targetCard == 0 ? `（${targetPoint}点）` : `【${get.translation(targetCard)}】（${targetPoint}点）`}<br><br><br>
				注：3秒后自动消失
            `;
				resultType = 'win';
			} else if (myPoint < targetPoint) {
				resultText = `
				【${get.translation(myPlayer)}】 拼点失败...<br>
                【${get.translation(targetPlayer)}】 拼点胜利！<br>
                你的点数：${myCard == 0 || !myCard ? `（${myPoint}点）` : `【${get.translation(myCard)}】（${myPoint}点）`}<br>
                ${get.translation(targetPlayer)} 的点数：${targetCard == 0 ? `（${targetPoint}点）` : `【${get.translation(targetCard)}】（${targetPoint}点）`}<br><br><br>
				注：3秒后自动消失
            `;
				resultType = 'lose';
			} else {
				resultText = `
                双方拼点平局！<br>
                你的点数：${myCard == 0 || !myCard ? `（${myPoint}点）` : `【${get.translation(myCard)}】（${myPoint}点）`}<br>
                ${get.translation(targetPlayer)} 的点数：${targetCard == 0 ? `（${targetPoint}点）` : `【${get.translation(targetCard)}】（${targetPoint}点）`}<br><br><br>
				注：3秒后自动消失
            `;
				resultType = 'draw';
			}
			gefu_text(resultText, true);
			// 明确标注体力值替代
			const myCardDesc = myCard === 0 || !myCard
				? `体力值（${myPoint}点）`
				: `${get.translation(myCard)}（${myPoint}点）`;
			const targetCardDesc = targetCard === 0 || !targetCard
				? `体力值（${targetPoint}点）`
				: `${get.translation(targetCard)}（${targetPoint}点）`;
			// 补充无手牌说明
			const myNoCardNote = myPlayer.cards?.length === 0 ? '（无手牌）' : '';
			const targetNoCardNote = targetPlayer.cards?.length === 0 ? '（无手牌）' : '';
			game.log(
				myPlayer,
				`与【${get.translation(targetPlayer)}】拼点${myNoCardNote}：打出${myCardDesc}，对方打出${targetCardDesc}${targetNoCardNote}→ ${resultType === 'win' ? '胜利' : resultType === 'lose' ? '失败' : '平局'}`
			);
			return {
				success: true,
				myPlayer: {
					name: get.translation(myPlayer),
					card: myCard,
					point: myPoint,
					noCard: myPlayer.cards?.length === 0 // 标记发起方是否无手牌
				},
				targetPlayer: {
					name: get.translation(targetPlayer),
					card: targetCard,
					point: targetPoint,
					noCard: targetPlayer.cards?.length === 0 // 标记目标方是否无手牌
				},
				result: resultType,
				winner: myPoint > targetPoint ? myPlayer : (myPoint < targetPoint ? targetPlayer : null)
			};

		} catch (err) {
			gefu_text(`拼点失败：${err.message || '选牌过程被中断'}`, true);
			return { success: false, reason: '选牌异常', error: err };
		}
	};

	// 快捷调用函数
	window.startPindian = async function (targetPlayerName, card) {
		const myPlayer = game.currentPlayer || game.players.find(p => p.isSelf);
		if (!myPlayer) {
			gefu_text('拼点失败：未找到当前操作玩家'); // 非拼点结果，不自动消失
			return { success: false, reason: '无当前玩家' };
		}
		const targetPlayer = game.players.find(p => p.name === targetPlayerName || get.translation(p) === targetPlayerName);
		if (!targetPlayer) {
			gefu_text(`拼点失败：未找到角色「${targetPlayerName}」`); // 非拼点结果，不自动消失
			return { success: false, reason: '目标角色不存在' };
		}
		return await window.pindianByCard(myPlayer, targetPlayer, card);
	};

	lib.element.player.forceIn = function() {
		if (this.isOut()) {
			this.in(true);
		}
	}

	// 隐匿
	lib.element.player.gf_hideCharacter = function (num, log, keepHidden) {
		const player = this;
		if (typeof num != "number") num = 0;
		// 已经暗置的不重复处理
		if (num == 0 && player.isUnseen(0)) return player;
		if (num == 1 && (!player.name2 || player.isUnseen(1))) return player;
		if (num == 2 && player.isUnseen(0) && (!player.name2 || player.isUnseen(1))) return player;
		player.storage.gf_keepHidden = keepHidden === true;
		player.storage.gf_jhUnseen = true;
		const getSkills = function (name) {
			const info = name && lib.character[name];
			if (!info) return [];
			return (info.skills || info[3] || []).slice(0);
		};
		let skills = [];
		if (num == 0 || num == 2) skills.addArray(getSkills(player.name1));
		if ((num == 1 || num == 2) && player.name2) skills.addArray(getSkills(player.name2));
		skills = skills.filter(function (s) {
			return player.skills.includes(s);
		});
		const gfNoHideCheck = function (s) {
			const info = lib.skill[s] || get.info(s);
			if (!info) return false;
			return !!(info.gfNoHide);
		};
		skills = skills.filter(function (s) {
			return !gfNoHideCheck(s);
		});
		// 名字性别势力按双将暗主将时顶上副将单将暗置则变未知
		let name = player.name;
		let sex = player.sex;
		let group = player.group;
		if (num == 1) {
		} else if (player.name2 && num == 0) {
			const info2 = lib.character[player.name2];
			name = player.name2;
			if (info2) {
				sex = info2.sex || info2[0] || sex;
				group = info2.group || info2[1] || group;
			}
		} else {
			name = "unknown";
			sex = "unknown";
			group = "unknown";
		}
		const fullHidden = num == 2 || (!player.name2 && num == 0);
		if (fullHidden && typeof player.storage.rawHp != "number") {
			player.storage.rawHp = player.hp;
			player.storage.rawMaxHp = player.maxHp;
		}
		game.addVideo("hideCharacter", player, num);
		if (log !== false) {
			if (num == 1) {
				game.log(player, "暗置了副将", "#b" + get.translation(player.name2));
			} else if (num == 2 && player.name2) {
				game.log(player, "暗置了主将", "#b" + get.translation(player.name1), "、副将", "#b" + get.translation(player.name2));
			} else {
				game.log(player, "暗置了主将", "#b" + get.translation(player.name1));
			}
		}
		// 主机改完不会自动同步客机所以状态和UI全部走broadcastAll一份代码两边跑
		game.broadcastAll(
			function (player, num, name, sex, group, hidehp, skills, keepHidden) {
				if (!player || !player.node) return;
				player.name = name;
				player.sex = sex;
				player.group = group;
				switch (num) {
					case 0:
						if (!_status.video && get.mode() != "guozhan") player.classList.add("unseen_show");
						player.classList.add(_status.video ? "unseen_v" : "unseen");
						break;
					case 1:
						if (!_status.video && get.mode() != "guozhan") player.classList.add("unseen2_show");
						player.classList.add(_status.video ? "unseen2_v" : "unseen2");
						break;
					case 2:
						if (!_status.video && get.mode() != "guozhan") {
							player.classList.add("unseen_show");
							if (player.name2) player.classList.add("unseen2_show");
						}
						player.classList.add(_status.video ? "unseen_v" : "unseen");
						if (player.name2) player.classList.add(_status.video ? "unseen2_v" : "unseen2");
						break;
				}
				if (num != 1 && !player.node.name_seat && !_status.video) {
					player.node.name_seat = ui.create.div(".name.name_seat", get.verticalStr(get.translation(player.name)), player);
					player.node.name_seat.dataset.nature = get.groupnature(player.group);
				}
				if (hidehp) {
					player.hp = 1;
					player.maxHp = 1;
				}
				if (!player.hiddenSkills) player.hiddenSkills = [];
				for (var i = 0; i < skills.length; i++) {
					player.hiddenSkills.add(skills[i]);
					player.skills.remove(skills[i]);
					if (player.marks[skills[i]]) {
						try { player.marks[skills[i]].delete(); } catch (e) {}
						delete player.marks[skills[i]];
					}
				}
				player.storage.gf_keepHidden = keepHidden === true;
				player.storage.gf_jhUnseen = true;
				player.update();
			},
			player,
			num,
			name,
			sex,
			group,
			fullHidden,
			skills,
			keepHidden === true
		);
		for (const s of skills) {
			const info = get.info(s);
			if (info && info.ondisable && info.onremove) info.onremove(player);
		}
		player.checkConflict();
		return player;
	};
	const gf_rawUpdateMark = lib.element.player.updateMark;
	lib.element.player.updateMark = function (i, storage) {
		if (this.hiddenSkills && this.hiddenSkills.includes(i) && !(lib.skill[i] && lib.skill[i].gfNoHide)) {
			if (this.marks[i]) {
				try { this.marks[i].delete(); } catch (e) {}
				delete this.marks[i];
			}
			return this;
		}
		return gf_rawUpdateMark.call(this, i, storage);
	};
	// 掉血或回合开始时强制明置暗将这里给keepHidden开个口子
	if (lib.skill._showHiddenCharacter && !lib.skill._showHiddenCharacter.gf_patched) {
		const rawFilter = lib.skill._showHiddenCharacter.filter;
		lib.skill._showHiddenCharacter.filter = function (event, player, name) {
			if (player.storage && player.storage.gf_keepHidden) return false;
			return rawFilter.apply(this, arguments);
		};
		const rawContent = lib.skill._showHiddenCharacter.content;
		lib.skill._showHiddenCharacter.content = async function (event, trigger, player) {
			const byPhaseBegin =
				event.triggername === "phaseBeginStart" ||
				(trigger && trigger.name === "phase" && trigger.player === player);
			const jhUnseen = !!(player.storage && player.storage.gf_jhUnseen === true);
			if (jhUnseen) player.storage.gf_jhUnseen = false;
			const result = await rawContent.apply(this, arguments);
			if (jhUnseen && byPhaseBegin) await player.changeHujia(1);
			return result;
		};
		lib.skill._showHiddenCharacter.gf_patched = true;
	}

	lib.element.player.gfZhaohuan = function() {
		let config = {
			id: "",
			name: "",
			sex: "male",
			group: "qun",
			hp: 2,
			maxHp: 2,
			hujia: 0,
			initCards: [],
			standImg: "",
			skill: ""
		};
		const parseHpConfig = (hpStr) => {
			const hpConfig = { hp: 2, maxHp: 2, hujia: 0 };
			if (typeof hpStr === 'string' && hpStr.includes('/')) {
				const parts = hpStr.split('/').map(item => parseInt(item) || 0);
				hpConfig.hp = parts[0] || 1;
				hpConfig.maxHp = parts[1] || parts[0] || 1;
				hpConfig.hujia = parts[2] || 0;
			} else {
				const num = parseInt(hpStr) || 1;
				hpConfig.hp = num;
				hpConfig.maxHp = num;
			}
			return hpConfig;
		};
		if (arguments.length === 1 && typeof arguments[0] === 'object') {
			const obj = arguments[0];
			config.id = obj.id;
			config.name = obj.name || lib.translate[obj.id] || obj.id;
			config.sex = obj.sex || config.sex;
			config.group = obj.group || config.group;
			const hpConfig = parseHpConfig(obj.hp);
			config.hp = hpConfig.hp;
			config.maxHp = hpConfig.maxHp;
			config.hujia = obj.hujia || hpConfig.hujia;
			config.initCards = Array.isArray(obj.initCards) ? obj.initCards : get.cards(obj.initCards || 4);
			config.standImg = obj.standImg || `ext:鸽府包/image/character/stand/${config.id}.jpg`;
			config.skill = obj.skill || config.skill;
		} else if (arguments.length >= 1) {
			config.id = arguments[0] || "";
			config.name = arguments[1] || config.id;
			config.sex = arguments[2] || config.sex;
			config.group = arguments[3] || config.group;
			const hpConfig = parseHpConfig(arguments[4]);
			config.hp = hpConfig.hp;
			config.maxHp = hpConfig.maxHp;
			config.hujia = hpConfig.hujia;
			config.initCards = Array.isArray(arguments[5]) ? arguments[5] : get.cards(parseInt(arguments[5]) || 4);
			config.standImg = arguments[6] || `ext:鸽府包/image/character/stand/${config.id}.jpg`;
			config.skill = arguments[7] || config.skill;
		}
		if (!config.id || typeof config.id !== 'string') {
			return null;
		}
		const creator = this;
		let zhaohuanWu = null;
		try {
			game.broadcastAll((player, cfg) => {
				var group1 = player.group;
				game.addCharacter(cfg.id, {
					sex: cfg.sex,
					group: cfg.group,
					hp: cfg.hp,
					maxHp: cfg.maxHp,
					hujia: cfg.hujia,
					skills: [],
					groupInGuozhan: group1,
					isUnseen: true,
					extension: '衍生武将',
					translate: cfg.name
				});
				if (lib.character[cfg.id]) {
					lib.character[cfg.id][4] = [cfg.standImg, 'unseen', group1];
				}
			}, creator, config);
			if (_status.connectMode === true) {
				var randomId = Math.floor(Math.random() * 8000000000);
				game.broadcastAll((player, cfg, rId) => {
					const position = parseInt(player.dataset.position) + 1;
					const allPlayers = game.players.concat(game.dead);
					ui.arena.setNumber(allPlayers.length + 1);
					allPlayers.forEach(value => {
						const valPos = parseInt(value.dataset.position) || 0;
						if (valPos >= position) {
							value.dataset.position = valPos + 1;
						}
					});
					var newChar = ui.create.player(ui.arena).addTempClass("start");
					newChar.playerid = rId;
					lib.playerOL[rId] = newChar;
					newChar.init(cfg.id);
					game.players.push(newChar);
					newChar.dataset.position = position;
					game.arrangePlayers();
					ui.update();
				}, creator, config, randomId);
				zhaohuanWu = game.findPlayer2(current => 
					(current.playerid && current.playerid == randomId) || 
					current.name1 == config.id || 
					current.name2 == config.id
				);
				if (!zhaohuanWu) zhaohuanWu = creator.next;
			} else {
				zhaohuanWu = game.addPlayer(parseInt(creator.dataset.position) + 1, config.id);
			}
			if (!zhaohuanWu.playerid) zhaohuanWu.getId();
			event.gf_Zhaohuan_l = zhaohuanWu;
			if (!_status.gf_Zhaohuan_l_die) _status.gf_Zhaohuan_l_die = [];
			_status.gf_Zhaohuan_l_die.add(zhaohuanWu.playerid);
			if (!_status.zhaohuanWu_die) _status.zhaohuanWu_die = [];
			if (!_status.zhaohuanWu_auto) _status.zhaohuanWu_auto = [];
			_status.zhaohuanWu_die.add(zhaohuanWu.playerid);
			_status.zhaohuanWu_auto.add(creator.playerid, zhaohuanWu.playerid);
			game.log(creator, '制造了', lib.translate[config.id] || config.name);
			game.broadcastAll((gf_Zhaohuan_l, player, cfg) => {
				if (get.mode() == 'guozhan') {
					if (gf_Zhaohuan_l.name2 == undefined) gf_Zhaohuan_l.name2 = gf_Zhaohuan_l.name1;
				}
				if (player.side || (game.me && game.me.side) || get.mode() == 'versus') {
					gf_Zhaohuan_l.side = player.side;
					if (player.node?.identity?.firstChild && gf_Zhaohuan_l.node?.identity) {
						gf_Zhaohuan_l.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
						gf_Zhaohuan_l.node.identity.dataset.color = player.node.identity.dataset.color;
					}
				}
				gf_Zhaohuan_l.skillH = [];
				gf_Zhaohuan_l.storage.zhibi = [];
				gf_Zhaohuan_l.storage.stratagem_expose = [];
				gf_Zhaohuan_l.storage.stratagem_fury = 0;
				if (cfg.maxHp) gf_Zhaohuan_l.maxHp = cfg.maxHp;
				if (cfg.hujia) gf_Zhaohuan_l.hujia = cfg.hujia;
			}, zhaohuanWu, creator, config);
			game.broadcastAll((gf_Zhaohuan_l, player) => {
				const identity = (gf_Zhaohuan_l.identity = (identity => {
					switch (identity) {
						case "zhu": case "mingzhong": return "zhong";
						case "zhu_false": return "zhong_false";
						case "bZhu": return "bZhong";
						case "rZhu": return "rZhong";
						case "nei": return "commoner";
						default: return identity;
					}
				})(player.identity));
				if (get.mode() == 'doudizhu') lib.translate['zhong'] = "忠";
				if (get.mode() == 'single') lib.translate['zhong'] = "先";
				if (!lib.translate[identity]) lib.translate[identity] = "民";
				const goon = player !== game.me && gf_Zhaohuan_l !== game.me && 
							player.node?.identity?.classList.contains("guessing") && !player.identityShown;
				if (goon) {
					if (gf_Zhaohuan_l.identityShown) delete gf_Zhaohuan_l.identityShown;
					if (gf_Zhaohuan_l.node?.identity && !gf_Zhaohuan_l.node.identity.classList.contains("guessing")) {
						gf_Zhaohuan_l.node.identity.classList.add("guessing");
					}
				}
				gf_Zhaohuan_l.setIdentity(goon ? "cai" : undefined);
				if (gf_Zhaohuan_l.node?.dieidentity) {
					gf_Zhaohuan_l.node.dieidentity.innerHTML = get.translation(gf_Zhaohuan_l.identity + 2);
				}
				if (typeof player.ai?.shown === "number" && gf_Zhaohuan_l.ai) {
					gf_Zhaohuan_l.ai.shown = player.ai.shown;
				}
			}, zhaohuanWu, creator);
			game.broadcastAll((gf_Zhaohuan_l, player) => {
				gf_Zhaohuan_l.setSeatNum(player.getSeatNum() + 1);
				const playerx = game.players.concat(game.dead);
				var minx = playerx.length;
				ui.arena.setNumber(minx);
				for (var i of playerx) {
					if (i.getSeatNum() < minx) minx = i.getSeatNum();
				}
				playerx.sortBySeat(game.findPlayer2(current => current.getSeatNum() == minx), true);
				for (var i = 0; i < playerx.length; i++) {
					playerx[i].setSeatNum(i + 1);
				}
				ui.update();
			}, zhaohuanWu, creator);
			game.broadcastAll((gf_Zhaohuan_l, player) => {
				gf_Zhaohuan_l["aqcs_tianjue"] = player;
				if (typeof game.checkResult === "function") {
					const origin_checkResult = game.checkResult;
					game.checkResult = function () {
						const me = game.me._trueMe || game.me;
						if (game.players.filter(i => i !== me).every(i => i["aqcs_tianjue"] === me)) {
							game.log('●游戏结束');
							game.over(true);
						}
						return origin_checkResult.apply(this, arguments);
					};
				}
				if (typeof game.checkOnlineResult === "function") {
					const origin_checkOnlineResult = game.checkOnlineResult;
					game.checkOnlineResult = function (player) {
						if (game.players.filter(i => i !== player).every(i => i["aqcs_tianjue"] === player)) return true;
						return origin_checkOnlineResult.apply(this, arguments);
					};
				}
				if (typeof lib.element.player.getFriends === "function") {
					const origin_getFriends = lib.element.player.getFriends;
					const getFriends = function (func, includeDie) {
						const self = this;
						return [...origin_getFriends.apply(this, arguments),
						...game[includeDie ? "filterPlayer2" : "filterPlayer"](target => 
							(target["aqcs_tianjue"] || target) === (self["aqcs_tianjue"] || self)
						)].filter(i => i !== self || func === true).unique().sortBySeat(self);
					};
					lib.element.player.getFriends = getFriends;
					[...game.players, ...game.dead].forEach(i => (i.getFriends = getFriends));
				}
				if (typeof lib.element.player.isFriendOf === "function") {
					const origin_isFriendOf = lib.element.player.isFriendOf;
					const isFriendOf = function (player) {
						if ((this["aqcs_tianjue"] || this) === (player["aqcs_tianjue"] || player)) return true;
						return origin_isFriendOf.apply(this, arguments);
					};
					lib.element.player.isFriendOf = isFriendOf;
					[...game.players, ...game.dead].forEach(i => (i.isFriendOf = isFriendOf));
				}
				if (typeof lib.element.player.getEnemies === "function") {
					const origin_getEnemies = lib.element.player.getEnemies;
					const getEnemies = function (func, includeDie) {
						if (this["aqcs_tianjue"]) return this["aqcs_tianjue"].getEnemies(func, includeDie);
						else {
							const self = this;
							return [...origin_getEnemies.apply(this, arguments),
							...game[includeDie ? "filterPlayer2" : "filterPlayer"](target => 
								origin_getEnemies.apply(this, arguments).includes(target["aqcs_tianjue"] || target)
							)].filter(i => self != (i["aqcs_tianjue"] || i)).unique().sortBySeat(self);
						}
					};
					lib.element.player.getEnemies = getEnemies;
					[...game.players, ...game.dead].forEach(i => (i.getEnemies = getEnemies));
				}
			}, zhaohuanWu, creator);
			creator.ai.modAttitudeFrom = (from, to, att) => {
				if (creator.isFriendsOf(to)) return get.attitude(from, to);
				return get.attitude(from, to) - 0.1;
			};
			zhaohuanWu.ai.modAttitudeFrom = (from, to, att) => {
				if (to == creator || creator.isFriendsOf(to)) return 114514;
				return get.attitude(creator, to) - 0.1;
			};
			zhaohuanWu.ai.modAttitudeTo = (from, to, att) => {
				if (from == creator || creator.isFriendsOf(from)) return 7;
				return get.attitude(from, to);
			};
			zhaohuanWu.addSkill(config.skill);
			zhaohuanWu.directgain(config.initCards);
			game.addGlobalSkill('gf_Zhaohuan_l_die');

			return zhaohuanWu;
		} catch (e) {
			console.error("召唤武将失败：", e);
			return null;
		}
	};

	lib.skill.gf_Zhaohuan_l_die = {
		trigger: { player: 'dieAfter' },
		fixed: true,
		priority: -2,
		direct: true,
		forced: true,
		charlotte: true,
		superCharlotte: true,
		lastDo: true,
		forceDie: true,
		silent: true,
		popup: false,
		filter: function (event, player) {
			if (_status.zhaohuanWu_die) return _status.zhaohuanWu_die.includes(event.player.playerid);
			return false;
		},
		content: function () {
			var targetd = trigger.player;
			game.broadcastAll(function (p, td) {
				game.dead.remove(td);
				game.removePlayer(td);
				const playerx = game.players.concat(game.dead);
				var minx = playerx.length;
				ui.arena.setNumber(minx);
				for (var i of playerx) {
					if (i.getSeatNum() < minx) minx = i.getSeatNum();
				}
				playerx.sortBySeat(game.findPlayer2(current => current.getSeatNum() == minx), true);
				for (var i = 0; i < playerx.length; i++) {
					playerx[i].setSeatNum(i + 1);
				}
			}, player, targetd);
			game.arrangePlayers();
			if (_status.currentPhase && _status.currentPhase == player) 
				get.event().getParent("phaseLoop").player = player.getPrevious();
		},
	};

	// 感谢御.sky提供的代码支持，致敬，不过我改了很多东西，原文在《一中杀》
	Object.assign(game, {
		gf_swapPlayerOL(player, target, forceTarget) {
			if (!_status.connectMode || player == target || !player || !target) return;
			const [playerid, targetid] = [player.playerid, target.playerid];
			[target.ws, player.ws] = [player.ws, target.ws];
			lib.wsOL[targetid] = player.ws?.ws;
			lib.wsOL[playerid] = target.ws?.ws;
			for (const key in lib.hook) {
				const hasPlayer = key.startsWith(playerid);
				const hasTarget = key.startsWith(targetid);
				if (hasPlayer || hasTarget) {
					const newKey = key.replace(new RegExp(`^${hasPlayer ? playerid : targetid}`), hasPlayer ? targetid : playerid);
					lib.hook[newKey] = lib.hook[key];
					delete lib.hook[key];
				};
			};
			game.broadcastAll(async (player, target, playerid, targetid, forceTarget) => {
				const handleBroadcast = async () => {
					if ([player, target].includes(game.me)) {
						// forceTarget为true时把视角交给存活的那个target避免落到阵亡者身上
						const source = forceTarget ? target : game.me == target ? player : target;
						const sourceid = forceTarget ? targetid : game.me == target ? playerid : targetid;
						game.swapPlayerAuto(source);
						game.onlineID = game.wsid = sourceid;
						if (_status.auto) {
							ui.click.auto('forced');
						}
						if (player.isAuto) player.isAuto = false;
					}
				};
				const swapCoreData = () => {
					[target.nickname, player.nickname] = [player.nickname, target.nickname];
					const [playerNickname, targetNickname] = [player.node.nameol.innerHTML, target.node.nameol.innerHTML];
					player.setNickname(targetNickname);
					target.setNickname(playerNickname);
					[player.playerid, target.playerid] = [targetid, playerid];
					lib.playerOL[targetid] = player;
					lib.playerOL[playerid] = target;
				};
				// 等待异步的handleBroadcast执行完再执行swapCoreData
				await handleBroadcast();
				swapCoreData();
			}, player, target, playerid, targetid, !!forceTarget);
		}
	});

	// 傀儡分组键GF_KLID_，主人存1，傀儡存2
	function GF_KuiLei_keys(player, val) {
		var keys = [];
		if (!player || !player.storage) return keys;
		for (var key in player.storage) {
			if (key.indexOf('GF_KLID_') === 0 && player.storage[key] === val) {
				keys.push(key);
			}
		}
		return keys;
	}
	// 找傀儡的主人
	function GF_KuiLei_getMaster(summon) {
		var keys = GF_KuiLei_keys(summon, 2);
		var all = game.players.concat(game.dead);
		for (var i = 0; i < keys.length; i++) {
			var list = all.filter(p => p.storage && p.storage[keys[i]] === 1);
			if (list.length) return list[0];
		}
		return null;
	}
	// 找主人的所有傀儡
	function GF_KuiLei_getPuppets(master, aliveOnly) {
		var result = [];
		var keys = GF_KuiLei_keys(master, 1);
		for (var i = 0; i < keys.length; i++) {
			result = result.concat(game.filterPlayer(p => p.storage && p.storage[keys[i]] === 2));
		}
		if (aliveOnly) result = result.filter(p => p.isAlive());
		return result;
	}
	// 是否属于某个傀儡组
	function GF_KuiLei_inGroup(player) {
		return GF_KuiLei_keys(player, 1).length + GF_KuiLei_keys(player, 2).length > 0;
	}
	// 角色的组主人，主人返回自己
	function GF_KuiLei_getOwner(player) {
		if (GF_KuiLei_keys(player, 1).length) return player;
		return GF_KuiLei_getMaster(player) || player;
	}
	// 把from客户端的操控权交给target，from阵亡或需要换人操作时调用
	function GF_KuiLei_switchView(from, target) {
		if (!from || !target || from === target) return;
		// 先关掉from客户端残留的死亡界面，否则会卡在死人视角，手牌区不显示
		game.broadcastAll(function (die) {
			if (!die || game.me.playerid != die.playerid) return;
			var evt = _status.event && _status.event.getParent ? _status.event.getParent("chooseToUse") : null;
			if (evt) {
				if (evt.endButton) { evt.endButton.close(); delete evt.endButton; }
				evt.fakeforce = false;
			}
			if (ui.exit) { ui.exit.close(); delete ui.exit; }
			if (ui.continue_game) { ui.continue_game.close(); delete ui.continue_game; }
			if (ui.restart) { ui.restart.close(); delete ui.restart; }
			if (ui.revive) { ui.revive.close(); delete ui.revive; }
			if (ui.swap) { ui.swap.close(); delete ui.swap; }
		}, from);
		if (_status.connectMode) {
			// 联机交换客户端与身份，让from的客户端改控target
			game.gf_swapPlayerOL(from, target, !from.isAlive());
		} else if (from == game.me && target.isAlive()) {
			game.swapPlayerAuto(target);
			if (ui.me) ui.me.show();
			if (ui.auto) ui.auto.show();
			if (ui.wuxie) ui.wuxie.show();
		}
	}

	lib.element.player.GF_KuiLei = async function (id, name, sex, group, hp, initCards, standImg, skillName, skills, targetPosPlayer) {
		const player = this;
		// 全局技能在所有客户端注册
		game.broadcastAll(function () {
			game.addGlobalSkill('GF_KuiLei_auto');
		});
		try {
			// 初始化
			const parseHpConfig = (hpStr) => {
				const hpConfig = { hp: 2, maxHp: 2, hujia: 0 };
				if (typeof hpStr === 'string' && hpStr.includes('/')) {
					const parts = hpStr.split('/').map(item => parseInt(item) || 0);
					hpConfig.hp = parts[0] || 1;
					hpConfig.maxHp = parts[1] || parts[0] || 1;
					hpConfig.hujia = parts[2] || 0;
				} else {
					const num = parseInt(hpStr) || 1;
					hpConfig.hp = num;
					hpConfig.maxHp = num;
				}
				return hpConfig;
			};
			const hpConfig = parseHpConfig(hp);
			// 傀儡与主人同阵营
			game.broadcastAll(function (cfg) {
				const skillName = cfg.skillName;
				if (!_status[skillName]) {
					_status[skillName] = true;
				}
			}, player, { skillName: skillName });
			game.broadcastAll(function (cfg) {
				const skillName = cfg.skillName;
				if (!get["attitude_" + skillName]) {
					get["attitude_" + skillName] = get.attitude;
					get.attitude = function (from, to) {
						var isPuppetTo = false;
						if (from && from.getStorage(skillName + "source", false)) {
							from = from.getStorage(skillName + "source", false);
						}
						if (to && to.getStorage(skillName + "source", false)) {
							to = to.getStorage(skillName + "source", false);
							isPuppetTo = true;
						}
						var att = get["attitude_" + skillName](from, to);
						if (isPuppetTo && from.isFriendOf(to)) {
							att = Math.max(att, 7);
						}
						return att;
					};
				}
			}, player, { skillName: skillName });
			// 注册
			game.broadcastAll((ply, cfg) => {
				var group1 = ply.group;
				game.addCharacter(cfg.id, {
					sex: cfg.sex,
					group: cfg.group,
					hp: cfg.hp,
					maxHp: cfg.maxHp,
					hujia: cfg.hujia,
					skills: [],
					groupInGuozhan: group1,
					isUnseen: true,
					extension: '傀儡',
					translate: cfg.name
				});
				if (lib.character[cfg.id]) {
					lib.character[cfg.id][4] = [cfg.standImg, 'unseen', group1];
				}
			}, player, {
				id: id,
				sex: sex || "male",
				group: group || "qun",
				hp: hpConfig.hp,
				maxHp: hpConfig.maxHp,
				hujia: hpConfig.hujia,
				name: name || id,
				standImg: standImg || `ext:鸽府包/image/character/stand/${id}.jpg`
			});
			// 傀儡放在目标角色的下家
			var anchor = (targetPosPlayer && get.itemtype(targetPosPlayer) == "player") ? targetPosPlayer : player;
			var summon;
			if (_status.connectMode) {
				// 联机走后端同步时序，主人作为source，引擎内部会写入lib.playerOL
				summon = await game.addPlayerOL(anchor, id, null, true, { source: player, animate: false });
			} else {
				// 单机同一入口，引擎内部改走game.playerMap
				summon = await game.addPlayerOL(anchor, id, null, true, { source: player, animate: false });
			}
			if (!summon) {
				summon = game.findPlayer2(p => p.name1 === id || p.name2 === id) || player.next;
			}
			// 基础属性设置
			game.broadcastAll(function(m, p, cfg) {
				if (!m) return;
				const skillName = cfg.skillName;
				m["isNoPlayer_" + skillName] = true;
				if (!m._gf_dieAfter) m._gf_dieAfter = m.dieAfter;
				m.dieAfter = function (source) {
					var owner = GF_KuiLei_getOwner(this);
					var group = [owner].concat(GF_KuiLei_getPuppets(owner, false));
					if (!group.some(function (p) { return p && p.isAlive(); })) {
						if (typeof this._gf_dieAfter === "function") return this._gf_dieAfter.call(this, source);
					}
				};
				m.dieAfter2 = function () {};
				m.identity = get.mode() == 'identity' ? "commoner" : p.identity;
				if (get.mode() == 'doudizhu') lib.translate['zhong'] = "忠";
				// if (!lib.translate[m.identity]) lib.translate[m.identity] = p.identity;
				if (!lib.translate[m.identity]) lib.translate[m.identity] = "民";
				m.hp = cfg.hp;
				m.maxHp = cfg.maxHp;
				m.hujia = cfg.hujia;
				if (get.mode() == 'guozhan') {
					if (m.name2 == undefined) {
						m.name2 = m.name1;
					}
				}
				if (p.side || (game.me && game.me.side) || get.mode() == 'versus') {
					m.side = p.side;
					if (m.node && m.node.identity && p.node && p.node.identity && p.node.identity.firstChild) {
						m.node.identity.firstChild.innerHTML = p.node.identity.firstChild.innerHTML;
						m.node.identity.dataset.color = p.node.identity.dataset.color;
					}
				}
				m.skillH = [];
				if (!m.storage) {
					m.storage = {};
				}
				m.storage.zhibi = [];
				m.storage.stratagem_expose = [];
				m.storage.stratagem_fury = 0;
			}, summon, player, {
				hp: hpConfig.hp,
				maxHp: hpConfig.maxHp,
				hujia: hpConfig.hujia,
				skillName: skillName
			});
			// 身份显示跟随主人
			game.broadcastAll(function (m, p) {
				const goon = p !== game.me && m !== game.me &&
							p.node?.identity?.classList.contains("guessing") && !p.identityShown;
				if (goon) {
					if (m.identityShown) delete m.identityShown;
					if (m.node?.identity && !m.node.identity.classList.contains("guessing")) {
						m.node.identity.classList.add("guessing");
					}
				}
				const gfShow = (identity => {
					switch (identity) {
						case "zhu": case "mingzhong": return "zhong";
						case "zhu_false": return "zhong_false";
						case "bZhu": return "bZhong";
						case "rZhu": return "rZhong";
						default: return identity;
					}
				})(p?.identity);
				// setIdentity会用lib.translate覆盖显示
				const pRaw = p?.node?.identity?.firstChild?.innerHTML;
				const pText = pRaw ? String(pRaw).replace(/<[^>]*>/g, "").trim() : "";
				const pDefault = p?.identity ? String(get.translation(p.identity)) : "";
				const isCustomLabel = !!pText && pText !== pDefault;
				m.setIdentity(goon ? "cai" : get.mode() == 'identity' ? gfShow : undefined);
				if (!goon && isCustomLabel) {
					if (m.node?.identity?.firstChild) {
						m.node.identity.firstChild.innerHTML = pRaw;
						const pColor = p?.node?.identity?.dataset?.color;
						if (pColor) m.node.identity.dataset.color = pColor;
					}
					if (m.node?.dieidentity) {
						m.node.dieidentity.innerHTML = pText;
					}
				} else if (!goon && p && m.identity != p.identity && (m.identity == "commoner" && p.identity == "nei" || get.mode() == "single")) {
					const gfLabel = get.translation(p.identity);
					const gfColor = p.identity;
					const gfDieLabel = get.mode() == "single" ? get.translation(p.identity + 2) : get.translation(p.identity);
					if (m.node?.identity?.firstChild) {
						m.node.identity.firstChild.innerHTML = gfLabel;
						m.node.identity.dataset.color = gfColor;
					}
					if (m.node?.dieidentity) {
						m.node.dieidentity.innerHTML = gfDieLabel;
					}
					if (m.setIdentity && !m._gf_viewLabel) {
						m._gf_viewLabel = true;
						const gf_setIdentity = m.setIdentity;
						m.setIdentity = function (identity, nature) {
							gf_setIdentity.call(this, identity, nature);
							try {
								if (this._gf_viewLabel && (identity || this.identity) != "cai" && this.node?.identity?.firstChild && !this.node.identity.classList.contains("guessing")) {
									this.node.identity.firstChild.innerHTML = gfLabel;
									this.node.identity.dataset.color = gfColor;
									if (this.node.dieidentity) this.node.dieidentity.innerHTML = gfDieLabel;
								}
							} catch (e) {}
							return this;
						};
					}
				} else if (m.node?.dieidentity) {
					m.node.dieidentity.innerHTML = get.mode() == 'identity' ? get.translation(gfShow) : get.translation(m.identity + 2);
				}
			}, summon, player);
			// 分组键
			const prefix = 'GF_KLID_';
			let randomNum, sixDigitNum, key;
			do {
				randomNum = Math.floor(Math.random() * 1000000);
				sixDigitNum = randomNum.toString().padStart(6, '0');
				key = prefix + sixDigitNum;
			} while (player.storage[key] || summon.storage[key]);
			// 主人绑定/分组键/携带技能/连接/态度/认主
			game.broadcastAll(function (m, s, cfg) {
				if (!m || !s) return;
				const skillName = cfg.skillName;
				// 绑定主人
				s.setStorage(skillName + "source", m);
				// 主人存1，傀儡存2
				s.storage[cfg.key] = 2;
				m.storage[cfg.key] = 1;
				// 记录主人客户端id
				m.storage.playerId = m.playerid;
				s.storage.playerId = m.playerid;
				// 携带技能
				(cfg.skills || []).forEach(name => {
					if (name) s.addSkill(name);
				});
				// 态度
				s.ai.modAttitudeFrom = function (from, to, att) {
					if (_status[skillName + "source_att_ing"]) return att;
					if (from.getStorage(skillName + "source", false)) {
						from = from.getStorage(skillName + "source", false);
					}
					if (to.getStorage(skillName + "source", false)) {
						to = to.getStorage(skillName + "source", false);
					}
					_status[skillName + "source_att_ing"] = true;
					att = get.attitude(from, to);
					delete _status[skillName + "source_att_ing"];
					return att;
				};
				// 傀儡认主
				s._trueMe = m;
			}, player, summon, {
				skillName: skillName,
				key: key,
				skills: Array.isArray(skills) ? skills : (typeof skills === "string" ? [skills] : [])
			});
			// 发牌
			summon.directgain(get.cards(initCards || 4));
			// 傀儡走无时机死亡：替换实例die方法，不产生die事件也不触发任何时机
			game.broadcastAll(function (s) {
				if (!s || s._gf_holyHooked) return;
				s._gf_holyHooked = true;
				_status.gf_kuiLeiOn = true;
				var nativeDie = s.die;
				s._gf_nativeDie = nativeDie;
				s.die = function (reason) {
					if (typeof game.GF_puppetHolyDie !== 'function') return nativeDie.call(this, reason);
					var next = game.createEvent('GF_puppetHolyDie', false);
					next.player = this;
					next.reason = reason;
					next.forceDie = true;
					next.forceOut = true;
					next.setContent(function (event, trigger, player) {
						return game.GF_puppetHolyDie(event.player || player, event.reason);
					});
					return next;
				};
			}, summon);
			game.log(player, '生成了傀儡【', lib.translate[id] || name, '】');
			return summon;
		} catch (e) {
			console.error("GF_KuiLei生成失败", e);
			return null;
		}
	};

	// 事件里别人指定或选中的组内成员 没有就返回null
	function GF_KuiLei_target(event, player) {
		if (!event || !event.player || GF_KuiLei_inGroup(event.player)) return null;
		var owner = GF_KuiLei_getOwner(player);
		if (!owner) return null;
		var list = [];
		if (Array.isArray(event.targets)) list = list.concat(event.targets);
		if (event.target) list = list.concat([event.target]);
		if (Array.isArray(event.list)) list = list.concat(event.list);
		if (event.result && Array.isArray(event.result.targets)) list = list.concat(event.result.targets);
		for (var i = 0; i < list.length; i++) {
			var t = list[i];
			if (!t || get.itemtype(t) != 'player') continue;
			if (t == event.player) continue;
			if (GF_KuiLei_getOwner(t) == owner) return t;
		}
		return null;
	}

	lib.skill.GF_KuiLei_auto = {
		trigger: {
			player: ['chooseToUseBegin', 'chooseToRespondBegin', 'chooseToDiscardBegin', 'chooseToCompareBegin',
				'chooseButtonBegin', 'chooseCardBegin', 'chooseTargetBegin', 'chooseCardTargetBegin', 'chooseControlBegin',
				'chooseBoolBegin', 'choosePlayerCardBegin', 'discardPlayerCardBegin', 'gainPlayerCardBegin', 'dieAfter'],
			global: ['chooseToUseAfter', 'chooseTargetAfter', 'chooseCardTargetAfter', 'chooseToCompareBegin', 'useCardToBegin']
		},
		firstDo: true,
		forced: true,
		priority: 9999,
		forceDie: true,
		charlotte: true,
		popup: false,
		silent: true,
		filter: function (event, player) {
			if (!GF_KuiLei_inGroup(player)) return false;
			if (event.autochoose && event.autochoose()) return false;
			if (event.player != player) {
				// 只有主人那份实例处理，免得组内每个成员都换一次
				if (player != GF_KuiLei_getOwner(player)) return false;
				return !!GF_KuiLei_target(event, player);
			}
			return true;
		},
		async content(event, trigger, player) {
			var isDie = trigger.name == 'die' || trigger.name == 'dieAfter';
			var owner = GF_KuiLei_getOwner(player);
			if (!owner) return;
			var group = [owner].concat(GF_KuiLei_getPuppets(owner, true));
			group = group.filter(function (p, i) { return p && group.indexOf(p) === i; });
			if (trigger.player != player) {
				var want = GF_KuiLei_target(trigger, player);
				if (!want || !want.isAlive() || want == game.me) return;
				if (_status.connectMode) {
					if (want.isOnline2() && want == game.me) return;
					for (var i = 0; i < group.length; i++) {
						var current = group[i];
						if (current == want || !current.isAlive()) continue;
						if (current.isOnline2() || current == game.me) {
							game.gf_swapPlayerOL(current, want);
							break;
						}
					}
				} else {
					for (var i = 0; i < group.length; i++) {
						var current = group[i];
						if (current == want) continue;
						if (current == game.me && !_status.auto) {
							game.swapPlayerAuto(want);
							if (ui.me) ui.me.show();
							break;
						}
					}
				}
				return;
			}
			if (isDie) {
				if (player == owner) {
					return;
				}
				if (_status.gf_cleaningPuppets) return;
				// 找出当前正持有操控客户端的组内成员，联机ws，单机game.me
				var holder = null;
				for (var i = 0; i < group.length; i++) {
					var c = group[i];
					if (!c.isAlive()) continue;
					if (c.isOnline2() || c == game.me) { holder = c; break; }
				}
				if (holder && holder.isAlive() && holder != player) return;
				// 否则把操控权交给第一个存活的其它成员
				for (var i = 0; i < group.length; i++) {
					var current = group[i];
					if (!current.isAlive() || current == player) continue;
					GF_KuiLei_switchView(player, current);
					break;
				}
				return;
			}
			if (!player.isAlive()) return;
			if (_status.connectMode) {
				if (player.isOnline2() && player == game.me) return;
				for (var i = 0; i < group.length; i++) {
					var current = group[i];
					if (current == player || !current.isAlive()) continue;
					if (current.isOnline2() || current == game.me) {
						game.gf_swapPlayerOL(current, player);
						break;
					}
				}
			} else {
				for (var i = 0; i < group.length; i++) {
					var current = group[i];
					if (current == player) continue;
					if (current == game.me && !_status.auto) {
						game.swapPlayerAuto(player);
						if (ui.me) ui.me.show();
						break;
					}
				}
			}
		},
		ai: {
			viewHandcard: true,
			skillTagFilter(player, tag, arg) {
				if (player == arg) return false;
				return GF_KuiLei_getOwner(player) === GF_KuiLei_getOwner(arg);
			},
		},
	};
	// 傀儡的移除、拦截路径统一由神圣死亡接管
	game.GF_removeKuiLei = async function (puppet) {
		if (get.itemtype(puppet) != 'player') return;
		var wasMine = puppet == game.me;
		game.broadcastAll(function (p) {
			if (p && p.ws) p.ws = null;
		}, puppet);
		game.broadcastAll(function (p) {
			p.dieAfter = function () {};
			p.dieAfter2 = function () {};
			p._gf_dieAfter = null;
		}, puppet);
		var keys = GF_KuiLei_keys(puppet, 2).slice();
		var owner = GF_KuiLei_getMaster(puppet);
		game.broadcastAll(function (s, keys, m) {
			keys.forEach(function (k) {
				if (s.storage && s.storage[k] != null) delete s.storage[k];
				if (m && m.storage && m.storage[k] != null) delete m.storage[k];
			});
		}, puppet, keys, owner);
		if (lib.wsOL && puppet.playerid) delete lib.wsOL[puppet.playerid];
		await game.removePlayerOL(puppet, { animate: false });
		if (wasMine && (game.notMe || _status.auto || game.observe)) {
			game.notMe = false;
			_status.auto = false;
			game.observe = false;
			try { ui.arena.classList.remove("observe"); } catch (e) {}
			var back = owner && owner.isAlive() ? owner : null;
			if (!back && puppet._trueMe && puppet._trueMe.isAlive()) back = puppet._trueMe;
			if (!back) {
				for (var i = 0; i < game.players.length; i++) {
					if (game.players[i] && game.players[i].isAlive()) { back = game.players[i]; break; }
				}
			}
			try { if (back && back != game.me) game.swapPlayerAuto(back); } catch (e) {}
			if (ui.me) ui.me.show();
			if (ui.auto) ui.auto.show();
			if (ui.wuxie) ui.wuxie.show();
		}
		return puppet;
	};

	// 神圣死亡
	game.gf_puppetDeathLog = [];
	game.gf_clearPuppetDeathLog = function () {
		game.gf_puppetDeathLog = game.gf_puppetDeathLog.filter(function (r) { return !r.done; });
		return game.gf_puppetDeathLog.length;
	};
	game.gf_getPuppetDeathLog = function () {
		return game.gf_puppetDeathLog.slice();
	};
	var GF_holyQueue = [];
	var GF_holyRunning = false;
	// 采集傀儡死亡瞬间的全部数据
	function GF_puppetSnapshot(puppet) {
		var cards = [];
		try { cards = puppet.getCards('hejsx').slice(); } catch (e) {}
		return {
			puppet: puppet,
			name: puppet.name,
			owner: GF_KuiLei_getMaster(puppet),
			key: GF_KuiLei_keys(puppet, 2)[0] || null,
			position: puppet.dataset ? parseInt(puppet.dataset.position) : null,
			seatNum: puppet.getSeatNum ? puppet.getSeatNum() : null,
			hp: puppet.hp,
			maxHp: puppet.maxHp,
			hujia: puppet.hujia,
			cards: cards,
			previous: puppet.previous,
			next: puppet.next,
			previousSeat: puppet.previousSeat,
			nextSeat: puppet.nextSeat,
			done: false,
		};
	}
	// 标记死亡
	function GF_holyMarkDead(puppet) {
		game.broadcastAll(function (p) {
			if (p.classList.contains('dead')) return;
			p.classList.add('dead');
			p.removeLink();
			p.classList.remove('turnedover');
			p.classList.remove('out');
			if (p.node) {
				if (p.node.count) p.node.count.innerHTML = '0';
				if (p.node.hp) p.node.hp.hide();
				if (p.node.equips) p.node.equips.hide();
				if (p.node.count) p.node.count.hide();
			}
			if (p.previous && p.next) {
				p.previous.next = p.next;
				p.next.previous = p.previous;
			}
			game.players.remove(p);
			if (!game.dead.includes(p)) game.dead.push(p);
			if (_status.dying && _status.dying.remove) _status.dying.remove(p);
		}, puppet);
		puppet.hp = 0;
	}
	// 无时机死亡前的视角与令牌交接
	async function GF_holyGiveBackView(puppet) {
		try {
			if (!puppet || !puppet.playerid) return;
			var holding = puppet == game.me || (_status.connectMode && typeof puppet.isOnline2 == 'function' && puppet.isOnline2());
			if (!holding) return;
			var owner = (puppet._trueMe && puppet._trueMe != puppet) ? puppet._trueMe : GF_KuiLei_getMaster(puppet);
			var target = null;
			if (owner && owner != puppet && owner.isAlive()) target = owner;
			if (!target && owner) {
				var group = GF_KuiLei_getPuppets(owner, true);
				for (var i = 0; i < group.length; i++) {
					var current = group[i];
					if (current && current != puppet && current.isAlive()) { target = current; break; }
				}
			}
			if (target) {
				if (puppet == game.me && target.isAlive()) game.swapPlayerAuto(target);
				if (_status.connectMode && lib.node && typeof game.gf_swapPlayerOL == 'function') game.gf_swapPlayerOL(puppet, target, true);
			}
			if (game.notMe || game.observe) {
				game.notMe = false;
				game.observe = false;
				_status.auto = false;
				try { if (ui.arena && ui.arena.classList) ui.arena.classList.remove('observe'); } catch (e) {}
				if (ui.me) ui.me.show();
				if (ui.auto) ui.auto.show();
				if (ui.wuxie) ui.wuxie.show();
			}
		} catch (e) {}
	}
	async function GF_holyDieStep(puppet, reason) {
		var record = GF_puppetSnapshot(puppet);
		game.gf_puppetDeathLog.push(record);
		delete puppet._gf_holyPending;
		puppet._gf_holyDone = true;
		await GF_holyGiveBackView(puppet);
		GF_holyMarkDead(puppet);
		var owner = record.owner;
		if (!_status.gf_cleaningPuppets && owner && typeof owner.getSkills == 'function') {
			var list = owner.getSkills(null, false, false) || [];
			for (var i = 0; i < list.length; i++) {
				var s = lib.skill[list[i]];
				if (!s || typeof s.gf_puppetDie != 'function') continue;
				try { await s.gf_puppetDie(puppet, owner, record); } catch (e) {}
			}
		}
		await game.GF_removeKuiLei(puppet);
		record.done = true;
		return puppet;
	}
	// 傀儡死亡入口
	game.GF_puppetHolyDie = async function (puppet, reason) {
		if (get.itemtype(puppet) != 'player') return puppet;
		if (puppet._gf_holyDone) return puppet;
		if (puppet._gf_holyPending) {
			for (var i = 0; i < GF_holyQueue.length; i++) {
				if (GF_holyQueue[i].puppet == puppet) return puppet;
			}
		}
		puppet._gf_holyPending = true;
		GF_holyQueue.push({ puppet: puppet, reason: reason });
		if (GF_holyRunning) return puppet;
		GF_holyRunning = true;
		try {
			while (GF_holyQueue.length) {
				var task = GF_holyQueue.shift();
				try { await GF_holyDieStep(task.puppet, task.reason); } catch (e) {}
			}
		} finally {
			GF_holyRunning = false;
		}
		return puppet;
	};
	// 神圣死亡，目前只监督傀儡尸体清理
	lib.skill.GF_holyDeath = {
		trigger: { global: ['phaseBegin'] },
		charlotte: true,
		silent: true,
		fixed: true,
		forced: true,
		forceDie: true,
		forceOut: true,
		popup: false,
		priority: Infinity,
		filter: function (event, player) {
			return !!_status.gf_kuiLeiOn;
		},
		async content(event, trigger, player) {
			var all = game.players.concat(game.dead).slice();
			for (var i = 0; i < all.length; i++) {
				var p = all[i];
				if (!p || p._gf_holyDone || p._gf_holyPending) continue;
				if (p.isAlive()) continue;
				if (!GF_isKuiLei(p)) continue;
				if (!GF_stillOnField(p)) continue;
				try { await game.GF_puppetHolyDie(p, null); } catch (e) {}
			}
		},
	};
	if (!lib.gf_holyDeathReady) {
		lib.gf_holyDeathReady = true;
		lib.onprepare.push(function () {
			try {
				if (!lib.skill.GF_holyDeath) return;
				if (lib.skill.global && lib.skill.global.includes && lib.skill.global.includes('GF_holyDeath')) return;
				game.addGlobalSkill('GF_holyDeath');
			} catch (e) {}
		});
	}
	// 是否傀儡体系注册出来的角色
	function GF_isKuiLei(player) {
		if (!player || !player.storage) return false;
		if (GF_KuiLei_keys(player, 2).length) return true;
		if (player._trueMe && player._trueMe != player) return true;
		var own = Object.keys(player);
		for (var i = 0; i < own.length; i++) {
			if (own[i].indexOf('isNoPlayer_') === 0) return true;
		}
		return false;
	}
	// 角色归属的主人
	function GF_ownerOf(player) {
		if (!player) return player;
		var owner = (player._trueMe && player._trueMe != player) ? player._trueMe : player;
		if (GF_KuiLei_inGroup(owner)) owner = GF_KuiLei_getOwner(owner);
		return owner || player;
	}
	// 阵营归类
	function GF_campOf(player) {
		var owner = GF_ownerOf(player);
		if (!owner) return null;
		if (owner.side != null && owner.side !== '') return 'side_' + owner.side;
		var identity = owner.identity;
		if (identity) {
			if (identity == 'zhu' || identity == 'zhong' || identity == 'mingzhong') return 'lord';
			return 'id_' + identity;
		}
		if (owner.group) return 'group_' + owner.group;
		return 'player_' + (owner.playerid || owner.name);
	}
	function GF_stillOnField(player) {
		return game.players.includes(player) || game.dead.includes(player);
	}
	// 清理前更换操控视角为主人
	function GF_kuiLeiGiveBackView(puppet) {
		try {
			if (!puppet || puppet.isAlive()) return;
			var holding = _status.connectMode
				? (typeof puppet.isOnline2 == 'function' && puppet.isOnline2())
				: puppet == game.me;
			if (!holding) return;
			var owner = GF_KuiLei_getMaster(puppet);
			var target = null;
			if (owner && owner.isAlive()) target = owner;
			if (!target && owner) {
				var group = GF_KuiLei_getPuppets(owner, true);
				for (var i = 0; i < group.length; i++) {
					if (group[i] && group[i] != puppet && group[i].isAlive()) { target = group[i]; break; }
				}
			}
			if (!target) return;
			GF_KuiLei_switchView(puppet, target);
			if (!_status.connectMode && game.notMe) {
				game.notMe = false;
				_status.auto = false;
			}
		} catch (e) {}
	}
	// 找某个主人名下所有还活着的傀儡
	function GF_puppetsOf(owner) {
		var result = [];
		try {
			if (!owner) return result;
			var all = game.players.concat(game.dead);
			for (var i = 0; i < all.length; i++) {
				var p = all[i];
				if (!p || p == owner) continue;
				if (!p.isAlive()) continue;
				if (!GF_isKuiLei(p)) continue;
				if (GF_ownerOf(p) != owner) continue;
				result.push(p);
			}
		} catch (e) {}
		return result;
	}
	// 给傀儡套一层死亡钩子
	function GF_wrapPuppetDieAfter(puppet) {
		try {
			if (!puppet || puppet._gf_puppetDieWrapped) return;
			puppet._gf_puppetDieWrapped = true;
			var orig = puppet.dieAfter;
			puppet.dieAfter = async function (source) {
				if (_status.gf_cleaningPuppets) return;
				if (typeof orig === 'function') return orig.call(this, source);
			};
		} catch (e) {}
	}
	function GF_wrapOwnerDie(owner) {
		try {
			if (!owner || owner._gf_ownerDieWrapped) return;
			owner._gf_ownerDieWrapped = true;
			var origDie = owner.die;
			if (typeof origDie !== 'function') return;
			owner.die = function (reason) {
				var next = game.createEvent('GF_ownerDieWaitPuppets', false);
				next.player = this;
				next.reason = reason;
				next.forceDie = true;
				next._gf_origDie = origDie;
				next.setContent(async function (event, trigger, player) {
					_status.gf_cleaningPuppets = true;
					try {
						var puppets = GF_puppetsOf(player);
						for (var i = 0; i < puppets.length; i++) {
							await puppets[i].die();
						}
						await game.gf_kuiLeiSweep();
					} catch (e) {
					} finally {
						delete _status.gf_cleaningPuppets;
					}
					await event._gf_origDie.call(player, event.reason);
				});
				return next;
			};
		} catch (e) {}
	}
	function GF_attachOwnerHooks() {
		try {
			var all = game.players.concat(game.dead);
			for (var i = 0; i < all.length; i++) {
				var p = all[i];
				if (!p) continue;
				if (GF_KuiLei_keys(p, 1).length) GF_wrapOwnerDie(p);
				if (GF_KuiLei_keys(p, 2).length) GF_wrapPuppetDieAfter(p);
			}
		} catch (e) {}
	}
	// 清理漏删的傀儡尸体
	game.gf_kuiLeiCleanUp = async function (puppet) {
		try {
			if (!puppet || get.itemtype(puppet) != 'player') return false;
			if (puppet.isAlive()) return false;
			if (!GF_stillOnField(puppet)) return false;
			if (!GF_isKuiLei(puppet)) return false;
			await game.GF_puppetHolyDie(puppet, null);
			return !GF_stillOnField(puppet);
		} catch (e) {
			return false;
		}
	};
	// 扫一遍已出局却还占着位置的死亡傀儡
	game.gf_kuiLeiSweep = async function () {
		try {
			var list = game.dead.slice().filter(function (p) {
				return p && GF_isKuiLei(p);
			});
			for (var i = 0; i < list.length; i++) {
				await game.gf_kuiLeiCleanUp(list[i]);
			}
		} catch (e) {}
	};
	// 是否已分胜负
	game.gf_overDecide = function (viewPlayer) {
		if (!game.me) return null;
		var me = GF_ownerOf(viewPlayer || game.me);
		if (!me) return null;
		var alive = game.players.filter(function (p) { return p && p.isAlive(); });
		if (!alive.length) return null;
		var myCamp = GF_campOf(me);
		var mode = get.mode();
		// 斗地主
		if (mode == 'doudizhu' && game.zhu) {
			var dizhu = GF_ownerOf(game.zhu);
			if (!dizhu.isAlive()) return me != dizhu;
			if (_status.mode == 'binglin' && game.roundNumber < 3) return null;
			if (!alive.some(function (p) { return GF_ownerOf(p) != dizhu; })) return me == dizhu;
			return null;
		}
		// boss
		if (mode == 'boss' && game.boss) {
			var boss = GF_ownerOf(game.boss);
			if (!boss.isAlive()) return me != boss;
			if (!alive.some(function (p) { return p.side == null && p != boss; })) return me == boss;
			return null;
		}
		// 身份局
		if (game.zhu && mode != 'guozhan' && mode != 'versus') {
			var lord = GF_ownerOf(game.zhu);
			var real = alive.filter(function (p) { return GF_ownerOf(p) == p; });
			var fan = alive.filter(function (p) { return GF_campOf(p) == 'id_fan'; }).length;
			var nei = alive.filter(function (p) { return GF_campOf(p) == 'id_nei'; }).length;
			if (lord.isAlive() && fan + nei > 0) return null;
			if (myCamp == 'lord') return lord.isAlive();
			if (myCamp == 'id_nei') return real.includes(me) && real.length == 1 + real.filter(function (p) { return p.identity == 'commoner'; }).length;
			if (myCamp == 'id_fan') return !lord.isAlive();
			if (myCamp == 'id_commoner') return true;
			return null;
		}
		// 通用
		var camps = {};
		alive.forEach(function (p) {
			var c = GF_campOf(p);
			if (c) camps[c] = true;
		});
		var list = Object.keys(camps);
		if (list.length == 1) return myCamp == list[0];
		return null;
	};
	// 胜利结算保底
	game.gf_overFallback = function () {
		if (_status.over) return false;
		if (game.online) return false;
		var result = null;
		try {
			result = game.gf_overDecide();
		} catch (e) {
			return false;
		}
		if (result !== true && result !== false) return false;
		try {
			if (typeof game.showIdentity == 'function') game.showIdentity();
		} catch (e) {}
		game.log('●游戏结束');
		game.over(result);
		return true;
	};
	// 死亡兜底
	lib.skill.gflib_dieFallback = {
		trigger: {
			global: ['dieAfter', 'phaseBegin']
		},
		charlotte: true,
		silent: true,
		fixed: true,
		forced: true,
		forceDie: true,
		popup: false,
		filter: function (event, player) {
			try {
				if (lib.gf_dieFallbackBroken) return false;
				if (event.name == 'phaseBegin') return true;
				if (event.reserveOut) return false;
				return get.itemtype(event.player) == 'player';
			} catch (e) {
				return false;
			}
		},
		async content(event, trigger, player) {
			try {
				if (trigger.name == 'phaseBegin') {
					if (!trigger.gf_ownerHookDone) {
						trigger.gf_ownerHookDone = true;
						GF_attachOwnerHooks();
					}
					return;
				}
				if (trigger.gf_dieFallback) return;
				trigger.gf_dieFallback = true;
				GF_kuiLeiGiveBackView(trigger.player);
				var next = game.createEvent('gflib_dieFallbackStep', false, trigger);
				next.player = trigger.player;
				next.forceDie = true;
				next.forceOut = true;
				next.setContent(async (evt, trig, ply) => {
					try {
						await game.gf_kuiLeiCleanUp(ply);
						await game.gf_kuiLeiSweep();
					} catch (e) {}
				});
				trigger.next.remove(next);
				trigger.after.push(next);
			} catch (e) {
				lib.gf_dieFallbackBroken = true;
			}
		},
	};
	if (!lib.gf_dieFallbackReady) {
		lib.gf_dieFallbackReady = true;
		lib.onprepare.push(function () {
			try {
				if (!lib.skill.gflib_dieFallback) return;
				if (lib.skill.global && lib.skill.global.includes && lib.skill.global.includes('gflib_dieFallback')) return;
				game.addGlobalSkill('gflib_dieFallback');
			} catch (e) {}
		});
	}
	if (typeof lib.element.player.GF_KuiLei == 'function' && !lib.element.player.GF_KuiLei._gf_ownerHook) {
		var gf_kuilei_orig = lib.element.player.GF_KuiLei;
		var gf_kuilei_wrapped = async function () {
			var result = await gf_kuilei_orig.apply(this, arguments);
			try {
				GF_wrapOwnerDie(this);
				if (result) GF_wrapPuppetDieAfter(result);
			} catch (e) {}
			return result;
		};
		gf_kuilei_wrapped._gf_ownerHook = true;
		lib.element.player.GF_KuiLei = gf_kuilei_wrapped;
	}

	// 联机禁用标签offlineOnly
	lib.__gf_offlineSkills = lib.__gf_offlineSkills || new Set();
	function gf_isOnline() {
		if (game && (game.online || game.onlineroom || game.servermode)) return true;
		if (_status && _status.connectMode) return true;
		if (lib && lib.config && lib.config.mode === "connect") return true;
		return false;
	}
	lib.gf_isOnline = gf_isOnline;
	function GF_wrapDisableOffline(s) {
		if (!s || typeof s !== 'object') return;
		if (s.__gf_offlineWrapped) return;
		s.__gf_offlineWrapped = true;
		const origFilter = s.filter;
		s.filter = function() {
			if ((game && (game.online || game.onlineroom || game.servermode)) || (_status && _status.connectMode) || (lib && lib.config && lib.config.mode === "connect")) return false;
			return origFilter ? origFilter.apply(this, arguments) : true;
		};
		if (s.mod && typeof s.mod === 'object') {
			for (const k in s.mod) {
				const origMod = s.mod[k];
				if (typeof origMod === 'function') {
					s.mod[k] = function() {
						if ((game && (game.online || game.onlineroom || game.servermode)) || (_status && _status.connectMode) || (lib && lib.config && lib.config.mode === "connect")) return arguments[arguments.length - 1];
						return origMod.apply(this, arguments);
					};
				}
			}
		}
	}
	function GF_applyOfflineOnly(skillObj, name) {
		if (!skillObj || typeof skillObj !== 'object') return;
		if (skillObj.offlineOnly === true) {
			skillObj.GF_offlineOnly = true;
			if (name) lib.__gf_offlineSkills.add(name);
			GF_wrapDisableOffline(skillObj);
		}
		if (skillObj.subSkill && typeof skillObj.subSkill === 'object') {
			for (const k in skillObj.subSkill) {
				GF_applyOfflineOnly(skillObj.subSkill[k], name ? name + "_" + k : k);
			}
		}
	}
	// 记录律道技归属，init2 在每次 addSkill 时都会跑
	function GF_lvdaoRegister(skillObj) {
		if (skillObj.init2 && skillObj.init2._gfLvdao) return;
		const oldInit2 = skillObj.init2;
		const init2 = function (player, skill) {
			if (player) {
				player._gf_lvdao_owned = player._gf_lvdao_owned || [];
				if (player._gf_lvdao_owned.indexOf(skill) < 0) player._gf_lvdao_owned.push(skill);
			}
			if (typeof oldInit2 == 'function') return oldInit2.apply(this, arguments);
		};
		init2._gfLvdao = true;
		skillObj.init2 = init2;
	}
	// 律道技防删自愈，别人直接改玩家 skills 数组能绕过 removeSkill 里的 fixed 检查
	function GF_lvdaoGuard() {
		const proto = lib.element && lib.element.player;
		if (!proto || (proto.update && proto.update._gfLvdaoGuard)) return;
		const original = proto.update;
		if (typeof original != 'function') return;
		const wrapped = function () {
			try {
				const owned = this._gf_lvdao_owned;
				if (owned && owned.length) {
					for (const name of owned) {
						if (!lib.skill[name]) continue;
						if (this.skills.includes(name)) continue;
						if (this.hiddenSkills && this.hiddenSkills.includes(name)) continue;
						if (this.invisibleSkills && this.invisibleSkills.includes(name)) continue;
						this.addSkill(name);
					}
				}
			} catch (e) { }
			return original.apply(this, arguments);
		};
		wrapped._gfLvdaoGuard = true;
		proto.update = wrapped;
	}
	GF_lvdaoGuard();
	const sk = lib.skill || {};
	lib.skill = new Proxy(sk, {
		set(target, skillName, skillObj) {
			if (skillObj && (skillObj.GFyongchangSkill == true || skillObj.GFyingxiongSkill == true || skillObj.GFtonglingSkill == true || skillObj.GFzhaohuanSkill == true)) {
				skillObj.forced = true;
				skillObj.charlotte = true;
				skillObj.persevereSkill = true;
				skillObj.fixed = true;
				skillObj.superCharlotte = true;
				skillObj.forceOut = true;
				skillObj.forceDie = true;
				skillObj.firstDo = true;
				skillObj.globalFixed = true;
				skillObj.unique = true;
			}
			if (skillObj && skillObj.silentForce == true) {
				skillObj.forced = true;
				skillObj.popup = false;
				skillObj.silent = true;
				skillObj.charlotte = true;
				skillObj.fixed = true;
				skillObj.superCharlotte = true;
			}
			if (skillObj && skillObj.GFyuxiangSkill == true) {
				skillObj.forceOut = true;
				skillObj.forceDie = true;
				skillObj.forced = true;
				skillObj.charlotte = true;
				skillObj.fixed = true;
				skillObj.superCharlotte = true;
				skillObj.persevereSkill = true;
			}
			if (skillObj && skillObj.lvdao == true) {
				skillObj.charlotte = true;
				skillObj.fixed = true;
				skillObj.superCharlotte = true;
				skillObj.persevereSkill = true;
				GF_lvdaoRegister(skillObj);
			}
			if (skillObj && skillObj.GFshunfaSkill === true) {
				skillObj.clickable = function (player) {
					if (!player.isUnderControl(true)) return;
					if (lib.gfShunfa.locked(player, skillName)) return;
					var sk = lib.skill[skillName];
					if (sk.gfShunfaFilter && !sk.gfShunfaFilter(player)) return;
					if (game.online && !lib.node) {
						game.send("gf_shunfa_click", player.playerid, skillName);
					} else {
						lib.gfShunfa.addReq(player, skillName);
						lib.gfShunfa.schedule(player, skillName);
					}
				};
			}
			if (skillObj && typeof skillObj === 'object') {
				GF_applyOfflineOnly(skillObj, skillName);
			}
			target[skillName] = skillObj;
			return true;
		},
		defineProperty(target, skillName, descriptor) {
			if (descriptor && descriptor.value && typeof descriptor.value === 'object') {
				GF_applyOfflineOnly(descriptor.value, skillName);
			}
			return Reflect.defineProperty(target, skillName, descriptor);
		}
	});
	if (lib.translate && !lib.translate.__gf_offline_wrapped) {
		const _gf_tr = lib.translate;
		lib.translate = new Proxy(_gf_tr, {
			get(target, key) {
				if (typeof key === 'string' && key.length > 5 && key.endsWith('_info') && gf_isOnline()) {
					const base = key.slice(0, key.length - 5);
					if (lib.__gf_offlineSkills.has(base)) {
						return '联机模式不启用。';
					}
				}
				return target[key];
			}
		});
		lib.translate.__gf_offline_wrapped = true;
	}

	// 联机模式offlineOnly父技能的group子技能不展开
	(function () {
		function gfWrapExpandSkills() {
			if (!game || typeof game.expandSkills !== "function") return false;
			if (game.__gf_offline_expand_wrapped) return true;
			var _expand = game.expandSkills.bind(game);
			game.expandSkills = function (skills, subSkill) {
				var result = _expand(skills, subSkill);
				if (!gf_isOnline()) return result;
				var contrib = {};
				for (var i = 0; i < skills.length; i++) {
					var info = lib.skill[skills[i]];
					if (info && info.group) {
						var g = Array.isArray(info.group) ? info.group : [info.group];
						for (var j = 0; j < g.length; j++) {
							var child = g[j];
							if (!contrib[child]) contrib[child] = { offline: false, nonOffline: false };
							if (info.GF_offlineOnly) contrib[child].offline = true;
							else contrib[child].nonOffline = true;
						}
					}
				}
				for (var k = skills.length - 1; k >= 0; k--) {
					var c = skills[k];
					if (contrib[c] && contrib[c].offline && !contrib[c].nonOffline) skills.splice(k, 1);
				}
				return skills;
			};
			game.__gf_offline_expand_wrapped = true;
			return true;
		}
		if (!gfWrapExpandSkills() && typeof game !== "undefined" && game && typeof game.on === "function") {
			game.on("gameStart", gfWrapExpandSkills);
		}
	})();

	lib.element.player.gfYongchang = function(num, imgName, skillName) {
		const player = this;
		const a = typeof num === 'number' ? num : 1;
		player.gfYongchangTime(a);
		player.gfYongchangImgName = imgName;
		player.gfYongchangSkillName = skillName;
		player.addSkill(`${player.gfYongchangSkillName}_process`);
		player.addSkill(`${player.gfYongchangSkillName}_condition`);
		game.broadcastAll(function (playerNode, imgName) {
			const avatar = playerNode.node?.avatar;
			if (!avatar) return;
			const imgPath = lib.assetURL + `extension/鸽府包/image/character/yongchang/${imgName}_yc.jpg`;
			const newImg = new Image();
			newImg.src = imgPath;
			newImg.onload = function() {
				const originalStyle = {
					transform: avatar.style.transform,
					transition: avatar.style.transition,
					transformStyle: avatar.style.transformStyle,
					backfaceVisibility: avatar.style.backfaceVisibility
				};
				avatar.style.transformStyle = "preserve-3d";
				avatar.style.backfaceVisibility = "hidden";
				avatar.style.transition = "transform 0.5s cubic-bezier(0.5, 0, 0.5, 1)";
				avatar.style.transform = "rotateY(180deg)";
				setTimeout(function() {
					avatar.setBackgroundImage(imgPath);
				}, 250);
				setTimeout(function() {
					avatar.style.transition = "transform 0.5s cubic-bezier(0.5, 0, 0.5, 1)";
					avatar.style.transform = "rotateY(0deg)";
					setTimeout(function() {
						avatar.style.transform = originalStyle.transform;
						avatar.style.transition = originalStyle.transition;
						avatar.style.transformStyle = originalStyle.transformStyle;
						avatar.style.backfaceVisibility = originalStyle.backfaceVisibility;
					}, 500);
				}, 500);
			};
		}, player, imgName);
	};

	lib.element.player.gfYongchangJie = function(imgName) {
		const player = this;
		player.gfYongchangTime('reset');
		player.removeSkill(`${player.gfYongchangSkillName}_condition`);
		game.broadcastAll(function (playerNode, imgName) {
			const avatar = playerNode.node?.avatar;
			if (!avatar) return;
			const imgPath = lib.assetURL + `extension/鸽府包/image/character/stand/${imgName}.jpg`;
			const newImg = new Image();
			newImg.src = imgPath;
			newImg.onload = function() {
				const originalStyle = {
					transform: avatar.style.transform,
					transition: avatar.style.transition,
					transformStyle: avatar.style.transformStyle,
					backfaceVisibility: avatar.style.backfaceVisibility
				};
				avatar.style.transformStyle = "preserve-3d";
				avatar.style.backfaceVisibility = "hidden";
				avatar.style.transition = "transform 0.5s cubic-bezier(0.5, 0, 0.5, 1)";
				avatar.style.transform = "rotateY(180deg)";
				setTimeout(function() {
					avatar.setBackgroundImage(imgPath);
				}, 250);
				setTimeout(function() {
					avatar.style.transition = "transform 0.5s cubic-bezier(0.5, 0, 0.5, 1)";
					avatar.style.transform = "rotateY(0deg)";
					setTimeout(function() {
						avatar.style.transform = originalStyle.transform;
						avatar.style.transition = originalStyle.transition;
						avatar.style.transformStyle = originalStyle.transformStyle;
						avatar.style.backfaceVisibility = originalStyle.backfaceVisibility;
					}, 500);
				}, 500);
			};
		}, player, imgName);
	};
	lib.skill.gf_YongchangProcess = {};
	lib.element.player.gfYongchangCheng = function() {
		const player = this;
		game.log(player, get.translation(player) + '咏唱成功了');
		player.removeSkill(`${player.gfYongchangSkillName}_process`);
		player.addSkill(`${player.gfYongchangSkillName}_success`);
		player.gfYongchangJie(player.gfYongchangImgName);
	},
	lib.element.player.TonglingEffect = function(cgName, imgName) {
		const player = this;
		game.gf_cg(cgName, "noskip");
		if (imgName) {
			player.TonglingSuccess += 1;
			if(!player.isIn()) player.revive();
			game.broadcastAll(function (targetPlayer, imgName) {
				const imgPath = lib.assetURL + `extension/鸽府包/image/character/stand/${imgName}.jpg`;
				const img = new Image();
				img.src = imgPath;
				img.onload = function() {
					targetPlayer.node.avatar.setBackgroundImage(imgPath);
				};
			}, player, imgName);
			player.forceIn();
			player.link(false);
			player.turnOver(false);
			player.gainMaxHp(player.maxHp);
			player.recover(player.maxHp * 2 - player.hp);
			player.draw(4);
		}
	};

	lib.skill.gzhlb_fenghuan = {
		trigger: {
			global: 'useSkillBefore',
		},
		round: 1,
		priority: Infinity,
		filter: function (event, player) {
			event.count = 0;
			if (event.targets) {
				var list = game.filterPlayer();
				for (var i = 0; i < list.length; i++) {
					if (event.targets.includes(list[i]) && get.distance(player, list[i]) <= 1) {
						event.count++;
					}
				}
			}
			return event.count > 0;
		},
		"prompt2": function (event, player) {
			return '你是否令【' + get.translation(event.player) + '】〖' + get.translation(event.skill) + '〗的一个与你距离不大于1的目标改为其（【' + get.translation(event.player) + '】）自己';
		},
		content: function () {
			"step 0"
			event.count = 0;
			var list = game.filterPlayer();
			for (var i = 0; i < list.length; i++) {
				if (trigger.targets.includes(list[i]) && get.distance(player, list[i]) <= 1) {
					event.count++;
				}
			}
			if (event.count == 1) {
				for (var j = 0; j < list.length; j++) {
					if (get.distance(player, list[j]) <= 1) {
						trigger.targets.remove(list[j]);
						game.log(player, "将〖", trigger.skill, "〗指向【" + get.translation(list[j]) + "】的目标改为了其自己（【" + get.translation(trigger.player) + "】）");
					}
				}
				trigger.targets.add(trigger.player);
				event.finish();
			}
			"step 1"
			player
				.chooseTarget(true, get.prompt("gzhlb_fenghuan"), "请选择一名与你距不大于1的角色并将〖" + get.translation(trigger.skill) + "〗对其的指定改为发起者自己。", function (card, player, target) {
					return trigger.targets.includes(target) && get.distance(player, target) <= 1;
				})
				.set("ai", function (target) {
					var att = get.attitude(_status.event.player, target);
					return att > 0;
				});
			"step 2";
			if (result.bool) {
				trigger.targets.remove(result.targets[0]);
				trigger.targets.add(trigger.player);
				game.log(player, "将〖", trigger.skill, "〗指向【" + get.translation(result.targets[0]) + "】的目标改为了其自己（【" + get.translation(trigger.player) + "】）");
			}
		},
		group: "gzhlb_fenghuan_forced",
		subSkill: {
			forced: {
				trigger: {
					global: ['chooseTargetAfter', 'chooseCardTargetAfter'],
				},
				popup: false,
				silent: true,
				firstDo: true,
				forced: true,
				charlotte: true,
				priority: Infinity,
				filter: function (event, player) {
					if (event.result.targets) {
						return event.result.targets.includes(player);
					}
				},
				content: function () {
					var target = trigger.result.targets;
					target.remove(player);
					target.add(trigger.player);
				},
				sub: true,
			},
		},
	};

	const SyncModule = (function() {
		const CONFIG = {
			MSG_TYPE: 'gf_msg',
			FIRST_JOIN_MSG: 'gf_first_join',
			CHECK_INTERVAL: 200,
			SYNC_DELAY: 3000,
			TRIGGER_KEYS: ["room", "sync", "join"]
		};
		let isTriggered = false;
		let roomCheckTimer = null;

		window.gfDataMap = window.gfDataMap || Object.create(null);
		// 第一个进房间的玩家id
		window.gfFirstJoinUid = window.gfFirstJoinUid || null;
		const utils = {
			getUid: function() {
				return game?.me?.playerid || null;
			},
			getNickname: function() {
				return (typeof get?.connectNickname === 'function' && get.connectNickname()) || '未知玩家';
			},
			getHeroData: function() {
				return {
					extension_鸽府包_ljqy: lib.config?.extension_鸽府包_ljqy || false,
					extension_鸽府包_qysy: lib.config?.extension_鸽府包_qysy || { win: 0, lose: 0 },
					extension_鸽府包_gfb_logBan: lib.config?.extension_鸽府包_gfb_logBan || false,
				};
			},
			sendMsg: function(type, ...args) {
				try {
					if (game?.send) game.send(type, ...args);
				} catch (e) {}
			},
		};
		// 注册“首个进房”消息
		function registerFirstJoinHandler() {
			// 服务器收到首发通知，广播给所有人
			lib.message.server[CONFIG.FIRST_JOIN_MSG] = function(uid) {
				if (!uid) return;
				window.gfFirstJoinUid = uid;
				// 广播给所有客户端
				game.send(CONFIG.FIRST_JOIN_MSG, uid);
			};
			// 客户端收到首发通知，记录
			lib.message.client[CONFIG.FIRST_JOIN_MSG] = function(uid) {
				if (!uid) return;
				window.gfFirstJoinUid = uid;
				console.log("【首个进房玩家】uid =", uid);
			};
		}
		function initRoomCheck() {
			if (window.suiRoomTrigger) return;
			window.suiRoomTrigger = true;
			roomCheckTimer = setInterval(function() {
				const isRoomReady = !!game?.roomId && !!game?.me;
				if (isRoomReady) {
					clearInterval(roomCheckTimer);
					const uid = utils.getUid();
					if (!uid) return;
					if (!window.gfFirstJoinUid) {
						window.gfFirstJoinUid = uid;
						utils.sendMsg(CONFIG.FIRST_JOIN_MSG, uid);
						console.log("我是房主uid =", uid);
					}
					const data = utils.getHeroData();
					window.gfDataMap[uid] = data;
					// 进房即上报，客机数据发到主机
					utils.sendMsg(CONFIG.MSG_TYPE, uid, data);
				}
			}, CONFIG.CHECK_INTERVAL);
		}
		function registerMsgHandlers() {
			lib.message.server[CONFIG.MSG_TYPE] = function(uid, data) {
				if (!uid || !data) return;
				window.gfDataMap[uid] = data;
				// 转发给所有客户端，保持全端数据一致
				try { if (game?.send) game.send(CONFIG.MSG_TYPE, uid, data); } catch (e) {}
				// 新数据到达立即重判，覆盖客机数据晚到，已广播则忽略
				try {
					if (window._gfqyDoPick && !window._gfqyBroadcastDone) {
						window._gfqyDoPick();
					}
				} catch (e) {}
			};
			lib.message.client[CONFIG.MSG_TYPE] = function(uid, data) {
				if (!uid || !data) return;
				window.gfDataMap[uid] = data;
				if (uid === game.me.playerid && data.extension_鸽府包_ljqy != null) {
					lib.config = lib.config || {};
					lib.config.extension_鸽府包_ljqy = data.extension_鸽府包_ljqy;
				}
			};
		}
		function initWebSocketListener() {
			if (!lib?.element?.ws) {
				setTimeout(initWebSocketListener, 500);
				return;
			}
			const originMsg = lib.element.ws.onmessage;
			lib.element.ws.onmessage = function(e) {
				originMsg?.call(this, e);
				if (isTriggered) return;
				let msg;
				try { msg = JSON.parse(e.data); } catch (err) { return; }
				const isTrigger = Array.isArray(msg)
					? msg.some(function(item){ return CONFIG.TRIGGER_KEYS.some(function(k){ return item?.includes(k) }) })
					: CONFIG.TRIGGER_KEYS.some(function(k){ return msg.type?.includes(k) || msg.cmd?.includes(k) });
				if (isTrigger) {
					isTriggered = true;
					const uid = utils.getUid();
					if (!uid) return;
					const data = utils.getHeroData();
					window.gfDataMap[uid] = data;
				}
			};
		}
		function init() {
			registerFirstJoinHandler();
			initRoomCheck();
			registerMsgHandlers();
			initWebSocketListener();
			// 进房记录——玩家进房时记录名字到_gfqyEnterList去重
			try {
				const originServerInit = lib.message.server.init;
				if (typeof originServerInit === 'function') {
					lib.message.server.init = function(version, config, banned_info) {
						const ret = originServerInit.apply(this, arguments);
						try {
							// 成功进房才记录
							const p = (game.connectPlayers || []).find(x => x && x.ws === this);
							if (p) {
								const nickname = (this.nickname || p.nickname || '').trim();
								if (nickname && nickname !== '无名玩家') {
									window._gfqyEnterList = window._gfqyEnterList || [];
									// 反复进出也只记本身名字，去重
									if (!window._gfqyEnterList.includes(nickname)) {
										window._gfqyEnterList.push(nickname);
									}
								}
							}
						} catch (e) {}
						return ret;
					};
				}
			} catch (e) {}
			// 每局结束重置祈愿结果，防跨局残留误创建按钮
			(lib.onover = lib.onover || []).push(function() {
				window._gfqyWish = null;
				window._gfqyBdWish = null;
				window._gfqyButtonDone = false;
				window._gfqyBroadcastDone = false;
				window._gfqyBackdoorDone = false;
				window._gfqyDoPick = null;
				window._gfqyRandRetry = 0;
				if (window._gfqyPickTimer) { clearTimeout(window._gfqyPickTimer); window._gfqyPickTimer = null; }
				if (window._gfqyRetryTimer) { clearInterval(window._gfqyRetryTimer); window._gfqyRetryTimer = null; }
			});
		}

		return { init: init, utils: utils };
	})();
	window.SyncModule = SyncModule;
	window.gflib = {
		SyncModule: SyncModule,
		utils: SyncModule.utils
	};
	!window.SyncModule._initialized && (
		window.SyncModule.init(),
		window.SyncModule._initialized = true
	);
	// 非常非常非常非常感谢源·天将士允许我搬运，致敬，我在此基础上做了一些修改。
	
	if (!lib) lib = {};
	if (!lib.gflib_custom) lib.gflib_custom = {};
	if (!lib.gflib_custom.mp) lib.gflib_custom.mp = [];
	if (!lib.gflib_custom.tongling) lib.gflib_custom.tongling = [];
	if (!lib.gflib_custom.TonglingSuccess) lib.gflib_custom.TonglingSuccess = 0;

	// frozen冻结
	if (!lib.gflib_custom.frozen) lib.gflib_custom.frozen = [];
	if (!lib.element) lib.element = {};
	if (!lib.element.player) lib.element.player = {};
	if (!lib.element.player.inits) lib.element.player.inits = [];
	if (!lib.arenaReady) lib.arenaReady = [];
	if (!lib.gflib_version) {
		lib.onprepare.push(function () {
			game.gflib_loadData();
			window.lib = lib;
			window.game = game;
			window.get = get;
		});
	}
	if (lib.gflib_version && lib.gflib_version >= gflib_version) return;
	lib.gflib_version = gflib_version;
	game.gflib_loadData = function () {
		initShipei(lib, game, ui, get, ai, _status, datasrc);
		lib.element.player.inits.add(function (player) {
			player.gflib_mp = 0;
			player.gflib_maxMp = 0;
			player.loadMpConfig = function () {
				const mpConfigFunc = lib.gflib_custom.mp.find(configFunc => configFunc(this));
				if (mpConfigFunc) {
					const { gflib_mp, gflib_maxMp, color = 'linear-gradient(#4CAF50, #8BC34A)' } = mpConfigFunc(this);
					this.gflib_mp = gflib_mp;
					this.gflib_maxMp = gflib_maxMp;
					if (this.node?.gflib_mpFill) {
						this.node.gflib_mpFill.style.width = `${(this.gflib_mp / this.gflib_maxMp) * 100}%`;
						this.node.gflib_mpFill.style.background = color;
					}
				}
			};
			player.loadMpConfig();
		});

		lib.element.player.inits.add(function (player) {
			player.gflib_tongling = 0;
			player.gflib_maxTongling = 0;
			player.TonglingSuccess = 0;
			player.loadTonglingConfig = function () {
				const tonglingConfigFunc = lib.gflib_custom.tongling.find(configFunc => configFunc(this));
				if (tonglingConfigFunc) {
					const { gflib_tongling, gflib_maxTongling } = tonglingConfigFunc(this);
					this.gflib_tongling = gflib_tongling;
					this.gflib_maxTongling = gflib_maxTongling;
					this.gflib_updateTonglingUI();
				}
			};
		});

		lib.element.player.inits.add(function (player) {
			player.gflib_frozen = 0;
			player.gflib_maxFrozen = 0;
			player.FrozenSuccess = 0;
			player.loadFrozenConfig = function () {
				const frozenConfigFunc = lib.gflib_custom.frozen.find(configFunc => configFunc(this));
				if (frozenConfigFunc) {
					const { gflib_frozen, gflib_maxFrozen } = frozenConfigFunc(this);
					this.gflib_frozen = gflib_frozen;
					this.gflib_maxFrozen = gflib_maxFrozen;
					this.gflib_updateFrozenUI();
				}
			};
		});

		lib.element.player.inits.add(function (player) {
			player.gfYongchangImgName = [];
			player.gfYongchangSkillName = [];
		});

		// 静默移牌
		lib.element.player.gf_silentGain = function (cards, ...args) {
			const evt = this.gain(cards, ...args);
			evt._triggered = null;
			return evt;
		};
		lib.element.player.gf_silentLose = function (cards, ...args) {
			const evt = this.lose(cards, ...args);
			evt._triggered = null;
			return evt;
		};
		lib.element.player.gf_silentLoseAsync = function (...args) {
			const evt = game.loseAsync(...args);
			evt._triggered = null;
			return evt;
		};
		lib.element.player.gf_silentUse = function (card, target) {
			const evt = this.useCard(card, target);
			if (evt && evt._triggered !== undefined) evt._triggered = null;
			return evt;
		};
		// 全状态快照与还原
		lib.element.player.gf_cardInfo = function (c) {
			if (!c) return null;
			return {
				name: c.name,
				suit: c.suit,
				number: c.number,
				nature: c.nature
			};
		};
		lib.element.player.gf_cardSame = function (a, b) {
			if (!a || !b) return false;
			return a.name == b.name && a.suit == b.suit && a.number == b.number && a.nature == b.nature;
		};
		lib.element.player.gf_stateRecord = function () {
			const p = this;
			const snap = {
				hp: p.hp,
				maxHp: p.maxHp,
				hujia: p.hujia,
				sex: p.sex,
				group: p.group,
				disabledSlots: JSON.parse(JSON.stringify(p.disabledSlots || {})),
				equips: p.getEquips().map(c => {
					const i = p.gf_cardInfo(c);
					i.slot = (c.equipSlots && c.equipSlots[0]) || (get.subtypes ? get.subtypes(c)[0] : c.subtype);
					return i;
				}),
				hand: p.getCards("h").map(c => p.gf_cardInfo(c)),
				special: p.getCards("s").map(c => p.gf_cardInfo(c)),
				marks: {},
				tempSkills: Object.keys(p.tempSkills || {}).slice(),
				awakened: (p.awakenedSkills || []).slice(),
				limitedUsed: {},
				storage: {}
			};
			for (const k in p.marks) {
				snap.marks[k] = p.countMark(k);
			}
			const skills = p.getSkills();
			for (const sk of skills) {
				const info = get.info(sk);
				if (info && info.limited) {
					snap.limitedUsed[sk] = !!p.storage[sk];
				}
			}
			for (const k in p.storage) {
				if (k == "gf_fullSnap") continue;
				const v = p.storage[k];
				if (typeof v == "number" || typeof v == "string" || typeof v == "boolean" || Array.isArray(v)) {
					snap.storage[k] = JSON.parse(JSON.stringify(v));
				}
			}
			p.storage.gf_fullSnap = snap;
			return snap;
		};
		lib.element.player.gf_stateRestore = async function () {
			const p = this;
			const snap = p.storage.gf_fullSnap;
			if (!snap) return;
			try {
				if (typeof snap.maxHp == "number" && p.maxHp != snap.maxHp) {
					p.maxHp = snap.maxHp;
					p.update();
				}
				if (typeof snap.hp == "number" && p.hp != snap.hp) {
					p.hp = snap.hp;
					p.update();
				}
				if (typeof snap.hujia == "number" && p.hujia != snap.hujia) {
					try { p.changeHujia(snap.hujia - p.hujia); } catch (e) {}
				}
				const curDis = JSON.parse(JSON.stringify(p.disabledSlots || {}));
				const recDis = snap.disabledSlots || {};
				for (const slot in recDis) {
					if (!curDis[slot] && recDis[slot] > 0) { try { p.enableEquip(slot); } catch (e) {} }
				}
				for (const slot in curDis) {
					if (!recDis[slot] && curDis[slot] > 0) { try { p.disableEquip(slot); } catch (e) {} }
				}
				const recEquips = {};
				for (const c of (snap.equips || [])) {
					if (c.slot) (recEquips[c.slot] = recEquips[c.slot] || []).push(c);
				}
				const curEquips = {};
				for (const c of p.getEquips()) {
					const slot = (c.equipSlots && c.equipSlots[0]) || (get.subtypes ? get.subtypes(c)[0] : c.subtype);
					(curEquips[slot] = curEquips[slot] || []).push(c);
				}
				const allSlots = new Set([...Object.keys(recEquips), ...Object.keys(curEquips)]);
				for (const slot of allSlots) {
					for (const c of (curEquips[slot] || [])) { try { c.discard(); p.removeEquipTrigger(c); } catch (e) {} }
					for (const info of (recEquips[slot] || [])) {
						try {
							const card = game.createCard(info.name, info.suit, info.number, info.nature);
							p.$equip(card);
						} catch (e) {}
					}
				}
				const curHand = p.getCards("h");
				const recHand = snap.hand || [];
				const handSame = curHand.length == recHand.length && curHand.every((c, i) => p.gf_cardSame(p.gf_cardInfo(c), recHand[i]));
				if (!handSame) {
					const dh = curHand.slice();
					if (dh.length) { try { await p.discard(dh); } catch (e) {} }
					const gain = [];
					for (const info of recHand) {
						try { gain.push(game.createCard(info.name, info.suit, info.number, info.nature)); } catch (e) {}
					}
					if (gain.length) await p.gf_silentGain(gain);
				}
				const curSp = p.getCards("s");
				const recSp = snap.special || [];
				const spSame = curSp.length == recSp.length && curSp.every((c, i) => p.gf_cardSame(p.gf_cardInfo(c), recSp[i]));
				if (!spSame) {
					const ds = curSp.slice();
					if (ds.length) { try { for (const c of ds) c.discard(); } catch (e) {} }
					const gain = [];
					for (const info of recSp) {
						try { gain.push(game.createCard(info.name, info.suit, info.number, info.nature)); } catch (e) {}
					}
					if (gain.length) await p.gf_silentGain(gain);
				}
				for (const k in snap.marks) {
					const cur = p.countMark(k);
					const rec = snap.marks[k] || 0;
					if (cur != rec) {
						if (cur > rec) { try { p.removeMark(k, cur - rec, false); } catch (e) {} }
						else { try { p.addMark(k, rec - cur, false); } catch (e) {} }
					}
				}
				const curTemp = Object.keys(p.tempSkills || {});
				for (const sk of (snap.tempSkills || [])) {
					if (!curTemp.includes(sk)) { try { p.addTempSkill(sk); } catch (e) {} }
				}
				for (const sk of curTemp) {
					if (!(snap.tempSkills || []).includes(sk)) { try { p.removeTempSkill(sk); } catch (e) {} }
				}
				const curAw = (p.awakenedSkills || []).slice();
				for (const sk of (snap.awakened || [])) {
					if (!curAw.includes(sk)) { try { p.awakenSkill(sk); } catch (e) {} }
				}
				for (const sk of curAw) {
					if (!(snap.awakened || []).includes(sk)) { try { if (p.unawakenSkill) p.unawakenSkill(sk); } catch (e) {} }
				}
				for (const sk in (snap.limitedUsed || {})) {
					const rec = snap.limitedUsed[sk];
					const cur = !!p.storage[sk];
					if (rec && !cur) { p.storage[sk] = true; try { p.markSkill(sk); } catch (e) {} }
					else if (!rec && cur) { delete p.storage[sk]; try { p.unmarkSkill(sk); } catch (e) {} }
				}
				for (const k in (snap.storage || {})) {
					const rec = snap.storage[k];
					const cur = p.storage[k];
					if (JSON.stringify(cur) !== JSON.stringify(rec)) {
						p.storage[k] = JSON.parse(JSON.stringify(rec));
					}
				}
			} catch (e) {
				console.log("gf_stateRestore error:", e);
			}
		};
		lib.arenaReady.push(function () {
			game.players.forEach(player => {
				const mpBar = ui.create.div('.gflib_mp_bar', player.node);
				mpBar.style.width = '80px';
				mpBar.style.height = '8px';
				mpBar.style.backgroundColor = '#eee';
				mpBar.style.borderRadius = '4px';
				mpBar.style.marginTop = '4px';
				mpBar.style.zIndex = '10';
				const mpFill = ui.create.div('.gflib_mp_fill', mpBar);
				mpFill.style.height = '100%';
				mpFill.style.borderRadius = '4px';
				player.gflib_mpBar = mpBar;
				player.gflib_mpFill = mpFill;
				if (player.loadMpConfig) player.loadMpConfig();
			});
		});
	};
	// 房主有神器
	function gf_shenqiOn() {
		return !!game.getExtensionConfig('鸽府包', 'gfb_fzysq');
	}
	// 白名单昵称(非房主的控制权没有房主大，主要还是得房主点)
	const gf_shenqiWhiteList = ['Mimi'];
	// 读本机联机昵称
	function gf_shenqiNickname() {
		if (game.me && game.me.nickname) return game.me.nickname;
		return typeof get.connectNickname === 'function' ? get.connectNickname() : '';
	}
	function gf_shenqiInWhiteList() {
		if (!_status.connectMode) return false;
		const name = gf_shenqiNickname();
		return !!name && gf_shenqiWhiteList.includes(name);
	}
	// 判定本机是不是联机房主
	function gf_shenqiIsHost() {
		if (!_status.connectMode) return false;
		if (game.onlineroom) return true;
		if (game.onlinezhu === true) return true;
		if (game.onlinezhu && game.onlineID && game.onlinezhu == game.onlineID) return true;
		if (lib.node && Array.isArray(lib.node.clients)) return true;
		return false;
	}
	// 房主或白名单都算有使用权
	function gf_shenqiAllow() {
		return gf_shenqiIsHost() || gf_shenqiInWhiteList();
	}
	// 作废当前一切结算from是点按钮的人昵称
	function gf_shenqiInterrupt(from) {
		try {
			if (_status.event && _status.event.next) _status.event.next.length = 0;
		} catch (e) {}
		try {
			if (lib.node && lib.node.torespond) {
				const ids = Object.keys(lib.node.torespond);
				for (let i = 0; i < ids.length; i++) {
					let p = (lib.playerOL && lib.playerOL[ids[i]]) || null;
					if (!p && game.players) p = game.players.find(x => x.playerid == ids[i]);
					try {
						clearTimeout(lib.node.torespondtimeout[ids[i]]);
					} catch (e) {}
					if (p) {
						try {
							p.unwait('ai');
						} catch (e) {}
						try {
							p.hideTimer();
						} catch (e) {}
					}
				}
			}
		} catch (e) {}
		try {
			if (_status.paused) {
				game.uncheck();
				game.resume();
			}
		} catch (e) {}
		try {
			if (_status.paused && _status.imchoosing && !_status.auto) ui.click.auto();
		} catch (e) {}
		try {
			game.log('【房主有神器】' + (from || '未知玩家') + '强制打断了当前所有结算并令游戏继续运行');
		} catch (e) {}
	}
	function gf_shenqiRefresh() {
		if (!ui.system1 && !ui.system2) return;
		if (gf_shenqiOn() && gf_shenqiAllow()) {
			if (ui.gfHostShenqi) return;
			let btn;
			btn = ui.create.system('房主有神器', function () {
				if (!gf_shenqiAllow()) return;
				if (gf_shenqiIsHost()) {
					gf_shenqiInterrupt(gf_shenqiNickname() || '房主');
				} else if (game.online) {
					game.send('gf_shenqi_interrupt');
				} else {
					return;
				}
				try {
					btn.classList.add('glow');
					setTimeout(function () {
						btn.classList.remove('glow');
					}, 400);
				} catch (e) {}
			});
			ui.gfHostShenqi = btn;
		} else if (ui.gfHostShenqi) {
			try {
				ui.gfHostShenqi.delete();
			} catch (e) {}
			delete ui.gfHostShenqi;
		}
	}
	if (!lib.message.server) lib.message.server = {};
	lib.message.server.gf_shenqi_interrupt = function () {
		let p = (lib.playerOL && lib.playerOL[this.id]) || null;
		if (!p && game.players) p = game.players.find(x => x.playerid == this.id) || null;
		const name = (p && p.nickname) || '';
		if (!name || gf_shenqiWhiteList.includes(name)) gf_shenqiInterrupt(name || ('玩家' + this.id));
	};
	lib.gf_shenqiRefresh = gf_shenqiRefresh;
	setInterval(gf_shenqiRefresh, 1);
}
