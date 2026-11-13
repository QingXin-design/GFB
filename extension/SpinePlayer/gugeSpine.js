import { lib, game, ui, get } from "../../../../noname.js";
import { FX_REG, FX_CAT_CN } from "./fx/fxReg.js";
import { attachDecadeAvatar, attachDecadeStage, preloadDecade, loadSpineRuntime } from "./decadeAvatar.js";

//动皮以及特效有需要可以搬运，标注来源即可
//无职转生的特效是我购买的，如果有需要标注来源就好\awa/
const DIR = "extension/鸽府包/extension/SpinePlayer";
const LIB = DIR + "/lib";
const ASSET = DIR + "/assets";
const BOX_ID = "zgtz-spine-box";
const STYLE_ID = "zgtz-spine-style";
const SCRIPT_ID = "zgtz-spine-script";
const Z = 2147483000;
//骨骼总开关
let spineEnabled = !(typeof lib != "undefined" && lib.config && lib.config.extension_鸽府包_gfb_gghm === false);
let avatarTimers = [];
//攻击特效全局默认，每个动皮条目里可用，atk:{from,to,scale}
const ATK_FX = { clip: "GongJi", from: 0.6, to: 2.0, scale: 0.7 };

//character 绑定武将id clip 动画片段 duration 时长毫秒 audio 同文件夹内的音频可填false useCard 用伤害牌自动播放 skel 素材是skel二进制 scale 骨骼等比放大倍数
//folder+spineName 素材不在 assets/<id>/<id> 时指定 folder=目录名 spineName=文件基准名
//stageFocus 手动全屏取景 {x 水平中心 top 画面上沿 span 画面高度}(骨架世界坐标 span 越大角色越小) stageScale 再整体缩放 小于1变小
const ZGTZ_REG = {
	zgtz_toka: {
		character: "zgtz_toka",
		folder: "decade_toka",
		spineName: "paintshow_10101_s38",
		json4x: true,
		clip: "stand",
		duration: 4300,
		audio: false,
		useCard: true,
		stageScale: 1,
	},
	zgtz_sunce: {
		character: "zgtz_sunce",
		folder: "zgtz_sunce",
		spineName: "XingXiang",
		skel: true,
		clip: "ChuChang",
		duration: 6400,
		audio: false,
		// useCard: true,
		stageFocus: { x: 0, top: 770, span: 1600 },
		stageScale: 1,
		atk: { from: 0.6, to: 2.5, scale: 1 },
	},
	zgtz_huangpusong: {
		character: "zgtz_huangpusong",
		folder: "zgtz_huangpusong",
		spineName: "XingXiang",
		skel: true,
		clip: "ChuChang",
		duration: 6400,
		audio: false,
		useCard: true,
		stageFocus: { x: 0, top: 770, span: 1600 },
		stageScale: 1,
		atk: { from: 0.6, to: 2.0, scale: 0.7 },
	},
	zgtz_huaman: {
		character: "zgtz_huaman",
		folder: "zgtz_huaman",
		spineName: "XingXiang",
		skel: true,
		clip: "ChuChang",
		duration: 6400,
		audio: false,
		// useCard: true,
		stageFocus: { x: 0, top: 770, span: 1600 },
		stageScale: 1,
		atk: { from: 0.3, to: 1.7, scale: 0.7 },
	},
	zgtz_wenyang: {
		character: "zgtz_wenyang",
		folder: "zgtz_wenyang",
		spineName: "XingXiang",
		skel: true,
		clip: "ChuChang",
		duration: 6400,
		audio: false,
		// useCard: true,
		stageFocus: { x: 0, top: 770, span: 1600 },
		stageScale: 1,
		atk: { from: 0.3, to: 2.3, scale: 1 },
	},
};

export function zgtzInfo(id) {
	return ZGTZ_REG[id] || null;
}

function assetBase(id) {
	const info = ZGTZ_REG[id];
	if (info && info.folder) {
		return lib.assetURL + ASSET + "/" + info.folder + "/" + (info.spineName || id);
	}
	return lib.assetURL + ASSET + "/" + id + "/" + id;
}

//攻击特效reg
function atkReg(id) {
	const info = ZGTZ_REG[id];
	if (!info || !info.skel) return null;
	const a = Object.assign({}, ATK_FX, info.atk || {});
	return Object.assign({}, info, {
		clip: a.clip,
		clipFrom: a.from,
		duration: Math.round((a.to - a.from) * 1000),
		stageScale: (info.stageScale || 1) * a.scale,
		scale: (info.scale || 1) * a.scale,
		hideSlots: a.hide || null,
	});
}

function toast(msg) {
	try {
		ui.create.toast(msg);
	} catch (e) {}
}

function ensureStyle() {
	const old = document.getElementById(STYLE_ID);
	if (old) old.remove();
	const style = document.createElement("style");
	style.id = STYLE_ID;
	const sel = "#" + BOX_ID + ",.zgtz-fx-box";
	style.textContent = [
		"#" + BOX_ID + "{position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;z-index:" + Z + "!important;pointer-events:none!important;overflow:visible!important;display:block!important;transition:none!important;margin:0!important;padding:0!important;opacity:1!important;transform:none!important;filter:none!important;}",
		".zgtz-fx-box{max-width:none!important;max-height:none!important;pointer-events:none!important;overflow:visible!important;display:block!important;margin:0!important;padding:0!important;opacity:1!important;transition:none!important;transform:none!important;filter:none!important;}",
		".zgtz-fx-box.zgtz-fx-out{opacity:0!important;transition:opacity .35s linear!important;}",
		sel + " .spine-player{position:relative!important;display:block!important;width:100%!important;height:100%!important;left:auto!important;top:auto!important;margin:0!important;padding:0!important;transition:none!important;opacity:1!important;visibility:visible!important;}",
		sel + " canvas{position:absolute!important;display:block!important;left:0!important;top:0!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;transition:none!important;opacity:1!important;visibility:visible!important;}",
	].join("");
	document.head.appendChild(style);
}

