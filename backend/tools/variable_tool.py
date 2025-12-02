"""Variable extraction and interpolation tools."""
import re
from typing import Dict, List, Set


def extract_variables(text: str) -> List[str]:
    """
    Extract variables in {{variable}} format from text.
    
    Args:
        text: Text containing variable placeholders
        
    Returns:
        List of unique variable names found in the text
        
    Example:
        >>> extract_variables("Hello {{name}}, your {{item}} is ready!")
        ['name', 'item']
    """
    pattern = r'\{\{([^}]+)\}\}'
    matches = re.findall(pattern, text)
    
    # Use set to deduplicate and sort for consistency
    unique_vars: Set[str] = set(m.strip() for m in matches)
    return sorted(list(unique_vars))


def interpolate_variables(prompt: str, variables: Dict[str, str]) -> str:
    """
    Replace {{variable}} placeholders with actual values.
    
    Args:
        prompt: Template string with {{variable}} placeholders
        variables: Dictionary mapping variable names to their values
        
    Returns:
        String with all variables interpolated
        
    Example:
        >>> interpolate_variables(
        ...     "Hello {{name}}, welcome to {{place}}!",
        ...     {"name": "Alice", "place": "Wonderland"}
        ... )
        'Hello Alice, welcome to Wonderland!'
    """
    result = prompt
    for key, value in variables.items():
        # Match {{key}}, {{ key }}, {{key }}, etc.
        pattern = r'\{\{\s*' + re.escape(key) + r'\s*\}\}'
        result = re.sub(pattern, value, result)
    return result


def find_missing_variables(prompt: str, provided: Dict[str, str]) -> List[str]:
    """
    Find variables in the prompt that were not provided.
    
    Args:
        prompt: Template string with {{variable}} placeholders
        provided: Dictionary of provided variable values
        
    Returns:
        List of variable names that are in the prompt but not in provided dict
    """
    required = set(extract_variables(prompt))
    provided_keys = set(provided.keys())
    missing = required - provided_keys
    return sorted(list(missing))
