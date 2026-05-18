import {lib,game,ui,get,ai,_status} from '../../../noname.js'
const outcrop=lib.config.extension_鸽府包_outcrop?lib.config.extension_鸽府包_outcrop:'stand';
let block={//转换技切换皮肤
    'gf_XXX':[
        ['gf_XXX_shadow',['ext:鸽府包/image/character/'+outcrop+'/gf_XXX_shadow.jpg']],
    ],
};
export const characterSubstitute=block;