"""
app.py — Pure RAG Streamlit chatbot UI for PR Decorations.

This application relies solely on local semantic search (retrieval)
to find relevant information in the PR Decorations knowledge base.
It does NOT use any external LLM for text generation.
"""

import streamlit as st
from rag.vectorstore import build_vectorstore, get_collection
from rag.retriever import retrieve

# ------------------------------------------------------------------
# Page Configuration
# ------------------------------------------------------------------
st.set_page_config(
    page_title="PR Decorations — AI Assistant",
    page_icon="🎊",
    layout="centered",
)

# ------------------------------------------------------------------
# Custom CSS for a clean, professional look
# ------------------------------------------------------------------
st.markdown("""
<style>
    /* Main background */
    .stApp {
        background: linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%);
    }

    /* Header styling */
    .main-header {
        text-align: center;
        padding: 1.5rem 0;
        margin-bottom: 1rem;
    }
    .main-header h1 {
        background: linear-gradient(135deg, #f5af19, #f12711);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 0.3rem;
    }
    .main-header p {
        color: #a0a0b0;
        font-size: 1rem;
    }

    /* Chat message containers */
    .stChatMessage {
        border-radius: 12px !important;
        margin-bottom: 0.5rem !important;
    }

    /* Source text styling inside expander */
    .source-text {
        font-size: 0.9rem;
        color: #dcdcdc;
        white-space: pre-wrap;
    }

    /* Status indicator */
    .status-bar {
        text-align: center;
        padding: 0.5rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
    }
    .status-ready {
        background: rgba(46, 213, 115, 0.1);
        color: #2ed573;
        border: 1px solid rgba(46, 213, 115, 0.2);
    }
    .status-building {
        background: rgba(245, 175, 25, 0.1);
        color: #f5af19;
        border: 1px solid rgba(245, 175, 25, 0.2);
    }
</style>
""", unsafe_allow_html=True)

# ------------------------------------------------------------------
# Header
# ------------------------------------------------------------------
st.markdown("""
<div class="main-header">
    <h1>🎊 PR Decorations</h1>
    <p>AI-powered assistant — Ask about services, pricing, packages & more</p>
</div>
""", unsafe_allow_html=True)

# ------------------------------------------------------------------
# Initialize session state
# ------------------------------------------------------------------
if "messages" not in st.session_state:
    st.session_state.messages = []

if "vectorstore_ready" not in st.session_state:
    st.session_state.vectorstore_ready = False

# ------------------------------------------------------------------
# Build vector store on first run (or if it doesn't exist)
# ------------------------------------------------------------------
if not st.session_state.vectorstore_ready:
    collection = get_collection()
    if collection and collection.count() > 0:
        st.session_state.vectorstore_ready = True
        st.markdown(
            '<div class="status-bar status-ready">'
            f"Knowledge base loaded — {collection.count()} chunks ready"
            "</div>",
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            '<div class="status-bar status-building">'
            "Building knowledge base for the first time..."
            "</div>",
            unsafe_allow_html=True,
        )
        with st.spinner("Loading PR Decorations data and creating embeddings..."):
            try:
                build_vectorstore()
                st.session_state.vectorstore_ready = True
                st.rerun()
            except Exception as e:
                st.error(f"Failed to build knowledge base: {e}")
                st.stop()
else:
    collection = get_collection()
    if collection:
        st.markdown(
            '<div class="status-bar status-ready">'
            f"Knowledge base ready — {collection.count()} chunks indexed"
            "</div>",
            unsafe_allow_html=True,
        )

# ------------------------------------------------------------------
# Display chat history
# ------------------------------------------------------------------
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        if message["role"] == "user":
            st.markdown(message["content"])
        else:
            # Assistant messages contain the raw chunk text
            if "fallback" in message and message["fallback"]:
                st.markdown(message["content"])
            else:
                st.markdown("Here is the relevant information I found:")
                for chunk in message["chunks"]:
                    with st.expander(f"Source: {chunk['source']}"):
                        st.markdown(f'<div class="source-text">{chunk["text"]}</div>', unsafe_allow_html=True)

# ------------------------------------------------------------------
# Chat input
# ------------------------------------------------------------------
if user_input := st.chat_input("Ask about PR Decorations services, pricing, or packages..."):

    # Display user message
    with st.chat_message("user"):
        st.markdown(user_input)

    # Save user message to history
    st.session_state.messages.append(
        {"role": "user", "content": user_input}
    )

    # Retrieve matching chunks
    with st.chat_message("assistant"):
        with st.spinner("Searching..."):
            chunks = retrieve(user_input)

            if not chunks:
                # IMPORTANT: Fallback for unknown questions
                fallback_msg = (
                    "I don't know based on the information currently available. "
                    "Please contact PR Decorations directly."
                )
                st.markdown(fallback_msg)
                
                # Save assistant fallback message to history
                st.session_state.messages.append({
                    "role": "assistant", 
                    "content": fallback_msg, 
                    "fallback": True,
                    "chunks": []
                })
            else:
                st.markdown("Here is the relevant information I found:")
                for chunk in chunks:
                    with st.expander(f"Source: {chunk['source']}"):
                        st.markdown(f'<div class="source-text">{chunk["text"]}</div>', unsafe_allow_html=True)
                
                # Save assistant chunks to history
                st.session_state.messages.append({
                    "role": "assistant", 
                    "content": "", 
                    "fallback": False,
                    "chunks": chunks
                })

# ------------------------------------------------------------------
# Sidebar with info
# ------------------------------------------------------------------
with st.sidebar:
    st.markdown("### PR Decorations")
    st.markdown("**Event Decoration Services**")
    st.markdown("---")
    st.markdown("**Services available:**")
    st.markdown("""
    - Marriage
    - Birthday
    - Engagement
    - Home Decoration
    - Naming Ceremony
    - Sreemantham
    - Car Decoration
    - Temple Decoration
    - Festival Decoration
    - New Year Decoration
    """)
    st.markdown("---")
    st.markdown("**Sample questions:**")
    st.markdown("""
    - What is the starting price for birthday decoration?
    - How much advance payment is required?
    - How much does marriage decoration cost?
    - What is included in the marriage package?
    - Do you provide photography?
    - What payment methods does PR Decorations accept?
    - Does PR Decorations offer discounts?
    - What is the drone photography price?
    - How much does LED wall decoration cost?
    """)
    st.markdown("---")

    # Rebuild button
    if st.button("Rebuild Knowledge Base"):
        with st.spinner("Rebuilding..."):
            try:
                build_vectorstore()
                st.session_state.vectorstore_ready = True
                st.success("Knowledge base rebuilt!")
                st.rerun()
            except Exception as e:
                st.error(f"Rebuild failed: {e}")

    st.markdown("---")
    st.caption("Built for X-Factor LevelX Phase 2 Hackathon")
