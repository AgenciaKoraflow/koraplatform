import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUser() {
  const [userName, setUserName] = useState<string>("Usuário");

  useEffect(() => {
    const getUserName = async () => {
      try {
        // Try to get from Supabase auth
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user && !error) {
          // Use user metadata or email
          const name = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       "Usuário";
          setUserName(name);
          return;
        }

        // Try to get from localStorage
        const storedName = localStorage.getItem('userName');
        if (storedName) {
          setUserName(storedName);
          return;
        }

        // Try to get from settings (Configuracoes page default)
        const settingsName = localStorage.getItem('userSettings');
        if (settingsName) {
          try {
            const settings = JSON.parse(settingsName);
            if (settings.nome && settings.sobrenome) {
              setUserName(`${settings.nome} ${settings.sobrenome}`);
              return;
            }
          } catch {}
        }

        // Default fallback
        setUserName("Usuário");
      } catch (error) {
        console.error('Error getting user name:', error);
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
