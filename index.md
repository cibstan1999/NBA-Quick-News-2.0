---
layout: default
title: 首页
---

<style>
  .filter-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 25px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    align-items: center;
  }
  .filter-btn {
    padding: 6px 14px;
    border: 1px solid #ddd;
    border-radius: 20px;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  .filter-btn.active,
  .filter-btn:hover {
    background: #17408B;
    color: #fff;
    border-color: #17408B;
  }
  .team-select {
    padding: 6px 12px;
    border-radius: 20px;
    border: 1px solid #ddd;
    font-size: 14px;
    outline: none;
  }
  .post-card {
    border: 1px solid #e1e4e8;
    border-radius: 10px;
    padding: 18px;
    margin-bottom: 20px;
    background: #fff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s;
  }
  .post-card:hover {
    transform: translateY(-2px);
  }
  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .badge-cat {
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
  }
  .cat-交易-签约 { background-color: #e63946; }
  .cat-伤病-复出 { background-color: #d62828; }
  .cat-球队动态 { background-color: #17408B; }
  .cat-场外-其他 { background-color: #6c757d; }
  .post-date {
    font-size: 13px;
    color: #888;
  }
  .post-title {
    margin: 8px 0 0;
    font-size: 18px;
  }
  .post-title a {
    color: #212529;
    text-decoration: none;
  }
  .post-title a:hover {
    color: #C9082A;
  }
</style>

<h3>🏀 最新 NBA 新闻速览</h3>

<div class="filter-container">
  <strong>分类筛选：</strong>
  <button class="filter-btn active" onclick="filterPosts('all', event)">全部</button>
  <button class="filter-btn" onclick="filterPosts('cat-交易/签约', event)">交易/签约</button>
  <button class="filter-btn" onclick="filterPosts('cat-伤病/复出', event)">伤病/复出</button>
  <button class="filter-btn" onclick="filterPosts('cat-球队动态', event)">球队动态</button>
  <button class="filter-btn" onclick="filterPosts('cat-场外/其他', event)">场外/其他</button>

  <span style="margin: 0 10px; color: #ccc;">|</span>

  <strong>球队筛选：</strong>
  <select class="team-select" id="teamFilter" onchange="filterByTeam(this.value)">
    <option value="all">所有球队</option>
    <option value="老鹰">ATL 老鹰</option>
    <option value="凯尔特人">BOS 凯尔特人</option>
    <option value="篮网">BKN 篮网</option>
    <option value="黄蜂">CHA 黄蜂</option>
    <option value="公牛">CHI 公牛</option>
    <option value="骑士">CLE 骑士</option>
    <option value="独行侠">DAL 独行侠</option>
    <option value="掘金">DEN 掘金</option>
    <option value="活塞">DET 活塞</option>
    <option value="勇士">GSW 勇士</option>
    <option value="火箭">HOU 火箭</option>
    <option value="步行者">IND 步行者</option>
    <option value="快船">LAC 快船</option>
    <option value="湖人">LAL 湖人</option>
    <option value="灰熊">MEM 灰熊</option>
    <option value="热火">MIA 热火</option>
    <option value="雄鹿">MIL 雄鹿</option>
    <option value="森林狼">MIN 森林狼</option>
    <option value="鹈鹕">NOP 鹈鹕</option>
    <option value="尼克斯">NYK 尼克斯</option>
    <option value="雷霆">OKC 雷霆</option>
    <option value="魔术">ORL 魔术</option>
    <option value="76人">PHI 76人</option>
    <option value="太阳">PHX 太阳</option>
    <option value="开拓者">POR 开拓者</option>
    <option value="国王">SAC 国王</option>
    <option value="马刺">SAS 马刺</option>
    <option value="猛龙">TOR 猛龙</option>
    <option value="爵士">UTA 爵士</option>
    <option value="奇才">WAS 奇才</option>
  </select>
</div>

<div class="posts-list">
  {% for post in site.posts %}
    {% assign filter_category = '球队动态' %}
    {% assign news_type_text = post.news_type | default: '' %}
    {% assign event_type_text = post.event_type | default: '' %}

    {% if event_type_text == 'trade' or event_type_text == 'trade_rumor' or event_type_text == 'trade_discussion' or event_type_text == 'trade_request' or event_type_text == 'signing' or event_type_text == 'roster_signing' or event_type_text == 'contract_extension' or event_type_text == 'contract_signing' or event_type_text == 'sign_and_trade' or event_type_text == 'waiver' or event_type_text == 'release' or event_type_text == 'buyout' or event_type_text == 'two_way_contract' or event_type_text == 'roster_move' or event_type_text == 'coach_hiring' or event_type_text == 'staff_hiring' or news_type_text == '交易' or news_type_text == '交易传闻' or news_type_text == '交易流言' or news_type_text == '球员签约' or news_type_text == '签约' or news_type_text == '续约' or news_type_text == '合同' or news_type_text == '合同续约' or news_type_text == '裁员' or news_type_text == '阵容调整' or news_type_text == '自由市场' or news_type_text == '双向合同' or news_type_text == '买断' or news_type_text == '先签后换' or post.tags contains '交易' or post.tags contains '交易流言' or post.tags contains '交易传闻' or post.tags contains '签约' or post.tags contains '球员签约' or post.tags contains '续约' or post.tags contains '合同' or post.tags contains '合同续约' or post.tags contains '裁员' or post.tags contains '阵容调整' or post.tags contains '自由市场' or post.tags contains '双向合同' or post.tags contains '买断' or post.tags contains '先签后换' %}
      {% assign filter_category = '交易/签约' %}
    {% elsif event_type_text == 'injury' or event_type_text == 'injury_update' or event_type_text == 'return' or event_type_text == 'suspension' or event_type_text == 'surgery' or event_type_text == 'absence' or event_type_text == 'out_for_season' or news_type_text == '伤病' or news_type_text == '伤病更新' or news_type_text == '复出' or news_type_text == '停赛' or news_type_text == '手术' or news_type_text == '缺阵' or news_type_text == '赛季报销' or post.tags contains '伤病' or post.tags contains '伤病更新' or post.tags contains '复出' or post.tags contains '停赛' or post.tags contains '手术' or post.tags contains '缺阵' or post.tags contains '赛季报销' %}
      {% assign filter_category = '伤病/复出' %}
    {% elsif event_type_text == 'league_policy' or event_type_text == 'league_schedule' or event_type_text == 'legal' or event_type_text == 'business' or event_type_text == 'investigation' or event_type_text == 'discipline' or event_type_text == 'relocation' or event_type_text == 'arena' or event_type_text == 'salary_cap' or event_type_text == 'collective_bargaining' or news_type_text == '联盟动态' or news_type_text == '联盟政策' or news_type_text == '法律事务' or news_type_text == '球队经营' or news_type_text == '工资帽' or news_type_text == '调查' or news_type_text == '处罚' or news_type_text == '球馆' or news_type_text == '搬迁' or post.tags contains '法律事务' or post.tags contains '球队经营' or post.tags contains '球馆' or post.tags contains '搬迁' or post.tags contains '联盟政策' or post.tags contains '劳资协议' or post.tags contains '工资帽' or post.tags contains '调查' or post.tags contains '处罚' or post.tags contains '趋势分析' %}
      {% assign filter_category = '场外/其他' %}
    {% endif %}

    {% assign cat_class = filter_category | replace: '/', '-' %}
    <div class="post-card"
         data-category="cat-{{ filter_category }}"
         data-teams="{{ post.tags | join: ',' }}">
      <div class="post-header">
        <span class="badge-cat cat-{{ cat_class }}">
          {{ filter_category }}
        </span>
        <span class="post-date">{{ post.date | date: "%Y-%m-%d %H:%M" }}</span>
      </div>

      <h4 class="post-title">
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </h4>
    </div>
  {% endfor %}
</div>

<script>
  function filterPosts(cat, clickEvent) {
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.classList.remove('active');
    });

    if (clickEvent && clickEvent.currentTarget) {
      clickEvent.currentTarget.classList.add('active');
    }

    document.getElementById('teamFilter').value = 'all';

    document.querySelectorAll('.post-card').forEach(function (card) {
      card.style.display = (
        cat === 'all' || card.getAttribute('data-category') === cat
      ) ? 'block' : 'none';
    });
  }

  function filterByTeam(team) {
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.classList.remove('active');
    });

    const firstButton = document.querySelector('.filter-btn');
    if (firstButton) {
      firstButton.classList.add('active');
    }

    document.querySelectorAll('.post-card').forEach(function (card) {
      const teams = (card.getAttribute('data-teams') || '')
        .split(',')
        .map(function (item) { return item.trim(); });

      card.style.display = (
        team === 'all' || teams.indexOf(team) !== -1
      ) ? 'block' : 'none';
    });
  }
</script>
