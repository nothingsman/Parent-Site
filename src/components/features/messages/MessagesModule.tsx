import React, { useCallback, useRef, useState } from 'react';
import { Search, ChevronLeft, Send, Paperclip, User, Wifi, WifiOff, X } from 'lucide-react';
import { Child } from '@/types';
import { useMessageThreads } from '@/hooks';

export interface MessagesModuleProps {
  child: Child;
  activeThreadKey: string | null;
  setActiveThreadKey: (key: string | null) => void;
}

function formatTime(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDateLabel(value: string): string {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function isSameDay(left: string, right: string): boolean {
  return new Date(left).toDateString() === new Date(right).toDateString();
}

export const MessagesModule = ({
  child,
  activeThreadKey,
  setActiveThreadKey,
}: MessagesModuleProps) => {
  const {
    contacts,
    filteredContacts,
    activeKey,
    activeContact,
    activeMessages,
    currentUserId,
    messagesLoading,
    threadsLoading,
    isSending,
    sendError,
    websocketState,
    uploadState,
    searchTerm,
    setSearchTerm,
    setActiveKey,
    sendMessage,
    clearAttachment,
    attachmentMetaById,
    unreadTotal,
  } = useMessageThreads(child);

  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const [composerText, setComposerText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const activeThreadKeyRef = useRef<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  React.useEffect(() => {
    if (activeKey && activeKey !== activeThreadKey) {
      setActiveThreadKey(activeKey);
    }
  }, [activeKey, activeThreadKey, setActiveThreadKey]);

  React.useEffect(() => {
    if (activeThreadKey && activeThreadKey !== activeKey) {
      const next = contacts.find((contact) => contact.key === activeThreadKey);
      if (next) {
        setActiveKey(next.key);
      }
    }
  }, [activeThreadKey, contacts, activeKey, setActiveKey]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollDown(distanceFromBottom > 200);
  }, []);

  React.useEffect(() => {
    if (!activeContact?.key) return;
    if (activeThreadKeyRef.current !== activeContact.key) {
      activeThreadKeyRef.current = activeContact.key;
      setShowScrollDown(false);
      scrollToBottom(false);
      return;
    }

    if (!showScrollDown) {
      scrollToBottom(false);
    }
  }, [activeContact?.key, activeMessages.length, scrollToBottom, showScrollDown]);

  const statusLabel =
    websocketState === 'connected'
      ? 'Live'
      : websocketState === 'connecting' || websocketState === 'reconnecting'
        ? 'Connecting'
        : 'Offline';

  const handleSend = async () => {
    const sent = await sendMessage({ text: composerText, file: selectedFile });
    if (sent) {
      setComposerText('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-white">
      <div className={`w-full md:w-[320px] shrink-0 border-r border-slate-100 flex-col min-h-0 ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
        <div className="border-b border-slate-100 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Messages</h2>
            <span className="rounded-full bg-[#3949AB] px-3 py-1 text-[11px] font-bold text-white">
              {unreadTotal}
            </span>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#3949AB] focus:bg-white"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
          {filteredContacts.map((contact) => {
            const isActive = contact.key === activeKey;
            return (
              <button
                key={contact.key}
                type="button"
                onClick={() => {
                  setActiveKey(contact.key);
                  setMobileView('thread');
                }}
                className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 ${isActive ? 'border-l-[3px] border-[#3949AB] bg-[#f4f6fc]' : ''}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${contact.avatarBg}`}>
                  {contact.teacherInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-bold text-slate-900">{contact.teacherName}</p>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                      {formatTime(contact.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                    {contact.subjectName}
                  </p>
                  <p className="truncate text-xs font-medium text-slate-500">{contact.latestPreview}</p>
                </div>
                {contact.unreadCount > 0 && (
                  <span className="mt-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {contact.unreadCount}
                  </span>
                )}
              </button>
            );
          })}

          {!threadsLoading && filteredContacts.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400">
              No teacher conversations match your search.
            </div>
          )}
        </div>
      </div>

      <div className={`flex-1 min-h-0 flex-col ${mobileView === 'thread' ? 'flex' : 'hidden md:flex'}`}>
        {activeContact ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="rounded-xl p-2 text-[#3949AB] md:hidden"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${activeContact.avatarBg}`}>
                  {activeContact.teacherInitials}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-slate-900">{activeContact.teacherName}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>{activeContact.subjectName}</span>
                    <span>·</span>
                    <span>{activeContact.gradeLabel}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                {websocketState === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span>{statusLabel}</span>
              </div>
            </div>

            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="relative flex-1 min-h-0 overflow-y-auto bg-slate-50/70 p-5"
            >
              {!activeContact.existingThreadId && activeMessages.length === 0 && (
                <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
                  This conversation will be created when you send the first message.
                </div>
              )}

              {messagesLoading && (
                <div className="text-sm text-slate-400">Loading messages...</div>
              )}

              {!messagesLoading && activeMessages.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-[#3949AB]">
                      <User size={22} className="stroke-[2.5]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No messages yet</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Start the conversation with {activeContact.teacherName}.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {activeMessages.map((message, index) => {
                  const isOwn = message.sender === 'parent';
                  const attachment = message.attachment ? attachmentMetaById[message.attachment] : null;
                  const seen = !isOwn
                    ? false
                    : message.read_by_ids.some((readerId) => readerId !== currentUserId);
                  const previousMessage = index > 0 ? activeMessages[index - 1] : null;
                  const showDateSeparator =
                    !previousMessage || !isSameDay(previousMessage.created_at, message.created_at);
                  const showAvatar = !isOwn && (!previousMessage || previousMessage.sender !== message.sender);

                  return (
                    <React.Fragment key={message.id}>
                      {showDateSeparator && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="flex-1 border-t border-slate-200" />
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {formatDateLabel(message.created_at)}
                          </span>
                          <div className="flex-1 border-t border-slate-200" />
                        </div>
                      )}
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-1'}`}>
                        {!isOwn && (
                          <div className={`mr-2 flex shrink-0 items-end ${showAvatar ? '' : 'invisible'}`}>
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${activeContact.avatarBg}`}>
                              {activeContact.teacherInitials}
                            </div>
                          </div>
                        )}
                        <div className={`max-w-[80%] ${isOwn ? '' : 'min-w-0'}`}>
                          <div className={`rounded-2xl px-4 py-3 shadow-sm ${isOwn ? 'bg-[#3949AB] text-white' : 'bg-white text-slate-900'}`}>
                            {message.text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>}
                            {attachment && (
                              <a
                                href={attachment.download_url ?? '#'}
                                target="_blank"
                                rel="noreferrer"
                                className={`mt-3 block rounded-xl border px-3 py-2 text-sm ${isOwn ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                              >
                                <p className="truncate font-semibold">{attachment.file_name}</p>
                                <p className={`mt-1 text-xs ${isOwn ? 'text-white/70' : 'text-slate-500'}`}>
                                  {attachment.content_type}
                                </p>
                              </a>
                            )}
                          </div>
                          <div className={`mt-2 flex items-center gap-2 px-1 text-[10px] text-slate-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span>{formatTime(message.created_at)}</span>
                            {isOwn ? (
                              <span>
                                {seen
                                    ? 'Seen'
                                    : 'Sent'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {showScrollDown && activeMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-lg transition hover:bg-slate-50"
                >
                  Latest messages
                </button>
              )}
            </div>

            <div className="border-t border-slate-100 bg-white p-4">
              {(selectedFile || uploadState.file) && (
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {(selectedFile ?? uploadState.file)?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {uploadState.progressLabel ?? 'Ready to upload'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      clearAttachment();
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-200"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {sendError && (
                <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {sendError}
                </div>
              )}

              <div className="flex items-end gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setSelectedFile(file);
                    if (!file) clearAttachment();
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  rows={1}
                  value={composerText}
                  onChange={(event) => setComposerText(event.target.value)}
                  placeholder="Type your message..."
                  className="max-h-32 min-h-[44px] flex-1 resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#3949AB]"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || uploadState.status === 'uploading'}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#3949AB] text-white transition hover:bg-[#2f3d93] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50/60 p-6 text-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">No teachers found</h3>
              <p className="mt-2 text-sm text-slate-500">
                No teacher assignments are available for this student yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
