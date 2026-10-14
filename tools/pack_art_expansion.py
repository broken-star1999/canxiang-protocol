"""Crop inspected V3.3 atlases at transparent gaps; encode without repainting."""
from pathlib import Path
from PIL import Image
import numpy as np,json,shutil,concurrent.futures
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art/v3-source';SOURCE.mkdir(exist_ok=True)
MANIFEST=ROOT/'assets/manifest.json'
SPRITES=[
 ('mira','mira-states','exec-348b6493-2484-49d1-a462-da12bbd4d3af.png',['hurt','relief','reset']),
 ('zhou','zhou-states','exec-d96f5e58-8e09-4416-9ed2-3e232df72071.png',['evasive','admit','wounded']),
 ('lin','lin-medical','exec-869701a0-878a-4e64-b1ab-7be7e25ad384.png',['medical-neutral','medical-concern','medical-smile']),
 ('tang','tang-states','exec-78c9f305-7cc9-4d30-a251-750039a2bf36.png',['greeting','shock','accept'])]
BACKGROUNDS=[
 ('locations-tense','exec-8576b3e5-1411-4591-842e-df7464f6c3e4.png',['medical','maintenance','bridge-night','archive-alert']),
 ('locations-warm','exec-35623625-887d-4abd-8042-f810b4b4c049.png',['bridge-dawn','tea-empty','dock','home-day'])]
CGS=[
 ('awakening','exec-e62c2536-2d8c-474d-aec4-77664e336d92.png','接缝之下','醒来以后，第一次看清自己的左手。'),
 ('rescue','exec-3c3a5890-24f2-4ae1-88e1-53cb31239909.png','门的另一边','独立于故障总线的机械门，被你亲手打开。'),
 ('reset','exec-3147fad8-6104-4ca9-9c67-59fc6ab44312.png','初次问候','熟悉的声音，第一次不再认识你。'),
 ('departure','exec-894dfc04-63a6-4e11-85f8-47228df86b24.png','自己的署名','在晨光里，为今天的自己留下一个名字。')]
def source(filename,name):
 p=Path('/workspace/generated_images')/filename
 local=SOURCE/(name+'.png')
 if p.exists():shutil.copyfile(p,local)
 if not local.exists():raise FileNotFoundError('Missing inspected source: '+str(local))
 return Image.open(local)
def encode(im,path,alpha=False):
 target=ROOT/path;target.parent.mkdir(exist_ok=True)
 im.convert('RGBA' if alpha else 'RGB').save(target,'WEBP',quality=91,method=4)
 return path
if __name__=='__main__':
 art=json.loads(MANIFEST.read_text());art['source']='AI生成，经剧情场景截图目视检查、图集拆分和WebP压缩。';tasks=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  # Give existing portraits the same transparent canvas as the new states.
  for person,moods in [('mira',['neutral','concern','serious']),('lin',['neutral','smile','concern']),('tang',['neutral','concern'])]:
   im=Image.open(SOURCE/(person+'.png'));w,h=im.size
   for i,mood in enumerate(moods):
    old=art['characters'][person][mood];crop=im.crop((i*w//3,0,(i+1)*w//3,h));canvas=Image.new('RGBA',(560,h));canvas.paste(crop,((560-crop.width)//2,0))
    path=f'assets/characters/{person}-{mood}-v33.webp'
    for key,value in list(art['characters'][person].items()):
     if value==old:art['characters'][person][key]=path
    tasks.append(pool.submit(encode,canvas,path,True))
  for character,name,filename,moods in SPRITES:
   im=source(filename,name);assert im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0
   w,h=im.size;mask=np.asarray(im.getchannel('A'))[:int(h*.85)]>40
   cuts=[0]
   for i in [1,2]:
    nominal=round(i*w/3);lo,hi=nominal-65,nominal+65
    counts=mask[:,lo:hi].sum(axis=0);indices=np.flatnonzero(counts==counts.min())+lo
    cuts.append(int(indices[np.argmin(abs(indices-nominal))]))
   cuts.append(w);canvaswidth=max(560,max(b-a for a,b in zip(cuts,cuts[1:])))
   print(name,'split',cuts,'canvas',canvaswidth,h,flush=True)
   for i,mood in enumerate(moods):
    crop=im.crop((cuts[i],0,cuts[i+1],h));canvas=Image.new('RGBA',(canvaswidth,h));canvas.paste(crop,((canvaswidth-crop.width)//2,0))
    path=f'assets/characters/{character}-{mood}.webp';art['characters'][character][mood]=path
    tasks.append(pool.submit(encode,canvas,path,True))
  art['characters']['tang']['serious']=art['characters']['tang']['shock']
  art['characters']['lin']['medical-serious']=art['characters']['lin']['medical-neutral']
  for name,filename,keys in BACKGROUNDS:
   im=source(filename,name);w,h=im.size
   for i,key in enumerate(keys):
    x,y=i%2,i//2;crop=im.crop((x*w//2+2,y*h//2+2,(x+1)*w//2-2,(y+1)*h//2-2))
    path=f'assets/backgrounds/{key}.webp';art['backgrounds'][key]=path
    if key!='maintenance':tasks.append(pool.submit(encode,crop,path))
  maintenance=source('exec-c89d13f7-8e19-4f23-a5b5-6b5841bfb176.png','maintenance-corrected')
  tasks.append(pool.submit(encode,maintenance,'assets/backgrounds/maintenance.webp'))
  art['cgs']={}
  for key,filename,title,description in CGS:
   im=source(filename,'cg-'+key);path=f'assets/cgs/{key}.webp'
   art['cgs'][key]={'image':path,'title':title,'text':description}
   tasks.append(pool.submit(encode,im,path))
  for task in tasks:task.result()
 MANIFEST.write_text(json.dumps(art,ensure_ascii=False,indent=2)+'\n')
 print('Packed 12 portrait states, 8 backgrounds/variants, 4 event CGs.',flush=True)

 # Apply the inspected engineer redesign after the shared atlas export.
 if all((SOURCE/name).exists() for name in ['zhou-practical-base.png','zhou-practical-states.png','cg-rescue-practical.png']):
  from pack_zhou import pack
  pack()
