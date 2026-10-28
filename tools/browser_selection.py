from browser_support import start_server, launch_browser
"""Reproduce double-click selection and map drag gestures in Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1]
base_url=start_server(root)
with sync_playwright() as p:
 browser=launch_browser(p)
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base_url+'/?debug=1');page.wait_for_function('!!window.__GAME__')
 page.locator('.title-copy h1').dblclick()
 assert page.evaluate('getSelection().toString()')==''
 page.evaluate('''()=>{const g=window.__GAME__.game;g.saves.data.collection.nodes=g.story.chapters[0].scenes;g.action('flow');window.nativeDrags=0;document.addEventListener('dragstart',()=>window.nativeDrags++);}''')
 node=page.locator('.flow-node').first
 node.scroll_into_view_if_needed();node.locator('span').dblclick()
 assert page.evaluate('getSelection().toString()')==''
 assert node.evaluate('(n)=>n.classList.contains("selected")')
 assert not node.locator('img').evaluate('(i)=>i.draggable')
 box=node.locator('img').bounding_box();page.mouse.move(box['x']+30,box['y']+25);page.mouse.down();page.mouse.move(box['x']+100,box['y']+50,steps=8);page.mouse.up()
 assert page.evaluate('window.nativeDrags')==0
 assert page.evaluate('getSelection().toString()')==''
 # Drag an empty region of the map; it must pan rather than select text.
 scroll=page.locator('.flow-scroll');rect=scroll.bounding_box()
 page.evaluate('''()=>{const s=document.querySelector('.flow-scroll');s.scrollLeft=200;s.scrollTop=0;}''')
 x,y=rect['x']+rect['width']/2,rect['y']+10
 assert page.evaluate('''p=>!document.elementFromPoint(...p).closest('.flow-node')''',[x,y])
 before=scroll.evaluate('(s)=>s.scrollLeft')
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-120,y,steps=10);page.mouse.up()
 assert scroll.evaluate('(s)=>s.scrollLeft')>before+100
 assert scroll.evaluate('(s)=>s.style.cursor')==''
 assert page.evaluate('getSelection().toString()')==''
 # Text-entry controls remain editable and selectable (future import/name fields).
 page.evaluate('''()=>{const t=document.createElement('textarea');t.id='selectionProbe';t.value='可以正常选择和编辑';document.querySelector('.flow-detail').prepend(t);}''')
 text=page.locator('#selectionProbe');text.focus();page.keyboard.press('Control+a')
 assert text.evaluate('(t)=>t.selectionEnd-t.selectionStart')==len('可以正常选择和编辑')
 assert text.evaluate('(t)=>getComputedStyle(t).userSelect')=='text'
 page.keyboard.insert_text('修改成功');assert text.input_value()=='修改成功'
 assert not errors,errors
 print(json.dumps({'doubleClickSelection':False,'nativeImageDrag':False,'mapPan':True,'nodeClick':True,'textInput':True,'errors':errors}))
 browser.close()