let loading = null;

//手机端
function ensurePlayer() {
	if (typeof window != "undefined" && window.zgtzSpine && window.zgtzSpine.SpinePlayer) return Promise.resolve();
	if (loading) return loading;
	try {
		lib.init.css(lib.assetURL + LIB, "spine-player");
	} catch (e) {}
	loading = import("./lib/spine-player.esm.js")
		.then(function (mod) {
			const SP = mod && (mod.default || mod.spine);
			if (!SP || !SP.SpinePlayer) throw new Error("模块未导出 SpinePlayer");
			window.zgtzSpine = SP;
		})
		.catch(function () {
			return new Promise(function (resolve, reject) {
				const dup = document.getElementById(SCRIPT_ID);
				if (dup && dup.parentNode) dup.parentNode.removeChild(dup);
				const script = document.createElement("script");
				script.id = SCRIPT_ID;
				script.src = lib.assetURL + LIB + "/spine-player.js";
				script.onload = function () {
					if (window.zgtzSpine && window.zgtzSpine.SpinePlayer) resolve();
					else reject(new Error("spine-player 加载失败"));
				};
				script.onerror = function () {
					reject(new Error("spine-player 加载失败"));
				};
				document.head.appendChild(script);
			});
		});
	loading.catch(function () {
		loading = null;
	});
	return loading;
}

function progress(p) {
	try {
		const tr = p.animationState.getCurrent(0);
		return (p.skeleton ? p.skeleton.time : 0) + (tr ? tr.trackTime : 0);
	} catch (e) {
		return -1;
	}
}

function startDrive(p, box) {
	let last = progress(p);
	let stuck = 0;
	const step = function () {
		if (document.getElementById(BOX_ID) !== box) return;
		try {
			const now = progress(p);
			if (now > last + 0.0005) {
				last = now;
				stuck = 0;
			} else {
				stuck++;
				if (stuck == 20) {
					try {
						if (p.paused) p.paused = false;
					} catch (e) {}
				}
			}
		} catch (e) {}
		requestAnimationFrame(step);
	};
	requestAnimationFrame(step);
}

let active = null;

function teardown() {
	const h = active;
	if (!h) return;
	active = null;
	try {
		clearTimeout(h.timer);
	} catch (e) {}
	try {
		if (h.player) h.player.dispose();
	} catch (e) {}
	try {
		if (h.box && h.box.parentNode) h.box.parentNode.removeChild(h.box);
	} catch (e) {}
}

export function playZgtzSpine(id, duration, reg) {
	if (!spineEnabled) return Promise.resolve();
	const info = reg || ZGTZ_REG[id];
	if (!info) {
		toast("没有注册骨骼 " + id);
		return Promise.resolve();
	}
	if (info.skel) {
		toast("骨骼加载失败 播放器不支持该skel格式");
		return Promise.resolve();
	}
	const base = assetBase(id);
	const clip = info.clip || "play";
	duration = duration || info.duration || 3300;
	const scale = info.scale || 1;
	return ensurePlayer()
		.then(function () {
			ensureStyle();
			teardown();
			const box = document.createElement("div");
			box.id = BOX_ID;
			(document.documentElement || document.body).appendChild(box);
			const handle = { box: box, player: null, timer: null };
			active = handle;
			let player = null;
			try {
				const options = {
					atlasUrl: base + ".atlas",
					animation: clip,
					alpha: true,
					premultipliedAlpha: false,
					preserveDrawingBuffer: true,
					backgroundColor: "#00000000",
					fullScreenBackgroundColor: "#00000000",
					showControls: false,
					showLoading: false,
					success: function (p) {
						try {
							if (!p.config.viewport) p.config.viewport = {};
							const d = p.skeleton && p.skeleton.data;
							if (d && d.x !== undefined && d.width > 0 && d.height > 0) {
								const vp = p.config.viewport;
								vp.x = d.x; vp.y = d.y; vp.width = d.width; vp.height = d.height;
							}
						} catch (e) {}
						//骨骼缩放靠改播放器viewport的四边pad 负pad放大 正pad缩小
						try {
							if (scale !== 1) {
								if (!p.config.viewport) p.config.viewport = {};
								if (!p.config.viewport.animations) p.config.viewport.animations = {};
								const vp = p.config.viewport;
								const pad = ((1 / scale - 1) / 2) * 100 + "%";
								vp.padLeft = vp.padRight = vp.padTop = vp.padBottom = pad;
							}
						} catch (e) {}
						try {
							p.setAnimation(clip, false);
						} catch (e) {}
						try {
							if (typeof p.play == "function") p.play();
						} catch (e) {}
						try {
							if (p.paused) p.paused = false;
						} catch (e) {}
						startDrive(p, box);
						setTimeout(function () {
							try {
								if (typeof p.setViewport == "function") p.setViewport(clip);
							} catch (e) {}
						}, 900);
					},
					error: function (p, msg) {
						toast("骨骼加载失败 " + msg);
					},
				};
			options.jsonUrl = base + (info.json4x ? "_4x.json" : ".json");
			player = new window.zgtzSpine.SpinePlayer(box, options);
			} catch (e) {
				toast("骨骼创建失败 " + ((e && e.message) || e));
			}
			handle.player = player;
			handle.timer = setTimeout(function () {
				if (active === handle) active = null;
				try {
					if (player) player.dispose();
				} catch (e) {}
				if (box.parentNode) box.parentNode.removeChild(box);
			}, duration);
		})
		.catch(function (e) {
			toast("骨骼播放失败 " + ((e && e.message) || e));
		});
}

const fired = {};

function webglInfo() {
	try {
		const cv = document.createElement("canvas");
		const gl = cv.getContext("webgl") || cv.getContext("experimental-webgl");
		if (!gl) return "WebGL不可用";
		return "WebGL可用 最大贴图" + gl.getParameter(gl.MAX_TEXTURE_SIZE);
	} catch (e) {
		return "WebGL检测异常";
	}
}

