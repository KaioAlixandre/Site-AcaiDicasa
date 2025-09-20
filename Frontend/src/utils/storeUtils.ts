interface StoreConfig {
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  openDays: string; // '1,2,3,4,5' formato
}

interface StoreStatus {
  isOpen: boolean;
  reason?: string;
  nextOpenTime?: string;
}

export const checkStoreStatus = (config: StoreConfig): StoreStatus => {
  // Se a loja está manualmente fechada
  if (!config.isOpen) {
    return {
      isOpen: false,
      reason: 'A loja está temporariamente fechada.'
    };
  }

  const now = new Date();
  const currentDay = now.getDay().toString(); // 0 = domingo, 1 = segunda, etc.
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  // Verificar se hoje é um dia de funcionamento
  const openDays = config.openDays ? config.openDays.split(',') : [];
  if (!openDays.includes(currentDay)) {
    return {
      isOpen: false,
      reason: 'Hoje não é um dia de funcionamento.',
      nextOpenTime: getNextOpenDay(openDays, config.openingTime)
    };
  }

  // Verificar se está no horário de funcionamento
  if (config.openingTime && config.closingTime) {
    const isWithinHours = isTimeInRange(currentTime, config.openingTime, config.closingTime);
    
    if (!isWithinHours) {
      return {
        isOpen: false,
        reason: `Fora do horário de funcionamento (${config.openingTime} às ${config.closingTime}).`,
        nextOpenTime: getNextOpenTime(config.openingTime, currentTime)
      };
    }
  }

  return {
    isOpen: true
  };
};

const isTimeInRange = (currentTime: string, openTime: string, closeTime: string): boolean => {
  const current = timeToMinutes(currentTime);
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);

  // Se o horário de fechamento é no dia seguinte (ex: 08:00 às 02:00)
  if (close < open) {
    return current >= open || current <= close;
  }

  // Horário normal (ex: 08:00 às 22:00)
  return current >= open && current <= close;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const getNextOpenDay = (openDays: string[], openingTime: string): string => {
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const today = new Date().getDay();
  
  // Encontrar o próximo dia de funcionamento
  for (let i = 1; i <= 7; i++) {
    const nextDay = (today + i) % 7;
    if (openDays.includes(nextDay.toString())) {
      const dayName = dayNames[nextDay];
      return `Próximo funcionamento: ${dayName} às ${openingTime}`;
    }
  }
  
  return 'Verifique os dias de funcionamento';
};

const getNextOpenTime = (openingTime: string, currentTime: string): string => {
  const current = timeToMinutes(currentTime);
  const open = timeToMinutes(openingTime);

  // Se ainda não abriu hoje
  if (current < open) {
    return `Abre hoje às ${openingTime}`;
  }

  // Se já passou do horário, abre amanhã
  return `Abre amanhã às ${openingTime}`;
};