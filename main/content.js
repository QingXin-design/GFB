import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import {characterRank} from '../character/characterRank.js'
import update, { fetchRemoteManifest } from '../main/update.js';
import { skill } from '../character/skill.js'
export async function content(config,pack){
	// 本包约定：silentForce = silent + forced + 不弹技名。
	// 引擎只认 silent（由 silent 连带出 forced 与 popup:false），所以这里把 silentForce 真正补齐。
	for (const id in lib.skill) {
		const info = lib.skill[id];
		if (!info || !info.silentForce) continue;
		if (!("silent" in info)) info.silent = true;
		if (!("forced" in info)) info.forced = true;
		if (!("popup" in info)) info.popup = false;
	}
    //武将评级
    lib.rank.rarity.junk.add(...characterRank.A);
	lib.rank.rarity.rare.add(...characterRank.S);
	lib.rank.rarity.epic.add(...characterRank.SS);
	lib.rank.rarity.legend.add(...characterRank.SSS);
	if (lib.config.extension_鸽府包_gfb_zxgx !== false) {
		const picked = await fetchRemoteManifest();
		if (picked) {
			const remoteManifest = picked.manifest;
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
			if (remoteManifest.version > localVersion) {
				await update(true);
			}
		}
	}
};
