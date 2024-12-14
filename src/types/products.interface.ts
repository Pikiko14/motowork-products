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
  id?: string;
  _id: string;
  name: string;
  model: string;
  state: "Nueva" | "Usada";
  brand: string;
  brand_icon?: string;
  price: number;
  discount?: number;
  category: string;
  type: TypeProducts;
  description?: string;
  banner: ProductsBanners[];
  images: ProductImagesInterface[];
  details: DetailsProducts;
  additionalInfo: AdditionalInfoInterface[];
  createdAt: Date;
}

export enum TypeProducts {
  vehicle = "vehicle",
  product = "product",
}

export enum BannerType {
  mobile = "mobile",
  desktop = "desktop",
}

export interface ProductsBanners {
  path: string;
  type_banner: BannerType;
}

export interface ProductImagesInterface {
  path: string;
  type: BannerType;
}
