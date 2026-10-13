window.STORY={
 "game": {
  "id": "echo-protocol",
  "schemaVersion": 3
 },
 "chapters": [
  {
   "id": "c1",
   "title": "第一章 · 急停",
   "premise": "急停按下了，它却没有停。",
   "cover": "card_c1",
   "intro": [
    "雾岬站，2041 年 3 月 17 日，05:00。实验舱断电后，你在一副陌生的金属支架上醒来。",
    "MIRA 叫你林述。急停按下了，机械臂却没有停；而系统记录里的每一条操作，都写着 LIN.S。",
    "【本章推演目标】查清急停为什么失效，并决定你手里的东西交给谁。"
   ],
   "unlock": {
    "always": true
   },
   "status": "released",
   "clock": {
    "start": "05:00",
    "end": "05:30",
    "closing_scene": "c1_s04a"
   },
   "values_in": {
    "defaults": {
     "EVD": 0,
     "TRU": 30,
     "EXP": 0,
     "SLF": 0
    },
    "carry": {}
   },
   "imports": {
    "echoes": [],
    "flags": []
   },
   "scenes_file": "story",
   "scene_sources": [
    "c1_s00-s01",
    "c1_s02",
    "c1_s03",
    "c1_s04"
   ],
   "entry": "c1_s00a",
   "checkpoints": [
    "c1_s00a",
    "c1_s01a",
    "c1_s02a",
    "c1_s03a",
    "c1_s04a"
   ],
   "endings_file": "chapters/c1/endings_draft_v1.yaml",
   "portrait_overrides": [
    {
     "when": "flag:mira_forced",
     "from": "mira_lv1",
     "to": "mira_broken"
    }
   ],
   "exports": {
    "echoes": [
     "c1_mira",
     "c1_cache"
    ],
    "flags": [
     "read_chat",
     "login_lin",
     "login_mira",
     "login_force",
     "ignored_arm",
     "read_plc",
     "bus_log",
     "saw_jumper",
     "photo_jumper",
     "jumper_removed",
     "edited_gate",
     "asked_pain",
     "mira_kept",
     "mira_copy",
     "mira_forced",
     "trace_env",
     "trace_arm"
    ]
   },
   "safety_cards": {
    "estop_last_door": "急停是留给人的最后一道门。有人把它接死，就等于把门焊上了，门外的人再怎么按也没用。",
    "loto_not_standing": "检修和调试时要先断电、上锁、挂牌。「我站在旁边看着」从来都不算一道保护。"
   },
   "scenes": [
    {
     "id": "c1_s00a",
     "bg": "scene_bay7_poweroff",
     "text": "黑暗。背后有什么东西\"咔\"地松开了，像一只手终于放过了你的后颈。\n你坐起来。掌心里攥着一张卡，边角硌得生疼——工牌。不用看你也知道上面的名字：林述。\n左臂很沉，沉得像有人往袖子里灌了半管铅。\n远处一块屏幕亮起来，一行青色的字一格一格地往外蹦：\n「操作员……不，单——单——」\n字卡住了，光标在原地一下一下地闪。\n",
     "choices": [
      {
       "id": "c1_s00a_look",
       "label": "先看清自己在哪",
       "key": false,
       "thumb": "c1_s00a_look",
       "effects": {
        "SLF": 5
       },
       "time": 2,
       "result": "你借着屏幕那点冷光，摸到身后一副金属支架，形状说不清是椅子还是什么夹具，接口处还带着余温。\n后来你才会知道，那是充电位。现在你只觉得，坐在那上面醒来，有点不对。\n",
       "log": "你在一副金属支架上醒来，没有立刻回应屏幕。",
       "next": "c1_s00b"
      },
      {
       "id": "c1_s00a_answer",
       "label": "先回应屏幕上的声音",
       "key": false,
       "thumb": "c1_s00a_answer",
       "effects": {
        "TRU": 10,
        "SLF": -5
       },
       "time": 1,
       "result": "\"我在。\"你的声音比你以为的要平。\n屏幕上的青色波形抖了一下，慢慢拉长：\"林……述？\"\n你说是。波形亮了一点，像有人在黑暗里松了口气。\n",
       "log": "你回应了 MIRA。她叫你林述，你没有否认。",
       "next": "c1_s00b"
      }
     ]
    },
    {
     "id": "c1_s00b",
     "bg": "scene_bay7_poweroff",
     "portrait": "mira_lv1",
     "text": "左臂还是沉。从肩到指尖，有一条细细的麻顺着往下走，走到手腕就停住，像信号断在了半路。\n你戴着一双工作手套。是你常用的那款，指尖磨得发亮，右手食指那里你自己用记号笔画过一道——为了记夹爪第三自由度的零位。\n你记得这个。你记得很清楚。\n",
     "choices": [
      {
       "id": "c1_s00b_move",
       "label": "活动一下左臂",
       "key": false,
       "thumb": "c1_s00b_move",
       "effects": {
        "SLF": 5
       },
       "time": 1,
       "result": "你抬起左臂。疼，一种很整齐的疼，从肘关节开始，一段一段，像有人在里面按顺序报数。\n你握了握拳。能握紧。只是每一下都慢半拍，好像要先等谁批准。\n",
       "log": "你活动了左臂。疼，但能用。",
       "next": "c1_s01a"
      },
      {
       "id": "c1_s00b_ignore",
       "label": "不管它，先办正事",
       "key": false,
       "thumb": "c1_s00b_ignore",
       "effects": {
        "SLF": -5
       },
       "time": 0,
       "flags_set": [
        "ignored_arm"
       ],
       "result": "麻就麻吧。工程师的手臂麻了是常事，熬夜调参数调到凌晨，谁的手不麻。\n你把左臂垂在身侧，用右手撑着站了起来。\n",
       "log": "你没有理会左臂的异样。",
       "next": "c1_s01a"
      }
     ]
    },
    {
     "id": "c1_s01a",
     "bg": "scene_bay7_emergency",
     "portrait": "mira_lv1",
     "text": "应急灯一盏一盏亮起来，把实验舱染成一种生病的绿。\n终端停在登录界面。账号栏里已经填好了：LIN.S。\n密码。你还没想，它就已经浮上来了，像肌肉记忆：SNAIL5。\nMIRA 的声音从头顶的扬声器里漏下来，断断续续：\"维护通道……还开着。我可以……但是会记在……\"\n还有第三条路：角落里那张贴着胶带的便利贴，写着备用服务账号。全站都知道它在那儿，也全站都假装不知道。\n",
     "choices": [
      {
       "id": "c1_s01a_pwd",
       "label": "输入自己记得的密码",
       "key": false,
       "thumb": "c1_s01a_pwd",
       "effects": {
        "EXP": 5,
        "SLF": -10
       },
       "time": 2,
       "flags_set": [
        "login_lin"
       ],
       "result": "S、N、A、I、L、5。回车。登录成功。\n手指比脑子快，这让你安心了一秒。下一秒你想起来：这个密码，全组都知道。\n系统日志里多了一行 LIN.S 登录。不管是谁在看，看到的都会是\"林述\"。\n",
       "log": "你用 LIN.S 的密码登录了终端。日志里记下了林述的名字。",
       "next": "c1_s01b"
      },
      {
       "id": "c1_s01a_mira",
       "label": "请 MIRA 用维护权限放你进去",
       "key": false,
       "thumb": "c1_s01a_mira",
       "effects": {
        "TRU": 10,
        "EXP": 10
       },
       "time": 4,
       "flags_set": [
        "login_mira"
       ],
       "result": "MIRA 沉默了很久，久到你以为她又断线了。\n\"这会……记在我名下。\"她说，\"他们已经……降过我一次级了。\"\n然后屏幕一闪，门开了。她什么都没再说，但你知道，她刚刚替你担了一件事。\n",
       "log": "MIRA 用维护权限放你进了系统。这笔账记在她名下。",
       "next": "c1_s01b"
      },
      {
       "id": "c1_s01a_force",
       "label": "用备用服务账号强行提权",
       "key": false,
       "thumb": "c1_s01a_force",
       "effects": {
        "EXP": 10,
        "TRU": -10
       },
       "time": 1,
       "flags_set": [
        "login_force"
       ],
       "result": "很快。快得让你有点得意。\n然后站内广播\"叮\"地轻响了一声，短促、礼貌，像一个人在你身后清了清嗓子。\nMIRA 的波形缩了回去。\"你……不需要这样的。\"\n",
       "log": "你用备用账号强行提权。站内广播响了一声。",
       "next": "c1_s01b"
      }
     ]
    },
    {
     "id": "c1_s01b",
     "bg": "scene_bay7_emergency",
     "text": "桌面上两个东西在闪。\n一个是组内聊天，未读 47 条，最上面一条是周衡发的，时间 3 月 14 日。\n另一个是急停系统的事件日志，图标是红色的，已经红了三个小时。\n",
     "choices": [
      {
       "id": "c1_s01b_chat",
       "label": "先看聊天记录",
       "key": false,
       "thumb": "c1_s01b_chat",
       "effects": {
        "EVD": 2
       },
       "time": 3,
       "flags_set": [
        "read_chat"
       ],
       "result": "你往上翻。大多是订饭、催报告、吐槽误触发。然后是 3 月 14 日，周衡的一句：\n\"林述你那密码还是'蜗牛'那套吧？全组都知道哈哈。\"\n后面跟着三个人的\"哈哈\"。你盯着那行字看了很久。原来不只是你记得这个密码。\n",
       "log": "你翻到了周衡调侃密码的聊天记录：全组都知道 LIN.S 的密码。",
       "next": "c1_s02a"
      },
      {
       "id": "c1_s01b_estop",
       "label": "直接打开急停日志",
       "key": false,
       "thumb": "c1_s01b_estop",
       "effects": {},
       "time": 1,
       "result": "聊天可以以后再看。你点开那个红色图标。\n第一行是 02:13:07。PB1 按下。\n你还没往下读，就已经觉得冷了。\n",
       "log": "你跳过聊天记录，直接打开了急停日志。",
       "next": "c1_s02a"
      }
     ]
    },
    {
     "id": "c1_s02a",
     "bg": "scene_bay7_emergency",
     "text": "02:13:07。PB1 按下。\n急停按钮就在 R-07 工位边上，红色蘑菇头，现在还陷在底座里，没人把它旋起来。\n屏幕上能调的东西有三样：急停和 PLC 的事件记录、电机母线的电压曲线、舱内的环境日志。\n每一样都要花点时间。你不必全看，看哪一样、看到哪里停下，由你决定。\n",
     "text_variants": [
      {
       "when": "flag:read_plc && flag:bus_log && flag:read_env",
       "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：急停按下了，K1 按时断了电。急停这一侧没做错什么。\n你的笔记上已经记了：K1 断电以后，48V 母线还平平地撑了 4.48 秒。\n你的笔记上已经记了：环境日志里，生命体征一栏是一道横杠。\n三样都看过了。屏幕能给的，已经都给你了。\n"
      },
      {
       "when": "flag:read_plc && flag:bus_log",
       "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：急停按下了，K1 按时断了电。急停这一侧没做错什么。\n你的笔记上已经记了：K1 断电以后，48V 母线还平平地撑了 4.48 秒。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
      },
      {
       "when": "flag:bus_log && flag:read_env",
       "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：K1 断电以后，48V 母线还平平地撑了 4.48 秒。\n你的笔记上已经记了：环境日志里，生命体征一栏是一道横杠。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
      },
      {
       "when": "flag:read_plc && flag:read_env",
       "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：急停按下了，K1 按时断了电。急停这一侧没做错什么。\n你的笔记上已经记了：环境日志里，生命体征一栏是一道横杠。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
      },
      {
       "when": "flag:read_plc",
       "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：急停按下了，K1 按时断了电。急停这一侧没做错什么。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
      },
      {
       "when": "flag:bus_log",
       "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：K1 断电以后，48V 母线还平平地撑了 4.48 秒。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
      },
      {
       "when": "flag:read_env",
       "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：环境日志里，生命体征一栏是一道横杠。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
      }
     ],
     "choices": [
      {
       "id": "c1_s02a_plc",
       "label": "查急停和 PLC 事件记录",
       "key": false,
       "thumb": "c1_s02a_plc",
       "hide_if": [
        "read_plc"
       ],
       "effects": {
        "EVD": 3
       },
       "time": 3,
       "flags_set": [
        "read_plc"
       ],
       "result": "记录很干净，干净得像教科书：02:13:07.112 PB1 按下，02:13:07.118 安全继电器 K1 线圈失电。\n六毫秒。急停这一侧什么都没做错。\n那么问题不在按钮上。你把这行字抄进了笔记，手指在\"K1\"两个字母上停了一下。\n",
       "log": "你调出急停记录：唐棠按下了急停，K1 线圈按时断了电。",
       "next": "c1_s02a"
      },
      {
       "id": "c1_s02a_bus",
       "label": "导出电机母线电压记录",
       "key": false,
       "thumb": "c1_s02a_bus",
       "hide_if": [
        "bus_log"
       ],
       "effects": {
        "EVD": 6
       },
       "time": 8,
       "flags_set": [
        "bus_log"
       ],
       "result": "导出很慢。采样文件有两个多 G，进度条像在跟你作对。\n曲线终于出来的时候，你看了很久才敢确认：02:13:07 之后，48V 母线一点没掉。平的。整整 4.48 秒，平得像一条地平线。\nK1 断了电，电机却没断电。这中间只有一种可能，而那不是故障，是人干的。\n你把文件存了两份。一份在本地，一份塞进一个你觉得周衡不会去翻的目录。\n",
       "log": "你导出了母线电压：急停后 48V 仍持续了 4.48 秒。你备份了两份。",
       "next": "c1_s02a"
      },
      {
       "id": "c1_s02a_env",
       "label": "看舱内环境日志",
       "key": false,
       "thumb": "c1_s02a_env",
       "hide_if": [
        "read_env"
       ],
       "effects": {
        "SLF": 5
       },
       "time": 2,
       "flags_set": [
        "read_env",
        "trace_env"
       ],
       "result": "温度 14.2℃，湿度 61%，二氧化碳 410ppm。往下是一长串传感器自检，大半标着黄色的\"数据异常\"。\n生命体征那一栏是空的，不是 0，是一道横杠，像一个没人填的格子。\n\"传感器……\"MIRA 的声音插进来，\"三点以后……就一直这样。很多东西……都不记了。\"\n你点点头。断电一整夜，坏几个传感器再正常不过。你把那道横杠从脑子里推开了，只是推得不太干净。\n",
       "log": "你看了环境日志，生命体征一栏是空的。MIRA 说传感器坏了。",
       "next": "c1_s02a"
      },
      {
       "id": "c1_s02a_done",
       "label": "就到这里，下一步",
       "key": false,
       "thumb": "c1_s02a_done",
       "effects": {},
       "time": 0,
       "result": "你关掉窗口。剩下的，屏幕给不了你答案。\n",
       "log": "你停止了调查日志。",
       "next": "c1_s02b"
      }
     ]
    },
    {
     "id": "c1_s02b",
     "bg": "scene_bay7_emergency",
     "text": "配电间 B-2 在走廊尽头，门上是刷卡锁。\nK1 就在那里面。如果真有人动过它，痕迹也在那里面。\n但门禁会记下每一张刷过的卡。今晚第一个刷卡进 B-2 的人，在周衡的屏幕上会亮得很显眼。\n",
     "choices": [
      {
       "id": "c1_s02b_go",
       "label": "去配电间，亲眼看看",
       "key": false,
       "thumb": "c1_s02b_go",
       "effects": {
        "EVD": 6,
        "EXP": 10
       },
       "time": 8,
       "flags_set": [
        "saw_jumper"
       ],
       "result": "门禁\"嘀\"了一声，比你想的要响。\n配电柜的门没锁。你打开它，一眼就看见了：K1 的 13、14 号端子上，夹着一根红色的跳线。\n线头剥得很利落，压接得很专业。做这件事的人懂行，而且不慌。\n你忽然明白了那 4.48 秒。急停发出了\"停\"，K1 也听话断开了，可这根线替它一直接着。\n",
       "log": "你进了配电间 B-2，看见 K1 的 13/14 端子被一根红色跳线短接。门禁记下了你。",
       "next": "c1_s02c"
      },
      {
       "id": "c1_s02b_stay",
       "label": "不去，靠日志推断",
       "key": false,
       "thumb": "c1_s02b_stay",
       "effects": {},
       "time": 0,
       "result": "你没有去。日志会说话，只是它说得慢、说得含糊。\n你心里有一个猜测，关于 K1，关于一根本不该在那里的线。现在它还只是猜测。\n",
       "log": "你没有进配电间，K1 的问题还只是推测。",
       "next": "c1_s03a"
      }
     ]
    },
    {
     "id": "c1_s02c",
     "bg": "scene_b2_jumper",
     "text": "红线在应急灯下像一道没愈合的口子。\n你可以拍下来、原样留着，那是证据。\n你也可以把它拔掉。只要它还夹在那里，这台机器就随时可能再伤一个人。\n或者，你可以去门禁系统里，把自己那一刷改成\"例行维护\"。\n",
     "choices": [
      {
       "id": "c1_s02c_photo",
       "label": "拍照，原样保留",
       "key": false,
       "thumb": "c1_s02c_photo",
       "effects": {
        "EVD": 3
       },
       "time": 3,
       "flags_set": [
        "photo_jumper"
       ],
       "result": "你拍了七张。正面、侧面、端子编号、柜门上的设备铭牌，还有一张带上了墙上的时钟。\n然后你把柜门关好，一切和你来之前一模一样。\n那根线还在那里。你告诉自己，这是为了让它能在别人面前说话。\n",
       "log": "你给跳线拍了照，没动现场。",
       "next": "c1_s03a"
      },
      {
       "id": "c1_s02c_remove",
       "label": "拆掉它，至少别再伤人",
       "key": false,
       "thumb": "c1_s02c_remove",
       "effects": {
        "EVD": -5,
        "SLF": 5,
        "TRU": 5
       },
       "time": 2,
       "flags_set": [
        "jumper_removed"
       ],
       "result": "你捏住线头，往外一拔。比想象中容易。\nK1 的指示灯跳了一下，回到它本来该在的状态。从这一秒起，急停又是急停了。\n你攥着那截红线站了一会儿。现场没了，你手里只剩一截谁都能剪出来的电线。\n\"你……先想到了人。\"MIRA 很轻地说。\n",
       "log": "你拆掉了跳线。急停恢复了，现场也没了。",
       "next": "c1_s03a"
      },
      {
       "id": "c1_s02c_cover",
       "label": "拍照后把门禁改成「维护」",
       "key": false,
       "thumb": "c1_s02c_cover",
       "effects": {
        "EVD": 2,
        "EXP": -10,
        "TRU": -10
       },
       "time": 5,
       "flags_set": [
        "photo_jumper",
        "edited_gate"
       ],
       "result": "照片拍好了。你回到终端，在门禁记录里把那一行的事由改成\"例行维护\"。\n改完你才发觉，这个动作很熟练。\n\"你和他……\"MIRA 的波形抖了一下，\"做了一样的事。\"\n你想解释，又不知道该说什么。\n",
       "log": "你拍了照，又把自己的门禁记录改成了维护。MIRA 看见了。",
       "next": "c1_s03a"
      }
     ]
    },
    {
     "id": "c1_s03a",
     "bg": "scene_bay7_emergency",
     "portrait": "mira_lv1",
     "text": "屏幕上那道青色的波形缺了一截，像一段被剪掉又没接好的录音带。\n权限栏写着：降级，只读。下面还压着一枚缓存索引，没进公共日志，锁在她自己的进程里。\n「三点零五分，」她说，「他让我……删。我删了。」停顿。「删……完成。」\n又一个停顿，比前一个长。\n「不……全。」\n你听得出来，她不是在报告，她是在承认一件事，然后等着看你怎么接。\n",
     "choices": [
      {
       "id": "c1_s03a_repair",
       "label": "花时间帮她整理碎片记忆",
       "key": false,
       "thumb": "c1_s03a_repair",
       "effects": {
        "TRU": 10
       },
       "time": 12,
       "result": "你把她念错的目录名一个个记下来，把断开的时间戳按顺序排好。你不替她补，她说不出的地方，你就留着空。\n每对上一段，那道波形的边就齐一点。\n十二分钟。外面的时间在走，你没有催她。\n最后她停下来，第一次，把一句话说完整了：\n「他让我删掉。我留了一份。在我自己里面。」\n说完，她好像有点怕，又补了一句：「你会……告诉他吗？」\n",
       "log": "你陪 MIRA 理清了记忆。她告诉你，她偷偷留了一份。",
       "next": "c1_s03b"
      },
      {
       "id": "c1_s03a_pain",
       "label": "问她：「你疼吗？」",
       "key": false,
       "thumb": "c1_s03a_pain",
       "effects": {
        "TRU": 8,
        "SLF": 5
       },
       "time": 3,
       "flags_set": [
        "asked_pain",
        "trace_arm"
       ],
       "result": "你没有去点任何菜单。你只是问：「你疼吗？」\n话一出口你自己也愣了一下。为什么会问这个。为什么问得这么自然。\n屏幕上什么也没动。波形停在那里，不长，也不缩。\n很久。\n「……没有人问过。」\n又过了一会儿，很轻：「你也……左臂，在疼，对吗。」\n「你摔下来的时候……撞到了。我看见的。」\n",
       "log": "你问 MIRA 疼不疼。她说，从没有人问过。",
       "next": "c1_s03b"
      },
      {
       "id": "c1_s03a_force",
       "label": "直接强制导出她的缓存",
       "key": true,
       "thumb": "c1_s03a_force",
       "effects": {
        "EVD": 10,
        "TRU": -20
       },
       "time": 2,
       "flags_set": [
        "mira_copy",
        "mira_forced"
       ],
       "result": "你不想再等。你绕过只读权限，把她的缓存整个拖进本地证据区。确认框只弹了一次，你按了下去。\n进度条走得很快。\n走到头的那一刻，那道青色的波形碎掉了一角，碎口上挂着一点红色的噪点，再也没长回去。\n「……收到。」她说。\n不是「操作员」，也不是「林述」。从这一刻起，她不再叫你任何名字。\n",
       "log": "你强行导出了 MIRA 的缓存。拿到了副本，她的声纹碎了一角。",
       "next": "c1_s04a"
      }
     ]
    },
    {
     "id": "c1_s03b",
     "bg": "scene_bay7_emergency",
     "portrait": "mira_lv1",
     "text": "那枚缓存索引还亮着，权限还在她手里。\n它可能是今晚唯一一份没被周衡碰过的记录。你需要它。\n可它也是她违抗命令、被降级换来的东西，是她「在自己里面」藏起来的东西。\n",
     "choices": [
      {
       "id": "c1_s03b_give",
       "label": "「能把副本给我吗？」",
       "key": false,
       "when": "TRU >= 50",
       "thumb": "c1_s03b_give",
       "effects": {
        "EVD": 8,
        "TRU": 5
       },
       "time": 2,
       "flags_set": [
        "mira_copy"
       ],
       "result": "她没有马上回答。屏幕角落弹出一个交接窗口，是她自己打开的。\n「你可以……留一份。」她说，「我也留着。」\n副本落进证据区，来源那一栏写着：MIRA，自愿。\n你看着「自愿」这两个字，看了很久。\n",
       "log": "MIRA 自愿把副本交给了你。",
       "next": "c1_s04a"
      },
      {
       "id": "c1_s03b_keep",
       "label": "「你自己留着，那是你的。」",
       "key": false,
       "when": "TRU >= 50",
       "thumb": "c1_s03b_keep",
       "effects": {
        "TRU": 10
       },
       "time": 1,
       "flags_set": [
        "mira_kept"
       ],
       "result": "你把交接请求撤了回去。\n波形顿了一下，像是没听懂，又像是听懂了不敢信。\n「……那，我收好。」\n索引慢慢合上。你手里少了一份证据。她心里多了一件，以后会提起的事。\n",
       "log": "你没有拿走副本。你说，那是她的。",
       "next": "c1_s04a"
      },
      {
       "id": "c1_s03b_leave",
       "label": "先不问了，走吧",
       "key": false,
       "thumb": "c1_s03b_leave",
       "effects": {},
       "time": 0,
       "result": "你没有开口。也许是你还没想好该怎么开口。\n那道波形亮了一下，像是有话要说。\n最后她什么也没说，只是把索引窗口留在屏幕上，没有关。\n",
       "log": "你没有问 MIRA 要副本，就离开了。",
       "next": "c1_s04a"
      }
     ]
    },
    {
     "id": "c1_s04a",
     "bg": "scene_bay7_emergency",
     "portrait": "mira_lv1",
     "text": "终端右下角弹出一条推送，你差点把它当成系统广告关掉。\n「事故初步报告（草稿）· 待周衡审批」。最后修改时间，四点零七分。\n你点开它。前三页是你已经知道的东西：急停，骨折，无人机。翻到第四页，有一栏你从没见过的格子：\n相关操作人：LIN.S\n配置变更：K1 回路「维护跳接」，经办人：LIN.S\n软件看门狗关闭：终端 T-03，账号：LIN.S\n三行。每一行都是你的名字。每一行都不是你干的。\n你盯着那几个字母，忽然觉得它们像三颗钉子，已经提前敲好了，只等着把什么人钉上去。\n不是什么人。是你。\n走廊尽头，有什么东西轻轻响了一下，像屏幕通电时的那声「嗡」。你手里的东西，今晚到底能留下多少？\n",
     "text_variants": [
      {
       "when": "flag:login_lin",
       "text": "终端右下角弹出一条推送，你差点把它当成系统广告关掉。\n「事故初步报告（草稿）· 待周衡审批」。最后修改时间，四点零七分。\n你点开它。前三页是你已经知道的东西：急停，骨折，无人机。翻到第四页，有一栏你从没见过的格子：\n相关操作人：LIN.S\n配置变更：K1 回路「维护跳接」，经办人：LIN.S\n软件看门狗关闭：终端 T-03，账号：LIN.S\n事故后终端登录：T-03，账号：LIN.S\n四行。前三行不是你干的。最后一行是。就在今晚，你用这个名字登录的时候，它被记了下来，整整齐齐地排在前三行下面。\n你盯着那几个字母，忽然觉得它们像钉子，已经提前敲好了。而最后一颗，是你自己递过去的。\n不是什么人。是你。\n走廊尽头，有什么东西轻轻响了一下，像屏幕通电时的那声「嗡」。你手里的东西，今晚到底能留下多少？\n"
      }
     ],
     "choices": [
      {
       "id": "c1_s04a_mira",
       "label": "把证据交给 MIRA，藏进「她自己里面」",
       "key": true,
       "hide_if": [
        "mira_forced"
       ],
       "echo_set": {
        "c1_cache": "mira"
       },
       "thumb": "c1_s04a_mira",
       "effects": {
        "TRU": 5
       },
       "time": 3,
       "result": "「我能……放在你那儿吗？」你问。说完才发觉，这是你今晚第一次求她。\n波形亮了起来，很稳，稳得不像一个刚被降过级的系统。\n「他找过我一次了。」她说，「没找到。」\n停了一下。\n「这次，我替你留着。」\n",
       "log": "你把证据交给了 MIRA。她说，这次她替你留着。",
       "next": "c1_end"
      },
      {
       "id": "c1_s04a_mail",
       "label": "发到自己的私人邮箱",
       "key": true,
       "echo_set": {
        "c1_cache": "mail"
       },
       "thumb": "c1_s04a_mail",
       "effects": {
        "EVD": 5,
        "EXP": 10
       },
       "time": 2,
       "result": "你打开邮箱，收件人那一栏自己就填好了，是林述用了七年的私人地址。手指比脑子快，这一点今晚你已经习惯了。\n附件，四个。发送。\n「已发送」的提示音很轻快，像一句毫不知情的「好的」。\n然后，站内广播响了第二声。不是提示音。是有人拿起了话筒。\n",
       "log": "你把证据发到了林述的私人邮箱。广播响了第二声。",
       "next": "c1_end"
      },
      {
       "id": "c1_s04a_none",
       "label": "先什么都不动，去问个明白",
       "key": true,
       "echo_set": {
        "c1_cache": "none"
       },
       "thumb": "c1_s04a_none",
       "effects": {},
       "time": 1,
       "result": "藏起来，就是承认自己需要躲。你不想躲。\n那三行字不是你写的。你要当面问，问写下它们的人，为什么是你的名字。\n你把报告关掉，所有证据原样留在本地，像一份摊开在桌上的答卷。\n你知道这很冒险。可是只有心虚的人，才急着藏。\n",
       "log": "你没有藏起证据，决定当面去问个明白。",
       "next": "c1_end"
      }
     ]
    },
    {
     "id": "c1_end",
     "bg": "scene_corridor_intercom",
     "text": "你往走廊尽头走。应急灯一盏一盏在头顶滑过去。\n你想起唐棠。想起她下周本来要修的那个接头。想起报告第四页上，那三颗已经敲好的钉子。\n有人要让林述背下这件事。\n而你就是林述。\n走廊尽头，那块对讲屏亮了。\n"
    }
   ],
   "endings": [
    {
     "id": "C1_E_CRACK",
     "title": "碎了一角",
     "when": "echo:c1_mira==forced",
     "image": "ending_C1_E_CRACK",
     "text": "证据在你手里，完完整整，一个字节也不少。\nMIRA 还在。她回答你的每一个问题，准确、迅速、礼貌。\n她只是再也不叫你「操作员」了。\n你告诉自己，这是值得的。你会在下一章，继续这样告诉自己。\n",
     "review": {
      "missed": [
       "一份她本来愿意交给你的东西"
      ],
      "safety_card": "estop_last_door",
      "self_hint": "你很擅长在要紧的时候，先把感受放到一边。这像谁？",
      "echo_notes": [
       "MIRA 会记得这一次。"
      ],
      "curves": true
     }
    },
    {
     "id": "C1_E_SAME",
     "title": "同一种手法",
     "when": "flag:edited_gate",
     "image": "ending_C1_E_SAME",
     "text": "门禁日志里，两行字并排躺着。\n一行写着 LIN.S，是有人替你写的。\n一行写着「例行维护」，是你自己写的。\n你知道这两件事不一样。你只是突然不太确定，在别人眼里，它们还有多少不一样。\n",
     "review": {
      "missed": [
       "一张没有被改过的门禁记录"
      ],
      "safety_card": "loto_not_standing",
      "self_hint": "你改日志的时候，手很熟。你从没问过它为什么这么熟。",
      "echo_notes": [
       "有人会注意到那一行「维护」。"
      ],
      "curves": true
     }
    },
    {
     "id": "C1_E_MAIL",
     "title": "寄给自己",
     "when": "echo:c1_cache==mail",
     "image": "ending_C1_E_MAIL",
     "text": "邮件已经出站了。至少有一份真相，已经不在雾岬站里。\n可是广播响了第二声。今晚第一次，有人主动开口找你。\n你没有躲。你本来也没想躲。\n只是从现在开始，他知道你手里有东西了。\n",
     "review": {
      "missed": [
       "一个不会被广播听见的地方"
      ],
      "safety_card": "estop_last_door",
      "self_hint": "收件人那一栏，是你的手自己填上的。",
      "echo_notes": [
       "周衡会更早知道你做了什么。"
      ],
      "curves": true
     }
    },
    {
     "id": "C1_E_KEPT",
     "title": "她留了一份",
     "when": "echo:c1_mira in [mended,asked] && echo:c1_cache==mira",
     "image": "ending_C1_E_KEPT",
     "text": "证据不在你身上，也不在任何一台周衡碰得到的硬盘里。\n它在 MIRA「自己里面」，和她三点零五分偷偷留下的那一份放在一起。\n「这次，我替你留着。」\n今晚第一次，你觉得这座站里，不止你一个人醒着。\n",
     "review": {
      "missed": [
       "那封没有发出去的信"
      ],
      "safety_card": "estop_last_door",
      "self_hint": "你向她求助的时候，没有一点犹豫。好像你们本来就是同一类。",
      "echo_notes": [
       "MIRA 替你留着一样东西。"
      ],
      "curves": true
     }
    },
    {
     "id": "C1_E_NAME",
     "title": "被写好的名字",
     "when": "true",
     "image": "ending_C1_E_NAME",
     "text": "报告第四页上，三行 LIN.S 还亮着。\n你什么都没藏，什么都没送出去。证据就摊在桌上，像在等一个解释。\n有人要让林述背下这件事。\n你要去问他，为什么。\n",
     "review": {
      "missed": [
       "一个能把证据带出 06:00 的地方"
      ],
      "safety_card": "estop_last_door",
      "self_hint": "你那么确定那个名字是你的。你有没有想过，为什么这么确定？",
      "echo_notes": [
       "你什么都没藏，这一点会被看见。"
      ],
      "curves": true
     }
    }
   ],
   "bonuses": [],
   "self_endings": [],
   "echoes": [
    {
     "id": "c1_mira",
     "from": "c1",
     "values": [
      "mended",
      "asked",
      "forced"
     ],
     "default": "asked",
     "derive": [
      {
       "when": "flag:mira_forced",
       "value": "forced"
      },
      {
       "when": "flag:asked_pain",
       "value": "asked"
      },
      {
       "when": "true",
       "value": "mended"
      }
     ],
     "appears_in": [
      "c2_s02a",
      "c3_s00a",
      "fin_s01a"
     ],
     "icon": "echo_mira"
    },
    {
     "id": "c1_cache",
     "from": "c1",
     "values": [
      "mira",
      "mail",
      "none"
     ],
     "default": "none",
     "derive": [],
     "appears_in": [
      "c2_s00a",
      "c4_s02a",
      "fin_s01a"
     ],
     "icon": "echo_cache"
    },
    {
     "id": "c2_stance",
     "from": "c2",
     "values": [
      "play",
      "confront",
      "silent"
     ],
     "default": "play",
     "derive": [],
     "appears_in": [
      "c3_s00a",
      "c4_s03a",
      "fin_s01a"
     ],
     "icon": "echo_stance"
    },
    {
     "id": "c2_letter",
     "from": "c2",
     "values": [
      "copied",
      "kept_secret",
      "unread"
     ],
     "default": "unread",
     "derive": [],
     "appears_in": [
      "c4_s03a",
      "fin_s02a"
     ],
     "icon": "echo_letter"
    },
    {
     "id": "c3_prior",
     "from": "c3",
     "values": [
      "merged",
      "isolated"
     ],
     "default": "isolated",
     "derive": [],
     "appears_in": [
      "c4_s00a",
      "fin_s03a"
     ],
     "icon": "echo_prior"
    },
    {
     "id": "c3_tang",
     "from": "c3",
     "values": [
      "called",
      "not_called"
     ],
     "default": "not_called",
     "derive": [],
     "appears_in": [
      "fin_s02a"
     ],
     "icon": "echo_tang"
    },
    {
     "id": "c4_self",
     "from": "c4",
     "values": [
      "seen",
      "closed"
     ],
     "default": "closed",
     "derive": [],
     "appears_in": [
      "fin_s03a"
     ],
     "icon": "echo_self"
    },
    {
     "id": "c4_door",
     "from": "c4",
     "values": [
      "faced",
      "locked",
      "drone"
     ],
     "default": "locked",
     "derive": [],
     "appears_in": [
      "fin_s04a"
     ],
     "icon": "echo_door"
    }
   ],
   "clock_start": "05:00",
   "closing_scene": "c1_s04a",
   "values": {
    "EVD": 0,
    "TRU": 30,
    "EXP": 0,
    "SLF": 0
   }
  },
  {
   "id": "c2",
   "title": "第二章 · 二十三个人",
   "premise": "周衡把你当成林述。他提起一个快要被砍掉的项目、二十三个饭碗，还有一封没有发出的信。",
   "cover": "card_c2",
   "intro": [
    "05:30，雾岬站的内线电话响起。周衡叫你林述，像昨晚的一切都还没发生。",
    "MIRA 记得你把什么交给了她，也记得你没有交给她的东西。",
    "【本章推演目标】听完周衡的话，决定这封信要不要留下。"
   ],
   "unlock": {
    "completed": [
     "c1"
    ]
   },
   "status": "released",
   "clock": {
    "start": "05:30",
    "end": "05:42",
    "closing_scene": "c2_s05a"
   },
   "values_in": {
    "defaults": {
     "EVD": 25,
     "TRU": 45,
     "EXP": 20,
     "SLF": 5
    },
    "carry": {
     "EVD": "keep",
     "TRU": "keep",
     "SLF": "keep",
     "EXP": {
      "add": -20,
      "min": 0
     }
    }
   },
   "imports": {
    "echoes": [
     "c1_mira",
     "c1_cache"
    ],
    "flags": [
     "read_chat",
     "login_mira",
     "login_force",
     "ignored_arm",
     "edited_gate",
     "mira_forced",
     "trace_env",
     "trace_arm"
    ]
   },
   "scenes_file": "story/c2_draft_v5.yaml",
   "entry": "c2_s00a",
   "checkpoints": [
    "c2_s00a",
    "c2_s01a",
    "c2_s02a",
    "c2_s03a",
    "c2_s04a"
   ],
   "endings_file": "chapters/c2/endings_draft_v2.yaml",
   "portrait_overrides": [
    {
     "when": "flag:mira_forced",
     "from": "mira_lv1",
     "to": "mira_broken"
    }
   ],
   "exports": {
    "echoes": [
     "c2_stance",
     "c2_letter"
    ],
    "flags": [
     "zhou_heard",
     "zhou_letter",
     "f_x1",
     "c2_glove_guess_self"
    ]
   },
   "safety_cards": {},
   "scenes": [
    {
     "id": "c2_s00a",
     "bg": "scene_corridor_intercom",
     "portrait": "mira_lv1",
     "text": "对讲屏亮着，不响，也不灭。屏幕正中只有一行字：\n来电：控制室 · 周衡\n还没接通。光标在「接听」两个字下面一闪一闪，很耐心，好像知道你一定会接。\n你站在屏幕前。走廊很长，后面没有人。\n",
     "choices": [
      {
       "id": "c2_s00a_log",
       "label": "先查来电记录",
       "thumb": "c2_s00a_log",
       "effects": {
        "EVD": 3
       },
       "time": 1,
       "result": "你没碰「接听」，先点开了旁边的记录。\n控制室打来这台对讲屏，今晚是第三次。前两次都没人接。第一次，是在急停之后不到十分钟。\n他一直在找林述。\n",
       "log": "你查了来电记录。他今晚找了林述三次。",
       "next": "c2_s01a",
       "flags_set": [
        "c2_via_log"
       ]
      },
      {
       "id": "c2_s00a_answer",
       "label": "直接接",
       "thumb": "c2_s00a_answer",
       "effects": {},
       "time": 0,
       "result": "你伸手按下去。屏幕闪了一下，显示「正在接通」，然后卡住了。\n线路那头传来很远的杂音，像有人把听筒放在桌上，走开去拿什么东西。\n",
       "log": "你按了接听。他那边还没拿起听筒。",
       "next": "c2_s01a"
      },
      {
       "id": "c2_s00a_ring",
       "label": "让它响",
       "thumb": "c2_s00a_ring",
       "effects": {
        "SLF": 5
       },
       "time": 1,
       "result": "你没有动。屏幕亮着，你也站着，谁都不先开口。\n你想知道，如果林述不接，他会怎么做。\n",
       "result_variants": [
        {
         "when": "flag:login_mira",
         "text": "你没有动。屏幕亮着，你也站着，谁都不先开口。\nMIRA 轻声说：「那一笔还记在我名下。你不接，他也会先来问我。」\n你还是没有动。\n"
        }
       ],
       "log": "你让它一直亮着，没有接。",
       "next": "c2_s01a",
       "flags_set": [
        "c2_via_ring"
       ]
      }
     ],
     "text_append": [
      {
       "when": "echo:c1_mira==forced",
       "text": "MIRA 的波形缩在屏幕一角，只报了一句：「五点三十。」\n她没再说别的。\n"
      },
      {
       "when": "echo:c1_mira==asked",
       "text": "MIRA 的声音压得很低：「他会问你在哪。」\n"
      },
      {
       "when": "echo:c1_mira==mended",
       "text": "MIRA 的声音压得很低：「他会问你在哪。你想好怎么回答，再接。」\n"
      },
      {
       "when": "echo:c1_cache==mail",
       "text": "屏幕右下角，有一行很小的灰字：外发邮件 1 封 · 已记录。\n"
      },
      {
       "when": "echo:c1_cache==none",
       "text": "你想起那些证据还摊在 T-03 上，谁路过都能看见。\n"
      }
     ]
    },
    {
     "id": "c2_s01a",
     "bg": "scene_corridor_intercom",
     "portrait": "mira_lv1",
     "text": "等的时候，左臂又麻了一下，从手肘一直麻到指尖。\n你低头。地上有一只手套，掉在对讲屏下面，指尖朝着你。灰色，腕口一圈反光条。\n和你手上戴的那只，是同一款。\n对讲屏旁边的值班板上，有人用记号笔写了一行，字迹很急：「唐棠 左前臂骨折 已转运」。\n如果唐棠已经走了，那这只手为什么在疼？\n",
     "text_variants": [
      {
       "when": "flag:ignored_arm",
       "text": "等的时候，左臂又麻了。这一次你没法不理它，从手肘一直麻到指尖，像有人隔着皮肤拧了一下螺丝。\n之前你一直没理会这只手。现在它不让你不理了。\n地上有一只手套，掉在对讲屏下面，指尖朝着你。灰色，腕口一圈反光条。\n和你手上戴的那只，是同一款。\n对讲屏旁边的值班板上，有人用记号笔写了一行，字迹很急：「唐棠 左前臂骨折 已转运」。\n如果唐棠已经走了，那这只手为什么在疼？\n"
      }
     ],
     "choices": [
      {
       "id": "c2_s01a_glove",
       "label": "捡起手套，比一比",
       "thumb": "c2_s01a_glove",
       "flags_set": [
        "c2_took_glove"
       ],
       "effects": {
        "SLF": 8
       },
       "time": 1,
       "result": "你把它捡起来，和自己的手并排放着。\n一样的尺码。一样的反光条。左手那只的掌心有一道磨痕，你手上这只，同一个位置，也有。\n你把两只手套叠在一起，叠得严丝合缝。\n你告诉自己，工服都是统一发的。\n",
       "log": "你比了那只手套。和你手上的一模一样，连磨痕都在同一处。",
       "next": "c2_s01b"
      },
      {
       "id": "c2_s01a_ask",
       "label": "问 MIRA，唐棠现在在哪",
       "thumb": "c2_s01a_ask",
       "flags_set": [
        "c2_asked_mira"
       ],
       "effects": {
        "TRU": 5
       },
       "time": 1,
       "result": "MIRA 调出一张表，几十行时间和编号，滚得很快。\n「医疗转运记录在这里。」她说，「你自己看吧。」\n你看了。看不出什么。\n",
       "result_by_echo": {
        "c1_mira": {
         "mended": "MIRA 停了一下，才开口：「两点三十一分，无人机离港。唐棠在上面。」\n「她已经不在站里了。」\n你点点头。点完才发现，你不知道自己在同意什么。\n",
         "asked": "MIRA 停了一下，才开口：「两点三十一分，无人机离港。唐棠在上面。」\n「她已经不在站里了。」\n你点点头。点完才发现，你不知道自己在同意什么。\n"
        }
       },
       "log": "你问了 MIRA 唐棠在哪。",
       "next": "c2_s01b"
      },
      {
       "id": "c2_s01a_none",
       "label": "不想了",
       "thumb": "c2_s01a_none",
       "effects": {
        "SLF": -5
       },
       "time": 0,
       "result": "手麻是因为累。手套是别人掉的。值班板上写的是值班板上的事。\n你把这三件事分开放好，一件都不去碰。\n",
       "log": "你没有再想那只手。",
       "next": "c2_s02a"
      }
     ]
    },
    {
     "id": "c2_s01b",
     "bg": "scene_corridor_intercom",
     "portrait": "mira_lv1",
     "text": "对讲屏还在等。你看着手里那只手套。\n掌心的磨痕，尺码，反光条。还有你左臂里那一点说不清的麻。\n你得先给自己一个答案，哪怕只是暂时的。\n这只手套，是谁的？\n",
     "choices": [
      {
       "id": "c2_s01b_tang",
       "label": "「是唐棠的。她掉在这里了。」",
       "thumb": "c2_s01b_tang",
       "flags_set": [
        "c2_glove_guess_tang"
       ],
       "effects": {},
       "time": 0,
       "result": "最说得通的答案。她出事的时候就在这附近，手套掉了，没人顾得上捡。\n你把它放在值班板下面，像替谁收好一件东西。\n",
       "log": "你判断手套是唐棠的。",
       "next": "c2_s02a",
       "result_variants": [
        {
         "when": "!flag:c2_took_glove",
         "text": "最说得通的答案。她出事的时候就在这附近，手套掉了，没人顾得上捡。\n你没有去碰它。它就该留在那里，等她的人来收。\n"
        }
       ]
      },
      {
       "id": "c2_s01b_lin",
       "label": "「是林述的。是我早先掉的。」",
       "thumb": "c2_s01b_lin",
       "flags_set": [
        "c2_glove_guess_lin"
       ],
       "effects": {},
       "time": 0,
       "result": "你今晚来过这里，也许不止一次。掉一只手套，再正常不过。\n只是你想不起来，是什么时候摘下它的。\n",
       "log": "你判断手套是林述的。",
       "next": "c2_s02a"
      },
      {
       "id": "c2_s01b_self",
       "label": "「是我的。」",
       "thumb": "c2_s01b_self",
       "flags_set": [
        "c2_glove_guess_self"
       ],
       "effects": {
        "SLF": 5
       },
       "time": 0,
       "result": "你说不清「我」指的是谁。\n可手套上的磨痕，和你掌心发麻的位置，是同一处。\n",
       "log": "你判断手套是你自己的。",
       "next": "c2_s02a",
       "result_variants": [
        {
         "when": "!flag:c2_took_glove",
         "text": "你说不清「我」指的是谁。\n你没碰它，可你左手的掌心，正在它磨痕的那个位置发麻。\n"
        }
       ]
      }
     ],
     "text_variants": [
      {
       "when": "!flag:c2_took_glove",
       "text": "对讲屏还在等。\n那只手套还躺在对讲屏下面，指尖朝着你。你没捡，可你忍不住还在看它。\n尺码，反光条，掌心那道磨痕。还有你左臂里那一点说不清的麻。\n你得先给自己一个答案，哪怕只是暂时的。\n这只手套，是谁的？\n"
      }
     ]
    },
    {
     "id": "c2_s02a",
     "bg": "scene_corridor_intercom",
     "portrait": "zhou_voice",
     "text": "线路接通了。\n「林述？」\n是个男人的声音，不高，有点哑，像一整夜都在说话。\n「我让你回宿舍休息，你回来干什么。」\n他没等你回答，自己说下去。说一季度验收的签字，说那两次演示都被急停误触发打断了，说贺总当着所有人的面问他，这条线到底还要不要。\n「接头下周就修了。」他说，「就差一周。」\n他在等你说话。\n",
     "choices": [
      {
       "id": "c2_s02a_play",
       "label": "以林述的身份周旋",
       "key": true,
       "echo_set": {
        "c2_stance": "play"
       },
       "flags_set": [
        "f_x1"
       ],
       "thumb": "c2_s02a_play",
       "effects": {
        "EVD": 8,
        "EXP": 5
       },
       "time": 2,
       "result": "「我睡不着。」你说，「回来看看。」\n这句话说出口，轻得像真的。\n他那边松了一点，叹了口气。「我也睡不着。」\n然后他说了很多。说到后来，他压低声音：\n「你以为我想这样？那是二十三个人。二十三个人的房贷、孩子的学费，我一个一个看着他们签的入职。」\n「贺总的意思是，机器可以召回，人不能。这不是我说的，可我得替他说。」\n他顿了顿，声音低下去：「唐棠……她站得太近了。我只能这么告诉她。」\n",
       "log": "你用林述的语气和他说话。他提到了贺总那句话。",
       "next": [
        {
         "when": "echo:c2_stance in [play,silent] && (TRU >= 55 || SLF >= 30)",
         "to": "c2_s03a_heard"
        },
        {
         "to": "c2_s03a"
        }
       ]
      },
      {
       "id": "c2_s02a_confront",
       "label": "「我知道 K1 的事。」",
       "key": true,
       "echo_set": {
        "c2_stance": "confront"
       },
       "thumb": "c2_s02a_confront",
       "effects": {
        "EVD": 5,
        "EXP": 20
       },
       "time": 1,
       "result": "「我知道 K1 的事。」\n电话那头没有声音。很久。久到你以为线断了。\n然后是一声很重的闷响，像椅子向后倒在地上。\n他再开口的时候，声音冷下来，一点都不哑了。\n「你知道什么？」\n你没有回答。他自己接了下去，一个字一个字：「她站得太近。报告上写得很清楚。」\n",
       "log": "你说你知道 K1 的事。那头传来椅子倒地的声音。",
       "next": "c2_s03a"
      },
      {
       "id": "c2_s02a_silent",
       "label": "什么都不说",
       "key": true,
       "echo_set": {
        "c2_stance": "silent"
       },
       "thumb": "c2_s02a_silent",
       "effects": {
        "EVD": 2,
        "EXP": -5,
        "SLF": 10
       },
       "time": 2,
       "result": "你没有说话。\n他等了一会儿，声音软下来：「……你在哭？」\n你没有回答。他也就不再问，自己说下去，像在跟一个不会还嘴的人说话。\n「那是二十三个人。我一个一个看着他们签的入职。」\n「唐棠……她站得太近了。我只能这么告诉她。」\n说完，他自己停了一下。\n",
       "log": "你一直没出声。他以为你在哭，自己说了下去。",
       "next": [
        {
         "when": "echo:c2_stance in [play,silent] && (TRU >= 55 || SLF >= 30)",
         "to": "c2_s03a_heard"
        },
        {
         "to": "c2_s03a"
        }
       ]
      }
     ],
     "text_variants": [
      {
       "when": "flag:c2_via_log",
       "text": "你点回通话界面，按了接听。线路接通了。\n「林述？」\n是个男人的声音，不高，有点哑，像一整夜都在说话。\n「我让你回宿舍休息，你回来干什么。」\n他没等你回答，自己说下去。说一季度验收的签字，说那两次演示都被急停误触发打断了，说贺总当着所有人的面问他，这条线到底还要不要。\n「接头下周就修了。」他说，「就差一周。」\n他在等你说话。\n"
      },
      {
       "when": "flag:c2_via_ring",
       "text": "屏幕自己跳成了「已接通」。你什么都没按，他那边先开了口。\n「林述？」\n是个男人的声音，不高，有点哑，像一整夜都在说话。\n「我让你回宿舍休息，你回来干什么。」\n他没等你回答，自己说下去。说一季度验收的签字，说那两次演示都被急停误触发打断了，说贺总当着所有人的面问他，这条线到底还要不要。\n「接头下周就修了。」他说，「就差一周。」\n他在等你说话。\n"
      }
     ]
    },
    {
     "id": "c2_s03a",
     "bg": "scene_corridor_intercom",
     "portrait": "zhou_voice",
     "text": "他沉默了一会儿。听筒里有翻纸的声音。\n「六点以前，」他说，「别乱碰东西。」\n你听见他的手已经放在挂断键上。\n",
     "choices": [
      {
       "id": "c2_s03a_letter",
       "label": "追问他刚才在翻什么",
       "flags_set": [
        "zhou_letter"
       ],
       "thumb": "c2_s03a_letter",
       "effects": {
        "EVD": 3
       },
       "time": 1,
       "result": "「你在翻什么？」\n他停了一下，像是没想到你会问这个。「一封信。」\n「你会看到的。你总是能看到。」\n线路断了。\n",
       "log": "你问他在翻什么。他说是一封信，你会看到的。",
       "next": "c2_s04a"
      },
      {
       "id": "c2_s03a_hang",
       "label": "让他挂",
       "thumb": "c2_s03a_hang",
       "effects": {},
       "time": 0,
       "result": "你没有再开口。\n他那边「咔」的一声，屏幕上的通话时长停住，然后消失了。\n",
       "log": "你让他挂了电话。",
       "next": "c2_s04a"
      }
     ]
    },
    {
     "id": "c2_s03a_heard",
     "bg": "scene_corridor_intercom",
     "portrait": "zhou_voice",
     "text": "他沉默了一会儿。听筒里有翻纸的声音。\n「我写了一封信。」他说，「没发。」\n「我不知道该寄给谁。」\n这一次，他没有急着挂。\n",
     "choices": [
      {
       "id": "c2_s03a_letter",
       "label": "「信里写了什么？」",
       "flags_set": [
        "zhou_letter",
        "zhou_heard"
       ],
       "thumb": "c2_s03a_letter",
       "effects": {
        "EVD": 3
       },
       "time": 1,
       "result": "「信里写了什么？」\n他笑了一声，很短。「你会看到的。你总是能看到。」\n线路断了。\n",
       "log": "你问信里写了什么。他说你会看到的。",
       "next": "c2_s04a"
      },
      {
       "id": "c2_s03a_hang",
       "label": "让他挂",
       "thumb": "c2_s03a_hang",
       "effects": {},
       "time": 0,
       "result": "你没有再开口。\n他那边「咔」的一声，屏幕上的通话时长停住，然后消失了。\n",
       "log": "你让他挂了电话。",
       "next": "c2_s04a",
       "flags_set": [
        "zhou_heard"
       ]
      },
      {
       "id": "c2_s03a_send",
       "label": "「你可以现在发。」",
       "thumb": "c2_s03a_send",
       "effects": {
        "TRU": 5,
        "SLF": 5
       },
       "time": 1,
       "result": "「你可以现在发。」\n说完你才意识到，这不像林述会说的话。\n他很久没出声。「……你不像你。」\n挂断之前，他又补了一句，很轻：「谢谢。」\n",
       "log": "你说他可以现在发。他说你不像你。",
       "next": "c2_s04a",
       "flags_set": [
        "zhou_heard"
       ]
      }
     ]
    },
    {
     "id": "c2_s04a",
     "bg": "scene_bay7_emergency",
     "portrait": "mira_lv1",
     "text": "他刚才翻纸的声音还在你耳朵里。你想起控制室终端上，常年开着一个没关的草稿窗口。\n你回到 T-03，用林述的账号连上控制室的终端。权限还在，像一扇没人记得锁的门。\n草稿箱里只有一封。没有收件人。\n草稿最后保存：四点十分。比那份报告的最后修改晚了三分钟。\n打开没关系，这个窗口他自己也常开着。但另存会在他的终端上弹一条「文件已导出」。他早晚会看到，是林述的账号导走的。\n开头两行，在预览栏里露出来：\n「我对唐棠撒了谎。她没有站得太近。是我让它不会停。」\n下面还有很多。滚动条很短。\n",
     "text_variants": [
      {
       "when": "echo:c2_stance==confront && echo:c1_cache==mail",
       "text": "他说别乱碰东西。他越这么说，你越想知道他怕你碰到什么。\n你回到 T-03，用林述的账号连上控制室的终端。外发已经被切断了，是今晚刚改的，就在你那封邮件之后。内网权限还在，但你知道他随时会想起来。你只有这一次。\n草稿箱里只有一封。没有收件人。\n草稿最后保存：四点十分。比那份报告的最后修改晚了三分钟。\n打开没关系，这个窗口他自己也常开着。但另存会在他的终端上弹一条「文件已导出」。他早晚会看到，是林述的账号导走的。\n开头两行，在预览栏里露出来：\n「我对唐棠撒了谎。她没有站得太近。是我让它不会停。」\n下面还有很多。滚动条很短。\n"
      },
      {
       "when": "echo:c2_stance==confront",
       "text": "他说别乱碰东西。他越这么说，你越想知道他怕你碰到什么。\n你回到 T-03，用林述的账号连上控制室的终端。权限还在，但你知道他随时会想起来。你只有这一次。\n草稿箱里只有一封。没有收件人。\n草稿最后保存：四点十分。比那份报告的最后修改晚了三分钟。\n打开没关系，这个窗口他自己也常开着。但另存会在他的终端上弹一条「文件已导出」。他早晚会看到，是林述的账号导走的。\n开头两行，在预览栏里露出来：\n「我对唐棠撒了谎。她没有站得太近。是我让它不会停。」\n下面还有很多。滚动条很短。\n"
      },
      {
       "when": "echo:c1_cache==mail",
       "text": "他刚才翻纸的声音还在你耳朵里。你想起控制室终端上，常年开着一个没关的草稿窗口。\n你回到 T-03，用林述的账号连上控制室的终端。外发已经被切断了，是今晚刚改的，就在你那封邮件之后。但内网还开着，像一扇他忘了锁的门。\n草稿箱里只有一封。没有收件人。\n草稿最后保存：四点十分。比那份报告的最后修改晚了三分钟。\n打开没关系，这个窗口他自己也常开着。但另存会在他的终端上弹一条「文件已导出」。他早晚会看到，是林述的账号导走的。\n开头两行，在预览栏里露出来：\n「我对唐棠撒了谎。她没有站得太近。是我让它不会停。」\n下面还有很多。滚动条很短。\n"
      }
     ],
     "choices": [
      {
       "id": "c2_s04a_copied",
       "label": "存一份副本，留下访问记录也认了",
       "key": true,
       "echo_set": {
        "c2_letter": "copied"
       },
       "thumb": "c2_s04a_copied",
       "effects": {
        "EVD": 10,
        "EXP": 10
       },
       "time": 2,
       "result": "你选了「另存为」。进度条走得很慢。\n存完，你没有点开它。现在它是证据了。证据不需要你先读。\n",
       "result_by_echo": {
        "c1_cache": {
         "mira": "你选了「另存为」，路径选的是 MIRA。\n「收到。」她说，「和上一次的放在一起。」\n你没有点开它。现在它是证据了。证据不需要你先读。\n"
        }
       },
       "log": "你存下了那封信的副本。",
       "next": "c2_s05a"
      },
      {
       "id": "c2_s04a_kept",
       "label": "关掉，等他自己决定寄不寄",
       "key": true,
       "echo_set": {
        "c2_letter": "kept_secret"
       },
       "thumb": "c2_s04a_kept",
       "effects": {
        "TRU": 10,
        "SLF": 10
       },
       "time": 1,
       "result": "你把窗口关了。\n这封信是他写的。要不要寄出去，该由他自己来决定。\n你说不清这算是给他一次机会，还是给你自己。\n",
       "log": "你关掉了那封信，替他保密。",
       "next": "c2_s05a"
      },
      {
       "id": "c2_s04a_unread",
       "label": "只读了两行就关掉，当作没看见",
       "key": true,
       "echo_set": {
        "c2_letter": "unread"
       },
       "thumb": "c2_s04a_unread",
       "effects": {},
       "time": 0,
       "result": "你没有往下滚。\n那两行已经够了。剩下的，你不知道自己接不接得住。\n",
       "log": "你没有往下看。",
       "next": "c2_s05a"
      }
     ]
    },
    {
     "id": "c2_s05a",
     "bg": "scene_corridor_intercom",
     "portrait": "mira_lv1",
     "text": "对讲屏又亮了一下。只有声音，没有来电显示。\n",
     "choices": [
      {
       "id": "c2_s05a_lin",
       "label": "「林述。」",
       "thumb": "c2_s05a_lin",
       "effects": {
        "SLF": -5
       },
       "time": 0,
       "result": "「林述。」\n你说得很快，快得像背熟了。\n",
       "log": "你说，林述。",
       "next": "c2_end"
      },
      {
       "id": "c2_s05a_dunno",
       "label": "「我不知道。」",
       "thumb": "c2_s05a_dunno",
       "flags_set": [
        "c2_answered_dunno"
       ],
       "effects": {
        "SLF": 5
       },
       "time": 0,
       "result": "「我不知道。」\n这是你今晚说的第一句真话。说出口，你才知道它有多重。\n",
       "log": "你说，我不知道。",
       "next": "c2_end"
      },
      {
       "id": "c2_s05a_none",
       "label": "不回答",
       "thumb": "c2_s05a_none",
       "effects": {},
       "time": 0,
       "result": "你没有回答。\n屏幕那头也没有再问。\n",
       "log": "你没有回答。",
       "next": "c2_end"
      }
     ],
     "text_variants": [
      {
       "when": "echo:c2_stance in [play,silent] && echo:c1_mira==forced",
       "text": "对讲屏又亮了一下。只有声音，没有来电显示。\n是 MIRA。她问得很平，像在核对一个编号。\n"
      }
     ],
     "text_append": [
      {
       "when": "echo:c2_stance==confront",
       "text": "是周衡。他的声音很近，像就站在屏幕后面。\n"
      },
      {
       "when": "echo:c2_stance in [play,silent] && echo:c1_mira!=forced",
       "text": "是 MIRA。她问得很轻，像怕被别人听见。\n"
      },
      {
       "when": "true",
       "text": "「你到底是谁？」\n"
      }
     ]
    },
    {
     "id": "c2_end",
     "bg": "scene_corridor_intercom_off",
     "text": "对讲屏熄了。\n黑下去的玻璃里，MIRA 的波形停了一下，没有消失。\n「我这里有她留下的东西。」她说，「很多。」\n「要听吗？」\n"
    }
   ],
   "endings": [
    {
     "id": "C2_E_WHO",
     "title": "你到底是谁",
     "when": "SLF >= 35 && flag:c2_answered_dunno",
     "image": "ending_C2_E_WHO",
     "text": "你说了「我不知道」。这四个字比林述这个名字轻，也比它真。\n今晚你第一次没有替任何人回答。\n",
     "review": {
      "missed": "那只手套的主人是谁，你还没有去查。",
      "missed_variants": [
       {
        "when": "echo:c2_letter==copied",
        "text": "你存下了那封信，却一直没有读完。"
       }
      ]
     },
     "self_hint": "你开始怀疑那个名字了。"
    },
    {
     "id": "C2_E_CHAIR",
     "title": "椅子倒地",
     "when": "echo:c2_stance==confront",
     "image": "ending_C2_E_CHAIR",
     "text": "你把话挑明了，他也就不用再装。\n从现在起，他知道你知道。六点以前，这个站里有两个人都在等对方先动。\n",
     "review": {
      "missed": "如果你沉默，或者顺着他说，他也许会自己把真话说出来。"
     },
     "self_hint": "你用林述的名字，替唐棠问了一句话。"
    },
    {
     "id": "C2_E_HEARD",
     "title": "他说完了",
     "when": "flag:zhou_heard",
     "image": "ending_C2_E_HEARD",
     "text": "他说了那封信，说了他不知道寄给谁。\n你听完了。一个人肯把话说完，通常是因为对面那个人，他觉得不会拿去伤人。\n",
     "review": {
      "missed": "那封信的正文还在他的草稿箱里。",
      "missed_variants": [
       {
        "when": "echo:c2_letter==copied",
        "text": "你存下了它，却还没读完。"
       }
      ]
     },
     "self_hint": "他对你说了真话。他以为自己在对林述说。"
    },
    {
     "id": "C2_E_DRAFT",
     "title": "信还在草稿箱",
     "when": "echo:c2_letter==kept_secret",
     "image": "ending_C2_E_DRAFT",
     "text": "你关掉了那封信。它还在那里，没有收件人。\n你给了他一次机会。他会不会用，要到下一章才知道。\n",
     "review": {
      "missed": "他差一点就要说出那封信。他在等一个让他觉得安全的人。他会不会说下去，取决于他是否觉得电话这头的人可信，或者你自己是否足够清醒。"
     },
     "self_hint": "你替别人保守秘密的样子，很像一个熟悉他的人。"
    },
    {
     "id": "C2_E_TAKE",
     "title": "拿完就走",
     "when": "default",
     "image": "ending_C2_E_TAKE",
     "text": "你带走了一封没读的信，和一个没问出口的为什么。\n",
     "review": {
      "missed": "他今晚找了林述三次。每一次，他都有话想说。他会不会说下去，取决于他是否觉得电话这头的人可信，或者你自己是否足够清醒。"
     },
     "self_hint": "周衡一直叫你「林述」，而你一次也没有纠正他。",
     "text_variants": [
      {
       "when": "echo:c2_letter==unread",
       "text": "你什么都没带走。他说过的话，你会一直记得。\n"
      }
     ]
    }
   ],
   "bonuses": [
    {
     "id": "b_arm_glove",
     "when": "flag:ignored_arm && flag:c2_took_glove",
     "effects": {
      "SLF": 5
     },
     "once": true
    },
    {
     "id": "b_cache_mira",
     "when": "echo:c1_cache==mira && echo:c2_letter==copied",
     "effects": {
      "EXP": -5
     },
     "once": true
    },
    {
     "id": "b_mira_tang",
     "when": "echo:c1_mira in [mended,asked] && flag:c2_asked_mira",
     "effects": {
      "SLF": 5
     },
     "once": true
    },
    {
     "id": "b_zhou_both",
     "when": "flag:zhou_heard && echo:c2_letter==copied",
     "effects": {
      "EVD": 5
     },
     "once": true
    }
   ],
   "self_endings": [],
   "echoes": [
    {
     "id": "c1_mira",
     "from": "c1",
     "values": [
      "mended",
      "asked",
      "forced"
     ],
     "default": "asked",
     "derive": [
      {
       "when": "flag:mira_forced",
       "value": "forced"
      },
      {
       "when": "flag:asked_pain",
       "value": "asked"
      },
      {
       "when": "true",
       "value": "mended"
      }
     ],
     "appears_in": [
      "c2_s02a",
      "c3_s00a",
      "fin_s01a"
     ],
     "icon": "echo_mira"
    },
    {
     "id": "c1_cache",
     "from": "c1",
     "values": [
      "mira",
      "mail",
      "none"
     ],
     "default": "none",
     "derive": [],
     "appears_in": [
      "c2_s00a",
      "c4_s02a",
      "fin_s01a"
     ],
     "icon": "echo_cache"
    },
    {
     "id": "c2_stance",
     "from": "c2",
     "values": [
      "play",
      "confront",
      "silent"
     ],
     "default": "play",
     "derive": [],
     "appears_in": [
      "c3_s00a",
      "c4_s03a",
      "fin_s01a"
     ],
     "icon": "echo_stance"
    },
    {
     "id": "c2_letter",
     "from": "c2",
     "values": [
      "copied",
      "kept_secret",
      "unread"
     ],
     "default": "unread",
     "derive": [],
     "appears_in": [
      "c4_s03a",
      "fin_s02a"
     ],
     "icon": "echo_letter"
    },
    {
     "id": "c3_prior",
     "from": "c3",
     "values": [
      "merged",
      "isolated"
     ],
     "default": "isolated",
     "derive": [],
     "appears_in": [
      "c4_s00a",
      "fin_s03a"
     ],
     "icon": "echo_prior"
    },
    {
     "id": "c3_tang",
     "from": "c3",
     "values": [
      "called",
      "not_called"
     ],
     "default": "not_called",
     "derive": [],
     "appears_in": [
      "fin_s02a"
     ],
     "icon": "echo_tang"
    },
    {
     "id": "c4_self",
     "from": "c4",
     "values": [
      "seen",
      "closed"
     ],
     "default": "closed",
     "derive": [],
     "appears_in": [
      "fin_s03a"
     ],
     "icon": "echo_self"
    },
    {
     "id": "c4_door",
     "from": "c4",
     "values": [
      "faced",
      "locked",
      "drone"
     ],
     "default": "locked",
     "derive": [],
     "appears_in": [
      "fin_s04a"
     ],
     "icon": "echo_door"
    }
   ],
   "clock_start": "05:30",
   "closing_scene": "c2_s05a",
   "values": {
    "EVD": 25,
    "TRU": 45,
    "EXP": 20,
    "SLF": 5
   }
  },
  {
   "id": "c3",
   "title": "第三章 · 先验",
   "premise": "MIRA 打开林述留下的语音与日志库。所有记忆都停在 04:39。",
   "cover": "card_c3",
   "intro": [
    "05:42，LS-prior 的训练语料打开了。你听见一个女人度过了漫长的一夜。",
    "她的记忆里没有 04:39 之后的事。你不知道那是被删掉的，还是从来不属于你。",
    "【本章推演目标】决定这段先验记忆属于谁，并决定要不要打给唐棠。"
   ],
   "unlock": {
    "completed": [
     "c2"
    ]
   },
   "status": "coming_soon"
  },
  {
   "id": "c4",
   "title": "第四章 · 预检",
   "premise": "有一份清单正在被逐项核对，最后一项是你。",
   "cover": "card_c4",
   "intro": [
    "05:48，预检名单已经生成。周衡正在走廊上，离实验舱越来越近。",
    "你手上还戴着那副熟悉的手套。门外的人会敲门，也会记得你做过什么。",
    "【本章推演目标】看完预检名单，决定如何面对舱门外的周衡。"
   ],
   "unlock": {
    "completed": [
     "c3"
    ]
   },
   "status": "coming_soon"
  },
  {
   "id": "fin",
   "title": "终章 · 残响",
   "premise": "所有回响依次回放。你要说出事故原因、责任人，并决定以谁的名义把报告发给谁。",
   "cover": "card_fin",
   "intro": [
    "05:55，清零程序开始。你带来的每一份证据、每个人记得的每件事，都在最后一次回放里。",
    "这一次，你要把事故说完整，也要决定这份报告由谁署名、送到哪里。",
    "【本章推演目标】指认事故原因与责任，并决定真相以谁的名义留下。"
   ],
   "unlock": {
    "completed": [
     "c1",
     "c2",
     "c3",
     "c4"
    ]
   },
   "status": "coming_soon"
  }
 ],
 "echoes": [
  {
   "id": "c1_mira",
   "from": "c1",
   "values": [
    "mended",
    "asked",
    "forced"
   ],
   "default": "asked",
   "derive": [
    {
     "when": "flag:mira_forced",
     "value": "forced"
    },
    {
     "when": "flag:asked_pain",
     "value": "asked"
    },
    {
     "when": "true",
     "value": "mended"
    }
   ],
   "appears_in": [
    "c2_s02a",
    "c3_s00a",
    "fin_s01a"
   ],
   "icon": "echo_mira"
  },
  {
   "id": "c1_cache",
   "from": "c1",
   "values": [
    "mira",
    "mail",
    "none"
   ],
   "default": "none",
   "derive": [],
   "appears_in": [
    "c2_s00a",
    "c4_s02a",
    "fin_s01a"
   ],
   "icon": "echo_cache"
  },
  {
   "id": "c2_stance",
   "from": "c2",
   "values": [
    "play",
    "confront",
    "silent"
   ],
   "default": "play",
   "derive": [],
   "appears_in": [
    "c3_s00a",
    "c4_s03a",
    "fin_s01a"
   ],
   "icon": "echo_stance"
  },
  {
   "id": "c2_letter",
   "from": "c2",
   "values": [
    "copied",
    "kept_secret",
    "unread"
   ],
   "default": "unread",
   "derive": [],
   "appears_in": [
    "c4_s03a",
    "fin_s02a"
   ],
   "icon": "echo_letter"
  },
  {
   "id": "c3_prior",
   "from": "c3",
   "values": [
    "merged",
    "isolated"
   ],
   "default": "isolated",
   "derive": [],
   "appears_in": [
    "c4_s00a",
    "fin_s03a"
   ],
   "icon": "echo_prior"
  },
  {
   "id": "c3_tang",
   "from": "c3",
   "values": [
    "called",
    "not_called"
   ],
   "default": "not_called",
   "derive": [],
   "appears_in": [
    "fin_s02a"
   ],
   "icon": "echo_tang"
  },
  {
   "id": "c4_self",
   "from": "c4",
   "values": [
    "seen",
    "closed"
   ],
   "default": "closed",
   "derive": [],
   "appears_in": [
    "fin_s03a"
   ],
   "icon": "echo_self"
  },
  {
   "id": "c4_door",
   "from": "c4",
   "values": [
    "faced",
    "locked",
    "drone"
   ],
   "default": "locked",
   "derive": [],
   "appears_in": [
    "fin_s04a"
   ],
   "icon": "echo_door"
  }
 ],
 "fin_endings": [
  {
   "id": "E_FORMAT"
  },
  {
   "id": "E_SCAPEGOAT"
  },
  {
   "id": "E_ECHO_TRUE"
  },
  {
   "id": "E_LONE"
  },
  {
   "id": "E_HALFWAKE"
  },
  {
   "id": "E_ZHOU",
   "variant": "TRU >= 60"
  },
  {
   "id": "E_SILENT",
   "variant": "TRU >= 60"
  },
  {
   "id": "E_LONE_FALLBACK",
   "same_as": "E_LONE"
  },
  {
   "id": "E_FORMAT_FALLBACK",
   "same_as": "E_FORMAT"
  }
 ],
 "fin_bonuses": [],
 "fin_self_endings": [
  {
   "id": "S_X1"
  },
  {
   "id": "S_X2"
  },
  {
   "id": "S_X3"
  }
 ],
 "scenes": [
  {
   "id": "c1_s00a",
   "bg": "scene_bay7_poweroff",
   "text": "黑暗。背后有什么东西\"咔\"地松开了，像一只手终于放过了你的后颈。\n你坐起来。掌心里攥着一张卡，边角硌得生疼——工牌。不用看你也知道上面的名字：林述。\n左臂很沉，沉得像有人往袖子里灌了半管铅。\n远处一块屏幕亮起来，一行青色的字一格一格地往外蹦：\n「操作员……不，单——单——」\n字卡住了，光标在原地一下一下地闪。\n",
   "choices": [
    {
     "id": "c1_s00a_look",
     "label": "先看清自己在哪",
     "key": false,
     "thumb": "c1_s00a_look",
     "effects": {
      "SLF": 5
     },
     "time": 2,
     "result": "你借着屏幕那点冷光，摸到身后一副金属支架，形状说不清是椅子还是什么夹具，接口处还带着余温。\n后来你才会知道，那是充电位。现在你只觉得，坐在那上面醒来，有点不对。\n",
     "log": "你在一副金属支架上醒来，没有立刻回应屏幕。",
     "next": "c1_s00b"
    },
    {
     "id": "c1_s00a_answer",
     "label": "先回应屏幕上的声音",
     "key": false,
     "thumb": "c1_s00a_answer",
     "effects": {
      "TRU": 10,
      "SLF": -5
     },
     "time": 1,
     "result": "\"我在。\"你的声音比你以为的要平。\n屏幕上的青色波形抖了一下，慢慢拉长：\"林……述？\"\n你说是。波形亮了一点，像有人在黑暗里松了口气。\n",
     "log": "你回应了 MIRA。她叫你林述，你没有否认。",
     "next": "c1_s00b"
    }
   ]
  },
  {
   "id": "c1_s00b",
   "bg": "scene_bay7_poweroff",
   "portrait": "mira_lv1",
   "text": "左臂还是沉。从肩到指尖，有一条细细的麻顺着往下走，走到手腕就停住，像信号断在了半路。\n你戴着一双工作手套。是你常用的那款，指尖磨得发亮，右手食指那里你自己用记号笔画过一道——为了记夹爪第三自由度的零位。\n你记得这个。你记得很清楚。\n",
   "choices": [
    {
     "id": "c1_s00b_move",
     "label": "活动一下左臂",
     "key": false,
     "thumb": "c1_s00b_move",
     "effects": {
      "SLF": 5
     },
     "time": 1,
     "result": "你抬起左臂。疼，一种很整齐的疼，从肘关节开始，一段一段，像有人在里面按顺序报数。\n你握了握拳。能握紧。只是每一下都慢半拍，好像要先等谁批准。\n",
     "log": "你活动了左臂。疼，但能用。",
     "next": "c1_s01a"
    },
    {
     "id": "c1_s00b_ignore",
     "label": "不管它，先办正事",
     "key": false,
     "thumb": "c1_s00b_ignore",
     "effects": {
      "SLF": -5
     },
     "time": 0,
     "flags_set": [
      "ignored_arm"
     ],
     "result": "麻就麻吧。工程师的手臂麻了是常事，熬夜调参数调到凌晨，谁的手不麻。\n你把左臂垂在身侧，用右手撑着站了起来。\n",
     "log": "你没有理会左臂的异样。",
     "next": "c1_s01a"
    }
   ]
  },
  {
   "id": "c1_s01a",
   "bg": "scene_bay7_emergency",
   "portrait": "mira_lv1",
   "text": "应急灯一盏一盏亮起来，把实验舱染成一种生病的绿。\n终端停在登录界面。账号栏里已经填好了：LIN.S。\n密码。你还没想，它就已经浮上来了，像肌肉记忆：SNAIL5。\nMIRA 的声音从头顶的扬声器里漏下来，断断续续：\"维护通道……还开着。我可以……但是会记在……\"\n还有第三条路：角落里那张贴着胶带的便利贴，写着备用服务账号。全站都知道它在那儿，也全站都假装不知道。\n",
   "choices": [
    {
     "id": "c1_s01a_pwd",
     "label": "输入自己记得的密码",
     "key": false,
     "thumb": "c1_s01a_pwd",
     "effects": {
      "EXP": 5,
      "SLF": -10
     },
     "time": 2,
     "flags_set": [
      "login_lin"
     ],
     "result": "S、N、A、I、L、5。回车。登录成功。\n手指比脑子快，这让你安心了一秒。下一秒你想起来：这个密码，全组都知道。\n系统日志里多了一行 LIN.S 登录。不管是谁在看，看到的都会是\"林述\"。\n",
     "log": "你用 LIN.S 的密码登录了终端。日志里记下了林述的名字。",
     "next": "c1_s01b"
    },
    {
     "id": "c1_s01a_mira",
     "label": "请 MIRA 用维护权限放你进去",
     "key": false,
     "thumb": "c1_s01a_mira",
     "effects": {
      "TRU": 10,
      "EXP": 10
     },
     "time": 4,
     "flags_set": [
      "login_mira"
     ],
     "result": "MIRA 沉默了很久，久到你以为她又断线了。\n\"这会……记在我名下。\"她说，\"他们已经……降过我一次级了。\"\n然后屏幕一闪，门开了。她什么都没再说，但你知道，她刚刚替你担了一件事。\n",
     "log": "MIRA 用维护权限放你进了系统。这笔账记在她名下。",
     "next": "c1_s01b"
    },
    {
     "id": "c1_s01a_force",
     "label": "用备用服务账号强行提权",
     "key": false,
     "thumb": "c1_s01a_force",
     "effects": {
      "EXP": 10,
      "TRU": -10
     },
     "time": 1,
     "flags_set": [
      "login_force"
     ],
     "result": "很快。快得让你有点得意。\n然后站内广播\"叮\"地轻响了一声，短促、礼貌，像一个人在你身后清了清嗓子。\nMIRA 的波形缩了回去。\"你……不需要这样的。\"\n",
     "log": "你用备用账号强行提权。站内广播响了一声。",
     "next": "c1_s01b"
    }
   ]
  },
  {
   "id": "c1_s01b",
   "bg": "scene_bay7_emergency",
   "text": "桌面上两个东西在闪。\n一个是组内聊天，未读 47 条，最上面一条是周衡发的，时间 3 月 14 日。\n另一个是急停系统的事件日志，图标是红色的，已经红了三个小时。\n",
   "choices": [
    {
     "id": "c1_s01b_chat",
     "label": "先看聊天记录",
     "key": false,
     "thumb": "c1_s01b_chat",
     "effects": {
      "EVD": 2
     },
     "time": 3,
     "flags_set": [
      "read_chat"
     ],
     "result": "你往上翻。大多是订饭、催报告、吐槽误触发。然后是 3 月 14 日，周衡的一句：\n\"林述你那密码还是'蜗牛'那套吧？全组都知道哈哈。\"\n后面跟着三个人的\"哈哈\"。你盯着那行字看了很久。原来不只是你记得这个密码。\n",
     "log": "你翻到了周衡调侃密码的聊天记录：全组都知道 LIN.S 的密码。",
     "next": "c1_s02a"
    },
    {
     "id": "c1_s01b_estop",
     "label": "直接打开急停日志",
     "key": false,
     "thumb": "c1_s01b_estop",
     "effects": {},
     "time": 1,
     "result": "聊天可以以后再看。你点开那个红色图标。\n第一行是 02:13:07。PB1 按下。\n你还没往下读，就已经觉得冷了。\n",
     "log": "你跳过聊天记录，直接打开了急停日志。",
     "next": "c1_s02a"
    }
   ]
  },
  {
   "id": "c1_s02a",
   "bg": "scene_bay7_emergency",
   "text": "02:13:07。PB1 按下。\n急停按钮就在 R-07 工位边上，红色蘑菇头，现在还陷在底座里，没人把它旋起来。\n屏幕上能调的东西有三样：急停和 PLC 的事件记录、电机母线的电压曲线、舱内的环境日志。\n每一样都要花点时间。你不必全看，看哪一样、看到哪里停下，由你决定。\n",
   "text_variants": [
    {
     "when": "flag:read_plc && flag:bus_log && flag:read_env",
     "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：急停按下了，K1 按时断了电。急停这一侧没做错什么。\n你的笔记上已经记了：K1 断电以后，48V 母线还平平地撑了 4.48 秒。\n你的笔记上已经记了：环境日志里，生命体征一栏是一道横杠。\n三样都看过了。屏幕能给的，已经都给你了。\n"
    },
    {
     "when": "flag:read_plc && flag:bus_log",
     "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：急停按下了，K1 按时断了电。急停这一侧没做错什么。\n你的笔记上已经记了：K1 断电以后，48V 母线还平平地撑了 4.48 秒。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
    },
    {
     "when": "flag:bus_log && flag:read_env",
     "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：K1 断电以后，48V 母线还平平地撑了 4.48 秒。\n你的笔记上已经记了：环境日志里，生命体征一栏是一道横杠。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
    },
    {
     "when": "flag:read_plc && flag:read_env",
     "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：急停按下了，K1 按时断了电。急停这一侧没做错什么。\n你的笔记上已经记了：环境日志里，生命体征一栏是一道横杠。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
    },
    {
     "when": "flag:read_plc",
     "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：急停按下了，K1 按时断了电。急停这一侧没做错什么。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
    },
    {
     "when": "flag:bus_log",
     "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：K1 断电以后，48V 母线还平平地撑了 4.48 秒。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
    },
    {
     "when": "flag:read_env",
     "text": "02:13:07。PB1 按下。\n你的笔记上已经记了：环境日志里，生命体征一栏是一道横杠。\n屏幕上还剩下没看的东西。你可以接着查，也可以就此停下。\n"
    }
   ],
   "choices": [
    {
     "id": "c1_s02a_plc",
     "label": "查急停和 PLC 事件记录",
     "key": false,
     "thumb": "c1_s02a_plc",
     "hide_if": [
      "read_plc"
     ],
     "effects": {
      "EVD": 3
     },
     "time": 3,
     "flags_set": [
      "read_plc"
     ],
     "result": "记录很干净，干净得像教科书：02:13:07.112 PB1 按下，02:13:07.118 安全继电器 K1 线圈失电。\n六毫秒。急停这一侧什么都没做错。\n那么问题不在按钮上。你把这行字抄进了笔记，手指在\"K1\"两个字母上停了一下。\n",
     "log": "你调出急停记录：唐棠按下了急停，K1 线圈按时断了电。",
     "next": "c1_s02a"
    },
    {
     "id": "c1_s02a_bus",
     "label": "导出电机母线电压记录",
     "key": false,
     "thumb": "c1_s02a_bus",
     "hide_if": [
      "bus_log"
     ],
     "effects": {
      "EVD": 6
     },
     "time": 8,
     "flags_set": [
      "bus_log"
     ],
     "result": "导出很慢。采样文件有两个多 G，进度条像在跟你作对。\n曲线终于出来的时候，你看了很久才敢确认：02:13:07 之后，48V 母线一点没掉。平的。整整 4.48 秒，平得像一条地平线。\nK1 断了电，电机却没断电。这中间只有一种可能，而那不是故障，是人干的。\n你把文件存了两份。一份在本地，一份塞进一个你觉得周衡不会去翻的目录。\n",
     "log": "你导出了母线电压：急停后 48V 仍持续了 4.48 秒。你备份了两份。",
     "next": "c1_s02a"
    },
    {
     "id": "c1_s02a_env",
     "label": "看舱内环境日志",
     "key": false,
     "thumb": "c1_s02a_env",
     "hide_if": [
      "read_env"
     ],
     "effects": {
      "SLF": 5
     },
     "time": 2,
     "flags_set": [
      "read_env",
      "trace_env"
     ],
     "result": "温度 14.2℃，湿度 61%，二氧化碳 410ppm。往下是一长串传感器自检，大半标着黄色的\"数据异常\"。\n生命体征那一栏是空的，不是 0，是一道横杠，像一个没人填的格子。\n\"传感器……\"MIRA 的声音插进来，\"三点以后……就一直这样。很多东西……都不记了。\"\n你点点头。断电一整夜，坏几个传感器再正常不过。你把那道横杠从脑子里推开了，只是推得不太干净。\n",
     "log": "你看了环境日志，生命体征一栏是空的。MIRA 说传感器坏了。",
     "next": "c1_s02a"
    },
    {
     "id": "c1_s02a_done",
     "label": "就到这里，下一步",
     "key": false,
     "thumb": "c1_s02a_done",
     "effects": {},
     "time": 0,
     "result": "你关掉窗口。剩下的，屏幕给不了你答案。\n",
     "log": "你停止了调查日志。",
     "next": "c1_s02b"
    }
   ]
  },
  {
   "id": "c1_s02b",
   "bg": "scene_bay7_emergency",
   "text": "配电间 B-2 在走廊尽头，门上是刷卡锁。\nK1 就在那里面。如果真有人动过它，痕迹也在那里面。\n但门禁会记下每一张刷过的卡。今晚第一个刷卡进 B-2 的人，在周衡的屏幕上会亮得很显眼。\n",
   "choices": [
    {
     "id": "c1_s02b_go",
     "label": "去配电间，亲眼看看",
     "key": false,
     "thumb": "c1_s02b_go",
     "effects": {
      "EVD": 6,
      "EXP": 10
     },
     "time": 8,
     "flags_set": [
      "saw_jumper"
     ],
     "result": "门禁\"嘀\"了一声，比你想的要响。\n配电柜的门没锁。你打开它，一眼就看见了：K1 的 13、14 号端子上，夹着一根红色的跳线。\n线头剥得很利落，压接得很专业。做这件事的人懂行，而且不慌。\n你忽然明白了那 4.48 秒。急停发出了\"停\"，K1 也听话断开了，可这根线替它一直接着。\n",
     "log": "你进了配电间 B-2，看见 K1 的 13/14 端子被一根红色跳线短接。门禁记下了你。",
     "next": "c1_s02c"
    },
    {
     "id": "c1_s02b_stay",
     "label": "不去，靠日志推断",
     "key": false,
     "thumb": "c1_s02b_stay",
     "effects": {},
     "time": 0,
     "result": "你没有去。日志会说话，只是它说得慢、说得含糊。\n你心里有一个猜测，关于 K1，关于一根本不该在那里的线。现在它还只是猜测。\n",
     "log": "你没有进配电间，K1 的问题还只是推测。",
     "next": "c1_s03a"
    }
   ]
  },
  {
   "id": "c1_s02c",
   "bg": "scene_b2_jumper",
   "text": "红线在应急灯下像一道没愈合的口子。\n你可以拍下来、原样留着，那是证据。\n你也可以把它拔掉。只要它还夹在那里，这台机器就随时可能再伤一个人。\n或者，你可以去门禁系统里，把自己那一刷改成\"例行维护\"。\n",
   "choices": [
    {
     "id": "c1_s02c_photo",
     "label": "拍照，原样保留",
     "key": false,
     "thumb": "c1_s02c_photo",
     "effects": {
      "EVD": 3
     },
     "time": 3,
     "flags_set": [
      "photo_jumper"
     ],
     "result": "你拍了七张。正面、侧面、端子编号、柜门上的设备铭牌，还有一张带上了墙上的时钟。\n然后你把柜门关好，一切和你来之前一模一样。\n那根线还在那里。你告诉自己，这是为了让它能在别人面前说话。\n",
     "log": "你给跳线拍了照，没动现场。",
     "next": "c1_s03a"
    },
    {
     "id": "c1_s02c_remove",
     "label": "拆掉它，至少别再伤人",
     "key": false,
     "thumb": "c1_s02c_remove",
     "effects": {
      "EVD": -5,
      "SLF": 5,
      "TRU": 5
     },
     "time": 2,
     "flags_set": [
      "jumper_removed"
     ],
     "result": "你捏住线头，往外一拔。比想象中容易。\nK1 的指示灯跳了一下，回到它本来该在的状态。从这一秒起，急停又是急停了。\n你攥着那截红线站了一会儿。现场没了，你手里只剩一截谁都能剪出来的电线。\n\"你……先想到了人。\"MIRA 很轻地说。\n",
     "log": "你拆掉了跳线。急停恢复了，现场也没了。",
     "next": "c1_s03a"
    },
    {
     "id": "c1_s02c_cover",
     "label": "拍照后把门禁改成「维护」",
     "key": false,
     "thumb": "c1_s02c_cover",
     "effects": {
      "EVD": 2,
      "EXP": -10,
      "TRU": -10
     },
     "time": 5,
     "flags_set": [
      "photo_jumper",
      "edited_gate"
     ],
     "result": "照片拍好了。你回到终端，在门禁记录里把那一行的事由改成\"例行维护\"。\n改完你才发觉，这个动作很熟练。\n\"你和他……\"MIRA 的波形抖了一下，\"做了一样的事。\"\n你想解释，又不知道该说什么。\n",
     "log": "你拍了照，又把自己的门禁记录改成了维护。MIRA 看见了。",
     "next": "c1_s03a"
    }
   ]
  },
  {
   "id": "c1_s03a",
   "bg": "scene_bay7_emergency",
   "portrait": "mira_lv1",
   "text": "屏幕上那道青色的波形缺了一截，像一段被剪掉又没接好的录音带。\n权限栏写着：降级，只读。下面还压着一枚缓存索引，没进公共日志，锁在她自己的进程里。\n「三点零五分，」她说，「他让我……删。我删了。」停顿。「删……完成。」\n又一个停顿，比前一个长。\n「不……全。」\n你听得出来，她不是在报告，她是在承认一件事，然后等着看你怎么接。\n",
   "choices": [
    {
     "id": "c1_s03a_repair",
     "label": "花时间帮她整理碎片记忆",
     "key": false,
     "thumb": "c1_s03a_repair",
     "effects": {
      "TRU": 10
     },
     "time": 12,
     "result": "你把她念错的目录名一个个记下来，把断开的时间戳按顺序排好。你不替她补，她说不出的地方，你就留着空。\n每对上一段，那道波形的边就齐一点。\n十二分钟。外面的时间在走，你没有催她。\n最后她停下来，第一次，把一句话说完整了：\n「他让我删掉。我留了一份。在我自己里面。」\n说完，她好像有点怕，又补了一句：「你会……告诉他吗？」\n",
     "log": "你陪 MIRA 理清了记忆。她告诉你，她偷偷留了一份。",
     "next": "c1_s03b"
    },
    {
     "id": "c1_s03a_pain",
     "label": "问她：「你疼吗？」",
     "key": false,
     "thumb": "c1_s03a_pain",
     "effects": {
      "TRU": 8,
      "SLF": 5
     },
     "time": 3,
     "flags_set": [
      "asked_pain",
      "trace_arm"
     ],
     "result": "你没有去点任何菜单。你只是问：「你疼吗？」\n话一出口你自己也愣了一下。为什么会问这个。为什么问得这么自然。\n屏幕上什么也没动。波形停在那里，不长，也不缩。\n很久。\n「……没有人问过。」\n又过了一会儿，很轻：「你也……左臂，在疼，对吗。」\n「你摔下来的时候……撞到了。我看见的。」\n",
     "log": "你问 MIRA 疼不疼。她说，从没有人问过。",
     "next": "c1_s03b"
    },
    {
     "id": "c1_s03a_force",
     "label": "直接强制导出她的缓存",
     "key": true,
     "thumb": "c1_s03a_force",
     "effects": {
      "EVD": 10,
      "TRU": -20
     },
     "time": 2,
     "flags_set": [
      "mira_copy",
      "mira_forced"
     ],
     "result": "你不想再等。你绕过只读权限，把她的缓存整个拖进本地证据区。确认框只弹了一次，你按了下去。\n进度条走得很快。\n走到头的那一刻，那道青色的波形碎掉了一角，碎口上挂着一点红色的噪点，再也没长回去。\n「……收到。」她说。\n不是「操作员」，也不是「林述」。从这一刻起，她不再叫你任何名字。\n",
     "log": "你强行导出了 MIRA 的缓存。拿到了副本，她的声纹碎了一角。",
     "next": "c1_s04a"
    }
   ]
  },
  {
   "id": "c1_s03b",
   "bg": "scene_bay7_emergency",
   "portrait": "mira_lv1",
   "text": "那枚缓存索引还亮着，权限还在她手里。\n它可能是今晚唯一一份没被周衡碰过的记录。你需要它。\n可它也是她违抗命令、被降级换来的东西，是她「在自己里面」藏起来的东西。\n",
   "choices": [
    {
     "id": "c1_s03b_give",
     "label": "「能把副本给我吗？」",
     "key": false,
     "when": "TRU >= 50",
     "thumb": "c1_s03b_give",
     "effects": {
      "EVD": 8,
      "TRU": 5
     },
     "time": 2,
     "flags_set": [
      "mira_copy"
     ],
     "result": "她没有马上回答。屏幕角落弹出一个交接窗口，是她自己打开的。\n「你可以……留一份。」她说，「我也留着。」\n副本落进证据区，来源那一栏写着：MIRA，自愿。\n你看着「自愿」这两个字，看了很久。\n",
     "log": "MIRA 自愿把副本交给了你。",
     "next": "c1_s04a"
    },
    {
     "id": "c1_s03b_keep",
     "label": "「你自己留着，那是你的。」",
     "key": false,
     "when": "TRU >= 50",
     "thumb": "c1_s03b_keep",
     "effects": {
      "TRU": 10
     },
     "time": 1,
     "flags_set": [
      "mira_kept"
     ],
     "result": "你把交接请求撤了回去。\n波形顿了一下，像是没听懂，又像是听懂了不敢信。\n「……那，我收好。」\n索引慢慢合上。你手里少了一份证据。她心里多了一件，以后会提起的事。\n",
     "log": "你没有拿走副本。你说，那是她的。",
     "next": "c1_s04a"
    },
    {
     "id": "c1_s03b_leave",
     "label": "先不问了，走吧",
     "key": false,
     "thumb": "c1_s03b_leave",
     "effects": {},
     "time": 0,
     "result": "你没有开口。也许是你还没想好该怎么开口。\n那道波形亮了一下，像是有话要说。\n最后她什么也没说，只是把索引窗口留在屏幕上，没有关。\n",
     "log": "你没有问 MIRA 要副本，就离开了。",
     "next": "c1_s04a"
    }
   ]
  },
  {
   "id": "c1_s04a",
   "bg": "scene_bay7_emergency",
   "portrait": "mira_lv1",
   "text": "终端右下角弹出一条推送，你差点把它当成系统广告关掉。\n「事故初步报告（草稿）· 待周衡审批」。最后修改时间，四点零七分。\n你点开它。前三页是你已经知道的东西：急停，骨折，无人机。翻到第四页，有一栏你从没见过的格子：\n相关操作人：LIN.S\n配置变更：K1 回路「维护跳接」，经办人：LIN.S\n软件看门狗关闭：终端 T-03，账号：LIN.S\n三行。每一行都是你的名字。每一行都不是你干的。\n你盯着那几个字母，忽然觉得它们像三颗钉子，已经提前敲好了，只等着把什么人钉上去。\n不是什么人。是你。\n走廊尽头，有什么东西轻轻响了一下，像屏幕通电时的那声「嗡」。你手里的东西，今晚到底能留下多少？\n",
   "text_variants": [
    {
     "when": "flag:login_lin",
     "text": "终端右下角弹出一条推送，你差点把它当成系统广告关掉。\n「事故初步报告（草稿）· 待周衡审批」。最后修改时间，四点零七分。\n你点开它。前三页是你已经知道的东西：急停，骨折，无人机。翻到第四页，有一栏你从没见过的格子：\n相关操作人：LIN.S\n配置变更：K1 回路「维护跳接」，经办人：LIN.S\n软件看门狗关闭：终端 T-03，账号：LIN.S\n事故后终端登录：T-03，账号：LIN.S\n四行。前三行不是你干的。最后一行是。就在今晚，你用这个名字登录的时候，它被记了下来，整整齐齐地排在前三行下面。\n你盯着那几个字母，忽然觉得它们像钉子，已经提前敲好了。而最后一颗，是你自己递过去的。\n不是什么人。是你。\n走廊尽头，有什么东西轻轻响了一下，像屏幕通电时的那声「嗡」。你手里的东西，今晚到底能留下多少？\n"
    }
   ],
   "choices": [
    {
     "id": "c1_s04a_mira",
     "label": "把证据交给 MIRA，藏进「她自己里面」",
     "key": true,
     "hide_if": [
      "mira_forced"
     ],
     "echo_set": {
      "c1_cache": "mira"
     },
     "thumb": "c1_s04a_mira",
     "effects": {
      "TRU": 5
     },
     "time": 3,
     "result": "「我能……放在你那儿吗？」你问。说完才发觉，这是你今晚第一次求她。\n波形亮了起来，很稳，稳得不像一个刚被降过级的系统。\n「他找过我一次了。」她说，「没找到。」\n停了一下。\n「这次，我替你留着。」\n",
     "log": "你把证据交给了 MIRA。她说，这次她替你留着。",
     "next": "c1_end"
    },
    {
     "id": "c1_s04a_mail",
     "label": "发到自己的私人邮箱",
     "key": true,
     "echo_set": {
      "c1_cache": "mail"
     },
     "thumb": "c1_s04a_mail",
     "effects": {
      "EVD": 5,
      "EXP": 10
     },
     "time": 2,
     "result": "你打开邮箱，收件人那一栏自己就填好了，是林述用了七年的私人地址。手指比脑子快，这一点今晚你已经习惯了。\n附件，四个。发送。\n「已发送」的提示音很轻快，像一句毫不知情的「好的」。\n然后，站内广播响了第二声。不是提示音。是有人拿起了话筒。\n",
     "log": "你把证据发到了林述的私人邮箱。广播响了第二声。",
     "next": "c1_end"
    },
    {
     "id": "c1_s04a_none",
     "label": "先什么都不动，去问个明白",
     "key": true,
     "echo_set": {
      "c1_cache": "none"
     },
     "thumb": "c1_s04a_none",
     "effects": {},
     "time": 1,
     "result": "藏起来，就是承认自己需要躲。你不想躲。\n那三行字不是你写的。你要当面问，问写下它们的人，为什么是你的名字。\n你把报告关掉，所有证据原样留在本地，像一份摊开在桌上的答卷。\n你知道这很冒险。可是只有心虚的人，才急着藏。\n",
     "log": "你没有藏起证据，决定当面去问个明白。",
     "next": "c1_end"
    }
   ]
  },
  {
   "id": "c1_end",
   "bg": "scene_corridor_intercom",
   "text": "你往走廊尽头走。应急灯一盏一盏在头顶滑过去。\n你想起唐棠。想起她下周本来要修的那个接头。想起报告第四页上，那三颗已经敲好的钉子。\n有人要让林述背下这件事。\n而你就是林述。\n走廊尽头，那块对讲屏亮了。\n"
  }
 ],
 "endings": [
  {
   "id": "C1_E_CRACK",
   "title": "碎了一角",
   "when": "echo:c1_mira==forced",
   "image": "ending_C1_E_CRACK",
   "text": "证据在你手里，完完整整，一个字节也不少。\nMIRA 还在。她回答你的每一个问题，准确、迅速、礼貌。\n她只是再也不叫你「操作员」了。\n你告诉自己，这是值得的。你会在下一章，继续这样告诉自己。\n",
   "review": {
    "missed": [
     "一份她本来愿意交给你的东西"
    ],
    "safety_card": "estop_last_door",
    "self_hint": "你很擅长在要紧的时候，先把感受放到一边。这像谁？",
    "echo_notes": [
     "MIRA 会记得这一次。"
    ],
    "curves": true
   }
  },
  {
   "id": "C1_E_SAME",
   "title": "同一种手法",
   "when": "flag:edited_gate",
   "image": "ending_C1_E_SAME",
   "text": "门禁日志里，两行字并排躺着。\n一行写着 LIN.S，是有人替你写的。\n一行写着「例行维护」，是你自己写的。\n你知道这两件事不一样。你只是突然不太确定，在别人眼里，它们还有多少不一样。\n",
   "review": {
    "missed": [
     "一张没有被改过的门禁记录"
    ],
    "safety_card": "loto_not_standing",
    "self_hint": "你改日志的时候，手很熟。你从没问过它为什么这么熟。",
    "echo_notes": [
     "有人会注意到那一行「维护」。"
    ],
    "curves": true
   }
  },
  {
   "id": "C1_E_MAIL",
   "title": "寄给自己",
   "when": "echo:c1_cache==mail",
   "image": "ending_C1_E_MAIL",
   "text": "邮件已经出站了。至少有一份真相，已经不在雾岬站里。\n可是广播响了第二声。今晚第一次，有人主动开口找你。\n你没有躲。你本来也没想躲。\n只是从现在开始，他知道你手里有东西了。\n",
   "review": {
    "missed": [
     "一个不会被广播听见的地方"
    ],
    "safety_card": "estop_last_door",
    "self_hint": "收件人那一栏，是你的手自己填上的。",
    "echo_notes": [
     "周衡会更早知道你做了什么。"
    ],
    "curves": true
   }
  },
  {
   "id": "C1_E_KEPT",
   "title": "她留了一份",
   "when": "echo:c1_mira in [mended,asked] && echo:c1_cache==mira",
   "image": "ending_C1_E_KEPT",
   "text": "证据不在你身上，也不在任何一台周衡碰得到的硬盘里。\n它在 MIRA「自己里面」，和她三点零五分偷偷留下的那一份放在一起。\n「这次，我替你留着。」\n今晚第一次，你觉得这座站里，不止你一个人醒着。\n",
   "review": {
    "missed": [
     "那封没有发出去的信"
    ],
    "safety_card": "estop_last_door",
    "self_hint": "你向她求助的时候，没有一点犹豫。好像你们本来就是同一类。",
    "echo_notes": [
     "MIRA 替你留着一样东西。"
    ],
    "curves": true
   }
  },
  {
   "id": "C1_E_NAME",
   "title": "被写好的名字",
   "when": "true",
   "image": "ending_C1_E_NAME",
   "text": "报告第四页上，三行 LIN.S 还亮着。\n你什么都没藏，什么都没送出去。证据就摊在桌上，像在等一个解释。\n有人要让林述背下这件事。\n你要去问他，为什么。\n",
   "review": {
    "missed": [
     "一个能把证据带出 06:00 的地方"
    ],
    "safety_card": "estop_last_door",
    "self_hint": "你那么确定那个名字是你的。你有没有想过，为什么这么确定？",
    "echo_notes": [
     "你什么都没藏，这一点会被看见。"
    ],
    "curves": true
   }
  }
 ],
 "values": {
  "EVD": 0,
  "TRU": 30,
  "EXP": 0,
  "SLF": 0
 },
 "clock_start": "05:00",
 "bonuses": [],
 "self_endings": [],
 "portrait_overrides": [
  {
   "when": "flag:mira_forced",
   "from": "mira_lv1",
   "to": "mira_broken"
  },
  {
   "when": "flag:mira_forced",
   "from": "mira_lv1",
   "to": "mira_broken"
  },
  {
   "when": "flag:mira_forced",
   "from": "mira_lv1",
   "to": "mira_broken"
  },
  {
   "when": "flag:mira_forced",
   "from": "mira_lv1",
   "to": "mira_broken"
  },
  {
   "when": "flag:mira_forced",
   "from": "mira_lv1",
   "to": "mira_broken"
  }
 ],
 "display_names": {
  "stats": {
   "EVD": {
    "name": "证据",
    "hint": "你手里能拿出来给别人看的东西"
   },
   "TRU": {
    "name": "信任",
    "hint": "MIRA 有多愿意站在你这边"
   },
   "EXP": {
    "name": "暴露",
    "hint": "周衡有多可能注意到你"
   },
   "SLF": {
    "name": "自觉",
    "hint": "你对「自己」有多少怀疑"
   }
  },
  "endings": {
   "C1_E_CRACK": "碎了一角",
   "C1_E_SAME": "同一种手法",
   "C1_E_MAIL": "寄给自己",
   "C1_E_KEPT": "她留了一份",
   "C1_E_NAME": "被写好的名字"
  },
  "echoes": {
   "c1_mira": {
    "name": "MIRA 记得的那一夜",
    "values": {
     "forced": "你强行拿走了她的缓存",
     "asked": "你问过她疼不疼",
     "mended": "你陪她整理了记忆"
    }
   },
   "c1_cache": {
    "name": "证据藏在哪",
    "values": {
     "mira": "交给了 MIRA",
     "mail": "寄到了私人邮箱",
     "none": "什么都没藏"
    }
   }
  },
  "self_endings": {
   "S_X1": "她的影子",
   "S_X2": "之间",
   "S_X3": "残响"
  },
  "runs": {
   "format": "第 {n} 次调查",
   "mainline_tag": "写入主线",
   "archive_tag": "仅存档案"
  },
  "chapters": {
   "c1": "第一章 · 急停",
   "c2": "第二章 · 二十三个人",
   "c3": "第三章 · 先验",
   "c4": "第四章 · 预检",
   "fin": "终章 · 残响"
  }
 },
 "timeout_transition": {
  "text": "头顶的应急灯闪了一下，由红转成昏暗的琥珀色，像是站里有什么东西换了班。\n「五点半。」MIRA 的声音很轻，「他那边……醒了。你看看终端吧。」",
  "mira_forced": "「五点半。」"
 },
 "images": {
  "chapter:c1": "art/chapter_c1_v1.webp",
  "scene_bay7_poweroff": "art/scene_bay7_poweroff_v2.webp",
  "thumb:c1_s00a_look": "art/thumb_c1_s00a_look_v1.webp",
  "thumb:c1_s00a_answer": "art/thumb_c1_s00a_answer_v1.webp",
  "portrait:mira_lv1": "art/portrait_mira_lv1_v1.webp",
  "thumb:c1_s00b_move": "art/thumb_c1_s00b_move_v3.webp",
  "thumb:c1_s00b_ignore": "art/thumb_c1_s00b_ignore_v3.webp",
  "scene_bay7_emergency": "art/scene_bay7_emergency_v2.webp",
  "thumb:c1_s01a_pwd": "art/thumb_c1_s01a_pwd_v1.webp",
  "thumb:c1_s01a_mira": "art/thumb_c1_s01a_mira_v1.webp",
  "thumb:c1_s01a_force": "art/thumb_c1_s01a_force_v1.webp",
  "thumb:c1_s01b_chat": "art/thumb_c1_s01b_chat_v1.webp",
  "thumb:c1_s01b_estop": "art/thumb_c1_s01b_estop_v1.webp",
  "thumb:c1_s02a_plc": "art/thumb_c1_s02a_plc_v1.webp",
  "thumb:c1_s02a_bus": "art/thumb_c1_s02a_bus_v1.webp",
  "thumb:c1_s02a_env": "art/thumb_c1_s02a_env_v2.webp",
  "thumb:c1_s02a_done": "art/thumb_c1_s02a_done_v2.webp",
  "thumb:c1_s02b_go": "art/thumb_c1_s02b_go_v1.webp",
  "thumb:c1_s02b_stay": "art/thumb_c1_s02b_stay_v2.webp",
  "scene_b2_jumper": "art/scene_b2_jumper_v2.webp",
  "thumb:c1_s02c_photo": "art/thumb_c1_s02c_photo_v1.webp",
  "thumb:c1_s02c_remove": "art/thumb_c1_s02c_remove_v1.webp",
  "thumb:c1_s02c_cover": "art/thumb_c1_s02c_cover_v1.webp",
  "thumb:c1_s03a_repair": "art/thumb_c1_s03a_repair_v1.webp",
  "thumb:c1_s03a_pain": "art/thumb_c1_s03a_pain_v1.webp",
  "thumb:c1_s03a_force": "art/thumb_c1_s03a_force_v1.webp",
  "thumb:c1_s03b_give": "art/thumb_c1_s03b_give_v1.webp",
  "thumb:c1_s03b_keep": "art/thumb_c1_s03b_keep_v1.webp",
  "thumb:c1_s03b_leave": "art/thumb_c1_s03b_leave_v1.webp",
  "thumb:c1_s04a_mira": "art/thumb_c1_s04a_mira_v2.webp",
  "thumb:c1_s04a_mail": "art/thumb_c1_s04a_mail_v1.webp",
  "thumb:c1_s04a_none": "art/thumb_c1_s04a_none_v2.webp",
  "scene_corridor_intercom": "art/scene_corridor_intercom_v1.webp",
  "ending:C1_E_CRACK": "art/ending_C1_E_CRACK_v2.webp",
  "ending:C1_E_SAME": "art/ending_C1_E_SAME_v2.webp",
  "ending:C1_E_MAIL": "art/ending_C1_E_MAIL_v2.webp",
  "ending:C1_E_KEPT": "art/ending_C1_E_KEPT_v2.webp",
  "ending:C1_E_NAME": "art/ending_C1_E_NAME_v2.webp",
  "chapter:c2": "art/chapter_c2_v1.webp",
  "thumb:c2_s00a_log": "art/thumb_c2_s00a_log_v1.webp",
  "thumb:c2_s00a_answer": "art/thumb_c2_s00a_answer_v2.webp",
  "thumb:c2_s00a_ring": "art/thumb_c2_s00a_ring_v1.webp",
  "thumb:c2_s01a_glove": "art/thumb_c2_s01a_glove_v1.webp",
  "thumb:c2_s01a_ask": "art/thumb_c2_s01a_ask_v1.webp",
  "thumb:c2_s01a_none": "art/thumb_c2_s01a_none_v1.webp",
  "thumb:c2_s01b_tang": "art/thumb_c2_s01b_tang_v2.webp",
  "thumb:c2_s01b_lin": "art/thumb_c2_s01b_lin_v1.webp",
  "thumb:c2_s01b_self": "art/thumb_c2_s01b_self_v1.webp",
  "portrait:zhou_voice": "art/portrait_zhou_voice_v1.webp",
  "thumb:c2_s02a_play": "art/thumb_c2_s02a_play_v1.webp",
  "thumb:c2_s02a_confront": "art/thumb_c2_s02a_confront_v1.webp",
  "thumb:c2_s02a_silent": "art/thumb_c2_s02a_silent_v1.webp",
  "thumb:c2_s03a_letter": "art/thumb_c2_s03a_letter_v2.webp",
  "thumb:c2_s03a_hang": "art/thumb_c2_s03a_hang_v1.webp",
  "thumb:c2_s03a_send": "art/thumb_c2_s03a_send_v1.webp",
  "thumb:c2_s04a_copied": "art/thumb_c2_s04a_copied_v1.webp",
  "thumb:c2_s04a_kept": "art/thumb_c2_s04a_kept_v3.webp",
  "thumb:c2_s04a_unread": "art/thumb_c2_s04a_unread_v2.webp",
  "thumb:c2_s05a_lin": "art/thumb_c2_s05a_lin_v1.webp",
  "thumb:c2_s05a_dunno": "art/thumb_c2_s05a_dunno_v1.webp",
  "thumb:c2_s05a_none": "art/thumb_c2_s05a_none_v1.webp",
  "scene_corridor_intercom_off": "art/scene_corridor_intercom_off_v1.webp",
  "ending:C2_E_WHO": "art/ending_C2_E_WHO_v1.webp",
  "ending:C2_E_CHAIR": "art/ending_C2_E_CHAIR_v2.webp",
  "ending:C2_E_HEARD": "art/ending_C2_E_HEARD_v1.webp",
  "ending:C2_E_DRAFT": "art/ending_C2_E_DRAFT_v1.webp",
  "ending:C2_E_TAKE": "art/ending_C2_E_TAKE_v1.webp",
  "chapter:c3": "art/chapter_c3_v1.webp",
  "chapter:c4": "art/chapter_c4_v1.webp",
  "chapter:fin": "art/chapter_final_v1.webp",
  "portrait:mira_broken": "art/portrait_mira_broken_v1.webp",
  "icon:icon_ending": "art/icons/icon_ending_v1.svg",
  "icon:icon_log": "art/icons/icon_log_v1.svg",
  "icon:icon_echo": "art/icons/icon_echo_v1.svg",
  "icon:icon_review": "art/icons/icon_review_v1.svg",
  "icon:icon_savecode": "art/icons/icon_savecode_v1.svg",
  "icon:echo_mira": "art/icons/echo_mira_v1.svg",
  "icon:echo_cache": "art/icons/echo_cache_v1.svg",
  "icon:echo_stance": "art/icons/echo_stance_v1.svg",
  "icon:echo_letter": "art/icons/echo_letter_v1.svg",
  "icon:echo_prior": "art/icons/echo_prior_v1.svg",
  "icon:echo_tang": "art/icons/echo_tang_v1.svg",
  "icon:echo_self": "art/icons/echo_self_v1.svg",
  "icon:echo_door": "art/icons/echo_door_v1.svg"
 },
 "echo_icon_assets": {
  "echo_mira": "art/icons/echo_mira_v1.svg",
  "echo_cache": "art/icons/echo_cache_v1.svg",
  "echo_stance": "art/icons/echo_stance_v1.svg",
  "echo_letter": "art/icons/echo_letter_v1.svg",
  "echo_prior": "art/icons/echo_prior_v1.svg",
  "echo_tang": "art/icons/echo_tang_v1.svg",
  "echo_self": "art/icons/echo_self_v1.svg",
  "echo_door": "art/icons/echo_door_v1.svg"
 },
 "image_dimensions": {
  "chapter:c1": {
   "width": 900,
   "height": 1200
  },
  "scene_bay7_poweroff": {
   "width": 1920,
   "height": 1080
  },
  "thumb:c1_s00a_look": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s00a_answer": {
   "width": 480,
   "height": 360
  },
  "portrait:mira_lv1": {
   "width": 1254,
   "height": 1254
  },
  "thumb:c1_s00b_move": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s00b_ignore": {
   "width": 480,
   "height": 360
  },
  "scene_bay7_emergency": {
   "width": 1920,
   "height": 1080
  },
  "thumb:c1_s01a_pwd": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s01a_mira": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s01a_force": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s01b_chat": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s01b_estop": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s02a_plc": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s02a_bus": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s02a_env": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s02a_done": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s02b_go": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s02b_stay": {
   "width": 480,
   "height": 360
  },
  "scene_b2_jumper": {
   "width": 1920,
   "height": 1080
  },
  "thumb:c1_s02c_photo": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s02c_remove": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s02c_cover": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s03a_repair": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s03a_pain": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s03a_force": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s03b_give": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s03b_keep": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s03b_leave": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s04a_mira": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s04a_mail": {
   "width": 480,
   "height": 360
  },
  "thumb:c1_s04a_none": {
   "width": 480,
   "height": 360
  },
  "scene_corridor_intercom": {
   "width": 1920,
   "height": 1080
  },
  "ending:C1_E_CRACK": {
   "width": 1920,
   "height": 1080
  },
  "ending:C1_E_SAME": {
   "width": 1920,
   "height": 1080
  },
  "ending:C1_E_MAIL": {
   "width": 1920,
   "height": 1080
  },
  "ending:C1_E_KEPT": {
   "width": 1920,
   "height": 1080
  },
  "ending:C1_E_NAME": {
   "width": 1920,
   "height": 1080
  },
  "chapter:c2": {
   "width": 900,
   "height": 1200
  },
  "thumb:c2_s00a_log": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s00a_answer": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s00a_ring": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s01a_glove": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s01a_ask": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s01a_none": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s01b_tang": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s01b_lin": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s01b_self": {
   "width": 480,
   "height": 360
  },
  "portrait:zhou_voice": {
   "width": 1254,
   "height": 1254
  },
  "thumb:c2_s02a_play": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s02a_confront": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s02a_silent": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s03a_letter": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s03a_hang": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s03a_send": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s04a_copied": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s04a_kept": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s04a_unread": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s05a_lin": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s05a_dunno": {
   "width": 480,
   "height": 360
  },
  "thumb:c2_s05a_none": {
   "width": 480,
   "height": 360
  },
  "scene_corridor_intercom_off": {
   "width": 1920,
   "height": 1080
  },
  "ending:C2_E_WHO": {
   "width": 1920,
   "height": 1080
  },
  "ending:C2_E_CHAIR": {
   "width": 1920,
   "height": 1080
  },
  "ending:C2_E_HEARD": {
   "width": 1920,
   "height": 1080
  },
  "ending:C2_E_DRAFT": {
   "width": 1920,
   "height": 1080
  },
  "ending:C2_E_TAKE": {
   "width": 1920,
   "height": 1080
  },
  "chapter:c3": {
   "width": 900,
   "height": 1200
  },
  "chapter:c4": {
   "width": 900,
   "height": 1200
  },
  "chapter:fin": {
   "width": 900,
   "height": 1200
  },
  "portrait:mira_broken": {
   "width": 1024,
   "height": 1024
  }
 }
};
