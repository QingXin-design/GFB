import {lib,game,ui,get,ai,_status} from '../../../noname.js'
let block = {
	//动态翻译
	cxm_hengzheng_rewrite(player, skill) {
		const skillname = skill + (player.storage[`${skill}_rewrite`] ? '_rewrite' : '');
		return lib.translate[`${skillname}_info`];
	}
};
export const dynamicTranslate=block;
