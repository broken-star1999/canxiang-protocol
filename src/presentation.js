/* Art selection is derived from authored context and never changes story state. */
export function portraitFor(art,scene,state,id,emotion='neutral',beatIndex=state.beat){
 let mood=emotion;
 if(id==='zhou'&&state.flags.zhouWounded&&(scene.id!=='c4_record'||beatIndex>=5))mood='wounded';
 const costume=scene.costumes?.[id];
 const key=costume?costume+'-'+mood:mood;
 return art.characters[id][key]||art.characters[id][costume?costume+'-neutral':'neutral'];
}
export function discoveredCGs(story,read){
 const ids=new Set(read),found=new Set();
 for(const scene of Object.values(story.scenes))scene.beats.forEach((beat,i)=>{if(beat.cg&&ids.has(scene.id+':'+i))found.add(beat.cg);});
 return found;
}
