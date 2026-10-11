/* Local demo mode — localhost + ?demo=1 only. Seeds a sample group into the
   app's own offline cache so the real UI can be captured without touching
   Supabase, Twilio or OpenAI. Data comes from demo/data.json (demo/generate.py). */
window.startYapLocalDemo = async function startYapLocalDemo() {
  // Resolve demo files from the app's own folder, so the demo also runs from a subfolder (the portfolio embed).
  const BASE = new URL('./', document.baseURI);
  const local = p => (typeof p === 'string' && p.startsWith('/') ? new URL(p.slice(1), BASE).href : p);
  const data = await (await fetch(local('/demo/data.json'), { cache: 'no-store' })).json();
  (function fix(o) { if (!o || typeof o !== 'object') return; for (const k of Object.keys(o)) { if ((k === 'avatarUrl' || k === 'audioUrl') && typeof o[k] === 'string') o[k] = local(o[k]); else fix(o[k]); } })(data);
  installDemoTranscript(data);
  const now = Date.now();
  const at = v => now + Number(v || 0);
  // absolute URLs: the app treats bare paths as Supabase storage keys
  const abs = m => (m && m.audioUrl && m.audioUrl.startsWith('/') ? { ...m, audioUrl: local(m.audioUrl) } : m);
  for (const [id, u] of Object.entries(data.users)) USERS[id] = { id, ...u };
  setCurrentUserId(data.currentUserId);
  AppState.supabaseOk = false;
  AppState.auth.session = { provider: 'local-demo', user: { id: data.currentUserId } };
  AppState.chats = data.chats.map(c => ({ ...c, lastMessageAt: at(c.lastMessageAt), localCreatedAt: now - 30 * 864e5 }));
  writeCachedChatsForUser(AppState.chats, data.currentUserId);
  for (const [chatId, threads] of Object.entries(data.threads)) {
    const timed = threads.map(t => ({
      ...t, chatId,
      createdAt: at(t.createdAt), lastActivityAt: at(t.lastActivityAt),
      parentMemoMessage: t.parentMemoMessage && abs({ ...t.parentMemoMessage, sentAt: at(t.parentMemoMessage.sentAt) }),
      messages: t.messages.map(m => abs({ ...m, sentAt: at(m.sentAt) })),
    }));
    // ?hold=<memoId>: start without that memo's topics; window.__demoReveal() adds them as if just sent by you.
    const hold = new URLSearchParams(location.search).get('hold');
    if (hold) {
      const me = { id: data.currentUserId, ...data.users[data.currentUserId] };
      const later = timed.filter(t => t.parentMemoId === hold).map(t => ({
        ...t, lastActivityAt: now, createdAt: now,
        // Just sent: the topics hold only your memo's clips; nobody has replied yet.
        messages: t.messages.filter(m => m.parentMemoId === hold).map(m => ({ ...m, authorId: me.id, author: me, sentAt: now, heardByCurrentUser: true })),
      }));
      Store.replaceThreads(chatId, timed.filter(t => t.parentMemoId !== hold));
      window.__demoReveal = () => {
        Store.replaceThreads(chatId, [...timed.filter(t => t.parentMemoId !== hold), ...later]);
        if (AppState.activeChat?.id === chatId) { Store.setActiveChat(chatId); renderTopics(); }
      };
    } else {
      Store.replaceThreads(chatId, timed);
    }
  }
  navigate('chats', 'fade');
  scheduleChatsListRender();
  const open = new URLSearchParams(location.search).get('open');
  if (open) {
    const chat = AppState.chats.find(c => c.id === open) || AppState.chats[0];
    setTimeout(async () => {
      await openChat(chat);
      scrollChatToLatest();
    }, 500);
  }
};

// Scripted words are only installed by the localhost demo entry point. The mic
// still supplies real audio levels; no sample transcription enters the live app.
function installDemoTranscript(data) {
  const renderAudio = RecordingManager.prototype._renderVideoReactive;
  RecordingManager.prototype._startSpeechRecognition = function () {
    this.transcriptEl = DOM.recLiveTranscript;
    this._renderTranscript('');
    const thread = Store.getThread(AppState.replyTargetThreadId);
    const example = thread?.messages?.find(message => !message.parentMemoId && message.authorId !== data.currentUserId);
    const transcript = example?.transcript || data.threads['demo-chat-besties']
      .filter(topic => topic.parentMemoId === 'demo-memo-1')
      .map(topic => topic.transcript).join(' ');
    this._demoWords = (window.__demoTranscript || transcript).split(/\s+/);
    this._demoWordCount = 0;
    // The capture browser's fake mic is a quiet beep, so drive the wave with a speech-like
    // envelope instead (syllables ~4/s, phrase swells, brief breaths). Pushed on a fast
    // interval so it always lands after the app's own (silent) mic reading.
    clearInterval(this._demoLevelTimer);
    const bridge = window.__yapVoiceVisualizerBridge;
    if (bridge && !bridge.__demoWrapped) {
      const set = bridge.setAnalysis.bind(bridge);
      bridge.setAnalysis = a => { if (a && a.__demo) set(a); };
      bridge.__demoWrapped = true;
    }
    const started = Date.now();
    this._demoLevelTimer = setInterval(() => {
      if (this.phase && this.phase !== 'recording' && Date.now() - started > 1500) { clearInterval(this._demoLevelTimer); return; }
      const t = (Date.now() - started) / 1000;
      const phrase = 0.62 + 0.38 * Math.sin(t * 1.7 + 0.4);
      const breath = Math.sin(t * 0.9) > 0.93 ? 0.35 : 1;
      const syllable = 0.5 + 0.5 * Math.abs(Math.sin(t * 12.6 + Math.sin(t * 3.1) * 2));
      const level = Math.min(1, 0.3 + phrase * syllable * breath * 0.7);
      window.__yapVoiceVisualizerBridge?.setAnalysis?.({
        __demo: true, amplitude: level, envelope: level, speaking: Math.min(1, level * 1.35),
        bass: level * 0.9, mid: level * (0.7 + 0.3 * Math.sin(t * 5.3)), high: level * 0.5,
        attack: level * 0.8, decay: Math.max(0, 0.24 - level),
      });
    }, 8);
  };
  RecordingManager.prototype._renderVideoReactive = function (levels) {
    renderAudio.call(this, levels);
    if (!this._demoWords) return;

    const count = Math.min(this._demoWords.length, Math.floor((Date.now() - this.startTime) / (window.__demoWordMs || 270)));
    if (count !== this._demoWordCount) {
      this._demoWordCount = count;
      this._renderTranscript(this._demoWords.slice(0, count).join(' '));
    }
  };
}
