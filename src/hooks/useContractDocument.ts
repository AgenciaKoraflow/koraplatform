import { supabase } from "@/integrations/supabase/client";

const BUCKET = "contracts-documents";
const SIGNED_URL_TTL = 3600; // 1 hour

export function useContractDocument() {
  /**
   * Upload a file to Storage and return its path.
   * contractId must exist before calling (insert contract first).
   */
  const upload = async (
    contractId: string,
    file: File,
    version: number,
  ): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `contracts/${contractId}/v${version}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "application/pdf",
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error(`Upload falhou: ${error.message}`);
    return path;
  };

  /** Generate a short-lived signed URL for a stored document. */
  const getSignedUrl = async (
    path: string,
    expiresIn = SIGNED_URL_TTL,
  ): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresIn);
    if (error) throw new Error(`URL assinada falhou: ${error.message}`);
    return data.signedUrl;
  };

  /** Remove a stored file (e.g. when replacing a document). */
  const remove = async (path: string): Promise<void> => {
    await supabase.storage.from(BUCKET).remove([path]);
  };

  return { upload, getSignedUrl, remove };
}
