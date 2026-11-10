import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { ApiKey } from "../../.medusa/types/query-entry-points";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["gb", "de", "dk", "se", "fr", "es", "it", "ro"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    // create the default sales channel
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        {
          currency_code: "ron",
          is_default: true,
        },
        {
          currency_code: "eur",
        },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Romania",
          currency_code: "ron",
          countries: ["ro"],
          payment_providers: ["pp_system_default"],
        },
        {
          name: "Europa",
          currency_code: "eur",
          countries: countries.filter((country) => country !== "ro"),
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const regionRomania = regionResult[0];
  const regionEuropa = regionResult[1];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Prajitoria Boaba - Craiova",
          address: {
            city: "Craiova",
            country_code: "RO",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "European Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Europe",
        geo_zones: [
          {
            country_code: "gb",
            type: "country",
          },
          {
            country_code: "de",
            type: "country",
          },
          {
            country_code: "dk",
            type: "country",
          },
          {
            country_code: "se",
            type: "country",
          },
          {
            country_code: "fr",
            type: "country",
          },
          {
            country_code: "es",
            type: "country",
          },
          {
            country_code: "it",
            type: "country",
          },
          {
            country_code: "ro",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Curier rapid",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Curier rapid",
          description: "Livrare la adresă în 24-48 de ore.",
          code: "curier",
        },
        prices: [
          {
            currency_code: "ron",
            amount: 19,
          },
          {
            currency_code: "eur",
            amount: 4,
          },
          {
            region_id: regionRomania.id,
            amount: 19,
          },
          {
            region_id: regionEuropa.id,
            amount: 4,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Easybox",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Easybox",
          description: "Ridicare din locker în 1-2 zile.",
          code: "easybox",
        },
        prices: [
          {
            currency_code: "ron",
            amount: 12,
          },
          {
            currency_code: "eur",
            amount: 2.5,
          },
          {
            region_id: regionRomania.id,
            amount: 12,
          },
          {
            region_id: regionEuropa.id,
            amount: 2.5,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Ridicare din prăjitorie",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Ridicare personală",
          description: "Ridici comanda din prăjitoria din Craiova.",
          code: "ridicare",
        },
        prices: [
          {
            currency_code: "ron",
            amount: 0,
          },
          {
            currency_code: "eur",
            amount: 0,
          },
          {
            region_id: regionRomania.id,
            amount: 0,
          },
          {
            region_id: regionEuropa.id,
            amount: 0,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  let publishableApiKey: ApiKey | null = null;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: {
      type: "publishable",
    },
  });

  publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Webshop",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });

    publishableApiKey = publishableApiKeyResult as ApiKey;
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Espresso",
          handle: "espresso",
          is_active: true,
        },
        {
          name: "Filtru",
          handle: "filtru",
          is_active: true,
        },
        {
          name: "Decofeinizată",
          handle: "decofeinizata",
          is_active: true,
        },
        {
          name: "Accesorii",
          handle: "accesorii",
          is_active: true,
        },
      ],
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Etiopia Yirgacheffe",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Filtru")!.id,
          ],
          description:
            "Cafea de specialitate din regiunea Yirgacheffe, Etiopia. Prăjire light, potrivită pentru V60, Chemex și AeroPress.",
          handle: "etiopia-yirgacheffe",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800",
            },
          ],
          metadata: {
            origine: "Etiopia",
            prajire: "Light",
            note: "iasomie, bergamotă, piersică",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "ETH-YIR-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 45,
                  currency_code: "ron",
                },
                {
                  amount: 9,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "ETH-YIR-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 85,
                  currency_code: "ron",
                },
                {
                  amount: 17,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "ETH-YIR-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 160,
                  currency_code: "ron",
                },
                {
                  amount: 32,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Columbia Huila",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Filtru")!.id,
          ],
          description:
            "Cafea spălată din regiunea Huila, Columbia. Prăjire medie, echilibrată și dulce, bună pentru filtru și French press.",
          handle: "columbia-huila",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800",
            },
          ],
          metadata: {
            origine: "Columbia",
            prajire: "Medium",
            note: "caramel, ciocolată, mere roșii",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "COL-HUI-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 42,
                  currency_code: "ron",
                },
                {
                  amount: 8.5,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "COL-HUI-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 80,
                  currency_code: "ron",
                },
                {
                  amount: 16,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "COL-HUI-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 150,
                  currency_code: "ron",
                },
                {
                  amount: 30,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Brazilia Santos",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Espresso")!.id,
          ],
          description:
            "Cafea naturală din Brazilia, cu corp plin și aciditate scăzută. Baza clasică pentru espresso și băuturi cu lapte.",
          handle: "brazilia-santos",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800",
            },
          ],
          metadata: {
            origine: "Brazilia",
            prajire: "Medium-Dark",
            note: "ciocolată neagră, alune, caramel",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "BRA-SAN-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 38,
                  currency_code: "ron",
                },
                {
                  amount: 7.5,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "BRA-SAN-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 72,
                  currency_code: "ron",
                },
                {
                  amount: 14.5,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "BRA-SAN-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 135,
                  currency_code: "ron",
                },
                {
                  amount: 27,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Kenya AA Nyeri",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Filtru")!.id,
          ],
          description:
            "Boabe AA din regiunea Nyeri, Kenya. Prăjire light, acidulată și fructată, ideală pentru V60 și Chemex.",
          handle: "kenya-aa-nyeri",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800",
            },
          ],
          metadata: {
            origine: "Kenya",
            prajire: "Light",
            note: "coacăze negre, grapefruit, roșii",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "KEN-NYE-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 52,
                  currency_code: "ron",
                },
                {
                  amount: 10.5,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "KEN-NYE-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 98,
                  currency_code: "ron",
                },
                {
                  amount: 19.5,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "KEN-NYE-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 185,
                  currency_code: "ron",
                },
                {
                  amount: 37,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Guatemala Antigua",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Espresso")!.id,
          ],
          description:
            "Cafea de altitudine din Antigua, Guatemala, crescută pe sol vulcanic. Espresso dens, cu note de cacao și condimente.",
          handle: "guatemala-antigua",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
            },
          ],
          metadata: {
            origine: "Guatemala",
            prajire: "Medium",
            note: "cacao, scorțișoară, coajă de portocală",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "GUA-ANT-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 46,
                  currency_code: "ron",
                },
                {
                  amount: 9,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "GUA-ANT-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 88,
                  currency_code: "ron",
                },
                {
                  amount: 17.5,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "GUA-ANT-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 165,
                  currency_code: "ron",
                },
                {
                  amount: 33,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Mexic Chiapas Decaf",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Decofeinizată")!.id,
          ],
          description:
            "Cafea din Chiapas, Mexic, decofeinizată prin metoda Swiss Water, fără solvenți chimici. Gust plin, fără cofeină.",
          handle: "mexic-chiapas-decaf",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
            },
          ],
          metadata: {
            origine: "Mexic",
            prajire: "Medium",
            note: "ciocolată cu lapte, nucă, zahăr brun",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "MEX-DEC-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 44,
                  currency_code: "ron",
                },
                {
                  amount: 9,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "MEX-DEC-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 84,
                  currency_code: "ron",
                },
                {
                  amount: 17,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "MEX-DEC-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 158,
                  currency_code: "ron",
                },
                {
                  amount: 31.5,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Rwanda Huye",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Filtru")!.id,
          ],
          description:
            "Cafea spălată din districtul Huye, Rwanda, cultivată de mici fermieri. Prăjire light, delicată și fructată.",
          handle: "rwanda-huye",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1525088553748-01d6e210e00b?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1525088553748-01d6e210e00b?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=800",
            },
          ],
          metadata: {
            origine: "Rwanda",
            prajire: "Light",
            note: "zmeură, ceai negru, miere",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "RWA-HUY-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 50,
                  currency_code: "ron",
                },
                {
                  amount: 10,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "RWA-HUY-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 95,
                  currency_code: "ron",
                },
                {
                  amount: 19,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "RWA-HUY-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 178,
                  currency_code: "ron",
                },
                {
                  amount: 35.5,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Indonezia Sumatra Mandheling",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Espresso")!.id,
          ],
          description:
            "Cafea procesată semi-spălat (wet-hulled) din Sumatra. Corp foarte plin, aciditate mică, perfectă pentru espresso intens.",
          handle: "indonezia-sumatra-mandheling",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800",
            },
          ],
          metadata: {
            origine: "Indonezia",
            prajire: "Dark",
            note: "pământ umed, cedru, ciocolată neagră",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "IDN-SUM-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 45,
                  currency_code: "ron",
                },
                {
                  amount: 9,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "IDN-SUM-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 86,
                  currency_code: "ron",
                },
                {
                  amount: 17,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "IDN-SUM-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 160,
                  currency_code: "ron",
                },
                {
                  amount: 32,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Costa Rica Tarrazú",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Filtru")!.id,
          ],
          description:
            "Cafea honey din regiunea Tarrazú, Costa Rica, crescută la peste 1.500 m. Dulce, curată și luminoasă.",
          handle: "costa-rica-tarrazu",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1504627298434-2119d6928e93?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1504627298434-2119d6928e93?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1518057111178-44a106bad636?w=800",
            },
          ],
          metadata: {
            origine: "Costa Rica",
            prajire: "Medium",
            note: "miere, citrice, migdale",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "CRI-TAR-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 48,
                  currency_code: "ron",
                },
                {
                  amount: 9.5,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "CRI-TAR-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 92,
                  currency_code: "ron",
                },
                {
                  amount: 18.5,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "CRI-TAR-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 172,
                  currency_code: "ron",
                },
                {
                  amount: 34.5,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "India Monsooned Malabar",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Espresso")!.id,
          ],
          description:
            "Boabe expuse vânturilor musonice pe coasta Malabar, India. Aciditate foarte mică și corp gros, potrivit pentru espresso.",
          handle: "india-monsooned-malabar",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1516743619420-154b70a65fea?w=800",
            },
          ],
          metadata: {
            origine: "India",
            prajire: "Dark",
            note: "condimente, tutun dulce, cacao",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "IND-MAL-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 40,
                  currency_code: "ron",
                },
                {
                  amount: 8,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "IND-MAL-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 76,
                  currency_code: "ron",
                },
                {
                  amount: 15,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "IND-MAL-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 142,
                  currency_code: "ron",
                },
                {
                  amount: 28.5,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Peru Cajamarca Decaf",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Decofeinizată")!.id,
          ],
          description:
            "Cafea organică din Cajamarca, Peru, decofeinizată natural cu apă (Swiss Water). Blândă și dulce, pentru seară.",
          handle: "peru-cajamarca-decaf",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1533776992670-a72f4c28235e?w=800",
            },
          ],
          metadata: {
            origine: "Peru",
            prajire: "Medium",
            note: "caramel, migdale prăjite, cacao",
          },
          options: [
            {
              title: "Gramaj",
              values: ["250 g", "500 g", "1 kg"],
            },
          ],
          variants: [
            {
              title: "250 g",
              sku: "PER-DEC-250",
              weight: 250,
              options: {
                Gramaj: "250 g",
              },
              prices: [
                {
                  amount: 46,
                  currency_code: "ron",
                },
                {
                  amount: 9,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "500 g",
              sku: "PER-DEC-500",
              weight: 500,
              options: {
                Gramaj: "500 g",
              },
              prices: [
                {
                  amount: 88,
                  currency_code: "ron",
                },
                {
                  amount: 17.5,
                  currency_code: "eur",
                },
              ],
            },
            {
              title: "1 kg",
              sku: "PER-DEC-1000",
              weight: 1000,
              options: {
                Gramaj: "1 kg",
              },
              prices: [
                {
                  amount: 165,
                  currency_code: "ron",
                },
                {
                  amount: 33,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Dripper V60 ceramic",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Accesorii")!.id,
          ],
          description:
            "Dripper conic din ceramică pentru prepararea manuală a cafelei la filtru. Mărimea 02, pentru 1–4 căni.",
          handle: "dripper-v60-ceramic",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1545665225-b23b99e4d45e?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1545665225-b23b99e4d45e?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1497636577773-f1231844b336?w=800",
            },
          ],
          options: [
            {
              title: "Model",
              values: ["Standard"],
            },
          ],
          variants: [
            {
              title: "Standard",
              sku: "ACC-V60",
              weight: 400,
              options: {
                Model: "Standard",
              },
              prices: [
                {
                  amount: 89,
                  currency_code: "ron",
                },
                {
                  amount: 18,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Râșniță electrică pentru filtru",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Accesorii")!.id,
          ],
          description:
            "Râșniță electrică cu pietre plate, cu 31 de trepte de măcinare. Gândită pentru V60, Chemex și French press.",
          handle: "rasnita-electrica-filtru",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail:
            "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=800",
          images: [
            {
              url: "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=800",
            },
            {
              url: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800",
            },
          ],
          options: [
            {
              title: "Model",
              values: ["Standard"],
            },
          ],
          variants: [
            {
              title: "Standard",
              sku: "ACC-RAS",
              weight: 2500,
              options: {
                Model: "Standard",
              },
              prices: [
                {
                  amount: 749,
                  currency_code: "ron",
                },
                {
                  amount: 150,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });

  // Stoc mic intenționat (pentru badge-ul „Stoc limitat”):
  // cheia = începutul SKU-ului, valoarea = câte bucăți are fiecare variantă
  const stocMic: Record<string, number> = {
    "KEN-NYE": 3,
    "ACC-V60": 4,
  };

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    const prefix = Object.keys(stocMic).find((p) =>
      inventoryItem.sku?.startsWith(p)
    );
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: prefix ? stocMic[prefix] : 1000000,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Finished seeding inventory levels data.");
}
