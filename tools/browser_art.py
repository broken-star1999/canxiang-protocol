from browser_support import start_server, launch_browser
"""Inspect every production portrait in authored context, plus CG/gallery/replay behavior."""
from playwright.sync_api import sync_playwright
from pathlib import Path
from PIL import Image,ImageDraw
import json
root=Path(__file__).resolve().parents[1];out=root/'qa/art';out.mkdir(parents=True,exist_ok=True)
story=json.loads((root/'src/story.json').read_text(encoding='utf-8'));art=json.loads((root/'assets/manifest.json').read_text(encoding='utf-8'))
people={'mira':'MIRA','zhou':'周衡','lin':'林述','tang':'唐棠'}
fixtures=[]
for person,poses in art['characters'].items():
 seen=set()
 for mood,path in poses.items():
  if path in seen:continue
  seen.add(path)
  if mood=='wounded':fixtures.append((person,mood,path,'c4_record',7,{'zhouWounded':True}));continue
  if mood=='reset':fixtures.append((person,mood,path,'end_lastlight',9,{}));continue
  candidate=None
  for sid,s in story['scenes'].items():
   costume=s.get('costumes',{}).get(person)
   for i,b in enumerate(s['beats']):
    key=(costume+'-' if costume else '')+b.get('emotion','neutral')
    if b['speaker']==people[person] and poses.get(key)==path and not b.get('cg'):
     candidate=(person,key,path,sid,i,{});break
   if candidate:break
  assert candidate,('Unused portrait has no authored context',person,mood,path)
  fixtures.append(candidate)
