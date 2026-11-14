import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import { createProgress } from "../../../noname/library/update.js";

// 感谢秋礼提供的在线更新OwO，我在此基础上进行了一些修改
/**
 * 更新函数
 * @param {boolean}
 */

// 仓库根目录
const REPO = "https://raw.githubusercontent.com/QingXin-design/GFB/main";
// 镜像源
const MIRRORS = ["", "https://gh-proxy.com/", "https://hk.gh-proxy.com/", "https://tvv.tw/"];
const EXTNAME = "鸽府包";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getMirrorList() {
	const primary = MIRRORS[lib.config.extension_鸽府包_update_source] ?? "";
	return [primary, ...MIRRORS.filter((p) => p !== primary)];
}

async function fetchWithTimeout(url, timeout) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);
	try {
		return await fetch(url, { signal: controller.signal, cache: "no-store" });
	} finally {
		clearTimeout(timer);
	}
}

/**
 * 拉取远程清单：选中的源最先发，其余镜像 400ms 后并发抢跑，谁先成功用谁
 * @returns {Promise<{proxy: string, manifest: any}|null>}
 */
export async function fetchRemoteManifest(timeout = 8000) {
	const list = getMirrorList();
	const attempts = list.map(
		(proxy, i) =>
			new Promise((resolve, reject) => {
				setTimeout(
					async () => {
						try {
							const res = await fetchWithTimeout(`${proxy}${REPO}/manifest.json`, timeout);
							if (!res.ok) throw new Error(`HTTP ${res.status}`);
							resolve({ proxy, manifest: await res.json() });
						} catch (e) {
							reject(e);
						}
					},
					i === 0 ? 0 : 400,
				);
			}),
	);
	try {
		return await Promise.any(attempts);
	} catch (e) {
		return null;
	}
}

async function downloadFile(file, proxies) {
	let lastError = null;
	for (const proxy of proxies) {
		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				const url = `${proxy}${REPO}/${file}?${Date.now()}`;
				const res = await fetchWithTimeout(url, 15000);
				if (res.ok) return await res.arrayBuffer();
				lastError = new Error(`HTTP ${res.status}`);
				if (res.status === 429) {
					await sleep(1200 * (attempt + 1));
					continue;
				}
				break;
			} catch (e) {
				lastError = e;
				await sleep(400);
			}
		}
	}
	throw lastError || new Error("下载失败");
}

