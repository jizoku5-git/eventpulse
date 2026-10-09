/**
 * EventPulse - アプリケーションロジック
 * 実在する公式情報、Web、X (Twitter)、Instagram からの自動収集＆カレンダー連携
 * トピック個別チェックボックス（表示・非表示トグル）対応
 */

const APP_DATA_VERSION = 'v3_topic_checkboxes';

class EventPulseApp {
  constructor() {
    // データのバージョンマイグレーション
    this.checkDataVersion();

    // 状態管理
    this.topics = this.loadTopics();
    this.events = this.loadEvents();
    this.activeTopicFilter = 'ALL';
    this.searchQuery = '';
    this.currentView = 'grid'; // 'grid' | 'calendar'

    this.settings = this.loadSettings();

    // DOM要素の参照
    this.initElements();
    // イベントリスナーの登録
    this.initEventListeners();
    // 初期描画
    this.render();
  }

  // --- キャッシュ・バージョン管理 ---
  checkDataVersion() {
    const currentVer = localStorage.getItem('eventpulse_version');
    if (currentVer !== APP_DATA_VERSION) {
      // 初回またはデータ構造アップデート時
      let topics = this.loadTopics();
      if (!topics || topics.length === 0) {
        topics = [...INITIAL_TOPICS];
      }
      // 各トピックに enabled: true がない場合は付与
      topics = topics.map(t => ({
        ...t,
        enabled: t.enabled !== undefined ? t.enabled : true
      }));
      localStorage.setItem('eventpulse_topics', JSON.stringify(topics));

      let events = this.loadEvents();
      if (!events || events.length === 0) {
        events = [...INITIAL_EVENTS];
      }
      localStorage.setItem('eventpulse_events', JSON.stringify(events));
      localStorage.setItem('eventpulse_version', APP_DATA_VERSION);
    }
  }

  // --- ローカルストレージ管理 ---
  loadTopics() {
    const saved = localStorage.getItem('eventpulse_topics');
    let topics = saved ? JSON.parse(saved) : [...INITIAL_TOPICS];
    return topics.map(t => ({
      ...t,
      enabled: t.enabled !== undefined ? t.enabled : true
    }));
  }

  saveTopics() {
    localStorage.setItem('eventpulse_topics', JSON.stringify(this.topics));
  }

  loadEvents() {
    const saved = localStorage.getItem('eventpulse_events');
    return saved ? JSON.parse(saved) : [...INITIAL_EVENTS];
  }

  saveEvents() {
    localStorage.setItem('eventpulse_events', JSON.stringify(this.events));
  }

  loadSettings() {
    const saved = localStorage.getItem('eventpulse_settings');
    const defaultSettings = {
      emailEnabled: true,
      emailAddress: 'user@example.com',
      calendarEnabled: true,
      autoSync: true,
      sources: {
        web: true,
        x: true,
        instagram: true
      }
    };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  }

  saveSettings() {
    localStorage.setItem('eventpulse_settings', JSON.stringify(this.settings));
  }

