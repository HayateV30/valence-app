export type Locale = 'en' | 'pt-BR';

export interface Translations {
  appName: string;
  tagline: string;
  languageButtonLabel: string;
  languageNextTitle: string;
  auth: {
    heading: string;
    subheading: string;
    signInButton: string;
    signingIn: string;
    formatsNote: string;
    quotaNote: string;
    modelNote: string;
    errorGeneric: string;
    errorPopupClosed: string;
    errorUnverified: string;
  };
  header: {
    presetsLabel: string;
    searchPlaceholder: string;
    searchButton: string;
    searching: string;
    importFile: string;
    dailyActionsUnit: string;
    quotaReachedShort: string;
    signOut: string;
    toggleSidebarOpen: string;
    toggleSidebarClose: string;
  };
  toolbar: {
    representations: {
      'ball-and-stick': string;
      'space-filling': string;
      licorice: string;
      surface: string;
    };
    colorSchemes: {
      cpk: string;
      hydrophobicity: string;
      chain: string;
    };
    autoRotate: string;
    resetView: string;
    exportPng: string;
    hideControls: string;
    showControls: string;
  };
  sidebar: {
    tabs: {
      overview: string;
      bonds: string;
      atoms: string;
    };
    formula: string;
    molarMass: string;
    atomsLabel: string;
    bondsLabel: string;
    avgBondLength: string;
    elementComposition: string;
    bondingBreakdown: string;
    bondOrders: {
      single: string;
      double: string;
      triple: string;
      aromatic: string;
    };
    topBondPairs: string;
    aiSectionTitle: string;
    aiExplainButton: string;
    aiAnalyzing: string;
    aiSummaryOverview: string;
    aiBondingHighlights: string;
    aiGeometryNotes: string;
    aiApplications: string;
    filterBondsPlaceholder: string;
    filterAtomsPlaceholder: string;
    bondTable: {
      pair: string;
      order: string;
      length: string;
      source: string;
      explicit: string;
      inferred: string;
    };
    atomTable: {
      index: string;
      element: string;
      residue: string;
      degree: string;
      coords: string;
    };
    selectedAtomTitle: string;
    selectedBondTitle: string;
    clearSelection: string;
    noMatches: string;
  };
  dropzone: {
    overlayTitle: string;
    overlaySubtitle: string;
  };
  errors: {
    quotaExceeded: string;
    parseFailed: string;
    aiFailed: string;
    webglLost: string;
  };
}

