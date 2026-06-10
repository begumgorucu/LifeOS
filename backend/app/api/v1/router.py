"""Aggregates every v1 sub-router under a single APIRouter."""

from fastapi import APIRouter

from app.api.v1 import (
    achievements,
    areas,
    daily_pool,
    notifications,
    projects,
    stats,
    tasks,
    users,
    visions,
)

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(areas.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(visions.router)
api_router.include_router(daily_pool.router)
api_router.include_router(stats.router)
api_router.include_router(achievements.router)
api_router.include_router(notifications.router)
