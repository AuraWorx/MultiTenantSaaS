import os
import warnings
import collections.abc

# Disable MDSS module to avoid turtle dependency
os.environ['AIF360_DISABLE_MDSS'] = '1'
warnings.filterwarnings('ignore', category=ImportWarning)

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import pandas as pd
import numpy as np
from aif360.datasets import BinaryLabelDataset
from aif360.metrics.binary_label_dataset_metric import BinaryLabelDatasetMetric
from aif360.algorithms.preprocessing import Reweighing
import json
import io
import tempfile
import zipfile
from datetime import datetime
import logging
from sklearn.preprocessing import LabelEncoder
from logging.handlers import RotatingFileHandler
from fastapi.encoders import jsonable_encoder
from io import StringIO

# Configure logging
def setup_logging():
    try:
        # Create logs directory if it doesn't exist
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)

        # Configure logging format with more detailed information
        log_format = '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
        date_format = '%Y-%m-%d %H:%M:%S'

        # Create formatter
        formatter = logging.Formatter(log_format, date_format)

        # Configure file handler with rotation
        log_file = os.path.join(log_dir, f'bias_analysis_{datetime.now().strftime("%Y%m%d")}.log')
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10485760,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.INFO)

        # Configure console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        console_handler.setLevel(logging.INFO)

        # Get the root logger and configure it
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)
        
        # Remove any existing handlers to avoid duplicate logs
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
            
        # Add handlers
        root_logger.addHandler(file_handler)
        root_logger.addHandler(console_handler)

        # Create and configure the application logger
        app_logger = logging.getLogger(__name__)
        app_logger.info("Logging system initialized successfully")
        
        return app_logger
    except Exception as e:
        # Fallback to basic logging if setup fails
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        logging.error(f"Failed to setup logging: {str(e)}")
        return logging.getLogger(__name__)

# Initialize logging
logger = setup_logging()
logger.info("Bias Analysis Service starting up")

# Configuration
BIAS_ANALYSIS_CONFIG = {
    "supported_file_types": [".csv", ".xlsx", ".xls"]
}

app = FastAPI(title="Bias Analysis Service", description="A service to analyze bias in datasets", version="1.0.0", docs_url="/docs", redoc_url="/redoc", openapi_url="/openapi.json", request_body_size_limit=100 * 1024 * 1024)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BiasAnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    protected_attributes: List[str]
    privileged_groups: Optional[List[Dict[str, Any]]] = None
    unprivileged_groups: Optional[List[Dict[str, Any]]] = None
    group_mappings: Optional[Dict[str, Dict[str, Union[str, List[str]]]]] = None  # e.g., {"gender": {"privileged": "male", "unprivileged": "female"}} or lists

class BiasAnalysisResponse(BaseModel):
    results: List[Dict[str, Any]]
    message: str

LABEL_CANDIDATES = ['label', 'true_label', 'target']
def find_label_column(df):
    for col in LABEL_CANDIDATES:
        if col in df.columns:
            return col
    raise ValueError(f"No label column found. Expected one of: {LABEL_CANDIDATES}")

def encode_categoricals(df, exclude=[]):
    """Encode categorical columns to numerical values."""
    for col in df.columns:
        if col not in exclude and df[col].dtype == object:
            try:
                # First try to convert to numeric directly
                df[col] = pd.to_numeric(df[col], errors='raise')
            except:
                # If that fails, use LabelEncoder
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                logger.info(f"Encoded categorical column {col} using LabelEncoder")
    return df

