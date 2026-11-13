//avatar=贴武将牌头像(头肩取景) stage=全屏整身待机(用牌演出)
const DIR = "extension/鸽府包/extension/SpinePlayer";
const ASSET = DIR + "/assets";
const AV_VER = "?zgtzav=4";
const SPINE_NS = "decadeSpine";
const TEX_SCALE = 1;
//贴图预热 idle 开局空闲传显卡 lazy 首次用到才传 none 只预载文本（小鸽子亲测有效，否则会很卡顿）
const PRELOAD_TEX = "idle";
//共享绘制缓冲上限
const MAXBUF = 4096;
//渲染分辨率倍率上限 按设备像素比来 系统缩放125%/150%时靠它 设1等于强制按CSS像素渲染会更糊
const MAX_DPR = 2;
//头像超采样倍率 按这个倍数渲染再降采样画回小画布
const AV_SS = 2;
//头部骨骼名匹配
const HEAD_RE = /toshi|tou|bozi|head|neck|lian|face|tofa|hair|^me\b|kao|mimi|kuti|hana|kami|sakasama/i;

function xhrGet(url, binary) {
	return new Promise(function (res, rej) {
		try {
			const x = new XMLHttpRequest();
			x.open("GET", url, true);
			if (binary) x.responseType = "arraybuffer";
			x.onload = function () {
				const body = binary ? x.response : x.responseText;
				if ((x.status >= 200 && x.status < 300) || (x.status === 0 && body)) res(body);
				else rej(new Error("HTTP " + x.status + " " + url));
			};
			x.onerror = function () {
				rej(new Error("请求失败 " + url));
			};
			x.send();
		} catch (e) {
			rej(e);
		}
	});
}

function readText(url) {
	if (typeof fetch != "function") return xhrGet(url, false);
	return fetch(url)
		.then(function (r) {
			if (!r.ok) throw new Error("HTTP " + r.status);
			return r.text();
		})
		.catch(function () {
			return xhrGet(url, false);
		});
}

function readBytes(url) {
	const toU8 = function (b) {
		return b instanceof Uint8Array ? b : new Uint8Array(b);
	};
	if (typeof fetch != "function") return xhrGet(url, true).then(toU8);
	return fetch(url)
		.then(function (r) {
			if (!r.ok) throw new Error("HTTP " + r.status);
			return r.arrayBuffer();
		})
		.then(toU8)
		.catch(function () {
			return xhrGet(url, true).then(toU8);
		});
}

function loadByScript(url) {
	return new Promise(function (res, rej) {
		const prev = window.spine;
		const s = document.createElement("script");
		s.src = url;
		s.onload = function () {
			const ns = window.spine;
			window.spine = prev;
			if (s.parentNode) s.parentNode.removeChild(s);
			if (ns && ns.webgl) res(ns);
			else rej(new Error("spine 运行时无效"));
		};
		s.onerror = function () {
			window.spine = prev;
			if (s.parentNode) s.parentNode.removeChild(s);
			rej(new Error("spine.js 加载失败"));
		};
		document.head.appendChild(s);
	});
}

let spineRuntimePromise = null;
export function loadSpineRuntime() {
	const cur = window[SPINE_NS];
	if (cur && cur.webgl) return Promise.resolve(cur);
	if (spineRuntimePromise) return spineRuntimePromise;
	const url = lib.assetURL + DIR + "/spine_decade.js";
	spineRuntimePromise = readText(url)
		.then(function (code) {
			let ns = null;
			try {
				const factory = new Function("window", "self", "globalThis", "document", "location", code + "\n;return spine;");
				ns = factory(window, window, window, document, location);
			} catch (e) {
				ns = null;
			}
			if (ns && ns.webgl) {
				window[SPINE_NS] = ns;
				return ns;
			}
			return loadByScript(url).then(function (s2) {
				window[SPINE_NS] = s2;
				return s2;
			});
		})
		.catch(function (e) {
			console.error("[decadeAvatar] spine.js 加载失败", url, e);
			spineRuntimePromise = null;
			throw e;
		});
	return spineRuntimePromise;
}

const textCache = new Map();
const bytesCache = new Map();
const imgCache = new Map();
const texCache = new Map();
const dataCache = new Map();
const textures = new Map();

//共享绘制核心
const core = {
	S: null,
	gl: null,
	canvas: null,
	shader: null,
	batcher: null,
	renderer: null,
	bufW: 0,
	bufH: 0,
	live: [],
	raf: 0,
	gen: 0,
};

