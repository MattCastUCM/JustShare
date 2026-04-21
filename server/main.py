from contextlib import asynccontextmanager
from fastapi import FastAPI
from routers.inference import router
from core.settings import get_settings
from fastapi.middleware.cors import CORSMiddleware
from utils.misc import build_similarity_engine
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
	base_dir = "./faiss_data"
	similarity_engine = build_similarity_engine(base_dir)
	yield {
		"similarity_engine": similarity_engine
	}

settings = get_settings()

app = FastAPI(title="Inference Server", lifespan=lifespan)

app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.allow_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
	uvicorn.run(
		"main:app",
		host=settings.host,
		port=settings.port,
		# reload=True
	)
