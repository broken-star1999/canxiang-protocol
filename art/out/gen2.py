exec(open('gen.py').read().split("jobs={")[0])
STYLE+=" Never show the protagonist's face or any mirror/glass/screen reflection of a person."
jobs={
"thumb_c1_s00b_move_v2":(TH+" Subject: close-up of a person's LEFT forearm and hand slowly raised and clenched into a fist, intact work glove, smooth sleeve. It should read like a stiff arm of an injured HUMAN: slight hesitation, fingers not fully closing, a bit rigid. Fully organic and natural - NO mechanical feeling, no seams, no metal, no metallic sheen, no stepped motion. No face.",None),
"thumb_c1_s00b_ignore_v2":(TH+" Subject: person seen from side/behind at torso level pushing up from the floor with the RIGHT hand, LEFT arm hanging a little stiff at the side like a sore injured human arm, gloved fingers loosely half-curled. Intact glove, smooth sleeve, completely natural and organic: no mechanical feel, no seams, no metal, no metallic sheen. Head out of frame; no face, no reflections.",None),
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
