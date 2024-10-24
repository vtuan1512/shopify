import {
  IndexTable,
  LegacyCard,
  Text,
  Thumbnail,
  Badge,
  Modal,
  Button,
  FormLayout,
  TextField,
  Toast,
  Frame,
  ButtonGroup,
  Page,
} from "@shopify/polaris";
import { useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import { ProductIcon } from "@shopify/polaris-icons";
import {authenticate} from "../shopify.server.js";
import React, { useState, useEffect, Suspense } from "react";
import 'react-quill/dist/quill.snow.css';
const ReactQuill = React.lazy(() => import('react-quill'));

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = admin.graphql(`
    query fetchProducts {
      products(first: 20) {
        edges {
          node {
            id
            title
            handle
            status
            description
            featuredImage {
              url
              altText
            }
            variants(first: 1) {
              edges {
                node {
                  id
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
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [active, setActive] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [price, setPrice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [variantId, setVariantId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalActive, setDetailModalActive] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setDetailModalActive(true);
  };

  const renderMedia = (image) => {
    return image ? (
      <Thumbnail source={image.url} alt={image.altText} />
    ) : (
      <Thumbnail source={ProductIcon} alt="Product" />
    );
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setDescription(product.description);
    setPrice(parseFloat(product.variants.edges[0].node.price));
    setVariantId(product.variants.edges[0]?.node.id);
    setActive(true);
  };

  const handleModalChange = () => {
    setActive(false);
    setEditingProduct(null);
  };

  const isValidShopifyId = (id) => {
    const regex = /^gid:\/\/shopify\/Product\/\d+$/;
    return regex.test(id);
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (!isValidShopifyId(editingProduct.id)) {
      console.error("Invalid Shopify Product ID format");
      setToastContent("Invalid Product ID format.");
      setToastActive(true);
      setIsSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append("id", editingProduct.id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("variantId", variantId);

    fetcher.submit(formData, { method: "POST", action: "/app/products/edit" });
  };

  const handleDelete = async (productId) => {
    setDeletingProductId(productId);
    await fetcher.submit({ id: productId }, { method: "POST", action: "/app/products/delete" });
  };

  useEffect(() => {
    if (fetcher.state === "idle") {
      if (fetcher.data?.success) {
        setToastContent(fetcher.data.success);
        setToastActive(true);
        setActive(false);
      } else if (fetcher.data?.errors) {
        console.error(fetcher.data.errors);
        setToastContent("Failed to update the product.");
        setToastActive(true);
      }
      setIsSaving(false);
      setDeletingProductId(null);
      fetcher.load("/app/products");
    }
  }, [fetcher.state, fetcher.data]);
  // const {selectedResources, allResourcesSelected, handleSelectionChange} =
  //   useIndexResourceState(products);

  const rowMarkup = products.map(({ node }) => {
    const { id, title, status, description, featuredImage, variants } = node;
    const price = variants.edges[0]?.node.price || 0;

    return (
      <IndexTable.Row
        id={id}
        key={id}
        // selected={selectedResources.includes(id)}
        position={node}
      >
        <IndexTable.Cell>{renderMedia(featuredImage)}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as={"span"}>
            {title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge
            tone={
              status === "ACTIVE"
                ? "success"
                : status === "DRAFT"
                  ? "info"
                    : "neutral"
            }
          >
            {status}
          </Badge>


        </IndexTable.Cell>
        <IndexTable.Cell>{description}</IndexTable.Cell>
        <IndexTable.Cell>${parseFloat(price)}</IndexTable.Cell>
        <IndexTable.Cell>
          <ButtonGroup>
            <Button  onClick={() => handleViewDetail(node)}>View</Button>
            <Button variant="primary" onClick={() => handleEdit(node)}>Edit</Button>
            <Button variant="primary" tone="critical" onClick={() => handleDelete(id)} loading={deletingProductId === id}>
              Delete
            </Button>
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Frame>
      <Page
        title="Products"
        titleMetadata={<Badge status="success">New</Badge>}
        primaryAction={{ content: 'Create a new product', onAction: () => navigate('/app/new') }}
      >
        {/*<Link to={`/app/new`}>*/}
        {/*  <Button variant="primary">Create a new product</Button>*/}
        {/*</Link>*/}

        <LegacyCard>
          <IndexTable
            resourceName={resourceName}
            itemCount={products.length}
            // selectedItemsCount={
            //   allResourcesSelected ? 'All' : selectedResources.length
            // }
            // onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Image" },
              { title: "Title" },
              { title: "Status" },
              { title: "Description" },
              { title: "Price" },
              { title: "Actions" },
            ]}
          >
            {rowMarkup}
          </IndexTable>
        </LegacyCard>

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
            <Text as="p">
              Title: {selectedProduct?.title}
              <br />
              Status: {selectedProduct?.status}
              <br />
              Price: ${selectedProduct?.variants.edges[0]?.node.price}
            </Text>
            {selectedProduct?.featuredImage && (
              <img
                src={selectedProduct.featuredImage.url}
                alt={selectedProduct.featuredImage.altText}
                style={{ maxWidth: "100%" }}
              />
            )}
          </Modal.Section>
        </Modal>

        <Modal
          open={active}
          onClose={handleModalChange}
          title="Edit Product"
          primaryAction={{
            content: "Save",
            onAction: handleSave,
            loading: isSaving,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: handleModalChange,
            },
          ]}
        >
          <Modal.Section>
            <FormLayout>
              <TextField label="Title" value={title} onChange={setTitle}  autoComplete={null}/>
              <TextField label="Price" value={price} onChange={setPrice}  autoComplete={null}/>
              <Text as="p" variant="bodyMd">
                Description
              </Text>
              <div style={{ marginTop: '10px' }}>
                <Suspense >
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    style={{
                      height: '350px',
                      overflowY: 'auto',
                      maxHeight: '400px'
                    }}
                    modules={{
                      toolbar: [
                        [{ header: '1' }, { header: '2' }, { font: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['bold', 'italic', 'underline'],
                        ['image', 'code-block'],
                        [{ 'align': [] }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['clean'],
                      ],
                    }}
                  />
                </Suspense>
              </div>
            </FormLayout>
          </Modal.Section>
        </Modal>

        {toastActive && <Toast content={toastContent} onDismiss={() => setToastActive(false)} />}
      </Page>
    </Frame>
  );
}
