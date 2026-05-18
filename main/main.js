import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import {character} from '../character/index.js'
import {skill} from '../character/skill.js'
import {basic} from './basic.js'
export let extensionDefaultPackage = async function(){
    return {
        character:await basic.resolve(character),
        skill:await basic.resolve(skill),
    };
}