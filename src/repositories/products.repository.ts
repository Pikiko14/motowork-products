import { Model, ModifyResult } from "mongoose";
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
  public async create(product: ProductsInterface): Promise<ProductsInterface> {
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
        throw new Error(
          `Invalid sort field. Allowed fields are: ${validSortFields.join(
            ", "
          )}`
        );
      }

      // Fetch paginated data
      const products = await this.model
        .find(query)
        .sort({ [sortBy]: order })
        .select(fields.length > 0 ? fields.join(" ") : "")
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
  public async delete(
    id: string
  ): Promise<ProductsInterface | void | null | any> {
    return await this.model.findOneAndDelete({ _id: id });
  }

  /**
   * get by id
   * @param id
   */
  public async findById(id: string): Promise<ProductsInterface | null> {
    return await this.model.findById(id);
  }

  // count documents
  public async countDocument(query: any): Promise<number> {
    return await this.model.countDocuments(query);
  }

  // get similar products
  public async getSimilarProducts(
    category?: string,
    productId?: string,
    limit = 4
  ) {
    return await this.model.aggregate([
      {
        $match: {
          category,
          _id: { $ne: productId }, // Convertir productId a ObjectId
        },
      },
      { $sample: { size: limit } },
    ]);
  }

  /**
   * Get most sellers products
   * @param { string } skuString
   * @returns
   */
  public async getMostSellesData(skuString: string) {
    const skuList = skuString.split(",");
    return await this.model.find(
      {
        sku: { $in: skuList },
      },
      { _id: 1, name: 1, price: 1, sku: 1, banner: 1 }
    );
  }

  /**
   * get count product publish
   * @param from
   * @param to
   * @returns 
   */
  loadPorductPublishInPeriod = async (from: Date, to: Date) => {
    const results = await this.model.aggregate([
      {
        $match: {
          createdAt: {
            $gte: from,
            $lte: to,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          products: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // orden ascendente por fecha
      },
    ]);
  
    return results;
  }

  public async deleteMany(query: any): Promise<any> {
    return await this.model.deleteMany(query);
  }
}

export default ProductsRepository;
