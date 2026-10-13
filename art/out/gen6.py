exec(open('gen.py').read().split("jobs={")[0])
STYLE+=" Any hands: show ONLY a gloved hand and the sleeve cuff; wrist and forearm always fully covered by the sleeve. Never show the protagonist's face or any mirror/glass/screen reflection of a person."
SQ=" The ENTIRE subject must fit inside the central square (middle 75% of width) with margin; nothing important touches the frame edges."
jobs={
"scene_bay7_emergency_v2":("16:9 target 1600x900. This is a RE-LIGHT of the attached image, not a new scene. Keep EXACTLY the same camera position, framing, focal length, perspective and every object in the same pixel position (robot arm over test table left-center, operator panel with red e-stop at left, storm-sea window with lighthouse upper right, charging dock back right, glove and screwdriver on the wet floor lower-center, floor grate, carts at right). Change ONLY the lighting and color grade: red emergency beacons and red emergency strip lighting wash the room in deep red, residual dark green in shadows, red reflections on the wet floor. Lower third stays readable. No people.","../../samples/scene_bay7_poweroff_v2.png"),
"scene_b2_jumper_v2":("16:9 target 1600x900. Close-medium shot inside electrical distribution room B-2 under dim emergency light: an open grey distribution cabinet, the camera close to the terminal rows. A single RED jumper wire with alligator clips bridging two terminals, large and centered in frame, sharply lit - it is the ONLY highly saturated color in the whole image; everything else desaturated dark green-grey (no other red lights, no red LEDs, no orange). No readable labels. No people.",None),
"thumb_c1_s00b_move_v3":(TH+SQ+" Subject: a raised LEFT gloved hand clenched into a FULL FIST, the work-jacket sleeve covering the wrist and forearm completely, only the glove and sleeve cuff visible, centered. Reads like a stiff, slightly sore human arm; organic, no mechanical feel, no seams, no metal. No face.",None),
"thumb_c1_s00b_ignore_v3":(TH+SQ+" Subject: a person CENTERED in frame, seen from side/behind at torso level, pushing up from the floor with the RIGHT gloved hand, LEFT arm hanging a bit stiff at the side, gloved fingers half-curled. Long sleeves cover wrists and forearms completely; only gloves and sleeve cuffs show. Organic, no metal. Head out of frame; no face.",None),
"thumb_c1_s04a_none_v2":(TH+SQ+" Subject: a dark console with an intact terminal screen that is ON, showing an empty dark field with a single blinking block cursor sitting still, no readable text. Cold, dark green-grey, quiet waiting mood. No hands, no people, no cracked screen, no MIRA waveform, no red.",None),
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
