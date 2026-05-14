import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache: survives component unmount/remount so subsequent callers
// (e.g. Projetos.tsx on every mount) get the value instantly without waiting for
// another async fetch, eliminating the initials → photo flicker.
let _fetched = false;
let _avatarCache: string | null = null;
let _emailCache: string | null = null;

export function useUserAvatar() {
  // Initialise directly from cache when available — no flicker on remount
  const [avatarUrl, setAvatarUrl] = useState<string | null>(_fetched ? _avatarCache : null);
  const [userEmail, setUserEmail] = useState<string | null>(_fetched ? _emailCache : null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const getAvatar = async () => {
      if (_fetched) {
        // Already loaded by another instance — sync local state immediately
        setAvatarUrl(_avatarCache);
        setUserEmail(_emailCache);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      _avatarCache = user?.user_metadata?.avatar_url ?? null;
      _emailCache = user?.email ?? null;
      _fetched = true;
      setAvatarUrl(_avatarCache);
      setUserEmail(_emailCache);
    };
    getAvatar();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      _avatarCache = session?.user?.user_metadata?.avatar_url ?? null;
      _emailCache = session?.user?.email ?? null;
      _fetched = true;
      setAvatarUrl(_avatarCache);
      setUserEmail(_emailCache);
    });

    return () => subscription.unsubscribe();
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const base64 = await compressAndEncode(file, 128);
      await supabase.auth.updateUser({ data: { avatar_url: base64 } });
      _avatarCache = base64;
      setAvatarUrl(base64);
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Returns the photo URL if the given name matches the current logged-in user
  const getAvatarForName = useCallback((name: string): string | null => {
    if (!avatarUrl || !name || !userEmail) return null;
    const nameLower = name.toLowerCase().trim();
    const emailPrefix = userEmail.split("@")[0].toLowerCase();
    // Match by first name or email prefix
    const firstName = emailPrefix.split(/[._-]/)[0];
    const nameFirst = nameLower.split(/\s+/)[0];
    if (
      nameLower === emailPrefix ||
      nameFirst === firstName ||
      nameLower === userEmail.toLowerCase()
    ) return avatarUrl;
    return null;
  }, [avatarUrl, userEmail]);

  return { avatarUrl, userEmail, uploadAvatar, isUploading, getAvatarForName };
}

function compressAndEncode(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };

    img.onerror = reject;
    img.src = url;
  });
}
