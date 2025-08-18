import { Client } from "@elastic/elasticsearch";

const client = new Client({ node: "http://localhost:9200" });

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.body;

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
      err.body ? err.body.error : error
    );
    res.status(500).json({ message: "Arama sırasında bir hata oluştu" });
  }
};

export const searchStoreProducts = async (req, res) => {
  try {
    const { q } = req.body;

    if (!q) {
      return res
        .status(400)
        .json({ message: "Lütfen bir arama terimi giriniz." });
    }

    const { body } = await client.search({
      index: "storeproducts",
      body: {
        query: {
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
        },
      },
    });

    const results = body.hits.hits.map((hit) => hit._source);
    res.status(200).json(results);
  } catch (err) {
    console.error(
      "ElasticSearch arama hatası",
      err.body ? err.body.error : error
    );
    res.status(500).json({ message: "Arama sırasında bir hata oluştu" });
  }
};
