import React, { createContext, useContext, useState, useCallback } from "react";

export interface AppNotification {
  id: string;
  type: "warning" | "info" | "success" | "reminder";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

let notifCounter = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    const id = `notif-${++notifCounter}-${Date.now()}`;
    setNotifications(prev => {
      if (prev.some(p => p.title === n.title && p.message === n.message)) return prev;
      return [{ ...n, id, read: false, createdAt: new Date() }, ...prev].slice(0, 20);
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead, dismiss, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
