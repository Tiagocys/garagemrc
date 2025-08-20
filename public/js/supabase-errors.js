// Map simples e robusto por substring/status.
// Mantém a mensagem original no console para debug.
export function translateSupabaseError(error) {
  if (!error) return "Ocorreu um erro. Tente novamente.";
  const raw = String(error.message || error.error_description || "").trim();
  const msg = raw.toLowerCase();
  const status = error.status || error.code;

  // Casos por status (quando vier)
  if (status === 429) return "Muitas tentativas. Tente novamente mais tarde.";
  if (status === 401 && /invalid/.test(msg)) return "E-mail ou senha inválidos.";

  // Casos por mensagem
  if (/new password.*different|should be different/.test(msg))
    return "A nova senha deve ser diferente da anterior.";
  if (/password.*least.*6|password.*length/.test(msg))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (/invalid login|invalid credentials/.test(msg))
    return "E-mail ou senha inválidos.";
  if (/email not confirmed|confirm your email/.test(msg))
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
  if (/user already registered|already registered/.test(msg))
    return "Este e-mail já está cadastrado.";
  if (/user not found/.test(msg))
    return "Não encontramos uma conta com este e-mail.";
  if (/rate limit|too many requests|email rate limit exceeded/.test(msg))
    return "Muitas tentativas. Tente novamente mais tarde.";
  if (/signup.*disabled|signups not allowed/.test(msg))
    return "Cadastros estão desativados no momento.";
  if (/invalid email|email is invalid/.test(msg))
    return "E-mail inválido. Verifique o endereço informado.";
  if (/invalid.*token|token.*expired|link.*expired|link.*invalid/.test(msg))
    return "Link inválido ou expirado. Solicite um novo link.";
  if (/password cannot be empty/.test(msg))
    return "Informe uma senha.";
  if (/password sign-in is disabled/.test(msg))
    return "O login por senha está desativado para esta conta.";
  if (/network/.test(msg))
    return "Falha de rede. Tente novamente.";

  // Fallback genérico
  console.warn("[Supabase error]", error);
  return raw || "Ocorreu um erro. Tente novamente.";
}
