import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB raw file limit
const AVATAR_PX = 256;                   // output dimensions
const BUCKET = "avatars";
const UPLOAD_RETRIES = 2;

// Module-level cache: survives component unmount/remount so subsequent callers
// get the URL instantly without another round-trip, eliminating flicker.
let _fetched = false;
let _avatarCache: string | null = null;
let _emailCache: string | null = null;

export function useUserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(_fetched ? _avatarCache : null);
  const [userEmail, setUserEmail] = useState<string | null>(_fetched ? _emailCache : null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      if (_fetched) {
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
    loadAvatar();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Clear module cache on logout to prevent leaking one user's avatar to the next
        _fetched = false;
        _avatarCache = null;
        _emailCache = null;
      } else {
        _avatarCache = session?.user?.user_metadata?.avatar_url ?? null;
        _emailCache = session?.user?.email ?? null;
        _fetched = true;
      }
      setAvatarUrl(_avatarCache);
      setUserEmail(_emailCache);
    });

    return () => subscription.unsubscribe();
  }, []);

  const uploadAvatar = useCallback(async (file: File): Promise<void> => {
    if (!file) return;

    if (file.size > MAX_INPUT_BYTES) {
      setUploadError("Arquivo muito grande. Máximo 5 MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const blob = await compressToBlob(file, AVATAR_PX);
      const storagePath = `${user.id}/avatar.jpg`;

      // Retry loop — network glitches are common on mobile
      let lastErr: Error | null = null;
      for (let attempt = 0; attempt <= UPLOAD_RETRIES; attempt++) {
        const { error } = await supabase.storage.from(BUCKET).upload(storagePath, blob, {
          contentType: "image/jpeg",
          upsert: true,
          cacheControl: "31536000", // 1-year CDN cache; URL versioning handles invalidation
        });
        if (!error) { lastErr = null; break; }
        lastErr = new Error(error.message);
        if (attempt < UPLOAD_RETRIES) await sleep(500 * (attempt + 1));
      }
      if (lastErr) throw lastErr;

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      // Append a version token so browsers and CDNs discard the stale cached image
      const versionedUrl = `${publicUrl}?v=${Date.now()}`;

      await supabase.auth.updateUser({ data: { avatar_url: versionedUrl } });

      _avatarCache = versionedUrl;
      setAvatarUrl(versionedUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha no upload";
      setUploadError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Returns the current user's avatar URL when the given display name matches them
  const getAvatarForName = useCallback((name: string): string | null => {
    if (!avatarUrl || !name || !userEmail) return null;
    const nameLower = name.toLowerCase().trim();
    const emailPrefix = userEmail.split("@")[0].toLowerCase();
    const firstName = emailPrefix.split(/[._-]/)[0];
    const nameFirst = nameLower.split(/\s+/)[0];
    if (
      nameLower === emailPrefix ||
      nameFirst === firstName ||
      nameLower === userEmail.toLowerCase()
    ) return avatarUrl;
    return null;
  }, [avatarUrl, userEmail]);

  return { avatarUrl, userEmail, uploadAvatar, isUploading, uploadError, getAvatarForName };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function compressToBlob(file: File, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      // Center-crop to square before scaling
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Falha ao comprimir imagem"));
        },
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Falha ao carregar imagem"));
    };

    img.src = objectUrl;
  });
}
