import { inject, injectable } from "inversify";
import { HttpStatus, TYPES, FILE_NAME, QUEUE_KEY, JOB_KEY } from "constant";
import { ILogger, CustomError, R2Service, QueueService } from "utils";
import { InventoryRepository, ProductRecipeRepository, ProductRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreateProduct, UpdateProduct } from "models";

@injectable()
export class ProductService extends BaseService {
    constructor(
        @inject(TYPES.ProductRepository) private readonly productRepository: ProductRepository,
        @inject(TYPES.ProductRecipeRepository) private readonly productRecipeRepository: ProductRecipeRepository,
        @inject(TYPES.InventoryRepository) private readonly inventoryRepository: InventoryRepository,
        @inject(TYPES.R2Service) private readonly r2Service: R2Service,
        @inject(TYPES.QueueService) private readonly queueService: QueueService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
        this.initializeImageProcessingQueue();
    }

    private initializeImageProcessingQueue(): void {
        this.queueService.createQueue(QUEUE_KEY.PRODUCT_QUEUE);

        this.queueService.registerProcessor(JOB_KEY.UPLOAD_PRODUCT_IMAGE, this.processImageUpload.bind(this));
        this.queueService.registerProcessor(JOB_KEY.DELETE_PRODUCT_IMAGE, this.processImageDelete.bind(this));

        this.logger.info("Product image processing queue initialized");
    }

