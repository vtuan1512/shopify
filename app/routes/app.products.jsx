import { Layout, Page, Text, Card, Button, Box, ResourceList, Thumbnail, ResourceItem, Modal } from "@shopify/polaris";
import { authenticate } from "../shopify.server.js";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { ProductIcon } from "@shopify/polaris-icons";
import { useState } from 'react';

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = admin.graphql(`
    query fetchProducts {
      products(first: 10) {
        edges {
          node {
            id
            title
            handle
            featuredImage {
              url
              altText
            }
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      }
    }
  `);

  const productsData = (await (await response).json()).data;
  return json({ products: productsData.products.edges });
};

export default function Products() {
  const { products } = useLoaderData();
  const [modalActive, setModalActive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalActive, setDetailModalActive] = useState(false);

  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setDetailModalActive(true);
  };

  const renderMedia = (image) => {
    return image ? (
      <Thumbnail source={image.url} alt={image.altText} />
    ) : (
      <Thumbnail source={ProductIcon} alt={"Product"} />
    );
  };

  const renderItem = (item) => {
    const { id, title, handle, featuredImage, variants } = item.node;
    const price = parseFloat(variants.edges[0].node.price);

    return (
      <ResourceItem id={id} media={renderMedia(featuredImage)}>
        <Text as="h5" variant="bodyMd">
          {title}
        </Text>
        <div>{handle}</div>
        <Text as="h5">Giá: ${price}</Text>
        <Button onClick={() => handleViewDetail(item.node)}>View Detail</Button>
      </ResourceItem>
    );
  };

  return (
    <Page title="Products">
      <Button variant="primary" onClick={() => setModalActive(true)}>
        Create a new product
      </Button>

      <Modal
        open={modalActive}
        onClose={() => setModalActive(false)}
        title="Create a new product"
        primaryAction={{
          content: "OK",
          onAction: () => setModalActive(false),
        }}
      >
        <Modal.Section>
          <Box padding="500">
            This is where you will create the form to create a new product.
          </Box>
        </Modal.Section>
      </Modal>

      <Modal
        open={detailModalActive}
        onClose={() => setDetailModalActive(false)}
        title={selectedProduct?.title}
        primaryAction={{
          content: "Close",
          onAction: () => setDetailModalActive(false),
        }}
      >
        <Modal.Section>
          <Box padding="500">
            <Text as="p" variant="bodyMd">
              Title: {selectedProduct?.handle}
            </Text>
            <Text as="p" variant="bodyMd">
              Giá: ${selectedProduct?.variants.edges[0].node.price}
            </Text>
            {selectedProduct?.featuredImage && (
              <img
                src={selectedProduct.featuredImage.url}
                alt={selectedProduct.featuredImage.altText}
                style={{ maxWidth: "100%" }}
              />
            )}
          </Box>
        </Modal.Section>
      </Modal>

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
    </Page>
  );
}
