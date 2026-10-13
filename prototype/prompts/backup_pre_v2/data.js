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
 "_sources": [
  "story/c1_s00-s01_draft_v4.yaml",
  "puzzle/c1_endings_v1.yaml"
 ],
 "images": {
  "scene_bay7_poweroff": "../samples/scene_bay7_poweroff_v2.png",
  "mira_lv1": "../samples/portrait_mira_lv1_v1.png"
 }
};