base_url=start_server(root)
with sync_playwright() as p:
 browser=launch_browser(p);page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base_url+'/?debug=1');page.wait_for_function('!!window.__GAME__')
 page.evaluate('''()=>{const g=window.__GAME__.game;g.settings.speed=0;g.settings.reduced=true;g.applySettings();g.saves.write=()=>true;window.inspectScene=async(sid,index,flags={})=>{const {newState,chapterFor}=await import('./src/engine.js?v=4');g.state=newState(g.story);g.state.scene=sid;g.state.chapter=chapterFor(g.story,sid).id;g.state.flags=flags;g.state.evidence=Object.keys(g.story.evidence);g.state.values={trust:4,zhou:4,self:4};g.startScene();g.state.beat=g.beats().findIndex(b=>b===g.scene().beats[index]);if(g.state.beat<0)throw Error('Conditional beat not available');g.renderBeat();};}''')
 report=[]
 for person,mood,path,sid,index,flags in fixtures:
  page.evaluate('''async args=>window.inspectScene(...args)''',[sid,index,flags])
  slot='Center' if person=='tang' else 'Right' if person=='mira' else 'Left'
  selector='#sprite'+slot
  page.wait_for_function('''args=>{const img=document.querySelector(args[0]+' .portrait-main');return img.complete&&img.naturalWidth>0&&img.getAttribute('src')===args[1]&&document.querySelector(args[0]).classList.contains('visible');}''',arg=[selector,path])
  page.wait_for_timeout(70)
  page.screenshot(path=str(out/(person+'-'+mood+'.png')))
  report.append({'character':person,'pose':mood,'scene':sid,'beat':index,'image':path,'desktop':True})
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(out/(person+'-'+mood+'-mobile.png')))
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  report[-1]['mobile']=True;page.set_viewport_size({'width':1440,'height':900})
 # Check scene transitions and physical state beyond the representative portraits.
 page.evaluate('''()=>window.inspectScene('c4_record',2,{zhouWounded:true})''');assert page.evaluate('window.__GAME__.game.lastBg')=='archive-alert'
 assert '维护区' in page.locator('#communication').inner_text()
 assert 'wounded' not in page.locator('#spriteLeft .portrait-main').get_attribute('src')
 page.evaluate('''()=>window.inspectScene('c4_injury',2,{zhouLost:true})''');assert page.locator('#spriteLeft.visible').count()==0
 page.evaluate('''()=>window.inspectScene('c4_rescue',8)''');assert page.evaluate('window.__GAME__.game.lastBg')=='bridge-dawn'
 page.evaluate('''()=>window.inspectScene('end_farshore',2)''');assert page.locator('#communication').is_hidden();assert page.locator('#spriteCenter.remote').count()==0
 for key,sid,index in [('awakening','c1_arm',1),('rescue','c4_rescue',3),('reset','end_lastlight',6),('departure','end_dawn',6)]:
  page.evaluate('''async args=>window.inspectScene(...args)''',[sid,index,{}])
  page.wait_for_function('''key=>document.querySelector('#eventCG').dataset.key===key&&document.querySelector('#eventCGImage').complete&&document.querySelector('#eventCGImage').naturalWidth>0''',arg=key)
  assert page.locator('.sprite.visible').count()==0
  page.screenshot(path=str(out/('cg-'+key+'.png')))
  page.locator('#cgView').click();assert page.locator('#dialogueArea').is_hidden();page.locator('#restoreUI').click();assert page.locator('#dialogueArea').is_visible()
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(out/('cg-'+key+'-mobile.png')))
  rect=page.locator('#eventCGImage').bounding_box();assert rect['x']>=0 and rect['width']<=391
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.set_viewport_size({'width':1440,'height':900})
 # Old saves at the middle of a CG reconstruct the correct picture on reload.
 page.evaluate('window.__GAME__.game.saves.write=window.__GAME__.game.saves.constructor.prototype.write;window.__GAME__.game.save()')
 page.reload();page.wait_for_function('!!window.__GAME__');page.locator('#continueButton').click()
 page.wait_for_function('document.querySelector("#eventCG").dataset.key==="departure"')
 page.evaluate('window.__GAME__.game.archive("cgs")');assert page.locator('.cg-grid img').count()==4
 page.locator('.cg-grid button').first.click();assert page.locator('.cg-gallery-image').is_visible()
 page.locator('#panel [data-action="close"]').click()
 # A clean browser receives no CG spoilers.
 clean=browser.new_page();clean.goto(base_url+'/?debug=1');clean.wait_for_function('!!window.__GAME__');clean.evaluate('window.__GAME__.game.archive("cgs")')
 assert clean.locator('.cg-grid img').count()==0;assert clean.locator('.cg-grid .locked').count()==4
 clean.evaluate('window.__GAME__.game.closePanel();localStorage.setItem("canxiang:vn:v1","{}")');clean.reload();clean.wait_for_function('!!window.__GAME__')
 assert clean.locator('.title-footer a').count()==0
 assert clean.locator('#continueLabel').inner_text()=='尚未开始的清晨'
 clean.evaluate('window.__GAME__.game.credits()');assert '重写版' not in clean.locator('#panelBody').inner_text()
 clean.evaluate('window.__GAME__.game.settingsPanel()');assert clean.locator('.backup-actions a').count()==0
 assert not errors,errors
 (out/'report.json').write_text(json.dumps({'portraits':report,'cgs':4,'errors':errors},ensure_ascii=False,indent=2), encoding='utf-8')
 print(json.dumps({'portraits':len(report),'desktopMobile':True,'cgs':4,'cgReload':True,'gallerySpoilerLocks':True,'errors':errors}),flush=True);browser.close()
# Contact sheets of browser captures only; source production art is not modified.
for person in people:
 rows=[r for r in report if r['character']==person]
 sheet=Image.new('RGB',(1440,450*((len(rows)+1)//2)), '#10242e');draw=ImageDraw.Draw(sheet)
 for i,r in enumerate(rows):
  im=Image.open(out/(person+'-'+r['pose']+'.png')).resize((720,450))
  x,y=(i%2)*720,(i//2)*450;sheet.paste(im,(x,y));draw.rectangle((x+5,y+5,x+390,y+27),fill='#10242e');draw.text((x+10,y+9),person+' / '+r['pose']+' / '+r['scene'],fill='#f0eddb')
 sheet.save(out/(person+'-sheet.jpg'),quality=92)
for suffix in ['', '-mobile']:
 files=[out/('cg-'+key+suffix+'.png') for key in art['cgs']]
 w,h=(720,450) if not suffix else (390,844)
 sheet=Image.new('RGB',(w*2,h*2),'#10242e')
 for i,file in enumerate(files):sheet.paste(Image.open(file).resize((w,h)),((i%2)*w,(i//2)*h))
 sheet.save(out/('cg-sheet'+suffix+'.jpg'),quality=93)
