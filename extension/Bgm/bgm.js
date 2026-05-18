	import {lib,game,ui,get,ai,_status} from '../../../../noname.js'
    	
    game.createBgm=function(url,volume,loop,replace){//添加Bgm
        if(!game.animationBgm)game.animationBgm={};
        game.closeBgm();
        if(replace)ui.backgroundMusic.volume=0;
        if(game.animationBgm[url]){
            game.closeBgm(true,true,url);
            return;
        };
        const audio=document.createElement('audio');
        audio.volume=volume?volume:1;
        audio.src=lib.assetURL+'extension/鸽府包/'+url;
        if(loop===true)audio.loop=true;
        audio.autoplay=true;
        if(url)game.animationBgm[url]=audio;
        else game.animationBgm.all=audio;
    };
    
    game.changeBgmVolume=function(target,volume){//调整Bgm音量
        if(game.animationBgm){
            volume=Math.min(Math.max(volume,0),1);
            if(target)game.animationBgm[target].volume=volume;
            else game.animationBgm.all.volume=volume;
        };
    };
    
    game.closeBgm=function(isPlaying,replace,target){//开关Bgm
        if(game.animationBgm){
            if(isPlaying){
                for(let i in game.animationBgm){
                    game.closeBgm(false,false,i);
                };
                if(target)game.animationBgm[target].play();
                else game.animationBgm.all.play();
                if(replace)ui.backgroundMusic.volume=0;
            }else{
                if(target)game.animationBgm[target].pause();
                else{
                    for(let i in game.animationBgm){
                        game.closeBgm(false,false,i);
                    };
                };
                ui.backgroundMusic.volume=lib.config.volumn_background/8;
            };
        };
    };