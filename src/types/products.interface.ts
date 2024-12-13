export interface AdditionalField {
  name: string;
  value: string;
}

export interface SubsectionInterface {
  subsectionName: string;
  fields: AdditionalField[];
}

export interface AdditionalInfoInterface {
  sectionName: string;
  subsections: SubsectionInterface[];
}

export interface DetailsProducts {
  power: string;
  licenseType: string;
  storage: string;
  testDrive: boolean;
  colors: string[];
}

export interface ProductsInterface {
  name: string;
  model: string;
  state: "Nueva" | "Usada";
  brand: string;
  price: number;
  discount?: number;
  category: string;
  description?: string;
  banner: string;
  images: string[];
  details: DetailsProducts;
  additionalInfo: AdditionalInfoInterface[];
  createdAt: Date;
}
