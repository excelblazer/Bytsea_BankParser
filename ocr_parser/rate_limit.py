import time
from typing import Dict, Tuple, List, Optional

class RateLimiter:
    """
    Simple in-memory rate limiter to prevent abuse of the OCR API
    
    Implements a token bucket algorithm to control request rates:
    - Each client (IP) has a bucket with tokens
    - Each request consumes tokens based on complexity
    - Tokens regenerate over time up to a maximum
    
    Note: For Vercel's serverless functions, this in-memory approach
    will only limit bursts within a single function instance. For proper
    rate limiting across all instances, you'd need a distributed solution
    with Redis or similar.
    """
    
    def __init__(self, 
                 tokens_per_minute: int = 60, 
                 max_tokens: int = 120,
                 cost_per_page: int = 5):
        """
        Initialize the rate limiter
        
        Args:
            tokens_per_minute: How many tokens are regenerated per minute
            max_tokens: Maximum tokens a client can have
            cost_per_page: How many tokens each page costs to process
        """
        self.tokens_per_minute = tokens_per_minute
        self.tokens_per_second = tokens_per_minute / 60.0
        self.max_tokens = max_tokens
        self.cost_per_page = cost_per_page
        
        # Store client state: {ip: (tokens, last_request_time)}
        self.clients: Dict[str, Tuple[float, float]] = {}
        
    def _update_tokens(self, ip: str) -> None:
        """Update token count based on time elapsed since last request"""
        if ip not in self.clients:
            # New client, give full tokens
            self.clients[ip] = (self.max_tokens, time.time())
            return
            
        tokens, last_time = self.clients[ip]
        now = time.time()
        elapsed = now - last_time
        
        # Add regenerated tokens, but don't exceed max
        new_tokens = min(
            self.max_tokens,
            tokens + elapsed * self.tokens_per_second
        )
        
        self.clients[ip] = (new_tokens, now)
    
    def can_process(self, ip: str, page_count: int = 1) -> bool:
        """
        Check if client can process the given number of pages
        
        Args:
            ip: Client identifier (IP address)
            page_count: Number of pages to process
            
        Returns:
            True if allowed, False if rate limited
        """
        self._update_tokens(ip)
        
        tokens, _ = self.clients[ip]
        required_tokens = self.cost_per_page * page_count
        
        if tokens >= required_tokens:
            # Client has enough tokens, consume them
            self.clients[ip] = (tokens - required_tokens, time.time())
            return True
        
        return False
        
    def get_retry_after(self, ip: str, page_count: int = 1) -> int:
        """
        Calculate seconds until enough tokens are available
        
        Args:
            ip: Client identifier (IP address)
            page_count: Number of pages to process
            
        Returns:
            Seconds to wait for token regeneration
        """
        if ip not in self.clients:
            return 0
            
        tokens, _ = self.clients[ip]
        required_tokens = self.cost_per_page * page_count
        
        if tokens >= required_tokens:
            return 0
            
        missing_tokens = required_tokens - tokens
        seconds = missing_tokens / self.tokens_per_second
        
        return int(seconds) + 1  # Round up to be safe
        
# Global rate limiter instance
# More conservative for Vercel free tier
RATE_LIMITER = RateLimiter(
    tokens_per_minute=30,  # Reduced for Vercel free tier
    max_tokens=60,         # Smaller buffer for free tier
    cost_per_page=5        # Cost per page
)
