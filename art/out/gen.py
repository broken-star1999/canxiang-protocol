import subprocess,sys,os
from concurrent.futures import ThreadPoolExecutor
OUT=os.getcwd()
STYLE="""[STYLE: Echo Protocol / 残响协议 — sci-fi suspense visual novel] Cinematic industrial realism as if viewed on an old CRT monitor. Palette: near-black green #0B0F0E base, phosphor green #7CF29A highlights, cyan #6FE7FF only for MIRA screens, accents amber #FFB547 and alarm red #FF4D4D. Subtle film grain, faint scanlines, slight vignette, mild bloom. Restrictions: no human faces, no readable text, no letters or numbers, no logos, no watermark, no gore, no glossy sci-fi styling."""
TH="Thumbnail for a choice card, 4:3 landscape (generate 1536x1024 or similar 4:3-ish, will be cropped). IMPORTANT: keep the main subject fully inside the CENTRAL SQUARE (middle 75% of width); edges are only dark atmosphere and may be cropped. Simple, readable at 120x90 pixels on a phone, one clear subject, cool dark green tone. Setting: the same dim robotics test bay of a remote coastal research station at night, power out."
jobs={
"scene_bay7_emergency_v1":("16:9 target 1600x900. Use the attached image as EXACT reference: SAME camera position, SAME composition and SAME objects (robot arm over test table left-center, operator panel with red e-stop at left, storm-sea window upper right with distant lighthouse, charging dock back right, dropped glove and screwdriver on wet floor lower-center). ONLY change the lighting: the room is now lit by rotating red emergency beacons and red emergency strip lights, deep red wash with residual dark green shadows, red reflections on the wet floor. Lower third must stay readable (floor, glove, screwdriver, cables visible), not crushed to black. No people.","../../samples/scene_bay7_poweroff_v2.png"),
"thumb_c1_s00a_look_v1":(TH+" Subject: a slow panoramic glance across the dark bay - silhouette of the frozen robot arm and test table, small indicator LEDs, rain-streaked window glow. Point of view, no people.",None),
"thumb_c1_s00a_answer_v1":(TH+" Subject: a single CRT monitor in an industrial bezel freshly lit in the darkness, showing MIRA: abstract cyan concentric voiceprint rings and waveform, slightly glitched. No face.",None),
"thumb_c1_s00b_move_v1":(TH+" Subject: close-up of a person's LEFT forearm and hand raised and clenched into a fist, wearing an intact undamaged work glove and a smooth unwrinkled work-jacket sleeve. No injury, no blood, no bruises, nothing visible under the glove. The wrist and elbow angles are unnaturally precise and geometric, as if moving in discrete mechanical steps (subtle motion ghosting in stepped increments). Only the arm, no face, no body beyond shoulder.",None),
"thumb_c1_s00b_ignore_v1":(TH+" Subject: a person seen from the side/behind at torso level, pushing up from the floor with the RIGHT hand on the floor/table edge to stand, while the LEFT arm hangs stiff and straight against the body, gloved fingers half-curled and not relaxed. Glove intact, sleeve smooth, no injury, nothing under the glove shown. Head out of frame or turned away; no face.",None),
"thumb_c1_s01a_pwd_v1":(TH+" Subject: close-up of an industrial keypad / password entry panel on a terminal, faint green backlit keys with blank key caps (no symbols), a gloved fingertip hovering.",None),
"thumb_c1_s01a_mira_v1":(TH+" Subject: a CRT screen with MIRA's cyan voiceprint rings beside an abstract permission prompt shown as a glowing amber padlock icon and empty dialog box (no text).",None),
"thumb_c1_s01a_force_v1":(TH+" Subject: a terminal screen flooded with alarm-red error blocks and glitch bars (abstract shapes, not readable text), red glow spilling on the dark console.",None),
"thumb_c1_s01b_chat_v1":(TH+" Subject: a monitor showing a chat log as alternating abstract message bubbles in green and cyan, contents blurred lines (no readable text), soft glow in darkness.",None),
"thumb_c1_s01b_estop_v1":(TH+" Subject: close-up of a red mushroom emergency-stop button on a grey industrial operator panel, centered, dramatic dim lighting, small amber LED nearby.",None),
}

jobs.update({
"scene_b2_jumper_v1":("16:9 target 1600x900. Subject: a cramped electrical distribution room B-2 at night lit only by emergency lights (dim red and green). A grey distribution cabinet door hangs open, revealing rows of terminal blocks, breakers and relays. On one terminal (K1) a single bright RED jumper wire with alligator clips bridges two terminals - this red wire is the clear focal point, slightly right of center, catching the light. Everything else muted dark green. Lower third readable, not crushed black. No people, no readable labels.",None),
"thumb_c1_s02a_plc_v1":(TH+" Subject: a red mushroom e-stop still pressed down beside a monitor showing an abstract event-log timeline of green bars and one red marker (no readable text).",None),
"thumb_c1_s02a_bus_v1":(TH+" Subject: a monitor displaying an oscilloscope-like voltage curve in phosphor green with a suspicious spike/flat-line segment, export progress bar.",None),
"thumb_c1_s02a_env_v1":(TH+" Subject: a wall-mounted environmental sensor panel with abstract temperature/humidity graphs in green, condensation and rain on a nearby window.",None),
"thumb_c1_s02a_done_v1":(TH+" Subject: a gloved hand pulling back from the console keyboard, screens dimming, an open dark doorway beyond - sense of moving on.",None),
"thumb_c1_s02b_go_v1":(TH+" Subject: a long dark station corridor ending in a metal door with a card reader glowing small red LED, emergency lights along the floor.",None),
"thumb_c1_s02b_stay_v1":(TH+" Subject: several log windows on screens layered over each other, abstract green data lines converging to one point, the person stays at the desk; no faces.",None),
"thumb_c1_s02c_photo_v1":(TH+" Subject: a phone held in a gloved hand photographing an open distribution cabinet with a red jumper wire on a terminal, camera flash glow.",None),
"thumb_c1_s02c_remove_v1":(TH+" Subject: gloved fingers gripping and pulling the red alligator-clip jumper wire off a terminal block inside a dark cabinet.",None),
"thumb_c1_s02c_cover_v1":(TH+" Subject: a card-access control panel screen with an abstract log entry being overwritten, amber highlight, a keycard lying beside it - sense of covering tracks.",None),
})
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
