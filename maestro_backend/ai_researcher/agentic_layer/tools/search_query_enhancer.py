"""
Search Query Enhancer - Modifies search queries based on user source preferences.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

class SearchQueryEnhancer:
    """
    Enhances search queries based on user preferences for source types.
    """
    
    # Source preference configurations
    SOURCE_ENHANCEMENTS = {
        "academic": {
            "suffixes": ["academic paper", "research study", "journal article"],
            "keywords": ["academic", "research", "study", "journal", "paper", "scholarly"],
            "description": "Academic papers, research studies, and scholarly articles"
        },
        "general": {
            "suffixes": [],
            "keywords": [],
            "description": "General web content without specific source filtering"
        },
        "news": {
            "suffixes": ["news", "latest news", "breaking news"],
            "keywords": ["news", "article", "report", "journalist", "media"],
            "description": "News articles and journalistic content"
        },
        "technical": {
            "suffixes": ["technical documentation", "technical guide", "technical article"],
            "keywords": ["technical", "documentation", "guide", "manual", "specification"],
            "description": "Technical documentation, guides, and specifications"
        },
        "medical": {
            "suffixes": ["medical study", "clinical trial", "medical research"],
            "keywords": ["medical", "clinical", "health", "treatment", "disease", "patient"],
            "description": "Medical research, clinical studies, and health information"
        },
        "legal": {
            "suffixes": ["legal case", "court decision", "legal analysis"],
            "keywords": ["legal", "law", "court", "case", "statute", "regulation"],
            "description": "Legal documents, court cases, and legal analysis"
        },
        "social_media": {
            "suffixes": ["social media", "Twitter", "LinkedIn"],
            "keywords": ["social", "twitter", "linkedin", "facebook", "instagram", "discussion"],
            "description": "Social media posts, discussions, and community content"
        },
        "reddit": {
            "suffixes": ["Reddit", "reddit discussion", "reddit thread"],
            "keywords": ["reddit", "subreddit", "thread", "discussion", "community"],
            "description": "Reddit discussions, threads, and community insights"
        },
        "mixed": {
            "suffixes": [],
            "keywords": [],
            "description": "Mixed sources - no automatic enhancement, let user query stand as-is"
        }
    }
    
    @classmethod
    def enhance_query(cls, query: str, source_preferences: str, date_range: Optional[str] = None) -> str:
        """
        Enhance a search query based on the user's source preferences and date range.
        
        Args:
            query: The original search query
            source_preferences: Comma-separated list of source types (e.g., "academic,news")
            date_range: Optional date range (e.g., "last_week", "last_month", "last_year", "2023-2024")
            
        Returns:
            Enhanced search query
        """
        if not query:
            return query
            
        enhanced_query = query
        
        # Handle source preferences (support both single and multi-select)
        if source_preferences:
            # Parse preferences - handle both comma-separated and single values
            if isinstance(source_preferences, str):
                if ',' in source_preferences:
                    preferences = [p.strip().lower() for p in source_preferences.split(',')]
                else:
                    preferences = [source_preferences.strip().lower()]
            else:
                preferences = [str(source_preferences).lower()]
            
            # Remove empty preferences
            preferences = [p for p in preferences if p]
            
            # For mixed or general preferences, don't enhance
            if "mixed" in preferences or not preferences:
                pass  # No enhancement
            elif "general" in preferences and len(preferences) == 1:
                pass  # No enhancement for general-only
            else:
                # Build enhancement based on selected preferences
                valid_preferences = [p for p in preferences if p in cls.SOURCE_ENHANCEMENTS]
                
                if valid_preferences:
                    # Check if query already contains relevant keywords
                    query_lower = query.lower()
                    all_keywords = set()
                    for pref in valid_preferences:
                        all_keywords.update(cls.SOURCE_ENHANCEMENTS[pref]["keywords"])
                    
                    has_relevant_keywords = any(keyword in query_lower for keyword in all_keywords)
                    
                    if not has_relevant_keywords:
                        # Build combined suffix based on preferences
                        suffixes = []
                        for pref in valid_preferences:
                            pref_suffixes = cls.SOURCE_ENHANCEMENTS[pref]["suffixes"]
                            if pref_suffixes:
                                suffixes.append(pref_suffixes[0])  # Use primary suffix
                        
                        if suffixes:
                            # Combine unique suffixes
                            unique_suffixes = []
                            for suffix in suffixes:
                                if suffix not in unique_suffixes:
                                    unique_suffixes.append(suffix)
                            
                            # Add suffixes to query
                            if len(unique_suffixes) == 1:
                                enhanced_query = f"{query} {unique_suffixes[0]}"
                            else:
                                # For multiple preferences, use OR logic
                                suffix_str = " OR ".join(unique_suffixes)
                                enhanced_query = f"{query} ({suffix_str})"
                            
                            logger.debug(f"Enhanced query for {preferences} preferences: '{query}' -> '{enhanced_query}'")
        
        # Add date range enhancement
        if date_range and date_range.strip() and date_range.strip().lower() != 'any_time':
            date_range = date_range.strip().lower()
            date_enhancement = cls._get_date_enhancement(date_range)
            if date_enhancement:
                enhanced_query = f"{enhanced_query} {date_enhancement}"
                logger.debug(f"Added date range '{date_range}': '{enhanced_query}'")
        
        return enhanced_query
    
    @classmethod
    def _get_date_enhancement(cls, date_range: str) -> str:
        """Convert date range preference to search enhancement."""
        date_enhancements = {
            "last_week": "past week",
            "last_month": "past month", 
            "last_3_months": "past 3 months",
            "last_6_months": "past 6 months",
            "last_year": "past year",
            "last_2_years": "past 2 years",
            "2024": "2024",
            "2023": "2023",
            "2022": "2022",
            "2021": "2021",
            "2020": "2020"
        }
        
        # Handle year ranges like "2023-2024"
        if '-' in date_range and len(date_range.split('-')) == 2:
            years = date_range.split('-')
            if all(year.isdigit() and len(year) == 4 for year in years):
                return f"since {years[0]}"
        
        return date_enhancements.get(date_range, "")
    
    @classmethod
    def get_preference_description(cls, source_preference: str) -> str:
        """Get a human-readable description of a source preference."""
        preference = source_preference.lower()
        if preference in cls.SOURCE_ENHANCEMENTS:
            return cls.SOURCE_ENHANCEMENTS[preference]["description"]
        return "Unknown source preference"
    
    @classmethod
    def get_available_preferences(cls) -> list:
        """Get list of available source preferences."""
        return list(cls.SOURCE_ENHANCEMENTS.keys())
    
    @classmethod
    def is_valid_preference(cls, preference: str) -> bool:
        """Check if a preference is valid."""
        return preference.lower() in cls.SOURCE_ENHANCEMENTS