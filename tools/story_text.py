"""Reader-facing text layer. Graph, conditions and save identifiers stay in branching.py."""
from text_chapters_12 import TEXT as OPENING
from text_chapter_3 import TEXT as OFFICE
from text_events import TEXT as EVENTS

def apply_text(story):
    scenes=story['scenes']
    for key,script in {**OPENING,**OFFICE,**EVENTS}.items():
        old=scenes[key]['beats']
        lines=script.strip().splitlines()
        if key!='c3_witness' and len(lines)!=len(old):
            raise ValueError(f'{key}: {len(lines)} lines, expected {len(old)}')
        beats=[]
        for i,line in enumerate(lines):
            who,text=line.split('|',1)
            speaker,_,mood=who.partition('/')
            previous=old[i] if i<len(old) else {}
            beat={k:v for k,v in previous.items() if k not in ('speaker','text','emotion','cg','background','location','communication','hideCharacters')}
            beat.update(speaker=speaker,text=text,emotion=mood or (previous.get('emotion','neutral') if previous.get('speaker')==speaker else 'neutral'))
            beats.append(beat)
        scenes[key]['beats']=beats
    # Knowledge becomes available at the actual reveal, on both witness-choice routes.
    scenes['c3_medical'].pop('grant',None)
    for key in ['c3_05','c3_no_lin']:
        scenes[key]['grant']=list(dict.fromkeys(scenes[key].get('grant',[])+['medical','memory']))
    for chapter in story['chapters']:
        if chapter['id']=='c3':chapter.update(title='未说完的话',tag='一段没发出的语音，还在等人听完。')
        if chapter['id']=='c4':chapter.update(title='门的另一边',tag='这一次，门后的人还在等你。')
    story['echoes']['tang']={'title':'没有再说没事','text':'你告诉唐棠发生了事故，答应查清后再联系。她提醒你先确认安全，不要急着签字。'}
    labels={
        ('c3_04','call'):'告诉唐棠出了事故，别再让她空等',
        ('c3_04','wait'):'先查医疗记录，有消息再联系唐棠',
        ('c3_witness','testify'):'问清事故，请她同意留下证词',
        ('c3_witness','avoid'):'让她先休息，不录事故证词',
        ('c3_contact_choice','honest'):'告诉唐棠真实身份，请她帮忙接收资料',
        ('c3_link_memory','personal'):'备份醒来后的自己，留下今天',
        ('c3_link_memory','evidence'):'全部空间留给事故资料，不备份自己',
        ('fin_04','leave'):'带着今天的记忆离站，去见唐棠',
        ('fin_04','joint'):'留下，与林述分别作证',
        ('fin_04','send'):'先把事故资料送出去',
        ('fin_04','internal'):'内部结案，换取留下的许可',
        ('fin_04','reset'):'同意恢复，忘掉醒来后的今天',
    }
    for (key,id),label in labels.items():
        next(c for c in scenes[key]['choices'] if c['id']==id)['text']=label
    for c in scenes['fin_04']['choices']:
        if c['id']=='leave':c['lockedText']='需要备份今天、如实联系唐棠，并保持身体可以行动。'
        if c['id']=='joint':c['lockedText']='需要完整证据、两位当事人的配合、记忆备份及真实的站外接收。'
    # Explain mechanics in ordinary language after the reveal, without changing outcomes.
    replacements={
      'c4_record':{3:'我不能直接停机。我在开门，先站住别动。'},
      'c4_injury':{2:'MIRA的调度权限被恢复程序收走，画面慢了一拍。你赶到门前时，周衡已经倒下，血顺着袖口流到地上。',4:'他还活着。但现在没法录证词，也没法给你签延期。',5:'你取到了日志。那块能补全事故的离线盘，却没有被交出来。'},
      'c4_broken_arm':{1:'你想起连廊上那次关节警告。刚才没做的加固，现在已经来不及。',7:'周衡安全了。你的身体必须停机维修，今天的记忆也可能在恢复中失去。'},
      'c4_own':{3:'我会把你的答案原样留下，不替你改。',4:'窗口变成琥珀色，门禁权限被收回了一部分。恢复还没开始。'},
      'c4_mask':{2:'我会记下：你是为了保住权限才这样回答。',4:'可以。真正的答案，也一起写下来。'},
      'c4_cooperate':{2:'还有今天的记忆。我需要你签延期，不让这具身体现在被恢复。',3:'我签。你是事故证人，不是替我开脱的人。',4:'他签好，发给站务。你早先要求留下的邮件，或认真听完的那番话，终于有了回音。'},
      'c4_deal_review':{1:'交回的副本已经内部归档，你的读取权限被撤掉了。“暂时”没有留下另一份备份。'},
      'c4_retract':{1:'你已经交回副本，读取权限也撤了。'},
      'c4_refusal':{4:'正式程序赶不上六点十分。你只能靠已经保住的资料，以及愿意帮你的其他人。'},
      'c4_corrected':{1:'资料我会收。但我不能替错误的名字作证。重新确认你的身份，今天来不及。'},
      'end_together':{5:'你拿到了延期许可。今天不会被清掉，MIRA也保住了自己的记忆。',6:'下一次会议，我也会说自己的意见。',7:'名单里，你有自己的位置。没有“代理”两个字。'},
      'end_witness':{1:'材料收到了。你的身体却还没获准延期，恢复倒计时没有停。'},
      'end_dawn':{0:'六点十二分。离站许可到了，你和MIRA今天的记忆都保住了。船已经靠岸。'},
      'end_farshore':{0:'唐棠证明了今天的你确实存在。你带着记忆离开雾岬站，第一次走进她的厨房。',3:'你留下了今天。事故却还有缺失的记录或未取得的配合，不能就此结束。'},
    }
    for key,changes in replacements.items():
        for index,text in changes.items():scenes[key]['beats'][index]['text']=text
