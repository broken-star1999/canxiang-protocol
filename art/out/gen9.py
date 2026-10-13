exec(open('gen.py').read().split("jobs={")[0])
STYLE+=" Never show any person, head, face, hands, mirror or reflection. No robots, androids, humanoid figures, mechanical arms or robot schematics anywhere."
jobs={
"scene_corridor_intercom_off_v1":("Edit the attached reference image. Keep EXACTLY the same camera, framing, perspective, corridor geometry and composition (16:9, 1920x1080). Change only: the wall intercom screen is now completely dead and black, no glow, no text, no waveform. All other screen/panel lights off; the corridor is lit only by dim emergency lights (cold dark green tone, tiny small red emergency lamp accents allowed). Dark green cold industrial mood. No people.","scene_corridor_intercom_v1.webp"),
"portrait_zhou_voice_v1":("Square 1:1 portrait-slot image. A horizontal audio voice waveform glowing in warm grey / pale amber (like an old radio voiceprint), centered on a near-black dark green background with faint scanlines. Represents a man speaking voice-only through an intercom. NO cyan, NO teal, NO face, no person, no silhouette, no text. Calm, slightly worn analog feel.","portrait_mira_lv1_v1.webp"),
}
def run(name):
    p,ref=jobs[name]
    target=f"{OUT}/{name}.png"
    if os.path.exists(target): return name,"exists"
    pre="Use the attached image only as a style/size reference; " if name.startswith("portrait") else ""
    prompt=f"Generate ONE raster image using your built-in image generation/editing capability and save it as {target}. If you do not have a native image generation tool, do NOT draw it with code; print NO_IMAGE_TOOL and stop. Do not overwrite existing files. When done print the path.\n{STYLE}\n{pre}{p}"
    open(f"{OUT}/prompts/{name}.txt","w").write(prompt)
    open(f"../prompts/{name}.md","w").write(prompt)
    cmd=["codex","exec","-m","gpt-6-luna","-c",'model_reasoning_effort="max"',"--skip-git-repo-check","-s","workspace-write","-i",os.path.abspath(ref),"--",prompt]
    with open(f"{OUT}/logs/{name}.txt","w") as f:
        r=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT,cwd=OUT,timeout=1500)
    return name,r.returncode,os.path.exists(target)
with ThreadPoolExecutor(2) as ex:
    for r in ex.map(run,jobs): print(r,flush=True)
