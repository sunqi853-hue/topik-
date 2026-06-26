const vocab = window.TOPIK_VOCAB || [];
const state = {
  level: '全部', unit: '全部', pos: '全部', query: '', index: 0, isComposing: false,
  hideMeaning: false, favoritesOnly: false, unmasteredOnly: false, spellingMode: false,
  favorites: new Set(JSON.parse(localStorage.getItem('topikFavorites') || '[]')),
  mastered: new Set(JSON.parse(localStorage.getItem('topikMastered') || '[]')),
  spellingWrong: new Set(JSON.parse(localStorage.getItem('topikSpellingWrong') || '[]')),
};
const studyCount = JSON.parse(localStorage.getItem('topikStudyCount') || '{}');
const $ = (id) => document.getElementById(id);
const levels = ['全部','初级','中级','高级'];
const els = {
  summary: $('summaryText'), search: $('searchInput'), levelTabs: $('levelTabs'), unit: $('unitSelect'), pos: $('posSelect'),
  studyCount: $('studyCountText'), hide: $('hideMeaningToggle'), favOnly: $('favoritesOnlyToggle'), unmasteredOnly: $('unmasteredOnlyToggle'),
  filterLabel: $('filterLabel'), currentWord: $('currentWord'), cardWord: $('cardWord'), cardNote: $('cardNote'), cardMeaning: $('cardMeaning'), cardPos: $('cardPos'), cardLevelUnit: $('cardLevelUnit'), cardPage: $('cardPage'),
  speak: $('speakBtn'), slowSpeak: $('slowSpeakBtn'), reveal: $('revealBtn'), spellMode: $('spellModeBtn'), favorite: $('favoriteBtn'), master: $('masterBtn'), shuffle: $('shuffleBtn'), quickShuffle: $('quickShuffleBtn'), prev: $('prevBtn'), next: $('nextBtn'), count: $('countText'), list: $('wordList'),
  spellingPanel: $('spellingPanel'), spellingInput: $('spellingInput'), spellingFeedback: $('spellingFeedback'), checkSpelling: $('checkSpellingBtn'), hintSpelling: $('hintSpellingBtn'), showAnswer: $('showAnswerBtn')
};
function saveSet(key, set) { localStorage.setItem(key, JSON.stringify([...set])); }
function saveStudyCount() { localStorage.setItem('topikStudyCount', JSON.stringify(studyCount)); }
function normalizeSearchText(text) {
  return String(text || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}
function normalizeKoreanAnswer(text) {
  return String(text || '').replace(/\s+/g, '').trim();
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
  const q = normalizeSearchText(state.query);
  const qCompact = q.replace(/\s+/g, '');
  return vocab.filter(v => {
    if (state.level !== '全部' && v.level !== state.level) return false;
    if (state.unit !== '全部' && String(v.unit) !== state.unit) return false;
    if (state.pos !== '全部' && v.pos !== state.pos) return false;
    if (state.favoritesOnly && !state.favorites.has(v.id)) return false;
    if (state.unmasteredOnly && state.mastered.has(v.id)) return false;
    if (q) {
      const hay = normalizeSearchText([v.word, v.note, v.pos, v.meaning, v.level, 'unit '+v.unit, String(v.page)].join(' '));
      const hayCompact = hay.replace(/\s+/g, '');
      if (!hay.includes(q) && !hayCompact.includes(qCompact)) return false;
    }
    return true;
  });
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
    els.studyCount.textContent = '学习次数：—';
    return;
  }
  const v = current(list);
  state.index = list.indexOf(v);
  studyCount[v.id] = (studyCount[v.id] || 0) + 1;
  saveStudyCount();
  els.studyCount.textContent = '学习次数：' + studyCount[v.id] + ' 次';
  els.currentWord.textContent = v.word;
  els.cardWord.textContent = state.spellingMode ? '拼写练习' : v.word;
  els.cardNote.textContent = v.note ? v.note : ' ';
  els.cardMeaning.textContent = v.meaning;
  els.cardMeaning.classList.toggle('hidden', state.hideMeaning && !state.spellingMode);
  els.cardPos.textContent = v.pos || '词性未标注';
  els.cardLevelUnit.textContent = v.level + ' · UNIT ' + v.unit;
  els.cardPage.textContent = '页码 ' + v.page;
  els.reveal.textContent = state.hideMeaning ? '显示释义' : '隐藏释义';
  els.spellMode.textContent = state.spellingMode ? '退出拼写' : '拼写';
  els.spellMode.classList.toggle('active', state.spellingMode);
  els.spellingPanel.classList.toggle('active', state.spellingMode);
  if (state.spellingMode) {
    els.spellingInput.value = '';
    els.spellingFeedback.textContent = '看中文释义，输入对应韩文；可以点“朗读”或“慢速”听发音。';
    els.spellingFeedback.className = 'spelling-feedback';
  }
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
function pickKoreanVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.lang === 'ko-KR') || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ko')) || null;
}
function slowSpeechText(text) {
  return Array.from(String(text || '').trim()).join(' ');
}
function speakWord(rate = 0.82, slow = false) {
  const list = filtered(); const v = current(list); if (!v || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(slow ? slowSpeechText(v.word) : v.word);
  u.lang = 'ko-KR'; u.rate = slow ? 0.42 : rate; u.pitch = 1; u.volume = 1;
  const voice = pickKoreanVoice();
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
function checkSpelling() {
  const list = filtered(); const v = current(list); if (!v) return;
  const answer = normalizeKoreanAnswer(v.word);
  const typed = normalizeKoreanAnswer(els.spellingInput.value);
  if (!typed) {
    els.spellingFeedback.textContent = '先输入韩文，再点击检查。';
    els.spellingFeedback.className = 'spelling-feedback';
    return;
  }
  if (typed === answer) {
    els.spellingFeedback.textContent = '正确！这个词已经记住一半了。';
    els.spellingFeedback.className = 'spelling-feedback ok';
    state.spellingWrong.delete(v.id);
    saveSet('topikSpellingWrong', state.spellingWrong);
  } else {
    els.spellingFeedback.textContent = '还不对，注意空格、收音和音节顺序。';
    els.spellingFeedback.className = 'spelling-feedback bad';
    state.spellingWrong.add(v.id);
    saveSet('topikSpellingWrong', state.spellingWrong);
  }
}
function hintSpelling() {
  const list = filtered(); const v = current(list); if (!v) return;
  const compact = normalizeKoreanAnswer(v.word);
  els.spellingFeedback.textContent = compact ? '提示：第一个字是「' + compact[0] + '」，共 ' + compact.length + ' 个字符。' : '这个词暂时没有可用提示。';
  els.spellingFeedback.className = 'spelling-feedback hint';
}
function showSpellingAnswer() {
  const list = filtered(); const v = current(list); if (!v) return;
  els.spellingFeedback.textContent = '答案：' + v.word;
  els.spellingFeedback.className = 'spelling-feedback hint';
}
els.search.addEventListener('compositionstart', () => { state.isComposing = true; });
els.search.addEventListener('compositionend', e => { state.isComposing = false; state.query = e.target.value; state.index = 0; render(); });
els.search.addEventListener('input', e => { if (state.isComposing) return; state.query = e.target.value; state.index = 0; render(); });
els.search.addEventListener('search', e => { state.query = e.target.value; state.index = 0; render(); });
els.search.addEventListener('change', e => { state.query = e.target.value; state.index = 0; render(); });
els.search.addEventListener('keyup', e => { state.query = e.target.value; state.index = 0; render(); });
els.unit.addEventListener('change', e => { state.unit = e.target.value; state.index = 0; render(); });
els.pos.addEventListener('change', e => { state.pos = e.target.value; state.index = 0; render(); });
els.hide.addEventListener('change', e => { state.hideMeaning = e.target.checked; render(); });
els.favOnly.addEventListener('change', e => { state.favoritesOnly = e.target.checked; state.index = 0; render(); });
els.unmasteredOnly.addEventListener('change', e => { state.unmasteredOnly = e.target.checked; state.index = 0; render(); });
els.shuffle.addEventListener('click', shuffleWord);
els.quickShuffle.addEventListener('click', shuffleWord);
els.prev.addEventListener('click', () => { const list=filtered(); if(!list.length)return; state.index=(state.index-1+list.length)%list.length; render(); });
els.next.addEventListener('click', () => { const list=filtered(); if(!list.length)return; state.index=(state.index+1)%list.length; render(); });
els.speak.addEventListener('click', () => speakWord(0.82));
els.slowSpeak.addEventListener('click', () => speakWord(0.42, true));
els.reveal.addEventListener('click', () => { state.hideMeaning = !state.hideMeaning; els.hide.checked = state.hideMeaning; render(); });
els.spellMode.addEventListener('click', () => { state.spellingMode = !state.spellingMode; state.hideMeaning = false; els.hide.checked = false; render(); if (state.spellingMode) els.spellingInput.focus(); });
els.checkSpelling.addEventListener('click', checkSpelling);
els.hintSpelling.addEventListener('click', hintSpelling);
els.showAnswer.addEventListener('click', showSpellingAnswer);
els.spellingInput.addEventListener('keydown', e => { if (e.key === 'Enter') checkSpelling(); });
els.favorite.addEventListener('click', () => { const v=current(filtered()); if(!v)return; state.favorites.has(v.id) ? state.favorites.delete(v.id) : state.favorites.add(v.id); saveSet('topikFavorites', state.favorites); render(); });
els.master.addEventListener('click', () => { const v=current(filtered()); if(!v)return; state.mastered.has(v.id) ? state.mastered.delete(v.id) : state.mastered.add(v.id); saveSet('topikMastered', state.mastered); render(); });
document.addEventListener('keydown', e => {
  if (['INPUT','SELECT'].includes(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') els.next.click();
  if (e.key === 'ArrowLeft') els.prev.click();
  if (e.key === ' ') { e.preventDefault(); els.reveal.click(); }
  if (e.key.toLowerCase() === 'r') speakWord(0.82);
});
if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = pickKoreanVoice;
render();