let spineDiagShown = false;

async function playRouteSpine(id, duration, reg) {
	const info = reg || ZGTZ_REG[id];
	if (!info) return;
	const tries = info.skel ? 2 : 1;
	let err = null;
	for (let i = 0; i < tries; i++) {
		let box = null;
		let handle = null;
		try {
			ensureStyle();
			teardown();
			box = document.createElement("div");
			box.id = BOX_ID;
			(document.documentElement || document.body).appendChild(box);
			handle = { box: box, player: null, timer: null };
			active = handle;
			const ctrl = attachDecadeStage(box, info);
			handle.player = ctrl;
			const ok = ctrl && ctrl.ready ? await ctrl.ready : false;
			if (ok) {
				handle.timer = setTimeout(function () {
					if (active === handle) active = null;
					try { if (ctrl) ctrl.dispose(); } catch (e) {}
					if (box.parentNode) box.parentNode.removeChild(box);
				}, duration || info.duration || 3300);
				return;
			}
			if (ctrl && ctrl.err) err = ctrl.err;
		} catch (e) {
			err = err || e;
		}
		if (handle && handle.player) {
			try { handle.player.dispose(); } catch (e) {}
		}
		if (box && box.parentNode) box.parentNode.removeChild(box);
		if (active === handle) active = null;
		if (i + 1 < tries) {
			await new Promise(function (r) {
				setTimeout(r, 800);
			});
		}
	}
	if (info.skel) {
		const msg = (err && err.message) || err || "未知原因";
		toast("动皮加载失败 " + msg);
		if (!spineDiagShown) {
			spineDiagShown = true;
			try {
				window.alert(
					"骨骼动皮加载失败\n素材 " + id +
					"\n原因 " + msg +
					"\n地址 " + (typeof lib != "undefined" ? lib.assetURL || "相对路径" : "?") +
					"\n" + (typeof fetch == "function" ? "fetch可用" : "无fetch") +
					"\n" + webglInfo()
				);
			} catch (e) {}
		}
		return;
	}
	//路线2
	return playZgtzSpine(id, duration, reg);
}

export function zgtzLocalPlay(id, duration, audio, atk) {
	if (!spineEnabled) return;
	const now = Date.now();
	const key = atk ? id + "#atk" : id;
	if (fired[key] && now - fired[key] < 2500) return;
	fired[key] = now;
	const info = ZGTZ_REG[id];
	const file = audio !== undefined ? audio : info && info.audio;
	if (file) {
		try {
			game.playAudio("ext:鸽府包/extension/SpinePlayer/assets/" + (info && info.folder ? info.folder : id) + "/" + file);
		} catch (e) {}
	}
	const reg = atk ? atkReg(id) : null;
	if (reg && duration === undefined) duration = reg.duration;
	return playRouteSpine(id, duration, reg);
}

function remotePlay(id, duration, audio, atk) {
	try {
		const list = [typeof lib != "undefined" ? lib : null, typeof window != "undefined" ? window : null, typeof game != "undefined" ? game : null];
		for (const g of list) {
			if (g && typeof g.zgtzLocalPlay == "function") return g.zgtzLocalPlay(id, duration, audio, atk);
		}
	} catch (e) {}
}

function remoteFx(id, player, opts) {
	try {
		const list = [typeof lib != "undefined" ? lib : null, typeof window != "undefined" ? window : null, typeof game != "undefined" ? game : null];
		for (const g of list) {
			if (g && typeof g.zgtzLocalFx == "function") return g.zgtzLocalFx(id, player, opts);
		}
	} catch (e) {}
}

// 无职转生
// zgtzFx(id, player, opts)
// player 传入人，特效定位到该玩家头像
// player 不传/为undefined，默认屏幕中央放特效
// opts.scale，贴人时相对头像倍数(默认1.6)，opts.blend，混合模式(默认screen传normal关掉)，opts.z层级opts.offsetX/offsetY偏移opts.center强制居中
// opts.split，分界线高度0到1，线下方那段垫在武将牌后面线上方那段盖在武将牌上，opts.zBack，下层层级
// opts.fadeBack，提前多少秒开始淡底座（配 fxReg 里的 fadeSlots 只淡那几个槽，也可用 opts.fadeSlots 直接传）
// game.zgtzFx("001", player) / game.zgtzFx("043") / game.zgtzFx("050", null, {center:true}) / 编号与颜色见 fx/fxReg.js

const FX_Z = 2147483000 + 100;
const FX_Z_AVATAR = 10;
const FX_BLEND = "screen";

function fxAssetBase(id) {
	const info = FX_REG[id];
	if (!info) return null;
	return lib.assetURL + DIR + "/fx/" + info.cat + "/" + id + "/" + id;
}

export function zgtzFxInfo(id) {
	return FX_REG[id] || null;
}

export function zgtzFxList() {
	const out = {};
	for (const id in FX_REG) {
		const v = FX_REG[id];
		const catcn = FX_CAT_CN[v.cat] || v.cat;
		(out[catcn] = out[catcn] || []).push({ id: id, cn: v.cn });
	}
	return out;
}

export function zgtzFxCats() {
	const out = {};
	for (const id in FX_REG) {
		const v = FX_REG[id];
		(out[v.cat] = out[v.cat] || []).push(id);
	}
	return out;
}

let fxActive = [];

