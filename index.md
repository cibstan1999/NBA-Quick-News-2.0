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
  .filter-btn.active, .filter-btn:hover {
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
    box-shadow: 0 2px 5px rgba(0,0,0,0.03);
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
  .post-tags {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .badge-cat {
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
  }
  .cat-交易-签约 { background-color: #e63946; }
  .cat-伤病官宣 { background-color: #d62828; }
  .cat-球队动态 { background-color: #17408B; }
  .cat-场外-其他 { background-color: #6c757d; }
  
  .badge-team {
    background: #e9ecef;
    color: #495057;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  .post-date {
    font-size: 13px;
    color: #888;
  }
  .post-title {
    margin: 8px 0 12px 0;
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
  <button class="filter-btn active" onclick="filterPosts('all')">全部</button>
  <button class="filter-btn" onclick="filterPosts('cat-交易/签约')">交易/签约</button>
  <button class="filter-btn" onclick="filterPosts('cat-伤病官宣')">伤病官宣</button>
  <button class="filter-btn" onclick="filterPosts('cat-球队动态')">球队动态</button>
  <button class="filter-btn" onclick="filterPosts('cat-场外/其他')">场外/其他</button>
  
  <span style="margin: 0 10px; color:#ccc;">|</span>
  
  <strong>球队筛选：</strong>
  <select class="team-select" id="teamFilter" onchange="filterByTeam(this.value)">
    <option value="all">所有球队</option>
    <option value="LAL">LAL 湖人</option>
    <option value="GSW">GSW 勇士</option>
    <option value="BOS">BOS 凯尔特人</option>
    <option value="PHX">PHX 太阳</option>
    <option value="LAC">LAC 快船</option>
    <option value="MIL">MIL 雄鹿</option>
    <option value="DAL">DAL 独行侠</option>
    <option value="DEN">DEN 掘金</option>
    <option value="PHI">PHI 76人</option>
    <option value="MIA">MIA 热火</option>
    <option value="NYK">NYK 尼克斯</option>
    <option value="OKC">OKC 雷霆</option>
    <option value="MIN">MIN 森林狼</option>
  </select>
</div>

<div class="posts-list">
  {% for post in site.posts %}
    {% assign cat_class = post.category | replace: '/', '-' | default: '球队动态' %}
    <div class="post-card" 
         data-category="cat-{{ post.category }}" 
         data-teams="{{ post.tags | join: ',' }}">
      
      <div class="post-header">
        <div class="post-tags">
          <span class="badge-cat cat-{{ cat_class }}">
            {{ post.category | default: "球队动态" }}
          </span>
          
          {% for tag in post.tags %}
            <span class="badge-team">{{ tag }}</span>
          {% endfor %}
        </div>
        
        <span class="post-date">{{ post.date | date: "%Y-%m-%d %H:%M" }}</span>
      </div>

      <h4 class="post-title">
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </h4>
    </div>
  {% endfor %}
</div>

<script>
  function filterPosts(cat) {
    // 切换按钮高亮样式
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // 重置球队下拉框
    document.getElementById('teamFilter').value = 'all';

    const cards = document.querySelectorAll('.post-card');
    cards.forEach(card => {
      if (cat === 'all' || card.getAttribute('data-category') === cat) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  function filterByTeam(team) {
    // 重置分类按钮
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn').classList.add('active');

    const cards = document.querySelectorAll('.post-card');
    cards.forEach(card => {
      const teams = card.getAttribute('data-teams') || '';
      if (team === 'all' || teams.includes(team)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }
</script>
