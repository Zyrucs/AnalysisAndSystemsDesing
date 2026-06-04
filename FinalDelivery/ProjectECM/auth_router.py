from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.UserOut, status_code=201)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        full_name           = user_in.full_name,
        email               = user_in.email,
        hashed_password     = auth.hash_password(user_in.password),
        role                = user_in.role,
        vulnerability_index = user_in.vulnerability_index,
        academic_load       = user_in.academic_load,
        compliance_history  = user_in.compliance_history,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    auth.log_action(db, user.id, "REGISTER", "User", user.id)
    return user


@router.post("/login", response_model=schemas.Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not auth.verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    token = auth.create_access_token({"sub": str(user.id), "role": user.role.value})
    auth.log_action(db, user.id, "LOGIN", "User", user.id)
    return {"access_token": token, "token_type": "bearer", "role": user.role}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
