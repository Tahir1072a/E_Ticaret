import { Client } from "@elastic/elasticsearch";
import { StoreProduct } from "../models/storeProductModel.js";

const client = new Client({ node: "http://localhost:9200" });

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ message: "Lütfen bir arama terimi giriniz." });
    }

    const { body } = await client.search({
      index: "baseproducts",
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ["masterName", "masterCategoryName"],
            fuzziness: "AUTO",
          },
        },
      },
    });

    const results = body.hits.hits.map((hit) => hit._source);
    res.status(200).json(results);
  } catch (err) {
    console.error(
      "ElasticSearch arama hatası",
      err.body ? err.body.error : err
    );
    res.status(500).json({ message: "Arama sırasında bir hata oluştu" });
  }
};

export const searchStoreProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ message: "Lütfen bir arama terimi giriniz." });
    }
    // ARTIK BÖYLE ARAMA YAPIYORSUNUZ!
    const searchResult = await StoreProduct.search({
      multi_match: {
        query: q,
        fields: [
          "description",
          "baseProduct.masterName",
          "baseProduct.masterCategoryName",
          "seller.storeName",
        ],
        fuzziness: "AUTO",
      },
      hydrate: false, // Hydration'ı kapat
    });
    // Sonuçlar doğrudan searchResult.hits.hits altında gelir.
    const results = searchResult.hits.hits.map((hit) => hit._source);

    res.status(200).json(results);
  } catch (err) {
    console.error("ElasticSearch arama hatası", err);
    res.status(500).json({ message: "Arama sırasında bir hata oluştu" });
  }
};
