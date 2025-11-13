// import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
//   // Later
// });

// export { stripe };

// src/server.ts
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