def preprocess_data(df: pd.DataFrame, protected_attributes: List[str], group_mappings: Optional[Dict[str, Dict[str, str]]] = None) -> pd.DataFrame:
    """Preprocess the input data with improved error handling and robust protected attribute mapping."""
    try:
        # Make a copy to avoid modifying the original
        df = df.copy()
        logger.info(f"Original DataFrame:\n{df.head()}")
        logger.info(f"Original dtypes:\n{df.dtypes}")
        
        # First, convert all protected attributes to string type
        for attr in protected_attributes:
            if attr in df.columns:
                df[attr] = df[attr].astype(str)
                logger.info(f"Converted protected attribute {attr} to string type")
                logger.info(f"Unique values in {attr}: {df[attr].unique()}")
        
        # Convert non-protected attributes to numeric
        for col in df.columns:
            if col not in protected_attributes:
                try:
                    df[col] = pd.to_numeric(df[col], errors='raise')
                    logger.info(f"Converted column {col} to numeric type")
                except:
                    # If conversion fails, use LabelEncoder
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))
                    logger.info(f"Encoded column {col} using LabelEncoder")
        
        # Now robustly encode protected attributes using group_mappings if provided
        for attr in protected_attributes:
            if attr in df.columns:
                if group_mappings and attr in group_mappings:
                    mapping = group_mappings[attr]
                    privileged_values = mapping['privileged']
                    unprivileged_values = mapping['unprivileged']
                    # Support both string and list for backward compatibility
                    if not isinstance(privileged_values, list):
                        privileged_values = [privileged_values]
                    if not isinstance(unprivileged_values, list):
                        unprivileged_values = [unprivileged_values]
                    # Map: privileged -> 1.0, unprivileged -> 0.0, others -> np.nan
                    df[attr] = df[attr].map(lambda x: 1.0 if x in privileged_values else (0.0 if x in unprivileged_values else np.nan))
                    logger.info(f"Mapped {attr} using group_mappings: privileged={privileged_values}->1.0, unprivileged={unprivileged_values}->0.0")
                    unique_vals = df[attr].unique()
                    logger.info(f"Unique values in {attr} after mapping: {unique_vals}")
                    # Drop rows not in either group
                    if np.isnan(df[attr]).any():
                        nan_rows = df[df[attr].isna()]
                        logger.warning(f"Dropping {len(nan_rows)} rows with unmapped values in {attr}: {nan_rows[attr].unique()}")
                        df = df[~df[attr].isna()]
                        df.reset_index(drop=True, inplace=True)
                        unique_vals = df[attr].unique()
                        logger.info(f"Unique values in {attr} after dropping unmapped: {unique_vals}")
                    # Ensure both 1.0 and 0.0 exist
                    if not (1.0 in unique_vals and 0.0 in unique_vals):
                        logger.error(f"After mapping, both privileged (1.0) and unprivileged (0.0) values must exist in '{attr}'. Found: {unique_vals}")
                        raise HTTPException(status_code=400, detail=f"After mapping, both privileged (1.0) and unprivileged (0.0) values must exist in '{attr}'. Found: {unique_vals}")
                else:
                    # Fallback: use first two unique values
                    unique_values = sorted(df[attr].unique())
                    if len(unique_values) > 2:
                        logger.error(f"Protected attribute '{attr}' has more than two unique values: {unique_values}. Please provide group_mappings for this attribute.")
                        raise HTTPException(status_code=400, detail=f"Protected attribute '{attr}' has more than two unique values: {unique_values}. Please provide group_mappings for this attribute, e.g. 'group_mappings': {{'{attr}': {{'privileged': 'VALUE1', 'unprivileged': 'VALUE2'}}}}.")
                    if len(unique_values) < 2:
                        logger.error(f"Not enough unique values for protected attribute '{attr}'. Found: {unique_values}")
                        raise HTTPException(status_code=400, detail=f"Not enough unique values for protected attribute '{attr}'. Found: {unique_values}")
                    privileged_value = unique_values[0]
                    unprivileged_value = unique_values[1]
                    df[attr] = df[attr].map(lambda x: 1.0 if x == privileged_value else (0.0 if x == unprivileged_value else np.nan))
                    logger.info(f"Fallback mapping for {attr}: privileged='{privileged_value}'->1.0, unprivileged='{unprivileged_value}'->0.0")
                    unique_vals = df[attr].unique()
                    logger.info(f"Unique values in {attr} after fallback mapping: {unique_vals}")
                    if np.isnan(df[attr]).any():
                        nan_rows = df[df[attr].isna()]
                        logger.error(f"Found unmapped values in {attr}:\n{nan_rows}")
                        raise HTTPException(status_code=400, detail=f"Found values in '{attr}' that are not in fallback mapping: {nan_rows[attr].unique()}")
                    if not (1.0 in unique_vals and 0.0 in unique_vals):
                        logger.error(f"After fallback mapping, both privileged (1.0) and unprivileged (0.0) values must exist in '{attr}'. Found: {unique_vals}")
                        raise HTTPException(status_code=400, detail=f"After fallback mapping, both privileged (1.0) and unprivileged (0.0) values must exist in '{attr}'. Found: {unique_vals}")
        
        logger.info(f"Final DataFrame after preprocessing:\n{df.head()}")
        logger.info(f"Final dtypes:\n{df.dtypes}")
        return df
    except Exception as e:
        logger.error(f"Error in data preprocessing: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error preprocessing data: {str(e)}")

