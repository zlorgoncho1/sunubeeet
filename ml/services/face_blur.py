"""Détection de visages + flou ciblé via OpenCV.

Détecteur : Haar cascade frontal-face (livré avec opencv-python, aucune
dépendance réseau). Suffisant pour V1. À upgrader vers OpenCV DNN
res10_300x300_ssd ou MediaPipe pour de meilleurs profils latéraux.

Flou : combinaison Gaussian (50, 50) + pixelisation 16×16 → irréversible
en pratique. Appliqué uniquement sur les bounding-boxes détectées : le
reste de la scène (incident) reste lisible pour le coordinateur.
"""

import logging
from io import BytesIO
from typing import List, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)

_cascade = None


def get_cascade():
    global _cascade
    if _cascade is None:
        path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        cascade = cv2.CascadeClassifier(path)
        if cascade.empty():
            raise RuntimeError(f"failed to load cascade: {path}")
        _cascade = cascade
    return _cascade


def _decode(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("invalid image bytes")
    return img


def _encode_jpeg(img: np.ndarray, quality: int = 85) -> bytes:
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("jpeg encode failed")
    return buf.tobytes()


def _blur_region(img: np.ndarray, x: int, y: int, w: int, h: int) -> None:
    pad = max(4, int(0.15 * max(w, h)))
    x0 = max(0, x - pad)
    y0 = max(0, y - pad)
    x1 = min(img.shape[1], x + w + pad)
    y1 = min(img.shape[0], y + h + pad)
    roi = img[y0:y1, x0:x1]
    if roi.size == 0:
        return

    # Pixelisation : downsample puis upsample pour casser l'info haute fréquence.
    small = cv2.resize(roi, (16, 16), interpolation=cv2.INTER_LINEAR)
    pixelated = cv2.resize(small, (roi.shape[1], roi.shape[0]), interpolation=cv2.INTER_NEAREST)
    # Gaussian par-dessus pour lisser les bords de pixelisation.
    blurred = cv2.GaussianBlur(pixelated, (51, 51), 0)
    img[y0:y1, x0:x1] = blurred


def detect_and_blur(image_bytes: bytes) -> Tuple[bytes, List[dict], int, int]:
    """Renvoie (jpeg_bytes_floutés, boxes, width, height)."""
    img = _decode(image_bytes)
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade = get_cascade()
    faces = cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5,
        minSize=(max(20, w // 40), max(20, h // 40)),
    )
    boxes: List[dict] = []
    for (fx, fy, fw, fh) in faces:
        _blur_region(img, int(fx), int(fy), int(fw), int(fh))
        boxes.append({"x": int(fx), "y": int(fy), "w": int(fw), "h": int(fh)})

    # Filet de sécurité : si aucun visage détecté mais image non triviale,
    # on n'altère pas l'image — le coordinateur voit un original. Le job
    # Laravel décidera de la politique (servir uniquement la version "auditée").
    return _encode_jpeg(img), boxes, w, h
