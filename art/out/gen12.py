exec(open('gen.py').read().split("jobs={")[0])
STYLE=STYLE.replace("no readable text, no letters or numbers, ","no readable text except the exact text explicitly requested below, no other letters or numbers, ")
STYLE+=" Any hands: show ONLY a gloved hand and the sleeve cuff; wrist and forearm fully covered. Never show any person's head, hair or face, nor any mirror/glass/screen reflection of a person (dark screens show no reflected figure). No robots, androids, humanoid figures, mechanical arms or robot schematics anywhere. Red/orange only as tiny accents."
TH2=TH.replace("robotics test bay","corridor / intercom area")+" The ENTIRE subject must fit inside the central square (middle 75% of width) with margin."
EN="Ending illustration, 16:9 landscape (generate 1536x864 or similar 16:9, will be resized to 1920x1080). Cinematic, quiet, melancholic. Setting: the dim corridor and control rooms of a remote coastal research station at night."
TH3=TH2.replace("corridor / intercom area","control room / corridor")
FB=" FLASHBACK: faded warm yellow tones only, edges falling back into dark green, like old videotape. Any hand shown is a gloved hand with the sleeve cuff covering the wrist."
NT=" In a small corner, a tiny grey-green system notification bar (text unreadable)."
T={
"thumb_c3_s00a_listen":"A play icon on a cold green screen whose edges begin to glow a little warm.",
"thumb_c3_s00a_ask_mira":"A cyan MIRA voice waveform on a screen beside a locked archive-box icon with a blank cover.",
"thumb_c3_s00a_why_me":"A cyan MIRA waveform trembling on a monitor; in front of it an empty chair, nobody.",
"thumb_c3_s01a_continue":"An old voice recorder resting on a windy railing at the foot of a weather mast at dusk, its small light on."+FB,
"thumb_c3_s01a_ask_mira":"A warm faded image of a weather mast and dusk sky, cut across by a cold green pause bar with a pause icon. Only mast and sky, nothing else."+FB,
"thumb_c3_s02a_next":"A warm-lit old dormitory corridor with worn carpet, fading toward darkness at the centre. Nobody."+FB,
"thumb_c3_s02a_override":"A cold green screen with an abstract trajectory curve; one segment changes colour and deviates from the line. Pure graph, no arms, no machinery, no text.",
"thumb_c3_s02a_skip":"A black screen with a tiny row of dim dots at its centre, like a frozen subtitle.",
"thumb_c3_s03a_merge":"A beam of faded warm light flowing back into the centre of a cold green screen and dispersing into a soft glow. No body shapes.",
"thumb_c3_s03a_isolate":"A single folder icon alone on a cold green screen, its label illegible, empty space around it.",
"thumb_c3_s04a_call":"A gloved fingertip (only glove and sleeve cuff, wrist covered) hovering just above a glowing dial button on a terminal, a visible gap.",
"thumb_c3_s04a_not_call":"A terminal contact list with one row highlighted (illegible), the dial button dark, empty foreground.",
}
E={
"ending_C3_E_BROKEN":"A playback progress bar on a terminal with several scraped-out black gaps; a thin red frame around the screen."+NT,
"ending_C3_E_PULL":"In darkness, an abstract line of light that gently curves back at its end (just a light trail, not an arm); an intercom handset hanging nearby."+NT,
"ending_C3_E_TWO":"An empty grey work glove resting on a metal counter in front of a dark, dead intercom screen (echo of chapter 2). No hands, no silhouettes, no reflection in the dark screen."+NT,
"ending_C3_E_VOICE":"A cold green control console with a lingering layer of faded warm light; a cyan waveform and a warm waveform overlapping slightly out of sync on the monitor."+NT,
"ending_C3_E_STOP":"Warm-lit dormitory corridor whose far lab door stands half open onto total darkness; the picture cuts to black at the door gap. Nobody."+NT,
}
jobs={}
for k,v in T.items(): jobs[k]=TH3+" Subject: "+v
for k,v in E.items(): jobs[k]=EN+" Subject: "+v+" No people."
VER=sys.argv[1] if len(sys.argv)>1 else "v1"
only=sys.argv[2].split(",") if len(sys.argv)>2 else list(jobs)
def run(base):
    name=f"{base}_{VER}"; target=f"{OUT}/{name}.png"
    if os.path.exists(target): return name,"exists"
    extra=open(f"fix12_{base}.txt").read() if os.path.exists(f"fix12_{base}.txt") else ""
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
with ThreadPoolExecutor(4) as ex:
    for r in ex.map(run,only): print(r,flush=True)
