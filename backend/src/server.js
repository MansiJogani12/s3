import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[TeamSync Server Running]: http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
});
