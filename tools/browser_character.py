from browser_support import start_server, launch_browser
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];(root/'qa').mkdir(exist_ok=True)
base_url=start_server(root)
with sync_playwright() as p:
 b=launch_browser(p);page=b.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base_url+'/?debug=1');page.wait_for_function('!!window.__GAME__')
 page.locator('.title-menu [data-action="new"]').click();page.locator('[data-action="chapterBegin"]').click()
 page.evaluate('''()=>{const g=window.__GAME__.game;g.settings.speed=0;g.state.scene='c2_01';g.state.chapter='c2';g.state.beat=5;g.startScene();}''')
 page.wait_for_timeout(1000)
 for mood in ['neutral','concern','serious']:
  page.evaluate('''mood=>{const g=window.__GAME__.game;window.zhouMood=mood;g.effects.portrait(document.querySelector('#spriteLeft'),g.art.characters.zhou[mood],'zhou');}''',mood)
  page.wait_for_timeout(500)
  assert page.locator('#spriteLeft .portrait-main').evaluate('(i)=>i.complete&&i.naturalWidth>0&&i.getAttribute("src")===window.__GAME__.game.art.characters.zhou[window.zhouMood]')
  page.screenshot(path=str(root/'qa'/('zhou-practical-'+mood+'.png')))
 page.evaluate('''()=>{const g=window.__GAME__.game;g.state.scene='c2_03';g.state.beat=0;g.startScene();g.state.beat=g.beats().length-1;g.renderBeat();}''')
 page.wait_for_timeout(600)
 assert page.locator('#spriteLeft.visible .portrait-main').is_visible()
 assert page.locator('#spriteRight.visible .portrait-main').is_visible()
 page.screenshot(path=str(root/'qa/zhou-mira-together.png'))
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(root/'qa/zhou-practical-mobile.png'))
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print(json.dumps({'expressions':3,'transparentSpritesLoaded':True,'mobile':True,'errors':errors}));b.close()