function fxBoxFor(player, opts, forceCenter, layer) {
	const box = document.createElement("div");
	box.className = "zgtz-fx-box";
	const blend = opts && opts.blend !== undefined ? opts.blend : FX_BLEND;
	const s = (opts && opts.scale) || 1;
	const lz = layer && layer.z !== undefined ? layer.z : undefined;
	let w = (opts && opts.w) || 290 * s, h = (opts && opts.h) || 290 * s;
	if (!forceCenter && player && player.node && player.node.avatar && player.node.avatar.getBoundingClientRect && player.getBoundingClientRect) {
		try {
			const av = player.node.avatar;
			const prect = player.getBoundingClientRect();
			const arect = av.getBoundingClientRect();
			if (arect.width > 0 && arect.height > 0) {
				const zoom = (typeof game != "undefined" && game.documentZoom) || 1;
				const aw = arect.width / zoom, ah = arect.height / zoom;
				const as = (opts && opts.scale) || 1.6;
				w = (opts && opts.w) || aw * as;
				h = (opts && opts.h) || ah * as;
				const ox = (opts && opts.offsetX) || 0;
				const oy = (opts && typeof opts.offsetY == "number") ? opts.offsetY : 0;
				const left = (arect.left - prect.left) / zoom + aw / 2 - w / 2 + ox;
				const top = (arect.top - prect.top) / zoom + ah / 2 - h / 2 + oy;
				let zVal = lz !== undefined ? lz : ((opts && opts.z) || FX_Z_AVATAR);
				if (layer && layer.behind && lz === undefined) {
					let az = 0;
					try {
						const n = parseInt(window.getComputedStyle(av).zIndex, 10);
						if (!isNaN(n)) az = n;
					} catch (e) {}
					zVal = az - 1;
				}
				box.style.cssText = "position:absolute;left:" + left + "px;top:" + top + "px;width:" + w + "px;height:" + h + "px;z-index:" + zVal + ";pointer-events:none;overflow:visible;";
				if (blend) box.style.mixBlendMode = blend;
				if (layer && layer.side) {
					const r = Math.max(0, Math.min(1, (ah * layer.split - top) / h));
					box.style.clipPath = layer.side == "back" ? "inset(" + (r * 100).toFixed(3) + "% 0 0 0)" : "inset(0 0 " + ((1 - r) * 100).toFixed(3) + "% 0)";
				}
				if (layer && layer.behind) player.insertBefore(box, player.firstChild);
				else player.appendChild(box);
				return box;
			}
		} catch (e) {}
	}
	box.style.cssText = "position:fixed;left:calc(50% - " + (w / 2) + "px);top:calc(50% - " + (h / 2) + "px);width:" + w + "px;height:" + h + "px;z-index:" + (lz !== undefined ? lz : ((opts && opts.z) || FX_Z)) + ";pointer-events:none;overflow:visible;";
	if (blend) box.style.mixBlendMode = blend;
	if (layer && layer.side) {
		box.style.clipPath = layer.side == "back" ? "inset(" + (layer.split * 100).toFixed(3) + "% 0 0 0)" : "inset(0 0 " + ((1 - layer.split) * 100).toFixed(3) + "% 0)";
	}
	return box;
}

// 强制居中类
function fxIsCenter(info) {
	return info && (info.cat == "world" || info.cat == "team");
}

function fadeOutBox(box, dur, handle) {
	if (!box) return;
	const t0 = performance.now();
	try { box.style.setProperty("opacity", "1", "important"); } catch (e) {}
	const step = function () {
		try {
			if (!box.isConnected || (handle && handle.done)) return;
			const k = Math.min(1, (performance.now() - t0) / dur);
			box.style.setProperty("opacity", String(1 - k), "important");
			if (k < 1) requestAnimationFrame(step);
		} catch (e) {}
	};
	requestAnimationFrame(step);
}