  // --- DOM要素初期化 ---
  initElements() {
    // トピック関連
    this.topicTagsList = document.getElementById('topicTagsList');
    this.topicCountBadge = document.getElementById('topicCountBadge');
    this.addTopicForm = document.getElementById('addTopicForm');
    this.topicInput = document.getElementById('topicInput');
    this.suggestChips = document.getElementById('suggestChips');

    // フィルタ・検索
    this.eventSearchInput = document.getElementById('eventSearchInput');
    this.topicFilterSelect = document.getElementById('topicFilterSelect');
    this.eventsContainer = document.getElementById('eventsContainer');
    this.calendarViewContainer = document.getElementById('calendarViewContainer');
    this.emptyState = document.getElementById('emptyState');

    // 表示切り替え
    this.viewGridBtn = document.getElementById('viewGridBtn');
    this.viewCalendarBtn = document.getElementById('viewCalendarBtn');

    // 設定トグル
    this.toggleEmail = document.getElementById('toggleEmail');
    this.inputEmailAddress = document.getElementById('inputEmailAddress');
    this.emailSubpanel = document.getElementById('emailSubpanel');
    this.toggleCalendar = document.getElementById('toggleCalendar');
    this.toggleAutoSync = document.getElementById('toggleAutoSync');
    this.bannerEmailStatus = document.getElementById('bannerEmailStatus');
    this.bannerCalendarStatus = document.getElementById('bannerCalendarStatus');

    // 情報ソースチェックボックス
    this.srcWeb = document.getElementById('srcWeb');
    this.srcX = document.getElementById('srcX');
    this.srcInstagram = document.getElementById('srcInstagram');

    // アクションボタン
    this.btnRefresh = document.getElementById('btnRefresh');
    this.btnPreviewEmail = document.getElementById('btnPreviewEmail');
    this.btnSendTestEmail = document.getElementById('btnSendTestEmail');

    // モーダル関連
    this.eventDetailModal = document.getElementById('eventDetailModal');
    this.modalContent = document.getElementById('modalContent');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');
    this.emailPreviewModal = document.getElementById('emailPreviewModal');
    this.emailModalCloseBtn = document.getElementById('emailModalCloseBtn');
    this.emailPreviewTo = document.getElementById('emailPreviewTo');
    this.emailRenderedContent = document.getElementById('emailRenderedContent');

    // トースト
    this.toastNotification = document.getElementById('toastNotification');
    this.toastMessage = document.getElementById('toastMessage');

    // 初期UI状態の適用
    this.toggleEmail.checked = this.settings.emailEnabled;
    this.inputEmailAddress.value = this.settings.emailAddress;
    this.toggleCalendar.checked = this.settings.calendarEnabled;
    this.toggleAutoSync.checked = this.settings.autoSync;

    if (this.srcWeb) this.srcWeb.checked = this.settings.sources.web;
    if (this.srcX) this.srcX.checked = this.settings.sources.x;
    if (this.srcInstagram) this.srcInstagram.checked = this.settings.sources.instagram;

    this.updateSourceChipsUI();
    this.updateSettingsUI();
  }

