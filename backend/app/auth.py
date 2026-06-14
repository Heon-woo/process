from dataclasses import dataclass

from fastapi import Header


DEMO_USER = {
    "name": "김하늘",
    "team": "품질혁신",
    "role": "SYSTEM_ADMIN",
    "managed_scopes": ["DRAM/1a", "DRAM/1b", "NAND/V8", "NAND/V9"],
}


@dataclass(frozen=True)
class UserContext:
    name: str
    team: str
    role: str
    managed_scopes: tuple[str, ...]


def get_demo_user_context(
    x_user_name: str = Header(default=DEMO_USER["name"]),
    x_user_team: str = Header(default=DEMO_USER["team"]),
    x_user_role: str = Header(default=DEMO_USER["role"]),
    x_user_scopes: str = Header(default=""),
) -> UserContext:
    """Build a prototype user context. Replace this dependency with corporate SSO."""
    scopes = tuple(scope.strip() for scope in x_user_scopes.split(",") if scope.strip())
    return UserContext(
        name=x_user_name,
        team=x_user_team,
        role=x_user_role.upper(),
        managed_scopes=scopes,
    )