export function playZgtzFx(id, player, opts) {
	if (!spineEnabled) return Promise.resolve();
	opts = opts || {};
	if (typeof player == "string") {
		try {
			player = (lib.player && lib.player[player]) || (game && game.players && game.players.find(function (x) { return x.name == player; })) || null;
		} catch (e) { player = null; }
	}
	const info = FX_REG[id];
	if (!info) { toast("没有注册特效 " + id); return Promise.resolve(); }
	const base = fxAssetBase(id);
	if (!base) { toast("特效路径缺失 " + id); return Promise.resolve(); }
	const clip = info.clip || "idle";
	const center = opts.center || fxIsCenter(info);
	const fo = Object.assign({}, opts);
	if (fo.blend === undefined && info.blend !== undefined) fo.blend = info.blend;
	const fadeBack = typeof fo.fadeBack == "number" && fo.fadeBack > 0 ? fo.fadeBack : null;
	const fadeSlots = fo.fadeSlots || info.fadeSlots || null;
	const slotFade = fadeBack !== null && fadeSlots && fadeSlots.length > 0;
	const split = typeof fo.split == "number" && fo.split > 0 && fo.split < 1
		? fo.split
		: (fadeBack !== null && !slotFade ? 0.75 : null);
	return ensurePlayer().then(function () {
		ensureStyle();
		const fz = fo.z !== undefined ? fo.z : FX_Z_AVATAR + 20;
		const layers = split === null ? [{}] : (fadeBack !== null
			? [
				{ z: fz, side: "back", split: split },
				{ z: fz, side: "front", split: split },
			]
			: [
				{ z: fo.zBack, behind: true, side: "back", split: split },
				{ z: fz, side: "front", split: split },
			]);
		const slots = [];
		let fadeMap = null, fadeT0 = 0, fadeMs = 350;
		const handle = { slots: slots, timer: null, fadeTimer: null, done: false };
		function cleanup() {
			if (handle.done) return;
			handle.done = true;
			if (handle.timer) { clearTimeout(handle.timer); handle.timer = null; }
			if (handle.fadeTimer) { clearTimeout(handle.fadeTimer); handle.fadeTimer = null; }
			fxActive = fxActive.filter(function (h) { return h !== handle; });
			for (const s2 of slots) {
				try { if (s2.player) s2.player.dispose(); } catch (e) {}
				if (s2.box.parentNode) s2.box.parentNode.removeChild(s2.box);
			}
		}
		handle.cleanup = cleanup;
		fxActive.push(handle);
		let pending = layers.length;
		function startAll() {
			for (const s2 of slots) {
				const pp = s2.player;
				if (!pp) continue;
				try { pp.setAnimation(clip, false); } catch (e) {}
				try { if (typeof pp.play == "function") pp.play(); } catch (e) {}
				try { if (pp.paused) pp.paused = false; } catch (e) {}
				startDrive(pp, s2.box);
				setTimeout(function () {
					try { if (typeof pp.setViewport == "function") pp.setViewport(clip); } catch (e) {}
				}, 300);
			}
			if (fadeBack !== null) {
				let adur = 0;
				try {
					const e0 = slots[slots.length - 1].player && slots[slots.length - 1].player.animationState && slots[slots.length - 1].player.animationState.getCurrent(0);
					if (e0 && e0.animation) adur = e0.animation.duration;
				} catch (e) {}
				if (!adur) adur = info.dur || 1.6;
				const delay = Math.max(0, adur - fadeBack) * 1000;
				fadeMs = Math.max(80, (fo.fadeTime || 0.35) * 1000);
				if (slotFade) {
					fadeMap = {};
					for (const n of fadeSlots) fadeMap[n] = null;
					fadeT0 = performance.now() + delay;
				} else if (slots.length > 1) {
					handle.fadeTimer = setTimeout(function () {
						if (handle.done) return;
						fadeOutBox(slots[0] && slots[0].box, fadeMs, handle);
					}, delay);
				}
			}
			try {
				const first = slots[0] && slots[0].player;
				if (first && first.animationState && first.animationState.addListener) {
					first.animationState.addListener({ complete: function () { setTimeout(cleanup, 0); } });
				}
			} catch (e) {}
		}
		for (const layer of layers) {
			const box = fxBoxFor(player, fo, center, layer);
			if (!box.parentNode) (document.documentElement || document.body).appendChild(box);
			const s2 = { box: box, player: null };
			slots.push(s2);
			const options = {
				atlasUrl: base + ".atlas",
				jsonUrl: base + ".json",
				animation: clip,
				alpha: true,
				premultipliedAlpha: false,
				preserveDrawingBuffer: true,
				backgroundColor: "#00000000",
				fullScreenBackgroundColor: "#00000000",
				showControls: false,
				showLoading: false,
				update: function (pp) {
					if (!slotFade || !fadeMap) return;
					const k = Math.min(1, (performance.now() - fadeT0) / fadeMs);
					if (k <= 0) return;
					try {
						const list = pp.skeleton.slots, a = 1 - k;
						for (let i = 0; i < list.length; i++) {
							const name = list[i].data.name;
							if (!(name in fadeMap)) continue;
							const c = list[i].getColor();
							if (fadeMap[name] === null) fadeMap[name] = c.a;
							c.a = fadeMap[name] * a;
						}
					} catch (e) {}
				},
				success: function (pp) {
					s2.player = pp;
					try {
						if (!pp.config.viewport) pp.config.viewport = {};
						const d = pp.skeleton && pp.skeleton.data;
						if (d && d.x !== undefined && d.width > 0 && d.height > 0) {
							const vp = pp.config.viewport;
							vp.x = d.x; vp.y = d.y; vp.width = d.width; vp.height = d.height;
						}
					} catch (e) {}
					pending--;
					if (pending <= 0) startAll();
				},
				error: function (pp, msg) {
					s2.player = pp;
					pending--;
					if (pending <= 0) startAll();
					toast("特效加载失败 " + msg);
				},
			};
			try {
				s2.player = new window.zgtzSpine.SpinePlayer(box, options);
			} catch (e) {
				pending--;
				toast("特效创建失败 " + ((e && e.message) || e));
			}
		}
		const dur = (info.dur ? info.dur * 1000 : 3500) + 700;
		handle.timer = setTimeout(cleanup, dur);
	}).catch(function (e) {
		toast("特效播放失败 " + ((e && e.message) || e));
	});
}

// 传入player则定位到该人，不传则屏幕中央
export function zgtzFx(id, player, opts) {
	try {
		if (game && typeof game.broadcastAll == "function") return game.broadcastAll(remoteFx, id, player, opts);
	} catch (e) {}
	return playZgtzFx(id, player, opts);
}

// 清空当前所有正在播放的特效
export function zgtzFxClear() {
	const list = fxActive.slice();
	fxActive = [];
	for (const h of list) {
		try {
			if (h.cleanup) h.cleanup();
			else {
				if (h.player) h.player.dispose();
				if (h.box && h.box.parentNode) h.box.parentNode.removeChild(h.box);
			}
		} catch (e) {}
	}
}

//技能播放zgtzPlay("zgtz_xxx")
export function zgtzPlay(id, duration) {
	const out = zgtzLocalPlay(id, duration);
	try {
		if (game && typeof game.broadcastAll == "function") game.broadcastAll(remotePlay, id, duration, undefined);
	} catch (e) {}
	return out;
}

//使用伤害牌时播放动皮攻击特效 只播GongJi中间有效段并整体缩小
export function zgtzAttack(id) {
	const reg = atkReg(id);
	if (!reg) return zgtzPlay(id);
	const duration = reg.duration;
	const out = zgtzLocalPlay(id, duration, undefined, true);
	try {
		if (game && typeof game.broadcastAll == "function") game.broadcastAll(remotePlay, id, duration, undefined, true);
	} catch (e) {}
	return out;
}

function zgtzCards(evt, args) {
	const out = [];
	try {
		if (evt && evt.card) out.push(evt.card);
		else if (evt && evt.cards) for (const c of evt.cards) out.push(c);
	} catch (e) {}
	if (!out.length && args) {
		for (const a of args) {
			try {
				if (get.itemtype(a) == "card") out.push(a);
				else if (get.itemtype(a) == "cards") for (const c of a) out.push(c);
				else if (a && typeof a == "object" && get.itemtype(a) == null) {
					if (a.card) out.push(a.card);
					else if (a.cards) for (const c of a.cards) out.push(c);
				}
			} catch (e) {}
		}
	}
	return out;
}

