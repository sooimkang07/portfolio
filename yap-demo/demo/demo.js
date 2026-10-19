/* Local demo mode — localhost + ?demo=1 only. Seeds a sample group into the
   app's own offline cache so the real UI can be captured without touching
   Supabase, Twilio or OpenAI. Data comes from demo/data.json (demo/generate.py). */
window.startYapLocalDemo = async function startYapLocalDemo() {
  // Resolve demo files from the app's own folder, so the demo also runs from a subfolder (the portfolio embed).
  const BASE = new URL('./', document.baseURI);
  const local = p => (typeof p === 'string' && p.startsWith('/') ? new URL(p.slice(1), BASE).href : p);
  const embedded = document.getElementById('yap-demo-data');
  const data = embedded ? JSON.parse(embedded.textContent) : await (await fetch(local('/demo/data.json'), { cache: 'no-store' })).json();
  (function fix(o) { if (!o || typeof o !== 'object') return; for (const k of Object.keys(o)) { if ((k === 'avatarUrl' || k === 'audioUrl') && typeof o[k] === 'string') o[k] = local(o[k]); else fix(o[k]); } })(data);
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

