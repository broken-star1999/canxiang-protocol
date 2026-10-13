exec(open('gen.py').read().split("jobs={")[0])
STYLE=STYLE.replace("no readable text, no letters or numbers, ","no readable text except the exact text explicitly requested below, no other letters or numbers, ")
STYLE+=" Any hands: show ONLY a gloved hand and the sleeve cuff; wrist and forearm fully covered. Never show any person's head, hair or face, nor any mirror/glass/screen reflection of a person (dark screens show no reflected figure). No robots, androids, humanoid figures, mechanical arms or robot schematics anywhere. Red/orange only as tiny accents."
TH2=TH.replace("robotics test bay","corridor / intercom area")+" The ENTIRE subject must fit inside the central square (middle 75% of width) with margin."
EN="Ending illustration, 16:9 landscape (generate 1536x864 or similar 16:9, will be resized to 1920x1080). Cinematic, quiet, melancholic. Setting: the dim corridor and control rooms of a remote coastal research station at night."
T={
"thumb_c2_s00a_log":"A wall intercom screen showing a call-history list of abstract unreadable rows, one row highlighted in amber.",
"thumb_c2_s00a_answer":"A gloved fingertip (only glove and sleeve cuff) hovering just above a glowing green 'answer' button on a wall intercom panel.",
"thumb_c2_s00a_ring":"A lit wall intercom screen with a blinking cursor; empty foreground, nobody there.",
"thumb_c2_s01a_glove":"A single grey work glove lying on the floor, a reflective band around its cuff, fingertips pointing toward the viewer. Empty glove, no hand inside.",
"thumb_c2_s01a_ask":"A cyan MIRA voice waveform on a screen next to an abstract staff location map with dots; one dot unlit.",
"thumb_c2_s01a_none":"A grey glove left on the floor beneath a wall intercom screen, camera pulled back, wide and lonely.",
"thumb_c2_s01b_tang":"Close-up of a whiteboard duty board. Handwritten in marker are exactly the Chinese characters 「唐 左前臂骨折」; the second half of the line (the characters after 左前) is partly covered by another sheet of paper pinned over it. In front, an ID badge on a lanyard hangs turned backwards, showing only its blank back - no photo, no name visible. No other names anywhere. Same framing scale and visual weight as a single object close-up.",
"thumb_c2_s01b_lin":"Close-up of a small handwritten paper label taped on a metal storage locker door; neat handwriting strokes, illegible, no full name readable. Same framing scale and visual weight as a single object close-up.",
"thumb_c2_s01b_self":"One empty grey work glove lying palm-up on a metal counter, a clear worn abrasion mark exactly at the centre of the palm, sharply visible as the focal point. The cuff opening is empty - no hand, no wrist, no arm. No text. Same framing scale and visual weight as a single object close-up.",
"thumb_c2_s02a_play":"A staff ID badge clip lying beside an intercom call panel; badge face down or unreadable, no name, no photo.",
"thumb_c2_s02a_confront":"The corner of a paper file folder stamped with the characters 'K1', a tiny red indicator light nearby.",
"thumb_c2_s02a_silent":"An amber voice waveform rising and falling alone in a call interface; a microphone icon that is dark/off.",
"thumb_c2_s03a_letter":"A stack of paper sheets beside an intercom handset, the top sheet with a deep fold crease.",
"thumb_c2_s03a_hang":"An intercom hang-up button glowing small orange, an amber waveform beside it going flat.",
"thumb_c2_s03a_send":"A terminal button labeled exactly 「发送」, the recipient field above it empty.",
"thumb_c2_s04a_copied":"A terminal popup reading exactly 「已另存」; in the corner one tiny red line of access log.",
"thumb_c2_s04a_kept":"A draft window on a green terminal half-closed, the recipient field empty.",
"thumb_c2_s04a_unread":"A terminal window being closed: only two lines of abstract text are crisp, the body below blurred.",
"thumb_c2_s05a_lin":"A desk name plate with the characters 「林述」, sitting in shadow.",
"thumb_c2_s05a_dunno":"An empty identity field on a terminal screen with a blinking cursor.",
"thumb_c2_s05a_none":"A lit intercom screen with no caller ID, nobody in frame.",
}
E={
"ending_C2_E_WHO":"A dead, dark intercom screen in the corridor; the dark glass reflects no figure at all. On it only one line of glowing green text: exactly 「你到底是谁？」.",
"ending_C2_E_CHAIR":"A control room with a desk chair knocked over on the floor, one small red indicator light glowing.",
"ending_C2_E_HEARD":"An amber voice waveform slowly settling to calm on an intercom screen, a stack of letter paper beside it.",
"ending_C2_E_DRAFT":"A terminal showing a drafts window, the recipient field empty, cursor blinking.",
"ending_C2_E_TAKE":"An empty corridor; beneath the wall intercom screen the floor is bare - the glove that lay there is gone.",
}
jobs={}
for k,v in T.items(): jobs[k]=TH2+" Subject: "+v
for k,v in E.items(): jobs[k]=EN+" Subject: "+v+" No people."
VER=sys.argv[1] if len(sys.argv)>1 else "v1"
only=sys.argv[2].split(",") if len(sys.argv)>2 else list(jobs)
def run(base):
    name=f"{base}_{VER}"; target=f"{OUT}/{name}.png"
    if os.path.exists(target): return name,"exists"
    extra=open(f"fix_{base}.txt").read() if os.path.exists(f"fix_{base}.txt") else ""
    prompt=f"Generate ONE raster image using your built-in image generation capability and save it as {target}. If you do not have a native image generation tool, do NOT draw it with code; print NO_IMAGE_TOOL and stop. Do not overwrite existing files. When done print the path.\n{STYLE}\nUse the attached image only as a style/mood reference.\n{jobs[base]} {extra}"
    open(f"{OUT}/prompts/{name}.txt","w").write(prompt)
    open(f"../prompts/{name}.md","w").write(f"# {name}\n\n生成：codex exec -m gpt-6-luna -c model_reasoning_effort=\"max\"\n\n```\n{prompt}\n```\n")
    cmd=["codex","exec","-m","gpt-6-luna","-c",'model_reasoning_effort="max"',"--skip-git-repo-check","-s","workspace-write","-i",os.path.abspath("scene_corridor_intercom_v1.webp"),"--",prompt]
    try:
        with open(f"{OUT}/logs/{name}.txt","w") as f:
            r=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT,cwd=OUT,timeout=3600).returncode
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
