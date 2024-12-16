import { Model } from "mongoose";
import BrandsModel from "../models/products.model";
import { ProductsInterface } from "../types/products.interface";
import { PaginationResponseInterface } from "../types/response.interface";

class ProductsRepository {
  private readonly model: Model<ProductsInterface>;

  constructor() {
    this.model = BrandsModel;
  }

  /**
   * Find model by query
   * @param query
   * @returns
   */
  public async findOneByQuery(query: any): Promise<ProductsInterface | null> {
    return await this.model.findOne(query);
  }

  /**
   * Save proeduct in bbdd
   * @param product User
   */
  public async create(
    product: ProductsInterface
  ): Promise<ProductsInterface> {
    const productBd = await this.model.create(product);
    return productBd;
  }

  /**
   * Update product data
   * @param id
   * @param body
   */
  public async update(
    id: string | undefined,
    body: ProductsInterface
  ): Promise<ProductsInterface | void | null> {
    return await this.model.findByIdAndUpdate(id, body, { new: true });
  }

  /**
   * Paginate products
   * @param query - Query object for filtering results
   * @param skip - Number of documents to skip
   * @param perPage - Number of documents per page
   * @param sortBy - Field to sort by (default: "name")
   * @param order - Sort order (1 for ascending, -1 for descending, default: "1")
   */
  public async paginate(
    query: Record<string, any>,
    skip: number,
    perPage: number,
    sortBy: string = "name",
    order: any = "-1",
    fields: string[] = []
  ): Promise<PaginationResponseInterface> {
    try {
      // Parse sort order to ensure it is a number

      const validSortFields = ["name", "createdAt", "price"];
      if (!validSortFields.includes(sortBy)) {
        throw new Error(`Invalid sort field. Allowed fields are: ${validSortFields.join(", ")}`);
      }

      // Fetch paginated data
      const products = await this.model
        .find(query)
        .sort({ [sortBy]: order })
        .select(fields.length > 0 ? fields.join(' ') : '')
        .skip(skip)
        .limit(perPage);

      // Get total count of matching documents
      const totalProducts = await this.model.countDocuments(query);

      // Calculate total pages
      const totalPages = Math.ceil(totalProducts / perPage);

      return {
        data: products,
        totalPages,
        totalItems: totalProducts,
      };
    } catch (error: any) {
      throw new Error(`Pagination failed: ${error.message}`);
    }
  }

  /**
   * Delete products by id
   * @param id
   */
  public async delete(id: string): Promise<ProductsInterface | void | null> {
    return this.model.findByIdAndDelete(id);
  }

  /**
   * get by id
   * @param id
   */
  public async findById(id: string): Promise<ProductsInterface | null> {
    return this.model.findById(id);
  }
}

export default ProductsRepository;
