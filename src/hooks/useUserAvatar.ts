import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB raw file limit
const AVATAR_PX = 256;                   // output dimensions
const BUCKET = "avatars";
const UPLOAD_RETRIES = 2;

// Module-level cache so subsequent callers get the URL without another round-trip.
let _fetched = false;
let _avatarCache: string | null = null;

export function useUserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(_fetched ? _avatarCache : null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      if (_fetched) {
        setAvatarUrl(_avatarCache);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      _avatarCache = profile?.avatar_url ?? null;
      _fetched = true;
      setAvatarUrl(_avatarCache);
    };
    loadAvatar();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        _fetched = false;
        _avatarCache = null;
        setAvatarUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Uploads to storage and returns the versioned public URL.
  // The caller is responsible for saving the URL to profiles.avatar_url.
  const uploadAvatarToStorage = useCallback(async (file: File): Promise<string> => {
    if (file.size > MAX_INPUT_BYTES) throw new Error("Arquivo muito grande. Máximo 5 MB.");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const blob = await compressToBlob(file, AVATAR_PX);
    const storagePath = `${user.id}/avatar.jpg`;

    let lastErr: Error | null = null;
    for (let attempt = 0; attempt <= UPLOAD_RETRIES; attempt++) {
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, blob, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "31536000",
      });
      if (!error) { lastErr = null; break; }
      lastErr = new Error(error.message);
      if (attempt < UPLOAD_RETRIES) await sleep(500 * (attempt + 1));
    }
    if (lastErr) throw lastErr;

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return `${publicUrl}?v=${Date.now()}`;
  }, []);

  // Convenience wrapper: upload + update local cache.
  // Saving to profiles.avatar_url must be done by the caller (use useUpdateProfile).
  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const url = await uploadAvatarToStorage(file);
      _avatarCache = url;
      _fetched = true;
      setAvatarUrl(url);
      return url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha no upload";
      setUploadError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [uploadAvatarToStorage]);

  return { avatarUrl, uploadAvatar, isUploading, uploadError };
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
