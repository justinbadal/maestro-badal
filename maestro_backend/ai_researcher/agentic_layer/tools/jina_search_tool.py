import os
import logging
import queue
import requests
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime

# Import dynamic config to access user-specific provider settings
from ai_researcher.dynamic_config import get_setting_with_fallback

logger = logging.getLogger(__name__)


class JinaSearchInput(BaseModel):
    query: str = Field(..., description="The search query for the Jina.ai search engine.")
    max_results: Optional[int] = Field(None, description="Maximum number of search results desired.")
    location: Optional[str] = Field(None, description="Search origin location (e.g., 'US', 'GB')")
    language: Optional[str] = Field(None, description="Language code for search results (e.g., 'en', 'es')")
    country: Optional[str] = Field(None, description="Country code for search results (e.g., 'US', 'GB')")
    include_domains: Optional[List[str]] = Field(None, description="List of domains to specifically include")
    with_snippets: Optional[bool] = Field(True, description="Whether to include rich snippets/grounding data")


class JinaSearchTool:
    """
    Tool for performing web searches using Jina.ai's Search Foundation API.
    Provides enhanced search capabilities with rich snippets and grounding data.
    """
    
    def __init__(self, controller=None):
        self.controller = controller
        self.name = "jina_search"
        self.description = "Performs a web search using Jina.ai Search Foundation API to find up-to-date information with rich snippets and grounding data."
        self.parameters_schema = JinaSearchInput
        self.api_key_configured = False
        
        # Initialize API configuration
        try:
            self.api_key = self._get_jina_api_key()
            if not self.api_key:
                logger.warning("Jina.ai API key not configured in user settings or environment variables.")
                self.api_key_configured = False
                return
            
            self.base_url = "https://s.jina.ai/"
            self.api_key_configured = True
            logger.info("JinaSearchTool initialized successfully.")
            
        except Exception as e:
            logger.error(f"Failed to initialize JinaSearchTool: {e}")
            self.api_key_configured = False

    def _get_jina_api_key(self, mission_id: Optional[str] = None) -> Optional[str]:
        """Get the Jina.ai API key from user settings or environment."""
        # Try to get from user settings via dynamic config
        try:
            from ai_researcher.user_context import get_user_settings
            user_settings = get_user_settings()
            if user_settings:
                search_settings = user_settings.get("search", {})
                if search_settings and search_settings.get("jina_api_key"):
                    return search_settings["jina_api_key"]
        except Exception as e:
            logger.debug(f"Could not access user settings for Jina API key: {e}")
        
        # Fallback to environment variable
        return os.getenv("JINA_API_KEY")

    def _get_search_max_results(self, mission_id: Optional[str] = None) -> int:
        """Get the maximum number of search results from configuration."""
        try:
            from ai_researcher.dynamic_config import get_search_max_results
            return get_search_max_results(mission_id)
        except Exception:
            return 5  # Default fallback

    async def execute(
        self,
        query: str,
        max_results: Optional[int] = None,
        location: Optional[str] = None,
        language: Optional[str] = None,
        country: Optional[str] = None,
        include_domains: Optional[List[str]] = None,
        with_snippets: Optional[bool] = True,
        update_callback: Optional[Callable] = None,
        log_queue: Optional[queue.Queue] = None,
        mission_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the web search using Jina.ai Search Foundation API.
        
        Args:
            query: The search query string.
            max_results: Maximum number of results desired (uses user settings if not specified).
            location: Search origin location.
            language: Language code for search results.
            country: Country code for search results.
            include_domains: Optional list of domains to include.
            with_snippets: Whether to include rich snippets/grounding data.
            update_callback: Optional callback function for sending updates.
            log_queue: Optional queue for logging.
            mission_id: Optional mission ID for tracking web search calls.

        Returns:
            A dictionary containing search results on success, or error information on failure.
        """
        # Check if configuration is available
        if not self.api_key_configured:
            user_friendly_error = "Web search is not available. Please configure your Jina.ai API key in Settings > Search to enable web search functionality."
            logger.warning("Web search attempted but Jina.ai configuration not available")
            
            # Send user-friendly feedback
            if update_callback:
                feedback_payload = {
                    "type": "web_search_config_error",
                    "provider": "jina",
                    "query": query,
                    "error": user_friendly_error
                }
                try:
                    formatted_message = {"type": "agent_feedback", "payload": feedback_payload}
                    update_callback(log_queue, formatted_message)
                except Exception as cb_e:
                    logger.error(f"Failed to send web_search_config_error feedback: {cb_e}")
            
            return {"error": user_friendly_error}

        # Get default values from user settings if not provided
        if max_results is None:
            max_results = self._get_search_max_results(mission_id)
        
        # Validate max_results
        max_results = max(1, min(20, max_results))  # Ensure between 1 and 20
        
        logger.info(f"Executing Jina.ai search for '{query}' with max_results={max_results}")
        formatted_results = []
        error_msg = None

        # Enhance query based on user's source preferences and date range
        try:
            from ai_researcher.dynamic_config import get_source_preferences, get_search_date_range
            from .search_query_enhancer import SearchQueryEnhancer
            source_preferences = get_source_preferences(mission_id)
            date_range = get_search_date_range(mission_id)
            search_query = SearchQueryEnhancer.enhance_query(query, source_preferences, date_range)
            logger.debug(f"Enhanced query based on '{source_preferences}' preferences and '{date_range}' date range: '{query}' -> '{search_query}'")
        except Exception as e:
            logger.warning(f"Failed to enhance query: {e}, using original query")
            search_query = query

        try:
            # Prepare headers
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            # Add optional headers for enhanced functionality
            if include_domains and len(include_domains) == 1:
                headers["X-Site"] = include_domains[0]
            
            if with_snippets:
                headers["X-With-Links-Summary"] = "true"
            
            # Build request payload
            payload = {
                "q": search_query,
                "num": max_results
            }
            
            # Add optional parameters
            if location:
                payload["location"] = location
            if language:
                payload["hl"] = language
            if country:
                payload["gl"] = country

            # Make the API request
            response = requests.post(
                self.base_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            # Check for HTTP errors
            response.raise_for_status()
            
            # Parse JSON response
            search_data = response.json()
            
            # Extract results from Jina.ai response format
            search_results = search_data.get('data', [])
            
            # Process and format results
            for result in search_results:
                # Jina.ai provides rich content and metadata
                formatted_result = {
                    "title": result.get('title', 'No Title'),
                    "snippet": result.get('content', result.get('description', 'No Snippet')),
                    "url": result.get('url', '#')
                }
                
                # Add enhanced metadata if available
                if 'grounding_score' in result:
                    formatted_result['grounding_score'] = result['grounding_score']
                if 'snippet_data' in result:
                    formatted_result['snippet_data'] = result['snippet_data']
                if 'references' in result:
                    formatted_result['references'] = result['references']
                
                formatted_results.append(formatted_result)

            logger.info(f"Jina.ai search successful, returning {len(formatted_results)} results.")

            # Send feedback: Search Complete
            if update_callback:
                feedback_payload = {
                    "type": "web_search_complete",
                    "provider": "jina",
                    "query": query,
                    "num_results": len(formatted_results),
                    "enhanced_features": with_snippets
                }
                try:
                    formatted_message = {"type": "agent_feedback", "payload": feedback_payload}
                    update_callback(log_queue, formatted_message)
                    logger.debug(f"Sent web_search_complete feedback payload for query '{query}' via Jina.ai")
                except Exception as cb_e:
                    logger.error(f"Failed to send web_search_complete feedback payload via callback: {cb_e}")

            return {
                "results": formatted_results,
                "provider": "jina",
                "enhanced_features": {
                    "grounding_support": True,
                    "rich_snippets": with_snippets,
                    "api_version": "v1"
                }
            }

        except requests.exceptions.HTTPError as e:
            # Handle specific HTTP errors
            if e.response.status_code == 401:
                user_friendly_error = "Web search failed due to invalid Jina.ai API key. Please check your API key in Settings > Search."
            elif e.response.status_code == 429:
                user_friendly_error = "Web search quota exceeded for Jina.ai. Please check your account limits or try again later."
            elif e.response.status_code == 403:
                user_friendly_error = "Web search access denied. Please verify your Jina.ai API key permissions."
            else:
                user_friendly_error = f"Web search failed with HTTP error {e.response.status_code}. Please try again."
            
            logger.error(f"Jina.ai search HTTP error for query '{query}': {e}")
            error_msg = user_friendly_error

        except requests.exceptions.RequestException as e:
            user_friendly_error = "Web search temporarily unavailable due to network issues. Please try again in a moment."
            logger.error(f"Jina.ai search network error for query '{query}': {e}")
            error_msg = user_friendly_error

        except Exception as e:
            user_friendly_error = "Web search temporarily unavailable. Please try again or check your Jina.ai API key configuration in Settings."
            logger.error(f"Jina.ai search error for query '{query}': {e}", exc_info=True)
            error_msg = user_friendly_error

        # Send error feedback
        if error_msg and update_callback:
            feedback_payload = {
                "type": "web_search_error",
                "provider": "jina",
                "query": query,
                "error": error_msg
            }
            try:
                formatted_message = {"type": "agent_feedback", "payload": feedback_payload}
                update_callback(log_queue, formatted_message)
                logger.debug(f"Sent web_search_error feedback payload for query '{query}'")
            except Exception as cb_e:
                logger.error(f"Failed to send web_search_error feedback payload via callback: {cb_e}")
        
        return {"error": error_msg}