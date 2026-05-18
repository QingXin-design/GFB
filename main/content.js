import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import {characterRank} from '../character/characterRank.js'
export async function content(config,pack){
    //武将评级
    lib.rank.rarity.junk.add(...characterRank.A);
	lib.rank.rarity.rare.add(...characterRank.S);
	lib.rank.rarity.epic.add(...characterRank.SS);
	lib.rank.rarity.legend.add(...characterRank.SSS);
};
