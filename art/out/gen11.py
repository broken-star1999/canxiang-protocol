exec(open('gen.py').read().split("jobs={")[0])
STYLE=STYLE.replace("no readable text, no letters or numbers, ","no readable text except the exact text explicitly requested below, no other letters or numbers, ")
STYLE+=" Any hands: show ONLY a gloved hand and the sleeve cuff; wrist and forearm fully covered. Never show any person's head, hair or face, nor any mirror/glass/screen reflection of a person (dark screens show no reflected figure). No robots, androids, humanoid figures, mechanical arms or robot schematics anywhere. Red/orange only as tiny accents."
TH2=TH.replace("robotics test bay","corridor / intercom area")+" The ENTIRE subject must fit inside the central square (middle 75% of width) with margin."
EN="Ending illustration, 16:9 landscape (generate 1536x864 or similar 16:9, will be resized to 1920x1080). Cinematic, quiet, melancholic. Setting: the dim corridor and control rooms of a remote coastal research station at night."
SC="Full scene background, 16:9 landscape (generate 1536x864 or similar 16:9, will be resized to 1920x1080). Cinematic, quiet. Setting: a remote coastal research station at night, power mostly out. No people at all."
jobs={
"scene_console_dark":SC+" Subject: a dark control-room console, lights off; one cold green main monitor lit, showing a cyan MIRA voice waveform frozen still in the centre. Surroundings dim. Empty chair or no chair, nobody present. No readable text.",
"scene_memory_gap":SC+" Subject: an almost pure black CRT screen filling the frame, extremely faint scanlines, and in the exact centre one small line of dim pale text reading exactly 「记录结束」. Nothing else. No reflection of anyone in the black glass.",
"scene_console_hospital_number":SC+" Subject: a cold green terminal screen in a dark control room showing a contact list; one row is highlighted; all names, notes and phone numbers are rendered as blurred, illegible glyph shapes (nothing readable at all); a small handset/dial icon beside the highlighted row. No readable text, no names.",
}
VER=sys.argv[1] if len(sys.argv)>1 else "v1"
only=sys.argv[2].split(",") if len(sys.argv)>2 else list(jobs)
def run(base):
    name=f"{base}_{VER}"; target=f"{OUT}/{name}.png"
    if os.path.exists(target): return name,"exists"
    extra=open(f"fix11_{base}.txt").read() if os.path.exists(f"fix11_{base}.txt") else ""
    prompt=f"Generate ONE raster image using your built-in image generation capability and save it as {target}. If you do not have a native image generation tool, do NOT draw it with code; print NO_IMAGE_TOOL and stop. Do not overwrite existing files. When done print the path.\n{STYLE}\nUse the attached image only as a style/mood reference.\n{jobs[base]} {extra}"
    open(f"{OUT}/prompts/{name}.txt","w").write(prompt)
    open(f"../prompts/{name}.md","w").write(f"# {name}\n\n生成：codex exec -m gpt-6-luna -c model_reasoning_effort=\"max\"\n\n```\n{prompt}\n```\n")
    cmd=["codex","exec","-m","gpt-6-luna","-c",'model_reasoning_effort="max"',"--skip-git-repo-check","-s","workspace-write","-i",os.path.abspath("scene_corridor_intercom_v1.webp"),"--",prompt]
    try:
        with open(f"{OUT}/logs/{name}.txt","w") as f:
            r=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT,stdin=subprocess.DEVNULL,cwd=OUT,timeout=3600).returncode
    except subprocess.TimeoutExpired: r="timeout"
    ok=os.path.exists(target)
    if ok:
        im=Image.open(target).convert("RGB"); W,H=(480,360) if base.startswith("thumb") else (1920,1080)
        s=max(W/im.width,H/im.height); im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
        l=(im.width-W)//2;t=(im.height-H)//2; im.crop((l,t,l+W,t+H)).save(f"{OUT}/{name}.webp",quality=90)
    return name,r,ok
from PIL import Image
with ThreadPoolExecutor(3) as ex:
    for r in ex.map(run,only): print(r,flush=True)