function fetchText(url) {
	const hit = textCache.get(url);
	if (hit !== undefined) return Promise.resolve(hit);
	return readText(url).then(function (t) {
		textCache.set(url, t);
		return t;
	});
}

function fetchBytes(url) {
	const hit = bytesCache.get(url);
	if (hit !== undefined) return Promise.resolve(hit);
	return readBytes(url).then(function (u) {
		bytesCache.set(url, u);
		return u;
	});
}

function atlasPages(atlasText) {
	const pages = [];
	let cur = null;
	const lines = String(atlasText).split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const t = lines[i].trim();
		if (t.length === 0) cur = null;
		else if (!cur) {
			cur = t;
			pages.push(t);
		}
	}
	return pages;
}

function scaleAtlas(text, k) {
	if (!k || k === 1) return text;
	const lines = String(text).split(/\r?\n/);
	const out = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const m = /^(\s*)(size|xy|orig|offset|offsets|bounds)\s*:\s*(.*)$/i.exec(line);
		if (!m) {
			out.push(line);
			continue;
		}
		const vals = m[3].split(",").map(function (v) {
			const n = parseFloat(v);
			return isNaN(n) ? v.trim() : String(Math.round(n * k));
		});
		out.push(m[1] + m[2] + ":" + vals.join(","));
	}
	return out.join("\n");
}

//贴图补齐到2的幂 webgl1 只有2的幂贴图能开mipmap
function potSize(n) {
	let p = 1;
	while (p < n) p <<= 1;
	return p;
}

function isPot(n) {
	return n > 0 && (n & (n - 1)) === 0;
}

//给贴图开三线性过滤 缩小显示时不再丢细节
function applyMipmap(tex) {
	if (!tex) return;
	try {
		const gl = (tex.context && tex.context.gl) || core.gl;
		if (!gl) return;
		const img = tex.getImage && tex.getImage();
		if (!img || !isPot(img.width) || !isPot(img.height)) return;
		tex.bind();
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		const an =
			gl.getExtension("EXT_texture_filter_anisotropic") ||
			gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") ||
			gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
		if (an) {
			const max = gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
			gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max || 1));
		}
		tex.__zgtzMip = true;
	} catch (e) {}
}

function loadImage(url) {
	const hit = imgCache.get(url);
	if (hit) return hit;
	const p = new Promise(function (res, rej) {
		const img = new Image();
		img.onload = function () {
			res(img);
		};
		img.onerror = function () {
			rej(new Error("贴图加载失败 " + url));
		};
		img.src = url;
	});
	imgCache.set(url, p);
	p.catch(function () {
		imgCache.delete(url);
	});
	return p;
}

//贴图全进程只传一次显存
function getTexture(url) {
	const hit = texCache.get(url);
	if (hit) return hit;
	const p = loadImage(url)
		.then(function (img) {
			if (!core.gl) throw new Error("渲染核心未就绪");
			const iw = img.naturalWidth || img.width;
			const ih = img.naturalHeight || img.height;
			const w = Math.max(1, Math.round(iw * TEX_SCALE));
			const h = Math.max(1, Math.round(ih * TEX_SCALE));
			const pw = potSize(w);
			const ph = potSize(h);
			let src = img;
			if (pw !== iw || ph !== ih) {
				const cv = document.createElement("canvas");
				cv.width = pw;
				cv.height = ph;
				const c2 = cv.getContext("2d");
				try {
					c2.imageSmoothingEnabled = true;
					c2.imageSmoothingQuality = "high";
				} catch (e) {}
				//只扩画布不改region坐标 uv按新尺寸自动算
				c2.drawImage(img, 0, 0, iw, ih, 0, 0, w, h);
				src = cv;
			}
			const tex = new core.S.webgl.GLTexture(core.gl, src);
			textures.set(url, tex);
			return tex;
		})
		.catch(function (e) {
			try {
				const cv = document.createElement("canvas");
				cv.width = 1;
				cv.height = 1;
				return new core.S.webgl.GLTexture(core.gl, cv);
			} catch (e2) {
				throw new Error("贴图失败 " + url + " " + ((e && e.message) || e));
			}
		});
	texCache.set(url, p);
	p.catch(function () {
		texCache.delete(url);
	});
	return p;
}

