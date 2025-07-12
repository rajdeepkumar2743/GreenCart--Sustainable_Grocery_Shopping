import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";



const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

// Place Order COD
export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, items, address } = req.body;
    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    amount += Math.floor(amount * 0.02); // Add 2% tax

    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "COD",
    });

    const user = await User.findById(userId);
    await sendEmail({
      to: user.email,
      subject: "Order Placed - GreenCart",
      html: getOrderEmail(user.name, order._id, "Order Preparing"),
    });

    return res.json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Place Order Stripe
export const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, address } = req.body;
    const { origin } = req.headers;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let productData = [];
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      productData.push({
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity,
      });
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    amount += Math.floor(amount * 0.02);

    if (amount < 50) {
      return res.json({
        success: false,
        message: "Minimum order value must be at least ₹50 for online payments.",
      });
    }

    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "Online",
    });

    const line_items = productData.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: { name: item.name },
        unit_amount: Math.floor(item.price + item.price * 0.02) * 100,
      },
      quantity: item.quantity,
    }));

    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId,
      },
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Webhook
export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: event.data.object.id,
      });
      const { orderId, userId } = session.data[0].metadata;

      await Order.findByIdAndUpdate(orderId, { isPaid: true });
      await User.findByIdAndUpdate(userId, { cartItems: {} });

      const user = await User.findById(userId);
      await sendEmail({
        to: user.email,
        subject: "Payment Successful - GreenCart",
        html: getOrderEmail(user.name, orderId, "Paid"),
      });

      break;
    }
    case "payment_intent.payment_failed": {
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: event.data.object.id,
      });
      const { orderId } = session.data[0].metadata;
      await Order.findByIdAndDelete(orderId);
      break;
    }
    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
};

// Get User Orders
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    }).populate("items.product address").sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get All Orders for Seller
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    }).populate("items.product address").sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.json({ success: false, message: "Invalid data" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    order.orderStatus = status;
    await order.save();

    const user = await User.findById(order.userId);
    await sendEmail({
      to: user.email,
      subject: `Order Status Updated - ${status}`,
      html: getOrderEmail(user.name, order._id, status),
    });

    res.json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Helper HTML email generator
const getOrderEmail = (name, orderId, status) => {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.6;color:#333;background:linear-gradient(145deg,#f9f9f9,#e6f2e6);padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:600px;margin:0 auto;border:1px solid #d4d4d4;">
      
      <h2 style="color:#2e7d32;">Hello ${name},</h2>
      
      <p style="margin-top:20px;">Your order <strong style="color:#1b5e20;">#${orderId}</strong> status has been updated.</p>
      
      <p style="margin:10px 0;"><strong>Status:</strong> 
        <span style="color:${status.toLowerCase() === 'delivered' ? '#2e7d32' : status.toLowerCase() === 'cancelled' ? '#d32f2f' : '#f9a825'};font-weight:bold;">
          ${status}
        </span>
      </p>
      
      <hr style="margin:30px 0;border:none;border-top:1px solid #ccc;">
      
      <p style="font-size:15px;">Thank you for shopping with <strong style="color:#388e3c;">GreenCart</strong>!</p>
    </div>
  `;
};

