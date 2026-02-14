import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function safeFormatDate(date, formatStr = 'dd/MM/yyyy HH:mm') {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

export function safeFormatDateOnly(date) {
  return safeFormatDate(date, 'dd/MM/yyyy');
}

export function safeFormatTime(date) {
  return safeFormatDate(date, 'HH:mm');
}