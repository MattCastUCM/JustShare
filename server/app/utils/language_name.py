language_names = {
    "en": "english",
    "es": "spanish",
    "fr": "french",
    "pt": "portuguese",
    "zh": "chinese",
}

def get_language_name(language_code: str):
    code = language_names.get(language_code.lower())
    if code is None:
        raise ValueError(f"Language '{language_code}' is not recognized.")
    return code