import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, PetSnapshot } from '../../../shared/ipc/channels';
import { CharacterManifest } from '../../../shared/character/schema';
import { SettingsModal } from './SettingsModal';

interface ChatOverlayProps {
  isOpen: boolean;
  petSnapshot: PetSnapshot | null;
  characterManifest: CharacterManifest | null;
  onClose: () => void;
  onUiPointerEnter: () => void;
  onUiPointerLeave: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  petSnapshot,
  characterManifest,
  onClose,
  onUiPointerEnter,
  onUiPointerLeave
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingHeader, setIsDraggingHeader] = useState(false);
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      // Auto-focus textarea and request window focus when opened
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        void window.deskPetApi?.setFocusable(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Initial load & IPC event subscriptions
  useEffect(() => {
    if (!window.deskPetApi) return;

    void window.deskPetApi.getChatHistory().then(setMessages);

    const cleanupChunk = window.deskPetApi.onStreamChunk((chunk) => {
      setStreamingContent((prev) => prev + chunk.delta);
      setIsBusy(true);
    });

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

    return () => {
      cleanupChunk();
      cleanupDone();
      cleanupError();
    };
  }, []);

  // Compute docked position near pet when opening or when pet moves
  const updateDockedPosition = useCallback(() => {
    if (!petSnapshot) return;
    const petW = (characterManifest?.size.w ?? 192) * petSnapshot.scale;
    const petH = (characterManifest?.size.h ?? 384) * petSnapshot.scale;
    const chatW = 360;
    const chatH = 460;

    let targetX = petSnapshot.position.x + petW / 2 + 16;
    if (targetX + chatW > window.innerWidth - 20) {
      targetX = petSnapshot.position.x - petW / 2 - chatW - 16;
    }
    targetX = Math.max(16, Math.min(targetX, window.innerWidth - chatW - 16));

    let targetY = petSnapshot.position.y - petH;
    targetY = Math.max(20, Math.min(targetY, window.innerHeight - chatH - 20));

    setPanelPos({ x: Math.round(targetX), y: Math.round(targetY) });
  }, [petSnapshot, characterManifest]);

  useEffect(() => {
    if (isOpen && !isDraggingHeader && !panelPos) {
      updateDockedPosition();
    }
  }, [isOpen, updateDockedPosition, isDraggingHeader, panelPos]);

  // Dragging the chat header
  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsDraggingHeader(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!isDraggingHeader) return;
    const newX = Math.max(10, Math.min(e.clientX - dragStartOffset.current.x, window.innerWidth - 370));
    const newY = Math.max(10, Math.min(e.clientY - dragStartOffset.current.y, window.innerHeight - 470));
    setPanelPos({ x: newX, y: newY });
  };

  const handleHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (isDraggingHeader) {
      setIsDraggingHeader(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }
    }
  };

  const handleInputFocus = (): void => {
    void window.deskPetApi?.setFocusable(true);
  };

  const handleInputBlur = (): void => {
    void window.deskPetApi?.setFocusable(false);
  };

  const handleSend = async (): Promise<void> => {
    const text = inputText.trim();
    if (!text || isBusy || !window.deskPetApi) return;

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

  if (!isOpen) return null;

  const petName = characterManifest?.name || 'Odette';
  const posX = panelPos?.x ?? 50;
  const posY = panelPos?.y ?? 50;

  return (
    <div
      ref={panelRef}
      className="chat-container single-window-chat"
      style={{
        transform: `translate3d(${posX}px, ${posY}px, 0)`
      }}
      onMouseEnter={onUiPointerEnter}
      onMouseLeave={onUiPointerLeave}
      onPointerDown={() => {
        void window.deskPetApi?.setIgnoreMouse(false);
      }}
    >
      {/* Header */}
      <header
        className="chat-header draggable-header"
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
      >
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
            onClick={updateDockedPosition}
            title="Đưa về cạnh nhân vật"
          >
            ⚓
          </button>
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
          <button
            className="btn-icon"
            onClick={() => {
              handleInputBlur();
              onClose();
            }}
            title="Ẩn khung chat"
          >
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
        <div
          className="input-group"
          onClick={() => {
            inputRef.current?.focus();
            void window.deskPetApi?.setFocusable(true);
          }}
        >
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={`Trò chuyện với ${petName}... (Enter để gửi)`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
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
