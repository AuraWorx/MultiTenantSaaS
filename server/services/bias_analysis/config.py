from typing import Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
API_CONFIG = {
    "host": os.getenv("BIAS_ANALYSIS_HOST", "0.0.0.0"),
    "port": int(os.getenv("BIAS_ANALYSIS_PORT", "5001")),
    "debug": os.getenv("BIAS_ANALYSIS_DEBUG", "False").lower() == "true"
}

# Bias Analysis Configuration
BIAS_ANALYSIS_CONFIG: Dict[str, Any] = {
    "default_thresholds": {
        "statistical_disparity": 0.1,
        "disparate_impact": 0.8,
        "equal_opportunity_difference": 0.1,
        "average_odds_difference": 0.1
    },
    "supported_file_types": [".csv", ".xlsx", ".xls"],
    "max_file_size": 10 * 1024 * 1024,  # 10MB
    "temp_directory": os.getenv("TEMP_DIRECTORY", "/tmp/bias_analysis"),
    "output_directory": os.getenv("OUTPUT_DIRECTORY", "output")
}

# Create necessary directories
os.makedirs(BIAS_ANALYSIS_CONFIG["temp_directory"], exist_ok=True)
os.makedirs(BIAS_ANALYSIS_CONFIG["output_directory"], exist_ok=True)

# Logging Configuration
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.FileHandler",
            "formatter": "default",
            "filename": "bias_analysis.log"
        }
    },
    "root": {
        "level": "INFO",
        "handlers": ["console", "file"]
    }
} 