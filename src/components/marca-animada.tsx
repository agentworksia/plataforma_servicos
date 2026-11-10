"use client";

import { useEffect, useState } from "react";

// Os dois desenhos têm exatamente os mesmos comandos (M, L, M, C, C). É isso que
// permite o navegador interpolar um no outro em vez de trocar de figura.
const P = "M 26 10 L 26 90 M 26 10 C 62 10 72 19 72 31 C 72 43 62 52 26 52";
const D = "M 26 10 L 26 90 M 26 10 C 72 10 88 28 88 50 C 88 72 72 90 26 90";

const VALORES = [P, P, D, D, P].join(";");
const TEMPOS = "0; 0.35; 0.5; 0.85; 1";
const CURVAS = "0 0 1 1; .45 0 .25 1; 0 0 1 1; .45 0 .25 1";

/** Só entra no DOM quando a animação é permitida; sem ela o traço fica parado no P. */
function Letra({ anima }: { anima: boolean }) {
  if (!anima) return null;
  return (
    <animate
      attributeName="d"
      values={VALORES}
      keyTimes={TEMPOS}
      keySplines={CURVAS}
      calcMode="spline"
      dur="6.5s"
      repeatCount="indefinite"
    />
  );
}

/**
 * A marca viva da capa: a esfera fica parada e só o traço creme se mexe, fechando
 * ora um P, ora um D — Prime, Diárias. O laranja não é desenhado: é o mesmo traço
 * recortado dentro da esfera, como no logo, onde a cor nasce da sobreposição.
 */
export function MarcaAnimada({ className }: { className?: string }) {
  const [anima, setAnima] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplica = () => setAnima(!mq.matches);
    aplica();
    mq.addEventListener("change", aplica);
    return () => mq.removeEventListener("change", aplica);
  }, []);

  return (
    <svg
      viewBox="0 0 114 100"
      role="img"
      aria-label="Símbolo da Prime Diárias alternando entre as letras P e D"
      className={className}
    >
      <defs>
        <radialGradient id="esfera" cx="35%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#8cc0e6" />
          <stop offset="55%" stopColor="#4f8cc0" />
          <stop offset="100%" stopColor="#2b5f93" />
        </radialGradient>
        <clipPath id="recorte-esfera">
          <circle cx="60" cy="60" r="22" />
        </clipPath>
      </defs>

      {/* sombra de apoio, para a esfera pousar em vez de flutuar */}
      <ellipse cx="60" cy="88" rx="26" ry="4.5" fill="#06182c" opacity="0.35" />

      <circle cx="60" cy="60" r="22" fill="url(#esfera)" />

      <path
        d={P}
        fill="none"
        stroke="#f4f0e8"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Letra anima={anima} />
      </path>

      <g clipPath="url(#recorte-esfera)">
        <path
          d={P}
          fill="none"
          stroke="#e8590c"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Letra anima={anima} />
        </path>
      </g>
    </svg>
  );
}