//骨架只解析一次
function getAsset(base, useSkel) {
	const key = base + (useSkel ? "#skel" : "#json");
	const hit = dataCache.get(key);
	if (hit) return hit;
	const dir = base.slice(0, base.lastIndexOf("/") + 1);
	const load = function (bust) {
		const q = bust ? "?zgtzr=" + Date.now() : "";
		return Promise.all([
			useSkel ? fetchBytes(base + ".skel" + q) : fetchText(base + ".json" + q),
			fetchText(base + ".atlas" + q),
		]).then(function (res) {
			const S = core.S;
			const boneData = res[0];
			const atlasText = res[1];
			const pages = atlasPages(atlasText);
			return Promise.all(
				pages.map(function (pg) {
					return getTexture(dir + pg + AV_VER);
				})
			).then(function () {
				const atlas = new S.TextureAtlas(scaleAtlas(atlasText, TEX_SCALE), function (pg) {
					return textures.get(dir + pg + AV_VER);
				});
				const loader = new S.AtlasAttachmentLoader(atlas);
				const data = useSkel
					? new S.SkeletonBinary(loader).readSkeletonData(boneData)
					: new S.SkeletonJson(loader).readSkeletonData(boneData);
				//atlas读完会按素材里的filter覆盖过滤设置 这里再开一次
				for (const pg of atlas.pages) applyMipmap(pg && pg.texture);
				return data;
			});
		});
	};
	const p = load(false).catch(function (e1) {
		bytesCache.delete(base + ".skel");
		textCache.delete(base + ".json");
		textCache.delete(base + ".atlas");
		dataCache.delete(key);
		return load(true).catch(function () {
			throw e1;
		});
	});
	dataCache.set(key, p);
	p.catch(function () {
		dataCache.delete(key);
	});
	return p;
}

function applyGLState(gl) {
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
	gl.clearColor(0, 0, 0, 0);
}

function ensureCore(S) {
	if (core.gl) return core;
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	let gl = null;
	const opts = [
		{ alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false },
		{ alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false },
		{ alpha: true, premultipliedAlpha: true },
		null,
	];
	for (const o of opts) {
		try {
			gl = o ? canvas.getContext("webgl", o) : canvas.getContext("webgl");
			if (gl) break;
		} catch (e) {}
	}
	if (!gl) {
		try {
			gl = canvas.getContext("experimental-webgl");
		} catch (e) {}
	}
	core.S = S;
	core.gl = gl;
	core.canvas = canvas;
	core.bufW = 64;
	core.bufH = 64;
	core.shader = S.webgl.Shader.newTwoColoredTextured(gl);
	core.batcher = new S.webgl.PolygonBatcher(gl);
	core.renderer = new S.webgl.SkeletonRenderer(gl);
	core.renderer.premultipliedAlpha = false;
	applyGLState(gl);
	core.gen++;
	canvas.addEventListener(
		"webglcontextlost",
		function (e) {
			e.preventDefault();
			resetCore();
		},
		false
	);
	return core;
}

//context
function resetCore() {
	try {
		core.gl = null;
		core.canvas = null;
		core.shader = null;
		core.batcher = null;
		core.renderer = null;
	} catch (e) {}
	core.gen++;
	texCache.clear();
	textures.clear();
	dataCache.clear();
}

function ensureBuf(w, h) {
	if (core.bufW >= w && core.bufH >= h) return;
	const nw = Math.min(MAXBUF, Math.max(core.bufW, Math.ceil(w / 64) * 64));
	const nh = Math.min(MAXBUF, Math.max(core.bufH, Math.ceil(h / 64) * 64));
	core.canvas.width = nw;
	core.canvas.height = nh;
	core.bufW = nw;
	core.bufH = nh;
	applyGLState(core.gl);
}

function startTick() {
	if (core.raf) return;
	core.raf = requestAnimationFrame(tick);
}

function stopTickIfIdle() {
	if (core.live.length || !core.raf) return;
	cancelAnimationFrame(core.raf);
	core.raf = 0;
}

function tick(now) {
	core.raf = requestAnimationFrame(tick);
	const list = core.live;
	for (let i = list.length - 1; i >= 0; i--) {
		const it = list[i];
		try {
			it.frame(now);
		} catch (e) {}
	}
}

