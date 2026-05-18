import {lib,game,ui,get,ai,_status} from '../../../../noname.js'
import {characterData} from '../../character/characterData.js'
import {characterSubstitute} from '../../character/characterSubstitute.js'

lib.init.css(lib.assetURL + 'extension/鸽府包/extension/CreateCharacterSkill', 'createCharacterSkill');
game.createCharacterSkill=function(character) {
    let allPackList = lib.config.all.characters.slice(0);
	allPackList.addArray(Object.keys(lib.characterPack));
    var node = ui.create.div('.popup-container', ui.window, function(e) {
        if (e.target === node || e.target === nodeBg) {
            node.delete();
            node = null;
        }
    });
    let nodeBg = ui.create.div('.skillsDialog', node);
    // 添加拖拽移动功能
    (function draggable(el) {
        let isDragging = false;
        let startX, startY, elX, elY;
        // 鼠标事件
        el.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);
        // 触屏事件
        el.addEventListener('touchstart', startDrag, {passive: true});
        document.addEventListener('touchmove', doDrag, {passive: false});
        document.addEventListener('touchend', endDrag);

        function startDrag(e) {
            // 排除技能滚动区域right衍生技区域yanshengBg
            const target = e.target || e.touches?.[0].target;
            if (target.closest('.right') || target.closest('.yanshengBg')) return;
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const rect = el.getBoundingClientRect();
            startX = clientX - rect.left;
            startY = clientY - rect.top;
            elX = rect.left;
            elY = rect.top;
            el.style.zIndex = 99999;
            document.body.style.userSelect = 'none';
        }

        function doDrag(e) {
            if (!isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const newX = clientX - startX;
            const newY = clientY - startY;
            el.style.position = 'fixed';
            el.style.left = `${newX}px`;
            el.style.top = `${newY}px`;
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            if (e.touches) e.preventDefault();
        }

        function endDrag() {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.userSelect = '';
        }
    })(nodeBg);
    var leftPane = ui.create.div('.left', nodeBg);
    var rightPane = ui.create.div('.right', nodeBg);
    var group;
    if (lib.character[character]) group = lib.character[character].group;
    else {
        for (let name of allPackList) {
            if (lib.characterPack[name][character]) group = lib.characterPack[name][character].group;
        }
    };
    let groupImg=new Image();
	groupImg.src=lib.assetURL + 'extension/鸽府包/extension/CreateCharacterSkill/image/' + group + '.png';
	groupImg.onload = function() {
        nodeBg.style.backgroundImage='url("'+groupImg.src+'")'
    };
    groupImg.onerror = function() {
        nodeBg.style.backgroundImage = 'url("' + lib.assetURL + 'extension/鸽府包/extension/CreateCharacterSkill/image/default.png")';
    };
    var image = ui.create.div('.charImage', nodeBg);
    if(characterData[character]){
        image.setBackgroundImage('extension/鸽府包/image/character/stand/'+character+'.jpg');
        image.style.webkitMask='none';
        image.style.backgroundRepeat='none';
        if(characterSubstitute[character]){
            var skins='_shadow';
            const skinChange=ui.create.div('.skinChange',nodeBg,function(e){
                e.stopPropagation();
                image.setBackgroundImage('extension/鸽府包/image/character/stand/'+character+skins+'.jpg');
                skinChange.setBackgroundImage('extension/鸽府包/extension/CreateCharacterSkill/image/skin'+skins+'.png');
                skins=skins=='_shadow'?'':'_shadow';
            });
        };
    }else{
        game.getFileList('image/stand', function(folders, files) {
            if(files.includes(character+'.jpg')){
                image.setBackgroundImage('image/stand/'+character+'.jpg');
                image.style.webkitMask='none';
                image.style.backgroundRepeat='none';
            }else image.setBackground(character, 'character');
        },function(){
            image.setBackground(character, 'character');
        });
    };
    const name = lib.translate[character + '_prefix'] ? `${get.prefixSpan(get.translation(character + '_prefix'), character)}${get.rawName(character)}` : get.translation(character);
    var pe = ui.create.div('.skinType', nodeBg);
    var skintype = ui.create.div('.skinTypeText', '经典*' + name);
    pe.appendChild(skintype);
    // 武将姓名
    var namestyle = ui.create.div('.name', name, nodeBg);
    namestyle.dataset.camp = group;
    //分包
    var getPack = function(name) {
        const pack = Object.keys(lib.characterPack).find(pack => lib.characterPack[pack][name]);
        if (pack) {
            if (lib.characterSort[pack]) {
                const sort = Object.keys(lib.characterSort[pack]).find(sort => lib.characterSort[pack][sort].includes(name));
                if (sort) return lib.translate[sort];
            }
            return lib.translate[pack + '_character_config'] || lib.translate[pack];
        }
        return '暂无分包';
    };
    ui.create.div('.pack', getPack(character), nodeBg);
    leftPane.innerHTML = '<div></div>';
    rightPane.innerHTML = '<div></div>';
    let skillBg=ui.create.div('.skillBg',rightPane);
    lib.setScroll(rightPane.firstChild);
    let oSkills=[];
    if (lib.character[character]) oSkills = lib.character[character].skills;
    else {
        for (let name of allPackList) {
            if (lib.characterPack[name][character]) oSkills = lib.characterPack[name][character].skills;
        }
    };
    if (oSkills.length) {
        let bool=false;
        oSkills.forEach(function(skill) {
            var translation = lib.translate[skill];
            if (translation && lib.translate[skill + '_info'] && translation != '' && lib.translate[skill + '_info'] != '') {
                ui.create.div('.xskill', '<div data-color>' + translation + '</div>' + '<div>' + get.skillInfoTranslation(skill) + '</div>', skillBg);
            };
            if(get.info(skill).derivation)bool=true;
        });
        if(bool){
            const yanshengBg=ui.create.div('.yanshengBg',nodeBg);
            yanshengBg.innerHTML = '<div></div>';
            ui.create.div('.yanshengName','衍生技',yanshengBg);
            const skillsBg=ui.create.div('.skillsBg',yanshengBg);
            function createYanshengSkill(skill){
                ui.create.div('.xskill', '<div data-color>' + get.translation(skill) + '</div>' + '<div>' + get.skillInfoTranslation(skill) + '</div>', skillsBg);
            };
            for(let name of oSkills){
	            let info =get.info(name);
	            if (info.derivation) {
					if (Array.isArray(info.derivation)) {
						for (let skill of info.derivation) {
							createYanshengSkill(skill);
						}
					} else {
						createYanshengSkill(info.derivation);
					}
				}
            }
        }
    }
    return node;
};