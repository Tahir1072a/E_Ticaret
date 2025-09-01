import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({ node: process.env.ES_NODE });

export const BASEPRODUCT_INDEX = "baseproducts";
export const STOREPRODUCT_INDEX = "storeproducts";

/**
 * Bir dokümanı Elasticsearch'te index'ler veya günceller.
 * @param {string} index - Hedef index adı.
 * @param {string} id - Dokümanın ID'si.
 * @param {object} body - Index'lenecek dokümanın gövdesi.
 */
export const indexDocument = async (index, id, body) => {
  try {
    await esClient.index({
      index,
      id,
      body,
    });

    console.log(
      `Döküman ${id} başarıyla ${index} indexine eklendi/güncellendi`
    );
  } catch (err) {
    console.error(`${index} index'leme hatası: ($id)`, err);
  }
};

/**
 * Bir dokümanı Elasticsearch'ten siler.
 * @param {string} index - Hedef index adı.
 * @param {string} id - Silinecek dokümanın ID'si.
 */
export const deleteDocument = async (index, id) => {
  try {
    await esClient.delete({
      index,
      id,
    });
    console.log(`Döküman ${id} başarıyla ${index} indexinden silindi`);
  } catch (err) {
    if (err.meta && err.meta.statusCode !== 404) {
      console.error(`${index} silme hatasaı (${id}):`, err);
    }
  }
};
