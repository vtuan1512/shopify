import { Layout, Page, Text, Card, Button, Box, ResourceList, Thumbnail, ResourceItem, Modal } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { ProductIcon } from "@shopify/polaris-icons";
import { useState } from 'react';

export const loader = async ({ request }) => {
  const response = await fetch("http://magento2.localhost.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        {
          products(filter: {}) {
            items {
              id
              name
              sku
              price {
                regularPrice {
                  amount {
                    value
                    currency
                  }
                }
              }
              image {
                url
              }
            }
          }
        }
      `,
    }),
  });

  const { data } = await response.json();
  return json({ products: data.products.items });
};



export default function Blogs() {
  const { products } = useLoaderData();
  // const [modalActive, setModalActive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalActive, setDetailModalActive] = useState(false);

  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setDetailModalActive(true);
  };

  const renderMedia = (imageUrl) => {
    return imageUrl ? (
      <Thumbnail source={imageUrl} alt="Product Image" />
    ) : (
      <Thumbnail source={ProductIcon} alt="Product" />
    );
  };


  const renderItem = (item) => {
    const { id, name, sku, price, image } = item;
    const { value, currency } = price.regularPrice.amount;

    return (
      <ResourceItem id={id} media={renderMedia(image?.url)}>
        <Text as="h5" variant="bodyMd">
          {name}
        </Text>
        <div>SKU: {sku}</div>
        <Text as="p">
          Giá: {value} {currency}
        </Text>
        <Button onClick={() => handleViewDetail(item)}>View Detail</Button>
      </ResourceItem>
    );
  };


  return (
    <Page title="Products">
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{ singular: "Product", plural: "Products" }}
              items={products}
              renderItem={renderItem}
            />
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={detailModalActive}
        onClose={() => setDetailModalActive(false)}
        title={selectedProduct?.name}
        primaryAction={{
          content: "Close",
          onAction: () => setDetailModalActive(false),
        }}
      >
        <Modal.Section>
          <Box padding="500">
            <Text as="p" variant="bodyMd">
              SKU: {selectedProduct?.sku}
            </Text>
            <Text as="p" variant="bodyMd">
              Giá: {selectedProduct?.price.regularPrice.amount.value}{" "}
              {selectedProduct?.price.regularPrice.amount.currency}
            </Text>
            {selectedProduct?.image?.url && (
              <img
                src={selectedProduct.image.url}
                alt="Product Image"
                style={{ maxWidth: "100%" }}
              />
            )}
          </Box>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
