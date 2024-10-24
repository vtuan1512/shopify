import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server.js";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const title = formData.get("title");
  const description = formData.get("description");
  // const price = formData.get("price");

  try {
    const createResponse = await admin.graphql(`
      mutation createProduct($productInput: ProductInput!) {
        productCreate(input: $productInput) {
          product {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: {
        productInput: {
          title,
          descriptionHtml: description,
          // variants: [{ price }],
        },
      },
    });

    if (createResponse.errors) {
      console.error("Creation errors:", createResponse.errors);
      return json({ errors: createResponse.errors }, { status: 400 });
    }

    return json({ success: "Product created successfully!" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return json({ error: error.message || "Unexpected error occurred" }, { status: 500 });
  }

};
