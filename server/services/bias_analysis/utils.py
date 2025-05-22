import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from aif360.datasets import BinaryLabelDataset
from aif360.metrics import BinaryLabelDatasetMetric
from sklearn.preprocessing import LabelEncoder
import csv
import io

def preprocess_data(df: pd.DataFrame, categorical_columns: List[str] = None) -> pd.DataFrame:
    """
    Preprocess the input data for bias analysis
    """
    df = df.copy()
    
    # Handle categorical columns
    if categorical_columns:
        for col in categorical_columns:
            if col in df.columns:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
    
    # Handle missing values
    df = df.fillna(df.mean() if df.dtypes.any() == 'float64' else df.mode().iloc[0])
    
    return df

def calculate_bias_metrics(
    dataset: BinaryLabelDataset,
    privileged_groups: List[Dict[str, Any]],
    unprivileged_groups: List[Dict[str, Any]]
) -> Dict[str, float]:
    """
    Calculate various bias metrics using AIF360
    """
    metric = BinaryLabelDatasetMetric(
        dataset,
        privileged_groups=privileged_groups,
        unprivileged_groups=unprivileged_groups
    )
    
    return {
        "statistical_disparity": float(metric.statistical_disparity_difference()),
        "disparate_impact": float(metric.disparate_impact()),
        "equal_opportunity_difference": float(metric.equal_opportunity_difference()),
        "average_odds_difference": float(metric.average_odds_difference()),
        "theil_index": float(metric.theil_index()),
        "privileged_positive_rate": float(metric.privileged_positive_rate()),
        "unprivileged_positive_rate": float(metric.unprivileged_positive_rate())
    }

def determine_metric_status(metric_value: float, metric_name: str) -> Tuple[str, float]:
    """
    Determine if a metric passes or fails based on predefined thresholds
    """
    thresholds = {
        "statistical_disparity": 0.1,
        "disparate_impact": 0.8,
        "equal_opportunity_difference": 0.1,
        "average_odds_difference": 0.1
    }
    
    threshold = thresholds.get(metric_name, 0.1)
    
    if metric_name == "disparate_impact":
        status = "pass" if 0.8 <= metric_value <= 1.2 else "fail"
    else:
        status = "pass" if abs(metric_value) < threshold else "fail"
    
    return status, threshold

def format_results_for_output(metrics: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    Format the bias metrics results for API output
    """
    results = []
    
    for metric_name, value in metrics.items():
        status, threshold = determine_metric_status(value, metric_name)
        
        result = {
            "metric_name": metric_name.replace("_", " ").title(),
            "score": value,
            "threshold": threshold,
            "status": status,
            "additional_data": {
                "raw_value": value,
                "threshold": threshold
            }
        }
        
        results.append(result)
    
    return results

def results_to_csv(results: List[Dict[str, Any]]) -> bytes:
    """
    Convert a list of result dicts to CSV bytes
    """
    if not results:
        return b""
    output = io.StringIO()
    fieldnames = list(results[0].keys())
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in results:
        writer.writerow(row)
    return output.getvalue().encode("utf-8") 