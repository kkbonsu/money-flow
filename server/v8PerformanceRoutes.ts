/**
 * V8 Performance Monitoring API Routes
 * Provides real-time V8 optimization metrics and controls
 */

import type { Express, Request, Response } from "express";
import { v8Monitor } from './v8PerformanceMonitor';
import { v8Storage } from './v8IntegratedStorage';
import { V8PerformanceMonitor, v8Cache } from './v8Optimizations';
import { authenticateToken, extractTenantContext } from './tenantAuth';

interface AuthenticatedRequest extends Request {
  tenantId?: string;
}

/**
 * Register V8 performance monitoring routes
 */
export function registerV8PerformanceRoutes(app: Express) {
  
  // V8 Health Status Endpoint
  app.get("/api/v8/health", authenticateToken, (req: Request, res: Response) => {
    try {
      const healthReport = v8Monitor.health.getV8HealthReport();
      
      res.json({
        status: 'success',
        data: healthReport,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to get V8 health status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Performance Metrics Endpoint
  app.get("/api/v8/metrics", authenticateToken, (req: Request, res: Response) => {
    try {
      const metrics = v8Monitor.api.getPerformanceMetrics();
      
      res.json({
        status: 'success',
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to get performance metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Performance Benchmark Endpoint
  app.post("/api/v8/benchmark", authenticateToken, async (req: Request, res: Response) => {
    try {
      const benchmarkResults = await v8Monitor.benchmark.runPerformanceBenchmark();
      
      res.json({
        status: 'success',
        data: benchmarkResults,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to run performance benchmark',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Optimized Dashboard with V8 Enhancement
  app.get("/api/v8/dashboard", authenticateToken, extractTenantContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.tenantId as string;
      const useCache = req.query.cache !== 'false';
      
      const dashboardData = await v8Storage.dashboard.getComprehensiveDashboard(tenantId, useCache);
      
      res.set({
        'Cache-Control': 'private, max-age=120',
        'X-V8-Optimized': 'true',
        'X-Performance-Level': 'enterprise'
      });
      
      res.json({
        status: 'success',
        data: dashboardData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to get optimized dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Optimized Customer List with V8 Enhancement
  app.get("/api/v8/customers", authenticateToken, extractTenantContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.tenantId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const useCache = req.query.cache !== 'false';
      
      const offset = (page - 1) * limit;
      
      const customerData = await v8Storage.optimized.getOptimizedCustomers(tenantId, {
        limit,
        offset,
        search,
        useCache
      });
      
      res.set({
        'Cache-Control': 'private, max-age=180',
        'X-V8-Optimized': 'true',
        'X-Memory-Efficient': 'true'
      });
      
      res.json({
        status: 'success',
        data: customerData,
        pagination: {
          page,
          limit,
          total: customerData.total,
          totalPages: Math.ceil(customerData.total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to get optimized customer data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Optimized Loan Portfolio with Advanced Analytics
  app.get("/api/v8/portfolio", authenticateToken, extractTenantContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.tenantId as string;
      const includeSchedules = req.query.schedules === 'true';
      const calculateRisk = req.query.risk === 'true';
      const useStreaming = req.query.streaming === 'true';
      
      const portfolioData = await v8Storage.optimized.getOptimizedLoanPortfolio(tenantId, {
        includeSchedules,
        calculateRisk,
        useStreaming
      });
      
      res.set({
        'Cache-Control': 'private, max-age=300',
        'X-V8-Optimized': 'true',
        'X-Streaming-Enabled': useStreaming.toString()
      });
      
      res.json({
        status: 'success',
        data: portfolioData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to get optimized portfolio data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Cache Management Endpoints
  app.delete("/api/v8/cache/:tenantId", authenticateToken, (req: Request, res: Response) => {
    try {
      const tenantId = req.params.tenantId;
      v8Cache.clearTenantCache(tenantId);
      
      res.json({
        status: 'success',
        message: `Cache cleared for tenant ${tenantId}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to clear cache',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Performance Reset Endpoint
  app.post("/api/v8/reset-metrics", authenticateToken, (req: Request, res: Response) => {
    try {
      V8PerformanceMonitor.reset();
      
      res.json({
        status: 'success',
        message: 'Performance metrics reset successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to reset metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Real-time Performance Stream (Server-Sent Events)
  app.get("/api/v8/performance-stream", authenticateToken, (req: Request, res: Response) => {
    try {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Send initial performance data
      const initialData = v8Monitor.api.getPerformanceMetrics();
      res.write(`data: ${JSON.stringify(initialData)}\n\n`);

      // Set up periodic updates
      const interval = setInterval(() => {
        try {
          const currentData = v8Monitor.api.getPerformanceMetrics();
          res.write(`data: ${JSON.stringify(currentData)}\n\n`);
        } catch (error) {
          console.error('Performance stream error:', error);
        }
      }, 5000); // Update every 5 seconds

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(interval);
      });

      req.on('error', () => {
        clearInterval(interval);
      });

    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to start performance stream',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * V8 Performance Middleware
 * Automatically tracks performance for all routes
 */
export function v8PerformanceMiddleware(req: Request, res: Response, next: Function) {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    // Track route performance
    const duration = endTime - startTime;
    const memoryDelta = endMemory - startMemory;
    
    // Add performance headers
    res.set({
      'X-Response-Time': `${duration.toFixed(2)}ms`,
      'X-Memory-Delta': `${Math.round(memoryDelta / 1024)}KB`,
      'X-V8-Optimized': 'true'
    });
    
    // Track in V8 performance monitor
    V8PerformanceMonitor.trackCalculation(() => duration);
    
    return originalSend.call(this, data);
  };
  
  next();
}