//使用伤害牌自动播放
function zgtzWatch(player, evt, args) {
	if (!player || !player.name) return;
	if (player.storage && player.storage.zgtz_fx_mute) {
		delete player.storage.zgtz_fx_mute;
		return;
	}
	let hit = null;
	for (const id in ZGTZ_REG) {
		const info = ZGTZ_REG[id];
		if (info && info.useCard && info.character == player.name) {
			hit = id;
			break;
		}
	}
	if (!hit) return;
	const cards = zgtzCards(evt, args);
	for (const c of cards) {
		if (get.is.damageCard(c)) {
			zgtzAttack(hit);
			return;
		}
	}
}

function installUseCard() {
	try {
		if (!lib.element || !lib.element.player || typeof lib.element.player.useCard != "function") return false;
		if (lib.element.player.__zgtzUseCard) return true;
		const orig = lib.element.player.useCard;
		lib.element.player.useCard = function () {
			const r = orig.apply(this, arguments);
			try {
				if (spineEnabled) zgtzWatch(this, r, arguments);
			} catch (e) {}
			return r;
		};
		lib.element.player.__zgtzUseCard = true;
		return true;
	} catch (e) {
		return false;
	}
}

//动态头像
//folder=素材目录 spineName=骨架前缀 clip=动画名 素材按名放 assets/<folder>/<spineName>.{json,atlas,png}
//skel=素材是二进制骨架 用 SkeletonBinary 读无需转json
//focus=头像取景 对准头部骨骼的坐标 x=水平中心 top=画面上沿对应的骨架y span=画面高度覆盖多少骨架单位 数值越小脸越大
//avScale=整体再缩放 小于1露更多身体 大于1再放大 每个角色可单独调
const AVATAR_REG = {
	zgtz_toka: { folder: "decade_toka", spineName: "paintshow_10101_s38", clip: "stand" },
	zgtz_sunce: { folder: "zgtz_sunce", spineName: "XingXiang", clip: "DaiJi", skel: true, focus: { x: 110, top: 318, span: 720 } },
	zgtz_huangpusong: { folder: "zgtz_huangpusong", spineName: "XingXiang", clip: "DaiJi", skel: true, focus: { x: 28, top: 400, span: 400 } },
	zgtz_huaman: { folder: "zgtz_huaman", spineName: "XingXiang", clip: "DaiJi", skel: true, focus: { x: -33, top: 400, span: 600 } },
	zgtz_wenyang: { folder: "zgtz_wenyang", spineName: "XingXiang", clip: "DaiJi", skel: true, focus: { x: 81, top: 400, span: 400 } },
};

//预热运行时与全部立绘素材
let decadePreloaded = false;
export function preloadDecadeAvatar() {
	if (!spineEnabled) return;
	if (decadePreloaded) return;
	decadePreloaded = true;
	try { loadSpineRuntime().catch(function () {}); } catch (e) {}
	const done = Object.create(null);
	const list = [];
	for (const id in AVATAR_REG) {
		const reg = AVATAR_REG[id];
		const folder = reg.folder || id;
		const spineName = reg.spineName || id;
		const key = folder + "/" + spineName;
		if (done[key]) continue;
		done[key] = true;
		list.push({ name: spineName, folder: folder, skel: !!reg.skel });
	}
	let chain = Promise.resolve();
	for (const it of list) {
		chain = chain
			.then(function () {
				return preloadDecade(it.name, it.folder, it.skel);
			})
			.catch(function () {});
	}
}

function avatarHeadBox(sp) {
	try {
		const bones = sp.skeleton && sp.skeleton.bones;
		if (!bones) return null;
		let sx = 0, sy = 0, n = 0;
		for (const b of bones) {
			const nm = (b.data && b.data.name) || b.name || "";
			if (/toshi|tou|bozi|head|neck|lian|face|tofa|hair|me\b|kao|mimi|kuti|hana/i.test(nm)) {
				sx += b.worldX;
				sy += b.worldY;
				n++;
			}
		}
		if (n >= 6) return { x: sx / n, y: sy / n };
	} catch (e) {}
	return null;
}

let avatarStyleReady = false;

function ensureAvatarStyle() {
	if (avatarStyleReady) return;
	avatarStyleReady = true;
	const style = document.createElement("style");
	style.id = "zgtz-avatar-style";
	style.textContent = [
		".zgtz-avatar-box{position:absolute!important;left:0!important;top:0!important;width:100%!important;height:100%!important;overflow:hidden!important;pointer-events:none!important;z-index:1!important;}",
		".zgtz-avatar-box .spine-player{position:relative!important;display:block!important;width:100%!important;height:100%!important;left:auto!important;top:auto!important;margin:0!important;padding:0!important;}",
		".zgtz-avatar-box canvas{position:absolute!important;display:block!important;left:0!important;top:0!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;}",
	].join("");
	document.head.appendChild(style);
}

//通用挂载
function attachAvatarTo(el, id) {
	const reg = AVATAR_REG[id];
	if (!reg || !el || !el.getBoundingClientRect) return null;
	if (el.__zgtzAvatar) return el.__zgtzAvatar;
	ensureAvatarStyle();
	const box = document.createElement("div");
	box.className = "zgtz-avatar-box";
	try {
		el.insertBefore(box, el.firstChild);
	} catch (e) {
		el.appendChild(box);
	}
	const handle = { box: box, player: null, hidden: [], prevBg: undefined, prevPos: undefined, av: el };
	el.__zgtzAvatar = handle;
	try {
		if (getComputedStyle(el).position === "static") {
			handle.prevPos = el.style.position;
			el.style.position = "relative";
		}
	} catch (e) {}
	//挂spine期间藏掉原立绘
	try {
		if (el.style.backgroundImage && el.style.backgroundImage !== "none") {
			handle.prevBg = el.style.backgroundImage;
			el.style.backgroundImage = "none";
		}
		for (const ch of Array.from(el.children)) {
			if (ch === box) continue;
			if (ch.tagName === "IMG") {
				ch.__zgtzDisp = ch.style.display;
				ch.style.display = "none";
				handle.hidden.push(ch);
			}
		}
	} catch (e) {}
	//用自带spine运行时渲染
	try {
		const ctrl = attachDecadeAvatar(box, reg, el);
		if (ctrl) handle.player = ctrl;
	} catch (e) {}
	return handle;
}