export const TRANSLATIONS: Record<Locale, Translations> = {
  en: {
    appName: 'Valence',
    tagline: '3D Molecular Structure & Bonding Workspace',
    languageButtonLabel: 'EN',
    languageNextTitle: 'Switch to Portuguese (PT-BR)',
    auth: {
      heading: 'Inspect 3D molecular geometry with precision.',
      subheading:
        'Sign in with your Google account to explore PDB, SDF, MOL, XYZ, and CIF structures, switch visualization modes, inspect atomic bonds, and query gemini-4-hydrogen.',
      signInButton: 'Continue with Google',
      signingIn: 'Connecting Google Account...',
      formatsNote: 'PDB · SDF/MOL · XYZ · CIF',
      quotaNote: '25 daily actions per Google account',
      modelNote: 'Powered by gemini-4-hydrogen (free tier)',
      errorGeneric: 'Unable to sign in with Google. Please try again.',
      errorPopupClosed: 'Sign-in window was closed before completing authentication.',
      errorUnverified: 'A verified Google email address is required.',
    },
    header: {
      presetsLabel: 'Preset',
      searchPlaceholder: 'Lookup molecule via AI (e.g. dopamine)...',
      searchButton: 'Lookup',
      searching: 'Searching...',
      importFile: 'Import File',
      dailyActionsUnit: 'daily actions',
      quotaReachedShort: 'Daily limit reached',
      signOut: 'Sign out',
      toggleSidebarOpen: 'Open Inspector',
      toggleSidebarClose: 'Hide Inspector',
    },
    toolbar: {
      representations: {
        'ball-and-stick': 'Ball & Stick',
        'space-filling': 'Space-Filling',
        licorice: 'Licorice',
        surface: 'Electron Surface',
      },
      colorSchemes: {
        cpk: 'CPK Element',
        hydrophobicity: 'Hydrophobicity',
        chain: 'Chain',
      },
      autoRotate: 'Spin',
      resetView: 'Reset View',
      exportPng: 'Snapshot',
      hideControls: 'Hide Controls',
      showControls: 'Show Controls',
    },
    sidebar: {
      tabs: {
        overview: 'Summary',
        bonds: 'Bonding',
        atoms: 'Atoms',
      },
      formula: 'Chemical Formula',
      molarMass: 'Molar Mass',
      atomsLabel: 'Atoms',
      bondsLabel: 'Bonds',
      avgBondLength: 'Mean Bond Length',
      elementComposition: 'Element Composition',
      bondingBreakdown: 'Bond Order Distribution',
      bondOrders: {
        single: 'Single',
        double: 'Double',
        triple: 'Triple',
        aromatic: 'Aromatic',
      },
      topBondPairs: 'Bond Connectivity Pairs',
      aiSectionTitle: 'AI Bonding Analysis',
      aiExplainButton: 'Explain Bonding (gemini-4-hydrogen)',
      aiAnalyzing: 'Analyzing structure...',
      aiSummaryOverview: 'Overview',
      aiBondingHighlights: 'Bonding & Hybridization',
      aiGeometryNotes: '3D Geometry & Polarity',
      aiApplications: 'Chemical Role',
      filterBondsPlaceholder: 'Filter bonds (e.g. C=O, Double)...',
      filterAtomsPlaceholder: 'Filter atoms (e.g. N, C, ALA)...',
      bondTable: {
        pair: 'Bond',
        order: 'Order',
        length: 'Length',
        source: 'Origin',
        explicit: 'Explicit',
        inferred: 'Inferred',
      },
      atomTable: {
        index: '#',
        element: 'Atom',
        residue: 'Residue',
        degree: 'Bonds',
        coords: 'Coordinates (Å)',
      },
      selectedAtomTitle: 'Selected Atom',
      selectedBondTitle: 'Selected Bond',
      clearSelection: 'Clear',
      noMatches: 'No matching entries.',
    },
    dropzone: {
      overlayTitle: 'Drop chemical file to load',
      overlaySubtitle: 'Supports .pdb, .sdf, .mol, .xyz, and .cif formats (1 daily action)',
    },
    errors: {
      quotaExceeded:
        'Daily limit of 25 actions reached for your Google account. Your allowance resets at 00:00 UTC.',
      parseFailed: 'Could not parse chemical file.',
      aiFailed: 'AI request could not be completed.',
      webglLost: 'WebGL rendering context paused. Restoring GPU scene...',
    },
  },
  'pt-BR': {
    appName: 'Valence',
    tagline: 'Visualizador Molecular 3D e Inspetor de Ligações',
    languageButtonLabel: 'PT-BR',
    languageNextTitle: 'Mudar para Inglês (EN)',
    auth: {
      heading: 'Inspecione geometria molecular 3D com precisão.',
      subheading:
        'Entre com sua conta Google para explorar estruturas PDB, SDF, MOL, XYZ e CIF, alternar modos de visualização, analisar ligações atômicas e consultar o gemini-4-hydrogen.',
      signInButton: 'Continuar com o Google',
      signingIn: 'Conectando conta Google...',
      formatsNote: 'PDB · SDF/MOL · XYZ · CIF',
      quotaNote: '25 ações diárias por conta Google',
      modelNote: 'Com gemini-4-hydrogen (camada gratuita)',
      errorGeneric: 'Não foi possível entrar com o Google. Tente novamente.',
      errorPopupClosed: 'A janela de login foi fechada antes de concluir a autenticação.',
      errorUnverified: 'É necessário um endereço de e-mail Google verificado.',
    },
    header: {
      presetsLabel: 'Modelo',
      searchPlaceholder: 'Buscar molécula por IA (ex: dopamina)...',
      searchButton: 'Buscar',
      searching: 'Buscando...',
      importFile: 'Importar Arquivo',
      dailyActionsUnit: 'ações diárias',
      quotaReachedShort: 'Limite diário atingido',
      signOut: 'Sair',
      toggleSidebarOpen: 'Abrir Inspetor',
      toggleSidebarClose: 'Ocultar Inspetor',
    },
    toolbar: {
      representations: {
        'ball-and-stick': 'Bolas e Bastões',
        'space-filling': 'Espacial (CPK)',
        licorice: 'Bastões',
        surface: 'Superfície',
      },
      colorSchemes: {
        cpk: 'Elemento CPK',
        hydrophobicity: 'Hidrofobicidade',
        chain: 'Cadeia',
      },
      autoRotate: 'Girar',
      resetView: 'Resetar Câmera',
      exportPng: 'Captura',
      hideControls: 'Ocultar Controles',
      showControls: 'Mostrar Controles',
    },
    sidebar: {
      tabs: {
        overview: 'Resumo',
        bonds: 'Ligações',
        atoms: 'Átomos',
      },
      formula: 'Fórmula Química',
      molarMass: 'Massa Molar',
      atomsLabel: 'Átomos',
      bondsLabel: 'Ligações',
      avgBondLength: 'Comprimento Médio',
      elementComposition: 'Composição Elemental',
      bondingBreakdown: 'Distribuição das Ligações',
      bondOrders: {
        single: 'Simples',
        double: 'Dupla',
        triple: 'Tripla',
        aromatic: 'Aromática',
      },
      topBondPairs: 'Pares de Ligação',
      aiSectionTitle: 'Análise de Ligações por IA',
      aiExplainButton: 'Explicar Ligações (gemini-4-hydrogen)',
      aiAnalyzing: 'Analisando estrutura...',
      aiSummaryOverview: 'Visão Geral',
      aiBondingHighlights: 'Ligações e Hibridização',
      aiGeometryNotes: 'Geometria 3D e Polaridade',
      aiApplications: 'Papel Químico',
      filterBondsPlaceholder: 'Filtrar ligações (ex: C=O, Dupla)...',
      filterAtomsPlaceholder: 'Filtrar átomos (ex: N, C, ALA)...',
      bondTable: {
        pair: 'Ligação',
        order: 'Ordem',
        length: 'Comp.',
        source: 'Origem',
        explicit: 'Explícita',
        inferred: 'Inferida',
      },
      atomTable: {
        index: '#',
        element: 'Átomo',
        residue: 'Resíduo',
        degree: 'Lig.',
        coords: 'Coordenadas (Å)',
      },
      selectedAtomTitle: 'Átomo Selecionado',
      selectedBondTitle: 'Ligação Selecionada',
      clearSelection: 'Limpar',
      noMatches: 'Nenhum item encontrado.',
    },
    dropzone: {
      overlayTitle: 'Solte o arquivo químico para carregar',
      overlaySubtitle: 'Suporta formatos .pdb, .sdf, .mol, .xyz e .cif (1 ação diária)',
    },
    errors: {
      quotaExceeded:
        'Limite diário de 25 ações atingido para sua conta Google. O limite reinicia às 00:00 UTC.',
      parseFailed: 'Não foi possível ler o arquivo químico.',
      aiFailed: 'Não foi possível concluir a consulta de IA.',
      webglLost: 'Contexto WebGL pausado. Restaurando cena GPU...',
    },
  },
};
