export type FortuneTone = 'great' | 'good' | 'balanced' | 'caution'
export type FortuneTempo = 'now' | 'steady' | 'wait' | 'change'
export type TrigramName = '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤'

export type Hexagram = {
  number: number
  name: string
  fullName: string
  upper: TrigramName
  lower: TrigramName
  keywords: [string, string, string]
  meaning: string
  action: string
  warning: string
  tone: FortuneTone
  tempo: FortuneTempo
}

export const trigramLines: Record<TrigramName, [boolean, boolean, boolean]> = {
  '乾': [true, true, true],
  '兑': [true, true, false],
  '离': [true, false, true],
  '震': [true, false, false],
  '巽': [false, true, true],
  '坎': [false, true, false],
  '艮': [false, false, true],
  '坤': [false, false, false],
}

export const trigramImages: Record<TrigramName, string> = {
  '乾': '天', '兑': '泽', '离': '火', '震': '雷', '巽': '风', '坎': '水', '艮': '山', '坤': '地',
}

// Contemporary, reflective interpretations of the King Wen sequence. These
// are intentionally original summaries rather than quotations from a specific
// historical edition.
export const hexagrams: Hexagram[] = [
  { number: 1, name: '乾', fullName: '乾为天', upper: '乾', lower: '乾', keywords: ['创造', '主动', '健行'], meaning: '天行不息，这一卦的核心是开创与自我驱动。你已有开局的力量，重点在于把志向变成稳定行动。', action: '先定方向，再以清晰节奏连续推进；适合主动争取和承担责任。', warning: '过度强势会让助力变成阻力，也要为他人留出发言空间。', tone: 'great', tempo: 'now' },
  { number: 2, name: '坤', fullName: '坤为地', upper: '坤', lower: '坤', keywords: ['承载', '配合', '蓄力'], meaning: '大地以厚德载物，此时不必抢先，更适合看清局势、整合资源，让事情有安放之处。', action: '找到可靠的方向或合作者，把基础、流程和照顾工作做扎实。', warning: '顺势不等于没有边界；不要因为迁就而忘了自己的底线。', tone: 'good', tempo: 'steady' },
  { number: 3, name: '屯', fullName: '水雷屯', upper: '坎', lower: '震', keywords: ['初难', '萌发', '建立'], meaning: '新事物刚萌发时往往头绪纷繁。眼前的困难更像起步阶段的拥挤，并非方向必然错误。', action: '缩小第一步，先立规则、找帮手，再一步步打通卡点。', warning: '不宜在信息不足时下过大的赌注，也不要因一时混乱就放弃。', tone: 'balanced', tempo: 'steady' },
  { number: 4, name: '蒙', fullName: '山水蒙', upper: '艮', lower: '坎', keywords: ['启蒙', '求教', '明辨'], meaning: '蒙昧不是失败，而是提醒你当下还有关键信息没看见。以学习者心态进入，局面会慢慢变清。', action: '把问题改得更具体，向真正有经验的人请教，并用一次小实验验证。', warning: '反复问同一件事不会让答案更真；先消化已经得到的提示。', tone: 'balanced', tempo: 'wait' },
  { number: 5, name: '需', fullName: '水天需', upper: '坎', lower: '乾', keywords: ['等待', '准备', '信心'], meaning: '时机还在成熟中。这不是空等，而是一段为正确时点积蓄条件的过程。', action: '补齐资源、预案和体力，设一个清晰的观察节点，到点再决定。', warning: '不要把焦虑误当成立即行动的理由，也别把等待变成拖延。', tone: 'good', tempo: 'wait' },
  { number: 6, name: '讼', fullName: '天水讼', upper: '乾', lower: '坎', keywords: ['分歧', '界限', '止争'], meaning: '立场不同已经浮出水面。关键不在于证明谁永远正确，而是让规则、事实和边界重新清楚。', action: '保留记录，找中立人核对事实，优先谈可执行的停战方案。', warning: '将冲突推到底容易两败俱伤，能中止的争端不必非要决胜。', tone: 'caution', tempo: 'wait' },
  { number: 7, name: '师', fullName: '地水师', upper: '坤', lower: '坎', keywords: ['组织', '纪律', '统帅'], meaning: '事情需要集体力量，但人多不等于有战斗力。此卦强调正当目标、清楚分工和可信的领队。', action: '先定统一原则，再分配责任与节点，把沟通与复盘纳入计划。', warning: '动用大量资源前要确认动机正当，避免情绪化动员。', tone: 'balanced', tempo: 'steady' },
  { number: 8, name: '比', fullName: '水地比', upper: '坎', lower: '坤', keywords: ['亲比', '联结', '信任'], meaning: '当下的助力来自真诚联结。选对同行的人，彼此确认价值与承诺，事情会更稳。', action: '主动表达善意，把合作条件说清，用一件具体的小事建立信任。', warning: '不必为了归属感勉强加入不合适的关系，迟疑过久也会错过联结。', tone: 'good', tempo: 'now' },
  { number: 9, name: '小畜', fullName: '风天小畜', upper: '巽', lower: '乾', keywords: ['小蓄', '微调', '渐进'], meaning: '力量正在积聚，但还不到一次突破的时候。小的修正与累积比强行冲关更有效。', action: '先改善一个具体环节，保存体力和现金流，等条件串联起来。', warning: '不要嫌步子小；此时贪大求快，反而容易打散已有成果。', tone: 'balanced', tempo: 'steady' },
  { number: 10, name: '履', fullName: '天泽履', upper: '乾', lower: '兑', keywords: ['礼序', '谨慎', '践行'], meaning: '你正在走一条需要分寸的路。能够辨识规则、尊重力量边界，就能在压力中通过。', action: '把程序、承诺和礼节做足，说话留有余地，每一步都先确认落点。', warning: '自信不等于冒犯；在强势对象或高风险环节前尤须克制。', tone: 'good', tempo: 'steady' },
  { number: 11, name: '泰', fullName: '地天泰', upper: '坤', lower: '乾', keywords: ['通泰', '交流', '盛长'], meaning: '上下相通，资源与意愿开始对齐。这是较适合推进、合作与打开局面的时段。', action: '把好势头变成可持续的制度，同时让利益和信息流动起来。', warning: '顺境中最容易忽略小问题；为反向情况留出缓冲。', tone: 'great', tempo: 'now' },
  { number: 12, name: '否', fullName: '天地否', upper: '乾', lower: '坤', keywords: ['闭塞', '不合', '守正'], meaning: '当下上下不通，即使用力也容易消耗在无效环节。守住核心价值，比勉强扭转更重要。', action: '缩小战线，保全关键资源，把无法沟通的环节先隔离。', warning: '不要为短期结果迎合不健康的游戏规则，也不宜此时全面扩张。', tone: 'caution', tempo: 'wait' },
  { number: 13, name: '同人', fullName: '天火同人', upper: '乾', lower: '离', keywords: ['求同', '公开', '协作'], meaning: '真正的同行来自公开目标，而非私下结党。当你把原则说清，会遇到可以共事的人。', action: '扩大沟通范围，就共同利益建立具体协作，流程尽量透明。', warning: '小圈子中的偏爱会损伤长期信任，避免把人际热度当成事情成果。', tone: 'good', tempo: 'now' },
  { number: 14, name: '大有', fullName: '火天大有', upper: '离', lower: '乾', keywords: ['丰有', '掌握', '分享'], meaning: '资源、能见度或发展空间都在增加。这份“有”既是机会，也是管理与分配的责任。', action: '把优势投向长期价值，公平分配功劳，用成果带动更大的正循环。', warning: '越是丰盛越要防止自满与浪费，别让所有变成被所有。', tone: 'great', tempo: 'now' },
  { number: 15, name: '谦', fullName: '地山谦', upper: '坤', lower: '艮', keywords: ['谦逊', '均衡', '有终'], meaning: '真正的谦不是自我贬低，而是清楚自己的位置与分量。它能让成果走得更久。', action: '主动补齐短板，把功劳说实、把问题说透，用稳定表现赢得信任。', warning: '不要以“低调”为名放弃应有权益，也别用谦虚包装回避。', tone: 'great', tempo: 'steady' },
  { number: 16, name: '豫', fullName: '雷地豫', upper: '震', lower: '坤', keywords: ['顺势', '动员', '预备'], meaning: '气氛与动能已经聚起，适合发起行动、鼓舞人心。好情绪要通过准备才能落地。', action: '在势头正好时公布计划，提前安排人手、时间和应急空间。', warning: '不要把兴奋当成实力，享乐与口号都不能代替执行。', tone: 'good', tempo: 'now' },
  { number: 17, name: '随', fullName: '泽雷随', upper: '兑', lower: '震', keywords: ['随时', '调整', '从善'], meaning: '局势正在变化，固守原路未必是忠于目标。看清趋势并跟随有价值的人与方法。', action: '区分“核心目标”与“实现方式”，方式可以灵活，承诺需要一致。', warning: '随从需要判断力；不要为得到认同而丢掉自己的标准。', tone: 'good', tempo: 'change' },
  { number: 18, name: '蛊', fullName: '山风蛊', upper: '艮', lower: '巽', keywords: ['整治', '除弊', '修复'], meaning: '积累已久的问题需要被正视。这不只是补漏洞，而是找到为什么会反复发生。', action: '先审视旧流程和旧承诺，再分阶段清理；需要时引入外部视角。', warning: '不要把历史责任全归给某个人，只换人不换机制会重演旧剧。', tone: 'balanced', tempo: 'change' },
  { number: 19, name: '临', fullName: '地泽临', upper: '坤', lower: '兑', keywords: ['亲临', '增长', '教化'], meaning: '机会正向你靠近，而你也需要亲自走近现场。温和的影响力比远程指令更有效。', action: '主动接触关键人与真实问题，给出支持与标准，趁势建立长期联系。', warning: '好势头也有周期，不要因暂时受欢迎就忽视后续维护。', tone: 'great', tempo: 'now' },
  { number: 20, name: '观', fullName: '风地观', upper: '巽', lower: '坤', keywords: ['观察', '省察', '示范'], meaning: '此时适合拉开距离看全局。你在观察他人的同时，他人也在通过你的行为判断你。', action: '收集多个角度的事实，再检查自己的言行是否一致，暂缓表态。', warning: '观察不能无期限延长；到了证据足够的节点，需要做出选择。', tone: 'balanced', tempo: 'wait' },
  { number: 21, name: '噬嗑', fullName: '火雷噬嗑', upper: '离', lower: '震', keywords: ['决断', '执法', '清障'], meaning: '前路被一个具体障碍卡住，需要明确判断与果断处理。把模糊问题落到事实和规则上。', action: '查清证据与权责，一次解决那个真正堵塞的节点，尺度要与问题相称。', warning: '果断不等于严苛；若带着怒气执行，很容易过度惩罚。', tone: 'balanced', tempo: 'now' },
  { number: 22, name: '贲', fullName: '山火贲', upper: '艮', lower: '离', keywords: ['文饰', '表达', '分寸'], meaning: '好的形式能让内容被看见。这一卦利于整理表达、优化呈现，但不宜本末倒置。', action: '把复杂事情讲清楚，改善交互与细节，让外在形式准确服务内容。', warning: '华丽包装不能弥补核心空洞，重大决策不要只看表面印象。', tone: 'good', tempo: 'steady' },
  { number: 23, name: '剥', fullName: '山地剥', upper: '艮', lower: '坤', keywords: ['削减', '顺止', '保全'], meaning: '支撑结构正在松动，此时不适合继续加码。主动削去腐坏部分，才能保住真正重要的东西。', action: '停止扩张，处理损耗源，保护核心人员、现金流与健康。', warning: '不要因不舍而继续粉饰危险结构，强行反攻可能加速损失。', tone: 'caution', tempo: 'wait' },
  { number: 24, name: '复', fullName: '地雷复', upper: '坤', lower: '震', keywords: ['回归', '复苏', '新生'], meaning: '一点新的生机已经回来。经过偏离或停滞后，现在适合回到初心，从最小可行处重启。', action: '找回原本正确的节律，今天先恢复一个好习惯或一条重要联系。', warning: '刚恢复的力量还很幼小，不要急着证明自己已经完全翻盘。', tone: 'great', tempo: 'now' },
  { number: 25, name: '无妄', fullName: '天雷无妄', upper: '乾', lower: '震', keywords: ['真诚', '自然', '无妄'], meaning: '少一些算计，回到事情本身。当动机正、行动直接时，外界的变化反而容易应对。', action: '按客观事实做应做的事，不预设戏剧性结果，保持言行一致。', warning: '不要拿侥幸当真诚，更不要在异常发生时固执地继续原计划。', tone: 'good', tempo: 'now' },
  { number: 26, name: '大畜', fullName: '山天大畜', upper: '艮', lower: '乾', keywords: ['大蓄', '能力', '止健'], meaning: '强大的能量正被有意识地积蓄。暂时的克制不是压抑，而是为更大任务做准备。', action: '投资长期技能、储备与人才，在出手前建立能够驾驭规模的结构。', warning: '只蓄不用会变成僵化，但还未练好就贪快也会失控。', tone: 'great', tempo: 'steady' },
  { number: 27, name: '颐', fullName: '山雷颐', upper: '艮', lower: '震', keywords: ['养正', '输入', '口实'], meaning: '你如何获得信息、食物、情绪和支持，就会如何行动。这是检视“养分”的时候。', action: '调整输入源和日常节律，说有根据的话，先照顾身心再处理重要事情。', warning: '当心无意识的消耗、过量信息与口舌是非，它们会改变你的判断。', tone: 'balanced', tempo: 'steady' },
  { number: 28, name: '大过', fullName: '泽风大过', upper: '兑', lower: '巽', keywords: ['过载', '独立', '非常'], meaning: '压力已经超过平常结构的承受范围。非常时刻需要非常决断，既不能装作无事，也不可莽撞。', action: '先卸下非必要负担，给承重点加支撑，必要时果断更换旧方案。', warning: '不要单独硬撑到断裂；如果风险涉及健康、法律或财务，应尽快求助专业人士。', tone: 'caution', tempo: 'change' },
  { number: 29, name: '坎', fullName: '坎为水', upper: '坎', lower: '坎', keywords: ['习坎', '险境', '诚信'], meaning: '你可能面对重复出现的风险或情绪低谷。通过险境的方法不是否认它，而是守住内在可信之处。', action: '按安全流程一步一步走，保持联络与记录，把大风险拆成可管理的小段。', warning: '不宜孤注一掷或近身冒险；熟悉的陷阱仍然是陷阱。', tone: 'caution', tempo: 'wait' },
  { number: 30, name: '离', fullName: '离为火', upper: '离', lower: '离', keywords: ['光明', '依附', '分辨'], meaning: '火需要依附燃料才能持续发光。此卦利于看清、表达与被看见，同时要选对依托。', action: '把信息讲明、把专长展示出来，选择能支撑长期价值的平台与关系。', warning: '当心过度依赖外界认可，也要避免情绪升温时的灼伤。', tone: 'good', tempo: 'now' },
  { number: 31, name: '咸', fullName: '泽山咸', upper: '兑', lower: '艮', keywords: ['感应', '交感', '吸引'], meaning: '影响正在于无形中发生。真诚的感受与相互回应，比单方面说服更有力量。', action: '先听后说，表达真实感受与边界，给对方充分回应的空间。', warning: '吸引不等于承诺；不要把一时情绪当成长期结论。', tone: 'great', tempo: 'now' },
  { number: 32, name: '恒', fullName: '雷风恒', upper: '震', lower: '巽', keywords: ['持久', '常道', '节律'], meaning: '真正的恒久不是一成不变，而是在变化中保持核心方向。结果来自可持续的日常。', action: '选择能坚持半年的方案，设立固定节律，小幅调整但不频繁换方向。', warning: '不要把顽固误当坚持，也别被短期刺激反复打断长期积累。', tone: 'great', tempo: 'steady' },
  { number: 33, name: '遁', fullName: '天山遁', upper: '乾', lower: '艮', keywords: ['退避', '保持', '远害'], meaning: '退一步是为了保留选择权，不是承认失败。当环境不利于正面对抗，主动拉开距离更有智慧。', action: '减少暴露与消耗，保持体面地退出无效局面，同时准备下一个落点。', warning: '退避应有边界和计划，不要把必须面对的责任也一并丢下。', tone: 'balanced', tempo: 'wait' },
  { number: 34, name: '大壮', fullName: '雷天大壮', upper: '震', lower: '乾', keywords: ['壮盛', '克制', '正大'], meaning: '力量已经很充足，但越强越需要克制。正当地使用影响力，才能真正突破。', action: '选择最关键的一处用力，公开说明原则，给对方留出可体面回应的路。', warning: '不要以势压人或一味硬进，过度使力容易卡在出口。', tone: 'good', tempo: 'now' },
  { number: 35, name: '晋', fullName: '火地晋', upper: '离', lower: '坤', keywords: ['进展', '显现', '提升'], meaning: '局面开始向明朗处发展，你的付出也更容易被看见。适合提案、展示与向前一步。', action: '准备好可验证的成果，主动争取更大责任，同时照顾一起前进的人。', warning: '晋升时要防止只顾曝光而忽略根基，不要为了速度透支信任。', tone: 'great', tempo: 'now' },
  { number: 36, name: '明夷', fullName: '地火明夷', upper: '坤', lower: '离', keywords: ['藏明', '韧性', '避伤'], meaning: '外部环境暂时不支持光芒完全显露。保持内心的清明，以柔韧方式度过低谷。', action: '低调保全重要信息与能力，只向可信任的人表达，先求安全落地。', warning: '不要在恶意环境里用自我暴露换取认可，也不要因暂时黑暗否定自己。', tone: 'caution', tempo: 'wait' },
  { number: 37, name: '家人', fullName: '风火家人', upper: '巽', lower: '离', keywords: ['家道', '角色', '内治'], meaning: '外部成果取决于内部关系和日常秩序。每个人知道自己的责任，关系才能温暖而有力。', action: '把家庭或团队中的期待、分工和边界说清，从最常发生的摩擦处修复。', warning: '秩序不应变成控制，也不要用“为你好”回避真实沟通。', tone: 'good', tempo: 'steady' },
  { number: 38, name: '睽', fullName: '火泽睽', upper: '离', lower: '兑', keywords: ['异同', '分化', '小同'], meaning: '差异已经显现，不必急于强求完全一致。承认彼此视角不同，反而可以在小事上找到合作。', action: '把争议分解，先就共同事实与最小共识达成一致，保留各自立场。', warning: '不要把不同等同于敌意，但重大方向分歧也不宜被漂亮话掩盖。', tone: 'balanced', tempo: 'steady' },
  { number: 39, name: '蹇', fullName: '水山蹇', upper: '坎', lower: '艮', keywords: ['进难', '反身', '求援'], meaning: '前面的路已经明显难行，继续直冲只会增加损耗。转身检查自身与路线，是打开新路的起点。', action: '停下来识别真正障碍，向有资源或经验的人求助，考虑绕行方案。', warning: '不要用意志力和已经证明不通的路死磕，进退都应优先安全。', tone: 'caution', tempo: 'wait' },
  { number: 40, name: '解', fullName: '雷水解', upper: '震', lower: '坎', keywords: ['解除', '释放', '赦过'], meaning: '紧张开始松动，应尽快处理遗留问题，让人和资源回到正常流动中。', action: '能简化的就简化，能和解的就和解，先清理最容易解决的压力源。', warning: '解围之后不要立即制造新负担，也别让宽容变成没有边界。', tone: 'great', tempo: 'now' },
  { number: 41, name: '损', fullName: '山泽损', upper: '艮', lower: '兑', keywords: ['减损', '专注', '诚意'], meaning: '适当减少能使重要事物获得更多空间。此时的“损”是有意识的聚焦，而不是单纯失去。', action: '停掉一项低价值消耗，把时间、金钱或关注度转向最核心的目标。', warning: '减法应先从自己的冗余开始，不要把代价一味转给弱势的人。', tone: 'balanced', tempo: 'steady' },
  { number: 42, name: '益', fullName: '风雷益', upper: '巽', lower: '震', keywords: ['增益', '行动', '利他'], meaning: '有利的资源正在增加，而最好的用法是让更多人因此受益。利他与自利可以在此时统一。', action: '抓住机会开始行动，优先投入能够产生复利的人、工具与关系。', warning: '好处来得快时更要透明分配，避免新的不公平成为后患。', tone: 'great', tempo: 'now' },
  { number: 43, name: '夬', fullName: '泽天夬', upper: '兑', lower: '乾', keywords: ['决断', '公开', '排除'], meaning: '一个必须面对的问题已到决断时刻。需要公开表明原则，但不宜以暴烈方式执行。', action: '将事实和底线说清，取得必要支持，用可核验的程序完成切割。', warning: '不要为求快而私下报复或穷追不舍，最后一步尤须谨慎。', tone: 'balanced', tempo: 'change' },
  { number: 44, name: '姤', fullName: '天风姤', upper: '乾', lower: '巽', keywords: ['邂逅', '骤来', '边界'], meaning: '一股意外的影响快速进入局面，它可能有吸引力，但尚未经过时间检验。', action: '先观察来意、代价与可退出条件，小范围接触，不立即交出主导权。', warning: '强烈吸引容易遮蔽不对等，不要忽略最初就出现的边界信号。', tone: 'caution', tempo: 'wait' },
  { number: 45, name: '萃', fullName: '泽地萃', upper: '兑', lower: '坤', keywords: ['聚集', '仪式', '共识'], meaning: '人与资源正在聚集。聚在一起需要共同价值、可见的秩序与对风险的准备。', action: '明确聚合的目的和规则，让关键人员到场，同时为高流量做安全预案。', warning: '热闹不等于共识，人多时更要防止情绪传染与责任稀释。', tone: 'good', tempo: 'now' },
  { number: 46, name: '升', fullName: '地风升', upper: '坤', lower: '巽', keywords: ['上升', '积小', '进取'], meaning: '成长正从底层慢慢发生，看似不快，却有根基。顺着正确阶梯向上，会获得帮助。', action: '完成下一个可见台阶，主动请教关键人，把每次小进步变成可复用方法。', warning: '不要因为趋势向上就忽视踏空风险，节节有据才能稳定攀升。', tone: 'great', tempo: 'steady' },
  { number: 47, name: '困', fullName: '泽水困', upper: '兑', lower: '坎', keywords: ['困顿', '守志', '言慎'], meaning: '可用资源受限，也可能感到不被理解。此时真正能保住的，是内在原则与最基本的行动力。', action: '承认限制，优先照顾生存性需求，少说大话，用小而真的完成保持信心。', warning: '在精力不足时不宜作重大承诺，也不要因羞耻感拒绝必要的求助。', tone: 'caution', tempo: 'wait' },
  { number: 48, name: '井', fullName: '水风井', upper: '坎', lower: '巽', keywords: ['源泉', '养人', '更新'], meaning: '环境可变，基础资源与共同需求仍在。问题往往不是没有水，而是取水工具需要修缮。', action: '检查能长期供给价值的系统，更新工具、流程与维护责任。', warning: '不要只做表面翻新；临近完成时的粗心，最容易让前功尽弃。', tone: 'good', tempo: 'steady' },
  { number: 49, name: '革', fullName: '泽火革', upper: '兑', lower: '离', keywords: ['变革', '更命', '取信'], meaning: '旧形式已无法容纳新需要，变化具有必要性。但真正的变革需要时机、理由与信任。', action: '说清为什么要变，选对节点一次切换，用可见的新规则巩固成果。', warning: '不要在情绪巅峰上草率推翻，只有破坏没有新秩序会制造更大混乱。', tone: 'great', tempo: 'change' },
  { number: 50, name: '鼎', fullName: '火风鼎', upper: '离', lower: '巽', keywords: ['鼎新', '转化', '成器'], meaning: '资源正被重新组合，从原料变成能养人的成果。此卦利于升级系统、建立新角色。', action: '调整团队结构与关键工具，把经验沉淀为标准，选择能托住变化的人。', warning: '容器不稳时再好的内容也会倾覆，先确认责任、权限与基础设施。', tone: 'great', tempo: 'change' },
  { number: 51, name: '震', fullName: '震为雷', upper: '震', lower: '震', keywords: ['震动', '警醒', '定神'], meaning: '突发变化可能先带来惊慌，但也会让真正重要的事浮现。能在震动中守住程序，就能迅速恢复。', action: '先稳住身体与信息，核对真实损失，再按预案处理；完成后复盘漏洞。', warning: '不要在第一波惊吓中作极端决定，也不要因事后平静就忘记警示。', tone: 'balanced', tempo: 'change' },
  { number: 52, name: '艮', fullName: '艮为山', upper: '艮', lower: '艮', keywords: ['止念', '界限', '静定'], meaning: '当止则止，是此时最重要的智慧。停下外在动作与内心反刍，才能重新看见边界。', action: '对一项消耗设立明确停止线，暂离信息噪音，等身心恢复后再议。', warning: '停止不是僵住；过度封闭会错过必要联系，应给静止设定终点。', tone: 'balanced', tempo: 'wait' },
  { number: 53, name: '渐', fullName: '风山渐', upper: '巽', lower: '艮', keywords: ['渐进', '归序', '成熟'], meaning: '事情宜按正常次序慢慢成熟，省略步骤反而会破坏长期稳定。', action: '明确阶段与承诺，先完成当前身份所需的准备，让关系与能力同步生长。', warning: '不要被短期浪漫或捷径打乱节律，真正的稳固需要时间。', tone: 'great', tempo: 'steady' },
  { number: 54, name: '归妹', fullName: '雷泽归妹', upper: '震', lower: '兑', keywords: ['位次', '情动', '权宜'], meaning: '此时的吸引或合作可能存在位置不对等、时机不完全成熟的问题。', action: '把身份、期待和后果说清，先以小范围安排观察，不急于做不可逆承诺。', warning: '不要为了情绪或短期利益接受长期不对等，名分与实际需相符。', tone: 'caution', tempo: 'wait' },
  { number: 55, name: '丰', fullName: '雷火丰', upper: '震', lower: '离', keywords: ['丰盛', '当盛', '明决'], meaning: '信息、资源与可见度同时到达高点。这是应当充分行动的时刻，不必因担心盛极而错过当下。', action: '快速聚焦于最有价值的产出，让信息透明，完成只有在高峰期才能做的事。', warning: '盛大会带来复杂与遮蔽，要防过劳、自满与关键信息被噱声淹没。', tone: 'great', tempo: 'now' },
  { number: 56, name: '旅', fullName: '火山旅', upper: '离', lower: '艮', keywords: ['旅居', '客位', '谨慎'], meaning: '你正处在一个过渡性环境，还不适合把临时落脚处当成永久归宿。', action: '轻装、守礼、保留重要记录，先完成当地小目标，同时维持与根基的联系。', warning: '不要在陌生环境过度暴露或留下难以收拾的冲突，小事尤要谨慎。', tone: 'balanced', tempo: 'steady' },
  { number: 57, name: '巽', fullName: '巽为风', upper: '巽', lower: '巽', keywords: ['渗透', '顺入', '申命'], meaning: '影响像风一样通过反复而温和的方式进入。适合沟通、调查与逐步实施。', action: '把关键信息简单一致地重复传达，深入细节，用多次小接触推动变化。', warning: '灵活不等于摇摆；若没有核心指令，反复调整会让人失去信任。', tone: 'good', tempo: 'steady' },
  { number: 58, name: '兑', fullName: '兑为泽', upper: '兑', lower: '兑', keywords: ['喜悦', '交谈', '互益'], meaning: '真诚的交流会带来喜悦与合作意愿。这是通过谈话、分享和相互激励打开局面的卦。', action: '安排一次坦诚且轻松的对话，说清共同好处，同时认真倾听异议。', warning: '好听的话不等于可兑现的承诺，避免讨好、流言和没有边界的乐观。', tone: 'great', tempo: 'now' },
  { number: 59, name: '涣', fullName: '风水涣', upper: '巽', lower: '坎', keywords: ['涣散', '疏通', '聚心'], meaning: '冻结的情绪、边界或结构开始松动。先把隔阂化开，再用共同核心重新聚合。', action: '打开沟通通道，简化层级与隔离，通过共同仪式或目标找回连接。', warning: '疏通不是毫无边界的扩散，保留关键核心，防止人心与资源一同流失。', tone: 'good', tempo: 'change' },
  { number: 60, name: '节', fullName: '水泽节', upper: '坎', lower: '兑', keywords: ['节制', '规则', '适度'], meaning: '清晰的限制能让资源流动得更久。这是设立时间、金钱、情绪与权责边界的时候。', action: '为关键资源定一个可执行上限，说明例外情况，经过一个周期后再评估。', warning: '过严的节制无法长久，规则必须与真实人性相容。', tone: 'good', tempo: 'steady' },
  { number: 61, name: '中孚', fullName: '风泽中孚', upper: '巽', lower: '兑', keywords: ['中实', '信任', '感化'], meaning: '内外一致会形成真正信任。当事实、言语与行动相互支持，难以跨越的距离也可能被跨越。', action: '先对自己说真话，再用可验证的行动表达承诺；让对方有安全回应的空间。', warning: '信任不是不设防，真诚也不意味着放弃核实重大信息。', tone: 'great', tempo: 'now' },
  { number: 62, name: '小过', fullName: '雷山小过', upper: '震', lower: '艮', keywords: ['小过', '低飞', '谨小'], meaning: '当下适合在小事上多做一点，不适合超越能力的大举。低一些、细一些，更容易安全通过。', action: '检查细节、备份与收尾，对小错误及时修正，把大目标拆小。', warning: '不要把小心变成琐碎控制，也不要在条件未备时强行高飞。', tone: 'balanced', tempo: 'steady' },
  { number: 63, name: '既济', fullName: '水火既济', upper: '坎', lower: '离', keywords: ['已成', '守成', '防微'], meaning: '事情已经达到一个完整状态，但完成也是新的风险起点。此时重点从开创转向维护。', action: '做好验收、备份和责任交接，修复小漏洞，为成果建立可持续运行的机制。', warning: '最危险的时候常是以为已经结束的时候，不要在收尾阶段失去敬畏。', tone: 'great', tempo: 'steady' },
  { number: 64, name: '未济', fullName: '火水未济', upper: '离', lower: '坎', keywords: ['未完', '渡济', '慎终'], meaning: '事情尚未完成，但要素已经接近对位。最后阶段需要的不是更多兴奋，而是精准与耐心。', action: '列出完成前最后三个条件，逐项确认，给最后一步留出双倍注意力。', warning: '不要因看见终点就提前庆祝，也不要因尚未完成就否定已有进展。', tone: 'balanced', tempo: 'steady' },
]

export function linesFor(hexagram: Hexagram) {
  return [...trigramLines[hexagram.lower], ...trigramLines[hexagram.upper]]
}