const pendingAvatars = [];
function attachAvatarLater(el, id) {
	if (!el || el.__zgtzAvatar) return;
	for (const x of pendingAvatars) if (x.el === el) return;
	pendingAvatars.push({ el: el, id: id });
	flushPendingAvatars();
}
function flushPendingAvatars() {
	for (let i = pendingAvatars.length - 1; i >= 0; i--) {
		const x = pendingAvatars[i];
		if (!x.el.isConnected || x.el.__zgtzAvatar) {
			pendingAvatars.splice(i, 1);
			continue;
		}
		const ar = x.el.getBoundingClientRect();
		if (ar.width < 8 || ar.height < 8) continue;
		attachAvatarTo(x.el, x.id);
		pendingAvatars.splice(i, 1);
	}
}

function pickAvatarId(name) {
	if (typeof name === "string") {
		if (name.startsWith("character:")) name = name.slice(10);
		return AVATAR_REG[name] ? name : null;
	}
	if (Array.isArray(name)) {
		for (const v of name) {
			const r = pickAvatarId(v);
			if (r) return r;
		}
	}
	return null;
}

function pickAvatarIdByElement(el) {
	const hay = [];
	try {
		hay.push(el.getAttribute("style") || "");
	} catch (e) {}
	try {
		hay.push(el.getAttribute("src") || "");
	} catch (e) {}
	for (const id in AVATAR_REG) {
		for (const s of hay) if (s && s.indexOf(id) >= 0) return id;
	}
	return null;
}

let avatarScanSel = "";
function scanAvatarElements() {
	if (!avatarScanSel) {
		const parts = [];
		for (const id in AVATAR_REG) {
			parts.push('[style*="' + id + '"]', 'img[src*="' + id + '"]');
		}
		avatarScanSel = parts.join(",");
	}
	const roots = [];
	try {
		if (ui && ui.window) roots.push(ui.window);
	} catch (e) {}
	try {
		if (ui && ui.arena) roots.push(ui.arena);
	} catch (e) {}
	if (!roots.length) roots.push(document.body);
	for (const root of roots) {
		let list;
		try {
			list = root.querySelectorAll(avatarScanSel);
		} catch (e) {
			continue;
		}
		for (const el of list) {
			const id = pickAvatarIdByElement(el);
			if (!id) continue;
			//图片本身是立绘时挂它的容器
			const box = el.tagName === "IMG" ? el.parentElement || el : el;
			if (!box || box.__zgtzAvatar) continue;
			const ar = box.getBoundingClientRect();
			if (ar.width < 8 || ar.height < 8) {
				attachAvatarLater(box, id);
				continue;
			}
			attachAvatarTo(box, id);
		}
	}
}

function attachAvatar(p) {
	const av = p && p.node && p.node.avatar;
	if (!av) return;
	const handle = attachAvatarTo(av, p && p.name);
	if (handle) p.__zgtzAvatar = handle;
}

//元素级拆除
function detachAvatarEl(el) {
	const handle = el && el.__zgtzAvatar;
	if (!handle) return;
	delete el.__zgtzAvatar;
	try {
		if (handle.player && handle.player.dispose) handle.player.dispose();
	} catch (e) {}
	try {
		if (handle.box && handle.box.parentNode) handle.box.parentNode.removeChild(handle.box);
	} catch (e) {}
	try {
		if (handle.prevBg !== undefined && handle.av) handle.av.style.backgroundImage = handle.prevBg;
	} catch (e) {}
	try {
		if (handle.prevPos !== undefined && handle.av) handle.av.style.position = handle.prevPos;
	} catch (e) {}
	for (const ch of (handle.hidden || [])) {
		try { ch.style.display = ch.__zgtzDisp || ""; } catch (e) {}
	}
}

function detachAvatar(p) {
	const av = p && p.node && p.node.avatar;
	if (p) delete p.__zgtzAvatar;
	if (av) detachAvatarEl(av);
}

function refreshAvatars() {
	if (!spineEnabled) return;
	try {
		scanAvatarElements();
	} catch (e) {}
	flushPendingAvatars();
	if (!game || !game.players) return;
	for (const p of game.players) {
		try {
			const av = p && p.node && p.node.avatar;
			const has = (av && av.__zgtzAvatar) || (p && p.__zgtzAvatar);
			if (AVATAR_REG[p && p.name]) {
				if (!has) attachAvatar(p);
			} else if (has) detachAvatar(p);
		} catch (e) {}
	}
}

export function zgtzAvatar(p) {
	if (!spineEnabled) return null;
	if (p && p.node) {
		attachAvatar(p);
		return p.__zgtzAvatar || null;
	}
	refreshAvatars();
	return null;
}

