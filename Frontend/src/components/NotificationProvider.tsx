import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextProps {
  notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

let notificationId = 0;


export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutRefs = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({});

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
  };

  const notify = (message: string, type: NotificationType = 'info') => {
    const id = ++notificationId;
    setNotifications((prev) => [...prev, { id, message, type }]);
    timeoutRefs.current[id] = setTimeout(() => {
      removeNotification(id);
    }, 3500);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notifications.length > 0 && (
        <>
          {/* Overlay para capturar clique */}
          <div
            className="fixed inset-0 z-40 bg-transparent cursor-pointer"
            style={{ pointerEvents: 'auto' }}
            onClick={() => notifications.forEach(n => removeNotification(n.id))}
          />
          <div
            className="fixed z-50 flex flex-col gap-2 pointer-events-none notification-container"
            style={{
              right: '2rem',
              bottom: '2rem',
              top: 'auto',
              left: 'auto',
              alignItems: 'flex-end',
              width: 'auto',
              maxWidth: '100vw',
              paddingRight: '0.5rem',
              paddingLeft: 0,
            }}
          >
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-fade relative px-4 py-3 rounded-xl shadow-2xl border flex items-center justify-center gap-2 text-white pointer-events-auto w-auto min-w-[180px] max-w-[90vw] sm:min-w-[220px] sm:max-w-[400px] md:max-w-[480px]"
                  ${n.type === 'success' ? 'bg-green-600 border-green-400' : ''}
                  ${n.type === 'error' ? 'bg-red-600 border-red-400' : ''}
                  ${n.type === 'info' ? 'bg-blue-600 border-blue-400' : ''}
                  ${n.type === 'warning' ? 'bg-yellow-500 text-black border-yellow-400' : ''}
                `}
                style={{
                  fontSize: '1rem',
                  minWidth: 0,
                  wordBreak: 'break-word',
                  boxShadow: '0 6px 32px 0 rgba(0,0,0,0.18)',
                  margin: '0 0 0.5rem 0',
                  textAlign: 'center',
                  width: 'auto',
                }}
              >
                <span className="w-full text-center text-sm sm:text-base font-medium block">{n.message}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <style>{`
        .notification-fade {
          opacity: 0;
          transform: translateY(30px);
          animation: notification-fade-in 0.5s cubic-bezier(0.4,0,0.2,1) forwards, notification-fade-out 0.5s cubic-bezier(0.4,0,0.2,1) 3s forwards;
        }
        @keyframes notification-fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes notification-fade-out {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-30px); }
        }
        @media (max-width: 640px) {
          .notification-container {
            left: 50% !important;
            right: auto !important;
            bottom: 4rem !important;
            top: auto !important;
            align-items: center !important;
            transform: translateX(-50%) !important;
            width: 100vw !important;
            max-width: 100vw !important;
            padding-right: 0 !important;
            padding-left: 0 !important;
          }
        }
        @media (min-width: 641px) {
          .notification-container {
            right: 2rem !important;
            left: auto !important;
            bottom: 2rem !important;
            top: auto !important;
            align-items: flex-end !important;
            transform: none !important;
            width: auto !important;
            max-width: 100vw !important;
            padding-right: 0.5rem !important;
            padding-left: 0 !important;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de NotificationProvider');
  }
  return context;
};
