#!/usr/bin/env python3
"""
Test Background Worker
Simulates a background worker process for testing daemon-admin functionality
"""

import os
import time
import logging
import random
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test-background-worker')

class BackgroundWorker:
    def __init__(self):
        self.worker_threads = int(os.environ.get('WORKER_THREADS', 4))
        self.log_level = os.environ.get('LOG_LEVEL', 'INFO')
        self.running = True
        self.tasks_processed = 0
        
    def process_task(self, task_id):
        """Simulate processing a task"""
        processing_time = random.uniform(1, 5)  # 1-5 seconds
        logger.info(f"Processing task {task_id} (estimated time: {processing_time:.2f}s)")
        
        time.sleep(processing_time)
        
        # Simulate occasional failures
        if random.random() < 0.1:  # 10% failure rate
            logger.error(f"Task {task_id} failed to process")
            return False
        
        logger.info(f"Task {task_id} completed successfully")
        self.tasks_processed += 1
        return True
        
    def run(self):
        logger.info(f"Starting background worker with {self.worker_threads} threads")
        logger.info(f"Log level: {self.log_level}")
        
        task_id = 1
        
        while self.running:
            try:
                # Simulate receiving a new task every 10-30 seconds
                wait_time = random.uniform(10, 30)
                logger.info(f"Waiting {wait_time:.1f}s for next task...")
                time.sleep(wait_time)
                
                # Process task
                self.process_task(task_id)
                task_id += 1
                
                # Log statistics every 10 tasks
                if task_id % 10 == 0:
                    logger.info(f"Statistics: {self.tasks_processed} tasks processed successfully")
                    
            except KeyboardInterrupt:
                logger.info("Received shutdown signal")
                self.running = False
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                time.sleep(5)  # Wait before retrying

def main():
    worker = BackgroundWorker()
    worker.run()

if __name__ == '__main__':
    main() 