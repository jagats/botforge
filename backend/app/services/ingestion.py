"""Ingestion service for extracting text from PDFs, URLs, and FAQs, and segmenting into chunks."""

import re
import logging
from typing import List, Tuple, Optional
import httpx
from bs4 import BeautifulSoup
from pypdf import PdfReader

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using pypdf."""
    reader = PdfReader(file_path)
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
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ValueError(f"Failed to fetch content from URL {url}: {exc}")

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
