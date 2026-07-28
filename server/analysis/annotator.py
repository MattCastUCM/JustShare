import pandas as pd
import streamlit as st
import json
import os

metadata_path = os.path.join("../adaptation", "data", "metadata.json")

@st.cache_data
def load_node_choices():
    with open(metadata_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    node_choices = {}
    for item in config.values():
        filename = os.path.basename(item["file"])
        scene = os.path.splitext(filename)[0]
        scene = scene[:1].upper() + scene[1:]

        part = item["object"].split(".")[0]

        node = f"{scene}.{part}"

        choices = item["choices"]

        if isinstance(choices, dict):
            node_choices[node] = list(choices.keys())
        else:
            node_choices[node] = [choices]

    return node_choices

node_choices = load_node_choices()

input_path = "./failed_cases.csv"
output_path = "./annotations.csv"

df = pd.read_csv(input_path)

if os.path.exists(output_path):
    annotations = pd.read_csv(output_path)
else:
    annotations = pd.DataFrame(columns=[
        "node",
        "method",
        "predicted_intent",
        "response",
        "valid",
        "annotated_intent",
        "has_multiple_intents"
    ])

index = len(annotations)

if index >= len(df):
    st.success("Finished")
    st.stop()

case = df.iloc[index]

st.title(f"Case {index + 1}/{len(df)}")

# Información general
col1, col2 = st.columns([2, 1])

with col1:
    st.markdown("#### Node")
    st.code(case["node"], language=None)

with col2:
    st.markdown("#### Method")
    st.write(case["method"])

    st.markdown("#### Predicted intent")
    st.success(case["branch"])

st.markdown("#### Context")
st.info(case["context"])

# Comparación de respuestas
col1, col2 = st.columns(2)

with col1:
    st.markdown("#### User response")
    st.info(case["response"])

with col2:
    st.markdown("#### Matched example")
    st.warning(case["matching_text"])

# Métricas
col1, col2 = st.columns(2)

with col1:
    st.metric(
        "Score",
        f"{case['score']:.3f}"
    )

with col2:
    st.metric(
        "Threshold",
        f"{case['threshold']:.3f}"
    )

valid = st.radio(
    "Clasificación de la respuesta",
    [
        "existing_intent",
        "new_intent",
        "invalid",
        "unclear"
    ],
    format_func=lambda x: {
        "existing_intent": "Coincide con un intent existente",
        "new_intent": "Respuesta plausible (nuevo intent)",
        "invalid": "Respuesta no apropiada",
        "unclear": "Dudosa"
    }[x]
)

intent = ""
has_multiple_intents = False

if valid == "existing_intent":
    available_intents = node_choices[case["node"]]

    has_multiple_intents = len(available_intents) > 1

    if has_multiple_intents:
        default_index = 0

        if case["branch"] in available_intents:
            default_index = available_intents.index(case["branch"])

        intent = st.selectbox(
            "Intent correcto",
            available_intents,
            index=default_index
        )
    else:
        intent = available_intents[0]

if st.button("Guardar"):
    new_row = pd.DataFrame([{
        "node": case["node"],
        "method": case["method"],
        "predicted_intent": case["branch"],
        "response": case["response"],
        "valid": valid,
        "annotated_intent": intent,
        "has_multiple_intents": has_multiple_intents
    }])

    annotations = pd.concat(
        [annotations, new_row],
        ignore_index=True
    )

    annotations.to_csv(
        output_path,
        index=False
    )

    st.rerun()