function makeInstance(box, reg, opts) {
	opts = opts || {};
	const mode = opts.mode || "avatar";
	const spineName = reg.spineName || reg.id || "";
	const clip = reg.clip || "stand";
	const base = lib.assetURL + ASSET + "/" + (reg.folder || reg.id) + "/";
	const name = base + spineName;
	const fill = reg.stageFill || 0.95;
	const scaleMul = reg.stageScale || 1;
	const avMul = reg.avScale || 1;
	const hideSlots = reg.hideSlots && reg.hideSlots.length ? reg.hideSlots : null;

	const canvas = document.createElement("canvas");
	canvas.className = "zgtz-decade-canvas";
	canvas.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;display:block;";
	const ctx2d = canvas.getContext("2d");
	try {
		box.appendChild(canvas);
	} catch (e) {}

	const ctrl = { disposed: false, alive: false, err: null };
	let readyResolve = null;
	ctrl.ready = new Promise(function (r) {
		readyResolve = r;
	});
	let readyDone = false;
	function ready(ok) {
		if (readyDone) return;
		readyDone = true;
		ctrl.alive = !!ok;
		readyResolve(!!ok);
	}

	let skeleton = null;
	let state = null;
	let bounds = null;
	let headX = 0;
	let headY = 0;
	let headN = 0;
	let gen = -1;
	let building = false;
	let failAt = 0;
	let last = 0;
	let goneAt = 0;

	const entry = { frame: frame, ctrl: ctrl };

	ctrl.dispose = function () {
		if (ctrl.disposed) return;
		ctrl.disposed = true;
		const i = core.live.indexOf(entry);
		if (i >= 0) core.live.splice(i, 1);
		try {
			if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
		} catch (e) {}
		stopTickIfIdle();
	};

	function build() {
		if (building || ctrl.disposed) return;
		building = true;
		let myGen = -1;
		loadSpineRuntime()
			.then(function (S) {
				ensureCore(S);
				myGen = core.gen;
				return getAsset(name, !!reg.skel);
			})
			.then(function (data) {
				if (ctrl.disposed) return;
				const S = core.S;
				const sk = new S.Skeleton(data);
				sk.setSkinByName("default");
				sk.opacity = 1;
				sk.setToSetupPose();
				const st = new S.AnimationState(new S.AnimationStateData(data));
				st.setAnimation(0, clip, true);
				if (reg.clipFrom) {
					try {
						const tr = st.getCurrent(0);
						if (tr) tr.trackTime = reg.clipFrom;
					} catch (e) {}
				}
				sk.updateWorldTransform();
				if (mode == "avatar") {
					headX = 0;
					headY = 0;
					headN = 0;
					for (const b of sk.bones) {
						const nm = (b.data && b.data.name) || b.name || "";
						if (HEAD_RE.test(nm)) {
							headX += b.worldX;
							headY += b.worldY;
							headN++;
						}
					}
					if (headN > 0) {
						headX /= headN;
						headY /= headN;
					}
				}
				const bd = { offset: new S.Vector2(), size: new S.Vector2() };
				sk.getBounds(bd.offset, bd.size, []);
				skeleton = sk;
				state = st;
				bounds = bd;
				gen = myGen;
				last = performance.now();
				ready(true);
			})
			.catch(function (e) {
				ctrl.err = e;
				console.error("[decadeAvatar] 构建失败", e);
				failAt = performance.now();
				ready(false);
			})
			.then(function () {
				building = false;
			});
	}

	function frame(now) {
		if (ctrl.disposed) return;
		if (!canvas.isConnected) {
			if (!goneAt) goneAt = now;
			else if (now - goneAt > 2000) ctrl.dispose();
			return;
		}
		goneAt = 0;
		if (!core.gl) resetCore();
		if (gen !== core.gen) {
			if (!failAt || now - failAt > 3000) build();
			return;
		}
		if (!skeleton || !state || !bounds) return;
		const gl = core.gl;
		const host = mode == "avatar" ? opts.av : box;
		let ar;
		try {
			ar = host.getBoundingClientRect();
		} catch (e) {
			return;
		}
		const W = Math.max(8, Math.round(ar.width));
		const H = Math.max(8, Math.round(ar.height));
		const dpr = Math.min(MAX_DPR, Math.max(1, (typeof window != "undefined" && window.devicePixelRatio) || 1));
		const bw = Math.max(8, Math.round(W * dpr));
		const bh = Math.max(8, Math.round(H * dpr));
		const ss = mode == "avatar" ? Math.max(dpr, AV_SS) : dpr;
		const rw0 = Math.max(8, Math.round(W * ss));
		const rh0 = Math.max(8, Math.round(H * ss));
		if (canvas.width !== bw) canvas.width = bw;
		if (canvas.height !== bh) canvas.height = bh;
		const k = Math.min(1, MAXBUF / rw0, MAXBUF / rh0);
		const rw = Math.max(2, Math.round(rw0 * k));
		const rh = Math.max(2, Math.round(rh0 * k));
		ensureBuf(rw, rh);
		const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
		last = now;
		state.update(dt);
		state.apply(skeleton);
		skeleton.opacity = 1;
		if (hideSlots) {
			for (let i = 0; i < hideSlots.length; i++) {
				try {
					const hs = skeleton.findSlot(hideSlots[i]);
					if (hs && hs.color) hs.color.a = 0;
				} catch (e) {}
			}
		}
		skeleton.updateWorldTransform();
		let scale, camX, camY;
		const focus = reg[mode == "avatar" ? "focus" : "stageFocus"];
		if (focus) {
			scale = (rh / focus.span) * (mode == "avatar" ? avMul : scaleMul);
			camX = rw / 2 - scale * focus.x;
			camY = rh - scale * focus.top;
		} else if (mode == "avatar" && headN >= 6) {
			const region = 0.58; //头肩占骨架高度比例
			const fillA = 0.94; //画面占满系数
			scale = (rh * fillA) / (bounds.size.y * region) * avMul;
			camX = rw / 2 - scale * headX;
			camY = rh * 0.6 - scale * headY;
		} else {
			scale = Math.min(rw / bounds.size.x, rh / bounds.size.y) * fill * (mode == "avatar" ? avMul : scaleMul);
			camX = rw / 2 - scale * (bounds.offset.x + bounds.size.x / 2);
			camY = rh / 2 - scale * (bounds.offset.y + bounds.size.y / 2);
		}
		const mvp = new core.S.webgl.Matrix4();
		mvp.ortho2d(0, 0, rw, rh);
		mvp.translate(camX, camY, 0);
		mvp.scale(scale, scale, 1);
		gl.viewport(0, core.bufH - rh, rw, rh);
		gl.enable(gl.SCISSOR_TEST);
		gl.scissor(0, core.bufH - rh, rw, rh);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.disable(gl.SCISSOR_TEST);
		core.shader.bind();
		core.shader.setUniformi(core.S.webgl.Shader.SAMPLER, 0);
		core.shader.setUniform4x4f(core.S.webgl.Shader.MVP_MATRIX, mvp.values);
		core.batcher.begin(core.shader);
		core.renderer.draw(core.batcher, skeleton);
		core.batcher.end();
		ctx2d.imageSmoothingEnabled = true;
		try {
			ctx2d.imageSmoothingQuality = "high";
		} catch (e) {}
		ctx2d.clearRect(0, 0, bw, bh);
		ctx2d.drawImage(core.canvas, 0, 0, rw, rh, 0, 0, bw, bh);
	}

	core.live.push(entry);
	startTick();
	build();
	return ctrl;
}

