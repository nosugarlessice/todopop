/* todopop.app in English and Chinese. English is what's written in index.html; this holds the Chinese,
   swaps it in and out, and gives the other scripts T() for the words they write themselves. */
(() => {
  const LOGO = 'T<span class="o"></span>D<span class="o"></span>P<span class="o"></span>P';
  const CZ = '<a class="md cz" href="https://cindyzhao.design" target="_blank" rel="noopener">Cindy Zhao</a>';

  // [selector, Chinese HTML (or a list, one per match)]
  const PAGE = [
    ['.nav a[href="#how"]', '怎么用'],
    ['.nav a[href="#phone"]', '手机'],
    ['.nav a.get', '下载'],
    ['#hero-title', 'TODOPOP：一个让你根本没法忽视的待办清单'],
    ['.o-notes .hint > span', '*点点看<br><span style="white-space:nowrap">logo 上的三个 O！</span>'],
    ['.o-note .tx', ['新建任务', '查看进度', '个性化']],
    ['.tagline', '一个让你根本没法忽视的待办清单'],
    ['#hero-btns [data-os="mac"] .tx', '下载 Mac 版'],
    ['#hero-btns [data-os="win"] .tx', '下载 Windows 版'],
    ['#hero-meta', '免费 · 无需注册 · 无广告'],
    ['.bubble-hint b', '*和这些任务泡泡玩一玩！'],
    ['.bubble-hint li', ['拖动换位置', '右键编辑', '单击进入专注模式', '双击戳破，标记完成']],

    ['#story-title', `<span class="bk">(</span>${CZ}<span class="bk">)</span> 的作品`],
    ['.collab', '*与 <span class="bk">(</span><span class="md">Melody Chen</span><span class="bk">)</span><br>合作完成'],
    ['.who .tx', '她：'],
    ['#why1', '看不见的事，<br>她就不会去做'],
    ['#why2', '对截止日期视而不见，<br>还心安理得'],
    ['#why3', '没做完的任务，<br>就随它去了'],
    ['#solves', '<span class="md">TODOPOP</span> 解决了我的问题，<br>因为它的任务泡泡：'],
    ['.feat h3', ['永远浮在最上层', '随时间长大', '绝不清空任务']],
    ['.feat .card > p', ['一直浮在你正在用的窗口上方——不会藏在关掉的 App 里。', '截止日期越近，泡泡越大，温柔地制造一点视觉压力。', '没戳破的泡泡会一直留在屏幕上——没有“过了午夜就清零”这种借口。']],
    ['#feat1 .fb', ['习题集 4<small>马上！</small>', '回邮件<small>今天</small>', '洗衣服<small>快了</small>']],

    ['#q-title', 'Cindy，Cindy，<br>如果我要 lock in 了，<br>可任务泡泡已经霸占了整个屏幕呢？'],
    ['#focus .a .tx', '点这里'],
    ['#get-in', '钻进泡泡'],
    ['#screen .scr-win .bar', '<i></i><i></i><i></i>&nbsp;论文草稿 — Docs'],
    ['#screen .scr-bar em', '论文草稿'],
    ['#scr-step', '+ 步骤'],
    ['#scr-done', '完成，戳破！'],
    ['#focus .body p', ['<b>单击泡泡，进入专注模式。</b>其他一切都会消失，专注计时器开始走，你还可以把大项目拆成一个个好消化的小步骤。',
      '故意设计得有那么一点不方便，刚好够打断拖延的循环。关掉多余的标签页，给我 lock tf in。']],

    ['#more-title', '更多功能'],
    ['.feats li span', ['颜色分组', '贴到屏幕边缘', '附加链接', '暂停生长', '恢复初始大小']],
    ['.pill.over', '手机当遥控器！'],
    ['.remote .lead', '在公交车上突然想起一件事，<br>手边却没有键盘？'],
    ['.remote p:not(.lead)', '任务清单随身带着，用手机随时添加新任务。你还没进家门，新任务已经飘在你的电脑上了。'],
    ['.tut h3', '安装 + 配对教程：'],
    ['.tut .btns a', ['在 iPhone 上使用', '下载安卓版 <small>.apk</small>']],
    ['.tut li:nth-child(2) > span:last-child', '在电脑上打开 TODOPOP，点第三个 O，再点 <b>[Get the phone app]</b>，屏幕上就会出现一个二维码'],
    ['.tut li:nth-child(3) > span:last-child', '在手机上打开 TODOPOP，点 <b>[Scan code]</b>，对准电脑屏幕扫一下。'],
    ['.tut .fine', '*配对不需要注册账号，也不用留邮箱或手机号。想知道是怎么做到的，请看本站底部的 <a href="#privacy"><b>[隐私]</b></a> 部分'],

    ['#dl-title', `获取 <span class="logo" aria-label="TODOPOP">${LOGO}</span>`],
    ['.dl .btns a', ['下载 Windows 版 <small>.exe</small>', '下载 Mac 版 <small>.dmg</small>']],
    ['.dl .meta', 'Windows 10 和 11（64 位）· macOS · <a href="https://github.com/nosugarlessice/todopop/releases">所有版本</a>'],
    ['.first .cap', '第一次打开时'],
    ['.first details', [
      `<summary>Windows 提示“Windows 已保护你的电脑”</summary><ol>
        <li>这是因为 TODOPOP 还很新，还没有微软的签名。你下载的文件没有任何问题。</li>
        <li>点<b>更多信息</b>，再点<b>仍要运行</b>，TODOPOP 就会安装并打开。</li>
        <li>这个提示只会出现一次。</li></ol>`,
      `<summary>Mac 提示 TODOPOP “无法打开”或“Apple 无法验证”</summary><ol>
        <li>打开下载好的 <b>TODOPOP-mac.dmg</b>，把 <b>TODOPOP</b> 拖进<b>应用程序</b>。</li>
        <li>从“应用程序”里打开 TODOPOP。如果 macOS 拦住了它，点<b>完成</b>。</li>
        <li>打开<b>系统设置 → 隐私与安全性</b>，往下滚，点 TODOPOP 旁边的<b>仍要打开</b>，再输入密码确认。</li>
        <li>TODOPOP 住在屏幕顶部的菜单栏里，不在程序坞里。这一步只需要做一次。</li></ol>`,
      `<summary>安卓在安装 TODOPOP 前会先问你</summary><ol>
        <li>从通知栏或<b>下载</b>里打开下载好的 <b>TODOPOP-android.apk</b>。</li>
        <li>如果安卓说你的浏览器不能安装应用，点<b>设置</b>，打开<b>允许来自此来源的应用</b>，再返回。</li>
        <li>点<b>安装</b>。如果 Play 保护机制提示这是未知应用，点<b>更多详情 → 仍然安装</b>。它还很新，Google 还没见过它。</li></ol>`]],

    ['#priv-title', '隐私'],
    ['.priv-head > span', '你的清单只属于你。'],
    ['.priv > div', [
      '<h3>无需账号</h3><p>不用注册，不用邮箱，不用密码。<br>打开 App 就能开始吹泡泡。</p>',
      '<h3>只留在你的电脑上</h3><p>不连手机的话，你的任务永远不会离开你的电脑。</p>',
      '<h3>私密同步</h3><p>连上手机后，清单通过 Supabase 同步，锁在一个只有你自己的设备才知道的私密代码上。本产品和本网站没有广告，也没有任何追踪。</p>']],

    ['footer nav a', ['下载', '手机 App', 'GitHub']],
    ['#fb-done', '完成，戳破！'],
  ];
  const ATTRS = [ // [selector, attribute, Chinese]
    ['#device img', 'alt', 'TODOPOP 手机 App：漂浮中的任务排成一个列表，底部是暂停、一个大加号和已戳破。'],
    ['#fb-exit', 'aria-label', '离开泡泡（Esc）'], ['#fb-exit', 'title', '离开泡泡（Esc）'],
    ['#focus-bar .grip', 'title', '拖动来移动这个栏'],
    ['.big .o[data-o="0"]', 'aria-label', '新建任务'], ['.big .o[data-o="1"]', 'aria-label', '查看进度'], ['.big .o[data-o="2"]', 'aria-label', '个性化'],
    ['.navlogo', 'aria-label', 'TODOPOP，回到顶部'], ['#foot-logo', 'aria-label', 'TODOPOP，重新开始'],
  ];

  // words the scripts write themselves
  const WORDS = {
    'Get the Android app': '下载安卓 App', 'Get on iPhone': '在 iPhone 上使用',
    'Free · No Sign-up · No ads · The bubbles float on your computer; your phone is the remote.': '免费 · 无需注册 · 无广告 · 泡泡飘在你的电脑上，手机就是遥控器。',
    'REMIND': '提醒', 'SOON': '快了', 'TODAY': '今天', 'NOW!': '马上！',
    'Just a reminder': '只是提醒', 'Soon': '快了', 'Today': '今天', 'Super urgent': '超级紧急',
    'School': '学校', 'Work': '工作', 'Home': '家', 'Health': '健康', 'No group': '不分组',
    'Blow a bubble': '吹一个泡泡', 'Task name': '任务名称', 'e.g. Send the team the Figma link': '比如：把 Figma 链接发给组员',
    'Urgency': '紧急程度', 'Group': '分组', 'Blow it': '吹出来', 'Close': '关闭',
    'Popped': '已戳破', 'Week': '周', 'Month': '月', 'Earlier': '往前', 'Later': '往后', 'View': '视图',
    'Nothing popped on this page yet. Double-click a bubble to pop it, and it lands in today.': '这一页还没有戳破任何泡泡。双击一个泡泡把它戳破，它就会出现在今天。',
    'Days before today are a sample history, to show what a few weeks of popping looks like.': '今天之前的记录是示例，让你看看用上几周之后是什么样子。',
    'Your color': '你的颜色',
    'The whole page and every bubble follow your color. In the app you can pick any color at all, and your groups’ colors shift to match it.': '整个页面和每个泡泡都会跟着你的颜色变。在 App 里你可以选任何颜色，分组的颜色也会跟着调整。',
    'Edit bubble': '编辑泡泡', 'Get in the bubble': '钻进泡泡', 'Delete': '删除', 'Cancel': '取消', 'Save': '保存', 'Shrink back to starting size': '缩回初始大小',
    'Essay draft': '论文草稿', 'Reply to emails': '回邮件', 'Laundry': '洗衣服', 'Read ch. 7': '读第 7 章',
    'Outline': '列提纲', 'Find 3 sources': '找 3 篇文献', 'Draft intro': '写开头',
    // the floating bubbles, and the sample history
    'Problem set 4': '习题集 4', 'Figma critique': 'Figma 评图', 'Water the pothos': '给绿萝浇水', 'Book dentist': '约牙医',
    'Portfolio review': '作品集评审', 'Call mom': '给妈妈打电话', 'Drink water': '喝水', 'Pay rent': '交房租', 'Gym': '去健身',
    'Email the landlord': '给房东发邮件', 'Groceries': '买菜', 'Return library books': '还图书馆的书', 'Taxes': '报税',
    'Problem set 3': '习题集 3', 'Reading response': '阅读反馈', 'Email TA': '给助教发邮件', 'Studio crit prep': '准备评图', 'Print posters': '打印海报',
    'Send invoice': '发账单', 'Update portfolio': '更新作品集', 'Clean desk': '收拾桌面', 'Return library book': '还图书馆的书',
  };

  let lang = 'en';
  const saved = (() => { try{ return localStorage.getItem('tp-lang'); }catch(e){ return null; } })();
  const want = /[?&]lang=zh/.test(location.search) ? 'zh' : /[?&]lang=en/.test(location.search) ? 'en'
    : saved || (/^zh\b/i.test(navigator.language || '') ? 'zh' : 'en');

  const T = s => lang === 'zh' && WORDS[s] != null ? WORDS[s] : s;
  const listeners = [];
  function apply(l){
    lang = l === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    for(const [sel, zh] of PAGE){
      document.querySelectorAll(sel).forEach((el, i) => {
        if(el.dataset.en == null) el.dataset.en = el.innerHTML;
        const z = Array.isArray(zh) ? zh[i] : zh; if(z == null) return;
        el.innerHTML = lang === 'zh' ? z : el.dataset.en;
      });
    }
    for(const [sel, attr, zh] of ATTRS){
      document.querySelectorAll(sel).forEach(el => { const k = 'en' + attr.replace(/[^a-z]/gi, ''); if(el.dataset[k] == null) el.dataset[k] = el.getAttribute(attr) || ''; el.setAttribute(attr, lang === 'zh' ? zh : el.dataset[k]); });
    }
    document.title = lang === 'zh' ? 'TODOPOP · 一个让你根本没法忽视的待办清单' : 'TODOPOP · A todo list that just can’t be ignored';
    listeners.forEach(f => f(lang));
  }
  window.I18N = { T, get lang(){ return lang; }, onChange: f => listeners.push(f),
    set(l){ try{ localStorage.setItem('tp-lang', l); }catch(e){} apply(l); } };

  // the page is parsed by the time this runs (it's at the end of <body>)
  if(want === 'zh') apply('zh'); else document.documentElement.lang = 'en';
  document.getElementById('lang')?.addEventListener('click', () => window.I18N.set(lang === 'zh' ? 'en' : 'zh'));
})();
