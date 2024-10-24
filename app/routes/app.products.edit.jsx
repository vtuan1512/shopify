import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server.js";

export const action = async ({ request }) => {
  const {admin} = await authenticate.admin(request);
  const formData = await request.formData();
  const id = formData.get("id");
  const title = formData.get("title");
  const description = formData.get("description");
  // const price = formData.get("price");
  // const variantId = formData.get("variantId");
  try {

    const updateResponse = await admin.graphql(`
      mutation updateProduct($productInput: ProductInput!) {
        productUpdate(input: $productInput) {
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
          id,
          title,
          descriptionHtml: description,
          // variants: [{ id:variantId, price: parseFloat(price) }]
        },
      },
    });
    console.log("Update response:", updateResponse);
    if (updateResponse.errors) {
      console.error("Update errors:", updateResponse.errors);
      return json({ errors: updateResponse.errors }, { status: 400 });
    }

    return json({ success: "Product updated successfully!" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return json({ error: "Unexpected error occurred" }, { status: 500 });
  }
};

// export const action = async ({ request }) => {
//   const admin = await authenticate.admin(request);
//   const formData = await request.formData();
//   const id = formData.get("id");
//   const title = formData.get("title");
//   const price = formData.get("price");
//   const variantId = formData.get("variantId");
//   try {
//
//     const updateResponse = await admin.graphql(`
//       mutation updateProductAndVariant($productInput: ProductInput!, $variantInput: ProductVariantInput!) {
//         productUpdate(input: $productInput) {
//           product {
//             id
//             title
//           }
//         }
//         productVariantUpdate(input: $variantInput) {
//           productVariant {
//             id
//             price
//           }
//         }
//       }
//     `, {
//       variables: {
//         productInput: {
//           id,
//           title,
//         },
//         variantInput: {
//           id: variantId,
//           price,
//         },
//       },
//     });
//
//     if (updateResponse.errors) {
//       console.error("Update errors:", updateResponse.errors);
//       return json({ errors: updateResponse.errors }, { status: 400 });
//     }
//
//     return json({ success: true });
//   } catch (error) {
//     console.error("Unexpected error:", error);
//     return json({ error: "Unexpected error occurred" }, { status: 500 });
//   }
// };