export default async (manual = false) => {
	if (_status.connectMode && manual) {
		alert("联机状态下无法更新");
		return;
	}
	if (!window.navigator.onLine && manual) {
		alert("无网络连接，无法检查更新");
		return;
	}
	if (!manual && sessionStorage.wumihuaxian_check) return;
	sessionStorage.wumihuaxian_check = true;
	const isProt = (p) => p.startsWith("extension/Leaderboard/rank/");
	const cleanTemp = async (dir, prefix = '') => {
		const [subDirs, files] = await game.promises.getFileList(dir);
		for (const f of files) {
			const full = prefix ? `${prefix}/${f}` : f;
			if (isProt(full)) continue;
			if (/\.(bak|tmp|old|temp)$/i.test(f) || f.endsWith('~')) {
				try {
					await game.promises.removeFile(`extension/鸽府包/${full}`);
					console.log("清理临时文件", full);
				} catch (e) {}
			}
		}
		for (const d of subDirs) {
			await cleanTemp(`${dir}/${d}`, prefix ? `${prefix}/${d}` : d);
		}
	};
	await cleanTemp("extension/鸽府包");

	const picked = await fetchRemoteManifest();
	if (!picked) {
		if (manual) alert("获取更新清单失败，请检查网络或切换镜像");
		return;
	}
	const remoteManifest = picked.manifest;
	const proxy = picked.proxy;
	console.log(`使用${proxy || "直连"}源获取清单成功`);

	// 版本号对比
	let localVersion = "0.0.0";
	const localManifestPath = "extension/鸽府包/manifest.json";
	const localManifestExists = await game.promises.checkFile(localManifestPath);
	if (localManifestExists) {
		try {
			const localData = await game.promises.readFile(localManifestPath);
			const localManifest = JSON.parse(new TextDecoder().decode(localData));
			localVersion = localManifest.version || "0.0.0";
		} catch (e) {
			console.warn("读取本地manifest失败", e);
		}
	}
	const isRemoteNewer = remoteManifest.version > localVersion;
	if (!isRemoteNewer) {
		if (manual) alert(`已是最新版本(${remoteManifest.version})`);
		return;
	}
	// 白名单
	const PROTECTED_PATHS = [
		"extension/Leaderboard/rank/",
	];
	const isProtected = (filePath) => {
		return PROTECTED_PATHS.some(p => filePath.startsWith(p));
	};
	// 对比文件哈希
	const needUpdate = [];
	const hex = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
	for (const [filePath, remoteHash] of Object.entries(remoteManifest.files)) {
		if (isProtected(filePath)) continue;
		const localFullPath = `extension/鸽府包/${filePath}`;
		const exists = await game.promises.checkFile(localFullPath);
		if (!exists) {
			needUpdate.push(filePath);
			continue;
		}
		/*const isImageVideo = filePath.endsWith('.jpg') || filePath.endsWith('.gif') || filePath.endsWith('.png') || filePath.endsWith('.mp4') || filePath.endsWith('.mp3');
		if (isImageVideo) {
			continue;
		}*/
		try {
			const buf = await crypto.subtle.digest('SHA-1', await game.promises.readFile(localFullPath));
			const localHash = Array.from(new Uint8Array(buf), x => hex[x]).join('');
			if (localHash !== remoteHash) needUpdate.push(filePath);
		} catch {
			needUpdate.push(filePath);
		}
	}
	if (needUpdate.length === 0) {
		if (manual) alert(`已是最新版本(${remoteManifest.version})`);
		return;
	}
	if (manual && !confirm(`【鸽府包】发现新版本${remoteManifest.version}\n需更新${needUpdate.length}个文件，是否更新？`)) {
		return;
	}
	const prog = createProgress("更新鸽府包扩展", needUpdate.length);
	game.importedPack = true;
	const proxies = [proxy, ...getMirrorList().filter((p) => p !== proxy)];
	let failed = [];
	try {
		for (let i = 0; i < needUpdate.length; i++) {
			const file = needUpdate[i];
			prog.setFileName(`正在下载：${file}`);
			prog.setProgressValue(i + 1);
			try {
				const data = await downloadFile(file, proxies);
				const fullPath = `extension/鸽府包/${file}`;
				const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
				await game.promises.createDir(dir);
				await game.promises.writeFile(data, dir, fullPath.split('/').pop());
			} catch (e) {
				console.warn("下载失败，稍后重试：" + file, e);
				failed.push(file);
			}
			await sleep(200);
		}
		if (failed.length) {
			const retry = failed;
			failed = [];
			prog.setFileName("正在重试失败文件");
			console.log(`重试 ${retry.length} 个下载失败的文件`);
			for (const file of retry) {
				try {
					const data = await downloadFile(file, proxies);
					const fullPath = `extension/鸽府包/${file}`;
					const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
					await game.promises.createDir(dir);
					await game.promises.writeFile(data, dir, fullPath.split('/').pop());
				} catch (e) {
					console.warn("重试仍失败：" + file, e);
					failed.push(file);
				}
				await sleep(300);
			}
		}
		await game.promises.writeFile(
			JSON.stringify(remoteManifest, null, 2),
			"extension/鸽府包",
			"manifest.json"
		);
		try {
			const clean = async (dir, prefix = '') => {
				const [subDirs, files] = await game.promises.getFileList(dir);
				let all = files.map(f => prefix ? `${prefix}/${f}` : f);
				for (const d of subDirs) {
					all = all.concat(await clean(`${dir}/${d}`, prefix ? `${prefix}/${d}` : d));
				}
				return all;
			};
			const localFiles = await clean("extension/鸽府包");
			const toDelete = localFiles.filter(f =>
				!remoteManifest.files[f] &&
				f !== "manifest.json" &&
				!isProtected(f)
			);
			if (toDelete.length) {
				const delProg = createProgress("清理旧文件", toDelete.length);
				for (let i = 0; i < toDelete.length; i++) {
					delProg.setProgressValue(i + 1);
					await game.promises.removeFile(`extension/鸽府包/${toDelete[i]}`);
				}
				delProg.remove();
			}
		} catch (e) {
			console.warn("清理旧文件失败", e);
		}
		if (failed.length) {
			alert(`有 ${failed.length} 个文件下载失败：\n${failed.slice(0, 10).join("\n")}${failed.length > 10 ? "\n…" : ""}\n可重新检查更新再试一次。`);
			return;
		}
		alert("更新完成！游戏即将重启");
		game.reload();
	} catch (err) {
		console.error("更新整体异常", err);
		if (manual) alert("更新出现异常，但已跳过错误文件");
	} finally {
		prog.remove();
		delete game.importedPack;
	}
};
