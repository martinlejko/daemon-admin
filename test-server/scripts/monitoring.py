#!/usr/bin/env python3
"""
Test Monitoring Service
Simulates a system monitoring service for testing daemon-admin functionality
"""

import os
import time
import logging
import random
import psutil
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test-monitoring')

class SystemMonitor:
    def __init__(self):
        self.monitor_interval = int(os.environ.get('MONITOR_INTERVAL', 60))
        self.alert_enabled = os.environ.get('ALERT_ENABLED', 'true').lower() == 'true'
        self.running = True
        self.metrics_collected = 0
        
    def collect_metrics(self):
        """Collect system metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used_gb = memory.used / (1024**3)
            memory_total_gb = memory.total / (1024**3)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_used_gb = disk.used / (1024**3)
            disk_total_gb = disk.total / (1024**3)
            
            # Network (simulated since we're in a container)
            network_bytes_sent = random.randint(1000000, 10000000)
            network_bytes_recv = random.randint(1000000, 15000000)
            
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'cpu_percent': cpu_percent,
                'memory_percent': memory_percent,
                'memory_used_gb': round(memory_used_gb, 2),
                'memory_total_gb': round(memory_total_gb, 2),
                'disk_percent': disk_percent,
                'disk_used_gb': round(disk_used_gb, 2),
                'disk_total_gb': round(disk_total_gb, 2),
                'network_bytes_sent': network_bytes_sent,
                'network_bytes_recv': network_bytes_recv,
                'load_average': os.getloadavg() if hasattr(os, 'getloadavg') else [0.1, 0.2, 0.3]
            }
            
            logger.info(f"Metrics collected: CPU={cpu_percent:.1f}% Memory={memory_percent:.1f}% Disk={disk_percent:.1f}%")
            
            # Check for alerts
            if self.alert_enabled:
                self.check_alerts(metrics)
                
            self.metrics_collected += 1
            return metrics
            
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
            return None
    
    def check_alerts(self, metrics):
        """Check if any metrics exceed alert thresholds"""
        alerts = []
        
        if metrics['cpu_percent'] > 80:
            alerts.append(f"High CPU usage: {metrics['cpu_percent']:.1f}%")
            
        if metrics['memory_percent'] > 85:
            alerts.append(f"High memory usage: {metrics['memory_percent']:.1f}%")
            
        if metrics['disk_percent'] > 90:
            alerts.append(f"High disk usage: {metrics['disk_percent']:.1f}%")
            
        for alert in alerts:
            logger.warning(f"ALERT: {alert}")
    
    def simulate_service_checks(self):
        """Simulate checking other services"""
        services = ['nginx', 'redis-server', 'test-web-app', 'test-api-server']
        
        for service in services:
            # Simulate service status check
            is_running = random.choice([True, True, True, False])  # 75% chance running
            
            if is_running:
                logger.info(f"Service check: {service} is running")
            else:
                logger.warning(f"Service check: {service} is not running")
    
    def run(self):
        logger.info(f"Starting monitoring service with {self.monitor_interval}s interval")
        logger.info(f"Alert system: {'enabled' if self.alert_enabled else 'disabled'}")
        
        while self.running:
            try:
                # Collect system metrics
                metrics = self.collect_metrics()
                
                # Simulate service health checks every 5th cycle
                if self.metrics_collected % 5 == 0:
                    self.simulate_service_checks()
                
                # Log statistics every 10 cycles
                if self.metrics_collected % 10 == 0:
                    logger.info(f"Monitoring statistics: {self.metrics_collected} metric collections completed")
                
                # Wait for next collection cycle
                time.sleep(self.monitor_interval)
                
            except KeyboardInterrupt:
                logger.info("Received shutdown signal")
                self.running = False
            except Exception as e:
                logger.error(f"Unexpected error in monitoring loop: {e}")
                time.sleep(5)  # Wait before retrying

def main():
    monitor = SystemMonitor()
    monitor.run()

if __name__ == '__main__':
    main() 