def calculate_bias_metrics(dataset: BinaryLabelDataset, privileged_groups: List[Dict], unprivileged_groups: List[Dict]) -> Dict:
    """Calculate bias metrics for the dataset."""
    try:
        # Always use the protected attribute from the dataset
        protected_attr = dataset.protected_attribute_names[0]
        privileged_groups = [{protected_attr: 1.0}]
        unprivileged_groups = [{protected_attr: 0.0}]
        logger.info(f"Calculating metrics with protected attribute: {protected_attr}")
        logger.info(f"Privileged groups: {privileged_groups}")
        logger.info(f"Unprivileged groups: {unprivileged_groups}")
        metric = BinaryLabelDatasetMetric(
            dataset,
            privileged_groups=privileged_groups,
            unprivileged_groups=unprivileged_groups
        )
        return {
            "statistical_disparity": float(metric.mean_difference()),
            "disparate_impact": float(metric.disparate_impact())
        }
    except Exception as e:
        logger.error(f"Error calculating metrics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error calculating metrics: {str(e)}")

def determine_metric_status(score: float, threshold: float, metric_type: str) -> str:
    """Determine if a metric passes or fails based on its threshold."""
    if metric_type == "disparate_impact":
        return "pass" if score > threshold else "fail"
    return "pass" if abs(score) < threshold else "fail"

def safe_float(val):
    """Convert float values to JSON-safe values, replacing NaN and inf with None."""
    if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
        return None
    return float(val)

def format_results_for_output(metrics: Dict) -> List[Dict]:
    """Format the metrics for output."""
    thresholds = {
        "statistical_disparity": 0.1,
        "disparate_impact": 0.8,
        "equal_opportunity": 0.1
    }
    
    results = []
    for metric_name, score in metrics.items():
        results.append({
            "metric_name": metric_name.replace("_", " ").title(),
            "score": safe_float(score),
            "threshold": thresholds[metric_name],
            "status": determine_metric_status(score, thresholds[metric_name], metric_name),
            "demographic_group": "overall"
        })
    return results

def results_to_csv(results: List[Dict]) -> bytes:
    """Convert results to CSV format."""
    df = pd.DataFrame(results)
    return df.to_csv(index=False).encode()

def encode_protected_attributes(df: pd.DataFrame, protected_attributes: list):
    """Encode protected attributes as integers for group detection."""
    for attr in protected_attributes:
        if attr in df.columns:
            le = LabelEncoder()
            df[attr] = le.fit_transform(df[attr].astype(str))
    return df

def flatten_list(lst):
    # Flattens a list of strings or a list of lists of strings
    if lst and isinstance(lst[0], list):
        return [item for sublist in lst for item in sublist]
    return lst

def robust_flatten(lst):
    # Flattens a list of strings or a list of lists of strings
    if isinstance(lst, str):
        return [lst]
    if isinstance(lst, collections.abc.Iterable) and not isinstance(lst, str):
        flat = []
        for item in lst:
            if isinstance(item, collections.abc.Iterable) and not isinstance(item, str):
                flat.extend(item)
            else:
                flat.append(item)
        return flat
    return [lst]

