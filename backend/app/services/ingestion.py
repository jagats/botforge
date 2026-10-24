"""Ingestion service for extracting text from PDFs, URLs, and FAQs, and segmenting into chunks."""

import ipaddress
import re
import logging
import socket
from typing import List, Tuple, Optional
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup
from pypdf import PdfReader

from app.core.config import settings

logger = logging.getLogger(__name__)

# Hostnames that must never be fetched (internal service names / loopback).
_BLOCKED_HOSTNAMES = {"localhost", "postgres", "qdrant", "backend", "redis"}
_MAX_REDIRECTS = 3


def _assert_public_url(url: str) -> None:
    """Reject URLs that could reach internal infrastructure (SSRF guard, finding C-01).

    Validates the scheme, blocks internal service names, and resolves the host
    to ensure every resolved IP is a public address.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only http and https URLs can be ingested.")

    host = (parsed.hostname or "").lower().strip()
    if not host:
        raise ValueError("URL has no host.")
    if host in _BLOCKED_HOSTNAMES:
        raise ValueError("This URL points to an internal host and cannot be ingested.")

    # Resolve every address the host maps to and reject non-public ranges.
    try:
        addrinfos = socket.getaddrinfo(host, parsed.port or (443 if parsed.scheme == "https" else 80))
    except socket.gaierror as exc:
        raise ValueError(f"Could not resolve host for URL: {host}") from exc

    for family, _type, _proto, _canon, sockaddr in addrinfos:
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            raise ValueError("URL resolved to an invalid address.")
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            raise ValueError("This URL resolves to a non-public address and cannot be ingested.")


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using pypdf."""
    reader = PdfReader(file_path)

    # Guard against decompression-bomb PDFs with an excessive page count (finding M-06).
    if len(reader.pages) > settings.MAX_PDF_PAGES:
        raise ValueError(
            f"PDF has too many pages (limit {settings.MAX_PDF_PAGES}). Please split it and re-upload."
        )

    extracted_pages: List[str] = []

    for idx, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text and page_text.strip():
            extracted_pages.append(page_text.strip())

    full_text = "\n\n".join(extracted_pages).strip()
    if not full_text:
        raise ValueError(
            "Could not extract readable text from the uploaded PDF. "
            "Please ensure the PDF contains searchable text and is not an image-only scan."
        )
    return full_text


async def extract_text_from_url(url: str) -> Tuple[str, str]:
    """
    Fetch a web page, strip non-content elements, and return (page_title, clean_text).
    """
    headers = {
        "User-Agent": "BotForge-Crawler/1.0 (+https://botforge.ai; Bot Knowledge Extractor)"
    }

    # Follow redirects manually so every hop is re-validated against the SSRF guard.
    current_url = url
    response: Optional[httpx.Response] = None
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
        for _ in range(_MAX_REDIRECTS + 1):
            _assert_public_url(current_url)
            try:
                resp = await client.get(current_url, headers=headers)
            except httpx.HTTPError as exc:
                # Generic message only — do not echo internal errors back to the user.
                raise ValueError("Failed to fetch content from the provided URL.") from exc

            if resp.is_redirect:
                location = resp.headers.get("location")
                if not location:
                    raise ValueError("Failed to fetch content from the provided URL.")
                current_url = str(resp.url.join(location))
                continue

            # Cap the body size to guard against huge/zip-bomb responses.
            body = b""
            max_bytes = settings.MAX_FETCH_BYTES
            async for part in resp.aiter_bytes():
                body += part
                if len(body) > max_bytes:
                    await resp.aclose()
                    raise ValueError("The provided webpage is too large to ingest.")
            resp._content = body  # finalize so resp.text works
            if resp.status_code >= 400:
                raise ValueError("Failed to fetch content from the provided URL.")
            response = resp
            break
        else:
            raise ValueError("Too many redirects while fetching the URL.")

    if response is None:
        raise ValueError("Failed to fetch content from the provided URL.")

    soup = BeautifulSoup(response.text, "html.parser")

    # Extract page title
    page_title = soup.title.string.strip() if soup.title and soup.title.string else url

    # Remove non-content tags
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe", "button"]):
        tag.decompose()

    # Extract text from remaining elements
    body_text = soup.get_text(separator="\n")
    # Clean up whitespace and consecutive newlines
    lines = [line.strip() for line in body_text.splitlines() if line.strip()]
    clean_text = "\n".join(lines)

    if not clean_text or len(clean_text) < 20:
        raise ValueError("The provided webpage contains insufficient text content to ingest.")

    return page_title, clean_text


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200) -> List[str]:
    """
    Split long text into semantic chunks with a sliding overlap.
    Aims for ~300-400 tokens per chunk while respecting sentence or paragraph boundaries.
    """
    # Normalize excessive newlines
    normalized_text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not normalized_text:
        return []

    # If text is already shorter than chunk_size, return as single chunk
    if len(normalized_text) <= chunk_size:
        return [normalized_text]

    chunks: List[str] = []
    start = 0
    text_len = len(normalized_text)

    while start < text_len:
        end = start + chunk_size

        if end >= text_len:
            chunk = normalized_text[start:].strip()
            if chunk:
                chunks.append(chunk)
            break

        # Look for sentence end punctuation (. ! ? or newline) near the end to split cleanly
        split_pos = -1
        # Search backwards within a 200 character window
        window = normalized_text[start:end]
        for boundary in ["\n\n", "\n", ". ", "! ", "? "]:
            found = window.rfind(boundary)
            if found > chunk_size * 0.6:  # only split if past 60% of the chunk
                split_pos = start + found + len(boundary)
                break

        if split_pos != -1:
            chunk = normalized_text[start:split_pos].strip()
            start = split_pos - overlap
        else:
            # Fallback to splitting at whitespace
            space_pos = normalized_text.rfind(" ", start, end)
            if space_pos != -1 and space_pos > start + (chunk_size * 0.5):
                chunk = normalized_text[start:space_pos].strip()
                start = space_pos - overlap
            else:
                chunk = normalized_text[start:end].strip()
                start = end - overlap

        if chunk:
            chunks.append(chunk)

    return chunks
