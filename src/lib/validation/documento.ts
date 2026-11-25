const digitos = (v: string) => v.replace(/\D/g, "");

/**
 * CPF e CNPJ conferidos pelos dígitos verificadores, e não só pelo tamanho.
 *
 * O Asaas recusa a cobrança quando o documento não fecha, e a cobrança só nasce no
 * aceite da profissional — horas depois de a cliente sair da tela. Validar aqui é o
 * que impede o erro de aparecer longe de quem pode corrigi-lo.
 */
export function cpfValido(valor: string): boolean {
  const v = digitos(valor);
  if (v.length !== 11 || /^(\d)\1+$/.test(v)) return false;
  const n = v.split("").map(Number);
  const dv = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += n[i] * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === n[9] && dv(10) === n[10];
}

export function cnpjValido(valor: string): boolean {
  const v = digitos(valor);
  if (v.length !== 14 || /^(\d)\1+$/.test(v)) return false;
  const n = v.split("").map(Number);
  const dv = (ate: number) => {
    let peso = ate - 7;
    let soma = 0;
    for (let i = 0; i < ate; i++) {
      soma += n[i] * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === n[12] && dv(13) === n[13];
}

export function documentoValido(valor: string, tipo: "PF" | "PJ"): boolean {
  return tipo === "PJ" ? cnpjValido(valor) : cpfValido(valor);
}

export const somenteDigitos = digitos;
