"""LLM generation service for grounded RAG answers using OpenAI GPT-4o."""

import logging
from typing import Dict, List, Optional
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam

from app.core.config import settings
from app.services.retrieval import RetrievedChunk

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an AI support assistant for a business.
Answer the user's question using ONLY the provided context information.
If the answer cannot be found or deduced from the provided context, politely say:
"I am sorry, but I do not have enough information in my knowledge base to answer that question."
Do not speculate, make up facts, or use outside knowledge. Keep your answers direct, helpful, and concise."""

NO_CONTEXT_FALLBACK = "I am sorry, but I do not have enough information in my knowledge base to answer that question."


def _build_context_block(chunks: List[RetrievedChunk]) -> str:
    """Format retrieved chunks into a numbered context block."""
    if not chunks:
        return "No relevant context found in the knowledge base."
    parts = []
    for idx, chunk in enumerate(chunks, 1):
        clean_text = chunk.text.strip()
        parts.append(f"[Source {idx}]:\n{clean_text}")
    return "\n\n".join(parts)


def _generate_mock_rag_answer(query: str, chunks: List[RetrievedChunk]) -> str:
    """
    Generate a deterministic answer for tests and local dev when OPENAI_API_KEY is not set.
    """
    if not chunks:
        return NO_CONTEXT_FALLBACK

    # Concatenate the first relevant snippet from top chunks
    top_texts = [c.text.strip() for c in chunks if c.text.strip()][:2]
    if not top_texts:
        return NO_CONTEXT_FALLBACK

    combined_snippet = " ".join(top_texts)
    # Truncate to reasonable sentence length
    if len(combined_snippet) > 280:
        combined_snippet = combined_snippet[:280].rsplit(" ", 1)[0] + "."

    return f"Based on your knowledge base: {combined_snippet}"


async def generate_rag_answer(
    query: str,
    context_chunks: List[RetrievedChunk],
    history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """
    Generate an answer grounded strictly in the retrieved context chunks.
    Uses OpenAI GPT-4o if a valid API key is present; otherwise falls back to mock generator.
    """
    clean_query = query.strip()
    if not clean_query:
        return "Please ask a question."

    has_real_key = bool(
        settings.OPENAI_API_KEY
        and settings.OPENAI_API_KEY != "sk-replace-me"
        and not settings.OPENAI_API_KEY.startswith("sk-dummy")
    )

    if not has_real_key:
        logger.warning("OPENAI_API_KEY not configured. Using deterministic mock RAG response.")
        return _generate_mock_rag_answer(clean_query, context_chunks)

    # Build prompt messages
    context_block = _build_context_block(context_chunks)
    messages: List[ChatCompletionMessageParam] = [
        {"role": "system", "content": SYSTEM_PROMPT},
    ]

    # Append recent conversation history (up to last 6 messages)
    if history:
        for msg in history[-6:]:
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "user" and content.strip():
                messages.append({"role": "user", "content": content.strip()})
            elif role == "assistant" and content.strip():
                messages.append({"role": "assistant", "content": content.strip()})

    # Append current user question with retrieved context
    user_prompt = f"Context:\n{context_block}\n\nQuestion: {clean_query}\n\nAnswer:"
    messages.append({"role": "user", "content": user_prompt})

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model=settings.CHAT_MODEL,
            messages=messages,
            temperature=0.2,
            max_tokens=600,
        )
        answer = response.choices[0].message.content or ""
        return answer.strip()
    except Exception as exc:
        logger.error("OpenAI chat completion failed: %s. Falling back to mock generator.", exc)
        return _generate_mock_rag_answer(clean_query, context_chunks)
