"""Extract generated production atlases and encode game assets without repainting.
The source images remain in /workspace/generated_images; inputs passed on CLI.
Usage: python tools/pack_art.py bg1.png bg2.png mira.png zhou.png tang.png lin.png
"""
from PIL import Image
from pathlib import Path
import sys,json
root=Path(__file__).resolve().parents[1]
sources=sys.argv[1:]
if len(sources)!=6:raise SystemExit(__doc__)
manifest={'backgrounds':{},'characters':{},'source':'AI生成，经风格重做、人工视觉检查、图集拆分和WebP压缩。'}
for p,names in zip(sources[:2],[['lab','tea','bridge','office'],['sea','home','archive','control']]):
 im=Image.open(p).convert('RGB');w,h=im.size
 for i,name in enumerate(names):
  col,row=i%2,i//2
  crop=im.crop((round(col*w/2)+3,round(row*h/2)+3,round((col+1)*w/2)-3,round((row+1)*h/2)-3))
  path=f'assets/backgrounds/{name}.webp';crop.save(root/path,'WEBP',quality=91,method=6)
  manifest['backgrounds'][name]=path
for p,name in zip(sources[2:],['mira','zhou','tang','lin']):
 im=Image.open(p).convert('RGBA');w,h=im.size
 if im.getchannel('A').getextrema()[0]!=0:raise ValueError(name+' missing transparent background')
 manifest['characters'][name]={}
 for i,mood in enumerate(['neutral','concern','serious']):
  # Lin's second expression is amused, third is concerned.
  if name=='lin':mood=['neutral','smile','concern'][i]
  crop=im.crop((round(i*w/3),0,round((i+1)*w/3),h))
  path=f'assets/characters/{name}-{mood}.webp';crop.save(root/path,'WEBP',quality=92,method=6)
  manifest['characters'][name][mood]=path
 for mood in ['neutral','concern','serious','smile']:
  if mood not in manifest['characters'][name]:manifest['characters'][name][mood]=manifest['characters'][name].get('neutral')
(root/'assets/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Packed',len(manifest['backgrounds']),'backgrounds, 12 character sprites')
