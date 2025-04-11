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
  power: number;
  weight: string;
  max_power: string;
  torque: string;
  type_engine: string;
  colors: ColorsInterface[];
}

export interface ColorsInterface {
  hex: string;
  image?: string;
}

export interface ProductsInterface {
  id?: string;
  _id: string;
  name: string;
  model: string;
  state: "Nueva" | "Usada";
  dive_test: boolean;
  brand: string;
  brand_icon?: string;
  price: number;
  discount?: number;
  category: string;
  sku?: string;
  type: TypeProducts;
  description?: string;
  banner: ProductsBanners[];
  images: ProductImagesInterface[];
  details: DetailsProducts;
  additionalInfo: AdditionalInfoInterface[];
  createdAt: Date;
  active: boolean;
  variants?: VariantInterface[];
  reviews: ReviewsInterface[];
}

export interface ReviewsInterface {
  date?: string;
  amount: number;
  name: string;
  description?: string;
  id?: string;
  quantity?: number;
}

export interface VariantInterface {
  sku: string;
  attribute: string;
  description?: string;
  image?: string;
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
  _id?: string;
}