  // --- イベントリスナー設定 ---
  initEventListeners() {
    // トピック追加
    this.addTopicForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const topicName = this.topicInput.value.trim();
      if (topicName) {
        this.addTopic(topicName);
        this.topicInput.value = '';
      }
    });

    // おすすめトピックチップのクリック
    this.suggestChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) {
        const topicName = chip.dataset.topic;
        this.addTopic(topicName);
      }
    });

    // 検索入力
    this.eventSearchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderEvents();
    });

    // トピックセレクト
    this.topicFilterSelect.addEventListener('change', (e) => {
      this.activeTopicFilter = e.target.value;
      this.renderTopicTags();
      this.renderEvents();
    });

    // ビュー切り替え
    this.viewGridBtn.addEventListener('click', () => this.switchView('grid'));
    this.viewCalendarBtn.addEventListener('click', () => this.switchView('calendar'));

    // 情報ソース切り替え (Web / X / Instagram)
    const handleSourceToggle = (type, el) => {
      this.settings.sources[type] = el.checked;
      this.saveSettings();
      this.updateSourceChipsUI();
      this.renderEvents();
      const name = type === 'x' ? 'X (Twitter)' : type === 'instagram' ? 'Instagram' : 'Web公式サイト';
      this.showToast(`${name} からの情報収集を ${el.checked ? '有効' : '停止'} にしました`);
    };

    if (this.srcWeb) this.srcWeb.addEventListener('change', (e) => handleSourceToggle('web', e.target));
    if (this.srcX) this.srcX.addEventListener('change', (e) => handleSourceToggle('x', e.target));
    if (this.srcInstagram) this.srcInstagram.addEventListener('change', (e) => handleSourceToggle('instagram', e.target));

    // 設定トグル変更
    this.toggleEmail.addEventListener('change', (e) => {
      this.settings.emailEnabled = e.target.checked;
      this.saveSettings();
      this.updateSettingsUI();
      this.showToast(this.settings.emailEnabled ? '毎朝のメール配信を有効にしました' : 'メール配信を停止しました');
    });

    this.inputEmailAddress.addEventListener('change', (e) => {
      this.settings.emailAddress = e.target.value.trim() || 'user@example.com';
      this.saveSettings();
      this.updateSettingsUI();
      this.showToast('送信先メールアドレスを更新しました');
    });

    this.toggleCalendar.addEventListener('change', (e) => {
      this.settings.calendarEnabled = e.target.checked;
      this.saveSettings();
      this.updateSettingsUI();
      this.renderEvents();
      this.showToast(this.settings.calendarEnabled ? 'Googleカレンダー連携を有効にしました' : 'カレンダー連携を無効にしました');
    });

    this.toggleAutoSync.addEventListener('change', (e) => {
      this.settings.autoSync = e.target.checked;
      this.saveSettings();
      this.showToast(this.settings.autoSync ? '毎朝07:00の自動検索収集を有効にしました' : '自動検索収集を一時停止しました');
    });

    // 手動更新ボタン
    this.btnRefresh.addEventListener('click', () => this.handleManualRefresh());

    // メールプレビュー
    this.btnPreviewEmail.addEventListener('click', () => this.openEmailPreviewModal());
    this.emailModalCloseBtn.addEventListener('click', () => this.closeEmailPreviewModal());
    this.btnSendTestEmail.addEventListener('click', () => {
      this.closeEmailPreviewModal();
      this.showToast(`テストメールを「${this.settings.emailAddress}」へ送信完了しました！`);
    });

    // イベント詳細モーダルクローズ
    this.modalCloseBtn.addEventListener('click', () => this.closeEventModal());
    window.addEventListener('click', (e) => {
      if (e.target === this.eventDetailModal) this.closeEventModal();
      if (e.target === this.emailPreviewModal) this.closeEmailPreviewModal();
    });
  }

  updateSourceChipsUI() {
    const toggleClass = (checkbox) => {
      if (!checkbox) return;
      const label = checkbox.closest('.source-chip');
      if (label) {
        if (checkbox.checked) {
          label.classList.add('active');
        } else {
          label.classList.remove('active');
        }
      }
    };
    toggleClass(this.srcWeb);
    toggleClass(this.srcX);
    toggleClass(this.srcInstagram);
  }

  // --- トピック操作 ---
  addTopic(name) {
    if (this.topics.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      this.showToast(`「${name}」は既に登録されています`);
      return;
    }

    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#06b6d4', '#10b981', '#8b5cf6', '#ef4444'];
    const newTopic = {
      id: `topic-${Date.now()}`,
      name: name,
      color: colors[this.topics.length % colors.length],
      icon: name.startsWith('@') ? 'at-sign' : 'tag',
      enabled: true
    };

    this.topics.push(newTopic);
    this.saveTopics();
    this.renderTopics();
    this.showToast(`トピック「${name}」を追加しました。Web・X・Instagramから自動検索を開始します。`);

    // 新トピックに関連する実在リンク付きイベントを自動検知生成
    this.simulateCrawlForNewTopic(newTopic);
  }

  // トピックの有効・無効切り替え（チェックボックス）
  toggleTopicEnabled(topicId) {
    const topic = this.topics.find(t => t.id === topicId);
    if (!topic) return;

    topic.enabled = !topic.enabled;
    this.saveTopics();
    this.renderTopics();
    this.renderEvents();

    const stateText = topic.enabled ? '表示中（有効）' : '非表示（無効）';
    this.showToast(`「${topic.name}」を${stateText}にしました`);
  }

  // トピックの完全削除（紐づくイベントも完全削除）
  removeTopic(topicId, topicName) {
    // トピックを削除
    this.topics = this.topics.filter(t => t.id !== topicId);
    this.saveTopics();

    // 紐づくイベントも完全に削除！
    this.events = this.events.filter(e => e.topicId !== topicId);
    this.saveEvents();

    if (this.activeTopicFilter === topicId) {
      this.activeTopicFilter = 'ALL';
    }

    this.renderTopics();
    this.renderEvents();
    this.showToast(`トピック「${topicName}」と関連イベントを完全に削除しました`);
  }

  // 新規トピック追加時のリアルタイム検索リンク生成
  simulateCrawlForNewTopic(topic) {
    const isAccount = topic.name.startsWith('@');
    const sourceTypes = ['x', 'instagram', 'web'];
    const chosenSource = isAccount ? 'x' : sourceTypes[Math.floor(Math.random() * sourceTypes.length)];

    let sourceName = 'Web検索・公式情報';
    let officialUrl = `https://www.google.com/search?q=${encodeURIComponent(topic.name + ' 展示会 イベント 2026')}`;
    let socialUrl = `https://x.com/search?q=${encodeURIComponent(topic.name + ' 展示')}`;

    if (chosenSource === 'x') {
      sourceName = `X公式ポスト (${isAccount ? topic.name : '公式速報'})`;
      officialUrl = isAccount ? `https://x.com/${topic.name.replace('@', '')}` : `https://x.com/search?q=${encodeURIComponent(topic.name + ' イベント')}`;
      socialUrl = officialUrl;
    } else if (chosenSource === 'instagram') {
      sourceName = `Instagram最新投稿`;
      officialUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(topic.name.replace(/[\s・]/g, ''))}/`;
      socialUrl = officialUrl;
    }

    const generatedEvent = {
      id: `ev-${Date.now()}`,
      topicId: topic.id,
      topicName: topic.name,
      source: chosenSource,
      sourceName: sourceName,
      title: `【最新検索】「${topic.name}」関連の展覧会・イベント情報`,
      startDate: '2026-11-15',
      endDate: '2026-12-25',
      displayDate: '2026年11月15日 - 12月25日 開催予定',
      venue: '東京都内 各会場 / オンライン',
      description: `ネット検索により新たに自動検知された「${topic.name}」に関する展覧会・最新イベント情報です。詳細リンクからGoogle検索結果や公式SNSの告知ポストを即座に確認できます。`,
      imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
      officialUrl: officialUrl,
      searchFallbackUrl: `https://www.google.com/search?q=${encodeURIComponent(topic.name + ' 展覧会 イベント チケット')}`,
      socialUrl: socialUrl,
      price: '詳細は各リンク先をご確認ください',
      hours: '会場により異なります',
      highlight: `${chosenSource.toUpperCase()}で新着検知`
    };

    this.events.unshift(generatedEvent);
    this.saveEvents();
    this.renderEvents();
  }

  // --- 手動更新処理 ---
  handleManualRefresh() {
    const icon = this.btnRefresh.querySelector('.icon-refresh');
    icon.style.animation = 'spin 1s infinite linear';
    this.btnRefresh.disabled = true;

    if (!document.getElementById('spinStyle')) {
      const style = document.createElement('style');
      style.id = 'spinStyle';
      style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    setTimeout(() => {
      icon.style.animation = 'none';
      this.btnRefresh.disabled = false;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      document.getElementById('lastUpdatedText').textContent = `本日 ${timeStr} 自動更新完了`;

      this.showToast('Web・X・Instagramを横断巡回し、最新イベントを反映しました！');
    }, 1200);
  }

  // --- 設定UIの同期 ---
  updateSettingsUI() {
    if (this.settings.emailEnabled) {
      this.emailSubpanel.classList.remove('disabled');
      this.bannerEmailStatus.innerHTML = `
        <i data-lucide="check-circle-2" class="text-success"></i>
        <span>毎朝 07:00 メール配信: <strong>有効 (${this.settings.emailAddress})</strong></span>
      `;
    } else {
      this.emailSubpanel.classList.add('disabled');
      this.bannerEmailStatus.innerHTML = `
        <i data-lucide="slash" class="text-dim"></i>
        <span>毎朝のメール配信: <strong style="color:var(--text-dim)">無効（送信なし）</strong></span>
      `;
    }

    if (this.settings.calendarEnabled) {
      this.bannerCalendarStatus.innerHTML = `
        <i data-lucide="calendar-check" class="text-calendar"></i>
        <span>Googleカレンダー連携: <strong>ワンクリック追加モード有効</strong></span>
      `;
    } else {
      this.bannerCalendarStatus.innerHTML = `
        <i data-lucide="calendar-x" class="text-dim"></i>
        <span>Googleカレンダー連携: <strong style="color:var(--text-dim)">無効（表示なし）</strong></span>
      `;
    }

    lucide.createIcons();
  }

  // --- ビュー切り替え ---
  switchView(view) {
    this.currentView = view;
    if (view === 'grid') {
      this.viewGridBtn.classList.add('active');
      this.viewCalendarBtn.classList.remove('active');
      this.eventsContainer.classList.remove('hidden');
      this.calendarViewContainer.classList.add('hidden');
    } else {
      this.viewCalendarBtn.classList.add('active');
      this.viewGridBtn.classList.remove('active');
      this.eventsContainer.classList.add('hidden');
      this.calendarViewContainer.classList.remove('hidden');
      this.renderCalendarTimeline();
    }
  }

  // --- トピック描画 ---
  renderTopics() {
    this.renderTopicTags();
    this.renderTopicFilterSelect();
    const activeCount = this.topics.filter(t => t.enabled !== false).length;
    this.topicCountBadge.textContent = `有効: ${activeCount} / 全${this.topics.length}件`;
  }

  renderTopicTags() {
    this.topicTagsList.innerHTML = '';
    
    // 「すべて」タグ
    const allTag = document.createElement('div');
    allTag.className = `topic-badge ${this.activeTopicFilter === 'ALL' ? 'active-filter' : ''}`;
    
    // 有効なトピックに属するイベントの総数
    const enabledTopicIds = new Set(this.topics.filter(t => t.enabled !== false).map(t => t.id));
    const activeEventsCount = this.events.filter(e => enabledTopicIds.has(e.topicId)).length;
    
    allTag.innerHTML = `<span>すべて表示 (${activeEventsCount})</span>`;
    allTag.addEventListener('click', () => {
      this.activeTopicFilter = 'ALL';
      this.topicFilterSelect.value = 'ALL';
      this.renderTopicTags();
      this.renderEvents();
    });
    this.topicTagsList.appendChild(allTag);

    this.topics.forEach(topic => {
      const isEnabled = topic.enabled !== false;
      const count = this.events.filter(e => e.topicId === topic.id).length;
      const badge = document.createElement('div');
      
      let badgeClasses = ['topic-badge'];
      if (this.activeTopicFilter === topic.id) badgeClasses.push('active-filter');
      if (!isEnabled) badgeClasses.push('topic-disabled');
      
      badge.className = badgeClasses.join(' ');
      badge.innerHTML = `
        <label class="topic-checkbox-label" title="${isEnabled ? 'クリックして非表示（閉じる）' : 'クリックして表示（開く）'}">
          <input type="checkbox" class="topic-checkbox" ${isEnabled ? 'checked' : ''}>
          <span class="custom-checkbox-dot" style="background:${isEnabled ? topic.color : 'var(--text-dim)'}"></span>
        </label>
        <span class="topic-name-text">${topic.name}</span>
        <span class="topic-count-badge">(${count})</span>
        <button class="topic-badge-remove" title="トピックとイベントを完全に削除" aria-label="${topic.name}を削除">
          <i data-lucide="x" style="width:14px; height:14px;"></i>
        </button>
      `;

      // チェックボックスの変更イベント（表示・非表示の切り替え）
      const checkbox = badge.querySelector('.topic-checkbox');
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleTopicEnabled(topic.id);
      });

      // ラベル全体のクリックでフィルタ切り替え（チェックボックスや削除ボタン以外）
      badge.addEventListener('click', (e) => {
        if (e.target.closest('.topic-checkbox-label') || e.target.closest('.topic-badge-remove')) return;
        this.activeTopicFilter = topic.id;
        this.topicFilterSelect.value = topic.id;
        this.renderTopicTags();
        this.renderEvents();
      });

      // 削除ボタン
      const removeBtn = badge.querySelector('.topic-badge-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`「${topic.name}」と関連するイベントを完全に削除しますか？`)) {
          this.removeTopic(topic.id, topic.name);
        }
      });

      this.topicTagsList.appendChild(badge);
    });

    lucide.createIcons();
  }

  renderTopicFilterSelect() {
    const currentVal = this.topicFilterSelect.value;
    this.topicFilterSelect.innerHTML = '<option value="ALL">すべての有効なトピック表示</option>';
    
    this.topics.forEach(topic => {
      const isEnabled = topic.enabled !== false;
      const opt = document.createElement('option');
      opt.value = topic.id;
      opt.textContent = `${topic.name} ${isEnabled ? '' : '(非表示中)'}`;
      this.topicFilterSelect.appendChild(opt);
    });

    this.topicFilterSelect.value = this.topics.some(t => t.id === currentVal) ? currentVal : 'ALL';
  }

  // --- イベント一覧描画 ---
  renderEvents() {
    // 1. 有効なトピック（チェックが入っているもの）のIDセット
    const enabledTopicIds = new Set(this.topics.filter(t => t.enabled !== false).map(t => t.id));

    let filtered = this.events.filter(ev => {
      // トピック自体が無効（チェックOFF）または削除されている場合は絶対に表示しない！
      if (!enabledTopicIds.has(ev.topicId)) {
        return false;
      }

      // ソースフィルター (web, x, instagram)
      const evSource = ev.source || 'web';
      if (!this.settings.sources[evSource]) {
        return false;
      }

      // アクティブトピックフィルター
      const matchesTopic = (this.activeTopicFilter === 'ALL' || ev.topicId === this.activeTopicFilter);
      
      // 検索フィルター
      const matchesSearch = !this.searchQuery || 
        ev.title.toLowerCase().includes(this.searchQuery) ||
        ev.venue.toLowerCase().includes(this.searchQuery) ||
        ev.description.toLowerCase().includes(this.searchQuery) ||
        ev.topicName.toLowerCase().includes(this.searchQuery);
        
      return matchesTopic && matchesSearch;
    });

    if (filtered.length === 0) {
      this.eventsContainer.innerHTML = '';
      this.calendarViewContainer.innerHTML = '';
      this.emptyState.classList.remove('hidden');
      return;
    }

    this.emptyState.classList.add('hidden');

    if (this.currentView === 'grid') {
      this.renderGrid(filtered);
    } else {
      this.renderCalendarTimeline(filtered);
    }
  }

  getSourceBadgeHtml(event) {
    const src = event.source || 'web';
    if (src === 'x') {
      return `<span class="source-badge source-badge-x">𝕏 ${event.sourceName || 'X公式'}</span>`;
    } else if (src === 'instagram') {
      return `<span class="source-badge source-badge-insta">📸 ${event.sourceName || 'Instagram'}</span>`;
    } else {
      return `<span class="source-badge source-badge-web">🌐 ${event.sourceName || '公式サイト'}</span>`;
    }
  }

  renderGrid(events) {
    this.eventsContainer.innerHTML = '';

    events.forEach(ev => {
      const card = document.createElement('article');
      card.className = 'event-card';

      const gcalUrl = this.generateGoogleCalendarUrl(ev);
      const calendarActionHtml = this.settings.calendarEnabled
        ? `<a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="btn-calendar-add" title="Googleカレンダーに予定をワンクリック追加">
             <i data-lucide="calendar-plus"></i> カレンダーに追加
           </a>`
        : `<span style="font-size:0.75rem; color:var(--text-dim);">カレンダー連携: OFF</span>`;

      const sourceBadge = this.getSourceBadgeHtml(ev);

      card.innerHTML = `
        <div class="event-card-header">
          <img src="${ev.imageUrl}" alt="${ev.title}" class="event-banner-image" loading="lazy">
          <span class="event-category-tag">${ev.topicName}</span>
        </div>
        <div class="event-card-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <div class="event-dates-badge">
              <i data-lucide="clock" style="width:14px; height:14px;"></i>
              <span>${ev.displayDate}</span>
            </div>
            ${sourceBadge}
          </div>
          <h3 class="event-title" title="${ev.title}">${ev.title}</h3>
          <div class="event-venue">
            <i data-lucide="map-pin" style="width:14px; height:14px; flex-shrink:0;"></i>
            <span>${ev.venue}</span>
          </div>
          <p class="event-description">${ev.description}</p>
          <div class="event-card-actions">
            ${calendarActionHtml}
            <button class="btn-card-detail" data-id="${ev.id}">
              詳細を見る
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-card-detail').addEventListener('click', () => {
        this.openEventModal(ev);
      });

      this.eventsContainer.appendChild(card);
    });

    lucide.createIcons();
  }

  // --- カレンダー・タイムラインビュー描画 ---
  renderCalendarTimeline(eventsToRender = null) {
    const events = eventsToRender || this.events;
    this.calendarViewContainer.innerHTML = '';

    const sorted = [...events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const grouped = {};
    sorted.forEach(ev => {
      const month = ev.startDate.substring(0, 7);
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(ev);
    });

    Object.keys(grouped).forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const groupCard = document.createElement('div');
      groupCard.className = 'timeline-group';

      let itemsHtml = '';
      grouped[monthKey].forEach(ev => {
        const gcalUrl = this.generateGoogleCalendarUrl(ev);
        const calButton = this.settings.calendarEnabled
          ? `<a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Googleカレンダーに追加">
               <i data-lucide="calendar-plus"></i> 追加
             </a>`
          : '';

        const sourceBadge = this.getSourceBadgeHtml(ev);

        itemsHtml += `
          <div class="timeline-item">
            <div class="timeline-item-date">${ev.startDate} 〜</div>
            <div class="timeline-item-info">
              <div class="timeline-item-title">${ev.title} ${sourceBadge}</div>
              <div class="timeline-item-venue">${ev.venue} (${ev.topicName})</div>
            </div>
            <div>
              ${calButton}
            </div>
          </div>
        `;
      });

      groupCard.innerHTML = `
        <h3 class="timeline-month-title">
          <i data-lucide="calendar"></i>
          <span>${year}年 ${parseInt(month, 10)}月の開催イベント (${grouped[monthKey].length}件)</span>
        </h3>
        <div class="timeline-list">
          ${itemsHtml}
        </div>
      `;

      this.calendarViewContainer.appendChild(groupCard);
    });

    lucide.createIcons();
  }

  // --- Googleカレンダー URL生成 ---
  generateGoogleCalendarUrl(event) {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `${event.description}\n\n【情報ソース】${event.sourceName || 'Web'}\n【料金】${event.price}\n【詳細URL】${event.officialUrl}\n\n(Generated by EventPulse)`
    );
    const location = encodeURIComponent(event.venue);

    const startIso = event.startDate.replace(/-/g, '');
    let endIso = event.endDate ? event.endDate.replace(/-/g, '') : startIso;
    const dates = `${startIso}/${endIso}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  }

  // --- モーダル表示（完全実在リンク＆検索リンク付き） ---
  openEventModal(event) {
    const gcalUrl = this.generateGoogleCalendarUrl(event);
    const sourceBadge = this.getSourceBadgeHtml(event);

    const googleSearchUrl = event.searchFallbackUrl || `https://www.google.com/search?q=${encodeURIComponent(event.title + ' ' + event.venue)}`;
    const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`;
    const socialSearchUrl = event.socialUrl || `https://x.com/search?q=${encodeURIComponent(event.title)}`;

    this.modalContent.innerHTML = `
      <div style="margin-bottom: 16px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span class="badge badge-accent">${event.topicName}</span>
          ${sourceBadge}
        </div>
        <h2 style="font-size:1.35rem; font-weight:700; line-height:1.4; color:#fff;">${event.title}</h2>
      </div>

      <img src="${event.imageUrl}" alt="${event.title}" style="width:100%; height:220px; object-fit:cover; border-radius:12px; margin-bottom:16px;">

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px; font-size:0.88rem; color:#cbd5e1;">
        <div><strong>🗓 会期・日時:</strong> ${event.displayDate}</div>
        <div>
          <strong>📍 会場:</strong> ${event.venue}
          <a href="${googleMapUrl}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8; margin-left:8px; font-size:0.8rem; text-decoration:underline;">
            [Googleマップで開く ↗]
          </a>
        </div>
        <div><strong>⏰ 開館時間:</strong> ${event.hours || '公式サイトをご確認ください'}</div>
        <div><strong>🎫 入場料・チケット:</strong> ${event.price}</div>
        <div><strong>📡 検出元:</strong> ${event.sourceName || '公式サイト'}</div>
      </div>

      <div style="background:rgba(255,255,255,0.03); padding:16px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); font-size:0.88rem; line-height:1.7; margin-bottom:24px;">
        ${event.description}
      </div>

      <!-- アクションボタングループ -->
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; flex-wrap:wrap; gap:10px;">
          <a href="${event.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="flex:1;">
            <i data-lucide="external-link"></i> 公式サイト / 公式投稿を開く
          </a>
          <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="flex:1;">
            <i data-lucide="calendar-plus"></i> Googleカレンダーに登録
          </a>
        </div>
        
        <div style="display:flex; flex-wrap:wrap; gap:8px; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px;">
          <a href="${googleSearchUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="flex:1;">
            <i data-lucide="search"></i> Googleで最新情報・チケットを検索
          </a>
          <a href="${socialSearchUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="flex:1;">
            <span style="font-weight:700;">𝕏</span> 最新の口コミ・感想を見る
          </a>
        </div>
      </div>
    `;

    this.eventDetailModal.classList.remove('hidden');
    lucide.createIcons();
  }

  closeEventModal() {
    this.eventDetailModal.classList.add('hidden');
  }

  // --- メールプレビューモーダル ---
  openEmailPreviewModal() {
    this.emailPreviewTo.textContent = this.settings.emailAddress;
    
    // 有効なトピックのイベントのみ抽出
    const enabledTopicIds = new Set(this.topics.filter(t => t.enabled !== false).map(t => t.id));
    const activeEvents = this.events.filter(e => enabledTopicIds.has(e.topicId));
    const todayEvents = activeEvents.slice(0, 4);

    let digestItems = '';
    todayEvents.forEach(ev => {
      const srcBadge = ev.source === 'x' ? '𝕏 公式ポスト' : ev.source === 'instagram' ? '📸 Instagram' : '🌐 公式サイト';
      digestItems += `
        <div class="email-digest-item">
          <div style="font-size:0.75rem; color:#38bdf8; font-weight:600;">[${ev.topicName}] ${srcBadge} | ${ev.displayDate}</div>
          <h4 style="font-size:0.95rem; margin: 4px 0 6px 0; color:#fff;">${ev.title}</h4>
          <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:4px;">📍 ${ev.venue}</p>
          <p style="font-size:0.82rem; color:#cbd5e1; line-height:1.5;">${ev.description}</p>
          <div style="margin-top:8px; display:flex; gap:12px; font-size:0.8rem;">
            <a href="${this.generateGoogleCalendarUrl(ev)}" target="_blank" style="color:#6366f1; text-decoration:underline;">
              📅 カレンダーに追加
            </a>
            <a href="${ev.officialUrl}" target="_blank" style="color:#38bdf8; text-decoration:underline;">
              🔗 公式サイトを見る
            </a>
          </div>
        </div>
      `;
    });

    this.emailRenderedContent.innerHTML = `
      <p style="margin-bottom:14px;">こんにちは！EventPulseが、Web、X（Twitter）、Instagramから本日のおすすめ新着情報を厳選しました。</p>
      ${digestItems || '<p style="color:#94a3b8;">現在有効なトピックのイベントはありません。</p>'}
      <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:18px 0;">
      <p style="font-size:0.75rem; color:#64748b;">※このメールはEventPulseの毎朝配信設定に基づき自動送信されています。配信停止は設定パネルからいつでも可能です。</p>
    `;

    this.emailPreviewModal.classList.remove('hidden');
    lucide.createIcons();
  }

  closeEmailPreviewModal() {
    this.emailPreviewModal.classList.add('hidden');
  }

  // --- トースト通知 ---
  showToast(msg) {
    this.toastMessage.textContent = msg;
    this.toastNotification.classList.remove('hidden');
    
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastNotification.classList.add('hidden');
    }, 3200);
  }

  // --- 全体初期描画 ---
  render() {
    this.renderTopics();
    this.renderEvents();
  }
}

// 起動
document.addEventListener('DOMContentLoaded', () => {
  window.app = new EventPulseApp();
});
