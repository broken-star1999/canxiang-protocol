"""Encode inspected Zhou sheets; crop/scale only, no repainting.
Run after pack_art_expansion.py when rebuilding all production resources.
"""
from pathlib import Path
from PIL import Image
import numpy as np,json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art/v3-source'

def pack_sheet(name,moods,art):
    im=Image.open(SOURCE/name).convert('RGBA')
    assert im.getchannel('A').getextrema()[0]==0,'Sheet must be transparent'
    width,height=im.size
    mask=np.asarray(im.getchannel('A'))>40
    cuts=[0]
    for n in [1,2]:
        mid=round(width*n/3);lo=max(0,mid-100);hi=min(width,mid+100)
        counts=mask[:,lo:hi].sum(axis=0)
        gaps=np.flatnonzero(counts==0)+lo
        assert len(gaps),'Figures must have an empty separating column'
        cuts.append(int(gaps[np.argmin(abs(gaps-mid))]))
    cuts.append(width)
    crops=[im.crop((a,0,b,height)) for a,b in zip(cuts,cuts[1:])]
    boxes=[c.getchannel('A').getbbox() for c in crops]
    assert all(boxes)
    # One scale per sheet, preserving relative size and complete silhouettes.
    factor=min(990/max(b[3]-b[1] for b in boxes),520/max(b[2]-b[0] for b in boxes))
    for mood,crop,box in zip(moods,crops,boxes):
        sprite=crop.crop(box)
        sprite=sprite.resize((round(sprite.width*factor),round(sprite.height*factor)),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',(560,1024));canvas.paste(sprite,((560-sprite.width)//2,1024-sprite.height))
        path=f'assets/characters/zhou-practical-{mood}.webp'
        canvas.save(ROOT/path,'WEBP',quality=94,method=6)
        art['characters']['zhou'][mood]=path
    print(name,'cuts',cuts,'scale',round(factor,3))

def pack():
    path=ROOT/'assets/manifest.json';art=json.loads(path.read_text())
    pack_sheet('zhou-practical-base.png',['neutral','concern','serious'],art)
    pack_sheet('zhou-practical-states.png',['evasive','admit','wounded'],art)
    art['characters']['zhou']['smile']=art['characters']['zhou']['neutral']
    rescue='assets/cgs/rescue-practical.webp'
    Image.open(SOURCE/'cg-rescue-practical.png').convert('RGB').save(ROOT/rescue,'WEBP',quality=94,method=6)
    art['cgs']['rescue']['image']=rescue
    path.write_text(json.dumps(art,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':pack()