export function attachDecadeAvatar(box, reg, av) {
	return makeInstance(box, reg, { mode: "avatar", av: av });
}

export function attachDecadeStage(box, reg) {
	return makeInstance(box, reg, { mode: "stage" });
}

//空闲时排队的预热任务
let idleChain = Promise.resolve();
function enqueueIdle(fn) {
	idleChain = idleChain.then(function () {
		return new Promise(function (res) {
			const run = function () {
				try {
					Promise.resolve(fn()).then(res, res);
				} catch (e) {
					res();
				}
			};
			if (typeof window != "undefined" && window.requestIdleCallback) {
				window.requestIdleCallback(run, { timeout: 1000 });
			} else {
				setTimeout(run, 60);
			}
		});
	});
	return idleChain;
}

//预热
export function preloadDecade(name, folder, useSkel) {
	const base = lib.assetURL + ASSET + "/" + (folder || name) + "/";
	const bone = base + name;
	return loadSpineRuntime()
		.then(function (S) {
			ensureCore(S);
			return Promise.all([useSkel ? fetchBytes(bone + ".skel") : fetchText(bone + ".json"), fetchText(bone + ".atlas")]);
		})
		.then(function (res) {
			const pages = atlasPages(res[1]);
			if (PRELOAD_TEX == "none") return null;
			const jobs = pages.map(function (pg) {
				const url = base + pg + AV_VER;
				return function () {
					return enqueueIdle(function () {
						return PRELOAD_TEX == "idle" ? getTexture(url) : loadImage(url);
					});
				};
			});
			let p = Promise.resolve();
			for (const job of jobs) p = p.then(job).then(function () {}, function () {});
			return p
				.then(function () {
					if (PRELOAD_TEX != "idle") return null;
					return enqueueIdle(function () {
						return getAsset(bone, useSkel);
					});
				})
				.catch(function (e) {
					console.warn("[decadeAvatar] 预热失败 " + name, e && e.message);
				});
		})
		.catch(function (e) {
			console.warn("[decadeAvatar] 预热失败 " + name, e && e.message);
		});
}
