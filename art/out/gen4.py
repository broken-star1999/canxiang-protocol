exec(open('gen.py').read().split("jobs={")[0])
jobs={"portrait_mira_broken_v1":("Square target 1024x1024. Use the attached image as exact reference: same composition, same centered MIRA cyan voiceprint emblem on a dark CRT screen in an industrial bezel. Change ONLY: the cyan waveform rings are shattered at the UPPER-RIGHT, a broken-off chunk missing, and the broken edge is filled with red #FF4D4D noise/static. Overall still dominated by cyan; red appears ONLY at the break. No human face.","../../samples/portrait_mira_lv1_v1.png")}
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
