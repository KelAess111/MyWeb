export const hiddenSpaceWriting = {
  "id": "hidden-writing-root",
  "slug": "hidden-writing",
  "path": "/root/hidden-writing",
  "type": "folder",
  "title": "隐藏写作角落",
  "intro": "这里只收纳隐藏空间内部的段落、设定和只给特定路线使用的文本。",
  "detail": "这是一套和公开写作区结构一致、但内容与存储完全隔离的隐藏写作目录。",
  "excerptLabel": "根目录",
  "meta": {},
  "ocHoverLine": {
    "id": "hidden-writing-root-hover",
    "text": "这里的文字不需要公开，它们只需要在自己的房间里长好。",
    "expression": "calm",
    "caption": "隐藏空间的写作目录会和公开写作区保持功能一致，但内容彼此隔离。"
  },
  "children": [
    {
      "id": "hidden-writing-folder-oc-notes",
      "slug": "oc-notes",
      "path": "/root/hidden-writing/oc-notes",
      "type": "folder",
      "title": "OC 侧写",
      "intro": "偏人物状态、口吻、观察角度的内部笔记。",
      "detail": "这里放的是更靠近角色内侧的记录，用来支撑隐藏空间左侧常驻的 OC 区域。",
      "excerptLabel": "目录",
      "meta": {},
      "ocHoverLine": {
        "id": "hidden-writing-folder-oc-notes-hover",
        "text": "人物不是设定表本身，而是会在细节里反复露出边角。",
        "expression": "thoughtful",
        "caption": "先收纳人物侧写，再决定哪些内容值得展开成正文。"
      },
      "children": [
        {
          "id": "hidden-writing-entry-voice-profile",
          "slug": "voice-profile",
          "path": "/root/hidden-writing/oc-notes/voice-profile",
          "type": "entry",
          "title": "说话方式备忘",
          "intro": "记录角色在不同状态下的语气、停顿和避让方式。",
          "detail": "这是一个终点内容条目，双击后会直接进入阅读页，不再显示外层目录。",
          "template": "fragment",
          "excerptLabel": "侧写",
          "meta": {},
          "blocks": [
            {
              "id": "hidden-writing-entry-voice-profile-block-0",
              "type": "paragraph",
              "text": "他在情绪稳定的时候会把句子说得很平，像是提前把所有波澜都压回去了；但一旦被逼到解释边缘，尾音就会轻微发紧。"
            },
            {
              "id": "hidden-writing-entry-voice-profile-block-1",
              "type": "quote",
              "text": "“我不是不回答，我只是想先把最不会伤人的那一种说法挑出来。”"
            }
          ],
          "ocHoverLine": {
            "id": "hidden-writing-entry-voice-profile-hover",
            "text": "先记住他们怎么开口，后面的剧情才会自己带出力度。",
            "expression": "soft",
            "caption": "隐藏区的 fragment 条目适合保留这种偏人物口吻的内容。"
          }
        },
        {
          "id": "hidden-writing-entry-sensory-triggers",
          "slug": "sensory-triggers",
          "path": "/root/hidden-writing/oc-notes/sensory-triggers",
          "type": "entry",
          "title": "感官触发点",
          "intro": "整理会让人物立刻进入防备或松弛状态的细节。",
          "detail": "用来服务后续场景书写的快速触发清单。",
          "template": "world-note",
          "excerptLabel": "设定",
          "meta": {},
          "blocks": [
            {
              "id": "hidden-writing-entry-sensory-triggers-block-0",
              "type": "subheading",
              "text": "会立即警觉的东西"
            },
            {
              "id": "hidden-writing-entry-sensory-triggers-block-1",
              "type": "list",
              "items": [
                "过亮且没有来源解释的灯光",
                "陌生人直接站到背后一步内的距离",
                "对方在回答前先笑的停顿"
              ]
            },
            {
              "id": "hidden-writing-entry-sensory-triggers-block-2",
              "type": "aside",
              "text": "这类条目更偏内部工作台，不适合直接与公开写作区互通。"
            }
          ],
          "ocHoverLine": {
            "id": "hidden-writing-entry-sensory-triggers-hover",
            "text": "把触发点写清楚，场景里的反应才不会像硬加上去的效果。",
            "expression": "calm",
            "caption": "隐藏区 world-note 条目主要服务人物行为一致性。"
          }
        }
      ]
    },
    {
      "id": "hidden-writing-folder-scenes",
      "slug": "scenes",
      "path": "/root/hidden-writing/scenes",
      "type": "folder",
      "title": "封闭场景",
      "intro": "更适合在隐藏空间里阅读的片段式正文。",
      "detail": "这里存放的是和 OC 线并排工作的小场景，进入后直接阅读，不与公开目录共享。",
      "excerptLabel": "目录",
      "meta": {},
      "ocHoverLine": {
        "id": "hidden-writing-folder-scenes-hover",
        "text": "有些场景只需要在这里成立，不需要被带去公开场域。",
        "expression": "curious",
        "caption": "这组条目更偏隐藏路线内的独立正文。"
      },
      "children": [
        {
          "id": "hidden-writing-entry-corridor-scene",
          "slug": "corridor-scene",
          "path": "/root/hidden-writing/scenes/corridor-scene",
          "type": "entry",
          "title": "走廊拐角",
          "intro": "一个适合分页阅读器的隐藏区短场景。",
          "detail": "这里用 essay 结构示范隐藏空间里的正文条目。",
          "template": "essay",
          "excerptLabel": "场景",
          "meta": {},
          "blocks": [
            {
              "id": "hidden-writing-entry-corridor-scene-block-0",
              "type": "subheading",
              "text": "拐角前"
            },
            {
              "id": "hidden-writing-entry-corridor-scene-block-1",
              "type": "paragraph",
              "text": "走廊比预想中更安静，安静到鞋底摩擦地面的声音都像是不该被留下来的证据。"
            },
            {
              "id": "hidden-writing-entry-corridor-scene-block-2",
              "type": "paragraph",
              "text": "他在拐角前停了一下，没有立刻过去，而是先抬眼看向灯影最薄的那一段墙，好像那里能给出某种比直觉更可靠的回答。"
            },
            {
              "id": "hidden-writing-entry-corridor-scene-block-3",
              "type": "aside",
              "text": "阅读器会按块分页，因此这里保留了几种不同类型的段落。"
            }
          ],
          "ocHoverLine": {
            "id": "hidden-writing-entry-corridor-scene-hover",
            "text": "隐藏区的正文也该有自己的节奏，而不是借公开区来占位。",
            "expression": "calm",
            "caption": "essay 条目用来验证隐藏区和公开区拥有同等的阅读能力。"
          }
        },
        {
          "id": "hidden-writing-entry-quiet-exchange",
          "slug": "quiet-exchange",
          "path": "/root/hidden-writing/scenes/quiet-exchange",
          "type": "entry",
          "title": "低声交换",
          "intro": "一段对话体样例，用来验证隐藏区的 dialogue 渲染。",
          "detail": "该条目展示隐藏空间里的对话型终点内容。",
          "template": "dialogue",
          "excerptLabel": "对话",
          "meta": {},
          "blocks": [
            {
              "id": "hidden-writing-entry-quiet-exchange-block-0",
              "type": "dialogue",
              "lines": [
                {
                  "id": "hidden-writing-entry-quiet-exchange-block-0-line-0",
                  "speaker": "A",
                  "text": "你已经在这里等很久了吗？"
                },
                {
                  "id": "hidden-writing-entry-quiet-exchange-block-0-line-1",
                  "speaker": "B",
                  "text": "没有很久，只是刚好比你先把那点犹豫消化完。"
                }
              ]
            }
          ],
          "ocHoverLine": {
            "id": "hidden-writing-entry-quiet-exchange-hover",
            "text": "对话型内容在隐藏区也要完整成立，而不是只当测试数据。",
            "expression": "soft",
            "caption": "dialogue 条目确保隐藏写作区不是公开区的镜像副本。"
          }
        }
      ]
    }
  ]
}