def simple_detect_groups(df: pd.DataFrame, protected_attributes: List[str], group_mappings: Optional[Dict[str, Dict[str, str]]] = None):
    """Simplified group detection that uses explicit mappings or falls back to first two unique values."""
    try:
        # Only use the first protected attribute
        attr = protected_attributes[0]
        logger.info(f"Detecting groups for protected attribute: {attr}")
        
        if attr not in df.columns:
            detail_msg = f"Protected attribute '{attr}' not found in data columns: {list(df.columns)}"
            logger.error(detail_msg)
            raise HTTPException(
                status_code=400,
                detail=detail_msg
            )
        
        unique_values = df[attr].unique()
        logger.info(f"Unique values in {attr}: {unique_values}")
        
        # If explicit mappings are provided, use them
        if group_mappings and attr in group_mappings:
            mapping = group_mappings[attr]
            if 'privileged' in mapping and 'unprivileged' in mapping:
                privileged_values = mapping['privileged']
                unprivileged_values = mapping['unprivileged']
                
                # Convert to lists if they're not already
                if not isinstance(privileged_values, list):
                    privileged_values = [privileged_values]
                if not isinstance(unprivileged_values, list):
                    unprivileged_values = [unprivileged_values]
                
                logger.info(f"Using provided mappings - Privileged: {privileged_values}, Unprivileged: {unprivileged_values}")
                
                # Create the groups
                privileged_groups = [{attr: 1.0}]
                unprivileged_groups = [{attr: 0.0}]
                
                logger.info(f"Created groups - Privileged: {privileged_groups}, Unprivileged: {unprivileged_groups}")
                return privileged_groups, unprivileged_groups
            else:
                detail_msg = f"Invalid group mapping for {attr}. Must specify both 'privileged' and 'unprivileged' values."
                logger.error(detail_msg)
                raise HTTPException(
                    status_code=400,
                    detail=detail_msg
                )
        else:
            # Fallback: use first two unique values
            if len(unique_values) < 2:
                detail_msg = f"Not enough unique values for protected attribute '{attr}'. Found: {unique_values}"
                logger.error(detail_msg)
                raise HTTPException(
                    status_code=400,
                    detail=detail_msg
                )
            
            privileged_value = unique_values[0]
            unprivileged_value = unique_values[1]
            
            logger.info(f"Using fallback mapping - Privileged: {privileged_value}, Unprivileged: {unprivileged_value}")
            
            privileged_groups = [{attr: 1.0}]
            unprivileged_groups = [{attr: 0.0}]
            
            logger.info(f"Created groups - Privileged: {privileged_groups}, Unprivileged: {unprivileged_groups}")
            return privileged_groups, unprivileged_groups
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in simple group detection: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error detecting groups: {str(e)}")

