exec(open('gen.py').read().split("jobs={")[0])
STYLE+=" Any hands: show ONLY a gloved hand and the sleeve cuff; wrist and forearm fully covered. Never show any person's head, hair or face, nor any mirror/glass/screen reflection of a person. No robots, androids, humanoid figures or robot schematics anywhere (including on screens or in background)."
SQ=" The ENTIRE subject must fit inside the central square (middle 75% of width) with margin."
jobs={
"thumb_c1_s02b_stay_v2":(TH+SQ+" Subject: an empty desk chair in front of three monitors whose abstract green data lines converge to one bright point - choosing to stay and reason from logs. No people at all.",None),
"thumb_c1_s02a_done_v2":(TH+SQ+" Subject: a gloved hand lifting off a console keyboard, the monitor dimming to plain abstract green bars, an open dark doorway beyond - moving on. No human or robot figures on any screen.",None),
"thumb_c1_s04a_mira_v2":(TH+SQ+" Subject: a small glowing green packet of light (evidence) sinking into the center of MIRA's cyan concentric voiceprint rings on a dark CRT screen, as if being hidden inside her. No hands, no arms, no mechanical grippers.",None),
}
def run(name):
    p,ref=jobs[name]
    target=f"{OUT}/{name}.png"
    if os.path.exists(target): return name,"exists"
    prompt=f"Generate ONE raster image using your built-in image generation capability and save it as {target}. If you do not have a native image generation tool, do NOT draw it with code; print NO_IMAGE_TOOL and stop. Do not overwrite existing files. When done print the path.\n{STYLE}\n{p}"
    open(f"{OUT}/prompts/{name}.txt","w").write(prompt)
    cmd=["codex","exec","-m","gpt-6-luna","-c",'model_reasoning_effort="max"',"--skip-git-repo-check","-s","workspace-write"]
    if ref: cmd+=["-i",os.path.abspath(ref)]
    cmd+=["--",prompt]
    with open(f"{OUT}/logs/{name}.txt","w") as f:
        r=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT,cwd=OUT,timeout=1500)
    return name,r.returncode,os.path.exists(target)
with ThreadPoolExecutor(10) as ex:
    for r in ex.map(run,jobs): print(r,flush=True)
