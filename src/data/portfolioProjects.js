export const portfolioProjects = [
  {
    id: 'let-there-be-light',
    number: '01',
    title: '神说要有光',
    subtitle: '在黑暗中，辨认光的代价。',
    category: '叙事探索 / 元素解谜',
    role: '主程序 · 技术美术',
    engine: 'Godot',
    platform: 'Windows',
    status: '可试玩 Demo',
    cover: '/portfolio/let-there-be-light-cover.png',
    coverAlt: '《神说要有光》的深蓝色水下开始界面与游戏标题',
    description:
      '一款围绕光影与元素交互展开的叙事探索游戏。玩家借火光与墙壁的影子辨认迷宫，在火、水、木、土与金的相互作用中寻找前路。光能驱散黑暗，也会燃烧生命；散落的诗与最后的选择，通向不同的结局。',
    responsibility:
      '我担任主程序，负责将策划流程与团队美术素材落地为可运行的 Godot Demo。实际工作包括元素与生存系统、关卡搭建和联调、2D / 3D 场景交互、镜头演出、Shader 特效、UI 动效，以及存档和 Windows 版本发布；同时参与系统规则与关卡交互细节的协作调整。',
    contributions: [
      {
        title: '玩法系统与规则落地',
        text: '实现移动、冲刺、拾取和放置，以及火、水、木、土、金之间的交互：火焰持续时间与生命消耗、木头搬运和点燃、水火产生蒸汽、借木越墙、腾空越障、土块破坏与金的续火效果。联调交互优先级、操作距离和安全落点，处理多种状态同时发生的情况。',
      },
      {
        title: '关卡搭建与可玩性联调',
        text: '依据地图和策划路线搭建通路碰撞与挡光墙，配置火源、水源、木头、土块及通道。参与取木区扩展、木与土的关口、彩蛋区和泉水阻路流程的落地；布置挡路鬼影，实现接触识别、光照驱赶、浮动和逃跑倾斜，并根据试玩反馈调整布局。',
      },
      {
        title: '技术美术与视觉特效',
        text: '编写和调整水波、倒影、浸水色调、沉浮模糊、燃烧边框及余烬粒子等表现。实现放木点荧光与生长光环、拾取描边和闪光、瀑布流动、鱼眼泪水与鬼影轻动画。处理叠光过曝、贴墙漏光和遮挡冲突，使玩家附近可辨认、隔墙道路仍保持黑暗。',
      },
      {
        title: '镜头控制与叙事演出',
        text: '实现长按女孩下沉、缩放与旋转、鱼入场和消失，以及角色与镜头配合的构图调整。制作房间视角的惯性与呼吸晃动、猫神特写、母亲下坠、白球砸脸与取走等演出；配合镜头震动、黑白闪、电影黑框和字幕，衔接迷宫、返家及双结局流程。',
      },
      {
        title: '3D 场景与程序化运动',
        text: '在引擎中搭建房间和悬挂物件，完成基础模型组装、贴图材质接入、灯光与电视雪花屏。实现物件错落摆动、链环程序化排列、拖动物品后松手归位，以及下落、旋转、碎裂与绳索相关演出。以基础几何体、材质和程序化动画完成相应场景表现。',
      },
      {
        title: '界面交互与 UI 动效',
        text: '实现水下标题菜单的沉浮、悬停显现、标题倒影、设置和制作人面板的入场动效。接入局内暂停、设置、重生与新游戏确认；制作液滴形入口的知识收录通知、黑色液体展开和收起的提示册，以及常驻信标鼠标、按下反色等交互反馈。',
      },
      {
        title: '存档、重生与剧情状态',
        text: '维护本局现场与长期进度的区分，保存物品状态、知识收录、诗句和彩蛋条件。处理死亡和主动重生后的状态恢复、继续游戏与新游戏的重置边界，修复死亡清除真结局资格的问题，并接通「福音」「硫磺火」的判定与结局展示。',
      },
      {
        title: '素材整合、测试与版本发布',
        text: '整合团队提供的地图、人物与元素素材，接入音效触发、对白、环境声及音量过渡。根据试玩反馈持续修复交互和表现问题，优化大型场景资源的保存方式，导出 Windows 试玩版，并直接验证发布包中的取火、燃烧时间和离开范围等流程，修复彩蛋火源在导出后丢失交互连接的问题。',
      },
    ],
    collaborationNote: '团队协作：主线文案与原始地图方案由策划提供，角色、元素和主要 2D 原画由美术提供。我参与系统规则与关卡交互细节调整，负责对应的程序实现、场景整合、材质灯光及表现联调。',
    disclosure: '开发方式：使用 AI 辅助代码实现、技术方案探索与调试，由我结合策划和玩家反馈推进需求拆解、效果验收及版本迭代。',
    downloadUrl: 'https://github.com/KelAess111/MyWeb/releases/download/portfolio-games-20261020/Let-There-Be-Light-Windows.zip',
    downloadName: 'Let-There-Be-Light-Windows.zip',
    downloadNote: 'Windows 版本；解压后请保持 EXE 与 PCK 文件在同一目录。',
  },
  {
    id: 'witch-in-a-perfume-bottle',
    number: '02',
    title: '香水瓶中的魔女',
    subtitle: '一段异国旅途，一场奇异事件。',
    category: '视觉小说',
    role: '独立开发 · AI 辅助',
    engine: 'WebGAL',
    platform: 'Windows',
    status: '可试玩 Demo',
    cover: '/portfolio/perfume-witch-night.png',
    coverAlt: '《香水瓶中的魔女》游戏中的蓝色夜间大厅场景',
    description:
      '主人公与随从来到一个新的国家，在旅途中遇上奇异事件。故事以视觉小说的形式展开，通过人物对话、场景与声音，逐步呈现这段异国经历。',
    responsibility:
      '这是我此前独立开发的视觉小说 Demo。在 AI 辅助下，约 90% 的内容由我独立完成，并将故事内容、场景、人物对话与音频整合为可试玩版本。',
    contributions: [
      '以个人开发为主推进游戏内容制作，完成从故事呈现到试玩版本的整合。',
      '使用 WebGAL 编排场景、角色、对话与音频，串联视觉小说的叙事流程。',
    ],
    disclosure: '制作说明：采用 AI 辅助；“约 90% 独立完成”指制作内容与工作量，不代表全部素材均为手工原创。',
    downloadUrl: 'https://github.com/KelAess111/MyWeb/releases/download/portfolio-games-20261020/Witch-in-a-Perfume-Bottle-Windows-Demo.zip',
    downloadName: 'Witch-in-a-Perfume-Bottle-Windows-Demo.zip',
    downloadNote: 'Windows 试玩版；完整解压后运行 WebGAL.exe。',
  },
]
