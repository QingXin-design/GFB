import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import {characterRank} from '../character/characterRank.js'
import update from '../main/update.js';
export async function content(config,pack){
    //武将评级
    lib.rank.rarity.junk.add(...characterRank.A);
	lib.rank.rarity.rare.add(...characterRank.S);
	lib.rank.rarity.epic.add(...characterRank.SS);
	lib.rank.rarity.legend.add(...characterRank.SSS);
	if (lib.config.extension_鸽府包_gfb_zxgx == true) {
		let needUpdateVersion = false;
		const proxyList = [
			"",
			"https://gh-proxy.com/",
			"https://hk.gh-proxy.com/",
			"https://tvv.tw/",
		];
		let proxy = proxyList[lib.config.extension_鸽府包_update_source] || "";
		let remoteManifest = null;
		let success = false;
		for (const p of [proxy, ...proxyList.filter(x => x !== proxy)]) {
			try {
				const url = `${p}https://raw.githubusercontent.com/QingXin-design/GFB/main/manifest.json`;
				const controller = new AbortController();
				const timer = setTimeout(() => controller.abort(), 10000);
				const res = await fetch(url, { signal: controller.signal });
				clearTimeout(timer);
				if (res.ok) {
					remoteManifest = await res.json();
					success = true;
					break;
				}
			} catch (e) {}
		}
		if (success) {
			let localVersion = "0.0.0";
			const localManifestPath = "extension/鸽府包/manifest.json";
			const localManifestExists = await game.promises.checkFile(localManifestPath);
			if (localManifestExists) {
				try {
					const localData = await game.promises.readFile(localManifestPath);
					const localManifest = JSON.parse(new TextDecoder().decode(localData));
					localVersion = localManifest.version || "0.0.0";
				} catch (e) {}
			}
			if (remoteManifest > localVersion) {
				needUpdateVersion = true;
			}
		}
		if (needUpdateVersion) {
			await update(true);
		}
	}
};
