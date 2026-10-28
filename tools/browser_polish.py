from browser_support import start_server, launch_browser
from playwright.sync_api import sync_playwright
from pathlib import Path
import http.server,threading,functools,json
root=Path(__file__).resolve().parents[1]
base_url=start_server(root)
with sync_playwright() as p:
 b=launch_browser(p)
 page=b.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base_url+'/?debug=1');page.wait_for_function('!!window.__GAME__');page.wait_for_timeout(1500)
 page.screenshot(path=str(root/'qa/title-polish.png'))
 for i in range(15):page.mouse.move(600+i*12,350+i*3);page.wait_for_timeout(45)
 assert page.locator('.cursor-star:not([hidden])').count()>0
 assert page.locator('.cursor-star').count()==48
 assert page.locator('.cursor-star.spark:not([hidden])').count()>0
 page.screenshot(path=str(root/'qa/cursor-soft.png'))
 assert page.locator('.cursor-star:not([hidden])').evaluate_all('(nodes)=>nodes.every(n=>parseFloat(n.style.width)>=10)')
 page.wait_for_timeout(1000)
 assert page.locator('.cursor-star:not([hidden])').count()==0
 page.locator('.title-menu [data-action="new"]').click();page.wait_for_timeout(1100);page.screenshot(path=str(root/'qa/chapter-polish.png'))
 page.locator('[data-action="chapterBegin"]').click();page.evaluate('window.__GAME__.game.settings.speed=0;window.__GAME__.game.reveal()')
 for _ in range(4):page.locator('#dialogue').click()
 page.wait_for_timeout(700);page.screenshot(path=str(root/'qa/game-polish.png'))
 assert page.locator('.sprite.visible .portrait-main').count()>0
 assert page.locator('.sprite.visible .portrait-main').evaluate_all('(imgs)=>imgs.every(i=>i.complete&&i.naturalWidth>0)')
 page.evaluate('''async()=>{const g=window.__GAME__.game;const slot=document.querySelector('#spriteRight');for(const mood of ['concern','serious','neutral'])g.effects.portrait(slot,g.art.characters.mira[mood],'mira');await new Promise(r=>setTimeout(r,500));if(slot.querySelector('.portrait-main').getAttribute('src')!==g.art.characters.mira.neutral)throw Error('Stale portrait applied');}''')
 page.evaluate('''()=>{const g=window.__GAME__.game;g.state.scene='c1_02';g.state.beat=0;g.startScene();g.effects.reward('evidence','急停记录');g.state.beat=g.beats().length;g.renderBeat();}''')
 page.wait_for_timeout(600);page.screenshot(path=str(root/'qa/choice-polish.png'))
 assert page.locator('[data-choice]').count()>0
 page.locator('[data-choice]:enabled').first.click();assert page.locator('.decision-ghost').count()==1
 page.evaluate('window.__GAME__.game.showTitle()');page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(1500);page.screenshot(path=str(root/'qa/title-mobile-polish.png'))
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(150)
 assert page.evaluate('document.body.classList.contains("reduced")')
 assert page.evaluate('getComputedStyle(document.querySelector("#cursorStars")).display==="none"')
 assert page.evaluate('window.__GAME__.game.effects.active.size===0')
 page.locator('.title-menu [data-action="settings"]').click();assert page.locator('#panel').is_visible()
 assert page.locator('#setting-font').is_visible()
 assert not errors,errors
 print(json.dumps({'stars':'bounded 48-node pool','reducedMotion':True,'desktopMobile':True,'errors':errors}))
 b.close()
srv.shutdown()
