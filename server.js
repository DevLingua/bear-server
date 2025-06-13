const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const FOURTHWALL_API = "https://storefront-api.fourthwall.com/v1";
const STORE_TOKEN = process.env.FOURTHWALL_TOKEN;

app.post("/api/create-cart", async (req, res) => {
  try {
    // Create a new cart first
    const createCartResponse = await fetch(
      `${FOURTHWALL_API}/carts?storefront_token=${STORE_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: [] }), // required by API
      }
    );

    const rawText = await createCartResponse.text();
    if (!createCartResponse.ok) {
      return res.status(500).json({ error: "Cart creation failed", detail: rawText });
    }

    const cartData = JSON.parse(rawText);
    console.log("CartData", cartData);
    const cartId = cartData.id;

    // Add products to the cart if any
    const items = req.body.items || [];

    console.log(items)
    if (items.length > 0) {
      const addItemsResponse = await fetch(
        `${FOURTHWALL_API}/carts/${cartId}/add?storefront_token=${STORE_TOKEN}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: items.map(item => ({
              // productId: item.id,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const addItemsText = await addItemsResponse.text();
      console.log("Add items response:", addItemsResponse.status, addItemsText);

      if (!addItemsResponse.ok) {
        throw new Error(`Failed to add products: ${addItemsText}`);
      }
    }

    res.status(200).json({ cartId });
  } catch (error) {
    console.error("Failed to create Fourthwall cart:", error);
    res.status(500).json({ error: "Cart creation failed" });
  }
});

app.listen(4000, () => {
  console.log("✅ Server running on http://localhost:4000");
});
