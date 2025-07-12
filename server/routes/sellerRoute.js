import express from 'express';
import {
  isSellerAuth,
  sellerLogin,
  sellerLogout
} from '../controllers/sellerController.js';
import authSeller from '../middlewares/authSeller.js';

const sellerRouter = express.Router();

// ✅ Seller Login (sets cookie)
sellerRouter.post('/login', sellerLogin);

// ✅ Check if seller is authenticated
sellerRouter.get('/is-auth', authSeller, isSellerAuth);

// ✅ Seller Logout (clears cookie)
sellerRouter.get('/logout', sellerLogout);

export default sellerRouter;
