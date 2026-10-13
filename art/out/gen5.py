exec(open('gen.py').read().split("jobs={")[0])
STYLE+=" Never show the protagonist's face or any mirror/glass/screen reflection of a person."
EM="out/scene_bay7_emergency_v1.png"
EMR="scene_bay7_emergency_v1.png"
END="16:9 target 1600x900. Use the attached image as the background reference: SAME camera position and room (red emergency-lit robotics bay), pushed slightly out of focus. Add a large foreground close-up as the ending card subject, adjust light accordingly: "
CH="Vertical 3:4 portrait, target 900x1200. Chapter title card art, minimal, one symbolic object centered with lots of dark negative space at top and bottom, no text. Subject: "
jobs={
"thumb_c1_s02a_env_v2":(TH+" Subject: a monitor filled with a dense environmental sensor log: many rows, a large number of them highlighted in yellow as sensor anomalies, all text blurry and unreadable. Uniform - do NOT emphasize any single row or column, no circled or bright item, no visible zero digit, no dash marks.",None),
"scene_corridor_intercom_v1":("16:9 target 1600x900. Subject: a long narrow research-station corridor at night, emergency lights running overhead in a receding line, wet floor, and at the far end a wall-mounted intercom video screen glowing softly cyan-green (screen shows only abstract light, no face). Lower third readable. No people.",None),
"thumb_c1_s03a_repair_v1":(TH+" Subject: MIRA's cyan voiceprint rings on a CRT screen with scattered fragment shards being gently reassembled, puzzle-like pieces of waveform drifting back into place.",None),
"thumb_c1_s03a_pain_v1":(TH+" Subject: MIRA's cyan waveform on a screen, faint and trembling, a gloved hand resting gently on the edge of the monitor bezel - intimate, quiet.",None),
"thumb_c1_s03a_force_v1":(TH+" Subject: a cable jacked hard into a console port, a progress bar ripping through MIRA's cyan waveform which distorts and tears, red warning glow.",None),
"thumb_c1_s03b_give_v1":(TH+" Subject: a small data drive held out in a gloved hand toward a glowing cyan MIRA screen, a thin cyan light stream flowing into the drive.",None),
"thumb_c1_s03b_keep_v1":(TH+" Subject: a gloved hand pulling back, open palm, from a cyan MIRA screen where a small glowing cyan orb of data stays nested inside the rings - letting her keep it.",None),
"thumb_c1_s03b_leave_v1":(TH+" Subject: a darkened console with MIRA's screen dimmed to a faint cyan line, an open doorway and corridor ahead with emergency lights.",None),
"thumb_c1_s04a_mira_v1":(TH+" Subject: a small packet of green light (evidence) being tucked deep into the center of MIRA's cyan concentric rings, hidden inside her.",None),
"thumb_c1_s04a_mail_v1":(TH+" Subject: a terminal with an abstract email envelope icon flying out of the screen toward a personal device, cool green glow, no readable text.",None),
"thumb_c1_s04a_none_v1":(TH+" Subject: hands-off: gloved hands resting still beside a keyboard, nothing touched, the corridor door beyond slightly open.",None),
"ending_C1_E_CRACK_v1":(END+"a close-up of MIRA's cyan waveform screen, the rings cracked at one corner, shards drifting; cyan light dominates the foreground.",EMR),
"ending_C1_E_SAME_v1":(END+"two log printouts/screens side by side showing two blurred, unreadable log lines with the same visual pattern, mirrored like twins; cold green light.",EMR),
"ending_C1_E_MAIL_v1":(END+"a terminal screen showing an abstract 'sent' confirmation: a check mark inside an envelope icon, no readable text; pale green glow.",EMR),
"ending_C1_E_KEPT_v1":(END+"one small warm amber indicator LED glowing alone on a dark console; the whole image tinted slightly warmer than usual, a quiet hopeful mood.",EMR),
"ending_C1_E_NAME_v1":(END+"a sheet of printed report paper, page four, lying under the red light, text blurred and unreadable, three staples at the corner, a sense that a name has already been typed in.",EMR),
"chapter_c1_v1":(CH+"a red mushroom emergency-stop button on a dark industrial panel.",None),
"chapter_c2_v1":(CH+"a lit wall intercom video screen in darkness, with a sealed letter envelope resting below it.",None),
"chapter_c3_v1":(CH+"an industrial wall clock stopped at 4:39 (analog hands only, no numerals on the dial).",None),
"chapter_c4_v1":(CH+"an empty inspection test bench under a cold lamp, a single work glove left on it.",None),
"chapter_final_v1":(CH+"MIRA's cyan concentric waveform rings slowly dispersing into drifting particles in darkness.",None),
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
