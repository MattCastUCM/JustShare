from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_similarity_api():
    payload = {
        "corpus": [
            "Me gusta aprender cosas nuevas todos los días.",
            "La inteligencia artificial está cambiando el mundo.",
            "El clima hoy es soleado y agradable."
        ],
        "text": "Me encanta estudiar temas diferentes cada día.",
        "method": "siamese_lstm",
        "language": "es",
        "top_k": 2
    }

    with client:
        response = client.post("/inference/similarity", json=payload)
        print("Status code:", response.status_code)
        print("Response body:", response.text)
        assert response.status_code == 200
        data = response.json()
        assert "matches" in data
        assert len(data["matches"]) == 2
        print(data)

if __name__ == "__main__":
    test_similarity_api()

