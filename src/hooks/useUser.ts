import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache: persists across re-renders to prevent flickering
let _userNameCache = "Usuário";
let _userNameFetched = false;

export function useUser() {
  // Initialize from cache immediately — no async flicker on re-render
  const [userName, setUserName] = useState<string>(_userNameCache);

  useEffect(() => {
    const getUserName = async () => {
      try {
        // If already fetched, just sync the cache value
        if (_userNameFetched) {
          setUserName(_userNameCache);
          return;
        }

        // Try to get from Supabase auth
        const { data: { user }, error } = await supabase.auth.getUser();

        if (user && !error) {
          // Use user metadata or email
          const name = user.user_metadata?.full_name ||
                       user.user_metadata?.name ||
                       user.email?.split('@')[0] ||
                       "Usuário";
          _userNameCache = name;
          _userNameFetched = true;
          setUserName(name);
          return;
        }

        // Try to get from localStorage
        const storedName = localStorage.getItem('userName');
        if (storedName) {
          _userNameCache = storedName;
          _userNameFetched = true;
          setUserName(storedName);
          return;
        }

        // Try to get from settings (Configuracoes page default)
        const settingsName = localStorage.getItem('userSettings');
        if (settingsName) {
          try {
            const settings = JSON.parse(settingsName);
            if (settings.nome && settings.sobrenome) {
              const fullName = `${settings.nome} ${settings.sobrenome}`;
              _userNameCache = fullName;
              _userNameFetched = true;
              setUserName(fullName);
              return;
            }
          } catch {}
        }

        // Default fallback
        _userNameCache = "Usuário";
        _userNameFetched = true;
        setUserName("Usuário");
      } catch (error) {
        console.error('Error getting user name:', error);
        _userNameCache = "Usuário";
        _userNameFetched = true;
        setUserName("Usuário");
      }
    };

    getUserName();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name ||
                     session.user.user_metadata?.name ||
                     session.user.email?.split('@')[0] ||
                     "Usuário";
        _userNameCache = name;
        _userNameFetched = true;
        setUserName(name);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return userName;
}
