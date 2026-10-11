// The shape of the legal pages (privacy statement, terms of use): a title,
// an intro and sections. Rendered by components/LegalPage.tsx.

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
  /** A small table: who processes what. */
  processors?: { name: string; purpose: string; location: string }[];
};

export type LegalContent = { title: string; updatedLabel: string; intro: string; sections: LegalSection[] };
