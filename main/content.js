import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import {characterRank} from '../character/characterRank.js'
import update, { fetchRemoteManifest } from '../main/update.js';
import { skill } from '../character/skill.js'
export async function content(config,pack){
    //武将评级
    lib.rank.rarity.junk.add(...characterRank.A);
	lib.rank.rarity.rare.add(...characterRank.S);
	lib.rank.rarity.epic.add(...characterRank.SS);
	lib.rank.rarity.legend.add(...characterRank.SSS);
	if (lib.config.extension_鸽府包_gfb_zxgx == true) {
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
