from browser_support import start_server, launch_browser
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];(root/'qa').mkdir(exist_ok=True)
base_url=start_server(root)
with sync_playwright() as p:
 b=launch_browser(p)
 page=b.new_page(viewport={'width':1440,'height':900});page.set_default_timeout(15000)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base_url+'/?debug=1');page.wait_for_function('!!window.__GAME__')
 page.locator('[data-action="new"]').click();page.locator('[data-action="chapterBegin"]').click()
 page.evaluate('window.__GAME__.game.settings.speed=0;window.__GAME__.game.reveal()')
 for _ in range(4):page.locator('#dialogue').click()
 page.locator('[data-action="save"]').click();page.locator('.save-card button').first.click();page.locator('[data-action="close"]').click(force=True)
 beat=page.evaluate('window.__GAME__.game.state.beat');page.reload();page.wait_for_function('!!window.__GAME__');page.locator('#continueButton').click()
 assert page.evaluate('window.__GAME__.game.state.beat')==beat
 page.evaluate('''() => {const g=window.__GAME__.game;g.settings.speed=0;g.saves.normalWrite=g.saves.write;g.saves.write=()=>true;}''')
 # Run through actual authored choices; never inject outcome flags.
 result=page.evaluate('''async () => {const {newState,visibleChoices}=await import('./src/engine.js');const g=window.__GAME__.game;window.runRoute=(overrides={},stopAt=null)=>{g.state=newState(g.story);g.startScene(false);for(let i=0;i<120;i++){if(g.curtain){g.curtain=false;document.querySelector('#chapterCurtain').hidden=true;}g.state.beat=g.beats().length;g.renderBeat();if(g.scene().id===stopAt){g.curtain=false;document.querySelector('#chapterCurtain').hidden=true;g.state.beat=g.beats().length;g.renderBeat();return 'stopped';}if(!document.querySelector('#endingScreen').hidden)return g.state.ending;if(g.inChoice){const cs=visibleChoices(g.scene(),g.state);const c=overrides[g.state.scene]?cs.find(c=>c.id===overrides[g.state.scene]):cs[0];if(!c)throw Error('Unavailable '+g.state.scene);g.choose(c);}}throw Error('Not finished');};const routes=[{}, {'fin_04':'joint'},{'c3_witness':'avoid'},{'c4_mira_plan':'container','fin_04':'send'},{'c3_link_memory':'evidence','fin_04':'send'},{'c2_02':'deal','c4_deal_review':'uphold','fin_04':'internal'},{'c3_04':'wait','c3_contact_choice':'pretend','c4_exposed':'continue_lie','fin_04':'send'},{'fin_04':'reset'},{'c3_04':'wait','c3_contact_choice':'alone','fin_04':'send'},{'c4_03':'force'}];return routes.map(r=>window.runRoute(r));}''')
 assert result==['dawn','dawn','farshore','lastlight','witness','shelter','zero','zero','zero','zero'],result
 print('6 endings and 4 distinct failure routes verified',flush=True)
 # Locked final actions are visibly unavailable and keyboard cannot bypass them.
 page.evaluate("window.runRoute({'c3_witness':'avoid'},'fin_04')")
 assert page.locator('[data-choice="joint"]').is_disabled()
 page.keyboard.press('2');assert page.evaluate('window.__GAME__.game.state.scene')=='fin_04'
 page.screenshot(path=str(root/'qa/locked-ending-actions.png'))
 # Flowchart: go back to an earlier choice using its own state.
 page.evaluate('window.__GAME__.game.action("flow")')
 page.locator('.flow-chapters button').first.click()
 page.locator('.flow-node[data-id="c1_06"]').scroll_into_view_if_needed();page.locator('.flow-node[data-id="c1_06"]').click(force=True)
 page.screenshot(path=str(root/'qa/flow-desktop.png'))
 page.locator('.flow-options .flow-option').nth(1).click()
 page.locator('#confirmOK').click()
 assert page.evaluate('window.__GAME__.game.state.scene')=='c1_index'
 assert page.evaluate("!window.__GAME__.game.state.evidence.includes('export') && !window.__GAME__.game.state.flags.selfProtected")
 assert not page.evaluate("window.__GAME__.game.state.evidence.includes('copy')")
 print('rewind restores pre-choice state',flush=True)
 page.evaluate('window.__GAME__.game.saves.write=window.__GAME__.game.saves.normalWrite;window.__GAME__.game.save()')
 # Nodes persist after reload and flowchart remains usable on mobile.
 page.reload();page.wait_for_function('!!window.__GAME__');page.locator('#continueButton').click()
 page.set_viewport_size({'width':390,'height':844})
 page.locator('.quick-menu [data-action="flow"]').click()
 page.screenshot(path=str(root/'qa/flow-mobile.png'))
 assert page.locator('.flow-node').count()>0
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('#panel [data-action=close]').click()
 assert not page.locator('#panel').is_visible()
 page.locator('.quick-menu [data-action=flow]').click()
 assert page.locator('#panel').is_visible()
 assert not errors,errors
 print(json.dumps({'endings':result,'errors':errors,'rewind':True,'mobileFlow':True,'saveReload':True}))
 b.close()
