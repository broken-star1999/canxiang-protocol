window.STORY={
 "values": {
  "EVD": 0,
  "TRU": 30,
  "EXP": 0,
  "SLF": 0
 },
 "clock_start": "05:00",
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
      "EXP": 25,
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
      "EVD": 5
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
   "text": "02:13:07。PB1 按下。\n急停按钮就在 R-07 工位边上，红色蘑菇头，现在还陷在底座里，没人把它旋起来。\n屏幕上能调的东西有三样：急停和 PLC 的事件记录、电机母线的电压曲线、舱内的环境日志。\n每一样都要时间。你不知道离六点还剩多少能用的分钟，你只知道，不会够。\n",
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
      "EVD": 10
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
      "EVD": 20
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
     "label": "够了，下一步",
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
      "EVD": 20,
      "EXP": 20
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
      "EVD": 10
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
      "EVD": -15,
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
      "EVD": 5,
      "EXP": -15,
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
      "TRU": 25
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
      "TRU": 15,
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
      "EVD": 25,
      "TRU": -30
     },
     "time": 2,
     "flags_set": [
      "mira_copy",
      "mira_forced"
     ],
     "result": "没时间了。你绕过只读权限，把她的缓存整个拖进本地证据区。确认框只弹了一次，你按了下去。\n进度条走得很快。\n走到头的那一刻，那道青色的波形碎掉了一角，碎口上挂着一点红色的噪点，再也没长回去。\n「……收到。」她说。\n不是「操作员」，也不是「林述」。从这一刻起，她不再叫你任何名字。\n",
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
      "EVD": 25,
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
      "TRU": 15
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
     "result": "你没有开口。时间不够，或者是你还没想好该怎么开口。\n那道波形亮了一下，像是有话要说。\n最后她什么也没说，只是把索引窗口留在屏幕上，没有关。\n",
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
      "EXP": 15
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
   "id": "E_FORMAT",
   "when": "EXP >= 85 || flag:cause_AI || (flag:culprit_SELF && !flag:send_NONE)",
   "review": "……"
  },
  {
   "id": "E_SCAPEGOAT",
   "when": "flag:culprit_LIN && (flag:send_EXT || flag:send_INT)",
   "review": "……"
  },
  {
   "id": "E_ECHO_TRUE",
   "when": "flag:cause_K1 && (flag:culprit_ZHOU || flag:culprit_SYSTEM) && flag:send_EXT && ((flag:sign_R07 && EVD >= 70) || (flag:sign_ANON && EVD >= 85)) && TRU >= 60",
   "review": "……"
  },
  {
   "id": "E_LONE",
   "when": "flag:cause_K1 && (flag:culprit_ZHOU || flag:culprit_SYSTEM) && flag:send_EXT && ((flag:sign_R07 && EVD >= 50) || (flag:sign_ANON && EVD >= 65))",
   "review": "……"
  },
  {
   "id": "E_HALFWAKE",
   "when": "flag:sign_LIN && flag:send_EXT",
   "review": "……"
  },
  {
   "id": "E_ZHOU",
   "when": "flag:culprit_WAIT || (flag:culprit_SYSTEM && flag:zhou_heard)",
   "variant": "TRU >= 60",
   "review": "……"
  },
  {
   "id": "E_SILENT",
   "when": "flag:send_NONE || flag:send_INT",
   "variant": "TRU >= 60",
   "review": "……"
  },
  {
   "id": "E_LONE_FALLBACK",
   "when": "EVD >= 50",
   "same_as": "E_LONE"
  },
  {
   "id": "E_FORMAT_FALLBACK",
   "when": "true",
   "same_as": "E_FORMAT"
  }
 ],
 "bonuses": [
  {
   "id": "b_zhou_both",
   "when": "flag:zhou_heard && flag:zhou_letter",
   "effects": {
    "EVD": 10
   },
   "once": true,
   "log": "你把电话里的话和那封没发出的信对上了。"
  }
 ],
 "self_endings": [
  {
   "id": "S_SHADOW",
   "when": "SLF < 35"
  },
  {
   "id": "S_BETWEEN",
   "when": "SLF >= 35 && SLF < 65"
  },
  {
   "id": "S_R07",
   "when": "SLF >= 65"
  }
 ],
 "portrait_overrides": [
  {
   "when": "flag:mira_forced",
   "from": "mira_lv1",
   "to": "mira_broken"
  }
 ],
 "_sources": [
  "story/c1_s00-s01_draft_v4.yaml",
  "story/c1_s02_draft_v2.yaml",
  "story/c1_s03_draft_v4.yaml",
  "story/c1_s04_draft_v2.yaml",
  "puzzle/c1_endings_v1.yaml",
  "prototype/overrides.yaml"
 ],
 "_portrait_override_sources": [
  "prototype/overrides.yaml"
 ],
 "_portrait_override_skipped": [],
 "images": {
  "thumb:c1_s00a_look": "../art/out/thumb_c1_s00a_look_v1.webp",
  "thumb:c1_s00a_answer": "../art/out/thumb_c1_s00a_answer_v1.webp",
  "thumb:c1_s00b_move": "../art/out/thumb_c1_s00b_move_v2.webp",
  "thumb:c1_s00b_ignore": "../art/out/thumb_c1_s00b_ignore_v2.webp",
  "scene_bay7_emergency": "../art/out/scene_bay7_emergency_v1.webp",
  "thumb:c1_s01a_pwd": "../art/out/thumb_c1_s01a_pwd_v1.webp",
  "thumb:c1_s01a_mira": "../art/out/thumb_c1_s01a_mira_v1.webp",
  "thumb:c1_s01a_force": "../art/out/thumb_c1_s01a_force_v1.webp",
  "thumb:c1_s01b_chat": "../art/out/thumb_c1_s01b_chat_v1.webp",
  "thumb:c1_s01b_estop": "../art/out/thumb_c1_s01b_estop_v1.webp",
  "thumb:c1_s02a_plc": "../art/out/thumb_c1_s02a_plc_v1.webp",
  "thumb:c1_s02a_bus": "../art/out/thumb_c1_s02a_bus_v1.webp",
  "thumb:c1_s02a_env": "../art/out/thumb_c1_s02a_env_v2.png",
  "thumb:c1_s02a_done": "../art/out/thumb_c1_s02a_done_v1.webp",
  "thumb:c1_s02b_go": "../art/out/thumb_c1_s02b_go_v1.webp",
  "thumb:c1_s02b_stay": "../art/out/thumb_c1_s02b_stay_v1.webp",
  "scene_b2_jumper": "../art/out/scene_b2_jumper_v1.webp",
  "thumb:c1_s02c_photo": "../art/out/thumb_c1_s02c_photo_v1.webp",
  "thumb:c1_s02c_remove": "../art/out/thumb_c1_s02c_remove_v1.webp",
  "thumb:c1_s02c_cover": "../art/out/thumb_c1_s02c_cover_v1.webp",
  "thumb:c1_s03a_repair": "../art/out/thumb_c1_s03a_repair_v1.png",
  "thumb:c1_s03a_pain": "../art/out/thumb_c1_s03a_pain_v1.png",
  "thumb:c1_s03a_force": "../art/out/thumb_c1_s03a_force_v1.png",
  "thumb:c1_s03b_give": "../art/out/thumb_c1_s03b_give_v1.png",
  "thumb:c1_s03b_keep": "../art/out/thumb_c1_s03b_keep_v1.png",
  "thumb:c1_s03b_leave": "../art/out/thumb_c1_s03b_leave_v1.png",
  "thumb:c1_s04a_mira": "../art/out/thumb_c1_s04a_mira_v1.png",
  "thumb:c1_s04a_mail": "../art/out/thumb_c1_s04a_mail_v1.png",
  "thumb:c1_s04a_none": "../art/out/thumb_c1_s04a_none_v1.png",
  "scene_corridor_intercom": "../art/out/scene_corridor_intercom_v1.png",
  "mira_broken": "../art/out/portrait_mira_broken_v1.webp",
  "scene_bay7_poweroff": "../samples/scene_bay7_poweroff_v2.png",
  "mira_lv1": "../samples/portrait_mira_lv1_v1.png"
 }
};