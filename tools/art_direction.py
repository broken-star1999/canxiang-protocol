"""Presentation cues only. Preserve scenes, beat order, choices and save schema."""
def apply_art(story):
 scenes=story['scenes']
 def emotion(scene,speaker,mood,contains=None):
  for b in scenes[scene]['beats']:
   if b['speaker']==speaker and (contains is None or contains in b['text']):b['emotion']=mood
 def cg(scene,start,end,key):
  for b in scenes[scene]['beats'][start:end+1]:b['cg']=key
 # Lighting follows the hour and the event instead of a chapter-wide filter alone.
 for id,s in scenes.items():
  if s['bg']=='bridge':s['bg']='bridge-night' if id.startswith('c1') else 'bridge-dawn'
  if id in ['c4_03','c4_rescue','c4_broken_arm','c4_record','c4_injury','c4_force']:s['bg']='maintenance'
  if id in ['c4_01','c4_mira_plan','c4_mira_free','c4_mira_safe','c4_mira_container','c4_evidence_review','c4_contact_review','end_silent']:s['bg']='archive-alert'
  if any(b['speaker']=='林述' for b in s['beats']):
   if id in ['c3_02','c3_03','c3_04']:
    s['communication']='工作录音 · 回放'
   else:
    s['costumes']={'lin':'medical'};s['communication']='远程通信 · 医疗舱'
    if id.startswith('c3'):s['bg']='medical'
 scenes['end_repeat']['bg']='maintenance';scenes['end_repeat']['location']='维护通道 · 机械门外'
 scenes['end_dawn']['location']='离站码头';scenes['end_farshore']['location']='唐棠的家 · 次日清晨';scenes['end_farshore']['inPerson']=True
 scenes['end_dawn']['bg']='dock';scenes['end_farshore']['bg']='home-day';scenes['end_shelter']['bg']='tea-empty'
 # The viewpoint remains in the archive until the player actually reaches the door.
 scenes['c4_record']['bg']='archive-alert';scenes['c4_record']['location']='维护档案室'
 scenes['c4_injury']['bg']='archive-alert';scenes['c4_injury']['location']='维护档案室'
 for id,start in [('c4_record',5),('c4_injury',2)]:
  for i,b in enumerate(scenes[id]['beats']):
   if i<start:b['communication']='远程通信 · 维护区'
   else:b['background']='maintenance';b['location']='维护通道 · 机械门外'
   if id=='c4_injury' and i>=2:b['hideCharacters']=['zhou']
 for id in ['c4_rescue','c4_broken_arm']:scenes[id]['location']='维护通道 · 机械门外'
 for id,start in [('c4_rescue',8),('c4_record',8)]:
  for b in scenes[id]['beats'][start:]:b['background']='bridge-dawn';b['location']='海侧连廊 · 长椅'
 # Display timestamps follow the described chronology.
 times={'c3_05':'05:47','c3_06':'05:48','c3_07':'05:49','c3_distinct':'05:49','c3_name':'05:49','c4_mira_free':'05:56','c4_mira_safe':'05:56','c4_mira_container':'05:56','c4_02':'05:57','c4_own':'05:58','c4_mask':'05:58','c4_03':'05:59','c4_rescue':'06:00','c4_record':'06:00','c4_after':'06:00','c4_cooperate':'06:01','c4_refusal':'06:01','c4_no_witness':'06:01','c4_deal_review':'06:01','c4_retract':'06:01','c4_uphold':'06:01','c4_evidence_review':'06:02','c4_contact_review':'06:02','c4_06':'06:03'}
 for id,time in times.items():scenes[id]['time']=time
 # State-specific expressions, deliberately attached to exact lines.
 emotion('c2_hear','周衡','evasive','不知道');emotion('c2_hear','周衡','admit','对。')
 emotion('c2_press','周衡','evasive','锁门');emotion('c2_press','周衡','admit','批准')
 emotion('c4_rescue','周衡','admit','对不起')
 emotion('c2_deal','周衡','evasive');emotion('c4_cooperate','周衡','admit')
 emotion('c3_05','MIRA','concern');emotion('c4_record','MIRA','serious');emotion('c4_after','MIRA','concern')
 emotion('c4_mira_container','MIRA','hurt');emotion('c4_mira_free','MIRA','relief')
 emotion('c4_mira_safe','MIRA','relief');emotion('end_dawn','MIRA','relief')
 emotion('end_together','MIRA','relief');emotion('end_witness','MIRA','hurt')
 emotion('end_lastlight','MIRA','hurt','传输完成');emotion('end_lastlight','MIRA','hurt','别为了')
 emotion('end_lastlight','MIRA','reset','操作员您好')
 emotion('c3_02','林述','smile','以后可以')
 emotion('c3_04','林述','concern','算了')
 for id in ['c3_05','c3_06']:emotion(id,'林述','concern')
 for id in ['c3_07','c3_distinct','c3_name']:emotion(id,'林述','smile')
 emotion('c3_false_link','唐棠','greeting','林述？')
 emotion('c4_exposed','唐棠','shock');emotion('c4_still_false','唐棠','shock')
 emotion('c3_truth_link','唐棠','accept');emotion('end_farshore','唐棠','accept')
 # Do not reveal the synthetic wrist before the player chooses to inspect it.
 cg('c1_arm',0,7,'awakening')
 # The rescue CG depicts the door already opening, not a successful rescue in another branch.
 cg('c4_rescue',3,7,'rescue')
 # Cold greeting first, then return to the reset portrait when the player answers.
 cg('end_lastlight',5,8,'reset')
 cg('end_dawn',5,9,'departure')
