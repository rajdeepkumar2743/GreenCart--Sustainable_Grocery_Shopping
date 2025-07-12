// server/middlewares/authSeller.js
import jwt from 'jsonwebtoken';

const authSeller = async (req, res, next) => {
  const { sellerToken } = req.cookies;

  if (!sellerToken) {
    return res.status(401).json({ success: false, message: 'Not Authorized' });
  }

  try {
    const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET);

    if (decoded.email === process.env.SELLER_EMAIL) {
      req.seller = decoded;
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export default authSeller;
