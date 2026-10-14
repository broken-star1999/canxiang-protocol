"""Render actual Web Audio score and check volume controls in Chromium."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import http.server,threading,functools,json
root=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8896),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8896/?debug=1');page.wait_for_function('!!window.__GAME__')
 levels=page.evaluate('''async()=>{const {Sound}=await import('./src/audio.js?v=3.3.1');async function render(volume,old=false,switches=false){const ctx=new OfflineAudioContext(1,48000*4,48000);Object.defineProperty(ctx,'state',{get:()=> 'running'});const sound=new Sound({music:volume,sfx:0});sound.connect(ctx);sound.play('warm');if(switches){for(let i=0;i<12;i++)sound.play(['cold','warm','dawn'][i%3]);}clearInterval(sound.interval);if(old)sound.music.gain.setTargetAtTime(volume*.25,0,.2);const data=(await ctx.startRendering()).getChannelData(0);let sum=0,peak=0;for(const v of data){sum+=v*v;peak=Math.max(peak,Math.abs(v));}return {rms:Math.sqrt(sum/data.length),peak};}const old=await render(.35,true),current=await render(.35),maximum=await render(1),muted=await render(0),transitions=await render(1,false,true);return {old,current,maximum,muted,transitions,gainDb:20*Math.log10(current.rms/old.rms)};}''')
 assert levels['current']['rms']>levels['old']['rms']*5,levels
 assert levels['muted']['peak']==0,levels
 assert levels['maximum']['peak']<.95 and levels['transitions']['peak']<.95,levels
 page.locator('.title-menu [data-action="settings"]').click()
 page.wait_for_function('window.__GAME__.game.sound.ctx.state==="running"&&window.__GAME__.game.sound.voices.size>0')
 # The very first interaction starts the score without waiting for its eight-second loop.
 assert page.evaluate('window.__GAME__.game.sound.ctx.currentTime')<3
 page.evaluate('''()=>{const input=document.querySelector('#setting-music');input.value=0;input.dispatchEvent(new Event('input'));}''')
 page.wait_for_timeout(250)
 assert page.evaluate('window.__GAME__.game.sound.music.gain.value')<.005
 page.reload();page.wait_for_function('!!window.__GAME__');assert page.evaluate('window.__GAME__.game.settings.music')==0
 page.locator('.title-menu [data-action="settings"]').click();page.evaluate('''()=>{const input=document.querySelector('#setting-music');input.value=.5;input.dispatchEvent(new Event('input'));}''')
 page.wait_for_timeout(700);assert page.evaluate('window.__GAME__.game.sound.music.gain.value')>.8
 page.evaluate('''async()=>{const sound=window.__GAME__.game.sound;await sound.ctx.suspend();await sound.unlock();}''');assert page.evaluate('window.__GAME__.game.sound.ctx.state')=='running'
 page.locator('#panel [data-action="close"]').click();page.locator('.title-menu [data-action="new"]').click()
 page.wait_for_function('window.__GAME__.game.sound.mode==="cold"')
 assert not errors,errors
 print(json.dumps({'levels':levels,'firstClickStartsScore':True,'mutePersists':True,'slider':True,'sceneChange':True,'resume':True,'errors':errors}),flush=True);b.close()
srv.shutdown()
