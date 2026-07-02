export interface PasswordStrength {
  score: number; // 0–4
  label: string;
  color: string; // classe tailwind para a barra (bg-*)
  textColor: string; // classe tailwind para o texto (text-*)
}

export const PASSWORD_RULES: { regex: RegExp; label: string }[] = [
  { regex: /[A-Z]/, label: 'Uma letra maiúscula' },
  { regex: /[a-z]/, label: 'Uma letra minúscula' },
  { regex: /[0-9]/, label: 'Um número' },
  { regex: /[^A-Za-z0-9]/, label: 'Um caractere especial (ex: @#$!)' },
];

const STRENGTH_LEVELS: PasswordStrength[] = [
  { score: 0, label: 'Muito fraca', color: 'bg-red-500', textColor: 'text-red-500' },
  { score: 1, label: 'Fraca', color: 'bg-orange-500', textColor: 'text-orange-500' },
  { score: 2, label: 'Média', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { score: 3, label: 'Forte', color: 'bg-lime-500', textColor: 'text-lime-600' },
  { score: 4, label: 'Muito forte', color: 'bg-green-500', textColor: 'text-green-600' },
];

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return STRENGTH_LEVELS[score];
}

export interface ChangePasswordResult {
  ok: boolean;
  error?: string;
}

export async function callChangePassword(accessToken: string, newPassword: string): Promise<ChangePasswordResult> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    });

    const body = await res.json();
    if (!res.ok) {
      return { ok: false, error: body.error ?? 'Não foi possível alterar a senha. Tente novamente.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Erro inesperado. Tente novamente.' };
  }
}
