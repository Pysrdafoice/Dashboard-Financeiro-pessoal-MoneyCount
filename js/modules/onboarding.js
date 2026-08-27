/**
 * modules/onboarding.js — banner de boas-vindas pra quem abre o app pela
 * primeira vez, com um jeito de rever depois ("Como usar" no menu).
 *
 * A preferência "já vi isso" fica numa chave própria do localStorage
 * (fuelcount_onboarding_visto), separada do `estado` financeiro — assim
 * ela nunca entra num backup exportado (não faz sentido "restaurar" se
 * alguém já viu ou não uma tela de boas-vindas) e não precisa de
 * validação/normalização como os dados financeiros precisam.
 */
import { DOM } from '../ui/dom.js';

const CHAVE_LOCALSTORAGE_ONBOARDING = 'fuelcount_onboarding_visto';

// Um card por função do app. Tom sempre de convite ("se quiser") — o tour
// é só apresentação, ninguém precisa preencher nada pra passar pro próximo.
const PASSOS_TOUR = [
  {
    emoji: '🧾',
    titulo: 'Adicionar Gasto',
    texto:
      'Aqui você anota o que gastou, no seu ritmo. Dá pra marcar como Pontual, Fixo (repete todo mês) ou Parcelado — mas nada disso é obrigatório agora, é só pra quando você quiser usar.',
  },
  {
    emoji: '💰',
    titulo: 'Adicionar Ganho',
    texto:
      'Ganhou algo além do salário — um freela, uma venda, um cashback? Registrar aqui é opcional, mas ajuda sua Renda Total a ficar completa.',
  },
  {
    emoji: '⚙️',
    titulo: 'Configuração do Mês',
    texto: 'Seu salário-base fica aqui. Preenche quando quiser — o app lembra dele nos meses seguintes.',
  },
  {
    emoji: '📊',
    titulo: 'Resumo',
    texto: 'Renda, Gastos, Saldo e quanto ainda está Livre pra gastar — tudo numa olhada só, sempre atualizado.',
  },
  {
    emoji: '🐷',
    titulo: 'Guardado',
    texto:
      'Separou um dinheiro de lado? Anota aqui se quiser acompanhar — ele continua seu, só não entra na conta de "gastos".',
  },
  {
    emoji: '🎯',
    titulo: 'Limites por Categoria',
    texto:
      'Se um dia quiser se policiar em alguma categoria (tipo Lazer), pode definir um teto aqui. Totalmente opcional — o app funciona liso sem isso também.',
  },
  {
    emoji: '📋',
    titulo: 'Extrato',
    texto: 'A lista completa dos seus gastos e ganhos do mês, sempre disponível pra revisar quando quiser.',
  },
  {
    emoji: '📈',
    titulo: 'Gráficos',
    texto:
      'Arraste entre os gráficos: pra onde seu dinheiro está indo, sua evolução mês a mês, e quanto você tem guardado de verdade.',
  },
  {
    emoji: '☰',
    titulo: 'Menu',
    texto: 'No menu você exporta seus dados, faz backup, e pode reabrir este tour quando quiser — é só clicar em "Como usar".',
  },
];

let passoAtual = 0;

function marcarComoVisto() {
  try {
    localStorage.setItem(CHAVE_LOCALSTORAGE_ONBOARDING, 'true');
  } catch (e) {
    console.error('Não foi possível salvar a preferência de onboarding.', e);
  }
}

function jaViuAntes() {
  try {
    return localStorage.getItem(CHAVE_LOCALSTORAGE_ONBOARDING) === 'true';
  } catch (e) {
    return false;
  }
}

export function abrirBoasVindas() {
  DOM.onboardingOverlay.classList.remove('hidden');
}

function fecharBoasVindas() {
  DOM.onboardingOverlay.classList.add('hidden');
  marcarComoVisto();
}

/** Chamada uma vez, ao iniciar o app. @returns {boolean} true se era a primeira visita (banner mostrado). */
export function verificarPrimeiraVisita() {
  if (!jaViuAntes()) {
    abrirBoasVindas();
    return true;
  }
  return false;
}

// ---- Tour guiado ----

function renderizarPassoTour() {
  const passo = PASSOS_TOUR[passoAtual];
  DOM.tourEmoji.textContent = passo.emoji;
  DOM.tourTitulo.textContent = passo.titulo;
  DOM.tourTexto.textContent = passo.texto;
  DOM.tourProgresso.textContent = `${passoAtual + 1} de ${PASSOS_TOUR.length}`;

  DOM.btnTourVoltar.classList.toggle('hidden', passoAtual === 0);
  DOM.btnTourProximo.textContent = passoAtual === PASSOS_TOUR.length - 1 ? 'Concluir 🚀' : 'Próximo';
}

function iniciarTour() {
  passoAtual = 0;
  renderizarPassoTour();
  DOM.tourOverlay.classList.remove('hidden');
}

function encerrarTour() {
  DOM.tourOverlay.classList.add('hidden');
  marcarComoVisto();
}

function avancarTour() {
  if (passoAtual === PASSOS_TOUR.length - 1) {
    encerrarTour();
    return;
  }
  passoAtual += 1;
  renderizarPassoTour();
}

function voltarTour() {
  if (passoAtual === 0) return;
  passoAtual -= 1;
  renderizarPassoTour();
}

export function inicializarOnboarding() {
  DOM.btnOnboardingTour.addEventListener('click', () => {
    fecharBoasVindas();
    iniciarTour();
  });
  DOM.btnOnboardingPular.addEventListener('click', fecharBoasVindas);

  DOM.btnTourProximo.addEventListener('click', avancarTour);
  DOM.btnTourVoltar.addEventListener('click', voltarTour);
  DOM.btnTourPular.addEventListener('click', encerrarTour);

  // Reabre a qualquer momento, mesmo pra quem já marcou como visto —
  // é a "porta de volta" que evita a decisão "não mostrar mais" ser irreversível.
  DOM.btnComoUsar.addEventListener('click', () => {
    abrirBoasVindas();
  });
}