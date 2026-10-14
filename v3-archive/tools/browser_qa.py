from playwright.sync_api import sync_playwright
from pathlib import Path
import http.server,threading,functools,json
root=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',8890),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900})
 page.set_default_timeout(12000)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8890/?debug=1')
 page.wait_for_function('!!window.__GAME__')
 page.wait_for_timeout(400)
 page.screenshot(path=str(root/'qa/title-desktop.png'))
 page.locator('[data-action="new"]').click()
 page.locator('[data-action="chapterBegin"]').click()
 page.evaluate('window.__GAME__.game.settings.speed=0')
 page.evaluate('window.__GAME__.game.reveal()')
 for _ in range(4):page.locator('#dialogue').click()
 page.wait_for_timeout(500)
 page.screenshot(path=str(root/'qa/game-desktop.png'))
 print('game rendered',flush=True)
 assert page.locator('#speaker').inner_text()=='MIRA'
 page.locator('[data-action="save"]').click()
 page.locator('.save-card button').first.click()
 page.locator('[data-action="close"]').click(force=True)
 print('save closed',flush=True)
 old=page.evaluate('window.__GAME__.game.state.beat')
 page.reload();page.wait_for_function('!!window.__GAME__')
 page.locator('#continueButton').click()
 assert page.evaluate('window.__GAME__.game.state.beat')==old
 page.evaluate('window.__GAME__.game.settings.speed=0')
 result=page.evaluate('''() => {const g=window.__GAME__.game;const endings=[];for(const route of ['public','joint','audit']){g.state=JSON.parse(JSON.stringify({version:1,scene:'c1_01',beat:0,chapter:'c1',values:{trust:0,zhou:0,self:0},flags:{},evidence:[],echoes:[],history:[],checkpoints:{},choices:[],ending:null,startedAt:Date.now(),lastSaved:Date.now()}));g.startScene(false);for(let n=0;n<100;n++){if(g.curtain){g.curtain=false;document.querySelector('#chapterCurtain').hidden=true;}g.state.beat=g.beats().length;g.renderBeat();if(!document.querySelector('#endingScreen').hidden){endings.push(g.state.ending);break;}if(g.inChoice){const cs=g.scene().choices;g.choose(cs.find(c=>c.id===route)||cs[0]);}}}return endings;}''')
 assert result==['witness','together','shelter'],result
 print('endings verified',flush=True)
 page.screenshot(path=str(root/'qa/ending-desktop.png'))
 # Verify a real choice and a warm scene layout.
 page.evaluate("const g=window.__GAME__.game;g.state.scene='c2_02';g.state.ending=null;g.state.beat=0;g.startScene(false);g.curtain=false;document.querySelector('#chapterCurtain').hidden=true;g.state.beat=g.beats().length;g.renderBeat();")
 page.screenshot(path=str(root/'qa/choice-desktop.png'))
 assert page.locator('#choiceButtons button').count()==2
 page.locator('#choiceButtons button').first.click()
 page.evaluate('window.__GAME__.game.reveal()')
 page.wait_for_timeout(600)
 page.screenshot(path=str(root/'qa/tea-desktop.png'))
 # Emergency timer pauses in menus and expires into a valid route.
 page.evaluate("const g=window.__GAME__.game;g.settings.timed=true;g.state.scene='c4_03';g.state.beat=0;g.startScene(false);g.curtain=false;document.querySelector('#chapterCurtain').hidden=true;g.state.beat=g.beats().length;g.renderBeat();g.menu();")
 before=page.evaluate('window.__GAME__.game.choiceRemaining')
 page.wait_for_timeout(500)
 after=page.evaluate('window.__GAME__.game.choiceRemaining')
 assert abs(before-after)<.2
 page.locator('[data-action="close"]').click(force=True)
 page.evaluate('window.__GAME__.game.choiceRemaining=.1')
 page.wait_for_timeout(250)
 assert page.evaluate('window.__GAME__.game.state.scene')=='c4_rescue'
 # Mobile screenshots and overflow checks.
 page.set_viewport_size({'width':390,'height':844})
 page.evaluate('window.__GAME__.game.showTitle()')
 page.wait_for_timeout(1100)
 page.screenshot(path=str(root/'qa/title-mobile.png'))
 page.evaluate("const g=window.__GAME__.game;g.state.scene='c3_08';g.state.beat=2;g.startScene(false);g.curtain=false;document.querySelector('#chapterCurtain').hidden=true;g.renderBeat();g.reveal()")
 page.wait_for_timeout(1100)
 page.screenshot(path=str(root/'qa/game-mobile.png'))
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('[data-action="settings"]').last.click()
 page.screenshot(path=str(root/'qa/settings-mobile.png'))
 # All visible loaded sprites have decoded successfully.
 assert page.evaluate("Array.from(document.querySelectorAll('.sprite.visible img')).every(i=>i.complete&&i.naturalWidth>0)")
 print(json.dumps({'endings':result,'errors':errors,'timerPaused':True,'saveReload':True,'mobileOverflow':False},ensure_ascii=False))
 assert not errors,errors
 b.close()
server.shutdown()
