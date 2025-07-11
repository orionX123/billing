
import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply middleware
router.use(authenticate);
router.use(requireSuperAdmin);
router.use(apiRateLimiter);

// Create database backup
router.post('/create', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${timestamp}.sql`;
    const backupPath = path.join(process.cwd(), 'backups', backupFileName);

    // Ensure backups directory exists
    const backupsDir = path.dirname(backupPath);
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const pgDump = spawn('pg_dump', [
      process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      '--no-owner',
      '--no-privileges',
      '--format=custom'
    ]);

    const writeStream = fs.createWriteStream(backupPath);
    pgDump.stdout.pipe(writeStream);

    pgDump.on('close', (code) => {
      if (code === 0) {
        logger.info(`Database backup created: ${backupFileName}`);
        res.json({
          message: 'Backup created successfully',
          filename: backupFileName,
          path: backupPath,
          timestamp: new Date().toISOString()
        });
      } else {
        logger.error(`Backup process failed with code: ${code}`);
        res.status(500).json({
          error: 'Backup failed',
          message: 'Failed to create database backup'
        });
      }
    });

    pgDump.on('error', (error) => {
      logger.error('Backup error:', error);
      res.status(500).json({
        error: 'Backup failed',
        message: error.message
      });
    });
  } catch (error) {
    logger.error('Create backup error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create backup'
    });
  }
});

// List available backups
router.get('/list', async (req, res) => {
  try {
    const backupsDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupsDir)) {
      return res.json({ backups: [] });
    }

    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());

    res.json({ backups });
  } catch (error) {
    logger.error('List backups error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to list backups'
    });
  }
});

// Download backup file
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(process.cwd(), 'backups', filename);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        error: 'File not found',
        message: 'Backup file not found'
      });
    }

    res.download(backupPath, filename, (error) => {
      if (error) {
        logger.error('Download backup error:', error);
        res.status(500).json({
          error: 'Download failed',
          message: 'Failed to download backup file'
        });
      }
    });
  } catch (error) {
    logger.error('Download backup error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to download backup'
    });
  }
});

// Delete backup file
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(process.cwd(), 'backups', filename);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        error: 'File not found',
        message: 'Backup file not found'
      });
    }

    fs.unlinkSync(backupPath);
    logger.info(`Backup deleted: ${filename}`);
    
    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    logger.error('Delete backup error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete backup'
    });
  }
});

export default router;
