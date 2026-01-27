import { useMemo } from 'react';

// Top 100 most common passwords to block
const COMMON_PASSWORDS = new Set([
  '123456', 'password', '123456789', '12345678', '12345', '1234567', '1234567890',
  'qwerty', 'abc123', 'monkey', '1234', '111111', '123123', 'dragon', 'master',
  'iloveyou', 'trustno1', 'baseball', 'letmein', 'sunshine', 'ashley', 'princess',
  'welcome', 'shadow', 'superman', 'michael', 'football', 'password1', '123qwe',
  'admin', 'passw0rd', 'hello', 'charlie', 'donald', 'password123', 'qwerty123',
  'mustang', 'access', 'freedom', 'whatever', 'qazwsx', 'ninja', 'azerty', 'solo',
  'loveme', 'master123', 'qwertyuiop', 'login', 'starwars', 'bailey', 'flower',
  'dragon123', 'soccer', 'passpass', 'test123', 'yankees', 'thunder', 'tigger',
  'thomas', 'hockey', 'ranger', 'daniel', 'jordan', 'buster', 'harley', 'robert',
  'matthew', 'andrew', 'george', 'mercedes', 'corvette', 'austin', 'yellow',
  '000000', 'abcdef', 'abcd1234', 'qwer1234', 'asdf1234', 'zxcv1234', 'pass1234',
  'senha', 'senha123', 'mudar123', 'trocar123', 'admin123', 'teste123', 'brasil',
  'flamengo', 'palmeiras', 'corinthians', 'saopaulo', 'santos', 'cruzeiro',
  'gremio', 'inter', 'botafogo', 'vasco', 'atletico', 'bahia', 'sport', 'ceara',
  '102030', '010203', '112233', '121212', '131313', '010101', '123321'
]);

export interface PasswordStrength {
  score: number; // 0-5
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    notCommon: boolean;
  };
  isValid: boolean;
  feedback: string[];
}

export function usePasswordValidation(password: string): PasswordStrength {
  return useMemo(() => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password),
      notCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
    };

    const feedback: string[] = [];
    
    if (!requirements.length) {
      feedback.push('Mínimo 8 caracteres');
    }
    if (!requirements.uppercase) {
      feedback.push('Uma letra maiúscula');
    }
    if (!requirements.lowercase) {
      feedback.push('Uma letra minúscula');
    }
    if (!requirements.number) {
      feedback.push('Um número');
    }
    if (!requirements.notCommon) {
      feedback.push('Esta senha é muito comum');
    }

    // Calculate score (0-5)
    let score = 0;
    if (requirements.length) score++;
    if (requirements.uppercase) score++;
    if (requirements.lowercase) score++;
    if (requirements.number) score++;
    if (requirements.special) score++;
    
    // Penalize common passwords
    if (!requirements.notCommon) {
      score = Math.max(0, score - 3);
    }

    // Determine label and color based on score
    let label: string;
    let color: string;

    if (password.length === 0) {
      label = '';
      color = 'bg-muted';
    } else if (score <= 1) {
      label = 'Muito fraca';
      color = 'bg-destructive';
    } else if (score === 2) {
      label = 'Fraca';
      color = 'bg-orange-500';
    } else if (score === 3) {
      label = 'Razoável';
      color = 'bg-yellow-500';
    } else if (score === 4) {
      label = 'Forte';
      color = 'bg-emerald-500';
    } else {
      label = 'Muito forte';
      color = 'bg-green-600';
    }

    // Password is valid if it meets minimum requirements (length + not common + at least 3 char types)
    const charTypesCount = [
      requirements.uppercase,
      requirements.lowercase,
      requirements.number,
      requirements.special,
    ].filter(Boolean).length;

    const isValid = requirements.length && requirements.notCommon && charTypesCount >= 2;

    return {
      score,
      label,
      color,
      requirements,
      isValid,
      feedback,
    };
  }, [password]);
}
