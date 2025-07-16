import os
import json
import hashlib
import time
from typing import Dict, Any, Optional

class FileCache:
    """
    Simple file-based caching system for OCR results to avoid redundant processing
    
    This implementation creates a JSON file for each processed document, using
    the file's hash as the cache key. Expiration is managed through periodic cleanup.
    
    Optimized for Vercel serverless environment with /tmp directory restrictions.
    """
    
    def __init__(self, cache_dir: str = '/tmp/ocr_cache', ttl_days: int = 1):
        """
        Initialize the cache with directory and time-to-live settings
        
        Args:
            cache_dir: Directory to store cache files (/tmp for Vercel)
            ttl_days: Number of days to keep cache entries before expiration
                      (Shorter for Vercel to prevent /tmp directory overflow)
        """
        self.cache_dir = cache_dir
        self.ttl_days = ttl_days
        
        # Create cache directory if it doesn't exist
        try:
            os.makedirs(cache_dir, exist_ok=True)
        except Exception as e:
            print(f"Warning: Could not create cache directory {cache_dir}: {e}")
            # Fallback to a different location in case of permission issues
            self.cache_dir = '/tmp'
            os.makedirs(self.cache_dir, exist_ok=True)
    
    def _get_file_hash(self, file_content: bytes, parser_type: str) -> str:
        """
        Generate a unique hash for the file content and parser type
        
        Args:
            file_content: Binary content of the file
            parser_type: Type of parser used (affects results)
            
        Returns:
            String hash to use as cache key
        """
        hash_obj = hashlib.sha256()
        hash_obj.update(file_content)
        hash_obj.update(parser_type.encode('utf-8'))  # Include parser type in hash
        return hash_obj.hexdigest()
    
    def _get_cache_path(self, file_hash: str) -> str:
        """Get the full path to a cache file"""
        return os.path.join(self.cache_dir, f"{file_hash}.json")
    
    def get(self, file_content: bytes, parser_type: str) -> Optional[Dict[str, Any]]:
        """
        Try to retrieve cached results for a file
        
        Args:
            file_content: Binary content of the file
            parser_type: Parser type used
            
        Returns:
            Cached result dict if found and valid, None otherwise
        """
        file_hash = self._get_file_hash(file_content, parser_type)
        cache_path = self._get_cache_path(file_hash)
        
        if not os.path.exists(cache_path):
            return None
        
        # Check if cache is expired
        mtime = os.path.getmtime(cache_path)
        import time
        age_days = (time.time() - mtime) / (24 * 3600)
        
        if age_days > self.ttl_days:
            # Cache expired, remove it
            os.unlink(cache_path)
            return None
            
        try:
            with open(cache_path, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            # Invalid cache, remove it
            os.unlink(cache_path)
            return None
    
    def set(self, file_content: bytes, parser_type: str, result: Dict[str, Any]) -> None:
        """
        Store a result in the cache
        
        Args:
            file_content: Binary content of the file
            parser_type: Parser type used
            result: Result dict to cache
        """
        file_hash = self._get_file_hash(file_content, parser_type)
        cache_path = self._get_cache_path(file_hash)
        
        try:
            with open(cache_path, 'w') as f:
                json.dump(result, f)
        except IOError:
            # If we can't write to cache, just continue without caching
            pass
    
    def cleanup(self) -> int:
        """
        Remove expired cache entries
        
        For Vercel deployment, this is more aggressive to prevent /tmp overflow.
        It also manages total cache size to stay below 250MB (Vercel limit).
        
        Returns:
            Number of entries removed
        """
        removed = 0
        current_time = time.time()
        
        try:
            # Clean expired entries first
            cache_files = []
            for filename in os.listdir(self.cache_dir):
                if not filename.endswith('.json'):
                    continue
                    
                filepath = os.path.join(self.cache_dir, filename)
                mtime = os.path.getmtime(filepath)
                age_days = (current_time - mtime) / (24 * 3600)
                size = os.path.getsize(filepath)
                
                if age_days > self.ttl_days:
                    try:
                        os.unlink(filepath)
                        removed += 1
                    except OSError:
                        pass
                else:
                    cache_files.append((filepath, mtime, size))
            
            # Check total cache size and remove oldest if over 200MB (safety margin)
            MAX_CACHE_SIZE = 200 * 1024 * 1024  # 200 MB
            total_size = sum(info[2] for info in cache_files)
            
            if total_size > MAX_CACHE_SIZE:
                # Sort by access time (oldest first)
                cache_files.sort(key=lambda x: x[1])
                
                # Remove oldest files until we're under the limit
                for filepath, _, size in cache_files:
                    try:
                        os.unlink(filepath)
                        removed += 1
                        total_size -= size
                        if total_size <= MAX_CACHE_SIZE:
                            break
                    except OSError:
                        pass
        except Exception as e:
            print(f"Warning: Cache cleanup error: {e}")
                    
        return removed
