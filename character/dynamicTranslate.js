import {lib,game,ui,get,ai,_status} from '../../../noname.js'

let block = {
	//动态翻译
	cxm_hengzheng_rewrite(player, skill) {
		const skillname = skill + (player.storage[`${skill}_rewrite`] ? '_rewrite' : '');
		return lib.translate[`${skillname}_info`];
	},
	wzzs_zeji(player, skill) {
		const info = lib.translate.wzzs_zeji_info;
		const i = info.lastIndexOf("［］");
		return info.slice(0, i) + "［" + (player.storage.wzzs_zeji || []).map(id => lib.skill.wzzs_zeji.zejiPhase[id]).join("、") + "］" + info.slice(i + 2);
	},
};
export const dynamicTranslate=block;
