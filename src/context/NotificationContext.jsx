import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const t = { id, type: "info", ...toast };
    setToasts((prev) => [...prev, t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  }, [user]);

  const markRead = useCallback(
    async (id) => {
      if (!user) return;
      await supabase.from("notifications").update({ read: true }).eq("id", id);
      fetchNotifications();
    },
    [user, fetchNotifications]
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    fetchNotifications();
  }, [user, fetchNotifications]);

  const addNotification = useCallback(
    async (n) => {
      if (!user) return;
      const row = {
        user_id: user.id,
        category: n.category || "system",
        title: n.title,
        body: n.body || null,
        link: n.link || null,
        meta: n.meta || null,
        read: false,
      };
      const { data } = await supabase.from("notifications").insert(row).select().maybeSingle();
      pushToast({ type: n.category, title: n.title, message: n.body });
      fetchNotifications();
      return data;
    },
    [user, pushToast, fetchNotifications]
  );

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((c) => c + 1);
          pushToast({ type: payload.new.category, title: payload.new.title, message: payload.new.body });
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, fetchNotifications, pushToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        pushToast,
        dismissToast,
        fetchNotifications,
        markRead,
        markAllRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

export default NotificationContext;
