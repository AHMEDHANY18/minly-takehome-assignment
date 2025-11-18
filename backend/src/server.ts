import express from 'express';
import dotenv from 'dotenv';
import app from './app';
import './config/redis';
import v1Router from './routes/v1';
import logger from './config/logger';
import mongoose from 'mongoose';
import { config } from './config';

// Load environment variables
dotenv.config();

const PORT = config.port || 4040;


// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});