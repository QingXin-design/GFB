    import {lib,game,ui,get,ai,_status} from '../../../../noname.js'

    lib.init.css(lib.assetURL+'extension/鸽府包/extension/Plot','plot');//加载css
    game.addPlot=function(target,text,isRight,next,callback){//剧情函数
		let container=ui.create.div(".popup-container",ui.window,function(event){
		    container.remove();
		    if(next)game.addPlot(...next);
		    if(callback&&typeof callback==='function')callback();
		});
		let plotBg=ui.create.div('.plotBg',container);
		let plotChar=ui.create.div(isRight?'.plotChar-right':'.plotChar-left',plotBg);
		let textBg=ui.create.div('.plotTextBg',plotBg);
		let textContent=ui.create.div('.plotText',text?text:'……',textBg);
		if(!target)return;
		if(typeof target==='object')plotChar.setBackground(target.name,'character');
        else plotChar.setBackground('extension/鸽府包/'+target);
    };