//拆掉界面上所有已挂骨骼的头像
function detachAllAvatars() {
	pendingAvatars.length = 0;
	try {
		for (const p of (game && game.players) || []) {
			if (!p || !p.node) continue;
			for (const key of ["avatar", "avatar2"]) {
				const av = p.node[key];
				const handle = av && av.__zgtzAvatar;
				if (handle) {
					const hadBg = handle.prevBg !== undefined;
					detachAvatarEl(av);
					if (!hadBg) {
						try { av.setBackground(p.name, "character"); } catch (e) {}
					}
				}
			}
			delete p.__zgtzAvatar;
		}
	} catch (e) {}
	try {
		const roots = [];
		if (ui && ui.window) roots.push(ui.window);
		if (ui && ui.arena) roots.push(ui.arena);
		for (const root of roots) {
			for (const box of Array.from(root.querySelectorAll(".zgtz-avatar-box"))) {
				const host = box.parentElement;
				if (host && host.__zgtzAvatar) detachAvatarEl(host);
			}
		}
	} catch (e) {}
}

function stopAvatarTimers() {
	for (const t of avatarTimers) {
		try { clearInterval(t); } catch (e) {}
	}
	avatarTimers = [];
}

export function isZgtzSpineEnabled() {
	return spineEnabled;
}

//运行时开关
export function setZgtzSpineEnabled(on) {
	on = !!on;
	if (on === spineEnabled) return on;
	spineEnabled = on;
	try {
		game.saveConfig("extension_鸽府包_gfb_gghm", on);
	} catch (e) {}
	if (on) {
		installZgtzHook();
		installAvatarHook();
		preloadDecadeAvatar();
		refreshAvatars();
	} else {
		stopAvatarTimers();
		teardown();
		try { zgtzFxClear(); } catch (e) {}
		detachAllAvatars();
	}
	return on;
}

function installSetBackgroundHook() {
	try {
		if (HTMLDivElement.prototype.__zgtzSBHook) return true;
		const sb = HTMLDivElement.prototype.setBackground;
		if (typeof sb != "function") return false;
		HTMLDivElement.prototype.setBackground = function (name, type) {
			const r = sb.apply(this, arguments);
			try {
				if (spineEnabled) {
					const id = pickAvatarId(name);
					if (id) attachAvatarLater(this, id);
					else if (this.__zgtzAvatar) detachAvatarEl(this);
				}
			} catch (e) {}
			return r;
		};
		HTMLDivElement.prototype.__zgtzSBHook = true;
		return true;
	} catch (e) {
		return false;
	}
}

export function installAvatarHook() {
	if (!spineEnabled) return;
	stopAvatarTimers();
	try {
		const proto = lib.element && lib.element.player;
		if (proto && !proto.__zgtzAvatarHook) {
			for (const fn of ["$init", "initOL"]) {
				const orig = proto[fn];
				if (typeof orig != "function") continue;
				proto[fn] = function () {
					const r = orig.apply(this, arguments);
					try {
						setTimeout(refreshAvatars, 60);
					} catch (e) {}
					return r;
				};
			}
			proto.__zgtzAvatarHook = true;
		}
	} catch (e) {}
	if (!installSetBackgroundHook()) {
		let sbTick = 0;
		const sbTimer = setInterval(function () {
			sbTick++;
			if (installSetBackgroundHook() || sbTick > 200) {
				clearInterval(sbTimer);
				avatarTimers = avatarTimers.filter(function (x) { return x !== sbTimer; });
			}
		}, 100);
		avatarTimers.push(sbTimer);
	}
	let fastTick = 0;
	const fastTimer = setInterval(function () {
		fastTick++;
		refreshAvatars();
		if (fastTick >= 40) clearInterval(fastTimer);
	}, 120);
	avatarTimers.push(fastTimer);
	avatarTimers.push(setInterval(refreshAvatars, 600));
}

export function installZgtzHook() {
	if (!spineEnabled) return;
	if (typeof window != "undefined") {
		window.zgtzPlay = window.zgtzPlay || zgtzPlay;
		window.zgtzLocalPlay = window.zgtzLocalPlay || zgtzLocalPlay;
		window.zgtzLocalFx = window.zgtzLocalFx || playZgtzFx;
		window.zgtzInfo = window.zgtzInfo || zgtzInfo;
	}
	if (!installUseCard()) {
		let n = 0;
		const timer = setInterval(function () {
			n++;
			if (installUseCard() || n > 300) clearInterval(timer);
		}, 300);
	}
}

if (typeof window != "undefined") {
	window.zgtzPlay = zgtzPlay;
	window.zgtzAttack = zgtzAttack;
	window.zgtzLocalPlay = zgtzLocalPlay;
	window.zgtzInfo = zgtzInfo;
	window.zgtzInstall = installZgtzHook;
	window.zgtzAvatar = zgtzAvatar;
	window.zgtzAvatarInstall = installAvatarHook;
	window.zgtzFx = zgtzFx;
	window.zgtzLocalFx = playZgtzFx;
	window.zgtzFxList = zgtzFxList;
	window.zgtzFxCats = zgtzFxCats;
	window.zgtzFxInfo = zgtzFxInfo;
	window.zgtzFxClear = zgtzFxClear;
	window.zgtzSpineEnabled = isZgtzSpineEnabled;
	window.zgtzSetSpineEnabled = setZgtzSpineEnabled;
}
try { if (typeof game != "undefined" && game) { game.zgtzFx = zgtzFx; game.zgtzLocalFx = playZgtzFx; game.zgtzLocalPlay = zgtzLocalPlay; game.zgtzAttack = zgtzAttack; game.zgtzFxList = zgtzFxList; game.zgtzFxInfo = zgtzFxInfo; game.zgtzFxClear = zgtzFxClear; game.zgtzSpineEnabled = isZgtzSpineEnabled; game.zgtzSetSpineEnabled = setZgtzSpineEnabled; } } catch (e) {}
try { if (typeof lib != "undefined" && lib) { lib.zgtzFx = zgtzFx; lib.zgtzLocalFx = playZgtzFx; lib.zgtzLocalPlay = zgtzLocalPlay; lib.zgtzAttack = zgtzAttack; lib.zgtzFxList = zgtzFxList; lib.zgtzSpineEnabled = isZgtzSpineEnabled; lib.zgtzSetSpineEnabled = setZgtzSpineEnabled; } } catch (e) {}