def create_dataset(data: List[Dict[str, Any]], protected_attributes: List[str], privileged_groups=None, unprivileged_groups=None, group_mappings=None) -> BinaryLabelDataset:
    try:
        logger.info(f"Creating dataset with {len(data)} records and protected attributes: {protected_attributes}")
        logger.info(f"Group mappings provided: {group_mappings}")
        
        # Convert data to DataFrame
        try:
            df = pd.DataFrame(data)
            logger.info(f"DataFrame columns: {df.columns.tolist()}")
            logger.info(f"DataFrame dtypes:\n{df.dtypes}")
            logger.info(f"DataFrame head:\n{df.head()}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error converting data to DataFrame: {str(e)}")
        
        # Validate required columns
        if len(df.columns) < 2:
            raise HTTPException(status_code=400, detail="Dataset must contain at least two columns")
        
        # Detect label column
        try:
            label_col = find_label_column(df)
            logger.info(f"Detected label column: {label_col}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error detecting label column: {str(e)}")
        
        # Start data preprocessing
        try:
            logger.info("Starting data preprocessing...")
            df = preprocess_data(df, protected_attributes, group_mappings)
            logger.info("Data preprocessing completed")
            logger.info(f"DataFrame after preprocessing:\n{df}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error preprocessing data: {str(e)}")
        
        # Encode categorical columns
        try:
            logger.info("Starting categorical encoding...")
            df = encode_categoricals(df, exclude=protected_attributes + [label_col])
            logger.info("Categorical encoding completed")
            logger.info(f"DataFrame after encoding:\n{df}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error encoding categorical columns: {str(e)}")
        
        # Prepare features and labels
        try:
            features = df.drop(columns=[label_col])
            labels = df[label_col]
            logger.info(f"Features shape: {features.shape}, Labels shape: {labels.shape}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error preparing features and labels: {str(e)}")
        
        # Create BinaryLabelDataset
        logger.info("Creating BinaryLabelDataset...")
        logger.info(f"Protected attributes: {protected_attributes}")
        
        # Create privileged and unprivileged groups based on the binary values already set in preprocess_data
        privileged_protected_attributes = []
        unprivileged_protected_attributes = []
        
        for attr in protected_attributes:
            if attr in df.columns:
                try:
                    # Verify both values exist
                    unique_bin = set(df[attr].unique())
                    if 1.0 not in unique_bin or 0.0 not in unique_bin:
                        raise HTTPException(status_code=400, detail=f"After preprocessing, both privileged (1.0) and unprivileged (0.0) values must exist in '{attr}'. Found: {unique_bin}")
                    # Use lists of lists for AIF360
                    privileged_protected_attributes = [[1.0]]
                    unprivileged_protected_attributes = [[0.0]]
                    break  # Only use the first protected attribute
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Error processing protected attribute {attr}: {str(e)}")
        
        logger.info("Final DataFrame before dataset creation:")
        logger.info(f"{df}")
        
        # Create the dataset
        try:
            dataset = BinaryLabelDataset(
                df=df,
                label_names=[label_col],
                protected_attribute_names=protected_attributes,
                privileged_protected_attributes=privileged_protected_attributes,
                unprivileged_protected_attributes=unprivileged_protected_attributes
            )
            logger.info("Dataset created successfully")
            return dataset
        except Exception as e:
            logger.error(f"Error creating BinaryLabelDataset: {str(e)}", exc_info=True)
            raise HTTPException(status_code=400, detail=f"Error creating BinaryLabelDataset: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating dataset: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Unexpected error creating dataset: {str(e)}")

@app.post("/analyze", response_model=BiasAnalysisResponse)
async def analyze_bias(request: BiasAnalysisRequest):
    """Analyze bias in the provided dataset."""
    try:
        logger.info(f"Starting bias analysis request with {len(request.data)} records")
        logger.debug(f"Protected attributes: {request.protected_attributes}")
        logger.debug(f"Request data sample: {request.data[:2]}")
        
        if not request.data:
            logger.error("Empty dataset provided")
            raise HTTPException(status_code=400, detail="Empty dataset provided")
            
        if not request.protected_attributes:
            logger.error("No protected attributes specified")
            raise HTTPException(status_code=400, detail="No protected attributes specified")

        # Create dataset
        try:
            logger.info("Creating dataset...")
            dataset = create_dataset(
                request.data,
                request.protected_attributes,
                request.privileged_groups,
                request.unprivileged_groups,
                request.group_mappings
            )
            logger.info("Dataset created successfully")
        except Exception as e:
            logger.error(f"Error creating dataset: {str(e)}", exc_info=True)
            raise HTTPException(status_code=400, detail=f"Error creating dataset: {str(e)}")

        # Use provided groups or detect them for metrics
        try:
            if request.privileged_groups is None or request.unprivileged_groups is None:
                logger.info("Detecting groups for metrics calculation")
                df = pd.DataFrame(request.data)
                privileged_groups, unprivileged_groups = simple_detect_groups(df, request.protected_attributes, request.group_mappings)
                logger.debug(f"Detected privileged groups: {privileged_groups}")
                logger.debug(f"Detected unprivileged groups: {unprivileged_groups}")
            else:
                privileged_groups = request.privileged_groups
                unprivileged_groups = request.unprivileged_groups
        except Exception as e:
            logger.error(f"Error in group detection: {str(e)}", exc_info=True)
            raise HTTPException(status_code=400, detail=f"Error in group detection: {str(e)}")

        # Calculate metrics
        try:
            logger.info("Calculating bias metrics")
            metrics = calculate_bias_metrics(
                dataset,
                privileged_groups,
                unprivileged_groups
            )
            logger.debug(f"Calculated metrics: {metrics}")
        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error calculating metrics: {str(e)}")

        # Format results
        try:
            results = format_results_for_output(metrics)
            logger.info("Bias analysis completed successfully")
            return BiasAnalysisResponse(
                results=results,
                message="Bias analysis completed successfully"
            )
        except Exception as e:
            logger.error(f"Error formatting results: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error formatting results: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in bias analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Unexpected error in bias analysis: {str(e)}")

