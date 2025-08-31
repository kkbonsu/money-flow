import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3, Cpu, Gauge, MemoryStick, RefreshCw, TrendingUp, Zap } from 'lucide-react';

interface V8HealthMetrics {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  recommendations: string[];
  metrics: {
    hiddenClassEfficiency: number;
    cachePerformance: number;
    memoryEfficiency: number;
    compilationHealth: number;
  };
  rawStats: any;
}

interface PerformanceMetrics {
  v8Health: V8HealthMetrics;
  memoryStats: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    usage: number;
  };
  optimizationStatus: Record<string, string>;
  recommendations: string[];
}

export default function V8PerformancePage() {
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);

  // Fetch V8 health metrics
  const { data: healthData, refetch: refetchHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/v8/health'],
    refetchInterval: 10000 // Update every 10 seconds
  });

  // Fetch performance metrics
  const { data: metricsData, refetch: refetchMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/v8/metrics'],
    refetchInterval: 5000 // Update every 5 seconds
  });

  const runBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      const response = await fetch('/api/v8/benchmark', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      setBenchmarkResults(result.data);
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthVariant = (health: string) => {
    switch (health) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor': return 'destructive';
      default: return 'secondary';
    }
  };

  if (healthLoading || metricsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Cpu className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">V8 Performance Monitor</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const healthMetrics: V8HealthMetrics = healthData?.data || {} as V8HealthMetrics;
  const performanceMetrics: PerformanceMetrics = metricsData?.data || {} as PerformanceMetrics;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">V8 Performance Monitor</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => { refetchHealth(); refetchMetrics(); }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={runBenchmark}
            disabled={isRunningBenchmark}
            className="flex items-center gap-2"
          >
            <Gauge className="h-4 w-4" />
            {isRunningBenchmark ? 'Running...' : 'Run Benchmark'}
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{Math.round(healthMetrics?.score || 0)}</div>
              <Badge variant={getHealthVariant(healthMetrics?.overall)} className={getHealthColor(healthMetrics?.overall)}>
                {healthMetrics?.overall || 'Unknown'}
              </Badge>
            </div>
            <Progress value={healthMetrics?.score || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics?.memoryStats?.usage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics?.memoryStats?.heapUsed || 0}MB / {performanceMetrics?.memoryStats?.heapTotal || 0}MB
            </p>
            <Progress value={performanceMetrics?.memoryStats?.usage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(healthMetrics?.metrics?.cachePerformance || 0)}%</div>
            <p className="text-xs text-muted-foreground">Hit Rate</p>
            <Progress value={healthMetrics?.metrics?.cachePerformance || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compilation Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(healthMetrics?.metrics?.compilationHealth || 0)}%</div>
            <p className="text-xs text-muted-foreground">TypeScript Optimization</p>
            <Progress value={healthMetrics?.metrics?.compilationHealth || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="optimization" className="space-y-6">
        <TabsList>
          <TabsTrigger value="optimization">V8 Optimizations</TabsTrigger>
          <TabsTrigger value="memory">Memory Management</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  V8 Optimization Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {performanceMetrics?.optimizationStatus && Object.entries(performanceMetrics.optimizationStatus).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <Badge variant="secondary" className="text-green-600">
                      {value}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Efficiency Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Hidden Class Efficiency</span>
                    <span className="font-medium">{Math.round(healthMetrics?.metrics?.hiddenClassEfficiency || 0)}%</span>
                  </div>
                  <Progress value={healthMetrics?.metrics?.hiddenClassEfficiency || 0} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Efficiency</span>
                    <span className="font-medium">{Math.round(healthMetrics?.metrics?.memoryEfficiency || 0)}%</span>
                  </div>
                  <Progress value={healthMetrics?.metrics?.memoryEfficiency || 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="memory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5" />
                Memory Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{performanceMetrics?.memoryStats?.heapUsed || 0}MB</div>
                  <div className="text-sm text-muted-foreground">Heap Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{performanceMetrics?.memoryStats?.heapTotal || 0}MB</div>
                  <div className="text-sm text-muted-foreground">Heap Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{performanceMetrics?.memoryStats?.external || 0}MB</div>
                  <div className="text-sm text-muted-foreground">External</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{performanceMetrics?.memoryStats?.rss || 0}MB</div>
                  <div className="text-sm text-muted-foreground">RSS</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Performance Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!benchmarkResults ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Run a benchmark to see V8 optimization effectiveness</p>
                  <Button onClick={runBenchmark} disabled={isRunningBenchmark}>
                    {isRunningBenchmark ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running Benchmark...
                      </>
                    ) : (
                      <>
                        <Gauge className="h-4 w-4 mr-2" />
                        Run Performance Benchmark
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{benchmarkResults.benchmarkResults?.loanCalculations?.duration?.toFixed(2) || 0}ms</div>
                      <div className="text-sm text-muted-foreground">Loan Calculations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{benchmarkResults.benchmarkResults?.paymentProcessing?.duration?.toFixed(2) || 0}ms</div>
                      <div className="text-sm text-muted-foreground">Payment Processing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{benchmarkResults.benchmarkResults?.portfolioAnalysis?.duration?.toFixed(2) || 0}ms</div>
                      <div className="text-sm text-muted-foreground">Portfolio Analysis</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{Math.round(benchmarkResults.optimizationEffectiveness || 0)}%</div>
                      <div className="text-sm text-muted-foreground">Optimization Gain</div>
                    </div>
                  </div>
                  
                  {benchmarkResults.comparison && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Optimization Improvements:</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Memory Reduction</div>
                          <div className="text-green-600">{Math.round(benchmarkResults.comparison.improvement.memoryReduction || 0)}%</div>
                        </div>
                        <div>
                          <div className="font-medium">Speed Improvement</div>
                          <div className="text-green-600">{Math.round(benchmarkResults.comparison.improvement.speedImprovement || 0)}%</div>
                        </div>
                        <div>
                          <div className="font-medium">Efficiency Gain</div>
                          <div className="text-green-600">{Math.round(benchmarkResults.comparison.improvement.efficiencyGain || 0)}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthMetrics?.recommendations?.length > 0 ? (
                <div className="space-y-3">
                  {healthMetrics.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 text-lg font-semibold mb-2">🎉 Excellent Performance!</div>
                  <p className="text-muted-foreground">All V8 optimizations are working perfectly. No recommendations at this time.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Raw V8 Stats for Technical Users */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            V8 Engine Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Cache Hit Rate</div>
              <div className="text-blue-600">{healthMetrics?.rawStats?.v8Stats?.cacheHitRate?.toFixed(1) || 0}%</div>
            </div>
            <div>
              <div className="font-medium">Object Creations</div>
              <div className="text-purple-600">{healthMetrics?.rawStats?.v8Stats?.objectCreations || 0}</div>
            </div>
            <div>
              <div className="font-medium">Avg Calculation Time</div>
              <div className="text-green-600">{healthMetrics?.rawStats?.v8Stats?.averageCalculationTime?.toFixed(2) || 0}ms</div>
            </div>
            <div>
              <div className="font-medium">Process Uptime</div>
              <div className="text-orange-600">{Math.round(healthMetrics?.rawStats?.processUptime || 0)}s</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}