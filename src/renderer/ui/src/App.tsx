import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@shared/ipc/channels';
import { CharacterManifest } from '@shared/character/schema';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [character, setCharacter] = useState<CharacterManifest | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    if (!window.deskPetApi) return;

    // Load initial character & history
    void window.deskPetApi.getCharacter().then(setCharacter);
    void window.deskPetApi.getChatHistory().then(setMessages);

    // Lắng nghe stream chunks
    const cleanupChunk = window.deskPetApi.onStreamChunk((chunk) => {
      setStreamingContent((prev) => prev + chunk.delta);
      setIsBusy(true);
    });

    // Lắng nghe stream hoàn thành
    const cleanupDone = window.deskPetApi.onStreamDone((done) => {
      setMessages((prev) => [
        ...prev,
        {
          id: done.messageId,
          role: 'assistant',
          content: done.fullContent,
          timestamp: Date.now(),
          emotion: done.emotion
        }
      ]);
      setStreamingContent('');
      setIsBusy(false);
    });

    // Lắng nghe lỗi stream
    const cleanupError = window.deskPetApi.onStreamError((err) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${err.error}`,
          timestamp: Date.now(),
          emotion: 'sad'
        }
      ]);
      setStreamingContent('');
      setIsBusy(false);
    });

    const cleanupChar = window.deskPetApi.onCharacterChanged((manifest) => {
      setCharacter(manifest);
    });

    return () => {
      cleanupChunk();
      cleanupDone();
      cleanupError();
      cleanupChar();
    };
  }, []);

  const handleSend = async (): Promise<void> => {
    const text = inputText.trim();
    if (!text || isBusy || !window.deskPetApi) return;

    // Hiển thị tin nhắn user ngay lập tức
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsBusy(true);
    setStreamingContent('');

    try {
      await window.deskPetApi.sendMessage({ text });
    } catch (err) {
      setIsBusy(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Lỗi gửi tin nhắn: ${err instanceof Error ? err.message : String(err)}`,
          timestamp: Date.now()
        }
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleClearHistory = async (): Promise<void> => {
    if (window.deskPetApi) {
      await window.deskPetApi.clearChatHistory();
      setMessages([]);
    }
  };

  const handleClose = async (): Promise<void> => {
    if (window.deskPetApi) {
      await window.deskPetApi.toggleChatWindow();
    }
  };

  const petName = character?.name || 'Odette';

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-title-group">
          <div className="pet-avatar-small">🦢</div>
          <div className="pet-name-info">
            <span className="pet-name">{petName}</span>
            <span className="pet-status">
              <span className={`status-dot ${isBusy ? 'busy' : ''}`} />
              {isBusy ? 'Đang phản hồi...' : 'Sẵn sàng'}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-icon"
            onClick={() => void handleClearHistory()}
            title="Xoá lịch sử chat"
          >
            🧹
          </button>
          <button
            className="btn-icon"
            onClick={() => setShowSettings(true)}
            title="Cài đặt LLM"
          >
            ⚙️
          </button>
          <button className="btn-icon" onClick={() => void handleClose()} title="Ẩn khung chat">
            ✕
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && !isBusy && (
          <div className="empty-chat">
            <div className="empty-icon">💬</div>
            <div>Bắt đầu trò chuyện với {petName}!</div>
            <div style={{ fontSize: '11.5px', marginTop: '4px', opacity: 0.7 }}>
              Hãy hỏi một câu hoặc chào {petName} nhé.
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message-item ${msg.role}`}>
            {msg.emotion && (
              <span className="emotion-tag-badge">Biểu cảm: {msg.emotion}</span>
            )}
            <div className="message-bubble">{msg.content}</div>
          </div>
        ))}

        {/* Streaming Message Bubble */}
        {isBusy && (
          <div className="message-item assistant">
            {streamingContent ? (
              <div className="message-bubble">{streamingContent}</div>
            ) : (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer / Input */}
      <footer className="chat-footer">
        <div className="input-group">
          <textarea
            className="chat-input"
            placeholder={`Trò chuyện với ${petName}... (Enter để gửi)`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="btn-send"
            onClick={() => void handleSend()}
            disabled={!inputText.trim() || isBusy}
            title="Gửi tin nhắn"
          >
            ➤
          </button>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default App;
