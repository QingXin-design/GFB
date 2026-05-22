import { lib, game, ui, get, ai, _status } from '../../../noname.js';
import { initShipei } from './shipei.js';

let gflib_version = 46;
export function gflib(lib, game, ui, get, ai, _status, datasrc) {
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
						//会赢吗？会赢的！
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
			let isCalculated = false;
			const timeoutTimer = setTimeout(() => {
				if (isCalculated) return;
				console.warn("3秒，使用已同步数据");
				forceExtractAndCalculate();
			}, 3000);
			window.clskDataMap = window.clskDataMap || Object.create(null);
			if (!window._clskProxyFlag) {
				window._clskProxyFlag = true;
				window.clskDataMap = new Proxy(window.clskDataMap, {
					set(target, pid, playerData) {
						if (typeof pid !== 'string' && typeof pid !== 'number') return true;
						target[pid] = playerData;
						console.log(`玩家${pid}数据已同步，关键词：${playerData.extension_鸽府包_ljqy}`);
						extractPlayerData();
						return true;
					}
				});
			}
			function extractPlayerData() {
				if (isCalculated) return;
				let allPlayersData = [];
				console.log("最新同步玩家数据");
				Object.keys(window.clskDataMap).forEach(pid => {
					if (pid === '_isProxy' || pid === '_proto_') return;
					const playerData = window.clskDataMap[pid];
					allPlayersData.push({ uid: pid, data: playerData });
					console.log("玩家ID：", pid);
					console.log("关键词：", playerData.extension_鸽府包_ljqy);
				});
				const realRoomPlayerCount = game.players.filter(p => p?.playerid).length;
				if (allPlayersData.length !== realRoomPlayerCount) {
					console.log(`已同步${allPlayersData.length+1}/${realRoomPlayerCount}玩家数据`);
					return;
				}
			}
			function forceExtractAndCalculate() {
				if (isCalculated) return;
				let allPlayersData = Object.keys(window.clskDataMap)
					.filter(pid => pid !== '_isProxy')
					.map(pid => ({
						uid: pid,
						data: window.clskDataMap[pid]
					}));
				if (allPlayersData.length === 0) {
					console.error("无任何玩家数据同步！");
					return;
				}
				calculateResult(allPlayersData);
			}
			function calculateResult(allPlayersData) {
				isCalculated = true;
				clearTimeout(timeoutTimer);
				console.log("鸽府祈愿数据同步完成，开始计算结果");
				const qysyGlobal = lib?.config?.extension_鸽府包_qysy ?? { win: 0, lose: 0 };
				allPlayersData.forEach((player, index) => {
					const playerData = window.clskDataMap[player.uid] || {};
					const pq = playerData.extension_鸽府包_qysy ?? { win: 0, lose: 0 };
					console.log(`玩家${index+1} | UID: ${player.uid} | win: ${pq.win} | lose: ${pq.lose}`);
				});
				const eligiblePlayers = allPlayersData.filter(player => {
					const playerData = window.clskDataMap[player.uid] || {};
					const playerQysy = playerData.extension_鸽府包_qysy ?? { win: 0, lose: 0 };
					return true;
				});
				if (!eligiblePlayers || eligiblePlayers.length === 0) {
					console.error("没有满足连胜/连负条件的玩家！");
					return;
				}
				const rand = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
				const keyword = rand.data?.extension_鸽府包_ljqy ?? "";
				console.log("随机选中玩家ID：", rand.uid);
				console.log("随机选中关键词：", keyword);
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
				if(!lib.config.extension_鸽府包_gfb_consoleClear){
					console.clear();
				}
				game.broadcastAll(function (me, list, randuid){
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
				}, null, _status.gfqyList || [] , window.randuid);
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
	//清空所有视频
	lib.element.player.clearGFAllVideo = function () {
		if (window._current_GF_Video) {
			window._current_GF_Video.remove();
			window._current_GF_Video = null;
		}
		document.querySelectorAll('.cg').forEach(el => el.remove());
	};
	//中屏视频
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
	//清空中屏视频
	lib.element.player.clearGFZhongVideo = function () {
		if (window._current_GF_Video) {
			window._current_GF_Video.remove();
			window._current_GF_Video = null;
		}
	};
	//电流GIF动画
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
	//清空电流动画
	lib.element.player.clearGFdianliu = function () {
		if (window._current_GF_Video) {
			window._current_GF_Video.remove();
			window._current_GF_Video = null;
		}
	};
	let GF_isPlayingBgm = false;
	let GF_currentBgm = null;
	const GF_music = {
		lock: false,
		enable() { try { this.lock = true; } catch (e) {} },
		disable() { try { this.lock = false; } catch (e) {} }
	};
	const GF_audioLock = {
		lockedBy: null,
		lock(characterName) {
			if (!this.lockedBy) {
				this.lockedBy = characterName;
				return true;
			}
			return this.lockedBy === characterName;
		},
		unlock(characterName) {
			if (this.lockedBy === characterName) this.lockedBy = null;
		}
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
	lib.element.player.GF_playBgm = async function (characterName, force = true) {
		if (!force && GF_audioLock.lockedBy && GF_audioLock.lockedBy !== characterName) return;
		if (GF_currentBgm && GF_currentBgm.character === characterName) GF_currentBgm.abort = true;
		const bgmPath = lib.assetURL + "extension/鸽府包/audio/bgm/" + characterName + ".mp3";
		const bgmExists = await this.GF_checkResourceExists(bgmPath);
		if (!bgmExists) return;
		const task = { abort: false, character: characterName };
		GF_currentBgm = task;
		GF_isPlayingBgm = true;
		try {
			const audio = ui.backgroundMusic;
			game.broadcastAll(() => {
				if (!lib.config.originalGFBgmSrc && ui.backgroundMusic.src) {
					lib.config.originalGFBgmSrc = ui.backgroundMusic.src;
				}
			});
			await new Promise(resolve => setTimeout(resolve, 50));
			GF_music.enable();
			game.broadcastAll((path) => {
				const a = ui.backgroundMusic;
				a.src = path;
				a.loop = true;
				a.preload = "auto";
				a.load();
			}, bgmPath);
			await new Promise((resolve) => {
				if (audio.readyState >= 4) return resolve();
				audio.addEventListener('canplaythrough', resolve, { once: true });
				setTimeout(resolve, 8000);
			});
			if (task.abort) return;
			GF_audioLock.lock(characterName);
			game.broadcastAll(() => {
				ui.backgroundMusic.play().catch(() => {});
			});
		} catch (e) {
			console.warn('BGM播放失败:', e);
			GF_audioLock.unlock(characterName);
		} finally {
			if (GF_currentBgm === task) {
				GF_currentBgm = null;
				GF_isPlayingBgm = false;
			}
		}
	};
	// 切换背景
	// 先删背景再替换
	/*lib.element.player.GF_changeBackground = async function (characterName) {
		try {
			const bgPath = lib.assetURL + "extension/鸽府包/image/animation/" + characterName + ".mp4";
			const bgExists = await this.GF_checkResourceExists(bgPath);
			if (!bgExists) return;
			game.broadcastAll(async (name) => {
				const url = lib.assetURL + "extension/鸽府包/image/animation/" + name + ".mp4";
				document.querySelectorAll('video.gf-bg-video').forEach(el => el.remove());
				const video = document.createElement('video');
				video.classList.add('gf-bg-video');
				video.style.cssText = `position: fixed; left: 0; top: 0; width: 100%; height: 100%;object-fit: cover; z-index: -1; opacity: 0; transition: opacity 0.3s linear; pointer-events: none;`;
				video.src = url;
				video.loop = true;
				video.muted = true;
				video.playsInline = true;
				video.setAttribute("playsinline", "");
				video.setAttribute("webkit-playsinline", "");
				video.preload = "auto";
				document.body.appendChild(video);
				video.addEventListener('canplaythrough', () => {
					video.play().catch(() => {});
					setTimeout(() => video.style.opacity = "1", 50);
				}, { once: true });
				setTimeout(() => video.play().catch(() => {}), 100);
			}, characterName);
		} catch (e) {}
	};*/
	// 直接切换背景
	lib.element.player.GF_changeBackground = async function (characterName) {
		try {
			const bgPath = lib.assetURL + "extension/鸽府包/image/animation/" + characterName + ".mp4";
			const bgExists = await this.GF_checkResourceExists(bgPath);
			if (!bgExists) return;
			game.broadcastAll(async (name) => {
				const url = lib.assetURL + "extension/鸽府包/image/animation/" + name + ".mp4";
				const root = document.createElement('div');
				root.style.cssText = `
					position: fixed;
					left: 0;
					top: 0;
					width: 100%;
					height: 100%;
					z-index: -1;
					pointer-events: none;
					overflow: hidden;
					opacity: 0;
					transition: opacity 0.3s linear;
				`;
				root.classList.add('gf-bg-video-root');
				// 创建视频
				const video = document.createElement('video');
				video.classList.add('gf-bg-video');
				video.style.cssText = `
					position: absolute;
					left: 0;
					top: 0;
					width: 100%;
					height: 100%;
					object-fit: cover;
				`;
				video.src = url;
				video.loop = true;
				video.muted = true;
				video.playsInline = true;
				video.setAttribute("playsinline", "");
				video.setAttribute("webkit-playsinline", "");
				video.preload = "auto";
				// 先把结构组装好
				root.appendChild(video);
				document.body.appendChild(root);
				video.addEventListener('canplaythrough', () => {
					video.play().catch(() => {});
					void video.offsetWidth;
					root.style.opacity = "1";
				}, { once: true });
				setTimeout(() => {
					video.play().catch(() => {});
				}, 100);
			}, characterName);
		} catch (e) {
			console.warn('GF_changeBackground 失败', e);
		}
	};
	// BGM与背景一起播放
	lib.element.player.GFBgmAndBg = async function (characterName) {
		await Promise.all([
			this.GF_playBgm(characterName, true),
			this.GF_changeBackground(characterName)
		]);
	};
	// 解锁BGM
	lib.element.player.GF_unlockBgm = function (characterName = null) {
		if (GF_currentBgm) {
			if (!characterName || GF_currentBgm.character === characterName) {
				GF_currentBgm.abort = true;
				GF_audioLock.unlock(GF_currentBgm.character);
				GF_currentBgm = null;
			}
		}
		GF_isPlayingBgm = false;
		GF_music.disable();
	};
	lib.element.player.closeGFBgm = function () {
		try {
			this.GF_unlockBgm();
			game.broadcastAll(() => {
				const audio = ui.backgroundMusic;
				if (!audio || !lib.config.originalGFBgmSrc) return;
				audio.pause();
				audio.src = lib.config.originalGFBgmSrc;
				audio.loop = true;
				audio.load();
				audio.play().catch(() => {});
			});
			GF_audioLock.unlock(null);
		} catch (e) {
			console.warn("closeGFBgm错误", e);
		}
	};
	// 清除背景
	lib.element.player.clearGFBackground = function () {
		try {
			game.broadcastAll(() => {
				if (ui.background.stopVideo) ui.background.stopVideo();
				document.querySelectorAll('video.gf-bg-video').forEach(v => v.remove());
			});
		} catch (e) {}
	};
	// 重置所有
	lib.element.player.resetGFAll = function () {
		this.closeGFBgm();
		this.clearGFBackground();
	};
	//全屏CG
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
		const maxFrozen = this.hp * 2;
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
				const cfg = { name: gfMianJuData.originalName || "未知角色" };
				const character = cfg.name;
				const translateKeys = ["", "_prefix", "_ab"].map((str) => lib.translate[cfg.name + str]);
				const prefixKey = translateKeys[1] || "";
				const prefixConfig = lib.namePrefix.get(prefixKey) || {};
				const showPrefix = prefixConfig.showName || "";
				const prefixColor = prefixConfig.color || "#FFFFFF";
				const originalNameRaw = gfMianJuData.originalName;
				const translatedName = get.translation(originalNameRaw) || originalNameRaw;
				let cleanedName = translatedName;
				if (prefixKey && cleanedName.startsWith(prefixKey)) {
					cleanedName = cleanedName.slice(prefixKey.length);
				}
				cleanedName = cleanedName || translatedName;
				let finalName = cleanedName;
				if (showPrefix) {
					finalName = `<span style="color:${prefixColor}">${showPrefix}</span>${cleanedName}`;
					player.rawName = `${showPrefix}${cleanedName}`;
				} else {
					player.rawName = cleanedName;
				}
				game.broadcastAll( function (targetPlayer, char, name2) {
					if (targetPlayer.node?.avatar && typeof targetPlayer.node.avatar.setBackground == "function") {
						targetPlayer.node.avatar.setBackground(char, "character");
					}
					if (targetPlayer.node?.name) {
						targetPlayer.node.name.innerHTML = name2;
					}
				}, player, character, finalName );
			} catch (e) {}
			const skillName = "gf_mianju";
			if (lib.skill[skillName]) {
				lib.skill[skillName].fixed = false;
			}
			player.removeSkill(skillName);
			player.storage.gf_mianju = [];
		},
	},
	lib.element.player.gfMianJu = function(cfg) {
		if (!cfg || !cfg.name) {
			return false;
		}
		try {
			this.storage.gf_mianju = {
				originalName: this.name || "未知角色",
				originalHp: this.hp || 0,
				originalMaxHp: this.maxHp || 0,
				originalHujia: this.hujia || 0,
				originalGroup: this.group || [],
				originalSex: this.sex || [],
				originalSkills: [...this.skills]
			};
			this.hp = parseFloat(cfg.hp) || 1;
			this.changeHp(0)._triggered = null;
			this.maxHp = parseFloat(cfg.maxHp) || 1;
			this.hujia = parseFloat(cfg.hujia) || 0;
			this.group = cfg.group;
			this.sex = cfg.sex;
			this.clearSkills();
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
			const glowStyle = `
				background: linear-gradient(90deg, #ff0000, #ff9900, #ffff00, #33ff00, #0099ff, #6633ff, #cc00ff);
				background-size: 600% 100%;
				-webkit-background-clip: text;
				background-clip: text;
				color: transparent;
				animation: glow 3s ease infinite;
			`;
			const translateKeys = ["", "_prefix", "_ab"].map((str) => lib.translate[cfg.name + str]);
			const prefixKey = translateKeys[1] || "";
			const fixedPrefix = "面具";
			const originalNameRaw = cfg.name;
			const translatedName = get.translation(originalNameRaw) || originalNameRaw;
			let cleanedName = translatedName;
			if (prefixKey && cleanedName.startsWith(prefixKey)) {
				cleanedName = cleanedName.slice(prefixKey.length);
			}
			cleanedName = cleanedName || translatedName;
			let finalName = cleanedName;
			if (fixedPrefix) {
				finalName = `<span style="${glowStyle}">${fixedPrefix}</span>${cleanedName}`;
				this.rawName = `${fixedPrefix}${cleanedName}`;
			} else {
				this.rawName = cleanedName;
			}
			cfg.skill = cfg.skill || _status.event.name;
			const list = cfg.caption ? [cfg.caption] : translateKeys;
			const character = cfg.name;
			game.broadcastAll( function (targetPlayer, char, name2) {
				if (!document.querySelector("#glowAnimationStyle")) {
					const style = document.createElement("style");
					style.id = "glowAnimationStyle";
					style.innerHTML = `
						@keyframes glow {
							0% { background-position: 0% 50%; }
							50% { background-position: 100% 50%; }
							100% { background-position: 0% 50%; }
						}
					`;
					document.head.appendChild(style);
				}
				if (targetPlayer.node?.avatar && typeof targetPlayer.node.avatar.setBackground == "function") {
					targetPlayer.node.avatar.setBackground(char, "character");
				}
				if (targetPlayer.node?.name) {
					targetPlayer.node.name.innerHTML = name2;
					targetPlayer.node.name.style.animation = 'none';
					setTimeout(() => {
						targetPlayer.node.name.style.animation = '';
					}, 0);
				}
			}, this, character, finalName );
			return true;
		} catch (e) {
			return false;
		}
	};
	lib.element.player.outSkill = function () {
		if (!this.classList.contains("outSkill")) {
          	this.classList.add("outSkill");
      	}
	}
	lib.element.player.chooseToDiscard = function () {
		var next = game.createEvent("chooseToDiscard");
		next.player = this;
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
		for (var i = 0; i < arguments.length; i++) {
			if (get.itemtype(arguments[i]) == "player") {
				next.source = arguments[i];
			} else if (typeof arguments[i] == "number") {
				next.num = Math.floor(arguments[i]);
			} else if (typeof arguments[i] == "boolean") {
				next.animate = arguments[i];
			} else if (arguments[i] == "nodelay") {
				next.animate = false;
				next.$draw = true;
			} else if (arguments[i] == "visible") {
				next.visible = true;
			} else if (arguments[i] == "bottom") {
				next.bottom = true;
			} else if (typeof arguments[i] == "object" && arguments[i] && arguments[i].drawDeck != undefined) {
				next.drawDeck = arguments[i].drawDeck;
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
		next.gaintag = [];
		return next;
	};
	window.gfDouDong = function (zhen = 15, chixu = 800) {
		let root = document.getElementById('game') || document.querySelector('.game') || document.body;
		if (root == document.body) {
			root = document.querySelector('.game-content') || document.querySelector('.content') || root;
		}
		zhen = Math.min(Math.max(zhen, 3), 500); //频率3~500ms
		chixu = Math.min(Math.max(chixu, 100), 10000); //持续100~10000ms
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
	//感谢御.sky提供的代码支持（生成傀儡并他们），致敬！
	Object.assign(game, {
		gf_swapPlayerOL(player, target) {
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

			game.broadcastAll((player, target, playerid, targetid) => {
				const handleBroadcast = () => {
					if ([player, target].includes(game.me)) {
						const source = game.me == target ? player : target;
						const sourceid = game.me == target ? playerid : targetid;

						game.swapPlayerAuto(source);
						game.onlineID = game.wsid = sourceid;

						if (!_status.auto) {
							ui.click.auto('forced');
							ui.click.auto('forced');
						};
					};
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
				handleBroadcast();
				swapCoreData();
			}, player, target, playerid, targetid);
		}
	});
	
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
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 75;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .gefu_beijing {
        position: relative;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        box-shadow: 0 0 15px rgba(69, 162, 252, 0.5) inset;
        border: 1px solid rgba(69, 162, 252, 0.6);
        outline: 1px solid rgba(69, 162, 252, 0.4);
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(69, 162, 252, 0.6),
                    0 0 20px rgba(69, 162, 252, 0.3);
        color: #e2e8f0;
        padding: 15px;
        padding-top: 35px;
        font-size: 14px;
        line-height: 1.5;
        pointer-events: auto;
        width: 256px;
        height: 192px;
        overflow-y: auto;
        overflow-x: hidden;
        word-wrap: break-word;
        transition: all 0.3s ease;
      }
      .gefu_close_btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(255, 69, 69, 0.8);
        color: white;
        text-align: center;
        line-height: 20px;
        font-size: 12px;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
      }
      .gefu_close_btn:hover {
        background: rgba(255, 69, 69, 1);
        transform: scale(1.1);
      }
      .gefu_beijing:hover {
        box-shadow: 0 0 15px rgba(69, 162, 252, 0.8),
                    0 0 30px rgba(69, 162, 252, 0.5);
        border-color: rgba(69, 162, 252, 0.5);
      }
      .gefu_beijing::-webkit-scrollbar {
        width: 8px;
      }
      .gefu_beijing::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #45a2fc, #00f2fe);
        border-radius: 4px;
        border: 1px solid rgba(0,0,0,0.2);
      }
      .gefu_beijing::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.05);
        border-radius: 4px;
      }
      .gefu_beijing::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg, #45a2fc, #00f2fe, #45a2fc);
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }
    `;
			document.head.appendChild(style);
		}
		var tipname = text;
		var dibeijing = ui.create.div('.gefu_tip', document.body);
		var skilltip = ui.create.div('.gefu_beijing', dibeijing);
		skilltip.innerHTML = tipname;
		var closeBtn = ui.create.div('.gefu_close_btn', skilltip);
		closeBtn.textContent = '×';
		closeBtn.listen(function (e) {
			e.stopPropagation();
			dibeijing.remove();
		});
		dibeijing.listen(function (e) {
			e.stopPropagation();
			this.remove();
		});
		if (isTemp) {
			setTimeout(function () {
				dibeijing.remove();
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
			if (skillObj && skillObj.GFshunfaSkill === true) {
				if (skillObj && skillObj.GFshunfaSkill === true) {
					skillObj.clickable = function(player) {
						if (!player.isUnderControl(true)) return;
						const action = lib.skill[skillName].getAct(player);
						if (action instanceof Promise) {
							action.then(() => {});
						} else {
							lib.skill[skillName].doAction(player);
						}
					};
					skillObj.getAct = function(player) {
						if (game.online) {
							return game.requestSkillData(skillName, "gfShunfaAction", 10000);
						}
						return true;
					};
					skillObj.sync = {
						gfShunfaAction(client) {
							lib.skill[skillName].doAction(client);
							return true;
						},
					};
				}
			}
			target[skillName] = skillObj;
			return true;
		}
	});

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
			CHECK_INTERVAL: 200,
			SYNC_DELAY: 3000,
			TRIGGER_KEYS: ["room", "sync", "join"]
		};
		let isTriggered = false;
		let roomCheckTimer = null;
		window.clskDataMap = window.clskDataMap || Object.create(null);
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
				};
			},
			sendMsg: function(type, ...args) {
				try {
					if (game?.send) game.send(type, ...args);
				} catch (e) {}
			}
		};
		function initRoomCheck() {
			if (window.suiRoomTrigger) return;
			window.suiRoomTrigger = true;
			roomCheckTimer = setInterval(function() {
				const isRoomReady = !!game?.roomId && !!game?.me;
				if (isRoomReady) {
					clearInterval(roomCheckTimer);
					const uid = utils.getUid();
					if (!uid) return;
					const data = utils.getHeroData();
					window.clskDataMap[uid] = data;
					utils.sendMsg(CONFIG.MSG_TYPE, uid, data);
				}
			}, CONFIG.CHECK_INTERVAL);
		}
		function registerMsgHandlers() {
			lib.message.server[CONFIG.MSG_TYPE] = function(uid, data) {
				if (!uid || !data) return;
				window.clskDataMap[uid] = data;
			};
			lib.message.client[CONFIG.MSG_TYPE] = function(uid, data) {
				if (!uid || !data) return;
				window.clskDataMap[uid] = data;
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
					window.clskDataMap[uid] = data;
					utils.sendMsg(CONFIG.MSG_TYPE, uid, data);
				}
			};
		}
		function init() {
			initRoomCheck();
			registerMsgHandlers();
			initWebSocketListener();
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
	//非常非常非常非常感谢源·天将士允许我搬运，致敬，我在此基础上做了一些修改。
	
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
			// 冻结
			player.gflib_frozen = 2;
			player.gflib_updateFrozenUI();
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
}