def run_bias_analysis(df, protected_attribute, group_mappings=None):
    """
    Helper to run bias analysis on a DataFrame, for file/folder endpoints.
    Returns a list of result dicts (or error dicts).
    """
    try:
        data = df.to_dict(orient="records")
        req = BiasAnalysisRequest(
            data=data,
            protected_attributes=[protected_attribute],
            group_mappings=group_mappings
        )
        # Call the main analysis logic (sync, since we're inside FastAPI already)
        # analyze_bias is async, so we need to run it in an event loop
        import asyncio
        loop = asyncio.get_event_loop() if asyncio.get_event_loop().is_running() else asyncio.new_event_loop()
        if loop.is_running():
            coro = analyze_bias(req)
            response = asyncio.ensure_future(coro)
            import time
            while not response.done():
                time.sleep(0.01)
            result = response.result()
        else:
            result = loop.run_until_complete(analyze_bias(req))
        # Return results as list of dicts
        return jsonable_encoder(result.results)
    except Exception as e:
        return [{"error": str(e)}]

@app.post("/analyze/file")
async def analyze_file(
    file: UploadFile = File(...),
    protected_attribute: str = "race",
    group_mappings: Optional[str] = None
):
    """Analyze bias in an uploaded file."""
    try:
        # Read file content
        content = await file.read()
        
        # Parse file based on extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext == ".csv":
            df = pd.read_csv(StringIO(content.decode()))
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(content)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
            
        # Parse group mappings if provided
        group_map = None
        if group_mappings:
            try:
                group_map = json.loads(group_mappings)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid group_mappings JSON format")
        
        # Run bias analysis
        results = run_bias_analysis(df, protected_attribute, group_map)
        
        # Convert results to CSV
        output = StringIO()
        pd.DataFrame(results).to_csv(output, index=False)
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=bias_analysis_results.csv"}
        )
        
    except Exception as e:
        logger.error(f"Error in analyze_file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/folder")
async def analyze_folder(
    file: UploadFile = File(...),
    protected_attribute: str = "race",
    group_mappings: Optional[str] = None
):
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are supported for folder upload.")
    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = os.path.join(tmpdir, "input.zip")
        with open(zip_path, "wb") as f:
            f.write(await file.read())
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)
        results = []
        for fname in os.listdir(tmpdir):
            if fname.endswith(".csv") or fname.endswith(".xlsx") or fname.endswith(".xls"):
                fpath = os.path.join(tmpdir, fname)
                if fname.endswith(".csv"):
                    df = pd.read_csv(fpath)
                else:
                    df = pd.read_excel(fpath)
                try:
                    group_map = eval(group_mappings) if group_mappings else None
                    file_results = run_bias_analysis(df, protected_attribute, group_map)
                    for r in file_results:
                        r["file"] = fname
                    results.extend(file_results)
                except Exception as e:
                    results.append({"file": fname, "error": str(e)})
    output = io.StringIO()
    pd.DataFrame(results).to_csv(output, index=False)
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=results.csv"})

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    logger.info("Starting Bias Analysis Service")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001) 