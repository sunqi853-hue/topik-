const vocab = window.TOPIK_VOCAB || [];
const audioBase = window.TOPIK_AUDIO_BASE || {};
const releaseAudioBase = window.TOPIK_AUDIO_RELEASE_BASE || 'https://github.com/sunqi853-hue/topik-/releases/download/v1.0/';
const state = {
  level: '全部', unit: '全部', pos: '全部', query: '', index: 0,
  hideMeaning: false, favoritesOnly: false, unmasteredOnly: false,
  favorites: new Set(JSON.parse(localStorage.getItem('topikFavorites') || '[]')),
  mastered: new Set(JSON.parse(localStorage.getItem('topikMastered') || '[]')),
};
const $ = (id) => document.getElementById(id);
const levels = ['全部','初级','中级','高级'];
const els = {
  summary: $('summaryText'), search: $('searchInput'), levelTabs: $('levelTabs'), unit: $('unitSelect'), pos: $('posSelect'),
  unitAudio: $('unitAudio'), unitAudioBtn: $('unitAudioBtn'), hide: $('hideMeaningToggle'), favOnly: $('favoritesOnlyToggle'), unmasteredOnly: $('unmasteredOnlyToggle'),
  filterLabel: $('filterLabel'), currentWord: $('currentWord'), cardWord: $('cardWord'), cardNote: $('cardNote'), cardMeaning: $('cardMeaning'), cardPos: $('cardPos'), cardLevelUnit: $('cardLevelUnit'), cardPage: $('cardPage'),
  speak: $('speakBtn'), reveal: $('revealBtn'), favorite: $('favoriteBtn'), master: $('masterBtn'), shuffle: $('shuffleBtn'), quickShuffle: $('quickShuffleBtn'), prev: $('prevBtn'), next: $('nextBtn'), count: $('countText'), list: $('wordList')
};
function saveSet(key, set) { localStorage.setItem(key, JSON.stringify([...set])); }
function audioUrl(level, unit) {
  if (audioBase[level]) return encodeURI(audioBase[level] + 'UNIT ' + unit + '.mp3');
  const fileName = level + '-UNIT-' + unit + '.mp3';
  return releaseAudioBase + encodeURIComponent(fileName);
}
function unitOptions() {
  els.unit.innerHTML = '';
  const opts = ['全部'];
  if (state.level !== '全部') for (let i=1;i<=20;i++) opts.push(String(i));
  opts.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v === '全部' ? '全部 UNIT' : 'UNIT ' + v; els.unit.appendChild(o); });
  if (!opts.includes(state.unit)) state.unit = '全部';
  els.unit.value = state.unit;
}
function posOptions() {
  const current = state.pos;
  const positions = ['全部', ...new Set(vocab.map(v=>v.pos).filter(Boolean).sort((a,b)=>a.localeCompare(b,'zh-CN')))]
  els.pos.innerHTML = '';
  positions.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v === '全部' ? '全部词性' : v; els.pos.appendChild(o); });
  state.pos = positions.includes(current) ? current : '全部';
  els.pos.value = state.pos;
}
function filtered() {
  const q = state.query.trim().toLowerCase();
  return vocab.filter(v => {
    if (state.level !== '全部' && v.level !== state.level) return false;
    if (state.unit !== '全部' && String(v.unit) !== state.unit) return false;
    if (state.pos !== '全部' && v.pos !== state.pos) return false;
    if (state.favoritesOnly && !state.favorites.has(v.id)) return false;
    if (state.unmasteredOnly && state.mastered.has(v.id)) return false;
    if (q) {
      const hay = [v.word, v.note, v.pos, v.meaning, v.level, 'unit '+v.unit, String(v.page)].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
function setAudio(entry) {
  const level = state.level !== '全部' ? state.level : entry?.level;
  const unit = state.unit !== '全部' ? state.unit : entry?.unit;
  if (!level || !unit) { els.unitAudio.removeAttribute('src'); els.unitAudio.load(); return; }
  const src = audioUrl(level, unit);
  if (els.unitAudio.getAttribute('src') !== src) els.unitAudio.src = src;
}
function renderLevelTabs() {
  els.levelTabs.innerHTML = '';
  levels.forEach(level => {
    const btn = document.createElement('button');
    btn.textContent = level;
    btn.className = level === state.level ? 'active' : '';
    btn.addEventListener('click', () => { state.level = level; state.unit = '全部'; state.index = 0; render(); });
    els.levelTabs.appendChild(btn);
  });
}
function current(list) { return list[Math.min(state.index, Math.max(0, list.length - 1))]; }
function renderCard(list) {
  if (!list.length) {
    ['currentWord','cardWord','cardNote','cardMeaning','cardPos','cardLevelUnit','cardPage'].forEach(id => $(id).textContent = '');
    els.cardMeaning.textContent = '没有符合条件的词条';
    return;
  }
  const v = current(list);
  state.index = list.indexOf(v);
  els.currentWord.textContent = v.word;
  els.cardWord.textContent = v.word;
  els.cardNote.textContent = v.note ? v.note : ' ';
  els.cardMeaning.textContent = v.meaning;
  els.cardMeaning.classList.toggle('hidden', state.hideMeaning);
  els.cardPos.textContent = v.pos || '词性未标注';
  els.cardLevelUnit.textContent = v.level + ' · UNIT ' + v.unit;
  els.cardPage.textContent = '页码 ' + v.page;
  els.reveal.textContent = state.hideMeaning ? '显示释义' : '隐藏释义';
  els.favorite.classList.toggle('active', state.favorites.has(v.id));
  els.master.classList.toggle('active', state.mastered.has(v.id));
  els.master.classList.add('warn');
}
function renderList(list) {
  els.count.textContent = list.length + ' 个词';
  els.list.innerHTML = '';
  if (!list.length) { els.list.innerHTML = '<div class="empty">换个筛选条件试试。</div>'; return; }
  const frag = document.createDocumentFragment();
  list.slice(0, 600).forEach((v, i) => {
    const row = document.createElement('button');
    row.className = 'word-row' + (i === state.index ? ' active' : '');
    row.innerHTML = '<span class="word"></span><span class="meaning-cell"></span><span class="tags"></span>';
    row.querySelector('.word').textContent = v.word;
    row.querySelector('.meaning-cell').textContent = v.meaning;
    row.querySelector('.tags').textContent = v.level + ' U' + v.unit + (state.favorites.has(v.id) ? ' · 收藏' : '') + (state.mastered.has(v.id) ? ' · 已掌握' : '');
    row.addEventListener('click', () => { state.index = i; renderCard(list); renderList(list); });
    frag.appendChild(row);
  });
  if (list.length > 600) {
    const more = document.createElement('div'); more.className = 'empty'; more.textContent = '当前只显示前 600 个，继续输入关键词可以缩小范围。'; frag.appendChild(more);
  }
  els.list.appendChild(frag);
}
function render() {
  renderLevelTabs(); unitOptions(); posOptions();
  const list = filtered();
  if (state.index >= list.length) state.index = Math.max(0, list.length - 1);
  setAudio(current(list));
  const parts = [state.level, state.unit === '全部' ? '全部 UNIT' : 'UNIT ' + state.unit, state.pos === '全部' ? '全部词性' : state.pos];
  els.filterLabel.textContent = parts.join(' / ');
  els.summary.textContent = vocab.length + ' 个词 · 初级 883 · 中级 809 · 高级 873';
  renderCard(list); renderList(list);
}
function shuffleWord() {
  const list = filtered();
  if (!list.length) return;
  state.index = Math.floor(Math.random() * list.length);
  render();
}
function speakWord() {
  const list = filtered(); const v = current(list); if (!v || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(v.word);
  u.lang = 'ko-KR'; u.rate = 0.82;
  window.speechSynthesis.speak(u);
}
els.search.addEventListener('input', e => { state.query = e.target.value; state.index = 0; render(); });
els.unit.addEventListener('change', e => { state.unit = e.target.value; state.index = 0; render(); });
els.pos.addEventListener('change', e => { state.pos = e.target.value; state.index = 0; render(); });
els.hide.addEventListener('change', e => { state.hideMeaning = e.target.checked; render(); });
els.favOnly.addEventListener('change', e => { state.favoritesOnly = e.target.checked; state.index = 0; render(); });
els.unmasteredOnly.addEventListener('change', e => { state.unmasteredOnly = e.target.checked; state.index = 0; render(); });
els.unitAudioBtn.addEventListener('click', () => { if (!els.unitAudio.src) return; els.unitAudio.paused ? els.unitAudio.play() : els.unitAudio.pause(); });
els.shuffle.addEventListener('click', shuffleWord);
els.quickShuffle.addEventListener('click', shuffleWord);
els.prev.addEventListener('click', () => { const list=filtered(); if(!list.length)return; state.index=(state.index-1+list.length)%list.length; render(); });
els.next.addEventListener('click', () => { const list=filtered(); if(!list.length)return; state.index=(state.index+1)%list.length; render(); });
els.speak.addEventListener('click', speakWord);
els.reveal.addEventListener('click', () => { state.hideMeaning = !state.hideMeaning; els.hide.checked = state.hideMeaning; render(); });
els.favorite.addEventListener('click', () => { const v=current(filtered()); if(!v)return; state.favorites.has(v.id) ? state.favorites.delete(v.id) : state.favorites.add(v.id); saveSet('topikFavorites', state.favorites); render(); });
els.master.addEventListener('click', () => { const v=current(filtered()); if(!v)return; state.mastered.has(v.id) ? state.mastered.delete(v.id) : state.mastered.add(v.id); saveSet('topikMastered', state.mastered); render(); });
document.addEventListener('keydown', e => {
  if (['INPUT','SELECT'].includes(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') els.next.click();
  if (e.key === 'ArrowLeft') els.prev.click();
  if (e.key === ' ') { e.preventDefault(); els.reveal.click(); }
  if (e.key.toLowerCase() === 'r') speakWord();
});
render();
