import express from 'express';
import authUser from '../middlewares/authUser.js';
import authSeller from '../middlewares/authSeller.js';
import {
  getAllOrders,
  getUserOrders,
  placeOrderCOD,
  placeOrderStripe,
  stripeWebhooks,
  updateOrderStatus,
} from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.post('/cod', authUser, placeOrderCOD);
orderRouter.post('/stripe', authUser, placeOrderStripe);
orderRouter.get('/user', authUser, getUserOrders);
orderRouter.get('/seller', authSeller, getAllOrders);
orderRouter.put('/update-status', authSeller, updateOrderStatus);
orderRouter.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhooks);

export default orderRouter;
