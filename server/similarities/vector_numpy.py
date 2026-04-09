import numpy.typing as npt
import numpy as np
from typing import Optional

def _prepare_vectors(X: npt.ArrayLike, Y: Optional[npt.ArrayLike] = None) -> tuple[np.ndarray, np.ndarray]:
    """
    Convert inputs to 2D float arrays and validate dimensions.

    Parameters
    ----------
    X : array-like of shape (n_samples_X, n_features)
    Y : array-like of shape (n_samples_Y, n_features), optional (default=None)

    Returns
    -------
    X_prepared, Y_prepared : tuple of ndarray
        Prepared 2D arrays ready for pairwise operations.
    """
    X = np.asarray(X, dtype=float)
    if Y is None:
        Y = X
    else:
        Y = np.asarray(Y, dtype=float)

    if X.ndim == 1:
        X = X.reshape(1, -1)
    if Y.ndim == 1:
        Y = Y.reshape(1, -1)

    if X.shape[1] != Y.shape[1]:
        raise ValueError("X and Y must have the same number of features.")

    return X, Y

def l2_normalize(X: npt.ArrayLike) -> np.ndarray:
    """
    Row-wise L2 normalization.

    Parameters
    ----------
    X : array-like of shape (n_samples, n_features)

    Returns
    -------
    X_normalized : ndarray of shape (n_samples, n_features)
    """
    X, _ = _prepare_vectors(X)

    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms = np.maximum(norms, 1e-12)

    return X / norms

def cosine_similarity(X: npt.ArrayLike, Y: npt.ArrayLike | None = None) -> np.ndarray:
    """
    Compute the cosine similarity between rows of X and Y.

        similarity = <X, Y> / (||X|| * ||Y||)

    Parameters
    ----------
    X : array-like of shape (n_samples_X, n_features)
        Input data.

    Y : array-like of shape (n_samples_Y, n_features), optional (default=None)
        Input data. If None, the pairwise similarities between all samples in X are computed.

    Returns
    -------
    similarities: ndarray of shape (n_samples_X, n_samples_Y)
        Cosine similarity matrix.

    Examples
    --------
    >>> X = [[0, 0, 0], [1, 1, 1]]
    >>> Y = [[1, 0, 0], [1, 1, 0]]
    >>> cosine_similarity(X, Y)
    array([[0.   , 0.   ],
           [0.577, 0.816]])
    """
    
    X, Y = _prepare_vectors(X, Y)

    X_normalized = l2_normalize(X)
    Y_normalized = l2_normalize(Y)

    return X_normalized @ Y_normalized.T
 
def euclidean_similarity(X: npt.ArrayLike, Y: npt.ArrayLike | None = None):
    """
    Similarity based on Euclidean (L2) distance.

    similarity = 1 / (1 + ||X - Y||₂)

    Returns
    -------
    similarities: ndarray of shape (n_samples_X, n_samples_Y)
        Euclidean similarity matrix.
    """
    X, Y = _prepare_vectors(X, Y)

    distances = np.linalg.norm(X[:, None, :] - Y[None, :, :], axis=2)
    return 1.0 / (1.0 + distances)

def manhattan_similarity(X: npt.ArrayLike, Y: npt.ArrayLike | None = None):
    """
    Similarity based on Manhattan (L1) distance.

    similarity = 1 / (1 + ||X - Y||₁)

    Returns
    -------
    similarities: ndarray of shape (n_samples_X, n_samples_Y)
        Manhattan similarity matrix.
    """
    X, Y = _prepare_vectors(X, Y)

    distances = np.linalg.norm(X[:, None, :] - Y[None, :, :], axis=2, ord=1)
    return 1.0 / (1.0 + distances)