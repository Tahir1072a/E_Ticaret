import {
  esClient,
  STOREPRODUCT_INDEX,
} from "../services/elasticSearchServices.js";

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ message: "Lütfen bir arama terimi giriniz." });
    }

    const { body } = await esClient.search({
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

    const response = await esClient.search({
      index: STOREPRODUCT_INDEX,
      body: {
        query: {
          multi_match: {
            query: q,
            fields: [
              "description",
              "masterName",
              "masterCategoryName",
              "sellerName",
            ],
            fuzziness: "AUTO",
          },
        },
      },
    });

    const results = response.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    }));

    res.status(200).json(results);
  } catch (err) {
    console.error(
      "ElasticSearch arama hatası:",
      err.meta ? err.meta.body : err
    );
    res.status(500).json({ message: "Arama sırasında bir hata oluştu" });
  }
};
