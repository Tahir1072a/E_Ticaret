import { Client } from "@elastic/elasticsearch";

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

    const searchResponse = await client.search({
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

    const results = searchResponse.hits.hits.map((hit) => hit._source);

    res.status(200).json(results);
  } catch (err) {
    console.error(
      "ElasticSearch arama hatası",
      err.body ? err.body.error : err
    );
    res.status(500).json({ message: "Arama sırasında bir hata oluştu" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q, role } = req.query;

    const esQuery = {
      bool: {
        must: [],
        filter: [],
      },
    };

    if (q) {
      esQuery.bool.must.push({
        multi_match: {
          query: q,
          fields: [
            "user.name",
            "seller.name",
            "user.surname",
            "seller.surname",
            "user.email",
            "seller.email",
            "user.username",
            "seller.username",
            "orderItems.product.baseProduct.masterName",
          ],
          fuzziness: "AUTO",
        },
      });
    } else {
      esQuery.bool.must.push({ match_all: {} });
    }

    if (role) {
      esQuery.bool.filter.push({
        term: { "role.keyword": role },
      });
    }

    const { body } = await client.search({
      index: "users",
      body: {
        query: esQuery,
      },
    });

    const results = body.hits.hits.map((hit) => hit._source);
    res.status(200).json(results);
  } catch (err) {
    console.log("ElasticSearch arama hatası", err.body ? err.body.error : err);
    res.status(500).json({ message: err.message });
  }
};

export const searchOrders = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ message: "Lütfen bir arama terimi giriniz." });
    }

    const { body } = await client.search({
      index: "orders",
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ["name", "username", "email", "storeName"],
          },
        },
      },
    });

    const results = body.hits.hits.map((hit) => hit._source);
    res.status(200).json(results);
  } catch (err) {
    console.log("ElasticSearch arama hatası", err.body ? err.body.error : err);
    res.status(500).json({ message: err.message });
  }
};
