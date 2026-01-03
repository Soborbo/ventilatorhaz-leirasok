// Product data types

export type DataStatus = 'biztos' | 'kovetkeztetett' | 'hianyzo';

export interface ProductData {
  // Basic info
  termek_nev: string;
  gyarto: string;
  kategoria: 'furdoszoba_axialis' | 'furdoszoba_radialis' | 'csoventilator' | 'ipari' | 'hovisszanyero';
  ar_ft?: number;
  
  // Technical specs
  zajszint_db?: number;
  legszallitas_m3h?: number;
  nyomas_pa?: number;
  teljesitmeny_w?: number;
  aramfelvetel_a?: number;
  fordulatszam_rpm?: number;
  
  // Physical
  csoatmero_mm?: number;
  tomeg_kg?: number;
  meret_mm?: { hossz: number; szelesseg: number; magassag: number };
  
  // Features
  ip_vedelem?: string;
  csapagy_tipus?: 'siklócsapágy' | 'golyóscsapágy';
  visszacsapo_szelep?: boolean;
  konnyu_tisztitas?: boolean;
  antisztatikus?: boolean;
  fedett_lapat?: boolean;
  dizajn_orientalt?: boolean;
  
  // Control options
  funkciok?: ('alapjárat' | 'időrelé' | 'páraérzékelő' | 'mozgásérzékelő' | 'légminőség-érzékelő')[];
  
  // Industrial specific
  elettartam_ora?: number;
  min_uzemi_homerseklet?: number;
  max_uzemi_homerseklet?: number;
  hlavedelem_auto_ujraindulas?: boolean;
  
  // URLs
  pdf_url?: string;
  meretrajz_url?: string;
  jelleggorbe_url?: string;
}

export interface ExtractedData {
  field: keyof ProductData;
  value: unknown;
  status: DataStatus;
  source?: string; // Where in PDF this was found
}

export interface PositionedData {
  product: ProductData;
  positioning: {
    zajszint_kategoria?: string;
    zajszint_diff_percent?: number;
    legszallitas_kategoria?: string;
    teljesitmeny_kategoria?: string;
    ar_kategoria?: string;
    kiemelkedo_tulajdonsagok: string[];
  };
}

export interface UspBlock {
  id: string;
  title: string;
  paragraph_1: string;
  paragraph_2?: string;
  image_url: string;
  image_alt: string;
  selected: boolean;
  order: number;
}

export interface GeneratedContent {
  rovid_leiras: string;
  html_leiras: string;
  faq?: {
    question: string;
    answer: string;
  }[];
}

// App state
export interface AppState {
  currentPhase: 1 | 2 | 3 | 4;
  extractedData: ExtractedData[];
  positionedData: PositionedData | null;
  selectedUsps: UspBlock[];
  generatedContent: GeneratedContent | null;
  isLoading: boolean;
  error: string | null;
}

// API types
export interface ClaudeExtractionRequest {
  pdf_content?: string;
  pdf_url?: string;
  gyarto: string;
  kategoria: ProductData['kategoria'];
}

export interface ClaudeExtractionResponse {
  extracted_data: ExtractedData[];
  confidence: number;
  warnings?: string[];
}

export interface ClaudeGenerationRequest {
  product: ProductData;
  positioning: PositionedData['positioning'];
  selected_usps: UspBlock[];
  template_type: 'lakossagi' | 'ipari';
}

export interface ClaudeGenerationResponse {
  rovid_leiras: string;
  html_leiras: string;
  faq?: { question: string; answer: string }[];
}
