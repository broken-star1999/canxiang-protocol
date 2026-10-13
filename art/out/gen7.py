exec(open('gen.py').read().split("jobs={")[0])
STYLE+=" Never show the protagonist's face or any mirror/glass/screen reflection of a person. ABSOLUTELY NO readable text anywhere: any document or screen text must be pure blur/abstract bars."
END="16:9 target 1600x900. Use the attached image as the background: keep its exact camera, room and red emergency lighting, pushed slightly out of focus. Add a large foreground close-up as the ending card subject: "
R="/workspace/projects/text-mystery/art/out/scene_bay7_emergency_v2.png"
jobs={
"ending_C1_E_CRACK_v2":(END+"MIRA's cyan waveform screen, the rings cracked at one corner with shards drifting; cyan dominates the foreground.",R),
"ending_C1_E_SAME_v2":(END+"two screens side by side each showing one row of heavily blurred abstract bars with the identical shape pattern, like twins. Completely unreadable, no characters.",R),
"ending_C1_E_MAIL_v2":(END+"a terminal screen with an abstract 'sent' icon: a check mark inside an envelope, no text.",R),
"ending_C1_E_KEPT_v2":(END+"a single warm amber indicator LED glowing on a console. Re-grade the WHOLE image clearly warm: amber/honey tones overpower the red and green, soft warm glow spreading, hopeful.",R),
"ending_C1_E_NAME_v2":(END+"a printed report page lying under the light, three staples in the corner; the print is ONLY soft grey blurred bars, absolutely no legible letters or numbers.",R),
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
