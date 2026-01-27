language_codes = {
    "english": "en",
    "spanish": "es",
    "french": "fr",
    "portuguese": "pt",
    "chinese": "zh",
}

def get_language_code(language_name: str):
    code = language_codes.get(language_name.lower())
    if code is None:
        raise ValueError(f"Language '{language_name}' is not recognized.")
    return code