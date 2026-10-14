/* Original procedural score and effects. No downloaded music or runtime CDN. */
export class Sound {
  constructor(settings){this.settings=settings;this.ctx=null;this.nodes=[];this.mode=null;}
  async unlock(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.music=this.ctx.createGain();this.music.connect(this.ctx.destination);this.effects=this.ctx.createGain();this.effects.connect(this.ctx.destination);}try{await this.ctx.resume();this.volume();}catch{} }
  volume(){if(!this.ctx)return;this.music.gain.setTargetAtTime(Math.max(0,Math.min(1,this.settings.music))*.25,this.ctx.currentTime,.2);this.effects.gain.setTargetAtTime(Math.max(0,Math.min(1,this.settings.sfx))*.2,this.ctx.currentTime,.05);}
  tone(freq,start,duration,gain=.1,type='sine',destination=this.music){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;o.connect(g);g.connect(destination);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(gain,start+.05);g.gain.exponentialRampToValueAtTime(.001,start+duration);o.start(start);o.stop(start+duration+.1);}
  play(mode){if(!this.ctx)return;this.volume();if(this.mode===mode)return;this.mode=mode;clearInterval(this.interval);const themes={cold:[[146.83,220,293.66],[130.81,196,261.63],[164.81,220,329.63],[146.83,196,293.66]],warm:[[174.61,220,261.63],[164.81,196,261.63],[146.83,220,293.66],[196,246.94,293.66]],dawn:[[130.81,196,261.63],[174.61,220,349.23],[164.81,246.94,329.63],[146.83,220,293.66]]};const chords=themes[mode]||themes.cold;let bar=0;const phrase=()=>{if(this.ctx.state!=='running')return;const t=this.ctx.currentTime+.04,notes=chords[bar++%4];notes.forEach((n,i)=>{this.tone(n/2,t,7,.035);this.tone(n,t+i*.08,6,.02);this.tone(n*2,t+1+i*1.2,3,.045,'sine');});};phrase();this.interval=setInterval(phrase,8000);}
  click(){if(this.ctx?.state==='running')this.tone(760,this.ctx.currentTime,.07,.025,'sine',this.effects);}
  ui(){if(this.ctx?.state==='running')this.tone(1046,this.ctx.currentTime,.09,.018,'sine',this.effects);}
  signal(){if(!this.ctx)return;[0,.18,.4].forEach((d,i)=>this.tone([523.25,659.25,783.99][i],this.ctx.currentTime+d,.4,.065,'sine',this.effects));}
  pause(){this.ctx?.suspend().catch(()=>{});}
}