    private async processImageUpload(job: any): Promise<void> {
        const { productId, productName, fileBuffer, mimeType } = job.data;

        try {
            this.logger.info(`Background job: Processing image upload for product ${productId}`);
            const timestamp = Date.now().toString();
            const fileName = FILE_NAME.PRODUK(productId, productName, timestamp);
            const imageUrl = await this.r2Service.uploadFile(fileName, Buffer.from(fileBuffer), mimeType);

            await this.productRepository.update(productId, { image_url: imageUrl });
            this.logger.info(`Background job: Successfully uploaded image for product ${productId}`);
        } catch (error) {
            this.logger.error(
                `Background job: Failed to process image for product ${productId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }

    private async processImageDelete(job: any): Promise<void> {
        const { imageUrl } = job.data;

        try {
            this.logger.info("Background job: Processing image deletion");
            const url = new URL(imageUrl);
            const imagePath = decodeURIComponent(url.pathname.substring(1));

            await this.r2Service.deleteFile(imagePath);
            this.logger.info(`Background job: Successfully deleted image at ${imagePath}`);
        } catch (error) {
            this.logger.error(
                `Background job: Failed to delete image: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }

    async getAllProducts() {
        try {
            const products = await this.productRepository.findAll();
            return this.excludeMetaFields(products);
        } catch (error) {
            this.logger.error(`Error getting all products: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to retrieve products", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getProductAvailableStock(productId: number) {
        try {
            const product = await this.productRepository.findById(productId);
            if (!product) {
                throw new CustomError("Product not found", HttpStatus.NOT_FOUND);
            }

            const productWithRecipes = await this.productRecipeRepository.findByProductId(productId);

            if (!productWithRecipes || !productWithRecipes.recipes || productWithRecipes.recipes.length === 0) {
                return {
                    ...this.excludeMetaFields(product),
                    possible_qty: 0,
                    message: "No recipes found for this product",
                };
            }

            let maxPossibleQuantity: number | null = null;
            let limitingIngredients: any[] = [];

            for (const recipe of productWithRecipes.recipes) {
                const inventory = await this.inventoryRepository.findById(recipe.inventory_id);
                if (!inventory) {
                    throw new CustomError(
                        `Inventory item ${recipe.inventory_id} referenced in recipe not found`,
                        HttpStatus.NOT_FOUND,
                    );
                }

                const quantityNeeded = Number(recipe.quantity_used);
                const inventoryAvailable = Number(inventory.quantity);
                const possibleQuantity = Math.floor(inventoryAvailable / quantityNeeded);

                const ingredientInfo = {
                    inventory_id: inventory.id,
                    name: inventory.name,
                    available: inventoryAvailable,
                    unit: inventory.unit,
                    neededPerUnit: quantityNeeded,
                    possibleQuantity: possibleQuantity,
                };

                if (maxPossibleQuantity === null || possibleQuantity < maxPossibleQuantity) {
                    maxPossibleQuantity = possibleQuantity;
                    limitingIngredients = [ingredientInfo];
                } else if (possibleQuantity === maxPossibleQuantity) {
                    limitingIngredients.push(ingredientInfo);
                }
            }

            return this.excludeMetaFields({ ...product, possible_qty: maxPossibleQuantity });
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error calculating product stock availability for ID ${productId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to calculate product availability", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAllProductsAvailableStock() {
        try {
            // Get all products
            const products = await this.productRepository.findAll();
            const results = [];

            for (const product of products) {
                try {
                    const productAvailability = await this.getProductAvailableStock(product.id);
                    results.push(productAvailability);
                } catch (error) {
                    this.logger.error(
                        `Error calculating stock for product ${product.id}: ${error instanceof Error ? error.message : String(error)}`,
                    );

                    results.push(this.excludeMetaFields({ ...product, possible_qty: 0 }));
                }
            }

            return results;
        } catch (error) {
            this.logger.error(
                `Error calculating all products stock availability: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to calculate products availability", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getProductById(id: number) {
        try {
            const product = await this.productRepository.findById(id);

            if (!product) {
                throw new CustomError("Product not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(product);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error getting product by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve product", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getProductsByCategory(categoryId: number) {
        try {
            const products = await this.productRepository.findByCategory(categoryId);
            return this.excludeMetaFields(products);
        } catch (error) {
            this.logger.error(
                `Error getting products by category ${categoryId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve products by category", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createProduct(data: CreateProduct, file?: Express.Multer.File) {
        try {
            const product = await this.productRepository.create(data);
            this.logger.info(`Created product ${product.name} with ID ${product.id}`);

            const result = this.excludeMetaFields(product);

            if (file) {
                await this.queueService.addJob(QUEUE_KEY.PRODUCT_QUEUE, JOB_KEY.UPLOAD_PRODUCT_IMAGE, {
                    productId: product.id,
                    productName: product.name,
                    fileBuffer: [...new Uint8Array(file.buffer)],
                    mimeType: file.mimetype,
                });

                this.logger.info(`Scheduled background image upload for product ${product.id}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`Error creating product: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to create product", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateProduct(id: number, data: UpdateProduct, file?: Express.Multer.File) {
        try {
            const existingProduct = await this.productRepository.findById(id);
            if (!existingProduct) {
                throw new CustomError("Product not found", HttpStatus.NOT_FOUND);
            }

            if (file) {
                if (existingProduct.image_url) {
                    await this.queueService.addJob(QUEUE_KEY.PRODUCT_QUEUE, JOB_KEY.DELETE_PRODUCT_IMAGE, {
                        imageUrl: existingProduct.image_url,
                    });
                    this.logger.info(`Scheduled deletion of old image for product ${id}`);
                }

                data.image_url = "processing";
                await this.queueService.addJob(QUEUE_KEY.PRODUCT_QUEUE, JOB_KEY.UPLOAD_PRODUCT_IMAGE, {
                    productId: id,
                    productName: data.name || existingProduct.name,
                    fileBuffer: [...new Uint8Array(file.buffer)],
                    mimeType: file.mimetype,
                });

                this.logger.info(`Scheduled background image upload for updated product ${id}`);
            }

            const updatedProduct = await this.productRepository.update(id, data);
            const result = this.excludeMetaFields(updatedProduct);

            return result;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error updating product ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update product", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteProduct(id: number) {
        try {
            const product = await this.productRepository.findById(id);
            if (!product) {
                throw new CustomError("Product not found", HttpStatus.NOT_FOUND);
            }

            if (product.image_url) {
                await this.queueService.addJob(QUEUE_KEY.PRODUCT_QUEUE, JOB_KEY.DELETE_PRODUCT_IMAGE, {
                    imageUrl: product.image_url,
                });
                this.logger.info(`Scheduled deletion of image for product ${id}`);
            }

            await this.productRepository.delete(id);
            return { success: true, message: "Product deleted successfully" };
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error deleting product ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete product", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
